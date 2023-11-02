"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Page() {
  const router = useRouter();
  const [name, setName] = useState("");
  return (
    <main>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button onClick={() => router.push(`/chat?name=${name}`)}>
        Start chat
      </button>
    </main>
  );
}
