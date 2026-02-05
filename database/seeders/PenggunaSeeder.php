<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class PenggunaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Admin
        User::create([
            'name' => 'Administrator',
            'email' => 'bintang@gmail.com',
            'password' => Hash::make('123'),
            'peran' => 'admin',
            'kategori_id' => null,
            'nomor_telepon' => '081234567890',
        ]);

        // Pelaksana Kebersihan
        // User::create([
        //     'name' => 'Budi Santoso',
        //     'email' => 'budi@logbook.test',
        //     'password' => Hash::make('password'),
        //     'peran' => 'pelaksana',
        //     'kategori_id' => 1, // Kebersihan
        //     'nomor_telepon' => '081234567891',
        // ]);

        // User::create([
        //     'name' => 'Siti Aminah',
        //     'email' => 'siti@logbook.test',
        //     'password' => Hash::make('password'),
        //     'peran' => 'pelaksana',
        //     'kategori_id' => 1, // Kebersihan
        //     'nomor_telepon' => '081234567892',
        // ]);

        // // Pelaksana Teknisi
        // User::create([
        //     'name' => 'Ahmad Yani',
        //     'email' => 'ahmad@logbook.test',
        //     'password' => Hash::make('password'),
        //     'peran' => 'pelaksana',
        //     'kategori_id' => 2, // Teknisi
        //     'nomor_telepon' => '081234567893',
        // ]);

        // User::create([
        //     'name' => 'Joko Widodo',
        //     'email' => 'joko@logbook.test',
        //     'password' => Hash::make('password'),
        //     'peran' => 'pelaksana',
        //     'kategori_id' => 2, // Teknisi
        //     'nomor_telepon' => '081234567894',
        // ]);

        // // Pelaksana Keamanan
        // User::create([
        //     'name' => 'Sugeng Rahayu',
        //     'email' => 'sugeng@logbook.test',
        //     'password' => Hash::make('password'),
        //     'peran' => 'pelaksana',
        //     'kategori_id' => 3, // Keamanan
        //     'nomor_telepon' => '081234567895',
        // ]);
    }
}
