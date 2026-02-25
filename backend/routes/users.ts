import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../prismaClient";
import { authenticate, requirePermission } from "../middleware/auth";

const router = Router();

router.use(authenticate);

// Get all users
router.get("/", requirePermission("view_users"), async (req: Request, res: Response): Promise<any> => {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            role: {
                select: {
                    id: true,
                    name: true
                }
            }
        }
    });
    res.json(users);
});

// Create a user
router.post("/", requirePermission("create_users"), async (req: Request, res: Response): Promise<any> => {
    const { name, email, password, roleId } = req.body;
    if (!name || !email || !password || !roleId) return res.status(400).json({ error: "Missing required fields" });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { name, email, password: hashedPassword, roleId: Number(roleId) },
            select: {
                id: true,
                name: true,
                email: true,
                role: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        res.status(201).json(user);
    } catch (error) {
        console.error("Create User Error:", error);
        res.status(500).json({ error: "Failed to create user" });
    }
});

// Update a user
router.put("/:id", requirePermission("edit_users"), async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;
    const { name, email, password, roleId } = req.body;

    try {
        const data: any = {};
        if (name) data.name = name;
        if (email) data.email = email;
        if (roleId) data.roleId = Number(roleId);
        if (password) data.password = await bcrypt.hash(password, 10);

        const user = await prisma.user.update({
            where: { id: Number(id) },
            data,
            select: {
                id: true,
                name: true,
                email: true,
                role: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        res.json(user);
    } catch (error) {
        console.error("Update User Error:", error);
        res.status(500).json({ error: "Failed to update user" });
    }
});

// Delete a user
router.delete("/:id", requirePermission("delete_users"), async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;
    try {
        await prisma.user.delete({ where: { id: Number(id) } });
        res.json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete user" });
    }
});

export default router;
