<?php

namespace App\Http\Controllers;

use App\Models\Kategori;
use Illuminate\Http\Request;

class KategoriController extends Controller
{
    /**
     * Store a newly created kategori.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'bidang_id' => 'nullable|exists:bidang,id',
            'nama' => 'required|string|max:255|unique:kategori,nama',
            'deskripsi' => 'nullable|string',
        ]);

        Kategori::create($validated);

        return redirect()->back()->with('success', 'Kategori berhasil ditambahkan.');
    }

    /**
     * Update the specified kategori.
     */
    public function update(Request $request, $id)
    {
        $kategori = Kategori::findOrFail($id);

        $validated = $request->validate([
            'bidang_id' => 'nullable|exists:bidang,id',
            'nama' => 'required|string|max:255|unique:kategori,nama,' . $id,
            'deskripsi' => 'nullable|string',
        ]);

        $kategori->update($validated);

        return redirect()->back()->with('success', 'Kategori berhasil diperbarui.');
    }

    /**
     * Remove the specified kategori.
     */
    public function destroy($id)
    {
        $kategori = Kategori::findOrFail($id);

        // Check if kategori has related tugas or pengguna
        if ($kategori->tugas()->count() > 0) {
            return redirect()->back()->with('error', 'Kategori tidak dapat dihapus karena masih memiliki tugas terkait.');
        }

        if ($kategori->pengguna()->count() > 0) {
            return redirect()->back()->with('error', 'Kategori tidak dapat dihapus karena masih memiliki pengguna terkait.');
        }

        $kategori->delete();

        return redirect()->back()->with('success', 'Kategori berhasil dihapus.');
    }
}
