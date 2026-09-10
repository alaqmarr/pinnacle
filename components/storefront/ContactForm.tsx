"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    topic: "Bulk Quote Request",
    message: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: `[Topic: ${formData.topic}]${formData.company ? ` [Company: ${formData.company}]` : ""}\n\n${formData.message}`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(
          "Thank you! Your inquiry has been sent directly to our commercial dispatch team. A representative will respond within 1 business day."
        );
        setFormData({
          name: "",
          company: "",
          email: "",
          phone: "",
          topic: "Bulk Quote Request",
          message: "",
        });
      } else {
        setErrorMessage(data.error || "Failed to deliver your message. Please try again.");
      }
    } catch (err) {
      setErrorMessage("Network error occurred. Please verify your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs">
      <div className="border-b border-slate-100 pb-4 mb-6">
        <h2 className="text-xl font-bold text-slate-900">
          Send Us a Message
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Complete the form below to request volume truckload pricing, custom box dimensions, or technical specifications.
        </p>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
          <svg className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="leading-relaxed font-medium">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
          <svg className="w-5 h-5 text-red-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="leading-relaxed font-medium">{errorMessage}</span>
        </div>
      )}

      <form action="/api/contact" method="POST" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            required
            placeholder="Jane Doe"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <Input
            label="Company Name"
            placeholder="Acme Logistics LLC (Optional)"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Work Email"
            type="email"
            required
            placeholder="jane@company.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />

          <Input
            label="Contact Phone"
            type="tel"
            placeholder="(555) 000-0000 (Optional)"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>

        <Select
          label="Inquiry Topic"
          value={formData.topic}
          onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
          options={[
            { value: "Bulk Quote Request", label: "Bulk Wholesale / Pallet Quote" },
            { value: "Product Specification / SDS", label: "Product Specification / SDS Request" },
            { value: "Order Status / Freight Tracking", label: "Order Status / Freight Tracking" },
            { value: "Net 30 Terms Application", label: "Net 30 Commercial Credit Terms" },
            { value: "General Support", label: "General Customer Support" },
          ]}
        />

        <Textarea
          label="Detailed Message or Specifications"
          required
          rows={5}
          placeholder="Please specify box sizes, quantities, packaging requirements, or delivery dock requirements..."
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
        />

        <div className="pt-2">
          <Button
            type="submit"
            variant="accent"
            size="lg"
            isLoading={isLoading}
            fullWidth
          >
            Submit Commercial Inquiry
          </Button>
        </div>
      </form>
    </div>
  );
}
