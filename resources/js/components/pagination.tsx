import { Button } from "@/components/ui/button";
import { Link } from "@inertiajs/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}

export default function Pagination({ links }: PaginationProps) {
    if (links.length <= 3) return null;

    return (
        <div className="flex items-center justify-end space-x-2 py-4">
            {links.map((link, key) => (
                <Button
                    key={key}
                    variant={link.active ? "default" : "outline"}
                    size="sm"
                    asChild
                    disabled={!link.url}
                    className={!link.url ? "pointer-events-none opacity-50" : ""}
                >
                    <Link
                        preserveScroll
                        href={link.url || '#'}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                </Button>
            ))}
        </div>
    );
}
