import { supabase } from "@/lib/supabase/browser-client";
import { TablesInsert } from "@/supabase/types";

export const createFileItems = async (
  fileItems: TablesInsert<"file_items">[]
) => {
  const { data: createdFileItems, error } = await supabase
    .from("file_items")
    .insert(fileItems)
    .select("*");

  if (error) {
    throw new Error(error.message);
  }

  return createdFileItems;
};
