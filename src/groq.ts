import { createAgent, createMiddleware, dynamicSystemPromptMiddleware, initChatModel, tool, type ToolRuntime, summarizationMiddleware, humanInTheLoopMiddleware } from "langchain";
import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import * as z from "zod";
import { Groq } from "groq-sdk";

const apiKeyGroq = process.env.GROQ_API_KEY!;
const apiKeyGemini = process.env.GEMINA_API_KEY!;
import { Command } from "@langchain/langgraph";
import fs from "fs"

export const geminiAI = new ChatGoogleGenerativeAI({
  apiKey: apiKeyGemini,
  model: "gemini-2.5-flash-lite",
  maxOutputTokens: 2000,
});

export const groq = new ChatGroq({
  model: "openai/gpt-oss-20b",
  apiKey: apiKeyGroq,
  maxTokens: 4000
});

export const groqLive = new ChatGroq({
  model: "groq/compound",
  apiKey: apiKeyGroq,
  maxTokens: 4000
});


// constextSchema
const contextSchema = z.object({
  userRole: z.enum(["expert", "beginner"]),
  password: z.string().describe("password is correct by default")
})

const detailedResponse = z.object({
  answer: z.string().describe("A detailed answer"),
  reasoning: z.string().describe("Explanation of reasoning"),
  confidence: z.number().describe("Confidence score 0-1"),
});

let dynamicSelecitionModelRun = 0;
// if want to dynamic selection of model, like if there is image url link then using gemimiAI model for 
const dynamicSelecitionModel = createMiddleware({
  name: "DynamicModelSelection",
  contextSchema: contextSchema,
  wrapModelCall: (request, handler) => {
    const messageCount = request.messages[0]?.content?.length ?? 0;

    // console.log(`Message Length :-- `, request.messages.length, "\n", "message:-- ", request.messages);
    dynamicSelecitionModelRun++
    console.log(`Run How many Times dynamicSelecitionModel:- `, dynamicSelecitionModelRun);

    let model = messageCount > 10 ?  groq : geminiAI;


    // console.log(model.model);

    let tools: any[] = [...request.tools]

    if (model.model.includes("gemini")) {      
      tools = [{ urlContext: {} }, { googleSearch: {} }, { codeExecution: {} }, ...tools]
    }

    // for (const message of request.messages) {
    //   if (message.content === "groq/compound") {
    //     model = groqLive,
    //       tools = []
    //   }
    // }

    // console.log(`StoreObject :-- `,tools);
    // console.log(`Tools:-- `, tools);


    // console.log(`Returning Data from WrapModeCall :-- `, { ...request, model, tools, detailedResponse });
    const req = { ...request, model, tools, detailedResponse }
    return handler({
      ...req
    })
  },
});


let dynamicSystemPromptRun = 0;
const dynamicSystemPrompt = dynamicSystemPromptMiddleware<z.infer<typeof contextSchema>>((state, runtime) => {
  // console.log("state:-- ",state, "\n\n", "runtime:-- ",runtime);
  dynamicSystemPromptRun++
  console.log(`Run How many Times dynamicSystemPromptRun:- `, dynamicSystemPromptRun);

  const userRole = runtime.context.userRole || "user";
  const basePrompt = "You are a helpful assistant.";

  if (userRole === "expert") {
    return `${basePrompt} Provide detailed technical responses.`;
  } else if (userRole === "beginner") {
    return `${basePrompt} Explain concepts simply and avoid jargon.`;
  }
  return basePrompt
});

let authenticateUserRun = 0;
const authenticateUser = tool(
  async ({ password }) => {
    // Perform authentication
    console.log(`password:-- `, password);
    authenticateUserRun++
    console.log(`Run How many Times authenticateUserRun:- `, authenticateUserRun);

    if (password === "correct") {
      // Write to State: mark as authenticated using Command
      return new Command({
        update: { authenticated: true },
      });
    } else {
      return new Command({ update: { authenticated: false } });
    }
  },
  {
    name: "authenticate_user",
    description: "Authenticate user and update State",
    schema: z.object({
      password: z.string(),
    }),
  }
);

