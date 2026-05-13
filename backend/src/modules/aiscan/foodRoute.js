import express from "express";
import { scanFood } from "./foodcontroller.js";

const router = express.Router();

router.post("/scan-food", scanFood);

export default router;