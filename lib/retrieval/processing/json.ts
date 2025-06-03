import { FileItemChunk } from "@/types"
import { JSONLoader } from "langchain/document_loaders/fs/json"

export const processJSON = async (json: Blob): Promise<any> => {
  const loader = new JSONLoader(json);
  const docs = await loader.load();
  return docs.map(doc => doc.pageContent); // Return raw content without processing
};
