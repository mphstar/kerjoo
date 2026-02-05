import DeleteConfirmationDialog from '@/components/delete-confirmation-dialog';
import MobileLayout from '@/layouts/mobile-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { type PermintaanPeralatan } from '@/types/logbook';
import { Head, router, usePage } from '@inertiajs/react';
import { CheckCircle, Clock, Package, Plus, Trash2, XCircle } from 'lucide-react';
import { useState } from 'react';
import PeralatanFormDialog from './form-dialog';

interface Props {
    permintaan: {
        data: PermintaanPeralatan[];
    };
}

export default function PeralatanIndex({ permintaan }: Props) {
    const { url } = usePage();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = (id: number) => {
        setDeletingId(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (deletingId) {
            setIsDeleting(true);
            router.delete(`/pelaksana/peralatan/${deletingId}`, {
                onFinish: () => {
                    setIsDeleting(false);
                    setDeleteDialogOpen(false);
                    setDeletingId(null);
                },
            });
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <Clock className="h-5 w-5 text-orange-500" />;
            case 'disetujui':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'ditolak':
                return <XCircle className="h-5 w-5 text-red-500" />;
            default:
                return <Package className="h-5 w-5 text-muted-foreground" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="secondary">Menunggu</Badge>;
            case 'disetujui':
                return <Badge className="bg-green-600 hover:bg-green-700 text-white">Disetujui</Badge>;
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
        <MobileLayout>
            <Head title="Permintaan Peralatan" />

            <div className="min-h-screen bg-muted/20 dark:bg-slate-950 pb-20 transition-colors duration-300">
                {/* Header */}
                <div className="bg-gradient-to-br from-primary via-primary to-primary/80 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-6 pb-8 pt-8 text-primary-foreground dark:text-white transition-all duration-300">
                    <h1 className="text-2xl font-bold">Permintaan Peralatan</h1>
                    <p className="opacity-90">Kelola permintaan peralatan kerja</p>
                </div>

                {/* Content */}
                <div className="mt-6 px-4 space-y-3">
                    {/* Add Button */}
                    <Button onClick={() => setIsFormOpen(true)} className="w-full" size="lg">
                        <Plus className="mr-2 h-5 w-5" />
                        Buat Permintaan Baru
                    </Button>

                    {/* Request Cards */}
                    {permintaan.data.length === 0 ? (
                        <Card className="border-dashed shadow-none">
                            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <Package className="h-12 w-12 mb-3 opacity-20" />
                                <p className="text-sm">Belum ada permintaan peralatan.</p>
                                <p className="text-xs mt-1">Buat permintaan baru untuk memulai.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        permintaan.data.map((item) => (
                            <Card key={item.id} className="shadow-sm">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-start gap-3">
                                            {getStatusIcon(item.status)}
                                            <div>
                                                <h3 className="font-semibold">
                                                    {formatBulanTahun(item.bulan, item.tahun)}
                                                </h3>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {new Date(item.waktu_pengajuan).toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        {getStatusBadge(item.status)}
                                    </div>

                                    {/* Items Summary */}
                                    <div className="bg-muted/50 rounded-md p-3 mb-3">
                                        <div className="text-xs text-muted-foreground mb-1">
                                            Daftar Peralatan ({item.details?.length || 0} item)
                                        </div>
                                        <div className="space-y-1">
                                            {item.details?.slice(0, 3).map((detail) => (
                                                <div key={detail.id} className="text-sm flex justify-between">
                                                    <span>{detail.nama_peralatan}</span>
                                                    <span className="text-muted-foreground">
                                                        {detail.jumlah} {detail.satuan}
                                                    </span>
                                                </div>
                                            ))}
                                            {(item.details?.length || 0) > 3 && (
                                                <div className="text-xs text-muted-foreground">
                                                    +{(item.details?.length || 0) - 3} item lainnya
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Catatan */}
                                    {item.catatan && (
                                        <div className="mb-3">
                                            <div className="text-xs text-muted-foreground mb-1">Catatan</div>
                                            <p className="text-sm">{item.catatan}</p>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    {item.status === 'pending' && (
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="w-full"
                                            onClick={() => handleDelete(item.id)}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Hapus Permintaan
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            <PeralatanFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} />

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={confirmDelete}
                title="Hapus Permintaan"
                description="Apakah anda yakin ingin menghapus permintaan peralatan ini? Tindakan ini tidak dapat dibatalkan."
                isDeleting={isDeleting}
            />
        </MobileLayout>
    );
}
