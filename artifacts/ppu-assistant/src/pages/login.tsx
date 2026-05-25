import { useState } from "react";
import { useLocation } from "wouter";
import { useRequestOtp, useVerifyOtp, getGetMeQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useQueryClient } from "@tanstack/react-query";

export default function Login() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const requestOtpMutation = useRequestOtp({
    mutation: {
      onSuccess: () => {
        setStep("code");
        toast({
          title: "تم إرسال الرمز",
          description: "يرجى التحقق من بريدك الإلكتروني للحصول على رمز الدخول.",
        });
      },
      onError: (error) => {
        toast({
          title: "خطأ",
          description: error.error || "حدث خطأ أثناء إرسال الرمز.",
          variant: "destructive",
        });
      },
    },
  });

  const verifyOtpMutation = useVerifyOtp({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setLocation("/dashboard");
      },
      onError: (error) => {
        toast({
          title: "خطأ",
          description: error.error || "رمز الدخول غير صحيح.",
          variant: "destructive",
        });
      },
    },
  });

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    requestOtpMutation.mutate({ data: { email } });
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length !== 6) return;
    verifyOtpMutation.mutate({ data: { email, code } });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-chart-4/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-bold text-2xl mx-auto mb-4">
            PPU
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">تسجيل الدخول</h1>
          <p className="text-muted-foreground text-sm">
            أدخل بريدك الإلكتروني الجامعي للوصول إلى المساعد الذكي
          </p>
        </div>

        <div className="glass-panel p-6 sm:p-8 rounded-2xl">
          {step === "email" ? (
            <form onSubmit={handleRequestOtp} className="space-y-6">
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
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={requestOtpMutation.isPending || !email}
              >
                {requestOtpMutation.isPending ? "جاري الإرسال..." : "إرسال رمز OTP"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="space-y-4">
                <Label>أدخل رمز التحقق (OTP)</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  تم إرسال رمز مكون من 6 أرقام إلى {email}
                </p>
                <div className="flex justify-center" dir="ltr">
                  <InputOTP
                    maxLength={6}
                    value={code}
                    onChange={(value) => setCode(value)}
                    disabled={verifyOtpMutation.isPending}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={verifyOtpMutation.isPending || code.length !== 6}
                >
                  {verifyOtpMutation.isPending ? "جاري التحقق..." : "تحقق والدخول"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep("email")}
                  disabled={verifyOtpMutation.isPending}
                >
                  العودة لتعديل البريد
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
