const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const rest = await prisma.restaurant.findUnique({ where: { slug: 'am-eissa' } })
  if (!rest || !rest.logo) {
    console.log('No logo found')
    return
  }

  const base64Data = rest.logo.replace(/^data:image\/\w+;base64,/, '')
  const buffer = Buffer.from(base64Data, 'base64')

  const targetPath = path.join(__dirname, '..', '..', 'mobile', 'assets', 'restaurants', 'am-eissa', 'icon.jpg')
  fs.writeFileSync(targetPath, buffer)
  console.log('Successfully written DB logo to:', targetPath, 'Size:', buffer.length, 'bytes')
}

main().finally(() => prisma.$disconnect())
