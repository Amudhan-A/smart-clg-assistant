'use client';

import WeeklySchedule from "@/components/WeeklySchedule";
import { useEffect, useState } from 'react';
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/src/lib/firebase";

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

function normalizeSchedule(schedule: any) {
  if (!schedule?.days) return schedule;

  const fixedDays: any = {};

  for (const day of Object.keys(schedule.days)) {
    fixedDays[day] = schedule.days[day].map((block: any) => ({
      task: block.task ?? block.title ?? block.name ?? "Untitled task",
      start: block.start ?? "",
      end: block.end ?? "",
    }));
  }

  return {
    ...schedule,
    days: fixedDays,
  };
}


export default function AssistantPage() {
  const { user, loading: authLoading } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState<any | null>(null);

  // ✅ ALWAYS call hooks first
  useEffect(() => {
    if (!user) return;

    const loadSchedule = async () => {
      const ref = doc(db, "users", user.uid, "schedule", "weekly");
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setSchedule(normalizeSchedule(snap.data()));
      } else {
        const emptySchedule = {
          weekStart: new Date().toISOString().slice(0, 10),
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
        };

        await setDoc(ref, emptySchedule);
        setSchedule(emptySchedule);
      }
    };

    loadSchedule();
  }, [user]);

  // ---------- AUTH GUARDS (AFTER HOOKS) ----------
  if (authLoading) {
    return <p>Checking authentication...</p>;
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold">Sign in required</h1>
        <p className="text-gray-600 mt-2">
          Please log in to use the AI assistant.
        </p>
      </div>
    );
  }

  // ---------- SEND MESSAGE ----------
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
        headers: { 
          'Content-Type': 'application/json',
         },
        body: JSON.stringify({
          message: userText,
          messages: updatedMessages,
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
        const rawSchedule = JSON.parse(data.reply);
        const normalizedSchedule = normalizeSchedule(rawSchedule);

        setSchedule(normalizedSchedule);

        await setDoc(
          doc(db, "users", user.uid, "schedule", "weekly"),
          normalizedSchedule,
          { merge: true }
        );

        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: "✅ Schedule updated" },
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ---------- UI ----------
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
