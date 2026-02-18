<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KomentarPenugasan extends Model
{
    use HasFactory;

    protected $table = 'komentar_penugasan';

    protected $fillable = [
        'penugasan_id',
        'pengguna_id',
        'isi',
    ];

    /**
     * Get the penugasan this comment belongs to.
     */
    public function penugasan(): BelongsTo
    {
        return $this->belongsTo(Penugasan::class, 'penugasan_id');
    }

    /**
     * Get the user who made this comment.
     */
    public function pengguna(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pengguna_id');
    }
}
