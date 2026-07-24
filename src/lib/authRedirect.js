/**
 * Returns the destination href for a CTA button.
 * If the user is logged in (has access_token), returns the target path.
 * Otherwise returns /login?redirect=<target> so login can bounce them back.
 */
export function getAuthHref(targetPath) {
    if (typeof window === 'undefined') return `/login?redirect=${encodeURIComponent(targetPath)}`;
    const token = localStorage.getItem('access_token') || localStorage.getItem('user_id') || localStorage.getItem('user');
    return token ? targetPath : `/login?redirect=${encodeURIComponent(targetPath)}`;
}

/**
 * Navigates to targetPath if logged in, otherwise to login with redirect param.
 * Pass a Next.js router instance.
 */
export function authNavigate(router, targetPath) {
    router.push(getAuthHref(targetPath));
}
