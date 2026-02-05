import DeleteConfirmationDialog from '@/components/delete-confirmation-dialog';
import Pagination from '@/components/pagination';
import SearchInput from '@/components/search-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import AppLayout from '@/layouts/app-layout';
import { type Bidang } from '@/types/logbook';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Head, router } from '@inertiajs/react';
import { Edit, Plus, Trash2, ToggleLeft, ToggleRight, Layers } from 'lucide-react';
import { useState } from 'react';
import TableInfo from '@/components/table-info';
import BidangDialog from './form-dialog';
import kategori from '@/routes/kategori';

interface Props {
    bidang: {
        data: Bidang[];
        links: any[];
        from: number;
        to: number;
        total: number;
        per_page: number;
    };
}

export default function BidangIndex({ bidang }: Props) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingBidang, setEditingBidang] = useState<Bidang | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleEdit = (item: Bidang) => {
        setEditingBidang(item);
        setIsDialogOpen(true);
    };

    const handleDelete = (id: number) => {
        setDeletingId(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (deletingId) {
            setIsDeleting(true);
            router.delete(`/admin/bidang/${deletingId}`, {
                onFinish: () => {
                    setIsDeleting(false);
                    setDeleteDialogOpen(false);
                    setDeletingId(null);
                },
            });
        }
    };

    const handleCreate = () => {
        setEditingBidang(null);
        setIsDialogOpen(true);
    };

    const handleToggle = (id: number) => {
        router.patch(`/admin/bidang/${id}/toggle`, {}, {
            preserveScroll: true,
        });
    };

    const handlePerPageChange = (value: string) => {
        router.get('/admin/bidang', { per_page: value }, {
            preserveState: true,
            replace: true,
            only: ['bidang'],
        });
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/admin' },
            { title: 'Master Bidang', href: '/admin/bidang' },
        ]}>
            <Head title="Master Bidang" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold">Master Bidang</h2>
                        <p className="text-sm text-muted-foreground">Kelola bidang kategori tugas</p>
                    </div>
                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Bidang
                    </Button>
                </div>

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-2">
                        <Select
                            defaultValue={bidang.per_page?.toString() || "10"}
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

                    <div className="w-full md:max-w-sm">
                        <SearchInput routeName="bidang.index" />
                    </div>
                </div>

                <div className="rounded-md border overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama</TableHead>
                                <TableHead>Deskripsi</TableHead>
                                <TableHead className="text-center">Jml Kategori</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bidang.data.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.nama}</TableCell>
                                    <TableCell className="max-w-[300px] truncate">{item.deskripsi || '-'}</TableCell>
                                    <TableCell className="text-center">{item.kategori_count || 0}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={item.aktif ? 'default' : 'secondary'}>
                                            {item.aktif ? 'Aktif' : 'Nonaktif'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleToggle(item.id)}
                                                    >
                                                        {item.aktif ? (
                                                            <ToggleRight className="h-4 w-4 text-green-600" />
                                                        ) : (
                                                            <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                                                        )}
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{item.aktif ? 'Nonaktifkan' : 'Aktifkan'}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>


                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        asChild
                                                    >
                                                        <a href={`/admin/bidang/${item.id}/kategori`}>
                                                            <Layers className="h-4 w-4" />
                                                        </a>
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Lihat Kategori</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>

                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Edit Bidang</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>

                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive"
                                                        onClick={() => handleDelete(item.id)}
                                                        disabled={(item.kategori_count || 0) > 0}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Hapus Bidang</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {bidang.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        Tidak ada data yang ditemukan.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <TableInfo from={bidang.from} to={bidang.to} total={bidang.total} />
                    <Pagination links={bidang.links} />
                </div>

                <BidangDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    bidang={editingBidang}
                />

                <DeleteConfirmationDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    onConfirm={confirmDelete}
                    title="Hapus Bidang"
                    description="Apakah anda yakin ingin menghapus bidang ini? Tindakan ini tidak dapat dibatalkan."
                    isDeleting={isDeleting}
                />
            </div>
        </AppLayout>
    );
}
