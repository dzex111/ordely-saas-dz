"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

function extractToken(input: string): string | null {
  const s = input.trim();
  if (/^[0-9a-f]{64}$/i.test(s)) return s.toLowerCase();
  const m = s.match(/\/invite\/([0-9a-f]{64})/i);
  return m ? m[1].toLowerCase() : null;
}

export function JoinTeamForm() {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const token = extractToken(value);
        if (!token) {
          setError("Lien d’invitation invalide. Collez le lien complet reçu.");
          return;
        }
        router.push(`/invite/${token}`);
      }}
      className="mt-4 space-y-3"
    >
      <input
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setError("");
        }}
        placeholder="Collez le lien d’invitation…"
        className="db-input"
        dir="ltr"
      />
      {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}
      <button type="submit" className="db-btn-secondary w-full">
        Rejoindre <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}
