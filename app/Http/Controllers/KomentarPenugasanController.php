<?php

namespace App\Http\Controllers;

use App\Models\KomentarPenugasan;
use App\Models\Penugasan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class KomentarPenugasanController extends Controller
{
    /**
     * Store a new comment on a penugasan.
     */
    public function store(Request $request, $penugasanId)
    {
        $penugasan = Penugasan::findOrFail($penugasanId);

        $validated = $request->validate([
            'isi' => 'required|string|max:1000',
        ]);

        KomentarPenugasan::create([
            'penugasan_id' => $penugasan->id,
            'pengguna_id' => Auth::id(),
            'isi' => $validated['isi'],
        ]);

        return redirect()->back()->with('success', 'Komentar berhasil dikirim.');
    }

    /**
     * Delete a comment (only by the comment owner).
     */
    public function destroy($id)
    {
        $komentar = KomentarPenugasan::findOrFail($id);

        if ($komentar->pengguna_id !== Auth::id()) {
            return redirect()->back()->with('error', 'Anda tidak dapat menghapus komentar ini.');
        }

        $komentar->delete();

        return redirect()->back()->with('success', 'Komentar berhasil dihapus.');
    }
}
