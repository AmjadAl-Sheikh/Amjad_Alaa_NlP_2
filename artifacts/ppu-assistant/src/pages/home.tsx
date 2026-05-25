import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-chart-4/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      
      <header className="container mx-auto px-4 py-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary text-primary-foreground rounded flex items-center justify-center font-bold text-xl">
            PPU
          </div>
          <span className="font-bold text-xl">جامعة بوليتكنك فلسطين</span>
        </div>
        <Link href="/login" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
          تسجيل الدخول
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center p-4 z-10">
        <div className="glass-panel p-8 md:p-12 rounded-2xl max-w-3xl w-full mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary mb-6">
            جديد: المساعد الذكي
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
            مساعدك الجامعي <span className="text-primary">الذكي</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            منصة متكاملة لطلاب جامعة بوليتكنك فلسطين. استعلم عن علاماتك، جدولك الدراسي، وإعلانات الجامعة بكل سهولة من خلال المحادثة الذكية.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8">
              ابدأ الآن
            </Link>
            <Button variant="outline" className="h-11 px-8">
              تعرف على المزيد
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-5xl mx-auto w-full px-4">
          <div className="glass-panel p-6 rounded-xl">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <h3 className="font-semibold text-lg mb-2">علامات ومعدل</h3>
            <p className="text-sm text-muted-foreground">استعلم عن علاماتك ومعدلك التراكمي والفصلي بكل سرعة وسهولة.</p>
          </div>
          <div className="glass-panel p-6 rounded-xl">
            <div className="w-12 h-12 bg-chart-4/10 text-chart-4 rounded-lg flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
            </div>
            <h3 className="font-semibold text-lg mb-2">جدول دراسي</h3>
            <p className="text-sm text-muted-foreground">اعرف مواعيد محاضراتك وأماكنها وأسماء المحاضرين بضغطة زر.</p>
          </div>
          <div className="glass-panel p-6 rounded-xl">
            <div className="w-12 h-12 bg-chart-5/10 text-chart-5 rounded-lg flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
            </div>
            <h3 className="font-semibold text-lg mb-2">محادثة ذكية</h3>
            <p className="text-sm text-muted-foreground">تحدث مع المساعد الذكي واحصل على إجابات فورية لاستفساراتك الأكاديمية.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
