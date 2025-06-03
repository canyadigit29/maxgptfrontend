import { getEmbedding } from "./embedding";

export async function backendSemanticSearch({
  query,
  userId,
  backendUrl,
  filters = {}
}: {
  query: string;
  userId: string;
  backendUrl: string;
  filters?: Record<string, any>;
}) {
  // Only use OpenAI embedding
  const embedding = await getEmbedding(query);

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

/**
 * For 'run search' prompts: send plain text and user_id to backend /api/chat endpoint.
 * The backend will handle embedding and semantic search.
 */
export async function backendRunSearch({
  userPrompt,
  userId,
  sessionId,
  backendUrl
}: {
  userPrompt: string;
  userId: string;
  sessionId: string;
  backendUrl: string;
}) {
  const body = {
    user_prompt: userPrompt,
    user_id: userId,
    session_id: sessionId
  };

  const res = await fetch(`${backendUrl}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    throw new Error(`Backend run search failed: ${await res.text()}`);
  }

  return await res.json();
}
