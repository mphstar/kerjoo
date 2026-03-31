<?php

namespace App\Services;

use App\Models\HariLibur;
use App\Models\ItemPenugasan;
use App\Models\JadwalEksekusiLog;
use App\Models\Penugasan;
use App\Models\TemplatePenugasanHarian;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TemplateScheduleService
{
    /**
     * Process template schedules for a given date
     *
     * @param Carbon $targetDate The date to process for
     * @param string $triggeredBy "cron" or "manual"
     * @param bool $skipHolidayCheck Whether to skip holiday validation
     * @param bool $force Force run even if already ran today
     * @return JadwalEksekusiLog
     */
    public function process(
        Carbon $targetDate,
        string $triggeredBy = 'cron',
        bool $skipHolidayCheck = false,
        bool $force = false
    ): JadwalEksekusiLog {
        // Anti-duplikasi: cek apakah sudah dijalankan hari ini
        if (!$force && JadwalEksekusiLog::alreadyRanForDate($targetDate)) {
            return JadwalEksekusiLog::create([
                'tanggal_target' => $targetDate,
                'tipe_diproses' => 'all',
                'template_count' => 0,
                'penugasan_count' => 0,
                'skipped_holiday' => false,
                'status' => 'skipped',
                'error_message' => 'Schedule sudah pernah dijalankan untuk tanggal ini.',
                'triggered_by' => $triggeredBy,
            ]);
        }

        // Cek hari libur
        if (!$skipHolidayCheck && HariLibur::isHoliday($targetDate)) {
            $holiday = HariLibur::getHolidayInfo($targetDate);

            return JadwalEksekusiLog::create([
                'tanggal_target' => $targetDate,
                'tipe_diproses' => 'all',
                'template_count' => 0,
                'penugasan_count' => 0,
                'skipped_holiday' => true,
                'holiday_name' => $holiday?->nama,
                'status' => 'skipped',
                'triggered_by' => $triggeredBy,
            ]);
        }

        // Tentukan tipe mana yang harus dijalankan hari ini
        $tipesToProcess = $this->getTypesForDate($targetDate);

        if (empty($tipesToProcess)) {
            return JadwalEksekusiLog::create([
                'tanggal_target' => $targetDate,
                'tipe_diproses' => 'none',
                'template_count' => 0,
                'penugasan_count' => 0,
                'status' => 'success',
                'triggered_by' => $triggeredBy,
                'detail' => json_encode(['message' => 'Tidak ada tipe yang perlu dijalankan hari ini.']),
            ]);
        }

        try {
            $result = $this->executeTemplates($targetDate, $tipesToProcess, $triggeredBy);
            return $result;
        } catch (\Exception $e) {
            Log::error('TemplateScheduleService error: ' . $e->getMessage(), [
                'date' => $targetDate->toDateString(),
                'trace' => $e->getTraceAsString(),
            ]);

            return JadwalEksekusiLog::create([
                'tanggal_target' => $targetDate,
                'tipe_diproses' => implode(',', $tipesToProcess),
                'template_count' => 0,
                'penugasan_count' => 0,
                'status' => 'failed',
                'error_message' => $e->getMessage(),
                'triggered_by' => $triggeredBy,
            ]);
        }
    }

    /**
     * Determine which template types should run for the given date
     */
    protected function getTypesForDate(Carbon $date): array
    {
        $types = [];

        // Harian: setiap hari
        $types[] = 'harian';

        // Mingguan: setiap Senin (1 = Monday in Carbon)
        if ($date->dayOfWeek === Carbon::MONDAY) {
            $types[] = 'mingguan';
        }

        // Bulanan: setiap tanggal 1
        if ($date->day === 1) {
            $types[] = 'bulanan';
        }

        // Tahunan: setiap 1 Januari
        if ($date->day === 1 && $date->month === 1) {
            $types[] = 'tahunan';
        }

        // 'lainnya' di-skip dari scheduling otomatis

        return $types;
    }

    /**
     * Execute templates for the given types
     */
    protected function executeTemplates(Carbon $targetDate, array $types, string $triggeredBy): JadwalEksekusiLog
    {
        $templates = TemplatePenugasanHarian::with(['items.tugas', 'pengguna'])
            ->where('aktif', true)
            ->whereIn('tipe', $types)
            ->get();

        $createdCount = 0;
        $templateCount = 0;
        $details = [];

        DB::transaction(function () use ($templates, $targetDate, &$createdCount, &$templateCount, &$details) {
            foreach ($templates as $template) {
                if ($template->items->isEmpty()) {
                    $details[] = [
                        'template_id' => $template->id,
                        'template_nama' => $template->nama,
                        'tipe' => $template->tipe,
                        'pelaksana' => $template->pengguna?->name ?? 'Unknown',
                        'status' => 'skipped',
                        'reason' => 'Tidak ada item tugas',
                        'penugasan_dibuat' => 0,
                    ];
                    continue;
                }

                $templateCount++;
                $itemCount = 0;

                foreach ($template->items as $item) {
                    // Build deadline datetime
                    $deadlineTime = $template->tenggat_waktu_jam ?? '17:00';
                    $deadline = $targetDate->copy()->setTimeFromTimeString($deadlineTime . ':00');

                    // Shift malam: deadline jatuh di hari berikutnya
                    if ($template->deadline_hari_berikutnya) {
                        $deadline->addDay();
                    }

                    // Build jam_mulai datetime
                    $jamMulaiTime = $template->jam_mulai ?? '08:00';
                    $jamMulai = $targetDate->copy()->setTimeFromTimeString($jamMulaiTime . ':00');

                    $penugasan = Penugasan::create([
                        'tugas_id' => $item->tugas_id,
                        'pengguna_id' => $template->pengguna_id,
                        'ditugaskan_oleh' => 1, // System (admin ID 1)
                        'status' => 'pending',
                        'tenggat_waktu' => $deadline,
                        'jam_mulai' => $jamMulai,
                        'catatan' => $template->catatan,
                        'lokasi_latitude' => $template->lokasi_latitude,
                        'lokasi_longitude' => $template->lokasi_longitude,
                        'lokasi_radius' => $template->lokasi_radius,
                        'lokasi_nama' => $template->lokasi_nama,
                    ]);

                    // Create item for penugasan
                    ItemPenugasan::create([
                        'penugasan_id' => $penugasan->id,
                        'nama' => $item->tugas?->nama ?? 'Tugas',
                        'status' => 'pending',
                    ]);

                    $itemCount++;
                    $createdCount++;
                }

                $details[] = [
                    'template_id' => $template->id,
                    'template_nama' => $template->nama,
                    'tipe' => $template->tipe,
                    'pelaksana' => $template->pengguna?->name ?? 'Unknown',
                    'status' => 'success',
                    'penugasan_dibuat' => $itemCount,
                ];
            }
        });

        return JadwalEksekusiLog::create([
            'tanggal_target' => $targetDate,
            'tipe_diproses' => implode(',', $types),
            'template_count' => $templateCount,
            'penugasan_count' => $createdCount,
            'status' => 'success',
            'triggered_by' => $triggeredBy,
            'detail' => json_encode($details),
        ]);
    }
}
