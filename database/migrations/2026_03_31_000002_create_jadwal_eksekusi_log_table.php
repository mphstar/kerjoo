<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jadwal_eksekusi_log', function (Blueprint $table) {
            $table->id();
            $table->date('tanggal_target');
            $table->string('tipe_diproses')->default('all'); // harian, mingguan, bulanan, tahunan, all
            $table->integer('template_count')->default(0);
            $table->integer('penugasan_count')->default(0);
            $table->boolean('skipped_holiday')->default(false);
            $table->string('holiday_name')->nullable();
            $table->string('status')->default('success'); // success, failed, skipped
            $table->text('error_message')->nullable();
            $table->string('triggered_by')->default('cron'); // cron, manual
            $table->text('detail')->nullable(); // JSON detail per template
            $table->timestamps();

            $table->index(['tanggal_target', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jadwal_eksekusi_log');
    }
};
