<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PermintaanBbm extends Model
{
    use HasFactory;

    protected $table = 'permintaan_bbm';

    protected $fillable = [
        'pengguna_id',
        'tanggal',
        'no_buku',
        'pengemudi',
        'uraian',
        'nama_kendaraan',
        'merk_kendaraan',
        'no_polisi',
        'km_awal',
        'bbm_awal_liter',
        'bbm_awal_persen',
        'bbm_liter',
        'bbm_harga_per_liter',
        'bbm_total_harga',
        'km_akhir',
        'bbm_akhir_liter',
        'bbm_akhir_persen',
        'status',
        'disetujui_oleh',
        'waktu_persetujuan',
        'catatan',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'km_awal' => 'decimal:1',
        'bbm_awal_liter' => 'decimal:1',
        'bbm_awal_persen' => 'integer',
        'bbm_liter' => 'decimal:1',
        'bbm_harga_per_liter' => 'decimal:2',
        'bbm_total_harga' => 'decimal:2',
        'km_akhir' => 'decimal:1',
        'bbm_akhir_liter' => 'decimal:1',
        'bbm_akhir_persen' => 'integer',
        'waktu_persetujuan' => 'datetime',
    ];

    public function pengguna(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pengguna_id');
    }

    public function disetujuiOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'disetujui_oleh');
    }
}
