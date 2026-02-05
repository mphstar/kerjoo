export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg overflow-hidden bg-white shadow-sm">
                <img
                    src="/assets/images/kerjo.png"
                    alt="Kerjo Logo"
                    className="size-6 object-contain"
                />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    Kerjoo
                </span>
            </div>
        </>
    );
}
