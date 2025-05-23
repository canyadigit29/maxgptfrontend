"use client"

import { Dashboard } from "@/components/ui/dashboard"
import { ChatbotUIContext } from "@/context/context"
import { getAssistantWorkspacesByWorkspaceId } from "@/db/assistants"
import { getChatsByWorkspaceId } from "@/db/chats"
import { getCollectionWorkspacesByWorkspaceId } from "@/db/collections"
import { getFileWorkspacesByWorkspaceId } from "@/db/files"
import { getFoldersByWorkspaceId } from "@/db/folders"
import { getModelWorkspacesByWorkspaceId } from "@/db/models"
import { getPresetWorkspacesByWorkspaceId } from "@/db/presets"
import { getPromptWorkspacesByWorkspaceId } from "@/db/prompts"
import { getAssistantImageFromStorage } from "@/db/storage/assistant-images"
import { getToolWorkspacesByWorkspaceId } from "@/db/tools"
import { getWorkspaceById } from "@/db/workspaces"
import { convertBlobToBase64 } from "@/lib/blob-to-b64"
import { supabase } from "@/lib/supabase/browser-client"
import { LLMID } from "@/types"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { ReactNode, useContext, useEffect, useState } from "react"
import Loading from "../loading"

interface WorkspaceLayoutProps {
  children: ReactNode
}

