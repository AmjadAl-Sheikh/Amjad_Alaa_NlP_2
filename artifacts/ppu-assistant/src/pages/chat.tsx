import { useState, useRef, useEffect } from "react";
import { useGetChatHistory, getGetChatHistoryQueryKey, useSendMessage, useClearChatHistory } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, Trash2, Bot, User } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Chat() {
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useGetChatHistory(
    {},
    {
      query: { queryKey: getGetChatHistoryQueryKey({}) },
    }
  );

  const sendMessageMutation = useSendMessage({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetChatHistoryQueryKey({}) });
        setMessage("");
      },
    },
  });

  const clearHistoryMutation = useClearChatHistory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetChatHistoryQueryKey({}) });
      },
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current;
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  }, [messages, sendMessageMutation.isPending]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMessageMutation.mutate({ data: { message } });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto border rounded-xl overflow-hidden glass-panel">
      <div className="flex items-center justify-between p-4 border-b bg-background/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold">المساعد الذكي</h2>
            <p className="text-xs text-muted-foreground">جامعة بوليتكنك فلسطين</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => clearHistoryMutation.mutate()}
          disabled={clearHistoryMutation.isPending || !messages?.length}
        >
          <Trash2 className="h-4 w-4 ml-2" />
          مسح المحادثة
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex justify-start">
              <Skeleton className="h-16 w-[250px] rounded-2xl rounded-tr-none" />
            </div>
            <div className="flex justify-end">
              <Skeleton className="h-12 w-[200px] rounded-2xl rounded-tl-none" />
            </div>
          </div>
        ) : messages?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground mt-20">
            <Bot className="h-16 w-16 mb-4 opacity-20" />
            <p>مرحباً بك في المساعد الذكي.</p>
            <p className="text-sm">اسألني عن علاماتك، مساقاتك، أو الجدول الدراسي.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {messages?.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[80%] ${
                  msg.role === "user" ? "mr-auto flex-row-reverse" : "ml-auto"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  }`}
                >
                  {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div
                  className={`p-3 rounded-2xl ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tl-none"
                      : "bg-muted/50 border rounded-tr-none"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {sendMessageMutation.isPending && (
              <div className="flex gap-3 max-w-[80%] ml-auto">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-muted text-foreground">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="p-3 rounded-2xl bg-muted/50 border rounded-tr-none">
                  <div className="flex gap-1 items-center h-5">
                    <span className="w-2 h-2 rounded-full bg-foreground/30 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-foreground/30 animate-bounce delay-150" />
                    <span className="w-2 h-2 rounded-full bg-foreground/30 animate-bounce delay-300" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t bg-background/50">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="اكتب سؤالك هنا..."
            className="flex-1 bg-background"
            disabled={sendMessageMutation.isPending}
          />
          <Button type="submit" size="icon" disabled={!message.trim() || sendMessageMutation.isPending}>
            <Send className="h-4 w-4 rtl:rotate-180" />
          </Button>
        </form>
      </div>
    </div>
  );
}
