<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TemplatePenugasanHarianItem extends Model
{
    protected $table = 'template_penugasan_harian_items';

    protected $fillable = [
        'template_id',
        'tugas_id',
        'pengguna_id',
        'tenggat_waktu_jam',
        'catatan',
        'lokasi_latitude',
        'lokasi_longitude',
        'lokasi_radius',
        'lokasi_nama',
    ];

    protected $casts = [
        'lokasi_latitude' => 'decimal:8',
        'lokasi_longitude' => 'decimal:8',
        'lokasi_radius' => 'integer',
    ];

    /**
     * Get the parent template
     */
    public function template(): BelongsTo
    {
        return $this->belongsTo(TemplatePenugasanHarian::class, 'template_id');
    }

    /**
     * Get the tugas
     */
    public function tugas(): BelongsTo
    {
        return $this->belongsTo(Tugas::class, 'tugas_id');
    }

    /**
     * Get the user (pelaksana)
     */
    public function pengguna(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pengguna_id');
    }
}
