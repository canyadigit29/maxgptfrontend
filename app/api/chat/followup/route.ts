import { NextRequest, NextResponse } from "next/server";
import { OpenAIStream, StreamingTextResponse } from "ai";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: NextRequest) {
  const { previousSummary, newMessage } = await req.json();

  // System prompt for follow-up detection
  const systemPrompt = `You are an intent classifier. Given the previous search summary and the user's new message, determine if the new message is a follow-up question about the previous search results. Respond with only "follow-up" or "new topic".\n\nPrevious search summary: ${previousSummary}\nUser message: ${newMessage}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: newMessage }
    ],
    max_tokens: 10,
    temperature: 0
  });

  const content = completion.choices[0]?.message?.content ?? "";
  const intent = content.toLowerCase().includes("follow-up") ? "follow-up" : "new topic";

  return NextResponse.json({ intent });
}
