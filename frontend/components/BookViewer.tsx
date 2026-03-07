"use client";

import { useRef, useState } from "react";
import { TextSelectionMenu } from "./TextSelectionMenu";
import { api } from "@/lib/api";

import { Document, Page, pdfjs } from "react-pdf";

/* REQUIRED CSS */
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

/* Worker */
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
).toString();

interface BookViewerProps {
    onOpenChat: () => void;
    onSendMessage: (message: string, selectedText?: string, page?: number) => void;
}

export function BookViewer({ onOpenChat, onSendMessage }: BookViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    const [numPages, setNumPages] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    /* zoom state */
    const [scale, setScale] = useState<number>(1.2);

    const pdfUrl = "http://localhost:8001/pdf";

    const handleAction = (
        action: "explain" | "ask" | "summarize",
        text: string
    ) => {
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

        onSendMessage?.(query, text, currentPage);
    };

    const handleScroll = () => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const middle = container.clientHeight / 2;

        const pageElements = container.querySelectorAll("[data-page]");

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
            className="h-full w-full overflow-y-auto bg-black flex justify-center"
            onScroll={handleScroll}
            ref={containerRef}
        >
            <TextSelectionMenu
                onAction={handleAction}
                containerRef={containerRef}
            />

            <div className="w-full max-w-[850px] mx-auto px-8 py-16 pb-32">

                {/* Zoom Controls */}
                <div className="flex justify-center gap-3 mb-10">
                    <button
                        className="px-3 py-1 bg-neutral-800 text-white rounded"
                        onClick={() => setScale((s) => Math.max(0.6, s - 0.1))}
                    >
                        −
                    </button>

                    <div className="text-sm text-neutral-400">
                        {(scale * 100).toFixed(0)}%
                    </div>

                    <button
                        className="px-3 py-1 bg-neutral-800 text-white rounded"
                        onClick={() => setScale((s) => Math.min(2.5, s + 0.1))}
                    >
                        +
                    </button>
                </div>

                <Document
                    file={pdfUrl}
                    loading={<div className="text-center text-white">Loading book...</div>}
                    onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                    onLoadError={(error) => {
                        console.error("PDF LOAD ERROR:", error);
                    }}
                >
                    {Array.from(new Array(numPages || 0), (_, index) => (
                        <div
                            key={index}
                            data-page={index + 1}
                            className="mb-16 flex flex-col items-center"
                        >
                            {/* Page number */}
                            <div className="text-xs text-gray-500 mb-3">
                                Page {index + 1}
                            </div>

                            <Page
                                pageNumber={index + 1}
                                scale={scale}
                                renderTextLayer
                                renderAnnotationLayer={false}
                            />
                        </div>
                    ))}
                </Document>

            </div>
        </div>
    );
}