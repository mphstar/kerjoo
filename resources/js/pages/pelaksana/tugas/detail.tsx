import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CameraCapture } from '@/components/camera-capture';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import DeadlineStatus, { formatDeadlineDateTime } from '@/components/deadline-status';
import MobileLayout from '@/layouts/mobile-layout';
import { useTimerStore } from '@/stores/timer-store';
import { useGeolocation } from '@/hooks/use-geolocation';
import { type ItemPenugasan, type KomentarPenugasan, type Penugasan } from '@/types/logbook';
import { Head, router, usePage } from '@inertiajs/react';
import { Clock, FileText, Pause, Play, ArrowLeft, CheckCircle, X, Loader2, Calendar, AlertTriangle, MapPin, Navigation, MapPinOff, Trash2, MessageCircle, Send } from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';

interface Props {
    penugasan: Penugasan;
    items: ItemPenugasan[];
}

export default function TugasDetail({ penugasan, items }: Props) {
    const page = usePage<{ auth: { user: { id: number } } }>();
    const currentUserId = page.props.auth.user.id;
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertDetails, setAlertDetails] = useState({ title: '', message: '' });
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [komentarIsi, setKomentarIsi] = useState('');
    const [isSendingKomentar, setIsSendingKomentar] = useState(false);
    const [deleteKomentarId, setDeleteKomentarId] = useState<number | null>(null);
    const komentarEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        komentarEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [penugasan.komentar]);

    const showAlert = (title: string, message: string) => {
        setAlertDetails({ title, message });
        setAlertOpen(true);
    };

    // SYNC STATE WITH BACKEND
    // This ensures that if the page is refreshed or loaded from a different device state,
    // the local timer store reflects the actual backend reality.
    const { activeItemId, isRunning, syncFromBackend, resetTimer } = useTimerStore();

    useEffect(() => {
        // 1. Find the item that is currently running in backend
        const runningItem = items.find(i => i.status === 'sedang_dikerjakan' && i.waktu_mulai);

        if (runningItem) {
            // Backend says this item is running. Force sync store.
            if (activeItemId !== runningItem.id || !isRunning) {
                const getElapsedFromStart = (startStr: string) => {
                    const startDate = new Date(startStr);
                    if (isNaN(startDate.getTime())) return 0;
                    return Math.max(0, Math.floor((Date.now() - startDate.getTime()) / 1000));
                };

                syncFromBackend(
                    runningItem.id,
                    true,
                    getElapsedFromStart(runningItem.waktu_mulai!),
                    runningItem.waktu_mulai!
                );
            }
        } else {
            // Backend says NO item is running.
            // If store thinks an item FROM THIS LIST is running, we must reset it.
            // (We check if activeItemId belongs to this penugasan's items)
            if (activeItemId && items.some(i => i.id === activeItemId)) {
                resetTimer();
            }
        }
    }, [items, activeItemId, isRunning, syncFromBackend, resetTimer]);

    const handleSubmitTask = () => {
        setIsLoading(true);
        router.post(`/pelaksana/tugas/${penugasan.id}/submit`, {}, {
            onFinish: () => setIsLoading(false),
            onSuccess: () => setConfirmOpen(false),
            onError: (errors) => showAlert('Gagal', JSON.stringify(errors))
        });
    };

    const handleAddSession = () => {
        setIsLoading(true);
        router.post(`/pelaksana/tugas/${penugasan.id}/items`, {}, {
            onFinish: () => setIsLoading(false),
            onSuccess: () => showAlert('Berhasil', 'Sesi baru ditambahkan, silahkan mulai timer.')
        });
    };

    return (
        <MobileLayout>
            <div className="min-h-screen bg-muted/20 dark:bg-slate-950 pb-20 transition-colors duration-300">
                <Head title={`Pengerjaan: ${penugasan.tugas?.nama}`} />

                {/* Mobile Header */}
                <div className="bg-gradient-to-br from-primary via-primary to-primary/80 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4 py-4 text-primary-foreground dark:text-white sticky top-0 z-10 shadow-sm flex items-center gap-3 transition-all duration-300">
                    <Button variant="ghost" size="icon" className="text-primary-foreground dark:text-white hover:bg-primary/80 dark:hover:bg-slate-800" onClick={() => window.history.back()}>
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-lg font-bold line-clamp-1 flex-1">{penugasan.tugas?.nama}</h1>
                </div>

                <div className="flex flex-col gap-6 p-4 max-w-lg mx-auto w-full mt-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>{penugasan.tugas?.nama}</CardTitle>
                            <CardDescription className="mt-1">{penugasan.tugas?.deskripsi}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-2 text-sm">
                                    <Clock className="h-4 w-4" />
                                    Status: <span className="font-semibold capitalize">{penugasan.status.replace('_', ' ')}</span>
                                </div>
                                {penugasan.tenggat_waktu && (
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-muted-foreground">Tenggat:</span>
                                            <span className="font-medium">{formatDeadlineDateTime(penugasan.tenggat_waktu)}</span>
                                        </div>
                                        <DeadlineStatus deadline={penugasan.tenggat_waktu} status={penugasan.status} />
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Location Status Card - Show when penugasan has location requirement */}
                    {penugasan.lokasi_latitude && penugasan.lokasi_longitude && penugasan.lokasi_radius && penugasan.status !== 'selesai' && (
                        <LocationStatusCard penugasan={penugasan} />
                    )}

                    {/* Duration Summary Card - Shown when task is completed */}
                    {penugasan.status === 'selesai' && items.length > 0 && (
                        <DurationSummaryCard items={items} />
                    )}

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Item Pekerjaan</h3>
                            {penugasan.status !== 'selesai' && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAddSession}
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                                    + Tambah Sesi
                                </Button>
                            )}
                        </div>
                        {items.map((item) => (
                            <ItemCard key={item.id} item={item} requirements={penugasan.tugas?.persyaratan} penugasan={penugasan} />
                        ))}
                        {items.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                <p>Belum ada sesi pekerjaan.</p>
                                <Button
                                    variant="link"
                                    onClick={handleAddSession}
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                                    Mulai Sesi Pertama
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Komentar Section */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <MessageCircle className="h-4 w-4" />
                                Komentar ({penugasan.komentar?.length || 0})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="max-h-[350px] overflow-y-auto space-y-3 pr-1">
                                {(!penugasan.komentar || penugasan.komentar.length === 0) && (
                                    <div className="text-center py-6 text-muted-foreground text-sm">
                                        Belum ada komentar.
                                    </div>
                                )}
                                {penugasan.komentar?.map((komentar) => {
                                    const isOwn = komentar.pengguna_id === currentUserId;
                                    const isAdmin = komentar.pengguna?.peran === 'admin';
                                    return (
                                        <div key={komentar.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`flex gap-2 max-w-[85%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                                                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isAdmin
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted text-muted-foreground'
                                                    }`}>
                                                    {komentar.pengguna?.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className={`rounded-2xl px-3 py-2 ${isOwn
                                                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                                        : 'bg-muted rounded-tl-sm'
                                                        }`}>
                                                        <p className="text-sm whitespace-pre-wrap">{komentar.isi}</p>
                                                    </div>
                                                    <div className={`flex items-center gap-2 mt-0.5 ${isOwn ? 'justify-end' : ''}`}>
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {komentar.pengguna?.name} · {new Date(komentar.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        {isOwn && (
                                                            <button
                                                                onClick={() => setDeleteKomentarId(komentar.id)}
                                                                className="text-muted-foreground hover:text-destructive transition-colors"
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={komentarEndRef} />
                            </div>

                            <div className="flex gap-2 pt-2 border-t">
                                <Textarea
                                    value={komentarIsi}
                                    onChange={(e) => setKomentarIsi(e.target.value)}
                                    placeholder="Tulis komentar..."
                                    className="min-h-[40px] max-h-[100px] resize-none text-sm"
                                    rows={1}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            if (komentarIsi.trim() && !isSendingKomentar) {
                                                setIsSendingKomentar(true);
                                                router.post(`/pelaksana/tugas/${penugasan.id}/komentar`, { isi: komentarIsi.trim() }, {
                                                    onSuccess: () => setKomentarIsi(''),
                                                    onFinish: () => setIsSendingKomentar(false),
                                                });
                                            }
                                        }
                                    }}
                                />
                                <Button
                                    size="icon"
                                    disabled={!komentarIsi.trim() || isSendingKomentar}
                                    onClick={() => {
                                        setIsSendingKomentar(true);
                                        router.post(`/pelaksana/tugas/${penugasan.id}/komentar`, { isi: komentarIsi.trim() }, {
                                            onSuccess: () => setKomentarIsi(''),
                                            onFinish: () => setIsSendingKomentar(false),
                                        });
                                    }}
                                    className="shrink-0"
                                >
                                    {isSendingKomentar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {penugasan.status !== 'selesai' && (
                        <div className="flex justify-end gap-4 mt-4">
                            <Button
                                size="lg"
                                className="w-full"
                                onClick={() => {
                                    // Validate all items are completed
                                    if (items.length === 0) {
                                        showAlert('Tidak Dapat Menyelesaikan', 'Belum ada sesi pekerjaan. Tambahkan minimal satu sesi pekerjaan terlebih dahulu.');
                                        return;
                                    }

                                    const incompleteItems = items.filter(item => item.status !== 'selesai');
                                    if (incompleteItems.length > 0) {
                                        const itemNames = incompleteItems.map(item => `• ${item.nama}`).join('\n');
                                        showAlert(
                                            'Tidak Dapat Menyelesaikan',
                                            `Masih ada ${incompleteItems.length} sesi pekerjaan yang belum diselesaikan:\n\n${itemNames}\n\nSelesaikan semua sesi terlebih dahulu.`
                                        );
                                        return;
                                    }

                                    setConfirmOpen(true);
                                }}
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Selesaikan Tugas
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Alert Dialog */}
            <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{alertDetails.title}</AlertDialogTitle>
                        <AlertDialogDescription>{alertDetails.message}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setAlertOpen(false)}>OK</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Confirmation Dialog */}
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Selesaikan Tugas?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Pastikan semua item pekerjaan telah selesai dan data yang diinputkan sudah benar. Laporan akan dikirim ke admin.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSubmitTask} disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Ya, Selesaikan
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Komentar Confirmation */}
            <AlertDialog open={deleteKomentarId !== null} onOpenChange={(open) => !open && setDeleteKomentarId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Komentar?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Komentar yang dihapus tidak dapat dikembalikan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-white hover:bg-destructive/90"
                            onClick={() => {
                                if (deleteKomentarId) {
                                    router.delete(`/pelaksana/tugas/komentar/${deleteKomentarId}`);
                                    setDeleteKomentarId(null);
                                }
                            }}
                        >
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </MobileLayout>
    );
}

// Duration Summary Card Component
function DurationSummaryCard({ items }: { items: ItemPenugasan[] }) {
    const totalDuration = items.reduce((acc, item) => acc + (item.durasi_detik || 0), 0);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const formatTimeReadable = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;

        const parts = [];
        if (h > 0) parts.push(`${h} jam`);
        if (m > 0) parts.push(`${m} menit`);
        if (s > 0 || parts.length === 0) parts.push(`${s} detik`);
        return parts.join(' ');
    };

    const formatDateTime = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('id-ID', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Card className="overflow-hidden border-green-200 dark:border-green-900">
            {/* Gradient Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-5 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                            <CheckCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-green-100 text-sm font-medium">Tugas Selesai</p>
                            <p className="text-2xl font-bold">{formatTime(totalDuration)}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-green-100 text-xs">Total Sesi</p>
                        <p className="text-3xl font-bold">{items.length}</p>
                    </div>
                </div>
            </div>

            <CardContent className="p-4">
                <div className="space-y-1 mb-4">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Ringkasan Durasi per Sesi</h4>
                    <p className="text-xs text-muted-foreground">Total waktu: {formatTimeReadable(totalDuration)}</p>
                </div>

                <div className="space-y-3">
                    {items.map((item, index) => {
                        const percentage = totalDuration > 0 ? ((item.durasi_detik || 0) / totalDuration) * 100 : 0;
                        const colors = [
                            'from-blue-500 to-blue-600',
                            'from-purple-500 to-purple-600',
                            'from-orange-500 to-orange-600',
                            'from-pink-500 to-pink-600',
                            'from-cyan-500 to-cyan-600',
                            'from-amber-500 to-amber-600',
                        ];
                        const colorClass = colors[index % colors.length];

                        return (
                            <div key={item.id} className="group">
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${colorClass}`} />
                                        <span className="font-medium text-sm">{item.nama}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-muted-foreground">
                                            {formatDateTime(item.waktu_mulai)}
                                        </span>
                                        <span className="font-mono font-semibold text-sm">
                                            {formatTime(item.durasi_detik || 0)}
                                        </span>
                                    </div>
                                </div>
                                {/* Progress Bar */}
                                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={`absolute inset-y-0 left-0 bg-gradient-to-r ${colorClass} rounded-full transition-all duration-500 ease-out`}
                                        style={{ width: `${Math.max(percentage, 2)}%` }}
                                    />
                                </div>
                                <div className="flex justify-between mt-1">
                                    <span className="text-[10px] text-muted-foreground">
                                        {percentage.toFixed(1)}% dari total
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                        {formatTimeReadable(item.durasi_detik || 0)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Summary Stats */}
                <div className="mt-5 pt-4 border-t grid grid-cols-3 gap-3">
                    <div className="text-center p-2 bg-muted/50 rounded-lg">
                        <p className="text-lg font-bold text-primary">{items.length}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Sesi</p>
                    </div>
                    <div className="text-center p-2 bg-muted/50 rounded-lg">
                        <p className="text-lg font-bold text-green-600">
                            {items.filter(i => i.status === 'selesai').length}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase">Selesai</p>
                    </div>
                    <div className="text-center p-2 bg-muted/50 rounded-lg">
                        <p className="text-lg font-bold text-blue-600">
                            {formatTime(Math.round(totalDuration / items.length))}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase">Rata-rata</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Location Status Card Component
function LocationStatusCard({ penugasan }: { penugasan: Penugasan }) {
    const geo = useGeolocation();
    const [distance, setDistance] = useState<number | null>(null);
    const isWithinRadius = distance !== null && penugasan.lokasi_radius
        ? distance <= penugasan.lokasi_radius
        : null;

    useEffect(() => {
        // Start watching position when component mounts
        if (geo.permissionState !== 'denied') {
            geo.startWatching();
        }
        return () => geo.stopWatching();
    }, []);

    useEffect(() => {
        if (geo.latitude && geo.longitude && penugasan.lokasi_latitude && penugasan.lokasi_longitude) {
            const d = geo.calculateDistance(penugasan.lokasi_latitude, penugasan.lokasi_longitude);
            setDistance(d);
        }
    }, [geo.latitude, geo.longitude, penugasan.lokasi_latitude, penugasan.lokasi_longitude]);

    const formatDistance = (meters: number) => {
        if (meters < 1000) {
            return `${Math.round(meters)} m`;
        }
        return `${(meters / 1000).toFixed(2)} km`;
    };

    // Permission denied
    if (geo.permissionState === 'denied') {
        return (
            <Alert variant="destructive">
                <MapPinOff className="h-4 w-4" />
                <AlertTitle>Akses Lokasi Ditolak</AlertTitle>
                <AlertDescription>
                    Tugas ini memerlukan validasi lokasi. Silakan izinkan akses lokasi di pengaturan browser Anda.
                </AlertDescription>
            </Alert>
        );
    }

    // Permission not yet requested or loading
    if (geo.permissionState === 'prompt' || geo.isLoading) {
        return (
            <Alert>
                <Navigation className="h-4 w-4 animate-pulse" />
                <AlertTitle>Memerlukan Akses Lokasi</AlertTitle>
                <AlertDescription className="space-y-2">
                    <p>Tugas ini memerlukan validasi lokasi. Anda harus berada dalam radius {penugasan.lokasi_radius}m dari lokasi tugas.</p>
                    {penugasan.lokasi_nama && (
                        <p className="text-xs text-muted-foreground">Lokasi: {penugasan.lokasi_nama}</p>
                    )}
                    <Button size="sm" variant="outline" onClick={() => geo.requestPermission()} disabled={geo.isLoading}>
                        {geo.isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MapPin className="h-4 w-4 mr-2" />}
                        Izinkan Akses Lokasi
                    </Button>
                </AlertDescription>
            </Alert>
        );
    }

    // Location error
    if (geo.error && !geo.latitude) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Gagal Mendapatkan Lokasi</AlertTitle>
                <AlertDescription>
                    {geo.error}
                    <Button size="sm" variant="outline" className="mt-2" onClick={() => geo.getCurrentPosition()}>
                        Coba Lagi
                    </Button>
                </AlertDescription>
            </Alert>
        );
    }

    // Show location status
    return (
        <Card className={`border-2 ${isWithinRadius ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'}`}>
            <CardContent className="py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${isWithinRadius ? 'bg-green-500' : 'bg-orange-500'}`}>
                            <MapPin className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="font-semibold text-sm">
                                {isWithinRadius ? 'Dalam Area Kerja' : 'Di Luar Area Kerja'}
                            </p>
                            {penugasan.lokasi_nama && (
                                <p className="text-xs text-muted-foreground">{penugasan.lokasi_nama}</p>
                            )}
                        </div>
                    </div>
                    <div className="text-right">
                        <p className={`text-lg font-bold ${isWithinRadius ? 'text-green-600' : 'text-orange-600'}`}>
                            {distance !== null ? formatDistance(distance) : '...'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Radius: {penugasan.lokasi_radius}m
                        </p>
                    </div>
                </div>
                {!isWithinRadius && distance !== null && (
                    <p className="text-xs text-orange-600 mt-2">
                        Anda perlu mendekat {formatDistance(distance - (penugasan.lokasi_radius || 0))} lagi untuk memulai tugas.
                    </p>
                )}
                {geo.accuracy && (
                    <p className="text-xs text-muted-foreground mt-1">
                        Akurasi GPS: ±{Math.round(geo.accuracy)}m
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

function ItemCard({ item, requirements, penugasan }: { item: ItemPenugasan; requirements: any; penugasan: Penugasan }) {
    const geo = useGeolocation();
    const {
        activeItemId,
        startTimer,
        stopTimer,
        accumulatedDuration,
        startTime,
        isRunning
    } = useTimerStore();

    const isActive = activeItemId === item.id;
    // isTimerRunning considers both local state AND backend state
    // This ensures the UI works correctly even after page refresh
    const isTimerRunning = isActive || (item.status === 'sedang_dikerjakan' && item.waktu_mulai !== null);

    const [duration, setDuration] = useState(item.durasi_detik || 0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form States
    const [fotoSebelum, setFotoSebelum] = useState<File | null>(null);
    const [fotoSesudah, setFotoSesudah] = useState<File | null>(null);
    const [fotoSebelumPreview, setFotoSebelumPreview] = useState<string | null>(null);
    const [fotoSesudahPreview, setFotoSesudahPreview] = useState<string | null>(null);

    // Refs for auto-trigger timer actions
    const pendingStartRef = useRef(false);
    const pendingStopRef = useRef(false);
    const [fileLampiran, setFileLampiran] = useState<File | null>(null);
    const [ringkasan, setRingkasan] = useState(item.ringkasan_teks || '');

    // Validated coordinates from photo capture
    const [validatedCoordsSebelum, setValidatedCoordsSebelum] = useState<{ latitude: number; longitude: number } | null>(null);
    const [validatedCoordsSesudah, setValidatedCoordsSesudah] = useState<{ latitude: number; longitude: number } | null>(null);
    const [isValidatingLocation, setIsValidatingLocation] = useState(false);

    // Dialog States
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [alertState, setAlertState] = useState<{ open: boolean, title: string, message: string }>({ open: false, title: '', message: '' });

    const reqs = requirements || {};

    const showAlert = (title: string, message: string) => {
        setAlertState({ open: true, title, message });
    };

    // Delete confirmation state
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteItem = () => {
        setIsDeleting(true);
        router.delete(`/pelaksana/tugas/${item.penugasan_id}/items/${item.id}`, {
            onFinish: () => setIsDeleting(false),
            onSuccess: () => setDeleteConfirmOpen(false),
            onError: (errors) => {
                setDeleteConfirmOpen(false);
                showAlert('Gagal Menghapus', JSON.stringify(errors));
            }
        });
    };

    // Sync local duration with store if active
    // Priority: backend state (sedang_dikerjakan with waktu_mulai) > local zustand state > initial pending
    useEffect(() => {
        let interval: NodeJS.Timeout;

        const getElapsedFromStart = (startStr: string) => {
            const startDate = new Date(startStr);
            if (isNaN(startDate.getTime())) return 0;
            return Math.max(0, Math.floor((Date.now() - startDate.getTime()) / 1000));
        };

        if (item.status === 'selesai') {
            // Item completed - show final duration
            setDuration(item.durasi_detik || 0);
        } else if (item.status === 'sedang_dikerjakan' && item.waktu_mulai) {
            // Timer running from backend state - sync timer from backend waktu_mulai
            const sync = () => setDuration(getElapsedFromStart(item.waktu_mulai!));
            sync();
            interval = setInterval(sync, 1000);
        } else if (isActive && isRunning && startTime) {
            // Timer running from local zustand state (before backend saves)
            const calculateElapsed = () => Math.max(0, Math.floor((Date.now() - startTime) / 1000));
            setDuration(accumulatedDuration + calculateElapsed());
            interval = setInterval(() => {
                setDuration(accumulatedDuration + calculateElapsed());
            }, 1000);
        } else if (item.status === 'pending') {
            // Only reset to 0 if item is truly pending (not yet started)
            setDuration(item.durasi_detik || 0);
        }
        // Note: removed the else { setDuration(0) } to prevent reset during state transitions

        return () => clearInterval(interval);
    }, [isActive, isRunning, accumulatedDuration, startTime, item.durasi_detik, item.status, item.waktu_mulai]);

    // Auto-start timer after foto sebelum is captured
    useEffect(() => {
        if (pendingStartRef.current && fotoSebelum && !isSubmitting) {
            pendingStartRef.current = false;
            // Small delay for UI feedback before starting
            const timer = setTimeout(() => {
                handleStart();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [fotoSebelum]);

    // Auto-stop timer after foto sesudah is captured
    useEffect(() => {
        if (pendingStopRef.current && fotoSesudah && !isSubmitting) {
            pendingStopRef.current = false;
            // Small delay for UI feedback before stopping
            const timer = setTimeout(() => {
                handleStop();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [fotoSesudah]);

    const formatTime = (seconds: number | null | undefined) => {
        const safeSeconds = Math.max(0, seconds || 0);
        const h = Math.floor(safeSeconds / 3600);
        const m = Math.floor((safeSeconds % 3600) / 60);
        const s = safeSeconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const formatDateTime = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('id-ID', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Location validation helper - validates location before photo capture is accepted
    const validateLocationForPhoto = async (): Promise<{ latitude: number; longitude: number } | null> => {
        // If no location requirement, return null (no validation needed)
        if (!penugasan.lokasi_latitude || !penugasan.lokasi_longitude || !penugasan.lokasi_radius) {
            return null;
        }

        setIsValidatingLocation(true);
        try {
            const coords = await geo.getCurrentPosition();

            if (!coords) {
                showAlert('Validasi Lokasi Gagal', 'Gagal mendapatkan data koordinat. Pastikan GPS aktif.');
                return null;
            }

            const distance = geo.calculateDistance(
                penugasan.lokasi_latitude,
                penugasan.lokasi_longitude,
                coords.latitude,
                coords.longitude
            );

            if (distance != null && distance > penugasan.lokasi_radius) {
                showAlert(
                    'Di Luar Area Kerja',
                    `Anda berada ${Math.round(distance)}m dari lokasi tugas. Radius yang diizinkan adalah ${penugasan.lokasi_radius}m. Silakan mendekat ke lokasi tugas terlebih dahulu.`
                );
                return null;
            }

            return { latitude: coords.latitude, longitude: coords.longitude };
        } catch (error) {
            showAlert('Validasi Lokasi Gagal', typeof error === 'string' ? error : 'Gagal mendapatkan lokasi. Pastikan izin lokasi diberikan.');
            return null;
        } finally {
            setIsValidatingLocation(false);
        }
    };

    // Photo capture handler with location validation
    const handleFotoSebelumCapture = async (file: File) => {
        // Validate location first if required
        if (penugasan.lokasi_latitude && penugasan.lokasi_longitude && penugasan.lokasi_radius) {
            const coords = await validateLocationForPhoto();
            if (coords == null) {
                // Location validation failed, don't accept photo
                return;
            }
            setValidatedCoordsSebelum(coords);
        }

        // Accept photo and trigger auto-start
        setFotoSebelum(file);
        setFotoSebelumPreview(URL.createObjectURL(file));
        pendingStartRef.current = true;
    };

    // Photo capture handler with location validation for foto sesudah
    const handleFotoSesudahCapture = async (file: File) => {
        // Validate location first if required
        if (penugasan.lokasi_latitude && penugasan.lokasi_longitude && penugasan.lokasi_radius) {
            const coords = await validateLocationForPhoto();
            if (coords == null) {
                // Location validation failed, don't accept photo
                return;
            }
            setValidatedCoordsSesudah(coords);
        }

        // Accept photo and trigger auto-stop
        setFotoSesudah(file);
        setFotoSesudahPreview(URL.createObjectURL(file));
        pendingStopRef.current = true;
    };

    const handleStart = async () => {
        if (reqs.foto && !fotoSebelum) {
            showAlert('Validasi Gagal', 'Harap upload foto sebelum pengerjaan.');
            return;
        }

        // Use validated coordinates from photo capture (location already validated)
        const latitude = validatedCoordsSebelum?.latitude ?? null;
        const longitude = validatedCoordsSebelum?.longitude ?? null;

        const formData = new FormData();
        if (fotoSebelum) formData.append('foto_sebelum', fotoSebelum);
        if (latitude != null) formData.append('latitude', latitude.toString());
        if (longitude != null) formData.append('longitude', longitude.toString());

        router.post(`/pelaksana/tugas/${item.penugasan_id}/items/${item.id}/start`, formData, {
            forceFormData: true,
            preserveState: true,
            onStart: () => setIsSubmitting(true),
            onFinish: () => setIsSubmitting(false),
            onSuccess: () => {
                startTimer(item.id, item.durasi_detik);
            },
            onError: (errors) => {
                showAlert('Gagal Memulai', JSON.stringify(errors));
            }
        });
    };

    const handleStop = async () => {
        if (reqs.foto && !fotoSesudah) {
            showAlert('Validasi Gagal', 'Harap upload foto sesudah pengerjaan.');
            return;
        }
        if (reqs.teks && !ringkasan) {
            showAlert('Validasi Gagal', 'Harap isi ringkasan pengerjaan.');
            return;
        }
        if (reqs.file && !fileLampiran) {
            showAlert('Validasi Gagal', 'Harap upload file lampiran.');
            return;
        }

        // Use validated coordinates from photo capture (location already validated)
        const latitude = validatedCoordsSesudah?.latitude ?? null;
        const longitude = validatedCoordsSesudah?.longitude ?? null;

        const formData = new FormData();
        if (fotoSesudah) formData.append('foto_sesudah', fotoSesudah);
        if (fileLampiran) formData.append('file_lampiran', fileLampiran);
        if (ringkasan) formData.append('ringkasan_teks', ringkasan);
        if (latitude != null) formData.append('latitude', latitude.toString());
        if (longitude != null) formData.append('longitude', longitude.toString());

        router.post(`/pelaksana/tugas/${item.penugasan_id}/items/${item.id}/stop`, formData, {
            forceFormData: true,
            preserveState: true,
            onStart: () => setIsSubmitting(true),
            onFinish: () => setIsSubmitting(false),
            onSuccess: () => {
                stopTimer();
            },
            onError: (errors) => {
                showAlert('Gagal Menghentikan', JSON.stringify(errors));
            }
        });
    };

    const handleToggleTimer = () => {
        if (isSubmitting) return;
        if (isTimerRunning) {
            handleStop();
        } else {
            handleStart();
        }
    };

    const isCompleted = item.status === 'selesai';

    return (
        <Card className={`border-l-4 ${isTimerRunning ? 'border-l-primary' : isCompleted ? 'border-l-green-500' : 'border-l-muted'}`}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{item.nama}</CardTitle>
                        {penugasan.status !== 'selesai' && (
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={() => setDeleteConfirmOpen(true)}
                                disabled={isTimerRunning || isSubmitting}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <div className={`text-2xl font-mono font-bold ${isTimerRunning ? 'text-primary' : isCompleted ? 'text-green-600' : ''}`}>
                            {formatTime(duration)}
                        </div>
                        {item.status !== 'selesai' && (
                            <Button
                                size="icon"
                                variant={isTimerRunning ? "destructive" : "default"}
                                onClick={handleToggleTimer}
                                className="rounded-full h-10 w-10"
                                disabled={(!isTimerRunning && isRunning) || isSubmitting}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : isTimerRunning ? (
                                    <Pause className="fill-current" />
                                ) : (
                                    <Play className="fill-current ml-1" />
                                )}
                            </Button>
                        )}
                        {item.status === 'selesai' && <CheckCircle className="text-green-500 h-8 w-8" />}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
                {/* PRE-START INPUTS */}
                {item.status === 'pending' && !isTimerRunning && (
                    <div className="space-y-4">
                        {reqs?.foto && (
                            <div className="space-y-2">
                                <Label>Foto Sebelum Pengerjaan <span className="text-red-500">*</span></Label>
                                {fotoSebelumPreview ? (
                                    <div className="relative">
                                        <img
                                            src={fotoSebelumPreview}
                                            alt="Preview foto sebelum"
                                            className="w-full aspect-video object-cover rounded-md border"
                                        />
                                        <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                                            <CheckCircle className="h-3 w-3" />
                                            Foto berhasil diambil. Timer akan dimulai otomatis...
                                        </div>
                                    </div>
                                ) : (
                                    <CameraCapture
                                        label={isValidatingLocation ? "Memvalidasi lokasi..." : "Ambil Foto Sebelum & Mulai Timer"}
                                        onCapture={handleFotoSebelumCapture}
                                        disabled={isSubmitting || isValidatingLocation}
                                    />
                                )}
                                <p className="text-xs text-muted-foreground">Ambil foto kondisi sebelum memulai. Timer akan mulai otomatis.</p>
                            </div>
                        )}
                        {(reqs?.teks || reqs?.file) && (
                            <p className="text-xs text-muted-foreground italic">Input lainnya akan muncul setelah timer dimulai.</p>
                        )}
                    </div>
                )}

                {/* ACTIVE INPUTS */}
                {isTimerRunning && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md text-sm text-blue-700 dark:text-blue-300 mb-4">
                            Timer sedang berjalan. Lengkapi data berikut sebelum menyelesaikan.
                        </div>

                        {reqs?.foto && (
                            <div className="space-y-2">
                                <Label>Foto Sesudah Pengerjaan <span className="text-red-500">*</span></Label>
                                {fotoSesudahPreview ? (
                                    <div className="relative">
                                        <img
                                            src={fotoSesudahPreview}
                                            alt="Preview foto sesudah"
                                            className="w-full aspect-video object-cover rounded-md border"
                                        />
                                        <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                                            <CheckCircle className="h-3 w-3" />
                                            Foto berhasil diambil. Timer akan dihentikan otomatis...
                                        </div>
                                    </div>
                                ) : (
                                    <CameraCapture
                                        label={isValidatingLocation ? "Memvalidasi lokasi..." : "Ambil Foto Sesudah & Selesaikan Sesi"}
                                        onCapture={handleFotoSesudahCapture}
                                        disabled={isSubmitting || isValidatingLocation}
                                    />
                                )}
                            </div>
                        )}

                        {reqs?.file && (
                            <div className="space-y-2">
                                <Label>Lampiran File <span className="text-red-500">*</span></Label>
                                <Input
                                    type="file"
                                    onChange={(e) => setFileLampiran(e.target.files ? e.target.files[0] : null)}
                                />
                            </div>
                        )}

                        {reqs?.teks && (
                            <div className="space-y-2">
                                <Label>Ringkasan/Catatan <span className="text-red-500">*</span></Label>
                                <Textarea
                                    placeholder="Catatan pengerjaan..."
                                    className="h-20 text-sm"
                                    value={ringkasan}
                                    onChange={(e) => setRingkasan(e.target.value)}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* COMPLETED VIEW */}
                {isCompleted && (
                    <div className="space-y-4 pt-2 border-t mt-2">
                        {/* Time Info */}
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>Mulai: {formatDateTime(item.waktu_mulai)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                <span>Selesai: {formatDateTime(item.waktu_selesai)}</span>
                            </div>
                        </div>

                        {item.ringkasan_teks && (
                            <div className="text-sm">
                                <span className="font-semibold text-muted-foreground block mb-1">Catatan/Ringkasan:</span>
                                <p className="bg-muted p-3 rounded-md">{item.ringkasan_teks}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            {item.foto_sebelum_url && (
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground font-semibold">Foto Sebelum</span>
                                    <div
                                        className="aspect-video w-full rounded-md bg-muted overflow-hidden border cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => setSelectedImage(item.foto_sebelum_url!)}
                                    >
                                        <img src={item.foto_sebelum_url} alt="Foto Sebelum" className="w-full h-full object-cover" />
                                    </div>
                                </div>
                            )}
                            {item.foto_sesudah_url && (
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground font-semibold">Foto Sesudah</span>
                                    <div
                                        className="aspect-video w-full rounded-md bg-muted overflow-hidden border cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => setSelectedImage(item.foto_sesudah_url!)}
                                    >
                                        <img src={item.foto_sesudah_url} alt="Foto Sesudah" className="w-full h-full object-cover" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {item.file_lampiran_url && (
                            <div className="flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md text-blue-700 dark:text-blue-300">
                                <FileText className="h-4 w-4" />
                                <a href={item.file_lampiran_url} target="_blank" rel="noreferrer" className="underline hover:no-underline">
                                    Lihat Lampiran File
                                </a>
                            </div>
                        )}

                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                            <Clock className="h-3 w-3" />
                            <span>Durasi: {formatTime(item.durasi_detik)}</span>
                        </div>
                    </div>
                )}
            </CardContent>

            {/* Fullscreen Image Dialog */}
            <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
                <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black/95 border-none">
                    <div className="relative w-full h-full flex items-center justify-center">
                        <img
                            src={selectedImage || ''}
                            alt="Fullscreen Preview"
                            className="max-h-[80vh] w-auto object-contain"
                        />
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Sesi?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus sesi "{item.nama}"?
                            {item.status === 'selesai' && " Semua data termasuk foto akan dihapus."}
                            {item.status === 'sedang_dikerjakan' && " Timer yang sedang berjalan akan dihentikan."}
                            Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteItem}
                            disabled={isDeleting}
                            className="bg-destructive text-white hover:bg-destructive/90"
                        >
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Local Alert Dialog */}
            <AlertDialog open={alertState.open} onOpenChange={(open) => setAlertState(prev => ({ ...prev, open }))}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{alertState.title}</AlertDialogTitle>
                        <AlertDialogDescription>{alertState.message}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setAlertState(prev => ({ ...prev, open: false }))}>OK</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}
