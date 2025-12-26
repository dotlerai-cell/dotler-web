"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDMBotResponse = exports.retrieveRelevantDocuments = exports.suggestRelatedHashtags = exports.generateCaption = exports.createChatSession = void 0;
const genai_1 = require("@google/genai");
// Initialize the API client correctly using the API_KEY environment variable.
const ai = new genai_1.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const createChatSession = () => {
    // Using gemini-1.5-flash for better availability and speed.
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: "You are a helpful, witty, and knowledgeable AI assistant for the Instagram Intelligence app. Your goal is to help users manage their social media presence, brainstorm content ideas, and navigate the app features."
        }
    });
};
exports.createChatSession = createChatSession;
const generateCaption = async (topic, base64Image) => {
    try {
        // Using gemini-3-flash-preview for standard text generation tasks.
        const model = 'gemini-2.5-flash';
        let promptText = `
      You are an expert social media manager for Instagram. 
      Generate an engaging, witty, and viral-worthy caption for a post about: "${topic}".
      Also provide a list of 10 relevant, high-reach hashtags.
      
      Return the output in JSON format with two keys: "caption" (string) and "hashtags" (array of strings).
      Do not include markdown code blocks. Just the raw JSON string.
    `;
        let parts = [{ text: promptText }];
        if (base64Image) {
            // Validation: Check if it is a URL or Base64 data
            if (base64Image.startsWith('http')) {
                console.warn("Gemini Service: Received URL instead of Base64. Skipping visual analysis to prevent API error. Generating based on topic.");
            }
            else {
                // Process Data URI or Raw Base64
                let mimeType = 'image/jpeg';
                let data = base64Image;
                if (base64Image.startsWith('data:')) {
                    const matches = base64Image.match(/^data:(.+);base64,(.+)$/);
                    if (matches && matches.length === 3) {
                        mimeType = matches[1];
                        data = matches[2];
                    }
                }
                else {
                    // Fallback: try to split if comma exists, else assume raw string
                    const split = base64Image.split(',');
                    if (split.length > 1) {
                        data = split[1];
                    }
                }
                parts = [
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: data
                        }
                    },
                    { text: promptText }
                ];
            }
        }
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: parts },
            config: {
                responseMimeType: "application/json"
            }
        });
        // Access the .text property directly, as it is a getter.
        const text = response.text;
        if (!text)
            throw new Error("No response from Gemini");
        return JSON.parse(text);
    }
    catch (error) {
        console.error("Gemini Generation Error:", error);
        return {
            caption: "Could not generate caption. Please check your API key or try again.",
            hashtags: ["#error", "#tryagain"]
        };
    }
};
exports.generateCaption = generateCaption;
const suggestRelatedHashtags = async (topic, currentHashtags) => {
    try {
        const model = 'gemini-2.0-flash-exp';
        const prompt = `
            Act as a trending Instagram strategist. 
            The user is creating a post about "${topic}".
            They already have these hashtags: ${currentHashtags.join(', ')}.
            Suggest 10 ADDITIONAL hashtags that are either:
            1. More niche/targeted
            2. Currently trending for this topic
            3. Geographically or community relevant
            
            Return ONLY a JSON array of 10 strings. Do not include "#" symbol in strings. Do not include markdown code blocks.
        `;
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });
        const text = response.text;
        if (!text)
            return [];
        return JSON.parse(text);
    }
    catch (error) {
        console.error("Hashtag Suggestion Error:", error);
        return [];
    }
};
exports.suggestRelatedHashtags = suggestRelatedHashtags;
/**
 * Performs a lightweight keyword-based semantic search on knowledge documents.
 * Returns the content of the top matching documents.
 */
const retrieveRelevantDocuments = (query, docs, topK = 3) => {
    if (docs.length === 0)
        return [];
    // Basic Stop words list to improve keyword quality
    const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'for', 'to', 'in', 'of', 'with', 'about', 'can', 'do', 'does', 'how', 'what', 'where', 'when', 'why', 'who', 'hi', 'hello', 'hey']);
    const tokens = query.toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .split(/\s+/)
        .filter(t => t.length > 2 && !stopWords.has(t));
    // If no distinct keywords found (e.g. "Hi there"), return top docs as fallback
    if (tokens.length === 0) {
        return docs.slice(0, topK).map(d => `Source (${d.name}): ${d.content}`);
    }
    const scoredDocs = docs.map(doc => {
        const content = (doc.content || '').toLowerCase();
        const name = doc.name.toLowerCase();
        let score = 0;
        tokens.forEach(token => {
            // Title match (Higher weight)
            if (name.includes(token))
                score += 10;
            // Content match (Frequency count)
            const regex = new RegExp(`\\b${token}\\b`, 'g');
            const matches = content.match(regex);
            if (matches)
                score += matches.length;
        });
        return { doc, score };
    });
    // Sort by score descending
    scoredDocs.sort((a, b) => b.score - a.score);
    // Filter relevant docs (score > 0). If none relevant, fallback to top scored (even if 0) to provide *some* context if available.
    const relevantDocs = scoredDocs.filter(d => d.score > 0);
    const finalDocs = relevantDocs.length > 0 ? relevantDocs : scoredDocs.slice(0, 1);
    return finalDocs.slice(0, topK).map(item => `Source (${item.doc.name}): ${item.doc.content}`);
};
exports.retrieveRelevantDocuments = retrieveRelevantDocuments;
const generateDMBotResponse = async (latestUserMessage, contextDocs, messageHistory = []) => {
    try {
        // Using gemini-3-flash-preview for conversational support tasks.
        const model = 'gemini-2.0-flash-exp';
        const systemInstruction = `
        You are a helpful, friendly customer support AI for a brand on Instagram.
        Your goal is to assist users based *strictly* on the provided Knowledge Base context.
        
        Knowledge Base (Relevant Snippets):
        ${contextDocs.length > 0 ? contextDocs.join("\n\n") : "No specific knowledge base context found for this query. Use general professional courtesy."}
        
        Guidelines:
        - Keep answers concise (under 50 words is best for DMs).
        - Use emojis occasionally to be friendly.
        - If the answer isn't in the Knowledge Base, politely offer to connect them with a human or ask for clarification. Don't make up facts.
        `;
        // Prepare contents with history, limiting to recent context.
        const recentHistory = messageHistory.slice(-10);
        const contents = [
            ...recentHistory.map(msg => ({
                role: msg.role,
                parts: [{ text: msg.text }]
            })),
            {
                role: 'user',
                parts: [{ text: latestUserMessage }]
            }
        ];
        const response = await ai.models.generateContent({
            model: model,
            contents: contents,
            config: {
                systemInstruction: systemInstruction
            }
        });
        // Use the .text property to retrieve generated content.
        return response.text || "I'm sorry, I couldn't process that request right now.";
    }
    catch (e) {
        console.error("Bot Gen Error", e);
        return "I'm having a bit of trouble connecting right now. Please try again later!";
    }
};
exports.generateDMBotResponse = generateDMBotResponse;
