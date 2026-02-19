"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type Kategori, type User } from '@/types/logbook';
import { Head, router, usePage } from '@inertiajs/react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    PieChart, Pie, Cell
} from 'recharts';
import {
    Calendar as CalendarIcon, CheckCircle2, Clock, Download,
    FileText, Target, Timer, Users, X, Check, ChevronsUpDown
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { type DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface PenugasanItem {
    id: number;
    tugas: string;
    kategori: string;
    pelaksana: string;
    status: string;
    created_at: string;
    durasi: number;
}

interface Props {
    penugasan: PenugasanItem[];
    stats: {
        total: number;
        selesai: number;
        dikerjakan: number;
        pending: number;
        totalDurasi: number;
    };
    chartData: Array<{
        date: string;
        label: string;
        total: number;
        selesai: number;
        pending: number;
    }>;
    statusDistribution: Array<{
        name: string;
        value: number;
        color: string;
    }>;
    pelaksanaPerformance: Array<{
        name: string;
        total: number;
        selesai: number;
        durasi: number;
    }>;
    filters: {
        period: string;
        date_from?: string;
        date_to?: string;
        kategori?: string;
        pelaksana?: string;
    };
    kategoriList: Kategori[];
    pelaksanaList: User[];
    basePath?: string;
}

const chartConfig: ChartConfig = {
    total: { label: "Total", color: "#3b82f6" },
    selesai: { label: "Selesai", color: "#10b981" },
    pending: { label: "Pending", color: "#f59e0b" },
};

export default function ReportIndex({
    penugasan,
    stats,
    chartData,
    statusDistribution,
    pelaksanaPerformance,
    filters,
    kategoriList,
    pelaksanaList,
    basePath: basePathProp,
}: Props) {
    const { auth } = usePage<{ auth: { user: { peran: string } } }>().props;
    const basePath = basePathProp || '/admin';

    const [period, setPeriod] = useState(filters.period || 'month');
    const [kategoriFilter, setKategoriFilter] = useState(filters.kategori || 'all');
    const [pelaksanaFilter, setPelaksanaFilter] = useState(filters.pelaksana || 'all');
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
        if (filters.date_from || filters.date_to) {
            return {
                from: filters.date_from ? new Date(filters.date_from) : undefined,
                to: filters.date_to ? new Date(filters.date_to) : undefined,
            };
        }
        return undefined;

    });

    const [isKategoriOpen, setIsKategoriOpen] = useState(false);
    const [kategoriSearch, setKategoriSearch] = useState('');

    const groupedKategori = useMemo(() => {
        const filtered = kategoriList.filter(k =>
            k.nama.toLowerCase().includes(kategoriSearch.toLowerCase()) ||
            (k.bidang?.nama || '').toLowerCase().includes(kategoriSearch.toLowerCase())
        );

        const groups: Record<string, typeof kategoriList> = {};
        filtered.forEach(k => {
            const bidang = k.bidang?.nama || 'Lainnya';
            if (!groups[bidang]) groups[bidang] = [];
            groups[bidang].push(k);
        });

        return groups;
    }, [kategoriList, kategoriSearch]);

    const selectedKategoriLabel = useMemo(() => {
        if (kategoriFilter === 'all') return 'Semua Kategori';
        return kategoriList.find(k => k.id.toString() === kategoriFilter)?.nama || 'Pilih Kategori';
    }, [kategoriFilter, kategoriList]);

    const applyFilters = (overrides?: Record<string, string | undefined>) => {
        const newKategori = overrides && 'kategori' in overrides ? overrides.kategori : kategoriFilter;
        const newPelaksana = overrides && 'pelaksana' in overrides ? overrides.pelaksana : pelaksanaFilter;
        const newPeriod = overrides && 'period' in overrides ? overrides.period : period;

        const params: Record<string, string | undefined> = {
            period: newPeriod,
            kategori: newKategori !== 'all' ? newKategori : undefined,
            pelaksana: newPelaksana !== 'all' ? newPelaksana : undefined,
        };

        if (params.period === 'custom' && dateRange) {
            params.date_from = dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
            params.date_to = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined;
        }

        router.get(`${basePath}/report`, params, { preserveState: true, preserveScroll: true });
    };

    const handlePeriodChange = (value: string) => {
        setPeriod(value);
        if (value !== 'custom') {
            applyFilters({ period: value });
        }
    };

    const handleKategoriChange = (value: string) => {
        setKategoriFilter(value);
        applyFilters({ kategori: value });
    };

    const handlePelaksanaChange = (value: string) => {
        setPelaksanaFilter(value);
        applyFilters({ pelaksana: value });
    };



    const applyDateRange = () => {
        setIsCalendarOpen(false);
        applyFilters({ period: 'custom' });
    };

    const formatDuration = (seconds: number) => {
        if (!seconds || seconds === 0) return '-';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}j ${m}m`;
        if (m > 0) return `${m} menit`;
        return `${seconds} detik`;
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'selesai':
                return <Badge className="bg-emerald-100 text-emerald-700 gap-1"><CheckCircle2 className="h-3 w-3" /> Selesai</Badge>;
            case 'sedang_dikerjakan':
                return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Dikerjakan</Badge>;
            default:
                return <Badge variant="outline" className="text-amber-600 gap-1"><Target className="h-3 w-3" /> Pending</Badge>;
        }
    };

    const getPeriodLabel = () => {
        switch (period) {
            case 'today': return 'Hari Ini';
            case 'week': return 'Minggu Ini';
            case 'month': return 'Bulan Ini';
            case 'year': return 'Tahun Ini';
            case 'custom':
                if (dateRange?.from && dateRange?.to) {
                    return `${format(dateRange.from, 'd MMM', { locale: id })} - ${format(dateRange.to, 'd MMM yyyy', { locale: id })}`;
                }
                return 'Custom';
            default: return 'Bulan Ini';
        }
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: basePath === '/pimpinan' ? '/dashboard' : '/admin' },
            { title: 'Laporan', href: `${basePath}/report` }
        ]}>
            <Head title="Laporan Penugasan" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <FileText className="h-6 w-6" />
                            Laporan Penugasan
                        </h1>
                        <p className="text-muted-foreground">Analisis dan statistik penugasan: {getPeriodLabel()}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                    <Select value={period} onValueChange={handlePeriodChange}>
                        <SelectTrigger className="w-[150px]">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Periode" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">Hari Ini</SelectItem>
                            <SelectItem value="week">Minggu Ini</SelectItem>
                            <SelectItem value="month">Bulan Ini</SelectItem>
                            <SelectItem value="year">Tahun Ini</SelectItem>
                            <SelectItem value="custom">Custom Range</SelectItem>
                        </SelectContent>
                    </Select>

                    {period === 'custom' && (
                        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="gap-2">
                                    <CalendarIcon className="h-4 w-4" />
                                    {dateRange?.from && dateRange?.to
                                        ? `${format(dateRange.from, 'd MMM', { locale: id })} - ${format(dateRange.to, 'd MMM', { locale: id })}`
                                        : 'Pilih tanggal'}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="range"
                                    selected={dateRange}
                                    onSelect={setDateRange}
                                    numberOfMonths={2}
                                    locale={id}
                                />
                                <div className="p-3 border-t flex gap-2">
                                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setIsCalendarOpen(false)}>
                                        Batal
                                    </Button>
                                    <Button size="sm" className="flex-1" onClick={applyDateRange}>
                                        Terapkan
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}

                    <Popover open={isKategoriOpen} onOpenChange={setIsKategoriOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={isKategoriOpen}
                                className="w-[200px] justify-between"
                            >
                                {selectedKategoriLabel}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0">
                            <div className="p-2 border-b">
                                <Input
                                    placeholder="Cari kategori..."
                                    value={kategoriSearch}
                                    onChange={(e) => setKategoriSearch(e.target.value)}
                                    className="border-none focus-visible:ring-0 px-2 h-8"
                                />
                            </div>
                            <ScrollArea className="h-[250px]">
                                <div className="p-1">
                                    <div
                                        className={cn(
                                            "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                            kategoriFilter === 'all' && "bg-accent text-accent-foreground"
                                        )}
                                        onClick={() => {
                                            handleKategoriChange('all');
                                            setIsKategoriOpen(false);
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                kategoriFilter === 'all' ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        Semua Kategori
                                    </div>

                                    {Object.entries(groupedKategori).map(([bidang, items]) => (
                                        <div key={bidang} className="mt-2">
                                            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground sticky top-0 bg-popover z-10">
                                                {bidang}
                                            </div>
                                            {items.map((k) => (
                                                <div
                                                    key={k.id}
                                                    className={cn(
                                                        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                                        k.id.toString() === kategoriFilter && "bg-accent text-accent-foreground"
                                                    )}
                                                    onClick={() => {
                                                        handleKategoriChange(k.id.toString());
                                                        setIsKategoriOpen(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            k.id.toString() === kategoriFilter ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {k.nama}
                                                </div>
                                            ))}
                                        </div>
                                    ))}

                                    {Object.keys(groupedKategori).length === 0 && (
                                        <div className="py-6 text-center text-sm text-muted-foreground">
                                            Tidak ada kategori ditemukan.
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </PopoverContent>
                    </Popover>

                    <Select value={pelaksanaFilter} onValueChange={handlePelaksanaChange}>
                        <SelectTrigger className="w-[180px]">
                            <Users className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Pelaksana" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Pelaksana</SelectItem>
                            {pelaksanaList.map((p) => (
                                <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold">{stats.total}</div>
                            <p className="text-sm text-muted-foreground">Total Penugasan</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-emerald-600">{stats.selesai}</div>
                            <p className="text-sm text-muted-foreground">Selesai</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-blue-600">{stats.dikerjakan}</div>
                            <p className="text-sm text-muted-foreground">Dikerjakan</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
                            <p className="text-sm text-muted-foreground">Pending</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold">{formatDuration(stats.totalDurasi)}</div>
                            <p className="text-sm text-muted-foreground">Total Durasi</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Bar Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Tren Penugasan</CardTitle>
                            <CardDescription>Penugasan per tanggal dalam periode</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {chartData.length > 0 ? (
                                <ChartContainer config={chartConfig} className="h-[300px]">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="label" tickLine={false} axisLine={false} />
                                        <YAxis tickLine={false} axisLine={false} width={30} />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="selesai" fill="var(--color-selesai)" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ChartContainer>
                            ) : (
                                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                    Tidak ada data untuk periode ini
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Pie Chart + Top Pelaksana */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Distribusi Status & Pelaksana</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Mini Pie */}
                            <div className="flex items-center gap-4">
                                <div className="h-[120px] w-[120px]">
                                    {stats.total > 0 ? (
                                        <PieChart width={120} height={120}>
                                            <Pie
                                                data={statusDistribution}
                                                cx={55}
                                                cy={55}
                                                innerRadius={35}
                                                outerRadius={55}
                                                dataKey="value"
                                            >
                                                {statusDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                                            No data
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 space-y-1">
                                    {statusDistribution.map((item) => (
                                        <div key={item.name} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                                                <span>{item.name}</span>
                                            </div>
                                            <span className="font-medium">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Top Pelaksana */}
                            <div className="border-t pt-3">
                                <p className="text-sm font-medium mb-2">Top Pelaksana</p>
                                <div className="space-y-2">
                                    {pelaksanaPerformance.slice(0, 5).map((p, idx) => (
                                        <div key={p.name} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className="text-muted-foreground w-4">{idx + 1}.</span>
                                                <span className="truncate max-w-[150px]">{p.name}</span>
                                            </div>
                                            <span className="text-emerald-600 font-medium">{p.selesai}/{p.total}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Detail Penugasan</CardTitle>
                        <CardDescription>{penugasan.length} penugasan dalam periode {getPeriodLabel()}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tugas</TableHead>
                                        <TableHead>Kategori</TableHead>
                                        <TableHead>Pelaksana</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Durasi</TableHead>
                                        <TableHead>Tanggal</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {penugasan.length > 0 ? (
                                        penugasan.slice(0, 20).map((p) => (
                                            <TableRow key={p.id}>
                                                <TableCell className="font-medium">{p.tugas}</TableCell>
                                                <TableCell>{p.kategori}</TableCell>
                                                <TableCell>{p.pelaksana}</TableCell>
                                                <TableCell>{getStatusBadge(p.status)}</TableCell>
                                                <TableCell>{formatDuration(p.durasi)}</TableCell>
                                                <TableCell>{format(new Date(p.created_at), 'd MMM yyyy', { locale: id })}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                Tidak ada penugasan dalam periode ini
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        {penugasan.length > 20 && (
                            <p className="text-sm text-muted-foreground mt-2 text-center">
                                Menampilkan 20 dari {penugasan.length} penugasan
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
