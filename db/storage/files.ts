import { toast } from "sonner"

export const uploadFile = async (
  file: File,
  payload: {
    name: string
    user_id: string
    file_id: string
    project_id: string
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
  formData.append("project_id", payload.project_id)

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL

  const response = await fetch(`${backendUrl}/upload`, {
    method: "POST",
    body: formData
  })

  if (!response.ok) {
    const result = await response.json()
    throw new Error(result.detail || "Error uploading file")
  }

  const result = await response.json()
  return result.filePath || "uploaded"
}

export const deleteFileFromStorage = async (filePath: string) => {
  toast.info("Delete from storage is handled by backend.")
}

export const getFileFromStorage = async (filePath: string) => {
  toast.info("Download from storage is handled by backend.")
}
