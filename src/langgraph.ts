import { ChatGroq } from "@langchain/groq";
import { AIMessage, HumanMessage, tool } from "langchain";
import * as z from "zod";

const apiKeyGroq = process.env.GROQ_API_KEY!;

const llm = new ChatGroq({
    apiKey: apiKeyGroq,
    model: "openai/gpt-oss-120b",
    temperature: 0,
});




/* 
// Schema for structured output
const SearchQuery = z.object({
  search_query: z.string().describe("Query that is optimized web search."),
  justification: z
    .string()
    .describe("Why this query is relevant to the user's request."),
});

// Augment the LLM with schema for structured output
const structuredLlm = llm.withStructuredOutput(SearchQuery);

// Invoke the augmented LLM
const output = await structuredLlm.invoke(
  "What is president of america?"
);

console.log(`output:-- `, output)

// Define a tool
const multiply = tool(
  ({ a, b }) => {
    return a * b;
  },
  {
    name: "multiply",
    description: "Multiply two numbers",
    schema: z.object({
      a: z.number(),
      b: z.number(),
    }),
  }
);

const toolsObject = {
    [multiply.name]:multiply
}

// Augment the LLM with tools
const llmWithTools = llm.bindTools([multiply]);

// Invoke the LLM with input that triggers the tool call
const msg = await llmWithTools.invoke("What is 2 times 100?");

// Get the tool call
console.log("Message:-- ",msg.tool_calls);


const toolCalling = async ()=>{
    if (!msg.tool_calls) return
    for (const tool of  msg.tool_calls) {
        console.log(`tool:-- `,tool);
        console.log(`toolsCalling:-- `,await toolsObject[tool.name]?.invoke({...tool.args} as any));
    }
};

toolCalling()
// response message
// console.log("Message:-- ",msg);*/



import { StateGraph, Annotation } from "@langchain/langgraph";


/*
// Graph state  
const StateAnnotation = Annotation.Root({
  topic: Annotation<string>,
  joke: Annotation<string>,
  improvedJoke: Annotation<string>,
  finalJoke: Annotation<string>,
});

// First LLM call to generate initial joke
async function generateJoke(state: typeof StateAnnotation.State) {
  const msg = await llm.invoke(`Write a short joke about ${state.topic}`);
  return { joke: msg.content };
}

// Gate function to check if the joke has a punchline
function checkPunchline(state: typeof StateAnnotation.State) {
  // Simple check - does the joke contain "?" or "!"
  if (state.joke?.includes("?") || state.joke?.includes("!")) {
    return "Pass";
  }
  return "Fail";
}

// Second LLM call to improve the joke
async function improveJoke(state: typeof StateAnnotation.State) {
  const msg = await llm.invoke(
    `Make this joke funnier by adding wordplay: ${state.joke}`
  );
  return { improvedJoke: msg.content };
}

// Third LLM call for final polish
async function polishJoke(state: typeof StateAnnotation.State) {
  const msg = await llm.invoke(
    `Add a surprising twist to this joke: ${state.improvedJoke}`
  );
  return { finalJoke: msg.content };
}


// Build workflow
const chain = new StateGraph(StateAnnotation)
  .addNode("generateJoke", generateJoke)
  .addNode("improveJoke", improveJoke)
  .addNode("polishJoke", polishJoke)
  .addEdge("__start__", "generateJoke")
  .addConditionalEdges("generateJoke", checkPunchline, {
    Pass: "improveJoke",
    Fail: "__end__"
  })
  .addEdge("improveJoke", "polishJoke")
  .addEdge("polishJoke", "__end__")
  .compile();



  // Invoke
const state = await chain.invoke({ topic: "dogs" });
console.log("Initial joke:");
console.log(state.joke);
console.log("\n--- --- ---\n");
if (state.improvedJoke !== undefined) {
  console.log("Improved joke:");
  console.log(state.improvedJoke);
  console.log("\n--- --- ---\n");

  console.log("Final joke:");
  console.log(state.finalJoke);
} else {
  console.log("Joke failed quality gate - no punchline detected!");
}*/





