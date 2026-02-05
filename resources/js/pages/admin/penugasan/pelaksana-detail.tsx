import DeleteConfirmationDialog from '@/components/delete-confirmation-dialog';
import LocationMap from '@/components/location-map';
import { DeadlineStatusCompact } from '@/components/deadline-status';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type Penugasan, type Tugas, type User } from '@/types/logbook';
import { Head, router, useForm } from '@inertiajs/react';
import {
    ArrowLeft, Calendar as CalendarIcon, CalendarDays, CheckCircle2,
    Clock, Eye, FileDown, Folder, Loader2, MapPin, Navigation, Plus, Target, Timer, Trash2, User as UserIcon, X
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { type DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Props {
    pelaksana: User;
    penugasan: Penugasan[];
    tugasList: Tugas[];
    filters?: {
        date_from?: string;
        date_to?: string;
        status?: string;
    };
}

interface GroupedTasks {
    [key: string]: Penugasan[];
}

export default function PelaksanaDetail({ pelaksana, penugasan, tugasList, filters }: Props) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>(filters?.status || 'all');
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
    const [exportDateRange, setExportDateRange] = useState<DateRange | undefined>(undefined);
    const [exportStatusFilter, setExportStatusFilter] = useState<string>('all');
    const [gettingLocation, setGettingLocation] = useState(false);

    // Date range state
    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
        if (filters?.date_from || filters?.date_to) {
            return {
                from: filters.date_from ? new Date(filters.date_from) : undefined,
                to: filters.date_to ? new Date(filters.date_to) : undefined,
            };
        }
        return undefined;
    });

    // Form for creating new penugasan
    const form = useForm({
        tugas_id: '',
        pengguna_id: pelaksana.id.toString(),
        tenggat_waktu: '',
        catatan: '',
        // Location fields
        lokasi_latitude: '',
        lokasi_longitude: '',
        lokasi_radius: '100',
        lokasi_nama: '',
    });

    // Get current location using Geolocation API
    const getCurrentLocation = useCallback(() => {
        if (!navigator.geolocation) {
            alert('Geolocation tidak didukung di browser ini.');
            return;
        }

        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                form.setData(prev => ({
                    ...prev,
                    lokasi_latitude: position.coords.latitude.toFixed(6),
                    lokasi_longitude: position.coords.longitude.toFixed(6),
                }));
                setGettingLocation(false);
            },
            (error) => {
                setGettingLocation(false);
                let message = 'Gagal mendapatkan lokasi.';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message = 'Izin lokasi ditolak. Silakan aktifkan GPS.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message = 'Informasi lokasi tidak tersedia.';
                        break;
                    case error.TIMEOUT:
                        message = 'Waktu permintaan lokasi habis.';
                        break;
                }
                alert(message);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }, []); // Removed [form] to avoid infinite loop if form changes reference, though setData is stable? actually form.setData might not be stable? useForm returns an object.
    // Actually useForm's setData is stable enough. But let's avoid dependency issues.

    const handleLocationSelect = (lat: number, lng: number) => {
        form.setData('lokasi_latitude', lat.toFixed(6));
        form.setData('lokasi_longitude', lng.toFixed(6));
    };

    const handleDateRangeSelect = (range: DateRange | undefined) => {
        setDateRange(range);
    };

    const applyDateFilter = () => {
        setIsCalendarOpen(false);
        router.get(`/admin/penugasan/pelaksana/${pelaksana.id}`, {
            date_from: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
            date_to: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
            status: statusFilter === 'all' ? undefined : statusFilter,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const clearDateFilter = () => {
        setDateRange(undefined);
        setIsCalendarOpen(false);
        router.get(`/admin/penugasan/pelaksana/${pelaksana.id}`, {
            status: statusFilter === 'all' ? undefined : statusFilter,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleStatusChange = (value: string) => {
        setStatusFilter(value);
        router.get(`/admin/penugasan/pelaksana/${pelaksana.id}`, {
            date_from: filters?.date_from,
            date_to: filters?.date_to,
            status: value === 'all' ? undefined : value,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleDelete = (id: number) => {
        setDeletingId(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (deletingId) {
            setIsDeleting(true);
            router.delete(`/admin/penugasan/${deletingId}`, {
                onFinish: () => {
                    setIsDeleting(false);
                    setDeleteDialogOpen(false);
                    setDeletingId(null);
                },
            });
        }
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Ensure nulls are sent if empty strings for location
        const dataToSend = {
            ...form.data,
            lokasi_latitude: form.data.lokasi_latitude || null,
            lokasi_longitude: form.data.lokasi_longitude || null,
            lokasi_radius: (form.data.lokasi_latitude && form.data.lokasi_longitude) ? (form.data.lokasi_radius || 100) : null,
            lokasi_nama: form.data.lokasi_nama || null,
        };

        // We use router.post manually or form.post? form.post handles validation errors mapping automatically.
        // But logic to transform data is tricky with form.post unless we modify form data before.
        // form.transform allows modification.
        form.transform((data) => ({
            ...data,
            lokasi_latitude: data.lokasi_latitude || null,
            lokasi_longitude: data.lokasi_longitude || null,
            lokasi_radius: (data.lokasi_latitude && data.lokasi_longitude) ? (data.lokasi_radius || 100) : null,
            lokasi_nama: data.lokasi_nama || null,
        }));

        form.post('/admin/penugasan', {
            onSuccess: () => {
                setIsDialogOpen(false);
                form.reset();
            },
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

    // Group penugasan by created_at date
    const groupedTasks = useMemo(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const groups: GroupedTasks = {};

        penugasan.forEach((item) => {
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

        // Sort groups
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
    }, [penugasan]);

    // Stats
    const stats = useMemo(() => {
        const total = penugasan.length;
        const selesai = penugasan.filter(p => p.status === 'selesai').length;
        const active = penugasan.filter(p => p.status === 'sedang_dikerjakan').length;
        const pending = penugasan.filter(p => p.status === 'pending').length;
        return { total, selesai, active, pending };
    }, [penugasan]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'selesai':
                return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 gap-1"><CheckCircle2 className="h-3 w-3" /> Selesai</Badge>;
            case 'sedang_dikerjakan':
                return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Dikerjakan</Badge>;
            default:
                return <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300"><Target className="h-3 w-3" /> Pending</Badge>;
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

    const handleExportPdf = () => {
        const params = new URLSearchParams();
        if (exportDateRange?.from) params.set('date_from', format(exportDateRange.from, 'yyyy-MM-dd'));
        if (exportDateRange?.to) params.set('date_to', format(exportDateRange.to, 'yyyy-MM-dd'));
        if (exportStatusFilter !== 'all') params.set('status', exportStatusFilter);
        const url = `/admin/penugasan/pelaksana/${pelaksana.id}/export-pdf?${params.toString()}`;
        window.open(url, '_blank');
        setIsExportDialogOpen(false);
    };

    const hasLocation = !!(form.data.lokasi_latitude && form.data.lokasi_longitude);

    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/admin' },
            { title: 'Penugasan', href: '/admin/penugasan' },
            { title: pelaksana.name, href: '#' }
        ]}>
            <Head title={`Penugasan: ${pelaksana.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.get('/admin/penugasan')}
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="flex items-start gap-3">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <UserIcon className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold">{pelaksana.name}</h2>
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                    {pelaksana.kategori?.nama || 'Tanpa Kategori'}
                                    <span>•</span>
                                    {stats.total} penugasan
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsExportDialogOpen(true)}>
                            <FileDown className="mr-2 h-4 w-4" />
                            Export PDF
                        </Button>
                        <Button onClick={() => setIsDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Buat Penugasan
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                                <Target className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.pending}</p>
                                <p className="text-xs text-muted-foreground">Pending</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <Clock className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.active}</p>
                                <p className="text-xs text-muted-foreground">Dikerjakan</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.selesai}</p>
                                <p className="text-xs text-muted-foreground">Selesai</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="justify-between w-full md:w-auto"
                            >
                                <span className="flex items-center gap-2">
                                    <CalendarIcon className="h-4 w-4" />
                                    {getDateRangeLabel()}
                                </span>
                                {(dateRange?.from || dateRange?.to) && (
                                    <X
                                        className="h-4 w-4 ml-2 opacity-70 hover:opacity-100"
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
                                <p className="text-sm font-medium">Filter tanggal dibuat</p>
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
                                    Reset
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

                    <Select value={statusFilter} onValueChange={handleStatusChange}>
                        <SelectTrigger className="w-full md:w-[150px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="sedang_dikerjakan">Dikerjakan</SelectItem>
                            <SelectItem value="selesai">Selesai</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Penugasan List - Grouped by Date */}
                <div className="space-y-6">
                    {penugasan.length === 0 ? (
                        <div className="rounded-md border p-8 text-center text-muted-foreground">
                            <UserIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
                            <p className="font-medium">Belum ada penugasan</p>
                            <p className="text-sm opacity-70">
                                {(dateRange?.from || dateRange?.to)
                                    ? 'Tidak ada penugasan pada rentang tanggal ini'
                                    : 'Buat penugasan baru untuk pelaksana ini'}
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
                                    <span className={`text-sm font-semibold ${dateGroup === 'Hari Ini' ? 'text-primary' : 'text-muted-foreground'}`}>
                                        {dateGroup}
                                    </span>
                                    <div className="flex-1 h-px bg-border" />
                                    <span className="text-xs text-muted-foreground">{tasks.length}</span>
                                </div>

                                {/* Task Table */}
                                <div className="rounded-md border overflow-hidden">
                                    <table className="w-full text-sm">
                                        <tbody>
                                            {tasks.map((item) => {
                                                const totalDuration = item.items?.reduce((acc, i) => acc + (i.durasi_detik || 0), 0) || 0;
                                                return (
                                                    <tr key={item.id} className="border-b last:border-b-0 hover:bg-muted/50">
                                                        <td className="p-3">
                                                            <div className="font-medium">{item.tugas?.nama}</div>
                                                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                                                                <span className="flex items-center gap-1">
                                                                    <Folder className="h-3 w-3" />
                                                                    {item.tugas?.kategori?.nama}
                                                                </span>
                                                                {totalDuration > 0 && (
                                                                    <span className="flex items-center gap-1">
                                                                        <Timer className="h-3 w-3" />
                                                                        {formatDuration(totalDuration)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="p-3 hidden md:table-cell">
                                                            <DeadlineStatusCompact deadline={item.tenggat_waktu} status={item.status} />
                                                        </td>
                                                        <td className="p-3">
                                                            {getStatusBadge(item.status)}
                                                        </td>
                                                        <td className="p-3 text-right">
                                                            <div className="flex justify-end gap-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7"
                                                                    onClick={() => router.get(`/admin/penugasan/${item.id}`)}
                                                                >
                                                                    <Eye className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-destructive"
                                                                    onClick={() => handleDelete(item.id)}
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Create Penugasan Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Buat Penugasan untuk {pelaksana.name}</DialogTitle>
                            <DialogDescription>
                                Pilih tugas dan tentukan lokasi untuk pelaksana ini
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Tugas</Label>
                                        <Select
                                            value={form.data.tugas_id}
                                            onValueChange={(value) => form.setData('tugas_id', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih tugas" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {tugasList.map((t) => (
                                                    <SelectItem key={t.id} value={t.id.toString()}>
                                                        {t.nama} ({t.kategori?.nama})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {form.errors.tugas_id && (
                                            <p className="text-sm text-destructive">{form.errors.tugas_id}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Tenggat Waktu</Label>
                                        <Input
                                            type="datetime-local"
                                            value={form.data.tenggat_waktu}
                                            onChange={(e) => form.setData('tenggat_waktu', e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Catatan (Opsional)</Label>
                                        <Textarea
                                            value={form.data.catatan}
                                            onChange={(e) => form.setData('catatan', e.target.value)}
                                            placeholder="Catatan tambahan..."
                                            className="h-32"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 md:border-l md:pl-6 border-border flex flex-col">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-base font-semibold flex items-center gap-2">
                                            <MapPin className="h-4 w-4" />
                                            Lokasi Penugasan (Opsional)
                                        </Label>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={getCurrentLocation}
                                            disabled={gettingLocation}
                                        >
                                            {gettingLocation ? (
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            ) : (
                                                <Navigation className="h-4 w-4 mr-2" />
                                            )}
                                            Posisi Saya
                                        </Button>
                                    </div>

                                    <div className="relative flex-1 min-h-[300px] border rounded-md overflow-hidden bg-muted">
                                        <LocationMap
                                            latitude={parseFloat(form.data.lokasi_latitude) || null}
                                            longitude={parseFloat(form.data.lokasi_longitude) || null}
                                            radius={parseFloat(form.data.lokasi_radius) || 100}
                                            onLocationSelect={handleLocationSelect}
                                        />
                                        {!hasLocation && (
                                            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-3 py-1 rounded shadow text-xs text-muted-foreground z-[1000] pointer-events-none">
                                                Klik peta untuk set lokasi
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid gap-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="grid gap-1.5">
                                                <Label className="text-xs">Latitude</Label>
                                                <Input
                                                    type="number"
                                                    className="h-8 text-xs"
                                                    step="any"
                                                    value={form.data.lokasi_latitude}
                                                    onChange={(e) => form.setData('lokasi_latitude', e.target.value)}
                                                    placeholder="-6.200000"
                                                />
                                            </div>
                                            <div className="grid gap-1.5">
                                                <Label className="text-xs">Longitude</Label>
                                                <Input
                                                    type="number"
                                                    className="h-8 text-xs"
                                                    step="any"
                                                    value={form.data.lokasi_longitude}
                                                    onChange={(e) => form.setData('lokasi_longitude', e.target.value)}
                                                    placeholder="106.816666"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="grid gap-1.5">
                                                <Label className="text-xs">Radius (meter)</Label>
                                                <Input
                                                    type="number"
                                                    className="h-8 text-xs"
                                                    min="10"
                                                    max="10000"
                                                    value={form.data.lokasi_radius}
                                                    onChange={(e) => form.setData('lokasi_radius', e.target.value)}
                                                    placeholder="100"
                                                />
                                            </div>
                                            <div className="grid gap-1.5">
                                                <Label className="text-xs">Nama Lokasi</Label>
                                                <Input
                                                    className="h-8 text-xs"
                                                    value={form.data.lokasi_nama}
                                                    onChange={(e) => form.setData('lokasi_nama', e.target.value)}
                                                    placeholder="Gedung/Ruangan"
                                                />
                                            </div>
                                        </div>
                                        {/* Display errors for location fields if any */}
                                        {/* useForm errors are indexed by key */}
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Batal
                                </Button>
                                <Button type="submit" disabled={form.processing}>
                                    {form.processing ? 'Menyimpan...' : 'Simpan Penugasan'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <DeleteConfirmationDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    onConfirm={confirmDelete}
                    title="Batalkan Penugasan"
                    description="Apakah anda yakin ingin membatalkan penugasan ini? Tindakan ini tidak dapat dibatalkan."
                    isDeleting={isDeleting}
                />

                {/* Export PDF Dialog */}
                <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Export Laporan PDF</DialogTitle>
                            <DialogDescription>
                                Pilih rentang tanggal untuk export laporan penugasan {pelaksana.name}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label className="mb-2 block">Rentang Tanggal</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {exportDateRange?.from && exportDateRange?.to
                                                ? `${format(exportDateRange.from, 'd MMM yyyy', { locale: id })} - ${format(exportDateRange.to, 'd MMM yyyy', { locale: id })}`
                                                : exportDateRange?.from
                                                    ? `Dari ${format(exportDateRange.from, 'd MMM yyyy', { locale: id })}`
                                                    : 'Semua tanggal'}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="range"
                                            selected={exportDateRange}
                                            onSelect={setExportDateRange}
                                            numberOfMonths={2}
                                            locale={id}
                                        />
                                    </PopoverContent>
                                </Popover>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Kosongkan untuk export semua tanggal
                                </p>
                            </div>

                            <div>
                                <Label className="mb-2 block">Filter Status</Label>
                                <Select value={exportStatusFilter} onValueChange={setExportStatusFilter}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Pilih status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Status</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="sedang_dikerjakan">Aktif / Dikerjakan</SelectItem>
                                        <SelectItem value="selesai">Selesai</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Pilih status penugasan yang ingin di-export
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
                                Batal
                            </Button>
                            <Button onClick={handleExportPdf}>
                                <FileDown className="mr-2 h-4 w-4" />
                                Export PDF
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
