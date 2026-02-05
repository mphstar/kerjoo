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
import { type Bidang } from '@/types/logbook';
import { useForm } from '@inertiajs/react';
import { FormEvent, useEffect } from 'react';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    bidang: Bidang | null;
}

export default function BidangDialog({ open, onOpenChange, bidang }: Props) {
    const isEditing = !!bidang;

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        nama: '',
        deskripsi: '',
    });

    useEffect(() => {
        if (open) {
            if (bidang) {
                setData({
                    nama: bidang.nama,
                    deskripsi: bidang.deskripsi || '',
                });
            } else {
                reset();
            }
            clearErrors();
        }
    }, [open, bidang]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (isEditing) {
            put(`/admin/bidang/${bidang.id}`, {
                onSuccess: () => {
                    onOpenChange(false);
                    reset();
                },
            });
        } else {
            post('/admin/bidang', {
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
                    <DialogTitle>{isEditing ? 'Edit Bidang' : 'Tambah Bidang'}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Ubah informasi bidang di bawah ini.'
                            : 'Isi informasi bidang baru di bawah ini.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="nama">Nama Bidang</Label>
                        <Input
                            id="nama"
                            value={data.nama}
                            onChange={(e) => setData('nama', e.target.value)}
                            placeholder="Masukkan nama bidang"
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
                            placeholder="Masukkan deskripsi bidang (opsional)"
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
