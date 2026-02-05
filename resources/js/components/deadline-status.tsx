import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { useMemo } from 'react';

interface DeadlineStatusProps {
    deadline: string | null;
    status?: 'pending' | 'sedang_dikerjakan' | 'selesai';
    showIcon?: boolean;
    className?: string;
}

interface DeadlineInfo {
    isLate: boolean;
    isUrgent: boolean;
    text: string;
    variant: 'destructive' | 'secondary' | 'outline' | 'default';
    color: string;
}

export function getDeadlineInfo(deadline: string | null, status?: string): DeadlineInfo | null {
    if (!deadline) return null;

    // If task is completed, don't show deadline status
    if (status === 'selesai') {
        return null;
    }

    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffMs = deadlineDate.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Late
    if (diffMs < 0) {
        const lateMinutes = Math.abs(diffMinutes);
        const lateHours = Math.abs(diffHours);
        const lateDays = Math.abs(diffDays);

        let text: string;
        if (lateDays >= 1) {
            text = `Terlambat ${lateDays} hari`;
        } else if (lateHours >= 1) {
            const remainingMinutes = lateMinutes % 60;
            text = remainingMinutes > 0
                ? `Terlambat ${lateHours}j ${remainingMinutes}m`
                : `Terlambat ${lateHours} jam`;
        } else {
            text = `Terlambat ${lateMinutes} menit`;
        }

        return {
            isLate: true,
            isUrgent: false,
            text,
            variant: 'destructive',
            color: 'text-red-600 dark:text-red-400'
        };
    }

    // Urgent (less than 1 hour)
    if (diffMinutes < 60) {
        return {
            isLate: false,
            isUrgent: true,
            text: diffMinutes <= 0 ? 'Segera!' : `Sisa ${diffMinutes} menit`,
            variant: 'destructive',
            color: 'text-orange-600 dark:text-orange-400'
        };
    }

    // Today (less than 24 hours)
    if (diffHours < 24) {
        const remainingMinutes = diffMinutes % 60;
        const text = remainingMinutes > 0
            ? `Sisa ${diffHours}j ${remainingMinutes}m`
            : `Sisa ${diffHours} jam`;
        return {
            isLate: false,
            isUrgent: diffHours < 3,
            text,
            variant: 'secondary',
            color: diffHours < 3 ? 'text-amber-600 dark:text-amber-400' : 'text-yellow-600 dark:text-yellow-400'
        };
    }

    // More than 24 hours
    return {
        isLate: false,
        isUrgent: false,
        text: `Sisa ${diffDays} hari`,
        variant: 'outline',
        color: 'text-green-600 dark:text-green-400'
    };
}

export function formatDeadlineDateTime(deadline: string | null): string {
    if (!deadline) return '-';
    return new Date(deadline).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export default function DeadlineStatus({ deadline, status, showIcon = true, className = '' }: DeadlineStatusProps) {
    const info = useMemo(() => getDeadlineInfo(deadline, status), [deadline, status]);

    if (!info) {
        if (!deadline) return null;
        // Task is completed
        return (
            <span className={`flex items-center gap-1 text-xs text-muted-foreground ${className}`}>
                <CheckCircle2 className="h-3 w-3" />
                {formatDeadlineDateTime(deadline)}
            </span>
        );
    }

    const Icon = info.isLate ? AlertCircle : Clock;

    return (
        <Badge variant={info.variant} className={`gap-1 ${className}`}>
            {showIcon && <Icon className="h-3 w-3" />}
            {info.text}
        </Badge>
    );
}

// Compact version for table rows
export function DeadlineStatusCompact({ deadline, status }: DeadlineStatusProps) {
    const info = useMemo(() => getDeadlineInfo(deadline, status), [deadline, status]);

    if (!info) {
        if (!deadline) return <span className="text-muted-foreground">-</span>;
        return (
            <span className="text-xs text-muted-foreground">
                {formatDeadlineDateTime(deadline)}
            </span>
        );
    }

    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">
                {formatDeadlineDateTime(deadline)}
            </span>
            <span className={`text-xs font-medium ${info.color}`}>
                {info.isLate ? '⚠ ' : info.isUrgent ? '⏰ ' : '⏱ '}{info.text}
            </span>
        </div>
    );
}
