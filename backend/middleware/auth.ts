import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "supersecret";

export interface AuthRequest extends Request {
    user?: any;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): any => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Access denied" });

    try {
        const decoded = jwt.verify(token, SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(403).json({ error: "Invalid token" });
    }
};

export const requireRole = (roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): any => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: "Forbidden: Insufficient privileges" });
        }
        next();
    };
};

export const requirePermission = (permission: string) => {
    return (req: AuthRequest, res: Response, next: NextFunction): any => {
        if (!req.user || !req.user.permissions.includes(permission)) {
            return res.status(403).json({ error: "Forbidden: Missing permission" });
        }
        next();
    };
};
