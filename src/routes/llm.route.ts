import { Router } from "express";
import { llmResponse } from "../controller/llm.controller.js";

const router = Router();

router.route("/api/react-native-sse").post(llmResponse)

export default router