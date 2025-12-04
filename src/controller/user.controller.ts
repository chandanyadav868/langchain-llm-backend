import { fromNodeHeaders } from "better-auth/node";
import type { NextFunction, Request, Response } from "express"
import { auth } from "../auth.js";

const userDetails = async (req: Request, res: Response, next: NextFunction) => {
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
    });

    return res.json(session);
}

export { userDetails }