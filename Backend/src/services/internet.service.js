import { tavily as Tavily } from "@tavily/core"

let tavilyClient = null;

function getTavilyClient() {
    if (!process.env.TAVILY_API_KEY) {
        throw new Error("TAVILY_API_KEY is not configured");
    }

    if (!tavilyClient) {
        tavilyClient = Tavily({
            apiKey: process.env.TAVILY_API_KEY,
        });
    }

    return tavilyClient;
}

export const searchInternet = async ({ query }) => {
    const tavily = getTavilyClient();
    const results = await tavily.search(query, {
        maxResults: 5,
    });

    console.log(JSON.stringify(results));

    return JSON.stringify(results);
}
