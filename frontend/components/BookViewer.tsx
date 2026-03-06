"use client";

import { useEffect, useRef, useState } from "react";
import { TextSelectionMenu } from "./TextSelectionMenu";
import { api } from "@/lib/api";

interface BookViewerProps {
    onOpenChat: () => void;
}

export function BookViewer({ onOpenChat }: BookViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pages] = useState(Array.from({ length: 15 }, (_, i) => ({
        pageNumber: i + 1,
        content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.\n\nSed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.",
    })));

    const handleAction = async (action: "explain" | "ask" | "summarize", text: string) => {
        onOpenChat();
        // Pre-fill the chat or automatically send a message based on the action
        // In a real implementation this would pass the context to the chat interface
        let query = "";
        if (action === "explain") query = `Please explain this text: "${text}"`;
        if (action === "ask") query = `I have a question about this text: "${text}"`;
        if (action === "summarize") query = `Please summarize this text: "${text}"`;

        // Simulate sending the context to the backend
        try {
            await api.askQuestion(query, text, currentPage);
        } catch (e) {
            console.error(e);
        }
    };

    const handleScroll = () => {
        if (!containerRef.current) return;

        // Simple logic to determine current page based on scroll position
        const pageElements = containerRef.current.querySelectorAll('[data-page]');
        let current = 1;

        pageElements.forEach((el) => {
            const rect = el.getBoundingClientRect();
            if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
                current = parseInt(el.getAttribute('data-page') || "1");
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
