import { useState } from "react";
import { useLocation } from "wouter";
import { useRequestOtp, getGetMeQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Login() {
  const [email, setEmail] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const loginMutation = useRequestOtp({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setLocation("/dashboard");
      },
      onError: () => {
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء تسجيل الدخول. حاول مجدداً.",
          variant: "destructive",
        });
      },
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    loginMutation.mutate({ data: { email } });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-chart-4/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary text-primary-foreground rounded-xl flex items-center justify-center font-bold text-xl mx-auto mb-4 shadow-lg">
            PPU
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">تسجيل الدخول</h1>
          <p className="text-muted-foreground text-sm">
            أدخل بريدك الإلكتروني الجامعي للوصول إلى المساعد الذكي
          </p>
        </div>

        <div className="glass-panel p-6 sm:p-8 rounded-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني الجامعي</Label>
              <Input
                id="email"
                type="email"
                placeholder="student@ppu.edu.ps"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-left bg-background/50"
                dir="ltr"
                required
                autoFocus
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending || !email}
            >
              {loginMutation.isPending ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          جامعة بوليتكنك فلسطين — المساعد الذكي الأكاديمي
        </p>
      </div>
    </div>
  );
}
