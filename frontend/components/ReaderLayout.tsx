"use client";

import { BookViewer } from "./BookViewer";
import { ChatPanel } from "./ChatPanel";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";

export function ReaderLayout() {
    return (
        <ResizablePanelGroup
            direction="horizontal"
            className="h-screen w-screen"
        >
            <ResizablePanel defaultSize={70} minSize={40}>
                <BookViewer onOpenChat={() => { }} />
            </ResizablePanel>

            <ResizableHandle />

            <ResizablePanel defaultSize={30} minSize={25}>
                <ChatPanel onClose={() => { }} />
            </ResizablePanel>
        </ResizablePanelGroup>
    );
}