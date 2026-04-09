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
  GraduationCap, BookMarked, ChevronRight, Info,
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
  address: string;
  city: string;
  pincode: string;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window { Razorpay: any; }
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
  const [address, setAddress] = useState<AddressForm>({ name: '', phone: '', address: '', city: '', pincode: '' });

  // Payment
  const [payLoading, setPayLoading] = useState(false);
  const [paySuccess, setPaySuccess] = useState<{ paymentId: string; total: number } | null>(null);

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

  // ── Load Razorpay script ──
  const loadRazorpay = () => new Promise<boolean>(resolve => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

  // ── Payment ──
  const handlePayment = async () => {
    if (cartItems.length === 0) return;
    if (hasHardcopy && showAddress) {
      if (Object.values(address).some(v => !v.trim())) {
        alert('Please fill all delivery address fields'); return;
      }
    }

    setPayLoading(true);
    try {
      // Step 1: Create order
      const orderRes = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-order',
          items: cartItems.map(i => ({ id: i.id, type: i.type, qty: i.qty || 1, price: i.price, name: i.name })),
          couponCode: appliedCoupon?.code || null,
          deliveryAddress: hasHardcopy ? address : null,
        }),
      });
      const orderData = await orderRes.json();
      if (!orderData.success) throw new Error(orderData.error || 'Order creation failed');

      // Step 2: Load Razorpay
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error('Failed to load Razorpay');

      // Step 3: Open Razorpay
      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key:         orderData.data.key,
          amount:      orderData.data.amount * 100,
          currency:    orderData.data.currency,
          name:        'Intense Learners',
          description: orderData.data.description,
          order_id:    orderData.data.orderId,
          prefill: {
            name:    orderData.data.prefillName,
            email:   orderData.data.prefillEmail,
            contact: address.phone || '',
          },
          theme:   { color: '#7c3aed' },
          modal:   { ondismiss: () => reject(new Error('Payment cancelled')) },
          handler: async (response: RazorpayResponse) => {
            try {
              // Step 4: Verify
              const verifyRes = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'verify-payment',
                  razorpay_order_id:   response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature:  response.razorpay_signature,
                  items: cartItems.map(i => ({ id: i.id, type: i.type, qty: i.qty || 1 })),
                  deliveryAddress: hasHardcopy ? address : null,
                  couponCode: appliedCoupon?.code || null,
                }),
              });
              const verifyData = await verifyRes.json();
              if (!verifyData.success) throw new Error('Payment verification failed');
              setPaySuccess({ paymentId: response.razorpay_payment_id, total });
              resolve();
            } catch (e) { reject(e); }
          },
        });
        rzp.on('payment.failed', (resp: any) => reject(new Error(resp.error?.description || 'Payment failed')));
        rzp.open();
      });

    } catch (error: any) {
      if (error?.message !== 'Payment cancelled') {
        alert(error?.message || 'Payment failed. Please try again.');
      }
    } finally {
      setPayLoading(false);
    }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // SUCCESS SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  if (paySuccess) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${dm ? 'bg-gray-950' : 'bg-gradient-to-br from-violet-50 via-white to-indigo-50'}`}>
        <div className={`max-w-lg w-full rounded-3xl p-8 sm:p-10 text-center shadow-2xl border-2 ${dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
          <div className="relative w-28 h-28 mx-auto mb-6">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-xl shadow-emerald-500/30 animate-bounce">
              <Check className="w-14 h-14 text-white" strokeWidth={3} />
            </div>
          </div>
          <h2 className={`text-3xl font-black mb-2 ${dm ? 'text-white' : 'text-gray-900'}`}>Payment Successful! 🎉</h2>
          <p className={`text-base mb-6 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>
            Your order is confirmed. A confirmation will be sent to <span className="font-bold text-violet-500">{session?.user?.email}</span>
          </p>
          <div className={`rounded-2xl p-5 mb-6 border-2 text-left space-y-3 ${dm ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Payment ID</span>
              <span className={`text-sm font-mono font-bold ${dm ? 'text-white' : 'text-gray-800'}`}>{paySuccess.paymentId.slice(0, 20)}…</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Amount Paid</span>
              <span className="font-black text-xl text-emerald-500">₹{fmt(paySuccess.total)}</span>
            </div>
            {hasHardcopy && (
              <div className="flex justify-between items-center">
                <span className={`text-sm flex items-center gap-1.5 ${dm ? 'text-gray-400' : 'text-gray-500'}`}><Truck className="w-4 h-4 text-amber-500" /> Hardcopy delivery</span>
                <span className={`text-sm font-semibold ${dm ? 'text-gray-300' : 'text-gray-700'}`}>3–5 working days</span>
              </div>
            )}
          </div>
          <button
            onClick={() => { setPaySuccess(null); setSelectedPlans({}); setHardcopyQty({}); setAppliedCoupon(null); setCouponCode(''); setTab('fees'); }}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black text-base hover:shadow-lg hover:shadow-violet-500/30 transition-all"
          >
            Back to Dashboard
          </button>
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

        {/* ════════════════════════════════════════════════════════════════════
            TAB: FEE STRUCTURE
        ════════════════════════════════════════════════════════════════════ */}
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
                        {/* Top bar */}
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

                          {/* Features */}
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

        {/* ════════════════════════════════════════════════════════════════════
            TAB: HARDCOPY NOTES
        ════════════════════════════════════════════════════════════════════ */}
        {tab === 'hardcopy' && (
          <div>
            {/* Banner */}
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
              <div className="flex gap-2 sm:ml-auto flex-wrap flex-shrink-0">
                {[['Truck', 'Free Delivery', 'text-emerald-500'], ['Shield', 'Quality Assured', 'text-blue-500']].map(([, label, c]) => (
                  <span key={label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border-2 ${dm ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-600'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${c.replace('text-', 'bg-')}`} /> {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="relative flex-1">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text" value={noteSearch} onChange={e => setNoteSearch(e.target.value)}
                  placeholder="Search notes by title or subject…"
                  className={`w-full pl-9 pr-10 py-2.5 border-2 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all ${dm ? 'bg-gray-900 border-gray-800 text-white placeholder-gray-600' : 'bg-white border-gray-200 text-gray-900'}`}
                />
                {noteSearch && (
                  <button onClick={() => setNoteSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
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
                <div className="text-center">
                  <Loader className="w-10 h-10 text-violet-500 animate-spin mx-auto mb-3" />
                  <p className={`text-sm ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Loading notes…</p>
                </div>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className={`rounded-2xl border-2 p-12 text-center ${dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                <FileText className={`w-16 h-16 mx-auto mb-4 ${dm ? 'text-gray-700' : 'text-gray-300'}`} />
                <p className={`font-black text-lg mb-1 ${dm ? 'text-white' : 'text-gray-900'}`}>No notes found</p>
                <p className={`text-sm ${dm ? 'text-gray-500' : 'text-gray-400'}`}>
                  {noteSearch || noteSubjectFilter !== 'all' || noteClassFilter !== 'all'
                    ? 'Try adjusting your filters.' : 'No notes available yet.'}
                </p>
              </div>
            ) : (
              <>
                <p className={`text-xs mb-4 ${dm ? 'text-gray-600' : 'text-gray-400'}`}>
                  <span className={`font-bold ${dm ? 'text-gray-300' : 'text-gray-600'}`}>{filteredNotes.length}</span> note{filteredNotes.length !== 1 ? 's' : ''} available
                </p>
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

                        {/* Thumbnail / icon */}
                        <div className={`relative h-32 ${dm ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'} flex items-center justify-center overflow-hidden`}>
                          {note.thumbnailUrl ? (
                            <img src={note.thumbnailUrl} alt={note.title} className="w-full h-full object-cover" />
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
                          {/* Tags */}
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${getSubColor(note.subject, dm)}`}>{note.subject}</span>
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${dm ? 'bg-blue-900/40 text-blue-300 border-blue-800' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{note.class}</span>
                            {note.chapter && <span className={`text-[10px] ${dm ? 'text-gray-600' : 'text-gray-400'}`}>Ch. {note.chapter}</span>}
                          </div>

                          <h3 className={`text-sm font-bold line-clamp-2 leading-snug mb-1 ${dm ? 'text-white' : 'text-gray-900'}`}>{note.title}</h3>
                          {note.topic && <p className={`text-[11px] mb-3 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>📌 {note.topic}</p>}

                          {/* Stats */}
                          <div className="flex items-center gap-3 mb-3">
                            <span className={`flex items-center gap-1 text-[11px] ${dm ? 'text-gray-600' : 'text-gray-400'}`}><Download className="w-3 h-3" />{note.downloads}</span>
                            <span className={`flex items-center gap-1 text-[11px] ${dm ? 'text-gray-600' : 'text-gray-400'}`}><Eye className="w-3 h-3" />{note.views}</span>
                            <span className={`text-[11px] ml-auto ${dm ? 'text-gray-600' : 'text-gray-400'}`}>{note.fileType.toUpperCase()} · {note.fileSize}</span>
                          </div>

                          {/* Price + controls */}
                          <div className={`flex items-center justify-between p-3 rounded-xl border-2 ${dm ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                            <div>
                              <p className={`text-[10px] ${dm ? 'text-gray-500' : 'text-gray-400'}`}>Printed copy</p>
                              <p className={`text-lg font-black ${dm ? 'text-white' : 'text-gray-900'}`}>
                                ₹{HARDCOPY_PRICE}<span className={`text-xs font-normal ml-0.5 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>/copy</span>
                              </p>
                            </div>
                            {qty === 0 ? (
                              <button
                                onClick={() => setHardcopyQty(prev => ({ ...prev, [note.id]: 1 }))}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r ${getGrad(note.subject)} text-white text-xs font-black hover:shadow-md transition-all`}
                              >
                                <Package className="w-3.5 h-3.5" /> Add
                              </button>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setHardcopyQty(prev => { const n = { ...prev }; if (n[note.id] <= 1) delete n[note.id]; else n[note.id]--; return n; })}
                                  className={`w-8 h-8 rounded-xl text-base font-black flex items-center justify-center transition-all ${dm ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                >−</button>
                                <span className={`w-6 text-center font-black text-sm ${dm ? 'text-white' : 'text-gray-900'}`}>{qty}</span>
                                <button
                                  onClick={() => setHardcopyQty(prev => ({ ...prev, [note.id]: (prev[note.id] || 0) + 1 }))}
                                  className="w-8 h-8 rounded-xl bg-violet-600 text-white font-black text-base flex items-center justify-center hover:bg-violet-700 transition-all"
                                >+</button>
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
              </>
            )}

            {/* Sticky bottom bar */}
            {Object.keys(hardcopyQty).length > 0 && (
              <div className={`sticky bottom-4 mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border-2 border-violet-500 shadow-2xl shadow-violet-500/20 backdrop-blur-md ${dm ? 'bg-gray-900/95' : 'bg-white/95'}`}>
                <div>
                  <p className={`font-black text-sm ${dm ? 'text-white' : 'text-gray-900'}`}>
                    {Object.values(hardcopyQty).reduce((s, q) => s + q, 0)} printed cop{Object.values(hardcopyQty).reduce((s, q) => s + q, 0) > 1 ? 'ies' : 'y'} selected
                  </p>
                  <p className="text-sm font-bold text-violet-500">
                    ₹{fmt(Object.values(hardcopyQty).reduce((s, q) => s + q * HARDCOPY_PRICE, 0))} · free delivery 🚚
                  </p>
                </div>
                <button
                  onClick={() => setTab('cart')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black text-sm hover:shadow-lg hover:shadow-violet-500/30 transition-all flex items-center gap-2"
                >
                  Proceed to Checkout <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB: CHECKOUT / CART
        ════════════════════════════════════════════════════════════════════ */}
        {tab === 'cart' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* Left */}
            <div className="lg:col-span-3 space-y-5">

              {/* Cart items */}
              <div className={`rounded-2xl border-2 overflow-hidden ${dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                <div className={`flex items-center justify-between px-5 py-4 border-b-2 ${dm ? 'border-gray-800' : 'border-gray-100'}`}>
                  <h3 className={`font-black text-base ${dm ? 'text-white' : 'text-gray-900'}`}>Your Cart</h3>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${dm ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                    {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {cartItems.length === 0 ? (
                  <div className="py-16 text-center px-6">
                    <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${dm ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      <Wallet className={`w-8 h-8 ${dm ? 'text-gray-600' : 'text-gray-400'}`} />
                    </div>
                    <p className={`font-black mb-1 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Cart is empty</p>
                    <p className={`text-sm mb-5 ${dm ? 'text-gray-600' : 'text-gray-400'}`}>Add a fee plan or order printed notes</p>
                    <div className="flex justify-center gap-2">
                      <button onClick={() => setTab('fees')} className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-bold">Fee Plans</button>
                      <button onClick={() => setTab('hardcopy')} className={`px-4 py-2 rounded-xl border-2 text-sm font-bold ${dm ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-600'}`}>Order Notes</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {cartItems.map((item, idx) => (
                      <div key={item.id} className={`flex items-center gap-3 px-5 py-4 ${idx < cartItems.length - 1 ? (dm ? 'border-b border-gray-800' : 'border-b border-gray-100') : ''}`}>
                        <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm ${
                          item.type === 'fee' ? `bg-gradient-to-br ${getGrad(item.subject || '')}` : 'bg-gradient-to-br from-amber-500 to-orange-500'
                        }`}>
                          {item.type === 'fee' ? <BookOpen className="w-4 h-4 text-white" /> : <Printer className="w-4 h-4 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold truncate ${dm ? 'text-white' : 'text-gray-900'}`}>{item.name}</p>
                          {item.qty && <p className={`text-xs ${dm ? 'text-gray-500' : 'text-gray-400'}`}>{item.qty} cop{item.qty > 1 ? 'ies' : 'y'} × ₹{HARDCOPY_PRICE}</p>}
                          {item.type === 'fee' && <p className={`text-xs ${dm ? 'text-gray-500' : 'text-gray-400'}`}>Fee Plan · 3 Months</p>}
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className={`font-black text-sm ${dm ? 'text-white' : 'text-gray-900'}`}>₹{fmt(item.price)}</span>
                          <button
                            onClick={() => {
                              if (item.type === 'fee') setSelectedPlans(prev => { const n = { ...prev }; delete n[item.id]; return n; });
                              else setHardcopyQty(prev => { const n = { ...prev }; delete n[item.id]; return n; });
                            }}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${dm ? 'bg-gray-800 text-gray-500 hover:bg-red-900/50 hover:text-red-400' : 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500'}`}
                          ><X className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Coupon */}
              {cartItems.length > 0 && (
                <div className={`rounded-2xl border-2 p-5 ${dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                  <div className="flex items-center gap-2 mb-4">
                    <BadgePercent className="w-5 h-5 text-violet-500" />
                    <h3 className={`font-black text-sm ${dm ? 'text-white' : 'text-gray-900'}`}>Coupon Code</h3>
                  </div>
                  {!appliedCoupon ? (
                    <>
                      <div className="flex gap-2">
                        <input
                          type="text" value={couponCode}
                          onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                          onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                          placeholder="Enter coupon code…"
                          className={`flex-1 px-4 py-2.5 border-2 rounded-xl text-sm font-mono tracking-widest focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all ${dm ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                        />
                        <button
                          onClick={handleApplyCoupon}
                          disabled={couponLoading || !couponCode.trim()}
                          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-black disabled:opacity-50 hover:shadow-md transition-all min-w-[80px] flex items-center justify-center"
                        >
                          {couponLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Apply'}
                        </button>
                      </div>
                      {couponError && (
                        <p className="flex items-center gap-1.5 mt-2 text-xs text-red-400 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" /> {couponError}
                        </p>
                      )}
                      <div className="flex gap-2 mt-3 flex-wrap">
                        <p className={`text-[11px] w-full ${dm ? 'text-gray-600' : 'text-gray-400'}`}>Try these codes:</p>
                        {['SAVE20', 'FLAT100', 'NEWJOIN', 'INTENSEL'].map(c => (
                          <button key={c} onClick={() => { setCouponCode(c); setCouponError(''); }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border-2 border-dashed transition-all ${dm ? 'border-gray-700 text-gray-500 hover:border-violet-600 hover:text-violet-400' : 'border-gray-300 text-gray-400 hover:border-violet-400 hover:text-violet-600'}`}>
                            {c}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className={`flex items-center justify-between p-3.5 rounded-xl border-2 border-emerald-500 ${dm ? 'bg-emerald-950/30' : 'bg-emerald-50'}`}>
                      <div className="flex items-center gap-2.5">
                        <Sparkles className="w-4 h-4 text-emerald-500" />
                        <div>
                          <p className="font-black text-sm text-emerald-500">{appliedCoupon.code} applied!</p>
                          <p className={`text-xs ${dm ? 'text-emerald-400/60' : 'text-emerald-600/60'}`}>{appliedCoupon.label} — you save ₹{fmt(couponDiscount)}</p>
                        </div>
                      </div>
                      <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="text-emerald-500 hover:text-emerald-400">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Delivery address (hardcopy) */}
              {hasHardcopy && cartItems.length > 0 && (
                <div className={`rounded-2xl border-2 overflow-hidden ${dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                  <button
                    onClick={() => setShowAddress(!showAddress)}
                    className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${dm ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-sm flex-shrink-0">
                        <MapPin className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left">
                        <p className={`font-black text-sm ${dm ? 'text-white' : 'text-gray-900'}`}>
                          Delivery Address
                          {!showAddress && <span className="ml-2 text-[10px] font-medium text-amber-500">Required for hardcopy</span>}
                        </p>
                        <p className={`text-xs ${dm ? 'text-gray-500' : 'text-gray-400'}`}>
                          {address.address ? `${address.address}, ${address.city} - ${address.pincode}` : 'Click to add address'}
                        </p>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 transition-transform ${dm ? 'text-gray-500' : 'text-gray-400'} ${showAddress ? 'rotate-180' : ''}`} />
                  </button>
                  {showAddress && (
                    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 px-5 pb-5 pt-1 border-t-2 ${dm ? 'border-gray-800' : 'border-gray-100'}`}>
                      {([
                        { key: 'name',    label: 'Full Name',     icon: User,    span: 1 },
                        { key: 'phone',   label: 'Phone Number',  icon: Phone,   span: 1 },
                        { key: 'address', label: 'Full Address',  icon: MapPin,  span: 2 },
                        { key: 'city',    label: 'City / Town',   icon: MapPin,  span: 1 },
                        { key: 'pincode', label: 'PIN Code',      icon: MapPin,  span: 1 },
                      ] as const).map(({ key, label, icon: Icon, span }) => (
                        <div key={key} className={span === 2 ? 'sm:col-span-2' : ''}>
                          <label className={`block text-xs font-bold mb-1 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{label}</label>
                          <div className="relative">
                            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input
                              type="text"
                              value={(address as any)[key]}
                              onChange={e => setAddress(prev => ({ ...prev, [key]: e.target.value }))}
                              className={`w-full pl-9 pr-4 py-2.5 border-2 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all ${dm ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right — Summary + Pay */}
            <div className="lg:col-span-2">
              <div className={`rounded-2xl border-2 overflow-hidden sticky top-20 ${dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} shadow-xl`}>
                <div className={`px-5 py-4 border-b-2 ${dm ? 'border-gray-800' : 'border-gray-100'}`}>
                  <h3 className={`font-black ${dm ? 'text-white' : 'text-gray-900'}`}>Order Summary</h3>
                </div>

                <div className="p-5 space-y-3">
                  {cartItems.length === 0 ? (
                    <p className={`text-sm text-center py-6 ${dm ? 'text-gray-600' : 'text-gray-400'}`}>No items in cart</p>
                  ) : (
                    <>
                      {cartItems.map(item => (
                        <div key={item.id} className="flex justify-between items-start gap-2">
                          <span className={`text-xs leading-relaxed ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{item.name}</span>
                          <span className={`text-xs font-black flex-shrink-0 ${dm ? 'text-white' : 'text-gray-900'}`}>₹{fmt(item.price)}</span>
                        </div>
                      ))}

                      <div className={`border-t-2 pt-3 space-y-2 ${dm ? 'border-gray-800' : 'border-gray-100'}`}>
                        <div className="flex justify-between">
                          <span className={`text-sm ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Subtotal</span>
                          <span className={`text-sm font-bold ${dm ? 'text-white' : 'text-gray-900'}`}>₹{fmt(subtotal)}</span>
                        </div>
                        {couponDiscount > 0 && (
                          <div className="flex justify-between">
                            <span className="text-sm text-emerald-500 flex items-center gap-1"><BadgePercent className="w-3.5 h-3.5" /> {appliedCoupon?.code}</span>
                            <span className="text-sm font-bold text-emerald-500">−₹{fmt(couponDiscount)}</span>
                          </div>
                        )}
                        {hasHardcopy && (
                          <div className="flex justify-between">
                            <span className={`text-sm flex items-center gap-1 ${dm ? 'text-gray-400' : 'text-gray-500'}`}><Truck className="w-3.5 h-3.5 text-emerald-500" /> Delivery</span>
                            <span className="text-sm font-bold text-emerald-500">FREE</span>
                          </div>
                        )}
                      </div>

                      <div className={`border-t-2 pt-3 ${dm ? 'border-gray-800' : 'border-gray-100'}`}>
                        <div className="flex justify-between items-center">
                          <span className={`font-black text-base ${dm ? 'text-white' : 'text-gray-900'}`}>Total</span>
                          <span className="font-black text-2xl text-violet-500">₹{fmt(total)}</span>
                        </div>
                        {couponDiscount > 0 && <p className="text-right text-xs text-emerald-500 font-bold mt-0.5">You save ₹{fmt(couponDiscount)}! 🎉</p>}
                      </div>

                      {/* Pay button */}
                      <button
                        onClick={handlePayment}
                        disabled={payLoading || cartItems.length === 0 || (hasHardcopy && showAddress && Object.values(address).some(v => !v.trim()))}
                        className="w-full mt-1 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black text-base hover:shadow-xl hover:shadow-violet-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                      >
                        {payLoading
                          ? <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing…</>
                          : <><Lock className="w-4 h-4" /> Pay ₹{fmt(total)} Securely</>
                        }
                      </button>

                      <div className="flex items-center justify-center gap-1.5">
                        <Lock className={`w-3 h-3 ${dm ? 'text-gray-600' : 'text-gray-400'}`} />
                        <span className={`text-[11px] ${dm ? 'text-gray-600' : 'text-gray-400'}`}>Secured by Razorpay · UPI · Cards · NetBanking</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Guarantee */}
                <div className={`mx-4 mb-4 p-3 rounded-xl border-2 ${dm ? 'bg-gray-800 border-gray-700' : 'bg-emerald-50 border-emerald-100'}`}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <Shield className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <p className={`text-xs font-black ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Satisfaction Guarantee</p>
                  </div>
                  <p className={`text-[11px] ${dm ? 'text-gray-500' : 'text-gray-500'}`}>Not happy? Full refund within 7 days, no questions.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}