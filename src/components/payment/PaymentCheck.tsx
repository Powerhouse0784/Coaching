// app/payment-checkout/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  CreditCard, Tag, Lock, CheckCircle, X, Sparkles,
  Package, Shield, Clock, Star, ChevronDown,
  Truck, Printer, FileText, BadgePercent, Wallet,
  ArrowRight, Phone, MapPin, User, Check, AlertCircle,
  IndianRupee, Calendar, Award, TrendingUp, Users,
  Download, Eye, Loader, RefreshCw, BookOpen, Layers,
  GraduationCap, BookMarked, ChevronRight, Info, QrCode,
  DollarSign, Home, Mail, Send, MessageCircle, ThumbsUp, ThumbsDown,
  Upload
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FeePlan {
  id: string;
  class: string;
  subject: string;
  price: number;
  originalPrice: number;
  duration: string;
  popular: boolean;
}

interface Note {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  class: string;
  topic: string | null;
  chapter: string | null;
  fileName: string;
  fileType: string;
  fileSize: string;
  thumbnailUrl: string | null;
  isPinned: boolean;
  downloads: number;
  views: number;
  teacher: { name: string | null; avatar: string | null };
}

interface CartItem {
  id: string;
  type: 'fee' | 'hardcopy';
  name: string;
  price: number;
  qty?: number;
  subject?: string;
  class?: string;
}

interface AddressForm {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

interface Order {
  id: string;
  items: CartItem[];
  address: AddressForm | null;
  subtotal: number;
  couponDiscount: number;
  total: number;
  couponCode: string | null;
  paymentMethod: 'qr' | 'cod' | null;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  paymentProof?: string;
}

const HARDCOPY_PRICE = 30;

// ─── Subject colour map ───────────────────────────────────────────────────────
const SUB_COLOR: Record<string, { light: string; dark: string; dot: string; grad: string }> = {
  Mathematics:  { light: 'bg-blue-100 text-blue-700 border-blue-200',    dark: 'bg-blue-900/40 text-blue-300 border-blue-800',    dot: 'bg-blue-500',    grad: 'from-blue-500 to-cyan-600'       },
  Physics:      { light: 'bg-violet-100 text-violet-700 border-violet-200', dark: 'bg-violet-900/40 text-violet-300 border-violet-800', dot: 'bg-violet-500', grad: 'from-violet-500 to-purple-600'  },
  Chemistry:    { light: 'bg-emerald-100 text-emerald-700 border-emerald-200', dark: 'bg-emerald-900/40 text-emerald-300 border-emerald-800', dot: 'bg-emerald-500', grad: 'from-emerald-500 to-teal-600' },
  Biology:      { light: 'bg-green-100 text-green-700 border-green-200',  dark: 'bg-green-900/40 text-green-300 border-green-800',  dot: 'bg-green-500',   grad: 'from-green-500 to-lime-600'      },
  Science:      { light: 'bg-teal-100 text-teal-700 border-teal-200',     dark: 'bg-teal-900/40 text-teal-300 border-teal-800',     dot: 'bg-teal-500',    grad: 'from-teal-500 to-emerald-600'    },
  English:      { light: 'bg-pink-100 text-pink-700 border-pink-200',     dark: 'bg-pink-900/40 text-pink-300 border-pink-800',     dot: 'bg-pink-500',    grad: 'from-pink-500 to-rose-600'       },
  'Social Sc.': { light: 'bg-amber-100 text-amber-700 border-amber-200',  dark: 'bg-amber-900/40 text-amber-300 border-amber-800',  dot: 'bg-amber-500',   grad: 'from-amber-500 to-orange-600'    },
  'All Subjects':{ light: 'bg-indigo-100 text-indigo-700 border-indigo-200', dark: 'bg-indigo-900/40 text-indigo-300 border-indigo-800', dot: 'bg-indigo-500', grad: 'from-indigo-500 to-violet-600' },
};

function getSubColor(sub: string, dm: boolean) {
  return SUB_COLOR[sub]
    ? (dm ? SUB_COLOR[sub].dark : SUB_COLOR[sub].light)
    : (dm ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-gray-100 text-gray-600 border-gray-200');
}
function getGrad(sub: string) { return SUB_COLOR[sub]?.grad || 'from-gray-500 to-gray-600'; }
function fmt(n: number) { return n.toLocaleString('en-IN'); }

// ─────────────────────────────────────────────────────────────────────────────
export default function PaymentCheckout() {
  const { data: session } = useSession();

  // Dark mode
  const [dm, setDm] = useState(false);
  useEffect(() => {
    const check = () => setDm(document.documentElement.classList.contains('dark'));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  // Tab
  const [tab, setTab] = useState<'fees' | 'hardcopy' | 'cart'>('fees');

  // Fee plans from API
  const [feePlans, setFeePlans] = useState<FeePlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>('');

  // Notes from API
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [noteSearch, setNoteSearch] = useState('');
  const [noteSubjectFilter, setNoteSubjectFilter] = useState('all');
  const [noteClassFilter, setNoteClassFilter] = useState('all');

  // Cart
  const [selectedPlans, setSelectedPlans] = useState<Record<string, boolean>>({});
  const [hardcopyQty, setHardcopyQty] = useState<Record<string, number>>({});
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; label: string } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  // Address
  const [showAddress, setShowAddress] = useState(false);
  const [address, setAddress] = useState<AddressForm>({ 
    name: '', phone: '', email: session?.user?.email || '', 
    address: '', city: '', state: '', pincode: '', landmark: '' 
  });

  // Payment
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'qr' | 'cod' | null>(null);
  const [orderPlaced, setOrderPlaced] = useState<Order | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [orderStatus, setOrderStatus] = useState<Order | null>(null);
  const [trackingOrderId, setTrackingOrderId] = useState('');
  const [showTrackModal, setShowTrackModal] = useState(false);

  // Minimum order amount
  const MIN_ORDER_AMOUNT = 200;

  // ── Fetch fee plans ──
  useEffect(() => {
    fetch('/api/payments?action=fee-plans')
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setFeePlans(d.plans);
          const classes = [...new Set(d.plans.map((p: FeePlan) => p.class))] as string[];
          if (classes.length) setSelectedClass(classes[0]);
        }
      })
      .catch(console.error)
      .finally(() => setPlansLoading(false));
  }, []);

