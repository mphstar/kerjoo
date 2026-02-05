import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import DeadlineStatus, { getDeadlineInfo, formatDeadlineDateTime } from '@/components/deadline-status';
import MobileLayout from '@/layouts/mobile-layout';
import { type Penugasan } from '@/types/logbook';
import { Head, Link, router } from '@inertiajs/react';
import {
    Calendar as CalendarIcon, CheckCircle2, ListTodo, AlertTriangle,
    Play, Target, Timer, ChevronRight, Folder, X, CalendarDays
} from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { type DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Props {
    penugasan: Penugasan[];
    filters?: {
        date_from?: string;
        date_to?: string;
    };
}

interface GroupedTasks {
    [key: string]: Penugasan[];
}

// Priority order for groups
const GROUP_PRIORITY: Record<string, number> = {
    'Mendesak': 0,
    'Hari Ini': 1,
    'Besok': 2,
};

export default function TugasIndex({ penugasan, filters }: Props) {
    const [activeFilter, setActiveFilter] = useState<string>('all');
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    // Initialize date range from URL filters
    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
        if (filters?.date_from || filters?.date_to) {
            return {
                from: filters.date_from ? new Date(filters.date_from) : undefined,
                to: filters.date_to ? new Date(filters.date_to) : undefined,
            };
        }
        return undefined;
    });

    // Apply date filter when range changes
    const handleDateRangeSelect = (range: DateRange | undefined) => {
        setDateRange(range);
    };

    const applyDateFilter = () => {
        setIsCalendarOpen(false);
        router.get('/pelaksana/tugas', {
            date_from: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
            date_to: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const clearDateFilter = () => {
        setDateRange(undefined);
        setIsCalendarOpen(false);
        router.get('/pelaksana/tugas', {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Format date range for display
    const getDateRangeLabel = () => {
        if (!dateRange?.from && !dateRange?.to) return 'Semua Tanggal';
        if (dateRange.from && dateRange.to) {
            if (dateRange.from.getTime() === dateRange.to.getTime()) {
                return format(dateRange.from, 'd MMM yyyy', { locale: id });
            }
            return `${format(dateRange.from, 'd MMM', { locale: id })} - ${format(dateRange.to, 'd MMM yyyy', { locale: id })}`;
        }
        if (dateRange.from) return `Dari ${format(dateRange.from, 'd MMM yyyy', { locale: id })}`;
        if (dateRange.to) return `Sampai ${format(dateRange.to, 'd MMM yyyy', { locale: id })}`;
        return 'Semua Tanggal';
    };

    // Filter tasks based on active filter (status filter)
    const filteredTasks = useMemo(() => {
        if (activeFilter === 'all') return penugasan;
        return penugasan.filter(p => {
            if (activeFilter === 'urgent') {
                const info = getDeadlineInfo(p.tenggat_waktu, p.status);
                return (info?.isLate || info?.isUrgent) && p.status !== 'selesai';
            }
            return p.status === activeFilter;
        });
    }, [penugasan, activeFilter]);

    // Sort tasks by created_at (newest first within each group)
    const sortedTasks = useMemo(() => {
        return [...filteredTasks].sort((a, b) => {
            // Keep completed tasks at the end
            if (a.status === 'selesai' && b.status !== 'selesai') return 1;
            if (a.status !== 'selesai' && b.status === 'selesai') return -1;
            // Sort by created_at descending (newest first)
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA;
        });
    }, [filteredTasks]);

    // Group tasks by created_at date
    const groupedTasks = useMemo(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const groups: GroupedTasks = {};

        sortedTasks.forEach((item) => {
            let groupKey: string;

            if (!item.created_at) {
                groupKey = 'Tanpa Tanggal';
            } else {
                const createdDate = new Date(item.created_at);
                const createdDateOnly = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate());

                if (createdDateOnly.getTime() === today.getTime()) {
                    groupKey = 'Hari Ini';
                } else if (createdDateOnly.getTime() === yesterday.getTime()) {
                    groupKey = 'Kemarin';
                } else {
                    groupKey = createdDateOnly.toLocaleDateString('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                    });
                }
            }

            if (!groups[groupKey]) groups[groupKey] = [];
            groups[groupKey].push(item);
        });

        // Sort groups: Hari Ini first, then Kemarin, then by date descending
        const sortedEntries = Object.entries(groups).sort(([a], [b]) => {
            if (a === 'Hari Ini') return -1;
            if (b === 'Hari Ini') return 1;
            if (a === 'Kemarin') return -1;
            if (b === 'Kemarin') return 1;
            if (a === 'Tanpa Tanggal') return 1;
            if (b === 'Tanpa Tanggal') return -1;
            return 0;
        });

        return Object.fromEntries(sortedEntries);
    }, [sortedTasks]);

    // Stats
    const stats = useMemo(() => {
        const total = penugasan.length;
        const selesai = penugasan.filter(p => p.status === 'selesai').length;
        const active = penugasan.filter(p => p.status === 'sedang_dikerjakan').length;
        const pending = penugasan.filter(p => p.status === 'pending').length;
        const urgent = penugasan.filter(p => {
            if (p.status === 'selesai') return false;
            const info = getDeadlineInfo(p.tenggat_waktu, p.status);
            return info?.isLate || info?.isUrgent;
        }).length;
        return { total, selesai, active, pending, urgent };
    }, [penugasan]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'selesai':
                return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 gap-1"><CheckCircle2 className="h-3 w-3" /> Selesai</Badge>;
            case 'sedang_dikerjakan':
                return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 gap-1"><Play className="h-3 w-3" /> Aktif</Badge>;
            default:
                return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 gap-1"><Target className="h-3 w-3" /> Pending</Badge>;
        }
    };

    const getStatusBorderColor = (status: string) => {
        switch (status) {
            case 'selesai': return '#10b981';
            case 'sedang_dikerjakan': return '#3b82f6';
            default: return '#f59e0b';
        }
    };

    const getGroupIcon = (groupKey: string) => {
        if (groupKey === 'Hari Ini') return <CalendarDays className="h-4 w-4 text-primary" />;
        if (groupKey === 'Kemarin') return <CalendarDays className="h-4 w-4 text-muted-foreground" />;
        return <CalendarIcon className="h-4 w-4 text-muted-foreground" />;
    };

    const formatDuration = (seconds: number) => {
        if (!seconds || seconds === 0) return null;
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}j ${m}m`;
        if (m > 0) return `${m} menit`;
        return `${seconds} detik`;
    };

    const filterOptions = [
        { key: 'all', label: 'Semua', count: stats.total },
        { key: 'urgent', label: 'Mendesak', count: stats.urgent, color: 'text-red-600' },
        { key: 'sedang_dikerjakan', label: 'Aktif', count: stats.active },
        { key: 'pending', label: 'Pending', count: stats.pending },
        { key: 'selesai', label: 'Selesai', count: stats.selesai },
    ];

    return (
        <MobileLayout>
            <Head title="Tugas Saya" />

            <div className="min-h-screen bg-muted/30 dark:bg-slate-950 pb-20 transition-colors duration-300">
                {/* Header with Date Filter */}
                <div className="bg-gradient-to-br from-primary via-primary to-primary/80 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4 py-5 text-primary-foreground dark:text-white transition-all duration-300">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold">Tugas Saya</h1>
                            <p className="text-sm opacity-80 mt-0.5">{stats.total} tugas · {stats.selesai} selesai</p>
                        </div>
                    </div>

                    {/* Date Range Picker */}
                    <div className="mt-3">
                        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="secondary"
                                    className="w-full justify-between bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground border-0"
                                >
                                    <span className="flex items-center gap-2">
                                        <CalendarIcon className="h-4 w-4" />
                                        {getDateRangeLabel()}
                                    </span>
                                    {(dateRange?.from || dateRange?.to) && (
                                        <X
                                            className="h-4 w-4 opacity-70 hover:opacity-100"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                clearDateFilter();
                                            }}
                                        />
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <div className="p-3 border-b">
                                    <p className="text-sm font-medium">Filter berdasarkan tanggal dibuat</p>
                                    <p className="text-xs text-muted-foreground">Pilih rentang tanggal penugasan</p>
                                </div>
                                <Calendar
                                    mode="range"
                                    selected={dateRange}
                                    onSelect={handleDateRangeSelect}
                                    numberOfMonths={1}
                                    locale={id}
                                />
                                <div className="p-3 border-t flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={clearDateFilter}
                                    >
                                        Semua Tanggal
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="flex-1"
                                        onClick={applyDateFilter}
                                    >
                                        Terapkan
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="bg-background border-b sticky top-0 z-10">
                    <div className="flex overflow-x-auto scrollbar-hide">
                        {filterOptions.map(option => (
                            <button
                                key={option.key}
                                onClick={() => setActiveFilter(option.key)}
                                className={`shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeFilter === option.key
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                                    } ${option.color || ''}`}
                            >
                                {option.label}
                                {option.count > 0 && (
                                    <span className="ml-1.5 text-xs opacity-60">({option.count})</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Task List */}
                <div className="p-4 space-y-6">
                    {filteredTasks.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
                            <p className="font-medium">Tidak ada tugas</p>
                            <p className="text-sm opacity-70">
                                {activeFilter === 'all'
                                    ? (dateRange?.from || dateRange?.to)
                                        ? 'Tidak ada tugas pada rentang tanggal ini'
                                        : 'Belum ada tugas yang diberikan'
                                    : `Tidak ada tugas ${activeFilter}`}
                            </p>
                            {(dateRange?.from || dateRange?.to) && (
                                <Button
                                    variant="link"
                                    size="sm"
                                    className="mt-2"
                                    onClick={clearDateFilter}
                                >
                                    Tampilkan semua tanggal
                                </Button>
                            )}
                        </div>
                    ) : (
                        Object.entries(groupedTasks).map(([dateGroup, tasks]) => (
                            <div key={dateGroup} className="space-y-3">
                                {/* Group Header */}
                                <div className="flex items-center gap-2 px-1">
                                    {getGroupIcon(dateGroup)}
                                    <span className={`text-sm font-semibold ${dateGroup === 'Hari Ini' ? 'text-primary' :
                                        'text-muted-foreground'
                                        }`}>
                                        {dateGroup}
                                    </span>
                                    <div className="flex-1 h-px bg-border" />
                                    <span className="text-xs text-muted-foreground">{tasks.length}</span>
                                </div>

                                {/* Task Cards */}
                                <div className="space-y-2">
                                    {tasks.map((item) => {
                                        const deadlineInfo = item.tenggat_waktu ? getDeadlineInfo(item.tenggat_waktu, item.status) : null;
                                        const isUrgent = deadlineInfo?.isLate || deadlineInfo?.isUrgent;

                                        // Calculate total duration from items
                                        const totalDuration = item.items?.reduce((acc, i) => acc + (i.durasi_detik || 0), 0) || 0;
                                        const completedSessions = item.items?.filter(i => i.status === 'selesai').length || 0;
                                        const totalSessions = item.items?.length || 0;

                                        return (
                                            <Link key={item.id} href={`/pelaksana/tugas/${item.id}`}>
                                                <Card
                                                    className="active:scale-[0.99] transition-transform hover:shadow-md border-l-4"
                                                    style={{ borderLeftColor: getStatusBorderColor(item.status) }}
                                                >
                                                    <CardContent className="p-4">
                                                        {/* Title Row */}
                                                        <div className="flex items-start justify-between gap-2 mb-2">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <h3 className="font-semibold truncate">{item.tugas?.nama}</h3>
                                                                    {isUrgent && (
                                                                        <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                                                                    )}
                                                                </div>
                                                                {item.tugas?.deskripsi && (
                                                                    <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                                                                        {item.tugas.deskripsi}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                                                        </div>

                                                        {/* Info Row */}
                                                        <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                                                            {/* Created At - for grouping reference */}
                                                            {item.created_at && (
                                                                <span className="flex items-center gap-1 text-primary/70">
                                                                    <CalendarDays className="h-3.5 w-3.5" />
                                                                    Dibuat: {format(new Date(item.created_at), 'd MMM yyyy', { locale: id })}
                                                                </span>
                                                            )}

                                                            {/* Deadline */}
                                                            {item.tenggat_waktu && (
                                                                <span className="flex items-center gap-1">
                                                                    <CalendarIcon className="h-3.5 w-3.5" />
                                                                    Tenggat: {formatDeadlineDateTime(item.tenggat_waktu)}
                                                                </span>
                                                            )}

                                                            {/* Duration */}
                                                            {totalDuration > 0 && (
                                                                <span className="flex items-center gap-1 font-medium text-foreground">
                                                                    <Timer className="h-3.5 w-3.5" />
                                                                    {formatDuration(totalDuration)}
                                                                </span>
                                                            )}

                                                            {/* Sessions */}
                                                            {totalSessions > 0 && (
                                                                <span className="flex items-center gap-1">
                                                                    <ListTodo className="h-3.5 w-3.5" />
                                                                    {completedSessions}/{totalSessions} sesi
                                                                </span>
                                                            )}

                                                            {/* Category */}
                                                            {item.tugas?.kategori?.nama && (
                                                                <span className="flex items-center gap-1">
                                                                    <Folder className="h-3.5 w-3.5" />
                                                                    {item.tugas.kategori.nama}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Bottom Row: Status & Deadline Status */}
                                                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                                                            {getStatusBadge(item.status)}

                                                            {item.tenggat_waktu && item.status !== 'selesai' && (
                                                                <DeadlineStatus
                                                                    deadline={item.tenggat_waktu}
                                                                    status={item.status}
                                                                    className="text-xs"
                                                                />
                                                            )}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </MobileLayout>
    );
}
