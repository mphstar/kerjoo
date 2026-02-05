<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('template_penugasan_harian', function (Blueprint $table) {
            $table->foreignId('pengguna_id')->nullable()->after('aktif')->constrained('users')->nullOnDelete();
            $table->string('tenggat_waktu_jam', 5)->default('17:00')->after('pengguna_id');
            $table->text('catatan')->nullable()->after('tenggat_waktu_jam');
            $table->decimal('lokasi_latitude', 10, 8)->nullable()->after('catatan');
            $table->decimal('lokasi_longitude', 11, 8)->nullable()->after('lokasi_latitude');
            $table->integer('lokasi_radius')->nullable()->after('lokasi_longitude');
            $table->string('lokasi_nama')->nullable()->after('lokasi_radius');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('template_penugasan_harian', function (Blueprint $table) {
            $table->dropForeign(['pengguna_id']);
            $table->dropColumn([
                'pengguna_id',
                'tenggat_waktu_jam',
                'catatan',
                'lokasi_latitude',
                'lokasi_longitude',
                'lokasi_radius',
                'lokasi_nama',
            ]);
        });
    }
};
