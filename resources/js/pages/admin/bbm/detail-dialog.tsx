import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { type PermintaanBbm } from '@/types/logbook';
import { router } from '@inertiajs/react';
import { CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    permintaan: PermintaanBbm | null;
}

export default function BbmDetailDialog({ open, onOpenChange, permintaan }: Props) {
    const [catatan, setCatatan] = useState('');
    const [processing, setProcessing] = useState(false);

    if (!permintaan) return null;

    const handleApprove = () => {
        setProcessing(true);
        router.post(
            `/permintaan-bbm/${permintaan.id}/approve`,
            { catatan },
            {
                onFinish: () => {
                    setProcessing(false);
                    onOpenChange(false);
                    setCatatan('');
                },
            }
        );
    };

    const handleReject = () => {
        setProcessing(true);
        router.post(
            `/permintaan-bbm/${permintaan.id}/reject`,
            { catatan },
            {
                onFinish: () => {
                    setProcessing(false);
                    onOpenChange(false);
                    setCatatan('');
                },
            }
        );
    };

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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Detail Permintaan BBM</DialogTitle>
                    <DialogDescription>
                        Permintaan dari {permintaan.pengemudi} — {permintaan.uraian}
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

                    {/* Catatan/Approval */}
                    {permintaan.status === 'pending' ? (
                        <div>
                            <Label htmlFor="catatan">Catatan (Opsional)</Label>
                            <Textarea
                                id="catatan"
                                value={catatan}
                                onChange={(e) => setCatatan(e.target.value)}
                                placeholder="Tambahkan catatan untuk permintaan ini..."
                                rows={3}
                            />
                        </div>
                    ) : (
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

                <DialogFooter>
                    {permintaan.status === 'pending' ? (
                        <>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
                                Tutup
                            </Button>
                            <Button type="button" variant="destructive" onClick={handleReject} disabled={processing}>
                                <XCircle className="mr-2 h-4 w-4" />
                                Tolak
                            </Button>
                            <Button type="button" className="bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={processing}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Setujui
                            </Button>
                        </>
                    ) : (
                        <Button type="button" onClick={() => onOpenChange(false)}>Tutup</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
