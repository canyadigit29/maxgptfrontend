import type { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Missing message' });
  }
  // Prompt the LLM to classify the intent
  const prompt = `Classify the user's intent as one of: "semantic search", "file selection", or "general chat".\nUser message: ${message}\nIntent:`;
  const completion = await openai.completions.create({
    model: 'gpt-3.5-turbo-instruct',
    prompt,
    max_tokens: 10,
    temperature: 0
  });
  const intent = completion.choices[0]?.text?.trim().toLowerCase() || 'general chat';
  res.status(200).json({ intent });
}
