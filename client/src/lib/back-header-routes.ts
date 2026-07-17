/** Routes avec `BackHeader` (`bg-card`) — le scrim safe-area doit utiliser la même couleur. */
export function routeUsesBackHeader(pathname: string): boolean {
    return (
        pathname === '/profile' ||
        pathname === '/friends' ||
        pathname === '/history' ||
        pathname === '/settings' ||
        pathname === '/exercises' ||
        pathname.startsWith('/exercise/') ||
        pathname.startsWith('/session/') ||
        pathname.startsWith('/friends/chat/') ||
        pathname.startsWith('/friends/preview/') ||
        (pathname.startsWith('/friends/') && pathname !== '/friends') ||
        pathname.startsWith('/invite/')
    )
}
