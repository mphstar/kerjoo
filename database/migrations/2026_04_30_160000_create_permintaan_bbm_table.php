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
        Schema::create('permintaan_bbm', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pengguna_id')->constrained('users')->onDelete('cascade');
            $table->date('tanggal');
            $table->string('no_buku');
            $table->string('pengemudi');
            $table->text('uraian');
            $table->string('nama_kendaraan');
            $table->string('merk_kendaraan');
            $table->string('no_polisi');
            $table->decimal('km_awal', 10, 1);
            $table->decimal('bbm_awal_liter', 8, 1);
            $table->integer('bbm_awal_persen');
            $table->decimal('bbm_liter', 8, 1);
            $table->decimal('bbm_harga_per_liter', 12, 2);
            $table->decimal('bbm_total_harga', 14, 2);
            $table->decimal('km_akhir', 10, 1)->nullable();
            $table->decimal('bbm_akhir_liter', 8, 1)->nullable();
            $table->integer('bbm_akhir_persen')->nullable();
            $table->string('status')->default('pending');
            $table->foreignId('disetujui_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('waktu_persetujuan')->nullable();
            $table->text('catatan')->nullable();
            $table->timestamps();

            $table->index('pengguna_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('permintaan_bbm');
    }
};
