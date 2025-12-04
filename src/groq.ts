import { createAgent } from "langchain";
import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
const apiKeyGroq = process.env.GROQ_API_KEY!;
const apiKeyGemini = process.env.GEMINA_API_KEY!;
import { asterikLongText } from "./utils/utils.js"


console.log(`apiKeyGroq:-- `, asterikLongText(apiKeyGroq), '\n', `apiKeyGemini:-- `, asterikLongText(apiKeyGemini));



export const geminiAI = new ChatGoogleGenerativeAI({
  apiKey: apiKeyGemini,
  model: "gemini-2.5-flash",
  maxOutputTokens: 2000,
});

export const groq = new ChatGroq({
  model: "openai/gpt-oss-20b",
  apiKey: apiKeyGroq,
  maxTokens: 4000
})

export const searchAgent: ReturnType<typeof createAgent> = createAgent({
  model: geminiAI,
  tools: [
    { urlContext: {} },
    { googleSearch: {} },
    { codeExecution: {} }
  ],
})


