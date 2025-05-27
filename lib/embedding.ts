
export async function getEmbedding(text: string): Promise<number[]> {
  const openaiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!openaiKey) {
    throw new Error("Missing NEXT_PUBLIC_OPENAI_API_KEY environment variable.");
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("OpenAI embedding error:", error);
    throw new Error("Failed to get embedding.");
  }

  const result = await response.json();
  return result.data[0].embedding;
}
