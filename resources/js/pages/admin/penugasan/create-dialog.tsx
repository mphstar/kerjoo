import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
import { CalendarIcon, Clock, Loader2, MapPin, Navigation } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import LocationMap from '@/components/location-map';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tugasList: Tugas[];
    pelaksanaList: User[];
}

export default function PenugasanDialog({ open, onOpenChange, tugasList, pelaksanaList }: Props) {
    const { errors } = usePage().props as { errors: Record<string, string> };
    const [processing, setProcessing] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [data, setData] = useState({
        tugas_id: '',
        pengguna_id: '',
        tenggat_waktu: undefined as Date | undefined,
        tenggat_jam: '17:00', // Default time
        catatan: '',
        // Location fields
        lokasi_latitude: '',
        lokasi_longitude: '',
        lokasi_radius: '100', // Default 100 meters
        lokasi_nama: '',
    });

    const updateData = <K extends keyof typeof data>(key: K, value: typeof data[K]) => {
        setData(prev => ({ ...prev, [key]: value }));
    };

    const reset = () => {
        setData({
            tugas_id: '',
            pengguna_id: '',
            tenggat_waktu: undefined,
            tenggat_jam: '17:00',
            catatan: '',
            lokasi_latitude: '',
            lokasi_longitude: '',
            lokasi_radius: '100',
            lokasi_nama: '',
        });
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

    // Get the selected pelaksana for filtering tugas
    const selectedPelaksana = useMemo(() => {
        return pelaksanaList.find(u => u.id.toString() === data.pengguna_id);
    }, [pelaksanaList, data.pengguna_id]);

    // Filter tugas based on selected pelaksana's kategori
    const filteredTugasList = useMemo(() => {
        if (!selectedPelaksana || !selectedPelaksana.kategori_id) {
            return []; // No tugas if no pelaksana selected
        }
        return tugasList.filter(t => t.kategori_id === selectedPelaksana.kategori_id);
    }, [tugasList, selectedPelaksana]);

    // Reset tugas when pelaksana changes
    const handlePelaksanaChange = (value: string) => {
        updateData('pengguna_id', value);
        updateData('tugas_id', ''); // Reset tugas selection when pelaksana changes
    };

    const handleLocationSelect = (lat: number, lng: number) => {
        updateData('lokasi_latitude', lat.toFixed(6));
        updateData('lokasi_longitude', lng.toFixed(6));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        // Combine date and time for full datetime
        let tenggatWaktuFull: string | null = null;
        if (data.tenggat_waktu) {
            const dateStr = format(data.tenggat_waktu, 'yyyy-MM-dd');
            tenggatWaktuFull = `${dateStr} ${data.tenggat_jam}:00`;
        }

        router.post('/admin/penugasan', {
            tugas_id: data.tugas_id,
            pengguna_id: data.pengguna_id,
            tenggat_waktu: tenggatWaktuFull,
            catatan: data.catatan,
            // Location fields - only send if coordinates are provided
            lokasi_latitude: data.lokasi_latitude || null,
            lokasi_longitude: data.lokasi_longitude || null,
            lokasi_radius: data.lokasi_latitude && data.lokasi_longitude ? (data.lokasi_radius || 100) : null,
            lokasi_nama: data.lokasi_nama || null,
        }, {
            onSuccess: () => {
                reset();
                onOpenChange(false);
            },
            onFinish: () => {
                setProcessing(false);
            },
        });
    };

    const hasLocation = !!(data.lokasi_latitude && data.lokasi_longitude);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Buat Penugasan Baru</DialogTitle>
                        <DialogDescription>
                            Tugaskan pekerjaan kepada pelaksana dan tentukan lokasi (opsional).
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                        {/* LEFT COLUMN: Main Info */}
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Pilih Pelaksana <span className="text-red-500">*</span></Label>
                                <Select
                                    value={data.pengguna_id}
                                    onValueChange={handlePelaksanaChange}
                                >
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

                            <div className="grid gap-2">
                                <Label>Pilih Tugas Master <span className="text-red-500">*</span> {selectedPelaksana?.kategori && `(Kategori: ${selectedPelaksana.kategori.nama})`}</Label>
                                <Select
                                    value={data.tugas_id}
                                    onValueChange={(value) => updateData('tugas_id', value)}
                                    disabled={!data.pengguna_id}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={!data.pengguna_id ? "Pilih pelaksana terlebih dahulu" : "Pilih Tugas"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredTugasList.length === 0 ? (
                                            <div className="p-2 text-sm text-muted-foreground text-center">
                                                Tidak ada tugas untuk kategori ini
                                            </div>
                                        ) : (
                                            filteredTugasList.map((t) => (
                                                <SelectItem key={t.id} value={t.id.toString()}>
                                                    {t.nama}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                                {errors.tugas_id && <span className="text-sm text-destructive">{errors.tugas_id}</span>}
                            </div>

                            <div className="grid gap-2">
                                <Label>Tenggat Waktu (Opsional)</Label>
                                <div className="flex gap-2">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "flex-1 justify-start text-left font-normal",
                                                    !data.tenggat_waktu && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {data.tenggat_waktu ? format(data.tenggat_waktu, "PPP", { locale: id }) : <span>Pilih Tanggal</span>}
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
                                    <div className="relative w-[110px]">
                                        <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            type="time"
                                            value={data.tenggat_jam}
                                            onChange={(e) => updateData('tenggat_jam', e.target.value)}
                                            className="pl-9"
                                            disabled={!data.tenggat_waktu}
                                        />
                                    </div>
                                </div>
                                {errors.tenggat_waktu && <span className="text-sm text-destructive">{errors.tenggat_waktu}</span>}
                            </div>

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
                                    Cari Posisi Saya
                                </Button>
                            </div>

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
                        <Button type="submit" disabled={processing || !data.tugas_id || !data.pengguna_id}>
                            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Buat Penugasan
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
