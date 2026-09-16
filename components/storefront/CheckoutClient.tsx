"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useSettings } from "@/context/SettingsContext";
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


export function CheckoutClient({ sessionUser, stripePublishableKey, savedAddresses = [], freightMethods = [] }: { sessionUser: any, stripePublishableKey?: string, savedAddresses?: any[], freightMethods?: any[] }) {
  const router = useRouter();
  const { items, subtotal, totalItems, clearCart, isHydrated } = useCart();
  const { ecommerceMode } = useSettings();

  const stripePromise = React.useMemo(() => stripePublishableKey ? loadStripe(stripePublishableKey.trim()) : null, [stripePublishableKey]);
  const [clientSecret, setClientSecret] = useState("");

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const allowCredit = sessionUser?.allowCredit ?? false;

  const defaultAddress = savedAddresses.find((a: any) => a.isDefault) || savedAddresses[0];

  const [customer, setCustomer] = useState({
    fullName: defaultAddress?.fullName || sessionUser?.name || "",
    email: sessionUser?.email || "",
    phone: defaultAddress?.phone || "",
    company: defaultAddress?.company || "",
  });

  const [shippingAddress, setShippingAddress] = useState({
    addressLine1: defaultAddress?.addressLine1 || "",
    addressLine2: defaultAddress?.addressLine2 || "",
    city: defaultAddress?.city || "",
    state: defaultAddress?.state || "TX",
    postalCode: defaultAddress?.postalCode || "",
  });

  const [shippingMethod, setShippingMethod] = useState<string>(freightMethods.length > 0 ? freightMethods[0].id : "standard");
  const [paymentMethod, setPaymentMethod] = useState<"STRIPE" | "PAYPAL" | "PO_NET30">("STRIPE");

  const [orderNotes, setOrderNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedFreight = freightMethods.find((m: any) => m.id === shippingMethod);
  const shippingCost = selectedFreight ? selectedFreight.cost : 0;
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

  const validateStep2 = () => {
    if (!shippingMethod) return "Please select a freight method.";
    return null;
  };

  const handleZipCodeBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const zip = e.target.value.trim();
    if (US_ZIP_REGEX.test(zip)) {
      try {
        const res = await fetch(`https://api.zippopotam.us/us/${zip.split('-')[0]}`);
        if (res.ok) {
          const data = await res.json();
          const place = data.places[0];
          setShippingAddress(prev => ({
            ...prev,
            city: place["place name"],
            state: place["state abbreviation"]
          }));
        }
      } catch (err) {
        console.error("Zip code lookup failed", err);
      }
    }
  };

  const handleAddressSelect = (addr: any) => {
    setCustomer(prev => ({
      ...prev,
      fullName: addr.fullName,
      phone: addr.phone || "",
      company: addr.company || "",
    }));
    setShippingAddress({
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || "",
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
    });
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
      if (!ecommerceMode) {
        // Bypass Step 3 (Payment) completely for Catalog/Quote Mode
        setStep(4);
      } else {
        setStep(3);
      }
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
      const isQuote = !ecommerceMode;
      const finalPaymentMethod = isQuote ? "QUOTE" : paymentMethod;
      const finalPaymentDetails = isQuote
        ? { type: "QUOTE" }
        : paymentIntentId
        ? { paymentIntentId }
        : { poNumber: "NET30-PENDING" };

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          shippingAddress,
          shippingMethod,
          paymentMethod: finalPaymentMethod,
          paymentDetails: finalPaymentDetails,
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
          {ecommerceMode ? (
            <div className="grid grid-cols-4 text-center text-xs font-bold">
              <div className={`pb-2 border-b-2 ${step >= 1 ? "border-sky-600 text-sky-600" : "border-slate-200 text-slate-400"}`}>1. Address</div>
              <div className={`pb-2 border-b-2 ${step >= 2 ? "border-sky-600 text-sky-600" : "border-slate-200 text-slate-400"}`}>2. Freight</div>
              <div className={`pb-2 border-b-2 ${step >= 3 ? "border-sky-600 text-sky-600" : "border-slate-200 text-slate-400"}`}>3. Payment</div>
              <div className={`pb-2 border-b-2 ${step >= 4 ? "border-sky-600 text-sky-600" : "border-slate-200 text-slate-400"}`}>4. Review</div>
            </div>
          ) : (
            <div className="grid grid-cols-3 text-center text-xs font-bold">
              <div className={`pb-2 border-b-2 ${step >= 1 ? "border-sky-600 text-sky-600" : "border-slate-200 text-slate-400"}`}>1. Address & Contact</div>
              <div className={`pb-2 border-b-2 ${step >= 2 ? "border-sky-600 text-sky-600" : "border-slate-200 text-slate-400"}`}>2. Freight Preference</div>
              <div className={`pb-2 border-b-2 ${step >= 4 ? "border-sky-600 text-sky-600" : "border-slate-200 text-slate-400"}`}>3. Review Quote</div>
            </div>
          )}
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
                <h2 className="text-lg font-bold text-slate-900">Step 1: Shipping Information</h2>
              </div>
              
              {savedAddresses && savedAddresses.length > 0 && (
                <div className="mb-6 p-4 rounded-xl border border-sky-100 bg-sky-50">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Use a Saved Address</label>
                  <select 
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                    onChange={(e) => {
                      const addr = savedAddresses.find((a: any) => a.id === e.target.value);
                      if (addr) handleAddressSelect(addr);
                    }}
                    defaultValue={defaultAddress?.id || ""}
                  >
                    <option value="" disabled>Select an address...</option>
                    {savedAddresses.map((a: any) => (
                      <option key={a.id} value={a.id}>
                        {a.fullName} - {a.addressLine1}, {a.city}, {a.state} {a.postalCode}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Full Name" required name="fullName" value={customer.fullName} onChange={(e) => setCustomer({ ...customer, fullName: e.target.value })} />
                  <Input label="Email Address" type="email" required name="email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Phone Number" required name="phone" placeholder="(555) 555-5555" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
                  <Input label="Company Name (Optional)" name="company" placeholder="Pinnacle Logistics" value={customer.company} onChange={(e) => setCustomer({ ...customer, company: e.target.value })} />
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <Input label="Address Line 1" required name="addressLine1" placeholder="123 Industrial Way" value={shippingAddress.addressLine1} onChange={(e) => setShippingAddress({ ...shippingAddress, addressLine1: e.target.value })} />
                </div>
                <Input label="Address Line 2 (Optional)" name="addressLine2" placeholder="Suite 100, Loading Dock B" value={shippingAddress.addressLine2} onChange={(e) => setShippingAddress({ ...shippingAddress, addressLine2: e.target.value })} />
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input label="City" required name="city" value={shippingAddress.city} onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })} />
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">State</label>
                    <select required className="w-full p-3 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500" value={shippingAddress.state} onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}>
                      <option value="">Select State</option>
                      <option value="TX">Texas (TX)</option>
                      <option value="CA">California (CA)</option>
                      <option value="NY">New York (NY)</option>
                      <option value="FL">Florida (FL)</option>
                      <option value="IL">Illinois (IL)</option>
                      <option value="PA">Pennsylvania (PA)</option>
                    </select>
                  </div>
                  <Input label="ZIP Code" required name="postalCode" placeholder="75201" value={shippingAddress.postalCode} onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })} onBlur={handleZipCodeBlur} />
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
                {freightMethods.map((method: any) => (
                  <label key={method.id} className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${shippingMethod === method.id ? "border-sky-600 bg-sky-50/50 ring-2 ring-sky-200" : "border-slate-200 hover:border-slate-300"}`}>
                    <div className="flex items-center gap-4">
                      <input type="radio" name="shipping" value={method.id} checked={shippingMethod === method.id} onChange={() => setShippingMethod(method.id)} className="text-sky-600 focus:ring-sky-500" />
                      <div>
                        <strong className="text-sm font-bold text-slate-900 block">{method.name}</strong>
                        {method.description && <span className="text-xs text-slate-500">{method.description}</span>}
                      </div>
                    </div>
                    {ecommerceMode ? (
                      <span className="text-sm font-bold text-slate-900">{formatUSD(method.cost)}</span>
                    ) : (
                      <span className="text-xs font-bold text-slate-500 uppercase bg-slate-100 px-2 py-1 rounded">Included in Quote</span>
                    )}
                  </label>
                ))}
              </div>
            <div className="pt-4 flex justify-between">
              <Button type="button" variant="outline" size="md" onClick={() => setStep(1)}>&larr; Back to Address</Button>
              <Button type="button" variant="primary" size="lg" onClick={handleNextStep}>
                {ecommerceMode ? "Continue →" : "Continue to Quote Review →"}
              </Button>
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
              <Button type="button" variant="primary" size="lg" isLoading={isSubmitting} onClick={handleNextStep}>Review Order Details &rarr;</Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                {ecommerceMode ? "Step 4: Final Review & Confirmation" : "Step 3: Review & Submit Quote Request"}
              </h2>
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
                <p className="text-slate-800"><span className="font-medium">Freight:</span> {selectedFreight?.name}</p>
                <p className="text-slate-800 mt-1">
                  <span className="font-medium">{ecommerceMode ? "Payment:" : "Terms:"}</span>{" "}
                  {ecommerceMode ? paymentMethod : "Commercial Wholesale Quote"}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Special Delivery Notes</label>
              <textarea rows={2} value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} className="w-full p-3 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:border-sky-500" />
            </div>

            {ecommerceMode && paymentMethod === "STRIPE" && clientSecret && stripePromise ? (
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
                <Button type="button" variant="outline" size="md" onClick={() => setStep(ecommerceMode ? 3 : 2)}>
                  {ecommerceMode ? "← Back to Payment" : "← Back to Freight"}
                </Button>
                <Button
                  type="button"
                  variant="accent"
                  size="lg"
                  isLoading={isSubmitting}
                  onClick={() => handleFinalSubmit()}
                >
                  {ecommerceMode ? `Place Commercial Order (${formatUSD(total)})` : "Submit Quote Request"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="lg:col-span-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4 sticky top-24">
          <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
            {ecommerceMode ? `Order Review (${totalItems} items)` : `Quote Review (${totalItems} items)`}
          </h3>
          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={item.productId} className="py-3 flex justify-between text-xs gap-3">
                <div className="min-w-0">
                  <strong className="text-slate-900 block truncate">{item.name}</strong>
                  <span className="text-slate-400">
                    Qty: {item.quantity}{ecommerceMode ? ` × ${formatUSD(item.price)}` : ""}
                  </span>
                </div>
                {ecommerceMode && (
                  <span className="font-bold text-slate-900 shrink-0">{formatUSD(item.price * item.quantity)}</span>
                )}
              </div>
            ))}
          </div>
          {ecommerceMode ? (
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600"><span>Items Subtotal:</span><span className="font-semibold text-slate-900">{formatUSD(subtotal)}</span></div>
              <div className="flex justify-between text-slate-600"><span>Freight Shipping:</span><span className="font-semibold text-slate-900">{formatUSD(shippingCost)}</span></div>
              <div className="flex justify-between text-slate-600"><span>Estimated Tax:</span><span className="font-semibold text-slate-900">{formatUSD(tax)}</span></div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-base font-extrabold text-slate-900"><span>Total:</span><span className="text-xl text-slate-900">{formatUSD(total)}</span></div>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Total Items in Quote:</span>
                <span className="font-semibold text-slate-900">{totalItems} units</span>
              </div>
              <div className="p-3 bg-sky-50 border border-sky-100 rounded-lg text-xs text-slate-600 space-y-1 mt-2">
                <p className="font-bold text-slate-900">No Payment Due Today</p>
                <p className="text-slate-500 leading-relaxed">
                  Our commercial sales team will review your quantities and contact you with a formal quote including freight and volume discounts.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
