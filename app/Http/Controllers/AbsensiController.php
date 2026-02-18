<?php

namespace App\Http\Controllers;

use App\Models\Absensi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class AbsensiController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'foto' => 'required|image|mimes:jpeg,png,jpg,webp|max:10240',
            'keterangan' => 'required|string|max:255',
        ]);

        $file = $request->file('foto');

        // Generate unique filename
        $filename = date('Ymd_His') . '_' . Str::random(8) . '.jpg';

        // Ensure uploads directory exists
        $uploadPath = public_path('uploads/absensi');
        if (!is_dir($uploadPath)) {
            mkdir($uploadPath, 0755, true);
        }

        // Compress image using GD
        $this->compressAndSave($file->getPathname(), $uploadPath . '/' . $filename);

        Absensi::create([
            'pengguna_id' => Auth::id(),
            'foto' => $filename,
            'keterangan' => $validated['keterangan'],
            'tanggal' => now()->toDateString(),
        ]);

        return redirect()->back()->with('success', 'Absensi berhasil disimpan.');
    }

    public function destroy($id)
    {
        $absensi = Absensi::where('pengguna_id', Auth::id())->findOrFail($id);

        // Delete file
        $filePath = public_path('uploads/absensi/' . $absensi->foto);
        if (file_exists($filePath)) {
            unlink($filePath);
        }

        $absensi->delete();

        return redirect()->back()->with('success', 'Absensi berhasil dihapus.');
    }

    /**
     * Compress image using GD library.
     * Resizes to max 1200px width and encodes as JPEG with quality 80.
     */
    private function compressAndSave(string $sourcePath, string $destPath): void
    {
        $info = getimagesize($sourcePath);
        $mime = $info['mime'] ?? '';

        // Create image resource based on MIME type
        $source = match ($mime) {
            'image/jpeg' => imagecreatefromjpeg($sourcePath),
            'image/png' => imagecreatefrompng($sourcePath),
            'image/webp' => imagecreatefromwebp($sourcePath),
            default => imagecreatefromjpeg($sourcePath),
        };

        if (!$source) {
            // Fallback: just copy the file as-is
            copy($sourcePath, $destPath);
            return;
        }

        $origWidth = imagesx($source);
        $origHeight = imagesy($source);

        // Scale down if wider than 1200px
        $maxWidth = 1200;
        if ($origWidth > $maxWidth) {
            $newWidth = $maxWidth;
            $newHeight = (int) ($origHeight * ($maxWidth / $origWidth));

            $resized = imagecreatetruecolor($newWidth, $newHeight);
            imagecopyresampled($resized, $source, 0, 0, 0, 0, $newWidth, $newHeight, $origWidth, $origHeight);
            imagedestroy($source);
            $source = $resized;
        }

        // Save as JPEG with quality 80
        imagejpeg($source, $destPath, 80);
        imagedestroy($source);
    }
}
