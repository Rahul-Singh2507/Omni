import { createSlice } from '@reduxjs/toolkit';


const chatSlice = createSlice({
    name: 'chat',
    initialState: {
        chats: {},
        currentChatId: null,
        isLoading: false,
        error: null,
    },
    reducers: {
        createNewChat: (state, action) => {
            const { chatId, title } = action.payload;

            state.chats[ chatId ] = {
                id: chatId,
                title: title || "New Chat",
                messages: [],
                lastUpdated: new Date().toISOString(),
            };

            state.currentChatId = chatId;
        },
        addNewMessage: (state, action) => {
            const { chatId, content, role } = action.payload;

            if (!state.chats[ chatId ]) {
                state.chats[ chatId ] = {
                    id: chatId,
                    title: "New Chat",
                    messages: [],
                    lastUpdated: new Date().toISOString(),
                };
            }

            const message = { content, role };

            state.chats[ chatId ].messages.push(message);
            state.chats[ chatId ].lastUpdated = new Date().toISOString();

            if (!state.chats[ chatId ].title || state.chats[ chatId ].title === "New Chat") {
                state.chats[ chatId ].title = content.slice(0, 25);
            }
        },

        addMessages: (state, action) => {
            const { chatId, messages } = action.payload

            if (!state.chats[ chatId ]) {
                state.chats[ chatId ] = {
                    id: chatId,
                    title: "New Chat",
                    messages: [],
                    lastUpdated: new Date().toISOString(),
                };
            }

            state.chats[ chatId ].messages = messages
            state.chats[ chatId ].lastUpdated = state.chats[ chatId ].lastUpdated || new Date().toISOString();
        },
        setChats: (state, action) => {
            state.chats = action.payload
        },
        setCurrentChatId: (state, action) => {
            state.currentChatId = action.payload
        },
        setLoading: (state, action) => {
            state.isLoading = action.payload
        },
        setError: (state, action) => {
            state.error = action.payload
        },
    }
})

export const { setChats, setCurrentChatId, setLoading, setError, createNewChat, addNewMessage, addMessages } = chatSlice.actions
export default chatSlice.reducer


// chats = {
//     "docker and AWS": {
//         messages: [
//             {
//                 role: "user",
//                 content: "What is docker?"
//             },
//             {
//                 role: "ai",
//                 content: "Docker is a platform that allows developers to automate the deployment of applications inside lightweight, portable containers. It provides an efficient way to package and distribute software, ensuring consistency across different environments."
//             }
//         ],
//         id: "docker and AWS",
//         lastUpdated: "2024-06-20T12:34:56Z",
//     }

// }
