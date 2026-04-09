import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../services/api";

/**
 * Pre-registration checklist — matches PHP checklist.blade.php
 * Shows required documents list, PDF download, then proceed button.
 */
export default function Checklist() {
  const navigate = useNavigate();
  const [downloaded, setDownloaded] = useState(false);
  const userType = localStorage.getItem("vp_company_status") || "";

  const handleProceed = () => {
    // Same routing logic as PHP: service providers go to service-provider page
    const status = (userType || "").toLowerCase();
    if (status.includes("service")) {
      navigate("/vendor/service-provider");
    } else {
      navigate("/vendor/dashboard");
    }
  };

  const handleDownload = () => {
    setDownloaded(true);
    // Create a simple informational text file about required documents
    const content = `JIGISHA VENDOR PORTAL - REQUIRED DOCUMENTS

Please keep the following documents ready before proceeding with registration:

MANDATORY DOCUMENTS:
1. PAN Card (scan/photo)
2. GST Certificate (scan/photo)
3. Company Registration Certificate
4. MSME Certificate (if applicable)
5. ISO Certificate (if applicable)

FOR MANUFACTURERS / PRODUCT VENDORS:
6. Product Catalogue or Specifications
7. Factory Address Proof

FOR SERVICE PROVIDERS:
6. Service Agreement / Profile
7. Client References

CONTACT INFORMATION:
8. Authorised Signatory Details
9. Contact Person Details

NOTE: All documents should be in PDF or JPG/PNG format.
      Maximum file size: 10MB per document.

For assistance, contact: support@jigisha.com
`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Vendor_Registration_Required_Documents.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <img
            src="/finallogojigi.jpeg"
            alt="Jigisha"
            className="h-12 w-auto"
            onError={e => { e.target.style.display = "none"; }}
          />
          <button
            onClick={() => { authApi.logout().catch(() => {}); navigate("/login"); }}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 w-full max-w-2xl overflow-hidden">
          {/* Title section */}
          <div className="bg-blue-600 px-8 py-6 text-center">
            <h1 className="text-2xl font-bold text-white">Vendor Registration</h1>
            <p className="text-blue-100 text-sm mt-1">Please read the instructions before proceeding</p>
          </div>

          <div className="px-8 py-6 space-y-6">
            {/* Warning alert */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <div>
                <p className="text-sm font-semibold text-yellow-800 mb-1">Important Instructions</p>
                <p className="text-sm text-yellow-700">
                  Before starting your registration, please download and review the list of required documents.
                  Keep all documents ready in digital format (PDF/JPG/PNG) before proceeding.
                </p>
              </div>
            </div>

            {/* Required documents list */}
            <div>
              <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5d87ff" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                </svg>
                Documents Required for Registration
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: "📄", label: "PAN Card", required: true },
                  { icon: "📋", label: "GST Certificate", required: true },
                  { icon: "🏢", label: "Company Registration", required: true },
                  { icon: "🏭", label: "MSME Certificate", required: false },
                  { icon: "✅", label: "ISO Certificate", required: false },
                  { icon: "📦", label: "Product Catalogue / Specs", required: true },
                  { icon: "📍", label: "Factory / Office Address Proof", required: true },
                  { icon: "👤", label: "Authorised Signatory Details", required: true },
                ].map((doc, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50">
                    <span className="text-xl">{doc.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{doc.label}</p>
                    </div>
                    {doc.required ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">Required</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Optional</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Download PDF button */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-blue-600 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-50 transition w-full sm:w-auto justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download Document Checklist
                {downloaded && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </button>

              <button
                onClick={handleProceed}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition w-full sm:w-auto justify-center ${
                  downloaded
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
                disabled={!downloaded}
              >
                Proceed to Registration
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>

            {!downloaded && (
              <p className="text-xs text-gray-400 text-center">
                Please download the document checklist to enable the Proceed button.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
