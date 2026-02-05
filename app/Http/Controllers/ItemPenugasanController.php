<?php

namespace App\Http\Controllers;

use App\Models\ItemPenugasan;
use App\Models\Penugasan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;

class ItemPenugasanController extends Controller
{
    /**
     * Create a new item (session) for penugasan.
     */
    public function store(Request $request, $penugasanId)
    {
        $penugasan = Penugasan::findOrFail($penugasanId);

        // Verify ownership (use != instead of !== to handle type casting differences)
        if ($penugasan->pengguna_id != Auth::id()) {
            return redirect()->back()->with('error', 'Anda tidak memiliki akses ke penugasan ini.');
        }

        // Count existing items to name the new one
        $count = $penugasan->items()->count() + 1;
        $namaItem = $penugasan->tugas->nama . " #" . $count;

        ItemPenugasan::create([
            'penugasan_id' => $penugasan->id,
            'nama' => $namaItem,
            'status' => 'pending',
        ]);

        return redirect()->back()->with('success', 'Subtask baru berhasil ditambahkan.');
    }

    /**
     * Start timer for an item and capture foto sebelum.
     */
    public function startTimer(Request $request, $penugasanId, $itemId)
    {
        $item = ItemPenugasan::where('penugasan_id', $penugasanId)
            ->findOrFail($itemId);

        // Verify ownership (use != instead of !== to handle type casting differences)
        $penugasan = $item->penugasan;
        if ($penugasan->pengguna_id != Auth::id()) {
            return redirect()->back()->with('error', 'Anda tidak memiliki akses ke item ini.');
        }

        // Check if already started
        if ($item->waktu_mulai) {
            return redirect()->back()->with('error', 'Timer sudah dimulai sebelumnya.');
        }

        // Check persyaratan for foto
        $persyaratan = $penugasan->tugas->persyaratan ?? [];

        $validated = $request->validate([
            'foto_sebelum' => ($persyaratan['foto'] ?? false) ? 'required|image|max:10240' : 'nullable|image|max:10240',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
        ]);

        // Validate location if penugasan has location requirement
        if ($penugasan->lokasi_latitude && $penugasan->lokasi_longitude && $penugasan->lokasi_radius) {
            // Location is required for this penugasan
            if (!isset($validated['latitude']) || !isset($validated['longitude'])) {
                return redirect()->back()->with('error', 'Lokasi diperlukan untuk memulai tugas ini. Pastikan GPS aktif.');
            }

            // Calculate distance
            $distance = $this->calculateDistance(
                $validated['latitude'],
                $validated['longitude'],
                $penugasan->lokasi_latitude,
                $penugasan->lokasi_longitude
            );

            // Check if within radius (blocking validation)
            if ($distance > $penugasan->lokasi_radius) {
                return redirect()->back()->with(
                    'error',
                    "Anda berada di luar area kerja. Jarak Anda: " . round($distance) . "m, Radius yang diizinkan: {$penugasan->lokasi_radius}m"
                );
            }
        }

        // Handle foto sebelum upload
        $fotoPath = null;
        if ($request->hasFile('foto_sebelum')) {
            $fotoPath = $this->uploadWithWatermark(
                $request->file('foto_sebelum'),
                'sebelum',
                $penugasanId,
                $itemId,
                $item->nama,
                $validated['latitude'] ?? null,
                $validated['longitude'] ?? null
            );
        }

        // Update item
        $item->waktu_mulai = now();
        $item->status = 'sedang_dikerjakan';
        $item->foto_sebelum = $fotoPath;
        $item->foto_sebelum_latitude = $validated['latitude'] ?? null;
        $item->foto_sebelum_longitude = $validated['longitude'] ?? null;
        $item->save();

        // Update parent penugasan status
        if ($penugasan->status == 'pending') {
            $penugasan->status = 'sedang_dikerjakan';
            $penugasan->waktu_mulai = now();
            $penugasan->save();
        }

        return redirect()->back()->with('success', 'Timer dimulai.');
    }

