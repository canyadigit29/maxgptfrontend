
import { useEffect, useState } from "react";
import { handleRetrieval } from "./chat-helpers";
import { getEmbedding } from "@/lib/embedding";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function useChatHandler({
  onResponse
}: {
  onResponse: (text: string) => void;
}) {
  const [filters, setFilters] = useState<{
    file_name_filter?: string;
    collection_filter?: string[];
    description_filter?: string;
    start_date?: string;
    end_date?: string;
  }>({});

  async function handleUserMessage(message: string) {
    const searchTag = "[run_search:";
    if (message.includes(searchTag)) {
      const start = message.indexOf("[run_search:") + "[run_search:".length;
      const end = message.indexOf("]", start);
      const query = message.slice(start, end).trim();

      const results = await handleRetrieval({
        query,
        ...filters
      });

      // Fetch prompt template
      const { data: promptData, error } = await supabase
        .from("prompts")
        .select("content")
        .eq("name", "search_injection")
        .single();

      if (error || !promptData?.content) {
        console.error("Failed to fetch prompt template:", error);
        return;
      }

      const injectedResults = results.map((r: any) => r.content).join("\n\n");
      const finalPrompt = promptData.content.replace("{{results}}", injectedResults);

      // Call GPT
      const gptResponse = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: finalPrompt }],
        }),
      });

      const responseData = await gptResponse.json();
      onResponse(responseData.choices?.[0]?.message?.content || "No response.");
    } else {
      // Normal non-search flow (not handled here)
      console.log("Non-search message:", message);
    }
  }

  return {
    handleUserMessage,
    setFilters,
    handleNewChat: () => {},
    handleFocusChatInput: () => {},
  };
}
