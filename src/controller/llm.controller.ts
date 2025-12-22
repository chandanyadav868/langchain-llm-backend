import type { NextFunction, Request, Response } from "express"
import { seeRequiredHeaders } from "../utils/utils.js";
import { SearchAgentSetUp } from "../utils/llmSelector.js";
import {AIMessage} from "langchain";

const llmResponse = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = req.body as BodyData;

        if (!data) {
            throw new Error("Provide required Data")
        }

        const { messages, model, stream, type } = data;
        // console.log({ messages, model, stream, type });

        // adding required Header
        seeRequiredHeaders(res)

        res.write("event: messages\n");

        const systemPrompt = `
            You are an AI assistant.

            -Give your response in explaining ways
            -Use simple language day to day talk , do not use the technical jargon
            -Use simple in place of jargon words or give a refrence explaination about jargon words
        `   

        // set up for llm Models
        const searchAgent = SearchAgentSetUp.agentllmSetUp({ type, model, stream, systemPrompt });

        const streamData = await searchAgent.stream(
            { messages: [{ role: messages[0]?.role as string, content: messages?.[0]?.content as string }] },
            { streamMode: "messages" }
        )

        // this for sending AiMessageChunk
        for await (const data of streamData) {
            // console.log("data:--#--",data);
            for (const contentObj of data) {
                if (AIMessage.isInstance(contentObj)) {
                    // console.log(`AIMessage:#-----> <-----#`,AIMessage.isInstance(contentObj));
                    let data = {message: contentObj.content }
                    res.write(`data: ${JSON.stringify(data)}\n`)
                }
            }            
        }
        res.end();
    } catch (error) {
        console.log("ERROR:- ", error);
        res.write(`data: ${JSON.stringify({ status: 500, message: (error as any).message, })}\n\n`);
        res.end()
    }
}

export { llmResponse }