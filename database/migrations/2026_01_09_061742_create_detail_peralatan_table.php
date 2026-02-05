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
        Schema::create('detail_peralatan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('permintaan_peralatan_id')->constrained('permintaan_peralatan')->onDelete('cascade');
            $table->string('nama_peralatan');
            $table->integer('jumlah');
            $table->string('satuan');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('detail_peralatan');
    }
};
