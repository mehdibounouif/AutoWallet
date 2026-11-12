import { Bot } from "lucide-react";
import { useEffect, useRef } from "react";

type Message = {
    id: number;
    role: "user" | "assistant";
    content: string;
};

type ConversationProps = {
    messages: Message[];
};

export default function Conversation({ messages }: ConversationProps) {

    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    }, [messages]);

    return (
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
            {messages.map((message) => (
                <div
                    key={message.id}
                    className={`flex items-start gap-3 ${message.role === "user" ? "justify-end" : "justify-start"
                        }`}
                >
                    {message.role === "assistant" && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100">
                            <Bot size={18} className="text-green-900" />
                        </div>
                    )}

                    <div
                        className={`max-w-[75%] rounded-xl px-4 py-3 ${message.role === "user"
                            ? "bg-green-900 text-white"
                            : "bg-gray-100 text-gray-800"
                            }`}
                    >
                        <p className="text-sm">{message.content}</p>
                    </div>
                </div>
            ))}
        <div ref={bottomRef} />
        </div>
    );
}