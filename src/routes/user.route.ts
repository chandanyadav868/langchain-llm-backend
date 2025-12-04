import { Router } from "express";
import { userDetails } from "../controller/user.controller.js";

const router = Router();

router.route("/me").get(userDetails)

export default router