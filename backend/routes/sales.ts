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
        const foundKey = Object.keys(row).find(k => k.toLowerCase().trim() === targetKey);
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

const generateHash = (record: any) => {
    const str = JSON.stringify({
        date: record.date,
        dbCode: record.dbCode,
        productCode: record.productCode,
        empId: record.empId,
        qtyPc: record.qtyPc,
        dpValue: record.dpValue
    });
    return crypto.createHash('md5').update(str).digest('hex');
};

// Upload Sales Excel
router.post("/import", requirePermission("import_sales"), upload.single("file"), async (req: Request | any, res: Response): Promise<any> => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    try {
        const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 });

        // Strict Schema Validation: Check for Sales-specific columns
        const allRowsContent = JSON.stringify(rows.slice(0, 10)).toLowerCase();
        const isStockFile = allRowsContent.includes("site name") || allRowsContent.includes("batch name") || allRowsContent.includes("retailer price");
        const hasSalesColumns = allRowsContent.includes("qty pc") || allRowsContent.includes("dp value") || allRowsContent.includes("tp value");

        if (isStockFile || !hasSalesColumns) {
            return res.status(400).json({
                error: "Invalid Template: You are attempting to upload a Stock Ledger into the Sales Register. Please use the correct Sales template."
            });
        }

        let headerRowIndex = rows.findIndex(row =>
            row.some(cell => String(cell).toLowerCase().includes("product sku")) ||
            row.some(cell => String(cell).toLowerCase().includes("product name")) ||
            row.some(cell => String(cell).toLowerCase().includes("qty pc"))
        );
        if (headerRowIndex === -1) headerRowIndex = 0;
        const data: any[] = xlsx.utils.sheet_to_json(sheet, { range: headerRowIndex });

        if (data.length === 0) return res.status(400).json({ error: "No data found in Excel" });

        const job = await prisma.importJob.create({
            data: {
                type: "SALES",
                status: "PROCESSING",
                totalRecords: data.length,
            }
        });

        res.json({ message: "Import started", jobId: job.id });

        (async () => {
            try {
                const CHUNK_SIZE = 500;
                let processedCount = 0;

                for (let i = 0; i < data.length; i += CHUNK_SIZE) {
                    const chunk = data.slice(i, i + CHUNK_SIZE);
                    const records = chunk.map((row: any) => {
                        let recordDate = new Date();
                        const dateVal = getVal(row, ["Date", "Sales Date", "SalesDate"]);
                        if (dateVal) {
                            if (typeof dateVal === 'number') {
                                recordDate = new Date((dateVal - 25569) * 86400 * 1000);
                            } else {
                                recordDate = new Date(dateVal);
                            }
                        }

                        const r: any = {
                            date: recordDate,
                            division: String(getVal(row, ["Division"]) || ""),
                            depot: String(getVal(row, ["Depot"]) || ""),
                            seller: String(getVal(row, ["Seller"]) || ""),
                            dbCode: String(getVal(row, ["DB Code", "DBCode"]) || ""),
                            dbName: String(getVal(row, ["DB Name", "DBName"]) || ""),
                            prodLine: String(getVal(row, ["Prod. Line", "ProdLine"]) || ""),
                            category: String(getVal(row, ["Category"]) || ""),
                            brand: String(getVal(row, ["Brand"]) || ""),
                            productCode: String(getVal(row, ["Product SKU", "ProductCode", "SKU"]) || ""),
                            productName: String(getVal(row, ["Product Name", "ProductName"]) || ""),
                            empId: String(getVal(row, ["Emp. ID", "EmpID"]) || ""),
                            employeeName: String(getVal(row, ["Employee Name", "EmployeeName"]) || ""),
                            qtyPc: Math.round(cleanNum(getVal(row, ["QTY PC", "Quantity", "Qty"]))),
                            qtyLtrKg: cleanNum(getVal(row, ["QTY LTR/KG"])),
                            dpValue: cleanNum(getVal(row, ["DP Value", "Amount", "Value"])),
                            tpValue: cleanNum(getVal(row, ["TP Value"])),
                            importedBy: req.user.userId,
                        };

                        r.hash = generateHash(r);
                        return r;
                    }).filter(r => r.productCode && r.productName);

                    if (records.length > 0) {
                        await prisma.sales.createMany({
                            data: records,
                            skipDuplicates: true
                        });
                    }

                    processedCount += chunk.length;
                    const progress = Math.min(100, Math.round((processedCount / data.length) * 100));

                    await prisma.importJob.update({
                        where: { id: job.id },
                        data: { processed: processedCount, progress }
                    });
                }

                await prisma.importJob.update({
                    where: { id: job.id },
                    data: { status: "COMPLETED", progress: 100 }
                });

            } catch (bgError: any) {
                console.error("Background Processing Error:", bgError);
                await prisma.importJob.update({
                    where: { id: job.id },
                    data: { status: "FAILED", errorMessage: bgError.message }
                });
            }
        })();

    } catch (error: any) {
        console.error("Sales Import Error:", error);
        res.status(500).json({ error: error.message || "Failed to initiate import" });
    }
});

