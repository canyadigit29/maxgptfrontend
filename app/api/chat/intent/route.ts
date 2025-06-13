import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Hardcoded list of available features for intent detection
const AVAILABLE_FEATURES = [
  "general chat",
  "semantic search",
  "follow-up",
  "run ingestion",
  "file retrieval" // NEW: Add file retrieval intent
];

const SYSTEM_PROMPT = `You are an intent classifier for a chat assistant. Classify the user's message as one of the following options: ${AVAILABLE_FEATURES.join(", ")}. Respond with only the label.`;

export async function POST(request: NextRequest) {
  const { message, previousSummary } = await request.json();

  if (!message) {
    return NextResponse.json({ error: "No message provided." }, { status: 400 });
  }

  // Compose a system prompt that includes previous summary if present
  let systemPrompt = SYSTEM_PROMPT;
  if (previousSummary) {
    systemPrompt = `You are an intent classifier for a chat assistant. Given the previous search summary and the user's new message, classify the user's message as one of the following options: ${AVAILABLE_FEATURES.join(", ")}. Respond with only the label.\n\nPrevious search summary: ${previousSummary}\nUser message: ${message}`;
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo", // or your preferred model
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: message }
    ],
    max_tokens: 10,
    temperature: 0
  });

  const intent = completion.choices[0]?.message?.content?.trim().toLowerCase();

  if (!intent || !AVAILABLE_FEATURES.includes(intent)) {
    return NextResponse.json({ error: "Intent not recognized.", intent }, { status: 200 });
  }

  return NextResponse.json({ intent });
}
