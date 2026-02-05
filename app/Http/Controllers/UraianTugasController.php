<?php

namespace App\Http\Controllers;

use App\Models\UraianTugas;
use App\Models\Kategori;
use Illuminate\Http\Request;

class UraianTugasController extends Controller
{
    /**
     * Store a newly created uraian tugas.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'kategori_id' => 'required|exists:kategori,id',
            'nama' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'aktif' => 'boolean',
            'urutan' => 'integer|min:0',
        ]);

        UraianTugas::create([
            'kategori_id' => $validated['kategori_id'],
            'nama' => $validated['nama'],
            'deskripsi' => $validated['deskripsi'] ?? null,
            'aktif' => $validated['aktif'] ?? true,
            'urutan' => $validated['urutan'] ?? 0,
        ]);

        return redirect()->back()->with('success', 'Uraian tugas berhasil dibuat.');
    }

    /**
     * Update the specified uraian tugas.
     */
    public function update(Request $request, $id)
    {
        $uraianTugas = UraianTugas::findOrFail($id);

        $validated = $request->validate([
            'kategori_id' => 'required|exists:kategori,id',
            'nama' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'aktif' => 'boolean',
            'urutan' => 'integer|min:0',
        ]);

        $uraianTugas->update([
            'kategori_id' => $validated['kategori_id'],
            'nama' => $validated['nama'],
            'deskripsi' => $validated['deskripsi'] ?? null,
            'aktif' => $validated['aktif'] ?? true,
            'urutan' => $validated['urutan'] ?? 0,
        ]);

        return redirect()->back()->with('success', 'Uraian tugas berhasil diperbarui.');
    }

    /**
     * Remove the specified uraian tugas.
     */
    public function destroy($id)
    {
        $uraianTugas = UraianTugas::findOrFail($id);
        $uraianTugas->delete();

        return redirect()->back()->with('success', 'Uraian tugas berhasil dihapus.');
    }

    /**
     * Toggle uraian tugas active status.
     */
    public function toggleActive($id)
    {
        $uraianTugas = UraianTugas::findOrFail($id);
        $uraianTugas->aktif = !$uraianTugas->aktif;
        $uraianTugas->save();

        $status = $uraianTugas->aktif ? 'diaktifkan' : 'dinonaktifkan';
        return redirect()->back()->with('success', "Uraian tugas berhasil {$status}.");
    }
}
