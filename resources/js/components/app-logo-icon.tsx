import { HTMLAttributes } from 'react';

export default function AppLogoIcon(props: HTMLAttributes<HTMLDivElement>) {
    return (
        <div {...props} className={`${props.className || ''} flex items-center justify-center overflow-hidden rounded-md bg-white`}>
            <img
                src="/pwa-192x192.png"
                alt="Logo"
                className="size-full object-contain p-0.5"
            />
        </div>
    );
}
