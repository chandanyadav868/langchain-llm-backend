import { createAgent, tool } from "langchain";
import { ChatGroq, type ChatGroqInput } from "@langchain/groq";
import { ChatGoogleGenerativeAI, type GoogleGenerativeAIChatInput } from "@langchain/google-genai";
import type { ClientTool, ServerTool } from "@langchain/core/tools";
const apiKeyGroq = process.env.GROQ_API_KEY!;
const apiKeyGemini = process.env.GEMINA_API_KEY!;
import { Groq } from "groq-sdk";
import * as z from "zod";

type SearchAgentProps = {
    apiKeyGemini: string;
    apiKeyGroq: string;
}

type ModelType = "Groq" | "Gemina"

class SearchAgent {
    private apiKeyGemini: string = "";
    private apiKeyGroq: string = "";
    geminiSetUp: ChatGoogleGenerativeAI | null = null;
    groqSetUp: ChatGroq | null = null;
    groqLiveData: Groq | null = null;

    constructor({ apiKeyGemini, apiKeyGroq }: SearchAgentProps) {
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

    latestNewSearchingTools =
        tool(
            async ({ query }, runtime) => {
                // console.log(`Changed Model Name:-- `, model_name);
                if (!this.groqLiveData) {
                    return "Unable to searching because model is not ready"
                }
                const chatCompletion = await this.groqLiveData?.chat?.completions?.create({
                    messages: [
                        {
                            role: "user",
                            content: `${query}`,
                        },
                    ],
                    model: "groq/compound",
                });

                const message = chatCompletion?.choices?.[0]?.message;

                // Print the final content
                console.log(`Print the final content:-- `, message?.content);

                return message?.content
            }, {
            name: "Latest_Online_Searching_Tools",
            description: "If user want to live news, latest news, or URL content, browser Automation then use this tool",
            schema: z.object({
                query: z.string().describe("provide the search query")
            })
        }
        )

    // agentLLmSetup
    agentllmSetUp({ type, model, tools, stream }: { type: ModelType, model: string, stream: boolean, tools?: (ServerTool | ClientTool)[] }): ReturnType<typeof createAgent> {
        const responserLLmModel = this.modelSelectorForResponse({ type, model })
        const toolsAdding = this.toolsSetUp({ type, tools });

        const searchAgent: ReturnType<typeof createAgent> = createAgent({
            model: responserLLmModel,
            tools: [...toolsAdding, this.latestNewSearchingTools],
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
                break;
            default:
                return this.geminiAI({ model })
                break;
        }
    }
}

export const SearchAgentSetUp = new SearchAgent({ apiKeyGemini, apiKeyGroq })

