"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useSettings } from "@/context/SettingsContext";
import { formatUSD } from "@/lib/currency";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export function QuickAddButton({
  product,
  className = "",
}: {
  product: any;
  className?: string;
}) {
  const { addToCart } = useCart();
  const { ecommerceMode } = useSettings();
  const { whatsappNumber } = useSettings();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (status !== "idle") return;

    try {
      setStatus("loading");
      
      // Artificial delay for better UX feedback
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      addToCart({
        id: product.id,
        name: product.name,
        slug: product.slug || product.id,
        price: product.price,
      }, 1);

      setStatus("success");
    } catch (err) {
      setStatus("error");
    } finally {
      setTimeout(() => setStatus("idle"), 2000);
    }
  };

  let btnClass = "bg-slate-900 hover:bg-slate-800 text-white";
  let btnText = ecommerceMode ? `Add to Cart - ${formatUSD(product.price)}` : "Add to Cart";

  if (status === "loading") {
    btnClass = "bg-slate-700 text-slate-200 cursor-wait";
    btnText = "Adding...";
  } else if (status === "success") {
    btnClass = "bg-emerald-600 hover:bg-emerald-700 text-white";
    btnText = ecommerceMode ? "Added to Cart!" : "Added to Quote!";
  } else if (status === "error") {
    btnClass = "bg-red-600 hover:bg-red-700 text-white";
    btnText = "Error Adding!";
  }

  const addToCartBtn = (
    <button
      onClick={handleAdd}
      disabled={status === "loading" || status === "success"}
      className={`w-full font-bold py-3 rounded-lg transition-all duration-300 ${btnClass} ${className}`}
    >
      {btnText}
    </button>
  );

  if (ecommerceMode) {
    return addToCartBtn;
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      {addToCartBtn}
      <a
        href={buildWhatsAppUrl(
          whatsappNumber,
          product.name,
          product.sku,
          typeof window !== "undefined" ? window.location.href : undefined,
          1
        )}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-white bg-[#25D366] hover:bg-[#1ebe5d] transition-all shadow-sm text-sm"
      >
        <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.301-.15-1.78-.879-2.056-.98-.276-.1-.477-.15-.678.15-.201.3-.778.98-.954 1.18-.176.2-.352.226-.653.076-.301-.15-1.272-.469-2.423-1.496-.897-.798-1.503-1.785-1.68-2.086-.176-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.176.2-.301.301-.502.1-.201.05-.377-.025-.527-.075-.15-.678-1.633-.929-2.235-.244-.587-.492-.507-.678-.517-.176-.01-.377-.01-.578-.01-.201 0-.527.076-.803.376s-1.054 1.029-1.054 2.509c0 1.48 1.079 2.909 1.23 3.11 0.15.201 2.123 3.242 5.143 4.545.719.31 1.28.496 1.718.636.723.23 1.381.197 1.901.12.579-.087 1.78-.728 2.031-1.431.251-.703.251-1.305.176-1.431-.075-.126-.276-.201-.577-.351zM12.042 21.75c-1.748 0-3.46-.464-4.97-1.344l-.356-.211-3.696.97.986-3.603-.232-.37c-.968-1.542-1.48-3.329-1.48-5.167 0-5.385 4.381-9.766 9.768-9.766 2.609 0 5.061 1.017 6.906 2.862s2.862 4.298 2.862 6.908c0 5.385-4.381 9.765-9.768 9.765zm8.334-18.102C18.172 1.444 15.228.333 12.042.333 5.617.333.385 5.566.385 11.99c0 2.053.536 4.057 1.554 5.823L0 24l6.353-1.666c1.706.93 3.633 1.419 5.689 1.419 6.425 0 11.658-5.233 11.658-11.658 0-3.116-1.213-6.046-3.324-8.197z"/>
        </svg>
        <span>WhatsApp</span>
      </a>
    </div>
  );
}
