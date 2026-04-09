import { Head, useForm } from '@inertiajs/react';
import React, { FormEventHandler } from 'react';

import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Pengaturan Aplikasi',
        href: '/settings/aplikasi',
    },
];

interface SettingsProps {
    settings: {
        admin_signature_name: string;
        admin_signature_nip: string;
    };
}

export default function Aplikasi({ settings }: SettingsProps) {
    const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
        admin_signature_name: settings.admin_signature_name || '',
        admin_signature_nip: settings.admin_signature_nip || '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put('/settings/aplikasi', {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pengaturan Aplikasi" />

            <h1 className="sr-only">Pengaturan Aplikasi</h1>

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Tanda Tangan Laporan"
                        description="Atur nama dan NIP/NRP pimpinan yang akan tampil pada dokumen PDF otomatis."
                    />

                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="admin_signature_name">Nama Admin / Pimpinan</Label>
                            <Input
                                id="admin_signature_name"
                                className="mt-1 block w-full"
                                value={data.admin_signature_name}
                                onChange={(e) => setData('admin_signature_name', e.target.value)}
                                placeholder="Cth: Ir. Budi Santoso"
                            />
                            <InputError className="mt-2" message={errors.admin_signature_name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="admin_signature_nip">NIP / NRP Admin / Pimpinan</Label>
                            <Input
                                id="admin_signature_nip"
                                className="mt-1 block w-full"
                                value={data.admin_signature_nip}
                                onChange={(e) => setData('admin_signature_nip', e.target.value)}
                                placeholder="Cth: 19801010 200501 1 001"
                            />
                            <InputError className="mt-2" message={errors.admin_signature_nip} />
                        </div>

                        <div className="flex items-center gap-4">
                            <Button disabled={processing}>Simpan</Button>

                            {recentlySuccessful && (
                                <p className="text-sm text-neutral-600 animate-in fade-in duration-300">
                                    Tersimpan.
                                </p>
                            )}
                        </div>
                    </form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
