import { createAgent } from "langchain";
import { ChatGroq, type ChatGroqInput } from "@langchain/groq";
import { ChatGoogleGenerativeAI, type GoogleGenerativeAIChatInput } from "@langchain/google-genai";
import type { ClientTool, ServerTool } from "@langchain/core/tools";
const apiKeyGroq = process.env.GROQ_API_KEY!;
const apiKeyGemini = process.env.GEMINA_API_KEY!;

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

    constructor({ apiKeyGemini, apiKeyGroq }: SearchAgentProps) {
        this.apiKeyGemini = apiKeyGemini;
        this.apiKeyGroq = apiKeyGroq;
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
    agentllmSetUp({ type, model, tools, stream }: { type: ModelType, model: string, stream: boolean, tools?: (ServerTool | ClientTool)[] }):ReturnType<typeof createAgent> {
        const responserLLmModel = this.modelSelectorForResponse({ type, model })
        const toolsAdding = this.toolsSetUp({ type, tools });

        const searchAgent: ReturnType<typeof createAgent> = createAgent({
            model: responserLLmModel,
            tools: toolsAdding,
        })

        return searchAgent
    }

    // toolsSetup 
    toolsSetUp({ tools, type }: { tools?: (ServerTool | ClientTool)[] | undefined , type: ModelType }) {
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

