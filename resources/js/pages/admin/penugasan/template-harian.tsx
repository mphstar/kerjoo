import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { TemplatePenugasanHarian, Tugas, User } from '@/types/logbook';
import { Head, router, useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { AlertTriangle, Edit, Plus, Trash2, Copy, MapPin, Navigation, Loader2, CalendarIcon, Play, Users, Moon } from 'lucide-react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import LocationMap from '@/components/location-map';

const TIPE_OPTIONS = [
    { value: 'harian', label: 'Harian' },
    { value: 'mingguan', label: 'Mingguan' },
    { value: 'bulanan', label: 'Bulanan' },
    { value: 'tahunan', label: 'Tahunan' },
    { value: 'lainnya', label: 'Lainnya' },
];

const TIPE_COLORS: Record<string, string> = {
    harian: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    mingguan: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
    bulanan: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    tahunan: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    lainnya: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Penugasan', href: '/admin/penugasan' },
    { title: 'Template Penugasan', href: '/admin/template-harian' },
];

interface Props {
    templates: {
        data: TemplatePenugasanHarian[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    tugasList: Tugas[];
    pelaksanaList: User[];
}

export default function TemplateHarianIndex({ templates, tugasList, pelaksanaList }: Props) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [triggerDialogOpen, setTriggerDialogOpen] = useState(false);
    const [editItem, setEditItem] = useState<TemplatePenugasanHarian | null>(null);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [triggerProcessing, setTriggerProcessing] = useState(false);
    const [triggerDate, setTriggerDate] = useState<Date | undefined>(new Date());
    const [holidayInfo, setHolidayInfo] = useState<{ is_holiday: boolean; holiday?: { nama: string; deskripsi?: string } } | null>(null);
    const [checkingHoliday, setCheckingHoliday] = useState(false);
    const [triggerError, setTriggerError] = useState<string | null>(null);
    const [triggerSuccess, setTriggerSuccess] = useState<string | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        nama: '',
        deskripsi: '',
        aktif: true,
        tipe: 'harian' as string,
        pengguna_id: '',
        tugas_ids: [] as string[],
        tenggat_waktu_jam: '17:00',
        deadline_hari_berikutnya: false,
        catatan: '',
        lokasi_latitude: '',
        lokasi_longitude: '',
        lokasi_radius: '100',
        lokasi_nama: '',
    });

    // Reset form when dialog closes
    useEffect(() => {
        if (!dialogOpen) {
            reset();
            setEditItem(null);
        }
    }, [dialogOpen]);

    // Check if selected trigger date is a holiday
    useEffect(() => {
        const checkHoliday = async () => {
            if (!triggerDate || !triggerDialogOpen) {
                setHolidayInfo(null);
                return;
            }

            setCheckingHoliday(true);
            try {
                const response = await fetch(`/admin/hari-libur/check?tanggal=${format(triggerDate, 'yyyy-MM-dd')}`);
                const result = await response.json();
                setHolidayInfo(result);
            } catch (error) {
                setHolidayInfo(null);
            } finally {
                setCheckingHoliday(false);
            }
        };

        checkHoliday();
    }, [triggerDate, triggerDialogOpen]);

    // Get selected pelaksana
    const selectedPelaksana = useMemo(() => {
        return pelaksanaList.find(u => u.id.toString() === data.pengguna_id);
    }, [pelaksanaList, data.pengguna_id]);

    // Filter tugas by pelaksana kategori
    const filteredTugasList = useMemo(() => {
        if (!selectedPelaksana || !selectedPelaksana.kategori_id) return [];
        return tugasList.filter(t => t.kategori_id === selectedPelaksana.kategori_id);
    }, [tugasList, selectedPelaksana]);

    // Get current location
    const getCurrentLocation = useCallback(() => {
        if (!navigator.geolocation) {
            alert('Geolocation tidak didukung di browser ini.');
            return;
        }

        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setData(prev => ({
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
    }, []);

    const handlePelaksanaChange = (value: string) => {
        setData(prev => ({
            ...prev,
            pengguna_id: value,
            tugas_ids: [], // Reset tugas selection when pelaksana changes
        }));
    };

    const toggleTugas = (tugasId: string) => {
        setData(prev => ({
            ...prev,
            tugas_ids: prev.tugas_ids.includes(tugasId)
                ? prev.tugas_ids.filter(id => id !== tugasId)
                : [...prev.tugas_ids, tugasId],
        }));
    };

    const handleLocationSelect = (lat: number, lng: number) => {
        setData(prev => ({
            ...prev,
            lokasi_latitude: lat.toFixed(6),
            lokasi_longitude: lng.toFixed(6),
        }));
    };

    const handleEdit = (item: TemplatePenugasanHarian) => {
        setEditItem(item);
        setData({
            nama: item.nama,
            deskripsi: item.deskripsi || '',
            aktif: item.aktif,
            tipe: item.tipe || 'harian',
            pengguna_id: item.pengguna_id?.toString() || '',
            tugas_ids: item.items?.map(i => i.tugas_id.toString()) || [],
            tenggat_waktu_jam: item.tenggat_waktu_jam || '17:00',
            deadline_hari_berikutnya: item.deadline_hari_berikutnya || false,
            catatan: item.catatan || '',
            lokasi_latitude: item.lokasi_latitude?.toString() || '',
            lokasi_longitude: item.lokasi_longitude?.toString() || '',
            lokasi_radius: item.lokasi_radius?.toString() || '100',
            lokasi_nama: item.lokasi_nama || '',
        });
        setDialogOpen(true);
    };

    const deleteTemplate = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus template ini?')) {
            router.delete(`/admin/template-harian/${id}`);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (data.tugas_ids.length === 0) {
            alert('Minimal harus ada satu tugas yang dipilih');
            return;
        }

        if (editItem) {
            put(`/admin/template-harian/${editItem.id}`, {
                onSuccess: () => setDialogOpen(false),
            });
        } else {
            post('/admin/template-harian', {
                onSuccess: () => setDialogOpen(false),
            });
        }
    };

    const handleTriggerAll = (skipHolidayCheck: boolean = false) => {
        if (!triggerDate) {
            setTriggerError('Pilih tanggal terlebih dahulu');
            return;
        }

        setTriggerProcessing(true);
        setTriggerError(null);
        setTriggerSuccess(null);

        router.post(
            '/admin/template-harian/trigger-all',
            {
                tanggal: format(triggerDate, 'yyyy-MM-dd'),
                skip_holiday_check: skipHolidayCheck,
            },
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    const flash = (page.props as { flash?: { success?: string; error?: string; is_holiday?: boolean; holiday?: { nama: string } } }).flash;
                    if (flash?.success) {
                        setTriggerSuccess(flash.success);
                        setTimeout(() => {
                            handleTriggerDialogChange(false);
                        }, 1500);
                    } else if (flash?.error) {
                        if (flash.is_holiday && !skipHolidayCheck) {
                            setTriggerError(flash.error);
                        } else {
                            setTriggerError(flash.error);
                        }
                    }
                },
                onError: (errors) => {
                    const errorMessage = Object.values(errors).flat().join(', ');
                    setTriggerError(errorMessage || 'Gagal membuat penugasan');
                },
                onFinish: () => {
                    setTriggerProcessing(false);
                },
            }
        );
    };

    // Reset trigger dialog state when closed
    const handleTriggerDialogChange = (open: boolean) => {
        setTriggerDialogOpen(open);
        if (!open) {
            setTriggerError(null);
            setTriggerSuccess(null);
        }
    };

    const hasLocation = !!(data.lokasi_latitude && data.lokasi_longitude);
    const activeTemplateCount = templates.data.filter(t => t.aktif).length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Template Penugasan" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Template Penugasan</h1>
                        <p className="text-muted-foreground">
                            Atur template untuk penugasan rutin per pelaksana
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setTriggerDialogOpen(true)}
                            disabled={activeTemplateCount === 0}
                        >
                            <Play className="mr-2 h-4 w-4" />
                            Eksekusi Semua ({activeTemplateCount})
                        </Button>
                        <Button onClick={() => setDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Buat Template Baru
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.data.map((template) => {
                        const tipeColor = TIPE_COLORS[template.tipe] || TIPE_COLORS.lainnya;
                        const tipeAccent: Record<string, string> = {
                            harian: 'from-blue-500 to-blue-600',
                            mingguan: 'from-emerald-500 to-emerald-600',
                            bulanan: 'from-amber-500 to-amber-600',
                            tahunan: 'from-purple-500 to-purple-600',
                            lainnya: 'from-gray-400 to-gray-500',
                        };
                        return (
                            <Card key={template.id} className={`overflow-hidden transition-all hover:shadow-md ${!template.aktif ? 'opacity-60 grayscale-[30%]' : ''}`}>
                                {/* Color accent strip */}
                                <div className={`h-1.5 bg-gradient-to-r ${tipeAccent[template.tipe] || tipeAccent.lainnya}`} />

                                <CardHeader className="pb-2 pt-4">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tipeColor}`}>
                                                    {TIPE_OPTIONS.find(t => t.value === template.tipe)?.label || template.tipe}
                                                </span>
                                                {template.deadline_hari_berikutnya && (
                                                    <span className="inline-flex items-center gap-0.5 rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                                                        <Moon className="h-2.5 w-2.5" />
                                                        Shift Malam
                                                    </span>
                                                )}
                                                {!template.aktif && (
                                                    <span className="inline-flex items-center rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-900 dark:text-red-300">
                                                        Nonaktif
                                                    </span>
                                                )}
                                            </div>
                                            <CardTitle className="text-base font-semibold leading-tight truncate">{template.nama}</CardTitle>
                                        </div>
                                        <div className="flex gap-0.5 shrink-0">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => handleEdit(template)}>
                                                            <Edit className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Edit Template</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteTemplate(template.id)}>
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Hapus Template</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </div>
                                    {template.deskripsi && (
                                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{template.deskripsi}</p>
                                    )}
                                </CardHeader>

                                <CardContent className="pb-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                                            <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pelaksana</p>
                                                <p className="text-xs font-medium truncate">{template.pengguna?.name || '-'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                                            <Copy className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                            <div>
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tugas</p>
                                                <p className="text-xs font-medium">{template.items?.length || 0} item</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                                            <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                            <div>
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Deadline</p>
                                                <p className="text-xs font-medium">
                                                    {template.tenggat_waktu_jam || '17:00'}
                                                    {template.deadline_hari_berikutnya ? ' (H+1)' : ''}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                                            <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                            <div>
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Dibuat</p>
                                                <p className="text-xs font-medium">{format(new Date(template.created_at), 'd MMM yy', { locale: id })}</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}

                    {templates.data.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-lg text-muted-foreground">
                            <Copy className="h-12 w-12 mb-4 opacity-50" />
                            <h3 className="text-lg font-medium">Belum ada template</h3>
                            <p>Buat template pertama Anda untuk memulai trigger penugasan.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create/Edit Template Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[90vh] overflow-y-auto">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>{editItem ? 'Edit Template' : 'Buat Template Baru'}</DialogTitle>
                            <DialogDescription>
                                Konfigurasi template penugasan untuk satu pelaksana
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                            {/* LEFT COLUMN */}
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="nama">Nama Template</Label>
                                    <Input
                                        id="nama"
                                        value={data.nama}
                                        onChange={e => setData('nama', e.target.value)}
                                        placeholder="Misal: Template - Ahmad"
                                        required
                                    />
                                    {errors.nama && <span className="text-sm text-destructive">{errors.nama}</span>}
                                </div>

                                {/* Tipe Penugasan */}
                                <div className="grid gap-2">
                                    <Label>Tipe Penugasan</Label>
                                    <Select value={data.tipe} onValueChange={v => setData('tipe', v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih tipe" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TIPE_OPTIONS.map(opt => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.tipe && <span className="text-sm text-destructive">{errors.tipe}</span>}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="deskripsi">Deskripsi</Label>
                                    <Textarea
                                        id="deskripsi"
                                        value={data.deskripsi}
                                        onChange={e => setData('deskripsi', e.target.value)}
                                        placeholder="Keterangan template..."
                                        className="h-20"
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label htmlFor="aktif">Status Aktif</Label>
                                    <Switch
                                        id="aktif"
                                        checked={data.aktif}
                                        onCheckedChange={checked => setData('aktif', checked)}
                                    />
                                </div>

                                {/* Pelaksana Selection */}
                                <div className="grid gap-2">
                                    <Label>Pilih Pelaksana</Label>
                                    <Select value={data.pengguna_id} onValueChange={handlePelaksanaChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih Pelaksana" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {pelaksanaList.map(u => (
                                                <SelectItem key={u.id} value={u.id.toString()}>
                                                    {u.name} {u.kategori ? `(${u.kategori.nama})` : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.pengguna_id && <span className="text-sm text-destructive">{errors.pengguna_id}</span>}
                                </div>

                                {/* Multi-select Tugas */}
                                <div className="grid gap-2">
                                    <Label>
                                        Pilih Tugas ({data.tugas_ids.length} dipilih)
                                        {selectedPelaksana?.kategori && (
                                            <span className="text-muted-foreground ml-1">
                                                (Kategori: {selectedPelaksana.kategori.nama})
                                            </span>
                                        )}
                                    </Label>
                                    <div className="border rounded-md max-h-48 overflow-y-auto p-2 space-y-2">
                                        {!data.pengguna_id ? (
                                            <p className="text-sm text-muted-foreground text-center py-2">
                                                Pilih pelaksana terlebih dahulu
                                            </p>
                                        ) : filteredTugasList.length === 0 ? (
                                            <p className="text-sm text-muted-foreground text-center py-2">
                                                Tidak ada tugas untuk kategori ini
                                            </p>
                                        ) : (
                                            filteredTugasList.map(t => (
                                                <label
                                                    key={t.id}
                                                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                                                >
                                                    <Checkbox
                                                        checked={data.tugas_ids.includes(t.id.toString())}
                                                        onCheckedChange={() => toggleTugas(t.id.toString())}
                                                    />
                                                    <span className="text-sm">{t.nama}</span>
                                                </label>
                                            ))
                                        )}
                                    </div>
                                    {errors.tugas_ids && <span className="text-sm text-destructive">{errors.tugas_ids}</span>}
                                </div>

                                {/* Deadline Time */}
                                <div className="grid gap-2">
                                    <Label>Deadline (Jam)</Label>
                                    <Input
                                        type="time"
                                        value={data.tenggat_waktu_jam}
                                        onChange={e => setData('tenggat_waktu_jam', e.target.value)}
                                    />
                                </div>

                                {/* Shift Malam Toggle */}
                                <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="deadline_hari_berikutnya" className="flex items-center gap-2">
                                            <Moon className="h-4 w-4" />
                                            Shift Malam
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                            Deadline jatuh di hari berikutnya (H+1)
                                        </p>
                                    </div>
                                    <Switch
                                        id="deadline_hari_berikutnya"
                                        checked={data.deadline_hari_berikutnya}
                                        onCheckedChange={checked => setData('deadline_hari_berikutnya', checked)}
                                    />
                                </div>

                                {/* Catatan */}
                                <div className="grid gap-2">
                                    <Label>Catatan (Opsional)</Label>
                                    <Input
                                        value={data.catatan}
                                        onChange={e => setData('catatan', e.target.value)}
                                        placeholder="Catatan khusus untuk semua tugas ini"
                                    />
                                </div>
                            </div>

                            {/* RIGHT COLUMN: Location Map */}
                            <div className="space-y-4 md:border-l md:pl-6 border-border flex flex-col">
                                <div className="flex items-center justify-between">
                                    <Label className="text-base font-semibold flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        Lokasi Tugas
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

                                <p className="text-xs text-muted-foreground">
                                    Lokasi ini akan diterapkan ke semua tugas dalam template.
                                </p>

                                <div className="relative flex-1 min-h-[300px] border rounded-md overflow-hidden bg-muted">
                                    <LocationMap
                                        latitude={parseFloat(data.lokasi_latitude) || null}
                                        longitude={parseFloat(data.lokasi_longitude) || null}
                                        radius={parseFloat(data.lokasi_radius) || 100}
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
                                                value={data.lokasi_latitude}
                                                onChange={e => setData('lokasi_latitude', e.target.value)}
                                                placeholder="-6.200000"
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label className="text-xs">Longitude</Label>
                                            <Input
                                                type="number"
                                                className="h-8 text-xs"
                                                step="any"
                                                value={data.lokasi_longitude}
                                                onChange={e => setData('lokasi_longitude', e.target.value)}
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
                                                value={data.lokasi_radius}
                                                onChange={e => setData('lokasi_radius', e.target.value)}
                                                placeholder="100"
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label className="text-xs">Nama Lokasi (Opsional)</Label>
                                            <Input
                                                className="h-8 text-xs"
                                                value={data.lokasi_nama}
                                                onChange={e => setData('lokasi_nama', e.target.value)}
                                                placeholder="Gedung/Ruangan"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={processing || data.tugas_ids.length === 0}>
                                {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editItem ? 'Simpan Perubahan' : 'Buat Template'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Trigger All Dialog */}
            <Dialog open={triggerDialogOpen} onOpenChange={handleTriggerDialogChange}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Play className="h-5 w-5" />
                            Eksekusi Semua Template
                        </DialogTitle>
                        <DialogDescription>
                            Membuat penugasan dari semua template aktif ({activeTemplateCount} template)
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <Label>Tanggal Penugasan</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            'w-full justify-start text-left font-normal',
                                            !triggerDate && 'text-muted-foreground'
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {triggerDate ? format(triggerDate, 'PPP', { locale: id }) : <span>Pilih Tanggal</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 z-[1001]" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={triggerDate}
                                        onSelect={setTriggerDate}
                                        initialFocus
                                        locale={id}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {checkingHoliday && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Memeriksa tanggal...</span>
                            </div>
                        )}

                        {holidayInfo?.is_holiday && (
                            <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
                                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-yellow-800 dark:text-yellow-200">
                                        Hari Libur: {holidayInfo.holiday?.nama}
                                    </p>
                                    {holidayInfo.holiday?.deskripsi && (
                                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                            {holidayInfo.holiday.deskripsi}
                                        </p>
                                    )}
                                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                                        Anda tetap bisa membuat penugasan jika diperlukan.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Error Message */}
                        {triggerError && (
                            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
                                <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700 dark:text-red-300">{triggerError}</p>
                            </div>
                        )}

                        {/* Success Message */}
                        {triggerSuccess && (
                            <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950">
                                <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <p className="text-sm text-green-700 dark:text-green-300">{triggerSuccess}</p>
                            </div>
                        )}

                        <div className="bg-muted/50 p-3 rounded-md text-sm">
                            <p className="font-medium mb-2">Template yang akan dieksekusi:</p>
                            <ul className="space-y-1">
                                {templates.data.filter(t => t.aktif).map(t => (
                                    <li key={t.id} className="flex items-center gap-2">
                                        <Users className="h-3 w-3" />
                                        <span>{t.nama}</span>
                                        <span className="text-muted-foreground">({t.items?.length || 0} tugas)</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button type="button" variant="secondary" onClick={() => handleTriggerDialogChange(false)}>
                            Batal
                        </Button>
                        {holidayInfo?.is_holiday ? (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleTriggerAll(true)}
                                disabled={triggerProcessing || !triggerDate || !!triggerSuccess}
                            >
                                {triggerProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Tetap Buat Penugasan
                            </Button>
                        ) : (
                            <Button
                                onClick={() => handleTriggerAll(false)}
                                disabled={triggerProcessing || !triggerDate || !!triggerSuccess}
                            >
                                {triggerProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Eksekusi Sekarang
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
