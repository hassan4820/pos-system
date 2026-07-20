<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function index()
    {
        $monthStart = Carbon::now()->startOfMonth();
        $weekStart = Carbon::now()->startOfWeek();
        $dayStart = Carbon::now()->startOfDay();

        $sales = Order::where('type', 'sale')
            ->where('created_at', '>=', $monthStart)
            ->with('items.product')
            ->latest()
            ->get();

        $purchases = Order::where('type', 'purchase')
            ->where('created_at', '>=', $monthStart)
            ->with('items.product')
            ->latest()
            ->get();

        $monthlySales = Order::where('type', 'sale')
            ->whereBetween('created_at', [Carbon::now()->subMonths(5)->startOfMonth(), Carbon::now()->endOfMonth()])
            ->get()
            ->groupBy(function ($order) {
                return $order->created_at->format('Y-m');
            })
            ->map(function ($orders) {
                return $orders->sum('net_amount');
            });

        $weeklySales = Order::where('type', 'sale')
            ->whereBetween('created_at', [$weekStart, Carbon::now()])
            ->get()
            ->groupBy(function ($order) {
                return $order->created_at->format('Y-m-d');
            })
            ->map(function ($orders) {
                return $orders->sum('net_amount');
            });

        $dailySales = Order::where('type', 'sale')
            ->where('created_at', '>=', $dayStart)
            ->get()
            ->groupBy(function ($order) {
                return $order->created_at->format('H:00');
            })
            ->map(function ($orders) {
                return $orders->sum('net_amount');
            });

        $productProfit = $sales->flatMap->items->groupBy(function ($item) {
            return $item->product?->name ?? 'Unknown';
        })->map(function ($items, $name) {
            $soldQty = (int) $items->sum(function ($item) {
                return (int) ($item->quantity ?? 0);
            });
            $salesValue = $items->sum(function ($item) {
                return (float) ($item->price ?? 0) * (int) ($item->quantity ?? 0);
            });
            $costValue = $items->sum(function ($item) {
                return (float) ($item->product?->cost_price ?? 0) * (int) ($item->quantity ?? 0);
            });

            return [
                'name' => $name,
                'quantity' => $soldQty,
                'sales' => $salesValue,
                'cost' => $costValue,
                'profit' => $salesValue - $costValue,
            ];
        })->sortByDesc('profit')->values();

        $totalSales = $sales->sum('net_amount');
        $totalCostOfGoodsSold = $sales->flatMap->items->sum(function ($item) {
            return ($item->product?->cost_price ?? 0) * $item->quantity;
        });
        $totalProfit = $totalSales - $totalCostOfGoodsSold;
        $totalPurchases = $purchases->sum('net_amount');

        return Inertia::render('Reports/Index', [
            'sales' => $sales,
            'purchases' => $purchases,
            'totalProfit' => $totalProfit,
            'totalSales' => $totalSales,
            'totalPurchases' => $totalPurchases,
            'saleCount' => $sales->count(),
            'productProfit' => $productProfit,
            'monthlyProfit' => $monthlySales->map(function ($amount, $month) {
                return ['month' => $month, 'amount' => (float) $amount];
            })->values(),
            'weeklyProfit' => $weeklySales->map(function ($amount, $day) {
                return ['day' => $day, 'amount' => (float) $amount];
            })->values(),
            'dailyProfit' => $dailySales->map(function ($amount, $hour) {
                return ['hour' => $hour, 'amount' => (float) $amount];
            })->values(),
        ]);
    }
}
