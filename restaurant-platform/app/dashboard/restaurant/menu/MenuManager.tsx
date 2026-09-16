"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import * as XLSX from "xlsx"
import {
  Plus,
  Trash2,
  Edit2,
  Utensils,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  X,
  FileSpreadsheet,
  Download,
  Upload,
  FileText,
  Layers,
  Tag,
  Check,
} from "lucide-react"

interface MenuItem {
  id: string
  name: string
  description?: string | null
  price: number
  image?: string | null
  isAvailable: boolean
}

interface MenuCategory {
  id: string
  name: string
  order: number
  items: MenuItem[]
}

interface MenuManagerProps {
  restaurantId: string
  branchId: string
  restaurantName: string
  initialCategories: MenuCategory[]
}

export function MenuManager({
  restaurantId,
  branchId,
  restaurantName,
  initialCategories,
}: MenuManagerProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [categories, setCategories] = useState<MenuCategory[]>(initialCategories)

  // New Category State
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")

  // Edit Category State
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editCategoryName, setEditCategoryName] = useState("")

  // New/Edit Item State
  const [activeItemModal, setActiveItemModal] = useState<{
    mode: "add" | "edit"
    categoryId: string
    item?: MenuItem
  } | null>(null)

  const [itemName, setItemName] = useState("")
  const [itemDescription, setItemDescription] = useState("")
  const [itemPrice, setItemPrice] = useState("")
  const [itemImage, setItemImage] = useState("")
  const [itemAvailable, setItemAvailable] = useState(true)

  // Item Options / Modifiers State
  const [activeOptionsModal, setActiveOptionsModal] = useState<{
    itemId: string
    itemName: string
    groups: any[]
  } | null>(null)

  const [optGroupName, setOptGroupName] = useState("")
  const [optSelectionType, setOptSelectionType] = useState<"single" | "multiple">("single")
  const [optIsRequired, setOptIsRequired] = useState(false)
  const [optItems, setOptItems] = useState<{ name: string; price: string }[]>([
    { name: "ثُمُن كِيلو", price: "0" },
    { name: "رُبُع كِيلو", price: "50" },
    { name: "نِصْف كِيلو", price: "120" },
    { name: "كِيلو كامل", price: "240" },
  ])
  const [loadingOptions, setLoadingOptions] = useState(false)

  const openManageOptionsModal = async (itemId: string, itemName: string) => {
    setLoadingOptions(true)
    setError("")
    setOptGroupName("الوزن / الحجم")
    setOptSelectionType("single")
    setOptIsRequired(true)
    setOptItems([
      { name: "ثُمُن كِيلو", price: "0" },
      { name: "رُبُع كِيلو", price: "50" },
      { name: "نِصْف كِيلو", price: "120" },
      { name: "كِيلو كامل", price: "240" },
    ])

    try {
      const res = await fetch(`/api/items/${itemId}/options`)
      if (res.ok) {
        const data = await res.json()
        setActiveOptionsModal({
          itemId,
          itemName,
          groups: data.groups || [],
        })
      } else {
        setActiveOptionsModal({ itemId, itemName, groups: [] })
      }
    } catch (err) {
      setActiveOptionsModal({ itemId, itemName, groups: [] })
    } finally {
      setLoadingOptions(false)
    }
  }

  const handleSaveOptionGroup = async () => {
    if (!activeOptionsModal || !optGroupName.trim()) return
    setLoadingOptions(true)
    setError("")

    try {
      const validOptions = optItems
        .filter((o) => o.name.trim().length > 0)
        .map((o) => ({
          name: o.name.trim(),
          price: parseFloat(o.price) || 0,
        }))

      const res = await fetch(`/api/items/${activeOptionsModal.itemId}/options`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: optGroupName.trim(),
          selectionType: optSelectionType,
          isRequired: optIsRequired,
          options: validOptions,
        }),
      })

      const data = await res.json()
      if (res.ok && data.group) {
        setActiveOptionsModal((prev) =>
          prev
            ? {
                ...prev,
                groups: [...prev.groups, data.group],
              }
            : null
        )
        setSuccess("تم إضافة مجموعة الخيارات والأوزان بنجاح 🎉")
        setOptGroupName("")
      } else {
        setError(data.error || "حدث خطأ أثناء حفظ الخيارات")
      }
    } catch (err) {
      setError("حدث خطأ أثناء حفظ الخيارات")
    } finally {
      setLoadingOptions(false)
    }
  }

  const handleDeleteOptionGroup = async (groupId: string) => {
    if (!activeOptionsModal) return
    setLoadingOptions(true)

    try {
      const res = await fetch(`/api/items/${activeOptionsModal.itemId}/options?groupId=${groupId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setActiveOptionsModal((prev) =>
          prev
            ? {
                ...prev,
                groups: prev.groups.filter((g) => g.id !== groupId),
              }
            : null
        )
        setSuccess("تم حذف مجموعة الخيارات")
      }
    } catch (err) {
      setError("حدث خطأ أثناء الحذف")
    } finally {
      setLoadingOptions(false)
    }
  }

  // Excel Import Format State ("arabic" | "product_feed")
  const [menuFormat, setMenuFormat] = useState<"arabic" | "product_feed">("arabic")

  // Excel Import State
  const [importing, setImporting] = useState(false)
  const [importSummary, setImportSummary] = useState<{
    categoriesCreated: number
    itemsAdded: number
    itemsUpdated?: number
    errors: string[]
  } | null>(null)

  // Collapsed categories state
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(() => {
    const obj: Record<string, boolean> = {}
    initialCategories.forEach((c) => (obj[c.id] = true))
    return obj
  })

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  const toggleCategoryAccordion = (catId: string) => {
    setOpenCategories((prev) => ({ ...prev, [catId]: !prev[catId] }))
  }

  // --- Category Actions ---
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const res = await fetch(`/api/branches/${branchId}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName, order: categories.length + 1 }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "حدث خطأ أثناء إضافة القسم")
      } else {
        setCategories((prev) => [...prev, data.category])
        setOpenCategories((prev) => ({ ...prev, [data.category.id]: true }))
        setNewCategoryName("")
        setShowAddCategory(false)
        setSuccess("تم إضافة القسم الجديد بنجاح 🎉")
        router.refresh()
      }
    } catch (err) {
      setError("حدث خطأ أثناء الاتصال بالسيرفر")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateCategory = async (categoryId: string) => {
    if (!editCategoryName.trim()) return
    setError("")
    setSuccess("")

    try {
      const res = await fetch(`/api/categories/${categoryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editCategoryName }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "حدث خطأ أثناء تعديل القسم")
      } else {
        setCategories((prev) =>
          prev.map((c) => (c.id === categoryId ? { ...c, name: editCategoryName } : c))
        )
        setEditingCategoryId(null)
        setSuccess("تم تعديل اسم القسم بنجاح")
        router.refresh()
      }
    } catch (err) {
      setError("حدث خطأ أثناء التعديل")
    }
  }

  const handleDeleteCategory = async (categoryId: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف القسم "${name}" بجميع الأصناف التابعة له؟`)) return

    setError("")
    setSuccess("")

    try {
      const res = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE",
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "حدث خطأ أثناء حذف القسم")
      } else {
        setCategories((prev) => prev.filter((c) => c.id !== categoryId))
        setSuccess("تم حذف القسم وأصنافه بنجاح")
        router.refresh()
      }
    } catch (err) {
      setError("حدث خطأ أثناء الحذف")
    }
  }

  // --- Item Modal Controls ---
  const openAddItemModal = (categoryId: string) => {
    setItemName("")
    setItemDescription("")
    setItemPrice("")
    setItemImage("")
    setItemAvailable(true)
    setActiveItemModal({ mode: "add", categoryId })
  }

  const openEditItemModal = (categoryId: string, item: MenuItem) => {
    setItemName(item.name)
    setItemDescription(item.description || "")
    setItemPrice(item.price.toString())
    setItemImage(item.image || "")
    setItemAvailable(item.isAvailable)
    setActiveItemModal({ mode: "edit", categoryId, item })
  }

  const handleItemImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setItemImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeItemModal) return

    setError("")
    setSuccess("")
    setLoading(true)

    const payload = {
      name: itemName,
      description: itemDescription,
      price: parseFloat(itemPrice),
      image: itemImage,
      isAvailable: itemAvailable,
    }

    try {
      if (activeItemModal.mode === "add") {
        const res = await fetch(`/api/categories/${activeItemModal.categoryId}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.error || "حدث خطأ أثناء إضافة الصنف")
        } else {
          setCategories((prev) =>
            prev.map((c) =>
              c.id === activeItemModal.categoryId
                ? { ...c, items: [...c.items, data.item] }
                : c
            )
          )
          setActiveItemModal(null)
          setSuccess("تم إضافة الصنف للمنيو بنجاح ✨")
          router.refresh()
        }
      } else if (activeItemModal.mode === "edit" && activeItemModal.item) {
        const itemId = activeItemModal.item.id
        const res = await fetch(`/api/items/${itemId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.error || "حدث خطأ أثناء تعديل الصنف")
        } else {
          setCategories((prev) =>
            prev.map((c) =>
              c.id === activeItemModal.categoryId
                ? {
                    ...c,
                    items: c.items.map((i) => (i.id === itemId ? data.item : i)),
                  }
                : c
            )
          )
          setActiveItemModal(null)
          setSuccess("تم تحديث الصنف بنجاح")
          router.refresh()
        }
      }
    } catch (err) {
      setError("حدث خطأ أثناء حفظ الصنف")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleItemAvailability = async (categoryId: string, item: MenuItem) => {
    const newStatus = !item.isAvailable

    setCategories((prev) =>
      prev.map((c) =>
        c.id === categoryId
          ? {
              ...c,
              items: c.items.map((i) => (i.id === item.id ? { ...i, isAvailable: newStatus } : i)),
            }
          : c
      )
    )

    try {
      const res = await fetch(`/api/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: newStatus }),
      })

      if (!res.ok) {
        router.refresh()
      }
    } catch (err) {
      router.refresh()
    }
  }

  const handleDeleteItem = async (categoryId: string, itemId: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف الصنف "${name}"؟`)) return

    setError("")
    setSuccess("")

    try {
      const res = await fetch(`/api/items/${itemId}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        setError("حدث خطأ أثناء حذف الصنف")
      } else {
        setCategories((prev) =>
          prev.map((c) =>
            c.id === categoryId ? { ...c, items: c.items.filter((i) => i.id !== itemId) } : c
          )
        )
        setSuccess("تم حذف الصنف من المنيو بنجاح")
        router.refresh()
      }
    } catch (err) {
      setError("حدث خطأ أثناء الاتصال")
    }
  }

  // --- Excel Import/Export Handling ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError("")
    setSuccess("")
    setImportSummary(null)
    setImporting(true)

    const formData = new FormData()
    formData.append("file", file)

    const endpoint =
      menuFormat === "product_feed"
        ? `/api/restaurants/${restaurantId}/menu/import-feed`
        : `/api/restaurants/${restaurantId}/menu/import`

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "حدث خطأ أثناء استيراد ملف Excel")
      } else {
        setImportSummary({
          categoriesCreated: data.summary.categoriesCreated,
          itemsAdded: data.summary.itemsAdded,
          itemsUpdated: data.summary.itemsUpdated || 0,
          errors: data.errors || [],
        })
        const updatedMsg = data.summary.itemsUpdated ? `، وتحديث ${data.summary.itemsUpdated} صنف` : ""
        setSuccess(`تمت عملية الاستيراد بنجاح! تم إضافة ${data.summary.itemsAdded} صنف جديد${updatedMsg}.`)
        router.refresh()
      }
    } catch (err) {
      setError("حدث خطأ أثناء رفع وقراءة ملف Excel")
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleDownloadSampleTemplate = () => {
    if (menuFormat === "product_feed") {
      window.location.href = `/api/restaurants/${restaurantId}/menu/template-feed`
      return
    }

    const sampleData = [
      {
        "اسم القسم": "المقبلات والسلطات",
        "اسم الصنف": "سلطة سيزر طازجة",
        "الوصف": "خس طازج مع قطع الدجاج المشوي وصلصة السيزر والبرميزان",
        "السعر": 35.0,
        "متاح؟": "نعم",
      },
      {
        "اسم القسم": "الأطباق الرئيسية والمشويات",
        "اسم الصنف": "برجر ريفيكس السوبر",
        "الوصف": "لحم أنجوس طازج مع جبن الشيدر الذائب وصوص ريفيكس الخاص",
        "السعر": 65.0,
        "متاح؟": "نعم",
      },
      {
        "اسم القسم": "المشروبات والحلويات",
        "اسم الصنف": "عصير برتقال طازج",
        "الوصف": "برتقال طبيعي 100% بدون سكر مضاف",
        "السعر": 18.0,
        "متاح؟": "نعم",
      },
    ]

    const worksheet = XLSX.utils.json_to_sheet(sampleData)
    worksheet["!cols"] = [
      { wch: 25 },
      { wch: 30 },
      { wch: 45 },
      { wch: 15 },
      { wch: 12 },
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "نموذج المنيو")

    XLSX.writeFile(workbook, "rivix-menu-sample-template.xlsx")
  }

  return (
    <div className="space-y-8 text-brand-white">
      {/* Alert Notifications */}
      {error && (
        <div className="rounded-xl bg-brand-danger/10 border border-brand-danger/30 p-4 text-xs text-brand-danger font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="rounded-xl bg-brand-success/10 border border-brand-success/30 p-4 text-xs text-brand-success font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Import Summary Details */}
      {importSummary && (
        <div className="rounded-2xl bg-brand-navy border border-brand-sky/30 p-5 space-y-3 shadow-lg">
          <div className="flex items-center justify-between border-b border-brand-gray-800 pb-2">
            <h3 className="text-sm font-extrabold text-brand-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-brand-sky" /> ملخص عملية استيراد Excel
            </h3>
            <button
              type="button"
              onClick={() => setImportSummary(null)}
              className="text-brand-gray-400 hover:text-brand-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-brand-gray-900 border border-brand-gray-800">
              <span className="text-brand-gray-400 block text-[11px]">الأقسام الجديدة</span>
              <span className="text-base font-black text-brand-sky">{importSummary.categoriesCreated}</span>
            </div>
            <div className="p-3 rounded-xl bg-brand-gray-900 border border-brand-gray-800">
              <span className="text-brand-gray-400 block text-[11px]">الأصناف المضافة</span>
              <span className="text-base font-black text-brand-success">{importSummary.itemsAdded}</span>
            </div>
            {importSummary.itemsUpdated !== undefined && importSummary.itemsUpdated > 0 && (
              <div className="p-3 rounded-xl bg-brand-gray-900 border border-brand-gray-800">
                <span className="text-brand-gray-400 block text-[11px]">الأصناف المُحدّثة</span>
                <span className="text-base font-black text-purple-400">{importSummary.itemsUpdated}</span>
              </div>
            )}
            <div className="p-3 rounded-xl bg-brand-gray-900 border border-brand-gray-800">
              <span className="text-brand-gray-400 block text-[11px]">الصفوف غير الصالحة</span>
              <span className="text-base font-black text-brand-danger">{importSummary.errors.length}</span>
            </div>
          </div>

          {importSummary.errors.length > 0 && (
            <div className="p-3 rounded-xl bg-brand-danger/10 border border-brand-danger/20 space-y-1 text-xs text-brand-danger max-h-36 overflow-y-auto">
              <span className="font-bold block">ملاحظات على بعض الصفوف:</span>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                {importSummary.errors.map((errStr, idx) => (
                  <li key={idx}>{errStr}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Top Controls & Excel Tools Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-brand-navy/90 border border-brand-sky/20 rounded-3xl p-6 shadow-xl backdrop-blur-xl">
        <div>
          <h2 className="text-xl font-black text-brand-white flex items-center gap-2">
            <Utensils className="w-6 h-6 text-brand-sky" /> إدارة المنيو والأصناف
          </h2>
          <p className="text-xs text-brand-gray-400 mt-1">
            منيو مطعم <span className="font-bold text-brand-white">{restaurantName}</span>
          </p>
        </div>

        {/* Action Buttons & Format Dropdown Cluster */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Format Selector Dropdown */}
          <div className="flex items-center gap-2 bg-brand-gray-900 border border-brand-sky/30 rounded-xl px-3 py-2 text-xs">
            <span className="text-brand-gray-400 font-semibold whitespace-nowrap">صيغة الملف:</span>
            <select
              value={menuFormat}
              onChange={(e) => setMenuFormat(e.target.value as "arabic" | "product_feed")}
              className="bg-transparent text-brand-sky font-extrabold focus:outline-none cursor-pointer"
            >
              <option value="arabic" className="bg-brand-navy text-white">
                الصيغة العربية (افتراضي)
              </option>
              <option value="product_feed" className="bg-brand-navy text-white">
                صيغة Product Feed (Facebook/Google)
              </option>
            </select>
          </div>

          {/* Export Excel Button */}
          <a
            href={
              menuFormat === "product_feed"
                ? `/api/restaurants/${restaurantId}/menu/export-feed`
                : `/api/restaurants/${restaurantId}/menu/export`
            }
            download
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-brand-sky/10 border border-brand-sky/30 hover:bg-brand-sky/20 text-brand-sky font-bold text-xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" /> تصدير المنيو (Excel)
          </a>

          {/* Import Excel Trigger Button */}
          <label className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-brand-success/10 border border-brand-success/30 hover:bg-brand-success/20 text-brand-success font-bold text-xs transition-all cursor-pointer">
            {importing ? (
              <svg className="animate-spin h-4 w-4 text-brand-success" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <Upload className="w-4 h-4" />
            )}
            <span>{importing ? "جاري الرفع..." : "استيراد من Excel"}</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              disabled={importing}
              className="hidden"
            />
          </label>

          {/* Download Sample Template Button */}
          <button
            type="button"
            onClick={handleDownloadSampleTemplate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-brand-gray-900 border border-brand-gray-800 hover:bg-brand-gray-800 text-brand-gray-300 font-bold text-xs transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4 text-brand-gray-400" />
            {menuFormat === "product_feed" ? "تحميل نموذج Product Feed" : "تحميل نموذج فارغ"}
          </button>

          {/* Add Category Button */}
          <Button
            onClick={() => setShowAddCategory(true)}
            variant="primary"
            size="md"
            className="cursor-pointer shadow-lg shadow-brand-sky/20 font-extrabold text-xs mr-auto lg:mr-0"
          >
            <Plus className="w-4 h-4 ml-1" /> إضافة قسم جديد
          </Button>
        </div>
      </div>

      {/* Inline Form to Add Category */}
      {showAddCategory && (
        <form
          onSubmit={handleCreateCategory}
          className="bg-brand-gray-900/90 border border-brand-sky/30 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-brand-gray-800 pb-2">
            <h3 className="text-sm font-bold text-brand-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-sky" /> قسم جديد للمنيو
            </h3>
            <button
              type="button"
              onClick={() => setShowAddCategory(false)}
              className="text-brand-gray-400 hover:text-brand-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              required
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="اسم القسم (مثال: البرجر والمشويات، الساندوتشات، المشروبات)"
              className="flex-1 rounded-xl bg-brand-navy border border-brand-gray-800 px-4 py-2.5 text-xs text-brand-white placeholder-brand-gray-500 focus:border-brand-sky outline-none transition-all"
            />
            <Button type="submit" variant="primary" isLoading={loading} className="cursor-pointer text-xs">
              حفظ القسم
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowAddCategory(false)}
              className="cursor-pointer text-xs"
            >
              إلغاء
            </Button>
          </div>
        </form>
      )}

      {/* Categories Accordion / List */}
      <div className="space-y-6">
        {categories.length === 0 ? (
          <div className="rounded-3xl bg-brand-navy/60 border border-brand-gray-800 p-12 text-center space-y-3">
            <Utensils className="w-12 h-12 text-brand-gray-500 mx-auto" />
            <h3 className="text-base font-bold text-brand-white">لا توجد أقسام في المنيو بعد</h3>
            <p className="text-xs text-brand-gray-400 max-w-sm mx-auto">
              يمكنك استخدام زر "استيراد من Excel" لرفع المنيو دفعة واحدة، أو البدء بإضافة أقسام يدوياً.
            </p>
            <Button onClick={() => setShowAddCategory(true)} variant="primary" className="mt-2 text-xs">
              <Plus className="w-4 h-4 ml-1" /> إضافة أول قسم للمنيو
            </Button>
          </div>
        ) : (
          categories.map((cat) => {
            const isOpen = openCategories[cat.id] ?? true
            const isEditingCategory = editingCategoryId === cat.id

            return (
              <div
                key={cat.id}
                className="rounded-3xl bg-brand-navy/90 border border-brand-gray-800 overflow-hidden shadow-xl"
              >
                {/* Category Header */}
                <div className="p-4 sm:p-5 bg-brand-gray-900/80 border-b border-brand-gray-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleCategoryAccordion(cat.id)}
                      className="p-1 rounded-lg hover:bg-brand-gray-800 text-brand-gray-400 transition-colors"
                    >
                      {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>

                    {isEditingCategory ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editCategoryName}
                          onChange={(e) => setEditCategoryName(e.target.value)}
                          className="rounded-lg bg-brand-navy border border-brand-sky px-3 py-1 text-xs text-brand-white outline-none"
                        />
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleUpdateCategory(cat.id)}
                        >
                          حفظ
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingCategoryId(null)}
                        >
                          إلغاء
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold text-brand-white">{cat.name}</h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-brand-sky/10 border border-brand-sky/20 text-brand-sky text-[10px] font-bold">
                          {cat.items.length} صنف
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => openAddItemModal(cat.id)}
                      className="text-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 ml-1" /> إضافة صنف
                    </Button>

                    {!isEditingCategory && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategoryId(cat.id)
                          setEditCategoryName(cat.name)
                        }}
                        className="p-2 rounded-xl hover:bg-brand-gray-800 text-brand-gray-400 hover:text-brand-white transition-colors"
                        title="تعديل اسم القسم"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat.id, cat.name)}
                      className="p-2 rounded-xl hover:bg-brand-danger/10 text-brand-gray-400 hover:text-brand-danger transition-colors"
                      title="حذف القسم بالكامل"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Items Grid */}
                {isOpen && (
                  <div className="p-4 sm:p-6">
                    {cat.items.length === 0 ? (
                      <div className="p-8 text-center text-xs text-brand-gray-400">
                        لا توجد أصناف في هذا القسم حتى الآن. اضغط على زر "إضافة صنف" لإدخال الوجبات.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {cat.items.map((item) => (
                          <div
                            key={item.id}
                            className={`rounded-2xl border p-4 flex gap-3 transition-all relative ${
                              item.isAvailable
                                ? "bg-brand-gray-900/60 border-brand-gray-800 hover:border-brand-sky/40"
                                : "bg-brand-gray-900/30 border-brand-gray-800/40 opacity-60"
                            }`}
                          >
                            {/* Item Image */}
                            <div className="w-16 h-16 rounded-xl bg-brand-navy border border-brand-gray-800 shrink-0 overflow-hidden relative">
                              {item.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Utensils className="w-6 h-6 text-brand-gray-500 m-auto inset-0 absolute" />
                              )}
                            </div>

                            {/* Item Content */}
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-start justify-between gap-1">
                                <h4 className="font-extrabold text-brand-white text-xs truncate">
                                  {item.name}
                                </h4>
                                <span className="font-black text-brand-sky text-xs font-mono shrink-0">
                                  {item.price} ج.م
                                </span>
                              </div>

                              {item.description && (
                                <p className="text-[11px] text-brand-gray-400 line-clamp-2">
                                  {item.description}
                                </p>
                              )}

                              {/* Item Controls */}
                              <div className="pt-2 flex items-center justify-between border-t border-brand-gray-800/60 mt-2">
                                {/* Availability Toggle */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleItemAvailability(cat.id, item)}
                                  className="inline-flex items-center gap-1.5 text-[11px] font-bold cursor-pointer transition-colors"
                                >
                                  {item.isAvailable ? (
                                    <>
                                      <ToggleRight className="w-5 h-5 text-brand-success" />
                                      <span className="text-brand-success">متاح للطلب</span>
                                    </>
                                  ) : (
                                    <>
                                      <ToggleLeft className="w-5 h-5 text-brand-danger" />
                                      <span className="text-brand-danger">غير متاح</span>
                                    </>
                                  )}
                                </button>

                                {/* Edit / Delete Actions */}
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => openManageOptionsModal(item.id, item.name)}
                                    className="px-2 py-1 rounded-lg bg-brand-sky/10 border border-brand-sky/20 hover:bg-brand-sky/20 text-brand-sky transition-colors flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                                    title="إدارة الأحجام والإضافات والأوزان"
                                  >
                                    <Layers className="w-3 h-3" />
                                    <span>الأحجام/الأوزان</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openEditItemModal(cat.id, item)}
                                    className="p-1.5 rounded-lg hover:bg-brand-gray-800 text-brand-gray-400 hover:text-brand-white transition-colors"
                                    title="تعديل الصنف"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteItem(cat.id, item.id, item.name)}
                                    className="p-1.5 rounded-lg hover:bg-brand-danger/10 text-brand-gray-400 hover:text-brand-danger transition-colors"
                                    title="حذف الصنف"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Item Modal (Add / Edit) */}
      {activeItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-navy/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-brand-navy border border-brand-sky/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-brand-gray-800 pb-3">
              <h3 className="text-base font-bold text-brand-white flex items-center gap-2">
                <Utensils className="w-5 h-5 text-brand-sky" />
                {activeItemModal.mode === "add" ? "إضافة صنف جديد للمنيو" : "تعديل بيانات الصنف"}
              </h3>
              <button
                type="button"
                onClick={() => setActiveItemModal(null)}
                className="text-brand-gray-400 hover:text-brand-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-gray-300 mb-1.5">
                  اسم الصنف <span className="text-brand-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="مثال: برجر ريفيكس الدبل بالجبن"
                  className="w-full rounded-xl bg-brand-gray-900 border border-brand-gray-800 px-4 py-2.5 text-xs text-brand-white outline-none focus:border-brand-sky transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-gray-300 mb-1.5">
                    السعر (ج.م) <span className="text-brand-danger">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-brand-gray-400">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <input
                      type="number"
                      step="0.5"
                      required
                      min="0"
                      value={itemPrice}
                      onChange={(e) => setItemPrice(e.target.value)}
                      placeholder="45.00"
                      className="w-full rounded-xl bg-brand-gray-900 border border-brand-gray-800 pr-10 pl-4 py-2.5 text-xs text-brand-white outline-none focus:border-brand-sky transition-all dir-ltr text-right font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-gray-300 mb-1.5">
                    الحالة عند الإضافة
                  </label>
                  <button
                    type="button"
                    onClick={() => setItemAvailable(!itemAvailable)}
                    className={`w-full py-2.5 px-4 rounded-xl border font-bold text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      itemAvailable
                        ? "bg-brand-success/10 border-brand-success/30 text-brand-success"
                        : "bg-brand-danger/10 border-brand-danger/30 text-brand-danger"
                    }`}
                  >
                    <span>{itemAvailable ? "متاح للطلب 🟢" : "غير متاح 🔴"}</span>
                    {itemAvailable ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-gray-300 mb-1.5">
                  الوصف والمكونات (اختياري)
                </label>
                <textarea
                  rows={2}
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  placeholder="قطع لحم البقر الفاخرة مع الجبن المذاب وصوص البرجر الخاص..."
                  className="w-full rounded-xl bg-brand-gray-900 border border-brand-gray-800 px-4 py-2.5 text-xs text-brand-white outline-none focus:border-brand-sky transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-gray-300 mb-1.5">
                  صورة الصنف (اختياري)
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-brand-gray-900 border border-brand-gray-800 shrink-0 overflow-hidden relative">
                    {itemImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={itemImage} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-brand-gray-500 m-auto inset-0 absolute" />
                    )}
                  </div>

                  <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-sky/10 border border-brand-sky/30 text-brand-sky hover:bg-brand-sky/20 text-xs font-bold cursor-pointer transition-all">
                    <ImageIcon className="w-4 h-4" /> رفع صورة
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleItemImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={loading}
                  className="flex-1 text-xs font-extrabold cursor-pointer py-3"
                >
                  {activeItemModal.mode === "add" ? "إضافة الصنف للمنيو 🚀" : "حفظ التعديلات"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setActiveItemModal(null)}
                  className="cursor-pointer text-xs py-3"
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Item Options & Modifiers Modal (الأحجام، الإضافات، الأوزان) */}
      {activeOptionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-navy/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-3xl bg-brand-navy border border-brand-sky/30 p-6 shadow-2xl space-y-6 text-right max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-brand-gray-800 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-brand-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-brand-sky" /> إدارة الأحجام والإضافات والأوزان
                </h3>
                <p className="text-xs text-brand-gray-400 mt-1">
                  صنف: <span className="font-bold text-brand-sky">{activeOptionsModal.itemName}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveOptionsModal(null)}
                className="w-8 h-8 rounded-full bg-brand-gray-900 border border-brand-gray-800 text-brand-gray-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Existing Option Groups */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-brand-gray-300">المجموعات المضافة حالياً:</h4>
              {activeOptionsModal.groups.length === 0 ? (
                <div className="p-4 rounded-xl bg-brand-gray-900/50 border border-brand-gray-800 text-center text-xs text-brand-gray-400">
                  لا توجد مجموعات أحجام أو إضافات لهذا الصنف بعد. يمكنك إضافة مجموعة جديدة بالأسفل.
                </div>
              ) : (
                <div className="space-y-3">
                  {activeOptionsModal.groups.map((group: any) => (
                    <div
                      key={group.id}
                      className="p-4 rounded-2xl bg-brand-gray-900 border border-brand-gray-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white">{group.name}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-sky/10 text-brand-sky border border-brand-sky/20">
                            {group.selectionType === "single" ? "اختيار واحد" : "خيارات متعددة"}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteOptionGroup(group.id)}
                          className="text-xs font-bold text-brand-danger hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> حذف المجموعة
                        </button>
                      </div>

                      {/* Options Pill List */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {group.options.map((opt: any) => (
                          <span
                            key={opt.id}
                            className="px-2.5 py-1 rounded-xl bg-brand-navy border border-brand-gray-700 text-xs text-brand-gray-200 font-bold flex items-center gap-1.5"
                          >
                            <Tag className="w-3 h-3 text-amber-400" />
                            {opt.name}
                            <span className="text-brand-sky">({opt.price > 0 ? `+${opt.price} ج.م` : "0 ج.م"})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form to Add New Option Group */}
            <div className="p-4 rounded-2xl bg-brand-gray-900/90 border border-brand-sky/20 space-y-4">
              <h4 className="text-xs font-black text-brand-sky flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> إضافة مجموعة أحجام أو إضافات جديدة
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-brand-gray-300 mb-1">
                    اسم المجموعة (مثال: "الوزن / الحجم" أو "نوع العيش" أو "الصوصات")
                  </label>
                  <input
                    type="text"
                    value={optGroupName}
                    onChange={(e) => setOptGroupName(e.target.value)}
                    placeholder="الوزن / الحجم"
                    className="w-full rounded-xl bg-brand-navy border border-brand-gray-800 px-3.5 py-2 text-xs text-brand-white outline-none focus:border-brand-sky"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-brand-gray-300 mb-1">
                    نوع الاختيار
                  </label>
                  <select
                    value={optSelectionType}
                    onChange={(e) => setOptSelectionType(e.target.value as "single" | "multiple")}
                    className="w-full rounded-xl bg-brand-navy border border-brand-gray-800 px-3.5 py-2 text-xs text-brand-white outline-none focus:border-brand-sky cursor-pointer font-bold"
                  >
                    <option value="single">اختيار واحد فقط (للأحجام والأوزان)</option>
                    <option value="multiple">اختيارات متعددة (للإضافات والصوصات)</option>
                  </select>
                </div>
              </div>

              {/* Options Items Inputs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-brand-gray-300">
                    الخيارات المتاحة والسعر الإضافي:
                  </label>
                  <button
                    type="button"
                    onClick={() => setOptItems((prev) => [...prev, { name: "", price: "0" }])}
                    className="text-[11px] font-bold text-brand-sky hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> إضافة خيار آخر
                  </button>
                </div>

                <div className="space-y-2">
                  {optItems.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt.name}
                        onChange={(e) => {
                          const updated = [...optItems]
                          updated[idx].name = e.target.value
                          setOptItems(updated)
                        }}
                        placeholder="اسم الخيار (مثال: ثُمُن كِيلو، رُبُع كِيلو، نِصْف كِيلو، كِيلو)"
                        className="flex-1 rounded-xl bg-brand-navy border border-brand-gray-800 px-3.5 py-2 text-xs text-brand-white outline-none focus:border-brand-sky"
                      />
                      <input
                        type="number"
                        value={opt.price}
                        onChange={(e) => {
                          const updated = [...optItems]
                          updated[idx].price = e.target.value
                          setOptItems(updated)
                        }}
                        placeholder="السعر (ج.م)"
                        className="w-24 rounded-xl bg-brand-navy border border-brand-gray-800 px-3.5 py-2 text-xs text-brand-sky font-bold outline-none focus:border-brand-sky text-center"
                      />
                      {optItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setOptItems((prev) => prev.filter((_, i) => i !== idx))}
                          className="p-2 text-brand-gray-500 hover:text-brand-danger cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="button"
                  variant="primary"
                  isLoading={loadingOptions}
                  onClick={handleSaveOptionGroup}
                  className="text-xs font-bold px-6 py-2.5 cursor-pointer"
                >
                  حفظ المجموعة والأحجام
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
