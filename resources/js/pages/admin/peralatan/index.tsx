import DeleteConfirmationDialog from '@/components/delete-confirmation-dialog';
import Pagination from '@/components/pagination';
import SearchInput from '@/components/search-input';
import TableInfo from '@/components/table-info';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type PermintaanPeralatan } from '@/types/logbook';
import { Head, router } from '@inertiajs/react';
import { Eye, Trash2, FileDown } from 'lucide-react';
import { useState } from 'react';
import PeralatanDetailDialog from './detail-dialog';

interface Props {
    permintaan: {
        data: PermintaanPeralatan[];
        links: any[];
        from: number | null;
        to: number | null;
        total: number;
        per_page?: number;
    };
}

export default function PeralatanIndex({ permintaan }: Props) {
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [selectedPermintaan, setSelectedPermintaan] = useState<PermintaanPeralatan | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const handleViewDetail = (item: PermintaanPeralatan) => {
        setSelectedPermintaan(item);
        setDetailDialogOpen(true);
    };

    const handleDelete = (id: number) => {
        setDeletingId(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (deletingId) {
            setIsDeleting(true);
            router.delete(`/permintaan-peralatan/${deletingId}`, {
                onFinish: () => {
                    setIsDeleting(false);
                    setDeleteDialogOpen(false);
                    setDeletingId(null);
                },
            });
        }
    };

    const handlePerPageChange = (value: string) => {
        router.get('/admin/peralatan', { per_page: value }, {
            preserveState: true,
            replace: true,
            only: ['permintaan'],
        });
    };

    // Client-side status filtering
    const filteredData = statusFilter === 'all'
        ? permintaan.data
        : permintaan.data.filter(item => item.status === statusFilter);

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
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/admin' },
            { title: 'Permintaan Peralatan', href: '/admin/peralatan' },
        ]}>
            <Head title="Permintaan Peralatan" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold">Permintaan Peralatan</h2>
                        <p className="text-sm text-muted-foreground">
                            Kelola permintaan peralatan dari pelaksana
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-2">
                        <Select
                            defaultValue={permintaan.per_page?.toString() || "10"}
                            onValueChange={handlePerPageChange}
                        >
                            <SelectTrigger className="w-[70px]">
                                <SelectValue placeholder="10" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-2 md:flex-row md:items-center">
                        <div className="w-full md:w-auto md:max-w-sm">
                            <SearchInput routeName="permintaan-peralatan.index" />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full md:w-[140px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="pending">Menunggu</SelectItem>
                                <SelectItem value="disetujui">Disetujui</SelectItem>
                                <SelectItem value="ditolak">Ditolak</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="rounded-md border overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 font-medium">
                            <tr>
                                <th className="p-4">Tanggal</th>
                                <th className="p-4">Pelaksana</th>
                                <th className="p-4 hidden md:table-cell">Periode</th>
                                <th className="p-4 hidden lg:table-cell">Jumlah Item</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((item) => (
                                <tr key={item.id} className="border-t hover:bg-muted/50">
                                    <td className="p-4">
                                        {new Date(item.waktu_pengajuan).toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                        })}
                                    </td>
                                    <td className="p-4 font-medium">{item.pengguna?.name || '-'}</td>
                                    <td className="p-4 hidden md:table-cell">{formatBulanTahun(item.bulan, item.tahun)}</td>
                                    <td className="p-4 hidden lg:table-cell">
                                        <Badge variant="outline">{item.details?.length || 0} item</Badge>
                                    </td>
                                    <td className="p-4">{getStatusBadge(item.status)}</td>
                                    <td className="p-4 text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleViewDetail(item)}
                                            title="Lihat Detail"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <a href={`/permintaan-peralatan/${item.id}/export-pdf`} target="_blank" rel="noreferrer">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="Export PDF"
                                            >
                                                <FileDown className="h-4 w-4" />
                                            </Button>
                                        </a>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive"
                                            onClick={() => handleDelete(item.id)}
                                            title="Hapus"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {filteredData.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                        Tidak ada permintaan {statusFilter !== 'all' ? `dengan status "${statusFilter}"` : ''} ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <TableInfo from={permintaan.from} to={permintaan.to} total={permintaan.total} />
                    <Pagination links={permintaan.links} />
                </div>

                <PeralatanDetailDialog
                    open={detailDialogOpen}
                    onOpenChange={setDetailDialogOpen}
                    permintaan={selectedPermintaan}
                />

                <DeleteConfirmationDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    onConfirm={confirmDelete}
                    title="Hapus Permintaan"
                    description="Apakah anda yakin ingin menghapus permintaan peralatan ini? Tindakan ini tidak dapat dibatalkan."
                    isDeleting={isDeleting}
                />
            </div>
        </AppLayout>
    );
}