export default function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const router = useRouter()

  const params = useParams()
  const searchParams = useSearchParams()
  const workspaceId = params.workspaceid as string

  const {
    setChatSettings,
    setAssistants,
    setAssistantImages,
    setChats,
    setCollections,
    setFolders,
    setFiles,
    setPresets,
    setPrompts,
    setTools,
    setModels,
    selectedWorkspace,
    setSelectedWorkspace,
    setSelectedChat,
    setChatMessages,
    setUserInput,
    setIsGenerating,
    setFirstTokenReceived,
    setChatFiles,
    setChatImages,
    setNewMessageFiles,
    setNewMessageImages,
    setShowFilesDisplay
  } = useContext(ChatbotUIContext)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const session = (await supabase.auth.getSession()).data.session

      if (!session) {
        return router.push("/login")
      } else {
        await fetchWorkspaceData(workspaceId)
      }
    })()
  }, [])

  useEffect(() => {
    ;(async () => await fetchWorkspaceData(workspaceId))()

    setUserInput("")
    setChatMessages([])
    setSelectedChat(null)

    setIsGenerating(false)
    setFirstTokenReceived(false)

    setChatFiles([])
    setChatImages([])
    setNewMessageFiles([])
    setNewMessageImages([])
    setShowFilesDisplay(false)
  }, [workspaceId])

  const fetchWorkspaceData = async (workspaceId: string) => {
    setLoading(true)

    const { data: workspace, error } = await getWorkspaceById(workspaceId)
    if (workspace) {
      setSelectedWorkspace(workspace)

      const assistantData = await getAssistantWorkspacesByWorkspaceId(workspaceId)
      setAssistants(assistantData.assistants)

      for (const assistant of assistantData.assistants) {
        let url = ""
[16:29:20.857] Running build in Washington, D.C., USA (East) – iad1
[16:29:20.858] Build machine configuration: 2 cores, 8 GB
[16:29:20.875] Cloning github.com/canyadigit29/maxgptfrontend (Branch: main, Commit: 689fab8)
[16:29:21.367] Cloning completed: 491.000ms
[16:29:26.230] Restored build cache from previous deployment (FZnzpckj9v7vQF3Ce48GruAQu1BF)
[16:29:27.705] Running "vercel build"
[16:29:28.147] Vercel CLI 42.1.1
[16:29:28.477] Installing dependencies...
[16:29:30.860] 
[16:29:30.860] > chatbot-ui@2.0.0 prepare
[16:29:30.861] > husky install
[16:29:30.861] 
[16:29:30.910] husky - Git hooks installed
[16:29:30.920] 
[16:29:30.920] up to date in 2s
[16:29:30.923] 
[16:29:30.923] 295 packages are looking for funding
[16:29:30.923]   run `npm fund` for details
[16:29:30.957] Detected Next.js version: 14.1.0
[16:29:30.970] Running "npm run build"
[16:29:31.086] 
[16:29:31.086] > chatbot-ui@2.0.0 build
[16:29:31.086] > next build
[16:29:31.086] 
[16:29:33.050]    ▲ Next.js 14.1.0
[16:29:33.051] 
[16:29:33.123]    Creating an optimized production build ...
[16:29:33.625] > [PWA] Compile server
[16:29:33.626] > [PWA] Compile server
[16:29:33.627] > [PWA] Compile client (static)
[16:29:33.628] > [PWA] Custom worker found: /vercel/path0/worker/index.js
[16:29:33.628] > [PWA] Build custom worker: /vercel/path0/public/worker-WYakf9ZsTh4vKcJsaiU8B.js
[16:29:33.746] > [PWA] Auto register service worker with: /vercel/path0/node_modules/next-pwa/register.js
[16:29:33.747] > [PWA] Service worker: /vercel/path0/public/sw.js
[16:29:33.747] > [PWA]   url: /sw.js
[16:29:33.747] > [PWA]   scope: /
[16:29:34.017] (node:101) [DEP0180] DeprecationWarning: fs.Stats constructor is deprecated.
[16:29:34.017] (Use `node --trace-deprecation ...` to show where the warning was created)
[16:29:34.215] Browserslist: caniuse-lite is outdated. Please run:
[16:29:34.216]   npx update-browserslist-db@latest
[16:29:34.216]   Why you should do it regularly: https://github.com/browserslist/update-db#readme
[16:29:43.967] Browserslist: caniuse-lite is outdated. Please run:
[16:29:43.968]   npx update-browserslist-db@latest
[16:29:43.968]   Why you should do it regularly: https://github.com/browserslist/update-db#readme
[16:29:50.946]  ✓ Compiled successfully
[16:29:50.947]    Linting and checking validity of types ...
[16:30:02.008] Failed to compile.
[16:30:02.008] 
[16:30:02.009] ./app/[locale]/[workspaceid]/layout.tsx:99:35
[16:30:02.009] Type error: Property 'assistants' does not exist on type 'SelectQueryError<string> | { [K in keyof (("id" extends keyof (Database["public" extends keyof Database ? "public" : string & keyof Database] extends GenericSchema ? Database["public" extends keyof Database ? "public" : string & keyof Database] : any)["Tables"]["workspaces"]["Row"] ? { ...; } : SelectQueryError<...>...'.
[16:30:02.009]   Property 'assistants' does not exist on type 'SelectQueryError<string>'.
[16:30:02.009] 
[16:30:02.010] [0m [90m  97 |[39m[0m
[16:30:02.010] [0m [90m  98 |[39m       [36mconst[39m assistantData [33m=[39m [36mawait[39m getAssistantWorkspacesByWorkspaceId(workspaceId)[0m
[16:30:02.010] [0m[31m[1m>[22m[39m[90m  99 |[39m       setAssistants(assistantData[33m.[39massistants)[0m
[16:30:02.010] [0m [90m     |[39m                                   [31m[1m^[22m[39m[0m
[16:30:02.010] [0m [90m 100 |[39m[0m
[16:30:02.010] [0m [90m 101 |[39m       [36mfor[39m ([36mconst[39m assistant [36mof[39m assistantData[33m.[39massistants) {[0m
[16:30:02.010] [0m [90m 102 |[39m         [36mlet[39m url [33m=[39m [32m""[39m[0m
[16:30:02.137] Error: Command "npm run build" exited with 1
[16:30:02.852] 
[16:30:05.863] Exiting build container
        if (assistant.image_path) {
          url = (await getAssistantImageFromStorage(assistant.image_path)) || ""
        }

        if (url) {
          const response = await fetch(url)
          const blob = await response.blob()
          const base64 = await convertBlobToBase64(blob)

          setAssistantImages(prev => [
            ...prev,
            {
              assistantId: assistant.id,
              path: assistant.image_path,
              base64,
              url
            }
          ])
        } else {
          setAssistantImages(prev => [
            ...prev,
            {
              assistantId: assistant.id,
              path: assistant.image_path,
              base64: "",
              url
            }
          ])
        }
      }

      const chats = await getChatsByWorkspaceId(workspaceId)
      setChats(chats)

      const collectionData =
        await getCollectionWorkspacesByWorkspaceId(workspaceId)
      setCollections(collectionData.collections)

      const folders = await getFoldersByWorkspaceId(workspaceId)
      setFolders(folders)

      const fileData = await getFileWorkspacesByWorkspaceId(workspaceId)
      setFiles(fileData.files)

      const presetData = await getPresetWorkspacesByWorkspaceId(workspaceId)
      setPresets(presetData.presets)

      const promptData = await getPromptWorkspacesByWorkspaceId(workspaceId)
      setPrompts(promptData.prompts)

      const toolData = await getToolWorkspacesByWorkspaceId(workspaceId)
      setTools(toolData.tools)

      const modelData = await getModelWorkspacesByWorkspaceId(workspaceId)
      setModels(modelData.models)

      setChatSettings({
        model: (searchParams.get("model") ||
          workspace.default_model ||
          "gpt-4-1106-preview") as LLMID,
        prompt:
          workspace.default_prompt ||
          "You are a friendly, helpful AI assistant.",
        temperature: workspace.default_temperature || 0.5,
        contextLength: workspace.default_context_length || 4096,
        includeProfileContext: workspace.include_profile_context ?? true,
        includeWorkspaceInstructions:
          workspace.include_workspace_instructions ?? true,
        embeddingsProvider:
          (workspace.embeddings_provider as "openai" | "local") || "openai"
      })
    } else {
      console.error("Failed to fetch workspace:", error)
    }

    setLoading(false)
  }

  if (loading) {
    return <Loading />
  }

  return <Dashboard>{children}</Dashboard>
}
