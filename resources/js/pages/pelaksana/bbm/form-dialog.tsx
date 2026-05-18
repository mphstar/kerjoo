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
import { useForm, usePage } from '@inertiajs/react';
import { Camera, ImagePlus, X } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function BbmFormDialog({ open, onOpenChange }: Props) {
    const { props } = usePage();
    const userName = (props.auth as any)?.user?.name || '';
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);

    const { data, setData, post, processing, errors, reset } = useForm({
        tanggal: new Date().toISOString().split('T')[0],
        pengemudi: userName,
        uraian: '',
        nama_kendaraan: '',
        merk_kendaraan: '',
        no_polisi: '',
        km_awal: '',
        bbm_awal_liter: '',
        bbm_awal_persen: '',
        bbm_liter: '',
        bbm_harga_per_liter: '',
        bbm_total_harga: '',
        km_akhir: '',
        bbm_akhir_liter: '',
        bbm_akhir_persen: '',
        lampiran_foto: [] as File[],
    });

    useEffect(() => {
        if (open) {
            reset();
            setData('pengemudi', userName);
            setData('tanggal', new Date().toISOString().split('T')[0]);
            setPreviewUrls([]);
        }
    }, [open]);

    // Auto-calculate total harga
    useEffect(() => {
        const liter = parseFloat(data.bbm_liter) || 0;
        const harga = parseFloat(data.bbm_harga_per_liter) || 0;
        const total = liter * harga;
        setData('bbm_total_harga', total > 0 ? total.toString() : '');
    }, [data.bbm_liter, data.bbm_harga_per_liter]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const currentFiles = data.lampiran_foto || [];
        const totalFiles = currentFiles.length + files.length;

        if (totalFiles > 5) {
            alert('Maksimal 5 foto yang dapat diunggah.');
            return;
        }

        const newFiles = [...currentFiles, ...files];
        setData('lampiran_foto', newFiles);

        // Generate preview URLs
        const newPreviews = files.map((file) => URL.createObjectURL(file));
        setPreviewUrls((prev) => [...prev, ...newPreviews]);

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removePhoto = (index: number) => {
        const newFiles = [...data.lampiran_foto];
        newFiles.splice(index, 1);
        setData('lampiran_foto', newFiles);

        // Revoke the old preview URL and remove it
        URL.revokeObjectURL(previewUrls[index]);
        const newPreviews = [...previewUrls];
        newPreviews.splice(index, 1);
        setPreviewUrls(newPreviews);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post('/pelaksana/bbm', {
            forceFormData: true,
            onSuccess: () => {
                // Cleanup preview URLs
                previewUrls.forEach((url) => URL.revokeObjectURL(url));
                setPreviewUrls([]);
                onOpenChange(false);
                reset();
            },
        });
    };

    const handleDialogOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            // Cleanup preview URLs
            previewUrls.forEach((url) => URL.revokeObjectURL(url));
            setPreviewUrls([]);
            reset();
        }
        onOpenChange(newOpen);
    };

    const formatCurrency = (value: string) => {
        const num = parseFloat(value);
        if (isNaN(num)) return '';
        return new Intl.NumberFormat('id-ID').format(num);
    };

    return (
        <Dialog open={open} onOpenChange={handleDialogOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Buat Permintaan BBM</DialogTitle>
                        <DialogDescription>
                            Isi data kendaraan dan kebutuhan BBM
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {/* Tanggal */}
                        <div className="grid gap-2">
                            <Label htmlFor="tanggal">Tanggal</Label>
                            <Input
                                id="tanggal"
                                type="date"
                                value={data.tanggal}
                                onChange={(e) => setData('tanggal', e.target.value)}
                            />
                            {errors.tanggal && <span className="text-sm text-destructive">{errors.tanggal}</span>}
                        </div>

                        {/* Pengemudi */}
                        <div className="grid gap-2">
                            <Label htmlFor="pengemudi">Pengemudi</Label>
                            <Input
                                id="pengemudi"
                                value={data.pengemudi}
                                onChange={(e) => setData('pengemudi', e.target.value)}
                                placeholder="Nama pengemudi"
                            />
                            {errors.pengemudi && <span className="text-sm text-destructive">{errors.pengemudi}</span>}
                        </div>

                        {/* Uraian */}
                        <div className="grid gap-2">
                            <Label htmlFor="uraian">Uraian Kegiatan</Label>
                            <Textarea
                                id="uraian"
                                value={data.uraian}
                                onChange={(e) => setData('uraian', e.target.value)}
                                placeholder="Tujuan / kegiatan penggunaan kendaraan"
                                rows={2}
                            />
                            {errors.uraian && <span className="text-sm text-destructive">{errors.uraian}</span>}
                        </div>

                        {/* Kendaraan */}
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold">Kendaraan</Label>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="grid gap-1">
                                    <Label htmlFor="nama_kendaraan" className="text-xs text-muted-foreground">Nama</Label>
                                    <Input
                                        id="nama_kendaraan"
                                        value={data.nama_kendaraan}
                                        onChange={(e) => setData('nama_kendaraan', e.target.value)}
                                        placeholder="Innova Venturer"
                                    />
                                    {errors.nama_kendaraan && <span className="text-xs text-destructive">{errors.nama_kendaraan}</span>}
                                </div>
                                <div className="grid gap-1">
                                    <Label htmlFor="merk_kendaraan" className="text-xs text-muted-foreground">Merk</Label>
                                    <Input
                                        id="merk_kendaraan"
                                        value={data.merk_kendaraan}
                                        onChange={(e) => setData('merk_kendaraan', e.target.value)}
                                        placeholder="Toyota"
                                    />
                                    {errors.merk_kendaraan && <span className="text-xs text-destructive">{errors.merk_kendaraan}</span>}
                                </div>
                                <div className="grid gap-1">
                                    <Label htmlFor="no_polisi" className="text-xs text-muted-foreground">No Polisi</Label>
                                    <Input
                                        id="no_polisi"
                                        value={data.no_polisi}
                                        onChange={(e) => setData('no_polisi', e.target.value)}
                                        placeholder="P 1013 GP"
                                    />
                                    {errors.no_polisi && <span className="text-xs text-destructive">{errors.no_polisi}</span>}
                                </div>
                            </div>
                        </div>

                        {/* KM & BBM Awal */}
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold">KM & BBM Awal</Label>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="grid gap-1">
                                    <Label htmlFor="km_awal" className="text-xs text-muted-foreground">KM Awal</Label>
                                    <Input
                                        id="km_awal"
                                        type="number"
                                        step="0.1"
                                        value={data.km_awal}
                                        onChange={(e) => setData('km_awal', e.target.value)}
                                        placeholder="172647"
                                    />
                                    {errors.km_awal && <span className="text-xs text-destructive">{errors.km_awal}</span>}
                                </div>
                                <div className="grid gap-1">
                                    <Label htmlFor="bbm_awal_liter" className="text-xs text-muted-foreground">BBM Awal (Ltr)</Label>
                                    <Input
                                        id="bbm_awal_liter"
                                        type="number"
                                        step="0.1"
                                        value={data.bbm_awal_liter}
                                        onChange={(e) => setData('bbm_awal_liter', e.target.value)}
                                        placeholder="28"
                                    />
                                    {errors.bbm_awal_liter && <span className="text-xs text-destructive">{errors.bbm_awal_liter}</span>}
                                </div>
                                <div className="grid gap-1">
                                    <Label htmlFor="bbm_awal_persen" className="text-xs text-muted-foreground">BBM Awal (%)</Label>
                                    <Input
                                        id="bbm_awal_persen"
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={data.bbm_awal_persen}
                                        onChange={(e) => setData('bbm_awal_persen', e.target.value)}
                                        placeholder="50"
                                    />
                                    {errors.bbm_awal_persen && <span className="text-xs text-destructive">{errors.bbm_awal_persen}</span>}
                                </div>
                            </div>
                        </div>

                        {/* BBM Diminta */}
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold">BBM Diminta</Label>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="grid gap-1">
                                    <Label htmlFor="bbm_liter" className="text-xs text-muted-foreground">Jumlah (Ltr)</Label>
                                    <Input
                                        id="bbm_liter"
                                        type="number"
                                        step="0.1"
                                        value={data.bbm_liter}
                                        onChange={(e) => setData('bbm_liter', e.target.value)}
                                        placeholder="10"
                                    />
                                    {errors.bbm_liter && <span className="text-xs text-destructive">{errors.bbm_liter}</span>}
                                </div>
                                <div className="grid gap-1">
                                    <Label htmlFor="bbm_harga_per_liter" className="text-xs text-muted-foreground">Harga/Ltr (Rp)</Label>
                                    <Input
                                        id="bbm_harga_per_liter"
                                        type="number"
                                        value={data.bbm_harga_per_liter}
                                        onChange={(e) => setData('bbm_harga_per_liter', e.target.value)}
                                        placeholder="12300"
                                    />
                                    {errors.bbm_harga_per_liter && <span className="text-xs text-destructive">{errors.bbm_harga_per_liter}</span>}
                                </div>
                                <div className="grid gap-1">
                                    <Label className="text-xs text-muted-foreground">Total (Rp)</Label>
                                    <Input
                                        value={data.bbm_total_harga ? `Rp ${formatCurrency(data.bbm_total_harga)}` : ''}
                                        disabled
                                        className="bg-muted"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* KM & BBM Akhir */}
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold">KM & BBM Akhir <span className="text-xs font-normal text-muted-foreground">(opsional)</span></Label>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="grid gap-1">
                                    <Label htmlFor="km_akhir" className="text-xs text-muted-foreground">KM Akhir</Label>
                                    <Input
                                        id="km_akhir"
                                        type="number"
                                        step="0.1"
                                        value={data.km_akhir}
                                        onChange={(e) => setData('km_akhir', e.target.value)}
                                        placeholder="172740"
                                    />
                                    {errors.km_akhir && <span className="text-xs text-destructive">{errors.km_akhir}</span>}
                                </div>
                                <div className="grid gap-1">
                                    <Label htmlFor="bbm_akhir_liter" className="text-xs text-muted-foreground">BBM Akhir (Ltr)</Label>
                                    <Input
                                        id="bbm_akhir_liter"
                                        type="number"
                                        step="0.1"
                                        value={data.bbm_akhir_liter}
                                        onChange={(e) => setData('bbm_akhir_liter', e.target.value)}
                                        placeholder="28"
                                    />
                                    {errors.bbm_akhir_liter && <span className="text-xs text-destructive">{errors.bbm_akhir_liter}</span>}
                                </div>
                                <div className="grid gap-1">
                                    <Label htmlFor="bbm_akhir_persen" className="text-xs text-muted-foreground">BBM Akhir (%)</Label>
                                    <Input
                                        id="bbm_akhir_persen"
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={data.bbm_akhir_persen}
                                        onChange={(e) => setData('bbm_akhir_persen', e.target.value)}
                                        placeholder="50"
                                    />
                                    {errors.bbm_akhir_persen && <span className="text-xs text-destructive">{errors.bbm_akhir_persen}</span>}
                                </div>
                            </div>
                        </div>

                        {/* Lampiran Foto */}
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold">
                                <Camera className="inline-block mr-1.5 h-4 w-4" />
                                Lampiran Foto Pendukung
                                <span className="text-xs font-normal text-muted-foreground ml-1">(maks. 5 foto)</span>
                            </Label>

                            {/* Photo previews */}
                            {previewUrls.length > 0 && (
                                <div className="grid grid-cols-3 gap-2">
                                    {previewUrls.map((url, index) => (
                                        <div key={index} className="relative group rounded-lg overflow-hidden border bg-muted aspect-square">
                                            <img
                                                src={url}
                                                alt={`Lampiran ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removePhoto(index)}
                                                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1.5 py-0.5 text-center">
                                                Foto {index + 1}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Upload button */}
                            {(data.lampiran_foto?.length || 0) < 5 && (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center justify-center w-full rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 bg-muted/30 hover:bg-muted/50 transition-colors py-4 gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer"
                                >
                                    <ImagePlus className="h-5 w-5" />
                                    <span>Tambah Foto</span>
                                </button>
                            )}

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/jpg,image/webp"
                                multiple
                                onChange={handleFileSelect}
                                className="hidden"
                            />

                            {errors.lampiran_foto && <span className="text-sm text-destructive">{errors.lampiran_foto}</span>}
                            {(errors as any)['lampiran_foto.0'] && <span className="text-sm text-destructive">{(errors as any)['lampiran_foto.0']}</span>}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => handleDialogOpenChange(false)}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Menyimpan...' : 'Ajukan Permintaan'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
