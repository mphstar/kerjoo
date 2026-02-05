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
import { type PermintaanPeralatan } from '@/types/logbook';
import { router } from '@inertiajs/react';
import { CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    permintaan: PermintaanPeralatan | null;
}

export default function PeralatanDetailDialog({ open, onOpenChange, permintaan }: Props) {
    const [catatan, setCatatan] = useState('');
    const [processing, setProcessing] = useState(false);

    if (!permintaan) return null;

    const handleApprove = () => {
        setProcessing(true);
        router.post(
            `/permintaan-peralatan/${permintaan.id}/approve`,
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
            `/permintaan-peralatan/${permintaan.id}/reject`,
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

    const formatBulanTahun = (bulan: number, tahun: number) => {
        const namaBulan = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        return `${namaBulan[bulan - 1]} ${tahun}`;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Detail Permintaan Peralatan</DialogTitle>
                    <DialogDescription>
                        Permintaan dari {permintaan.pengguna?.name} untuk periode{' '}
                        {formatBulanTahun(permintaan.bulan, permintaan.tahun)}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <div className="text-muted-foreground">Tanggal Pengajuan</div>
                            <div className="font-medium">
                                {new Date(permintaan.waktu_pengajuan).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                })}
                            </div>
                        </div>
                        <div>
                            <div className="text-muted-foreground">Status</div>
                            <div className="mt-1">{getStatusBadge(permintaan.status)}</div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div>
                        <Label className="mb-2 block">Daftar Peralatan</Label>
                        <div className="rounded-md border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="p-2 text-left">No</th>
                                        <th className="p-2 text-left">Nama Peralatan</th>
                                        <th className="p-2 text-center">Jumlah</th>
                                        <th className="p-2 text-left">Satuan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {permintaan.details?.map((item, index) => (
                                        <tr key={item.id} className="border-t">
                                            <td className="p-2">{index + 1}</td>
                                            <td className="p-2 font-medium">{item.nama_peralatan}</td>
                                            <td className="p-2 text-center">{item.jumlah}</td>
                                            <td className="p-2">{item.satuan}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Catatan/Approval Info */}
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
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={processing}
                            >
                                Tutup
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleReject}
                                disabled={processing}
                            >
                                <XCircle className="mr-2 h-4 w-4" />
                                Tolak
                            </Button>
                            <Button
                                type="button"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={handleApprove}
                                disabled={processing}
                            >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Setujui
                            </Button>
                        </>
                    ) : (
                        <Button type="button" onClick={() => onOpenChange(false)}>
                            Tutup
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
