<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class PermintaanPeralatan extends Model
{
    use HasFactory;

    protected $table = 'permintaan_peralatan';

    protected $fillable = [
        'pengguna_id',
        'bulan',
        'tahun',
        'waktu_pengajuan',
        'status',
        'disetujui_oleh',
        'waktu_persetujuan',
        'catatan',
    ];

    protected $casts = [
        'waktu_pengajuan' => 'datetime',
        'waktu_persetujuan' => 'datetime',
        'bulan' => 'integer',
        'tahun' => 'integer',
    ];

    /**
     * Get the user who requested
     */
    public function pengguna(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pengguna_id');
    }

    /**
     * Get the admin who approved
     */
    public function disetujuiOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'disetujui_oleh');
    }

    /**
     * Get all equipment details
     */
    public function details(): HasMany
    {
        return $this->hasMany(DetailPeralatan::class, 'permintaan_peralatan_id');
    }

    /**
     * Scope: Filter by month and year
     */
    public function scopeForMonth(Builder $query, int $month, int $year): Builder
    {
        return $query->where('bulan', $month)->where('tahun', $year);
    }
}
