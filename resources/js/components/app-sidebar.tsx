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
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { dashboard } from '@/routes';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, Building2, UserPlus, Wrench, FileText, Users, Calendar, ClipboardList, Eye, Clock, ChevronRight, Package, Fuel } from 'lucide-react';
import AppLogo from './app-logo';
import { useActiveUrl } from '@/hooks/use-active-url';

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
        title: 'Master Peralatan',
        href: '/admin/master-peralatan',
        icon: Wrench,
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
    {
        title: 'Penjadwalan',
        href: '/admin/jadwal',
        icon: Clock,
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
];

// Permintaan Pelaksana sub-items for admin sidebar
const permintaanPelaksanaItems = [
    { title: 'Peralatan', href: '/permintaan-peralatan' },
    { title: 'BBM', href: '/permintaan-bbm' },
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
    const { urlIsActive } = useActiveUrl();

    const isPermintaanActive = urlIsActive('/permintaan-peralatan') || urlIsActive('/permintaan-bbm');

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

                        {/* Logbook section with collapsible Permintaan Pelaksana */}
                        <SidebarGroup className="px-2 py-0">
                            <SidebarGroupLabel>Logbook</SidebarGroupLabel>
                            <SidebarMenu>
                                {adminLogbookNavItems.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={urlIsActive(item.href)}
                                            tooltip={{ children: item.title }}
                                        >
                                            <Link href={item.href} prefetch>
                                                {item.icon && <item.icon />}
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}

                                {/* Collapsible Permintaan Pelaksana */}
                                <Collapsible asChild defaultOpen={isPermintaanActive} className="group/collapsible">
                                    <SidebarMenuItem>
                                        <CollapsibleTrigger asChild>
                                            <SidebarMenuButton
                                                tooltip={{ children: 'Permintaan Pelaksana' }}
                                                isActive={isPermintaanActive}
                                            >
                                                <Package />
                                                <span>Permintaan Pelaksana</span>
                                                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                            </SidebarMenuButton>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                {permintaanPelaksanaItems.map((sub) => (
                                                    <SidebarMenuSubItem key={sub.title}>
                                                        <SidebarMenuSubButton
                                                            asChild
                                                            isActive={urlIsActive(sub.href)}
                                                        >
                                                            <Link href={sub.href} prefetch>
                                                                <span>{sub.title}</span>
                                                            </Link>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                ))}
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    </SidebarMenuItem>
                                </Collapsible>
                            </SidebarMenu>
                        </SidebarGroup>
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
