import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: Request) {
  const { message_id, followup_question } = await request.json();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch all message_file_items for this message_id
  const { data: fileItems, error } = await supabase
    .from("message_file_items")
    .select("content")
    .eq("message_id", message_id);

  if (error || !fileItems) {
    return NextResponse.json({ error: "Could not fetch file items" }, { status: 500 });
  }

  // Build context for LLM
  const contextText = fileItems.map(item => item.content).join("\n\n");

  const prompt = `\nYou are an assistant. Here are excerpts from previous search results:\n${contextText}\n\nFollow-up question: ${followup_question}\n`;

  // Call LLM (OpenAI example)
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: prompt }
    ]
  });

  return NextResponse.json({ answer: completion.choices[0].message.content });
}
