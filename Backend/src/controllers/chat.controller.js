import { generateResponse, generateChatTitle } from "../services/ai.service.js";
import chatModel from "../models/chat.model.js"
import messageModel from "../models/message.model.js";

function fallbackChatTitle(message) {
    return message.length > 40 ? `${message.slice(0, 37)}...` : message;
}

export async function sendMessage(req, res) {

    const { message, chat: chatId } = req.body;
    const normalizedMessage = message.trim();


    let chat = null;

    if (chatId) {
        chat = await chatModel.findOne({
            _id: chatId,
            user: req.user.id
        });

        if (!chat) {
            return res.status(404).json({
                message: "Chat not found",
                success: false
            });
        }
    } else {
        let title = fallbackChatTitle(normalizedMessage);

        try {
            title = await generateChatTitle(normalizedMessage);
        } catch (error) {
            console.error("Failed to generate chat title:", error);
        }

        chat = await chatModel.create({
            user: req.user.id,
            title
        })
    }

    const previousMessages = await messageModel.find({ chat: chat._id }).sort({ createdAt: 1 });
    const pendingMessages = [
        ...previousMessages.map((existingMessage) => ({
            role: existingMessage.role,
            content: existingMessage.content,
        })),
        {
            role: "user",
            content: normalizedMessage,
        }
    ];

    let result;

    try {
        result = await generateResponse(pendingMessages);
    } catch (error) {
        console.error("Failed to generate AI response:", error);

        return res.status(503).json({
            message: "AI response is temporarily unavailable. Please try again.",
            success: false,
        });
    }

    const userMessage = await messageModel.create({
        chat: chat._id,
        content: normalizedMessage,
        role: "user"
    })

    const aiMessage = await messageModel.create({
        chat: chat._id,
        content: result,
        role: "ai"
    })


    res.status(201).json({
        chat,
        userMessage,
        aiMessage
    })

}

export async function getChats(req, res) {
    const user = req.user

    const chats = await chatModel.find({ user: user.id }).sort({ updatedAt: -1 })

    res.status(200).json({
        message: "Chats retrieved successfully",
        chats
    })
}

export async function getMessages(req, res) {
    const { chatId } = req.params;

    const chat = await chatModel.findOne({
        _id: chatId,
        user: req.user.id
    })

    if (!chat) {
        return res.status(404).json({
            message: "Chat not found"
        })
    }

    const messages = await messageModel.find({
        chat: chatId
    }).sort({ createdAt: 1 })

    res.status(200).json({
        message: "Messages retrieved successfully",
        messages
    })
}

export async function deleteChat(req, res) {

    const { chatId } = req.params;

    const chat = await chatModel.findOneAndDelete({
        _id: chatId,
        user: req.user.id
    })

    if (!chat) {
        return res.status(404).json({
            message: "Chat not found"
        })
    }

    await messageModel.deleteMany({
        chat: chatId
    })

    res.status(200).json({
        message: "Chat deleted successfully"
    })
}
