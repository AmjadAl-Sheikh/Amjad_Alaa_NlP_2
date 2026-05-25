import { useGetStudentProfile, getGetStudentProfileQueryKey, useGetStudentSchedule, getGetStudentScheduleQueryKey, useGetDashboardStats, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Calendar, Calculator, Activity, Users, MessageSquare } from "lucide-react";

export default function Dashboard() {
  const { data: profile, isLoading: isProfileLoading } = useGetStudentProfile({
    query: { queryKey: getGetStudentProfileQueryKey() },
  });

  const { data: schedule, isLoading: isScheduleLoading } = useGetStudentSchedule({
    query: { queryKey: getGetStudentScheduleQueryKey() },
  });

  const { data: stats, isLoading: isStatsLoading } = useGetDashboardStats({
    query: { queryKey: getGetDashboardStatsQueryKey() },
  });

  if (isProfileLoading || isScheduleLoading || isStatsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">مرحباً بك، {profile?.name}</h1>
        <p className="text-muted-foreground">التخصص: {profile?.major}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-panel border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المساقات المسجلة</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.enrolledSubjects?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card className="glass-panel border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">محاضرات اليوم</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schedule?.length || 0}</div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الأطباء</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalDoctors || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="glass-panel border-none shadow-sm">
          <CardHeader>
            <CardTitle>الجدول الدراسي الأسبوعي</CardTitle>
            <CardDescription>لمحة سريعة عن محاضراتك القادمة</CardDescription>
          </CardHeader>
          <CardContent>
            {schedule && schedule.length > 0 ? (
              <div className="space-y-4">
                {schedule.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg border">
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">{entry.subjectName}</span>
                      <span className="text-xs text-muted-foreground">{entry.doctorName} • قاعة {entry.room}</span>
                    </div>
                    <div className="text-left flex flex-col items-end">
                      <span className="text-sm font-medium">{entry.dayOfWeek}</span>
                      <span className="text-xs text-muted-foreground">{entry.startTime} - {entry.endTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>لا يوجد محاضرات مسجلة</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-panel border-none shadow-sm">
          <CardHeader>
            <CardTitle>النشاطات الأخيرة</CardTitle>
            <CardDescription>آخر نشاطاتك في النظام</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                {stats.recentActivity.map((activity, i) => (
                  <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full border border-white bg-slate-100 dark:bg-slate-800 text-slate-500 group-[.is-active]:text-primary shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border bg-background/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">{new Date(activity.timestamp).toLocaleDateString('ar')}</span>
                      </div>
                      <div className="text-sm text-foreground">{activity.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>لا يوجد نشاطات مسجلة</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
