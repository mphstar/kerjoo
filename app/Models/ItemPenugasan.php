<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Casts\Attribute;

class ItemPenugasan extends Model
{
    use HasFactory;

    protected $table = 'item_penugasan';

    protected $fillable = [
        'penugasan_id',
        'nama',
        'waktu_mulai',
        'waktu_selesai',
        'durasi_detik',
        'foto_sebelum',
        'foto_sebelum_latitude',
        'foto_sebelum_longitude',
        'foto_sesudah',
        'foto_sesudah_latitude',
        'foto_sesudah_longitude',
        'file_lampiran',
        'ringkasan_teks',
        'status',
    ];

    protected $casts = [
        'waktu_mulai' => 'datetime',
        'waktu_selesai' => 'datetime',
        'durasi_detik' => 'integer',
        'foto_sebelum_latitude' => 'decimal:8',
        'foto_sebelum_longitude' => 'decimal:8',
        'foto_sesudah_latitude' => 'decimal:8',
        'foto_sesudah_longitude' => 'decimal:8',
    ];

    /**
     * Get the parent assignment
     */
    public function penugasan(): BelongsTo
    {
        return $this->belongsTo(Penugasan::class, 'penugasan_id');
    }

    /**
     * Get formatted duration
     */
    protected function durasiTerformat(): Attribute
    {
        return Attribute::make(
            get: function () {
                $seconds = $this->durasi_detik;
                $hours = floor($seconds / 3600);
                $minutes = floor(($seconds % 3600) / 60);
                $secs = $seconds % 60;

                return sprintf('%02d:%02d:%02d', $hours, $minutes, $secs);
            }
        );
    }

    /**
     * Get foto sebelum URL
     */
    protected function fotoSebelumUrl(): Attribute
    {
        return Attribute::make(
            get: fn() => $this->foto_sebelum ? asset($this->foto_sebelum) : null
        );
    }

    /**
     * Get foto sesudah URL
     */
    protected function fotoSesudahUrl(): Attribute
    {
        return Attribute::make(
            get: fn() => $this->foto_sesudah ? asset($this->foto_sesudah) : null
        );
    }

    /**
     * Get file lampiran URL
     */
    protected function fileLampiranUrl(): Attribute
    {
        return Attribute::make(
            get: fn() => $this->file_lampiran ? asset($this->file_lampiran) : null
        );
    }

    protected $appends = [
        'foto_sebelum_url',
        'foto_sesudah_url',
        'file_lampiran_url',
    ];
}
