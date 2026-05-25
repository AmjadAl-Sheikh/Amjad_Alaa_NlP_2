import { useState } from "react";
import { useLocation } from "wouter";
import { useRequestOtp, useVerifyOtp, getGetMeQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { saveToken } from "@/lib/auth-token";
import { Mail, KeyRound, CheckCircle2, GraduationCap, BookOpen, Star, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "email" | "otp" | "success";

interface StudentInfo {
  studentName?: string | null;
  major?: string | null;
  gpa?: number | null;
  completedHours?: number | null;
  level?: number | null;
  email: string;
}

export default function Login() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const requestOtpMutation = useRequestOtp({
    mutation: {
      onSuccess: () => {
        setStep("otp");
        toast({ title: "تم الإرسال", description: "تحقق من بريدك الإلكتروني" });
      },
      onError: () => {
        toast({ title: "خطأ", description: "تعذّر إرسال رمز التحقق. تحقق من البريد.", variant: "destructive" });
      },
    },
  });

  const verifyOtpMutation = useVerifyOtp({
    mutation: {
      onSuccess: (data) => {
        const d = data as Record<string, unknown>;
        const token = d?.token as string | undefined;
        if (token) saveToken(token);
        setStudentInfo({
          studentName: d?.studentName as string | null,
          major: d?.major as string | null,
          gpa: d?.gpa as number | null,
          completedHours: d?.completedHours as number | null,
          level: d?.level as number | null,
          email,
        });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setStep("success");
      },
      onError: () => {
        toast({ title: "رمز خاطئ", description: "الرمز غير صحيح أو منتهي الصلاحية", variant: "destructive" });
        setOtp("");
      },
    },
  });

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    requestOtpMutation.mutate({ data: { email } });
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length < 4) return;
    verifyOtpMutation.mutate({ data: { email, code: otp.trim() } });
  };

  const handleOtpInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(v);
  };

  const levelLabel = (lvl: number | null | undefined) => {
    if (!lvl) return null;
    const labels: Record<number, string> = { 1: "السنة الأولى", 2: "السنة الثانية", 3: "السنة الثالثة", 4: "السنة الرابعة", 5: "السنة الخامسة" };
    return labels[lvl] ?? `المستوى ${lvl}`;
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
          <h1 className="text-2xl font-bold tracking-tight mb-1">المساعد الذكي</h1>
          <p className="text-muted-foreground text-sm">جامعة بوليتكنك فلسطين</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {(["email", "otp", "success"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                step === s ? "bg-primary text-primary-foreground scale-110" :
                  (["email", "otp", "success"].indexOf(step) > i) ? "bg-primary/30 text-primary" : "bg-muted text-muted-foreground"
              )}>
                {(["email", "otp", "success"].indexOf(step) > i) ? "✓" : i + 1}
              </div>
              {i < 2 && <div className={cn("w-8 h-0.5 rounded", (["email", "otp", "success"].indexOf(step) > i) ? "bg-primary/40" : "bg-muted")} />}
            </div>
          ))}
        </div>

        <div className="glass-panel p-6 sm:p-8 rounded-2xl">

          {/* STEP 1: Email */}
          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-base">أدخل بريدك الجامعي</h2>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="231160@ppu.edu.ps"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-left bg-background/50"
                  dir="ltr"
                  required
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">سيصلك رمز تحقق على هذا البريد</p>
              </div>
              <Button type="submit" className="w-full" disabled={requestOtpMutation.isPending || !email.trim()}>
                {requestOtpMutation.isPending ? "جاري الإرسال..." : "إرسال رمز التحقق"}
              </Button>
            </form>
          )}

          {/* STEP 2: OTP */}
          {step === "otp" && (
            <form onSubmit={handleOtpSubmit} className="space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <KeyRound className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-base">أدخل رمز التحقق</h2>
              </div>
              <div className="text-center py-2">
                <p className="text-sm text-muted-foreground">تم إرسال رمز مكوّن من 6 أرقام إلى</p>
                <p className="font-medium text-sm mt-1 dir-ltr text-primary">{email}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="otp">رمز التحقق</Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={handleOtpInput}
                  className="text-center text-2xl tracking-[0.5em] bg-background/50 font-mono"
                  maxLength={6}
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={verifyOtpMutation.isPending || otp.length < 6}>
                {verifyOtpMutation.isPending ? "جاري التحقق..." : "تحقق وادخل"}
              </Button>
              <button
                type="button"
                className="w-full text-xs text-muted-foreground hover:text-primary transition-colors"
                onClick={() => { setStep("email"); setOtp(""); }}
              >
                تغيير البريد الإلكتروني
              </button>
            </form>
          )}

          {/* STEP 3: Success */}
          {step === "success" && studentInfo && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h2 className="font-bold text-lg">
                  {studentInfo.studentName ? `أهلاً، ${studentInfo.studentName}!` : "تم تسجيل الدخول بنجاح!"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">{studentInfo.email}</p>
              </div>

              {/* Student stats */}
              {(studentInfo.major || studentInfo.gpa !== null || studentInfo.completedHours !== null) && (
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {studentInfo.major && (
                    <div className="bg-primary/5 rounded-xl p-3 flex items-start gap-2 col-span-2">
                      <GraduationCap className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">التخصص</p>
                        <p className="text-sm font-medium leading-tight">{studentInfo.major}</p>
                      </div>
                    </div>
                  )}
                  {studentInfo.level && (
                    <div className="bg-primary/5 rounded-xl p-3 flex items-start gap-2">
                      <Hash className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">المستوى</p>
                        <p className="text-sm font-medium">{levelLabel(studentInfo.level)}</p>
                      </div>
                    </div>
                  )}
                  {studentInfo.gpa !== null && studentInfo.gpa !== undefined && (
                    <div className="bg-primary/5 rounded-xl p-3 flex items-start gap-2">
                      <Star className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">المعدل التراكمي</p>
                        <p className="text-sm font-bold text-primary">{studentInfo.gpa.toFixed(2)} / 4.0</p>
                      </div>
                    </div>
                  )}
                  {studentInfo.completedHours !== null && studentInfo.completedHours !== undefined && (
                    <div className="bg-primary/5 rounded-xl p-3 flex items-start gap-2">
                      <BookOpen className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">الساعات المنجزة</p>
                        <p className="text-sm font-medium">{studentInfo.completedHours} ساعة</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Button className="w-full mt-2" onClick={() => setLocation("/chat")}>
                ابدأ المحادثة مع المساعد الذكي
              </Button>
              <button
                type="button"
                className="w-full text-xs text-muted-foreground hover:text-primary transition-colors"
                onClick={() => setLocation("/dashboard")}
              >
                اذهب إلى لوحة التحكم
              </button>
            </div>
          )}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">جامعة بوليتكنك فلسطين — المساعد الذكي الأكاديمي</p>
      </div>
    </div>
  );
}
