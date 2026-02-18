<?php

use App\Http\Controllers\AbsensiController;
use App\Http\Controllers\BidangController;
use App\Http\Controllers\HariLiburController;
use App\Http\Controllers\ItemPenugasanController;
use App\Http\Controllers\KategoriController;
use App\Http\Controllers\PenugasanController;
use App\Http\Controllers\TemplatePenugasanHarianController;
use App\Http\Controllers\TugasController;
use App\Http\Controllers\UraianTugasController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return redirect('/login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        $user = Auth::user();

        if ($user->peran === 'admin') {
            // Admin Dashboard with daily stats
            $today = now()->startOfDay();
            $weekStart = now()->startOfWeek();

            // Today's stats
            $todayPenugasan = \App\Models\Penugasan::whereDate('created_at', $today)->count();
            $todaySelesai = \App\Models\Penugasan::whereDate('updated_at', $today)->where('status', 'selesai')->count();

            // Overall stats
            $totalPenugasan = \App\Models\Penugasan::count();
            $totalSelesai = \App\Models\Penugasan::where('status', 'selesai')->count();
            $totalDikerjakan = \App\Models\Penugasan::where('status', 'sedang_dikerjakan')->count();
            $totalPending = \App\Models\Penugasan::where('status', 'pending')->count();

            // Weekly chart data (last 7 days)
            $weeklyData = [];
            for ($i = 6; $i >= 0; $i--) {
                $date = now()->subDays($i)->startOfDay();
                $weeklyData[] = [
                    'date' => $date->format('Y-m-d'),
                    'label' => $date->locale('id')->isoFormat('ddd'),
                    'dibuat' => \App\Models\Penugasan::whereDate('created_at', $date)->count(),
                    'selesai' => \App\Models\Penugasan::whereDate('updated_at', $date)->where('status', 'selesai')->count(),
                ];
            }

            // Pelaksana performance
            $pelaksanaStats = \App\Models\User::where('peran', 'pelaksana')
                ->withCount(['penugasan as total_penugasan'])
                ->withCount(['penugasan as selesai_count' => function ($q) {
                    $q->where('status', 'selesai');
                }])
                ->orderByDesc('selesai_count')
                ->take(5)
                ->get()
                ->map(fn($p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'total' => $p->total_penugasan,
                    'selesai' => $p->selesai_count,
                ]);

            // Recent penugasan
            $recentPenugasan = \App\Models\Penugasan::with(['tugas', 'pengguna'])
                ->latest()
                ->take(10)
                ->get()
                ->map(fn($p) => [
                    'id' => $p->id,
                    'tugas' => $p->tugas->nama ?? 'Unknown',
                    'pelaksana' => $p->pengguna->name ?? 'Unknown',
                    'status' => $p->status,
                    'created_at' => $p->created_at,
                ]);

            return Inertia::render('dashboard', [
                'stats' => [
                    'todayPenugasan' => $todayPenugasan,
                    'todaySelesai' => $todaySelesai,
                    'totalPenugasan' => $totalPenugasan,
                    'totalSelesai' => $totalSelesai,
                    'totalDikerjakan' => $totalDikerjakan,
                    'totalPending' => $totalPending,
                ],
                'weeklyData' => $weeklyData,
                'pelaksanaStats' => $pelaksanaStats,
                'recentPenugasan' => $recentPenugasan,
            ]);
        }

        // Pelaksana Mobile Dashboard Data
        $completedTasks = \App\Models\Penugasan::where('pengguna_id', Auth::id())
            ->where('status', 'selesai')
            ->count();

        // Calculate average time from completed items
        $avgSeconds = \App\Models\ItemPenugasan::whereHas('penugasan', function ($q) {
            $q->where('pengguna_id', Auth::id())->where('status', 'selesai');
        })->where('status', 'selesai')->avg('durasi_detik');

        $avgTimeFormatted = '00:00:00';
        if ($avgSeconds) {
            $hours = floor($avgSeconds / 3600);
            $minutes = floor(($avgSeconds % 3600) / 60);
            $seconds = $avgSeconds % 60;
            $avgTimeFormatted = sprintf('%02d:%02d:%02d', $hours, $minutes, $seconds);
        }

        return Inertia::render('pelaksana/dashboard', [
            'user' => Auth::user(),
            'performance' => [
                'completed' => $completedTasks,
                'inProgress' => \App\Models\Penugasan::where('pengguna_id', Auth::id())
                    ->where('status', 'sedang_dikerjakan')
                    ->count(),
                'averageTime' => $avgTimeFormatted
            ],
            'recentTasks' => \App\Models\Penugasan::with(['tugas.kategori', 'items'])
                ->where('pengguna_id', Auth::id())
                ->latest()
                ->take(5)
                ->get()
                ->map(function ($p) {
                    return [
                        'id' => $p->id,
                        'title' => $p->tugas->nama ?? 'Tugas',
                        'status' => $p->status,
                        'date' => $p->created_at,
                        'tenggat_waktu' => $p->tenggat_waktu,
                        'kategori' => $p->tugas->kategori->nama ?? null,
                        'total_durasi' => $p->items->sum('durasi_detik')
                    ];
                }),
            'todayTasks' => \App\Models\Penugasan::where('pengguna_id', Auth::id())
                ->where('status', '!=', 'selesai')
                ->where(function ($q) {
                    $q->whereDate('tenggat_waktu', now())
                        ->orWhereNull('tenggat_waktu');
                })
                ->count(),
            'todayAbsensi' => \App\Models\Absensi::where('pengguna_id', Auth::id())
                ->whereDate('tanggal', now()->toDateString())
                ->count(),
        ]);
    })->name('dashboard');

    // Admin Routes - Master Data (Admin only)
    Route::prefix('admin')->middleware('role:admin')->group(function () {
        // Pengguna (Users)
        Route::get('users', function (\Illuminate\Http\Request $request) {
            $query = \App\Models\User::with('kategori');

            if ($request->has('search') && $request->search) {
                $query->where(function ($q) use ($request) {
                    $q->where('name', 'like', '%' . $request->search . '%')
                        ->orWhere('email', 'like', '%' . $request->search . '%');
                });
            }

            $perPage = $request->input('per_page', 10);
            return Inertia::render('admin/users/index', [
                'users' => $query->latest()->paginate($perPage)->withQueryString(),
                'kategori' => \App\Models\Kategori::with('bidang')->get()
            ]);
        })->name('users.index');

        Route::post('users', [App\Http\Controllers\UserController::class, 'store'])->name('users.store');
        Route::put('users/{id}', [App\Http\Controllers\UserController::class, 'update'])->name('users.update');
        Route::delete('users/{id}', [App\Http\Controllers\UserController::class, 'destroy'])->name('users.destroy');

        // Absensi per user (Admin view)
        Route::get('users/{id}/absensi', function (\Illuminate\Http\Request $request, $id) {
            $user = \App\Models\User::findOrFail($id);

            $query = \App\Models\Absensi::where('pengguna_id', $id);

            if ($request->has('date_from') && $request->date_from) {
                $query->whereDate('tanggal', '>=', $request->date_from);
            }
            if ($request->has('date_to') && $request->date_to) {
                $query->whereDate('tanggal', '<=', $request->date_to);
            }

            return Inertia::render('admin/users/absensi', [
                'user' => $user,
                'absensi' => $query->orderByDesc('tanggal')->orderByDesc('created_at')->get(),
                'filters' => [
                    'date_from' => $request->date_from,
                    'date_to' => $request->date_to,
                ]
            ]);
        })->name('users.absensi');

        // Master Bidang
        Route::get('bidang', function (\Illuminate\Http\Request $request) {
            $query = \App\Models\Bidang::withCount('kategori');

            if ($request->has('search') && $request->search) {
                $query->where('nama', 'like', '%' . $request->search . '%')
                    ->orWhere('deskripsi', 'like', '%' . $request->search . '%');
            }

            $perPage = $request->input('per_page', 10);
            return Inertia::render('admin/bidang/index', [
                'bidang' => $query->paginate($perPage)->withQueryString()
            ]);
        })->name('bidang.index');

        Route::post('bidang', [BidangController::class, 'store'])->name('bidang.store');
        Route::put('bidang/{id}', [BidangController::class, 'update'])->name('bidang.update');
        Route::delete('bidang/{id}', [BidangController::class, 'destroy'])->name('bidang.destroy');
        Route::patch('bidang/{id}/toggle', [BidangController::class, 'toggleActive'])->name('bidang.toggle');

        // Nested: Kategori under Bidang
        Route::get('bidang/{bidangId}/kategori', function (\Illuminate\Http\Request $request, $bidangId) {
            $bidang = \App\Models\Bidang::findOrFail($bidangId);
            $query = \App\Models\Kategori::with('bidang')->where('bidang_id', $bidangId);

            if ($request->has('search') && $request->search) {
                $query->where(function ($q) use ($request) {
                    $q->where('nama', 'like', '%' . $request->search . '%')
                        ->orWhere('deskripsi', 'like', '%' . $request->search . '%');
                });
            }

            $perPage = $request->input('per_page', 10);
            return Inertia::render('admin/kategori/index', [
                'kategori' => $query->paginate($perPage)->withQueryString(),
                'bidangList' => \App\Models\Bidang::aktif()->get(),
                'currentBidang' => $bidang,
            ]);
        })->name('bidang.kategori');

        // Master Kategori CRUD (accessed via nested /admin/bidang/{id}/kategori)
        Route::post('kategori', [KategoriController::class, 'store'])->name('kategori.store');
        Route::put('kategori/{id}', [KategoriController::class, 'update'])->name('kategori.update');
        Route::delete('kategori/{id}', [KategoriController::class, 'destroy'])->name('kategori.destroy');

        // Nested: Tugas under Kategori
        Route::get('kategori/{kategoriId}/tugas', function (\Illuminate\Http\Request $request, $kategoriId) {
            $kategori = \App\Models\Kategori::with('bidang')->findOrFail($kategoriId);
            $query = \App\Models\Tugas::with('kategori')->where('kategori_id', $kategoriId);

            if ($request->has('search') && $request->search) {
                $query->where(function ($q) use ($request) {
                    $q->where('nama', 'like', '%' . $request->search . '%')
                        ->orWhere('deskripsi', 'like', '%' . $request->search . '%');
                });
            }

            $perPage = $request->input('per_page', 10);
            return Inertia::render('admin/tugas/index', [
                'tugas' => $query->paginate($perPage)->withQueryString(),
                'kategoriList' => \App\Models\Kategori::all(),
                'currentKategori' => $kategori,
            ]);
        })->name('kategori.tugas');

        // Nested: Uraian Tugas under Kategori
        Route::get('kategori/{kategoriId}/uraian-tugas', function (\Illuminate\Http\Request $request, $kategoriId) {
            $kategori = \App\Models\Kategori::with('bidang')->findOrFail($kategoriId);
            $query = \App\Models\UraianTugas::with('kategori.bidang')->where('kategori_id', $kategoriId);

            if ($request->has('search') && $request->search) {
                $query->where(function ($q) use ($request) {
                    $q->where('nama', 'like', '%' . $request->search . '%')
                        ->orWhere('deskripsi', 'like', '%' . $request->search . '%');
                });
            }

            $perPage = $request->input('per_page', 10);
            return Inertia::render('admin/uraian-tugas/index', [
                'uraianTugas' => $query->ordered()->paginate($perPage)->withQueryString(),
                'kategoriList' => \App\Models\Kategori::with('bidang')->get(),
                'currentKategori' => $kategori,
            ]);
        })->name('kategori.uraian-tugas');

        // Master Uraian Tugas
        Route::get('uraian-tugas', function (\Illuminate\Http\Request $request) {
            $query = \App\Models\UraianTugas::with('kategori.bidang');

            if ($request->has('search') && $request->search) {
                $query->where('nama', 'like', '%' . $request->search . '%')
                    ->orWhere('deskripsi', 'like', '%' . $request->search . '%');
            }

            if ($request->has('kategori') && $request->kategori !== 'all') {
                $query->where('kategori_id', $request->kategori);
            }

            $perPage = $request->input('per_page', 10);
            return Inertia::render('admin/uraian-tugas/index', [
                'uraianTugas' => $query->ordered()->paginate($perPage)->withQueryString(),
                'kategoriList' => \App\Models\Kategori::with('bidang')->get(),
                'filters' => [
                    'kategori' => $request->kategori,
                ],
            ]);
        })->name('uraian-tugas.index');

        Route::post('uraian-tugas', [UraianTugasController::class, 'store'])->name('uraian-tugas.store');
        Route::put('uraian-tugas/{id}', [UraianTugasController::class, 'update'])->name('uraian-tugas.update');
        Route::delete('uraian-tugas/{id}', [UraianTugasController::class, 'destroy'])->name('uraian-tugas.destroy');
        Route::patch('uraian-tugas/{id}/toggle', [UraianTugasController::class, 'toggleActive'])->name('uraian-tugas.toggle');

        // Master Tugas
        Route::get('tugas', function (\Illuminate\Http\Request $request) {
            $query = \App\Models\Tugas::with('kategori');

            if ($request->has('search')) {
                $query->where('nama', 'like', '%' . $request->search . '%')
                    ->orWhere('deskripsi', 'like', '%' . $request->search . '%');
            }

            if ($request->has('kategori') && $request->kategori !== 'all') {
                $query->where('kategori_id', $request->kategori);
            }

            $perPage = $request->input('per_page', 10);
            return Inertia::render('admin/tugas/index', [
                'tugas' => $query->paginate($perPage)->withQueryString(),
                'kategoriList' => \App\Models\Kategori::all(),
                'filters' => [
                    'kategori' => $request->kategori,
                    'search' => $request->search,
                ]
            ]);
        })->name('tugas.index');

        Route::post('tugas', [TugasController::class, 'store'])->name('tugas.store');
        Route::put('tugas/{id}', [TugasController::class, 'update'])->name('tugas.update');
        Route::delete('tugas/{id}', [TugasController::class, 'destroy'])->name('tugas.destroy');
        Route::patch('tugas/{id}/toggle', [TugasController::class, 'toggleActive'])->name('tugas.toggle');

        // Penugasan (Admin) - Restructured: Pelaksana List → Pelaksana Detail
        Route::get('penugasan', function (\Illuminate\Http\Request $request) {
            // Query pelaksana with penugasan counts
            $query = \App\Models\User::where('peran', 'pelaksana')
                ->with('kategori')
                ->withCount(['penugasan as total_penugasan'])
                ->withCount(['penugasan as pending_count' => function ($q) {
                    $q->where('status', 'pending');
                }])
                ->withCount(['penugasan as dikerjakan_count' => function ($q) {
                    $q->where('status', 'sedang_dikerjakan');
                }])
                ->withCount(['penugasan as selesai_count' => function ($q) {
                    $q->where('status', 'selesai');
                }]);

            // Filter by kategori
            if ($request->has('kategori') && $request->kategori !== 'all') {
                $query->where('kategori_id', $request->kategori);
            }

            // Search by name
            if ($request->has('search') && $request->search) {
                $query->where('name', 'like', '%' . $request->search . '%');
            }

            $perPage = $request->input('per_page', 10);
            return Inertia::render('admin/penugasan/index', [
                'pelaksana' => $query->orderBy('name')->paginate($perPage)->withQueryString(),
                'kategoriList' => \App\Models\Kategori::all(),
                'tugasList' => \App\Models\Tugas::with('kategori')->where('aktif', true)->get(),
                'pelaksanaList' => \App\Models\User::with('kategori')->where('peran', 'pelaksana')->get(),
                'filters' => [
                    'kategori' => $request->kategori,
                    'search' => $request->search,
                ]
            ]);
        })->name('penugasan.index');

        // Pelaksana Detail - Penugasan per Pelaksana with date filter
        Route::get('penugasan/pelaksana/{id}', function (\Illuminate\Http\Request $request, $id) {
            $pelaksana = \App\Models\User::with('kategori')->findOrFail($id);

            $query = \App\Models\Penugasan::with(['tugas.kategori', 'items'])
                ->where('pengguna_id', $id);

            // Filter by created_at date range
            if ($request->has('date_from') && $request->date_from) {
                $query->whereDate('created_at', '>=', $request->date_from);
            }
            if ($request->has('date_to') && $request->date_to) {
                $query->whereDate('created_at', '<=', $request->date_to);
            }

            // Filter by status
            if ($request->has('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            return Inertia::render('admin/penugasan/pelaksana-detail', [
                'pelaksana' => $pelaksana,
                'penugasan' => $query->orderByDesc('created_at')->get(),
                'tugasList' => \App\Models\Tugas::with('kategori')->where('aktif', true)->get(),
                'filters' => [
                    'date_from' => $request->date_from,
                    'date_to' => $request->date_to,
                    'status' => $request->status,
                ]
            ]);
        })->name('penugasan.pelaksana.show');

        // PDF Export Route
        Route::get('penugasan/pelaksana/{id}/export-pdf', [App\Http\Controllers\ReportController::class, 'exportPelaksanaPdf'])->name('penugasan.pelaksana.export-pdf');

        // Dummy PDF Preview Route (for testing layout)
        Route::get('penugasan/dummy-pdf', [App\Http\Controllers\ReportController::class, 'dummyPdfPreview'])->name('penugasan.dummy-pdf');

        Route::post('penugasan', [PenugasanController::class, 'store'])->name('penugasan.store');
        Route::post('penugasan/batch', [PenugasanController::class, 'storeBatch'])->name('penugasan.storeBatch');
        Route::get('penugasan/{id}', [PenugasanController::class, 'show'])->name('penugasan.show');
        Route::patch('penugasan/{id}/status', [PenugasanController::class, 'updateStatus'])->name('penugasan.updateStatus');
        Route::delete('penugasan/{id}', [PenugasanController::class, 'destroy'])->name('penugasan.destroy');

        // Hari Libur (Holiday Management)
        Route::get('hari-libur', [HariLiburController::class, 'index'])->name('hari-libur.index');
        Route::post('hari-libur', [HariLiburController::class, 'store'])->name('hari-libur.store');
        Route::put('hari-libur/{id}', [HariLiburController::class, 'update'])->name('hari-libur.update');
        Route::delete('hari-libur/{id}', [HariLiburController::class, 'destroy'])->name('hari-libur.destroy');
        Route::get('hari-libur/check', [HariLiburController::class, 'checkHoliday'])->name('hari-libur.check');

        // Template Penugasan Harian
        Route::get('template-harian', [TemplatePenugasanHarianController::class, 'index'])->name('template-harian.index');
        Route::post('template-harian', [TemplatePenugasanHarianController::class, 'store'])->name('template-harian.store');
        Route::put('template-harian/{id}', [TemplatePenugasanHarianController::class, 'update'])->name('template-harian.update');
        Route::delete('template-harian/{id}', [TemplatePenugasanHarianController::class, 'destroy'])->name('template-harian.destroy');
        Route::post('template-harian/trigger', [TemplatePenugasanHarianController::class, 'trigger'])->name('template-harian.trigger');
        Route::post('template-harian/trigger-all', [TemplatePenugasanHarianController::class, 'triggerAll'])->name('template-harian.trigger-all');
        Route::get('template-harian/list', [TemplatePenugasanHarianController::class, 'getTemplates'])->name('template-harian.list');

        // Report Route
        Route::get('report', function (\Illuminate\Http\Request $request) {
            $period = $request->input('period', 'month'); // today, week, month, year, custom
            $dateFrom = $request->input('date_from');
            $dateTo = $request->input('date_to');
            $kategoriId = $request->input('kategori');
            $pelaksanaId = $request->input('pelaksana');

            // Determine date range based on period
            switch ($period) {
                case 'today':
                    $startDate = now()->startOfDay();
                    $endDate = now()->endOfDay();
                    break;
                case 'week':
                    $startDate = now()->startOfWeek();
                    $endDate = now()->endOfWeek();
                    break;
                case 'month':
                    $startDate = now()->startOfMonth();
                    $endDate = now()->endOfMonth();
                    break;
                case 'year':
                    $startDate = now()->startOfYear();
                    $endDate = now()->endOfYear();
                    break;
                case 'custom':
                    $startDate = $dateFrom ? \Carbon\Carbon::parse($dateFrom)->startOfDay() : now()->startOfMonth();
                    $endDate = $dateTo ? \Carbon\Carbon::parse($dateTo)->endOfDay() : now()->endOfDay();
                    break;
                default:
                    $startDate = now()->startOfMonth();
                    $endDate = now()->endOfMonth();
            }

            // Base query
            $query = \App\Models\Penugasan::with(['tugas.kategori', 'pengguna.kategori', 'items'])
                ->whereBetween('created_at', [$startDate, $endDate]);

            // Apply filters
            if ($kategoriId && $kategoriId !== 'all') {
                $query->whereHas('tugas', fn($q) => $q->where('kategori_id', $kategoriId));
            }
            if ($pelaksanaId && $pelaksanaId !== 'all') {
                $query->where('pengguna_id', $pelaksanaId);
            }

            $penugasan = $query->orderByDesc('created_at')->get();

            // Stats
            $stats = [
                'total' => $penugasan->count(),
                'selesai' => $penugasan->where('status', 'selesai')->count(),
                'dikerjakan' => $penugasan->where('status', 'sedang_dikerjakan')->count(),
                'pending' => $penugasan->where('status', 'pending')->count(),
                'totalDurasi' => $penugasan->sum(fn($p) => $p->items->sum('durasi_detik')),
            ];

            // Chart data - group by date
            $chartData = $penugasan->groupBy(fn($p) => $p->created_at->format('Y-m-d'))
                ->map(fn($items, $date) => [
                    'date' => $date,
                    'label' => \Carbon\Carbon::parse($date)->locale('id')->isoFormat('D MMM'),
                    'total' => $items->count(),
                    'selesai' => $items->where('status', 'selesai')->count(),
                    'pending' => $items->where('status', 'pending')->count(),
                ])
                ->values();

            // Status distribution for pie chart
            $statusDistribution = [
                ['name' => 'Selesai', 'value' => $stats['selesai'], 'color' => '#10b981'],
                ['name' => 'Dikerjakan', 'value' => $stats['dikerjakan'], 'color' => '#3b82f6'],
                ['name' => 'Pending', 'value' => $stats['pending'], 'color' => '#f59e0b'],
            ];

            // Pelaksana performance
            $pelaksanaPerformance = $penugasan->groupBy('pengguna_id')
                ->map(fn($items) => [
                    'name' => $items->first()->pengguna->name ?? 'Unknown',
                    'total' => $items->count(),
                    'selesai' => $items->where('status', 'selesai')->count(),
                    'durasi' => $items->sum(fn($p) => $p->items->sum('durasi_detik')),
                ])
                ->sortByDesc('selesai')
                ->values()
                ->take(10);

            return Inertia::render('admin/report/index', [
                'penugasan' => $penugasan->map(fn($p) => [
                    'id' => $p->id,
                    'tugas' => $p->tugas->nama ?? 'Unknown',
                    'kategori' => $p->tugas->kategori->nama ?? 'Unknown',
                    'pelaksana' => $p->pengguna->name ?? 'Unknown',
                    'status' => $p->status,
                    'created_at' => $p->created_at,
                    'durasi' => $p->items->sum('durasi_detik'),
                ]),
                'stats' => $stats,
                'chartData' => $chartData,
                'statusDistribution' => $statusDistribution,
                'pelaksanaPerformance' => $pelaksanaPerformance,
                'filters' => [
                    'period' => $period,
                    'date_from' => $dateFrom,
                    'date_to' => $dateTo,
                    'kategori' => $kategoriId,
                    'pelaksana' => $pelaksanaId,
                ],
                'kategoriList' => \App\Models\Kategori::with('bidang')->get(),
                'pelaksanaList' => \App\Models\User::where('peran', 'pelaksana')->get(),
            ]);
        })->name('admin.report');
    });

    // Pelaksana Routes (Pelaksana only)
    Route::prefix('pelaksana')->middleware('role:pelaksana')->group(function () {
        // Dashboard redirect - use /pelaksana as alias to dashboard
        Route::get('/', function () {
            return redirect()->route('dashboard');
        })->name('pelaksana.dashboard');

        Route::get('tugas', function (\Illuminate\Http\Request $request) {
            $query = \App\Models\Penugasan::with(['tugas.kategori', 'items'])
                ->where('pengguna_id', Auth::id());

            // Filter by created_at date range
            if ($request->has('date_from') && $request->date_from) {
                $query->whereDate('created_at', '>=', $request->date_from);
            }
            if ($request->has('date_to') && $request->date_to) {
                $query->whereDate('created_at', '<=', $request->date_to);
            }

            return Inertia::render('pelaksana/tugas/index', [
                'penugasan' => $query->get(),
                'filters' => [
                    'date_from' => $request->date_from,
                    'date_to' => $request->date_to,
                ]
            ]);
        })->name('pelaksana.tugas.index');

        Route::get('tugas/{id}', function ($id) {
            $penugasan = \App\Models\Penugasan::with('tugas.kategori')->findOrFail($id);
            return Inertia::render('pelaksana/tugas/detail', [
                'penugasan' => $penugasan,
                'items' => \App\Models\ItemPenugasan::where('penugasan_id', $id)->get()
            ]);
        })->name('pelaksana.tugas.show');

        Route::post('tugas/{id}/submit', [ItemPenugasanController::class, 'submitAll'])->name('pelaksana.tugas.submit');
        Route::post('tugas/{id}/items', [ItemPenugasanController::class, 'store'])->name('pelaksana.item.store');
        Route::post('tugas/{id}/items/{itemId}/start', [ItemPenugasanController::class, 'startTimer'])->name('pelaksana.item.start');
        Route::post('tugas/{id}/items/{itemId}/stop', [ItemPenugasanController::class, 'stopTimer'])->name('pelaksana.item.stop');
        Route::delete('tugas/{id}/items/{itemId}', [ItemPenugasanController::class, 'destroy'])->name('pelaksana.item.destroy');

        // Permintaan Peralatan
        Route::get('peralatan', function () {
            return Inertia::render('pelaksana/peralatan/index', [
                'permintaan' => \App\Models\PermintaanPeralatan::with('details')
                    ->where('pengguna_id', Auth::id())
                    ->latest()
                    ->paginate(10)
            ]);
        })->name('pelaksana.peralatan.index');

        Route::post('peralatan', [App\Http\Controllers\PermintaanPeralatanController::class, 'store'])->name('pelaksana.peralatan.store');
        Route::delete('peralatan/{id}', [App\Http\Controllers\PermintaanPeralatanController::class, 'destroy'])->name('pelaksana.peralatan.destroy');

        // Absensi
        Route::get('absensi', function (\Illuminate\Http\Request $request) {
            $query = \App\Models\Absensi::where('pengguna_id', Auth::id());

            if ($request->has('date_from') && $request->date_from) {
                $query->whereDate('tanggal', '>=', $request->date_from);
            }
            if ($request->has('date_to') && $request->date_to) {
                $query->whereDate('tanggal', '<=', $request->date_to);
            }

            return Inertia::render('pelaksana/absensi/index', [
                'absensi' => $query->orderByDesc('tanggal')->orderByDesc('created_at')->get(),
                'todayAbsensi' => \App\Models\Absensi::where('pengguna_id', Auth::id())
                    ->whereDate('tanggal', now()->toDateString())
                    ->orderByDesc('created_at')
                    ->get(),
                'filters' => [
                    'date_from' => $request->date_from,
                    'date_to' => $request->date_to,
                ]
            ]);
        })->name('pelaksana.absensi.index');

        Route::post('absensi', [AbsensiController::class, 'store'])->name('pelaksana.absensi.store');
        Route::delete('absensi/{id}', [AbsensiController::class, 'destroy'])->name('pelaksana.absensi.destroy');

        // Profil
        Route::get('profil', function () {
            /** @var \App\Models\User $user */
            $user = Auth::user();
            return Inertia::render('pelaksana/profil/index', [
                'user' => $user->load('kategori')
            ]);
        })->name('pelaksana.profil.index');
    });

    // Shared Routes (accessible by both admin and pelaksana based on context)
    Route::get('tasks', function () {
        $user = Auth::user();

        if ($user->peran === 'admin') {
            return redirect()->route('penugasan.index');
        }

        return redirect()->route('pelaksana.tugas.index');
    })->name('tasks.index');

    Route::get('permintaan-peralatan', function () {
        $user = Auth::user();

        if ($user->peran === 'admin') {
            return Inertia::render('admin/peralatan/index', [
                'permintaan' => \App\Models\PermintaanPeralatan::with(['pengguna', 'details'])
                    ->latest()
                    ->paginate(10)
            ]);
        }

        return redirect()->route('pelaksana.peralatan.index');
    })->name('permintaan-peralatan.index');

    Route::post('permintaan-peralatan/{id}/approve', [App\Http\Controllers\PermintaanPeralatanController::class, 'approve'])->name('permintaan-peralatan.approve');
    Route::post('permintaan-peralatan/{id}/reject', [App\Http\Controllers\PermintaanPeralatanController::class, 'reject'])->name('permintaan-peralatan.reject');
    Route::delete('permintaan-peralatan/{id}', [App\Http\Controllers\PermintaanPeralatanController::class, 'destroy'])->name('permintaan-peralatan.destroy');
    Route::get('permintaan-peralatan/{id}/export-pdf', [App\Http\Controllers\PermintaanPeralatanController::class, 'exportPdf'])->name('permintaan-peralatan.export-pdf');
});

require __DIR__ . '/settings.php';
