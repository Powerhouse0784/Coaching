'use client';
import React, { useState, useEffect } from 'react';
import { CreditCard, Tag, Lock, CheckCircle, X, Sparkles } from 'lucide-react';

interface Coupon {
  code: string;
  discount: number;
  isPercentage: boolean;
  percentage: number;
}

interface OrderResponse {
  success: boolean;
  data: {
    key: string;
    amount: number;
    currency: string;
    courseName: string;
    orderId: string;
  };
  error?: string;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface VerifyResponse {
  success: boolean;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PaymentCheckout = () => {
  const [showCheckout, setShowCheckout] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(false);

  // Sample course data
  const course = {
    id: 'course-1',
    title: 'Complete React Development Course 2024',
    instructor: 'John Doe',
    price: 2999,
    originalPrice: 4999,
    thumbnail: null,
    features: [
      '50+ hours of video content',
      'Lifetime access',
      'Certificate of completion',
      'Live doubt solving sessions',
      'Projects & assignments'
    ]
  };

  const [finalAmount, setFinalAmount] = useState(course.price);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      // Mock coupon validation
      if (couponCode.toUpperCase() === 'SAVE20') {
        const discount = Math.floor(course.price * 0.2);
        setAppliedCoupon({
          code: couponCode.toUpperCase(),
          discount: discount,
          isPercentage: true,
          percentage: 20
        });
        setFinalAmount(course.price - discount);
        alert('Coupon applied successfully! 🎉');
      } else {
        alert('Invalid coupon code');
      }
      setLoading(false);
    }, 1000);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setFinalAmount(course.price);
    setCouponCode('');
  };

  const initiatePayment = async () => {
    setLoading(true);

    try {
      // Step 1: Create order
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.id,
          couponCode: appliedCoupon?.code
        })
      });

      const orderData: OrderResponse = await orderRes.json();

      if (!orderData.success) {
        throw new Error(orderData.error || 'Order creation failed');
      }

      // Step 2: Initialize Razorpay
      const options = {
        key: orderData.data.key,
        amount: orderData.data.amount * 100,
        currency: orderData.data.currency,
        name: 'EduCoach',
        description: orderData.data.courseName,
        order_id: orderData.data.orderId,
        handler: async (response: RazorpayResponse) => {
          // Step 3: Verify payment
          const verifyRes = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
          });

          const verifyData: VerifyResponse = await verifyRes.json();

          if (verifyData.success) {
            // Success! Redirect to course
            window.location.href = `/student/courses/${course.id}`;
          } else {
            alert('Payment verification failed');
          }
        },
        prefill: {
          name: 'Student Name',
          email: 'student@example.com',
          contact: '9999999999'
        },
        theme: {
          color: '#2563eb'
        }
      };

      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        const razorpay = new window.Razorpay(options);
        razorpay.open();
        setLoading(false);
      };
      document.body.appendChild(script);

    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto py-8">
        {/* Course Preview */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-start gap-6">
            <div className="w-48 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white text-4xl">📚</span>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{course.title}</h1>
              <p className="text-gray-600 mb-4">by {course.instructor}</p>
              <div className="flex items-center gap-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">₹{course.price}</span>
                  <span className="text-lg text-gray-400 line-through">₹{course.originalPrice}</span>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                    {Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100)}% OFF
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Course Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* What's Included */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">What's Included</h2>
              <ul className="space-y-3">
                {course.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Security Badges */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-6 h-6 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Secure Payment</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Your payment information is encrypted and secure. We use industry-standard security measures.
              </p>
              <div className="flex items-center gap-4">
                <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" alt="Razorpay" className="h-6" />
                <span className="text-xs text-gray-500">Powered by Razorpay</span>
              </div>
            </div>
          </div>

          {/* Right: Payment Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-700">
                  <span>Original Price</span>
                  <span>₹{course.originalPrice}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-₹{course.originalPrice - course.price}</span>
                </div>
                
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon ({appliedCoupon.code})</span>
                    <span>-₹{appliedCoupon.discount}</span>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="flex justify-between text-xl font-bold text-gray-900">
                    <span>Total</span>
                    <span>₹{finalAmount}</span>
                  </div>
                </div>
              </div>

              {/* Coupon Code */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Have a coupon code?
                </label>
                {!appliedCoupon ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="SAVE20"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={applyCoupon}
                      disabled={loading || !couponCode.trim()}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Tag size={20} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">
                        {appliedCoupon.code} applied!
                      </span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-green-600 hover:text-green-700"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}
              </div>

              {/* Checkout Button */}
              <button
                onClick={initiatePayment}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard size={20} />
                    Proceed to Payment
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                By completing your purchase, you agree to our Terms of Service
              </p>

              {/* Money Back Guarantee */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-gray-900 text-sm">30-Day Money-Back Guarantee</span>
                </div>
                <p className="text-xs text-gray-600">
                  Not satisfied? Get a full refund within 30 days, no questions asked.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCheckout;
