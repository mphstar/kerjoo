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
            $table->boolean('deadline_hari_berikutnya')->default(false)->after('tenggat_waktu_jam');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('template_penugasan_harian', function (Blueprint $table) {
            $table->dropColumn('deadline_hari_berikutnya');
        });
    }
};
