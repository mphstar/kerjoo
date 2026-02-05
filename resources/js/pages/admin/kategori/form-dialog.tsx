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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { type Kategori, type Bidang } from '@/types/logbook';
import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    kategori: Kategori | null;
    bidangList?: Bidang[];
    defaultBidangId?: string;
}

export default function KategoriFormDialog({ open, onOpenChange, kategori, bidangList = [], defaultBidangId }: Props) {
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        bidang_id: '',
        nama: '',
        deskripsi: '',
    });

    useEffect(() => {
        if (kategori) {
            setData({
                bidang_id: kategori.bidang_id?.toString() || '',
                nama: kategori.nama,
                deskripsi: kategori.deskripsi || '',
            });
        } else {
            // Reset with defaultBidangId if provided
            setData({
                bidang_id: defaultBidangId || '',
                nama: '',
                deskripsi: '',
            });
        }
        clearErrors();
    }, [kategori, open, defaultBidangId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (kategori) {
            // Edit mode
            put(`/admin/kategori/${kategori.id}`, {
                onSuccess: () => onOpenChange(false),
            });
        } else {
            // Create mode
            post('/admin/kategori', {
                onSuccess: () => onOpenChange(false),
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{kategori ? 'Edit Kategori' : 'Tambah Kategori'}</DialogTitle>
                        <DialogDescription>
                            {kategori ? 'Ubah data kategori yang sudah ada.' : 'Buat kategori pelaksana baru.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="bidang_id">Bidang {defaultBidangId ? '' : '(Opsional)'}</Label>
                            <Select
                                value={data.bidang_id}
                                onValueChange={(value) => setData('bidang_id', value === 'none' ? '' : value)}
                                disabled={!!defaultBidangId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Bidang" />
                                </SelectTrigger>
                                <SelectContent>
                                    {!defaultBidangId && <SelectItem value="none">Tidak Ada</SelectItem>}
                                    {bidangList.map((bidang) => (
                                        <SelectItem key={bidang.id} value={bidang.id.toString()}>
                                            {bidang.nama}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.bidang_id && <span className="text-sm text-destructive">{errors.bidang_id}</span>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="nama">Nama Kategori</Label>
                            <Input
                                id="nama"
                                value={data.nama}
                                onChange={(e) => setData('nama', e.target.value)}
                                placeholder="Contoh: Kebersihan"
                                required
                            />
                            {errors.nama && <span className="text-sm text-destructive">{errors.nama}</span>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="deskripsi">Deskripsi</Label>
                            <Input
                                id="deskripsi"
                                value={data.deskripsi}
                                onChange={(e) => setData('deskripsi', e.target.value)}
                                placeholder="Deskripsi singkat..."
                            />
                            {errors.deskripsi && <span className="text-sm text-destructive">{errors.deskripsi}</span>}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {kategori ? 'Simpan Perubahan' : 'Buat Kategori'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

