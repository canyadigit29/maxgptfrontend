import { generateLocalEmbedding } from "./generate-local-embedding";
import { getEmbedding } from "./embedding";

export async function backendSemanticSearch({
  query,
  userId,
  backendUrl,
  use = "local", // "local" or "openai"
  filters = {}
}: {
  query: string;
  userId: string;
  backendUrl: string;
  use?: "local" | "openai";
  filters?: Record<string, any>;
}) {
  let embedding: number[];
  if (use === "openai") {
    embedding = await getEmbedding(query);
  } else {
    embedding = await generateLocalEmbedding(query);
  }

  const body = {
    embedding,
    user_id: userId,
    ...filters
  };

  const res = await fetch(`${backendUrl}/file_ops/search_docs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    throw new Error(`Backend search failed: ${await res.text()}`);
  }

  const data = await res.json();
  return data.retrieved_chunks || [];
}