/*
// Graph state
const StateAnnotation = Annotation.Root({
  topic: Annotation<string>,
  joke: Annotation<string>,
  story: Annotation<string>,
  poem: Annotation<string>,
  combinedOutput: Annotation<string>,
});

// Nodes
// First LLM call to generate initial joke
async function callLlm1(state: typeof StateAnnotation.State) {
  const msg = await llm.invoke(`Write a joke about ${state.topic}`);
  return { joke: msg.content };
}

// Second LLM call to generate story
async function callLlm2(state: typeof StateAnnotation.State) {
  const msg = await llm.invoke(`Write a story about ${state.topic}`);
  return { story: msg.content };
}

// Third LLM call to generate poem
async function callLlm3(state: typeof StateAnnotation.State) {
  const msg = await llm.invoke(`Write a poem about ${state.topic}`);
  return { poem: msg.content };
}

// Combine the joke, story and poem into a single output
async function aggregator(state: typeof StateAnnotation.State) {
  const combined = `Here's a story, joke, and poem about ${state.topic}!\n\n` +
    `STORY:\n${state.story}\n\n` +
    `JOKE:\n${state.joke}\n\n` +
    `POEM:\n${state.poem}`;
  return { combinedOutput: combined };
}

// Build workflow
const parallelWorkflow = new StateGraph(StateAnnotation)
  .addNode("callLlm1", callLlm1)
  .addNode("callLlm2", callLlm2)
  .addNode("callLlm3", callLlm3)
  .addNode("aggregator", aggregator)
  .addEdge("__start__", "callLlm1")
  .addEdge("__start__", "callLlm2")
  .addEdge("__start__", "callLlm3")
  .addEdge("callLlm1", "aggregator")
  .addEdge("callLlm2", "aggregator")
  .addEdge("callLlm3", "aggregator")
  .addEdge("aggregator", "__end__")
  .compile();

// Invoke
const result = await parallelWorkflow.invoke({ topic: "write only poem" });
console.log(result.combinedOutput); */




/*
// Schema for structured output to use as routing logic
const routeSchema = z.object({
  step: z.enum(["poem", "story", "joke"]).describe(
    "The next step in the routing process"
  ),
});


// Augment the LLM with schema for structured output
const router = llm.withStructuredOutput(routeSchema);

// Graph state
const StateAnnotation = Annotation.Root({
  input: Annotation<string>,
  decision: Annotation<string>,
  output: Annotation<string>,
});


// Nodes
// Write a story
async function llmCall1(state: typeof StateAnnotation.State) {
  const result = await llm.invoke([{
    role: "system",
    content: "You are an expert storyteller.",
  }, {
    role: "user",
    content: state.input
  }]);
  return { output: result.content };
}

// Write a joke
async function llmCall2(state: typeof StateAnnotation.State) {
  const result = await llm.invoke([{
    role: "system",
    content: "You are an expert comedian.",
  }, {
    role: "user",
    content: state.input
  }]);
  return { output: result.content };
}


// Write a poem
async function llmCall3(state: typeof StateAnnotation.State) {
  const result = await llm.invoke([{
    role: "system",
    content: "You are an expert poet.",
  }, {
    role: "user",
    content: state.input
  }]);
  return { output: result.content };
}


async function llmCallRouter(state: typeof StateAnnotation.State) {
  // Route the input to the appropriate node
  const decision = await router.invoke([
    {
      role: "system",
      content: "Route the input to story, joke, or poem based on the user's request."
    },
    {
      role: "user",
      content: state.input
    },
  ]);

  return { decision: decision.step };
}


// Conditional edge function to route to the appropriate node
function routeDecision(state: typeof StateAnnotation.State) {
  // Return the node name you want to visit next
  if (state.decision === "story") {
    return "llmCall1";
  } else if (state.decision === "joke") {
    return "llmCall2";
  } else if (state.decision === "poem") {
    return "llmCall3";
  }else{
    return "llmCall2"
  }
}


// Build workflow
const routerWorkflow = new StateGraph(StateAnnotation)
  .addNode("llmCall1", llmCall1)
  .addNode("llmCall2", llmCall2)
  .addNode("llmCall3", llmCall3)
  .addNode("llmCallRouter", llmCallRouter)
  .addEdge("__start__", "llmCallRouter")
  .addConditionalEdges(
    "llmCallRouter",
    routeDecision,
    ["llmCall1", "llmCall2", "llmCall3"],
  )
  .addEdge("llmCall1", "__end__")
  .addEdge("llmCall2", "__end__")
  .addEdge("llmCall3", "__end__")
  .compile();

// Invoke
const state = await routerWorkflow.invoke({
  input: "Write me a joke about cats"
});
console.log(state); */




import { START, END, MemorySaver } from "@langchain/langgraph";
import { registry } from "@langchain/langgraph/zod";

const State = Annotation.Root({
  messages: Annotation<AIMessage[]>({
    reducer: (prev, next) => prev.concat(next),
    default: () => [],
  }),
});


async function chatNode(state: typeof State.State) {
  const response = await llm.invoke(state.messages);
  return {
    messages: [response],
  };
}

const workflow = new StateGraph(State)
  .addNode("chat", chatNode)
  .addEdge(START, "chat")
  .addEdge("chat", END);

const checkpointer = new MemorySaver();

const graph = workflow.compile({
  checkpointer,
});


const config = {
  configurable: {
    thread_id: "user-1",
  },
};



const result1 = await graph.invoke(
  {
    messages: [],
  },
  config
);

console.log(result1.messages.at(-1)?.content);
