import { Router, Request, Response } from "express";
import multer from "multer";
import * as xlsx from "xlsx";
import prisma from "../prismaClient";
import { authenticate, requirePermission } from "../middleware/auth";

const router = Router();
router.use(authenticate);

const upload = multer({ storage: multer.memoryStorage() });

const getVal = (row: any, keys: string[]) => {
    for (const key of keys) {
        const targetKey = key.toLowerCase().trim();
        const foundKey = Object.keys(row).find(k => {
            const rowKey = k.toLowerCase().trim();
            return rowKey === targetKey;
        });
        if (foundKey !== undefined) return row[foundKey];
    }
    return null;
};

const cleanNum = (val: any) => {
    if (val === null || val === undefined || val === "") return 0;
    let num = 0;
    if (typeof val === 'number') {
        num = val;
    } else {
        const cleaned = String(val).replace(/[^0-9.-]/g, '');
        num = parseFloat(cleaned);
    }
    if (isNaN(num)) return 0;
    return Math.round(num * 10000) / 10000;
};

import crypto from "crypto";

// Helper to generate hash for a record
const generateHash = (record: any) => {
    const str = JSON.stringify({
        stockDate: record.stockDate,
        productCode: record.productCode,
        batchName: record.batchName,
        siteName: record.siteName,
        qty: record.qty,
        division: record.division
    });
    return crypto.createHash('md5').update(str).digest('hex');
};

// Upload Stock Excel
router.post("/import", requirePermission("import_stock"), upload.single("file"), async (req: Request | any, res: Response): Promise<any> => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    try {
        const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 });

        // Strict Schema Validation: Check for Stock-specific columns
        const allRowsContent = JSON.stringify(rows.slice(0, 10)).toLowerCase();
        const isSalesFile = allRowsContent.includes("qty pc") || allRowsContent.includes("dp value") || allRowsContent.includes("tp value");
        const hasStockColumns = allRowsContent.includes("product sku") && (allRowsContent.includes("site name") || allRowsContent.includes("batch name"));

        if (isSalesFile || !hasStockColumns) {
            return res.status(400).json({
                error: "Invalid Template: You are attempting to upload a Sales Register into the Stock Ledger. Please use the correct Stock template."
            });
        }

        let headerRowIndex = rows.findIndex(row =>
            row.some(cell => String(cell).toLowerCase().includes("product sku")) ||
            row.some(cell => String(cell).toLowerCase().includes("product name"))
        );
        if (headerRowIndex === -1) headerRowIndex = 0;
        const data: any[] = xlsx.utils.sheet_to_json(sheet, { range: headerRowIndex });

        if (data.length === 0) return res.status(400).json({ error: "No data found in Excel" });

        // Create a Job record
        const job = await prisma.importJob.create({
            data: {
                type: "STOCK",
                status: "PROCESSING",
                totalRecords: data.length,
            }
        });

        // Respond immediately
        res.json({ message: "Import started", jobId: job.id });

        // Run processing in background
        (async () => {
            try {
                const CHUNK_SIZE = 500;
                let processedCount = 0;

                for (let i = 0; i < data.length; i += CHUNK_SIZE) {
                    const chunk = data.slice(i, i + CHUNK_SIZE);
                    const records = chunk.map((row: any) => {
                        let recordDate = new Date();
                        const dateVal = getVal(row, ["Stock Date", "StockDate", "Date"]);
                        if (dateVal) {
                            if (typeof dateVal === 'number') {
                                recordDate = new Date((dateVal - 25569) * 86400 * 1000);
                            } else {
                                recordDate = new Date(dateVal);
                            }
                        }

                        const r: any = {
                            division: String(getVal(row, ["Division"]) || ""),
                            siteName: String(getVal(row, ["Site Name", "SiteName"]) || ""),
                            distCode: String(getVal(row, ["Dist. Code", "DistCode"]) || ""),
                            source: String(getVal(row, ["Source"]) || ""),
                            partyName: String(getVal(row, ["Party Name", "PartyName"]) || ""),
                            group: String(getVal(row, ["Group"]) || ""),
                            category: String(getVal(row, ["Category"]) || ""),
                            brand: String(getVal(row, ["Brand"]) || ""),
                            productCode: String(getVal(row, ["Product SKU", "ProductCode", "SKU"]) || ""),
                            productName: String(getVal(row, ["Product Name", "ProductName"]) || ""),
                            batchName: String(getVal(row, ["Batch Name", "BatchName"]) || ""),
                            qty: Math.round(cleanNum(getVal(row, ["Qty", "Quantity"]))),
                            retailerPrice: cleanNum(getVal(row, ["Retailer Price"])),
                            dealerPrice: cleanNum(getVal(row, ["Dealer Price"])),
                            ltrKg: cleanNum(getVal(row, ["LTR/KG"])),
                            retailerAmount: cleanNum(getVal(row, ["Retailer Amount"])),
                            dealerAmount: cleanNum(getVal(row, ["Dealer Amount"])),
                            stockDate: recordDate,
                            importedBy: req.user.userId,
                        };

                        // Price fallbacks
                        if (r.dealerPrice === 0 && r.dealerAmount > 0 && r.qty > 0) r.dealerPrice = r.dealerAmount / r.qty;
                        if (r.retailerPrice === 0 && r.retailerAmount > 0 && r.qty > 0) r.retailerPrice = r.retailerAmount / r.qty;

                        // Create unique hash
                        r.hash = generateHash(r);
                        return r;
                    }).filter(r => r.productCode && r.productName);

                    if (records.length > 0) {
                        // Use skipDuplicates to prevent errors on double import
                        await prisma.stock.createMany({
                            data: records,
                            skipDuplicates: true
                        });
                    }

                    processedCount += chunk.length;
                    const progress = Math.min(100, Math.round((processedCount / data.length) * 100));

                    await prisma.importJob.update({
                        where: { id: job.id },
                        data: {
                            processed: processedCount,
                            progress
                        }
                    });
                }

                await prisma.importJob.update({
                    where: { id: job.id },
                    data: { status: "COMPLETED", progress: 100 }
                });

            } catch (bgError: any) {
                console.error("Background processing error:", bgError);
                await prisma.importJob.update({
                    where: { id: job.id },
                    data: { status: "FAILED", errorMessage: bgError.message }
                });
            }
        })();

    } catch (error: any) {
        console.error("Stock Import Error:", error);
        res.status(500).json({ error: error.message || "Failed to initiate import" });
    }
});

