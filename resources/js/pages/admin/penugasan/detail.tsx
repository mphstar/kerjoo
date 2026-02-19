import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { type ItemPenugasan, type KomentarPenugasan, type Penugasan } from '@/types/logbook';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Calendar, CheckCircle, Clock, FileText, User as UserIcon, X, Image as ImageIcon, Timer, ClipboardList, MessageCircle, Send, Trash2, Loader2 } from 'lucide-react';
import { useState, useMemo, useRef, useEffect } from 'react';

interface Props {
    penugasan: Penugasan & { items: ItemPenugasan[] };
    basePath?: string;
}

export default function AdminPenugasanDetail({ penugasan, basePath: basePathProp }: Props) {
    const { auth } = usePage<{ auth: { user: { id: number; peran: string } } }>().props;
    const basePath = basePathProp || '/admin';
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [komentarIsi, setKomentarIsi] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [deleteKomentarId, setDeleteKomentarId] = useState<number | null>(null);
    const komentarEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        komentarEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [penugasan.komentar]);

    const formatTime = (seconds: number | null | undefined) => {
        const safeSeconds = Math.max(0, seconds || 0);
        const h = Math.floor(safeSeconds / 3600);
        const m = Math.floor((safeSeconds % 3600) / 60);
        const s = safeSeconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Calculate stats
    const stats = useMemo(() => {
        const items = penugasan.items || [];
        const total = items.length;
        const completed = items.filter(i => i.status === 'selesai').length;
        const totalDuration = items.reduce((sum, i) => sum + (i.durasi_detik || 0), 0);
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { total, completed, totalDuration, progress };
    }, [penugasan.items]);

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'selesai':
                return { label: 'Selesai', color: 'bg-green-500', bgColor: 'bg-green-100 dark:bg-green-900/30', textColor: 'text-green-700 dark:text-green-300' };
            case 'sedang_dikerjakan':
                return { label: 'Dikerjakan', color: 'bg-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/30', textColor: 'text-blue-700 dark:text-blue-300' };
            default:
                return { label: 'Belum Dikerjakan', color: 'bg-amber-500', bgColor: 'bg-amber-100 dark:bg-amber-900/30', textColor: 'text-amber-700 dark:text-amber-300' };
        }
    };

    const statusConfig = getStatusConfig(penugasan.status);

    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: basePath === '/pimpinan' ? '/dashboard' : '/admin' },
            { title: auth.user.peran === 'pimpinan' ? 'Monitoring Penugasan' : 'Penugasan', href: `${basePath}/penugasan` },
            { title: penugasan.tugas?.nama || 'Detail', href: '#' }
        ]}>
            <Head title={`Detail: ${penugasan.tugas?.nama}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={`${basePath}/penugasan`}>
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h2 className="text-2xl font-bold">{penugasan.tugas?.nama}</h2>
                            <p className="text-muted-foreground">{penugasan.tugas?.kategori?.nama}</p>
                        </div>
                    </div>
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${statusConfig.bgColor}`}>
                        <div className={`h-2 w-2 rounded-full ${statusConfig.color}`} />
                        <span className={`font-semibold ${statusConfig.textColor}`}>{statusConfig.label}</span>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="border-0 shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                    <ClipboardList className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">{stats.completed}/{stats.total}</div>
                                    <div className="text-xs text-muted-foreground">Item Selesai</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                                    <Timer className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold font-mono">{formatTime(stats.totalDuration)}</div>
                                    <div className="text-xs text-muted-foreground">Total Durasi</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">{stats.progress}%</div>
                                    <div className="text-xs text-muted-foreground">Progress</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                                    <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold">{penugasan.tenggat_waktu ? formatDate(penugasan.tenggat_waktu).split(',')[0] : '-'}</div>
                                    <div className="text-xs text-muted-foreground">Deadline</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress Pengerjaan</span>
                        <span className="font-medium">{stats.progress}%</span>
                    </div>
                    <Progress value={stats.progress} className="h-2" />
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Sidebar Info */}
                    <div className="md:col-span-1 space-y-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <UserIcon className="h-4 w-4" />
                                    Pelaksana
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                        <span className="text-lg font-bold text-primary">
                                            {penugasan.pengguna?.name?.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="font-semibold">{penugasan.pengguna?.name}</div>
                                        <div className="text-xs text-muted-foreground">{penugasan.pengguna?.email}</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Timeline
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Ditugaskan</span>
                                    <span className="font-medium">{formatDate(penugasan.created_at)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Mulai</span>
                                    <span className="font-medium">{formatDate(penugasan.waktu_mulai)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Selesai</span>
                                    <span className="font-medium">{formatDate(penugasan.waktu_selesai)}</span>
                                </div>
                                {penugasan.tenggat_waktu && (
                                    <>
                                        <Separator />
                                        <div className="flex justify-between text-red-600 dark:text-red-400">
                                            <span>Deadline</span>
                                            <span className="font-medium">{formatDate(penugasan.tenggat_waktu)}</span>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {penugasan.catatan && (
                            <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">Catatan</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-amber-800 dark:text-amber-200">"{penugasan.catatan}"</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Main Content - Items */}
                    <div className="md:col-span-2 space-y-4">
                        <h3 className="font-semibold text-lg">Detail Item Pekerjaan</h3>

                        {penugasan.items && penugasan.items.length === 0 && (
                            <Card className="border-dashed">
                                <CardContent className="py-8 text-center text-muted-foreground">
                                    Belum ada item pekerjaan
                                </CardContent>
                            </Card>
                        )}

                        {penugasan.items && penugasan.items.map((item, index) => {
                            const itemStatus = getStatusConfig(item.status);
                            return (
                                <Card key={item.id} className="overflow-hidden">
                                    <div className={`h-1 ${itemStatus.color}`} />
                                    <CardHeader className="pb-3">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs text-muted-foreground">#{index + 1}</span>
                                                    <CardTitle className="text-base">{item.nama}</CardTitle>
                                                </div>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <Badge className={`${itemStatus.bgColor} ${itemStatus.textColor} border-0`}>
                                                        {itemStatus.label}
                                                    </Badge>
                                                    {item.durasi_detik && item.durasi_detik > 0 && (
                                                        <Badge variant="outline" className="gap-1 font-mono">
                                                            <Timer className="h-3 w-3" />
                                                            {formatTime(item.durasi_detik)}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    {(item.waktu_mulai || item.waktu_selesai || item.ringkasan_teks || item.foto_sebelum_url || item.foto_sesudah_url || item.file_lampiran_url) && (
                                        <CardContent className="pt-0 space-y-4">
                                            {/* Time Info */}
                                            {(item.waktu_mulai || item.waktu_selesai) && (
                                                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                                                    {item.waktu_mulai && (
                                                        <span>Mulai: <strong className="text-foreground">{formatDate(item.waktu_mulai)}</strong></span>
                                                    )}
                                                    {item.waktu_selesai && (
                                                        <span>Selesai: <strong className="text-foreground">{formatDate(item.waktu_selesai)}</strong></span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Summary */}
                                            {item.ringkasan_teks && (
                                                <div className="bg-muted/50 p-3 rounded-lg text-sm">
                                                    <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">Ringkasan</span>
                                                    <p className="mt-1">{item.ringkasan_teks}</p>
                                                </div>
                                            )}

                                            {/* Photos */}
                                            {(item.foto_sebelum_url || item.foto_sesudah_url) && (
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
                                                            <ImageIcon className="h-3 w-3" /> Sebelum
                                                        </span>
                                                        {item.foto_sebelum_url ? (
                                                            <div
                                                                className="aspect-video w-full bg-muted rounded-lg overflow-hidden border cursor-zoom-in hover:opacity-90 transition-opacity"
                                                                onClick={() => setSelectedImage(item.foto_sebelum_url!)}
                                                            >
                                                                <img src={item.foto_sebelum_url} alt="Sebelum" className="w-full h-full object-cover" />
                                                            </div>
                                                        ) : (
                                                            <div className="aspect-video w-full bg-muted/30 rounded-lg border-2 border-dashed flex items-center justify-center text-xs text-muted-foreground">
                                                                Tidak ada
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
                                                            <ImageIcon className="h-3 w-3" /> Sesudah
                                                        </span>
                                                        {item.foto_sesudah_url ? (
                                                            <div
                                                                className="aspect-video w-full bg-muted rounded-lg overflow-hidden border cursor-zoom-in hover:opacity-90 transition-opacity"
                                                                onClick={() => setSelectedImage(item.foto_sesudah_url!)}
                                                            >
                                                                <img src={item.foto_sesudah_url} alt="Sesudah" className="w-full h-full object-cover" />
                                                            </div>
                                                        ) : (
                                                            <div className="aspect-video w-full bg-muted/30 rounded-lg border-2 border-dashed flex items-center justify-center text-xs text-muted-foreground">
                                                                Tidak ada
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* File Attachment */}
                                            {item.file_lampiran_url && (
                                                <a
                                                    href={item.file_lampiran_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                                >
                                                    <FileText className="h-4 w-4" />
                                                    <span>Download Lampiran</span>
                                                </a>
                                            )}
                                        </CardContent>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* Komentar Section */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <MessageCircle className="h-4 w-4" />
                            Komentar ({penugasan.komentar?.length || 0})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Comment List */}
                        <div className="max-h-[400px] overflow-y-auto space-y-3 pr-1">
                            {(!penugasan.komentar || penugasan.komentar.length === 0) && (
                                <div className="text-center py-6 text-muted-foreground text-sm">
                                    Belum ada komentar. Mulai percakapan dengan pelaksana.
                                </div>
                            )}
                            {penugasan.komentar?.map((komentar) => {
                                const isOwn = komentar.pengguna_id === auth.user.id;
                                const isAdmin = komentar.pengguna?.peran === 'admin';
                                return (
                                    <div key={komentar.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`flex gap-2 max-w-[80%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isAdmin
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted text-muted-foreground'
                                                }`}>
                                                {komentar.pengguna?.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className={`rounded-2xl px-4 py-2 ${isOwn
                                                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                                    : 'bg-muted rounded-tl-sm'
                                                    }`}>
                                                    <p className="text-sm whitespace-pre-wrap">{komentar.isi}</p>
                                                </div>
                                                <div className={`flex items-center gap-2 mt-1 ${isOwn ? 'justify-end' : ''}`}>
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

                        {/* Comment Input */}
                        <div className="flex gap-2 pt-2 border-t">
                            <Textarea
                                value={komentarIsi}
                                onChange={(e) => setKomentarIsi(e.target.value)}
                                placeholder="Tulis komentar..."
                                className="min-h-[44px] max-h-[120px] resize-none"
                                rows={1}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        if (komentarIsi.trim() && !isSending) {
                                            setIsSending(true);
                                            router.post(`${basePath}/penugasan/${penugasan.id}/komentar`, { isi: komentarIsi.trim() }, {
                                                onSuccess: () => setKomentarIsi(''),
                                                onFinish: () => setIsSending(false),
                                            });
                                        }
                                    }
                                }}
                            />
                            <Button
                                size="icon"
                                disabled={!komentarIsi.trim() || isSending}
                                onClick={() => {
                                    setIsSending(true);
                                    router.post(`${basePath}/penugasan/${penugasan.id}/komentar`, { isi: komentarIsi.trim() }, {
                                        onSuccess: () => setKomentarIsi(''),
                                        onFinish: () => setIsSending(false),
                                    });
                                }}
                                className="shrink-0"
                            >
                                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Fullscreen Image Dialog */}
            <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/90 border-none">
                    <div className="relative w-full h-full flex items-center justify-center min-h-[500px]">
                        <img
                            src={selectedImage || ''}
                            alt="Fullscreen Preview"
                            className="max-h-[85vh] w-auto object-contain"
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
                                    router.delete(`${basePath}/penugasan/komentar/${deleteKomentarId}`);
                                    setDeleteKomentarId(null);
                                }
                            }}
                        >
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
