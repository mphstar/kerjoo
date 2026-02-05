import { PropsWithChildren } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Home, ListChecks, User, Wrench } from 'lucide-react';

interface Props extends PropsWithChildren {
    showNavBar?: boolean;
}

export default function MobileLayout({ children, showNavBar = true }: Props) {
    const { url } = usePage();

    return (
        <div className="min-h-screen bg-muted/30 dark:bg-black transition-colors duration-300">
            {/* Centered container with max-width for mobile-like appearance on desktop */}
            <div className="mx-auto max-w-md md:max-w-lg lg:max-w-xl min-h-screen bg-background dark:bg-slate-950 shadow-xl relative transition-colors duration-300">
                {children}
            </div>

            {/* Mobile NavBar - now visible on all screen sizes but constrained to content width */}
            {showNavBar && (
                <div className="fixed bottom-0 left-0 right-0 z-50">
                    <div className="mx-auto max-w-md md:max-w-lg lg:max-w-xl">
                        <MobileNavBarContent currentPath={url} />
                    </div>
                </div>
            )}
        </div>
    );
}

function MobileNavBarContent({ currentPath = '' }: { currentPath?: string }) {
    const navItems = [
        { icon: Home, label: 'Beranda', href: '/pelaksana', path: '/pelaksana' },
        { icon: ListChecks, label: 'Tugas', href: '/pelaksana/tugas', path: '/pelaksana/tugas' },
        { icon: Wrench, label: 'Peralatan', href: '/pelaksana/peralatan', path: '/pelaksana/peralatan' },
        { icon: User, label: 'Profil', href: '/pelaksana/profil', path: '/pelaksana/profil' },
    ];

    const isActive = (path: string) => {
        if (path === '/pelaksana') {
            return currentPath === path || currentPath === '/dashboard';
        }
        return currentPath.startsWith(path);
    };

    return (
        <nav className="bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 transition-colors duration-300">
            <div className="grid grid-cols-4 h-16">
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
