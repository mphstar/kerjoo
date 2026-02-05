<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <title>Laporan Penugasan - {{ $pelaksana->name }}</title>
    <style>
        @page {
            margin: 2.5cm 2.5cm;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 10pt;
            line-height: 1.2;
            color: #000;
            margin: 18;
        }

        /* Header */
        .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }

        .header h1 {
            font-size: 14pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 3px;
        }

        .header .subtitle {
            font-size: 10pt;
        }

        /* Info Table */
        .info-section {
            margin-bottom: 15px;
        }

        .info-table {
            width: 100%;
            border-collapse: collapse;
        }

        .info-table td {
            padding: 2px 0;
            vertical-align: top;
        }

        .info-table .label {
            width: 120px;
            font-weight: bold;
        }

        .info-table .separator {
            width: 10px;
        }

        /* Section Title */
        .section-title {
            font-size: 11pt;
            font-weight: bold;
            background-color: #333;
            color: #fff;
            padding: 5px 10px;
            margin: 15px 0 10px 0;
        }

        .subsection-title {
            font-size: 10pt;
            font-weight: bold;
            border-bottom: 1px solid #333;
            padding-bottom: 3px;
            margin: 10px 0 8px 0;
        }

        /* Photo Gallery Section */
        .photo-gallery {
            margin-bottom: 20px;
        }

        .gallery-task-title {
            font-weight: bold;
            font-size: 10pt;
            background-color: #f0f0f0;
            padding: 5px 8px;
            border: 1px solid #000;
            border-bottom: none;
        }

        .gallery-photos {
            border: 1px solid #000;
            padding: 8px;
        }

        .gallery-grid {
            width: 100%;
            border-collapse: collapse;
        }

        .gallery-grid td {
            width: 25%;
            text-align: center;
            vertical-align: top;
            padding: 4px;
        }

        .gallery-photo-box {
            width: 100%;
            height: 80px;
            border: 1px solid #ccc;
            overflow: hidden;
            background-color: #fff;
            margin-bottom: 2px;
        }

        .gallery-photo-box img {
            width: 100%;
            height: 80px;
            object-fit: contain;
        }

        .gallery-photo-label {
            font-size: 7pt;
            color: #666;
        }

        /* Task Card for Regular Tasks */
        .task-card {
            border: 1px solid #000;
            margin-bottom: 6px;
            page-break-inside: avoid;
        }

        .task-header {
            background-color: #f0f0f0;
            padding: 5px 8px;
            border-bottom: 1px solid #000;
        }

        .task-title {
            font-weight: bold;
            font-size: 9pt;
        }

        .task-kategori {
            font-weight: normal;
            font-size: 8pt;
            color: #666;
        }

        .task-meta {
            font-size: 8pt;
            color: #333;
            margin-top: 3px;
        }

        .task-body {
            padding: 5px 8px;
            font-size: 9pt;
        }

        .status-badge {
            font-size: 7pt;
            padding: 2px 6px;
            display: inline-block;
            float: right;
        }

        .status-selesai {
            background-color: #d1fae5;
        }

        .status-dikerjakan {
            background-color: #dbeafe;
        }

        .status-pending {
            background-color: #fef3c7;
        }

        /* Summary list */
        .summary-list {
            margin: 0;
            padding-left: 15px;
            font-size: 8pt;
        }

        .summary-list li {
            margin-bottom: 2px;
        }

        /* Empty State */
        .empty-state {
            text-align: center;
            padding: 20px;
            font-style: italic;
            color: #666;
        }

        /* Signature Section */
        .signature-section {
            margin-top: 40px;
            page-break-inside: avoid;
        }

        .signature-table {
            width: 100%;
        }

        .signature-cell {
            width: 45%;
            text-align: center;
            vertical-align: top;
            padding: 10px;
        }

        .signature-title {
            font-size: 9pt;
            margin-bottom: 50px;
        }

        .signature-line {
            border-bottom: 1px solid #000;
            margin: 0 auto;
            width: 150px;
        }

        .signature-name {
            font-weight: bold;
            font-size: 10pt;
            margin-top: 5px;
        }

        /* Grid table for tasks */
        .tasks-grid {
            width: 100%;
            border-collapse: collapse;
        }

        .tasks-grid td {
            width: 50%;
            vertical-align: top;
            padding: 3px;
        }
    </style>
</head>

