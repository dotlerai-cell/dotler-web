
import React, { useState, useEffect, useRef } from 'react';
import {
    Send, Bot, User, Sparkles, Loader2, StopCircle, RefreshCw,
    Lightbulb, PenTool, TrendingUp, Compass, MessageSquare, Zap
} from 'lucide-react';
import { createChatSession } from '../../backend/geminiService';
import { GenerateContentResponse } from '@google/genai';

interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: number;
}

const ChatBot: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'model',
            text: 'Hello! I am your AI Assistant. Ready to elevate your Instagram strategy?',
            timestamp: Date.now()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [chatSession, setChatSession] = useState<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    // Initialize Chat Session
    useEffect(() => {
        initializeChat();
    }, []);

    const initializeChat = () => {
        try {
            const session = createChatSession();
            setChatSession(session);
        } catch (e) {
            console.error("Failed to init chat", e);
        }
    };

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSend = async (manualText?: string) => {
        const textToSend = manualText || input;
        if (!textToSend.trim() || !chatSession) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', text: textToSend.trim(), timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const result = await chatSession.sendMessageStream({ message: textToSend.trim() });

            const botMsgId = (Date.now() + 1).toString();
            // Add placeholder for bot message
            setMessages(prev => [...prev, { id: botMsgId, role: 'model', text: '', timestamp: Date.now() }]);

            for await (const chunk of result) {
                const c = chunk as GenerateContentResponse;
                const text = c.text;
                if (text) {
                    setMessages(prev => prev.map(msg =>
                        msg.id === botMsgId ? { ...msg, text: msg.text + text } : msg
                    ));
                }
            }
        } catch (error: any) {
            console.error("Chat Error:", error);
            const errorMessage = error?.message || "Unknown error";
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'model',
                text: `Connection Error: ${errorMessage}. Ensure GEMINI_API_KEY is set in .env.local`,
                timestamp: Date.now()
            }]);
            initializeChat();
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const capabilities = [
        { icon: Lightbulb, title: "Viral Ideas", desc: "Brainstorm concepts.", prompt: "Give me 5 creative Instagram Reel ideas for a lifestyle brand." },
        { icon: PenTool, title: "Smart Copy", desc: "Write engaging captions.", prompt: "Write a witty caption for a photo of a coffee shop workspace." },
        { icon: TrendingUp, title: "Growth", desc: "Analyze trends.", prompt: "What are the current trending audio tracks for reels?" },
        { icon: Compass, title: "Guide Me", desc: "App help.", prompt: "How do I use the Scheduler feature?" },
    ];

    return (
        <div className="h-[calc(100vh-2rem)] relative flex flex-col overflow-hidden rounded-3xl shadow-2xl transition-all duration-300 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white/20 dark:border-slate-700/30">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-red-500/10 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 p-5 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-700/50 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-red-500 to-red-700 rounded-2xl blur opacity-40 group-hover:opacity-60 transition-opacity" />
                        <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-500 to-red-700 flex items-center justify-center text-white shadow-lg">
                            <Sparkles className="w-6 h-6 animate-pulse" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300">
                            AI Intelligence
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-700/50">
                                Gemini 2.0 Flash
                            </span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => { setMessages([]); initializeChat(); setMessages([{ id: Date.now().toString(), role: 'model', text: 'Chat refreshed. How can I inspire you today?', timestamp: Date.now() }]); }}
                    className="p-3 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 group"
                    title="Clear Chat History"
                >
                    <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 relative z-0 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                <div className="max-w-4xl mx-auto flex flex-col space-y-6">
                    {messages.map((msg, index) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className={`flex items-end gap-3 max-w-[90%] md:max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                {/* Avatar */}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm
                                    ${msg.role === 'user'
                                        ? 'bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600'
                                        : 'bg-gradient-to-br from-red-500 to-red-700'}`}>
                                    {msg.role === 'user'
                                        ? <User className="w-4 h-4 text-slate-600 dark:text-slate-200" />
                                        : <Bot className="w-4 h-4 text-white" />}
                                </div>

                                {/* Bubble */}
                                <div className={`px-6 py-4 rounded-2xl text-[15px] md:text-base leading-relaxed shadow-sm backdrop-blur-sm
                                    ${msg.role === 'user'
                                        ? 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-100 rounded-br-sm border border-slate-100 dark:border-slate-700/50'
                                        : 'bg-red-600 text-white rounded-bl-none shadow-red-500/20'}`}>
                                    <div className="whitespace-pre-wrap">{msg.text}</div>
                                    {msg.role === 'model' && msg.text === '' && (
                                        <div className="flex items-center gap-1 h-5">
                                            <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                            <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                            <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce"></span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Welcome / Capabilities */}
                    {messages.length === 1 && (
                        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                            {capabilities.map((cap, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSend(cap.prompt)}
                                    className="col-span-1 flex flex-col gap-3 p-4 text-left bg-white/40 dark:bg-slate-800/40 border border-white/40 dark:border-slate-700/40 rounded-2xl hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all hover:-translate-y-1 duration-200 group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <cap.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">{cap.title}</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">{cap.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="p-5 md:p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200/60 dark:border-slate-700/60 z-10">
                <div className="max-w-4xl mx-auto flex items-end gap-4 relative">
                    <div className={`flex-1 relative rounded-3xl transition-all duration-300 ${isFocused ? 'shadow-lg ring-2 ring-red-500/20' : 'shadow-sm'}`}>
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            placeholder="Ask me anything..."
                            className="w-full pl-6 pr-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl focus:border-red-500 focus:outline-none transition-all resize-none text-slate-800 dark:text-white placeholder:text-slate-400 text-base min-h-[60px] max-h-40 shadow-inner"
                            rows={1}
                            style={{ height: 'auto', minHeight: '60px' }}
                        />
                        <div className="absolute right-3 bottom-3 flex gap-2">
                            {/* Placeholder for future attachments/features */}
                        </div>
                    </div>

                    <button
                        onClick={() => handleSend()}
                        disabled={isLoading || !input.trim()}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg
                            ${isLoading || !input.trim()
                                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 shadow-none cursor-not-allowed'
                                : 'bg-gradient-to-r from-red-500 to-red-700 text-white hover:shadow-red-500/30 hover:scale-105 active:scale-95'}`}
                    >
                        {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6 ml-0.5" />}
                    </button>
                </div>
                <div className="text-center mt-3">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-600">
                        AI can make mistakes. Verify important info.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ChatBot;
