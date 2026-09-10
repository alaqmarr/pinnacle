"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { formatUSD } from "@/lib/currency";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const US_ZIP_REGEX = /^\d{5}(-\d{4})?$/;

function StripeReviewForm({
  total,
  onBack,
  onSuccess,
  onError,
  isSubmitting,
  setIsSubmitting
}: {
  total: number;
  onBack: () => void;
  onSuccess: (paymentIntentId: string) => void;
  onError: (msg: string) => void;
  isSubmitting: boolean;
  setIsSubmitting: (val: boolean) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();

  const handlePay = async () => {
    if (!stripe || !elements) return;
    
    setIsSubmitting(true);
    
    const { error: submitError } = await elements.submit();
    if (submitError) {
      onError(submitError.message || "Please fill out all required payment fields.");
      setIsSubmitting(false);
      return;
    }

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      onError(error.message || "Payment failed.");
      setIsSubmitting(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      onSuccess(paymentIntent.id);
    } else {
      onError("Unexpected payment status: " + paymentIntent?.status);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PaymentElement />
      <div className="pt-4 flex justify-between items-center">
        <Button type="button" variant="outline" size="md" onClick={onBack} disabled={isSubmitting}>
          ← Back to Payment
        </Button>
        <Button type="button" variant="accent" size="lg" isLoading={isSubmitting} onClick={handlePay}>
          Pay {formatUSD(total)} & Place Order
        </Button>
      </div>
    </div>
  );
}


export function CheckoutClient({ sessionUser, stripePublishableKey }: { sessionUser: any, stripePublishableKey?: string }) {
  const router = useRouter();
  const { items, subtotal, totalItems, clearCart, isHydrated } = useCart();

  const stripePromise = React.useMemo(() => stripePublishableKey ? loadStripe(stripePublishableKey.trim()) : null, [stripePublishableKey]);
  const [clientSecret, setClientSecret] = useState("");

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const allowCredit = sessionUser?.allowCredit ?? false;

  const [customer, setCustomer] = useState({
    fullName: sessionUser?.name || "",
    email: sessionUser?.email || "",
    phone: "",
    company: "",
  });

  const [shippingAddress, setShippingAddress] = useState({
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "TX",
    postalCode: "",
  });

  const [shippingMethod, setShippingMethod] = useState<"standard" | "expedited" | "pickup">("standard");
  const [paymentMethod, setPaymentMethod] = useState<"STRIPE" | "PAYPAL" | "PO_NET30">("STRIPE");

  const [orderNotes, setOrderNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const shippingCost = shippingMethod === "expedited" ? 4850 : shippingMethod === "pickup" ? 0 : 1495;
  const tax = Math.round(subtotal * 0.0825);
  const total = subtotal + shippingCost + tax;

  const validateStep1 = () => {
    if (!customer.fullName.trim()) return "Full name is required.";
    if (!customer.email.trim() || !customer.email.includes("@")) return "A valid email is required.";
    if (!shippingAddress.addressLine1.trim()) return "Shipping address line 1 is required.";
    if (!shippingAddress.city.trim()) return "City is required.";
    if (!shippingAddress.state.trim()) return "State is required.";
    const zip = shippingAddress.postalCode.trim();
    if (!US_ZIP_REGEX.test(zip)) {
      return "Please provide a valid 5-digit US postal ZIP code (e.g. 75201 or 75201-1234).";
    }
    return null;
  };

  const handleNextStep = async () => {
    setErrorMessage("");
    if (step === 1) {
      const error = validateStep1();
      if (error) {
        setErrorMessage(error);
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      if (paymentMethod === "STRIPE") {
        if (!stripePromise) {
          setErrorMessage("Stripe is not configured by the administrator.");
          return;
        }
        setIsSubmitting(true);
        try {
          const res = await fetch("/api/storefront/create-payment-intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items, shippingMethod })
          });
          const data = await res.json();
          if (data.clientSecret) {
            setClientSecret(data.clientSecret);
            setStep(4);
          } else {
            setErrorMessage(data.error || "Failed to initialize Stripe checkout");
          }
        } catch (e) {
          setErrorMessage("Network error initializing Stripe");
        } finally {
          setIsSubmitting(false);
        }
      } else {
        setStep(4);
      }
    }
  };

  const handleFinalSubmit = async (paymentIntentId?: string) => {
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          shippingAddress,
          shippingMethod,
          paymentMethod,
          paymentDetails: paymentIntentId ? { paymentIntentId } : { poNumber: "NET30-PENDING" },
          items,
          notes: orderNotes,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        clearCart();
        router.push(`/checkout/success?orderId=${data.orderId}`);
      } else {
        setErrorMessage(data.error || "Failed to process order. Please verify your details.");
      }
    } catch (err) {
      setErrorMessage("Network error occurred during order submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="grid grid-cols-4 text-center text-xs font-bold">
            <div className={`pb-2 border-b-2 ${step >= 1 ? "border-sky-600 text-sky-600" : "border-slate-200 text-slate-400"}`}>1. Address</div>
            <div className={`pb-2 border-b-2 ${step >= 2 ? "border-sky-600 text-sky-600" : "border-slate-200 text-slate-400"}`}>2. Freight</div>
            <div className={`pb-2 border-b-2 ${step >= 3 ? "border-sky-600 text-sky-600" : "border-slate-200 text-slate-400"}`}>3. Payment</div>
            <div className={`pb-2 border-b-2 ${step >= 4 ? "border-sky-600 text-sky-600" : "border-slate-200 text-slate-400"}`}>4. Review</div>
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
            <svg className="w-5 h-5 text-red-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {step === 1 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Step 1: Shipping Address & Facility Contact</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Full Name / Contact" required name="fullName" placeholder="John Smith" value={customer.fullName} onChange={(e) => setCustomer({ ...customer, fullName: e.target.value })} />
              <Input label="Email Address" required name="email" type="email" placeholder="john@company.com" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} />
              <Input label="Phone Number" name="phone" placeholder="(555) 123-4567" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
              <Input label="Company Name" name="company" placeholder="Acme Corp" value={customer.company} onChange={(e) => setCustomer({ ...customer, company: e.target.value })} />
            </div>
            <div className="space-y-4 pt-2">
              <Input label="Address Line 1" required name="addressLine1" placeholder="123 Warehouse Blvd" value={shippingAddress.addressLine1} onChange={(e) => setShippingAddress({ ...shippingAddress, addressLine1: e.target.value })} />
              <Input label="Address Line 2 (Optional)" name="addressLine2" placeholder="Suite 200, Dock B" value={shippingAddress.addressLine2} onChange={(e) => setShippingAddress({ ...shippingAddress, addressLine2: e.target.value })} />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input label="City" required name="city" placeholder="Dallas" value={shippingAddress.city} onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })} />
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">State</label>
                  <select className="w-full p-3 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:border-sky-500" value={shippingAddress.state} onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}>
                    <option value="TX">Texas (TX)</option>
                    <option value="CA">California (CA)</option>
                    <option value="NY">New York (NY)</option>
                    <option value="FL">Florida (FL)</option>
                    <option value="IL">Illinois (IL)</option>
                    <option value="PA">Pennsylvania (PA)</option>
                  </select>
                </div>
                <Input label="ZIP Code" required name="postalCode" placeholder="75201" value={shippingAddress.postalCode} onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })} />
              </div>
            </div>
            <div className="pt-4 flex justify-end">
              <Button type="button" variant="primary" size="lg" onClick={handleNextStep}>Continue to Shipping Method →</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Step 2: Select Freight Shipping Method</h2>
            </div>
            <div className="space-y-3">
              <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${shippingMethod === "standard" ? "border-sky-600 bg-sky-50/50 ring-2 ring-sky-200" : "border-slate-200 hover:border-slate-300"}`}>
                <div className="flex items-center gap-4">
                  <input type="radio" name="shipping" value="standard" checked={shippingMethod === "standard"} onChange={() => setShippingMethod("standard")} className="text-sky-600 focus:ring-sky-500" />
                  <div>
                    <strong className="text-sm font-bold text-slate-900 block">Standard Ground Freight</strong>
                    <span className="text-xs text-slate-500">3-5 business days. LTL carrier with liftgate service available.</span>
                  </div>
                </div>
                <span className="text-sm font-bold text-slate-900">$14.95</span>
              </label>
              <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${shippingMethod === "expedited" ? "border-sky-600 bg-sky-50/50 ring-2 ring-sky-200" : "border-slate-200 hover:border-slate-300"}`}>
                <div className="flex items-center gap-4">
                  <input type="radio" name="shipping" value="expedited" checked={shippingMethod === "expedited"} onChange={() => setShippingMethod("expedited")} className="text-sky-600 focus:ring-sky-500" />
                  <div>
                    <strong className="text-sm font-bold text-slate-900 block">Expedited Priority (1-2 Days)</strong>
                    <span className="text-xs text-slate-500">Next day or 2-day delivery via dedicated dispatch.</span>
                  </div>
                </div>
                <span className="text-sm font-bold text-slate-900">$48.50</span>
              </label>
            </div>
            <div className="pt-4 flex justify-between">
              <Button type="button" variant="outline" size="md" onClick={() => setStep(1)}>← Back to Address</Button>
              <Button type="button" variant="primary" size="lg" onClick={handleNextStep}>Continue to Payment →</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Step 3: Secure Payment</h2>
            </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <button type="button" onClick={() => setPaymentMethod("STRIPE")} className={`flex-1 p-4 rounded-xl border text-left transition-all ${paymentMethod === "STRIPE" ? "border-sky-600 bg-sky-50/50 ring-2 ring-sky-200" : "border-slate-200 hover:border-slate-300"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <strong className="text-sm font-bold text-slate-900 block">Credit Card</strong>
                    <img src="/stripe.png" alt="Stripe" className="h-6 object-contain" />
                  </div>
                  <span className="text-[11px] text-slate-500 block">Secure, encrypted payment processing</span>
                </button>
                <button type="button" disabled className="flex-1 p-4 rounded-xl border border-slate-100 bg-slate-50 text-left opacity-60 cursor-not-allowed">
                  <div className="flex items-center justify-between mb-2">
                    <strong className="text-sm font-bold text-slate-500 block">PayPal</strong>
                    <img src="/paypal.png" alt="PayPal" className="h-5 object-contain grayscale opacity-60" />
                  </div>
                  <span className="text-[11px] text-slate-400 block">Coming soon</span>
                </button>
                {allowCredit && (
                  <button type="button" onClick={() => setPaymentMethod("PO_NET30")} className={`flex-1 p-4 rounded-xl border text-left transition-all ${paymentMethod === "PO_NET30" ? "border-sky-600 bg-sky-50/50 ring-2 ring-sky-200" : "border-slate-200 hover:border-slate-300"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <strong className="text-sm font-bold text-slate-900 block">Commercial Net 30</strong>
                      <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className="text-[11px] text-slate-500 block">Invoice payable in 30 days</span>
                  </button>
                )}
              </div>

            {paymentMethod === "STRIPE" ? (
              <div className="space-y-4 p-6 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <p className="text-sm font-semibold text-slate-900 mt-4">Stripe Processing Ready</p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Click "Review Order Details" to enter your payment information securely on the next step.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
                <p className="font-semibold text-slate-900">Commercial Net 30 Terms Verification</p>
                <p>Your company account will be billed upon freight dispatch.</p>
              </div>
            )}

            <div className="pt-4 flex justify-between">
              <Button type="button" variant="outline" size="md" onClick={() => setStep(2)}>← Back to Freight</Button>
              <Button type="button" variant="primary" size="lg" isLoading={isSubmitting} onClick={handleNextStep}>Review Order Details →</Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Step 4: Final Review & Confirmation</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <strong className="text-slate-900 font-bold uppercase tracking-wider block mb-2">Delivery Destination</strong>
                <p className="text-slate-800 font-medium">{customer.fullName}</p>
                {customer.company && <p className="text-slate-600">{customer.company}</p>}
                <p className="text-slate-600">{shippingAddress.addressLine1}</p>
                {shippingAddress.addressLine2 && <p className="text-slate-600">{shippingAddress.addressLine2}</p>}
                <p className="text-slate-600">{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <strong className="text-slate-900 font-bold uppercase tracking-wider block mb-2">Method & Billing</strong>
                <p className="text-slate-800"><span className="font-medium">Freight:</span> {shippingMethod}</p>
                <p className="text-slate-800 mt-1"><span className="font-medium">Payment:</span> {paymentMethod}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Special Delivery Notes</label>
              <textarea rows={2} value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} className="w-full p-3 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:border-sky-500" />
            </div>

            {paymentMethod === "STRIPE" && clientSecret && stripePromise ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <StripeReviewForm 
                  total={total}
                  onBack={() => setStep(3)}
                  onSuccess={(paymentIntentId) => handleFinalSubmit(paymentIntentId)}
                  onError={(msg) => setErrorMessage(msg)}
                  isSubmitting={isSubmitting}
                  setIsSubmitting={setIsSubmitting}
                />
              </Elements>
            ) : (
              <div className="pt-4 flex justify-between items-center">
                <Button type="button" variant="outline" size="md" onClick={() => setStep(3)}>← Back to Payment</Button>
                <Button type="button" variant="accent" size="lg" isLoading={isSubmitting} onClick={() => handleFinalSubmit()}>Place Commercial Order ({formatUSD(total)})</Button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="lg:col-span-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4 sticky top-24">
          <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">Order Review ({totalItems} items)</h3>
          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={item.productId} className="py-3 flex justify-between text-xs gap-3">
                <div className="min-w-0">
                  <strong className="text-slate-900 block truncate">{item.name}</strong>
                  <span className="text-slate-400">Qty: {item.quantity} × {formatUSD(item.price)}</span>
                </div>
                <span className="font-bold text-slate-900 shrink-0">{formatUSD(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600"><span>Items Subtotal:</span><span className="font-semibold text-slate-900">{formatUSD(subtotal)}</span></div>
            <div className="flex justify-between text-slate-600"><span>Freight Shipping:</span><span className="font-semibold text-slate-900">{formatUSD(shippingCost)}</span></div>
            <div className="flex justify-between text-slate-600"><span>Estimated Tax:</span><span className="font-semibold text-slate-900">{formatUSD(tax)}</span></div>
            <div className="pt-2 border-t border-slate-200 flex justify-between text-base font-extrabold text-slate-900"><span>Total:</span><span className="text-xl text-slate-900">{formatUSD(total)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
