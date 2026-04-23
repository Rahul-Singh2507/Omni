import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatMistralAI } from "@langchain/mistralai"
import { HumanMessage, SystemMessage, AIMessage, tool, createAgent } from "langchain";
import * as z from "zod";
import { searchInternet } from "./internet.service.js";

let geminiModel = null;
let mistralModel = null;
let agent = null;

const GEMINI_RESPONSE_MODEL = "gemini-2.5-flash";
const MISTRAL_TITLE_MODEL = "mistral-small-latest";

function getGeminiModel() {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not configured");
    }

    if (!geminiModel) {
        geminiModel = new ChatGoogleGenerativeAI({
            model: GEMINI_RESPONSE_MODEL,
            apiKey: process.env.GEMINI_API_KEY
        });
    }

    return geminiModel;
}

function getMistralModel() {
    if (!process.env.MISTRAL_API_KEY) {
        throw new Error("MISTRAL_API_KEY is not configured");
    }

    if (!mistralModel) {
        mistralModel = new ChatMistralAI({
            model: MISTRAL_TITLE_MODEL,
            apiKey: process.env.MISTRAL_API_KEY
        });
    }

    return mistralModel;
}

const searchInternetTool = tool(
    searchInternet,
    {
        name: "searchInternet",
        description: "Use this tool to get the latest information from the internet.",
        schema: z.object({
            query: z.string().describe("The search query to look up on the internet.")
        })
    }
)

function getAgent() {
    if (!agent) {
        agent = createAgent({
            model: getGeminiModel(),
            tools: [ searchInternetTool ],
        });
    }

    return agent;
}

export async function generateResponse(messages) {
    console.log(messages)

    const response = await getAgent().invoke({
        messages: [
            new SystemMessage(`
                You are a helpful and precise assistant for answering questions.
                If you don't know the answer, say you don't know. 
                If the question requires up-to-date information, use the "searchInternet" tool to get the latest information from the internet and then answer based on the search results.
            `),
            ...(messages.map(msg => {
                if (msg.role == "user") {
                    return new HumanMessage(msg.content)
                } else if (msg.role == "ai") {
                    return new AIMessage(msg.content)
                }
            })) ]
    });

    return response.messages[ response.messages.length - 1 ].text;

}

export async function generateChatTitle(message) {

    const response = await getMistralModel().invoke([
        new SystemMessage(`
            You are a helpful assistant that generates concise and descriptive titles for chat conversations.
            
            User will provide you with the first message of a chat conversation, and you will generate a title that captures the essence of the conversation in 2-4 words. The title should be clear, relevant, and engaging, giving users a quick understanding of the chat's topic.    
        `),
        new HumanMessage(`
            Generate a title for a chat conversation based on the following first message:
            "${message}"
            `)
    ])

    return response.text;

}
