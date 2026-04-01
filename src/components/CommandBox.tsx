"use client";

import { useState } from "react";

export default function CommandBox() {
  const [cmd, setCmd] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!cmd.trim()) return;

    setLoading(true);

    try {
      await fetch("/api/commands", {
        method: "POST",
        body: JSON.stringify({ command: cmd }),
      });

      setCmd("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="hocker-panel-pro p-6 space-y-4">
      <h3 className="text-xs text-sky-400 font-black">
        COMMAND INJECTOR
      </h3>

      <input
        value={cmd}
        onChange={(e) => setCmd(e.target.value)}
        className="w-full bg-black/40 p-3 rounded-xl text-sm"
        placeholder="deploy / restart / scan"
      />

      <button
        onClick={send}
        disabled={loading}
        className="w-full bg-sky-500 py-3 rounded-xl"
      >
        {loading ? "EXECUTING..." : "EXECUTE"}
      </button>
    </div>
  );
}