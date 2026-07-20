import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';

export default function Show({ order }) {
    const formatCurrency = (amount) =>
        new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
        }).format(amount);

    const printStyles = `
        @media print {
            body * {
                visibility: hidden;
            }
            .print-area, .print-area * {
                visibility: visible;
            }
            .print-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                max-width: 100%;
                margin: 0;
                padding: 0;
                box-shadow: none !important;
                border: none !important;
                background: white !important;
            }
            .no-print {
                display: none !important;
            }
            @page {
                size: 80mm auto;
                margin: 2mm;
            }
        }
    `;

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Invoice</h2>}>
            <Head title="Invoice" />
            <style>{printStyles}</style>
            <div className="py-12 print:py-0">
                <div className="print-area mx-auto max-w-3xl rounded-lg bg-white p-8 shadow-sm print:max-w-none print:rounded-none print:shadow-none print:p-2">
                    <div className="mb-4 border-b pb-3 print:border-b-0 print:pb-1">
                        <div className="text-center">
                            <h1 className="text-xl font-bold">Sultan General Store</h1>
                            <p className="text-sm text-gray-600">Wholesale Dealers</p>
                            <p className="mt-1 text-sm text-gray-600">Invoice #{order.id}</p>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                            <span>Date: {new Date(order.created_at).toLocaleString()}</span>
                            <span>Cash Memo</span>
                        </div>
                        <div className="mt-1 text-sm text-gray-600">
                            <span>Cashier: {order.cashier_name || 'System'}</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        {order.items.map((item) => (
                            <div key={item.id} className="flex justify-between border-b py-1 print:border-b print:py-1">
                                <div>
                                    <p className="font-semibold">{item.product?.name}</p>
                                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                    <p className="text-sm text-gray-500">Unit: {item.unit || item.product?.unit || item.product?.default_unit || '—'}</p>
                                </div>
                                <div className="text-right">
                                    <p>{formatCurrency(item.price)}</p>
                                    <p className="text-sm text-gray-500">Subtotal</p>
                                    <p className="font-semibold">{formatCurrency(item.subtotal)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 space-y-1 text-right">
                        <p>Subtotal: {formatCurrency(order.total_amount)}</p>
                        <p>Discount: {formatCurrency(order.discount)}</p>
                        <p className="text-lg font-semibold">Net: {formatCurrency(order.net_amount)}</p>
                    </div>
                    <div className="no-print mt-8 border-t pt-4 text-center text-sm text-gray-500">
                        <div className="mb-4 flex justify-center gap-3">
                            <button
                                onClick={() => window.print()}
                                className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                            >
                                Print Receipt
                            </button>
                            <button
                                onClick={() => router.visit('/pos')}
                                className="rounded bg-gray-700 px-4 py-2 text-white hover:bg-gray-800"
                            >
                                Back to POS
                            </button>
                        </div>
                        <p>Thank you for shopping with us.</p>
                        <p>Powered by POS System</p>
                    </div>
                    <div className="hidden print:block text-center text-sm text-gray-500">
                        <p>Thank you for shopping with us.</p>
                        <p>Powered by POS System</p>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
