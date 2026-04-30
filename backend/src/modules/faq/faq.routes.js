import express from "express";
import { getFaq } from "./faq.controller.js";

const router = express.Router();

router.get("/", getFaq);

export default router;