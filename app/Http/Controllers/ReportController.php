<?php

namespace App\Http\Controllers;

use App\Models\Order;
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

        $periodSales = Order::where('type', 'sale')
            ->where('created_at', '>=', $monthStart)
            ->with(['items.product', 'items.unit'])
            ->latest()
            ->get();

        $salesHistory = Order::where('type', 'sale')
            ->with('items.product')
            ->latest()
            ->paginate(25)
            ->withQueryString();

        $purchases = Order::where('type', 'purchase')
            ->where('created_at', '>=', $monthStart)
            ->with('items.product')
            ->latest()
            ->get();

        $report = $this->summarizeSales($periodSales);

        $monthlyOrders = Order::where('type', 'sale')
            ->whereBetween('created_at', [$now->copy()->subMonths(5)->startOfMonth(), $now->copy()->endOfMonth()])
            ->get(['created_at', 'net_amount']);
        $monthlySales = $monthlyOrders
            ->groupBy(fn (Order $order) => $order->created_at->format('Y-m'))
            ->map(fn ($orders) => $this->centsToAmount($orders->sum(fn (Order $order) => $this->toCents($order->net_amount))))
            ->map(fn ($amount, $month) => ['month' => $month, 'amount' => $amount])
            ->values();

        $weeklyOrders = Order::where('type', 'sale')
            ->whereBetween('created_at', [$weekStart, $now])
            ->with(['items.product', 'items.unit'])
            ->get();
        $weeklyProfit = $this->profitByPeriod($weeklyOrders, fn (Order $order) => $order->created_at->format('Y-m-d'));

        $dailyOrders = Order::where('type', 'sale')
            ->whereBetween('created_at', [$dayStart, $now])
            ->with(['items.product', 'items.unit'])
            ->get();
        $dailyProfit = $this->profitByPeriod($dailyOrders, fn (Order $order) => $order->created_at->format('H:00'));

        $totalPurchasesCents = $purchases->sum(fn (Order $order) => $this->toCents($order->net_amount));

        return Inertia::render('Reports/Index', [
            'sales' => $salesHistory,
            'purchases' => $purchases,
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
