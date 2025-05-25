import { toast } from "sonner"

export const uploadFile = async (
  file: File,
  payload: {
    name: string
    user_id: string
    file_id: string
    project_id?: string
  }
) => {
  const SIZE_LIMIT = parseInt(
    process.env.NEXT_PUBLIC_USER_FILE_SIZE_LIMIT || "10000000"
  )

  if (file.size > SIZE_LIMIT) {
    throw new Error(
      `File must be less than ${Math.floor(SIZE_LIMIT / 1000000)}MB`
    )
  }

  const formData = new FormData()
  formData.append("file", file)
  formData.append("user_id", payload.user_id)
  formData.append("file_id", payload.file_id)
  formData.append("name", payload.name)

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL

  const response = await fetch(`${backendUrl}/upload`, {
    method: "POST",
    body: formData
  })

  if (!response.ok) {
    const result = await response.json()
    throw new Error(result.detail || "Error uploading file")
  }

  // 💾 Construct the expected file path (simulated upload path)
  const filePath = `${payload.user_id}/${payload.project_id || "Uploads"}/${file.name}`
  console.log("Simulated file path:", filePath)

  const result = await response.json()
  return result.filePath || "uploaded"
}

export const deleteFileFromStorage = async (filePath: string) => {
  toast.info("Delete from storage is handled by backend.")
}

export const getFileFromStorage = async (filePath: string): Promise<string> => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
  const response = await fetch(`${backendUrl}/download?file_path=${encodeURIComponent(filePath)}`)

  if (!response.ok) {
    toast.error("Failed to retrieve file URL from backend.")
    return "#"
  }

  const data = await response.json()
  return data.signedUrl
}
