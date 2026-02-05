import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MobileLayout from '@/layouts/mobile-layout';
import { type User } from '@/types/logbook';
import { Head, router, usePage } from '@inertiajs/react';
import { LogOut, Mail, Phone, Shield, Tag, ChevronRight, Lock, Download, HelpCircle, Loader2, Home, ListChecks, Wrench, User as UserIcon, Smartphone, Sun, Moon, Monitor, Palette } from 'lucide-react';
import { useState, useEffect, FormEvent } from 'react';
import { useAppearance, type Appearance } from '@/hooks/use-appearance';

interface Props {
    user: User;
}

// Theme Selector Component
function ThemeSelector() {
    const { appearance, updateAppearance } = useAppearance();

    const themes: { value: Appearance; icon: typeof Sun; label: string; description: string }[] = [
        { value: 'light', icon: Sun, label: 'Terang', description: 'Tampilan mode terang' },
        { value: 'dark', icon: Moon, label: 'Gelap', description: 'Tampilan mode gelap' },
        { value: 'system', icon: Monitor, label: 'Sistem', description: 'Ikuti pengaturan perangkat' },
    ];

    return (
        <div className="grid grid-cols-3 gap-3">
            {themes.map(({ value, icon: Icon, label, description }) => (
                <button
                    key={value}
                    onClick={() => updateAppearance(value)}
                    className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${appearance === value
                        ? 'border-primary bg-primary/5 dark:bg-primary/10'
                        : 'border-transparent bg-muted/50 hover:bg-muted'
                        }`}
                >
                    <div className={`p-3 rounded-full mb-2 ${appearance === value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted-foreground/10 text-muted-foreground'
                        }`}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <span className={`text-sm font-medium ${appearance === value ? 'text-primary' : 'text-foreground'
                        }`}>
                        {label}
                    </span>
                    <span className="text-[10px] text-muted-foreground text-center mt-0.5 leading-tight">
                        {description}
                    </span>
                </button>
            ))}
        </div>
    );
}

export default function ProfilIndex({ user }: Props) {
    const { url } = usePage();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isAppInstalled, setIsAppInstalled] = useState(false);
    const [passwordSheetOpen, setPasswordSheetOpen] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        password: '',
        password_confirmation: ''
    });
    const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);

        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsAppInstalled(true);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setIsAppInstalled(true);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const handleLogout = () => {
        setIsLoading(true);
        router.post('/logout', {}, {
            onFinish: () => setIsLoading(false)
        });
    };

    const handlePasswordSubmit = (e: FormEvent) => {
        e.preventDefault();
        setIsUpdatingPassword(true);
        setPasswordErrors({});
        setPasswordSuccess(false);

        router.put('/user/password', passwordForm, {
            preserveScroll: true,
            onSuccess: () => {
                setPasswordSuccess(true);
                setPasswordForm({
                    current_password: '',
                    password: '',
                    password_confirmation: ''
                });
                setTimeout(() => {
                    setPasswordSheetOpen(false);
                    setPasswordSuccess(false);
                }, 1500);
            },
            onError: (errors) => {
                setPasswordErrors(errors as Record<string, string>);
            },
            onFinish: () => setIsUpdatingPassword(false)
        });
    };

    return (
        <MobileLayout>
            <Head title="Profil Saya" />

            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-background pb-24">
                {/* Decorative Background */}
                <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-br from-primary via-primary/90 to-primary/70 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMiIgaGVpZ2h0PSI0MCIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNhKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-50" />
                </div>

                {/* Content */}
                <div className="relative px-4 pt-8 space-y-4">
                    {/* Header */}
                    <div className="text-primary-foreground mb-6">
                        <h1 className="text-2xl font-bold">Profil</h1>
                    </div>

                    {/* Profile Card */}
                    <Card className="overflow-hidden shadow-xl border-0">
                        <CardContent className="p-0">
                            {/* Avatar Section */}
                            <div className="relative bg-gradient-to-br from-primary/5 via-primary/10 to-transparent pt-8 pb-6 px-6">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-20 w-20 ring-4 ring-white dark:ring-slate-800 shadow-xl">
                                        <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-primary to-primary/80 dark:from-slate-800 dark:to-slate-900 text-primary-foreground dark:text-white">
                                            {getInitials(user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <h2 className="text-xl font-bold">{user.name}</h2>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                                <Shield className="h-3 w-3" />
                                                {user.peran}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Details Section */}
                            <div className="divide-y divide-border">
                                <div className="flex items-center gap-4 px-6 py-4 hover:bg-muted/50 transition-colors">
                                    <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                                        <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs text-muted-foreground font-medium">
                                            Email
                                        </div>
                                        <div className="font-medium truncate">{user.email}</div>
                                    </div>
                                </div>

                                {user.nomor_telepon && (
                                    <div className="flex items-center gap-4 px-6 py-4 hover:bg-muted/50 transition-colors">
                                        <div className="p-2.5 rounded-xl bg-green-100 dark:bg-green-900/30">
                                            <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs text-muted-foreground font-medium">
                                                Telepon
                                            </div>
                                            <div className="font-medium">{user.nomor_telepon}</div>
                                        </div>
                                    </div>
                                )}

                                {user.kategori && (
                                    <div className="flex items-center gap-4 px-6 py-4 hover:bg-muted/50 transition-colors">
                                        <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                                            <Tag className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs text-muted-foreground font-medium">
                                                Kategori
                                            </div>
                                            <div className="font-medium">{user.kategori.nama}</div>
                                        </div>
                                    </div>
                                )}

                                {user.nip_nrp && (
                                    <div className="flex items-center gap-4 px-6 py-4 hover:bg-muted/50 transition-colors">
                                        <div className="p-2.5 rounded-xl bg-orange-100 dark:bg-orange-900/30">
                                            <Shield className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs text-muted-foreground font-medium">
                                                NIP / NRP
                                            </div>
                                            <div className="font-medium">{user.nip_nrp}</div>
                                        </div>
                                    </div>
                                )}

                                {user.tempat && (
                                    <div className="flex items-center gap-4 px-6 py-4 hover:bg-muted/50 transition-colors">
                                        <div className="p-2.5 rounded-xl bg-teal-100 dark:bg-teal-900/30">
                                            <Home className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs text-muted-foreground font-medium">
                                                Tempat
                                            </div>
                                            <div className="font-medium">{user.tempat}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Menu Card */}
                    <Card className="shadow-lg border-0">
                        <CardContent className="p-0 divide-y divide-border">
                            {/* Ubah Password */}
                            <Sheet open={passwordSheetOpen} onOpenChange={setPasswordSheetOpen}>
                                <SheetTrigger asChild>
                                    <button className="w-full flex items-center gap-4 px-6 py-4 hover:bg-muted/50 transition-colors text-left">
                                        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                                            <Lock className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium">Ubah Password</div>
                                            <div className="text-xs text-muted-foreground">Perbarui kata sandi akun</div>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                    </button>
                                </SheetTrigger>
                                <SheetContent side="bottom" className="h-auto max-h-[90vh] overflow-y-auto rounded-t-[24px] p-0">
                                    <div className="p-6 pb-12">
                                        <div className="mx-auto w-12 h-1.5 bg-muted-foreground/20 rounded-full mb-6" />

                                        <SheetHeader className="mb-6 text-left">
                                            <SheetTitle className="text-xl">Ubah Password</SheetTitle>
                                            <SheetDescription>
                                                Masukkan password lama dan password baru Anda.
                                            </SheetDescription>
                                        </SheetHeader>

                                        <form onSubmit={handlePasswordSubmit} className="space-y-5">
                                            <div className="space-y-2">
                                                <Label htmlFor="current_password">Password Saat Ini</Label>
                                                <Input
                                                    id="current_password"
                                                    type="password"
                                                    value={passwordForm.current_password}
                                                    onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                                                    placeholder="Masukkan password saat ini"
                                                    className="h-12"
                                                />
                                                {passwordErrors.current_password && (
                                                    <p className="text-xs text-destructive">{passwordErrors.current_password}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="password">Password Baru</Label>
                                                <Input
                                                    id="password"
                                                    type="password"
                                                    value={passwordForm.password}
                                                    onChange={(e) => setPasswordForm(prev => ({ ...prev, password: e.target.value }))}
                                                    placeholder="Masukkan password baru"
                                                    className="h-12"
                                                />
                                                {passwordErrors.password && (
                                                    <p className="text-xs text-destructive">{passwordErrors.password}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="password_confirmation">Konfirmasi Password</Label>
                                                <Input
                                                    id="password_confirmation"
                                                    type="password"
                                                    value={passwordForm.password_confirmation}
                                                    onChange={(e) => setPasswordForm(prev => ({ ...prev, password_confirmation: e.target.value }))}
                                                    placeholder="Ulangi password baru"
                                                    className="h-12"
                                                />
                                            </div>

                                            <Button type="submit" size="lg" className="w-full h-12 text-base font-medium mt-4 bg-slate-900 text-white hover:bg-slate-800" disabled={isUpdatingPassword}>
                                                {isUpdatingPassword && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                                {passwordSuccess ? 'Berhasil!' : 'Simpan Password'}
                                            </Button>
                                        </form>
                                    </div>
                                </SheetContent>
                            </Sheet>

                            {/* Tema / Appearance */}
                            <Sheet>
                                <SheetTrigger asChild>
                                    <button className="w-full flex items-center gap-4 px-6 py-4 hover:bg-muted/50 transition-colors text-left">
                                        <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                                            <Palette className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium">Tampilan</div>
                                            <div className="text-xs text-muted-foreground">Ubah tema terang atau gelap</div>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                    </button>
                                </SheetTrigger>
                                <SheetContent side="bottom" className="h-auto max-h-[90vh] overflow-y-auto rounded-t-[24px] p-0">
                                    <div className="p-6 pb-12">
                                        <div className="mx-auto w-12 h-1.5 bg-muted-foreground/20 rounded-full mb-6" />

                                        <SheetHeader className="mb-6 text-left">
                                            <SheetTitle className="flex items-center gap-2 text-xl">
                                                <Palette className="h-5 w-5 text-primary" />
                                                Tampilan
                                            </SheetTitle>
                                            <SheetDescription>
                                                Pilih tema tampilan aplikasi yang Anda inginkan.
                                            </SheetDescription>
                                        </SheetHeader>

                                        <ThemeSelector />
                                    </div>
                                </SheetContent>
                            </Sheet>

                            {/* Install Aplikasi - Always visible */}
                            <Sheet>
                                <SheetTrigger asChild>
                                    <button className="w-full flex items-center gap-4 px-6 py-4 hover:bg-muted/50 transition-colors text-left">
                                        <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                                            <Download className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium">Install Aplikasi</div>
                                            <div className="text-xs text-muted-foreground">
                                                {isAppInstalled ? 'Sudah terinstall' : 'Pasang ke layar utama'}
                                            </div>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                    </button>
                                </SheetTrigger>
                                <SheetContent side="bottom" className="h-auto max-h-[85vh] overflow-y-auto rounded-t-[24px] p-0">
                                    <div className="p-6 pb-12">
                                        <div className="mx-auto w-12 h-1.5 bg-muted-foreground/20 rounded-full mb-6" />

                                        <SheetHeader className="mb-6 text-left">
                                            <SheetTitle className="flex items-center gap-2 text-xl">
                                                <Smartphone className="h-5 w-5 text-primary" />
                                                Install Aplikasi
                                            </SheetTitle>
                                            <SheetDescription>
                                                Pasang aplikasi ke layar utama untuk akses lebih cepat.
                                            </SheetDescription>
                                        </SheetHeader>

                                        {isAppInstalled ? (
                                            <div className="text-center py-8 px-4 bg-muted/30 rounded-2xl border border-dashed border-muted-foreground/20">
                                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4 shadow-sm">
                                                    <Download className="h-8 w-8 text-green-600 dark:text-green-400" />
                                                </div>
                                                <h3 className="font-semibold text-lg mb-2">Aplikasi Sudah Terinstall</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Anda sudah menggunakan aplikasi dalam mode standalone.
                                                </p>
                                            </div>
                                        ) : deferredPrompt ? (
                                            <div className="text-center py-6">
                                                <div className="bg-primary/5 rounded-2xl p-6 mb-6">
                                                    <p className="text-sm text-foreground/80 mb-4 font-medium">
                                                        Aplikasi siap diinstall. Klik tombol di bawah untuk menambahkan ke layar utama.
                                                    </p>
                                                    <Button onClick={handleInstallClick} size="lg" className="w-full gap-2 h-12 shadow-md">
                                                        <Download className="h-5 w-5" />
                                                        Install Sekarang
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="bg-muted/50 rounded-2xl p-5 border border-border/50">
                                                    <h4 className="font-medium mb-4 flex items-center gap-2">
                                                        <div className="w-1 h-5 bg-primary rounded-full"></div>
                                                        Cara Install Manual
                                                    </h4>
                                                    <div className="space-y-4 text-sm">
                                                        <div className="flex gap-4 items-start">
                                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold mt-0.5">1</span>
                                                            <p className="leading-5 pt-0.5">Ketuk ikon <strong>menu (⋮)</strong> atau <strong>Share</strong> di browser</p>
                                                        </div>
                                                        <div className="flex gap-4 items-start">
                                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold mt-0.5">2</span>
                                                            <p className="leading-5 pt-0.5">Pilih <strong>"Add to Home Screen"</strong> atau <strong>"Install App"</strong></p>
                                                        </div>
                                                        <div className="flex gap-4 items-start">
                                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold mt-0.5">3</span>
                                                            <p className="leading-5 pt-0.5">Konfirmasi dengan mengetuk <strong>"Add"</strong> atau <strong>"Install"</strong></p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-center text-muted-foreground pt-2">
                                                    Disarankan menggunakan Google Chrome, Safari, atau Microsoft Edge.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </SheetContent>
                            </Sheet>

                            {/* Bantuan */}
                            <Sheet>
                                <SheetTrigger asChild>
                                    <button className="w-full flex items-center gap-4 px-6 py-4 hover:bg-muted/50 transition-colors text-left">
                                        <div className="p-2.5 rounded-xl bg-cyan-100 dark:bg-cyan-900/30">
                                            <HelpCircle className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium">Bantuan</div>
                                            <div className="text-xs text-muted-foreground">Panduan penggunaan</div>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                    </button>
                                </SheetTrigger>
                                <SheetContent side="bottom" className="h-[85vh] overflow-y-auto rounded-t-[24px] p-0">
                                    <div className="p-6 pb-12">
                                        <div className="mx-auto w-12 h-1.5 bg-muted-foreground/20 rounded-full mb-6" />

                                        <SheetHeader className="mb-6 text-left">
                                            <SheetTitle className="text-xl">Pusat Bantuan</SheetTitle>
                                            <SheetDescription>
                                                Panduan singkat penggunaan aplikasi Logbook untuk Pelaksana.
                                            </SheetDescription>
                                        </SheetHeader>

                                        <div className="space-y-6">
                                            {/* Beranda */}
                                            <div className="space-y-3">
                                                <h3 className="font-semibold text-base flex items-center gap-2">
                                                    <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                                        <Home className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    Beranda
                                                </h3>
                                                <ul className="space-y-2 text-sm text-muted-foreground ml-2 border-l-2 border-muted pl-4">
                                                    <li>• Lihat ringkasan tugas: hari ini, selesai, aktif, mendesak</li>
                                                    <li>• Pantau tingkat penyelesaian dan rata-rata waktu kerja</li>
                                                    <li>• Akses cepat ke tugas terbaru</li>
                                                </ul>
                                            </div>

                                            {/* Tugas */}
                                            <div className="space-y-3">
                                                <h3 className="font-semibold text-base flex items-center gap-2">
                                                    <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                                                        <ListChecks className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                                    </div>
                                                    Tugas
                                                </h3>
                                                <ul className="space-y-2 text-sm text-muted-foreground ml-2 border-l-2 border-muted pl-4">
                                                    <li>• Lihat daftar tugas yang ditugaskan kepada Anda</li>
                                                    <li>• Klik tugas untuk melihat detail dan mulai mengerjakan</li>
                                                    <li>• Tekan <strong>Mulai Timer</strong> saat tiba di lokasi</li>
                                                    <li>• Upload foto kegiatan sebagai bukti kerja</li>
                                                    <li>• Tekan <strong>Stop Timer</strong> setelah selesai</li>
                                                    <li>• Pastikan izin <strong>Lokasi</strong> aktif di browser</li>
                                                </ul>
                                            </div>

                                            {/* Peralatan */}
                                            <div className="space-y-3">
                                                <h3 className="font-semibold text-base flex items-center gap-2">
                                                    <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                                                        <Wrench className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                                    </div>
                                                    Peralatan
                                                </h3>
                                                <ul className="space-y-2 text-sm text-muted-foreground ml-2 border-l-2 border-muted pl-4">
                                                    <li>• Ajukan permintaan peralatan kerja bulanan</li>
                                                    <li>• Pilih bulan dan tahun pengajuan</li>
                                                    <li>• Tambahkan daftar peralatan yang dibutuhkan</li>
                                                    <li>• Pantau status: Menunggu, Disetujui, atau Ditolak</li>
                                                </ul>
                                            </div>

                                            {/* Profil */}
                                            <div className="space-y-3">
                                                <h3 className="font-semibold text-base flex items-center gap-2">
                                                    <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                                                        <UserIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                                    </div>
                                                    Profil
                                                </h3>
                                                <ul className="space-y-2 text-sm text-muted-foreground ml-2 border-l-2 border-muted pl-4">
                                                    <li>• Lihat informasi akun Anda</li>
                                                    <li>• Ubah password melalui menu Pengaturan</li>
                                                    <li>• Install aplikasi ke layar utama</li>
                                                    <li>• Hubungi Admin jika ada kesalahan data diri</li>
                                                </ul>
                                            </div>

                                            <div className="pt-6 pb-2 border-t mt-4">
                                                <div className="bg-muted/30 rounded-xl p-4 text-center">
                                                    <p className="text-xs text-muted-foreground font-medium">
                                                        Butuh bantuan lebih lanjut?
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Hubungi Supervisor atau Administrator.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </CardContent>
                    </Card>

                    {/* Logout Button */}
                    <Button
                        className="w-full gap-2 h-12 shadow-lg"
                        variant="destructive"
                        onClick={() => setConfirmOpen(true)}
                    >
                        <LogOut className="h-5 w-5" />
                        Keluar dari Akun
                    </Button>

                    {/* Version Info */}
                    <p className="text-center text-xs text-muted-foreground pt-2">
                        Logbook App v1.0.0
                    </p>
                </div>
            </div>

            {/* Logout Confirmation */}
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Keluar dari Akun?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Anda akan keluar dari sesi saat ini. Apakah Anda yakin ingin melanjutkan?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleLogout} disabled={isLoading} className="bg-destructive text-white hover:bg-destructive/90">
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Ya, Keluar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </MobileLayout>
    );
}
