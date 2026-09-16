import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspectAmEissa() {
  const rest = await prisma.restaurant.findFirst({
    where: { name: { contains: 'عيسى' } },
    include: {
      branches: {
        include: {
          menuCategories: {
            include: { items: true }
          }
        }
      }
    }
  });
  console.log(JSON.stringify(rest, null, 2));
}

inspectAmEissa()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
