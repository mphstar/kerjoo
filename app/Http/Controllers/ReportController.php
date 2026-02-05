<?php

namespace App\Http\Controllers;

use App\Models\Penugasan;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    /**
     * Export penugasan report as PDF for a specific pelaksana
     */
    public function exportPelaksanaPdf(Request $request, $id)
    {
        $pelaksana = User::with('kategori')->findOrFail($id);

        // Get date range and status from request
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $status = $request->input('status');

        // Build query
        $query = Penugasan::with(['tugas.kategori', 'items', 'ditugaskanOleh'])
            ->where('pengguna_id', $id);

        if ($dateFrom) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->whereDate('created_at', '<=', $dateTo);
        }
        if ($status) {
            $query->where('status', $status);
        }

        $penugasan = $query->orderBy('created_at', 'asc')->get();

        // Group by date
        $groupedPenugasan = $penugasan->groupBy(function ($item) {
            return $item->created_at->format('Y-m-d');
        });

        // Get admin user for signature (the one who assigned most tasks)
        $adminUser = User::where('peran', 'admin')->first();

        // Generate PDF
        $pdf = Pdf::loadView('pdf.penugasan-report', [
            'pelaksana' => $pelaksana,
            'groupedPenugasan' => $groupedPenugasan,
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
            'status' => $status,
            'adminUser' => $adminUser,
        ])->setPaper('a4', 'portrait');

        // Stream (preview) instead of download
        return $pdf->stream('laporan-penugasan-' . $pelaksana->name . '.pdf');
    }

    /**
     * Dummy PDF preview with simulated data for testing layout
     */
    public function dummyPdfPreview()
    {
        // Create fake pelaksana
        $pelaksana = (object) [
            'id' => 1,
            'name' => 'Ahmad Budi Santoso',
            'kategori' => (object) ['nama' => 'Teknisi Listrik & AC'],
            'nip_nrp' => '199512012020011001',
        ];

        // Create fake admin
        $adminUser = (object) [
            'name' => 'Ir. Supervisor Utama',
        ];

        // Define task templates (with persyaratan for filtering)
        $taskTemplates = [
            // Tasks with foto requirement
            ['nama' => 'Perbaikan Instalasi Listrik Gedung A', 'kategori' => 'Maintenance Listrik', 'persyaratan' => ['foto' => true, 'file' => false, 'teks' => true]],
            ['nama' => 'Pemasangan AC Split Ruang Meeting', 'kategori' => 'Instalasi AC', 'persyaratan' => ['foto' => true, 'file' => false, 'teks' => true]],
            ['nama' => 'Service AC Central Lobby', 'kategori' => 'Maintenance AC', 'persyaratan' => ['foto' => true, 'file' => false, 'teks' => true]],
            ['nama' => 'Service Kompressor AC Gedung C', 'kategori' => 'Maintenance AC', 'persyaratan' => ['foto' => true, 'file' => true, 'teks' => true]],
            ['nama' => 'Perbaikan Pompa Air Gedung B', 'kategori' => 'Maintenance Plumbing', 'persyaratan' => ['foto' => true, 'file' => false, 'teks' => true]],
            // Tasks without foto requirement (regular tasks)
            ['nama' => 'Pengecekan Panel Listrik Utama', 'kategori' => 'Inspeksi', 'persyaratan' => ['foto' => false, 'file' => false, 'teks' => true]],
            ['nama' => 'Instalasi Lampu LED Koridor Lt.2', 'kategori' => 'Instalasi Listrik', 'persyaratan' => ['foto' => false, 'file' => false, 'teks' => true]],
            ['nama' => 'Perbaikan Genset Darurat', 'kategori' => 'Maintenance Listrik', 'persyaratan' => ['foto' => false, 'file' => true, 'teks' => true]],
            ['nama' => 'Penggantian MCB Panel Distribusi', 'kategori' => 'Maintenance Listrik', 'persyaratan' => ['foto' => false, 'file' => false, 'teks' => true]],
            ['nama' => 'Instalasi Stop Kontak Ruang Server', 'kategori' => 'Instalasi Listrik', 'persyaratan' => ['foto' => false, 'file' => false, 'teks' => true]],
            ['nama' => 'Pengecekan Grounding System', 'kategori' => 'Inspeksi', 'persyaratan' => ['foto' => false, 'file' => true, 'teks' => true]],
            ['nama' => 'Perbaikan Exhaust Fan Dapur', 'kategori' => 'Maintenance', 'persyaratan' => ['foto' => false, 'file' => false, 'teks' => true]],
            ['nama' => 'Instalasi CCTV Parkiran', 'kategori' => 'Instalasi Elektronik', 'persyaratan' => ['foto' => false, 'file' => true, 'teks' => false]],
            ['nama' => 'Penggantian Kabel Feeder', 'kategori' => 'Maintenance Listrik', 'persyaratan' => ['foto' => false, 'file' => false, 'teks' => true]],
            ['nama' => 'Perbaikan UPS Ruang IT', 'kategori' => 'Maintenance Listrik', 'persyaratan' => ['foto' => false, 'file' => true, 'teks' => true]],
        ];

        // Define item templates
        $itemTemplates = [
            ['nama' => 'Persiapan Alat & Material', 'ringkasan' => 'Menyiapkan semua peralatan dan material yang diperlukan.'],
            ['nama' => 'Pembongkaran Unit Lama', 'ringkasan' => 'Unit lama dibongkar dengan hati-hati.'],
            ['nama' => 'Pemasangan Unit Baru', 'ringkasan' => 'Unit baru dipasang sesuai standar.'],
            ['nama' => 'Pengujian & Komisioning', 'ringkasan' => 'Pengujian fungsi dan komisioning berhasil.'],
            ['nama' => 'Penarikan Kabel', 'ringkasan' => 'Kabel ditarik dan dirapikan sesuai jalur.'],
            ['nama' => 'Penyambungan Terminal', 'ringkasan' => 'Terminal disambung dengan benar.'],
            ['nama' => 'Pengecekan Tegangan', 'ringkasan' => 'Tegangan sesuai standar 220V/380V.'],
            ['nama' => 'Pembersihan Area Kerja', 'ringkasan' => 'Area kerja dibersihkan setelah selesai.'],
            ['nama' => 'Penggantian Komponen', 'ringkasan' => 'Komponen rusak diganti dengan yang baru.'],
            ['nama' => 'Pengisian Freon', 'ringkasan' => 'Freon diisi sesuai kapasitas unit.'],
        ];

        $statuses = ['selesai', 'sedang_dikerjakan', 'pending'];
        $fakePenugasan = collect();
        $id = 1;

        // Generate data for 30 days
        for ($day = 0; $day < 30; $day++) {
            $date = now()->subDays($day);

            // Random number of tasks per day (0-3)
            $tasksPerDay = rand(0, 3);

            for ($t = 0; $t < $tasksPerDay; $t++) {
                $taskTemplate = $taskTemplates[array_rand($taskTemplates)];

                // Determine status based on how old the task is
                if ($day > 20) {
                    $status = 'selesai'; // Older tasks are mostly completed
                } elseif ($day > 7) {
                    $status = rand(0, 10) > 3 ? 'selesai' : 'sedang_dikerjakan';
                } else {
                    $status = $statuses[array_rand($statuses)];
                }

                // Generate items for this task
                $numItems = rand(1, 4);
                $items = collect();

                for ($i = 0; $i < $numItems; $i++) {
                    $itemTemplate = $itemTemplates[array_rand($itemTemplates)];
                    $duration = rand(30, 180) * 60; // 30 mins to 3 hours

                    // Generate photo paths for completed items (70% chance)
                    $hasPhotos = $status == 'selesai' && rand(0, 10) > 3;
                    $fotoPath = $hasPhotos ? '/pwa-192x192.png' : null;

                    $items->push((object) [
                        'nama' => $itemTemplate['nama'],
                        'foto_sebelum' => $fotoPath,
                        'foto_sesudah' => $hasPhotos && rand(0, 10) > 2 ? $fotoPath : null,
                        'foto_sebelum_latitude' => $hasPhotos ? -6.2 + (rand(-100, 100) / 10000) : null,
                        'foto_sebelum_longitude' => $hasPhotos ? 106.8 + (rand(-100, 100) / 10000) : null,
                        'foto_sesudah_latitude' => $hasPhotos ? -6.2 + (rand(-100, 100) / 10000) : null,
                        'foto_sesudah_longitude' => $hasPhotos ? 106.8 + (rand(-100, 100) / 10000) : null,
                        'waktu_mulai' => $date->copy()->setHour(rand(7, 14))->setMinute(rand(0, 59)),
                        'waktu_selesai' => $status != 'pending' ? $date->copy()->setHour(rand(15, 17))->setMinute(rand(0, 59)) : null,
                        'ringkasan_teks' => $status == 'selesai' ? $itemTemplate['ringkasan'] : null,
                        'file_lampiran' => rand(0, 5) == 0 ? 'laporan_' . $id . '.pdf' : null,
                        'durasi_detik' => $status != 'pending' ? $duration : 0,
                    ]);
                }

                $fakePenugasan->push((object) [
                    'id' => $id++,
                    'status' => $status,
                    'tugas' => (object) [
                        'nama' => $taskTemplate['nama'],
                        'kategori' => (object) ['nama' => $taskTemplate['kategori']],
                        'persyaratan' => $taskTemplate['persyaratan'],
                    ],
                    'items' => $items,
                    'created_at' => $date,
                ]);
            }
        }

        // Sort by date descending and group
        $fakePenugasan = $fakePenugasan->sortByDesc('created_at');

        $groupedPenugasan = $fakePenugasan->groupBy(function ($item) {
            return $item->created_at->format('Y-m-d');
        });

        // Generate PDF
        $pdf = Pdf::loadView('pdf.penugasan-report', [
            'pelaksana' => $pelaksana,
            'groupedPenugasan' => $groupedPenugasan,
            'dateFrom' => now()->subMonth()->format('Y-m-d'),
            'dateTo' => now()->format('Y-m-d'),
            'status' => null,
            'adminUser' => $adminUser,
        ])->setPaper('a4', 'portrait');

        return $pdf->stream('laporan-dummy-preview.pdf');
    }
}
