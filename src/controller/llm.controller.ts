import type { NextFunction, Request, Response } from "express"
import { seeRequiredHeaders } from "../utils/utils.js";
import { SearchAgentSetUp } from "../utils/llmSelector.js";

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

        // set up for llm Models
        const searchAgent = SearchAgentSetUp.agentllmSetUp({ type, model, stream });

        const streamData = await searchAgent.stream(
            { messages: [{ role: messages[0]?.role as string, content: messages?.[0]?.content as string }] },
            { streamMode: "messages" }
        )

        for await (const element of streamData) {
            const newObject = { message: element[0].content };
            res.write(`data: ${JSON.stringify(newObject)}\n`)
        }

        // res.write("data: [DONE]\n");
        res.end();
    } catch (error) {
        console.log("ERROR ", (error as any).message);
        res.write(`data: ${JSON.stringify({status: 500, message: (error as any).message,})}\n\n`);
        res.end()
    }   
}

export { llmResponse }