<?php

namespace App\Http\Controllers;

use App\Models\PermintaanPeralatan;
use App\Models\DetailPeralatan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;

class PermintaanPeralatanController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'bulan' => 'required|integer|min:1|max:12',
            'tahun' => 'required|integer|min:2020',
            'items' => 'required|array|min:1',
            'items.*.nama_peralatan' => 'required|string|max:255',
            'items.*.jumlah' => 'required|integer|min:1',
            'items.*.satuan' => 'required|string|max:50',
        ]);

        DB::beginTransaction();
        try {
            /** @var \App\Models\User $user */
            $user = $request->user();

            $permintaan = PermintaanPeralatan::create([
                'pengguna_id' => $user->id,
                'bulan' => $validated['bulan'],
                'tahun' => $validated['tahun'],
                'waktu_pengajuan' => now(),
                'status' => 'pending',
            ]);

            foreach ($validated['items'] as $item) {
                DetailPeralatan::create([
                    'permintaan_peralatan_id' => $permintaan->id,
                    'nama_peralatan' => $item['nama_peralatan'],
                    'jumlah' => $item['jumlah'],
                    'satuan' => $item['satuan'],
                ]);
            }

            DB::commit();
            return redirect()->back()->with('success', 'Permintaan peralatan berhasil diajukan.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Gagal mengajukan permintaan peralatan.');
        }
    }

    public function approve(Request $request, $id)
    {
        $permintaan = PermintaanPeralatan::findOrFail($id);

        /** @var \App\Models\User $user */
        $user = $request->user();

        $permintaan->update([
            'status' => 'disetujui',
            'disetujui_oleh' => $user->id,
            'waktu_persetujuan' => now(),
            'catatan' => $request->input('catatan'),
        ]);

        return redirect()->back()->with('success', 'Permintaan peralatan telah disetujui.');
    }

    public function reject(Request $request, $id)
    {
        $permintaan = PermintaanPeralatan::findOrFail($id);

        /** @var \App\Models\User $user */
        $user = $request->user();

        $permintaan->update([
            'status' => 'ditolak',
            'disetujui_oleh' => $user->id,
            'waktu_persetujuan' => now(),
            'catatan' => $request->input('catatan'),
        ]);

        return redirect()->back()->with('success', 'Permintaan peralatan telah ditolak.');
    }

    public function destroy(Request $request, $id)
    {
        $permintaan = PermintaanPeralatan::findOrFail($id);

        /** @var \App\Models\User $user */
        $user = $request->user();

        // Only allow deleting own requests or admin can delete any (use != to handle type casting)
        if ($permintaan->pengguna_id != $user->id && $user->peran != 'admin') {
            return redirect()->back()->with('error', 'Anda tidak memiliki izin untuk menghapus permintaan ini.');
        }

        $permintaan->delete();

        return redirect()->back()->with('success', 'Permintaan peralatan berhasil dihapus.');
    }

    public function exportPdf($id)
    {
        $permintaan = PermintaanPeralatan::with(['pengguna', 'disetujuiOleh', 'details'])
            ->findOrFail($id);

        $namaBulan = [
            1 => 'Januari',
            2 => 'Februari',
            3 => 'Maret',
            4 => 'April',
            5 => 'Mei',
            6 => 'Juni',
            7 => 'Juli',
            8 => 'Agustus',
            9 => 'September',
            10 => 'Oktober',
            11 => 'November',
            12 => 'Desember'
        ];

        $periode = $namaBulan[$permintaan->bulan] . ' ' . $permintaan->tahun;
        $tanggalCetak = now()->format('d F Y');
        $lokasi = 'Jember'; // Change this as needed

        $filename = 'Permintaan-Peralatan-' . $periode . '-' . $permintaan->pengguna->name . '.pdf';
        $filename = str_replace(' ', '-', $filename);

        return Pdf::loadView('pdf.permintaan-peralatan', [
            'permintaan' => $permintaan,
            'periode' => $periode,
            'tanggalCetak' => $tanggalCetak,
            'lokasi' => $lokasi,
        ])
            ->setPaper('a4', 'portrait')
            ->stream($filename);
    }
}
