<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Permintaan Peralatan - {{ $periode }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 1.5;
            color: #333;
            padding: 20px;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px double #333;
            padding-bottom: 15px;
        }

        .header h1 {
            font-size: 16pt;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .header h2 {
            font-size: 14pt;
            font-weight: normal;
            margin-bottom: 5px;
        }

        .header p {
            font-size: 10pt;
            color: #666;
        }

        .info-section {
            margin-bottom: 20px;
        }

        .info-row {
            display: flex;
            margin-bottom: 5px;
        }

        .info-label {
            width: 150px;
            font-weight: bold;
        }

        .info-value {
            flex: 1;
        }

        table.items {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }

        table.items th,
        table.items td {
            border: 1px solid #333;
            padding: 8px 12px;
            text-align: left;
        }

        table.items th {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
        }

        table.items td.center {
            text-align: center;
        }

        table.items td.number {
            text-align: right;
        }

        .signature-section {
            margin-top: 50px;
            page-break-inside: avoid;
        }

        .signature-row {
            display: flex;
            justify-content: space-between;
        }

        .signature-box {
            width: 45%;
            text-align: center;
        }

        .signature-box .title {
            font-weight: bold;
            margin-bottom: 60px;
        }

        .signature-box .name {
            font-weight: bold;
            border-top: 1px solid #333;
            padding-top: 5px;
            display: inline-block;
            min-width: 150px;
        }

        .signature-box .position {
            font-size: 10pt;
            color: #666;
        }

        .date-location {
            text-align: right;
            margin-bottom: 20px;
        }

        .status-badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 3px;
            font-size: 10pt;
            font-weight: bold;
        }

        .status-pending {
            background-color: #fef3c7;
            color: #92400e;
        }

        .status-disetujui {
            background-color: #d1fae5;
            color: #065f46;
        }

        .status-ditolak {
            background-color: #fee2e2;
            color: #991b1b;
        }

        .notes {
            margin-top: 20px;
            padding: 10px;
            background-color: #f9f9f9;
            border-left: 3px solid #666;
        }

        .notes-title {
            font-weight: bold;
            margin-bottom: 5px;
        }
    </style>
</head>

<body>
    <div class="header">
        <h1>FORMULIR PERMINTAAN PERALATAN</h1>
        <h2>Periode: {{ $periode }}</h2>
        <p>Tanggal Cetak: {{ $tanggalCetak }}</p>
    </div>

    <div class="info-section">
        <table style="width: 100%;">
            <tr>
                <td style="width: 150px;"><strong>Nama Pemohon</strong></td>
                <td style="width: 10px;">:</td>
                <td>{{ $permintaan->pengguna->name ?? '-' }}</td>
            </tr>
            <tr>
                <td><strong>Email</strong></td>
                <td>:</td>
                <td>{{ $permintaan->pengguna->email ?? '-' }}</td>
            </tr>
            <tr>
                <td><strong>Tanggal Pengajuan</strong></td>
                <td>:</td>
                <td>{{ $permintaan->waktu_pengajuan->format('d F Y, H:i') }}</td>
            </tr>
            <tr>
                <td><strong>Status</strong></td>
                <td>:</td>
                <td>
                    <span class="status-badge status-{{ $permintaan->status }}">
                        {{ strtoupper($permintaan->status) }}
                    </span>
                </td>
            </tr>
            @if ($permintaan->status !== 'pending')
                <tr>
                    <td><strong>Diproses Oleh</strong></td>
                    <td>:</td>
                    <td>{{ $permintaan->disetujuiOleh->name ?? '-' }}</td>
                </tr>
                <tr>
                    <td><strong>Tanggal Proses</strong></td>
                    <td>:</td>
                    <td>{{ $permintaan->waktu_persetujuan ? $permintaan->waktu_persetujuan->format('d F Y, H:i') : '-' }}
                    </td>
                </tr>
            @endif
        </table>
    </div>

    <h3 style="margin-bottom: 10px; border-bottom: 1px solid #333; padding-bottom: 5px;">Daftar Peralatan yang Diminta
    </h3>

    <table class="items">
        <thead>
            <tr>
                <th style="width: 50px;">No</th>
                <th>Nama Peralatan</th>
                <th style="width: 80px;">Jumlah</th>
                <th style="width: 100px;">Satuan</th>
            </tr>
        </thead>
        <tbody>
            @forelse($permintaan->details as $index => $detail)
                <tr>
                    <td class="center">{{ $index + 1 }}</td>
                    <td>{{ $detail->nama_peralatan }}</td>
                    <td class="number">{{ $detail->jumlah }}</td>
                    <td class="center">{{ $detail->satuan }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="4" class="center">Tidak ada data peralatan</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    @if ($permintaan->catatan)
        <div class="notes">
            <div class="notes-title">Catatan:</div>
            <p>{{ $permintaan->catatan }}</p>
        </div>
    @endif

    <div class="signature-section">
        <div class="date-location">
            {{ $lokasi }}, {{ $tanggalCetak }}
        </div>

        <table style="width: 100%;">
            <tr>

                <td style="width: 50%; text-align: center; vertical-align: top;">
                    <div style="font-weight: bold; margin-bottom: 60px;">Mengetahui/Menyetujui,</div>
                    <div
                        style="font-weight: bold; border-top: 1px solid #333; padding-top: 5px; display: inline-block; min-width: 150px;">
                        {{ $permintaan->disetujuiOleh->name ?? '________________' }}
                    </div>
                    <div style="font-size: 10pt; color: #666;">Penanggung Jawab</div>
                </td>
                <td style="width: 50%; text-align: center; vertical-align: top;">
                    <div style="font-weight: bold; margin-bottom: 60px;">Yang Mengajukan,</div>
                    <div
                        style="font-weight: bold; border-top: 1px solid #333; padding-top: 5px; display: inline-block; min-width: 150px;">
                        {{ $permintaan->pengguna->name ?? '________________' }}
                    </div>
                    <div style="font-size: 10pt; color: #666;">Pelaksana</div>
                </td>
            </tr>
        </table>
    </div>
</body>

</html>
