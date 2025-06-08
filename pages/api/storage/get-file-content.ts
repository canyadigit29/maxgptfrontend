import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const bucket = "files";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { path } = req.body;
  if (!path) {
    return res.status(400).json({ error: 'Missing file path' });
  }
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error || !data) {
    return res.status(500).json({ error: error?.message || 'Failed to download file' });
  }
  // Read as text (assume UTF-8 for text files)
  const buffer = await data.arrayBuffer();
  const text = new TextDecoder('utf-8').decode(buffer);
  return res.status(200).json({ content: text });
}
