<?php

namespace App\Http\Controllers;

use App\Models\JadwalEksekusiLog;
use App\Models\TemplatePenugasanHarian;
use App\Services\TemplateScheduleService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class JadwalController extends Controller
{
    /**
     * Display the scheduling dashboard
     */
    public function index(Request $request)
    {
        // Execution logs (paginated)
        $query = JadwalEksekusiLog::query()->orderByDesc('created_at');

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('date_from') && $request->date_from) {
            $query->whereDate('tanggal_target', '>=', $request->date_from);
        }
        if ($request->has('date_to') && $request->date_to) {
            $query->whereDate('tanggal_target', '<=', $request->date_to);
        }

        $logs = $query->paginate(15)->withQueryString();

        // Template count per tipe
        $templateStats = TemplatePenugasanHarian::where('aktif', true)
            ->selectRaw("tipe, COUNT(*) as count")
            ->groupBy('tipe')
            ->pluck('count', 'tipe')
            ->toArray();

        // Total active templates
        $totalActiveTemplates = array_sum($templateStats);

        // Latest execution
        $latestExecution = JadwalEksekusiLog::latest()->first();

        // Last successful execution
        $lastSuccess = JadwalEksekusiLog::where('status', 'success')
            ->where('penugasan_count', '>', 0)
            ->latest()
            ->first();

        // Today's status
        $todayRan = JadwalEksekusiLog::whereDate('tanggal_target', Carbon::today())
            ->where('status', 'success')
            ->exists();

        // Cron secret key (masked)
        $cronKey = config('app.cron_secret_key');
        $cronKeyMasked = $cronKey ? (substr($cronKey, 0, 8) . '...' . substr($cronKey, -4)) : null;

        return Inertia::render('admin/jadwal/index', [
            'logs' => $logs,
            'templateStats' => $templateStats,
            'totalActiveTemplates' => $totalActiveTemplates,
            'latestExecution' => $latestExecution,
            'lastSuccess' => $lastSuccess,
            'todayRan' => $todayRan,
            'cronKey' => $cronKey,
            'cronKeyMasked' => $cronKeyMasked,
            'appUrl' => config('app.url'),
            'filters' => [
                'status' => $request->status,
                'date_from' => $request->date_from,
                'date_to' => $request->date_to,
            ],
        ]);
    }

    /**
     * Manually trigger schedule for a specific date
     */
    public function runManual(Request $request)
    {
        $validated = $request->validate([
            'tanggal' => 'required|date',
            'skip_holiday_check' => 'boolean',
            'force' => 'boolean',
        ]);

        $targetDate = Carbon::parse($validated['tanggal']);
        $skipHoliday = $validated['skip_holiday_check'] ?? false;
        $force = $validated['force'] ?? false;

        $service = new TemplateScheduleService();
        $log = $service->process($targetDate, 'manual', $skipHoliday, $force);

        $message = match ($log->status) {
            'success' => "{$log->penugasan_count} penugasan berhasil dibuat dari {$log->template_count} template.",
            'skipped' => $log->skipped_holiday
                ? "Dilewati — Hari libur: {$log->holiday_name}"
                : ($log->error_message ?? 'Sudah pernah dijalankan untuk tanggal ini.'),
            'failed' => "Gagal: {$log->error_message}",
            default => 'Proses selesai.',
        };

        $type = $log->status === 'success' && $log->penugasan_count > 0 ? 'success' : 
               ($log->status === 'failed' ? 'error' : 'info');

        return redirect()->back()->with($type, $message);
    }

    /**
     * Regenerate cron secret key
     */
    public function regenerateKey()
    {
        $newKey = bin2hex(random_bytes(16));

        // Update .env file
        $envPath = base_path('.env');
        $envContent = file_get_contents($envPath);

        if (str_contains($envContent, 'CRON_SECRET_KEY=')) {
            $envContent = preg_replace(
                '/CRON_SECRET_KEY=.*/',
                'CRON_SECRET_KEY=' . $newKey,
                $envContent
            );
        } else {
            $envContent .= "\nCRON_SECRET_KEY=" . $newKey;
        }

        file_put_contents($envPath, $envContent);

        // Clear config cache
        if (function_exists('opcache_reset')) {
            opcache_reset();
        }

        return redirect()->back()->with('success', 'Secret key berhasil di-generate ulang. Pastikan update cron job di cPanel.');
    }
}
