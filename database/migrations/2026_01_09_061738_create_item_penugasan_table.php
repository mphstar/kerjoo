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
        Schema::create('item_penugasan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('penugasan_id')->constrained('penugasan')->onDelete('cascade');
            $table->string('nama');
            $table->dateTime('waktu_mulai')->nullable();
            $table->dateTime('waktu_selesai')->nullable();
            $table->integer('durasi_detik')->default(0);
            $table->string('foto_sebelum')->nullable();
            $table->string('foto_sesudah')->nullable();
            $table->string('file_lampiran')->nullable();
            $table->text('ringkasan_teks')->nullable();
            $table->enum('status', ['pending', 'sedang_dikerjakan', 'selesai'])->default('pending');
            $table->timestamps();

            // Index untuk performance
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('item_penugasan');
    }
};
