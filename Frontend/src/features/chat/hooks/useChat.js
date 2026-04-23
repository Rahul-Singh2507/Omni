import { initializeSocketConnection } from "../services/chat.socket";
import { sendMessage, getChats, getMessages } from "../services/chat.api";
import { setChats, setCurrentChatId, setError, setLoading, createNewChat, addNewMessage, addMessages } from "../chat.slice";
import { useDispatch } from "react-redux";


export const useChat = () => {

    const dispatch = useDispatch()


    async function handleSendMessage({ message, chatId }) {
        try {
            dispatch(setLoading(true))
            dispatch(setError(null))

            const data = await sendMessage({ message, chatId })
            const { chat, aiMessage } = data
            const activeChatId = chat._id

            if (!chatId) {
                dispatch(createNewChat({
                    chatId: activeChatId,
                    title: chat.title,
                }))
            }

            dispatch(addNewMessage({
                chatId: activeChatId,
                content: message,
                role: "user",
            }))
            dispatch(addNewMessage({
                chatId: activeChatId,
                content: aiMessage.content,
                role: aiMessage.role,
            }))
            dispatch(setCurrentChatId(activeChatId))
        } catch (err) {
            dispatch(setError(err.response?.data?.message || "Failed to send message"))
        } finally {
            dispatch(setLoading(false))
        }
    }

    async function handleGetChats() {
        try {
            dispatch(setLoading(true))
            dispatch(setError(null))

            const data = await getChats()
            const { chats } = data
            dispatch(setChats(chats.reduce((acc, chat) => {
                acc[ chat._id ] = {
                    id: chat._id,
                    title: chat.title,
                    messages: [],
                    lastUpdated: chat.updatedAt,
                }
                return acc
            }, {})))
        } catch (err) {
            dispatch(setError(err.response?.data?.message || "Failed to load chats"))
        } finally {
            dispatch(setLoading(false))
        }
    }

    async function handleOpenChat(chatId, chats) {
        try {
            dispatch(setLoading(true))
            dispatch(setError(null))

            if (chats[ chatId ]?.messages.length === 0) {
                const data = await getMessages(chatId)
                const { messages } = data

                const formattedMessages = messages.map(msg => ({
                    content: msg.content,
                    role: msg.role,
                }))

                dispatch(addMessages({
                    chatId,
                    messages: formattedMessages,
                }))
            }
            dispatch(setCurrentChatId(chatId))
        } catch (err) {
            dispatch(setError(err.response?.data?.message || "Failed to open chat"))
        } finally {
            dispatch(setLoading(false))
        }
    }

    function handleStartNewChat() {
        dispatch(setCurrentChatId(null))
        dispatch(setError(null))
    }

    return {
        initializeSocketConnection,
        handleSendMessage,
        handleGetChats,
        handleOpenChat,
        handleStartNewChat,
    }

}
