import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import MobileLayout from '@/layouts/mobile-layout';
import { type Absensi } from '@/types/logbook';
import { Head, router, useForm } from '@inertiajs/react';
import { format, parseISO, isToday } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
    Camera, Clock, ImagePlus, Trash2, CheckCircle2,
    Calendar, ChevronDown, X, Upload
} from 'lucide-react';
import { useState, useRef, useMemo } from 'react';

interface Props {
    absensi: Absensi[];
    todayAbsensi: Absensi[];
    filters: {
        date_from: string | null;
        date_to: string | null;
    };
}

const KETERANGAN_PRESETS = [
    'Absen Masuk',
    'Absen Istirahat',
    'Absen Pulang',
];

export default function AbsensiIndex({ absensi, todayAbsensi, filters }: Props) {
    const [showForm, setShowForm] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [viewImage, setViewImage] = useState<string | null>(null);
    const [customKeterangan, setCustomKeterangan] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<{
        foto: File | null;
        keterangan: string;
    }>({
        foto: null,
        keterangan: '',
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            form.setData('foto', file);
            const reader = new FileReader();
            reader.onload = (ev) => setPreview(ev.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.data.foto || !form.data.keterangan) return;

        const formData = new FormData();
        formData.append('foto', form.data.foto);
        formData.append('keterangan', form.data.keterangan);

        router.post('/pelaksana/absensi', formData, {
            forceFormData: true,
            onSuccess: () => {
                form.reset();
                setPreview(null);
                setShowForm(false);
                setCustomKeterangan(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            },
        });
    };

    const handleDelete = (id: number) => {
        if (confirm('Yakin ingin menghapus absensi ini?')) {
            router.delete(`/pelaksana/absensi/${id}`);
        }
    };

    // Group history by date
    const groupedAbsensi = useMemo(() => {
        const groups: Record<string, Absensi[]> = {};
        absensi.forEach((item) => {
            const date = item.tanggal;
            if (!groups[date]) groups[date] = [];
            groups[date].push(item);
        });
        return groups;
    }, [absensi]);

    return (
        <MobileLayout>
            <Head title="Absensi" />
            <div className="min-h-screen bg-muted/30 dark:bg-slate-950 pb-24 transition-colors duration-300">
                {/* Header */}
                <div className="bg-gradient-to-br from-primary via-primary to-primary/80 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-5 pb-6 pt-5 text-primary-foreground dark:text-white border-b-0 dark:border-b dark:border-slate-800 transition-all duration-300">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm opacity-80">
                                {format(new Date(), 'EEEE, d MMMM yyyy', { locale: idLocale })}
                            </div>
                            <h1 className="text-xl font-bold mt-1">
                                Absensi 📸
                            </h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge className="bg-white/20 text-white border-0 text-xs">
                                {todayAbsensi.length} hari ini
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="px-4 -mt-3 space-y-4">
                    {/* Upload Button */}
                    {!showForm && (
                        <Card
                            className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-all active:scale-[0.99]"
                            onClick={() => setShowForm(true)}
                        >
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-primary/10">
                                    <Camera className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-semibold text-sm">Upload Absensi</div>
                                    <div className="text-xs text-muted-foreground">Ambil foto dan pilih keterangan</div>
                                </div>
                                <ImagePlus className="h-5 w-5 text-muted-foreground" />
                            </CardContent>
                        </Card>
                    )}

                    {/* Upload Form */}
                    {showForm && (
                        <Card className="border-0 shadow-lg">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-sm">Upload Absensi</h3>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => {
                                            setShowForm(false);
                                            setPreview(null);
                                            form.reset();
                                        }}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* Photo Upload */}
                                    <div>
                                        <Label className="text-xs text-muted-foreground mb-2 block">Foto</Label>
                                        {preview ? (
                                            <div className="relative rounded-xl overflow-hidden">
                                                <img
                                                    src={preview}
                                                    alt="Preview"
                                                    className="w-full h-48 object-cover rounded-xl"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-lg"
                                                    onClick={() => {
                                                        setPreview(null);
                                                        form.setData('foto', null);
                                                        if (fileInputRef.current) fileInputRef.current.value = '';
                                                    }}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer hover:bg-muted/50 transition-colors">
                                                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                                <span className="text-sm text-muted-foreground">Ketuk untuk pilih foto</span>
                                                <span className="text-xs text-muted-foreground/70 mt-1">JPG, PNG, WebP (maks 10MB)</span>
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/jpeg,image/png,image/jpg,image/webp"
                                                    capture="environment"
                                                    className="hidden"
                                                    onChange={handleFileChange}
                                                />
                                            </label>
                                        )}
                                        {form.errors.foto && (
                                            <p className="text-xs text-red-500 mt-1">{form.errors.foto}</p>
                                        )}
                                    </div>

                                    {/* Keterangan */}
                                    <div>
                                        <Label className="text-xs text-muted-foreground mb-2 block">Keterangan</Label>
                                        {!customKeterangan ? (
                                            <div className="space-y-2">
                                                <div className="grid grid-cols-3 gap-2">
                                                    {KETERANGAN_PRESETS.map((preset) => (
                                                        <Button
                                                            key={preset}
                                                            type="button"
                                                            variant={form.data.keterangan === preset ? 'default' : 'outline'}
                                                            size="sm"
                                                            className="text-xs h-9"
                                                            onClick={() => form.setData('keterangan', preset)}
                                                        >
                                                            {preset.replace('Absen ', '')}
                                                        </Button>
                                                    ))}
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-xs text-muted-foreground w-full"
                                                    onClick={() => {
                                                        setCustomKeterangan(true);
                                                        form.setData('keterangan', '');
                                                    }}
                                                >
                                                    Lainnya...
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Input
                                                    value={form.data.keterangan}
                                                    onChange={(e) => form.setData('keterangan', e.target.value)}
                                                    placeholder="Masukkan keterangan..."
                                                    className="h-9 text-sm"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-xs text-muted-foreground"
                                                    onClick={() => {
                                                        setCustomKeterangan(false);
                                                        form.setData('keterangan', '');
                                                    }}
                                                >
                                                    ← Kembali ke pilihan
                                                </Button>
                                            </div>
                                        )}
                                        {form.errors.keterangan && (
                                            <p className="text-xs text-red-500 mt-1">{form.errors.keterangan}</p>
                                        )}
                                    </div>

                                    {/* Submit */}
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={!form.data.foto || !form.data.keterangan || form.processing}
                                    >
                                        {form.processing ? 'Menyimpan...' : 'Simpan Absensi'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    {/* Today's Attendance */}
                    {todayAbsensi.length > 0 && (
                        <div>
                            <h2 className="font-bold text-sm mb-2 flex items-center gap-1.5">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                Absensi Hari Ini
                            </h2>
                            <div className="space-y-2">
                                {todayAbsensi.map((item) => (
                                    <Card key={item.id} className="border-0 shadow-md overflow-hidden">
                                        <CardContent className="p-0">
                                            <div className="flex items-center gap-3 p-3">
                                                <img
                                                    src={item.foto_url}
                                                    alt={item.keterangan}
                                                    className="h-14 w-14 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                                    onClick={() => setViewImage(item.foto_url || null)}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm">{item.keterangan}</div>
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                                        <Clock className="h-3 w-3" />
                                                        {format(new Date(item.created_at), 'HH:mm', { locale: idLocale })}
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0"
                                                    onClick={() => handleDelete(item.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* History */}
                    <div className="mt-4">
                        <h2 className="font-bold text-sm mb-3 flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 text-primary" />
                            Riwayat Absensi
                        </h2>

                        {Object.keys(groupedAbsensi).length === 0 ? (
                            <Card className="border-dashed">
                                <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                                    <Camera className="h-10 w-10 mb-2 opacity-30" />
                                    <p className="font-medium">Belum ada absensi</p>
                                    <p className="text-xs mt-1">Upload absensi pertama Anda</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {Object.entries(groupedAbsensi).map(([date, items]) => (
                                    <div key={date}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="text-xs font-semibold text-muted-foreground uppercase">
                                                {isToday(parseISO(date))
                                                    ? 'Hari Ini'
                                                    : format(parseISO(date), 'EEEE, d MMMM yyyy', { locale: idLocale })
                                                }
                                            </div>
                                            <Badge variant="secondary" className="text-[10px] h-5">
                                                {items.length}
                                            </Badge>
                                        </div>
                                        <div className="space-y-2">
                                            {items.map((item) => (
                                                <Card key={item.id} className="border-0 shadow-sm">
                                                    <CardContent className="p-0">
                                                        <div className="flex items-center gap-3 p-3">
                                                            <img
                                                                src={item.foto_url}
                                                                alt={item.keterangan}
                                                                className="h-12 w-12 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                                                onClick={() => setViewImage(item.foto_url || null)}
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-medium text-sm">{item.keterangan}</div>
                                                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                                                    <Clock className="h-3 w-3" />
                                                                    {format(new Date(item.created_at), 'HH:mm', { locale: idLocale })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Image Viewer Dialog */}
            <Dialog open={!!viewImage} onOpenChange={() => setViewImage(null)}>
                <DialogContent className="max-w-lg p-0 overflow-hidden">
                    <DialogHeader className="p-4 pb-0">
                        <DialogTitle>Foto Absensi</DialogTitle>
                    </DialogHeader>
                    {viewImage && (
                        <img
                            src={viewImage}
                            alt="Foto Absensi"
                            className="w-full max-h-[70vh] object-contain p-4"
                        />
                    )}
                </DialogContent>
            </Dialog>
        </MobileLayout>
    );
}
