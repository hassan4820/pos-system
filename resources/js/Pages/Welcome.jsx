import { Head, Link } from '@inertiajs/react';

function BrandMark({ className = 'h-10 w-10' }) {
    return (
        <span className={`inline-flex items-center justify-center rounded-2xl bg-emerald-500 text-emerald-950 shadow-lg shadow-emerald-950/10 ${className}`}>
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
                <path d="M5 9.5h14l-1.1 10H6.1L5 9.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M8.5 9.5a3.5 3.5 0 0 1 7 0M9 13v3m3-3v3m3-3v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
        </span>
    );
}

function CheckIcon() {
    return <svg className="h-4 w-4 shrink-0 text-emerald-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.2 7.26a1 1 0 0 1-1.42.004l-3.8-3.8a1 1 0 1 1 1.414-1.415l3.09 3.09 6.493-6.547a1 1 0 0 1 1.417-.006Z" clipRule="evenodd" /></svg>;
}

export default function Welcome({ auth }) {
    const destination = auth?.user ? route('pos.index') : route('login');

    return (
        <>
            <Head title="Kamal Sons Bakers | Point of Sale" />
            <div className="min-h-screen overflow-hidden bg-[#f8f8f4] text-slate-900">
                <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
                    <Link href={route('home')} className="flex items-center gap-3 rounded-xl" aria-label="Kamal Sons Bakers home">
                        <BrandMark />
                        <span>
                            <span className="block text-sm font-extrabold tracking-tight text-slate-950">Kamal Sons Bakers</span>
                            <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Point of sale</span>
                        </span>
                    </Link>
                    <nav className="flex items-center gap-3" aria-label="Main navigation">
                        <a href="#features" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-950 sm:inline-flex">Features</a>
                        <Link href={destination} className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">
                            {auth?.user ? 'Open POS' : 'Log in'}
                        </Link>
                    </nav>
                </header>

                <main>
                    <section className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-5 pb-16 pt-10 sm:px-8 sm:pb-24 sm:pt-14 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10 lg:px-10 lg:pb-28 lg:pt-16">
                        <div className="pointer-events-none absolute -left-48 top-0 h-[30rem] w-[30rem] rounded-full bg-emerald-100/70 blur-3xl" />
                        <div className="pointer-events-none absolute right-0 top-24 h-72 w-72 rounded-full bg-amber-100/70 blur-3xl" />

                        <div className="relative z-[1] max-w-2xl">
                            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-white/80 px-3.5 py-2 text-xs font-semibold text-emerald-800 shadow-sm shadow-emerald-900/5">
                                <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-30" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" /></span>
                                A smoother way to serve every customer
                            </div>
                            <h1 className="max-w-xl text-4xl font-extrabold leading-[1.08] tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-[4.15rem]">
                                Fresh sales.<br />
                                <span className="text-emerald-700">Simple control.</span>
                            </h1>
                            <p className="mt-6 max-w-lg text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                                Keep the counter moving with quick checkout, clear invoices, and stock figures you can trust — all in one easy bakery POS.
                            </p>

                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <Link href={destination} className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 text-sm font-bold text-emerald-950 shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5 hover:bg-emerald-400 focus-visible:outline-emerald-700">
                                    {auth?.user ? 'Go to point of sale' : 'Access your POS'}
                                    <svg className="h-4 w-4 transition group-hover:translate-x-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M3 10a1 1 0 0 1 1-1h9.586l-3.293-3.293a1 1 0 1 1 1.414-1.414l5 5a1 1 0 0 1 0 1.414l-5 5a1 1 0 0 1-1.414-1.414L13.586 11H4a1 1 0 0 1-1-1Z" clipRule="evenodd" /></svg>
                                </Link>
                                <a href="#features" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white/80 px-6 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white">Explore features</a>
                            </div>

                            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-slate-600 sm:text-sm">
                                <span className="inline-flex items-center gap-2"><CheckIcon /> Fast checkout</span>
                                <span className="inline-flex items-center gap-2"><CheckIcon /> Live stock tracking</span>
                                <span className="inline-flex items-center gap-2"><CheckIcon /> Print-ready invoices</span>
                            </div>
                        </div>

                        <div className="relative z-[1] mx-auto w-full max-w-[34rem] lg:ml-auto">
                            <div className="absolute -right-3 -top-6 h-24 w-24 rounded-[2rem] border border-amber-200/70 bg-amber-100/70 sm:-right-6 sm:-top-8 sm:h-32 sm:w-32" />
                            <div className="absolute -bottom-6 -left-4 h-24 w-24 rounded-full border border-emerald-200 bg-emerald-100/80 sm:-bottom-8 sm:-left-7 sm:h-32 sm:w-32" />
                            <div className="relative rounded-[1.75rem] border border-slate-200/80 bg-white p-3 shadow-[0_30px_90px_-35px_rgba(15,23,42,0.3)] sm:rounded-[2rem] sm:p-4">
                                <div className="overflow-hidden rounded-[1.25rem] bg-slate-50 sm:rounded-[1.5rem]">
                                    <div className="flex items-center justify-between border-b border-slate-200/80 bg-white px-4 py-3.5 sm:px-5">
                                        <div className="flex items-center gap-2.5">
                                            <BrandMark className="h-8 w-8 rounded-xl" />
                                            <div><p className="text-xs font-bold text-slate-900">Sales desk</p><p className="text-[10px] text-slate-500">Tuesday, 10:42 AM</p></div>
                                        </div>
                                        <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Register open</div>
                                    </div>
                                    <div className="grid gap-3 p-3.5 sm:grid-cols-[1.12fr_0.88fr] sm:gap-4 sm:p-5">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between"><p className="text-[11px] font-bold text-slate-800">Today at a glance</p><span className="text-[9px] font-medium text-slate-400">LIVE</span></div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="rounded-xl border border-slate-200/80 bg-white p-3"><p className="text-[9px] font-medium text-slate-500">Today’s sales</p><p className="mt-1 text-lg font-extrabold tracking-tight text-slate-900">Rs 48,650</p><p className="mt-1 text-[9px] font-semibold text-emerald-600">↑ 12.8% this week</p></div>
                                                <div className="rounded-xl border border-slate-200/80 bg-white p-3"><p className="text-[9px] font-medium text-slate-500">Orders</p><p className="mt-1 text-lg font-extrabold tracking-tight text-slate-900">126</p><p className="mt-1 text-[9px] font-medium text-slate-500">Across 8 hours</p></div>
                                            </div>
                                            <div className="rounded-xl border border-slate-200/80 bg-white p-3.5">
                                                <div className="mb-3 flex items-center justify-between"><p className="text-[10px] font-bold text-slate-800">Sales activity</p><span className="rounded-md bg-slate-100 px-1.5 py-1 text-[8px] font-semibold text-slate-500">Today</span></div>
                                                <div className="flex h-24 items-end gap-2 px-1">
                                                    {[32, 48, 39, 65, 52, 78, 60, 92, 72, 100, 81, 94].map((height, index) => <span key={index} className={`flex-1 rounded-t-sm ${index === 9 ? 'bg-emerald-500' : 'bg-emerald-100'}`} style={{ height: `${height}%` }} />)}
                                                </div>
                                                <div className="mt-2 flex justify-between px-1 text-[8px] font-medium text-slate-400"><span>9 AM</span><span>12 PM</span><span>3 PM</span><span>6 PM</span></div>
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-slate-200/80 bg-white p-3.5">
                                            <div className="flex items-start justify-between"><div><p className="text-[10px] font-bold text-slate-800">Current sale</p><p className="mt-0.5 text-[9px] text-slate-400">Receipt #KS-01042</p></div><span className="rounded-md bg-amber-50 px-1.5 py-1 text-[8px] font-bold text-amber-700">DINE IN</span></div>
                                            <div className="mt-4 space-y-3">
                                                {[
                                                    ['Sourdough loaf', '2 × Rs 420', '840'],
                                                    ['Butter croissant', '3 × Rs 180', '540'],
                                                    ['Chocolate cake slice', '1 × Rs 350', '350'],
                                                ].map(([name, detail, amount]) => (
                                                    <div key={name} className="flex items-start justify-between gap-2"><div><p className="text-[9px] font-semibold text-slate-700">{name}</p><p className="mt-0.5 text-[8px] text-slate-400">{detail}</p></div><span className="text-[9px] font-bold text-slate-700">{amount}</span></div>
                                                ))}
                                            </div>
                                            <div className="my-3 border-t border-dashed border-slate-200" />
                                            <div className="space-y-1.5 text-[9px]"><div className="flex justify-between text-slate-500"><span>Subtotal</span><span>Rs 1,730</span></div><div className="flex justify-between text-slate-500"><span>Discount</span><span>− Rs 30</span></div></div>
                                            <div className="mt-2.5 flex items-end justify-between"><span className="text-[10px] font-semibold text-slate-700">Total due</span><span className="text-lg font-extrabold tracking-tight text-slate-950">Rs 1,700</span></div>
                                            <div className="mt-3 rounded-lg bg-emerald-500 py-2 text-center text-[9px] font-bold text-emerald-950">Complete sale</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-slate-200/80 bg-white px-4 py-2.5 sm:px-5"><p className="text-[9px] font-medium text-slate-500">Inventory synced <span className="font-semibold text-slate-700">just now</span></p><p className="text-[9px] font-medium text-slate-500">3 items in cart</p></div>
                                </div>
                            </div>
                            <div className="absolute -left-3 top-1/2 hidden -translate-x-1/2 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-xl shadow-slate-900/10 sm:block">
                                <div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><CheckIcon /></span><div><p className="text-[10px] font-bold text-slate-800">Sale complete</p><p className="text-[9px] text-slate-500">Stock updated instantly</p></div></div>
                            </div>
                        </div>
                    </section>

                    <section id="features" className="border-y border-slate-200/80 bg-white/75 py-14 sm:py-16">
                        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
                            <div className="mx-auto max-w-2xl text-center">
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Made for your counter</p>
                                <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">The essentials for a better day at the bakery</h2>
                                <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">Less time managing paperwork. More time serving customers and making the next batch.</p>
                            </div>
                            <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:mt-11 lg:grid-cols-4">
                                {[
                                    { icon: '⌁', title: 'Quick checkout', description: 'Find products by name or scan a barcode, then finish sales in a few taps.' },
                                    { icon: '▦', title: 'Stock awareness', description: 'Keep quantities and pack sizes in sync as products are sold or restocked.' },
                                    { icon: '▤', title: 'Clear invoices', description: 'Give customers a clean, English receipt with the sale details they need.' },
                                    { icon: '↗', title: 'Useful reports', description: 'See sales, purchases, and estimated profit in one easy-to-read place.' },
                                ].map((feature) => (
                                    <article key={feature.title} className="rounded-2xl border border-slate-200/80 bg-[#fcfcfa] p-5 transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-950/5">
                                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-lg font-bold text-emerald-800" aria-hidden="true">{feature.icon}</span>
                                        <h3 className="mt-4 text-sm font-bold text-slate-900">{feature.title}</h3>
                                        <p className="mt-2 text-xs leading-5 text-slate-600">{feature.description}</p>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-6 px-5 py-12 sm:flex-row sm:items-center sm:px-8 sm:py-14 lg:px-10">
                        <div><h2 className="text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">Ready for the next order?</h2><p className="mt-2 text-sm text-slate-600">Open your sales desk and keep the counter moving.</p></div>
                        <Link href={destination} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-700">{auth?.user ? 'Open point of sale' : 'Log in to continue'}</Link>
                    </section>
                </main>

                <footer className="border-t border-slate-200/80 bg-white/70">
                    <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-5 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
                        <div className="flex items-center gap-2"><BrandMark className="h-7 w-7 rounded-lg" /><span className="font-semibold text-slate-700">Kamal Sons Bakers</span><span className="text-slate-300">·</span><span>Point of sale</span></div>
                        <p>Simple tools for a busy counter.</p>
                    </div>
                </footer>
            </div>
        </>
    );
}