// Get unique values for filters
router.get("/options", requirePermission("view_stock_reports"), async (req: Request, res: Response): Promise<any> => {
    try {
        const [divisions, groups, categories, brands, sites, productCodes, productNames] = await Promise.all([
            prisma.stock.findMany({ select: { division: true }, distinct: ['division'] }),
            prisma.stock.findMany({ select: { group: true }, distinct: ['group'] }),
            prisma.stock.findMany({ select: { category: true }, distinct: ['category'] }),
            prisma.stock.findMany({ select: { brand: true }, distinct: ['brand'] }),
            prisma.stock.findMany({ select: { siteName: true }, distinct: ['siteName'] }),
            prisma.stock.findMany({ select: { productCode: true }, distinct: ['productCode'] }),
            prisma.stock.findMany({ select: { productName: true }, distinct: ['productName'] }),
        ]);

        res.json({
            divisions: divisions.map(i => i.division).filter(Boolean),
            groups: groups.map(i => i.group).filter(Boolean),
            categories: categories.map(i => i.category).filter(Boolean),
            brands: brands.map(i => i.brand).filter(Boolean),
            siteNames: sites.map(i => i.siteName).filter(Boolean),
            productCodes: productCodes.map(i => i.productCode).filter(Boolean),
            productNames: productNames.map(i => i.productName).filter(Boolean),
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch filter options" });
    }
});

// View stock reports
router.get("/report", requirePermission("view_stock_reports"), async (req: Request, res: Response): Promise<any> => {
    const { division, productName, productCode, siteName, group, category, brand, startDate, endDate } = req.query;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
    const skip = (page - 1) * limit;

    const filters: any = {};

    // Multi-select helpers
    const applyFilter = (key: string, value: any) => {
        if (!value) return;
        if (Array.isArray(value)) {
            filters[key] = { in: value.map(v => String(v)) };
        } else {
            filters[key] = String(value);
        }
    };

    applyFilter('division', division);
    applyFilter('siteName', siteName);
    applyFilter('group', group);
    applyFilter('category', category);
    applyFilter('brand', brand);
    applyFilter('productName', productName);
    applyFilter('productCode', productCode);

    if (startDate && endDate) {
        filters.stockDate = {
            gte: new Date(startDate as string),
            lte: new Date(endDate as string),
        };
    } else if (startDate) {
        filters.stockDate = { gte: new Date(startDate as string) };
    } else if (endDate) {
        filters.stockDate = { lte: new Date(endDate as string) };
    }

    try {
        const [stock, total] = await Promise.all([
            prisma.stock.findMany({
                where: filters,
                skip,
                take: limit,
                orderBy: { stockDate: "desc" }
            }),
            prisma.stock.count({ where: filters })
        ]);

        res.json({
            data: stock,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch stock reports" });
    }
});

export default router;
