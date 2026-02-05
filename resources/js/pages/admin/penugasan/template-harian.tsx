import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Edit, Plus, Trash2, Copy, MapPin, Navigation, Loader2, CalendarIcon, Play, Users } from 'lucide-react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import LocationMap from '@/components/location-map';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Penugasan', href: '/admin/penugasan' },
    { title: 'Template Harian', href: '/admin/template-harian' },
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

    const { data, setData, post, put, processing, errors, reset } = useForm({
        nama: '',
        deskripsi: '',
        aktif: true,
        pengguna_id: '',
        tugas_ids: [] as string[],
        tenggat_waktu_jam: '17:00',
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
            pengguna_id: item.pengguna_id?.toString() || '',
            tugas_ids: item.items?.map(i => i.tugas_id.toString()) || [],
            tenggat_waktu_jam: item.tenggat_waktu_jam || '17:00',
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

    const handleTriggerAll = async () => {
        if (!triggerDate) {
            alert('Pilih tanggal terlebih dahulu');
            return;
        }

        setTriggerProcessing(true);

        try {
            const response = await fetch('/admin/template-harian/trigger-all', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    tanggal: format(triggerDate, 'yyyy-MM-dd'),
                }),
            });

            const result = await response.json();

            if (result.success) {
                alert(result.message);
                setTriggerDialogOpen(false);
                router.reload();
            } else {
                if (result.is_holiday) {
                    if (confirm(`${result.message}\n\nApakah Anda ingin tetap melanjutkan?`)) {
                        // Retry with skip_holiday_check
                        const retryResponse = await fetch('/admin/template-harian/trigger-all', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                            },
                            body: JSON.stringify({
                                tanggal: format(triggerDate, 'yyyy-MM-dd'),
                                skip_holiday_check: true,
                            }),
                        });
                        const retryResult = await retryResponse.json();
                        if (retryResult.success) {
                            alert(retryResult.message);
                            setTriggerDialogOpen(false);
                            router.reload();
                        } else {
                            alert(retryResult.message || 'Gagal membuat penugasan');
                        }
                    }
                } else {
                    alert(result.message || 'Gagal membuat penugasan');
                }
            }
        } catch (error) {
            alert('Terjadi kesalahan saat memproses');
        } finally {
            setTriggerProcessing(false);
        }
    };

    const hasLocation = !!(data.lokasi_latitude && data.lokasi_longitude);
    const activeTemplateCount = templates.data.filter(t => t.aktif).length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Template Penugasan Harian" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Template Penugasan Harian</h1>
                        <p className="text-muted-foreground">
                            Atur template untuk penugasan rutin/harian per pelaksana
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
                    {templates.data.map((template) => (
                        <Card key={template.id} className={!template.aktif ? 'opacity-75' : ''}>
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-lg font-bold">{template.nama}</CardTitle>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(template)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteTemplate(template.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                                    {template.deskripsi || 'Tidak ada deskripsi'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between py-1 border-b">
                                        <span className="text-muted-foreground">Pelaksana</span>
                                        <span className="font-medium">{template.pengguna?.name || '-'}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b">
                                        <span className="text-muted-foreground">Jumlah Tugas</span>
                                        <span className="font-medium">{template.items?.length || 0} Tugas</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b">
                                        <span className="text-muted-foreground">Deadline</span>
                                        <span className="font-medium">{template.tenggat_waktu_jam || '17:00'}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b">
                                        <span className="text-muted-foreground">Status</span>
                                        <span className={template.aktif ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                                            {template.aktif ? 'Aktif' : 'Tidak Aktif'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <span className="text-muted-foreground">Dibuat</span>
                                        <span>{format(new Date(template.created_at), 'd MMM yyyy', { locale: id })}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {templates.data.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-lg text-muted-foreground">
                            <Copy className="h-12 w-12 mb-4 opacity-50" />
                            <h3 className="text-lg font-medium">Belum ada template</h3>
                            <p>Buat template pertama Anda untuk memulai trigger harian.</p>
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
                                        placeholder="Misal: Template Harian - Ahmad"
                                        required
                                    />
                                    {errors.nama && <span className="text-sm text-destructive">{errors.nama}</span>}
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
            <Dialog open={triggerDialogOpen} onOpenChange={setTriggerDialogOpen}>
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

                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => setTriggerDialogOpen(false)}>
                            Batal
                        </Button>
                        <Button onClick={handleTriggerAll} disabled={triggerProcessing || !triggerDate}>
                            {triggerProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Eksekusi Sekarang
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
