<?php

namespace App\Http\Controllers;

use App\Models\HariLibur;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HariLiburController extends Controller
{
    public function index(Request $request)
    {
        $query = HariLibur::query()->orderBy('tanggal', 'desc');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nama', 'like', "%{$search}%")
                  ->orWhere('deskripsi', 'like', "%{$search}%");
            });
        }

        $hariLibur = $query->paginate($request->per_page ?? 10)->withQueryString();

        return Inertia::render('admin/hari-libur/index', [
            'hariLibur' => $hariLibur,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'tanggal' => 'required|date|unique:hari_libur,tanggal',
            'nama' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
        ]);

        HariLibur::create($validated);

        return redirect()->back()->with('success', 'Hari libur berhasil ditambahkan.');
    }

    public function update(Request $request, $id)
    {
        $hariLibur = HariLibur::findOrFail($id);

        $validated = $request->validate([
            'tanggal' => 'required|date|unique:hari_libur,tanggal,' . $id,
            'nama' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
        ]);

        $hariLibur->update($validated);

        return redirect()->back()->with('success', 'Hari libur berhasil diperbarui.');
    }

    public function destroy($id)
    {
        $hariLibur = HariLibur::findOrFail($id);
        $hariLibur->delete();

        return redirect()->back()->with('success', 'Hari libur berhasil dihapus.');
    }

    /**
     * API endpoint to check if a date is a holiday
     */
    public function checkHoliday(Request $request)
    {
        $request->validate([
            'tanggal' => 'required|date',
        ]);

        $isHoliday = HariLibur::isHoliday($request->tanggal);
        $holidayInfo = $isHoliday ? HariLibur::getHolidayInfo($request->tanggal) : null;

        return response()->json([
            'is_holiday' => $isHoliday,
            'holiday' => $holidayInfo,
        ]);
    }
}
