// @ts-nocheck

import express from "express";
import customerProtect from "../middleware/customerMiddleware";
import { postRating } from "../controllers/ratingController";

const router = express.Router();
router.route("/post-rating").post(postRating);
export default router;
