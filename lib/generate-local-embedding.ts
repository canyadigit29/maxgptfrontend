export async function generateLocalEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("❌ OPENAI_API_KEY environment variable is not set.");

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      input: text,
      model: "text-embedding-3-small"
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ OpenAI embedding request failed:", errorText);
    throw new Error("Failed to fetch embedding from OpenAI.");
  }

  const result = await response.json();
  return result.data[0].embedding;
}
