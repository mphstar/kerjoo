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
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { type Kategori, type User } from '@/types/logbook';
import { useForm } from '@inertiajs/react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: User | null;
    kategoriList: Kategori[];
}

export default function UserFormDialog({ open, onOpenChange, user, kategoriList }: Props) {
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        email: '',
        password: '',
        peran: 'pelaksana' as 'admin' | 'pelaksana' | 'pimpinan',
        kategori_id: '',
        nomor_telepon: '',
        nip_nrp: '',
        tempat: '',
    });

    const [openCombobox, setOpenCombobox] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (user) {
            setData({
                name: user.name,
                email: user.email,
                password: '', // Don't populate password on edit
                peran: user.peran,
                kategori_id: user.kategori_id?.toString() || '',
                nomor_telepon: user.nomor_telepon || '',
                nip_nrp: user.nip_nrp || '',
                tempat: user.tempat || '',
            });
        } else {
            reset();
        }
        clearErrors();
        setSearchQuery('');
    }, [user, open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (user) {
            put(`/admin/users/${user.id}`, {
                onSuccess: () => onOpenChange(false),
            });
        } else {
            post('/admin/users', {
                onSuccess: () => onOpenChange(false),
            });
        }
    };

    // Group categories by Bidang
    const groupedKategori = useMemo(() => {
        const query = searchQuery.toLowerCase();
        const filtered = kategoriList.filter(k =>
            k.nama.toLowerCase().includes(query) ||
            (k.bidang?.nama || '').toLowerCase().includes(query)
        );

        const groups: Record<string, Kategori[]> = {};
        filtered.forEach(k => {
            const bidangName = k.bidang?.nama || 'Lainnya';
            if (!groups[bidangName]) {
                groups[bidangName] = [];
            }
            groups[bidangName].push(k);
        });
        return groups;
    }, [kategoriList, searchQuery]);

    const selectedKategori = kategoriList.find(k => k.id.toString() === data.kategori_id);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{user ? 'Edit Pengguna' : 'Tambah Pengguna'}</DialogTitle>
                        <DialogDescription>
                            {user ? 'Ubah data pengguna.' : 'Buat pengguna baru.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {/* Nama */}
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nama Lengkap</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Contoh: Ahmad Zaki"
                                required
                            />
                            {errors.name && <span className="text-sm text-destructive">{errors.name}</span>}
                        </div>

                        {/* Email */}
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="contoh@email.com"
                                required
                            />
                            {errors.email && <span className="text-sm text-destructive">{errors.email}</span>}
                        </div>

                        {/* Password */}
                        <div className="grid gap-2">
                            <Label htmlFor="password">
                                Password {user && <span className="text-xs text-muted-foreground">(kosongkan jika tidak ingin mengubah)</span>}
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="Minimal 8 karakter"
                                required={!user}
                            />
                            {errors.password && <span className="text-sm text-destructive">{errors.password}</span>}
                        </div>

                        {/* Peran */}
                        <div className="grid gap-2">
                            <Label htmlFor="peran">Peran</Label>
                            <Select
                                value={data.peran}
                                onValueChange={(value) => setData('peran', value as 'admin' | 'pelaksana' | 'pimpinan')}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Peran" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="pelaksana">Pelaksana</SelectItem>
                                    <SelectItem value="pimpinan">Pimpinan</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.peran && <span className="text-sm text-destructive">{errors.peran}</span>}
                        </div>

                        {/* Kategori (only for pelaksana) */}
                        {data.peran === 'pelaksana' && (
                            <div className="grid gap-2">
                                <Label htmlFor="kategori">Kategori</Label>
                                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openCombobox}
                                            className="w-full justify-between"
                                        >
                                            {selectedKategori ? selectedKategori.nama : "Pilih Kategori..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                        <div className="p-2 border-b">
                                            <Input
                                                placeholder="Cari kategori..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="border-none focus-visible:ring-0 px-2 h-8"
                                            />
                                        </div>
                                        <ScrollArea className="h-[200px]">
                                            <div className="p-1">
                                                {Object.keys(groupedKategori).length === 0 ? (
                                                    <div className="py-6 text-center text-sm text-muted-foreground">
                                                        Tidak ada kategori ditemukan.
                                                    </div>
                                                ) : (
                                                    Object.entries(groupedKategori).map(([bidang, items]) => (
                                                        <div key={bidang} className="mb-2">
                                                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground sticky top-0 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
                                                                {bidang}
                                                            </div>
                                                            {items.map((k) => (
                                                                <div
                                                                    key={k.id}
                                                                    className={cn(
                                                                        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50",
                                                                        k.id.toString() === data.kategori_id && "bg-accent text-accent-foreground"
                                                                    )}
                                                                    onClick={() => {
                                                                        setData('kategori_id', k.id.toString());
                                                                        setOpenCombobox(false);
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            k.id.toString() === data.kategori_id ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />
                                                                    {k.nama}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </PopoverContent>
                                </Popover>
                                {errors.kategori_id && <span className="text-sm text-destructive">{errors.kategori_id}</span>}
                            </div>
                        )}

                        {/* Nomor Telepon */}
                        <div className="grid gap-2">
                            <Label htmlFor="nomor_telepon">Nomor Telepon</Label>
                            <Input
                                id="nomor_telepon"
                                type="tel"
                                value={data.nomor_telepon}
                                onChange={(e) => setData('nomor_telepon', e.target.value)}
                                placeholder="08123456789"
                            />
                            {errors.nomor_telepon && <span className="text-sm text-destructive">{errors.nomor_telepon}</span>}
                        </div>

                        {/* NIP/NRP and Tempat (only for pelaksana) */}
                        {data.peran === 'pelaksana' && (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="nip_nrp">NIP / NRP</Label>
                                    <Input
                                        id="nip_nrp"
                                        value={data.nip_nrp}
                                        onChange={(e) => setData('nip_nrp', e.target.value)}
                                        placeholder="Contoh: 199001012020011001"
                                    />
                                    {errors.nip_nrp && <span className="text-sm text-destructive">{errors.nip_nrp}</span>}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="tempat">Tempat <span className="text-xs text-muted-foreground">(Opsional)</span></Label>
                                    <Input
                                        id="tempat"
                                        value={data.tempat}
                                        onChange={(e) => setData('tempat', e.target.value)}
                                        placeholder="Contoh: Gedung A Lantai 2"
                                    />
                                    {errors.tempat && <span className="text-sm text-destructive">{errors.tempat}</span>}
                                </div>
                            </>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {user ? 'Simpan Perubahan' : 'Tambah Pengguna'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
