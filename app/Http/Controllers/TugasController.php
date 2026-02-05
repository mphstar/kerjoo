<?php

namespace App\Http\Controllers;

use App\Models\Tugas;
use Illuminate\Http\Request;

class TugasController extends Controller
{
    /**
     * Store a newly created tugas.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'kategori_id' => 'required|exists:kategori,id',
            'nama' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'persyaratan' => 'required|array',
            'persyaratan.foto' => 'boolean',
            'persyaratan.file' => 'boolean',
            'persyaratan.teks' => 'boolean',
            'aktif' => 'boolean',
        ]);

        // Ensure persyaratan has default false values
        $validated['persyaratan'] = [
            'foto' => $validated['persyaratan']['foto'] ?? false,
            'file' => $validated['persyaratan']['file'] ?? false,
            'teks' => $validated['persyaratan']['teks'] ?? false,
        ];

        $validated['aktif'] = $validated['aktif'] ?? true;

        Tugas::create($validated);

        return redirect()->back()->with('success', 'Tugas berhasil ditambahkan.');
    }

    /**
     * Update the specified tugas.
     */
    public function update(Request $request, $id)
    {
        $tugas = Tugas::findOrFail($id);

        $validated = $request->validate([
            'kategori_id' => 'required|exists:kategori,id',
            'nama' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'persyaratan' => 'required|array',
            'persyaratan.foto' => 'boolean',
            'persyaratan.file' => 'boolean',
            'persyaratan.teks' => 'boolean',
            'aktif' => 'boolean',
        ]);

        // Ensure persyaratan has default false values
        $validated['persyaratan'] = [
            'foto' => $validated['persyaratan']['foto'] ?? false,
            'file' => $validated['persyaratan']['file'] ?? false,
            'teks' => $validated['persyaratan']['teks'] ?? false,
        ];

        $tugas->update($validated);

        return redirect()->back()->with('success', 'Tugas berhasil diperbarui.');
    }

    /**
     * Remove the specified tugas.
     */
    public function destroy($id)
    {
        $tugas = Tugas::findOrFail($id);

        // Check if tugas has active penugasan
        $activePenugasan = $tugas->penugasan()
            ->whereIn('status', ['pending', 'sedang_dikerjakan'])
            ->count();

        if ($activePenugasan > 0) {
            return redirect()->back()->with('error', 'Tugas tidak dapat dihapus karena masih memiliki penugasan aktif.');
        }

        $tugas->delete();

        return redirect()->back()->with('success', 'Tugas berhasil dihapus.');
    }

    /**
     * Toggle tugas active status.
     */
    public function toggleActive($id)
    {
        $tugas = Tugas::findOrFail($id);
        $tugas->aktif = !$tugas->aktif;
        $tugas->save();

        $status = $tugas->aktif ? 'diaktifkan' : 'dinonaktifkan';
        return redirect()->back()->with('success', "Tugas berhasil {$status}.");
    }
}
