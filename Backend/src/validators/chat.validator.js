import { body, param } from "express-validator";
import { validate } from "./auth.validator.js";

export const sendMessageValidator = [
    body("message")
        .trim()
        .notEmpty().withMessage("Message is required")
        .isLength({ min: 1, max: 4000 }).withMessage("Message must be between 1 and 4000 characters"),

    body("chat")
        .optional({ values: "falsy" })
        .isMongoId().withMessage("Invalid chat id"),

    validate
];

export const chatIdParamValidator = [
    param("chatId")
        .isMongoId().withMessage("Invalid chat id"),

    validate
];
