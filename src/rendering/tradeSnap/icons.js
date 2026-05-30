export function MonitorIcon({ className }) {
    return (
        <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" strokeLinecap="round" />
        </svg>
    );
}

export function MonitorOffIcon({ className }) {
    return (
        <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 21h8M12 17v4M2 2l20 20" strokeLinecap="round" />
            <path d="M9.88 9.88A3 3 0 0112 8h8a2 2 0 012 2v6" />
            <path d="M5 7h.01M2 2l20 20" />
        </svg>
    );
}

export function PlayIcon({ className }) {
    return (
        <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
        </svg>
    );
}

export function StopIcon({ className }) {
    return (
        <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="1" />
        </svg>
    );
}

export function CameraIcon({ className }) {
    return (
        <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
            <circle cx="12" cy="13" r="4" />
        </svg>
    );
}

export function ChartIcon({ className }) {
    return (
        <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3v18h18M7 16l4-8 4 5 5-9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function ClockIcon({ className }) {
    return (
        <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" strokeLinecap="round" />
        </svg>
    );
}

export function TrendUpIcon({ className }) {
    return (
        <svg className={className} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 6l-9.5 9.5-5-5L1 18" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M17 6h6v6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function TrendDownIcon({ className }) {
    return (
        <svg className={className} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 18l-9.5-9.5-5 5L1 6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M17 18h6v-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function EyeIcon({ className }) {
    return (
        <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}

export function UploadIcon({ className }) {
    return (
        <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="17 8 12 3 7 8" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" />
        </svg>
    );
}

export function LiveIcon({ className }) {
    return (
        <svg className={className} width="20" height="20" viewBox="0 0 32 32" fill="none">
            <path d="M5.33 28C5.33 26.53 4.14 25.33 2.67 25.33M10.67 28C10.67 23.58 7.08 20 2.67 20M16 28C16 20.64 10.03 14.67 2.67 14.67" stroke="#FF5757" strokeWidth="2" strokeLinecap="round" />
            <path d="M4 10.67C4.1 8.17 4.44 6.64 5.52 5.56C7.08 4 9.6 4 14.64 4H18.65C23.68 4 26.2 4 27.77 5.56C29.33 7.12 29.33 9.64 29.33 14.67V16C29.33 21.03 29.33 23.54 27.77 25.11C26.35 26.52 24.14 26.65 19.98 26.67" stroke="#FF5757" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}
