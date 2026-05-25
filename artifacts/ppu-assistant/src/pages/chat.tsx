import { useState, useRef, useEffect, useCallback } from "react";
import {
  useGetChatHistory,
  getGetChatHistoryQueryKey,
  useSendMessage,
  useClearChatHistory,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Send, Trash2, Bot, User, Mic, MicOff, Volume2, VolumeX,
  ImagePlus, X, Paperclip, StopCircle,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSpeech, stripMarkdown } from "@/hooks/use-speech";
import { cn } from "@/lib/utils";

interface PendingImage {
  base64: string;
  mimeType: string;
  previewUrl: string;
}

export default function Chat() {
  const [message, setMessage] = useState("");
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useGetChatHistory(
    {},
    { query: { queryKey: getGetChatHistoryQueryKey({}) } }
  );

  const sendMessageMutation = useSendMessage({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getGetChatHistoryQueryKey({}) });
        setMessage("");
        setPendingImage(null);
        if (autoSpeak && data?.content) {
          speech.speak(data.content);
        }
      },
    },
  });

  const clearHistoryMutation = useClearChatHistory({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetChatHistoryQueryKey({}) }),
    },
  });

  const handleVoiceTranscript = useCallback((text: string) => {
    setMessage(text);
    setTimeout(() => {
      if (text.trim()) {
        sendMessageMutation.mutate({ data: { message: text } });
      }
    }, 400);
  }, []);

  const speech = useSpeech(handleVoiceTranscript);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sendMessageMutation.isPending]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = message.trim();
    if (!text && !pendingImage) return;
    sendMessageMutation.mutate({
      data: {
        message: text || "حلل هذه الصورة",
        ...(pendingImage && {
          imageBase64: pendingImage.base64,
          mimeType: pendingImage.mimeType,
        }),
      } as Parameters<typeof sendMessageMutation.mutate>[0]["data"],
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const [header, base64] = dataUrl.split(",");
      const mimeType = header.match(/data:([^;]+)/)?.[1] ?? "image/jpeg";
      setPendingImage({ base64, mimeType, previewUrl: dataUrl });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const isBusy = sendMessageMutation.isPending;
  const isListening = speech.state === "listening";
  const isSpeaking = speech.state === "speaking";

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background/80 backdrop-blur rounded-t-xl glass-panel">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary/10 text-primary rounded-full flex items-center justify-center">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">المساعد الذكي — PPU</h2>
            <p className="text-xs text-muted-foreground">
              {isListening ? "جاري الاستماع..." : isSpeaking ? "جاري التحدث..." : "متاح للمساعدة"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn("gap-1.5 text-xs", autoSpeak && "text-primary")}
            onClick={() => { setAutoSpeak(!autoSpeak); if (isSpeaking) speech.stopSpeaking(); }}
            title={autoSpeak ? "إيقاف القراءة التلقائية" : "تفعيل القراءة التلقائية"}
          >
            {autoSpeak ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            <span className="hidden sm:inline">{autoSpeak ? "صوت مفعّل" : "صوت معطّل"}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10 gap-1.5 text-xs"
            onClick={() => clearHistoryMutation.mutate()}
            disabled={clearHistoryMutation.isPending || !messages?.length}
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">مسح</span>
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4 bg-muted/20">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex gap-2 ${i % 2 === 0 ? "justify-end" : ""}`}>
                <Skeleton className="h-14 w-[220px] rounded-2xl" />
              </div>
            ))}
          </div>
        ) : !messages?.length ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-16">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Bot className="h-8 w-8 text-primary/60" />
            </div>
            <p className="font-medium mb-1">مرحباً بك في المساعد الذكي</p>
            <p className="text-sm max-w-xs">اسألني عن المواد، الجدول، الأساتذة، أو أي شيء يتعلق بجامعة بوليتكنك فلسطين</p>
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {["ما هو جدولي؟", "من يدرّس قواعد البيانات؟", "كيف أسجّل مادة؟", "ما تخصصات الجامعة؟"].map((q) => (
                <button
                  key={q}
                  onClick={() => setMessage(q)}
                  className="text-xs bg-background border rounded-full px-3 py-1.5 hover:bg-primary/5 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div key={msg.id} className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1",
                    isUser ? "bg-primary text-primary-foreground" : "bg-muted border"
                  )}>
                    {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                  </div>
                  <div className={cn("max-w-[75%] space-y-1", isUser && "items-end flex flex-col")}>
                    {(msg as Record<string, unknown>).imageUrl && (
                      <img
                        src={(msg as Record<string, unknown>).imageUrl as string}
                        alt="صورة مرفقة"
                        className="max-w-[200px] rounded-xl border"
                      />
                    )}
                    <div className={cn(
                      "px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                      isUser
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-background border rounded-tl-sm shadow-sm"
                    )}>
                      {isUser ? msg.content : stripMarkdown(msg.content)}
                    </div>
                    <div className="flex items-center gap-1 px-1">
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleTimeString("ar-PS", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {!isUser && speech.isSupported && (
                        <button
                          onClick={() => isSpeaking ? speech.stopSpeaking() : speech.speak(msg.content)}
                          className="text-muted-foreground hover:text-primary transition-colors"
                          title="استمع للرد"
                        >
                          {isSpeaking ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {isBusy && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-muted border flex items-center justify-center shrink-0 mt-1">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="bg-background border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1 items-center h-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Image preview */}
      {pendingImage && (
        <div className="px-4 py-2 border-t bg-background/80 flex items-center gap-2">
          <div className="relative">
            <img src={pendingImage.previewUrl} alt="معاينة" className="h-14 w-14 rounded-lg object-cover border" />
            <button
              onClick={() => setPendingImage(null)}
              className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">صورة مرفقة — اكتب سؤالك أو اضغط إرسال مباشرة</p>
        </div>
      )}

      {/* Voice transcript preview */}
      {isListening && speech.transcript && (
        <div className="px-4 py-2 border-t bg-primary/5 text-sm text-muted-foreground animate-pulse">
          {speech.transcript}...
        </div>
      )}

      {/* Input bar */}
      <div className="px-4 py-3 border-t bg-background/80 backdrop-blur rounded-b-xl glass-panel">
        <div className="flex gap-2 items-end">
          {/* Image upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 h-9 w-9 text-muted-foreground hover:text-primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={isBusy}
            title="إرفاق صورة"
          >
            <ImagePlus className="h-4 w-4" />
          </Button>

          {/* Text input */}
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "جاري الاستماع..." : "اكتب سؤالك أو استخدم الميكروفون..."}
            className="flex-1 min-h-[40px] max-h-[120px] resize-none bg-background text-sm leading-relaxed"
            disabled={isBusy || isListening}
            rows={1}
          />

          {/* Voice button */}
          {speech.isSupported && (
            <Button
              type="button"
              size="icon"
              variant={isListening ? "destructive" : "ghost"}
              className={cn("shrink-0 h-9 w-9", !isListening && "text-muted-foreground hover:text-primary")}
              onClick={() => isListening ? speech.stopListening() : speech.startListening()}
              disabled={isBusy || isSpeaking}
              title={isListening ? "إيقاف التسجيل" : "تحدث لإرسال رسالة"}
            >
              {isListening ? <StopCircle className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          )}

          {/* Send button */}
          <Button
            type="button"
            size="icon"
            className="shrink-0 h-9 w-9"
            onClick={handleSend}
            disabled={(!message.trim() && !pendingImage) || isBusy}
          >
            <Send className="h-4 w-4 rtl:rotate-180" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-1.5">
          Enter للإرسال · Shift+Enter لسطر جديد · اضغط الميكروفون للتحدث
        </p>
      </div>
    </div>
  );
}
