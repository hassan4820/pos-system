import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';

const money = value => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(Number(value || 0));
const timestamp = value => new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium', timeStyle: 'medium' }).format(new Date(value));

export default function Index({ orders }) {
    const rows = orders?.data || [];
    const returnSale = order => {
        if (window.confirm(`Return sale #${order.id}? This restores its stock and records a ${money(order.net_amount)} refund.`)) {
            router.post(route('history.return', order.id));
        }
    };
    return <AuthenticatedLayout header={<h2 className="text-xl font-semibold">History</h2>}>
        <Head title="History" />
        <div className="space-y-4">
            <div><h1 className="text-2xl font-bold text-slate-900">Transaction history</h1><p className="mt-1 text-sm text-slate-500">Timestamped sales, returns, and purchase activity.</p></div>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Timestamp</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Items</th><th className="px-4 py-3">Staff</th><th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3 text-right">Action</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">{rows.map(order => <tr key={order.id} className="align-top"><td className="whitespace-nowrap px-4 py-3 text-slate-600">{timestamp(order.created_at)}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${order.type === 'sale' ? 'bg-emerald-50 text-emerald-700' : order.type === 'return' ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'}`}>{order.type}{order.return_of_order_id ? ` #${order.return_of_order_id}` : ''}</span>{order.returned_at && <div className="mt-1 text-xs text-rose-600">Returned {timestamp(order.returned_at)}</div>}</td><td className="px-4 py-3"><div className="space-y-1">{order.items.map(item => <div key={item.id}>{item.product?.name || 'Product'} × {item.quantity}</div>)}</div></td><td className="px-4 py-3">{order.cashier_name || '—'}</td><td className="whitespace-nowrap px-4 py-3 text-right font-semibold">{order.type === 'return' ? '−' : ''}{money(order.net_amount)}</td><td className="whitespace-nowrap px-4 py-3 text-right">{order.type === 'sale' && <div className="flex justify-end gap-2"><Link href={route('invoice.show', order.id)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50">Invoice</Link>{!order.returned_at && <button onClick={() => returnSale(order)} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700">Return</button>}</div>}</td></tr>)}{rows.length === 0 && <tr><td colSpan="6" className="px-4 py-10 text-center text-slate-500">No history found.</td></tr>}</tbody>
                </table>
            </div>
            {orders?.last_page > 1 && <div className="flex items-center justify-between text-sm"><span className="text-slate-500">Page {orders.current_page} of {orders.last_page}</span><div className="flex gap-2">{orders.prev_page_url && <Link href={orders.prev_page_url} className="rounded border px-3 py-1">Previous</Link>}{orders.next_page_url && <Link href={orders.next_page_url} className="rounded border px-3 py-1">Next</Link>}</div></div>}
        </div>
    </AuthenticatedLayout>;
}
