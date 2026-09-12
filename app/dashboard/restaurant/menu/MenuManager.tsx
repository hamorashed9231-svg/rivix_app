"use client"

import { useState } from "react"
import Image from "next/image"
import { Plus, Utensils, Check, X, Tag } from "lucide-react"

export function MenuManager({ branches }: { branches: any[] }) {
  const [selectedBranchId, setSelectedBranchId] = useState(branches[0]?.id || "")
  const [activeBranch, setActiveBranch] = useState(
    branches.find((b) => b.id === selectedBranchId) || branches[0]
  )

  const [newCatName, setNewCatName] = useState("")
  const [showAddCat, setShowAddCat] = useState(false)

  const [showAddItem, setShowAddItem] = useState<string | null>(null)
  const [itemName, setItemName] = useState("")
  const [itemPrice, setItemPrice] = useState("")
  const [itemDesc, setItemDesc] = useState("")
  const [itemImage, setItemImage] = useState("")

  const [loading, setLoading] = useState(false)

  const handleBranchChange = (bId: string) => {
    setSelectedBranchId(bId)
    setActiveBranch(branches.find((b) => b.id === bId))
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName) return
    setLoading(true)

    try {
      const res = await fetch("/api/restaurant/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_category",
          branchId: selectedBranchId,
          categoryName: newCatName,
        }),
      })

      if (res.ok) {
        window.location.reload()
      }
    } catch (err) {
      alert("حدث خطأ أثناء إضافة التصنيف")
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = async (e: React.FormEvent, catId: string) => {
    e.preventDefault()
    if (!itemName || !itemPrice) return
    setLoading(true)

    try {
      const res = await fetch("/api/restaurant/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_item",
          categoryId: catId,
          name: itemName,
          price: itemPrice,
          description: itemDesc,
          image: itemImage,
        }),
      })

      if (res.ok) {
        window.location.reload()
      }
    } catch (err) {
      alert("حدث خطأ أثناء إضافة الصنف")
    } finally {
      setLoading(false)
    }
  }

  const toggleAvailability = async (itemId: string, currentVal: boolean) => {
    try {
      const res = await fetch("/api/restaurant/menu", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, isAvailable: !currentVal }),
      })

      if (res.ok) {
        window.location.reload()
      }
    } catch (err) {
      alert("حدث خطأ في تغيير التوفر")
    }
  }

  return (
    <div className="space-y-6">
      {/* Branch selector tabs */}
      {branches.length > 1 && (
        <div className="flex items-center gap-2 bg-[#0B192C] p-2 rounded-xl border border-slate-800 w-fit">
          {branches.map((b) => (
            <button
              key={b.id}
              onClick={() => handleBranchChange(b.id)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
                selectedBranchId === b.id
                  ? "bg-cyan-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {b.address}
            </button>
          ))}
        </div>
      )}

      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Tag className="w-5 h-5 text-cyan-400" />
          تصنيفات المنيو ({activeBranch?.menuCategories?.length || 0})
        </h2>

        <button
          onClick={() => setShowAddCat(!showAddCat)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors"
        >
          <Plus className="w-4 h-4" /> إضافة تصنيف جديد
        </button>
      </div>

      {/* Add Category Form */}
      {showAddCat && (
        <form onSubmit={handleAddCategory} className="bg-[#0B192C] border border-cyan-500/30 rounded-xl p-4 flex gap-3 items-center">
          <input
            type="text"
            placeholder="اسم التصنيف (مثال: المشروبات الباردة)"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-400"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg"
          >
            حفظ التصنيف
          </button>
        </form>
      )}

      {/* Categories & Items List */}
      <div className="space-y-6">
        {activeBranch?.menuCategories?.map((cat: any) => (
          <div key={cat.id} className="bg-[#0B192C] border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-cyan-300">{cat.name}</h3>
              <button
                onClick={() => setShowAddItem(showAddItem === cat.id ? null : cat.id)}
                className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                <Plus className="w-4 h-4" /> إضافة صنف لـ {cat.name}
              </button>
            </div>

            {/* Add Item Form */}
            {showAddItem === cat.id && (
              <form onSubmit={(e) => handleAddItem(e, cat.id)} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="اسم الصنف (مثال: بيتزا مارجريتا)"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="bg-slate-950 border border-slate-700 px-3 py-2 rounded text-xs text-white"
                    required
                  />
                  <input
                    type="number"
                    step="0.5"
                    placeholder="السعر بالريال (مثال: 35)"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    className="bg-slate-950 border border-slate-700 px-3 py-2 rounded text-xs text-white"
                    required
                  />
                </div>
                <input
                  type="text"
                  placeholder="الوصف (اختياري)"
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 px-3 py-2 rounded text-xs text-white"
                />
                <input
                  type="url"
                  placeholder="رابط الصورة (URL اختياري)"
                  value={itemImage}
                  onChange={(e) => setItemImage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 px-3 py-2 rounded text-xs text-white"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddItem(null)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded"
                  >
                    إضافة الصنف
                  </button>
                </div>
              </form>
            )}

            {/* Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cat.items?.map((item: any) => (
                <div key={item.id} className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 flex gap-3 items-center justify-between">
                  <div className="flex gap-3 items-center">
                    <div className="w-14 h-14 rounded-lg bg-slate-800 overflow-hidden relative shrink-0 border border-slate-700">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                          <Utensils className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">{item.name}</h4>
                      <p className="text-xs text-slate-400 line-clamp-1">{item.description || "بدون وصف"}</p>
                      <p className="text-xs font-extrabold text-cyan-400 mt-1">{item.price} ر.س</p>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleAvailability(item.id, item.isAvailable)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded flex items-center gap-1 border transition-colors ${
                      item.isAvailable
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
                    }`}
                  >
                    {item.isAvailable ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    {item.isAvailable ? "متوفر" : "غير متوفر"}
                  </button>
                </div>
              ))}
              {(!cat.items || cat.items.length === 0) && (
                <p className="text-xs text-slate-500 col-span-2 py-2">لا توجد أصناف مضافة في هذا التصنيف بعد.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
