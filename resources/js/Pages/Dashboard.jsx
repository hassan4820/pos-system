import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';

const shortcuts = [
    { title: 'Start a sale', detail: 'Open the register and create a customer bill.', route: 'pos.index', label: 'Open point of sale', icon: '↗', tone: 'bg-emerald-50 text-emerald-700' },
    { title: 'Review reports', detail: 'See sales, purchases, and profit summaries.', route: 'reports.index', label: 'View reports', icon: '▥', tone: 'bg-sky-50 text-sky-700' },
];

export default function Dashboard() {
    const user = usePage().props.auth.user;
    const actions = user.is_admin
        ? [
            ...shortcuts,
            { title: 'Manage products', detail: 'Add items and keep product details up to date.', route: 'products.index', label: 'Manage products', icon: '◇', tone: 'bg-violet-50 text-violet-700' },
            { title: 'Record a purchase', detail: 'Restock inventory and update product costs.', route: 'purchase.index', label: 'Add purchase', icon: '＋', tone: 'bg-amber-50 text-amber-700' },
        ]
        : shortcuts;

    return (
        <AuthenticatedLayout>
            <Head title="Overview" />
            <div className="space-y-7">
                <section className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-8 text-white shadow-sm sm:px-9 sm:py-10">
                    <div className="absolute -right-16 -top-28 h-72 w-72 rounded-full border-[36px] border-emerald-400/10" />
                    <div className="absolute -bottom-32 right-40 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />
                    <div className="relative max-w-2xl">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Store workspace</span>
                        <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">Welcome back, {user.name.split(' ')[0]}.</h1>
                        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">Your store tools are ready. Choose where you’d like to pick up today.</p>
                        <Link href={route('pos.index')} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-300">Open point of sale <span aria-hidden="true">→</span></Link>
                    </div>
                </section>

                <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-end">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Quick access</h2>
                        <p className="mt-1 text-sm text-slate-500">Common tasks for your {user.is_admin ? 'store' : 'shift'}.</p>
                    </div>
                </div>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {actions.map((action) => (
                        <Link key={action.route} href={route(action.route)} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
                            <span className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl font-semibold ${action.tone}`}>{action.icon}</span>
                            <h3 className="mt-4 font-bold text-slate-900">{action.title}</h3>
                            <p className="mt-1.5 min-h-10 text-sm leading-5 text-slate-500">{action.detail}</p>
                            <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 group-hover:text-emerald-700">{action.label}<span aria-hidden="true">→</span></span>
                        </Link>
                    ))}
                </section>
            </div>
        </AuthenticatedLayout>
    );
}
