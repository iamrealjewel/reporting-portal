import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    // 1. Create Permissions
    const permissionsData = [
        { name: "view_users", description: "View list of users" },
        { name: "create_users", description: "Create new users" },
        { name: "edit_users", description: "Edit existing users" },
        { name: "delete_users", description: "Delete users" },
        { name: "view_roles", description: "View roles" },
        { name: "create_roles", description: "Create new roles" },
        { name: "edit_roles", description: "Edit roles" },
        { name: "delete_roles", description: "Delete roles" },
        { name: "view_permissions", description: "View permissions" },
        { name: "create_permissions", description: "Create permissions" },
        { name: "edit_permissions", description: "Edit permissions" },
        { name: "delete_permissions", description: "Delete permissions" },
        { name: "import_stock", description: "Import stock excel data" },
        { name: "import_sales", description: "Import sales excel data" },
        { name: "view_stock_reports", description: "View stock reports" },
        { name: "view_sales_reports", description: "View sales reports" },
    ];

    console.log("Creating permissions...");
    for (const p of permissionsData) {
        await prisma.permission.upsert({
            where: { name: p.name },
            update: {},
            create: p,
        });
    }

    const allPermissions = await prisma.permission.findMany();

    // 2. Create Admin Role
    console.log("Creating Admin role...");
    const adminRole = await prisma.role.upsert({
        where: { name: "Admin" },
        update: {
            permissions: {
                set: allPermissions.map((p: any) => ({ id: p.id })),
            },
        },
        create: {
            name: "Admin",
            description: "Super Administrator with full access",
            permissions: {
                connect: allPermissions.map((p: any) => ({ id: p.id })),
            },
        },
    });

    // 3. Create Default Admin User
    console.log("Creating Admin user...");
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await prisma.user.upsert({
        where: { email: "admin@example.com" },
        update: {
            password: hashedPassword,
            roleId: adminRole.id,
        },
        create: {
            name: "Super Admin",
            email: "admin@example.com",
            password: hashedPassword,
            roleId: adminRole.id,
        },
    });

    await prisma.user.upsert({
        where: { email: "jahirul.islam@ispahanibd.com" },
        update: {
            password: hashedPassword,
            roleId: adminRole.id,
        },
        create: {
            name: "Jahirul Islam",
            email: "jahirul.islam@ispahanibd.com",
            password: hashedPassword,
            roleId: adminRole.id,
        },
    });

    await prisma.user.upsert({
        where: { email: "iamrealjewel@gmail.com" },
        update: {
            password: hashedPassword,
            roleId: adminRole.id,
        },
        create: {
            name: "Jewel Rana",
            email: "iamrealjewel@gmail.com",
            password: hashedPassword,
            roleId: adminRole.id,
        },
    });

    console.log("Seeding completed successfully.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