    /**
     * Stop timer for an item and capture foto sesudah.
     */
    public function stopTimer(Request $request, $penugasanId, $itemId)
    {
        $item = ItemPenugasan::where('penugasan_id', $penugasanId)
            ->findOrFail($itemId);

        // Verify ownership (use != instead of !== to handle type casting differences)
        $penugasan = $item->penugasan;
        if ($penugasan->pengguna_id != Auth::id()) {
            return redirect()->back()->with('error', 'Anda tidak memiliki akses ke item ini.');
        }

        // Check if timer was started
        if (!$item->waktu_mulai) {
            return redirect()->back()->with('error', 'Timer belum dimulai.');
        }

        // Check if already stopped
        if ($item->waktu_selesai) {
            return redirect()->back()->with('error', 'Timer sudah dihentikan sebelumnya.');
        }

        // Check persyaratan
        $persyaratan = $penugasan->tugas->persyaratan ?? [];

        $validated = $request->validate([
            'foto_sesudah' => ($persyaratan['foto'] ?? false) ? 'required|image|max:10240' : 'nullable|image|max:10240',
            'ringkasan_teks' => ($persyaratan['teks'] ?? false) ? 'required|string' : 'nullable|string',
            'file_lampiran' => ($persyaratan['file'] ?? false) ? 'required|file|max:10240' : 'nullable|file|max:10240',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
        ]);

        // Validate location if penugasan has location requirement
        if ($penugasan->lokasi_latitude && $penugasan->lokasi_longitude && $penugasan->lokasi_radius) {
            // Location is required for this penugasan
            if (!isset($validated['latitude']) || !isset($validated['longitude'])) {
                return redirect()->back()->with('error', 'Lokasi diperlukan untuk menyelesaikan tugas ini. Pastikan GPS aktif.');
            }

            // Calculate distance
            $distance = $this->calculateDistance(
                $validated['latitude'],
                $validated['longitude'],
                $penugasan->lokasi_latitude,
                $penugasan->lokasi_longitude
            );

            // Check if within radius (blocking validation)
            if ($distance > $penugasan->lokasi_radius) {
                return redirect()->back()->with(
                    'error',
                    "Anda berada di luar area kerja. Jarak Anda: " . round($distance) . "m, Radius yang diizinkan: {$penugasan->lokasi_radius}m"
                );
            }
        }

        // Handle foto sesudah upload
        $fotoPath = null;
        if ($request->hasFile('foto_sesudah')) {
            $fotoPath = $this->uploadWithWatermark(
                $request->file('foto_sesudah'),
                'sesudah',
                $penugasanId,
                $itemId,
                $item->nama,
                $validated['latitude'] ?? null,
                $validated['longitude'] ?? null
            );
        }

        // Handle file lampiran
        $filePath = null;
        if ($request->hasFile('file_lampiran')) {
            $filePath = $this->uploadFile($request->file('file_lampiran'), $penugasanId, $itemId);
        }

        // Calculate duration (use abs to handle any timezone edge cases)
        $waktuSelesai = now();
        $waktuMulai = \Carbon\Carbon::parse($item->waktu_mulai);
        $durasiDetik = abs($waktuSelesai->diffInSeconds($waktuMulai));

        // Update item
        $item->waktu_selesai = $waktuSelesai;
        $item->durasi_detik = $durasiDetik;
        $item->foto_sesudah = $fotoPath;
        $item->foto_sesudah_latitude = $validated['latitude'] ?? null;
        $item->foto_sesudah_longitude = $validated['longitude'] ?? null;
        $item->file_lampiran = $filePath;
        $item->ringkasan_teks = $validated['ringkasan_teks'] ?? null;
        $item->status = 'selesai';
        $item->save();

        // NOTE: We no longer auto-complete the penugasan here.
        // User must manually click "Selesaikan Tugas" button.

        return redirect()->back()->with('success', 'Timer dihentikan. Item selesai.');
    }

    /**
     * Upload file lampiran.
     */
    public function uploadFile($file, $penugasanId, $itemId)
    {
        $filename = "{$penugasanId}_{$itemId}_" . time() . '.' . $file->getClientOriginalExtension();
        $path = 'uploads/file';

        // Ensure directory exists
        $fullPath = public_path($path);
        if (!File::exists($fullPath)) {
            File::makeDirectory($fullPath, 0755, true);
        }

        $file->move($fullPath, $filename);

        return $path . '/' . $filename;
    }

