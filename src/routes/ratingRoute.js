import express from 'express'
import customerProtect from '../middleware/customerMiddleware.js'
import { postRating } from '../controllers/ratingController.js'

const router = express.Router()
router.route("/post-rating").post(postRating)
export default router
