<?php

namespace App\Http\Controllers;

use App\Services\TemplateScheduleService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class CronController extends Controller
{
    /**
     * Endpoint for cPanel cron job to trigger template scheduling
     * 
     * URL: GET /cron/schedule?key=YOUR_SECRET_KEY
     * 
     * This is the primary method for shared hosting that cannot run
     * `php artisan` commands. Called via curl/wget from cPanel cron.
     */
    public function run(Request $request)
    {
        // Validate secret key
        $secretKey = config('app.cron_secret_key');
        
        if (!$secretKey || $request->query('key') !== $secretKey) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Invalid or missing cron key.',
            ], 403);
        }

        $service = new TemplateScheduleService();
        $targetDate = Carbon::today();

        try {
            $log = $service->process($targetDate, 'cron');

            return response()->json([
                'success' => true,
                'status' => $log->status,
                'message' => $this->getStatusMessage($log),
                'data' => [
                    'tanggal' => $log->tanggal_target->format('Y-m-d'),
                    'tipe_diproses' => $log->tipe_diproses,
                    'template_count' => $log->template_count,
                    'penugasan_count' => $log->penugasan_count,
                    'skipped_holiday' => $log->skipped_holiday,
                    'holiday_name' => $log->holiday_name,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error processing schedule: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate a human-readable status message
     */
    protected function getStatusMessage(\App\Models\JadwalEksekusiLog $log): string
    {
        if ($log->status === 'skipped' && $log->skipped_holiday) {
            return "Dilewati - Hari libur: {$log->holiday_name}";
        }

        if ($log->status === 'skipped') {
            return $log->error_message ?? 'Dilewati - Sudah pernah dijalankan hari ini.';
        }

        if ($log->status === 'failed') {
            return "Gagal: {$log->error_message}";
        }

        return "{$log->penugasan_count} penugasan berhasil dibuat dari {$log->template_count} template.";
    }
}
