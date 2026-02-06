import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, Head, usePage } from '@inertiajs/react';
import { Loader2, Mail, Lock, LogIn } from 'lucide-react';

export default function Login({ status }: { status?: string }) {
    return (
        <>
            <Head title="Masuk" />
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-black dark:to-slate-950 transition-colors duration-300">
                {/* Header with Gradient */}
                <div className="bg-gradient-to-br from-primary via-primary to-primary/80 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-6 pb-24 pt-16 text-primary-foreground dark:text-white border-b-0 dark:border-b dark:border-slate-800/50 shadow-sm dark:shadow-none transition-all duration-300">
                    <div className="mx-auto max-w-md">
                        {/* App Logo/Icon */}
                        <div className="flex flex-col items-center">
                            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-lg dark:shadow-black/30 p-3 ring-1 ring-black/5 dark:ring-white/10">
                                <img
                                    src="/assets/images/kerjo.png"
                                    alt="Kerjo Logo"
                                    className="h-full w-full object-contain"
                                />
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight">Kerjoo</h1>
                            <p className="mt-1 text-primary-foreground/90 dark:text-slate-400 text-sm font-medium">Kelola tugas dengan mudah</p>
                        </div>
                    </div>
                </div>

                {/* Login Form Card */}
                <div className="mx-auto max-w-md px-6 -mt-16 relative z-10">
                    <div className="rounded-2xl bg-white dark:bg-slate-900 shadow-xl dark:shadow-2xl dark:shadow-black/50 p-6 border border-slate-200 dark:border-slate-800 transition-all duration-300">
                        <div className="mb-6 text-center">
                            <h2 className="text-xl font-semibold text-foreground">Masuk ke Akun</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Gunakan email dan password Anda
                            </p>
                        </div>

                        {status && (
                            <div className="mb-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 p-3 text-center text-sm font-medium text-green-600 dark:text-green-400">
                                {status}
                            </div>
                        )}

                        <Form
                            action="/login"
                            method="post"
                            className="flex flex-col gap-5"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                            <Input
                                                id="email"
                                                type="email"
                                                name="email"
                                                required
                                                autoFocus
                                                autoComplete="email"
                                                placeholder="nama@email.com"
                                                className="pl-10 h-12 bg-background dark:bg-slate-950/50 border-input dark:border-slate-800"
                                            />
                                        </div>
                                        <InputError message={errors.email} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password">Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                            <Input
                                                id="password"
                                                type="password"
                                                name="password"
                                                required
                                                autoComplete="current-password"
                                                placeholder="••••••••"
                                                className="pl-10 h-12 bg-background dark:bg-slate-950/50 border-input dark:border-slate-800"
                                            />
                                        </div>
                                        <InputError message={errors.password} />
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full h-12 mt-2 text-base font-semibold shadow-lg shadow-primary/20 dark:shadow-none hover:shadow-xl transition-all"
                                        disabled={processing}
                                    >
                                        {processing ? (
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        ) : (
                                            <LogIn className="mr-2 h-5 w-5" />
                                        )}
                                        Masuk
                                    </Button>
                                </>
                            )}
                        </Form>
                    </div>

                    {/* Footer */}
                    <p className="mt-8 text-center text-xs text-muted-foreground/80 dark:text-slate-600 pb-8">
                        &copy; {new Date().getFullYear()} Kerjoo. All rights reserved.
                    </p>
                </div>
            </div>
        </>
    );
}
