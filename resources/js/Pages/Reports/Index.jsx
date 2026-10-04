import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { wholeStepBase } from '@/utils/numberStep';

export default function Index({
    totalProfit,
    totalSales,
    totalPurchases,
    saleCount,
    productProfit,
    monthlySales,
    weeklyProfit,
    dailyProfit,
    cashSummary = { cashIn: 0, cashOut: 0, net: 0 },
    cashTransactions = [],
}) {
    const cashForm = useForm({ direction: 'in', amount: '', comment: '' });
    const saveCashEntry = (event) => { event.preventDefault(); cashForm.post(route('reports.cash.store'), { onSuccess: () => cashForm.reset('amount', 'comment') }); };
    const formatCurrency = (amount) =>
        new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
        }).format(amount);

    const safeProductProfit = Array.isArray(productProfit) ? productProfit : [];
    const safeMonthlySales = Array.isArray(monthlySales) ? monthlySales : [];
    const safeWeeklyProfit = Array.isArray(weeklyProfit) ? weeklyProfit : [];
    const safeDailyProfit = Array.isArray(dailyProfit) ? dailyProfit : [];
    const maxProductProfitMagnitude = Math.max(...safeProductProfit.map((item) => Math.abs(Number(item.profit) || 0)), 1);

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Reports & Profit</h2>}>
            <Head title="Reports" />
            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-4 md:grid-cols-4">
                        <div className="rounded-lg bg-white p-4 shadow-sm">
                            <p className="text-sm text-gray-500">Total Sales</p>
                            <p className="text-2xl font-semibold">{formatCurrency(totalSales)}</p>
                        </div>
                        <div className="rounded-lg bg-white p-4 shadow-sm">
                            <p className="text-sm text-gray-500">Total Purchases</p>
                            <p className="text-2xl font-semibold">{formatCurrency(totalPurchases)}</p>
                        </div>
                        <div className="rounded-lg bg-white p-4 shadow-sm">
                            <p className="text-sm text-gray-500">Profit</p>
                            <p className="text-2xl font-semibold">{formatCurrency(totalProfit)}</p>
                        </div>
                        <div className="rounded-lg bg-white p-4 shadow-sm">
                            <p className="text-sm text-gray-500">Sales Count</p>
                            <p className="text-2xl font-semibold">{saleCount}</p>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        {[["Today's cash in", cashSummary.cashIn, 'text-emerald-700'], ["Today's cash out", cashSummary.cashOut, 'text-rose-700'], ["Net cash movement", cashSummary.net, Number(cashSummary.net) >= 0 ? 'text-emerald-700' : 'text-rose-700']].map(([label, amount, color]) => <div key={label} className="rounded-lg bg-white p-4 shadow-sm"><p className="text-sm text-gray-500">{label}</p><p className={`text-2xl font-semibold ${color}`}>{formatCurrency(amount)}</p></div>)}
                    </div>

                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
                        <form onSubmit={saveCashEntry} className="space-y-3 rounded-lg bg-white p-6 shadow-sm">
                            <h3 className="text-lg font-semibold">Record cash movement</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <label className="text-sm text-gray-600">Type<select value={cashForm.data.direction} onChange={e => cashForm.setData('direction', e.target.value)} className="mt-1 w-full rounded-md border-gray-300"><option value="in">Cash in</option><option value="out">Cash out</option></select></label>
                                <label className="text-sm text-gray-600">Amount<input required min={wholeStepBase(cashForm.data.amount, 2)} step="1" type="number" value={cashForm.data.amount} onChange={e => cashForm.setData('amount', e.target.value)} className="mt-1 w-full rounded-md border-gray-300" /></label>
                            </div>
                            <label className="block text-sm text-gray-600">Comment (required)<input required maxLength="255" value={cashForm.data.comment} onChange={e => cashForm.setData('comment', e.target.value)} className="mt-1 w-full rounded-md border-gray-300" /></label>
                            {cashForm.errors.comment && <p className="text-sm text-rose-600">{cashForm.errors.comment}</p>}
                            <button disabled={cashForm.processing} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Save cash entry</button>
                        </form>
                        <div className="overflow-hidden rounded-lg bg-white p-6 shadow-sm"><h3 className="mb-3 text-lg font-semibold">Recent cash movements</h3><div className="max-h-64 space-y-2 overflow-y-auto">{cashTransactions.map(row => <div key={row.id} className="flex items-center justify-between gap-3 border-b pb-2 text-sm"><div><span className="font-medium">{row.comment}</span><span className="ml-2 text-xs text-gray-400">{row.user?.name || 'System'} · {new Date(row.created_at).toLocaleString()}</span></div><span className={row.direction === 'in' ? 'font-semibold text-emerald-700' : 'font-semibold text-rose-700'}>{row.direction === 'in' ? '+' : '−'}{formatCurrency(row.amount)}</span></div>)}{cashTransactions.length === 0 && <p className="text-sm text-gray-500">No cash movements yet.</p>}</div></div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="rounded-lg bg-white p-6 shadow-sm">
                            <h3 className="mb-4 text-lg font-semibold">Product Profit</h3>
                            <div className="space-y-3">
                                {safeProductProfit.map((item) => (
                                    <div key={item.product_id}>
                                        <div className="mb-1 flex justify-between text-sm">
                                            <span>{item.name}</span>
                                            <span className="font-semibold">{formatCurrency(item.profit)}</span>
                                        </div>
                                        <div className="h-2 rounded bg-gray-200">
                                            <div
                                                className={`h-2 rounded ${item.profit < 0 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                                style={{ width: `${Math.min(100, (Math.abs(Number(item.profit) || 0) / maxProductProfitMagnitude) * 100)}%` }}
                                            />
                                        </div>
                                        <div className="mt-1 text-xs text-gray-500">
                                            Qty {item.quantity} • Sales {formatCurrency(item.sales)} • Cost {formatCurrency(item.cost)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-lg bg-white p-6 shadow-sm">
                            <h3 className="mb-4 text-lg font-semibold">Monthly Sales</h3>
                            <div className="space-y-3">
                                {safeMonthlySales.map((entry) => (
                                    <div key={entry.month} className="rounded border border-gray-200 p-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium">{entry.month}</span>
                                            <span className="font-semibold text-green-700">{formatCurrency(entry.amount)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="rounded-lg bg-white p-6 shadow-sm">
                            <h3 className="mb-4 text-lg font-semibold">Weekly Profit</h3>
                            <div className="space-y-2">
                                {safeWeeklyProfit.map((entry) => (
                                    <div key={entry.day}>
                                        <div className="mb-1 flex justify-between text-sm">
                                            <span>{entry.day}</span>
                                            <span>{formatCurrency(entry.amount)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-lg bg-white p-6 shadow-sm">
                            <h3 className="mb-4 text-lg font-semibold">Daily Profit</h3>
                            <div className="space-y-2">
                                {safeDailyProfit.map((entry) => (
                                    <div key={entry.hour}>
                                        <div className="mb-1 flex justify-between text-sm">
                                            <span>{entry.hour}</span>
                                            <span>{formatCurrency(entry.amount)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
