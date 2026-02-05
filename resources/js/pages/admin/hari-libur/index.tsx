import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { HariLibur } from '@/types/logbook';
import { Head, router, useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar, Edit, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Hari Libur', href: '/admin/hari-libur' },
];

interface Props {
    hariLibur: {
        data: HariLibur[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export default function HariLiburIndex({ hariLibur }: Props) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editItem, setEditItem] = useState<HariLibur | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        tanggal: '',
        nama: '',
        deskripsi: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editItem) {
            put(`/admin/hari-libur/${editItem.id}`, {
                onSuccess: () => {
                    setDialogOpen(false);
                    setEditItem(null);
                    reset();
                },
            });
        } else {
            post('/admin/hari-libur', {
                onSuccess: () => {
                    setDialogOpen(false);
                    reset();
                },
            });
        }
    };

    const handleEdit = (item: HariLibur) => {
        setEditItem(item);
        setData({
            tanggal: item.tanggal.split('T')[0],
            nama: item.nama,
            deskripsi: item.deskripsi || '',
        });
        setDialogOpen(true);
    };

    const handleDelete = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus hari libur ini?')) {
            router.delete(`/admin/hari-libur/${id}`);
        }
    };

    const openNewDialog = () => {
        setEditItem(null);
        reset();
        setDialogOpen(true);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Hari Libur" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Manajemen Hari Libur</h1>
                        <p className="text-muted-foreground">
                            Kelola hari libur untuk fitur penugasan harian
                        </p>
                    </div>
                    <Button onClick={openNewDialog}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Hari Libur
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Daftar Hari Libur
                        </CardTitle>
                        <CardDescription>
                            Total {hariLibur.total} hari libur terdaftar
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="p-4 text-left font-medium">Tanggal</th>
                                        <th className="p-4 text-left font-medium">Nama</th>
                                        <th className="p-4 text-left font-medium hidden md:table-cell">Deskripsi</th>
                                        <th className="p-4 text-right font-medium">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {hariLibur.data.map((item) => (
                                        <tr key={item.id} className="border-b hover:bg-muted/50">
                                            <td className="p-4">
                                                <span className="font-medium">
                                                    {format(new Date(item.tanggal), 'EEEE, d MMMM yyyy', { locale: id })}
                                                </span>
                                            </td>
                                            <td className="p-4">{item.nama}</td>
                                            <td className="p-4 hidden md:table-cell text-muted-foreground">
                                                {item.deskripsi || '-'}
                                            </td>
                                            <td className="p-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(item)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(item.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {hariLibur.data.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-muted-foreground">
                                                Belum ada hari libur yang terdaftar
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editItem ? 'Edit Hari Libur' : 'Tambah Hari Libur'}
                        </DialogTitle>
                        <DialogDescription>
                            {editItem
                                ? 'Ubah data hari libur yang sudah ada'
                                : 'Tambahkan hari libur baru ke sistem'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="tanggal">Tanggal</Label>
                                <Input
                                    id="tanggal"
                                    type="date"
                                    value={data.tanggal}
                                    onChange={(e) => setData('tanggal', e.target.value)}
                                    required
                                />
                                {errors.tanggal && (
                                    <span className="text-sm text-destructive">{errors.tanggal}</span>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="nama">Nama Hari Libur</Label>
                                <Input
                                    id="nama"
                                    value={data.nama}
                                    onChange={(e) => setData('nama', e.target.value)}
                                    placeholder="Contoh: Hari Raya Idul Fitri"
                                    required
                                />
                                {errors.nama && (
                                    <span className="text-sm text-destructive">{errors.nama}</span>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="deskripsi">Deskripsi (Opsional)</Label>
                                <Textarea
                                    id="deskripsi"
                                    value={data.deskripsi}
                                    onChange={(e) => setData('deskripsi', e.target.value)}
                                    placeholder="Deskripsi tambahan..."
                                    rows={3}
                                />
                                {errors.deskripsi && (
                                    <span className="text-sm text-destructive">{errors.deskripsi}</span>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {editItem ? 'Simpan Perubahan' : 'Tambah'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
