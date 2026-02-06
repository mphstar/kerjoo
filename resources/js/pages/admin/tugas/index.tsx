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
} from "@/components/ui/tooltip";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type Kategori, type Tugas } from '@/types/logbook';
import { Head, router } from '@inertiajs/react';
import { Edit, FileText, Image as ImageIcon, Plus, Trash2, Type } from 'lucide-react';
import { useState } from 'react';
import TugasFormDialog from './form-dialog';

interface Props {
    tugas: {
        data: Tugas[];
        links: any[];
        from: number | null;
        to: number | null;
        total: number;
        per_page: number;
    };
    kategoriList: Kategori[];
    currentKategori?: Kategori;
}

export default function TugasIndex({ tugas, kategoriList, currentKategori }: Props) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTugas, setEditingTugas] = useState<Tugas | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleEdit = (item: Tugas) => {
        setEditingTugas(item);
        setIsDialogOpen(true);
    };

    const handleDelete = (id: number) => {
        setDeletingId(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (deletingId) {
            setIsDeleting(true);
            router.delete(`/admin/tugas/${deletingId}`, {
                onFinish: () => {
                    setIsDeleting(false);
                    setDeleteDialogOpen(false);
                    setDeletingId(null);
                },
            });
        }
    };

    const handleCreate = () => {
        setEditingTugas(null);
        setIsDialogOpen(true);
    };

    // Build the current page URL for preserving route context
    const currentUrl = currentKategori
        ? `/admin/kategori/${currentKategori.id}/tugas`
        : '/admin/tugas';

    const handlePerPageChange = (value: string) => {
        router.get(currentUrl, { per_page: value }, {
            preserveState: true,
            replace: true,
            only: ['tugas'],
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
        breadcrumbs.push({ title: `Tugas: ${currentKategori.nama}`, href: currentUrl });
    } else {
        breadcrumbs.push({ title: 'Master Tugas', href: '/admin/tugas' });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Master Tugas" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold">Master Tugas</h2>
                        <p className="text-sm text-muted-foreground">Kelola daftar tugas pekerjaan.</p>
                    </div>
                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Buat Tugas Baru
                    </Button>
                </div>

                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Select
                            defaultValue={tugas.per_page?.toString() || "10"}
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

                    <div className="flex items-center gap-4 w-full justify-end">
                        <div className="w-full max-w-xs">
                            <SearchInput routeName="tugas.index" />
                        </div>

                    </div>
                </div>

                <div className="rounded-md border overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 font-medium">
                            <tr>
                                <th className="p-4">Nama Tugas</th>
                                <th className="p-4">Kategori</th>
                                <th className="p-4">Tipe</th>
                                <th className="p-4">Persyaratan</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tugas.data.map((item) => (
                                <tr key={item.id} className="border-t hover:bg-muted/50">
                                    <td className="p-4 font-medium">
                                        <div>{item.nama}</div>
                                        <div className="text-xs text-muted-foreground mt-1 truncate max-w-[300px]">
                                            {item.deskripsi}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <Badge variant="outline">{item.kategori?.nama}</Badge>
                                    </td>
                                    <td className="p-4">
                                        <Badge variant="secondary" className="capitalize">
                                            {item.tipe || 'harian'}
                                        </Badge>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-2 flex-wrap">
                                            {item.persyaratan?.foto && (
                                                <Badge variant="secondary" className="gap-1">
                                                    <ImageIcon className="h-3 w-3" /> Foto
                                                </Badge>
                                            )}
                                            {item.persyaratan?.file && (
                                                <Badge variant="secondary" className="gap-1">
                                                    <FileText className="h-3 w-3" /> File
                                                </Badge>
                                            )}
                                            {item.persyaratan?.teks && (
                                                <Badge variant="secondary" className="gap-1">
                                                    <Type className="h-3 w-3" /> Teks
                                                </Badge>
                                            )}
                                            {!item.persyaratan?.foto && !item.persyaratan?.file && !item.persyaratan?.teks && (
                                                <span className="text-muted-foreground text-xs">Tidak ada</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <Badge variant={item.aktif ? 'default' : 'secondary'}>
                                            {item.aktif ? 'Aktif' : 'Non-Aktif'}
                                        </Badge>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-1">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Edit Tugas</p>
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
                                                        <p>Hapus Tugas</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {tugas.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                        Tidak ada tugas ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex items-center justify-between">
                    <TableInfo from={tugas.from} to={tugas.to} total={tugas.total} />
                    <Pagination links={tugas.links} />
                </div>

                <TugasFormDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    tugas={editingTugas}
                    kategoriList={kategoriList}
                    defaultKategoriId={!editingTugas ? currentKategori?.id?.toString() : undefined}
                />

                <DeleteConfirmationDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    onConfirm={confirmDelete}
                    title="Hapus Tugas"
                    description="Apakah anda yakin ingin menghapus tugas ini? Tindakan ini tidak dapat dibatalkan."
                    isDeleting={isDeleting}
                />
            </div>
        </AppLayout >
    );
}
