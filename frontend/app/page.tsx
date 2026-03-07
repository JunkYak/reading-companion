"use client";

import { useState } from "react";
import { UploadBook } from "@/components/UploadBook";
import { ReaderLayout } from "@/components/ReaderLayout";

export default function Home() {

  const [bookLoaded, setBookLoaded] = useState(false);

  return (
    <>
      {bookLoaded ? (
        <ReaderLayout />
      ) : (
        <UploadBook onUploadSuccess={() => setBookLoaded(true)} />
      )}
    </>
  );
}