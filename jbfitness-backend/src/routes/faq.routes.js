// routes/faq.routes.js

import express from "express";
import { getFaq } from "../controllers/faq.controller.js";

const router = express.Router();

// GET /api/faq
router.get("/", getFaq);

export default router;
