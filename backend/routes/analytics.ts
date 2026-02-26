import { Router, Request, Response } from "express";
import prisma from "../prismaClient";
import { authenticate } from "../middleware/auth";

const router = Router();
router.use(authenticate);

// Helper to build Prisma "in" filter for array or single value
const buildFilter = (value: any) => {
    if (!value || value === 'all') return undefined;
    if (Array.isArray(value)) return { in: value };
    return value;
};

// 1. Sales Summary by Dimension(s)
router.get("/sales-summary", async (req: Request, res: Response): Promise<any> => {
    const {
        dimension, dimensions, startDate, endDate, division, brand, category,
        depot, prodLine, seller, employeeName, dbName, productName
    } = req.query;

    // Support both single/multi "dimension" (legacy) and multi "dimensions" (new)
    const dims: string[] = dimensions
        ? (dimensions as string).split(',')
        : dimension ? (dimension as string).split(',') : [];

    const validDimensions = ["date", "division", "depot", "prodLine", "category", "brand", "seller", "employeeName", "dbName", "productName"];

    const invalidDims = dims.filter(d => !validDimensions.includes(d));
    if (dims.length === 0 || invalidDims.length > 0) {
        return res.status(400).json({ error: `Invalid dimensions: ${invalidDims.join(', ')}` });
    }

    const where: any = {};
    if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = new Date(startDate as string);
        if (endDate) where.date.lte = new Date(endDate as string);
    }

    const filters = [
        { key: 'division', val: division },
        { key: 'brand', val: brand },
        { key: 'category', val: category },
        { key: 'depot', val: depot },
        { key: 'prodLine', val: prodLine },
        { key: 'seller', val: seller },
        { key: 'employeeName', val: employeeName },
        { key: 'dbName', val: dbName },
        { key: 'productName', val: productName }
    ];

    filters.forEach(f => {
        const filter = buildFilter(f.val);
        if (filter) where[f.key] = filter;
    });

    try {
        const result = await (prisma.sales as any).groupBy({
            by: dims,
            where,
            _sum: {
                qtyPc: true,
                dpValue: true,
                tpValue: true,
                qtyLtrKg: true
            },
            _count: {
                id: true,
            },
            orderBy: dims.map(d => ({ [d]: 'asc' }))
        });

        const safeResult = (result || []).map((item: any) => ({
            ...item,
            _sum: {
                qtyPc: Number(item._sum?.qtyPc || 0),
                dpValue: Number(item._sum?.dpValue || 0),
                tpValue: Number(item._sum?.tpValue || 0),
                qtyLtrKg: Number(item._sum?.qtyLtrKg || 0)
            }
        }));

        res.json(safeResult);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch sales summary" });
    }
});

// 2. Stock Summary by Dimension(s)
router.get("/stock-summary", async (req: Request, res: Response): Promise<any> => {
    const {
        dimension, dimensions, startDate, endDate, stockDate, division, brand, category,
        siteName, group, prodLine, source, partyName, productName
    } = req.query;

    // Support both single/multi "dimension" (legacy) and multi "dimensions" (new)
    const dims: string[] = dimensions
        ? (dimensions as string).split(',')
        : dimension ? (dimension as string).split(',') : [];

    const validDimensions = ["stockDate", "division", "siteName", "prodLine", "category", "brand", "source", "partyName", "productName"];

    const invalidDims = dims.filter(d => !validDimensions.includes(d));
    if (dims.length === 0 || invalidDims.length > 0) {
        return res.status(400).json({ error: `Invalid dimensions: ${invalidDims.join(', ')}` });
    }

    const where: any = {};
    if (stockDate) {
        const date = new Date(stockDate as string);
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        where.stockDate = { gte: start, lte: end };
    } else if (startDate && endDate) {
        where.stockDate = {
            gte: new Date(startDate as string),
            lte: new Date(endDate as string)
        };
    }

    const filters = [
        { key: 'division', val: division },
        { key: 'brand', val: brand },
        { key: 'category', val: category },
        { key: 'siteName', val: siteName },
        { key: 'prodLine', val: group || prodLine },
        { key: 'source', val: source },
        { key: 'partyName', val: partyName },
        { key: 'productName', val: productName }
    ];

    filters.forEach(f => {
        const filter = buildFilter(f.val);
        if (filter) where[f.key] = filter;
    });

    try {
        const result = await (prisma.stock as any).groupBy({
            by: dims,
            where,
            _sum: {
                qty: true,
                ltrKg: true,
                dealerAmount: true,
                retailerAmount: true,
            },
            _count: {
                id: true,
            },
            orderBy: dims.map(d => ({ [d]: 'asc' }))
        });

        const safeResult = (result || []).map((item: any) => ({
            ...item,
            _sum: {
                qty: Number(item._sum?.qty || 0),
                ltrKg: Number(item._sum?.ltrKg || 0),
                dealerAmount: Number(item._sum?.dealerAmount || 0),
                retailerAmount: Number(item._sum?.retailerAmount || 0),
            }
        }));

        res.json(safeResult);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch stock summary" });
    }
});

