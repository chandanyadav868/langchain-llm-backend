import { ChatGroq } from "@langchain/groq";
import { createAgent} from "langchain";

const apiKeyGroq = process.env.GROQ_API_KEY!;
console.log(`apiKeyGroq:-- `,apiKeyGroq);


export const groq = new ChatGroq({
    model: "openai/gpt-oss-20b",
    apiKey: apiKeyGroq,
})

export const calendarAgent:ReturnType<typeof createAgent> = createAgent({
  model: groq,
  tools: [],
})
