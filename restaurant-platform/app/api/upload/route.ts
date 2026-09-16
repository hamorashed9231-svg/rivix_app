import { NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "demo",
  api_key: process.env.CLOUDINARY_API_KEY || "123456789",
  api_secret: process.env.CLOUDINARY_API_SECRET || "secret",
  secure: true,
})

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const folder = (formData.get("folder") as string) || "rivix/general"

    if (!file) {
      return NextResponse.json({ error: "لم يتم تقديم أي ملف للرفع" }, { status: 400 })
    }

    // 1. Validate File Size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "حجم الملف يتجاوز الحد الأقصى المسموح به (5 ميجابايت)" },
        { status: 400 }
      )
    }

    // 2. Validate MIME Type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "نوع الملف غير مدعوم. الصيغ المسموحة هي: JPG, PNG, WEBP" },
        { status: 400 }
      )
    }

    // Convert file to arrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Cloudinary using upload_stream
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          transformation: [
            { width: 1200, height: 1200, crop: "limit" },
            { quality: "auto" },
            { fetch_format: "auto" },
          ],
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )
      uploadStream.end(buffer)
    })

    return NextResponse.json({
      message: "تم رفع الصورة بنجاح إلى Cloudinary",
      url: result.secure_url,
      public_id: result.public_id,
    })
  } catch (error) {
    console.error("Cloudinary Upload Error:", error)
    return NextResponse.json(
      { error: "حدث خطأ أثناء رفع الصورة، يرجى إعادة المحاولة" },
      { status: 500 }
    )
  }
}
