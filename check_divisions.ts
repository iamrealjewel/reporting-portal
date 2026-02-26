import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const divisions = await prisma.sales.groupBy({
        by: ['division'],
        _count: { id: true }
    });
    console.log(JSON.stringify(divisions, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
