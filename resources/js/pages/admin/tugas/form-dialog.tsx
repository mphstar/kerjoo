import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { type Kategori, type Tugas } from '@/types/logbook';
import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tugas: Tugas | null;
    kategoriList: Kategori[];
    defaultKategoriId?: string;
}

export default function TugasFormDialog({ open, onOpenChange, tugas, kategoriList, defaultKategoriId }: Props) {
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        kategori_id: '',
        nama: '',
        deskripsi: '',
        persyaratan: {
            foto: true,
            file: false,
            teks: true,
        },
        aktif: true,
    });

    useEffect(() => {
        if (tugas) {
            setData({
                kategori_id: tugas.kategori_id.toString(),
                nama: tugas.nama,
                deskripsi: tugas.deskripsi || '',
                persyaratan: tugas.persyaratan,
                aktif: tugas.aktif,
            });
        } else {
            reset();
            // Auto-select kategori if defaultKategoriId is provided
            if (defaultKategoriId) {
                setData('kategori_id', defaultKategoriId);
            }
        }
        clearErrors();
    }, [tugas, open, defaultKategoriId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (tugas) {
            put(`/admin/tugas/${tugas.id}`, {
                onSuccess: () => onOpenChange(false),
            });
        } else {
            post('/admin/tugas', {
                onSuccess: () => onOpenChange(false),
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{tugas ? 'Edit Tugas' : 'Tambah Tugas'}</DialogTitle>
                        <DialogDescription>
                            {tugas ? 'Ubah data tugas master.' : 'Buat master tugas baru.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {/* Kategori */}
                        <div className="grid gap-2">
                            <Label htmlFor="kategori">Kategori</Label>
                            <Select
                                value={data.kategori_id}
                                onValueChange={(value) => setData('kategori_id', value)}
                                disabled={!!defaultKategoriId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Kategori" />
                                </SelectTrigger>
                                <SelectContent>
                                    {kategoriList.map((k) => (
                                        <SelectItem key={k.id} value={k.id.toString()}>
                                            {k.nama}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.kategori_id && <span className="text-sm text-destructive">{errors.kategori_id}</span>}
                        </div>

                        {/* Nama */}
                        <div className="grid gap-2">
                            <Label htmlFor="nama">Nama Tugas</Label>
                            <Input
                                id="nama"
                                value={data.nama}
                                onChange={(e) => setData('nama', e.target.value)}
                                placeholder="Contoh: Membersihkan Lobby"
                                required
                            />
                            {errors.nama && <span className="text-sm text-destructive">{errors.nama}</span>}
                        </div>

                        {/* Deskripsi */}
                        <div className="grid gap-2">
                            <Label htmlFor="deskripsi">Deskripsi</Label>
                            <Input
                                id="deskripsi"
                                value={data.deskripsi}
                                onChange={(e) => setData('deskripsi', e.target.value)}
                                placeholder="Deskripsi tugas..."
                            />
                        </div>

                        {/* Persyaratan */}
                        <div className="grid gap-2">
                            <Label>Persyaratan Laporan</Label>
                            <div className="flex flex-col gap-2 rounded-md border p-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="req-foto"
                                        checked={data.persyaratan.foto}
                                        onCheckedChange={(checked) =>
                                            setData('persyaratan', { ...data.persyaratan, foto: checked as boolean })
                                        }
                                    />
                                    <Label htmlFor="req-foto" className="font-normal cursor-pointer">
                                        Wajib Lampirkan Foto (Sebelum/Sesudah)
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="req-file"
                                        checked={data.persyaratan.file}
                                        onCheckedChange={(checked) =>
                                            setData('persyaratan', { ...data.persyaratan, file: checked as boolean })
                                        }
                                    />
                                    <Label htmlFor="req-file" className="font-normal cursor-pointer">
                                        Wajib Lampirkan File Dokumen
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="req-teks"
                                        checked={data.persyaratan.teks}
                                        onCheckedChange={(checked) =>
                                            setData('persyaratan', { ...data.persyaratan, teks: checked as boolean })
                                        }
                                    />
                                    <Label htmlFor="req-teks" className="font-normal cursor-pointer">
                                        Wajib Isi Ringkasan Teks
                                    </Label>
                                </div>
                            </div>
                        </div>

                        {/* Aktif Status */}
                        <div className="flex items-center space-x-2 mt-2">
                            <Checkbox
                                id="aktif"
                                checked={data.aktif}
                                onCheckedChange={(checked) => setData('aktif', checked as boolean)}
                            />
                            <Label htmlFor="aktif" className="cursor-pointer">Status Tugas Aktif</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {tugas ? 'Simpan Perubahan' : 'Buat Tugas'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
