import { FileItemChunk } from "@/types"
import { CSVLoader } from "langchain/document_loaders/fs/csv"
import { Document } from "langchain/document"; // Ensure Document type is imported

export const processCSV = async (csv: Blob): Promise<string[]> => {
  const loader = new CSVLoader(csv);
  const docs: Document[] = await loader.load();
  return docs.map((doc: Document) => doc.pageContent); // Return raw content without processing
};
