import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, Building2, UserPlus, Wrench, FileText, Users, Calendar, ClipboardList, Eye } from 'lucide-react';
import AppLogo from './app-logo';

const adminMainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
];

const adminMasterNavItems: NavItem[] = [
    {
        title: 'Bidang',
        href: '/admin/bidang',
        icon: Building2,
    },
    {
        title: 'Pengguna',
        href: '/admin/users',
        icon: Users,
    },
    {
        title: 'Hari Libur',
        href: '/admin/hari-libur',
        icon: Calendar,
    },
    {
        title: 'Template Penugasan',
        href: '/admin/template-harian',
        icon: ClipboardList,
    },
];

const adminLogbookNavItems: NavItem[] = [
    {
        title: 'Penugasan (Admin)',
        href: '/admin/penugasan',
        icon: UserPlus,
    },
    {
        title: 'Laporan',
        href: '/admin/report',
        icon: FileText,
    },
    {
        title: 'Permintaan Alat',
        href: '/permintaan-peralatan',
        icon: Wrench,
    },
];

const pimpinanMainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
];

const pimpinanMonitoringNavItems: NavItem[] = [
    {
        title: 'Monitoring Penugasan',
        href: '/pimpinan/penugasan',
        icon: Eye,
    },
    {
        title: 'Laporan',
        href: '/pimpinan/report',
        icon: FileText,
    },
];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    const isPimpinan = auth.user.peran === 'pimpinan';

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {isPimpinan ? (
                    <>
                        <NavMain items={pimpinanMainNavItems} label="Platform" />
                        <NavMain items={pimpinanMonitoringNavItems} label="Monitoring" />
                    </>
                ) : (
                    <>
                        <NavMain items={adminMainNavItems} label="Platform" />
                        <NavMain items={adminMasterNavItems} label="Master Data" />
                        <NavMain items={adminLogbookNavItems} label="Logbook" />
                    </>
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