  // ── Fetch notes for hardcopy ──
  useEffect(() => {
    fetch('/api/payments?action=notes')
      .then(r => r.json())
      .then(d => { if (d.success) setNotes(d.notes); })
      .catch(console.error)
      .finally(() => setNotesLoading(false));
  }, []);

  // ── Derived data ──
  const classes = [...new Set(feePlans.map(p => p.class))];
  const plansForClass = feePlans.filter(p => p.class === selectedClass);

  const noteSubjects = ['all', ...new Set(notes.map(n => n.subject))];
  const noteClasses  = ['all', ...new Set(notes.map(n => n.class))];
  const filteredNotes = notes.filter(n => {
    const ms = noteSubjectFilter === 'all' || n.subject === noteSubjectFilter;
    const mc = noteClassFilter   === 'all' || n.class   === noteClassFilter;
    const mq = !noteSearch || n.title.toLowerCase().includes(noteSearch.toLowerCase()) || n.subject.toLowerCase().includes(noteSearch.toLowerCase());
    return ms && mc && mq;
  });

  // ── Cart items ──
  const cartItems: CartItem[] = [
    ...feePlans.filter(p => selectedPlans[p.id]).map(p => ({
      id: p.id, type: 'fee' as const,
      name: `${p.class} · ${p.subject} (${p.duration})`,
      price: p.price, subject: p.subject, class: p.class,
    })),
    ...Object.entries(hardcopyQty).filter(([, q]) => q > 0).map(([noteId, qty]) => {
      const note = notes.find(n => n.id === noteId);
      return {
        id: noteId, type: 'hardcopy' as const,
        name: note?.title || 'Note',
        price: HARDCOPY_PRICE * qty, qty,
        subject: note?.subject,
      };
    }),
  ];

  const subtotal = cartItems.reduce((s, i) => s + i.price, 0);
  const couponDiscount = appliedCoupon?.discount || 0;
  const total = Math.max(subtotal - couponDiscount, 0);
  const hasHardcopy = cartItems.some(i => i.type === 'hardcopy');
  const hasOnlyFees = cartItems.length > 0 && cartItems.every(i => i.type === 'fee');
  const meetsMinOrder = total >= MIN_ORDER_AMOUNT;

