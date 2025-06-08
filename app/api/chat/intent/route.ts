import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Hardcoded list of available features for intent detection
const AVAILABLE_FEATURES = [
  "general chat",
  "semantic search",
  "file selection"
];

const SYSTEM_PROMPT = `You are an intent classifier for a chat assistant. Classify the user's message as one of the following options: ${AVAILABLE_FEATURES.join(", ")}. Respond with only the label.`;

export async function POST(request: NextRequest) {
  const { message } = await request.json();

  if (!message) {
    return NextResponse.json({ error: "No message provided." }, { status: 400 });
  }

  // You may want to use a different model or API key here
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo", // or your preferred model
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
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
