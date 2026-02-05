<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Menambahkan field koordinat untuk item penugasan.
     * Koordinat dicatat saat pelaksana mengupload foto sebelum dan sesudah.
     */
    public function up(): void
    {
        Schema::table('item_penugasan', function (Blueprint $table) {
            // Koordinat saat upload foto sebelum
            $table->decimal('foto_sebelum_latitude', 10, 8)->nullable()->after('foto_sebelum');
            $table->decimal('foto_sebelum_longitude', 11, 8)->nullable()->after('foto_sebelum_latitude');

            // Koordinat saat upload foto sesudah
            $table->decimal('foto_sesudah_latitude', 10, 8)->nullable()->after('foto_sesudah');
            $table->decimal('foto_sesudah_longitude', 11, 8)->nullable()->after('foto_sesudah_latitude');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('item_penugasan', function (Blueprint $table) {
            $table->dropColumn([
                'foto_sebelum_latitude',
                'foto_sebelum_longitude',
                'foto_sesudah_latitude',
                'foto_sesudah_longitude',
            ]);
        });
    }
};
