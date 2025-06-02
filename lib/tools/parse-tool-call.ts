
export interface ToolCall {
  tool: string;
  args: Record<string, any>;
}

/**
 * Extracts tool call info from a string like:
 * TOOL_CALL: search_docs { "input": "property tax 2024" }
 */
export function parseToolCall(message: string): ToolCall | null {
  const match = message.match(/^TOOL_CALL:\s*(\w+)\s*(\{.*\})$/s);
  if (!match) return null;

  const [, tool, jsonArgs] = match;

  try {
    const args = JSON.parse(jsonArgs);
    return { tool, args };
  } catch (err) {
    console.error("Failed to parse TOOL_CALL JSON:", err);
    return null;
  }
}
