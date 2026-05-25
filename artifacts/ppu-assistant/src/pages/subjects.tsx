import { useState } from "react";
import { useListSubjects, getListSubjectsQueryKey, useGetSubject, getGetSubjectQueryKey } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, BookOpen } from "lucide-react";

export default function Subjects() {
  const [searchTerm, setSearchTerm] = useState("");
  const [majorFilter, setMajorFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  const { data: subjects, isLoading } = useListSubjects(
    {},
    {
      query: { queryKey: getListSubjectsQueryKey({}) },
    }
  );

  const { data: selectedSubject } = useGetSubject(
    selectedSubjectId!,
    {
      query: { 
        queryKey: getGetSubjectQueryKey(selectedSubjectId!),
        enabled: !!selectedSubjectId 
      },
    }
  );

  const filteredSubjects = subjects?.filter((subject) => {
    const matchesSearch = subject.name.includes(searchTerm) || subject.code.includes(searchTerm);
    const matchesMajor = majorFilter === "all" || subject.major === majorFilter;
    const matchesLevel = levelFilter === "all" || subject.level.toString() === levelFilter;
    return matchesSearch && matchesMajor && matchesLevel;
  });

  const majors = Array.from(new Set(subjects?.map((s) => s.major) || []));
  const levels = Array.from(new Set(subjects?.map((s) => s.level.toString()) || [])).sort();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">المساقات</h1>
          <p className="text-muted-foreground mt-1">تصفح جميع المساقات المتاحة في الجامعة</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث عن مساق..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-9"
            />
          </div>
          
          <Select value={majorFilter} onValueChange={setMajorFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="التخصص" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل التخصصات</SelectItem>
              {majors.map((major) => (
                <SelectItem key={major} value={major}>{major}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue placeholder="المستوى" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل المستويات</SelectItem>
              {levels.map((level) => (
                <SelectItem key={level} value={level}>سنة {level}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : filteredSubjects && filteredSubjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubjects.map((subject) => (
            <Card 
              key={subject.id} 
              className="glass-panel border-none hover:shadow-md transition-all cursor-pointer hover:-translate-y-1"
              onClick={() => setSelectedSubjectId(subject.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg line-clamp-1">{subject.name}</CardTitle>
                    <CardDescription className="font-mono text-xs">{subject.code}</CardDescription>
                  </div>
                  <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <BookOpen className="h-4 w-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap mb-4">
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
                    سنة {subject.level}
                  </span>
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-muted text-muted-foreground">
                    {subject.creditHours} ساعات
                  </span>
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-accent text-accent-foreground">
                    {subject.major}
                  </span>
                </div>
                {subject.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {subject.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-1">لا يوجد نتائج</h3>
          <p className="text-muted-foreground">جرب تغيير كلمات البحث أو الفلاتر</p>
        </div>
      )}

      <Dialog open={!!selectedSubjectId} onOpenChange={(open) => !open && setSelectedSubjectId(null)}>
        <DialogContent className="sm:max-w-[425px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>{selectedSubject?.name || "جاري التحميل..."}</DialogTitle>
            <DialogDescription className="font-mono text-left" dir="ltr">
              {selectedSubject?.code}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubject ? (
            <div className="space-y-4 py-4">
              <div className="flex gap-2 flex-wrap">
                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-semibold bg-secondary text-secondary-foreground">
                  المستوى: {selectedSubject.level}
                </span>
                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-semibold bg-muted text-muted-foreground">
                  الساعات المعتمدة: {selectedSubject.creditHours}
                </span>
                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-semibold bg-accent text-accent-foreground">
                  تخصص: {selectedSubject.major}
                </span>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">وصف المساق</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedSubject.description || "لا يوجد وصف متاح لهذا المساق."}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-8 flex justify-center">
              <Skeleton className="h-32 w-full" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
