# Restaurant Platform (منصة المطاعم المتعددة) 🍔🍕

منصة **Multi-vendor** للمطاعم تمكّن العملاء من الطلب، وأصحاب المطاعم من إدارة مطاعمهم وطلباتهم، والمديرين من إشراف وحوكمة المنصة.

---

## 🚀 التقنيات المستخدمة (Tech Stack)

- **Framework:** [Next.js 14+](https://nextjs.org/) (App Router) مع **TypeScript**
- **Database & ORM:** [Prisma ORM](https://www.prisma.io/) مع **PostgreSQL**
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Authentication:** [NextAuth.js](https://next-auth.js.org/)

---

## 👥 أنواع المستخدمين (Roles)

يتم تصنيف المستخدمين عبر حقل `role` واحد في جدول `User`:
- `customer`: عميل عادي تصفح المطاعم، إدارة العناوين والطلبات.
- `restaurant_owner`: صاحب مطعم (لوحة تحكم خاصة لإدارة الفروع، المنيو، والطلبات).
- `admin`: مدير المنصة (لوحة تحكم كاملة للحوكمة ونسب العمولات والمطاعم).

---

## 🗄️ مخطط قاعدة البيانات (Prisma Models)

- **User**: بيانات العميل/صاحب المطعم/الأدمن.
- **Address**: عناوين التوصيل المرتبطة بالعميل (مع الإحداثيات lat/lng).
- **Restaurant**: بيانات المطعم (الشعار، الغلاف، الحالة: pending/active/suspended، ونسبة العمولات).
- **Branch**: فروع المطاعم (ساعات العمل، الموقع، رقم الهاتف).
- **MenuCategory**: تصنيفات المنيو الخاصة بكل فرع.
- **MenuItem**: أصناف المنيو (السعر، الصورة، التوفر).
- **Order**: الطلبات (الحالة، العنوان، إجمالي السعر، ورابط مع Driver API الخارجي).
- **OrderItem**: تفاصيل العناصر المطبوعة في الطلب.

---

## 🛠️ خطوات التشغيل محليًا (Local Setup)

### 1. استنساخ المشروع وتثبيت الحزم
```bash
git clone <repository-url>
cd restaurant-platform
npm install
```

### 2. إعداد متغيرات البيئة (Environment Variables)
قم بإنشاء ملف `.env` بناءً على `.env.example`:
```bash
cp .env.example .env
```
ثم عدّل قيم `DATABASE_URL` و `NEXTAUTH_SECRET` و `NEXTAUTH_URL`.

### 3. تجهيز قاعدة البيانات وتوليد Prisma Client
```bash
# توليد Prisma Client
npx prisma generate

# تطبيق الهيكل على قاعدة بيانات PostgreSQL (عند ربط قاعدة البيانات)
npx prisma db push
```

### 4. تشغيل السيرفر المحلي
```bash
npm run dev
```
افتح [http://localhost:3000](http://localhost:3000) في المتصفح.

---

## 📁 هيكل المجلدات (Folder Structure)

```
restaurant-platform/
├── app/
│   ├── (customer)/     # صفحات العميل
│   ├── (dashboard)/    # داش بورد صاحب المطعم والأدمن
│   ├── api/            # API Routes & NextAuth
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/         # المكونات المعاد استخدامها
├── lib/
│   └── prisma.ts       # إعداد Prisma Client Singleton
├── prisma/
│   └── schema.prisma   # مخطط قاعدة البيانات
├── .env.example
├── package.json
└── README.md
```
