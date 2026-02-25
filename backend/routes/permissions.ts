import { Router, Request, Response } from "express";
import prisma from "../prismaClient";
import { authenticate, requirePermission } from "../middleware/auth";

const router = Router();
router.use(authenticate);

// List permissions
router.get("/", requirePermission("view_permissions"), async (req: Request, res: Response): Promise<any> => {
    const permissions = await prisma.permission.findMany();
    res.json(permissions);
});

// Create permission
router.post("/", requirePermission("create_permissions"), async (req: Request, res: Response): Promise<any> => {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });

    try {
        const permission = await prisma.permission.create({ data: { name, description } });
        res.status(201).json(permission);
    } catch (error) {
        res.status(500).json({ error: "Failed to create permission" });
    }
});

// Update permission
router.put("/:id", requirePermission("edit_permissions"), async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;
    const { name, description } = req.body;

    try {
        const permission = await prisma.permission.update({
            where: { id: Number(id) },
            data: { name, description }
        });
        res.json(permission);
    } catch (error) {
        res.status(500).json({ error: "Failed to update permission" });
    }
});

router.delete("/:id", requirePermission("delete_permissions"), async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;
    try {
        await prisma.permission.delete({ where: { id: Number(id) } });
        res.json({ message: "Permission deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete permission" });
    }
});

export default router;
