'use client';

import WeeklySchedule from "@/components/WeeklySchedule";
import { useEffect, useState } from 'react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState<any | null>(null);

  // ---------- INIT SCHEDULE ----------
  useEffect(() => {
    if (!schedule) {
      setSchedule({
        userId: "u1",
        weekStart: "2025-02-10",
        timezone: "Asia/Kolkata",
        days: {
          Monday: [],
          Tuesday: [],
          Wednesday: [],
          Thursday: [],
          Friday: [],
          Saturday: [],
          Sunday: [],
        },
        meta: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1,
        },
      });
    }
  }, [schedule]);

  const sendMessage = async () => {
    if (!input.trim() || !schedule) return;

    const userText = input;
    setInput('');
    setLoading(true);

    const updatedMessages: Message[] = [
      ...messages,
      { role: 'user', content: userText },
    ];


    setMessages(updatedMessages);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          messages: updatedMessages, // ✅ MEMORY
          currentSchedule: schedule,
        }),
      });

      const data = await res.json();

      if (data.type === "chat") {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: data.reply },
        ]);
      }

      if (data.type === "schedule") {
        try {
          const updatedSchedule = JSON.parse(data.reply);
          setSchedule(updatedSchedule);

          setMessages(prev => [
            ...prev,
            { role: 'assistant', content: "✅ Schedule updated" },
          ]);
        } catch {
          setMessages(prev => [
            ...prev,
            { role: 'assistant', content: "⚠️ Failed to update schedule" },
          ]);
        }
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">AI Assistant</h1>

      <div className="border rounded-lg p-4 h-[400px] overflow-y-auto bg-white mb-4">
        {messages.length === 0 && (
          <p className="text-gray-400">Start chatting or planning…</p>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`mb-3 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
          >
            <span
              className={`inline-block px-4 py-2 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {msg.content}
            </span>
          </div>
        ))}

        {loading && <p className="text-sm text-gray-400">Thinking…</p>}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Say hi or change your schedule…"
          className="flex-1 border rounded-lg px-4 py-2"
        />
        <button
          onClick={sendMessage}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg"
        >
          Send
        </button>
      </div>

      {schedule && <WeeklySchedule schedule={schedule} />}
    </div>
  );
}
