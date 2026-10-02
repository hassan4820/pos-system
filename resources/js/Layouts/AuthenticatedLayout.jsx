import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

const navigation = [
    { label: 'Overview', route: 'dashboard', icon: 'overview' },
    { label: 'Point of sale', route: 'pos.index', icon: 'pos' },
    { label: 'Products', route: 'products.index', icon: 'products', admin: true },
    { label: 'Purchases', route: 'purchase.index', icon: 'purchase', admin: true },
    { label: 'Reports', route: 'reports.index', icon: 'reports' },
    { label: 'Team members', route: 'admin.users', icon: 'users', admin: true },
];

const iconPaths = {
    overview: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    pos: <><path d="M4 5h16l-1.5 9h-13L4 5Z" /><path d="M4 5 3 3H1" /><circle cx="8" cy="19" r="1" /><circle cx="17" cy="19" r="1" /><path d="M7 14 8 9m4 5V9m4 5-1-5" /></>,
    products: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4.5 7.8 7.5 4.4 7.5-4.4M12 21v-8.8M8 5.2l8 4.6" /></>,
    purchase: <><path d="M4 7h16l-1 13H5L4 7Z" /><path d="M9 7a3 3 0 0 1 6 0M12 11v5m-2-2 2 2 2-2" /></>,
    reports: <><path d="M4 19V5m0 14h17" /><path d="m7 15 4-4 3 2 6-7" /><path d="M16 6h4v4" /></>,
    users: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-1a6 6 0 0 1 12 0v1H3Zm13-9a3 3 0 1 0-1-5.8M18 14a5 5 0 0 1 3 4.6v1.4" /></>,
};

function NavItem({ item, user, onNavigate }) {
    if (item.admin && !user.is_admin) return null;

    const active = route().current(item.route);

    return (
        <Link
            href={route(item.route)}
            onClick={onNavigate}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-100'}`}
        >
            <svg className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {iconPaths[item.icon]}
            </svg>
            {item.label}
            {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />}
        </Link>
    );
}

function Brand() {
    return (
        <Link href={route('home')} className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-950/25">
                <ApplicationLogo className="h-6 w-6 fill-current" />
            </span>
            <span>
                <span className="block text-sm font-bold tracking-wide text-white">POS SYSTEM</span>
                <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">Retail management</span>
            </span>
        </Link>
    );
}

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const initials = user.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase();

    const links = (onNavigate) => navigation.map((item) => (
        <NavItem key={item.route} item={item} user={user} onNavigate={onNavigate} />
    ));

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-[258px] flex-col bg-slate-950 px-4 py-6 lg:flex">
                <div className="px-2"><Brand /></div>
                <div className="mt-10 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">Workspace</div>
                <nav className="mt-3 space-y-1">{links()}</nav>
                <div className="mt-auto rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4">
                    <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-emerald-300">{initials}</span>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-200">{user.name}</p>
                            <p className="mt-0.5 text-xs text-slate-500">{user.is_admin ? 'Administrator' : 'Staff account'}</p>
                        </div>
                    </div>
                    <div className="mt-4 flex gap-3 border-t border-white/[0.07] pt-3 text-xs font-medium">
                        <Link href={route('profile.edit')} className="text-slate-400 hover:text-white">Profile</Link>
                        <Link href={route('logout')} method="post" as="button" className="text-slate-400 hover:text-white">Sign out</Link>
                    </div>
                </div>
            </aside>

            <div className="lg:pl-[258px]">
                <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
                    <div className="flex h-[68px] items-center justify-between px-4 sm:px-6 lg:px-9">
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={() => setMobileNavOpen(!mobileNavOpen)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden" aria-label="Toggle navigation" aria-expanded={mobileNavOpen}>
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
                            </button>
                            <div className="lg:hidden"><Brand /></div>
                            <div className="hidden lg:block">
                                <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-slate-400">KamalSons Bakers</p>
                                <p className="mt-0.5 text-sm font-semibold text-slate-700">Retail operations</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:inline-flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Register online</span>
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white lg:hidden">{initials}</div>
                        </div>
                    </div>
                    {mobileNavOpen && <nav className="space-y-1 border-t border-slate-100 bg-slate-950 px-4 py-3 lg:hidden">{links(() => setMobileNavOpen(false))}</nav>}
                </header>

                {header && <div className="border-b border-slate-200/70 bg-white px-4 py-5 sm:px-6 lg:px-9">{header}</div>}
                <main className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 sm:py-7 lg:px-9">{children}</main>
            </div>
        </div>
    );
}