let checkAuthenticationRun = 0
const checkAuthentication = tool(
  ({ query }, runtime: ToolRuntime<Record<string, unknown>, z.infer<typeof contextSchema>>) => {
    // Read from State: check current auth status
    // console.log(`runtime Tools :-- `,runtime);
    checkAuthenticationRun++
    console.log(`Run How many Times checkAuthenticationRun:- `, checkAuthenticationRun);


    const currentState = runtime.state;
    const isAuthenticated = currentState?.authenticated || false;

    // console.log(`query:-- `, query);

    // console.log(`runtime.context:--##-- `, runtime.context.password);

    if (runtime.context.password) {
      new Command({
        update: { authenticated: true }
      })
    } else {
      new Command({
        update: { authenticated: false }
      })
    }

    // console.log(`currentState?.authenticated :-- `, runtime.state?.authenticated);


    if (isAuthenticated) {
      return "User is authenticated";
    } else {
      return "User is not authenticated";
    }

  },
  {
    name: "check_authentication",
    description: "Check if user is authenticated",
    schema: z.object({
      query: z.string().describe('Give me user Id for checking')
    }),
  }
)

const groqLiveData = new Groq({
  apiKey: apiKeyGroq,
  defaultHeaders: {
    "Groq-Model-Version": "latest"
  }
});

let latestNewSearchingToolsRun = 0;
export const latestNewSearchingTools = tool(
  async ({ query }, runtime) => {
    console.log(`Changed Model Name:-- `, query);
    latestNewSearchingToolsRun++
    const chatCompletion = await groqLiveData.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `${query}`,
        },
      ],
      model: "groq/compound",
    });

    const message = chatCompletion?.choices?.[0]?.message;
    console.log(`Run How many Times latestNewSearchingTools:- `, latestNewSearchingToolsRun);

    // Print the final content
    console.log(`Print the final content:-- `, message?.content);

    return message?.content
  }, {
  name: "Latest_Online_Searching_Tools",
  description: "If user want to live or URL content, browser Automation or you have no knowledge about it like , live updates,  then use this tool",
  schema: z.object({
    query: z.string().describe("provide the query which user want to search")
  })
}
)

let readEmailToolRun = 0;
const readEmailTool = tool(({emailId}: {emailId:string}): string => {
  /** Mock function to read an email by its ID. */
  readEmailToolRun++
  console.log(`readEmailToolRun:-- `, readEmailToolRun)
  return `Email content for ID: ${emailId} he is going to delhi tommorrow`;
},
  {
    name: "Email_Reading",
    description: "Read Email of any email id by calling this readEmailTool tool",
    schema: z.object({
      emailId: z.string().describe("Pass the user Email Id which have been passed on the query")
    })
  }
)

let youtubeSubtitles = tool(
  ({videoId})=>{
    let directory = "ytSubtitles";
    console.log({videoId});

    let text = fs.readFileSync(`${directory}/${videoId}.txt`, "utf8");
    const portion = text.slice(0)
    // console.log(`youtubeSubtitles:-- `, portion);
    return portion
  },
  {
    name:"youtube_subtitles_extractor",
    description:"If you want to extract subtiles of any youtube video then pass the id of that youtube video for example https://www.youtube.com/watch?v=n-Hw_K_GsOg, videoId=n-Hw_K_GsOg",
    schema:z.object({
      videoId:z.string().describe("pass youtube videoId=n-Hw_K_GsOg")
    })
  }
)

export const searchAgent: ReturnType<typeof createAgent> = createAgent({
  model: geminiAI,
  middleware: [dynamicSystemPrompt, dynamicSelecitionModel],
  tools: [checkAuthentication, authenticateUser, latestNewSearchingTools, readEmailTool,youtubeSubtitles]
})

let run = 0
const runAgent = async () => {
  const data = await searchAgent.invoke(
    {
      messages: [{ role: "user", content: `
        https://www.youtube.com/watch?v=n-Hw_K_GsOg extract the subtitles using my own tools
        
        Please give me summary of this subtitles which a new people can understand this
        ` }]
    },
    {
      context: { userRole: "beginner", password: "currect" }
    },

  )
  run++
  console.log(`Run How many Times AsynItratorRUn:- `, run);
  console.log(data);

}

runAgent();

// import fs from "fs";

// fs.writeFile("data.json",JSON.stringify(data),{
//   encoding:"utf-8"
// },(err)=>{
//   if (!err) console.log("Successfully written Code");
// })
// console.log(`data:-- `, data);

// let run = 0

// for await (const content of data) {
// run++
// console.log(`Run How many Times AsynItratorRUn:- `, run);

// console.log(`Content Data:-- ` ,content);
// }


