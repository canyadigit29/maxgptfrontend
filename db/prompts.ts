import { supabase } from "@/lib/supabase/browser-client";
import { TablesInsert, TablesUpdate } from "@/supabase/types";

export const getPromptById = async (promptId: string) => {
  const { data: prompt, error } = await supabase
    .from("prompts")
    .select("*")
    .eq("id", promptId)
    .single();

  if (!prompt) {
    throw new Error(error.message);
  }

  return prompt;
};

export const getPromptWorkspacesByWorkspaceId = async (workspaceId: string) => {
  const { data: workspace, error } = await supabase
    .from("workspaces")
    .select(
      `
      id,
      name,
      prompts (*)
    `
    )
    .eq("id", workspaceId)
    .single();

  if (!workspace) {
    throw new Error(error.message);
  }

  return workspace;
};

export const getPromptWorkspacesByPromptId = async (promptId: string) => {
  const { data: prompt, error } = await supabase
    .from("prompts")
    .select()
    .eq("id", promptId);

  if (!prompt) {
    throw new Error(error.message);
  }

  return prompt;
};

// ==========================================================================
// ——— New function added below ———
// ==========================================================================

export const getPromptByName = async (name: string) => {
  const { data, error } = await supabase
    .from("prompts")
    .select("*")
    .eq("name", name)
    .eq("sharing", "public")
    .maybeSingle();

  if (error) throw error;
  return data;
};
