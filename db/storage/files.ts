export const uploadFile = async (
  file: File,
  payload: {
    name: string
    user_id: string
    file_id: string
    project_id: string
  }
): Promise<{ success: boolean; message: string }> => {
  try {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("file_id", payload.file_id)
    formData.append("user_id", payload.user_id)
    formData.append("name", payload.name)
    formData.append("project_id", payload.project_id)

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
    const response = await fetch(`${backendUrl}/upload`, {
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
