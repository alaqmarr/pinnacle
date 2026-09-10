import React from "react";
import Link from "next/link";

export interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    text: string;
    positive?: boolean;
  };
  accentColor?: "blue" | "amber" | "emerald" | "slate" | "indigo";
  href?: string;
}

export default function MetricCard({
  title,
  value,
  description,
  icon,
  trend,
  accentColor = "blue",
  href,
}: MetricCardProps) {
  const accentClasses = {
    blue: "bg-sky-50 text-sky-600 border-sky-200",
    amber: "bg-amber-50 text-amber-600 border-amber-200",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-200",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-200",
  }[accentColor];

  const content = (
    <div className="p-5 sm:p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        {icon && (
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${accentClasses}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {value}
        </div>
        {description && (
          <p className="mt-1 text-xs text-slate-500 leading-normal">
            {description}
          </p>
        )}
        {trend && (
          <div className="mt-2 flex items-center text-xs font-semibold">
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold mr-1.5 ${
                trend.positive
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-slate-100 text-slate-600 border border-slate-200"
              }`}
            >
              {trend.text}
            </span>
            <span className="text-slate-400">vs last month</span>
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block group focus:outline-none focus:ring-2 focus:ring-sky-500 rounded-xl">
        {content}
      </Link>
    );
  }

  return content;
}
