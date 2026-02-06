import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TemplatePenugasanHarian, HariLibur } from '@/types/logbook';
import { router } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { AlertTriangle, Calendar, Loader2, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export default function DailyTriggerDialog({ open, onOpenChange, onSuccess }: Props) {
    const [templates, setTemplates] = useState<TemplatePenugasanHarian[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [targetDate, setTargetDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
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

    const handleTrigger = (skipHolidayCheck: boolean = false) => {
        if (!selectedTemplate) {
            setError('Pilih template terlebih dahulu');
            return;
        }

        setProcessing(true);
        setError(null);
        setSuccess(null);

        router.post(
            '/admin/template-harian/trigger',
            {
                template_id: selectedTemplate,
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
        setSelectedTemplate('');
        setTargetDate(format(new Date(), 'yyyy-MM-dd'));
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-500" />
                        Trigger Penugasan Harian
                    </DialogTitle>
                    <DialogDescription>
                        Buat penugasan otomatis berdasarkan template yang sudah dikonfigurasi
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Template Selection */}
                    <div className="grid gap-2">
                        <Label htmlFor="template">Template Penugasan</Label>
                        <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih template..." />
                            </SelectTrigger>
                            <SelectContent>
                                {templates.map((template) => (
                                    <SelectItem key={template.id} value={template.id.toString()}>
                                        {template.nama} ({template.items?.length || 0} item)
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {templates.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                                Belum ada template aktif. <a href="/admin/template-harian" className="text-primary underline">Buat template</a>
                            </p>
                        )}
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
                            disabled={processing || !selectedTemplate}
                        >
                            Tetap Buat Penugasan
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            onClick={() => handleTrigger(false)}
                            disabled={processing || !selectedTemplate}
                        >
                            <Zap className="mr-2 h-4 w-4" />
                            Trigger Sekarang
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
