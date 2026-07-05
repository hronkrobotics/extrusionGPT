"use client";

import { useState } from "react";
import { useStudio } from "@/lib/store";
import { requestPlan } from "@/lib/planner-client";

interface Message {
  role: "user" | "assistant";
  text: string;
  notes?: string[];
}

const EXAMPLES = [
  "Build me a 1200 x 600 workbench with a lower shelf",
  "Design a mobile electronics cart, 900mm tall",
  "Heavy-duty 2m bench on casters with two shelves",
];

export function ChatPanel() {
  const document = useStudio((s) => s.document);
  const loadDocument = useStudio((s) => s.loadDocument);
  const planning = useStudio((s) => s.planning);
  const setPlanning = useStudio((s) => s.setPlanning);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  async function submit(prompt: string) {
    const trimmed = prompt.trim();
    if (!trimmed || planning) return;
    setText("");
    setMessages((m) => [...m, { role: "user", text: trimmed }]);
    setPlanning(true);
    try {
      const res = await requestPlan(trimmed, document);
      if (res.ok) {
        loadDocument(res.document, res.assumptions);
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            text: res.usedLlm
              ? "Updated the design from your request."
              : "Interpreted with the built-in parser (no OpenAI key set).",
            notes: res.assumptions,
          },
        ]);
      } else {
        setMessages((m) => [...m, { role: "assistant", text: res.clarify }]);
      }
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: err instanceof Error ? err.message : "Something went wrong." },
      ]);
    } finally {
      setPlanning(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="scroll-slim flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-xs leading-relaxed text-slate-500">
              Describe the workbench you want in plain language. Try:
            </p>
            <div className="space-y-2">
              {EXAMPLES.map((e) => (
                <button
                  key={e}
                  onClick={() => submit(e)}
                  className="w-full rounded-md border border-ink-600 bg-ink-700/60 px-3 py-2 text-left text-xs text-slate-300 transition hover:border-accent hover:text-accent-soft"
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                m.role === "user"
                  ? "bg-accent/15 text-accent-soft"
                  : "bg-ink-700 text-slate-300"
              }`}
            >
              <div>{m.text}</div>
              {m.notes && m.notes.length > 0 && (
                <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-[11px] text-slate-500">
                  {m.notes.map((n, j) => (
                    <li key={j}>{n}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
        {planning && <div className="text-xs text-slate-500">Thinking...</div>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit(text);
        }}
        className="border-t border-ink-600 p-3"
      >
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void submit(text);
              }
            }}
            rows={2}
            placeholder="Describe your workbench..."
            className="scroll-slim flex-1 resize-none rounded-md border border-ink-500 bg-ink-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            disabled={planning || !text.trim()}
            className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-ink-900 transition disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
