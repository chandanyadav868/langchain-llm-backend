import { createAgent, HumanMessage, piiRedactionMiddleware } from "langchain";
import * as z from "zod";
import { ChatGroq } from "@langchain/groq";
import { groq } from "./groq.js";

export const llm = groq


const agent = createAgent({
    model: llm,
    tools: [],
    middleware: [
        // // Redact emails in user input before sending to model
        // piiRedactionMiddleware({}),
        // // Mask credit cards in user input
        // piiRedactionMiddleware({}),
        // // Block API keys - raise error if detected
        // piiRedactionMiddleware({}),
    ],
});

// When user provides PII, it will be handled according to the strategy
// const result = await agent.invoke({
//   messages: [{
//     role: "user",
//     content: "My email is john.doe@example.com and card is 4532-1234-5678-9010"
//   }]
// });

// console.log(result)

const humanMessage = new HumanMessage("Look up SSN 123-45-6789");
console.log(`HumanMessage:- `, humanMessage);
console.log(`HumanMessage Content:- `, humanMessage.lc_namespace);

class Human {
    #lc_name = "Tika"
    content = "Look up SSN 123-45-6789"
    additional_kwargs: {}
    response_metadata: {}
    constructor(content?: any, additional_kwargs?: any, response_metadata?: any) {
        this.content = content
        this.additional_kwargs = additional_kwargs
        this.response_metadata = response_metadata
    }

    changeContent(content:any){
        this.content = content
    }
}

const human1 = new Human("Look up SSN 123-45-6789",{},{});

console.log(human1);
