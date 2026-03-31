<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JadwalEksekusiLog extends Model
{
    protected $table = 'jadwal_eksekusi_log';

    protected $fillable = [
        'tanggal_target',
        'tipe_diproses',
        'template_count',
        'penugasan_count',
        'skipped_holiday',
        'holiday_name',
        'status',
        'error_message',
        'triggered_by',
        'detail',
    ];

    protected $casts = [
        'tanggal_target' => 'date',
        'skipped_holiday' => 'boolean',
        'template_count' => 'integer',
        'penugasan_count' => 'integer',
    ];

    /**
     * Check if schedule already ran successfully for a given date
     */
    public static function alreadyRanForDate(\DateTimeInterface|string $date): bool
    {
        if (is_string($date)) {
            $date = new \DateTime($date);
        }

        return self::whereDate('tanggal_target', $date->format('Y-m-d'))
            ->where('status', 'success')
            ->exists();
    }

    /**
     * Get the latest execution log
     */
    public static function getLatest(): ?self
    {
        return self::latest()->first();
    }
}
