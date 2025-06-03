import { pipeline, env } from "@xenova/transformers"

// Enforce WASM backend for compatibility with Vercel and browser
env.backends.onnx = "wasm"

export async function generateLocalEmbedding(content: string) {
  const generateEmbedding = await pipeline(
    "feature-extraction",
    "Xenova/all-MiniLM-L6-v2"
  )

  const output = await generateEmbedding(content, {
    pooling: "mean",
    normalize: true
  })

  const embedding = Array.from(output.data)

  return embedding
}