// 3. Dashboard KPIs
router.get("/dashboard-kpis", async (req: Request, res: Response): Promise<any> => {
    const { startDate, endDate } = req.query;

    const salesWhere: any = {};
    const stockWhere: any = {};

    if (startDate || endDate) {
        if (startDate) {
            const start = new Date(startDate as string);
            salesWhere.date = { ...salesWhere.date, gte: start };
            stockWhere.stockDate = { ...stockWhere.stockDate, gte: start };
        }
        if (endDate) {
            const end = new Date(endDate as string);
            end.setHours(23, 59, 59, 999); // Make end date inclusive of the entire day
            salesWhere.date = { ...salesWhere.date, lte: end };
            stockWhere.stockDate = { ...stockWhere.stockDate, lte: end };
        }
    }

    try {
        const [salesBreakdown, stockBreakdown, topProducts, topDivisions, topSites, topDistributors, topBrands] = await Promise.all([
            (prisma.sales as any).groupBy({
                by: ['prodLine'],
                where: salesWhere,
                _sum: { dpValue: true, qtyLtrKg: true }
            }),
            (prisma.stock as any).groupBy({
                by: ['prodLine'],
                where: stockWhere,
                _sum: { dealerAmount: true, ltrKg: true }
            }),
            (prisma.sales as any).groupBy({
                by: ['productName'],
                where: salesWhere,
                _sum: { dpValue: true },
                orderBy: { _sum: { dpValue: 'desc' } },
                take: 10
            }),
            (prisma.sales as any).groupBy({
                by: ['division'],
                where: salesWhere,
                _sum: { dpValue: true },
                orderBy: { _sum: { dpValue: 'desc' } },
                take: 10
            }),
            (prisma.sales as any).groupBy({
                by: ['depot'],
                where: salesWhere,
                _sum: { dpValue: true },
                orderBy: { _sum: { dpValue: 'desc' } },
                take: 10
            }),
            (prisma.sales as any).groupBy({
                by: ['dbName'],
                where: salesWhere,
                _sum: { dpValue: true },
                orderBy: { _sum: { dpValue: 'desc' } },
                take: 10
            }),
            (prisma.sales as any).groupBy({
                by: ['brand'],
                where: salesWhere,
                _sum: { dpValue: true },
                orderBy: { _sum: { dpValue: 'desc' } },
                take: 10
            })
        ]);

        const totalSalesAmount = salesBreakdown.reduce((sum: number, item: any) => sum + Number(item._sum?.dpValue || 0), 0);
        const totalSalesVolume = salesBreakdown.reduce((sum: number, item: any) => sum + Number(item._sum?.qtyLtrKg || 0), 0);
        const totalStockValue = stockBreakdown.reduce((sum: number, item: any) => sum + Number(item._sum?.dealerAmount || 0), 0);
        const totalStockVolume = stockBreakdown.reduce((sum: number, item: any) => sum + Number(item._sum?.ltrKg || 0), 0);

        const mapTop = (arr: any) => (arr || []).map((p: any) => ({
            name: String(p.productName || p.division || p.depot || p.dbName || p.brand || p.siteName || p.partyName || 'Unknown'),
            value: Number(p._sum?.dpValue || 0)
        }));

        res.json({
            sales: {
                totalAmount: totalSalesAmount,
                totalVolume: totalSalesVolume,
                breakdown: salesBreakdown.map((item: any) => ({
                    prodLine: item.prodLine || 'Unknown',
                    amount: Number(item._sum?.dpValue || 0),
                    volume: Number(item._sum?.qtyLtrKg || 0)
                })).sort((a: any, b: any) => b.amount - a.amount)
            },
            stock: {
                totalValue: totalStockValue,
                totalVolume: totalStockVolume,
                breakdown: stockBreakdown.map((item: any) => ({
                    prodLine: item.prodLine || 'Unknown',
                    value: Number(item._sum?.dealerAmount || 0),
                    volume: Number(item._sum?.ltrKg || 0)
                })).sort((a: any, b: any) => b.value - a.value)
            },
            topProducts: mapTop(topProducts),
            topDivisions: mapTop(topDivisions),
            topSites: mapTop(topSites),
            topDistributors: mapTop(topDistributors),
            topBrands: mapTop(topBrands)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch dashboard KPIs" });
    }
});

// 4. Sales Trends (Daily)
router.get("/sales-trends", async (req: Request, res: Response): Promise<any> => {
    const { startDate, endDate } = req.query;

    try {
        const where: any = {};
        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate as string);
            if (endDate) where.date.lte = new Date(endDate as string);
        } else {
            const defaultStart = new Date();
            defaultStart.setDate(defaultStart.getDate() - 30);
            where.date = { gte: defaultStart };
        }

        const rawTrends = await (prisma.sales as any).groupBy({
            by: ['date', 'prodLine'],
            where,
            _sum: {
                dpValue: true,
                qtyLtrKg: true
            },
            orderBy: {
                date: 'asc'
            }
        });

        const pivotedMap = new Map<string, any>();

        rawTrends.forEach((item: any) => {
            if (!item.date) return;
            const dayStr = new Date(item.date).toISOString().split('T')[0];
            const prodLine = item.prodLine || 'Unknown';
            const val = Number(item._sum?.dpValue || 0);

            if (!pivotedMap.has(dayStr)) {
                pivotedMap.set(dayStr, { day: dayStr, total: 0 });
            }

            const dayObj = pivotedMap.get(dayStr);
            dayObj[prodLine] = (dayObj[prodLine] || 0) + val;
            dayObj.total += val;
        });

        // Convert map to array and sort chronologically
        const finalTrends = Array.from(pivotedMap.values()).sort((a, b) =>
            new Date(a.day).getTime() - new Date(b.day).getTime()
        );

        res.json(finalTrends);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch sales trends" });
    }
});

