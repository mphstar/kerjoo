<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'peran',
        'kategori_id',
        'nomor_telepon',
        'nip_nrp',
        'tempat',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    /**
     * Get the category this user belongs to
     */
    public function kategori(): BelongsTo
    {
        return $this->belongsTo(Kategori::class, 'kategori_id');
    }

    /**
     * Get assignments as pelaksana
     */
    public function penugasan(): HasMany
    {
        return $this->hasMany(Penugasan::class, 'pengguna_id');
    }

    /**
     * Get assignments created as admin
     */
    public function penugasanDibuat(): HasMany
    {
        return $this->hasMany(Penugasan::class, 'ditugaskan_oleh');
    }

    /**
     * Get equipment requests
     */
    public function permintaanPeralatan(): HasMany
    {
        return $this->hasMany(PermintaanPeralatan::class, 'pengguna_id');
    }

    /**
     * Get attendance records
     */
    public function absensi(): HasMany
    {
        return $this->hasMany(Absensi::class, 'pengguna_id');
    }

    /**
     * Check if user is admin
     */
    public function isAdmin(): bool
    {
        return $this->peran === 'admin';
    }

    /**
     * Check if user is pelaksana
     */
    public function isPelaksana(): bool
    {
        return $this->peran === 'pelaksana';
    }
}
