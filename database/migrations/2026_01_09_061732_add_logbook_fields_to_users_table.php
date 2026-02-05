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
        Schema::table('users', function (Blueprint $table) {
            $table->enum('peran', ['admin', 'pelaksana'])->default('pelaksana')->after('email');
            $table->foreignId('kategori_id')->nullable()->after('peran')->constrained('kategori')->onDelete('set null');
            $table->string('nomor_telepon')->nullable()->after('kategori_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['kategori_id']);
            $table->dropColumn(['peran', 'kategori_id', 'nomor_telepon']);
        });
    }
};
