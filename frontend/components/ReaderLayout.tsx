"use client";

import { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { MessageSquare } from "lucide-react";

const BookViewer = dynamic(
    () => import("./BookViewer").then((mod) => mod.BookViewer),
    { ssr: false }
);

import { ChatPanel } from "./ChatPanel";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";

export function ReaderLayout() {
    const chatPanelRef = useRef<any>(null);

    const [chatOpen, setChatOpen] = useState(true);

    // queue message if chat is closed
    const [pendingMessage, setPendingMessage] = useState<any>(null);

    const handleSendMessage = (
        message: string,
        selectedText?: string,
        page?: number
    ) => {

        if (!chatOpen) {
            setPendingMessage({ message, selectedText, page });
            setChatOpen(true);
            return;
        }

        chatPanelRef.current?.sendMessage(message, selectedText, page);
    };

    // send queued message after chat opens
    useEffect(() => {
        if (chatOpen && pendingMessage && chatPanelRef.current) {
            chatPanelRef.current.sendMessage(
                pendingMessage.message,
                pendingMessage.selectedText,
                pendingMessage.page
            );
            setPendingMessage(null);
        }
    }, [chatOpen, pendingMessage]);

    return (
        <>
            <ResizablePanelGroup direction="horizontal" className="h-screen w-screen">

                {/* BOOK VIEWER */}

                <ResizablePanel defaultSize={chatOpen ? 70 : 100} minSize={40}>
                    <BookViewer
                        onOpenChat={() => setChatOpen(true)}
                        onSendMessage={handleSendMessage}
                    />
                </ResizablePanel>

                {/* CHAT PANEL */}

                {chatOpen && (
                    <>
                        <ResizableHandle />

                        <ResizablePanel defaultSize={30} minSize={25}>
                            <ChatPanel
                                ref={chatPanelRef}
                                onClose={() => setChatOpen(false)}
                            />
                        </ResizablePanel>
                    </>
                )}
            </ResizablePanelGroup>

            {/* FLOATING CHAT BUTTON */}

            {!chatOpen && (
                <button
                    onClick={() => setChatOpen(true)}
                    className="
          fixed bottom-6 right-6
          w-12 h-12
          rounded-full
          bg-neutral-900
          border border-neutral-700
          text-neutral-300
          flex items-center justify-center
          shadow-lg backdrop-blur
          hover:bg-neutral-800
          hover:text-white
          hover:scale-105
          hover:shadow-[0_0_12px_rgba(255,255,255,0.1)]
          transition-all duration-200
          "
                >
                    <MessageSquare className="w-5 h-5" />
                </button>
            )}
        </>
    );
}