<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Bidang extends Model
{
    use HasFactory;

    protected $table = 'bidang';

    protected $fillable = [
        'nama',
        'deskripsi',
        'aktif',
    ];

    protected $casts = [
        'aktif' => 'boolean',
    ];

    /**
     * Get all kategori under this bidang
     */
    public function kategori(): HasMany
    {
        return $this->hasMany(Kategori::class, 'bidang_id');
    }

    /**
     * Scope for active bidang only
     */
    public function scopeAktif($query)
    {
        return $query->where('aktif', true);
    }
}
