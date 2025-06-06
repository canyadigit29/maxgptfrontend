import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import OpenAI from "openai";

// This route is no longer needed. Follow-up Q&A is handled entirely on the frontend using Supabase and OpenAI.
export async function POST() {
  return new Response(
    JSON.stringify({ error: "This endpoint is deprecated. Follow-up Q&A is now handled on the frontend." }),
    { status: 410, headers: { "Content-Type": "application/json" } }
  );
}
