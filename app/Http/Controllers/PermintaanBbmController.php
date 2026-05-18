<?php

namespace App\Http\Controllers;

use App\Models\PermintaanBbm;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
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
            'lampiran_foto' => 'nullable|array|max:5',
            'lampiran_foto.*' => 'image|mimes:jpeg,png,jpg,webp|max:10240',
        ]);

        /** @var \App\Models\User $user */
        $user = $request->user();

        // Handle photo uploads
        $fotoFilenames = [];
        if ($request->hasFile('lampiran_foto')) {
            $uploadPath = public_path('uploads/bbm');
            if (!is_dir($uploadPath)) {
                mkdir($uploadPath, 0755, true);
            }

            foreach ($request->file('lampiran_foto') as $file) {
                $filename = date('Ymd_His') . '_' . Str::random(8) . '.jpg';
                $this->compressAndSave($file->getPathname(), $uploadPath . '/' . $filename);
                $fotoFilenames[] = $filename;
            }
        }

        // Auto-generate no_buku
        $lastPermintaan = PermintaanBbm::orderBy('id', 'desc')->first();
        $nextNumber = 1;
        
        if ($lastPermintaan && is_numeric($lastPermintaan->no_buku)) {
            $nextNumber = intval($lastPermintaan->no_buku) + 1;
        }
        
        $validated['no_buku'] = str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
        $validated['pengguna_id'] = $user->id;
        $validated['status'] = 'pending';

        // Remove raw file data from validated array, replace with processed filenames
        unset($validated['lampiran_foto']);
        $validated['lampiran_foto'] = !empty($fotoFilenames) ? $fotoFilenames : null;

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

        // Delete attached photos
        if (!empty($permintaan->lampiran_foto)) {
            foreach ($permintaan->lampiran_foto as $foto) {
                $filePath = public_path('uploads/bbm/' . $foto);
                if (file_exists($filePath)) {
                    unlink($filePath);
                }
            }
        }

        $permintaan->delete();

        return redirect()->back()->with('success', 'Permintaan BBM berhasil dihapus.');
    }

    /**
     * Compress image using GD library.
     * Resizes to max 1200px width and encodes as JPEG with quality 80.
     */
    private function compressAndSave(string $sourcePath, string $destPath): void
    {
        $info = getimagesize($sourcePath);
        $mime = $info['mime'] ?? '';

        $source = match ($mime) {
            'image/jpeg' => imagecreatefromjpeg($sourcePath),
            'image/png' => imagecreatefrompng($sourcePath),
            'image/webp' => imagecreatefromwebp($sourcePath),
            default => imagecreatefromjpeg($sourcePath),
        };

        if (!$source) {
            copy($sourcePath, $destPath);
            return;
        }

        $origWidth = imagesx($source);
        $origHeight = imagesy($source);

        $maxWidth = 1200;
        if ($origWidth > $maxWidth) {
            $newWidth = $maxWidth;
            $newHeight = (int) ($origHeight * ($maxWidth / $origWidth));

            $resized = imagecreatetruecolor($newWidth, $newHeight);
            imagecopyresampled($resized, $source, 0, 0, 0, 0, $newWidth, $newHeight, $origWidth, $origHeight);
            imagedestroy($source);
            $source = $resized;
        }

        imagejpeg($source, $destPath, 80);
        imagedestroy($source);
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
