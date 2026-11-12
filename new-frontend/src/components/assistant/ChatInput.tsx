import { ArrowUp } from "lucide-react";
import React, { useState } from "react";

type ChatInputProps = {
    onSend: (message: string) => void;
}

export default function ChatInput({ onSend } : ChatInputProps) {

    const [input, setInput] = useState("");

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const message = input.trim();

        if (!message)
            return;
        onSend(message);
        setInput("");
    }
  
    return (
        <div className="w-full mx-auto max-w-3xl rounded-xl border border-gray-600 bg-white p-4">
            <form onSubmit={handleSubmit}>
                <div className="mb-4 flex gap-3">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                e.currentTarget.form?.requestSubmit();
                            }
                        }}
                        placeholder="Ask a question about your money..."
                        className="min-h-12 flex-1 resize-none bg-transparent text-sm outline-none"
                    />
                    <button
                        type="submit"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-900 text-white hover:bg-green-800"
                    >
                        <ArrowUp size={20} />
                    </button>
                </div>
            </form>
        </div>
    );
}