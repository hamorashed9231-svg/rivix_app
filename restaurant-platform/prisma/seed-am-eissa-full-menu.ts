import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface OptionDef {
  name: string
  price: number
  isDefault?: boolean
}

interface OptionGroupDef {
  name: string
  selectionType?: 'single' | 'multiple'
  isRequired?: boolean
  options: OptionDef[]
}

interface MenuItemDef {
  name: string
  description?: string
  price: number
  originalPrice?: number
  isTopSeller?: boolean
  isFeatured?: boolean
  badge?: string
  image?: string
  optionGroups?: OptionGroupDef[]
}

interface CategoryDef {
  name: string
  items: MenuItemDef[]
}

const menuCategoriesData: CategoryDef[] = [
  // 1. سندوتشات عم عيسي
  {
    name: 'سندوتشات عم عيسي',
    items: [
      {
        name: 'كفتة مشوية',
        price: 40,
        isTopSeller: true,
        badge: '🔥 الأكثر طلباً',
        description: 'كفتة مشوية على الفحم بأصول الصنعة',
        optionGroups: [
          {
            name: 'نوع الخبز والحجم',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'فينو', price: 0, isDefault: true },
              { name: 'شامي', price: 30 },
              { name: 'بيتي بان', price: 30 },
              { name: 'دبل', price: 80 },
            ],
          },
        ],
      },
      {
        name: 'روزبيف',
        price: 100,
        description: 'شرائح روزبيف مشوية متبلة',
        optionGroups: [
          {
            name: 'نوع الخبز والحجم',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'شامي', price: 0, isDefault: true },
              { name: 'بيتي بان', price: 0 },
              { name: 'دبل', price: 80 },
            ],
          },
        ],
      },
      {
        name: 'فلتو',
        price: 120,
        description: 'قطع لحم فلتو تندر طرية على الفحم',
        optionGroups: [
          {
            name: 'نوع الخبز والحجم',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'شامي', price: 0, isDefault: true },
              { name: 'بيتي بان', price: 0 },
            ],
          },
        ],
      },
      {
        name: 'كباب بتلو',
        price: 140,
        badge: 'مميز',
        description: 'كباب بتلو بلدي متبل على الفحم',
        optionGroups: [
          {
            name: 'نوع الخبز والحجم',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'شامي', price: 0, isDefault: true },
              { name: 'بيتي بان', price: 0 },
            ],
          },
        ],
      },
      {
        name: 'لحمة تريبيانكو',
        price: 100,
        description: 'شرائح لحم تريبيانكو بارد ومتبل فاخر',
        optionGroups: [
          {
            name: 'نوع الخبز والحجم',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'شامي', price: 0, isDefault: true },
              { name: 'بيتي بان', price: 0 },
            ],
          },
        ],
      },
      {
        name: 'سجق مشوي',
        price: 40,
        isTopSeller: true,
        description: 'سجق بلدي متبل ومشوي على الفحم',
        optionGroups: [
          {
            name: 'نوع الخبز والحجم',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'فينو', price: 0, isDefault: true },
              { name: 'شامي', price: 30 },
              { name: 'بيتي بان', price: 30 },
              { name: 'دبل', price: 80 },
            ],
          },
        ],
      },
      {
        name: 'طرب مشوي',
        price: 120,
        isTopSeller: true,
        badge: '🔥 طرب متبل',
        description: 'طرب بلدي بالمنديل على الفحم',
        optionGroups: [
          {
            name: 'نوع الخبز والحجم',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'شامي', price: 0, isDefault: true },
              { name: 'بيتي بان', price: 0 },
            ],
          },
        ],
      },
      {
        name: 'كبدة إسكندراني',
        price: 15,
        description: 'كبدة إسكندراني بالثوم والفلفل الحار والليمون',
        optionGroups: [
          {
            name: 'نوع الخبز والحجم',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'فينو', price: 0, isDefault: true },
              { name: 'شامي', price: 15 },
              { name: 'بيتي بان', price: 15 },
              { name: 'دبل', price: 35 },
            ],
          },
        ],
      },
      {
        name: 'كبدة مشوية',
        price: 50,
        description: 'كبدة بلدي مشوية على الجريل',
        optionGroups: [
          {
            name: 'نوع الخبز والحجم',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'شامي', price: 0, isDefault: true },
              { name: 'بيتي بان', price: 0 },
              { name: 'دبل', price: 35 },
            ],
          },
        ],
      },
      {
        name: 'كلاوي',
        price: 20,
        description: 'كلاوي بلدي محمرة بتتبيلة عم عيسى السرية',
        optionGroups: [
          {
            name: 'نوع الخبز والحجم',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'فينو', price: 0, isDefault: true },
              { name: 'شامي', price: 15 },
              { name: 'بيتي بان', price: 15 },
              { name: 'دبل', price: 35 },
            ],
          },
        ],
      },
      {
        name: 'شيش طاووق',
        price: 80,
        description: 'أوراك دجاج متبلة ومشوية على الفحم',
        optionGroups: [
          {
            name: 'نوع الخبز والحجم',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'شامي', price: 0, isDefault: true },
              { name: 'بيتي بان', price: 0 },
              { name: 'دبل', price: 60 },
            ],
          },
        ],
      },
      {
        name: 'كفتة فراخ',
        price: 35,
        description: 'كفتة دجاج مشوية متبلة بالبهارات الخاصة',
        optionGroups: [
          {
            name: 'نوع الخبز والحجم',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'فينو', price: 0, isDefault: true },
              { name: 'شامي', price: 25 },
              { name: 'بيتي بان', price: 25 },
              { name: 'دبل', price: 65 },
            ],
          },
        ],
      },
      {
        name: 'صدور فيليه',
        price: 80,
        description: 'صدور دجاج فيليه متبلة ومشوية',
        optionGroups: [
          {
            name: 'نوع الخبز والحجم',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'شامي', price: 0, isDefault: true },
              { name: 'بيتي بان', price: 0 },
              { name: 'دبل', price: 60 },
            ],
          },
        ],
      },
      {
        name: 'شيش تندوري',
        price: 80,
        description: 'قطع دجاج متبلة بخلطة التندوري الهندية المميزة',
        optionGroups: [
          {
            name: 'نوع الخبز والحجم',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'شامي', price: 0, isDefault: true },
              { name: 'بيتي بان', price: 0 },
            ],
          },
        ],
      },
    ],
  },

  // 2. حواوشي
  {
    name: 'حواوشي',
    items: [
      {
        name: 'عيش باللحمة',
        price: 70,
        isTopSeller: true,
        badge: '🔥 الأكثر طلباً',
        description: 'حواوشي لحمة بلدي مقرمش بالخلطة الأصلية',
        optionGroups: [
          {
            name: 'الحجم',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'ويتش', price: 0, isDefault: true },
              { name: 'كبير', price: 70 },
              { name: 'كبير قوي', price: 130 },
            ],
          },
          {
            name: 'إضافات',
            isRequired: false,
            selectionType: 'multiple',
            options: [
              { name: 'وش بيتزا', price: 15 },
            ],
          },
        ],
      },
      {
        name: 'عيش بالسجق',
        price: 80,
        description: 'حواوشي سجق بلدي متبل بالبهارات الشرقية',
        optionGroups: [
          {
            name: 'الحجم',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'ويتش', price: 0, isDefault: true },
              { name: 'كبير', price: 80 },
              { name: 'كبير قوي', price: 140 },
            ],
          },
          {
            name: 'إضافات',
            isRequired: false,
            selectionType: 'multiple',
            options: [
              { name: 'وش بيتزا', price: 15 },
            ],
          },
        ],
      },
      {
        name: 'عيش بالبسطرمة',
        price: 80,
        description: 'حواوشي بلدي غني بشرائح البسطرمة والجبن',
        optionGroups: [
          {
            name: 'الحجم',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'ويتش', price: 0, isDefault: true },
              { name: 'كبير', price: 80 },
              { name: 'كبير قوي', price: 140 },
            ],
          },
          {
            name: 'إضافات',
            isRequired: false,
            selectionType: 'multiple',
            options: [
              { name: 'وش بيتزا', price: 15 },
            ],
          },
        ],
      },
      {
        name: 'عيش مشكل لحوم',
        price: 85,
        isFeatured: true,
        badge: 'مميز',
        description: 'ميكس لحم مفروم وسجق وبسطرمة',
        optionGroups: [
          {
            name: 'الحجم',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'ويتش', price: 0, isDefault: true },
              { name: 'كبير', price: 85 },
              { name: 'كبير قوي', price: 150 },
            ],
          },
          {
            name: 'إضافات',
            isRequired: false,
            selectionType: 'multiple',
            options: [
              { name: 'وش بيتزا', price: 15 },
            ],
          },
        ],
      },
      {
        name: 'عيش فراخ',
        price: 70,
        description: 'حواوشي دجاج متبل بخلطة البهارات والخضار',
        optionGroups: [
          {
            name: 'الحجم',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'ويتش', price: 0, isDefault: true },
              { name: 'كبير', price: 60 },
              { name: 'كبير قوي', price: 130 },
            ],
          },
          {
            name: 'إضافات',
            isRequired: false,
            selectionType: 'multiple',
            options: [
              { name: 'وش بيتزا', price: 15 },
            ],
          },
        ],
      },
      {
        name: 'عيش ميكس جبن',
        price: 85,
        description: 'توليفة غنية من الأجبان الذائبة داخل الخبز المقرمش',
        optionGroups: [
          {
            name: 'الحجم',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'ويتش', price: 0, isDefault: true },
              { name: 'كبير', price: 65 },
              { name: 'كبير قوي', price: 140 },
            ],
          },
          {
            name: 'إضافات',
            isRequired: false,
            selectionType: 'multiple',
            options: [
              { name: 'وش بيتزا', price: 15 },
            ],
          },
        ],
      },
      {
        name: 'عيش فاهيتا',
        price: 80,
        description: 'حواوشي بخلطة الفاهيتا المكسيكية والفلفل الملون',
        optionGroups: [
          {
            name: 'الحجم',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'ويتش', price: 0, isDefault: true },
              { name: 'كبير', price: 60 },
              { name: 'كبير قوي', price: 130 },
            ],
          },
          {
            name: 'إضافات',
            isRequired: false,
            selectionType: 'multiple',
            options: [
              { name: 'وش بيتزا', price: 15 },
            ],
          },
        ],
      },
      {
        name: 'حواوشي سكنتين (كبير)',
        price: 225,
        badge: 'اختراع عم عيسى',
        description: 'حواوشي سكنتين كبير مضاعف الحشوة ومحمص على الفحم',
      },
      {
        name: 'حواوشي 40 * 60 عائلي عملاق',
        price: 600,
        badge: 'حجم عائلي عملاق',
        description: 'رغيف حواوشي عملاق مقاس 40 * 60 سم للعزومات واللمات الكبيرة',
      },
      {
        name: 'حواوشي مصراوي',
        price: 100,
        description: 'حواوشي مصراوي على الطريقة الشعبية الأصيلة',
        optionGroups: [
          {
            name: 'نوع الحشوة',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'لحمة', price: 0, isDefault: true },
              { name: 'مشكل لحوم', price: 20 },
            ],
          },
        ],
      },
    ],
  },

  // 3. الوجبات
  {
    name: 'الوجبات',
    items: [
      {
        name: 'وجبة كفتة',
        price: 150,
        description: 'أرز مبهر وكفتة وبطاطس',
      },
      {
        name: 'وجبة عشاق اللحوم',
        price: 350,
        isTopSeller: true,
        badge: '🔥 الأكثر طلباً',
        description: 'سيخ كفتة + سيخ كباب + 2 سجق + 2 طرب + أرز + بطاطس مجهزة + مشروب بيج كولا + طحينة + مخلل',
      },
      {
        name: 'وجبة ميكس جريل',
        price: 275,
        isFeatured: true,
        badge: 'ميكس مشاوي',
        description: 'سيخ شيش + سيخ كباب + سيخ كفتة + أرز + بطاطس + مشروب بيج كولا + طحينة + مخلل',
      },
      {
        name: 'وجبة عشاق الفراخ',
        price: 250,
        description: 'سيخ كفتة فراخ + سيخ شيش طاووق + قطعة شيش تندوري + قطعة بانية صدر + أرز + بطاطس مجهزة + مشروب بيج كولا + ثومية + مخلل',
      },
      {
        name: 'وجبة شيش',
        price: 150,
        description: 'أرز بسمتي وفراخ شيش وبطاطس',
      },
      {
        name: 'وجبة التندوري ورك',
        price: 125,
        description: '3 قطع تندوري + أرز + بطاطس + ثومية + مخلل + بيج كولا + رغيف عيش',
      },
      {
        name: 'وجبة التندوري صدر',
        price: 150,
        description: '3 قطع تندوري + أرز + بطاطس + ثومية + مخلل + بيج كولا + رغيف عيش',
      },
      {
        name: 'وجبة ربع الملكي ورك',
        price: 125,
        description: 'ربع فرخة ورك + سيخ كفتة فراخ + أرز بسمتي + بطاطس + ثومية + مخلل',
      },
      {
        name: 'وجبة ربع الملكي صدر',
        price: 150,
        description: 'ربع فرخة صدر + سيخ كفتة فراخ + أرز بسمتي + بطاطس + ثومية + مخلل',
      },
      {
        name: 'وجبة جيماوية 1',
        price: 200,
        badge: 'دايت وصحي',
        description: '1 بانية + أرز + خضار مشوي',
      },
      {
        name: 'وجبة جيماوية 2',
        price: 200,
        badge: 'بروتين عالي',
        description: '2 سيخ كفتة + بانية + أرز + خضار مشوي',
      },
      {
        name: 'وجبة حمام',
        price: 240,
        badge: 'وجبة مميزة',
        description: 'فرد حمام محشي + أرز بالشعرية + بطاطس + 4 قطع محاشي منوعة منهم قطعة ممبار + قطعة رقاق + 1 بيج كولا',
      },
    ],
  },

  // 4. البوكسات
  {
    name: 'البوكسات',
    items: [
      {
        name: 'بوكس اللمة',
        price: 600,
        badge: 'عرض اللمة والعائلة',
        description: '3 كفتة شامي + 2 شيش شامي + 2 سجق شامي + 1 ويتش لحمة + 1 ويتش سجق + 2 باكت بطاطس + 4 بيج كولا هدية',
      },
      {
        name: 'بوكس الكينج',
        price: 300,
        isTopSeller: true,
        badge: '🔥 بوكس الكينج',
        description: '1 كفتة شامي + 1 طرب شامي + 1 كباب شامي + 1 باكت بطاطس + بيج كولا هدية',
      },
      {
        name: 'بوكس الرايق',
        price: 250,
        description: '1 شيش شامي + 1 كباب شامي + 1 كفتة شامي + 1 باكت بطاطس + بيج كولا هدية',
      },
      {
        name: 'بوكس الإسكندراني',
        price: 175,
        description: '2 كبدة إسكندراني شامي + 1 كلاوي شامي + 1 سجق إسكندراني شامي + 1 باكت بطاطس + بيج كولا هدية',
      },
      {
        name: 'بوكس دلع نفسك',
        price: 120,
        badge: 'أفضل توفير',
        description: '2 كبدة إسكندراني فينو + 1 كلاوي فينو + 1 سجق إسكندراني فينو + 1 باكت بطاطس + بيج كولا هدية',
      },
    ],
  },

  // 5. الصواني
  {
    name: 'الصواني',
    items: [
      {
        name: 'صينية التوينز',
        price: 499,
        isFeatured: true,
        badge: 'عرض التوينز',
        description: '2 فرد حمام محشي + أرز بالشعرية + 8 قطع محاشي منوعة منهم (2 ممبار) + 2 قطعة رقاق + طاجن ملوخية + سلطات (2 طحينة + 2 مخلل)',
      },
      {
        name: 'صينية عزومة شرف',
        price: 1111,
        badge: 'عزومة شرف',
        description: 'نص فرخة + ربع كفتة + ربع سجق + ربع لحمة + ثمن ممبار + ثمن ورق عنب + ثمن سمبوسك + حواوشي ويتش لحمة + أرز + سلطات + عيش + بطاطس',
      },
      {
        name: 'صينية الكينج',
        price: 1777,
        badge: 'صينية الكينج',
        description: 'نص كفتة + ربع روزبيف + ربع طرب + ربع كباب + ربع ممبار + ربع ورق عنب + ربع سمبوسك + أرز + سلطات + عيش + بطاطس',
      },
      {
        name: 'صينية عزومة عم عيسي',
        price: 1999,
        isTopSeller: true,
        badge: '🔥 توقيع عم عيسى',
        description: 'فرخة مشوية كاملة + نص كفتة + ربع سجق + ربع لحمة + ربع طرب + ربع ممبار + ربع ورق عنب + ربع سمبوسك + رغيف كامل حواوشي لحمة + أرز + سلطات + عيش + بطاطس',
      },
      {
        name: 'صينية الأكيلة',
        price: 3999,
        badge: 'للأكيلة فقط',
        description: 'نص كفتة + نص طرب + نص كباب + نص ريش ضاني + نص ريش بتلو + نص فلتو ويقدم مع تشكيلة متنوعة من السلطات والعيش ويقدم معها 2 شوربة لسان عصفور',
      },
      {
        name: 'صينية الوحوش',
        price: 4999,
        badge: '👑 صينية الوحوش العملاقة',
        description: 'بطة محشية + 6 فرد حمام + كيلو كفتة + طاجن لحمة بالبصل + 2 برام رز معمر باللحمة + 2 برام ملوخية + 2 برام بامية + كيلو مشكل محاشي ويقدم مع أرز خلطة بالمكسرات وشعرية بالمكسرات وتشكيلة متنوعة من السلطات والعيش ويقدم معها 4 شوربة هدية من اختيارك',
      },
    ],
  },

  // 6. المحاشي
  {
    name: 'المحاشي',
    items: [
      {
        name: 'ورق عنب',
        price: 110,
        description: 'ورق عنب بلدي بالخلطة الشرقية والليمون وزيت الزيتون',
        optionGroups: [
          {
            name: 'الوزن',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'ربع كيلو', price: 0, isDefault: true },
              { name: 'نصف كيلو', price: 100 },
              { name: 'كيلو', price: 300 },
            ],
          },
        ],
      },
      {
        name: 'ممبار',
        price: 120,
        isTopSeller: true,
        badge: '🔥 ممبار بلدي محمر',
        description: 'ممبار بلدي محشي بالخلطة ومحمر مقرمش',
        optionGroups: [
          {
            name: 'الوزن',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'ربع كيلو', price: 0, isDefault: true },
              { name: 'نصف كيلو', price: 100 },
              { name: 'كيلو', price: 300 },
            ],
          },
        ],
      },
      {
        name: 'محشي مشكل',
        price: 95,
        description: 'مشكل باذنجان وكوسة وفلفل بالخلطة السرية',
        optionGroups: [
          {
            name: 'الوزن',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'ربع كيلو', price: 0, isDefault: true },
              { name: 'نصف كيلو', price: 100 },
              { name: 'كيلو', price: 300 },
            ],
          },
        ],
      },
      {
        name: 'كرنب (موسمي)',
        price: 110,
        badge: 'موسمي',
        description: 'أصابع كرنب بلدي طازجة ومسبكة',
        optionGroups: [
          {
            name: 'الوزن',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'ربع كيلو', price: 0, isDefault: true },
              { name: 'نصف كيلو', price: 100 },
              { name: 'كيلو', price: 300 },
            ],
          },
        ],
      },
      {
        name: 'طبق محشي مشكل',
        price: 225,
        description: 'سرفيس محشي مشكل ورق عنب وكوسة وفلفل وممبار',
        optionGroups: [
          {
            name: 'الحجم',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'وسط', price: 0, isDefault: true },
              { name: 'كبير', price: 200 },
            ],
          },
        ],
      },
    ],
  },

  // 7. مشويات الطيور
  {
    name: 'مشويات الطيور',
    items: [
      {
        name: 'فراخ مشوية',
        price: 175,
        isTopSeller: true,
        badge: '🔥 فراخ مشوية على الفحم',
        description: 'دجاج متبل بخلطة الحاتي ومشوي على الفحم',
        optionGroups: [
          {
            name: 'الحجم',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'نصف فرخة', price: 0, isDefault: true },
              { name: 'فرخة كاملة', price: 155 },
            ],
          },
        ],
      },
      {
        name: 'فراخ تندوري',
        price: 190,
        description: 'دجاج بتتبيلة التندوري الهندية الحارة والمشوية',
        optionGroups: [
          {
            name: 'الحجم',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'نصف فرخة', price: 0, isDefault: true },
              { name: 'فرخة كاملة', price: 170 },
            ],
          },
        ],
      },
      {
        name: 'فراخ مسحب',
        price: 200,
        description: 'دجاج مسحب مخلي ومتبل ومشوي على الفحم',
        optionGroups: [
          {
            name: 'الحجم',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'نصف فرخة', price: 0, isDefault: true },
              { name: 'فرخة كاملة', price: 180 },
            ],
          },
        ],
      },
      {
        name: 'فراخ محشية',
        price: 450,
        badge: 'محشية خلطة',
        description: 'فرخة كاملة محشية أرز بالخلطة والمكسرات ومحمرة',
      },
      {
        name: 'بطة محشية',
        price: 760,
        badge: 'ملكي للعزومات',
        description: 'بطة كاملة محشية بأرز الكبد والقوانص والمكسرات',
      },
      {
        name: 'نصف بطة محمرة',
        price: 380,
        description: 'نصف بطة بلدي محمرة بالسمن البلدي',
      },
      {
        name: 'بطة كاملة محمرة',
        price: 760,
        description: 'بطة بلدي كاملة محمرة بالسمن البلدي',
      },
      {
        name: 'فرد حمام مشوي',
        price: 175,
        description: 'فرد حمام بلدي متبل ومشوي على الفحم',
      },
      {
        name: 'فرد حمام محشي (أرز - فريك)',
        price: 220,
        isTopSeller: true,
        badge: '🔥 حمام محشي بلدي',
        description: 'حمام بلدي محشي أرز أو فريك ومحمر ذهبي بالسمن البلدي',
        optionGroups: [
          {
            name: 'نوع الحشو',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'أرز', price: 0, isDefault: true },
              { name: 'فريك', price: 0 },
            ],
          },
        ],
      },
    ],
  },

  // 8. الشوربة
  {
    name: 'الشوربة',
    items: [
      {
        name: 'شوربة لسان عصفور',
        price: 65,
        description: 'شوربة لسان عصفور بمرقة اللحم الغنية',
      },
      {
        name: 'شوربة خضار بالشعرية',
        price: 85,
        description: 'شوربة خضار طازج بالشعرية المحمرة',
      },
      {
        name: 'شوربة عدس',
        price: 85,
        description: 'شوربة عدس أصفر غنية بالبهارات والخبز المحمص',
      },
      {
        name: 'شوربة فراخ بالكريمة والمشروم',
        price: 140,
        description: 'شوربة كريمية غنية بقطع الدجاج الطازج والمشروم',
      },
      {
        name: 'شوربة كوارع',
        price: 170,
        isTopSeller: true,
        badge: 'مشروب الطاقة',
        description: 'شوربة كوارع بلدي دسمة ومتبلة بالليمون والثوم',
      },
      {
        name: 'شوربة حمام',
        price: 170,
        description: 'شوربة حمام صافية ببهارات الحبهان والمستكة',
      },
    ],
  },

  // 9. إسكندراني عم عيسي
  {
    name: 'إسكندراني عم عيسي',
    items: [
      {
        name: 'كبدة إسكندراني',
        price: 140,
        isTopSeller: true,
        badge: 'إسكندراني أصلي',
        description: 'كبدة إسكندراني طازجة بالثوم والفلفل الأخضر الحامي والخلطة الأصلية',
        optionGroups: [
          {
            name: 'الوزن',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'ربع كيلو', price: 0, isDefault: true },
              { name: 'نصف كيلو', price: 120 },
            ],
          },
        ],
      },
      {
        name: 'كلاوي إسكندراني',
        price: 140,
        description: 'كلاوي بتشويحة إسكندرانية حامية ومميزة',
        optionGroups: [
          {
            name: 'الوزن',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'ربع كيلو', price: 0, isDefault: true },
              { name: 'نصف كيلو', price: 120 },
            ],
          },
        ],
      },
      {
        name: 'سجق إسكندراني',
        price: 210,
        isTopSeller: true,
        description: 'سجق بلدي شرقي بالصلصة والفلفل والطماطم على الطريقة الإسكندرانية',
        optionGroups: [
          {
            name: 'الوزن',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'ربع كيلو', price: 0, isDefault: true },
              { name: 'نصف كيلو', price: 200 },
            ],
          },
        ],
      },
    ],
  },

  // 10. الأرز والمكرونة
  {
    name: 'الأرز والمكرونة',
    items: [
      {
        name: 'ارز معمر ساده',
        price: 90,
        description: 'برام أرز معمر فلاحي بالقشطة والحليب البلدي',
      },
      {
        name: 'ارز معمر باللحمه',
        price: 180,
        isTopSeller: true,
        badge: '🔥 معمر باللحمة',
        description: 'برام أرز معمر غني بقطع اللحم البلدي والقشطة الفلاحي',
      },
      {
        name: 'ارز ابيض ساده او بالشعرية',
        price: 50,
        description: 'أرز مصري مفلفل بالسمن البلدي',
        optionGroups: [
          {
            name: 'النوع',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'أرز أبيض سادة', price: 0, isDefault: true },
              { name: 'أرز بالشعرية', price: 0 },
            ],
          },
        ],
      },
      {
        name: 'ارز خلطة (مبهر) / بسمتي',
        price: 50,
        description: 'أرز خلطة مبهر غني بالتوابل والزعفران',
        optionGroups: [
          {
            name: 'النوع',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'أرز خلطة مبهر', price: 0, isDefault: true },
              { name: 'أرز بسمتي', price: 0 },
            ],
          },
        ],
      },
      {
        name: 'برام شعرية بالمكسرات',
        price: 85,
        description: 'شعرية محمرة بالسمن البلدي والمكسرات المحمصة',
      },
      {
        name: 'مكرونه فرن بشاميل',
        price: 160,
        description: 'طاجن مكرونة بالبشاميل الغني واللحم المفروم المتبل',
      },
      {
        name: 'مكرونة الفريدو',
        price: 195,
        description: 'مكرونة بالوايت صوص الكريمي وقطع الدجاج والمشروم',
      },
      {
        name: 'مكرونة بلونيز',
        price: 170,
        description: 'مكرونة بالصوص الأحمر واللحم المفروم المتبل',
      },
      {
        name: 'مكرونة بينا ارابياتا',
        price: 85,
        description: 'مكرونة بالصلصة الحارة والريحان والثوم',
      },
      {
        name: 'مكرونة نيجرسكو',
        price: 180,
        description: 'مكرونة نيجريسكو بالفراخ والزيتون والموتزاريلا الذائبة',
      },
      {
        name: 'مبكبه سادة',
        price: 80,
        description: 'مبكبكة ليبية حارة سادة بالصلصة المسبكة',
      },
      {
        name: 'مبكبه لحم شمبري',
        price: 315,
        description: 'مبكبكة حارة بقطع اللحم الشمبري البلدي',
        optionGroups: [
          {
            name: 'الوزن',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'ربع كيلو', price: 0, isDefault: true },
              { name: 'نصف كيلو', price: 315 },
              { name: 'كيلو', price: 945 },
            ],
          },
        ],
      },
      {
        name: 'مبكبه لحم ضاني',
        price: 340,
        description: 'مبكبكة بقطع اللحم الضاني الموزة والصلصة المتبلة',
        optionGroups: [
          {
            name: 'الوزن',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'ربع كيلو', price: 0, isDefault: true },
              { name: 'نصف كيلو', price: 340 },
              { name: 'كيلو', price: 1020 },
            ],
          },
        ],
      },
    ],
  },

  // 11. أوزان المشويات
  {
    name: 'أوزان المشويات',
    items: [
      {
        name: 'كباب بتلو',
        price: 500,
        badge: 'بتلو بلدي',
        description: 'كباب بتلو طري ومتبل على الفحم',
        optionGroups: [
          {
            name: 'الوزن',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'ثلث كيلو', price: 0, isDefault: true },
              { name: 'نصف كيلو', price: 210 },
            ],
          },
        ],
      },
      {
        name: 'كباب ضاني',
        price: 530,
        badge: 'ضاني فاخر',
        description: 'كباب ضاني مشوي على الفحم بالنكهة الأصلية',
        optionGroups: [
          {
            name: 'الوزن',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'ثلث كيلو', price: 0, isDefault: true },
              { name: 'نصف كيلو', price: 230 },
            ],
          },
        ],
      },
      {
        name: 'تريبيانكو',
        price: 430,
        description: 'لحم تريبيانكو متبل ومشوي بالجرام',
        optionGroups: [
          {
            name: 'الوزن',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'ثلث كيلو', price: 0, isDefault: true },
              { name: 'نصف كيلو', price: 180 },
            ],
          },
        ],
      },
      {
        name: 'ريش بتلو',
        price: 500,
        description: 'ريش بتلو طازجة مشوية بعناية على الفحم',
        optionGroups: [
          {
            name: 'الوزن',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'ثلث كيلو', price: 0, isDefault: true },
              { name: 'نصف كيلو', price: 210 },
            ],
          },
        ],
      },
      {
        name: 'ريش ضاني',
        price: 530,
        isTopSeller: true,
        badge: '🔥 ريش ضاني ممتازة',
        description: 'ريش ضاني بلدي مشوية على الفحم بنكهة حاتية',
        optionGroups: [
          {
            name: 'الوزن',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'ثلث كيلو', price: 0, isDefault: true },
              { name: 'نصف كيلو', price: 230 },
            ],
          },
        ],
      },
      {
        name: 'فلتو شمبري',
        price: 430,
        description: 'قطع لحم فلتو شمبري طرية لا تحتاج مجهود في المضغ',
        optionGroups: [
          {
            name: 'الوزن',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'ثلث كيلو', price: 0, isDefault: true },
              { name: 'نصف كيلو', price: 180 },
            ],
          },
        ],
      },
      {
        name: 'روزبيف - انتركوت',
        price: 390,
        description: 'قطع لحم روزبيف وانتركوت متبلة ومشوية',
        optionGroups: [
          {
            name: 'الوزن',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'ثلث كيلو', price: 0, isDefault: true },
              { name: 'نصف كيلو', price: 170 },
            ],
          },
        ],
      },
      {
        name: 'طرب',
        price: 430,
        isTopSeller: true,
        badge: '🔥 طرب على الفحم',
        description: 'طرب بلدي ملفوف بالمنديل الطازج',
        optionGroups: [
          {
            name: 'الوزن',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'ثلث كيلو', price: 0, isDefault: true },
              { name: 'نصف كيلو', price: 180 },
            ],
          },
        ],
      },
      {
        name: 'طرب بالفسدق',
        price: 500,
        badge: 'اختراع عم عيسى',
        description: 'طرب مشوي محشي بحبات الفستق الحلبي المقرمشة',
        optionGroups: [
          {
            name: 'الوزن',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'ثلث كيلو', price: 0, isDefault: true },
              { name: 'نصف كيلو', price: 210 },
            ],
          },
        ],
      },
      {
        name: 'كفتة مشوية',
        price: 285,
        isTopSeller: true,
        badge: '🔥 الأكثر طلباً',
        description: 'كفتة حاتي متبلة بالبهارات الخاصة ومفرومة على أصولها',
        optionGroups: [
          {
            name: 'الوزن',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'ثلث كيلو', price: 0, isDefault: true },
              { name: 'نصف كيلو', price: 125 },
            ],
          },
        ],
      },
      {
        name: 'سجق مشوي',
        price: 285,
        description: 'سجق بلدي بالخلطة الخاصة مشوي على الفحم',
        optionGroups: [
          {
            name: 'الوزن',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'ثلث كيلو', price: 0, isDefault: true },
              { name: 'نصف كيلو', price: 125 },
            ],
          },
        ],
      },
      {
        name: 'كلاوي مشوية',
        price: 220,
        description: 'كلاوي مشوية على الجريل بالملح والفلفل الأسود',
        optionGroups: [
          {
            name: 'الوزن',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'ثلث كيلو', price: 0, isDefault: true },
              { name: 'نصف كيلو', price: 90 },
            ],
          },
        ],
      },
      {
        name: 'كبده مشوية',
        price: 220,
        description: 'كبدة بلدي مشوية على الجريل برشة ليمون',
        optionGroups: [
          {
            name: 'الوزن',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'ثلث كيلو', price: 0, isDefault: true },
              { name: 'نصف كيلو', price: 90 },
            ],
          },
        ],
      },
      {
        name: 'مزاليكا',
        price: 220,
        description: 'مزاليكا كبدة وقوانص وقلوب مشوية ومتبلة',
        optionGroups: [
          {
            name: 'الوزن',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'ثلث كيلو', price: 0, isDefault: true },
              { name: 'نصف كيلو', price: 90 },
            ],
          },
        ],
      },
      {
        name: 'كفتة فراخ',
        price: 250,
        description: 'كفتة دجاج متبلة بالزعتر والبصل ومشوية على الفحم',
        optionGroups: [
          {
            name: 'الوزن',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'ثلث كيلو', price: 0, isDefault: true },
              { name: 'نصف كيلو', price: 110 },
            ],
          },
        ],
      },
      {
        name: 'شيش طاووق',
        price: 290,
        description: 'شيش طاووق دجاج مشوي متبل بعصير الليمون والبهارات',
        optionGroups: [
          {
            name: 'الوزن',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'ثلث كيلو', price: 0, isDefault: true },
              { name: 'نصف كيلو', price: 120 },
            ],
          },
        ],
      },
      {
        name: 'فيليه صدور دجاج',
        price: 295,
        description: 'صدور دجاج فيليه طازجة مشوية بدون دهون',
        optionGroups: [
          {
            name: 'الوزن',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'ثلث كيلو', price: 0, isDefault: true },
              { name: 'نصف كيلو', price: 125 },
            ],
          },
        ],
      },
      {
        name: 'مشكل مشاوي (كفتة ولحمة وسجق)',
        price: 390,
        isFeatured: true,
        badge: 'مشكل حاتي',
        description: 'تشكيلة مشويات فاخرة عبارة عن كفتة ولحمة وسجق على الفحم',
        optionGroups: [
          {
            name: 'الوزن',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'ثلث كيلو', price: 0, isDefault: true },
              { name: 'نصف كيلو', price: 170 },
            ],
          },
        ],
      },
    ],
  },

  // 12. الطواجن
  {
    name: 'الطواجن',
    items: [
      { name: 'خضار سادة', price: 95, description: 'طاجن خضار مشكل بالصلصة المسبكة في الفرن' },
      { name: 'بامية سادة', price: 95, description: 'طاجن بامية طازجة بالصلصة والثوم والكسبرة' },
      { name: 'ملوخية سادة', price: 85, description: 'طاجن ملوخية خضراء بلدي بطشة الثوم والكسبرة' },
      { name: 'بطاطس سادة', price: 85, description: 'طاجن شرائح بطاطس في الفرن بالصلصة الفلاحي' },
      { name: 'خضار باللحمة', price: 260, description: 'طاجن خضار مشكل بقطع اللحم البلدي' },
      { name: 'بطاطس باللحمة', price: 250, description: 'طاجن بطاطس بالفرن مع قطع لحم بلدي طري' },
      { name: 'بامية باللحمة', price: 260, isTopSeller: true, description: 'طاجن بامية بلدي بقطع اللحم والصلصة المسبكة' },
      { name: 'ملوخية باللحمة', price: 250, description: 'طاجن ملوخية خضراء بقطع اللحم البلدي' },
      { name: 'ورق عنب بالكوارع', price: 360, isTopSeller: true, badge: '🔥 طاجن جبار', description: 'طاجن ورق عنب محشي متسقي بمرقة الكوارع مع قطع الكوارع المخلية' },
      { name: 'ورق عنب بالعكاوي', price: 340, isTopSeller: true, badge: '🔥 طاجن عكاوي', description: 'طاجن ورق عنب مع قطع العكاوي البلدي المتبلة في الفرن' },
      { name: 'كرنب بالكوارع (موسمي)', price: 360, badge: 'موسمي', description: 'طاجن محشي كرنب مع قطع الكوارع المخلية الدسمة' },
      { name: 'لحمة بالبصل', price: 320, isFeatured: true, description: 'طاجن لحم بلدي مكرمل بالبصل والتوابل الشرقية' },
      { name: 'لسان عصفور باللحمة', price: 300, description: 'طاجن لسان عصفور بالفرن بقطع اللحم البلدي' },
      { name: 'مسقعة باللحمة المفرومة', price: 250, description: 'طاجن مسقعة بالباذنجان والفلفل واللحم المفروم والصلصة' },
      { name: 'طاجن كوارع', price: 390, badge: 'كوارع فرن', description: 'طاجن كوارع بلدي في الفرن بالصلصة والخل والثوم' },
      { name: 'طاجن عكاوي', price: 380, badge: 'عكاوي بلدي', description: 'طاجن عكاوي بلدي بالبصل والبهارات في الفرن' },
      {
        name: 'ورقة لحمة اوزان',
        price: 330,
        badge: 'ورقة لحمة عم عيسى',
        description: 'ورقة لحم بلدي متبلة بالخضار والبهارات ومسواة على نار هادئة',
        optionGroups: [
          {
            name: 'الوزن',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'ربع كيلو', price: 0, isDefault: true },
              { name: 'نصف كيلو', price: 300 },
              { name: 'كيلو', price: 930 },
            ],
          },
        ],
      },
    ],
  },

  // 13. فتة المعلم
  {
    name: 'فتة المعلم',
    items: [
      {
        name: 'فتة كوارع',
        price: 360,
        badge: 'فتة كوارع',
        description: 'فتة أرز مصري وعيش محمص بالخل والثوم مع قطع الكوارع المخلية',
      },
      {
        name: 'فتة مصرية باللحمه',
        price: 390,
        isTopSeller: true,
        badge: '🔥 فتة مصرية أصيلة',
        description: 'فتة مصرية بالعيش المحمص والصلصة والخل والثوم مع قطع لحم بلدي محمر',
      },
      {
        name: 'فتة موزه بتلو',
        price: 550,
        badge: 'موزة بتلو ملكي',
        description: 'فتة مصرية فاخرة تعلوها موزة بتلو طرية دايبة في الفم',
      },
      {
        name: 'فتة موزه ضاني',
        price: 575,
        badge: 'موزة ضاني فاخرة',
        description: 'فتة مصرية أصيلة بموزة ضاني بلدي محمرة بالسمن البلدي',
      },
    ],
  },

  // 14. فتة الحبايب
  {
    name: 'فتة الحبايب',
    items: [
      {
        name: 'فتة تريبيانكو',
        price: 150,
        description: 'أرز أبيض ولحمة وبطاطس وعيش محمص ومخلل',
      },
      {
        name: 'فتة بانيه الكينج',
        price: 125,
        description: 'أرز بسمتي وفراخ وبطاطس وعيش محمص ومخلل',
      },
    ],
  },

  // 15. وجبات الأطفال
  {
    name: 'وجبات الأطفال',
    items: [
      {
        name: 'وجبة كفتة اطفال',
        price: 130,
        description: 'أرز مبهر وسيخ كفتة وبطاطس ولعبة أطفال',
      },
      {
        name: 'وجبة شيش اطفال',
        price: 150,
        description: 'أرز بسمتي وسيخ شيش وبطاطس ولعبة أطفال',
      },
    ],
  },

  // 16. المقبلات
  {
    name: 'المقبلات',
    items: [
      {
        name: 'صينية جلاش رول باللحمة المفرومة',
        price: 125,
        description: 'أصابع جلاش رول مورقة محشية باللحم المفروم المتبل',
        optionGroups: [
          {
            name: 'الحجم',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'وسط', price: 0, isDefault: true },
              { name: 'كبير', price: 100 },
            ],
          },
        ],
      },
      {
        name: 'رقاق شرقي',
        price: 125,
        description: 'صينية رقاق شرقي بالسمن البلدي والشوربة واللحم المفروم',
        optionGroups: [
          {
            name: 'الحجم',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'وسط', price: 0, isDefault: true },
              { name: 'كبير', price: 100 },
            ],
          },
        ],
      },
      {
        name: 'خضار سوتيه او مشوي',
        price: 80,
        description: 'تشكيلة خضار طازجة سوتيه خفيفة أو مشوية',
        optionGroups: [
          {
            name: 'طريقة التحضير',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'خضار سوتيه', price: 0, isDefault: true },
              { name: 'خضار مشوي', price: 0 },
            ],
          },
        ],
      },
      {
        name: 'طبق مقبلات مشكل',
        price: 215,
        badge: 'مكس مقبلات',
        description: 'تشكيلة مشكلة من السمبوسك والجلاش والرقاق والبطاطس',
        optionGroups: [
          {
            name: 'الحجم',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'وسط', price: 0, isDefault: true },
              { name: 'كبير', price: 210 },
            ],
          },
        ],
      },
      {
        name: 'باكت بطاطس',
        price: 25,
        description: 'بطاطس مقلية مقرمشة مع بهارات عم عيسى',
        optionGroups: [
          {
            name: 'الحجم',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'صغير', price: 0, isDefault: true },
              { name: 'كبير', price: 25 },
            ],
          },
        ],
      },
      {
        name: 'سمبوسك جبنة',
        price: 90,
        description: 'سمبوسك مقرمشة محشية بميكس الجبن والأعشاب',
        optionGroups: [
          {
            name: 'الوزن',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'ربع كيلو', price: 0, isDefault: true },
              { name: 'نصف كيلو', price: 90 },
              { name: 'كيلو', price: 270 },
            ],
          },
        ],
      },
      {
        name: 'سمبوسك لحمة',
        price: 120,
        description: 'سمبوسك محشية باللحم المفروم والبصل والبهارات',
        optionGroups: [
          {
            name: 'الوزن',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'ربع كيلو', price: 0, isDefault: true },
              { name: 'نصف كيلو', price: 120 },
              { name: 'كيلو', price: 360 },
            ],
          },
        ],
      },
      {
        name: 'سمبوسك بسطرمة',
        price: 130,
        description: 'سمبوسك بالبسطرمة والجبن الموتزاريلا',
        optionGroups: [
          {
            name: 'الوزن',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'ربع كيلو', price: 0, isDefault: true },
              { name: 'نصف كيلو', price: 120 },
              { name: 'كيلو', price: 370 },
            ],
          },
        ],
      },
    ],
  },

  // 17. السلطات
  {
    name: 'السلطات',
    items: [
      { name: 'طحينة', price: 20, description: 'طحينة سمسم بيضاء متبلة بالخل والكمون والليمون' },
      { name: 'بابا غنوج', price: 25, description: 'باذنجان مشوي على الفحم مهروس بالطحينة والثوم' },
      { name: 'ثومية', price: 20, description: 'ثومية كريمية ناعمة غنية بالنكهة' },
      { name: 'سلطة خضراء بلدي', price: 20, description: 'طماطم وخيار وخس وجرجير بدريسنج الليمون والكمون' },
      { name: 'سلطة حاتي', price: 25, description: 'سلطة خضار بلدي مع ماء السلطة المتبل (الويسكي المصري)' },
      { name: 'مخلل مشكل', price: 20, description: 'تشكيلة مخللات بلدية مقرمشة ولذيذة' },
      { name: 'فلفل أبو قلب جامد', price: 20, description: 'فلفل حار مخلل لعشاق الشطة' },
      { name: 'صوص رانش', price: 25, description: 'صوص رانش غني بالأعشاب' },
      { name: 'جبنة قديمة', price: 25, description: 'جبنة قديمة فلاحي بالطماطم وزيت الزيتون والطحينة' },
      { name: 'كلو سلو', price: 25, description: 'سلطة كرنب وجزر مبشور بالمايونيز والعسل' },
    ],
  },

  // 18. أضافات
  {
    name: 'أضافات',
    items: [
      { name: 'مياه معدنية', price: 10, description: 'زجاجة مياه معدنية طبيعية نقية' },
      { name: 'أضافة مكسرات', price: 30, description: 'مكسرات مشكلة محمصة (لوز وكاجو وفول سوداني)' },
      {
        name: 'مشروب غازي (بيبسي - ميرندا - سفن)',
        price: 25,
        description: 'كانز مشروب غازي بارد ومنعش',
        optionGroups: [
          {
            name: 'نوع المشروب',
            isRequired: true,
            selectionType: 'single',
            options: [
              { name: 'بيبسي', price: 0, isDefault: true },
              { name: 'ميرندا برتقال', price: 0 },
              { name: 'سفن أب', price: 0 },
            ],
          },
        ],
      },
      { name: 'عيش (5) أرغفة', price: 25, description: '5 أرغفة عيش بلدي طازج وساخن من الفرن' },
    ],
  },
]

