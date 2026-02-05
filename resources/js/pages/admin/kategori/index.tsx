import DeleteConfirmationDialog from '@/components/delete-confirmation-dialog';
import Pagination from '@/components/pagination';
import SearchInput from '@/components/search-input';
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
import { type Kategori, type Bidang } from '@/types/logbook';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Head, router } from '@inertiajs/react';
import { Edit, Plus, Trash2, ClipboardList } from 'lucide-react';
import { useState } from 'react';
import TableInfo from '@/components/table-info';
import KategoriDialog from './form-dialog';

interface Props {
    kategori: {
        data: Kategori[];
        links: any[];
        from: number;
        to: number;
        total: number;
        per_page: number;
    };
    bidangList: Bidang[];
    currentBidang?: Bidang;
}

export default function KategoriIndex({ kategori, bidangList, currentBidang }: Props) {
    const filterBidangId = currentBidang?.id?.toString() || '';
    const filterBidang = currentBidang;
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingKategori, setEditingKategori] = useState<Kategori | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleEdit = (item: Kategori) => {
        setEditingKategori(item);
        setIsDialogOpen(true);
    };

    const handleDelete = (id: number) => {
        setDeletingId(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (deletingId) {
            setIsDeleting(true);
            router.delete(`/admin/kategori/${deletingId}`, {
                onFinish: () => {
                    setIsDeleting(false);
                    setDeleteDialogOpen(false);
                    setDeletingId(null);
                },
            });
        }
    };

    const handleCreate = () => {
        setEditingKategori(null);
        setIsDialogOpen(true);
    };

    // Build the current page URL for preserving route context
    const currentUrl = currentBidang
        ? `/admin/bidang/${currentBidang.id}/kategori`
        : '/admin/kategori';

    const handlePerPageChange = (value: string) => {
        router.get(currentUrl, { per_page: value }, {
            preserveState: true,
            replace: true,
            only: ['kategori'],
        });
    };

    // Build breadcrumbs - currentBidang is always present since accessed via /admin/bidang/{id}/kategori
    const breadcrumbs = [
        { title: 'Dashboard', href: '/admin' },
        { title: 'Master Bidang', href: '/admin/bidang' },
    ];
    if (currentBidang) {
        breadcrumbs.push({ title: `Kategori: ${currentBidang.nama}`, href: currentUrl });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Master Kategori" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold">Master Kategori</h2>
                        <p className="text-sm text-muted-foreground">Kelola kategori tugas</p>
                    </div>
                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Kategori
                    </Button>
                </div>

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-2">
                        <Select
                            defaultValue={kategori.per_page?.toString() || "10"}
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
                        <SearchInput baseUrl={currentUrl} />
                    </div>
                </div>

                <div className="rounded-md border overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama</TableHead>
                                <TableHead>Bidang</TableHead>
                                <TableHead>Deskripsi</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {kategori.data.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.nama}</TableCell>
                                    <TableCell>{item.bidang?.nama || '-'}</TableCell>
                                    <TableCell className="max-w-[300px] truncate">{item.deskripsi || '-'}</TableCell>


                                    <TableCell className="text-right whitespace-nowrap">
                                        <div className="flex justify-end gap-1">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            asChild
                                                        >
                                                            <a href={`/admin/kategori/${item.id}/tugas`}>
                                                                <ClipboardList className="h-4 w-4" />
                                                            </a>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Lihat Master Tugas</p>
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
                                                        <p>Edit Kategori</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>

                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(item.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Hapus Kategori</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {kategori.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        Tidak ada data yang ditemukan.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <TableInfo from={kategori.from} to={kategori.to} total={kategori.total} />
                    <Pagination links={kategori.links} />
                </div>

                <KategoriDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    kategori={editingKategori}
                    bidangList={bidangList}
                    defaultBidangId={!editingKategori ? filterBidangId : undefined}
                />

                <DeleteConfirmationDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    onConfirm={confirmDelete}
                    title="Hapus Kategori"
                    description="Apakah anda yakin ingin menghapus kategori ini? Tindakan ini tidak dapat dibatalkan."
                    isDeleting={isDeleting}
                />
            </div>
        </AppLayout>
    );
}
