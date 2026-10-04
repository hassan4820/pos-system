<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use App\Models\OrderItem;
use App\Models\CashTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function index()
    {
        $now = Carbon::now();
        $monthStart = $now->copy()->startOfMonth();
        $weekStart = $now->copy()->startOfWeek();
        $dayStart = $now->copy()->startOfDay();

        $notReturned = Order::query()->select('return_of_order_id')->whereNotNull('return_of_order_id');
        $periodSales = Order::where('type', 'sale')->whereNotIn('id', $notReturned)
            ->where('created_at', '>=', $monthStart)
            ->with(['items.product', 'items.unit'])
            ->latest()
            ->get();

        $purchases = Order::where('type', 'purchase')
            ->where('created_at', '>=', $monthStart)
            ->with('items.product')
            ->latest()
            ->get();

        $report = $this->summarizeSales($periodSales);

        $monthlyOrders = Order::where('type', 'sale')->whereNotIn('id', $notReturned)
            ->whereBetween('created_at', [$now->copy()->subMonths(5)->startOfMonth(), $now->copy()->endOfMonth()])
            ->get(['created_at', 'net_amount']);
        $monthlySales = $monthlyOrders
            ->groupBy(fn (Order $order) => $order->created_at->format('Y-m'))
            ->map(fn ($orders) => $this->centsToAmount($orders->sum(fn (Order $order) => $this->toCents($order->net_amount))))
            ->map(fn ($amount, $month) => ['month' => $month, 'amount' => $amount])
            ->values();

        $weeklyOrders = Order::where('type', 'sale')->whereNotIn('id', $notReturned)
            ->whereBetween('created_at', [$weekStart, $now])
            ->with(['items.product', 'items.unit'])
            ->get();
        $weeklyProfit = $this->profitByPeriod($weeklyOrders, fn (Order $order) => $order->created_at->format('Y-m-d'));

        $dailyOrders = Order::where('type', 'sale')->whereNotIn('id', $notReturned)
            ->whereBetween('created_at', [$dayStart, $now])
            ->with(['items.product', 'items.unit'])
            ->get();
        $dailyProfit = $this->profitByPeriod($dailyOrders, fn (Order $order) => $order->created_at->format('H:00'));

        $totalPurchasesCents = $purchases->sum(fn (Order $order) => $this->toCents($order->net_amount));
        $todayCash = CashTransaction::whereDate('created_at', $now->toDateString())->get();

        return Inertia::render('Reports/Index', [
            'purchases' => $purchases,
            'cashSummary' => [
                'cashIn' => $this->centsToAmount($todayCash->where('direction', 'in')->sum(fn ($row) => $this->toCents($row->amount))),
                'cashOut' => $this->centsToAmount($todayCash->where('direction', 'out')->sum(fn ($row) => $this->toCents($row->amount))),
                'net' => $this->centsToAmount($todayCash->sum(fn ($row) => ($row->direction === 'in' ? 1 : -1) * $this->toCents($row->amount))),
            ],
            'cashTransactions' => CashTransaction::with('user')->latest()->limit(50)->get(),
            'totalProfit' => $this->centsToAmount($report['profit_cents']),
            'totalSales' => $this->centsToAmount($report['sales_cents']),
            'totalPurchases' => $this->centsToAmount($totalPurchasesCents),
            'saleCount' => $periodSales->count(),
            'productProfit' => $report['products'],
            'monthlySales' => $monthlySales,
            'weeklyProfit' => $weeklyProfit,
            'dailyProfit' => $dailyProfit,
        ]);
    }

    public function history()
    {
        $query = Order::whereIn('type', ['sale', 'return', 'purchase']);
        if (!auth()->user()?->is_admin) $query->whereIn('type', ['sale', 'return']);
        $orders = $query
            ->with(['items.product', 'items.unit', 'originalOrder'])
            ->latest()->paginate(30)->withQueryString();
        return Inertia::render('History/Index', ['orders' => $orders]);
    }

    public function storeCashEntry(Request $request)
    {
        $validated = $request->validate([
            'direction' => 'required|in:in,out',
            'amount' => 'required|numeric|decimal:0,2|min:0.01|max:9999999999.99',
            'comment' => 'required|string|max:255',
        ]);
        CashTransaction::create($validated + ['user_id' => auth()->id()]);
        return back()->with('success', 'Cash entry saved.');
    }

    public function returnSale(Order $order)
    {
        abort_unless($order->type === 'sale', 404);
        abort_if($order->returned_at, 409, 'This sale has already been returned.');
        DB::transaction(function () use ($order) {
            $order = Order::whereKey($order->id)->lockForUpdate()->with('items')->firstOrFail();
            abort_if($order->returned_at, 409);
            foreach ($order->items as $item) {
                Product::whereKey($item->product_id)->lockForUpdate()->increment('stock_quantity', (float) $item->quantity * (float) ($item->unit?->conversion_factor ?? 1));
            }
            $return = Order::create([
                'type' => 'return', 'total_amount' => $order->net_amount, 'discount' => 0,
                'net_amount' => $order->net_amount, 'cashier_name' => auth()->user()?->name,
                'amount_received' => 0, 'change_given' => 0, 'return_of_order_id' => $order->id,
            ]);
            foreach ($order->items as $item) OrderItem::create([
                'order_id' => $return->id, 'product_id' => $item->product_id, 'unit_id' => $item->unit_id,
                'quantity' => $item->quantity, 'price' => $item->price, 'cost_price' => $item->cost_price,
                'subtotal' => $item->subtotal,
            ]);
            $order->update(['returned_at' => now()]);
            CashTransaction::create(['direction' => 'out', 'amount' => $order->net_amount, 'comment' => 'Customer refund for sale #'.$order->id, 'order_id' => $return->id, 'user_id' => auth()->id()]);
        });
        return back()->with('success', 'Sale returned, stock restored, and refund recorded.');
    }

    /**
     * Allocate each order's discounted net revenue across its lines, then calculate
     * cost and profit in cents. Pack quantities are converted to base stock units.
     */
    private function summarizeSales(EloquentCollection $orders): array
    {
        $products = [];
        $salesCents = 0;
        $profitCents = 0;

        foreach ($orders as $order) {
            $orderNetCents = $this->toCents($order->net_amount);
            $salesCents += $orderNetCents;

            $lines = $order->items->values();
            $grossLineCents = $lines->map(fn ($item) => max(0, $this->toCents($item->subtotal)));
            $grossTotalCents = $grossLineCents->sum();
            $allocatedRevenueCents = 0;
            $orderCostCents = 0;

            foreach ($lines->values() as $index => $item) {
                $lineGrossCents = $grossLineCents[$index];
                $isLastLine = $index === $lines->count() - 1;

                if ($isLastLine) {
                    $lineNetCents = $orderNetCents - $allocatedRevenueCents;
                } elseif ($grossTotalCents > 0) {
                    $lineNetCents = (int) floor($orderNetCents * $lineGrossCents / $grossTotalCents);
                } else {
                    $lineNetCents = 0;
                }

                $allocatedRevenueCents += $lineNetCents;
                $quantity = (float) $item->quantity;
                $conversionFactor = (float) ($item->unit?->conversion_factor ?? 1);
                $baseQuantity = round($quantity * $conversionFactor, 3, PHP_ROUND_HALF_UP);
                $costPerBaseUnit = (float) ($item->cost_price ?? $item->product?->cost_price ?? 0);
                $lineCostCents = max(0, $this->toCents($costPerBaseUnit * $baseQuantity));
                $orderCostCents += $lineCostCents;

                $productKey = (string) ($item->product_id ?? 'unknown');
                if (!isset($products[$productKey])) {
                    $products[$productKey] = [
                        'name' => $item->product?->name ?? 'Unknown product',
                        'quantity_milli' => 0,
                        'sales_cents' => 0,
                        'cost_cents' => 0,
                    ];
                }

                $products[$productKey]['quantity_milli'] += (int) round($baseQuantity * 1000);
                $products[$productKey]['sales_cents'] += $lineNetCents;
                $products[$productKey]['cost_cents'] += $lineCostCents;
            }

            $profitCents += $orderNetCents - $orderCostCents;
        }

        $productRows = collect($products)->map(function (array $product, string $productId) {
            $productProfitCents = $product['sales_cents'] - $product['cost_cents'];

            return [
                'product_id' => $productId,
                'name' => $product['name'],
                'quantity' => $product['quantity_milli'] / 1000,
                'sales' => $this->centsToAmount($product['sales_cents']),
                'cost' => $this->centsToAmount($product['cost_cents']),
                'profit' => $this->centsToAmount($productProfitCents),
            ];
        })->sortByDesc('profit')->values();

        return [
            'sales_cents' => $salesCents,
            'profit_cents' => $profitCents,
            'products' => $productRows,
        ];
    }

    private function profitByPeriod(EloquentCollection $orders, callable $periodKey)
    {
        return $orders->groupBy($periodKey)
            ->map(function (EloquentCollection $periodOrders) {
                $summary = $this->summarizeSales($periodOrders);

                return $this->centsToAmount($summary['profit_cents']);
            })
            ->map(fn ($amount, $period) => ['day' => $period, 'hour' => $period, 'amount' => $amount])
            ->values();
    }

    private function toCents(mixed $amount): int
    {
        return (int) round((float) $amount * 100, 0, PHP_ROUND_HALF_UP);
    }

    private function centsToAmount(int $cents): float
    {
        return $cents / 100;
    }
}
