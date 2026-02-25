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

    // Support both single "dimension" (legacy) and multi "dimensions" (new)
    const dims: string[] = dimensions
        ? (dimensions as string).split(',')
        : [dimension as string].filter(Boolean);

    const validDimensions = ["division", "depot", "prodLine", "category", "brand", "seller", "employeeName", "dbName", "productName"];

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
        dimension, dimensions, startDate, endDate, division, brand, category,
        siteName, group, source, partyName, productName
    } = req.query;

    // Support both single "dimension" (legacy) and multi "dimensions" (new)
    const dims: string[] = dimensions
        ? (dimensions as string).split(',')
        : [dimension as string].filter(Boolean);

    const validDimensions = ["division", "siteName", "group", "category", "brand", "source", "partyName", "productName"];

    const invalidDims = dims.filter(d => !validDimensions.includes(d));
    if (dims.length === 0 || invalidDims.length > 0) {
        return res.status(400).json({ error: `Invalid dimensions: ${invalidDims.join(', ')}` });
    }

    const where: any = {};
    if (startDate || endDate) {
        where.stockDate = {};
        if (startDate) where.stockDate.gte = new Date(startDate as string);
        if (endDate) where.stockDate.lte = new Date(endDate as string);
    }

    const filters = [
        { key: 'division', val: division },
        { key: 'brand', val: brand },
        { key: 'category', val: category },
        { key: 'siteName', val: siteName },
        { key: 'group', val: group },
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
            salesWhere.date = { ...salesWhere.date, lte: end };
            stockWhere.stockDate = { ...stockWhere.stockDate, lte: end };
        }
    }

    try {
        const [salesKpi, stockKpi, topProducts] = await Promise.all([
            prisma.sales.aggregate({
                where: salesWhere,
                _sum: { dpValue: true, qtyPc: true },
                _count: { id: true }
            }),
            prisma.stock.aggregate({
                where: stockWhere,
                _sum: { dealerAmount: true, qty: true },
                _count: { id: true }
            }),
            (prisma.sales as any).groupBy({
                by: ['productName'],
                where: salesWhere,
                _sum: { dpValue: true },
                orderBy: { _sum: { dpValue: 'desc' } },
                take: 5
            })
        ]);

        res.json({
            totalSalesAmount: Number(salesKpi._sum.dpValue || 0),
            totalSalesQty: Number(salesKpi._sum.qtyPc || 0),
            totalSalesTransactions: Number(salesKpi._count.id || 0),
            totalStockValue: Number(stockKpi._sum.dealerAmount || 0),
            totalStockQty: Number(stockKpi._sum.qty || 0),
            topProducts: (topProducts || []).map((p: any) => ({
                ...p,
                _sum: {
                    dpValue: Number(p._sum?.dpValue || 0)
                }
            }))
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
        const start = startDate ? `'${startDate}'` : 'DATE_SUB(NOW(), INTERVAL 30 DAY)';
        const end = endDate ? `'${endDate}'` : 'NOW()';

        const trends = await prisma.$queryRawUnsafe(`
            SELECT 
                DATE(date) as day,
                SUM(dpValue) as amount,
                SUM(qtyPc) as qty
            FROM Sales
            WHERE date BETWEEN ${start} AND ${end}
            GROUP BY DATE(date)
            ORDER BY day ASC
        `);

        res.json(trends);
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

        // Batching queries to prevent connection pool exhaustion
        const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

        const batch1 = await Promise.all([
            prisma.sales.findMany({ select: { brand: true }, distinct: ['brand'] }),
            prisma.sales.findMany({ select: { division: true }, distinct: ['division'] }),
            prisma.sales.findMany({ select: { category: true }, distinct: ['category'] }),
            prisma.sales.findMany({ select: { depot: true }, distinct: ['depot'] }),
            prisma.sales.findMany({ select: { prodLine: true }, distinct: ['prodLine'] }),
            prisma.sales.findMany({ select: { seller: true }, distinct: ['seller'] }),
        ]);

        await delay(200);

        const batch2 = await Promise.all([
            prisma.sales.findMany({ select: { employeeName: true }, distinct: ['employeeName'] }),
            prisma.sales.findMany({ select: { dbName: true }, distinct: ['dbName'] }),
            prisma.sales.findMany({ select: { productName: true }, distinct: ['productName'] }),
            prisma.stock.findMany({ select: { brand: true }, distinct: ['brand'] }),
            prisma.stock.findMany({ select: { division: true }, distinct: ['division'] }),
            prisma.stock.findMany({ select: { category: true }, distinct: ['category'] }),
        ]);

        await delay(200);

        const batch3 = await Promise.all([
            prisma.stock.findMany({ select: { siteName: true }, distinct: ['siteName'] }),
            prisma.stock.findMany({ select: { group: true }, distinct: ['group'] }),
            prisma.stock.findMany({ select: { source: true }, distinct: ['source'] }),
            prisma.stock.findMany({ select: { partyName: true }, distinct: ['partyName'] }),
            prisma.stock.findMany({ select: { productName: true }, distinct: ['productName'] }),
        ]);

        const combinedOptions = {
            sales: {
                brands: batch1[0].map((i: any) => i.brand).filter(Boolean).sort(),
                divisions: batch1[1].map((i: any) => i.division).filter(Boolean).sort(),
                categories: batch1[2].map((i: any) => i.category).filter(Boolean).sort(),
                depots: batch1[3].map((i: any) => i.depot).filter(Boolean).sort(),
                prodLines: batch1[4].map((i: any) => i.prodLine).filter(Boolean).sort(),
                sellers: batch1[5].map((i: any) => i.seller).filter(Boolean).sort(),
                employeeNames: batch2[0].map((i: any) => i.employeeName).filter(Boolean).sort(),
                dbNames: batch2[1].map((i: any) => i.dbName).filter(Boolean).sort(),
                products: batch2[2].map((i: any) => i.productName).filter(Boolean).sort(),
            },
            stock: {
                brands: batch2[3].map((i: any) => i.brand).filter(Boolean).sort(),
                divisions: batch2[4].map((i: any) => i.division).filter(Boolean).sort(),
                categories: batch2[5].map((i: any) => i.category).filter(Boolean).sort(),
                siteNames: batch3[0].map((i: any) => i.siteName).filter(Boolean).sort(),
                groups: batch3[1].map((i: any) => i.group).filter(Boolean).sort(),
                sources: batch3[2].map((i: any) => i.source).filter(Boolean).sort(),
                parties: batch3[3].map((i: any) => i.partyName).filter(Boolean).sort(),
                products: batch3[4].map((i: any) => i.productName).filter(Boolean).sort(),
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
