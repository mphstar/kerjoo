<?php

namespace App\Http\Controllers;

use App\Models\HariLibur;
use App\Models\Penugasan;
use App\Models\TemplatePenugasanHarian;
use App\Models\TemplatePenugasanHarianItem;
use App\Models\Tugas;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TemplatePenugasanHarianController extends Controller
{
    public function index(Request $request)
    {
        $templates = TemplatePenugasanHarian::with(['pengguna.kategori', 'items.tugas'])
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 10)
            ->withQueryString();

        $tugasList = Tugas::with('kategori')->where('aktif', true)->get();
        $pelaksanaList = User::with('kategori')->where('peran', 'pelaksana')->get();

        return Inertia::render('admin/penugasan/template-harian', [
            'templates' => $templates,
            'tugasList' => $tugasList,
            'pelaksanaList' => $pelaksanaList,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'aktif' => 'boolean',
            'tipe' => 'required|string|in:harian,mingguan,bulanan,tahunan,lainnya',
            'pengguna_id' => 'required|exists:users,id',
            'tugas_ids' => 'required|array|min:1',
            'tugas_ids.*' => 'exists:tugas,id',
            'tenggat_waktu_jam' => 'nullable|string|max:5',
            'deadline_hari_berikutnya' => 'boolean',
            'catatan' => 'nullable|string',
            'lokasi_latitude' => 'nullable|numeric',
            'lokasi_longitude' => 'nullable|numeric',
            'lokasi_radius' => 'nullable|integer|min:10',
            'lokasi_nama' => 'nullable|string|max:255',
        ]);

        DB::transaction(function () use ($validated) {
            $template = TemplatePenugasanHarian::create([
                'nama' => $validated['nama'],
                'deskripsi' => $validated['deskripsi'] ?? null,
                'aktif' => $validated['aktif'] ?? true,
                'tipe' => $validated['tipe'],
                'pengguna_id' => $validated['pengguna_id'],
                'tenggat_waktu_jam' => $validated['tenggat_waktu_jam'] ?? '17:00',
                'deadline_hari_berikutnya' => $validated['deadline_hari_berikutnya'] ?? false,
                'catatan' => $validated['catatan'] ?? null,
                'lokasi_latitude' => $validated['lokasi_latitude'] ?? null,
                'lokasi_longitude' => $validated['lokasi_longitude'] ?? null,
                'lokasi_radius' => $validated['lokasi_radius'] ?? null,
                'lokasi_nama' => $validated['lokasi_nama'] ?? null,
            ]);

            // Create items for each tugas
            foreach ($validated['tugas_ids'] as $tugasId) {
                TemplatePenugasanHarianItem::create([
                    'template_id' => $template->id,
                    'tugas_id' => $tugasId,
                    'pengguna_id' => $validated['pengguna_id'],
                    'tenggat_waktu_jam' => $validated['tenggat_waktu_jam'] ?? '17:00',
                    'catatan' => $validated['catatan'] ?? null,
                    'lokasi_latitude' => $validated['lokasi_latitude'] ?? null,
                    'lokasi_longitude' => $validated['lokasi_longitude'] ?? null,
                    'lokasi_radius' => $validated['lokasi_radius'] ?? null,
                    'lokasi_nama' => $validated['lokasi_nama'] ?? null,
                ]);
            }
        });

        return redirect()->back()->with('success', 'Template penugasan harian berhasil dibuat.');
    }

    public function update(Request $request, $id)
    {
        $template = TemplatePenugasanHarian::findOrFail($id);

        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'aktif' => 'boolean',
            'tipe' => 'required|string|in:harian,mingguan,bulanan,tahunan,lainnya',
            'pengguna_id' => 'required|exists:users,id',
            'tugas_ids' => 'required|array|min:1',
            'tugas_ids.*' => 'exists:tugas,id',
            'tenggat_waktu_jam' => 'nullable|string|max:5',
            'deadline_hari_berikutnya' => 'boolean',
            'catatan' => 'nullable|string',
            'lokasi_latitude' => 'nullable|numeric',
            'lokasi_longitude' => 'nullable|numeric',
            'lokasi_radius' => 'nullable|integer|min:10',
            'lokasi_nama' => 'nullable|string|max:255',
        ]);

        DB::transaction(function () use ($template, $validated) {
            $template->update([
                'nama' => $validated['nama'],
                'deskripsi' => $validated['deskripsi'] ?? null,
                'aktif' => $validated['aktif'] ?? true,
                'tipe' => $validated['tipe'],
                'pengguna_id' => $validated['pengguna_id'],
                'tenggat_waktu_jam' => $validated['tenggat_waktu_jam'] ?? '17:00',
                'deadline_hari_berikutnya' => $validated['deadline_hari_berikutnya'] ?? false,
                'catatan' => $validated['catatan'] ?? null,
                'lokasi_latitude' => $validated['lokasi_latitude'] ?? null,
                'lokasi_longitude' => $validated['lokasi_longitude'] ?? null,
                'lokasi_radius' => $validated['lokasi_radius'] ?? null,
                'lokasi_nama' => $validated['lokasi_nama'] ?? null,
            ]);

            // Delete old items and create new ones
            $template->items()->delete();

            foreach ($validated['tugas_ids'] as $tugasId) {
                TemplatePenugasanHarianItem::create([
                    'template_id' => $template->id,
                    'tugas_id' => $tugasId,
                    'pengguna_id' => $validated['pengguna_id'],
                    'tenggat_waktu_jam' => $validated['tenggat_waktu_jam'] ?? '17:00',
                    'catatan' => $validated['catatan'] ?? null,
                    'lokasi_latitude' => $validated['lokasi_latitude'] ?? null,
                    'lokasi_longitude' => $validated['lokasi_longitude'] ?? null,
                    'lokasi_radius' => $validated['lokasi_radius'] ?? null,
                    'lokasi_nama' => $validated['lokasi_nama'] ?? null,
                ]);
            }
        });

        return redirect()->back()->with('success', 'Template berhasil diperbarui.');
    }

    public function destroy($id)
    {
        $template = TemplatePenugasanHarian::findOrFail($id);
        $template->delete();

        return redirect()->back()->with('success', 'Template berhasil dihapus.');
    }

    /**
     * Trigger ALL active templates for a specific date
     */
    public function triggerAll(Request $request)
    {
        $validated = $request->validate([
            'tanggal' => 'required|date',
            'skip_holiday_check' => 'boolean',
        ]);

        $targetDate = Carbon::parse($validated['tanggal']);

        // Check if date is a holiday
        if (!($validated['skip_holiday_check'] ?? false) && HariLibur::isHoliday($targetDate)) {
            $holiday = HariLibur::getHolidayInfo($targetDate);
            return redirect()->back()->with([
                'error' => "Tanggal {$targetDate->format('d/m/Y')} adalah hari libur: {$holiday->nama}",
                'is_holiday' => true,
                'holiday' => $holiday,
            ]);
        }

        // Get all active templates
        $templates = TemplatePenugasanHarian::with(['items.tugas', 'pengguna'])
            ->where('aktif', true)
            ->get();

        if ($templates->isEmpty()) {
            return redirect()->back()->with('error', 'Tidak ada template aktif.');
        }

        $createdCount = 0;
        $templateCount = 0;

        DB::transaction(function () use ($templates, $targetDate, &$createdCount, &$templateCount) {
            foreach ($templates as $template) {
                if ($template->items->isEmpty()) continue;
                
                $templateCount++;

                foreach ($template->items as $item) {
                    // Build deadline datetime
                    $deadlineTime = $template->tenggat_waktu_jam ?? '17:00';
                    $deadline = $targetDate->copy()->setTimeFromTimeString($deadlineTime . ':00');

                    // Shift malam: deadline jatuh di hari berikutnya
                    if ($template->deadline_hari_berikutnya) {
                        $deadline->addDay();
                    }

                    Penugasan::create([
                        'tugas_id' => $item->tugas_id,
                        'pengguna_id' => $template->pengguna_id,
                        'ditugaskan_oleh' => auth()->id(),
                        'status' => 'pending',
                        'tenggat_waktu' => $deadline,
                        'catatan' => $template->catatan,
                        'lokasi_latitude' => $template->lokasi_latitude,
                        'lokasi_longitude' => $template->lokasi_longitude,
                        'lokasi_radius' => $template->lokasi_radius,
                        'lokasi_nama' => $template->lokasi_nama,
                    ]);

                    $createdCount++;
                }
            }
        });

        return redirect()->back()->with('success', "{$createdCount} penugasan berhasil dibuat dari {$templateCount} template untuk tanggal {$targetDate->format('d/m/Y')}.");
    }

    /**
     * Trigger selected templates for a specific date
     */
    public function trigger(Request $request)
    {
        $validated = $request->validate([
            'template_ids' => 'required|array|min:1',
            'template_ids.*' => 'exists:template_penugasan_harian,id',
            'tanggal' => 'required|date',
            'skip_holiday_check' => 'boolean',
        ]);

        $targetDate = Carbon::parse($validated['tanggal']);

        // Check if date is a holiday
        if (!($validated['skip_holiday_check'] ?? false) && HariLibur::isHoliday($targetDate)) {
            $holiday = HariLibur::getHolidayInfo($targetDate);
            return redirect()->back()->with([
                'error' => "Tanggal {$targetDate->format('d/m/Y')} adalah hari libur: {$holiday->nama}",
                'is_holiday' => true,
                'holiday' => $holiday,
            ]);
        }

        $templates = TemplatePenugasanHarian::with(['items.tugas', 'pengguna'])
            ->whereIn('id', $validated['template_ids'])
            ->where('aktif', true)
            ->get();

        if ($templates->isEmpty()) {
            return redirect()->back()->with('error', 'Tidak ada template aktif yang dipilih.');
        }

        $createdCount = 0;
        $templateCount = 0;

        DB::transaction(function () use ($templates, $targetDate, &$createdCount, &$templateCount) {
            foreach ($templates as $template) {
                if ($template->items->isEmpty()) continue;

                $templateCount++;

                foreach ($template->items as $item) {
                    // Build deadline datetime
                    $deadlineTime = $template->tenggat_waktu_jam ?? '17:00';
                    $deadline = $targetDate->copy()->setTimeFromTimeString($deadlineTime . ':00');

                    // Shift malam: deadline jatuh di hari berikutnya
                    if ($template->deadline_hari_berikutnya) {
                        $deadline->addDay();
                    }

                    Penugasan::create([
                        'tugas_id' => $item->tugas_id,
                        'pengguna_id' => $template->pengguna_id,
                        'ditugaskan_oleh' => auth()->id(),
                        'status' => 'pending',
                        'tenggat_waktu' => $deadline,
                        'catatan' => $template->catatan,
                        'lokasi_latitude' => $template->lokasi_latitude,
                        'lokasi_longitude' => $template->lokasi_longitude,
                        'lokasi_radius' => $template->lokasi_radius,
                        'lokasi_nama' => $template->lokasi_nama,
                    ]);

                    $createdCount++;
                }
            }
        });

        return redirect()->back()->with('success', "{$createdCount} penugasan berhasil dibuat dari {$templateCount} template untuk tanggal {$targetDate->format('d/m/Y')}.");
    }

    /**
     * Get templates for dropdown/selection
     */
    public function getTemplates()
    {
        $templates = TemplatePenugasanHarian::with(['items.tugas', 'pengguna'])
            ->where('aktif', true)
            ->get();

        return response()->json($templates);
    }
}
