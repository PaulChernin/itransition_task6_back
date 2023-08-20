import { Router } from "express"
import controllers from "../controllers/controllers"

const router = Router()

router.post('/get-tags', controllers.getTags)
router.post('/get-messages', controllers.getMessages)
router.post('/post-message', controllers.postMessage)

export default router