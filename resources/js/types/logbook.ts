export interface Bidang {
    id: number;
    nama: string;
    deskripsi: string | null;
    aktif: boolean;
    created_at: string;
    updated_at: string;
    kategori?: Kategori[];
    kategori_count?: number;
}

export interface Kategori {
    id: number;
    bidang_id: number | null;
    nama: string;
    deskripsi: string | null;
    created_at: string;
    updated_at: string;
    bidang?: Bidang;
}

export interface UraianTugas {
    id: number;
    kategori_id: number;
    nama: string;
    deskripsi: string | null;
    aktif: boolean;
    urutan: number;
    created_at: string;
    updated_at: string;
    kategori?: Kategori;
}

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    peran: 'admin' | 'pelaksana';
    kategori_id: number | null;
    nomor_telepon: string | null;
    nip_nrp: string | null;
    tempat: string | null;
    created_at: string;
    updated_at: string;
    kategori?: Kategori;
}

export interface Tugas {
    id: number;
    kategori_id: number;
    nama: string;
    tipe: 'harian' | 'mingguan' | 'bulanan' | 'tahunan' | 'lainnya';
    deskripsi: string | null;
    persyaratan: {
        foto: boolean;
        file: boolean;
        teks: boolean;
    };
    aktif: boolean;
    created_at: string;
    updated_at: string;
    kategori?: Kategori;
}

export interface Penugasan {
    id: number;
    tugas_id: number;
    pengguna_id: number;
    ditugaskan_oleh: number;
    status: 'pending' | 'sedang_dikerjakan' | 'selesai';
    tenggat_waktu: string | null;
    waktu_mulai: string | null;
    waktu_selesai: string | null;
    catatan: string | null;
    // Geolocation fields
    lokasi_latitude: number | null;
    lokasi_longitude: number | null;
    lokasi_radius: number | null;
    lokasi_nama: string | null;
    created_at: string;
    updated_at: string;
    tugas?: Tugas;
    pengguna?: User;
    ditugaskan_oleh_user?: User;
    items?: ItemPenugasan[];
}

export interface ItemPenugasan {
    id: number;
    penugasan_id: number;
    nama: string;
    waktu_mulai: string | null;
    waktu_selesai: string | null;
    durasi_detik: number;
    foto_sebelum: string | null;
    foto_sebelum_latitude: number | null;
    foto_sebelum_longitude: number | null;
    foto_sesudah: string | null;
    foto_sesudah_latitude: number | null;
    foto_sesudah_longitude: number | null;
    file_lampiran: string | null;
    ringkasan_teks: string | null;
    status: 'pending' | 'sedang_dikerjakan' | 'selesai';
    created_at: string;
    updated_at: string;
    foto_sebelum_url?: string;
    foto_sesudah_url?: string;
    file_lampiran_url?: string;
}

export interface PermintaanPeralatan {
    id: number;
    pengguna_id: number;
    bulan: number;
    tahun: number;
    waktu_pengajuan: string;
    status: 'pending' | 'disetujui' | 'ditolak';
    disetujui_oleh: number | null;
    waktu_persetujuan: string | null;
    catatan: string | null;
    created_at: string;
    updated_at: string;
    pengguna?: User;
    details?: DetailPeralatan[];
}

export interface DetailPeralatan {
    id: number;
    permintaan_peralatan_id: number;
    nama_peralatan: string;
    jumlah: number;
    satuan: string;
    created_at: string;
    updated_at: string;
}

export interface HariLibur {
    id: number;
    tanggal: string;
    nama: string;
    deskripsi: string | null;
    created_at: string;
    updated_at: string;
}

export interface TemplatePenugasanHarian {
    id: number;
    nama: string;
    deskripsi: string | null;
    aktif: boolean;
    pengguna_id: number;
    tenggat_waktu_jam: string;
    catatan: string | null;
    lokasi_latitude: number | null;
    lokasi_longitude: number | null;
    lokasi_radius: number | null;
    lokasi_nama: string | null;
    created_at: string;
    updated_at: string;
    pengguna?: User;
    items?: TemplatePenugasanHarianItem[];
}

export interface TemplatePenugasanHarianItem {
    id: number;
    template_id: number;
    tugas_id: number;
    pengguna_id: number;
    tenggat_waktu_jam: string;
    catatan: string | null;
    lokasi_latitude: number | null;
    lokasi_longitude: number | null;
    lokasi_radius: number | null;
    lokasi_nama: string | null;
    created_at: string;
    updated_at: string;
    tugas?: Tugas;
    pengguna?: User;
}

