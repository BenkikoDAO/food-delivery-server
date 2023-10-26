// @ts-nocheck

import express from "express";
const router = express.Router();
import { queryLogsByDate } from "../controllers/loggerController";

router.route("/").get(queryLogsByDate);

export default router;
