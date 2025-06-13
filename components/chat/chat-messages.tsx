import { useChatHandler } from "@/components/chat/chat-hooks/use-chat-handler"
import { ChatbotUIContext } from "@/context/context"
import { Tables } from "@/supabase/types"
import { FC, useContext, useRef, useState } from "react"
import { Message } from "../messages/message"

interface ChatMessagesProps {
  lastMessageRef?: React.RefObject<HTMLDivElement>
}

export const ChatMessages: FC<ChatMessagesProps> = ({ lastMessageRef }) => {
  const { chatMessages, chatFileItems } = useContext(ChatbotUIContext)
  const { handleSendEdit } = useChatHandler()
  const [editingMessage, setEditingMessage] = useState<Tables<"messages">>()

  return chatMessages
    .sort((a, b) => a.message.sequence_number - b.message.sequence_number)
    .map((chatMessage, index, array) => {
      const messageFileItems = chatFileItems.filter(
        (chatFileItem, _, self) =>
          chatMessage.fileItems.includes(chatFileItem.id) &&
          self.findIndex(item => item.id === chatFileItem.id) === _
      )
      const isLast = index === array.length - 1
      return (
        <div ref={isLast ? lastMessageRef : undefined} key={chatMessage.message.sequence_number}>
          <Message
            message={chatMessage.message}
            fileItems={messageFileItems}
            isEditing={editingMessage?.id === chatMessage.message.id}
            isLast={isLast}
            onStartEdit={setEditingMessage}
            onCancelEdit={() => setEditingMessage(undefined)}
            onSubmitEdit={handleSendEdit}
          />
        </div>
      )
    })
}
