import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { type PermintaanBbm } from '@/types/logbook';
import { ImageIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    permintaan: PermintaanBbm | null;
}

function PhotoLightbox({
    urls,
    initialIndex,
    onClose,
}: {
    urls: string[];
    initialIndex: number;
    onClose: () => void;
}) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    const goNext = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % urls.length);
    }, [urls.length]);

    const goPrev = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + urls.length) % urls.length);
    }, [urls.length]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') goNext();
            if (e.key === 'ArrowLeft') goPrev();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, goNext, goPrev]);

    useEffect(() => {
        setCurrentIndex(initialIndex);
    }, [initialIndex]);

    return createPortal(
        <div
            className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center"
            onClick={onClose}
        >
            <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 bg-white/10 hover:bg-white/25 text-white rounded-full p-2.5 transition-colors z-20"
            >
                <X className="h-6 w-6" />
            </button>

            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm font-medium px-4 py-1.5 rounded-full z-20">
                {currentIndex + 1} / {urls.length}
            </div>

            {urls.length > 1 && (
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); goPrev(); }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full p-2.5 transition-colors z-20"
                >
                    <ChevronLeft className="h-7 w-7" />
                </button>
            )}

            <img
                src={urls[currentIndex]}
                alt={`Lampiran ${currentIndex + 1}`}
                className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl select-none"
                onClick={(e) => e.stopPropagation()}
                draggable={false}
            />

            {urls.length > 1 && (
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); goNext(); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full p-2.5 transition-colors z-20"
                >
                    <ChevronRight className="h-7 w-7" />
                </button>
            )}

            {urls.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 backdrop-blur-sm rounded-xl px-3 py-2 z-20">
                    {urls.map((url, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }}
                            className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                                index === currentIndex
                                    ? 'border-white ring-1 ring-white/50 scale-110'
                                    : 'border-transparent opacity-60 hover:opacity-100'
                            }`}
                        >
                            <img src={url} alt={`Thumb ${index + 1}`} className="w-full h-full object-cover" draggable={false} />
                        </button>
                    ))}
                </div>
            )}
        </div>,
        document.body
    );
}

export default function BbmDetailDialogPelaksana({ open, onOpenChange, permintaan }: Props) {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    if (!permintaan) return null;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="secondary">Menunggu</Badge>;
            case 'disetujui':
                return <Badge className="bg-green-600 hover:bg-green-700">Disetujui</Badge>;
            case 'ditolak':
                return <Badge variant="destructive">Ditolak</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
    };

    const fotoUrls = permintaan.lampiran_foto_urls ?? [];

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Detail Permintaan BBM</DialogTitle>
                        <DialogDescription>
                            {permintaan.nama_kendaraan} — {permintaan.uraian}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Info Umum */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <div className="text-muted-foreground">Tanggal</div>
                                <div className="font-medium">
                                    {new Date(permintaan.tanggal).toLocaleDateString('id-ID', {
                                        day: 'numeric', month: 'long', year: 'numeric',
                                    })}
                                </div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">Status</div>
                                <div className="mt-1">{getStatusBadge(permintaan.status)}</div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">No Buku</div>
                                <div className="font-medium">{permintaan.no_buku}</div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">Pengemudi</div>
                                <div className="font-medium">{permintaan.pengemudi}</div>
                            </div>
                        </div>

                        {/* Uraian */}
                        <div className="text-sm">
                            <div className="text-muted-foreground mb-1">Uraian</div>
                            <p className="font-medium">{permintaan.uraian}</p>
                        </div>

                        {/* Kendaraan */}
                        <div>
                            <Label className="mb-2 block">Kendaraan</Label>
                            <div className="rounded-md border p-3 text-sm space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Nama</span>
                                    <span className="font-medium">{permintaan.nama_kendaraan}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Merk</span>
                                    <span className="font-medium">{permintaan.merk_kendaraan}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">No Polisi</span>
                                    <span className="font-medium">{permintaan.no_polisi}</span>
                                </div>
                            </div>
                        </div>

                        {/* KM & BBM Table */}
                        <div>
                            <Label className="mb-2 block">Data KM & BBM</Label>
                            <div className="rounded-md border">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="p-2 text-left"></th>
                                            <th className="p-2 text-center">Awal</th>
                                            <th className="p-2 text-center">Akhir</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-t">
                                            <td className="p-2 text-muted-foreground">KM</td>
                                            <td className="p-2 text-center font-medium">{Number(permintaan.km_awal).toLocaleString('id-ID')} km</td>
                                            <td className="p-2 text-center font-medium">{permintaan.km_akhir ? `${Number(permintaan.km_akhir).toLocaleString('id-ID')} km` : '-'}</td>
                                        </tr>
                                        <tr className="border-t">
                                            <td className="p-2 text-muted-foreground">BBM (Liter)</td>
                                            <td className="p-2 text-center font-medium">{permintaan.bbm_awal_liter} Ltr</td>
                                            <td className="p-2 text-center font-medium">{permintaan.bbm_akhir_liter ? `${permintaan.bbm_akhir_liter} Ltr` : '-'}</td>
                                        </tr>
                                        <tr className="border-t">
                                            <td className="p-2 text-muted-foreground">BBM (%)</td>
                                            <td className="p-2 text-center font-medium">{permintaan.bbm_awal_persen}%</td>
                                            <td className="p-2 text-center font-medium">{permintaan.bbm_akhir_persen != null ? `${permintaan.bbm_akhir_persen}%` : '-'}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* BBM Diminta */}
                        <div>
                            <Label className="mb-2 block">BBM Diminta</Label>
                            <div className="rounded-md border p-3 text-sm space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Jumlah</span>
                                    <span className="font-medium">{permintaan.bbm_liter} Ltr</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Harga/Liter</span>
                                    <span className="font-medium">{formatCurrency(permintaan.bbm_harga_per_liter)}</span>
                                </div>
                                <div className="flex justify-between border-t pt-1">
                                    <span className="font-medium">Total</span>
                                    <span className="font-bold text-primary">{formatCurrency(permintaan.bbm_total_harga)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Lampiran Foto */}
                        {fotoUrls.length > 0 && (
                            <div>
                                <Label className="mb-2 flex items-center gap-1.5">
                                    <ImageIcon className="h-4 w-4" />
                                    Lampiran Foto ({fotoUrls.length})
                                </Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {fotoUrls.map((url, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => setLightboxIndex(index)}
                                            className="relative group rounded-lg overflow-hidden border bg-muted aspect-square cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                                        >
                                            <img
                                                src={url}
                                                alt={`Lampiran ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium bg-black/50 rounded px-2 py-1">
                                                    Lihat
                                                </span>
                                            </div>
                                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1.5 py-0.5 text-center">
                                                Foto {index + 1}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Catatan & Status Info */}
                        {permintaan.status !== 'pending' && (
                            <div className="space-y-2">
                                {permintaan.waktu_persetujuan && (
                                    <div className="text-sm">
                                        <span className="text-muted-foreground">Waktu Persetujuan: </span>
                                        <span className="font-medium">
                                            {new Date(permintaan.waktu_persetujuan).toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                )}
                                {permintaan.catatan && (
                                    <div>
                                        <Label>Catatan</Label>
                                        <p className="mt-1 text-sm text-muted-foreground">{permintaan.catatan}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button type="button" onClick={() => onOpenChange(false)}>Tutup</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {lightboxIndex !== null && fotoUrls.length > 0 && (
                <PhotoLightbox
                    urls={fotoUrls}
                    initialIndex={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                />
            )}
        </>
    );
}
