<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Menambahkan kolom jam_mulai ke tabel penugasan dan template_penugasan_harian.
     * jam_mulai menentukan kapan pelaksana diizinkan mulai mengerjakan tugas.
     */
    public function up(): void
    {
        // Add jam_mulai to penugasan table
        Schema::table('penugasan', function (Blueprint $table) {
            $table->dateTime('jam_mulai')->nullable()->after('tenggat_waktu')
                ->comment('Waktu pelaksana diizinkan mulai mengerjakan');
        });

        // Add jam_mulai to template_penugasan_harian table
        Schema::table('template_penugasan_harian', function (Blueprint $table) {
            $table->string('jam_mulai', 5)->default('08:00')->after('tenggat_waktu_jam')
                ->comment('Jam mulai default untuk template (format HH:mm)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('penugasan', function (Blueprint $table) {
            $table->dropColumn('jam_mulai');
        });

        Schema::table('template_penugasan_harian', function (Blueprint $table) {
            $table->dropColumn('jam_mulai');
        });
    }
};
