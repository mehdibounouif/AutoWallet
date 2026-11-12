import { useState } from "react";
import AssistantHeader from "./AssistantHeader";
import ChatInput  from "./ChatInput";
import Conversation from "./Conversation"

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

export default function Assistant() {
  const [messages, setMessages] = useState<Message[]>([]);

  function generateAIResponse(message: string): string {
    const text = message.toLowerCase();

    if (text.includes("spend")) {
      return "You spent $250 this month. Your biggest expense was rent.";
    }

    if (text.includes("save")) {
      return "You can improve your savings by setting aside 10% of your income.";
    }

    if (text.includes("hello")) {
      return "Hello! How can I help you manage your money today?";
    }

    return "I'm here to help you understand your finances. Could you be more specific?";
  }

  function handleSend(message: string) {
    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: message,
    }

    setMessages((prev) => [...prev, userMessage]);

    const aiResponse = generateAIResponse(message);

    const aiMessage: Message = {
      id: Date.now(),
      role: "assistant",
      content: aiResponse,
    }

    setMessages((prev) => [...prev, aiMessage]);
  }

  return (
    <div className="flex h-full flex-col">
      <AssistantHeader />

      <Conversation messages={messages} />

      <ChatInput onSend={handleSend} />
    </div>
  );
}