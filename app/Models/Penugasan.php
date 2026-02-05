<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Penugasan extends Model
{
    use HasFactory;

    protected $table = 'penugasan';

    protected $fillable = [
        'tugas_id',
        'pengguna_id',
        'ditugaskan_oleh',
        'status',
        'tenggat_waktu',
        'waktu_mulai',
        'waktu_selesai',
        'catatan',
        'lokasi_latitude',
        'lokasi_longitude',
        'lokasi_radius',
        'lokasi_nama',
    ];

    protected $casts = [
        'tenggat_waktu' => 'datetime',
        'waktu_mulai' => 'datetime',
        'waktu_selesai' => 'datetime',
        'lokasi_latitude' => 'decimal:8',
        'lokasi_longitude' => 'decimal:8',
        'lokasi_radius' => 'integer',
    ];

    /**
     * Get the master task
     */
    public function tugas(): BelongsTo
    {
        return $this->belongsTo(Tugas::class, 'tugas_id');
    }

    /**
     * Get the assigned user (pelaksana)
     */
    public function pengguna(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pengguna_id');
    }

    /**
     * Get the admin who assigned this task
     */
    public function ditugaskanOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'ditugaskan_oleh');
    }

    /**
     * Get all items for this assignment
     */
    public function items(): HasMany
    {
        return $this->hasMany(ItemPenugasan::class, 'penugasan_id');
    }

    /**
     * Get persyaratan from parent tugas
     */
    public function getPersyaratan(): array
    {
        return $this->tugas->persyaratan ?? [];
    }
}
