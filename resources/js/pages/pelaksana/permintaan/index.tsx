import DeleteConfirmationDialog from '@/components/delete-confirmation-dialog';
import MobileLayout from '@/layouts/mobile-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { type PermintaanPeralatan, type PermintaanBbm, type MasterPeralatan } from '@/types/logbook';
import { Head, router, usePage } from '@inertiajs/react';
import { CheckCircle, Clock, Eye, FileDown, Fuel, Package, Plus, Trash2, Wrench, XCircle } from 'lucide-react';
import { useState, useMemo } from 'react';
import PeralatanFormDialog from '../peralatan/form-dialog';
import BbmFormDialog from '../bbm/form-dialog';
import BbmDetailDialogPelaksana from '../bbm/detail-dialog';

interface Props {
    permintaanPeralatan: { data: PermintaanPeralatan[] };
    permintaanBbm: { data: PermintaanBbm[] };
    masterPeralatan: MasterPeralatan[];
}

type MainTab = 'peralatan' | 'bbm';
type StatusTab = 'pending' | 'disetujui' | 'ditolak';

export default function PermintaanIndex({ permintaanPeralatan, permintaanBbm, masterPeralatan }: Props) {
    const [mainTab, setMainTab] = useState<MainTab>('peralatan');
    const [statusTab, setStatusTab] = useState<StatusTab>('pending');
    const [isPeralatanFormOpen, setIsPeralatanFormOpen] = useState(false);
    const [isBbmFormOpen, setIsBbmFormOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [bbmDetailOpen, setBbmDetailOpen] = useState(false);
    const [selectedBbm, setSelectedBbm] = useState<PermintaanBbm | null>(null);

    // Categorize peralatan
    const catPeralatan = useMemo(() => {
        const data = permintaanPeralatan.data || [];
        return {
            pending: data.filter((i) => i.status === 'pending'),
            disetujui: data.filter((i) => i.status === 'disetujui'),
            ditolak: data.filter((i) => i.status === 'ditolak'),
        };
    }, [permintaanPeralatan.data]);

    // Categorize BBM
    const catBbm = useMemo(() => {
        const data = permintaanBbm.data || [];
        return {
            pending: data.filter((i) => i.status === 'pending'),
            disetujui: data.filter((i) => i.status === 'disetujui'),
            ditolak: data.filter((i) => i.status === 'ditolak'),
        };
    }, [permintaanBbm.data]);

    const currentCat = mainTab === 'peralatan' ? catPeralatan : catBbm;
    const activeData = mainTab === 'peralatan' ? catPeralatan[statusTab] : catBbm[statusTab];

    const handleDelete = (id: number) => {
        setDeletingId(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (deletingId) {
            setIsDeleting(true);
            const url = mainTab === 'peralatan'
                ? `/pelaksana/peralatan/${deletingId}`
                : `/pelaksana/bbm/${deletingId}`;
            router.delete(url, {
                onFinish: () => {
                    setIsDeleting(false);
                    setDeleteDialogOpen(false);
                    setDeletingId(null);
                },
            });
        }
    };

    const handleViewBbmDetail = (item: PermintaanBbm) => {
        setSelectedBbm(item);
        setBbmDetailOpen(true);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <Badge variant="secondary">Menunggu</Badge>;
            case 'disetujui': return <Badge className="bg-green-600 hover:bg-green-700 text-white">Disetujui</Badge>;
            case 'ditolak': return <Badge variant="destructive">Ditolak</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Clock className="h-5 w-5 text-orange-500" />;
            case 'disetujui': return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'ditolak': return <XCircle className="h-5 w-5 text-red-500" />;
            default: return <Package className="h-5 w-5 text-muted-foreground" />;
        }
    };

    const formatBulanTahun = (bulan: number, tahun: number) => {
        const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return `${namaBulan[bulan - 1]} ${tahun}`;
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
    };

    const statusTabs: { key: StatusTab; label: string; icon: React.ReactNode; activeColor: string }[] = [
        { key: 'pending', label: 'Menunggu', icon: <Clock className="h-4 w-4" />, activeColor: 'bg-orange-500 text-white' },
        { key: 'disetujui', label: 'Disetujui', icon: <CheckCircle className="h-4 w-4" />, activeColor: 'bg-green-500 text-white' },
        { key: 'ditolak', label: 'Ditolak', icon: <XCircle className="h-4 w-4" />, activeColor: 'bg-red-500 text-white' },
    ];

    const getEmptyMessage = () => {
        const type = mainTab === 'peralatan' ? 'peralatan' : 'BBM';
        switch (statusTab) {
            case 'pending': return `Tidak ada permintaan ${type} yang menunggu.`;
            case 'disetujui': return `Belum ada permintaan ${type} yang disetujui.`;
            case 'ditolak': return `Tidak ada permintaan ${type} yang ditolak.`;
        }
    };

    return (
        <MobileLayout>
            <Head title="Permintaan" />

            <div className="min-h-screen bg-muted/20 dark:bg-slate-950 pb-20 transition-colors duration-300">
                {/* Header */}
                <div className="bg-gradient-to-br from-primary via-primary to-primary/80 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-6 pb-8 pt-8 text-primary-foreground dark:text-white transition-all duration-300">
                    <h1 className="text-2xl font-bold">Permintaan</h1>
                    <p className="opacity-90">Kelola permintaan peralatan & BBM</p>

                    {/* Summary Stats */}
                    <div className="flex gap-3 mt-4">
                        <div className="flex-1 bg-white/15 backdrop-blur-sm rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold">{currentCat.pending.length}</div>
                            <div className="text-xs opacity-80">Menunggu</div>
                        </div>
                        <div className="flex-1 bg-white/15 backdrop-blur-sm rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold">{currentCat.disetujui.length}</div>
                            <div className="text-xs opacity-80">Disetujui</div>
                        </div>
                        <div className="flex-1 bg-white/15 backdrop-blur-sm rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold">{currentCat.ditolak.length}</div>
                            <div className="text-xs opacity-80">Ditolak</div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="mt-6 px-4 space-y-3">
                    {/* Main Tabs: Peralatan vs BBM */}
                    <div className="flex rounded-lg bg-muted/60 dark:bg-slate-900 p-1 gap-1">
                        <button
                            onClick={() => setMainTab('peralatan')}
                            className={`flex-1 flex items-center justify-center gap-2 rounded-md py-3 text-sm font-medium transition-all duration-200 ${
                                mainTab === 'peralatan'
                                    ? 'bg-background dark:bg-slate-800 shadow-sm text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <Wrench className="h-4 w-4" />
                            <span>Peralatan</span>
                        </button>
                        <button
                            onClick={() => setMainTab('bbm')}
                            className={`flex-1 flex items-center justify-center gap-2 rounded-md py-3 text-sm font-medium transition-all duration-200 ${
                                mainTab === 'bbm'
                                    ? 'bg-background dark:bg-slate-800 shadow-sm text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <Fuel className="h-4 w-4" />
                            <span>BBM</span>
                        </button>
                    </div>

                    {/* Add Button */}
                    <Button
                        onClick={() => mainTab === 'peralatan' ? setIsPeralatanFormOpen(true) : setIsBbmFormOpen(true)}
                        className="w-full"
                        size="lg"
                    >
                        <Plus className="mr-2 h-5 w-5" />
                        Buat Permintaan {mainTab === 'peralatan' ? 'Peralatan' : 'BBM'}
                    </Button>

                    {/* Status Tabs */}
                    <div className="flex rounded-lg bg-muted/60 dark:bg-slate-900 p-1 gap-1">
                        {statusTabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setStatusTab(tab.key)}
                                className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2.5 text-xs font-medium transition-all duration-200 ${
                                    statusTab === tab.key
                                        ? tab.activeColor + ' shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                }`}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                                <span className={`ml-0.5 inline-flex items-center justify-center rounded-full text-[10px] font-bold min-w-[18px] h-[18px] px-1 ${
                                    statusTab === tab.key ? 'bg-white/25' : 'bg-muted-foreground/15'
                                }`}>
                                    {currentCat[tab.key].length}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Cards */}
                    {activeData.length === 0 ? (
                        <Card className="border-dashed shadow-none">
                            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <Package className="h-12 w-12 mb-3 opacity-20" />
                                <p className="text-sm">{getEmptyMessage()}</p>
                            </CardContent>
                        </Card>
                    ) : mainTab === 'peralatan' ? (
                        /* Peralatan Cards */
                        (activeData as PermintaanPeralatan[]).map((item) => (
                            <Card key={item.id} className="shadow-sm">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-start gap-3">
                                            {getStatusIcon(item.status)}
                                            <div>
                                                <h3 className="font-semibold">{formatBulanTahun(item.bulan, item.tahun)}</h3>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {new Date(item.waktu_pengajuan).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                        {getStatusBadge(item.status)}
                                    </div>
                                    <div className="bg-muted/50 rounded-md p-3 mb-3">
                                        <div className="text-xs text-muted-foreground mb-1">Daftar Peralatan ({item.details?.length || 0} item)</div>
                                        <div className="space-y-1">
                                            {item.details?.slice(0, 3).map((d) => (
                                                <div key={d.id} className="text-sm flex justify-between">
                                                    <span>{d.nama_peralatan}</span>
                                                    <span className="text-muted-foreground">{d.jumlah} {d.satuan}</span>
                                                </div>
                                            ))}
                                            {(item.details?.length || 0) > 3 && (
                                                <div className="text-xs text-muted-foreground">+{(item.details?.length || 0) - 3} item lainnya</div>
                                            )}
                                        </div>
                                    </div>
                                    {item.catatan && (
                                        <div className="mb-3">
                                            <div className="text-xs text-muted-foreground mb-1">Catatan</div>
                                            <p className="text-sm">{item.catatan}</p>
                                        </div>
                                    )}
                                    {item.status !== 'pending' && item.waktu_persetujuan && (
                                        <div className="mb-3 text-xs text-muted-foreground">
                                            Diproses pada {new Date(item.waktu_persetujuan).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="flex-1" asChild>
                                            <a href={`/permintaan-peralatan/${item.id}/export-pdf`} target="_blank" rel="noreferrer">
                                                <FileDown className="mr-2 h-4 w-4" />Export PDF
                                            </a>
                                        </Button>
                                        {item.status === 'pending' && (
                                            <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleDelete(item.id)}>
                                                <Trash2 className="mr-2 h-4 w-4" />Hapus
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        /* BBM Cards */
                        (activeData as PermintaanBbm[]).map((item) => (
                            <Card key={item.id} className="shadow-sm">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-start gap-3">
                                            {getStatusIcon(item.status)}
                                            <div>
                                                <h3 className="font-semibold">{item.nama_kendaraan}</h3>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    {' • '}No. {item.no_buku}
                                                </p>
                                            </div>
                                        </div>
                                        {getStatusBadge(item.status)}
                                    </div>

                                    {/* Vehicle Info */}
                                    <div className="bg-muted/50 rounded-md p-3 mb-3 text-sm space-y-1">
                                        <div className="text-xs text-muted-foreground mb-1">{item.merk_kendaraan} • {item.no_polisi}</div>
                                        <div className="text-xs text-muted-foreground">{item.uraian}</div>
                                    </div>

                                    {/* BBM Info */}
                                    <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                                        <div className="bg-muted/30 rounded-md p-2">
                                            <div className="text-xs text-muted-foreground">BBM</div>
                                            <div className="text-sm font-semibold">{item.bbm_liter} Ltr</div>
                                        </div>
                                        <div className="bg-muted/30 rounded-md p-2">
                                            <div className="text-xs text-muted-foreground">Harga/Ltr</div>
                                            <div className="text-sm font-semibold">{formatCurrency(item.bbm_harga_per_liter)}</div>
                                        </div>
                                        <div className="bg-muted/30 rounded-md p-2">
                                            <div className="text-xs text-muted-foreground">Total</div>
                                            <div className="text-sm font-bold text-primary">{formatCurrency(item.bbm_total_harga)}</div>
                                        </div>
                                    </div>

                                    {/* KM */}
                                    <div className="flex justify-between text-xs text-muted-foreground mb-3">
                                        <span>KM: {Number(item.km_awal).toLocaleString('id-ID')} → {item.km_akhir ? Number(item.km_akhir).toLocaleString('id-ID') : '–'}</span>
                                    </div>

                                    {item.catatan && (
                                        <div className="mb-3">
                                            <div className="text-xs text-muted-foreground mb-1">Catatan</div>
                                            <p className="text-sm">{item.catatan}</p>
                                        </div>
                                    )}

                                    {item.status !== 'pending' && item.waktu_persetujuan && (
                                        <div className="mb-3 text-xs text-muted-foreground">
                                            Diproses pada {new Date(item.waktu_persetujuan).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="flex-1" onClick={() => handleViewBbmDetail(item)}>
                                            <Eye className="mr-2 h-4 w-4" />Detail
                                        </Button>
                                        <Button variant="outline" size="sm" className="flex-1" asChild>
                                            <a href={`/permintaan-bbm/${item.id}/export-pdf`} target="_blank" rel="noreferrer">
                                                <FileDown className="mr-2 h-4 w-4" />PDF
                                            </a>
                                        </Button>
                                        {item.status === 'pending' && (
                                            <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            <PeralatanFormDialog open={isPeralatanFormOpen} onOpenChange={setIsPeralatanFormOpen} masterPeralatan={masterPeralatan || []} />
            <BbmFormDialog open={isBbmFormOpen} onOpenChange={setIsBbmFormOpen} />
            <BbmDetailDialogPelaksana open={bbmDetailOpen} onOpenChange={setBbmDetailOpen} permintaan={selectedBbm} />

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={confirmDelete}
                title="Hapus Permintaan"
                description="Apakah anda yakin ingin menghapus permintaan ini? Tindakan ini tidak dapat dibatalkan."
                isDeleting={isDeleting}
            />
        </MobileLayout>
    );
}
