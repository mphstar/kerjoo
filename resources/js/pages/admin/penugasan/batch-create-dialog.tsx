import { Button } from '@/components/ui/button';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { type Tugas, type User } from '@/types/logbook';
import { router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { CalendarIcon, Loader2, Users, ListTodo, MapPin, Navigation } from 'lucide-react';
import { useState, useMemo, useCallback } from 'react';
import LocationMap from '@/components/location-map';

type Mode = 'tugas_to_pelaksana' | 'pelaksana_to_tugas';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tugasList: Tugas[];
    pelaksanaList: User[];
}

export default function BatchPenugasanDialog({ open, onOpenChange, tugasList, pelaksanaList }: Props) {
    const { errors } = usePage().props as { errors: Record<string, string> };
    const [processing, setProcessing] = useState(false);
    const [mode, setMode] = useState<Mode>('tugas_to_pelaksana');
    const [gettingLocation, setGettingLocation] = useState(false);
    const [data, setData] = useState({
        tugas_id: '',
        pengguna_id: '',
        tugas_ids: [] as string[],
        pengguna_ids: [] as string[],
        tenggat_waktu: undefined as Date | undefined,
        tenggat_waktu_jam: '23:59',
        catatan: '',
        // Location fields
        lokasi_latitude: '',
        lokasi_longitude: '',
        lokasi_radius: '100',
        lokasi_nama: '',
    });

    const updateData = <K extends keyof typeof data>(key: K, value: (typeof data)[K]) => {
        setData((prev) => ({ ...prev, [key]: value }));
    };

    const reset = () => {
        setData({
            tugas_id: '',
            pengguna_id: '',
            tugas_ids: [],
            pengguna_ids: [],
            tenggat_waktu: undefined,
            tenggat_waktu_jam: '23:59',
            catatan: '',
            lokasi_latitude: '',
            lokasi_longitude: '',
            lokasi_radius: '100',
            lokasi_nama: '',
        });
        setMode('tugas_to_pelaksana');
    };

    // Get current location using Geolocation API
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

    // Get selected tugas for filtering pelaksana (mode: tugas_to_pelaksana)
    const selectedTugas = useMemo(() => {
        return tugasList.find(t => t.id.toString() === data.tugas_id);
    }, [tugasList, data.tugas_id]);

    // Get selected pelaksana for filtering tugas (mode: pelaksana_to_tugas)
    const selectedPelaksana = useMemo(() => {
        return pelaksanaList.find(u => u.id.toString() === data.pengguna_id);
    }, [pelaksanaList, data.pengguna_id]);

    // Filter pelaksana by tugas kategori (mode: tugas_to_pelaksana)
    const filteredPelaksanaList = useMemo(() => {
        if (!selectedTugas) return [];
        return pelaksanaList.filter(u => u.kategori_id === selectedTugas.kategori_id);
    }, [pelaksanaList, selectedTugas]);

    // Filter tugas by pelaksana kategori (mode: pelaksana_to_tugas)
    const filteredTugasList = useMemo(() => {
        if (!selectedPelaksana || !selectedPelaksana.kategori_id) return [];
        return tugasList.filter(t => t.kategori_id === selectedPelaksana.kategori_id);
    }, [tugasList, selectedPelaksana]);

    const handleTugasChange = (value: string) => {
        updateData('tugas_id', value);
        updateData('pengguna_ids', []); // Reset pelaksana selection
    };

    const handlePelaksanaChange = (value: string) => {
        updateData('pengguna_id', value);
        updateData('tugas_ids', []); // Reset tugas selection
    };

    const togglePelaksana = (userId: string) => {
        setData((prev) => ({
            ...prev,
            pengguna_ids: prev.pengguna_ids.includes(userId)
                ? prev.pengguna_ids.filter((id) => id !== userId)
                : [...prev.pengguna_ids, userId],
        }));
    };

    const toggleTugas = (tugasId: string) => {
        setData((prev) => ({
            ...prev,
            tugas_ids: prev.tugas_ids.includes(tugasId)
                ? prev.tugas_ids.filter((id) => id !== tugasId)
                : [...prev.tugas_ids, tugasId],
        }));
    };

    const getAssignmentCount = () => {
        if (mode === 'tugas_to_pelaksana') {
            return data.tugas_id && data.pengguna_ids.length > 0 ? data.pengguna_ids.length : 0;
        }
        return data.pengguna_id && data.tugas_ids.length > 0 ? data.tugas_ids.length : 0;
    };

    const handleLocationSelect = (lat: number, lng: number) => {
        updateData('lokasi_latitude', lat.toFixed(6));
        updateData('lokasi_longitude', lng.toFixed(6));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        router.post(
            '/admin/penugasan/batch',
            {
                mode,
                tugas_id: mode === 'tugas_to_pelaksana' ? data.tugas_id : null,
                pengguna_id: mode === 'pelaksana_to_tugas' ? data.pengguna_id : null,
                tugas_ids: mode === 'pelaksana_to_tugas' ? data.tugas_ids : [],
                pengguna_ids: mode === 'tugas_to_pelaksana' ? data.pengguna_ids : [],
                tenggat_waktu: data.tenggat_waktu
                    ? `${format(data.tenggat_waktu, 'yyyy-MM-dd')} ${data.tenggat_waktu_jam || '23:59'}:00`
                    : null,
                catatan: data.catatan,
                // Location fields - only send if coordinates are provided
                lokasi_latitude: data.lokasi_latitude || null,
                lokasi_longitude: data.lokasi_longitude || null,
                lokasi_radius: data.lokasi_latitude && data.lokasi_longitude ? (data.lokasi_radius || 100) : null,
                lokasi_nama: data.lokasi_nama || null,
            },
            {
                onSuccess: () => {
                    reset();
                    onOpenChange(false);
                },
                onFinish: () => {
                    setProcessing(false);
                },
            },
        );
    };

    const handleModeChange = (newMode: Mode) => {
        setMode(newMode);
        // Reset selections when mode changes
        setData(prev => ({
            ...prev,
            tugas_id: '',
            pengguna_id: '',
            tugas_ids: [],
            pengguna_ids: [],
        }));
    };

    const hasLocation = !!(data.lokasi_latitude && data.lokasi_longitude);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Batch Penugasan</DialogTitle>
                        <DialogDescription>Buat beberapa penugasan sekaligus dengan mode fleksibel dan tentukan lokasi.</DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                        {/* LEFT COLUMN: Main Info */}
                        <div className="space-y-4">
                            {/* Mode Toggle */}
                            <div className="grid gap-2">
                                <Label>Mode Penugasan</Label>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant={mode === 'tugas_to_pelaksana' ? 'default' : 'outline'}
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => handleModeChange('tugas_to_pelaksana')}
                                    >
                                        <ListTodo className="mr-2 h-4 w-4" />
                                        Tugas → Pelaksana
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={mode === 'pelaksana_to_tugas' ? 'default' : 'outline'}
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => handleModeChange('pelaksana_to_tugas')}
                                    >
                                        <Users className="mr-2 h-4 w-4" />
                                        Pelaksana → Tugas
                                    </Button>
                                </div>
                            </div>

                            {mode === 'tugas_to_pelaksana' ? (
                                <>
                                    {/* Select one Tugas first */}
                                    <div className="grid gap-2">
                                        <Label>Pilih Tugas Master</Label>
                                        <Select value={data.tugas_id} onValueChange={handleTugasChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih Tugas" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {tugasList.map((t) => (
                                                    <SelectItem key={t.id} value={t.id.toString()}>
                                                        {t.nama} {t.kategori ? `(${t.kategori.nama})` : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.tugas_id && <span className="text-sm text-destructive">{errors.tugas_id}</span>}
                                    </div>

                                    {/* Multi-select Pelaksana - filtered by tugas kategori */}
                                    <div className="grid gap-2">
                                        <Label>
                                            Pilih Pelaksana ({data.pengguna_ids.length} dipilih)
                                            {selectedTugas?.kategori && <span className="text-muted-foreground ml-1">(Kategori: {selectedTugas.kategori.nama})</span>}
                                        </Label>
                                        <div className="border rounded-md max-h-48 overflow-y-auto p-2 space-y-2">
                                            {!data.tugas_id ? (
                                                <p className="text-sm text-muted-foreground text-center py-2">Pilih tugas terlebih dahulu</p>
                                            ) : filteredPelaksanaList.length === 0 ? (
                                                <p className="text-sm text-muted-foreground text-center py-2">Tidak ada pelaksana untuk kategori ini</p>
                                            ) : (
                                                filteredPelaksanaList.map((u) => (
                                                    <label
                                                        key={u.id}
                                                        className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                                                    >
                                                        <Checkbox
                                                            checked={data.pengguna_ids.includes(u.id.toString())}
                                                            onCheckedChange={() => togglePelaksana(u.id.toString())}
                                                        />
                                                        <span className="text-sm">{u.name}</span>
                                                    </label>
                                                ))
                                            )}
                                        </div>
                                        {errors.pengguna_ids && <span className="text-sm text-destructive">{errors.pengguna_ids}</span>}
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Select one Pelaksana first */}
                                    <div className="grid gap-2">
                                        <Label>Pilih Pelaksana</Label>
                                        <Select value={data.pengguna_id} onValueChange={handlePelaksanaChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih Pelaksana" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {pelaksanaList.map((u) => (
                                                    <SelectItem key={u.id} value={u.id.toString()}>
                                                        {u.name} {u.kategori ? `(${u.kategori.nama})` : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.pengguna_id && <span className="text-sm text-destructive">{errors.pengguna_id}</span>}
                                    </div>

                                    {/* Multi-select Tugas - filtered by pelaksana kategori */}
                                    <div className="grid gap-2">
                                        <Label>
                                            Pilih Tugas ({data.tugas_ids.length} dipilih)
                                            {selectedPelaksana?.kategori && <span className="text-muted-foreground ml-1">(Kategori: {selectedPelaksana.kategori.nama})</span>}
                                        </Label>
                                        <div className="border rounded-md max-h-48 overflow-y-auto p-2 space-y-2">
                                            {!data.pengguna_id ? (
                                                <p className="text-sm text-muted-foreground text-center py-2">Pilih pelaksana terlebih dahulu</p>
                                            ) : filteredTugasList.length === 0 ? (
                                                <p className="text-sm text-muted-foreground text-center py-2">Tidak ada tugas untuk kategori ini</p>
                                            ) : (
                                                filteredTugasList.map((t) => (
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
                                </>
                            )}

                            {/* Tenggat Waktu */}
                            <div className="grid gap-2">
                                <Label>Tenggat Waktu (Opsional)</Label>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={'outline'}
                                                    className={cn('w-full justify-start text-left font-normal', !data.tenggat_waktu && 'text-muted-foreground')}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {data.tenggat_waktu ? format(data.tenggat_waktu, 'PPP', { locale: id }) : <span>Pilih Tanggal</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 z-[1001]" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={data.tenggat_waktu}
                                                    onSelect={(date: Date | undefined) => updateData('tenggat_waktu', date)}
                                                    initialFocus
                                                    captionLayout="dropdown"
                                                    fromYear={new Date().getFullYear()}
                                                    toYear={new Date().getFullYear() + 5}
                                                    locale={id}
                                                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="w-[120px]">
                                        <Input
                                            type="time"
                                            value={data.tenggat_waktu_jam}
                                            onChange={(e) => updateData('tenggat_waktu_jam', e.target.value)}
                                            disabled={!data.tenggat_waktu}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Catatan */}
                            <div className="grid gap-2">
                                <Label>Catatan Tambahan</Label>
                                <Textarea
                                    value={data.catatan}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateData('catatan', e.target.value)}
                                    placeholder="Instruksi khusus..."
                                    className="h-24"
                                />
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Location Map */}
                        <div className="space-y-4 md:border-l md:pl-6 border-border flex flex-col">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-semibold flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    Lokasi Tugas (Batch)
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
                                Lokasi ini akan diterapkan ke semua penugasan yang dibuat dalam batch ini.
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
                                            onChange={(e) => updateData('lokasi_latitude', e.target.value)}
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
                                            onChange={(e) => updateData('lokasi_longitude', e.target.value)}
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
                                            onChange={(e) => updateData('lokasi_radius', e.target.value)}
                                            placeholder="100"
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label className="text-xs">Nama Lokasi (Opsional)</Label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={data.lokasi_nama}
                                            onChange={(e) => updateData('lokasi_nama', e.target.value)}
                                            placeholder="Gedung/Ruangan"
                                        />
                                    </div>
                                </div>
                                {errors.lokasi_latitude && <span className="text-xs text-destructive">{errors.lokasi_latitude}</span>}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing || getAssignmentCount() === 0}>
                            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Buat {getAssignmentCount()} Penugasan
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
