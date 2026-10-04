const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const { PrismaClient } = require('@prisma/client')

async function run() {
  const originalPath = path.join(__dirname, '..', '..', 'mobile', 'assets', 'restaurants', 'am-eissa', 'icon.jpg')
  const outDir = path.join(__dirname, '..', '..', 'mobile', 'assets', 'restaurants', 'am-eissa')

  // Read original image
  const inputBuffer = fs.readFileSync(originalPath)

  // Edge background color: approx rgb(160, 56, 17) / hex #a03811
  const bg = { r: 160, g: 56, b: 17, alpha: 1 }

  // 1. Create a safe-zone padded version (820x820 inside 1024x1024)
  // This gives 102px padding all around, ensuring circular & rounded masks NEVER cut Am Eissa or text!
  const resizedInner = await sharp(inputBuffer)
    .resize(830, 830, { fit: 'contain' })
    .toBuffer()

  const safeIconBuffer = await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 3,
      background: bg,
    }
  })
    .composite([
      {
        input: resizedInner,
        gravity: 'center',
      }
    ])
    .jpeg({ quality: 95 })
    .toBuffer()

  // Save as icon.jpg and icon.png
  fs.writeFileSync(path.join(outDir, 'icon.jpg'), safeIconBuffer)
  console.log('Saved safe icon.jpg')

  const safePngBuffer = await sharp(safeIconBuffer).png().toBuffer()
  fs.writeFileSync(path.join(outDir, 'icon.png'), safePngBuffer)
  console.log('Saved safe icon.png')

  // Also create adaptive-icon.png (scaled to ~720 inside 1024 for maximum Android safe zone)
  const adaptiveInner = await sharp(inputBuffer)
    .resize(740, 740, { fit: 'contain' })
    .toBuffer()

  const adaptiveIconBuffer = await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 160, g: 56, b: 17, alpha: 1 },
    }
  })
    .composite([
      {
        input: adaptiveInner,
        gravity: 'center',
      }
    ])
    .png()
    .toBuffer()

  fs.writeFileSync(path.join(outDir, 'adaptive-icon.png'), adaptiveIconBuffer)
  console.log('Saved safe adaptive-icon.png')

  // Update DB logo with the safeIconBuffer base64 so web & mobile API use it
  const prisma = new PrismaClient()
  const base64Uri = `data:image/jpeg;base64,${safeIconBuffer.toString('base64')}`
  await prisma.restaurant.update({
    where: { slug: 'am-eissa' },
    data: {
      logo: base64Uri,
      primaryColor: '#a03811',
      secondaryColor: '#5c1d0b',
    }
  })
  console.log('Updated restaurant logo in DB with safe-padded version')
  await prisma.$disconnect()
}

run().catch(console.error)
