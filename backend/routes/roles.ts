import { Router, Request, Response } from "express";
import prisma from "../prismaClient";
import { authenticate, requirePermission } from "../middleware/auth";

const router = Router();
router.use(authenticate);

// List roles
router.get("/", requirePermission("view_roles"), async (req: Request, res: Response): Promise<any> => {
    const roles = await prisma.role.findMany({ include: { permissions: true } });
    res.json(roles);
});

// Create role
router.post("/", requirePermission("create_roles"), async (req: Request, res: Response): Promise<any> => {
    const { name, description, permissionIds } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });

    try {
        const role = await prisma.role.create({
            data: {
                name,
                description,
                permissions: { connect: permissionIds?.map((id: number) => ({ id })) || [] },
            },
            include: { permissions: true }
        });
        res.status(201).json(role);
    } catch (error) {
        res.status(500).json({ error: "Failed to create role" });
    }
});

// Update role
router.put("/:id", requirePermission("edit_roles"), async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;
    const { name, description, permissionIds } = req.body;

    try {
        const role = await prisma.role.update({
            where: { id: Number(id) },
            data: {
                name,
                description,
                permissions: permissionIds ? { set: permissionIds.map((pid: number) => ({ id: pid })) } : undefined,
            },
            include: { permissions: true }
        });
        res.json(role);
    } catch (error) {
        res.status(500).json({ error: "Failed to update role" });
    }
});

router.delete("/:id", requirePermission("delete_roles"), async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;
    try {
        await prisma.role.delete({ where: { id: Number(id) } });
        res.json({ message: "Role deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete role" });
    }
});

export default router;
