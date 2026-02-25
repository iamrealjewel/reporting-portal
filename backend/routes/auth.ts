import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../prismaClient";

const router = Router();
const SECRET = process.env.JWT_SECRET || "supersecret";

// Login endpoint
router.post("/login", async (req: Request, res: Response): Promise<any> => {
    const { email: rawEmail, password } = req.body;
    const email = rawEmail?.trim();
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

    try {
        console.log("Login attempt for:", email);
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                role: {
                    include: {
                        permissions: true,
                    },
                },
            },
        });

        if (!user) {
            console.log("User not found in DB:", email);
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const isValid = await bcrypt.compare(password, user.password);
        console.log("Password valid:", isValid);

        if (!isValid) {
            console.log("Invalid password for:", email);
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role.name, permissions: user.role.permissions.map((p: any) => p.name) },
            SECRET,
            { expiresIn: "1d" }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role.name,
                permissions: user.role.permissions.map((p: any) => p.name),
            },
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
