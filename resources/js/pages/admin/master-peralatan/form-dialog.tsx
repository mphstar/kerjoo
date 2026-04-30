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
import { type MasterPeralatan } from '@/types/logbook';
import { useForm } from '@inertiajs/react';
import { FormEvent, useEffect } from 'react';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    peralatan: MasterPeralatan | null;
}

export default function MasterPeralatanDialog({ open, onOpenChange, peralatan }: Props) {
    const isEditing = !!peralatan;

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        nama: '',
        satuan: '',
        deskripsi: '',
    });

    useEffect(() => {
        if (open) {
            if (peralatan) {
                setData({
                    nama: peralatan.nama,
                    satuan: peralatan.satuan,
                    deskripsi: peralatan.deskripsi || '',
                });
            } else {
                reset();
            }
            clearErrors();
        }
    }, [open, peralatan]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (isEditing) {
            put(`/admin/master-peralatan/${peralatan.id}`, {
                onSuccess: () => {
                    onOpenChange(false);
                    reset();
                },
            });
        } else {
            post('/admin/master-peralatan', {
                onSuccess: () => {
                    onOpenChange(false);
                    reset();
                },
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Peralatan' : 'Tambah Peralatan'}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Ubah informasi peralatan di bawah ini.'
                            : 'Isi informasi peralatan baru di bawah ini.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="nama">Nama Peralatan</Label>
                        <Input
                            id="nama"
                            value={data.nama}
                            onChange={(e) => setData('nama', e.target.value)}
                            placeholder="Masukkan nama peralatan"
                        />
                        {errors.nama && (
                            <p className="text-sm text-destructive">{errors.nama}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="satuan">Satuan</Label>
                        <Input
                            id="satuan"
                            value={data.satuan}
                            onChange={(e) => setData('satuan', e.target.value)}
                            placeholder="Contoh: unit, buah, lembar, rim, pcs"
                        />
                        {errors.satuan && (
                            <p className="text-sm text-destructive">{errors.satuan}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="deskripsi">Deskripsi</Label>
                        <Textarea
                            id="deskripsi"
                            value={data.deskripsi}
                            onChange={(e) => setData('deskripsi', e.target.value)}
                            placeholder="Masukkan deskripsi peralatan (opsional)"
                            rows={3}
                        />
                        {errors.deskripsi && (
                            <p className="text-sm text-destructive">{errors.deskripsi}</p>
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