  // ── Coupon ──
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError('');
    setCouponLoading(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validate-coupon', code: couponCode, subtotal }),
      });
      const data = await res.json();
      if (!res.ok) { setCouponError(data.error); }
      else { setAppliedCoupon({ code: data.code, discount: data.discount, label: data.label }); }
    } catch { setCouponError('Network error. Try again.'); }
    finally { setCouponLoading(false); }
  };

  // ── Track Order Handler ──
  const handleTrackOrder = async () => {
    if (!trackingOrderId) return;
    try {
      const res = await fetch(`/api/payments?action=order-status&orderId=${trackingOrderId}`);
      const data = await res.json();
      if (data.success) {
        setOrderStatus(data.order);
        setShowTrackModal(true);
        setTrackingOrderId('');
      } else {
        alert('Order not found');
      }
    } catch (error) {
      alert('Failed to fetch order');
    }
  };

  // ── Place Order ──
  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return;
    if (!meetsMinOrder) {
      alert(`Minimum order amount is ₹${MIN_ORDER_AMOUNT}. Please add more items.`);
      return;
    }
    if (hasHardcopy) {
      if (!address.name || !address.phone || !address.address || !address.city || !address.pincode) {
        alert('Please fill all delivery address fields');
        setShowAddress(true);
        return;
      }
    }

    setOrderLoading(true);
    try {
      const res = await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create-order',
            items: cartItems,
            subtotal,
            couponDiscount,
            total,
            couponCode: appliedCoupon?.code || null,
            address: hasHardcopy ? address : null,
            userEmail: session?.user?.email,
          }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      
      setOrderPlaced(data.order);
      setShowPaymentModal(true);
    } catch (error: any) {
      alert(error?.message || 'Failed to place order');
    } finally {
      setOrderLoading(false);
    }
  };

  // ── Upload Payment Proof (for QR) ──
  const handleUploadProof = async () => {
    if (!paymentProof || !orderPlaced) return;
    setUploadingProof(true);
    const formData = new FormData();
    formData.append('proof', paymentProof);
    formData.append('orderId', orderPlaced.id);

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        alert('Payment proof uploaded successfully! We will verify and confirm your order.');
        setShowPaymentModal(false);
        setOrderPlaced(null);
        // Reset cart
        setSelectedPlans({});
        setHardcopyQty({});
        setAppliedCoupon(null);
        setCouponCode('');
        setTab('fees');
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (error) {
      alert('Failed to upload proof');
    } finally {
      setUploadingProof(false);
    }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // PAYMENT MODAL
  // ════════════════════════════════════════════════════════════════════════════
  if (showPaymentModal && orderPlaced) {
    // Determine available payment methods
    const showQR = true; // QR always available
    const showCOD = !hasOnlyFees; // COD only if not only fees

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className={`max-w-2xl w-full rounded-3xl overflow-hidden shadow-2xl ${dm ? 'bg-gray-900' : 'bg-white'}`}>
          <div className={`p-6 border-b-2 ${dm ? 'border-gray-800' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-black ${dm ? 'text-white' : 'text-gray-900'}`}>Complete Payment</h2>
              <button onClick={() => setShowPaymentModal(false)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className={`text-sm mt-1 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Order #{orderPlaced.id.slice(0, 8)} · Total: ₹{fmt(orderPlaced.total)}</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Payment Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* QR Payment - Always Available */}
              <button
                onClick={() => setPaymentMethod('qr')}
                className={`p-5 rounded-2xl border-2 text-center transition-all ${
                  paymentMethod === 'qr'
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30'
                    : dm ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                  <QrCode className="w-8 h-8 text-white" />
                </div>
                <h3 className={`font-black mb-1 ${dm ? 'text-white' : 'text-gray-900'}`}>Pay via QR</h3>
                <p className={`text-xs ${dm ? 'text-gray-500' : 'text-gray-400'}`}>Scan & pay with any UPI app</p>
              </button>

              {/* COD - Only if not only fees */}
              {showCOD && (
                <button
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-5 rounded-2xl border-2 text-center transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                      : dm ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <DollarSign className="w-8 h-8 text-white" />
                  </div>
                  <h3 className={`font-black mb-1 ${dm ? 'text-white' : 'text-gray-900'}`}>Cash on Delivery</h3>
                  <p className={`text-xs ${dm ? 'text-gray-500' : 'text-gray-400'}`}>Pay when you receive</p>
                </button>
              )}
            </div>

            {/* QR Section */}
            {paymentMethod === 'qr' && (
              <div className={`p-6 rounded-2xl border-2 text-center ${dm ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <h3 className={`font-black mb-3 ${dm ? 'text-white' : 'text-gray-900'}`}>Scan & Pay</h3>
                <div className="flex justify-center mb-4">
                  <div className="w-48 h-48 bg-white rounded-2xl shadow-lg flex items-center justify-center p-4">
                    <img 
                      src="/paytm-qr-placeholder.jpeg" 
                      alt="Paytm QR Code"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="text-center"><QrCode className="w-20 h-20 text-gray-400 mx-auto mb-2"/><p class="text-sm text-gray-500">Paytm QR Code</p><p class="text-xs text-gray-400">UPI: 9810493309@ptsbi</p></div>';
                        }
                      }}
                    />
                  </div>
                </div>
                <p className={`text-sm mb-4 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>
                  Scan this QR code using any UPI app (Paytm, Google Pay, PhonePe) and pay <span className="font-black text-violet-500">₹{fmt(orderPlaced.total)}</span>
                </p>
                
                <div className="space-y-3">
                  <div className={`p-3 rounded-xl ${dm ? 'bg-gray-700' : 'bg-white'}`}>
                    <p className={`text-xs font-mono ${dm ? 'text-gray-400' : 'text-gray-500'}`}>UPI ID: <span className="font-bold text-violet-500">9810493309@ptsbi</span></p>
                  </div>
                  
                  <div className="border-t-2 pt-4">
                    <label className={`block text-sm font-bold mb-2 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Upload Payment Screenshot</label>
                    <div className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                      paymentProof 
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/20' 
                        : dm ? 'border-gray-600 hover:border-violet-500' : 'border-gray-300 hover:border-violet-400'
                    }`}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setPaymentProof(e.target.files?.[0] || null)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Upload className={`w-8 h-8 mx-auto mb-2 ${paymentProof ? 'text-violet-500' : dm ? 'text-gray-500' : 'text-gray-400'}`} />
                      <p className={`text-sm ${paymentProof ? 'text-violet-500 font-medium' : dm ? 'text-gray-400' : 'text-gray-500'}`}>
                        {paymentProof ? paymentProof.name : 'Click or drag to upload screenshot'}
                      </p>
                      <p className={`text-xs mt-1 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>
                        PNG, JPG up to 5MB
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleUploadProof}
                    disabled={!paymentProof || uploadingProof}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {uploadingProof ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
                    {uploadingProof ? 'Uploading...' : 'Submit Payment Proof'}
                  </button>
                </div>
              </div>
            )}

            {/* COD Section */}
            {paymentMethod === 'cod' && (
              <div className={`p-6 rounded-2xl border-2 ${dm ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <Truck className="w-8 h-8 text-emerald-500" />
                  <div>
                    <h3 className={`font-black ${dm ? 'text-white' : 'text-gray-900'}`}>Cash on Delivery</h3>
                    <p className={`text-sm ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Pay when you receive the order</p>
                  </div>
                </div>
                <div className={`p-4 rounded-xl mb-4 ${dm ? 'bg-gray-700' : 'bg-white'}`}>
                  <p className="text-sm">📦 Order will be confirmed after admin approval</p>
                  <p className="text-sm mt-1">💰 Pay ₹{fmt(orderPlaced.total)} in cash at delivery</p>
                  <p className="text-sm mt-1">⏱️ Delivery: 3-5 business days after approval</p>
                </div>
                <button
                  onClick={async () => {
                    setUploadingProof(true);
                    try {
                      const res = await fetch('/api/payments', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          action: 'confirm-cod',
                          orderId: orderPlaced.id,
                        }),
                      });
                      const data = await res.json();
                      if (data.success) {
                        alert('Order placed successfully! You will receive confirmation via email after admin approval.');
                        setShowPaymentModal(false);
                        setOrderPlaced(null);
                        setSelectedPlans({});
                        setHardcopyQty({});
                        setAppliedCoupon(null);
                        setCouponCode('');
                        setTab('fees');
                      } else {
                        alert(data.error);
                      }
                    } catch (error) {
                      alert('Failed to confirm order');
                    } finally {
                      setUploadingProof(false);
                    }
                  }}
                  disabled={uploadingProof}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black"
                >
                  {uploadingProof ? <Loader className="w-5 h-5 animate-spin mx-auto" /> : 'Confirm COD Order'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ORDER TRACKING MODAL
  // ════════════════════════════════════════════════════════════════════════════
  if (showTrackModal && orderStatus) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className={`max-w-lg w-full rounded-3xl overflow-hidden shadow-2xl ${dm ? 'bg-gray-900' : 'bg-white'}`}>
          <div className={`p-6 border-b-2 ${dm ? 'border-gray-800' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-black ${dm ? 'text-white' : 'text-gray-900'}`}>Order Status</h2>
              <button onClick={() => { setShowTrackModal(false); setOrderStatus(null); }} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className={`p-4 rounded-xl text-center ${
              orderStatus.status === 'approved' ? 'bg-emerald-100 dark:bg-emerald-950/30' :
              orderStatus.status === 'rejected' ? 'bg-red-100 dark:bg-red-950/30' :
              'bg-amber-100 dark:bg-amber-950/30'
            }`}>
              {orderStatus.status === 'approved' && (
                <>
                  <ThumbsUp className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                  <h3 className="font-black text-emerald-500">Order Approved! ✅</h3>
                  <p className="text-sm mt-1">Your order is confirmed and will be delivered soon.</p>
                </>
              )}
              {orderStatus.status === 'rejected' && (
                <>
                  <ThumbsDown className="w-12 h-12 text-red-500 mx-auto mb-2" />
                  <h3 className="font-black text-red-500">Order Rejected ❌</h3>
                  <p className="text-sm mt-1">Please contact support for more information.</p>
                  
                </>
              )}
              {orderStatus.status === 'pending' && (
                <>
                  <Loader className="w-12 h-12 text-amber-500 mx-auto mb-2 animate-spin" />
                  <h3 className="font-black text-amber-500">Pending Approval ⏳</h3>
                  <p className="text-sm mt-1">Your order is waiting for admin approval.</p>
                </>
              )}
            </div>
            <div className={`p-4 rounded-xl ${dm ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <p><strong>Order ID:</strong> {orderStatus.id.slice(0, 12)}</p>
              <p><strong>Total:</strong> ₹{fmt(orderStatus.total)}</p>
              <p><strong>Payment Method:</strong> {orderStatus.paymentMethod?.toUpperCase() || 'Pending'}</p>
              <p><strong>Placed on:</strong> {new Date(orderStatus.createdAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // MAIN UI
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className={`min-h-screen transition-colors duration-200 ${dm ? 'bg-gray-950' : 'bg-gradient-to-br from-slate-50 via-white to-violet-50/20'}`}>

      {/* ── Top Header ── */}
      <div className={`sticky top-0 z-30 border-b-2 backdrop-blur-md ${dm ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-100'} shadow-sm`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-3 sm:py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/30 flex-shrink-0">
                <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h1 className={`text-lg sm:text-xl font-black leading-none ${dm ? 'text-white' : 'text-gray-900'}`}>Fees & Payments</h1>
                <p className={`text-[11px] sm:text-xs hidden sm:block ${dm ? 'text-gray-500' : 'text-gray-400'}`}>Intense Learners Coaching Centre</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Track Order Button */}
              <button
                onClick={() => {
                  const id = prompt('Enter your Order ID:');
                  if (id) {
                    setTrackingOrderId(id);
                    handleTrackOrder();
                  }
                }}
                className={`px-3 py-2 rounded-xl border-2 text-sm font-bold ${dm ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-600'}`}
              >
                <Truck className="w-4 h-4 inline mr-1" />
                Track
              </button>
              
              {/* Cart bubble */}
              <button
                onClick={() => setTab('cart')}
                className={`relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl border-2 font-bold text-sm transition-all ${
                  tab === 'cart'
                    ? 'bg-violet-600 border-violet-600 text-white'
                    : dm ? 'bg-gray-800 border-gray-700 text-white hover:border-violet-500' : 'bg-white border-gray-200 text-gray-800 hover:border-violet-400'
                }`}
              >
                <Wallet className="w-4 h-4" />
                <span className="hidden sm:inline">Cart</span>
                {cartItems.length > 0 && (
                  <>
                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">{cartItems.length}</span>
                    <span className="text-violet-400 font-black text-sm">₹{fmt(total)}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 pb-0 overflow-x-auto">
            {([
              { id: 'fees',     label: 'Fee Structure', icon: GraduationCap },
              { id: 'hardcopy', label: 'Order Hardcopy', icon: Printer       },
              { id: 'cart',     label: cartItems.length > 0 ? `Checkout (${cartItems.length})` : 'Checkout', icon: CreditCard },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-bold whitespace-nowrap flex-shrink-0 border-b-2 transition-all -mb-px ${
                  tab === id
                    ? 'border-violet-500 text-violet-500'
                    : dm ? 'border-transparent text-gray-500 hover:text-gray-300' : 'border-transparent text-gray-400 hover:text-gray-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-8">

        {/* Minimum Order Warning */}
        {cartItems.length > 0 && !meetsMinOrder && (
          <div className={`mb-4 p-3 rounded-xl border-2 ${dm ? 'bg-amber-950/30 border-amber-900' : 'bg-amber-50 border-amber-200'}`}>
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
              ⚠️ Minimum order amount is ₹{MIN_ORDER_AMOUNT}. Add more items (₹{MIN_ORDER_AMOUNT - total} more needed)
            </p>
          </div>
        )}

        {/* TAB: FEE STRUCTURE */}
        {tab === 'fees' && (
          <div>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
              {[
                { icon: Users,      val: '1,200+', label: 'Active Students', c: 'text-blue-500',    bg: dm ? 'bg-blue-950/60'    : 'bg-blue-50'    },
                { icon: Award,      val: '98%',    label: 'Pass Rate',       c: 'text-emerald-500', bg: dm ? 'bg-emerald-950/60' : 'bg-emerald-50' },
                { icon: Star,       val: '4.9 ★',  label: 'Student Rating',  c: 'text-amber-500',   bg: dm ? 'bg-amber-950/60'   : 'bg-amber-50'   },
                { icon: TrendingUp, val: '3× faster',label:'Learning Speed', c: 'text-violet-500',  bg: dm ? 'bg-violet-950/60'  : 'bg-violet-50'  },
              ].map(({ icon: Icon, val, label, c, bg }) => (
                <div key={label} className={`flex items-center gap-3 p-3 sm:p-4 rounded-2xl border-2 ${dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} shadow-sm`}>
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${c}`} />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm sm:text-base font-black ${dm ? 'text-white' : 'text-gray-900'}`}>{val}</p>
                    <p className={`text-[10px] sm:text-[11px] font-medium truncate ${dm ? 'text-gray-500' : 'text-gray-400'}`}>{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Class selector */}
            <div className="mb-6">
              <h2 className={`text-lg sm:text-xl font-black mb-3 flex items-center gap-2 ${dm ? 'text-white' : 'text-gray-900'}`}>
                <GraduationCap className="w-5 h-5 text-violet-500" />
                Select Your Class
              </h2>
              {plansLoading ? (
                <div className="flex items-center gap-2"><Loader className="w-5 h-5 text-violet-500 animate-spin" /><span className={`text-sm ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Loading plans…</span></div>
              ) : (
                <div className="flex gap-2 sm:gap-3 flex-wrap">
                  {classes.map(cls => (
                    <button
                      key={cls}
                      onClick={() => setSelectedClass(cls)}
                      className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl font-black text-sm sm:text-base transition-all border-2 ${
                        selectedClass === cls
                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-transparent shadow-lg shadow-violet-500/25'
                          : dm ? 'bg-gray-900 border-gray-700 text-gray-300 hover:border-violet-500' : 'bg-white border-gray-200 text-gray-700 hover:border-violet-400'
                      }`}
                    >
                      {cls}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Plans for selected class */}
            {selectedClass && (
              <>
                <h3 className={`text-base sm:text-lg font-black mb-4 ${dm ? 'text-white' : 'text-gray-900'}`}>
                  Fee Plans for {selectedClass}
                  <span className={`ml-2 text-sm font-medium ${dm ? 'text-gray-500' : 'text-gray-400'}`}>— select one or more subjects</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
                  {plansForClass.map(plan => {
                    const isSelected = !!selectedPlans[plan.id];
                    const save = plan.originalPrice - plan.price;
                    const savePct = Math.round(save / plan.originalPrice * 100);
                    const grad = getGrad(plan.subject);
                    return (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlans(prev => ({ ...prev, [plan.id]: !prev[plan.id] }))}
                        className={`relative rounded-2xl border-2 cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-xl overflow-hidden ${
                          isSelected
                            ? dm ? 'border-violet-500 shadow-lg shadow-violet-500/20' : 'border-violet-500 shadow-lg shadow-violet-500/15'
                            : dm ? 'border-gray-800 hover:border-gray-700' : 'border-gray-100 hover:border-gray-200'
                        } ${dm ? 'bg-gray-900' : 'bg-white'}`}
                      >
                        <div className={`h-1.5 bg-gradient-to-r ${grad}`} />
                        {plan.popular && (
                          <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-lg text-[10px] font-black text-white bg-gradient-to-r ${grad} shadow-md`}>
                            ★ Popular
                          </div>
                        )}
                        <div className="p-4 sm:p-5">
                          <div className="flex items-center gap-2.5 mb-4">
                            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-md flex-shrink-0`}>
                              <BookOpen className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <h4 className={`font-black text-sm sm:text-base leading-tight ${dm ? 'text-white' : 'text-gray-900'}`}>{plan.subject}</h4>
                              <p className={`text-[11px] ${dm ? 'text-gray-500' : 'text-gray-400'}`}>{plan.duration} · {plan.class}</p>
                            </div>
                          </div>
                          <div className="mb-4">
                            <div className="flex items-baseline gap-2">
                              <span className={`text-3xl font-black ${dm ? 'text-white' : 'text-gray-900'}`}>₹{fmt(plan.price)}</span>
                              <span className={`text-sm line-through ${dm ? 'text-gray-600' : 'text-gray-400'}`}>₹{fmt(plan.originalPrice)}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-[11px] font-black">{savePct}% OFF</span>
                              <span className={`text-[11px] ${dm ? 'text-gray-500' : 'text-gray-400'}`}>Save ₹{fmt(save)}</span>
                            </div>
                          </div>
                          <ul className="space-y-1.5 mb-4">
                            {['Live classes', 'Recorded lectures', 'Doubt support', 'Monthly tests', ...(plan.subject === 'All Subjects' ? ['All subject notes PDF', 'Parent updates'] : [])].map(f => (
                              <li key={f} className={`flex items-center gap-2 text-xs ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" /> {f}
                              </li>
                            ))}
                          </ul>
                          <button className={`w-full py-2.5 rounded-xl text-sm font-black transition-all ${
                            isSelected
                              ? `bg-gradient-to-r ${grad} text-white shadow-md`
                              : dm ? 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700' : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                          }`}>
                            {isSelected ? <span className="flex items-center justify-center gap-1.5"><Check className="w-4 h-4" /> Selected</span>
                              : <span className="flex items-center justify-center gap-1.5">Select Plan <ArrowRight className="w-4 h-4" /></span>}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* CTA bar */}
            {Object.values(selectedPlans).some(Boolean) && (
              <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl border-2 border-violet-500 ${dm ? 'bg-violet-950/30' : 'bg-violet-50'}`}>
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-violet-500 flex-shrink-0" />
                  <div>
                    <p className={`font-black text-sm ${dm ? 'text-white' : 'text-gray-900'}`}>
                      {Object.values(selectedPlans).filter(Boolean).length} plan{Object.values(selectedPlans).filter(Boolean).length > 1 ? 's' : ''} selected
                    </p>
                    <p className={`text-xs ${dm ? 'text-gray-400' : 'text-gray-500'}`}>You can also add printed notes below</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => setTab('hardcopy')} className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border-2 ${dm ? 'border-gray-700 text-gray-300 hover:border-violet-500' : 'border-gray-300 text-gray-700 hover:border-violet-400'}`}>
                    + Add Notes
                  </button>
                  <button onClick={() => setTab('cart')} className="px-4 py-2 rounded-xl text-xs sm:text-sm font-black bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:shadow-lg transition-all flex items-center gap-1.5">
                    Checkout <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: HARDCOPY NOTES - With Thumbnails and Fixed Minus Button */}
        {tab === 'hardcopy' && (
          <div>
            <div className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-5 rounded-2xl border-2 mb-6 ${dm ? 'bg-amber-950/30 border-amber-900' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20 flex-shrink-0">
                  <Printer className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className={`font-black text-base ${dm ? 'text-amber-300' : 'text-amber-800'}`}>Get Printed Notes — Only ₹{HARDCOPY_PRICE}/copy!</p>
                  <p className={`text-xs ${dm ? 'text-amber-400/60' : 'text-amber-700/60'}`}>High-quality colour print · Free home delivery · 3–5 working days</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="relative flex-1">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text" value={noteSearch} onChange={e => setNoteSearch(e.target.value)}
                  placeholder="Search notes by title or subject…"
                  className={`w-full pl-9 pr-10 py-2.5 border-2 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all ${dm ? 'bg-gray-900 border-gray-800 text-white placeholder-gray-600' : 'bg-white border-gray-200 text-gray-900'}`}
                />
              </div>
              <select value={noteSubjectFilter} onChange={e => setNoteSubjectFilter(e.target.value)}
                className={`px-3 py-2.5 border-2 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-violet-500 outline-none ${dm ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-800'}`}>
                {noteSubjects.map(s => <option key={s} value={s}>{s === 'all' ? 'All Subjects' : s}</option>)}
              </select>
              <select value={noteClassFilter} onChange={e => setNoteClassFilter(e.target.value)}
                className={`px-3 py-2.5 border-2 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-violet-500 outline-none ${dm ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-800'}`}>
                {noteClasses.map(c => <option key={c} value={c}>{c === 'all' ? 'All Classes' : c}</option>)}
              </select>
            </div>

            {notesLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader className="w-10 h-10 text-violet-500 animate-spin" />
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className={`rounded-2xl border-2 p-12 text-center ${dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                <FileText className={`w-16 h-16 mx-auto mb-4 ${dm ? 'text-gray-700' : 'text-gray-300'}`} />
                <p className={`font-black text-lg mb-1 ${dm ? 'text-white' : 'text-gray-900'}`}>No notes found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredNotes.map(note => {
                  const qty = hardcopyQty[note.id] || 0;
                  return (
                    <div key={note.id} className={`rounded-2xl border-2 overflow-hidden transition-all hover:shadow-xl ${
                      qty > 0
                        ? dm ? 'border-violet-500 shadow-md shadow-violet-500/10' : 'border-violet-400 shadow-md shadow-violet-400/10'
                        : dm ? 'border-gray-800 hover:border-gray-700' : 'border-gray-100 hover:border-gray-200'
                    } ${dm ? 'bg-gray-900' : 'bg-white'}`}>
                      {/* Subject top bar */}
                      <div className={`h-1 bg-gradient-to-r ${getGrad(note.subject)}`} />
                      
                      {/* Thumbnail */}
                      <div className={`relative h-32 ${dm ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'} flex items-center justify-center overflow-hidden`}>
                        {note.thumbnailUrl ? (
                          <img 
                            src={note.thumbnailUrl} 
                            alt={note.title} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/note-placeholder.png';
                            }}
                          />
                        ) : (
                          <FileText className={`w-10 h-10 ${dm ? 'text-gray-700' : 'text-gray-300'}`} />
                        )}
                        {note.isPinned && (
                          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500 text-white text-[10px] font-black">
                            <Star className="w-2.5 h-2.5" fill="currentColor" /> Pinned
                          </div>
                        )}
                        {qty > 0 && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-violet-600 text-white text-[10px] font-black flex items-center justify-center shadow">
                            {qty}
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${getSubColor(note.subject, dm)}`}>{note.subject}</span>
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${dm ? 'bg-blue-900/40 text-blue-300 border-blue-800' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{note.class}</span>
                          {note.chapter && <span className={`text-[10px] ${dm ? 'text-gray-600' : 'text-gray-400'}`}>Ch. {note.chapter}</span>}
                        </div>
                        <h3 className={`text-sm font-bold line-clamp-2 leading-snug mb-2 ${dm ? 'text-white' : 'text-gray-900'}`}>{note.title}</h3>
                        
                        <div className={`flex items-center justify-between p-3 rounded-xl border-2 ${dm ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                          <div>
                            <p className={`text-lg font-black ${dm ? 'text-white' : 'text-gray-900'}`}>₹{HARDCOPY_PRICE}</p>
                          </div>
                          {qty === 0 ? (
                            <button onClick={() => setHardcopyQty(prev => ({ ...prev, [note.id]: 1 }))}
                              className="px-3 py-2 rounded-xl bg-violet-600 text-white text-xs font-black hover:bg-violet-700 transition-all">
                              Add
                            </button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => setHardcopyQty(prev => { 
                                  const n = { ...prev }; 
                                  if (n[note.id] <= 1) delete n[note.id]; 
                                  else n[note.id]--; 
                                  return n; 
                                })}
                                className={`w-8 h-8 rounded-xl text-base font-black flex items-center justify-center transition-all ${
                                  dm 
                                    ? 'bg-gray-700 text-white hover:bg-red-600' 
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                              >
                                −
                              </button>
                              <span className={`font-black text-sm ${dm ? 'text-white' : 'text-gray-900'}`}>{qty}</span>
                              <button 
                                onClick={() => setHardcopyQty(prev => ({ ...prev, [note.id]: (prev[note.id] || 0) + 1 }))}
                                className="w-8 h-8 rounded-xl bg-violet-600 text-white font-black text-base hover:bg-violet-700 transition-all"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                        {qty > 0 && (
                          <p className="text-[11px] text-center mt-2 font-bold text-violet-500">
                            {qty} cop{qty > 1 ? 'ies' : 'y'} × ₹{HARDCOPY_PRICE} = ₹{qty * HARDCOPY_PRICE}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB: CHECKOUT */}
        {tab === 'cart' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-5">
              <div className={`rounded-2xl border-2 overflow-hidden ${dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                <div className={`p-5 border-b-2 ${dm ? 'border-gray-800' : 'border-gray-100'}`}>
                  <h3 className={`font-black ${dm ? 'text-white' : 'text-gray-900'}`}>Your Cart ({cartItems.length} items)</h3>
                </div>
                {cartItems.length === 0 ? (
                  <div className="p-12 text-center">
                    <p>Cart is empty</p>
                    <button onClick={() => setTab('fees')} className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-xl">Browse Plans</button>
                  </div>
                ) : (
                  <div>
                    {cartItems.map((item, idx) => (
                      <div key={item.id} className={`flex justify-between p-4 ${idx < cartItems.length - 1 ? 'border-b' : ''} ${dm ? 'border-gray-800' : 'border-gray-100'}`}>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.qty && <p className="text-sm text-gray-500">Qty: {item.qty}</p>}
                        </div>
                        <p className="font-bold">₹{fmt(item.price)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Address Form */}
              {hasHardcopy && cartItems.length > 0 && (
                <div className={`rounded-2xl border-2 p-5 ${dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                  <button onClick={() => setShowAddress(!showAddress)} className="w-full flex justify-between items-center">
                    <h3 className={`font-black ${dm ? 'text-white' : 'text-gray-900'}`}>Delivery Address</h3>
                    <ChevronDown className={`transform ${showAddress ? 'rotate-180' : ''}`} />
                  </button>
                  {showAddress && (
                    <div className="mt-4 space-y-3">
                      <input type="text" placeholder="Full Name" value={address.name} onChange={e => setAddress({...address, name: e.target.value})}
                        className={`w-full p-3 rounded-xl border-2 ${dm ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`} />
                      <input type="tel" placeholder="Phone Number" value={address.phone} onChange={e => setAddress({...address, phone: e.target.value})}
                        className={`w-full p-3 rounded-xl border-2 ${dm ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`} />
                      <textarea placeholder="Full Address" value={address.address} onChange={e => setAddress({...address, address: e.target.value})}
                        className={`w-full p-3 rounded-xl border-2 ${dm ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`} rows={2} />
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" placeholder="City" value={address.city} onChange={e => setAddress({...address, city: e.target.value})}
                          className={`p-3 rounded-xl border-2 ${dm ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`} />
                        <input type="text" placeholder="PIN Code" value={address.pincode} onChange={e => setAddress({...address, pincode: e.target.value})}
                          className={`p-3 rounded-xl border-2 ${dm ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="lg:col-span-2">
              <div className={`rounded-2xl border-2 p-5 sticky top-20 ${dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                <h3 className={`font-black text-lg mb-4 ${dm ? 'text-white' : 'text-gray-900'}`}>Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{fmt(subtotal)}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-green-500">
                      <span>Discount</span>
                      <span>-₹{fmt(couponDiscount)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-violet-500">₹{fmt(total)}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handlePlaceOrder}
                  disabled={orderLoading || cartItems.length === 0 || !meetsMinOrder}
                  className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black disabled:opacity-50"
                >
                  {orderLoading ? <Loader className="w-5 h-5 animate-spin mx-auto" /> : 'Place Order'}
                </button>
                {!meetsMinOrder && cartItems.length > 0 && (
                  <p className="text-xs text-center mt-3 text-amber-500">Minimum order: ₹{MIN_ORDER_AMOUNT}</p>
                )}
                {hasOnlyFees && cartItems.length > 0 && (
                  <p className="text-xs text-center mt-3 text-blue-500">💳 Only QR payment available for fee plans</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}