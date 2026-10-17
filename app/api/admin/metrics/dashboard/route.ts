import { NextResponse } from 'next/server';
import { requirePermission } from '../../../../../src/lib/permissions';
import { normalizeRange, getSummaryMetrics, getTimeSeries, getUserSeries, getTopProducts, getCategoryDistribution, getOrderStatusBreakdown, getRecentOrders, getOrderStatusTotals } from '../../../../../src/lib/metrics';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    await requirePermission('dashboard:access');
    const { searchParams } = new URL(req.url);
    const range = normalizeRange({ from: searchParams.get('from') || undefined, to: searchParams.get('to') || undefined, g: searchParams.get('g') || undefined });
    const limitTop = Number(searchParams.get('topLimit') || 5);
    const limitRecent = Number(searchParams.get('recentLimit') || 8);

    const [summary, series, userSeries, topProducts, categories, breakdown, recentOrders, statusTotals] = await Promise.all([
      getSummaryMetrics(range),
      getTimeSeries(range),
      getUserSeries(range),
      getTopProducts(range, limitTop > 0 && limitTop <= 50 ? limitTop : 5),
      getCategoryDistribution(range),
      getOrderStatusBreakdown(range),
      getRecentOrders(range, limitRecent > 0 && limitRecent <= 50 ? limitRecent : 8),
      getOrderStatusTotals(range)
    ]);

    return NextResponse.json({
      range: { from: range.from.toISOString().slice(0,10), to: range.to.toISOString().slice(0,10), granularity: range.granularity },
      summary,
      timeseries: series,
      users: userSeries,
      topProducts,
      categories,
      ordersStatus: {
        breakdown,
        totals: statusTotals
      },
      recentOrders
    });
  } catch (e: any) {
    if (e instanceof Error) {
      if (e.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
      if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 });
  }
}
