"use client";

import React, { useState } from "react";

export interface InquiryRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: string;
  createdAt: string;
}

export default function InquiriesClient({
  initialInquiries,
}: {
  initialInquiries: InquiryRecord[];
}) {
  const [inquiries, setInquiries] = useState<InquiryRecord[]>(initialInquiries);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryRecord | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const filtered = inquiries.filter((inq) => {
    const matchesStatus = statusFilter === "ALL" || inq.status === statusFilter;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      inq.name.toLowerCase().includes(q) ||
      inq.email.toLowerCase().includes(q) ||
      inq.message.toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });

  const handleStatusChange = async (inqId: string, newStatus: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/inquiries/${inqId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update inquiry status");
      }

      setInquiries((prev) =>
        prev.map((i) => (i.id === inqId ? { ...i, status: newStatus } : i))
      );
      if (selectedInquiry && selectedInquiry.id === inqId) {
        setSelectedInquiry((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      NEW: "bg-sky-50 text-sky-700 border-sky-200",
      READ: "bg-amber-50 text-amber-700 border-amber-200",
      RESPONDED: "bg-emerald-50 text-emerald-700 border-emerald-200",
      ARCHIVED: "bg-slate-100 text-slate-600 border-slate-200",
    };
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${
          map[status] || "bg-slate-100 text-slate-700 border-slate-200"
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-3 flex-1">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by sender name, email, or text..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3 top-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="ALL">All Inquiries</option>
            <option value="NEW">New</option>
            <option value="READ">Read</option>
            <option value="RESPONDED">Responded</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Showing {filtered.length} {filtered.length === 1 ? "inquiry" : "inquiries"}
        </span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-slate-900">No contact inquiries found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search || statusFilter !== "ALL"
              ? "No messages match your active filters."
              : "Commercial inquiries sent from the public /contact form will be displayed here."}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Message Snippet</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((inq) => (
                  <tr key={inq.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(inq.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{inq.name}</div>
                      <div className="text-xs text-slate-400">{inq.email}</div>
                      {inq.phone && <div className="text-[11px] text-slate-400">{inq.phone}</div>}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 max-w-md">
                      <p className="line-clamp-2 text-xs leading-relaxed">{inq.message}</p>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <select
                        value={inq.status}
                        disabled={isUpdating}
                        onChange={(e) => handleStatusChange(inq.id, e.target.value)}
                        className="text-xs font-semibold px-2 py-1 bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      >
                        <option value="NEW">NEW</option>
                        <option value="READ">READ</option>
                        <option value="RESPONDED">RESPONDED</option>
                        <option value="ARCHIVED">ARCHIVED</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedInquiry(inq)}
                        className="text-xs font-semibold text-sky-600 hover:text-sky-800 hover:bg-sky-50 px-2.5 py-1.5 rounded transition-colors"
                      >
                        Read Full
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inquiry Detail Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Commercial Contact Inquiry
                </span>
                <h3 className="text-lg font-bold text-slate-900">{selectedInquiry.name}</h3>
              </div>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1 border border-slate-200">
              <p>
                <strong className="text-slate-700">Email:</strong>{" "}
                <a href={`mailto:${selectedInquiry.email}`} className="text-sky-600 hover:underline">
                  {selectedInquiry.email}
                </a>
              </p>
              {selectedInquiry.phone && (
                <p>
                  <strong className="text-slate-700">Phone:</strong> {selectedInquiry.phone}
                </p>
              )}
              <p>
                <strong className="text-slate-700">Received:</strong>{" "}
                {new Date(selectedInquiry.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-lg text-xs leading-relaxed text-slate-800 whitespace-pre-wrap max-h-60 overflow-y-auto">
              {selectedInquiry.message}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-700">Status:</span>
                <select
                  value={selectedInquiry.status}
                  onChange={(e) => handleStatusChange(selectedInquiry.id, e.target.value)}
                  className="text-xs px-2.5 py-1 border border-slate-300 rounded font-semibold"
                >
                  <option value="NEW">NEW</option>
                  <option value="READ">READ</option>
                  <option value="RESPONDED">RESPONDED</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <a
                  href={`mailto:${selectedInquiry.email}?subject=Re: Pinnacle Distributing Inquiry`}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg"
                >
                  Reply via Email
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedInquiry(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
