"use client";

import { UploadBook } from "@/components/UploadBook";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex flex-col justify-center bg-background text-foreground">
      <UploadBook onUploadSuccess={() => router.push("/reader")} />
    </main>
  );
}
