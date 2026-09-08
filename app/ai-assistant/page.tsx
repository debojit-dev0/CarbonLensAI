"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Send, BrainCircuit } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { ChatMessage, Workload } from "@/types";

export default function AiAssistantPage() {
  const [workloads, setWorkloads] = useState<Workload[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Ask me about any tracked workload — e.g. \"How can I reduce the carbon impact of my LLM training workload?\"",
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [mode, setMode] = useState<"nvidia" | "fallback" | "lookup" | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/workloads")
      .then((r) => r.json())
      .then((d) => {
        setWorkloads(d.workloads);
        if (d.workloads[0]) setSelectedId(d.workloads[0].id);
      });
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const send = async () => {
    const question = input.trim();
    if (!question || !selectedId || thinking) return;
    setMessages((m) => [...m, { role: "user", content: question }]);
    setInput("");
    setThinking(true);

    try {
      const res = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workloadId: selectedId, question }),
      });
      const data = await res.json();
      setMode(data.mode ?? "fallback");
      setMessages((m) => [...m, { role: "assistant", content: data.text ?? "No response." }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "The recommendation service is unavailable right now. Please try again." },
      ]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <PageHeader
        title="CarbonLens AI Assistant"
        subtitle="Powered by NVIDIA AI / NIM"
        right={
          <div
            className={clsx(
              "flex items-center gap-1.5 px-2.5 py-1 rounded border text-[10px] font-mono tracking-wider",
              mode === "nvidia"
                ? "border-primary/30 bg-primary/5 text-primary"
                : mode === "lookup"
                ? "border-secondary/30 bg-secondary/5 text-secondary"
                : "border-warning/30 bg-warning/5 text-warning"
            )}
          >
            <BrainCircuit size={11} />
            AI MODE · {mode === "nvidia" ? "NVIDIA AI" : mode === "lookup" ? "LIVE DATA LOOKUP" : "DEMO FALLBACK"}
          </div>
        }
      />

      <div className="px-8 pt-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[10px] tracking-[0.14em] text-text-2 mr-1">CONTEXT</span>
          {workloads.map((w) => (
            <button
              key={w.id}
              onClick={() => setSelectedId(w.id)}
              className={clsx(
                "px-3 py-1.5 rounded text-xs font-mono border transition-colors",
                selectedId === w.id
                  ? "bg-primary/10 border-primary/40 text-primary"
                  : "border-white/10 text-text-2 hover:text-text-0 hover:border-white/25"
              )}
            >
              {w.name}
            </button>
          ))}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-8 py-6 space-y-4">
        {messages.map((m, i) => (
          <Bubble key={i} message={m} />
        ))}
        {thinking && (
          <div className="flex items-center gap-1.5 pl-1">
            <span className="h-1.5 w-1.5 rounded-full bg-primary typing-dot" style={{ animationDelay: "0ms" }} />
            <span className="h-1.5 w-1.5 rounded-full bg-primary typing-dot" style={{ animationDelay: "150ms" }} />
            <span className="h-1.5 w-1.5 rounded-full bg-primary typing-dot" style={{ animationDelay: "300ms" }} />
          </div>
        )}
      </div>

      <div className="px-8 py-5 border-t border-white/10">
        <div className="flex items-center gap-2 glass-panel rounded-lg px-4 py-2.5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask about carbon optimization for the selected workload…"
            className="flex-1 bg-transparent outline-none text-sm text-text-0 placeholder:text-text-2"
          />
          <button
            onClick={send}
            disabled={thinking || !input.trim()}
            className="text-primary disabled:text-text-2 transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={clsx("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={clsx(
          "max-w-[70%] rounded-lg px-4 py-3 text-sm whitespace-pre-line leading-relaxed",
          isUser
            ? "bg-secondary/10 border border-secondary/25 text-text-0"
            : "glass-panel text-text-0"
        )}
      >
        {message.content}
      </div>
    </div>
  );
}
