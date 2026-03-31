import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
    AlertTriangle,
    CalendarIcon,
    CheckCircle2,
    ChevronDown,
    Clock,
    Copy,
    ExternalLink,
    Key,
    Loader2,
    Play,
    RefreshCw,
    Server,
    Terminal,
    XCircle,
    Zap,
    Info,
} from 'lucide-react';
import { useState, useCallback } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Penjadwalan', href: '/admin/jadwal' },
];

interface LogEntry {
    id: number;
    tanggal_target: string;
    tipe_diproses: string;
    template_count: number;
    penugasan_count: number;
    skipped_holiday: boolean;
    holiday_name: string | null;
    status: string;
    error_message: string | null;
    triggered_by: string;
    detail: string | null;
    created_at: string;
}

interface Props {
    logs: {
        data: LogEntry[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    templateStats: Record<string, number>;
    totalActiveTemplates: number;
    latestExecution: LogEntry | null;
    lastSuccess: LogEntry | null;
    todayRan: boolean;
    cronKey: string | null;
    cronKeyMasked: string | null;
    appUrl: string;
    filters: {
        status?: string;
        date_from?: string;
        date_to?: string;
    };
}

const TIPE_LABELS: Record<string, string> = {
    harian: 'Harian',
    mingguan: 'Mingguan',
    bulanan: 'Bulanan',
    tahunan: 'Tahunan',
    lainnya: 'Lainnya',
};

const TIPE_COLORS: Record<string, string> = {
    harian: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    mingguan: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
    bulanan: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    tahunan: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    lainnya: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

export default function JadwalIndex({
    logs,
    templateStats,
    totalActiveTemplates,
    latestExecution,
    lastSuccess,
    todayRan,
    cronKey,
    cronKeyMasked,
    appUrl,
    filters,
}: Props) {
    const [manualDialogOpen, setManualDialogOpen] = useState(false);
    const [manualDate, setManualDate] = useState<Date | undefined>(new Date());
    const [skipHoliday, setSkipHoliday] = useState(false);
    const [forceRun, setForceRun] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [showKey, setShowKey] = useState(false);
    const [guideOpen, setGuideOpen] = useState(false);
    const [regenerating, setRegenerating] = useState(false);

    const cronUrl = `${appUrl}/cron/schedule?key=${cronKey || 'YOUR_SECRET_KEY'}`;

    const handleManualRun = () => {
        if (!manualDate) return;
        setProcessing(true);

        router.post('/admin/jadwal/run', {
            tanggal: format(manualDate, 'yyyy-MM-dd'),
            skip_holiday_check: skipHoliday,
            force: forceRun,
        }, {
            onFinish: () => {
                setProcessing(false);
                setManualDialogOpen(false);
                setSkipHoliday(false);
                setForceRun(false);
            },
        });
    };

    const handleRegenerateKey = () => {
        if (!confirm('Generate secret key baru? Key lama tidak bisa dipakai lagi. Pastikan update di cPanel.')) return;
        setRegenerating(true);
        router.post('/admin/jadwal/regenerate-key', {}, {
            onFinish: () => setRegenerating(false),
        });
    };

    const copyToClipboard = useCallback((text: string) => {
        navigator.clipboard.writeText(text);
    }, []);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'success':
                return <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600"><CheckCircle2 className="h-3 w-3 mr-1" />Sukses</Badge>;
            case 'failed':
                return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Gagal</Badge>;
            case 'skipped':
                return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Dilewati</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getTriggeredByBadge = (by: string) => {
        return by === 'cron'
            ? <Badge variant="outline" className="text-xs"><Server className="h-3 w-3 mr-1" />Cron</Badge>
            : <Badge variant="outline" className="text-xs"><Play className="h-3 w-3 mr-1" />Manual</Badge>;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Penjadwalan" />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Penjadwalan Otomatis</h2>
                        <p className="text-muted-foreground">
                            Kelola scheduling otomatis template penugasan via cron job
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => router.reload()}
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                        <Button onClick={() => setManualDialogOpen(true)}>
                            <Zap className="h-4 w-4 mr-2" />
                            Jalankan Manual
                        </Button>
                    </div>
                </div>

                {/* Status Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Cron Health */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "p-2 rounded-full",
                                    todayRan ? "bg-emerald-100 dark:bg-emerald-900" : "bg-amber-100 dark:bg-amber-900"
                                )}>
                                    {todayRan
                                        ? <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                        : <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                    }
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Hari Ini</p>
                                    <p className="text-sm font-semibold">
                                        {todayRan ? 'Sudah dijalankan' : 'Belum dijalankan'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Total Active Templates */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                                    <Server className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Template Aktif</p>
                                    <p className="text-sm font-semibold">{totalActiveTemplates} template</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Last Success */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900">
                                    <Zap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Sukses Terakhir</p>
                                    <p className="text-sm font-semibold">
                                        {lastSuccess
                                            ? format(new Date(lastSuccess.created_at), 'd MMM yyyy HH:mm', { locale: id })
                                            : 'Belum pernah'}
                                    </p>
                                    {lastSuccess && (
                                        <p className="text-xs text-muted-foreground">
                                            {lastSuccess.penugasan_count} penugasan
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Latest Execution */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "p-2 rounded-full",
                                    latestExecution?.status === 'success' ? "bg-emerald-100 dark:bg-emerald-900" :
                                    latestExecution?.status === 'failed' ? "bg-red-100 dark:bg-red-900" :
                                    "bg-gray-100 dark:bg-gray-800"
                                )}>
                                    <RefreshCw className={cn(
                                        "h-5 w-5",
                                        latestExecution?.status === 'success' ? "text-emerald-600 dark:text-emerald-400" :
                                        latestExecution?.status === 'failed' ? "text-red-600 dark:text-red-400" :
                                        "text-gray-600 dark:text-gray-400"
                                    )} />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Eksekusi Terakhir</p>
                                    <p className="text-sm font-semibold">
                                        {latestExecution
                                            ? format(new Date(latestExecution.created_at), 'd MMM HH:mm', { locale: id })
                                            : 'Belum ada'}
                                    </p>
                                    {latestExecution && getStatusBadge(latestExecution.status)}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Template Stats per Tipe */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Template Aktif per Tipe</CardTitle>
                        <CardDescription>Jadwal otomatis berdasarkan tipe template</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            {Object.entries(TIPE_LABELS).map(([key, label]) => {
                                const count = templateStats[key] || 0;
                                const scheduleDesc: Record<string, string> = {
                                    harian: 'Setiap hari',
                                    mingguan: 'Setiap Senin',
                                    bulanan: 'Setiap tgl 1',
                                    tahunan: 'Setiap 1 Jan',
                                    lainnya: 'Manual saja',
                                };
                                return (
                                    <div
                                        key={key}
                                        className={cn(
                                            "rounded-lg border p-3 text-center transition-colors",
                                            count > 0 ? "border-primary/20 bg-primary/5" : "opacity-50"
                                        )}
                                    >
                                        <span className={cn("inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", TIPE_COLORS[key])}>
                                            {label}
                                        </span>
                                        <p className="text-2xl font-bold mt-1">{count}</p>
                                        <p className="text-[10px] text-muted-foreground">{scheduleDesc[key]}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Setup Guide */}
                <Collapsible open={guideOpen} onOpenChange={setGuideOpen}>
                    <Card>
                        <CollapsibleTrigger asChild>
                            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900">
                                            <Terminal className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">Panduan Setup Cron Job cPanel</CardTitle>
                                            <CardDescription>Langkah-langkah konfigurasi auto-scheduling di shared hosting</CardDescription>
                                        </div>
                                    </div>
                                    <ChevronDown className={cn("h-5 w-5 transition-transform", guideOpen && "rotate-180")} />
                                </div>
                            </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <CardContent className="space-y-6">
                                {/* Secret Key Management */}
                                <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
                                    <div className="flex items-center justify-between">
                                        <Label className="flex items-center gap-2 text-sm font-semibold">
                                            <Key className="h-4 w-4" />
                                            Secret Key
                                        </Label>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setShowKey(!showKey)}
                                            >
                                                {showKey ? 'Sembunyikan' : 'Tampilkan'}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleRegenerateKey}
                                                disabled={regenerating}
                                            >
                                                {regenerating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                                                Generate Baru
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Input
                                            readOnly
                                            value={showKey ? (cronKey || 'Belum ada key') : (cronKeyMasked || '••••••••')}
                                            className="font-mono text-sm"
                                        />
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => cronKey && copyToClipboard(cronKey)}
                                            title="Copy key"
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    {!cronKey && (
                                        <Alert>
                                            <AlertTriangle className="h-4 w-4" />
                                            <AlertDescription>
                                                Secret key belum dikonfigurasi. Klik "Generate Baru" untuk membuat key, atau tambahkan <code className="bg-muted px-1 rounded">CRON_SECRET_KEY=your-key</code> di file <code className="bg-muted px-1 rounded">.env</code>.
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </div>

                                {/* Steps */}
                                <div className="space-y-4">
                                    <h4 className="font-semibold">Langkah-langkah Setup:</h4>

                                    <div className="space-y-4">
                                        {/* Step 1 */}
                                        <div className="flex gap-3">
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</div>
                                            <div className="flex-1">
                                                <p className="font-medium">Login ke cPanel</p>
                                                <p className="text-sm text-muted-foreground">Buka cPanel hosting Anda dan cari menu <strong>"Cron Jobs"</strong> atau <strong>"Scheduled Tasks"</strong>.</p>
                                            </div>
                                        </div>

                                        {/* Step 2 */}
                                        <div className="flex gap-3">
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</div>
                                            <div className="flex-1">
                                                <p className="font-medium">Atur Interval</p>
                                                <p className="text-sm text-muted-foreground">Pilih <strong>"Once Per Day"</strong> atau set manual: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">5 0 * * *</code> (jam 00:05 setiap hari)</p>
                                                <div className="mt-2 rounded border p-2 bg-muted/50">
                                                    <p className="text-xs text-muted-foreground mb-1">Penjelasan cron expression:</p>
                                                    <code className="text-xs">5 0 * * * = Menit 5, Jam 0, Setiap hari, Setiap bulan, Setiap hari minggu</code>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Step 3 */}
                                        <div className="flex gap-3">
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">3</div>
                                            <div className="flex-1">
                                                <p className="font-medium">Masukkan Command</p>
                                                <p className="text-sm text-muted-foreground mb-2">Copy salah satu command berikut dan paste di field "Command":</p>

                                                <div className="space-y-3">
                                                    {/* cURL option */}
                                                    <div className="rounded border p-3 bg-slate-950 text-slate-100">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-[10px] uppercase tracking-wider text-slate-400">Opsi 1: cURL (Recommended)</span>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 px-2 text-slate-400 hover:text-white hover:bg-slate-800"
                                                                onClick={() => copyToClipboard(`curl -s "${cronUrl}" > /dev/null 2>&1`)}
                                                            >
                                                                <Copy className="h-3 w-3 mr-1" />
                                                                Copy
                                                            </Button>
                                                        </div>
                                                        <code className="text-xs break-all font-mono">
                                                            curl -s "{cronUrl}" {'>'} /dev/null 2{'>'}&1
                                                        </code>
                                                    </div>

                                                    {/* wget option */}
                                                    <div className="rounded border p-3 bg-slate-950 text-slate-100">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-[10px] uppercase tracking-wider text-slate-400">Opsi 2: wget</span>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 px-2 text-slate-400 hover:text-white hover:bg-slate-800"
                                                                onClick={() => copyToClipboard(`wget -qO /dev/null "${cronUrl}"`)}
                                                            >
                                                                <Copy className="h-3 w-3 mr-1" />
                                                                Copy
                                                            </Button>
                                                        </div>
                                                        <code className="text-xs break-all font-mono">
                                                            wget -qO /dev/null "{cronUrl}"
                                                        </code>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Step 4 */}
                                        <div className="flex gap-3">
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">4</div>
                                            <div className="flex-1">
                                                <p className="font-medium">Simpan & Verifikasi</p>
                                                <p className="text-sm text-muted-foreground">Klik "Add Cron Job" di cPanel. Besok cek halaman ini apakah ada log eksekusi baru.</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Test */}
                                    <div className="rounded-lg border p-4 bg-blue-50 dark:bg-blue-950/20 space-y-2">
                                        <div className="flex items-center gap-2 text-sm font-medium text-blue-800 dark:text-blue-200">
                                            <Info className="h-4 w-4" />
                                            Test Koneksi
                                        </div>
                                        <p className="text-xs text-blue-700 dark:text-blue-300">
                                            Untuk test apakah endpoint bisa diakses, buka URL berikut di browser:
                                        </p>
                                        <div className="flex gap-2">
                                            <Input
                                                readOnly
                                                value={cronUrl}
                                                className="text-xs font-mono"
                                            />
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => window.open(cronUrl, '_blank')}
                                                title="Buka di tab baru"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </CollapsibleContent>
                    </Card>
                </Collapsible>

                {/* Execution Log Table */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <CardTitle className="text-base">Riwayat Eksekusi</CardTitle>
                                <CardDescription>{logs.total} total log</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Select
                                    value={filters.status || 'all'}
                                    onValueChange={(value) => {
                                        router.get('/admin/jadwal', {
                                            ...filters,
                                            status: value === 'all' ? undefined : value,
                                        }, { preserveState: true });
                                    }}
                                >
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Status</SelectItem>
                                        <SelectItem value="success">Sukses</SelectItem>
                                        <SelectItem value="failed">Gagal</SelectItem>
                                        <SelectItem value="skipped">Dilewati</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tanggal Target</TableHead>
                                        <TableHead>Tipe</TableHead>
                                        <TableHead className="text-center">Template</TableHead>
                                        <TableHead className="text-center">Penugasan</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Trigger</TableHead>
                                        <TableHead>Waktu</TableHead>
                                        <TableHead>Keterangan</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                                <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                                <p>Belum ada riwayat eksekusi</p>
                                                <p className="text-xs">Jalankan schedule manual atau tunggu cron job berjalan.</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        logs.data.map((log) => (
                                            <TableRow key={log.id}>
                                                <TableCell className="font-medium">
                                                    {format(new Date(log.tanggal_target), 'd MMM yyyy', { locale: id })}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {log.tipe_diproses.split(',').map((tipe) => (
                                                            <span
                                                                key={tipe}
                                                                className={cn(
                                                                    "inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                                                                    TIPE_COLORS[tipe] || 'bg-gray-100 text-gray-700'
                                                                )}
                                                            >
                                                                {TIPE_LABELS[tipe] || tipe}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">{log.template_count}</TableCell>
                                                <TableCell className="text-center font-semibold">{log.penugasan_count}</TableCell>
                                                <TableCell>{getStatusBadge(log.status)}</TableCell>
                                                <TableCell>{getTriggeredByBadge(log.triggered_by)}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {format(new Date(log.created_at), 'HH:mm:ss', { locale: id })}
                                                </TableCell>
                                                <TableCell className="text-xs max-w-[200px] truncate">
                                                    {log.skipped_holiday && (
                                                        <span className="text-amber-600">Libur: {log.holiday_name}</span>
                                                    )}
                                                    {log.error_message && (
                                                        <span className="text-red-600">{log.error_message}</span>
                                                    )}
                                                    {!log.skipped_holiday && !log.error_message && log.status === 'success' && log.penugasan_count > 0 && (
                                                        <span className="text-emerald-600">{log.penugasan_count} penugasan dibuat</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {logs.last_page > 1 && (
                            <div className="flex justify-center gap-1 mt-4">
                                {logs.links.map((link, i) => (
                                    <Button
                                        key={i}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url)}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className="min-w-[36px]"
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Manual Run Dialog */}
            <Dialog open={manualDialogOpen} onOpenChange={setManualDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Jalankan Schedule Manual</DialogTitle>
                        <DialogDescription>
                            Trigger scheduling template penugasan untuk tanggal tertentu.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <Label>Tanggal Target</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn("w-full justify-start text-left font-normal", !manualDate && "text-muted-foreground")}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {manualDate ? format(manualDate, 'PPP', { locale: id }) : 'Pilih tanggal'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={manualDate}
                                        onSelect={(date: Date | undefined) => setManualDate(date)}
                                        initialFocus
                                        locale={id}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                                <Label htmlFor="skip-holiday">Skip Cek Hari Libur</Label>
                                <p className="text-xs text-muted-foreground">Jalankan meskipun tanggal libur</p>
                            </div>
                            <Switch id="skip-holiday" checked={skipHoliday} onCheckedChange={setSkipHoliday} />
                        </div>

                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                                <Label htmlFor="force-run">Paksa Jalankan</Label>
                                <p className="text-xs text-muted-foreground">Jalankan meskipun sudah pernah jalan hari ini</p>
                            </div>
                            <Switch id="force-run" checked={forceRun} onCheckedChange={setForceRun} />
                        </div>

                        {todayRan && manualDate && format(manualDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && !forceRun && (
                            <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    Schedule sudah dijalankan hari ini. Aktifkan "Paksa Jalankan" untuk menjalankan ulang.
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setManualDialogOpen(false)}>
                            Batal
                        </Button>
                        <Button onClick={handleManualRun} disabled={processing || !manualDate}>
                            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Jalankan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
