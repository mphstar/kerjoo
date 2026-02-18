import { Link } from '@inertiajs/react';
import { Camera, Home, ListChecks, User, Wrench } from 'lucide-react';

interface Props {
    currentPath?: string;
}

export default function MobileNavBar({ currentPath = '' }: Props) {
    const navItems = [
        { icon: Home, label: 'Beranda', href: '/pelaksana', path: '/pelaksana' },
        { icon: ListChecks, label: 'Tugas', href: '/pelaksana/tugas', path: '/pelaksana/tugas' },
        { icon: Camera, label: 'Absensi', href: '/pelaksana/absensi', path: '/pelaksana/absensi' },
        { icon: Wrench, label: 'Peralatan', href: '/pelaksana/peralatan', path: '/pelaksana/peralatan' },
        { icon: User, label: 'Profil', href: '/pelaksana/profil', path: '/pelaksana/profil' },
    ];

    const isActive = (path: string) => {
        if (path === '/pelaksana') {
            return currentPath === path;
        }
        return currentPath.startsWith(path);
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden">
            <div className="grid grid-cols-5 h-16">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center gap-1 transition-colors ${active
                                ? 'text-primary'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <Icon className={`h-5 w-5 ${active ? 'fill-current' : ''}`} />
                            <span className="text-xs font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}

