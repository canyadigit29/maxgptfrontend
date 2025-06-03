import { FileItemChunk } from "@/types"
import { encode } from "gpt-tokenizer"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import { CHUNK_OVERLAP, CHUNK_SIZE } from "."

export const processMarkdown = async (markdown: Blob): Promise<string> => {
  const fileBuffer = Buffer.from(await markdown.arrayBuffer())
  const textDecoder = new TextDecoder("utf-8")
  return textDecoder.decode(fileBuffer) // Return raw markdown content without processing
}
