import { supabase } from "@/lib/supabase/browser-client";

// Get the current user's ID from Supabase Auth
export async function getCurrentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error("User not authenticated");
  return data.user.id;
}

// Get all collections for this user
export async function getUserCollections(userId: string) {
  const { data, error } = await supabase.from("collections").select("*").eq("user_id", userId);
  if (error) throw new Error(error.message);
  return data || [];
}

// Get all file names for this user
export async function getUserFileNames(userId: string) {
  const { data, error } = await supabase.from("files").select("name").eq("user_id", userId);
  if (error) throw new Error(error.message);
  return (data || []).map((f: { name: string }) => f.name);
}

// Given a date string, get a {start_date, end_date} with ± 3 months
export function getDateRangeAround(dateString: string): { start_date: string; end_date: string } {
  const date = new Date(dateString);
  const start = new Date(date);
  const end = new Date(date);
  start.setMonth(start.getMonth() - 3);
  end.setMonth(end.getMonth() + 3);
  return {
    start_date: start.toISOString().split('T')[0],
    end_date: end.toISOString().split('T')[0]
  };
}