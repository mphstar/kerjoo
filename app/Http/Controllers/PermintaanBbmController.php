<?php

namespace App\Http\Controllers;

use App\Models\PermintaanBbm;
use App\Models\Setting;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class PermintaanBbmController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'tanggal' => 'required|date',
            'pengemudi' => 'required|string|max:255',
            'uraian' => 'required|string|max:1000',
            'nama_kendaraan' => 'required|string|max:255',
            'merk_kendaraan' => 'required|string|max:100',
            'no_polisi' => 'required|string|max:20',
            'km_awal' => 'required|numeric|min:0',
            'bbm_awal_liter' => 'required|numeric|min:0',
            'bbm_awal_persen' => 'required|integer|min:0|max:100',
            'bbm_liter' => 'required|numeric|min:0.1',
            'bbm_harga_per_liter' => 'required|numeric|min:0',
            'bbm_total_harga' => 'required|numeric|min:0',
            'km_akhir' => 'nullable|numeric|min:0',
            'bbm_akhir_liter' => 'nullable|numeric|min:0',
            'bbm_akhir_persen' => 'nullable|integer|min:0|max:100',
        ]);

        /** @var \App\Models\User $user */
        $user = $request->user();

        // Auto-generate no_buku
        $lastPermintaan = PermintaanBbm::orderBy('id', 'desc')->first();
        $nextNumber = 1;
        
        if ($lastPermintaan && is_numeric($lastPermintaan->no_buku)) {
            $nextNumber = intval($lastPermintaan->no_buku) + 1;
        }
        
        $validated['no_buku'] = str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
        $validated['pengguna_id'] = $user->id;
        $validated['status'] = 'pending';

        PermintaanBbm::create($validated);

        return redirect()->back()->with('success', 'Permintaan BBM berhasil diajukan.');
    }

    public function approve(Request $request, $id)
    {
        $permintaan = PermintaanBbm::findOrFail($id);

        /** @var \App\Models\User $user */
        $user = $request->user();

        $permintaan->update([
            'status' => 'disetujui',
            'disetujui_oleh' => $user->id,
            'waktu_persetujuan' => now(),
            'catatan' => $request->input('catatan'),
        ]);

        return redirect()->back()->with('success', 'Permintaan BBM telah disetujui.');
    }

    public function reject(Request $request, $id)
    {
        $permintaan = PermintaanBbm::findOrFail($id);

        /** @var \App\Models\User $user */
        $user = $request->user();

        $permintaan->update([
            'status' => 'ditolak',
            'disetujui_oleh' => $user->id,
            'waktu_persetujuan' => now(),
            'catatan' => $request->input('catatan'),
        ]);

        return redirect()->back()->with('success', 'Permintaan BBM telah ditolak.');
    }

    public function destroy(Request $request, $id)
    {
        $permintaan = PermintaanBbm::findOrFail($id);

        /** @var \App\Models\User $user */
        $user = $request->user();

        if ($permintaan->pengguna_id != $user->id && $user->peran != 'admin') {
            return redirect()->back()->with('error', 'Anda tidak memiliki izin untuk menghapus permintaan ini.');
        }

        $permintaan->delete();

        return redirect()->back()->with('success', 'Permintaan BBM berhasil dihapus.');
    }

    public function exportPdf($id)
    {
        $permintaan = PermintaanBbm::with(['pengguna', 'disetujuiOleh'])
            ->findOrFail($id);

        $tanggalCetak = now()->format('d F Y');
        $lokasi = 'Jember';

        // Get signature details from global settings
        $adminName = Setting::where('key', 'admin_signature_name')->value('value');
        $adminNip = Setting::where('key', 'admin_signature_nip')->value('value');

        $filename = 'Permintaan-BBM-' . $permintaan->tanggal->format('Y-m-d') . '-' . $permintaan->pengguna->name . '.pdf';
        $filename = str_replace(' ', '-', $filename);

        return Pdf::loadView('pdf.permintaan-bbm', [
            'permintaan' => $permintaan,
            'tanggalCetak' => $tanggalCetak,
            'lokasi' => $lokasi,
            'adminName' => $adminName,
            'adminNip' => $adminNip,
        ])
            ->setPaper('a4', 'landscape')
            ->stream($filename);
    }
}
