import { useState } from "react";
import { useListDoctors, getListDoctorsQueryKey, useGetDoctor, getGetDoctorQueryKey } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Mail, Clock, MapPin, Users, BookOpen } from "lucide-react";

export default function Doctors() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);

  const { data: doctors, isLoading } = useListDoctors(
    {},
    {
      query: { queryKey: getListDoctorsQueryKey({}) },
    }
  );

  const { data: selectedDoctor } = useGetDoctor(
    selectedDoctorId!,
    {
      query: { 
        queryKey: getGetDoctorQueryKey(selectedDoctorId!),
        enabled: !!selectedDoctorId 
      },
    }
  );

  const filteredDoctors = doctors?.filter((doctor) => {
    return doctor.name.includes(searchTerm) || 
           (doctor.department && doctor.department.includes(searchTerm));
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">أعضاء هيئة التدريس</h1>
          <p className="text-muted-foreground mt-1">تصفح قائمة الأطباء والمحاضرين في الجامعة</p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ابحث بالاسم أو القسم..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      ) : filteredDoctors && filteredDoctors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doctor) => (
            <Card 
              key={doctor.id} 
              className="glass-panel border-none overflow-hidden hover:shadow-md transition-all cursor-pointer hover:-translate-y-1"
              onClick={() => setSelectedDoctorId(doctor.id)}
            >
              <div className="h-16 bg-gradient-to-l from-primary/20 to-transparent w-full"></div>
              <CardHeader className="relative pt-0 px-6 pb-4">
                <Avatar className="w-16 h-16 border-4 border-background absolute -top-8 right-6">
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                    {getInitials(doctor.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="pt-10">
                  <CardTitle className="text-xl">{doctor.name}</CardTitle>
                  <CardDescription className="font-medium text-primary mt-1">
                    {doctor.department || "محاضر"}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="space-y-3 mt-2">
                  {doctor.email && (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4 shrink-0" />
                      <a href={`mailto:${doctor.email}`} className="hover:text-primary transition-colors hover:underline" dir="ltr" onClick={(e) => e.stopPropagation()}>
                        {doctor.email}
                      </a>
                    </div>
                  )}
                  {doctor.officeHours && (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 shrink-0" />
                      <span>{doctor.officeHours}</span>
                    </div>
                  )}
                  <div className="flex items-start gap-3 text-sm text-muted-foreground pt-2 border-t mt-2">
                    <BookOpen className="h-4 w-4 shrink-0 mt-0.5" />
                    <div className="flex flex-wrap gap-1">
                      {doctor.subjects.slice(0, 3).map(subject => (
                        <span key={subject} className="bg-secondary text-secondary-foreground text-[10px] px-2 py-0.5 rounded-full">
                          {subject}
                        </span>
                      ))}
                      {doctor.subjects.length > 3 && (
                        <span className="bg-muted text-muted-foreground text-[10px] px-2 py-0.5 rounded-full">
                          +{doctor.subjects.length - 3} مساقات
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-1">لا يوجد نتائج</h3>
          <p className="text-muted-foreground">لم يتم العثور على محاضر بهذا الاسم</p>
        </div>
      )}

      <Dialog open={!!selectedDoctorId} onOpenChange={(open) => !open && setSelectedDoctorId(null)}>
        <DialogContent className="sm:max-w-[425px]" dir="rtl">
          {selectedDoctor ? (
            <>
              <DialogHeader className="mb-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                      {getInitials(selectedDoctor.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-xl">{selectedDoctor.name}</DialogTitle>
                    <DialogDescription className="text-primary mt-1 font-medium">
                      {selectedDoctor.department || "محاضر"}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">معلومات التواصل</h4>
                  <div className="grid gap-2">
                    {selectedDoctor.email && (
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <a href={`mailto:${selectedDoctor.email}`} className="hover:text-primary transition-colors hover:underline text-left w-full" dir="ltr">
                          {selectedDoctor.email}
                        </a>
                      </div>
                    )}
                    {selectedDoctor.officeHours && (
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span>الساعات المكتبية: {selectedDoctor.officeHours}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">المساقات التي يدرسها</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedDoctor.subjects.map(subject => (
                      <span key={subject} className="bg-secondary text-secondary-foreground text-xs px-3 py-1 rounded-full border">
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="py-8 flex justify-center">
              <Skeleton className="h-48 w-full" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

