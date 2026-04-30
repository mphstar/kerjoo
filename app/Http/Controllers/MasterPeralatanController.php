<?php

namespace App\Http\Controllers;

use App\Models\MasterPeralatan;
use Illuminate\Http\Request;

class MasterPeralatanController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255|unique:master_peralatan,nama',
            'satuan' => 'required|string|max:50',
            'deskripsi' => 'nullable|string|max:500',
        ]);

        MasterPeralatan::create($validated);

        return redirect()->back()->with('success', 'Master peralatan berhasil ditambahkan.');
    }

    public function update(Request $request, $id)
    {
        $peralatan = MasterPeralatan::findOrFail($id);

        $validated = $request->validate([
            'nama' => 'required|string|max:255|unique:master_peralatan,nama,' . $id,
            'satuan' => 'required|string|max:50',
            'deskripsi' => 'nullable|string|max:500',
        ]);

        $peralatan->update($validated);

        return redirect()->back()->with('success', 'Master peralatan berhasil diperbarui.');
    }

    public function destroy($id)
    {
        $peralatan = MasterPeralatan::findOrFail($id);
        $peralatan->delete();

        return redirect()->back()->with('success', 'Master peralatan berhasil dihapus.');
    }

    public function toggleActive($id)
    {
        $peralatan = MasterPeralatan::findOrFail($id);
        $peralatan->update(['aktif' => !$peralatan->aktif]);

        return redirect()->back()->with('success', 'Status peralatan berhasil diperbarui.');
    }
}
