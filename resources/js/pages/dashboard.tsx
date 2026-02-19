"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import {
    ArrowRight, CheckCircle2, Clock, FileText, Target,
    TrendingUp, Users
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
];

interface Props {
    stats?: {
        todayPenugasan: number;
        todaySelesai: number;
        totalPenugasan: number;
        totalSelesai: number;
        totalDikerjakan: number;
        totalPending: number;
    };
    weeklyData?: Array<{
        date: string;
        label: string;
        dibuat: number;
        selesai: number;
    }>;
    pelaksanaStats?: Array<{
        id: number;
        name: string;
        total: number;
        selesai: number;
    }>;
    recentPenugasan?: Array<{
        id: number;
        tugas: string;
        pelaksana: string;
        status: string;
        created_at: string;
    }>;
}

const chartConfig: ChartConfig = {
    dibuat: {
        label: "Dibuat",
        color: "#3b82f6",
    },
    selesai: {
        label: "Selesai",
        color: "#10b981",
    },
};

const pieColors = ['#10b981', '#3b82f6', '#f59e0b'];

export default function Dashboard({ stats, weeklyData, pelaksanaStats, recentPenugasan }: Props) {
    const { auth } = usePage<SharedData>().props;
    const isPimpinan = auth.user.peran === 'pimpinan';
    const basePath = isPimpinan ? '/pimpinan' : '/admin';

    // If no admin data (shouldn't happen, but fallback)
    if (!stats) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Dashboard" />
                <div className="flex h-full flex-1 items-center justify-center">
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </AppLayout>
        );
    }

    const pieData = [
        { name: 'Selesai', value: stats.totalSelesai },
        { name: 'Dikerjakan', value: stats.totalDikerjakan },
        { name: 'Pending', value: stats.totalPending },
    ];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'selesai':
                return <Badge className="bg-emerald-100 text-emerald-700">Selesai</Badge>;
            case 'sedang_dikerjakan':
                return <Badge variant="secondary">Dikerjakan</Badge>;
            default:
                return <Badge variant="outline" className="text-amber-600">Pending</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{isPimpinan ? 'Dashboard Pimpinan' : 'Dashboard Admin'}</h1>
                        <p className="text-muted-foreground">Ringkasan harian dan statistik penugasan</p>
                    </div>
                    <Link href={`${basePath}/report`}>
                        <Badge variant="outline" className="gap-1 cursor-pointer hover:bg-muted">
                            <FileText className="h-3 w-3" />
                            Lihat Laporan Lengkap
                            <ArrowRight className="h-3 w-3" />
                        </Badge>
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Penugasan Hari Ini</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.todayPenugasan}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.todaySelesai} selesai hari ini
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Selesai</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600">{stats.totalSelesai}</div>
                            <p className="text-xs text-muted-foreground">
                                dari {stats.totalPenugasan} total penugasan
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Sedang Dikerjakan</CardTitle>
                            <Clock className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{stats.totalDikerjakan}</div>
                            <p className="text-xs text-muted-foreground">penugasan aktif</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Pending</CardTitle>
                            <Target className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-600">{stats.totalPending}</div>
                            <p className="text-xs text-muted-foreground">menunggu dikerjakan</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Row */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Weekly Bar Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Penugasan Minggu Ini</CardTitle>
                            <CardDescription>Penugasan dibuat vs selesai per hari</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {weeklyData && weeklyData.length > 0 ? (
                                <ChartContainer config={chartConfig} className="h-[250px]">
                                    <BarChart data={weeklyData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis
                                            dataKey="label"
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            tickLine={false}
                                            axisLine={false}
                                            width={30}
                                        />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Bar dataKey="dibuat" fill="var(--color-dibuat)" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="selesai" fill="var(--color-selesai)" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ChartContainer>
                            ) : (
                                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                                    Belum ada data
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Status Distribution Pie */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Distribusi Status</CardTitle>
                            <CardDescription>Pembagian status penugasan saat ini</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[250px] flex items-center justify-center">
                                {stats.totalPenugasan > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={90}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={pieColors[index]} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-muted-foreground">Belum ada penugasan</p>
                                )}
                            </div>
                            <div className="flex justify-center gap-4 mt-2">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                                    <span className="text-sm text-muted-foreground">Selesai ({stats.totalSelesai})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                                    <span className="text-sm text-muted-foreground">Dikerjakan ({stats.totalDikerjakan})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-amber-500" />
                                    <span className="text-sm text-muted-foreground">Pending ({stats.totalPending})</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Bottom Row */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Top Pelaksana */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Top Pelaksana
                            </CardTitle>
                            <CardDescription>Pelaksana dengan penugasan selesai terbanyak</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {pelaksanaStats && pelaksanaStats.length > 0 ? (
                                <div className="space-y-3">
                                    {pelaksanaStats.map((p, idx) => (
                                        <div key={p.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${idx === 0 ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'}`}>
                                                    {idx + 1}
                                                </div>
                                                <span className="font-medium">{p.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-emerald-600 font-medium">{p.selesai}</span>
                                                <span className="text-muted-foreground">/ {p.total}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-sm">Belum ada data</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Activity */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Aktivitas Terbaru</CardTitle>
                            <CardDescription>Penugasan terakhir dibuat</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {recentPenugasan && recentPenugasan.length > 0 ? (
                                <div className="space-y-3">
                                    {recentPenugasan.slice(0, 5).map((p) => (
                                        <Link
                                            key={p.id}
                                            href={`${basePath}/penugasan/${p.id}`}
                                            className="flex items-center justify-between hover:bg-muted/50 -mx-2 px-2 py-1 rounded-md"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium truncate">{p.tugas}</p>
                                                <p className="text-xs text-muted-foreground">{p.pelaksana}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                {getStatusBadge(p.status)}
                                                <span className="text-xs text-muted-foreground">
                                                    {format(new Date(p.created_at), 'd MMM', { locale: id })}
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-sm">Belum ada aktivitas</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
