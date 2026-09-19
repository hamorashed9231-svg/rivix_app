const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const rest = await prisma.restaurant.findUnique({ where: { slug: 'am-eissa' } })
  if (rest) {
    console.log('Restaurant name:', rest.name)
    console.log('Logo length:', rest.logo ? rest.logo.length : 'NULL')
    console.log('Logo prefix:', rest.logo ? rest.logo.substring(0, 100) : 'NULL')
  } else {
    console.log('Restaurant am-eissa not found')
  }
}

main().finally(() => prisma.$disconnect())