// 5. Get Unique Filter Options
let optionsCache: any = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

router.get("/filter-options", async (req: Request, res: Response): Promise<any> => {
    try {
        const now = Date.now();
        if (optionsCache && (now - cacheTimestamp < CACHE_DURATION)) {
            return res.json(optionsCache);
        }

        // Execute queries sequentially to prevent Prisma connection pool exhaustion (P2024 limit 13)
        const salesBrands = await prisma.sales.findMany({ select: { brand: true }, distinct: ['brand'] });
        const salesDivisions = await prisma.sales.findMany({ select: { division: true }, distinct: ['division'] });
        const salesCategories = await prisma.sales.findMany({ select: { category: true }, distinct: ['category'] });
        const salesDepots = await prisma.sales.findMany({ select: { depot: true }, distinct: ['depot'] });
        const salesProdLines = await prisma.sales.findMany({ select: { prodLine: true }, distinct: ['prodLine'] });
        const salesSellers = await prisma.sales.findMany({ select: { seller: true }, distinct: ['seller'] });
        const salesEmployeeNames = await prisma.sales.findMany({ select: { employeeName: true }, distinct: ['employeeName'] });
        const salesDbNames = await prisma.sales.findMany({ select: { dbName: true }, distinct: ['dbName'] });
        const salesProductNames = await prisma.sales.findMany({ select: { productName: true }, distinct: ['productName'] });

        const stockBrands = await prisma.stock.findMany({ select: { brand: true }, distinct: ['brand'] });
        const stockDivisions = await prisma.stock.findMany({ select: { division: true }, distinct: ['division'] });
        const stockCategories = await prisma.stock.findMany({ select: { category: true }, distinct: ['category'] });
        const stockSiteNames = await prisma.stock.findMany({ select: { siteName: true }, distinct: ['siteName'] });
        const stockProdLines = await prisma.stock.findMany({ select: { prodLine: true }, distinct: ['prodLine'] });
        const stockSources = await prisma.stock.findMany({ select: { source: true }, distinct: ['source'] });
        const stockPartyNames = await prisma.stock.findMany({ select: { partyName: true }, distinct: ['partyName'] });
        const stockProductNames = await prisma.stock.findMany({ select: { productName: true }, distinct: ['productName'] });

        const combinedOptions = {
            sales: {
                brands: salesBrands.map((i: any) => i.brand).filter(Boolean).sort(),
                divisions: salesDivisions.map((i: any) => i.division).filter(Boolean).sort(),
                categories: salesCategories.map((i: any) => i.category).filter(Boolean).sort(),
                depots: salesDepots.map((i: any) => i.depot).filter(Boolean).sort(),
                prodLines: salesProdLines.map((i: any) => i.prodLine).filter(Boolean).sort(),
                sellers: salesSellers.map((i: any) => i.seller).filter(Boolean).sort(),
                employeeNames: salesEmployeeNames.map((i: any) => i.employeeName).filter(Boolean).sort(),
                dbNames: salesDbNames.map((i: any) => i.dbName).filter(Boolean).sort(),
                products: salesProductNames.map((i: any) => i.productName).filter(Boolean).sort(),
            },
            stock: {
                brands: stockBrands.map((i: any) => i.brand).filter(Boolean).sort(),
                divisions: stockDivisions.map((i: any) => i.division).filter(Boolean).sort(),
                categories: stockCategories.map((i: any) => i.category).filter(Boolean).sort(),
                siteNames: stockSiteNames.map((i: any) => i.siteName).filter(Boolean).sort(),
                prodLines: stockProdLines.map((i: any) => i.prodLine).filter(Boolean).sort(),
                sources: stockSources.map((i: any) => i.source).filter(Boolean).sort(),
                parties: stockPartyNames.map((i: any) => i.partyName).filter(Boolean).sort(),
                products: stockProductNames.map((i: any) => i.productName).filter(Boolean).sort(),
            }
        };

        optionsCache = combinedOptions;
        cacheTimestamp = now;

        res.json(combinedOptions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch filter options" });
    }
});

export default router;
