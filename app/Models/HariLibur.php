<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HariLibur extends Model
{
    protected $table = 'hari_libur';

    protected $fillable = [
        'tanggal',
        'nama',
        'deskripsi',
    ];

    protected $casts = [
        'tanggal' => 'date',
    ];

    /**
     * Check if a given date is a holiday
     */
    public static function isHoliday(\DateTimeInterface|string $date): bool
    {
        if (is_string($date)) {
            $date = new \DateTime($date);
        }
        
        return self::whereDate('tanggal', $date->format('Y-m-d'))->exists();
    }

    /**
     * Get holiday info for a given date
     */
    public static function getHolidayInfo(\DateTimeInterface|string $date): ?self
    {
        if (is_string($date)) {
            $date = new \DateTime($date);
        }
        
        return self::whereDate('tanggal', $date->format('Y-m-d'))->first();
    }
}
