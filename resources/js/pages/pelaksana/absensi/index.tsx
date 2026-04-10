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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import MobileLayout from '@/layouts/mobile-layout';
import { type Absensi } from '@/types/logbook';
import { Head, router, useForm } from '@inertiajs/react';
import { format, parseISO, isToday } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
    Camera, Clock, ImagePlus, Trash2, CheckCircle2,
    Calendar, ChevronDown, X, Upload, SwitchCamera, RefreshCw
} from 'lucide-react';
import { useState, useRef, useMemo, useCallback, useEffect } from 'react';

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
    
    // Camera states
    const [cameraError, setCameraError] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const form = useForm<{
        foto: File | null;
        keterangan: string;
    }>({
        foto: null,
        keterangan: '',
    });

    const startCamera = async (mode = facingMode) => {
        stopCamera();
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: mode }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setIsCameraOpen(true);
        } catch (err) {
            console.error("Error accessing camera:", err);
            setCameraError(true);
        }
    };

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCameraOpen(false);
    }, []);

    const toggleCamera = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const newMode = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(newMode);
        startCamera(newMode);
    };

    const capturePhoto = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            
            // Wait for video dimensions
            if (video.videoWidth === 0 || video.videoHeight === 0) return;
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                setPreview(dataUrl);

                // Convert base64 to File object
                fetch(dataUrl)
                    .then(res => res.blob())
                    .then(blob => {
                        const file = new File([blob], "absensi.jpg", { type: "image/jpeg" });
                        form.setData('foto', file);
                    });

                stopCamera();
            }
        }
    };

    useEffect(() => {
        return () => stopCamera();
    }, [stopCamera]);

    useEffect(() => {
        if (isCameraOpen && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [isCameraOpen]);

    const handleCloseForm = () => {
        setShowForm(false);
        setPreview(null);
        form.reset();
        stopCamera();
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
                stopCamera();
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
                            onClick={() => {
                                setShowForm(true);
                                startCamera();
                            }}
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
                                        onClick={handleCloseForm}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* Camera Capture */}
                                    <div>
                                        <Label className="text-xs text-muted-foreground mb-2 block">Foto</Label>
                                        
                                        <canvas ref={canvasRef} className="hidden" />

                                        {preview ? (
                                            <div className="relative rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border">
                                                <img
                                                    src={preview}
                                                    alt="Preview"
                                                    className="w-full h-auto max-h-64 object-cover rounded-xl"
                                                />
                                                <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        size="sm"
                                                        className="shadow-lg gap-2 rounded-full font-medium"
                                                        onClick={() => {
                                                            setPreview(null);
                                                            form.setData('foto', null);
                                                            startCamera();
                                                        }}
                                                    >
                                                        <RefreshCw className="h-4 w-4" />
                                                        Ulangi Foto
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : isCameraOpen ? (
                                            <div className="relative rounded-xl overflow-hidden bg-black flex flex-col items-center border">
                                                <video
                                                    ref={videoRef}
                                                    autoPlay
                                                    playsInline
                                                    className="w-full h-auto max-h-72 object-cover"
                                                    style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                                                />
                                                <div className="absolute top-2 right-2">
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        size="icon"
                                                        className="h-10 w-10 text-slate-800 rounded-full shadow-lg opacity-80 hover:opacity-100 bg-white hover:bg-slate-100"
                                                        onClick={toggleCamera}
                                                    >
                                                        <SwitchCamera className="h-5 w-5" />
                                                    </Button>
                                                </div>
                                                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-14 w-14 rounded-full shadow-2xl border-4 border-white/60 bg-white/20 hover:bg-white/40 active:scale-95 transition-all text-white"
                                                        onClick={capturePhoto}
                                                    >
                                                        <Camera className="h-6 w-6" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div 
                                                className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer hover:bg-primary/5 transition-colors bg-muted/30"
                                                onClick={() => startCamera()}
                                            >
                                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                                                    <Camera className="h-6 w-6 text-primary" />
                                                </div>
                                                <span className="text-sm text-foreground font-medium">Buka Kamera</span>
                                                <span className="text-xs text-muted-foreground/70 mt-1">Ambil foto secara langsung</span>
                                            </div>
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

            {/* Camera Error Alert */}
            <AlertDialog open={cameraError} onOpenChange={setCameraError}>
                <AlertDialogContent className="w-[90%] rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Akses Kamera Ditolak</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tidak dapat mengakses kamera. Pastikan Anda telah memberikan <b>izin akses kamera</b> pada pengaturan browser Anda.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setCameraError(false)} className="rounded-xl">
                            Mengerti
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </MobileLayout>
    );
}
