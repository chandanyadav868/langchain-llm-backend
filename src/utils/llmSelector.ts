import { createAgent, tool } from "langchain";
import { ChatGroq, type ChatGroqInput } from "@langchain/groq";
import { ChatGoogleGenerativeAI, type GoogleGenerativeAIChatInput } from "@langchain/google-genai";
import type { ClientTool, ServerTool } from "@langchain/core/tools";
const apiKeyGroq = process.env.GROQ_API_KEY!;
const apiKeyGemini = process.env.GEMINA_API_KEY!;
import { Groq } from "groq-sdk";
import * as z from "zod";
import fs from "fs"
import { twitterVideoUrl } from "../ytsubtitles.js"
import path from "path";

type SearchAgentProps = {
    apiKeyGemini: string;
    apiKeyGroq: string;
}

type ModelType = "Groq" | "Gemina";


class SearchAgent {
    private apiKeyGemini: string = "";
    private apiKeyGroq: string = "";
    geminiSetUp: ChatGoogleGenerativeAI | null = null;
    groqSetUp: ChatGroq | null = null;
    groqLiveData: Groq | null = null;

    constructor() {
        this.apiKeyGemini = apiKeyGemini;
        this.apiKeyGroq = apiKeyGroq;
        this.groqLiveData = new Groq({
            apiKey: apiKeyGroq,
            defaultHeaders: {
                "Groq-Model-Version": "latest"
            }
        });
    };

    // geminiAi Setup
    geminiAI(optionsGemina: GoogleGenerativeAIChatInput) {
        this.geminiSetUp = new ChatGoogleGenerativeAI({
            apiKey: this.apiKeyGemini,
            ...optionsGemina,
        });
        return this.geminiSetUp
    };

    // groqAi Setup
    GroqAI(optionsGemina: ChatGroqInput) {
        this.groqSetUp = new ChatGroq({
            apiKey: this.apiKeyGroq,
            ...optionsGemina
        });

        return this.groqSetUp
    };

    simplellmSetUp({ }: { type: ModelType, model: string, stream: boolean }) {

    }


    // agentLLmSetup
    agentllmSetUp({ type, model, tools, stream, systemPrompt }: { type: ModelType, model: string, stream: boolean, tools?: (ServerTool | ClientTool)[], systemPrompt?: string }): ReturnType<typeof createAgent> {
        const responserLLmModel = this.modelSelectorForResponse({ type, model })
        const toolsAdding = this.toolsSetUp({ type, tools });

        const searchAgent: ReturnType<typeof createAgent> = createAgent({
            model: responserLLmModel,
            systemPrompt: `${systemPrompt}`,
            tools: [...toolsAdding, ...new Tools().toolsList],
        })

        return searchAgent
    }

    // toolsSetup 
    toolsSetUp({ tools, type }: { tools?: (ServerTool | ClientTool)[] | undefined, type: ModelType }) {
        let tooling: any = [];

        if (!tools || !Array.isArray(tools)) {
            type === "Gemina" ? tooling = [{ urlContext: {} }, { googleSearch: {} }, { codeExecution: {} }] : tooling = []
        }

        return [...tooling]
    }

    // modelSelectorForResponse
    modelSelectorForResponse({ type, model }: { type: ModelType, model: string }) {
        switch (type) {
            case "Groq":
                return this.GroqAI({ model })
            default:
                return this.geminiAI({ model })
        }
    }
}

class Tools extends SearchAgent {
    constructor() {
        super()
    }

    latestNewSearchingTools = tool(
        async ({ query }, runtime) => {
            // console.log(`Changed Model Name:-- `, model_name);
            if (!this.groqLiveData) {
                return "Unable to searching because model is not ready"
            }
            const chatCompletion = await this.groqLiveData?.chat?.completions?.create({
                messages: [{ role: "user", content: `${query}` }],
                model: "groq/compound",
            });

            const message = chatCompletion?.choices?.[0]?.message;
            return message?.content
        }, {
        name: "Latest_Online_Searching_Tools",
        description: "If user want to live news, latest news, or URL content, browser Automation then use this tool",
        schema: z.object({
            query: z.string().describe("provide the search query")
        })
    }
    )

    youtubeSubtitles = tool(
        ({ videoId }) => {
            console.log("youtubeSubtitles:#---> <----# ", { videoId });
            let directory = path.join(process.cwd(), "ytSubtitles");
            console.log(`Directory:-- `, directory);
            
            const fileList = fs.readdirSync(directory, { encoding: "utf8" });

            const fileExist = fileList.find((v, i) => v === `${videoId}.txt`);
            let text = ""
            if (fileExist) {
                text = fs.readFileSync(`${directory}/${videoId}.txt`, "utf8");
            } else {
                text = "No file exist of this youtube video please use online_youtube_subtitle_extractor tool for extracting subtitles from youtube video"
            }
            console.log(`youtubeSubtitles:-- `, text.slice(0, 100));
            return text
        },
        {
            name: "check_youtube_subtitles",
            description: "if user say to you please explain this youtube video or what this video want to explain, use this tools for extracting subtitles of youtube video if user subtitles present previously present",
            schema: z.object({
                videoId: z.string().describe("pass youtube videoId=n-Hw_K_GsOg")
            })
        }
    )

    extractringSubtitlesOnline = tool(
        async ({ youtubeVideoUrl }) => {
            const cleanSubtitleData = await twitterVideoUrl(youtubeVideoUrl);
            return cleanSubtitleData
        },
        {
            name: "online_youtube_subtitle_extractor",
            description: "If user have passed youtube url then use this tools for downloading subtitles from youtube this tool using ytdl library before using this use this check_youtube_subtitles tool for checking that video subtitle already present or not",
            schema: z.object({
                youtubeVideoUrl: z.string().describe("give youtubeUrl which user passed for example, https://www.youtube.com/watch?v=n-Hw_K_GsOg ")
            })
        }
    )

    get toolsList() {
        return [this.youtubeSubtitles, this.latestNewSearchingTools, this.extractringSubtitlesOnline]
    }

}

export const SearchAgentSetUp = new SearchAgent()

