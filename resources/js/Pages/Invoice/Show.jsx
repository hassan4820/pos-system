import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useRef, useState } from 'react';

const formatAmount = (amount) => new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
}).format(Number(amount) || 0);

const formatQty = (quantity) => Number.parseFloat(Number(quantity).toFixed(3));

export default function Show({ order }) {
    const receiptRef = useRef(null);
    const [printPageHeight, setPrintPageHeight] = useState(null);
    const soldAt = new Date(order.created_at);
    const dateText = new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium' }).format(soldAt);
    const timeText = new Intl.DateTimeFormat('en-PK', { timeStyle: 'short' }).format(soldAt);

    const printStyles = `
        @media print {
            @page { size: 80mm ${printPageHeight ? `${printPageHeight}mm` : 'auto'}; margin: 0; }
            body * { visibility: hidden !important; }
            .receipt-print-area, .receipt-print-area * {
                visibility: visible !important;
                color: #000 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            .receipt-print-area {
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 80mm !important;
                max-width: 80mm !important;
                max-height: none !important;
                margin: 0 !important;
                padding: 4mm !important;
                overflow: visible !important;
                border: 0 !important;
                border-radius: 0 !important;
                box-shadow: none !important;
                font-family: Arial, sans-serif !important;
                font-size: 10px !important;
                line-height: 1.35 !important;
                break-inside: avoid !important;
                page-break-inside: avoid !important;
            }
            .no-print { display: none !important; }
            .receipt-table th { border-bottom: 1px solid #000 !important; }
            .receipt-table td { border-bottom: 1px dotted #777 !important; }
            .receipt-table tr { break-inside: avoid !important; page-break-inside: avoid !important; }
        }
    `;

    const printReceipt = () => {
        const receipt = receiptRef.current;
        if (!receipt) {
            window.print();
            return;
        }

        const originalStyle = receipt.getAttribute('style');
        Object.assign(receipt.style, {
            width: '80mm',
            maxWidth: '80mm',
            maxHeight: 'none',
            overflow: 'visible',
            padding: '4mm',
            fontFamily: 'Arial, sans-serif',
            fontSize: '10px',
            lineHeight: '1.35',
        });

        // Measure the whole receipt at its printed width so the roll uses one page
        // whose length fits all the lines, terms, and footer.
        const heightMm = Math.ceil((receipt.getBoundingClientRect().height * 25.4) / 96) + 4;
        if (originalStyle === null) receipt.removeAttribute('style');
        else receipt.setAttribute('style', originalStyle);

        setPrintPageHeight(heightMm);
        window.setTimeout(() => window.print(), 50);
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Receipt #${order.id}`} />
            <style>{printStyles}</style>
            <div className="mx-auto max-w-3xl">
                <div className="no-print mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Sale completed</p>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Receipt #{order.id}</h1>
                        <p className="mt-1 text-sm text-slate-500">Review the receipt below or print a copy.</p>
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => router.visit(route('pos.index'))} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">Back to register</button>
                        <button type="button" onClick={printReceipt} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5h-2" /><path d="M6 14h12v7H6z" /></svg>Print receipt</button>
                    </div>
                </div>

                <article ref={receiptRef} className="receipt-print-area mx-auto max-h-[calc(100vh-13rem)] w-full max-w-[380px] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm sm:p-8">
                    <header className="border-b border-dashed border-slate-300 pb-4 text-center">
                        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-amber-700 print:hidden"><svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 10h16v10H4zM3 10l2-6h14l2 6M8 14h8M8 17h5" /><path d="M7 4c0 2 2 2 2 4m4-4c0 2 2 2 2 4" /></svg></div>
                        <h2 className="mt-3 text-xl font-extrabold uppercase tracking-[0.08em]">Kamal Sons Bakers</h2>
                        <p className="mt-1 text-[11px] font-medium text-slate-600">Freshly baked, made with care</p>
                        <p className="mt-2 text-[10px] leading-4 text-slate-500">Sample address: Shop 12, Market Road<br />Lahore, Pakistan</p>
                        <p className="mt-1 text-[10px] text-slate-500">Phone: 0300-0000000</p>
                    </header>

                    <section className="space-y-1.5 border-b border-dashed border-slate-300 py-3 text-[11px]">
                        <div className="flex justify-between gap-3"><span className="text-slate-500">Receipt</span><span className="font-bold">#{order.id}</span></div>
                        <div className="flex justify-between gap-3"><span className="text-slate-500">Date</span><time dateTime={order.created_at} className="text-right font-medium">{dateText} · {timeText}</time></div>
                        <div className="flex justify-between gap-3"><span className="text-slate-500">Transaction</span><span className="font-medium">Sale</span></div>
                        <div className="flex justify-between gap-3"><span className="text-slate-500">Served by</span><span className="font-medium">{order.cashier_name || 'Store team'}</span></div>
                    </section>

                    <div className="py-3">
                        <table className="receipt-table w-full table-fixed text-left text-[10px]">
                            <thead>
                                <tr className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                                    <th className="w-[40%] py-2 pr-1">Product</th>
                                    <th className="w-[20%] px-1 py-2 text-right">Price</th>
                                    <th className="w-[14%] px-1 py-2 text-right">Qty</th>
                                    <th className="w-[26%] py-2 pl-1 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="break-words py-2 pr-1 align-top font-medium">{item.product?.name || 'Product'}</td>
                                        <td className="px-1 py-2 text-right align-top">{formatAmount(item.price)}</td>
                                        <td className="px-1 py-2 text-right align-top">{formatQty(item.quantity)}</td>
                                        <td className="py-2 pl-1 text-right align-top font-semibold">{formatAmount(item.subtotal)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <section className="space-y-2 border-t border-slate-300 pt-3 text-xs">
                        <div className="flex justify-between gap-3"><span className="text-slate-600">Gross total</span><span className="font-medium">Rs {formatAmount(order.total_amount)}</span></div>
                        {Number(order.discount) > 0 && <div className="flex justify-between gap-3"><span className="text-slate-600">Discount</span><span className="font-medium">− Rs {formatAmount(order.discount)}</span></div>}
                        <div className="flex items-baseline justify-between gap-3 border-t border-dashed border-slate-300 pt-3"><span className="font-bold uppercase tracking-wide">Total due</span><span className="text-lg font-extrabold">Rs {formatAmount(order.net_amount)}</span></div>
                    </section>

                    <footer className="mt-4 border-t border-dashed border-slate-300 pt-3 text-center">
                        <p className="text-xs font-bold">Thank you for choosing Kamal Sons Bakers!</p>
                        <div className="mt-3 text-[9px] leading-[1.55] text-slate-500">
                            <p className="font-bold uppercase tracking-wide text-slate-700">Terms &amp; conditions</p>
                            <p className="mt-1">Please check your items and bill before leaving.</p>
                            <p>No returns or exchanges on fresh food items.</p>
                            <p>For best quality, store products as directed.</p>
                        </div>
                        <div className="mt-3 border-t border-dashed border-slate-300 pt-2 text-[9px] leading-[1.5] text-slate-500">
                            <p>POS system developed by</p>
                            <p className="font-bold tracking-wide text-slate-800">Ali Hassan Software Solutions</p>
                            <p>Contact: 0309 7646528</p>
                        </div>
                    </footer>
                </article>
            </div>
        </AuthenticatedLayout>
    );
}
