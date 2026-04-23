import { Router } from 'express';
import { sendMessage, getChats, getMessages, deleteChat } from "../controllers/chat.controller.js";
import { authUser } from "../middleware/auth.middleware.js";
import { createRateLimit } from "../middleware/rate-limit.middleware.js";
import { sendMessageValidator, chatIdParamValidator } from "../validators/chat.validator.js";

const chatRouter = Router();
const chatMutationLimiter = createRateLimit({
    windowMs: 60 * 1000,
    max: 15,
    message: "Too many chat requests. Please slow down and try again."
});


chatRouter.post("/message", authUser, chatMutationLimiter, sendMessageValidator, sendMessage)

chatRouter.get("/", authUser, getChats)

chatRouter.get("/:chatId/messages", authUser, chatIdParamValidator, getMessages)

chatRouter.delete("/delete/:chatId", authUser, chatMutationLimiter, chatIdParamValidator, deleteChat)

export default chatRouter;
