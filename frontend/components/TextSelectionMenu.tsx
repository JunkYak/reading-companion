"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, HelpCircle, AlignLeft } from "lucide-react";

interface TextSelectionMenuProps {
    onAction: (action: "explain" | "ask" | "summarize", text: string) => void;
    containerRef: React.RefObject<HTMLDivElement | null>;
}

export function TextSelectionMenu({ onAction, containerRef }: TextSelectionMenuProps) {
    const [selection, setSelection] = useState<{ text: string; top: number; left: number } | null>(null);

    useEffect(() => {
        const handleMouseUp = () => {
            setTimeout(() => {
                const domSelection = window.getSelection();
                if (!domSelection || domSelection.isCollapsed) {
                    return;
                }

                const text = domSelection.toString().trim();
                if (!text) {
                    return;
                }

                if (containerRef.current && domSelection.anchorNode && !containerRef.current.contains(domSelection.anchorNode)) {
                    return;
                }

                const range = domSelection.getRangeAt(0);
                const rect = range.getBoundingClientRect();

                setSelection({
                    text,
                    top: rect.top - 55, // Position slightly higher above selection
                    left: rect.left + rect.width / 2, // Center horizontally
                });
            }, 10); // Small timeout to allow selection to settle
        };

        const handleMouseDown = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest('.floating-selection-menu')) return;
            // Only clear selection if they click outside the menu
            setSelection(null);
        };

        document.addEventListener("mouseup", handleMouseUp);
        document.addEventListener("mousedown", handleMouseDown);

        return () => {
            document.removeEventListener("mouseup", handleMouseUp);
            document.removeEventListener("mousedown", handleMouseDown);
        };
    }, [containerRef]);

    if (!selection) return null;

    return (
        <div
            className="floating-selection-menu fixed z-50 flex items-center space-x-1 bg-popover text-popover-foreground border border-border shadow-md rounded-md p-1 transform -translate-x-1/2 transition-opacity"
            style={{ top: selection.top, left: selection.left }}
        >
            <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs flex items-center gap-1.5"
                onClick={() => onAction("explain", selection.text)}
            >
                <HelpCircle className="w-3.5 h-3.5" /> Explain
            </Button>
            <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs flex items-center gap-1.5"
                onClick={() => onAction("ask", selection.text)}
            >
                <MessageSquare className="w-3.5 h-3.5" /> Ask AI
            </Button>
            <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs flex items-center gap-1.5"
                onClick={() => onAction("summarize", selection.text)}
            >
                <AlignLeft className="w-3.5 h-3.5" /> Summarize
            </Button>
        </div>
    );
}
