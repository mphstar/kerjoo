<?php

namespace App\Http\Controllers;

use App\Models\Bidang;
use Illuminate\Http\Request;

class BidangController extends Controller
{
    /**
     * Store a newly created bidang.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'aktif' => 'boolean',
        ]);

        Bidang::create([
            'nama' => $validated['nama'],
            'deskripsi' => $validated['deskripsi'] ?? null,
            'aktif' => $validated['aktif'] ?? true,
        ]);

        return redirect()->back()->with('success', 'Bidang berhasil dibuat.');
    }

    /**
     * Update the specified bidang.
     */
    public function update(Request $request, $id)
    {
        $bidang = Bidang::findOrFail($id);

        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'aktif' => 'boolean',
        ]);

        $bidang->update([
            'nama' => $validated['nama'],
            'deskripsi' => $validated['deskripsi'] ?? null,
            'aktif' => $validated['aktif'] ?? true,
        ]);

        return redirect()->back()->with('success', 'Bidang berhasil diperbarui.');
    }

    /**
     * Remove the specified bidang.
     */
    public function destroy($id)
    {
        $bidang = Bidang::withCount('kategori')->findOrFail($id);

        // Prevent deletion if bidang has kategori
        if ($bidang->kategori_count > 0) {
            return redirect()->back()->with('error', 'Bidang tidak dapat dihapus karena masih memiliki kategori.');
        }

        $bidang->delete();

        return redirect()->back()->with('success', 'Bidang berhasil dihapus.');
    }

    /**
     * Toggle bidang active status.
     */
    public function toggleActive($id)
    {
        $bidang = Bidang::findOrFail($id);
        $bidang->aktif = !$bidang->aktif;
        $bidang->save();

        $status = $bidang->aktif ? 'diaktifkan' : 'dinonaktifkan';
        return redirect()->back()->with('success', "Bidang berhasil {$status}.");
    }
}
