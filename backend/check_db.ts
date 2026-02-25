import prisma from "./prismaClient";
import bcrypt from "bcryptjs";

async function check() {
    const user = await prisma.user.findUnique({
        where: { email: "admin@example.com" },
        include: {
            role: {
                include: { permissions: true }
            }
        }
    });

    if (!user) {
        console.log("User not found!");
    } else {
        console.log("User found:", user.email);
        console.log("Role:", user.role.name);
        console.log("Permissions count:", user.role.permissions.length);
        const valid = await bcrypt.compare("admin123", user.password);
        console.log("Password valid:", valid);
    }
}

check().catch(console.error).finally(() => prisma.$disconnect());
