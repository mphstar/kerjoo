<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tugas;

class TugasSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tugas = [
            // Tugas Kebersihan
            [
                'kategori_id' => 1,
                'nama' => 'Menyapu Ruangan',
                'deskripsi' => 'Menyapu lantai ruangan gedung kantor',
                'persyaratan' => json_encode(['foto' => true, 'file' => false, 'teks' => true]),
                'aktif' => true,
            ],
            [
                'kategori_id' => 1,
                'nama' => 'Mengepel Lantai',
                'deskripsi' => 'Mengepel lantai dengan cairan pembersih',
                'persyaratan' => json_encode(['foto' => true, 'file' => false, 'teks' => false]),
                'aktif' => true,
            ],
            [
                'kategori_id' => 1,
                'nama' => 'Membersihkan Toilet',
                'deskripsi' => 'Membersihkan dan mendisinfeksi toilet',
                'persyaratan' => json_encode(['foto' => true, 'file' => false, 'teks' => true]),
                'aktif' => true,
            ],

            // Tugas Teknisi  
            [
                'kategori_id' => 2,
                'nama' => 'Maintenance AC',
                'deskripsi' => 'Perawatan dan pembersihan unit AC',
                'persyaratan' => json_encode(['foto' => true, 'file' => true, 'teks' => true]),
                'aktif' => true,
            ],
            [
                'kategori_id' => 2,
                'nama' => 'Perbaikan Lampu',
                'deskripsi' => 'Penggantian lampu yang rusak atau mati',
                'persyaratan' => json_encode(['foto' => true, 'file' => false, 'teks' => false]),
                'aktif' => true,
            ],
            [
                'kategori_id' => 2,
                'nama' => 'Cek Instalasi Listrik',
                'deskripsi' => 'Pengecekan rutin instalasi dan panel listrik',
                'persyaratan' => json_encode(['foto' => true, 'file' => true, 'teks' => true]),
                'aktif' => true,
            ],

            // Tugas Keamanan
            [
                'kategori_id' => 3,
                'nama' => 'Patroli Area',
                'deskripsi' => 'Melakukan patroli keamanan area gedung',
                'persyaratan' => json_encode(['foto' => true, 'file' => false, 'teks' => true]),
                'aktif' => true,
            ],
            [
                'kategori_id' => 3,
                'nama' => 'Cek CCTV',
                'deskripsi' => 'Pengecekan fungsi kamera CCTV',
                'persyaratan' => json_encode(['foto' => true, 'file' => false, 'teks' => true]),
                'aktif' => true,
            ],

            // Tugas Administrasi
            [
                'kategori_id' => 4,
                'nama' => 'Rekapitulasi Data',
                'deskripsi' => 'Melakukan rekapitulasi data harian',
                'persyaratan' => json_encode(['foto' => false, 'file' => true, 'teks' => true]),
                'aktif' => true,
            ],
        ];

        foreach ($tugas as $item) {
            Tugas::create($item);
        }
    }
}
