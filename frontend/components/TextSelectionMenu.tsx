"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, HelpCircle, AlignLeft, Send } from "lucide-react";

interface TextSelectionMenuProps {
    onAction: (action: "explain" | "ask" | "summarize", text: string) => void;
    containerRef: React.RefObject<HTMLDivElement | null>;
}

export function TextSelectionMenu({ onAction, containerRef }: TextSelectionMenuProps) {
    const [selection, setSelection] = useState<{ text: string; top: number; left: number } | null>(null);
    const [lockedText, setLockedText] = useState<string>("");

    const [askMode, setAskMode] = useState(false);
    const [question, setQuestion] = useState("");

    useEffect(() => {
        const handleMouseUp = () => {
            setTimeout(() => {
                const domSelection = window.getSelection();

                if (!domSelection || domSelection.isCollapsed) return;

                const text = domSelection.toString().trim();
                if (!text) return;

                if (
                    containerRef.current &&
                    domSelection.anchorNode &&
                    !containerRef.current.contains(domSelection.anchorNode)
                ) {
                    return;
                }

                const range = domSelection.getRangeAt(0);
                const rect = range.getBoundingClientRect();

                setLockedText(text);

                setSelection({
                    text,
                    top: rect.top - 60,
                    left: rect.left + rect.width / 2,
                });

            }, 150);
        };

        const handleMouseDown = (e: MouseEvent) => {
            const target = e.target as HTMLElement;

            if (target.closest(".floating-selection-menu")) return;

            setSelection(null);
            setAskMode(false);
            setQuestion("");
        };

        document.addEventListener("mouseup", handleMouseUp);
        document.addEventListener("mousedown", handleMouseDown);

        return () => {
            document.removeEventListener("mouseup", handleMouseUp);
            document.removeEventListener("mousedown", handleMouseDown);
        };
    }, [containerRef]);

    if (!selection) return null;

    /* ASK MODE */

    if (askMode) {
        return (
            <div
                className="floating-selection-menu fixed z-50 bg-popover text-popover-foreground border border-border shadow-md rounded-md p-2 flex items-center space-x-2 transform -translate-x-1/2"
                style={{ top: selection.top, left: selection.left }}
            >
                <input
                    className="text-sm px-2 py-1 border rounded bg-background outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Ask about this..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && question.trim()) {
                            onAction("ask", `${lockedText}\n\nQuestion: ${question}`);

                            setSelection(null);
                            setAskMode(false);
                            setQuestion("");
                        }
                    }}
                    autoFocus
                />

                <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                        if (!question.trim()) return;

                        onAction("ask", `${lockedText}\n\nQuestion: ${question}`);

                        setSelection(null);
                        setAskMode(false);
                        setQuestion("");
                    }}
                >
                    <Send className="w-4 h-4" />
                </Button>
            </div>
        );
    }

    /* NORMAL MENU */

    return (
        <div
            className="floating-selection-menu fixed z-50 flex items-center space-x-1 bg-popover text-popover-foreground border border-border shadow-md rounded-md p-1 transform -translate-x-1/2 transition-opacity"
            style={{ top: selection.top, left: selection.left }}
        >
            <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs flex items-center gap-1.5"
                onClick={() => onAction("explain", lockedText)}
            >
                <HelpCircle className="w-3.5 h-3.5" /> Explain
            </Button>

            <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs flex items-center gap-1.5"
                onClick={() => setAskMode(true)}
            >
                <MessageSquare className="w-3.5 h-3.5" /> Ask AI
            </Button>

            <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs flex items-center gap-1.5"
                onClick={() => onAction("summarize", lockedText)}
            >
                <AlignLeft className="w-3.5 h-3.5" /> Summarize
            </Button>
        </div>
    );
}