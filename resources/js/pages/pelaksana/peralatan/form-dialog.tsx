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
import { type MasterPeralatan } from '@/types/logbook';
import { useForm } from '@inertiajs/react';
import { Plus, Trash2, Search } from 'lucide-react';
import { useState, useMemo } from 'react';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    masterPeralatan: MasterPeralatan[];
}

interface EquipmentItem {
    master_peralatan_id: number | null;
    nama_peralatan: string;
    jumlah: number;
    satuan: string;
}

export default function PeralatanFormDialog({ open, onOpenChange, masterPeralatan }: Props) {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const [items, setItems] = useState<EquipmentItem[]>([
        { master_peralatan_id: null, nama_peralatan: '', jumlah: 1, satuan: '' },
    ]);

    const [searchQueries, setSearchQueries] = useState<Record<number, string>>({});

    const { data, setData, post, processing, errors, reset } = useForm({
        bulan: currentMonth.toString(),
        tahun: currentYear.toString(),
        items: items.map(({ nama_peralatan, jumlah, satuan }) => ({ nama_peralatan, jumlah, satuan })),
    });

    const handleAddItem = () => {
        const newItems = [...items, { master_peralatan_id: null, nama_peralatan: '', jumlah: 1, satuan: '' }];
        setItems(newItems);
        syncFormItems(newItems);
    };

    const handleRemoveItem = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
        syncFormItems(newItems);
        // Clean up search query
        const newQueries = { ...searchQueries };
        delete newQueries[index];
        setSearchQueries(newQueries);
    };

    const handleSelectPeralatan = (index: number, peralatanId: string) => {
        const selected = masterPeralatan.find((p) => p.id.toString() === peralatanId);
        if (selected) {
            const newItems = [...items];
            newItems[index] = {
                ...newItems[index],
                master_peralatan_id: selected.id,
                nama_peralatan: selected.nama,
                satuan: selected.satuan,
            };
            setItems(newItems);
            syncFormItems(newItems);
        }
    };

    const handleItemChange = (index: number, field: keyof EquipmentItem, value: string | number) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
        syncFormItems(newItems);
    };

    const syncFormItems = (currentItems: EquipmentItem[]) => {
        setData('items', currentItems.map(({ nama_peralatan, jumlah, satuan }) => ({ nama_peralatan, jumlah, satuan })));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post('/pelaksana/peralatan', {
            onSuccess: () => {
                onOpenChange(false);
                setItems([{ master_peralatan_id: null, nama_peralatan: '', jumlah: 1, satuan: '' }]);
                setSearchQueries({});
                reset();
            },
        });
    };

    const handleDialogOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            setItems([{ master_peralatan_id: null, nama_peralatan: '', jumlah: 1, satuan: '' }]);
            setSearchQueries({});
            reset();
        }
        onOpenChange(newOpen);
    };

    const months = [
        { value: '1', label: 'Januari' },
        { value: '2', label: 'Februari' },
        { value: '3', label: 'Maret' },
        { value: '4', label: 'April' },
        { value: '5', label: 'Mei' },
        { value: '6', label: 'Juni' },
        { value: '7', label: 'Juli' },
        { value: '8', label: 'Agustus' },
        { value: '9', label: 'September' },
        { value: '10', label: 'Oktober' },
        { value: '11', label: 'November' },
        { value: '12', label: 'Desember' },
    ];

    const years = Array.from({ length: 5 }, (_, i) => currentYear + i);

    // Get already-selected IDs to prevent duplicate selections
    const selectedIds = items
        .map((item) => item.master_peralatan_id)
        .filter((id): id is number => id !== null);

    return (
        <Dialog open={open} onOpenChange={handleDialogOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Buat Permintaan Peralatan</DialogTitle>
                        <DialogDescription>
                            Pilih peralatan dari daftar yang tersedia dan tentukan jumlah yang dibutuhkan
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {/* Periode */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="bulan">Bulan</Label>
                                <Select value={data.bulan} onValueChange={(value) => setData('bulan', value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {months.map((month) => (
                                            <SelectItem key={month.value} value={month.value}>
                                                {month.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.bulan && <span className="text-sm text-destructive">{errors.bulan}</span>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="tahun">Tahun</Label>
                                <Select value={data.tahun} onValueChange={(value) => setData('tahun', value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {years.map((year) => (
                                            <SelectItem key={year} value={year.toString()}>
                                                {year}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.tahun && <span className="text-sm text-destructive">{errors.tahun}</span>}
                            </div>
                        </div>

                        {/* Items */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Daftar Peralatan</Label>
                                <Button type="button" size="sm" variant="outline" onClick={handleAddItem}>
                                    <Plus className="mr-1 h-3 w-3" />
                                    Tambah Item
                                </Button>
                            </div>

                            {masterPeralatan.length === 0 && (
                                <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                                    <p>Belum ada data peralatan tersedia.</p>
                                    <p className="text-xs mt-1">Hubungi admin untuk menambahkan master peralatan.</p>
                                </div>
                            )}

                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                {items.map((item, index) => (
                                    <div key={index} className="border rounded-md p-3 space-y-2">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium">Item {index + 1}</span>
                                            {items.length > 1 && (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-6 text-destructive"
                                                    onClick={() => handleRemoveItem(index)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>

                                        {/* Equipment Select */}
                                        <Select
                                            value={item.master_peralatan_id?.toString() || ''}
                                            onValueChange={(value) => handleSelectPeralatan(index, value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih peralatan..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {masterPeralatan.map((p) => {
                                                    const isAlreadySelected = selectedIds.includes(p.id) && p.id !== item.master_peralatan_id;
                                                    return (
                                                        <SelectItem
                                                            key={p.id}
                                                            value={p.id.toString()}
                                                            disabled={isAlreadySelected}
                                                        >
                                                            <div className="flex items-center justify-between w-full gap-4">
                                                                <span>{p.nama}</span>
                                                                <span className="text-xs text-muted-foreground">({p.satuan})</span>
                                                            </div>
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>

                                        {/* Jumlah (only shown when peralatan is selected) */}
                                        {item.master_peralatan_id && (
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <Label className="text-xs text-muted-foreground">Jumlah</Label>
                                                    <Input
                                                        type="number"
                                                        placeholder="Jumlah"
                                                        min="1"
                                                        value={item.jumlah}
                                                        onChange={(e) =>
                                                            handleItemChange(index, 'jumlah', parseInt(e.target.value) || 1)
                                                        }
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs text-muted-foreground">Satuan</Label>
                                                    <Input
                                                        value={item.satuan}
                                                        disabled
                                                        className="bg-muted"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {errors.items && <span className="text-sm text-destructive">{errors.items}</span>}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => handleDialogOpenChange(false)}>
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing || items.every((i) => !i.master_peralatan_id)}
                        >
                            Ajukan Permintaan
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
