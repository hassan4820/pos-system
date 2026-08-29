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
                direction: rtl;
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
                <div dir="rtl" className="print-area mx-auto max-w-2xl rounded-lg bg-white p-8 text-right shadow-sm print:max-w-none print:rounded-none print:shadow-none">
                    <div className="w-full">
                        <table className="w-full text-right text-xs font-semibold text-gray-800 print:text-black">
                            <thead>
                                <tr className="border-b-2 border-gray-400 print:border-black">
                                    <th className="py-1 pl-1 w-[40%]">آئٹم</th>
                                    <th className="py-1 text-center w-[20%]">یونٹ قیمت</th>
                                    <th className="py-1 text-center w-[18%]">مقدار</th>
                                    <th className="py-1 text-left w-[22%]">کل</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.items.map((item) => (
                                    <tr key={item.id} className="border-b border-gray-200 print:border-dashed">
                                        <td className="py-2 pl-1 align-top">{item.product?.name}</td>
                                        <td className="py-2 text-center align-top">{formatCurrency(item.price)}</td>
                                        <td className="py-2 text-center align-top">{formatQty(item.quantity)}</td>
                                        <td className="py-2 text-left align-top" dir="ltr">{formatCurrency(item.subtotal)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

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
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
