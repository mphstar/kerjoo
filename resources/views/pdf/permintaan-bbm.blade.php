<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Permintaan BBM - {{ $permintaan->tanggal->format('d-m-Y') }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 11pt;
            line-height: 1.3;
            color: #333;
            padding: 10px 20px;
        }

        .header {
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 3px double #333;
            padding-bottom: 12px;
        }

        .header h1 {
            font-size: 16pt;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .header p {
            font-size: 10pt;
            color: #666;
        }

        .info-section {
            margin-bottom: 10px;
        }

        table.info {
            width: 100%;
            border-collapse: collapse;
        }

        table.info td {
            padding: 3px 0;
            vertical-align: top;
        }

        table.info .label {
            width: 150px;
            font-weight: bold;
        }

        table.info .sep {
            width: 10px;
        }

        table.data {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }

        table.data th,
        table.data td {
            border: 1px solid #333;
            padding: 6px 10px;
            text-align: left;
        }

        table.data th {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
            font-size: 10pt;
        }

        table.data td.center {
            text-align: center;
        }

        table.data td.right {
            text-align: right;
        }

        .section-title {
            font-size: 12pt;
            font-weight: bold;
            border-bottom: 1px solid #333;
            padding-bottom: 3px;
            margin-bottom: 10px;
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
            margin-top: 15px;
            padding: 10px;
            background-color: #f9f9f9;
            border-left: 3px solid #666;
        }

        .notes-title {
            font-weight: bold;
            margin-bottom: 5px;
        }

        .signature-section {
            margin-top: 15px;
            page-break-inside: avoid;
        }
    </style>
</head>

<body>
    <div class="header">
        <h1>FORMULIR PERMINTAAN BBM</h1>
        <p>Tanggal Cetak: {{ $tanggalCetak }}</p>
    </div>

    <div class="info-section">
        <table class="info">
            <tr>
                <td class="label">Tanggal</td>
                <td class="sep">:</td>
                <td>{{ $permintaan->tanggal->locale('id')->isoFormat('D MMMM YYYY') }}</td>
            </tr>
            <tr>
                <td class="label">No Buku</td>
                <td class="sep">:</td>
                <td>{{ $permintaan->no_buku }}</td>
            </tr>
            <tr>
                <td class="label">Pengemudi</td>
                <td class="sep">:</td>
                <td>{{ $permintaan->pengemudi }}</td>
            </tr>
            <tr>
                <td class="label">Uraian</td>
                <td class="sep">:</td>
                <td>{{ $permintaan->uraian }}</td>
            </tr>
            <tr>
                <td class="label">Status</td>
                <td class="sep">:</td>
                <td>
                    <span class="status-badge status-{{ $permintaan->status }}">
                        {{ strtoupper($permintaan->status) }}
                    </span>
                </td>
            </tr>
        </table>
    </div>

    <h3 class="section-title">Data Kendaraan</h3>
    <table class="data">
        <thead>
            <tr>
                <th>Nama Kendaraan</th>
                <th>Merk</th>
                <th>No Polisi</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>{{ $permintaan->nama_kendaraan }}</td>
                <td class="center">{{ $permintaan->merk_kendaraan }}</td>
                <td class="center">{{ $permintaan->no_polisi }}</td>
            </tr>
        </tbody>
    </table>

    <h3 class="section-title">Data KM & BBM</h3>
    <table class="data">
        <thead>
            <tr>
                <th></th>
                <th>KM</th>
                <th>BBM (Liter)</th>
                <th>BBM (%)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>Awal</strong></td>
                <td class="right">{{ number_format($permintaan->km_awal, 1, ',', '.') }} km</td>
                <td class="center">{{ $permintaan->bbm_awal_liter }} Ltr</td>
                <td class="center">{{ $permintaan->bbm_awal_persen }}%</td>
            </tr>
            <tr>
                <td><strong>Akhir</strong></td>
                <td class="right">{{ $permintaan->km_akhir ? number_format($permintaan->km_akhir, 1, ',', '.') . ' km' : '-' }}</td>
                <td class="center">{{ $permintaan->bbm_akhir_liter ? $permintaan->bbm_akhir_liter . ' Ltr' : '-' }}</td>
                <td class="center">{{ $permintaan->bbm_akhir_persen !== null ? $permintaan->bbm_akhir_persen . '%' : '-' }}</td>
            </tr>
        </tbody>
    </table>

    <h3 class="section-title">BBM Diminta</h3>
    <table class="data">
        <thead>
            <tr>
                <th>Jumlah (Liter)</th>
                <th>Harga/Liter</th>
                <th>Total Harga</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td class="center">{{ $permintaan->bbm_liter }} Ltr</td>
                <td class="right">Rp {{ number_format($permintaan->bbm_harga_per_liter, 0, ',', '.') }}</td>
                <td class="right"><strong>Rp {{ number_format($permintaan->bbm_total_harga, 0, ',', '.') }}</strong></td>
            </tr>
        </tbody>
    </table>

    @if ($permintaan->catatan)
        <div class="notes">
            <div class="notes-title">Catatan:</div>
            <p>{{ $permintaan->catatan }}</p>
        </div>
    @endif

    <div class="signature-section">
        <table style="width: 100%;">
            <tr>
                <td style="width: 50%; text-align: center; vertical-align: top;">
                    <div>&nbsp;</div>
                    <div style="font-weight: bold; margin-bottom: 50px;">Mengetahui,<br>Admin / Pimpinan</div>
                    <div
                        style="font-weight: bold; text-decoration: underline; display: inline-block; min-width: 150px;">
                        {{ $adminName ?: '( _________________________ )' }}
                    </div>
                    @if (isset($adminNip) && $adminNip)
                        <div style="font-size: 10pt; margin-top: 3px;">NIP/NRP. {{ $adminNip }}</div>
                    @else
                        <div style="font-size: 10pt; margin-top: 3px;">&nbsp;</div>
                    @endif
                </td>
                <td style="width: 50%; text-align: center; vertical-align: top;">
                    <div style="margin-bottom: 4px;">{{ $lokasi }}, {{ $tanggalCetak }}</div>
                    <div style="font-weight: bold; margin-bottom: 50px;">Yang Mengajukan,</div>
                    <div
                        style="font-weight: bold; text-decoration: underline; display: inline-block; min-width: 150px;">
                        {{ $permintaan->pengguna->name ?? '________________' }}
                    </div>
                    @if (isset($permintaan->pengguna->nip_nrp) && $permintaan->pengguna->nip_nrp)
                        <div style="font-size: 10pt; margin-top: 3px;">NIP/NRP.
                            {{ $permintaan->pengguna->nip_nrp }}</div>
                    @else
                        <div style="font-size: 10pt; margin-top: 3px;">&nbsp;</div>
                    @endif
                </td>
            </tr>
        </table>
    </div>

</body>

</html>
