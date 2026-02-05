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
        Schema::create('template_penugasan_harian', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->text('deskripsi')->nullable();
            $table->boolean('aktif')->default(true);
            $table->timestamps();
        });

        // Pivot table for template items
        Schema::create('template_penugasan_harian_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('template_id')->constrained('template_penugasan_harian')->onDelete('cascade');
            $table->foreignId('tugas_id')->constrained('tugas')->onDelete('cascade');
            $table->foreignId('pengguna_id')->constrained('users')->onDelete('cascade');
            $table->string('tenggat_waktu_jam')->default('17:00'); // Default deadline time
            $table->text('catatan')->nullable();
            // Location fields
            $table->decimal('lokasi_latitude', 10, 8)->nullable();
            $table->decimal('lokasi_longitude', 11, 8)->nullable();
            $table->integer('lokasi_radius')->nullable();
            $table->string('lokasi_nama')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('template_penugasan_harian_items');
        Schema::dropIfExists('template_penugasan_harian');
    }
};
