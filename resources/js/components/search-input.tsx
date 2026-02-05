import { Input } from "@/components/ui/input";
import { router } from "@inertiajs/react";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";

interface Props {
    placeholder?: string;
    routeName?: string;
    baseUrl?: string;  // Custom URL that overrides routeMap
    className?: string;
}

// Map route names to actual URLs
const routeMap: Record<string, string> = {
    'kategori.index': '/admin/kategori',
    'tugas.index': '/admin/tugas',
    'penugasan.index': '/admin/penugasan',
    'users.index': '/admin/users',
    'permintaan-peralatan.index': '/admin/peralatan',
};

export default function SearchInput({ placeholder = "Cari...", routeName, baseUrl, className }: Props) {
    // Parse current search params
    const params = new URLSearchParams(window.location.search);
    const [text, setText] = useState(params.get("search") || "");
    const [query] = useDebounce(text, 500);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        // Use baseUrl if provided, otherwise fall back to routeMap or current pathname
        const url = baseUrl || (routeName ? routeMap[routeName] : undefined) || window.location.pathname;

        // Preserve existing URL params while updating search
        const currentParams = new URLSearchParams(window.location.search);
        const preservedParams: Record<string, string> = {};

        // Keep existing params except 'search' and 'page'
        currentParams.forEach((value, key) => {
            if (key !== 'search' && key !== 'page') {
                preservedParams[key] = value;
            }
        });

        router.get(
            url,
            { ...preservedParams, search: query || undefined },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    }, [query]);

    return (
        <div className={`relative ${className}`}>
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder={placeholder}
                className="pl-8"
                value={text}
                onChange={(e) => setText(e.target.value)}
            />
        </div>
    );
}
