"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useSettings } from "@/context/SettingsContext";
import { formatUSD } from "@/lib/currency";

export function QuickAddButton({
  product,
  className = "",
}: {
  product: any;
  className?: string;
}) {
  const { addToCart } = useCart();
  const { ecommerceMode } = useSettings();
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
  let btnText = ecommerceMode
    ? `Add to Cart - ${formatUSD(product.price)}`
    : "Add to Cart";

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

  return (
    <button
      onClick={handleAdd}
      disabled={status === "loading" || status === "success"}
      className={`w-full font-bold py-3 rounded-lg transition-all duration-300 ${btnClass} ${className}`}
    >
      {btnText}
    </button>
  );
}
