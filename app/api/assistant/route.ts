import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ---------- INTENT CLASSIFIER ----------
const INTENT_PROMPT = `
Classify the user message.

Return ONLY valid JSON:
{
  "intent": "chat" | "schedule"
}

Rules:
- Greetings, questions, casual talk → "chat"
- Add / move / remove / reschedule tasks → "schedule"
`;

// ---------- SCHEDULER PROMPT ----------
const SCHEDULER_PROMPT = `
You are an AI scheduling agent.

Return ONLY valid JSON (no text, no markdown).

Rules:
- Modify the schedule ONLY if the user requests a change
- Do NOT change userId, weekStart, timezone, meta
- Do NOT delete days
- Return the FULL updated schedule
`;

export async function POST(req: Request) {
  try {
    const { message, messages, currentSchedule } = await req.json();

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
    });

    // ---------- BUILD MEMORY ----------
    const chatHistory = messages
      .map((m: any) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n");

    // ---------- 1️⃣ INTENT ----------
    const intentRes = await model.generateContent(`
${INTENT_PROMPT}

CONVERSATION:
${chatHistory}

LAST_MESSAGE:
"${message}"
`);

    const { intent } = JSON.parse(intentRes.response.text().replace(/```json|```/g, "").trim());

    // ---------- 2️⃣ CHAT ----------
    if (intent === "chat") {
      const chatRes = await model.generateContent(`
You are a helpful AI assistant.
Continue the conversation naturally.

The user has the following weekly schedule:
${JSON.stringify(currentSchedule, null, 2)}

Use it ONLY if relevant.

Conversation so far:  
${chatHistory}

ASSISTANT:
`);

      return NextResponse.json({
        type: "chat",
        reply: chatRes.response.text(),
      });
    }

    // ---------- 3️⃣ SCHEDULE ----------
    const scheduleRes = await model.generateContent(`
${SCHEDULER_PROMPT}

CONVERSATION:
${chatHistory}

CURRENT_SCHEDULE:
${JSON.stringify(currentSchedule, null, 2)}

USER_REQUEST:
"${message}"
`);

    return NextResponse.json({
      type: "schedule",
      reply: scheduleRes.response.text(),
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Gemini failed" },
      { status: 500 }
    );
  }
}
