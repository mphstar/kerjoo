<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Kategori;

class KategoriSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $kategoris = [
            [
                'nama' => 'Kebersihan',
                'deskripsi' => 'Kategori untuk tugas-tugas kebersihan dan sanitasi',
            ],
            [
                'nama' => 'Teknisi',
                'deskripsi' => 'Kategori untuk tugas-tugas teknis dan maintenance',
            ],
            [
                'nama' => 'Keamanan',
                'deskripsi' => 'Kategori untuk tugas-tugas keamanan dan patroli',
            ],
            [
                'nama' => 'Administrasi',
                'deskripsi' => 'Kategori untuk tugas-tugas administratif dan dokumentasi',
            ],
        ];

        foreach ($kategoris as $kategori) {
            Kategori::create($kategori);
        }
    }
}
