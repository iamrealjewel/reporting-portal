import { Router, Request, Response } from "express";
import prisma from "../prismaClient";
import { authenticate } from "../middleware/auth";

const router = Router();
router.use(authenticate);

router.get("/status/:id", async (req: Request, res: Response): Promise<any> => {
    try {
        const job = await prisma.importJob.findUnique({
            where: { id: req.params.id as string }
        });
        if (!job) return res.status(404).json({ error: "Job not found" });
        res.json(job);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch job status" });
    }
});

export default router;
