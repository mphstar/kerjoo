import DeleteConfirmationDialog from '@/components/delete-confirmation-dialog';
import MobileLayout from '@/layouts/mobile-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { type PermintaanPeralatan, type MasterPeralatan } from '@/types/logbook';
import { Head, router, usePage } from '@inertiajs/react';
import { CheckCircle, Clock, FileDown, Package, Plus, Trash2, XCircle } from 'lucide-react';
import { useState, useMemo } from 'react';
import PeralatanFormDialog from './form-dialog';

interface Props {
    permintaan: {
        data: PermintaanPeralatan[];
    };
    masterPeralatan: MasterPeralatan[];
}

type TabKey = 'pending' | 'disetujui' | 'ditolak';

export default function PeralatanIndex({ permintaan, masterPeralatan }: Props) {
    const { url } = usePage();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [activeTab, setActiveTab] = useState<TabKey>('pending');

    // Categorize data
    const categorized = useMemo(() => {
        const data = permintaan.data || [];
        return {
            pending: data.filter((item) => item.status === 'pending'),
            disetujui: data.filter((item) => item.status === 'disetujui'),
            ditolak: data.filter((item) => item.status === 'ditolak'),
        };
    }, [permintaan.data]);

    const activeData = categorized[activeTab];

    const handleDelete = (id: number) => {
        setDeletingId(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (deletingId) {
            setIsDeleting(true);
            router.delete(`/pelaksana/peralatan/${deletingId}`, {
                onFinish: () => {
                    setIsDeleting(false);
                    setDeleteDialogOpen(false);
                    setDeletingId(null);
                },
            });
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <Clock className="h-5 w-5 text-orange-500" />;
            case 'disetujui':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'ditolak':
                return <XCircle className="h-5 w-5 text-red-500" />;
            default:
                return <Package className="h-5 w-5 text-muted-foreground" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="secondary">Menunggu</Badge>;
            case 'disetujui':
                return <Badge className="bg-green-600 hover:bg-green-700 text-white">Disetujui</Badge>;
            case 'ditolak':
                return <Badge variant="destructive">Ditolak</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const formatBulanTahun = (bulan: number, tahun: number) => {
        const namaBulan = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        return `${namaBulan[bulan - 1]} ${tahun}`;
    };

    const tabs: { key: TabKey; label: string; icon: React.ReactNode; color: string; activeColor: string }[] = [
        {
            key: 'pending',
            label: 'Menunggu',
            icon: <Clock className="h-4 w-4" />,
            color: 'text-orange-500',
            activeColor: 'bg-orange-500 text-white',
        },
        {
            key: 'disetujui',
            label: 'Disetujui',
            icon: <CheckCircle className="h-4 w-4" />,
            color: 'text-green-500',
            activeColor: 'bg-green-500 text-white',
        },
        {
            key: 'ditolak',
            label: 'Ditolak',
            icon: <XCircle className="h-4 w-4" />,
            color: 'text-red-500',
            activeColor: 'bg-red-500 text-white',
        },
    ];

    const getEmptyMessage = (tab: TabKey) => {
        switch (tab) {
            case 'pending':
                return 'Tidak ada permintaan yang menunggu persetujuan.';
            case 'disetujui':
                return 'Belum ada permintaan yang disetujui.';
            case 'ditolak':
                return 'Tidak ada permintaan yang ditolak.';
        }
    };

    return (
        <MobileLayout>
            <Head title="Permintaan Peralatan" />

            <div className="min-h-screen bg-muted/20 dark:bg-slate-950 pb-20 transition-colors duration-300">
                {/* Header */}
                <div className="bg-gradient-to-br from-primary via-primary to-primary/80 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-6 pb-8 pt-8 text-primary-foreground dark:text-white transition-all duration-300">
                    <h1 className="text-2xl font-bold">Permintaan Peralatan</h1>
                    <p className="opacity-90">Kelola permintaan peralatan kerja</p>

                    {/* Summary Stats */}
                    <div className="flex gap-3 mt-4">
                        <div className="flex-1 bg-white/15 backdrop-blur-sm rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold">{categorized.pending.length}</div>
                            <div className="text-xs opacity-80">Menunggu</div>
                        </div>
                        <div className="flex-1 bg-white/15 backdrop-blur-sm rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold">{categorized.disetujui.length}</div>
                            <div className="text-xs opacity-80">Disetujui</div>
                        </div>
                        <div className="flex-1 bg-white/15 backdrop-blur-sm rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold">{categorized.ditolak.length}</div>
                            <div className="text-xs opacity-80">Ditolak</div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="mt-6 px-4 space-y-3">
                    {/* Add Button */}
                    <Button onClick={() => setIsFormOpen(true)} className="w-full" size="lg">
                        <Plus className="mr-2 h-5 w-5" />
                        Buat Permintaan Baru
                    </Button>

                    {/* Tabs */}
                    <div className="flex rounded-lg bg-muted/60 dark:bg-slate-900 p-1 gap-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2.5 text-xs font-medium transition-all duration-200 ${
                                    activeTab === tab.key
                                        ? tab.activeColor + ' shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                }`}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                                <span
                                    className={`ml-0.5 inline-flex items-center justify-center rounded-full text-[10px] font-bold min-w-[18px] h-[18px] px-1 ${
                                        activeTab === tab.key
                                            ? 'bg-white/25'
                                            : 'bg-muted-foreground/15'
                                    }`}
                                >
                                    {categorized[tab.key].length}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Request Cards */}
                    {activeData.length === 0 ? (
                        <Card className="border-dashed shadow-none">
                            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <Package className="h-12 w-12 mb-3 opacity-20" />
                                <p className="text-sm">{getEmptyMessage(activeTab)}</p>
                                {activeTab === 'pending' && (
                                    <p className="text-xs mt-1">Buat permintaan baru untuk memulai.</p>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        activeData.map((item) => (
                            <Card key={item.id} className="shadow-sm">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-start gap-3">
                                            {getStatusIcon(item.status)}
                                            <div>
                                                <h3 className="font-semibold">
                                                    {formatBulanTahun(item.bulan, item.tahun)}
                                                </h3>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {new Date(item.waktu_pengajuan).toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        {getStatusBadge(item.status)}
                                    </div>

                                    {/* Items Summary */}
                                    <div className="bg-muted/50 rounded-md p-3 mb-3">
                                        <div className="text-xs text-muted-foreground mb-1">
                                            Daftar Peralatan ({item.details?.length || 0} item)
                                        </div>
                                        <div className="space-y-1">
                                            {item.details?.slice(0, 3).map((detail) => (
                                                <div key={detail.id} className="text-sm flex justify-between">
                                                    <span>{detail.nama_peralatan}</span>
                                                    <span className="text-muted-foreground">
                                                        {detail.jumlah} {detail.satuan}
                                                    </span>
                                                </div>
                                            ))}
                                            {(item.details?.length || 0) > 3 && (
                                                <div className="text-xs text-muted-foreground">
                                                    +{(item.details?.length || 0) - 3} item lainnya
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Catatan */}
                                    {item.catatan && (
                                        <div className="mb-3">
                                            <div className="text-xs text-muted-foreground mb-1">Catatan</div>
                                            <p className="text-sm">{item.catatan}</p>
                                        </div>
                                    )}

                                    {/* Approval Info */}
                                    {item.status !== 'pending' && item.waktu_persetujuan && (
                                        <div className="mb-3 text-xs text-muted-foreground">
                                            Diproses pada{' '}
                                            {new Date(item.waktu_persetujuan).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        {/* Export PDF - Available for all statuses */}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                            asChild
                                        >
                                            <a
                                                href={`/permintaan-peralatan/${item.id}/export-pdf`}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                <FileDown className="mr-2 h-4 w-4" />
                                                Export PDF
                                            </a>
                                        </Button>

                                        {/* Delete - Only for pending */}
                                        {item.status === 'pending' && (
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => handleDelete(item.id)}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Hapus
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            <PeralatanFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} masterPeralatan={masterPeralatan || []} />

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={confirmDelete}
                title="Hapus Permintaan"
                description="Apakah anda yakin ingin menghapus permintaan peralatan ini? Tindakan ini tidak dapat dibatalkan."
                isDeleting={isDeleting}
            />
        </MobileLayout>
    );
}
