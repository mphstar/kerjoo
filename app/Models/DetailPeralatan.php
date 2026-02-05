<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DetailPeralatan extends Model
{
    use HasFactory;

    protected $table = 'detail_peralatan';

    protected $fillable = [
        'permintaan_peralatan_id',
        'nama_peralatan',
        'jumlah',
        'satuan',
    ];

    protected $casts = [
        'jumlah' => 'integer',
    ];

    /**
     * Get the parent equipment request
     */
    public function permintaanPeralatan(): BelongsTo
    {
        return $this->belongsTo(PermintaanPeralatan::class, 'permintaan_peralatan_id');
    }
}
