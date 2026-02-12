import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { TemplatePenugasanHarian, HariLibur } from '@/types/logbook';
import { router } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { AlertTriangle, Calendar, Loader2, Zap, Moon, Users } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';

const TIPE_FILTERS = [
    { value: 'semua', label: 'Semua' },
    { value: 'harian', label: 'Harian' },
    { value: 'mingguan', label: 'Mingguan' },
    { value: 'bulanan', label: 'Bulanan' },
    { value: 'tahunan', label: 'Tahunan' },
    { value: 'lainnya', label: 'Lainnya' },
];

const TIPE_COLORS: Record<string, string> = {
    harian: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    mingguan: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
    bulanan: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    tahunan: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    lainnya: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export default function DailyTriggerDialog({ open, onOpenChange, onSuccess }: Props) {
    const [templates, setTemplates] = useState<TemplatePenugasanHarian[]>([]);
    const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
    const [targetDate, setTargetDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [activeFilter, setActiveFilter] = useState('semua');
    const [isHoliday, setIsHoliday] = useState(false);
    const [holidayInfo, setHolidayInfo] = useState<HariLibur | null>(null);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Fetch templates on mount
    useEffect(() => {
        if (open) {
            fetch('/admin/template-harian/list')
                .then((res) => res.json())
                .then((data) => setTemplates(data))
                .catch((err) => console.error('Failed to load templates:', err));
        }
    }, [open]);

    // Check holiday when date changes
    useEffect(() => {
        if (targetDate) {
            fetch(`/admin/hari-libur/check?tanggal=${targetDate}`)
                .then((res) => res.json())
                .then((data) => {
                    setIsHoliday(data.is_holiday);
                    setHolidayInfo(data.holiday);
                })
                .catch((err) => console.error('Failed to check holiday:', err));
        }
    }, [targetDate]);

    // Filter templates by tipe
    const filteredTemplates = useMemo(() => {
        if (activeFilter === 'semua') return templates;
        return templates.filter(t => t.tipe === activeFilter);
    }, [templates, activeFilter]);

    // Count templates per tipe
    const tipeCounts = useMemo(() => {
        const counts: Record<string, number> = { semua: templates.length };
        templates.forEach(t => {
            counts[t.tipe] = (counts[t.tipe] || 0) + 1;
        });
        return counts;
    }, [templates]);

    // Calculate total items from selected templates
    const selectedInfo = useMemo(() => {
        const selected = templates.filter(t => selectedTemplateIds.includes(t.id.toString()));
        const totalItems = selected.reduce((acc, t) => acc + (t.items?.length || 0), 0);
        const hasShiftMalam = selected.some(t => t.deadline_hari_berikutnya);
        return { count: selected.length, totalItems, hasShiftMalam };
    }, [templates, selectedTemplateIds]);

    const toggleTemplate = (templateId: string) => {
        setSelectedTemplateIds(prev =>
            prev.includes(templateId)
                ? prev.filter(id => id !== templateId)
                : [...prev, templateId]
        );
    };

    const toggleAllFiltered = () => {
        const filteredIds = filteredTemplates.map(t => t.id.toString());
        const allSelected = filteredIds.every(id => selectedTemplateIds.includes(id));
        if (allSelected) {
            setSelectedTemplateIds(prev => prev.filter(id => !filteredIds.includes(id)));
        } else {
            setSelectedTemplateIds(prev => [...new Set([...prev, ...filteredIds])]);
        }
    };

    const handleTrigger = (skipHolidayCheck: boolean = false) => {
        if (selectedTemplateIds.length === 0) {
            setError('Pilih minimal satu template');
            return;
        }

        setProcessing(true);
        setError(null);
        setSuccess(null);

        router.post(
            '/admin/template-harian/trigger',
            {
                template_ids: selectedTemplateIds,
                tanggal: targetDate,
                skip_holiday_check: skipHolidayCheck,
            },
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    const flash = (page.props as { flash?: { success?: string; error?: string; is_holiday?: boolean; holiday?: HariLibur } }).flash;
                    if (flash?.success) {
                        setSuccess(flash.success);
                        setTimeout(() => {
                            onOpenChange(false);
                            onSuccess?.();
                        }, 1500);
                    } else if (flash?.error) {
                        if (flash.is_holiday) {
                            setIsHoliday(true);
                            setHolidayInfo(flash.holiday || null);
                        }
                        setError(flash.error);
                    }
                },
                onError: (errors) => {
                    const errorMessage = Object.values(errors).flat().join(', ');
                    setError(errorMessage || 'Terjadi kesalahan saat memproses trigger');
                },
                onFinish: () => {
                    setProcessing(false);
                },
            }
        );
    };

    const resetState = () => {
        setSelectedTemplateIds([]);
        setTargetDate(format(new Date(), 'yyyy-MM-dd'));
        setActiveFilter('semua');
        setIsHoliday(false);
        setHolidayInfo(null);
        setError(null);
        setSuccess(null);
    };

    useEffect(() => {
        if (!open) {
            resetState();
        }
    }, [open]);

    const filteredSelectedCount = filteredTemplates.filter(t =>
        selectedTemplateIds.includes(t.id.toString())
    ).length;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-500" />
                        Trigger Penugasan
                    </DialogTitle>
                    <DialogDescription>
                        Pilih template untuk membuat penugasan otomatis
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4 overflow-y-auto flex-1">
                    {/* Tipe Filter Tabs */}
                    <div className="flex flex-wrap gap-1.5">
                        {TIPE_FILTERS.map(filter => {
                            const count = tipeCounts[filter.value] || 0;
                            if (filter.value !== 'semua' && count === 0) return null;
                            return (
                                <button
                                    key={filter.value}
                                    type="button"
                                    onClick={() => setActiveFilter(filter.value)}
                                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${activeFilter === filter.value
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                        }`}
                                >
                                    {filter.label}
                                    <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] ${activeFilter === filter.value
                                            ? 'bg-primary-foreground/20'
                                            : 'bg-background'
                                        }`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Template Multi-Select */}
                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <Label>Template ({selectedTemplateIds.length} dipilih)</Label>
                            {filteredTemplates.length > 0 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto py-1 px-2 text-xs"
                                    onClick={toggleAllFiltered}
                                >
                                    {filteredSelectedCount === filteredTemplates.length ? 'Batal Semua' : 'Pilih Semua'}
                                </Button>
                            )}
                        </div>
                        <div className="border rounded-md max-h-56 overflow-y-auto">
                            {templates.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4 px-3">
                                    Belum ada template aktif.{' '}
                                    <a href="/admin/template-harian" className="text-primary underline">
                                        Buat template
                                    </a>
                                </p>
                            ) : filteredTemplates.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4 px-3">
                                    Tidak ada template untuk tipe ini
                                </p>
                            ) : (
                                filteredTemplates.map((template) => (
                                    <label
                                        key={template.id}
                                        className="flex items-start gap-3 p-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0 transition-colors"
                                    >
                                        <Checkbox
                                            checked={selectedTemplateIds.includes(template.id.toString())}
                                            onCheckedChange={() => toggleTemplate(template.id.toString())}
                                            className="mt-0.5"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-medium text-sm truncate">
                                                    {template.nama}
                                                </span>
                                                <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium shrink-0 ${TIPE_COLORS[template.tipe] || TIPE_COLORS.lainnya}`}>
                                                    {TIPE_FILTERS.find(f => f.value === template.tipe)?.label || template.tipe}
                                                </span>
                                                {template.deadline_hari_berikutnya && (
                                                    <span className="inline-flex items-center gap-0.5 rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 shrink-0">
                                                        <Moon className="h-2.5 w-2.5" />
                                                        Shift Malam
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Users className="h-3 w-3" />
                                                    {template.pengguna?.name || '-'}
                                                </span>
                                                <span>•</span>
                                                <span>{template.items?.length || 0} tugas</span>
                                                <span>•</span>
                                                <span>
                                                    Deadline {template.tenggat_waktu_jam || '17:00'}
                                                    {template.deadline_hari_berikutnya ? ' (H+1)' : ''}
                                                </span>
                                            </div>
                                        </div>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Date Selection */}
                    <div className="grid gap-2">
                        <Label htmlFor="date">Tanggal Penugasan</Label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="date"
                                type="date"
                                value={targetDate}
                                onChange={(e) => setTargetDate(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* Summary */}
                    {selectedInfo.count > 0 && (
                        <div className="bg-muted/50 rounded-md p-3 text-sm space-y-1">
                            <p>
                                <span className="font-medium">{selectedInfo.count}</span> template,{' '}
                                <span className="font-medium">{selectedInfo.totalItems}</span> penugasan akan dibuat
                            </p>
                            {selectedInfo.hasShiftMalam && (
                                <p className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                                    <Moon className="h-3.5 w-3.5" />
                                    Termasuk template shift malam (deadline H+1)
                                </p>
                            )}
                        </div>
                    )}

                    {/* Holiday Warning */}
                    {isHoliday && holidayInfo && (
                        <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                                    Hari Libur: {holidayInfo.nama}
                                </p>
                                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                                    Tanggal {format(new Date(holidayInfo.tanggal), 'd MMMM yyyy', { locale: id })} adalah hari libur.
                                    Anda tetap bisa membuat penugasan jika diperlukan.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && !isHoliday && (
                        <div className="text-sm text-destructive">{error}</div>
                    )}

                    {/* Success Message */}
                    {success && (
                        <div className="text-sm text-green-600">{success}</div>
                    )}
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                        Batal
                    </Button>
                    {isHoliday ? (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleTrigger(true)}
                            disabled={processing || selectedTemplateIds.length === 0}
                        >
                            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Tetap Buat Penugasan
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            onClick={() => handleTrigger(false)}
                            disabled={processing || selectedTemplateIds.length === 0}
                        >
                            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Zap className="mr-2 h-4 w-4" />
                            Trigger {selectedInfo.count > 0 ? `(${selectedInfo.count})` : ''} Sekarang
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
