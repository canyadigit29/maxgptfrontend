export interface SearchDocsParams {
  embedding: number[];
  user_id: string;
  file_name_filter?: string;
  collection_filter?: string;
  description_filter?: string;
  start_date?: string;
  end_date?: string;
}

export async function searchDocs(params: SearchDocsParams) {
  const response = await fetch("/file_ops/search_docs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to search docs");
  }
  const data = await response.json();
  return data.retrieved_chunks || [];
}