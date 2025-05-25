import { supabase } from "@/lib/supabase-client"

export async function uploadFile(
  file: File,
  payload: {
    name: string
    user_id: string
    type: string
  }
): Promise<{ success: boolean; message: string }> {
  try {
    // ✅ Step 1: Insert a new file row in Supabase and get the generated file_id
    const { data, error } = await supabase
      .from("files")
      .insert([
        {
          user_id: payload.user_id,
          name: payload.name,
          type: payload.type,
          file_path: "", // You can leave this blank if it's handled later
          status: "pending",
        },
      ])
      .select("id")
      .single()

    if (error || !data) {
      throw new Error("Failed to insert file row: " + error?.message)
    }

    const file_id = data.id

    // ✅ Step 2: Send file to backend with correct file_id
    const formData = new FormData()
    formData.append("file", file)
    formData.append("file_id", file_id)
    formData.append("user_id", payload.user_id)
    formData.append("name", payload.name)

    const response = await fetch(`/upload`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const res = await response.json()
      throw new Error(res.detail || "Upload failed")
    }

    return { success: true, message: "Upload complete" }
  } catch (err: any) {
    return { success: false, message: err.message || "Unknown error" }
  }
}
