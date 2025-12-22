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
    const { message, currentSchedule } = await req.json();

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
    });

    // ---------- 1️⃣ INTENT DETECTION ----------
    const intentRes = await model.generateContent(
      `${INTENT_PROMPT}\n\nUSER_MESSAGE:\n"${message}"`
    );

    const { intent } = JSON.parse(intentRes.response.text());

    // ---------- 2️⃣ NORMAL CHAT ----------
    if (intent === "chat") {
      const chatRes = await model.generateContent(message);

      return NextResponse.json({
        type: "chat",
        reply: chatRes.response.text(),
      });
    }

    // ---------- 3️⃣ SCHEDULE MODIFICATION ----------
    const scheduleRes = await model.generateContent(`
${SCHEDULER_PROMPT}

CURRENT_SCHEDULE:
${JSON.stringify(currentSchedule, null, 2)}

USER_MESSAGE:
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
