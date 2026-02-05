interface TableInfoProps {
    from: number | null;
    to: number | null;
    total: number;
}

export default function TableInfo({ from, to, total }: TableInfoProps) {
    if (total === 0) {
        return (
            <div className="text-sm text-muted-foreground">
                Tidak ada data
            </div>
        );
    }

    return (
        <div className="text-sm text-muted-foreground">
            Menampilkan {to} dari {total} data
        </div>
    );
}
