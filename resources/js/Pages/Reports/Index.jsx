import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Index({
    sales,
    purchases,
    totalProfit,
    totalSales,
    totalPurchases,
    saleCount,
    productProfit,
    monthlyProfit,
    weeklyProfit,
    dailyProfit,
}) {
    const formatCurrency = (amount) =>
        new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
        }).format(amount);

    const safeProductProfit = Array.isArray(productProfit) ? productProfit : [];
    const safeMonthlyProfit = Array.isArray(monthlyProfit) ? monthlyProfit : [];
    const safeWeeklyProfit = Array.isArray(weeklyProfit) ? weeklyProfit : [];
    const safeDailyProfit = Array.isArray(dailyProfit) ? dailyProfit : [];
    const maxBarHeight = Math.max(...[...safeMonthlyProfit, ...safeWeeklyProfit, ...safeDailyProfit].map((entry) => entry.amount || 0), 1);

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

                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="rounded-lg bg-white p-6 shadow-sm">
                            <h3 className="mb-4 text-lg font-semibold">Product Profit</h3>
                            <div className="space-y-3">
                                {safeProductProfit.map((item) => (
                                    <div key={item.name}>
                                        <div className="mb-1 flex justify-between text-sm">
                                            <span>{item.name}</span>
                                            <span className="font-semibold">{formatCurrency(item.profit)}</span>
                                        </div>
                                        <div className="h-2 rounded bg-gray-200">
                                            <div
                                                className="h-2 rounded bg-green-600"
                                                style={{ width: `${Math.min(100, (item.profit / Math.max(...safeProductProfit.map((p) => p.profit), 1)) * 100)}%` }}
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
                            <h3 className="mb-4 text-lg font-semibold">Monthly Profit</h3>
                            <div className="space-y-3">
                                {safeMonthlyProfit.map((entry) => (
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

                    <div className="rounded-lg bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-lg font-semibold">Recent Sales</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-2 text-left">Date</th>
                                        <th className="px-4 py-2 text-left">Products</th>
                                        <th className="px-4 py-2 text-left">Items</th>
                                        <th className="px-4 py-2 text-left">Net Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sales.map((sale) => (
                                        <tr key={sale.id}>
                                            <td className="px-4 py-2">{new Date(sale.created_at).toLocaleDateString()}</td>
                                            <td className="px-4 py-2">
                                                <div className="space-y-1">
                                                    {sale.items.map((item) => (
                                                        <div key={item.id} className="text-sm">
                                                            {item.product?.name || 'Unknown'} ({item.quantity || 0})
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-4 py-2">{sale.items.length}</td>
                                            <td className="px-4 py-2">{formatCurrency(sale.net_amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
