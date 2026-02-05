// Ziggy route helper type definition
declare global {
    function route(name?: string, params?: any, absolute?: boolean): string & { url: string };
}

export { };
