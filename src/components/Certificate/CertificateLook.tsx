import React, { useState } from 'react';
import { Award, Download, Share2, Check, Copy } from 'lucide-react';

const CertificateDisplay = () => {
  const [copied, setCopied] = useState(false);

  // Sample certificate data
  const certificate = {
    certNo: 'CERT-2024-A7B9C2',
    studentName: 'John Doe',
    courseName: 'Complete Web Development Bootcamp 2024',
    instructor: 'Jane Smith',
    issueDate: '2024-01-20',
    verificationUrl: 'https://educoach.com/verify/CERT-2024-A7B9C2'
  };

  const copyVerificationLink = () => {
    navigator.clipboard.writeText(certificate.verificationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadCertificate = () => {
    // In production, this would trigger PDF download
    alert('Certificate download started!');
  };

  const shareCertificate = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My Certificate',
        text: `I completed ${certificate.courseName}!`,
        url: certificate.verificationUrl
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-5xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full mb-4">
            <Award size={16} />
            <span className="text-sm font-medium">Certificate Issued</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Congratulations! 🎉
          </h1>
          <p className="text-gray-600">
            You've successfully completed the course
          </p>
        </div>

        {/* Certificate */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-6 border-4 border-gray-100">
          {/* Certificate Content */}
          <div className="p-12 bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Decorative Corner */}
            <div className="absolute top-0 left-0 w-32 h-32 opacity-10">
              <div className="absolute inset-0 border-l-4 border-t-4 border-blue-600 rounded-tl-3xl" />
            </div>
            <div className="absolute bottom-0 right-0 w-32 h-32 opacity-10">
              <div className="absolute inset-0 border-r-4 border-b-4 border-purple-600 rounded-br-3xl" />
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-block">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Award className="w-12 h-12 text-white" />
                </div>
              </div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Certificate of Completion
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto rounded-full" />
            </div>

            {/* Body */}
            <div className="text-center mb-8 space-y-6">
              <p className="text-gray-600 text-lg">This is to certify that</p>
              
              <div>
                <p className="text-5xl font-bold text-gray-900 mb-2">
                  {certificate.studentName}
                </p>
                <div className="w-64 h-0.5 bg-gray-300 mx-auto" />
              </div>

              <p className="text-gray-600 text-lg">has successfully completed</p>

              <p className="text-3xl font-bold text-gray-900 px-8">
                {certificate.courseName}
              </p>

              <p className="text-gray-600">
                Instructed by <span className="font-semibold text-gray-900">{certificate.instructor}</span>
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-8 border-t-2 border-gray-200">
              <div className="text-left">
                <p className="text-sm text-gray-600 mb-1">Issue Date</p>
                <p className="font-semibold text-gray-900">
                  {new Date(certificate.issueDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              <div className="text-center">
                <div className="w-24 h-24 border-2 border-gray-300 rounded-lg flex items-center justify-center mb-2">
                  <span className="text-xs text-gray-500">QR Code</span>
                </div>
                <p className="text-xs text-gray-500">Scan to verify</p>
              </div>

              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">Certificate No.</p>
                <p className="font-mono font-semibold text-gray-900 text-sm">
                  {certificate.certNo}
                </p>
              </div>
            </div>
          </div>

          {/* Signature Strip */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-12 py-4">
            <div className="flex items-center justify-between text-white">
              <div>
                <div className="h-0.5 w-32 bg-white/50 mb-2" />
                <p className="text-sm">Digital Signature</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold">EduCoach Platform</p>
                <p className="text-xs opacity-80">Certified Online Learning</p>
              </div>
              <div>
                <div className="h-0.5 w-32 bg-white/50 mb-2" />
                <p className="text-sm">Authorized</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={downloadCertificate}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold"
          >
            <Download size={20} />
            Download PDF
          </button>
          
          <button
            onClick={shareCertificate}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-semibold"
          >
            <Share2 size={20} />
            Share Certificate
          </button>

          <button
            onClick={copyVerificationLink}
            className="flex items-center justify-center gap-2 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-semibold"
          >
            {copied ? (
              <>
                <Check size={20} className="text-green-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy size={20} />
                Copy Link
              </>
            )}
          </button>
        </div>

        {/* Verification Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Check className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Certificate Verification
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Anyone can verify this certificate by visiting the verification URL or scanning the QR code.
              </p>
              <div className="bg-white rounded-lg px-4 py-2 border border-blue-200">
                <p className="text-sm font-mono text-gray-700 break-all">
                  {certificate.verificationUrl}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Social Sharing */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">Share your achievement</p>
          <div className="flex justify-center gap-4">
            <button className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition">
              <span className="font-bold">in</span>
            </button>
            <button className="w-12 h-12 rounded-full bg-blue-400 text-white flex items-center justify-center hover:bg-blue-500 transition">
              <span className="font-bold">𝕏</span>
            </button>
            <button className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition">
              <span className="font-bold">f</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateDisplay;