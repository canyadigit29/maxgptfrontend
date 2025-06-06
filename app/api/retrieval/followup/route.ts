import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: Request) {
  try {
    const { search_id, followup_question } = await request.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Get all chunk_ids for this search/message from retrieved_chunks
    const { data: retrieved, error: retrievedError } = await supabase
      .from("retrieved_chunks")
      .select("chunk_id")
      .eq("search_id", search_id);
    if (retrievedError || !retrieved || retrieved.length === 0) {
      return NextResponse.json({ error: "No retrieved chunks found for this search." }, { status: 404 });
    }
    const chunkIds = retrieved.map(row => row.chunk_id);

    // 2. Get the actual chunk content from the chunk table (file_items)
    const { data: chunks, error: chunkError } = await supabase
      .from("file_items") // Change to your actual chunk table if different
      .select("content")
      .in("id", chunkIds);
    if (chunkError || !chunks || chunks.length === 0) {
      return NextResponse.json({ error: "No chunk content found for these IDs." }, { status: 404 });
    }

    // 3. Build context for LLM
    const contextText = chunks.map(item => item.content).join("\n\n");
    const prompt = `\nYou are an assistant. Here are excerpts from previous search results:\n${contextText}\n\nFollow-up question: ${followup_question}\n`;

    // 4. Call LLM (OpenAI example)
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OpenAI API key on server." }, { status: 500 });
    }
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt }
      ]
    });

    return NextResponse.json({ answer: completion.choices[0].message.content });
  } catch (e) {
    return NextResponse.json({ error: e?.toString() || "Unknown error" }, { status: 500 });
  }
}
