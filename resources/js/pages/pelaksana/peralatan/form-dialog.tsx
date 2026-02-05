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
import { useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface EquipmentItem {
    nama_peralatan: string;
    jumlah: number;
    satuan: string;
}

export default function PeralatanFormDialog({ open, onOpenChange }: Props) {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const [items, setItems] = useState<EquipmentItem[]>([
        { nama_peralatan: '', jumlah: 1, satuan: '' },
    ]);

    const { data, setData, post, processing, errors, reset } = useForm({
        bulan: currentMonth.toString(),
        tahun: currentYear.toString(),
        items: items,
    });

    const handleAddItem = () => {
        const newItems = [...items, { nama_peralatan: '', jumlah: 1, satuan: '' }];
        setItems(newItems);
        setData('items', newItems);
    };

    const handleRemoveItem = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
        setData('items', newItems);
    };

    const handleItemChange = (index: number, field: keyof EquipmentItem, value: string | number) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
        setData('items', newItems);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post('/pelaksana/peralatan', {
            onSuccess: () => {
                onOpenChange(false);
                setItems([{ nama_peralatan: '', jumlah: 1, satuan: '' }]);
                reset();
            },
        });
    };

    const handleDialogOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            setItems([{ nama_peralatan: '', jumlah: 1, satuan: '' }]);
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

    return (
        <Dialog open={open} onOpenChange={handleDialogOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Buat Permintaan Peralatan</DialogTitle>
                        <DialogDescription>
                            Ajukan permintaan peralatan untuk periode tertentu
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

                                        <Input
                                            placeholder="Nama Peralatan"
                                            value={item.nama_peralatan}
                                            onChange={(e) =>
                                                handleItemChange(index, 'nama_peralatan', e.target.value)
                                            }
                                            required
                                        />

                                        <div className="grid grid-cols-2 gap-2">
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
                                            <Input
                                                placeholder="Satuan"
                                                value={item.satuan}
                                                onChange={(e) => handleItemChange(index, 'satuan', e.target.value)}
                                                required
                                            />
                                        </div>
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
                        <Button type="submit" disabled={processing}>
                            Ajukan Permintaan
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
