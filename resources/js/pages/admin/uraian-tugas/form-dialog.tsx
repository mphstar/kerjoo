import { Button } from '@/components/ui/button';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { type UraianTugas, type Kategori } from '@/types/logbook';
import { useForm } from '@inertiajs/react';
import { FormEvent, useEffect } from 'react';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    uraianTugas: UraianTugas | null;
    kategoriList: Kategori[];
    defaultKategoriId?: string;
}

export default function UraianTugasDialog({ open, onOpenChange, uraianTugas, kategoriList, defaultKategoriId }: Props) {
    const isEditing = !!uraianTugas;

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        kategori_id: '',
        nama: '',
        deskripsi: '',
        urutan: 0,
    });

    useEffect(() => {
        if (open) {
            if (uraianTugas) {
                setData({
                    kategori_id: uraianTugas.kategori_id.toString(),
                    nama: uraianTugas.nama,
                    deskripsi: uraianTugas.deskripsi || '',
                    urutan: uraianTugas.urutan,
                });
            } else {
                reset();
                // Auto-select kategori if defaultKategoriId is provided
                if (defaultKategoriId) {
                    setData('kategori_id', defaultKategoriId);
                }
            }
            clearErrors();
        }
    }, [open, uraianTugas, defaultKategoriId]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (isEditing) {
            put(`/admin/uraian-tugas/${uraianTugas.id}`, {
                onSuccess: () => {
                    onOpenChange(false);
                    reset();
                },
            });
        } else {
            post('/admin/uraian-tugas', {
                onSuccess: () => {
                    onOpenChange(false);
                    reset();
                },
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Uraian Tugas' : 'Tambah Uraian Tugas'}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Ubah informasi uraian tugas di bawah ini.'
                            : 'Isi informasi uraian tugas baru di bawah ini.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="kategori_id">Kategori</Label>
                        <Select
                            value={data.kategori_id}
                            onValueChange={(value) => setData('kategori_id', value)}
                            disabled={!!defaultKategoriId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih Kategori" />
                            </SelectTrigger>
                            <SelectContent>
                                {kategoriList.map((kategori) => (
                                    <SelectItem key={kategori.id} value={kategori.id.toString()}>
                                        <div className="flex flex-col">
                                            <span>{kategori.nama}</span>
                                            {kategori.bidang && (
                                                <span className="text-xs text-muted-foreground">
                                                    {kategori.bidang.nama}
                                                </span>
                                            )}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.kategori_id && (
                            <p className="text-sm text-destructive">{errors.kategori_id}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="nama">Nama Uraian Tugas</Label>
                        <Input
                            id="nama"
                            value={data.nama}
                            onChange={(e) => setData('nama', e.target.value)}
                            placeholder="Masukkan nama uraian tugas"
                        />
                        {errors.nama && (
                            <p className="text-sm text-destructive">{errors.nama}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="deskripsi">Deskripsi</Label>
                        <Textarea
                            id="deskripsi"
                            value={data.deskripsi}
                            onChange={(e) => setData('deskripsi', e.target.value)}
                            placeholder="Masukkan deskripsi uraian tugas (opsional)"
                            rows={3}
                        />
                        {errors.deskripsi && (
                            <p className="text-sm text-destructive">{errors.deskripsi}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="urutan">Urutan</Label>
                        <Input
                            id="urutan"
                            type="number"
                            min="0"
                            value={data.urutan}
                            onChange={(e) => setData('urutan', parseInt(e.target.value) || 0)}
                            placeholder="Urutan tampilan"
                        />
                        {errors.urutan && (
                            <p className="text-sm text-destructive">{errors.urutan}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Menyimpan...' : isEditing ? 'Simpan' : 'Tambah'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
