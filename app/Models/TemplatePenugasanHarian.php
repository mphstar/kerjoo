<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TemplatePenugasanHarian extends Model
{
    protected $table = 'template_penugasan_harian';

    protected $fillable = [
        'nama',
        'deskripsi',
        'aktif',
        'tipe',
        'pengguna_id',
        'tenggat_waktu_jam',
        'deadline_hari_berikutnya',
        'catatan',
        'lokasi_latitude',
        'lokasi_longitude',
        'lokasi_radius',
        'lokasi_nama',
    ];

    protected $casts = [
        'aktif' => 'boolean',
        'deadline_hari_berikutnya' => 'boolean',
        'lokasi_latitude' => 'decimal:8',
        'lokasi_longitude' => 'decimal:8',
        'lokasi_radius' => 'integer',
    ];

    /**
     * Get the pelaksana (user) for this template
     */
    public function pengguna(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pengguna_id');
    }

    /**
     * Get template items (tugas list)
     */
    public function items(): HasMany
    {
        return $this->hasMany(TemplatePenugasanHarianItem::class, 'template_id');
    }
}
