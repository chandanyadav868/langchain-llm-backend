import { ChatGroq } from "@langchain/groq";
import { createAgent} from "langchain";

const apiKeyGroq = process.env.GROQ_API_KEY!;
console.log(`apiKeyGroq:-- `,apiKeyGroq);


export const groq = new ChatGroq({
    model: "openai/gpt-oss-20b",
    apiKey: apiKeyGroq,
})

const AGENT_PROMPT = `
    you are expert in the tools selection for getting best output by using them
`

export const calendarAgent:ReturnType<typeof createAgent> = createAgent({
  model: groq,
  systemPrompt: AGENT_PROMPT,
  tools: [],
})
