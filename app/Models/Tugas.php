<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tugas extends Model
{
    use HasFactory;

    protected $table = 'tugas';

    protected $fillable = [
        'kategori_id',
        'nama',
        'tipe',
        'deskripsi',
        'persyaratan',
        'aktif',
    ];

    protected $casts = [
        'persyaratan' => 'array', // JSON field
        'aktif' => 'boolean',
    ];

    /**
     * Get the category this task belongs to
     */
    public function kategori(): BelongsTo
    {
        return $this->belongsTo(Kategori::class, 'kategori_id');
    }

    /**
     * Get all assignments for this task
     */
    public function penugasan(): HasMany
    {
        return $this->hasMany(Penugasan::class, 'tugas_id');
    }
}
