<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Absensi extends Model
{
    protected $table = 'absensi';

    protected $fillable = [
        'pengguna_id',
        'foto',
        'keterangan',
        'tanggal',
    ];

    protected $casts = [
        'tanggal' => 'date',
    ];

    protected $appends = ['foto_url'];

    public function pengguna(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pengguna_id');
    }

    public function getFotoUrlAttribute(): ?string
    {
        if ($this->foto) {
            return asset('uploads/absensi/' . $this->foto);
        }
        return null;
    }
}
