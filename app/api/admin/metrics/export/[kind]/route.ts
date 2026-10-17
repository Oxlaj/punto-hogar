import { NextResponse } from 'next/server';
import { requirePermission } from '../../../../../../src/lib/permissions';
import { normalizeRange, getSummaryMetrics, getTimeSeries, getTopProducts, getCategoryDistribution, getOrderStatusBreakdown, exportSummaryCsv, toCsv } from '../../../../../../src/lib/metrics';

export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: { kind: string } }) {
  try {
  // Export requiere permiso separado para diferenciar de visualización en dashboard
  await requirePermission('dashboard:export');
    const { searchParams } = new URL(req.url);
    const format = (searchParams.get('format') || 'csv').toLowerCase();
    const range = normalizeRange({ from: searchParams.get('from') || undefined, to: searchParams.get('to') || undefined, g: searchParams.get('g') || undefined });
    const kind = params.kind;

    if (!['summary','timeseries','top-products','categories','orders-status'].includes(kind)) {
      return NextResponse.json({ error: 'INVALID_KIND' }, { status: 400 });
    }

    if (format !== 'csv' && format !== 'json') {
      return NextResponse.json({ error: 'INVALID_FORMAT' }, { status: 400 });
    }

    let payload: any;
    if (kind === 'summary') {
      const summary = await getSummaryMetrics(range);
      payload = summary;
      if (format === 'csv') {
        const csv = exportSummaryCsv(summary);
        return new Response(csv, { headers: { 'Content-Type':'text/csv', 'Content-Disposition': `attachment; filename=summary-${summary.range.from}_${summary.range.to}.csv` } });
      }
    } else if (kind === 'timeseries') {
      const series = await getTimeSeries(range);
      payload = series;
      if (format === 'csv') {
        const csv = toCsv(series);
        return new Response(csv, { headers: { 'Content-Type':'text/csv', 'Content-Disposition': `attachment; filename=timeseries-${range.from.toISOString().slice(0,10)}_${range.to.toISOString().slice(0,10)}.csv` } });
      }
    } else if (kind === 'top-products') {
      const limit = Number(searchParams.get('limit') || 50);
      const top = await getTopProducts(range, limit);
      payload = top;
      if (format === 'csv') {
        const csv = toCsv(top);
        return new Response(csv, { headers: { 'Content-Type':'text/csv', 'Content-Disposition': `attachment; filename=top-products-${range.from.toISOString().slice(0,10)}_${range.to.toISOString().slice(0,10)}.csv` } });
      }
    } else if (kind === 'categories') {
      const cats = await getCategoryDistribution(range);
      payload = cats;
      if (format === 'csv') {
        const csv = toCsv(cats);
        return new Response(csv, { headers: { 'Content-Type':'text/csv', 'Content-Disposition': `attachment; filename=categories-${range.from.toISOString().slice(0,10)}_${range.to.toISOString().slice(0,10)}.csv` } });
      }
    } else if (kind === 'orders-status') {
      const br = await getOrderStatusBreakdown(range);
      payload = br;
      if (format === 'csv') {
        const csv = toCsv(br);
        return new Response(csv, { headers: { 'Content-Type':'text/csv', 'Content-Disposition': `attachment; filename=orders-status-${range.from.toISOString().slice(0,10)}_${range.to.toISOString().slice(0,10)}.csv` } });
      }
    }

    return NextResponse.json(payload);
  } catch (e: any) {
    if (e instanceof Error) {
      if (e.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
      if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 });
  }
}