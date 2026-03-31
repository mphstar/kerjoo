<?php

namespace App\Console\Commands;

use App\Services\TemplateScheduleService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class ProcessTemplateSchedule extends Command
{
    protected $signature = 'schedule:process-templates
                            {--date= : Target date (Y-m-d format, defaults to today)}
                            {--skip-holiday : Skip holiday check}
                            {--force : Force run even if already ran for this date}';

    protected $description = 'Process template penugasan schedules (harian, mingguan, bulanan, tahunan)';

    public function handle(): int
    {
        $date = $this->option('date')
            ? Carbon::parse($this->option('date'))
            : Carbon::today();

        $skipHoliday = $this->option('skip-holiday');
        $force = $this->option('force');

        $this->info("Processing templates for: {$date->format('d M Y')} ({$date->locale('id')->dayName})");

        $service = new TemplateScheduleService();
        $log = $service->process($date, 'manual', $skipHoliday, $force);

        match ($log->status) {
            'success' => $this->info("✅ Success: {$log->penugasan_count} penugasan from {$log->template_count} templates."),
            'skipped' => $this->warn("⏭ Skipped: " . ($log->skipped_holiday
                ? "Holiday - {$log->holiday_name}"
                : ($log->error_message ?? 'Already ran for this date.'))),
            'failed' => $this->error("❌ Failed: {$log->error_message}"),
        };

        if ($log->detail) {
            $details = json_decode($log->detail, true);
            if (is_array($details)) {
                $this->newLine();
                $this->table(
                    ['Template', 'Tipe', 'Pelaksana', 'Status', 'Penugasan'],
                    array_map(fn($d) => [
                        $d['template_nama'] ?? '-',
                        $d['tipe'] ?? '-',
                        $d['pelaksana'] ?? '-',
                        $d['status'] ?? '-',
                        $d['penugasan_dibuat'] ?? 0,
                    ], $details)
                );
            }
        }

        return $log->status === 'failed' ? self::FAILURE : self::SUCCESS;
    }
}
