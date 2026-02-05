<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Kategori extends Model
{
    use HasFactory;

    protected $table = 'kategori';

    protected $fillable = [
        'bidang_id',
        'nama',
        'deskripsi',
    ];

    /**
     * Get the bidang that owns this kategori
     */
    public function bidang(): BelongsTo
    {
        return $this->belongsTo(Bidang::class, 'bidang_id');
    }

    /**
     * Get users in this category
     */
    public function pengguna(): HasMany
    {
        return $this->hasMany(User::class, 'kategori_id');
    }

    /**
     * Get tasks in this category
     */
    public function tugas(): HasMany
    {
        return $this->hasMany(Tugas::class, 'kategori_id');
    }

    /**
     * Get uraian tugas in this category
     */
    public function uraianTugas(): HasMany
    {
        return $this->hasMany(UraianTugas::class, 'kategori_id');
    }
}
