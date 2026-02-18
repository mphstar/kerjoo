import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import DeadlineStatus, { getDeadlineInfo } from '@/components/deadline-status';
import MobileLayout from '@/layouts/mobile-layout';
import { Head, Link, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
    Activity, Calendar, Camera, CheckCircle2, Clock, ListChecks, ChevronRight,
    TrendingUp, Target, ArrowRight, AlertTriangle, Play, Timer, Folder,
    Wrench, User
} from 'lucide-react';
import { useMemo } from 'react';

interface Props {
    user?: { name: string; tempat?: string | null };
    performance: {
        completed: number;
        inProgress: number;
        averageTime: string;
    };
    recentTasks: {
        id: number;
        title: string;
        status: string;
        date: string;
        tenggat_waktu: string | null;
        kategori?: string;
        total_durasi?: number;
    }[];
    todayTasks: number;
    todayAbsensi: number;
}

export default function MobileDashboard({ user, performance, recentTasks, todayTasks, todayAbsensi }: Props) {
    const { url } = usePage();

    const completionRate = performance.completed > 0
        ? Math.round((performance.completed / (performance.completed + performance.inProgress)) * 100)
        : 0;

    // Get urgent tasks count
    const urgentCount = useMemo(() => {
        return recentTasks.filter(task => {
            if (task.status === 'selesai') return false;
            const info = getDeadlineInfo(task.tenggat_waktu, task.status);
            return info?.isLate || info?.isUrgent;
        }).length;
    }, [recentTasks]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'selesai':
                return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 text-[10px] gap-0.5 px-1.5"><CheckCircle2 className="h-3 w-3" /> Selesai</Badge>;
            case 'sedang_dikerjakan':
                return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 text-[10px] gap-0.5 px-1.5"><Play className="h-3 w-3" /> Aktif</Badge>;
            default:
                return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 text-[10px] gap-0.5 px-1.5"><Target className="h-3 w-3" /> Belum Dikerjakan</Badge>;
        }
    };

    const getStatusBorderColor = (status: string) => {
        switch (status) {
            case 'selesai': return '#10b981';
            case 'sedang_dikerjakan': return '#3b82f6';
            default: return '#f59e0b';
        }
    };

    const formatDuration = (seconds: number) => {
        if (!seconds || seconds === 0) return null;
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}j ${m}m`;
        if (m > 0) return `${m}m`;
        return `${seconds}s`;
    };

    return (
        <MobileLayout>
            <Head title="Beranda" />
            <div className="min-h-screen bg-muted/30 dark:bg-slate-950 pb-24 transition-colors duration-300">
                {/* Header */}
                <div className="bg-gradient-to-br from-primary via-primary to-primary/80 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-5 pb-6 pt-5 text-primary-foreground dark:text-white border-b-0 dark:border-b dark:border-slate-800 transition-all duration-300">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm opacity-80">
                                {format(new Date(), 'EEEE, d MMMM yyyy', { locale: id })}
                            </div>
                            <h1 className="text-xl font-bold mt-1">
                                Halo, {user?.name || 'Pelaksana'}! 👋
                            </h1>
                            {user?.tempat && (
                                <div className="text-xs opacity-70 mt-0.5">
                                    📍 {user.tempat}
                                </div>
                            )}
                        </div>
                        <img
                            src="/assets/images/kerjo.png"
                            alt="Kerjo Logo"
                            className="h-12 w-12 object-contain rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-black/5"
                        />
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="px-4 -mt-3 space-y-3">
                    {/* Quick Stats Row */}
                    <div className="grid grid-cols-4 gap-2">
                        <Card className="border-0 shadow-md">
                            <CardContent className="p-3 text-center">
                                <div className="text-2xl font-bold text-blue-600">{todayTasks}</div>
                                <div className="text-[10px] text-muted-foreground uppercase">Hari Ini</div>
                            </CardContent>
                        </Card>
                        <Card className="border-0 shadow-md">
                            <CardContent className="p-3 text-center">
                                <div className="text-2xl font-bold text-emerald-600">{performance.completed}</div>
                                <div className="text-[10px] text-muted-foreground uppercase">Selesai</div>
                            </CardContent>
                        </Card>
                        <Card className="border-0 shadow-md">
                            <CardContent className="p-3 text-center">
                                <div className="text-2xl font-bold text-amber-600">{performance.inProgress}</div>
                                <div className="text-[10px] text-muted-foreground uppercase">Aktif</div>
                            </CardContent>
                        </Card>
                        <Card className={`border-0 shadow-md ${urgentCount > 0 ? 'bg-red-50 dark:bg-red-950/30' : ''}`}>
                            <CardContent className="p-3 text-center">
                                <div className={`text-2xl font-bold ${urgentCount > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                                    {urgentCount}
                                </div>
                                <div className="text-[10px] text-muted-foreground uppercase">Mendesak</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick Menu */}
                    <div>
                        <h2 className="font-bold text-sm mb-2">Quick Menu</h2>
                        <Card className="border-0 shadow-md">
                            <CardContent className="p-4">
                                <div className="grid grid-cols-4 gap-4">
                                    <Link href="/pelaksana/absensi" className="flex flex-col items-center gap-1.5 group">
                                        <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 group-active:scale-95 transition-transform">
                                            <Camera className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <span className="text-[11px] font-medium text-center">Absensi</span>
                                    </Link>
                                    <Link href="/pelaksana/tugas" className="flex flex-col items-center gap-1.5 group">
                                        <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/30 group-active:scale-95 transition-transform">
                                            <ListChecks className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <span className="text-[11px] font-medium text-center">Tugas</span>
                                    </Link>
                                    <Link href="/pelaksana/peralatan" className="flex flex-col items-center gap-1.5 group">
                                        <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/30 group-active:scale-95 transition-transform">
                                            <Wrench className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <span className="text-[11px] font-medium text-center">Peralatan</span>
                                    </Link>
                                    <Link href="/pelaksana/profil" className="flex flex-col items-center gap-1.5 group">
                                        <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/30 group-active:scale-95 transition-transform">
                                            <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <span className="text-[11px] font-medium text-center">Profil</span>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Progress Card */}
                    <Card className="border-0 shadow-md">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-primary" />
                                    <span className="font-medium text-sm">Tingkat Penyelesaian</span>
                                </div>
                                <span className="text-xl font-bold text-primary">{completionRate}%</span>
                            </div>
                            <Progress value={completionRate} className="h-2" />
                            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                                <span>{performance.completed} selesai</span>
                                <span>{performance.inProgress} berlangsung</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Average Time Card */}
                    <Card className="border-0 shadow-md">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                                <Timer className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div className="flex-1">
                                <div className="text-xs text-muted-foreground">Rata-rata waktu per tugas</div>
                                <div className="text-lg font-bold font-mono">{performance.averageTime || '00:00:00'}</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Tasks Section */}
                <div className="mt-6 px-4">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-bold text-base">Tugas Terbaru</h2>
                        <Link href="/pelaksana/tugas">
                            <Button variant="ghost" size="sm" className="text-primary gap-1 -mr-3 h-8">
                                Lihat Semua
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>

                    <div className="space-y-2">
                        {recentTasks.length === 0 ? (
                            <Card className="border-dashed">
                                <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                                    <CheckCircle2 className="h-10 w-10 mb-2 opacity-30" />
                                    <p className="font-medium">Tidak ada tugas terbaru</p>
                                </CardContent>
                            </Card>
                        ) : (
                            recentTasks.slice(0, 5).map(task => {
                                const deadlineInfo = task.tenggat_waktu ? getDeadlineInfo(task.tenggat_waktu, task.status) : null;
                                const isUrgent = deadlineInfo?.isLate || deadlineInfo?.isUrgent;

                                return (
                                    <Link key={task.id} href={`/pelaksana/tugas/${task.id}`}>
                                        <Card
                                            className="active:scale-[0.99] transition-transform hover:shadow-md border-l-4"
                                            style={{ borderLeftColor: getStatusBorderColor(task.status) }}
                                        >
                                            <CardContent className="p-3">
                                                {/* Title & Status Row */}
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <h3 className="font-medium text-sm truncate">{task.title}</h3>
                                                        {isUrgent && (
                                                            <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                                                        )}
                                                    </div>
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                                </div>

                                                {/* Info Row */}
                                                <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mb-2">
                                                    {/* Deadline */}
                                                    {task.tenggat_waktu && (
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {new Date(task.tenggat_waktu).toLocaleDateString('id-ID', {
                                                                day: 'numeric',
                                                                month: 'short'
                                                            })}
                                                        </span>
                                                    )}

                                                    {/* Duration */}
                                                    {task.total_durasi && task.total_durasi > 0 && (
                                                        <span className="flex items-center gap-1 font-medium text-foreground">
                                                            <Timer className="h-3 w-3" />
                                                            {formatDuration(task.total_durasi)}
                                                        </span>
                                                    )}

                                                    {/* Category */}
                                                    {task.kategori && (
                                                        <span className="flex items-center gap-1">
                                                            <Folder className="h-3 w-3" />
                                                            {task.kategori}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Status Badge */}
                                                <div className="flex items-center justify-between">
                                                    {getStatusBadge(task.status)}

                                                    {task.tenggat_waktu && task.status !== 'selesai' && (
                                                        <DeadlineStatus
                                                            deadline={task.tenggat_waktu}
                                                            status={task.status as 'pending' | 'sedang_dikerjakan' | 'selesai'}
                                                            className="text-[10px]"
                                                        />
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                );
                            })
                        )}
                    </div>
                </div>

            </div>
        </MobileLayout>
    );
}
