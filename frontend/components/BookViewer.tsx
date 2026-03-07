"use client";

import { useEffect, useRef, useState } from "react";
import { TextSelectionMenu } from "./TextSelectionMenu";
import { api } from "@/lib/api";

interface BookViewerProps {
    onOpenChat: () => void;
    onSendMessage: (message: string, selectedText?: string, page?: number) => void;
}

export function BookViewer({ onOpenChat, onSendMessage }: BookViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pages, setPages] = useState<any[]>([]);

    useEffect(() => {
        const loadPages = async () => {
            try {
                const data = await api.getPages();
                setPages(data.pages);
            } catch (err) {
                console.error("Failed to load pages", err);
            }
        };

        loadPages();
    }, []);

    const handleAction = (action: "explain" | "ask" | "summarize", text: string) => {
        onOpenChat();

        let query = "";

        if (action === "explain") {
            query = `Explain this passage from the book:\n\n${text}`;
        }

        if (action === "ask") {
            query = `Answer a question about this passage:\n\n${text}`;
        }

        if (action === "summarize") {
            query = `Summarize this passage:\n\n${text}`;
        }

        if (onSendMessage) {
            onSendMessage(query, text, currentPage);
        }
    };

    const handleScroll = () => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const containerRect = container.getBoundingClientRect();
        const middle = containerRect.top + containerRect.height / 2;

        const pageElements = container.querySelectorAll('[data-page]');
        let current = 1;

        pageElements.forEach((el) => {
            const rect = el.getBoundingClientRect();

            if (rect.top <= middle && rect.bottom >= middle) {
                current = parseInt(el.getAttribute("data-page") || "1");
            }
        });

        if (current !== currentPage) {
            setCurrentPage(current);
            api.setPage(current).catch(console.error);
        }
    };

    return (
        <div
            className="h-full w-full overflow-y-auto bg-background text-foreground scroll-smooth flex justify-center"
            onScroll={handleScroll}
            ref={containerRef}
        >
            <TextSelectionMenu onAction={handleAction} containerRef={containerRef} />

            <div className="w-full max-w-[750px] mx-auto px-8 py-16 space-y-12 pb-32">
                {pages.map((page) => (
                    <div key={page.pageNumber} data-page={page.pageNumber} className="group relative">
                        <div className="flex items-center justify-center space-x-4 py-8 select-none opacity-50 transition-opacity group-hover:opacity-100">
                            <div className="h-px bg-border flex-1" />
                            <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
                                Page {page.pageNumber}
                            </span>
                            <div className="h-px bg-border flex-1" />
                        </div>

                        <div className="space-y-6 text-lg leading-relaxed text-foreground/90 font-serif whitespace-pre-wrap">
                            {page.content}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
