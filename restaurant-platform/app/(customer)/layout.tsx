import { MobileBottomNav } from "@/components/MobileBottomNav"
import { FloatingCartButton } from "@/components/cart/FloatingCartButton"
import { CartDrawer } from "@/components/cart/CartDrawer"

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Mobile Screen Shell Container */}
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col bg-slate-950 pb-20 shadow-2xl relative border-x border-slate-900">
        {children}
      </div>

      {/* Floating Cart Quick Button */}
      <FloatingCartButton />

      {/* Slide-over Cart Drawer */}
      <CartDrawer />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}
