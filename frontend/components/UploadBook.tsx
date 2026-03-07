"use client";

import { useState, useRef } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface UploadBookProps {
    onUploadSuccess: () => void;
}

export function UploadBook({ onUploadSuccess }: UploadBookProps) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");

    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const selectedFile = e.target.files[0];

        if (selectedFile.type !== "application/pdf") {
            setStatus("Please upload a PDF file.");
            return;
        }

        setFile(selectedFile);
        handleUpload(selectedFile);
    };

    const handleUpload = async (fileToUpload: File) => {
        setLoading(true);
        setStatus("Uploading book...");

        try {
            // ✅ send FILE not FormData
            await api.uploadBook(fileToUpload);

            setStatus("Processing book...");

            setTimeout(() => {
                onUploadSuccess();
            }, 800);

        } catch (error) {
            console.error("Upload failed", error);
            setStatus("Upload failed. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">

            <h1 className="text-4xl font-semibold mb-2 text-foreground tracking-tight">
                AI Reading Companion
            </h1>

            <p className="text-muted-foreground mb-8 text-lg">
                Upload a book to begin reading
            </p>

            <div className="flex flex-col items-center gap-6 w-full max-w-sm">

                <label
                    htmlFor="dropzone-file"
                    className="flex flex-col items-center justify-center w-full h-40 rounded-xl border-2 border-dashed border-border cursor-pointer bg-muted/20 hover:bg-muted/50 transition-colors"
                >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 pointer-events-none">

                        {file ? (
                            <>
                                <p className="text-sm text-foreground font-medium">
                                    {file.name}
                                </p>

                                {loading && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {status}
                                    </p>
                                )}
                            </>
                        ) : (
                            <>
                                <svg
                                    className="w-8 h-8 mb-4 text-muted-foreground"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 20 16"
                                >
                                    <path
                                        stroke="currentColor"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5
                    5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0
                    0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                                    />
                                </svg>

                                <p className="mb-2 text-sm text-muted-foreground">
                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                </p>

                                <p className="text-xs text-muted-foreground">
                                    PDF files only (Max. 50MB)
                                </p>
                            </>
                        )}
                    </div>

                    <input
                        id="dropzone-file"
                        ref={inputRef}
                        type="file"
                        className="hidden"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        disabled={loading}
                    />
                </label>

                <Button
                    className="w-full h-12 text-md rounded-lg"
                    onClick={() => inputRef.current?.click()}
                    disabled={loading}
                >
                    {loading ? "Uploading..." : "Upload PDF"}
                </Button>

            </div>
        </div>
    );
}