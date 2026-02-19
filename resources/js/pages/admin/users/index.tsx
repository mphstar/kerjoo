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
import { type Kategori, type User } from '@/types/logbook';
import { Head, Link, router } from '@inertiajs/react';
import { Camera, Edit, Plus, Trash2, UserIcon } from 'lucide-react';
import { useState } from 'react';
import UserFormDialog from './form-dialog';

interface Props {
    users: {
        data: User[];
        links: any[];
        from: number | null;
        to: number | null;
        total: number;
        per_page?: number;
    };
    kategori: Kategori[];
}

export default function UsersIndex({ users, kategori }: Props) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [roleFilter, setRoleFilter] = useState<string>('all');

    const handleEdit = (item: User) => {
        setEditingUser(item);
        setIsDialogOpen(true);
    };

    const handleDelete = (id: number) => {
        setDeletingId(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (deletingId) {
            setIsDeleting(true);
            router.delete(`/admin/users/${deletingId}`, {
                onFinish: () => {
                    setIsDeleting(false);
                    setDeleteDialogOpen(false);
                    setDeletingId(null);
                },
            });
        }
    };

    const handleCreate = () => {
        setEditingUser(null);
        setIsDialogOpen(true);
    };

    const handlePerPageChange = (value: string) => {
        router.get('/admin/users', { per_page: value }, {
            preserveState: true,
            replace: true,
            only: ['users'],
        });
    };

    // Client-side role filtering
    const filteredData = roleFilter === 'all'
        ? users.data
        : users.data.filter(u => u.peran === roleFilter);

    const getRoleBadge = (peran: string) => {
        if (peran === 'admin') {
            return <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">Admin</Badge>;
        }
        if (peran === 'pimpinan') {
            return <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300">Pimpinan</Badge>;
        }
        return <Badge variant="secondary">Pelaksana</Badge>;
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/admin' },
            { title: 'Manajemen Pengguna', href: '/admin/users' },
        ]}>
            <Head title="Manajemen Pengguna" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold">Manajemen Pengguna</h2>
                        <p className="text-sm text-muted-foreground">Kelola pengguna sistem</p>
                    </div>
                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Pengguna
                    </Button>
                </div>

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-2">
                        <Select
                            defaultValue={users.per_page?.toString() || "10"}
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
                            <SearchInput routeName="users.index" />
                        </div>
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-full md:w-[140px]">
                                <SelectValue placeholder="Peran" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Peran</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="pelaksana">Pelaksana</SelectItem>
                                <SelectItem value="pimpinan">Pimpinan</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="rounded-md border overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 font-medium">
                            <tr>
                                <th className="p-4">Nama</th>
                                <th className="p-4 hidden md:table-cell">Email</th>
                                <th className="p-4">Peran</th>
                                <th className="p-4 hidden lg:table-cell">Kategori</th>
                                <th className="p-4 hidden lg:table-cell">No. Telepon</th>
                                <th className="p-4 hidden lg:table-cell">Tempat</th>
                                <th className="p-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((item) => (
                                <tr key={item.id} className="border-t hover:bg-muted/50">
                                    <td className="p-4 font-medium">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                                <UserIcon className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <div className="font-medium">{item.name}</div>
                                                <div className="text-xs text-muted-foreground md:hidden">{item.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-muted-foreground hidden md:table-cell">{item.email}</td>
                                    <td className="p-4">{getRoleBadge(item.peran)}</td>
                                    <td className="p-4 hidden lg:table-cell">
                                        {item.kategori ? (
                                            <Badge variant="outline">{item.kategori.nama}</Badge>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">-</span>
                                        )}
                                    </td>
                                    <td className="p-4 hidden lg:table-cell">
                                        {item.nomor_telepon || (
                                            <span className="text-sm text-muted-foreground">-</span>
                                        )}
                                    </td>
                                    <td className="p-4 hidden lg:table-cell">
                                        {item.peran === 'pelaksana' && item.tempat ? (
                                            <span className="text-sm">{item.tempat}</span>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">-</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {item.peran === 'pelaksana' && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="icon" asChild>
                                                                <Link href={`/admin/users/${item.id}/absensi`}>
                                                                    <Camera className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Lihat Absensi</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Edit Pengguna</p>
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
                                                        <p>Hapus Pengguna</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredData.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                        Tidak ada pengguna {roleFilter !== 'all' ? `dengan peran "${roleFilter}"` : ''} ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <TableInfo from={users.from} to={users.to} total={users.total} />
                    <Pagination links={users.links} />
                </div>

                <UserFormDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    user={editingUser}
                    kategoriList={kategori}
                />

                <DeleteConfirmationDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    onConfirm={confirmDelete}
                    title="Hapus Pengguna"
                    description="Apakah anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan."
                    isDeleting={isDeleting}
                />
            </div>
        </AppLayout>
    );
}
