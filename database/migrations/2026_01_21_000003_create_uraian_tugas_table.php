<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Uraian tugas adalah master data tugas pokok per kategori.
     * Berbeda dengan tabel 'tugas' yang existing, uraian_tugas 
     * merupakan daftar referensi tugas yang bisa dipilih saat membuat penugasan.
     */
    public function up(): void
    {
        Schema::create('uraian_tugas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kategori_id')->constrained('kategori')->onDelete('cascade');
            $table->string('nama');
            $table->text('deskripsi')->nullable();
            $table->boolean('aktif')->default(true);
            $table->integer('urutan')->default(0)->comment('Urutan tampilan');
            $table->timestamps();

            // Index untuk performance
            $table->index(['kategori_id', 'aktif']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('uraian_tugas');
    }
};
