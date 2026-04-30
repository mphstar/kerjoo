import DeleteConfirmationDialog from '@/components/delete-confirmation-dialog';
import Pagination from '@/components/pagination';
import SearchInput from '@/components/search-input';
import TableInfo from '@/components/table-info';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type PermintaanBbm } from '@/types/logbook';
import { Head, router } from '@inertiajs/react';
import { Eye, Trash2, FileDown } from 'lucide-react';
import { useState } from 'react';
import BbmDetailDialog from './detail-dialog';

interface Props {
    permintaan: {
        data: PermintaanBbm[];
        links: any[];
        from: number | null;
        to: number | null;
        total: number;
        per_page?: number;
    };
}

export default function BbmIndex({ permintaan }: Props) {
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [selectedPermintaan, setSelectedPermintaan] = useState<PermintaanBbm | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const handleViewDetail = (item: PermintaanBbm) => {
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
            router.delete(`/permintaan-bbm/${deletingId}`, {
                onFinish: () => {
                    setIsDeleting(false);
                    setDeleteDialogOpen(false);
                    setDeletingId(null);
                },
            });
        }
    };

    const handlePerPageChange = (value: string) => {
        router.get('/permintaan-bbm', { per_page: value }, {
            preserveState: true,
            replace: true,
            only: ['permintaan'],
        });
    };

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

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/admin' },
            { title: 'Permintaan BBM', href: '/permintaan-bbm' },
        ]}>
            <Head title="Permintaan BBM" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold">Permintaan BBM</h2>
                        <p className="text-sm text-muted-foreground">
                            Kelola permintaan BBM dari pelaksana
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
                            <SearchInput routeName="permintaan-bbm.index" />
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
                                <th className="p-4">Tanggal & Pelaksana</th>
                                <th className="p-4 hidden md:table-cell">Kendaraan</th>
                                <th className="p-4 hidden xl:table-cell">KM & BBM Awal</th>
                                <th className="p-4 hidden lg:table-cell">Permintaan BBM</th>
                                <th className="p-4 hidden xl:table-cell">KM & BBM Akhir</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((item) => (
                                <tr key={item.id} className="border-t hover:bg-muted/50">
                                    <td className="p-4">
                                        <div className="font-medium">
                                            {new Date(item.tanggal).toLocaleDateString('id-ID', {
                                                day: 'numeric', month: 'short', year: 'numeric',
                                            })}
                                        </div>
                                        <div className="text-sm mt-1">{item.pengguna?.name || item.pengemudi}</div>
                                        <div className="text-xs text-muted-foreground">No. {item.no_buku}</div>
                                        <div className="text-xs text-muted-foreground mt-1 max-w-[200px] truncate" title={item.uraian}>
                                            {item.uraian}
                                        </div>
                                    </td>
                                    <td className="p-4 hidden md:table-cell">
                                        <div className="font-medium">{item.nama_kendaraan}</div>
                                        <div className="text-xs text-muted-foreground">{item.merk_kendaraan} • {item.no_polisi}</div>
                                    </td>
                                    <td className="p-4 hidden xl:table-cell">
                                        <div className="font-medium text-primary">{Number(item.km_awal).toLocaleString('id-ID')} (km)</div>
                                        <div className="text-sm text-muted-foreground">{item.bbm_awal_liter} Ltr / {item.bbm_awal_persen}%</div>
                                    </td>
                                    <td className="p-4 hidden lg:table-cell">
                                        <div className="font-medium">{item.bbm_liter} Ltr</div>
                                        <div className="text-xs text-muted-foreground">{formatCurrency(item.bbm_harga_per_liter)} / Ltr</div>
                                        <div className="text-sm font-bold text-primary mt-0.5">{formatCurrency(item.bbm_total_harga)}</div>
                                    </td>
                                    <td className="p-4 hidden xl:table-cell">
                                        <div className="font-medium text-primary">{item.km_akhir ? `${Number(item.km_akhir).toLocaleString('id-ID')} (km)` : '-'}</div>
                                        <div className="text-sm text-muted-foreground">{item.bbm_akhir_liter ? `${item.bbm_akhir_liter} Ltr / ${item.bbm_akhir_persen}%` : '-'}</div>
                                    </td>
                                    <td className="p-4">{getStatusBadge(item.status)}</td>
                                    <td className="p-4 text-right">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="icon" onClick={() => handleViewDetail(item)}>
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent><p>Lihat Detail</p></TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="icon" asChild>
                                                        <a href={`/permintaan-bbm/${item.id}/export-pdf`} target="_blank" rel="noreferrer">
                                                            <FileDown className="h-4 w-4" />
                                                        </a>
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent><p>Export PDF</p></TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(item.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent><p>Hapus</p></TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </td>
                                </tr>
                            ))}
                            {filteredData.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
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

                <BbmDetailDialog
                    open={detailDialogOpen}
                    onOpenChange={setDetailDialogOpen}
                    permintaan={selectedPermintaan}
                />

                <DeleteConfirmationDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    onConfirm={confirmDelete}
                    title="Hapus Permintaan BBM"
                    description="Apakah anda yakin ingin menghapus permintaan BBM ini? Tindakan ini tidak dapat dibatalkan."
                    isDeleting={isDeleting}
                />
            </div>
        </AppLayout>
    );
}
