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
import { type UraianTugas, type Kategori } from '@/types/logbook';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Head, router } from '@inertiajs/react';
import { Edit, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useState } from 'react';
import TableInfo from '@/components/table-info';
import UraianTugasDialog from './form-dialog';

interface Props {
    uraianTugas: {
        data: UraianTugas[];
        links: any[];
        from: number;
        to: number;
        total: number;
        per_page: number;
    };
    kategoriList: Kategori[];
    currentKategori?: Kategori;
}

export default function UraianTugasIndex({ uraianTugas, kategoriList, currentKategori }: Props) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<UraianTugas | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleEdit = (item: UraianTugas) => {
        setEditingItem(item);
        setIsDialogOpen(true);
    };

    const handleDelete = (id: number) => {
        setDeletingId(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (deletingId) {
            setIsDeleting(true);
            router.delete(`/admin/uraian-tugas/${deletingId}`, {
                onFinish: () => {
                    setIsDeleting(false);
                    setDeleteDialogOpen(false);
                    setDeletingId(null);
                },
            });
        }
    };

    const handleCreate = () => {
        setEditingItem(null);
        setIsDialogOpen(true);
    };

    const handleToggle = (id: number) => {
        router.patch(`/admin/uraian-tugas/${id}/toggle`, {}, {
            preserveScroll: true,
        });
    };

    // Build the current page URL for preserving route context
    const currentUrl = currentKategori
        ? `/admin/kategori/${currentKategori.id}/uraian-tugas`
        : '/admin/uraian-tugas';

    const handlePerPageChange = (value: string) => {
        router.get(currentUrl, { per_page: value }, {
            preserveState: true,
            replace: true,
            only: ['uraianTugas'],
        });
    };

    // Build breadcrumbs - show full hierarchy when currentKategori is present
    const breadcrumbs = [
        { title: 'Dashboard', href: '/admin' },
        { title: 'Master Bidang', href: '/admin/bidang' },
    ];
    if (currentKategori) {
        const bidangId = currentKategori.bidang_id;
        breadcrumbs.push({
            title: `Kategori: ${currentKategori.bidang?.nama || 'Bidang'}`,
            href: `/admin/bidang/${bidangId}/kategori`
        });
        breadcrumbs.push({ title: `Uraian Tugas: ${currentKategori.nama}`, href: currentUrl });
    } else {
        breadcrumbs.push({ title: 'Master Uraian Tugas', href: '/admin/uraian-tugas' });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Master Uraian Tugas" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold">Master Uraian Tugas</h2>
                        <p className="text-sm text-muted-foreground">Kelola uraian tugas pokok per kategori</p>
                    </div>
                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Uraian Tugas
                    </Button>
                </div>

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-2">
                        <Select
                            defaultValue={uraianTugas.per_page?.toString() || "10"}
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
                        <SearchInput routeName="uraian-tugas.index" />
                    </div>
                </div>

                <div className="rounded-md border overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama</TableHead>
                                <TableHead>Kategori</TableHead>
                                <TableHead>Deskripsi</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {uraianTugas.data.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.nama}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>{item.kategori?.nama || '-'}</span>
                                            {item.kategori?.bidang && (
                                                <span className="text-xs text-muted-foreground">
                                                    {item.kategori.bidang.nama}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[250px] truncate">{item.deskripsi || '-'}</TableCell>
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
                                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Edit Uraian Tugas</p>
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
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Hapus Uraian Tugas</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {uraianTugas.data.length === 0 && (
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
                    <TableInfo from={uraianTugas.from} to={uraianTugas.to} total={uraianTugas.total} />
                    <Pagination links={uraianTugas.links} />
                </div>

                <UraianTugasDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    uraianTugas={editingItem}
                    kategoriList={kategoriList}
                    defaultKategoriId={!editingItem ? currentKategori?.id?.toString() : undefined}
                />

                <DeleteConfirmationDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    onConfirm={confirmDelete}
                    title="Hapus Uraian Tugas"
                    description="Apakah anda yakin ingin menghapus uraian tugas ini? Tindakan ini tidak dapat dibatalkan."
                    isDeleting={isDeleting}
                />
            </div>
        </AppLayout>
    );
}
