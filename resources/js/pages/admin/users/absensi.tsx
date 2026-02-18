import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { type Absensi, type User } from '@/types/logbook';
import { Head, router } from '@inertiajs/react';
import { format, parseISO, isToday } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { ArrowLeft, Calendar, Camera, Clock, Search } from 'lucide-react';
import { useState, useMemo } from 'react';

interface Props {
    user: User;
    absensi: Absensi[];
    filters: {
        date_from: string | null;
        date_to: string | null;
    };
}

export default function UserAbsensi({ user, absensi, filters }: Props) {
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [viewImage, setViewImage] = useState<string | null>(null);

    const handleFilter = () => {
        router.get(`/admin/users/${user.id}/absensi`, {
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleReset = () => {
        setDateFrom('');
        setDateTo('');
        router.get(`/admin/users/${user.id}/absensi`, {}, {
            preserveState: true,
            replace: true,
        });
    };

    // Group by date
    const groupedAbsensi = useMemo(() => {
        const groups: Record<string, Absensi[]> = {};
        absensi.forEach((item) => {
            const date = item.tanggal;
            if (!groups[date]) groups[date] = [];
            groups[date].push(item);
        });
        return groups;
    }, [absensi]);

    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/admin' },
            { title: 'Manajemen Pengguna', href: '/admin/users' },
            { title: `Absensi - ${user.name}`, href: `/admin/users/${user.id}/absensi` },
        ]}>
            <Head title={`Absensi - ${user.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.visit('/admin/users')}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h2 className="text-xl font-semibold">Absensi - {user.name}</h2>
                            <p className="text-sm text-muted-foreground">
                                {user.email} · Total {absensi.length} record
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-3 md:flex-row md:items-end">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm text-muted-foreground mb-1 block">Dari Tanggal</label>
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-sm text-muted-foreground mb-1 block">Sampai Tanggal</label>
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleFilter} size="sm">
                            <Search className="h-4 w-4 mr-1" />
                            Filter
                        </Button>
                        {(dateFrom || dateTo) && (
                            <Button onClick={handleReset} variant="outline" size="sm">
                                Reset
                            </Button>
                        )}
                    </div>
                </div>

                {/* Content */}
                {Object.keys(groupedAbsensi).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <Camera className="h-12 w-12 mb-3 opacity-30" />
                        <p className="font-medium">Belum ada data absensi</p>
                        <p className="text-sm mt-1">Data absensi akan muncul setelah pelaksana upload</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {Object.entries(groupedAbsensi).map(([date, items]) => (
                            <div key={date}>
                                <div className="flex items-center gap-2 mb-3">
                                    <Calendar className="h-4 w-4 text-primary" />
                                    <h3 className="font-semibold text-sm">
                                        {isToday(parseISO(date))
                                            ? 'Hari Ini'
                                            : format(parseISO(date), 'EEEE, d MMMM yyyy', { locale: idLocale })
                                        }
                                    </h3>
                                    <Badge variant="secondary" className="text-xs">
                                        {items.length} absensi
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {items.map((item) => (
                                        <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                            <CardContent className="p-0">
                                                <img
                                                    src={item.foto_url}
                                                    alt={item.keterangan}
                                                    className="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                                    onClick={() => setViewImage(item.foto_url || null)}
                                                />
                                                <div className="p-3">
                                                    <div className="font-medium text-sm">{item.keterangan}</div>
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                                        <Clock className="h-3 w-3" />
                                                        {format(new Date(item.created_at), 'HH:mm:ss', { locale: idLocale })}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Image Viewer */}
            <Dialog open={!!viewImage} onOpenChange={() => setViewImage(null)}>
                <DialogContent className="max-w-2xl p-0 overflow-hidden">
                    <DialogHeader className="p-4 pb-0">
                        <DialogTitle>Foto Absensi</DialogTitle>
                    </DialogHeader>
                    {viewImage && (
                        <img
                            src={viewImage}
                            alt="Foto Absensi"
                            className="w-full max-h-[75vh] object-contain p-4"
                        />
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
