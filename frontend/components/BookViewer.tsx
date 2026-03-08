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



    const pdfUrl = api.getPdfUrl();

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

            {/* FLOATING ZOOM CONTROLLER */}

            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">

                <div className="pointer-events-auto flex items-center gap-4 px-4 py-2 rounded-full
                        bg-black/40 backdrop-blur-md border border-white/10
                        shadow-lg transition hover:bg-black/60">

                    <button
                        className="text-white text-lg px-2 hover:scale-110 transition"
                        onClick={() => setScale((s) => Math.max(0.6, s - 0.1))}
                    >
                        −
                    </button>

                    <div className="text-xs text-gray-300 w-10 text-center">
                        {(scale * 100).toFixed(0)}%
                    </div>

                    <button
                        className="text-white text-lg px-2 hover:scale-110 transition"
                        onClick={() => setScale((s) => Math.min(2.5, s + 0.1))}
                    >
                        +
                    </button>

                </div>
            </div>

        </div>
    );
}