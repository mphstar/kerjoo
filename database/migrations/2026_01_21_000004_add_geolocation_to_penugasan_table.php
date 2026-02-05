<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Menambahkan field geolocation untuk penugasan.
     * Admin dapat menentukan lokasi dan radius yang diizinkan
     * saat membuat penugasan.
     */
    public function up(): void
    {
        Schema::table('penugasan', function (Blueprint $table) {
            // Koordinat lokasi penugasan
            $table->decimal('lokasi_latitude', 10, 8)->nullable()->after('catatan');
            $table->decimal('lokasi_longitude', 11, 8)->nullable()->after('lokasi_latitude');

            // Radius dalam meter
            $table->unsignedInteger('lokasi_radius')->nullable()->after('lokasi_longitude')
                ->comment('Radius dalam meter');

            // Nama lokasi untuk display
            $table->string('lokasi_nama')->nullable()->after('lokasi_radius');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('penugasan', function (Blueprint $table) {
            $table->dropColumn([
                'lokasi_latitude',
                'lokasi_longitude',
                'lokasi_radius',
                'lokasi_nama',
            ]);
        });
    }
};