async function retry<T>(fn: () => Promise<T>, retries = 5, delayMs = 2000): Promise<T> {
  let attempt = 0
  while (attempt < retries) {
    try {
      return await fn()
    } catch (err: any) {
      attempt++
      console.warn(`⚠️ Operation failed (attempt ${attempt}/${retries}): ${err?.message || err}. Reconnecting in ${delayMs}ms...`)
      if (attempt >= retries) throw err
      try {
        await prisma.$disconnect()
      } catch (_) {}
      await new Promise((r) => setTimeout(r, delayMs))
    }
  }
  throw new Error('Retry exhausted')
}

async function seedAmEissa() {
  console.log('🚀 Starting Am Eissa Full Menu Seed with 100% Zero-Error Accuracy...')

  const restaurant = await retry(() =>
    prisma.restaurant.findUnique({
      where: { slug: 'am-eissa' },
      include: {
        branches: true,
      },
    })
  )

  if (!restaurant) {
    throw new Error('Restaurant am-eissa not found in database!')
  }

  const defaultBranchId = restaurant.branches[0]?.id

  console.log(`Found restaurant: ${restaurant.name} (${restaurant.id}) with ${restaurant.branches.length} branches.`)

  // 1. Delete all existing MenuCategories for this restaurant (cascades to items, optionGroups, options, etc.)
  console.log('🧹 Cleaning old menu categories and items for am-eissa...')
  await retry(() =>
    prisma.menuCategory.deleteMany({
      where: { restaurantId: restaurant.id },
    })
  )

  // 2. Iterate and create each category and item
  let totalCategories = 0
  let totalItems = 0
  let totalOptionGroups = 0
  let totalOptions = 0
  const createdItemIds: string[] = []

  for (let cIdx = 0; cIdx < menuCategoriesData.length; cIdx++) {
    const catDef = menuCategoriesData[cIdx]
    const orderNum = cIdx + 1

    const category = await retry(() =>
      prisma.menuCategory.create({
        data: {
          restaurantId: restaurant.id,
          branchId: defaultBranchId || null,
          name: catDef.name,
          order: orderNum,
        },
      })
    )
    totalCategories++

    for (const itemDef of catDef.items) {
      // Build nested optionGroups create data
      const optionGroupsCreate = itemDef.optionGroups && itemDef.optionGroups.length > 0
        ? {
            create: itemDef.optionGroups.map((g, gIdx) => ({
              name: g.name,
              selectionType: g.selectionType || 'single',
              isRequired: g.isRequired !== undefined ? g.isRequired : false,
              order: gIdx + 1,
              options: {
                create: g.options.map((o, oIdx) => ({
                  name: o.name,
                  price: o.price,
                  isDefault: o.isDefault || false,
                  order: oIdx + 1,
                })),
              },
            })),
          }
        : undefined

      const createdItem = await retry(() =>
        prisma.menuItem.create({
          data: {
            categoryId: category.id,
            name: itemDef.name,
            description: itemDef.description || null,
            price: itemDef.price,
            originalPrice: itemDef.originalPrice || null,
            isTopSeller: itemDef.isTopSeller || false,
            isFeatured: itemDef.isFeatured || false,
            badge: itemDef.badge || null,
            image: itemDef.image || null,
            isAvailable: true,
            optionGroups: optionGroupsCreate,
          },
        })
      )
      totalItems++
      createdItemIds.push(createdItem.id)

      if (itemDef.optionGroups) {
        totalOptionGroups += itemDef.optionGroups.length
        totalOptions += itemDef.optionGroups.reduce((acc, g) => acc + g.options.length, 0)
      }
    }

    console.log(`✅ Seeded Category: [${catDef.name}] with ${catDef.items.length} items.`)
  }

  // 3. Optional: Bulk create branch menu items in one batch
  if (restaurant.branches.length > 0 && createdItemIds.length > 0) {
    console.log(`📦 Linking ${createdItemIds.length} items to ${restaurant.branches.length} branches...`)
    const branchItemData: { branchId: string; menuItemId: string; isAvailable: boolean }[] = []
    for (const b of restaurant.branches) {
      for (const itemId of createdItemIds) {
        branchItemData.push({ branchId: b.id, menuItemId: itemId, isAvailable: true })
      }
    }
    // Batch in chunks of 50
    for (let i = 0; i < branchItemData.length; i += 50) {
      const chunk = branchItemData.slice(i, i + 50)
      await retry(() =>
        prisma.branchMenuItem.createMany({
          data: chunk,
          skipDuplicates: true,
        })
      )
    }
    console.log('✅ Branch links completed.')
  }

  console.log('\n========================================')
  console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!')
  console.log(`- Categories Created: ${totalCategories}`)
  console.log(`- Menu Items Created: ${totalItems}`)
  console.log(`- Option Groups Created: ${totalOptionGroups}`)
  console.log(`- Options Created: ${totalOptions}`)
  console.log('========================================')
}

seedAmEissa()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
