import DeleteConfirmationDialog from '@/components/delete-confirmation-dialog';
import Pagination from '@/components/pagination';
import SearchInput from '@/components/search-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type Kategori, type Tugas, type User } from '@/types/logbook';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Head, Link, router } from '@inertiajs/react';
import {
    Plus, User as UserIcon, ChevronRight, CheckCircle2,
    Clock, AlertCircle, Folder, Zap
} from 'lucide-react';
import { useState } from 'react';
import TableInfo from '@/components/table-info';
import PenugasanDialog from './create-dialog';
import BatchPenugasanDialog from './batch-create-dialog';
import DailyTriggerDialog from './daily-trigger-dialog';

interface PelaksanaWithCounts extends User {
    total_penugasan: number;
    pending_count: number;
    dikerjakan_count: number;
    selesai_count: number;
}

interface Props {
    pelaksana: {
        data: PelaksanaWithCounts[];
        links: any[];
        from: number;
        to: number;
        total: number;
        per_page: number;
    };
    kategoriList: Kategori[];
    tugasList: Tugas[];
    pelaksanaList: User[];
    filters?: {
        kategori?: string;
        search?: string;
    };
}

export default function PenugasanIndex({
    pelaksana,
    kategoriList,
    tugasList,
    pelaksanaList,
    filters
}: Props) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);
    const [isTriggerDialogOpen, setIsTriggerDialogOpen] = useState(false);
    const [kategoriFilter, setKategoriFilter] = useState<string>(filters?.kategori || 'all');

    const handleKategoriChange = (value: string) => {
        setKategoriFilter(value);
        router.get('/admin/penugasan', {
            kategori: value === 'all' ? undefined : value,
            search: filters?.search,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handlePerPageChange = (value: string) => {
        router.get('/admin/penugasan', {
            per_page: value,
            kategori: filters?.kategori,
            search: filters?.search,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/admin' },
            { title: 'Daftar Penugasan', href: '/admin/penugasan' },
        ]}>
            <Head title="Manajemen Penugasan" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold">Manajemen Penugasan</h2>
                        <p className="text-sm text-muted-foreground">Pilih pelaksana untuk melihat dan kelola penugasan</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => setIsTriggerDialogOpen(true)}>
                            <Zap className="mr-2 h-4 w-4" />
                            Trigger Harian
                        </Button>
                        <Button variant="outline" onClick={() => setIsBatchDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Batch Penugasan
                        </Button>
                        <Button onClick={() => setIsDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Buat Penugasan
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-2">
                        <Select
                            defaultValue={pelaksana.per_page?.toString() || "10"}
                            onValueChange={handlePerPageChange}
                        >
                            <SelectTrigger className="w-[70px]">
                                <SelectValue placeholder="10" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-2 md:flex-row md:items-center">
                        <div className="w-full md:w-auto md:max-w-sm">
                            <SearchInput routeName="penugasan.index" />
                        </div>
                        <Select value={kategoriFilter} onValueChange={handleKategoriChange}>
                            <SelectTrigger className="w-full md:w-[180px]">
                                <Folder className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="Kategori" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Kategori</SelectItem>
                                {kategoriList.map((k) => (
                                    <SelectItem key={k.id} value={k.id.toString()}>
                                        {k.nama}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Pelaksana List */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {pelaksana.data.length === 0 ? (
                        <div className="col-span-full rounded-md border p-8 text-center text-muted-foreground">
                            Tidak ada pelaksana ditemukan.
                        </div>
                    ) : (
                        pelaksana.data.map((p) => (
                            <Link
                                key={p.id}
                                href={`/admin/penugasan/pelaksana/${p.id}`}
                                className="block"
                            >
                                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer hover:border-primary/50">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3 flex-1">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                    <UserIcon className="h-5 w-5 text-primary" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="font-semibold truncate">{p.name}</h3>
                                                    <p className="text-xs text-muted-foreground">
                                                        {p.kategori?.nama || 'Tanpa Kategori'}
                                                    </p>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-2" />
                                        </div>

                                        {/* Stats */}
                                        <div className="mt-4 flex items-center gap-3 flex-wrap">
                                            <Badge variant="outline" className="gap-1">
                                                <span className="text-muted-foreground">{p.total_penugasan}</span> tugas
                                            </Badge>
                                            {p.selesai_count > 0 && (
                                                <Badge variant="default" className="gap-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    {p.selesai_count}
                                                </Badge>
                                            )}
                                            {p.dikerjakan_count > 0 && (
                                                <Badge variant="secondary" className="gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {p.dikerjakan_count}
                                                </Badge>
                                            )}
                                            {p.pending_count > 0 && (
                                                <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {p.pending_count}
                                                </Badge>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))
                    )}
                </div>

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <TableInfo from={pelaksana.from} to={pelaksana.to} total={pelaksana.total} />
                    <Pagination links={pelaksana.links} />
                </div>

                <PenugasanDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    tugasList={tugasList}
                    pelaksanaList={pelaksanaList}
                />

                <BatchPenugasanDialog
                    open={isBatchDialogOpen}
                    onOpenChange={setIsBatchDialogOpen}
                    tugasList={tugasList}
                    pelaksanaList={pelaksanaList}
                />

                <DailyTriggerDialog
                    open={isTriggerDialogOpen}
                    onOpenChange={setIsTriggerDialogOpen}
                />
            </div>
        </AppLayout>
    );
}
