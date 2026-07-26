import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';

export default function Show({ order }) {
    const formatCurrency = (amount) =>
        new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(amount);

    // Helper to format fractional quantities cleanly
    const formatQty = (qty) => Number(parseFloat(qty).toFixed(3));

    const getUnitLabel = (item) =>
        item.unit?.unit_name || item.product?.unit || item.product?.custom_unit || '—';

    const printStyles = `
        @media print {
            body * {
                visibility: hidden;
            }
            .print-area, .print-area * {
                visibility: visible;
                /* Force pure solid black everywhere — thermal/receipt printers often
                   drop mid-gray tones entirely, which is why text was vanishing. */
                color: #000000 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            .print-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                padding: 4mm !important;
                margin: 0;
                box-sizing: border-box;
                box-shadow: none !important;
                border: none !important;
                background: white !important;
                font-family: 'Courier New', Courier, monospace;
                font-size: 12px !important;
                font-weight: 700 !important;
                line-height: 1.4 !important;
            }
            .no-print {
                display: none !important;
            }
            @page {
                size: 80mm auto;
                margin: 0;
            }
            table th {
                border-bottom: 1.5px solid #000000 !important;
                font-weight: 800 !important;
            }
            table td {
                border-bottom: 1px dashed #000000 !important;
            }
        }
    `;

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Invoice</h2>}>
            <Head title="Invoice" />
            <style>{printStyles}</style>
            <div className="py-12 print:py-0">
                <div className="print-area mx-auto max-w-2xl rounded-lg bg-white p-8 shadow-sm print:max-w-none print:rounded-none print:shadow-none">

                    {/* Header */}
                    <div className="mb-4 border-b border-gray-300 pb-3 print:border-black print:pb-2">
                        <div className="text-center">
                            <h1 className="text-xl font-bold uppercase tracking-wider print:text-lg">Sultan General Store</h1>
                            <p className="text-xs font-semibold text-gray-700 print:text-black">Wholesale Dealers</p>
                            <p className="mt-1 text-xs font-bold text-gray-800 print:text-black">Invoice #{order.id}</p>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs font-semibold text-gray-700 print:text-black">
                            <span>Date: {new Date(order.created_at).toLocaleString()}</span>
                            <span>Cash Memo</span>
                        </div>
                        <div className="mt-1 text-xs font-semibold text-gray-700 print:text-black">
                            <span>Cashier: {order.cashier_name || 'System'}</span>
                        </div>
                    </div>

                    {/* Table / Columns */}
                    <div className="w-full">
                        <table className="w-full text-left text-xs font-semibold text-gray-800 print:text-black">
                            <thead>
                                <tr className="border-b-2 border-gray-400 print:border-black">
                                    <th className="py-1 pr-1 w-[34%]">Item</th>
                                    <th className="py-1 text-center w-[16%]">Unit</th>
                                    <th className="py-1 text-center w-[16%]">Qty</th>
                                    <th className="py-1 text-right w-[17%]">Price</th>
                                    <th className="py-1 text-right w-[17%]">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.items.map((item) => (
                                    <tr key={item.id} className="border-b border-gray-200 print:border-dashed">
                                        <td className="py-2 pr-1 align-top">{item.product?.name}</td>
                                        <td className="py-2 text-center align-top">{getUnitLabel(item)}</td>
                                        <td className="py-2 text-center align-top">{formatQty(item.quantity)}</td>
                                        <td className="py-2 text-right align-top">{formatCurrency(item.price)}</td>
                                        <td className="py-2 text-right align-top">{formatCurrency(item.subtotal)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="mt-3 w-full border-t-2 border-gray-400 pt-2 text-right text-xs font-bold print:border-black">
                        <div className="flex justify-end gap-4 mb-1">
                            <span>Subtotal:</span>
                            <span className="w-20">{formatCurrency(order.total_amount)}</span>
                        </div>
                        {order.discount > 0 && (
                            <div className="flex justify-end gap-4 mb-1">
                                <span>Discount:</span>
                                <span className="w-20">-{formatCurrency(order.discount)}</span>
                            </div>
                        )}
                        <div className="flex justify-end gap-4 mt-2 text-sm font-extrabold uppercase print:text-xs">
                            <span>Net Total:</span>
                            <span className="w-20">{formatCurrency(order.net_amount)}</span>
                        </div>
                    </div>

                    {/* Print Action Buttons (Screen Only) */}
                    <div className="no-print mt-8 border-t pt-4 text-center text-xs font-semibold text-gray-500">
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
                        <p className="mt-1 font-bold text-gray-800">For POS-System contact on 03097646528</p>
                    </div>

                    {/* Printed Footer (Print Only) */}
                    <div className="hidden print:block mt-4 border-t border-black pt-2 text-center text-[10px] font-bold">
                        <p>Thank you for shopping with us.</p>
                        <p className="mt-1">For POS-System contact on 03097646528</p>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}