// Get unique values for filters
router.get("/options", requirePermission("view_sales_reports"), async (req: Request, res: Response): Promise<any> => {
    try {
        const [divisions, depots, categories, brands, prodLines, sellers, productCodes, productNames] = await Promise.all([
            prisma.sales.findMany({ select: { division: true }, distinct: ['division'] }),
            prisma.sales.findMany({ select: { depot: true }, distinct: ['depot'] }),
            prisma.sales.findMany({ select: { category: true }, distinct: ['category'] }),
            prisma.sales.findMany({ select: { brand: true }, distinct: ['brand'] }),
            prisma.sales.findMany({ select: { prodLine: true }, distinct: ['prodLine'] }),
            prisma.sales.findMany({ select: { seller: true }, distinct: ['seller'] }),
            prisma.sales.findMany({ select: { productCode: true }, distinct: ['productCode'] }),
            prisma.sales.findMany({ select: { productName: true }, distinct: ['productName'] }),
        ]);

        res.json({
            divisions: divisions.map(i => i.division).filter(Boolean),
            depots: depots.map(i => i.depot).filter(Boolean),
            categories: categories.map(i => i.category).filter(Boolean),
            brands: brands.map(i => i.brand).filter(Boolean),
            prodLines: prodLines.map(i => i.prodLine).filter(Boolean),
            sellers: sellers.map(i => i.seller).filter(Boolean),
            productCodes: productCodes.map(i => i.productCode).filter(Boolean),
            productNames: productNames.map(i => i.productName).filter(Boolean),
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch filter options" });
    }
});

// View sales reports
router.get("/report", requirePermission("view_sales_reports"), async (req: Request, res: Response): Promise<any> => {
    const { startDate, endDate, productCode, productName, employeeName, brand, division, depot, category, prodLine, seller } = req.query;

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
    applyFilter('depot', depot);
    applyFilter('category', category);
    applyFilter('prodLine', prodLine);
    applyFilter('brand', brand);
    applyFilter('seller', seller);
    applyFilter('productCode', productCode);
    applyFilter('productName', productName);

    if (startDate && endDate) {
        filters.date = {
            gte: new Date(startDate as string),
            lte: new Date(endDate as string),
        };
    } else if (startDate) {
        filters.date = { gte: new Date(startDate as string) };
    } else if (endDate) {
        filters.date = { lte: new Date(endDate as string) };
    }

    try {
        const [sales, total] = await Promise.all([
            prisma.sales.findMany({
                where: filters,
                skip,
                take: limit,
                orderBy: { date: "desc" }
            }),
            prisma.sales.count({ where: filters })
        ]);

        res.json({
            data: sales,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch sales reports" });
    }
});

export default router;