    /**
     * Upload foto with watermark and compression.
     */
    private function uploadWithWatermark($file, $type, $penugasanId, $itemId, $itemName, $latitude = null, $longitude = null)
    {
        $timestamp = time();
        $filename = "{$penugasanId}_{$itemId}_{$timestamp}.jpg";
        $path = "uploads/foto/{$type}";

        // Ensure directory exists
        $fullPath = public_path($path);
        if (!File::exists($fullPath)) {
            File::makeDirectory($fullPath, 0755, true);
        }

        $destinationPath = $fullPath . '/' . $filename;

        // Load image
        $image = $this->loadImage($file);

        if ($image) {
            // Resize if too large (max 1920px width for compression)
            $width = imagesx($image);
            $height = imagesy($image);
            $maxWidth = 1920;

            if ($width > $maxWidth) {
                $ratio = $maxWidth / $width;
                $newWidth = $maxWidth;
                $newHeight = (int)($height * $ratio);

                $resized = imagecreatetruecolor($newWidth, $newHeight);
                imagecopyresampled($resized, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
                imagedestroy($image);
                $image = $resized;
            }

            // Add watermark with coordinates
            $this->addWatermark($image, $itemName, $type, $latitude, $longitude);

            // Save image with compression (75% quality for good compression)
            imagejpeg($image, $destinationPath, 75);
            imagedestroy($image);
        } else {
            // Fallback: just move the file
            $file->move($fullPath, $filename);
        }

        return $path . '/' . $filename;
    }

    /**
     * Load image from uploaded file.
     */
    private function loadImage($file)
    {
        $mime = $file->getMimeType();
        $path = $file->getRealPath();

        switch ($mime) {
            case 'image/jpeg':
                return imagecreatefromjpeg($path);
            case 'image/png':
                return imagecreatefrompng($path);
            case 'image/gif':
                return imagecreatefromgif($path);
            case 'image/webp':
                return imagecreatefromwebp($path);
            default:
                return null;
        }
    }

    /**
     * Add watermark to image with coordinates.
     */
    private function addWatermark($image, $itemName, $type, $latitude = null, $longitude = null)
    {
        $width = imagesx($image);
        $height = imagesy($image);

        // Watermark text
        $label = $type == 'sebelum' ? 'Mulai' : 'Selesai';
        $dateTime = now()->format('d M Y - H:i:s');
        $watermarkText = [
            "$label: $dateTime",
            $itemName,
        ];

        // Add coordinates if available
        if ($latitude != null && $longitude != null) {
            $watermarkText[] = "Lokasi: " . number_format($latitude, 6) . ", " . number_format($longitude, 6);
        }

        // Configure font - try multiple paths
        $fontPath = null;
        $possibleFonts = [
            base_path('vendor/dompdf/dompdf/lib/fonts/DejaVuSans.ttf'),
            'C:/Windows/Fonts/arial.ttf',
            'C:\\Windows\\Fonts\\arial.ttf',
            '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', // Linux fallback
        ];

        foreach ($possibleFonts as $path) {
            if (file_exists($path)) {
                $fontPath = $path;
                break;
            }
        }

        // Calculate font size (approx 3% of image width)
        $fontSize = max(12, $width * 0.03);

        // Colors
        $white = imagecolorallocate($image, 255, 255, 255);
        $black = imagecolorallocatealpha($image, 0, 0, 0, 50); // Shadow/Background
        $bgColor = imagecolorallocatealpha($image, 0, 0, 0, 60);

        // Calculate text box size
        $padding = $width * 0.02; // 2% padding
        $lineHeight = $fontSize * 1.5;
        $totalTextHeight = count($watermarkText) * $lineHeight;

        // Background box
        $bgHeight = $totalTextHeight + ($padding * 2);
        $bgY = $height - $bgHeight;

        imagefilledrectangle($image, 0, $bgY, $width, $height, $bgColor);

        // Draw text
        $y = $bgY + $padding + $fontSize; // Initial Y position for text baseline

        foreach ($watermarkText as $text) {
            if ($fontPath) {
                // Use TrueType font
                imagettftext($image, $fontSize, 0, (int)($padding + 2), (int)($y + 2), $black, $fontPath, $text);
                imagettftext($image, $fontSize, 0, (int)$padding, (int)$y, $white, $fontPath, $text);
            } else {
                // Fallback to GD built-in font (font 5 is the largest built-in)
                $gdFont = 5;
                imagestring($image, $gdFont, (int)($padding + 1), (int)($y - 12), $text, $black);
                imagestring($image, $gdFont, (int)$padding, (int)($y - 13), $text, $white);
            }

            $y += $lineHeight;
        }
    }

    /**
     * Check if all items in penugasan are completed.
     */
    private function checkPenugasanCompletion(Penugasan $penugasan)
    {
        $totalItems = $penugasan->items()->count();
        $completedItems = $penugasan->items()->where('status', 'selesai')->count();

        if ($totalItems == $completedItems && $totalItems > 0) {
            $penugasan->status = 'selesai';
            $penugasan->waktu_selesai = now();
            $penugasan->save();
        }
    }

    /**
     * Submit all items (mark penugasan as complete).
     */
    public function submitAll(Request $request, $penugasanId)
    {
        $penugasan = Penugasan::with('items')->findOrFail($penugasanId);

        // Verify ownership (use != instead of !== to handle type casting differences)
        if ($penugasan->pengguna_id != Auth::id()) {
            return redirect()->back()->with('error', 'Anda tidak memiliki akses ke penugasan ini.');
        }

        // Check if all items are completed
        $incompleteItems = $penugasan->items()->where('status', '!=', 'selesai')->count();

        if ($incompleteItems > 0) {
            return redirect()->back()->with('error', "Masih ada {$incompleteItems} item yang belum selesai.");
        }

        // Mark penugasan as complete
        $penugasan->status = 'selesai';
        $penugasan->waktu_selesai = now();
        $penugasan->save();

        return redirect()->back()->with('success', 'Penugasan berhasil disubmit.');
    }

    /**
     * Delete an item (session) from penugasan.
     */
    public function destroy(Request $request, $penugasanId, $itemId)
    {
        $item = ItemPenugasan::where('penugasan_id', $penugasanId)
            ->findOrFail($itemId);

        // Verify ownership (use != instead of !== to handle type casting differences)
        $penugasan = $item->penugasan;
        if ($penugasan->pengguna_id != Auth::id()) {
            return redirect()->back()->with('error', 'Anda tidak memiliki akses ke item ini.');
        }

        // Prevent deletion if penugasan is already completed
        if ($penugasan->status == 'selesai') {
            return redirect()->back()->with('error', 'Tidak dapat menghapus sesi dari penugasan yang sudah selesai.');
        }

        // Delete associated files
        if ($item->foto_sebelum) {
            $path = public_path('storage/' . $item->foto_sebelum);
            if (File::exists($path)) {
                File::delete($path);
            }
        }
        if ($item->foto_sesudah) {
            $path = public_path('storage/' . $item->foto_sesudah);
            if (File::exists($path)) {
                File::delete($path);
            }
        }
        if ($item->file_lampiran) {
            $path = public_path('storage/' . $item->file_lampiran);
            if (File::exists($path)) {
                File::delete($path);
            }
        }

        // If this item was running, reset penugasan status to pending
        if ($item->status == 'sedang_dikerjakan') {
            // Check if there are other items running
            $otherRunning = $penugasan->items()
                ->where('id', '!=', $item->id)
                ->where('status', 'sedang_dikerjakan')
                ->exists();

            if (!$otherRunning && $penugasan->status == 'sedang_dikerjakan') {
                $penugasan->status = 'pending';
                $penugasan->waktu_mulai = null;
                $penugasan->save();
            }
        }

        $item->delete();

        return redirect()->back()->with('success', 'Sesi berhasil dihapus.');
    }

    /**
     * Calculate distance between two coordinates using Haversine formula.
     * Returns distance in meters.
     */
    private function calculateDistance($lat1, $lon1, $lat2, $lon2): float
    {
        $earthRadius = 6371000; // Earth's radius in meters

        $lat1Rad = deg2rad($lat1);
        $lat2Rad = deg2rad($lat2);
        $deltaLat = deg2rad($lat2 - $lat1);
        $deltaLon = deg2rad($lon2 - $lon1);

        $a = sin($deltaLat / 2) * sin($deltaLat / 2) +
            cos($lat1Rad) * cos($lat2Rad) *
            sin($deltaLon / 2) * sin($deltaLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}