<body>
    <!-- Header -->
    <div class="header">
        <h1>Laporan Penugasan</h1>
        <div class="subtitle">Sistem Logbook Penugasan</div>
    </div>

    <!-- Info Section -->
    <div class="info-section">
        <table class="info-table">
            <tr>
                <td class="label">Pelaksana</td>
                <td class="separator">:</td>
                <td>{{ $pelaksana->name }}</td>
            </tr>
            <tr>
                <td class="label">Kategori</td>
                <td class="separator">:</td>
                <td>{{ $pelaksana->kategori->nama ?? '-' }}</td>
            </tr>
            <tr>
                <td class="label">Periode</td>
                <td class="separator">:</td>
                <td>
                    @if ($dateFrom && $dateTo)
                        {{ \Carbon\Carbon::parse($dateFrom)->locale('id')->isoFormat('D MMMM YYYY') }} s/d
                        {{ \Carbon\Carbon::parse($dateTo)->locale('id')->isoFormat('D MMMM YYYY') }}
                    @elseif($dateFrom)
                        Dari {{ \Carbon\Carbon::parse($dateFrom)->locale('id')->isoFormat('D MMMM YYYY') }}
                    @elseif($dateTo)
                        Sampai {{ \Carbon\Carbon::parse($dateTo)->locale('id')->isoFormat('D MMMM YYYY') }}
                    @else
                        Semua waktu
                    @endif
                </td>
            </tr>
            @if (isset($status) && $status)
                <tr>
                    <td class="label">Filter Status</td>
                    <td class="separator">:</td>
                    <td>
                        @switch($status)
                            @case('pending')
                                Pending
                            @break

                            @case('sedang_dikerjakan')
                                Aktif / Dikerjakan
                            @break

                            @case('selesai')
                                Selesai
                            @break

                            @default
                                {{ $status }}
                        @endswitch
                    </td>
                </tr>
            @endif
            <tr>
                <td class="label">Tanggal Cetak</td>
                <td class="separator">:</td>
                <td>{{ now()->locale('id')->isoFormat('dddd, D MMMM YYYY [pukul] HH:mm') }}</td>
            </tr>
        </table>
    </div>

    @php
        // Flatten all penugasan into single collection
        $allPenugasan = collect();
        foreach ($groupedPenugasan as $date => $list) {
            foreach ($list as $p) {
                $allPenugasan->push($p);
            }
        }

        // Separate penugasan with photos vs without photos
        $photoTasks = $allPenugasan->filter(function ($p) {
            // Check if tugas has persyaratan foto OR has actual photos
            $hasPersyaratanFoto =
                isset($p->tugas->persyaratan) &&
                (is_array($p->tugas->persyaratan)
                    ? $p->tugas->persyaratan['foto'] ?? false
                    : json_decode($p->tugas->persyaratan, true)['foto'] ?? false);

            $hasActualPhotos =
                $p->items &&
                $p->items
                    ->filter(function ($item) {
                        return $item->foto_sebelum || $item->foto_sesudah;
                    })
                    ->count() > 0;

            return $hasPersyaratanFoto || $hasActualPhotos;
        });

        $regularTasks = $allPenugasan->filter(function ($p) {
            $hasPersyaratanFoto =
                isset($p->tugas->persyaratan) &&
                (is_array($p->tugas->persyaratan)
                    ? $p->tugas->persyaratan['foto'] ?? false
                    : json_decode($p->tugas->persyaratan, true)['foto'] ?? false);

            $hasActualPhotos =
                $p->items &&
                $p->items
                    ->filter(function ($item) {
                        return $item->foto_sebelum || $item->foto_sesudah;
                    })
                    ->count() > 0;

            return !$hasPersyaratanFoto && !$hasActualPhotos;
        });

        // Group photo tasks by tugas name
        $groupedPhotoTasks = $photoTasks->groupBy(function ($p) {
            return $p->tugas->nama ?? 'Tugas';
        });
    @endphp

    @if ($photoTasks->count() > 0)
        <!-- SECTION 1: DOKUMENTASI FOTO -->
        <div class="section-title">DOKUMENTASI FOTO</div>

        @foreach ($groupedPhotoTasks as $taskName => $tasks)
            <div class="photo-gallery">
                <div class="gallery-task-title">
                    {{ $taskName }}
                    <span style="font-weight: normal; font-size: 8pt; color: #666;">
                        — {{ $tasks->first()->tugas->kategori->nama ?? '-' }} ({{ $tasks->count() }} penugasan)
                    </span>
                </div>
                <div class="gallery-photos">
                    @php
                        // Collect all photos from all items in all tasks of this group
                        $allPhotos = collect();
                        foreach ($tasks as $task) {
                            if ($task->items) {
                                foreach ($task->items as $item) {
                                    if ($item->foto_sebelum) {
                                        $allPhotos->push([
                                            'type' => 'Sebelum',
                                            'path' => $item->foto_sebelum,
                                            'item' => $item->nama ?? '',
                                        ]);
                                    }
                                    if ($item->foto_sesudah) {
                                        $allPhotos->push([
                                            'type' => 'Sesudah',
                                            'path' => $item->foto_sesudah,
                                            'item' => $item->nama ?? '',
                                        ]);
                                    }
                                }
                            }
                        }
                    @endphp

                    @if ($allPhotos->count() > 0)
                        <table class="gallery-grid">
                            @foreach ($allPhotos->chunk(4) as $photoRow)
                                <tr>
                                    @foreach ($photoRow as $photo)
                                        <td>
                                            <div class="gallery-photo-box">
                                                @if (file_exists(public_path($photo['path'])))
                                                    <img src="{{ public_path($photo['path']) }}"
                                                        alt="{{ $photo['type'] }}">
                                                @endif
                                            </div>
                                            <div class="gallery-photo-label">{{ $photo['type'] }}</div>
                                        </td>
                                    @endforeach
                                    @for ($i = $photoRow->count(); $i < 4; $i++)
                                        <td></td>
                                    @endfor
                                </tr>
                            @endforeach
                        </table>
                    @else
                        <div class="empty-state" style="padding: 10px;">Tidak ada foto</div>
                    @endif
                </div>
            </div>
        @endforeach
    @endif

    @if ($regularTasks->count() > 0)
        <!-- SECTION 2: PENUGASAN LAINNYA -->
        <div class="section-title">PENUGASAN LAINNYA</div>

        @php
            // Group regular tasks by date
            $groupedRegular = $regularTasks
                ->groupBy(function ($p) {
                    return $p->created_at->format('Y-m-d');
                })
                ->sortKeysDesc();
        @endphp

        @foreach ($groupedRegular as $date => $taskList)
            <div class="subsection-title">
                {{ \Carbon\Carbon::parse($date)->locale('id')->isoFormat('dddd, D MMMM YYYY') }}
            </div>

            <table class="tasks-grid">
                @foreach ($taskList->chunk(2) as $taskPair)
                    <tr>
                        @foreach ($taskPair as $penugasan)
                            @php
                                $totalDuration = $penugasan->items ? $penugasan->items->sum('durasi_detik') : 0;
                                $hours = floor($totalDuration / 3600);
                                $minutes = floor(($totalDuration % 3600) / 60);
                                $durationText = '';
                                if ($hours > 0) {
                                    $durationText = $hours . 'j ' . $minutes . 'm';
                                } elseif ($minutes > 0) {
                                    $durationText = $minutes . ' menit';
                                }

                                $statusClass = match ($penugasan->status) {
                                    'selesai' => 'status-selesai',
                                    'sedang_dikerjakan' => 'status-dikerjakan',
                                    default => 'status-pending',
                                };
                                $statusText = match ($penugasan->status) {
                                    'selesai' => 'SELESAI',
                                    'sedang_dikerjakan' => 'AKTIF',
                                    default => 'PENDING',
                                };
                            @endphp
                            <td>
                                <div class="task-card">
                                    <div class="task-header">
                                        <span class="status-badge {{ $statusClass }}">{{ $statusText }}</span>
                                        <div class="task-title">{{ $penugasan->tugas->nama ?? 'Tugas' }}</div>
                                        <div class="task-kategori">{{ $penugasan->tugas->kategori->nama ?? '-' }}</div>
                                        @if ($durationText)
                                            <div class="task-meta">Durasi: {{ $durationText }}</div>
                                        @endif
                                    </div>
                                    <div class="task-body">
                                        @if ($penugasan->items && $penugasan->items->count() > 0)
                                            @php
                                                $summaries = $penugasan->items
                                                    ->filter(fn($i) => $i->ringkasan_teks)
                                                    ->pluck('ringkasan_teks');
                                            @endphp
                                            @if ($summaries->count() > 0)
                                                <ul class="summary-list">
                                                    @foreach ($summaries->take(3) as $summary)
                                                        <li>{{ Str::limit($summary, 50) }}</li>
                                                    @endforeach
                                                </ul>
                                            @else
                                                <span style="color: #999; font-size: 8pt;">Tidak ada ringkasan</span>
                                            @endif
                                        @else
                                            <span style="color: #999; font-size: 8pt;">Belum ada item</span>
                                        @endif
                                    </div>
                                </div>
                            </td>
                        @endforeach
                        @if ($taskPair->count() == 1)
                            <td></td>
                        @endif
                    </tr>
                @endforeach
            </table>
        @endforeach
    @endif

    @if ($allPenugasan->count() == 0)
        <div class="empty-state">Tidak ada penugasan dalam periode ini</div>
    @endif

    <!-- Signature Section -->
    <div class="signature-section">
        <table class="signature-table">
            <tr>
                <td class="signature-cell">
                    <div class="signature-title">Penanggung Jawab,</div>
                    <div class="signature-line"></div>
                    <div class="signature-name">{{ $adminUser->name ?? '____________________' }}</div>
                </td>
                <td style="width: 10%;"></td>
                <td class="signature-cell">
                    <div class="signature-title">Pelaksana,</div>
                    <div class="signature-line"></div>
                    <div class="signature-name">{{ $pelaksana->name }}</div>
                    @if (isset($pelaksana->nip_nrp) && $pelaksana->nip_nrp)
                        <div style="font-size: 8pt; margin-top: 2px;">NIP/NRP: {{ $pelaksana->nip_nrp }}</div>
                    @endif
                </td>
            </tr>
        </table>
    </div>
</body>

</html>
