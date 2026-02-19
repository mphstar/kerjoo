<?php

namespace App\Http\Controllers;

use App\Models\ItemPenugasan;
use App\Models\Penugasan;
use App\Models\Tugas;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PenugasanController extends Controller
{
    /**
     * Store a newly created penugasan (assignment).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'tugas_id' => 'required|exists:tugas,id',
            'pengguna_id' => 'required|exists:users,id',
            'tenggat_waktu' => 'nullable|date|after_or_equal:today',
            'catatan' => 'nullable|string',
            // Geolocation fields
            'lokasi_latitude' => 'nullable|numeric|between:-90,90',
            'lokasi_longitude' => 'nullable|numeric|between:-180,180',
            'lokasi_radius' => 'nullable|integer|min:1|max:10000', // 1m to 10km
            'lokasi_nama' => 'nullable|string|max:255',
        ]);

        $tugas = Tugas::findOrFail($validated['tugas_id']);

        // Create penugasan
        $penugasan = Penugasan::create([
            'tugas_id' => $validated['tugas_id'],
            'pengguna_id' => $validated['pengguna_id'],
            'ditugaskan_oleh' => Auth::id(),
            'status' => 'pending',
            'tenggat_waktu' => $validated['tenggat_waktu'] ?? null,
            'catatan' => $validated['catatan'] ?? null,
            'lokasi_latitude' => $validated['lokasi_latitude'] ?? null,
            'lokasi_longitude' => $validated['lokasi_longitude'] ?? null,
            'lokasi_radius' => $validated['lokasi_radius'] ?? null,
            'lokasi_nama' => $validated['lokasi_nama'] ?? null,
        ]);

        // Create generic item based on Tugas name, since we don't have separate items in request
        // If Tugas has requirements (persyaratan), we could potentially use those, 
        // but for now let's just create one main item for the task.
        ItemPenugasan::create([
            'penugasan_id' => $penugasan->id,
            'nama' => $tugas->nama,
            'status' => 'pending',
        ]);

        return redirect()->back()->with('success', 'Penugasan berhasil dibuat.');
    }

    /**
     * Store multiple penugasan in batch.
     */
    public function storeBatch(Request $request)
    {
        $validated = $request->validate([
            'mode' => 'required|in:tugas_to_pelaksana,pelaksana_to_tugas',
            'tugas_id' => 'required_if:mode,tugas_to_pelaksana|nullable|exists:tugas,id',
            'pengguna_id' => 'required_if:mode,pelaksana_to_tugas|nullable|exists:users,id',
            'tugas_ids' => 'required_if:mode,pelaksana_to_tugas|array',
            'tugas_ids.*' => 'exists:tugas,id',
            'pengguna_ids' => 'required_if:mode,tugas_to_pelaksana|array',
            'pengguna_ids.*' => 'exists:users,id',
            'tenggat_waktu' => 'nullable|date|after_or_equal:today',
            'catatan' => 'nullable|string',
            // Geolocation fields
            'lokasi_latitude' => 'nullable|numeric|between:-90,90',
            'lokasi_longitude' => 'nullable|numeric|between:-180,180',
            'lokasi_radius' => 'nullable|integer|min:1|max:10000',
            'lokasi_nama' => 'nullable|string|max:255',
        ]);

        $createdCount = 0;

        if ($validated['mode'] == 'tugas_to_pelaksana') {
            // One tugas -> multiple pelaksana
            $tugas = Tugas::findOrFail($validated['tugas_id']);

            foreach ($validated['pengguna_ids'] as $penggunaId) {
                $penugasan = Penugasan::create([
                    'tugas_id' => $validated['tugas_id'],
                    'pengguna_id' => $penggunaId,
                    'ditugaskan_oleh' => Auth::id(),
                    'status' => 'pending',
                    'tenggat_waktu' => $validated['tenggat_waktu'] ?? null,
                    'catatan' => $validated['catatan'] ?? null,
                    'lokasi_latitude' => $validated['lokasi_latitude'] ?? null,
                    'lokasi_longitude' => $validated['lokasi_longitude'] ?? null,
                    'lokasi_radius' => $validated['lokasi_radius'] ?? null,
                    'lokasi_nama' => $validated['lokasi_nama'] ?? null,
                ]);

                ItemPenugasan::create([
                    'penugasan_id' => $penugasan->id,
                    'nama' => $tugas->nama,
                    'status' => 'pending',
                ]);

                $createdCount++;
            }
        } else {
            // One pelaksana -> multiple tugas
            foreach ($validated['tugas_ids'] as $tugasId) {
                $tugas = Tugas::findOrFail($tugasId);

                $penugasan = Penugasan::create([
                    'tugas_id' => $tugasId,
                    'pengguna_id' => $validated['pengguna_id'],
                    'ditugaskan_oleh' => Auth::id(),
                    'status' => 'pending',
                    'tenggat_waktu' => $validated['tenggat_waktu'] ?? null,
                    'catatan' => $validated['catatan'] ?? null,
                    'lokasi_latitude' => $validated['lokasi_latitude'] ?? null,
                    'lokasi_longitude' => $validated['lokasi_longitude'] ?? null,
                    'lokasi_radius' => $validated['lokasi_radius'] ?? null,
                    'lokasi_nama' => $validated['lokasi_nama'] ?? null,
                ]);

                ItemPenugasan::create([
                    'penugasan_id' => $penugasan->id,
                    'nama' => $tugas->nama,
                    'status' => 'pending',
                ]);

                $createdCount++;
            }
        }

        return redirect()->back()->with('success', "{$createdCount} penugasan berhasil dibuat.");
    }

    /**
     * Remove the specified penugasan.
     */
    public function destroy($id)
    {
        $penugasan = Penugasan::findOrFail($id);

        // Check if penugasan is already in progress
        if ($penugasan->status == 'sedang_dikerjakan') {
            return redirect()->back()->with('error', 'Penugasan yang sedang dikerjakan tidak dapat dihapus.');
        }

        // Delete will cascade to item_penugasan
        $penugasan->delete();

        return redirect()->back()->with('success', 'Penugasan berhasil dihapus.');
    }

    /**
     * Update penugasan status (admin override).
     */
    public function updateStatus(Request $request, $id)
    {
        $penugasan = Penugasan::findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|in:pending,sedang_dikerjakan,selesai',
        ]);

        $penugasan->status = $validated['status'];

        if ($validated['status'] == 'selesai') {
            $penugasan->waktu_selesai = now();
        }

        $penugasan->save();

        return redirect()->back()->with('success', 'Status penugasan berhasil diperbarui.');
    }

    /**
     * Show detail penugasan for admin monitoring.
     */
    public function show($id)
    {
        $penugasan = Penugasan::with(['tugas.kategori', 'pengguna', 'items', 'ditugaskanOleh', 'komentar.pengguna'])
            ->findOrFail($id);

        $user = auth()->user();
        $basePath = $user->peran === 'pimpinan' ? '/pimpinan' : '/admin';

        return inertia('admin/penugasan/detail', [
            'penugasan' => $penugasan,
            'basePath' => $basePath,
        ]);
    }
}
