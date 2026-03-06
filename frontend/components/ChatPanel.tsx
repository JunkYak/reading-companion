"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Send, X } from "lucide-react";

interface Message {
    role: "user" | "ai";
    content: string;
}

export function ChatPanel({ onClose }: { onClose: () => void }) {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "ai",
            content:
                "Hello! I'm your reading companion. Highlight text to ask questions, or just ask away.",
        },
    ]);

    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const bottomRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setInput("");

        setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
        setLoading(true);

        try {
            const response = await api.askQuestion(userMsg);

            setMessages((prev) => [
                ...prev,
                {
                    role: "ai",
                    content:
                        response.answer || "Sorry, I couldn't understand that.",
                },
            ]);
        } catch (error) {
            console.error(error);
            setMessages((prev) => [
                ...prev,
                { role: "ai", content: "Failed to connect to backend." },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-background min-h-0">

            {/* HEADER */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 shrink-0">
                <h3 className="text-sm font-medium tracking-wide">Assistant</h3>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full"
                    onClick={onClose}
                >
                    <X className="w-4 h-4" />
                </Button>
            </div>

            {/* MESSAGE AREA */}
            <div className="flex-1 min-h-0 px-4 py-4 overflow-y-auto">
                <div className="flex flex-col space-y-6 w-full pb-4">

                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex flex-col max-w-[90%] text-sm ${msg.role === "user"
                                ? "self-end items-end"
                                : "self-start items-start"
                                }`}
                        >
                            <span className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider px-1">
                                {msg.role === "user" ? "You" : "AI"}
                            </span>

                            <div
                                className={`px-4 py-2.5 rounded-2xl break-words ${msg.role === "user"
                                    ? "bg-primary text-primary-foreground rounded-br-sm"
                                    : "bg-muted text-foreground rounded-bl-sm"
                                    }`}
                            >
                                {msg.content}
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="self-start flex flex-col max-w-[85%] text-sm">
                            <span className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider px-1">
                                AI
                            </span>
                            <div className="px-4 py-2.5 rounded-2xl bg-muted text-foreground rounded-bl-sm flex space-x-1.5 items-center justify-center">
                                <div className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce" />
                                <div className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce [animation-delay:0.2s]" />
                                <div className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                        </div>
                    )}

                    {/* AUTOSCROLL ANCHOR */}
                    <div ref={bottomRef} />

                </div>
            </div>

            {/* INPUT */}
            <div className="p-3 border-t border-border/50 shrink-0">
                <div className="relative flex items-center">

                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="Ask a question..."
                        className="w-full min-h-[44px] max-h-32 bg-muted/30 border border-border/50 rounded-xl px-4 py-3 text-sm resize-none"
                        rows={1}
                    />

                    <Button
                        size="icon"
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                        className="absolute right-1.5 bottom-1.5 h-8 w-8 rounded-lg"
                    >
                        <Send className="w-4 h-4 ml-0.5" />
                    </Button>

                </div>

                <div className="text-center mt-2">
                    <span className="text-[10px] text-muted-foreground/60">
                        Press Enter ⏎ to send
                    </span>
                </div>

            </div>
        </div>
    );
}