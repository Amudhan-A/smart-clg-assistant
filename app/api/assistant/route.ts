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

Example task object:
{
  "task": "Study",
  "start": "18:00",
  "end": "20:00",
  "priority": "high"
}


Rules:
- Every task MUST include a priority: high, medium, or low
- Assign priority based on importance, urgency, and consequences
- Studying, exams, deadlines, and academic work are typically high priority
- Practice, gym, skill-building are typically medium priority
- Leisure and rest are typically low priority
- Use your judgment — do not guess randomly
- Be consistent across the schedule
- Return the FULL updated schedule
`;

function overlaps(a: any, b: any) {
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  return toMin(a.start) < toMin(b.end) && toMin(b.start) < toMin(a.end);
}


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

  const rawSchedule = JSON.parse(
    scheduleRes.response.text().replace(/```json|```/g, "").trim()
  );

  for (const day of Object.keys(rawSchedule.days)) {
    rawSchedule.days[day] = rawSchedule.days[day].map((b: any) => {
      if (!["high", "medium", "low"].includes(b.priority)) {
        throw new Error("Invalid priority returned by model");
      }
      return b;
    });
  }


  const conflicts = [];

  


  for (const day of Object.keys(currentSchedule.days)) {
    const oldDayBlocks = currentSchedule.days[day] ?? [];
    const newDayBlocks = rawSchedule.days?.[day] ?? [];

    for (const oldB of oldDayBlocks) {
      for (const newB of newDayBlocks) {
        const oldPriority = oldB.priority ?? "high";

        if (
          overlaps(oldB, newB) &&
          oldPriority === "high" &&
          newB.priority !== "high"
        ) {
          conflicts.push({ day, old: oldB, new: newB });
        }
      }
    }
  }



  if (conflicts.length > 0) {
    return NextResponse.json({
      type: "confirmation",
      message:
        "This change replaces a high-priority task with a lower-priority one. Are you sure?",
      pendingSchedule: rawSchedule,
      conflicts,
    });
  }

  return NextResponse.json({
    type: "schedule",
    reply: JSON.stringify(rawSchedule),
  });





  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Gemini failed" },
      { status: 500 }
    );
  }
}
