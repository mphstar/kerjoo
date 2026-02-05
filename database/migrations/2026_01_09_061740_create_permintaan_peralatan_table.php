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
        Schema::create('permintaan_peralatan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pengguna_id')->constrained('users')->onDelete('cascade');
            $table->integer('bulan')->comment('1-12');
            $table->integer('tahun');
            $table->dateTime('waktu_pengajuan');
            $table->enum('status', ['pending', 'disetujui', 'ditolak'])->default('pending');
            $table->foreignId('disetujui_oleh')->nullable()->constrained('users')->onDelete('set null');
            $table->dateTime('waktu_persetujuan')->nullable();
            $table->text('catatan')->nullable();
            $table->timestamps();

            // Index untuk filtering per bulan
            $table->index(['tahun', 'bulan']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('permintaan_peralatan');
    }
};
