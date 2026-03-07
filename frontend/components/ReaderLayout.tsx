"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";

const BookViewer = dynamic(
    () => import("./BookViewer").then(mod => mod.BookViewer),
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

    const handleSendMessage = (
        message: string,
        selectedText?: string,
        page?: number
    ) => {
        chatPanelRef.current?.sendMessage(message, selectedText, page);
    };

    return (
        <ResizablePanelGroup direction="horizontal" className="h-screen w-screen">

            <ResizablePanel defaultSize={70} minSize={40}>
                <BookViewer
                    onOpenChat={() => { }}
                    onSendMessage={handleSendMessage}
                />
            </ResizablePanel>

            <ResizableHandle />

            <ResizablePanel defaultSize={30} minSize={25}>
                <ChatPanel ref={chatPanelRef} onClose={() => { }} />
            </ResizablePanel>

        </ResizablePanelGroup>
    );
}