<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;

class AplikasiController extends Controller
{
    /**
     * Show the application settings page.
     */
    public function edit()
    {
        $adminSignatureName = Setting::where('key', 'admin_signature_name')->value('value') ?? '';
        $adminSignatureNip = Setting::where('key', 'admin_signature_nip')->value('value') ?? '';

        return Inertia::render('settings/aplikasi', [
            'settings' => [
                'admin_signature_name' => $adminSignatureName,
                'admin_signature_nip' => $adminSignatureNip,
            ]
        ]);
    }

    /**
     * Update the application settings.
     */
    public function update(Request $request)
    {
        $request->validate([
            'admin_signature_name' => ['nullable', 'string', 'max:255'],
            'admin_signature_nip' => ['nullable', 'string', 'max:255'],
        ]);

        Setting::updateOrCreate(
            ['key' => 'admin_signature_name'],
            ['value' => $request->input('admin_signature_name')]
        );

        Setting::updateOrCreate(
            ['key' => 'admin_signature_nip'],
            ['value' => $request->input('admin_signature_nip')]
        );

        return Redirect::route('settings.aplikasi.edit');
    }
}
