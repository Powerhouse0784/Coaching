// app/payment-checkout/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useUploadThing } from '@/lib/uploadthing';
import {
  CreditCard, Tag, Lock, CheckCircle, X, Sparkles,
  Shield, Star, Truck, Printer, FileText, Wallet,
  ArrowRight, ChevronDown, Check, AlertCircle,
  IndianRupee, Award, TrendingUp, Users,
  Download, Eye, Loader, BookOpen,
  GraduationCap, QrCode, DollarSign, Send,
  ThumbsUp, ThumbsDown, Upload, Search, Package,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface FeePlan { id: string; class: string; subject: string; price: number; originalPrice: number; duration: string; popular: boolean; }
interface Note { id: string; title: string; description: string | null; subject: string; class: string; topic: string | null; chapter: string | null; fileName: string; fileType: string; fileSize: string; thumbnailUrl: string | null; isPinned: boolean; downloads: number; views: number; price: number; teacher: { name: string | null; avatar: string | null }; }
interface CartItem { id: string; type: 'fee' | 'hardcopy'; name: string; price: number; qty?: number; subject?: string; class?: string; unitPrice?: number; }
interface AddressForm { name: string; phone: string; email: string; address: string; city: string; state: string; pincode: string; landmark?: string; }
interface Order { id: string; items: CartItem[]; address: AddressForm | null; subtotal: number; couponDiscount: number; total: number; couponCode: string | null; paymentMethod: 'qr' | 'cod' | null; status: 'pending' | 'approved' | 'rejected'; createdAt: Date; paymentProof?: string; userName?: string; userEmail?: string; }

// ─── Color helpers ─────────────────────────────────────────────────────────────
const SUB_COLOR: Record<string, { light: string; dark: string; grad: string }> = {
  Mathematics:   { light: 'bg-blue-100 text-blue-700 border-blue-200',      dark: 'bg-blue-900/40 text-blue-300 border-blue-800',      grad: 'from-blue-500 to-cyan-600'        },
  Physics:       { light: 'bg-violet-100 text-violet-700 border-violet-200',dark: 'bg-violet-900/40 text-violet-300 border-violet-800', grad: 'from-violet-500 to-purple-600'    },
  Chemistry:     { light: 'bg-emerald-100 text-emerald-700 border-emerald-200',dark:'bg-emerald-900/40 text-emerald-300 border-emerald-800',grad:'from-emerald-500 to-teal-600'   },
  Biology:       { light: 'bg-green-100 text-green-700 border-green-200',   dark: 'bg-green-900/40 text-green-300 border-green-800',   grad: 'from-green-500 to-lime-600'       },
  Science:       { light: 'bg-teal-100 text-teal-700 border-teal-200',      dark: 'bg-teal-900/40 text-teal-300 border-teal-800',      grad: 'from-teal-500 to-emerald-600'     },
  English:       { light: 'bg-pink-100 text-pink-700 border-pink-200',      dark: 'bg-pink-900/40 text-pink-300 border-pink-800',      grad: 'from-pink-500 to-rose-600'        },
  'Social Sc.':  { light: 'bg-amber-100 text-amber-700 border-amber-200',   dark: 'bg-amber-900/40 text-amber-300 border-amber-800',   grad: 'from-amber-500 to-orange-600'     },
  'All Subjects':{ light: 'bg-indigo-100 text-indigo-700 border-indigo-200',dark: 'bg-indigo-900/40 text-indigo-300 border-indigo-800',grad: 'from-indigo-500 to-violet-600'    },
  'Any 4 Subjects':{ light:'bg-indigo-100 text-indigo-700 border-indigo-200',dark:'bg-indigo-900/40 text-indigo-300 border-indigo-800',grad:'from-indigo-500 to-violet-600'     },
};
const getSubColor = (s: string, dm: boolean) => SUB_COLOR[s] ? (dm ? SUB_COLOR[s].dark : SUB_COLOR[s].light) : (dm ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-gray-100 text-gray-600 border-gray-200');
const getGrad    = (s: string) => SUB_COLOR[s]?.grad || 'from-gray-500 to-gray-600';
const fmt        = (n: number) => n.toLocaleString('en-IN');

// ─── Track Modal ───────────────────────────────────────────────────────────────
function TrackModal({ order, dm, onClose }: { order: Order; dm: boolean; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
      <div className={`max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl ${dm ? 'bg-gray-900' : 'bg-white'}`}>
        <div className={`sticky top-0 z-10 p-4 sm:p-6 border-b-2 flex items-center justify-between ${dm ? 'border-gray-800 bg-gray-900' : 'border-gray-100 bg-white'}`}>
          <h2 className={`text-xl font-black ${dm ? 'text-white' : 'text-gray-900'}`}>Order Status</h2>
          <button onClick={onClose} className={`p-2 rounded-xl ${dm ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          <div className={`p-4 rounded-xl text-center ${
            order.status === 'approved' ? 'bg-emerald-100 dark:bg-emerald-950/30' :
            order.status === 'rejected' ? 'bg-red-100 dark:bg-red-950/30' : 'bg-amber-100 dark:bg-amber-950/30'
          }`}>
            {order.status === 'approved' && <><ThumbsUp className="w-12 h-12 text-emerald-500 mx-auto mb-2" /><h3 className="font-black text-emerald-500">Order Approved! ✅</h3><p className="text-sm mt-1">Your order is confirmed and will be delivered soon.</p></>}
            {order.status === 'rejected' && <><ThumbsDown className="w-12 h-12 text-red-500 mx-auto mb-2" /><h3 className="font-black text-red-500">Order Rejected ❌</h3><p className="text-sm mt-1">Please contact support for more information.</p></>}
            {order.status === 'pending'  && <><Loader className="w-12 h-12 text-amber-500 mx-auto mb-2 animate-spin" /><h3 className="font-black text-amber-500">Pending Approval ⏳</h3><p className="text-sm mt-1">Your order is waiting for admin approval.</p></>}
          </div>
          <div className={`p-4 rounded-xl text-sm space-y-1 ${dm ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <p className="break-all"><strong>Order ID:</strong> {order.id}</p>
            <p><strong>Total:</strong> ₹{fmt(order.total)}</p>
            <p><strong>Payment:</strong> {order.paymentMethod?.toUpperCase() || '—'}</p>
            <p><strong>Placed:</strong> {new Date(order.createdAt).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Track Input Modal ─────────────────────────────────────────────────────────
function TrackInputModal({ dm, onClose, onFound }: { dm: boolean; onClose: () => void; onFound: (o: Order) => void }) {
  const [id, setId]     = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState('');

  const search = async () => {
    const trimmed = id.trim();
    if (!trimmed) return;
    setBusy(true); setErr('');
    try {
      const res  = await fetch(`/api/payments?action=order-status&orderId=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok || !data.success) { setErr(data.error || 'Order not found'); return; }
      onFound(data.order);
    } catch { setErr('Network error. Try again.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-3xl shadow-2xl p-6 ${dm ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="flex items-center justify-between mb-5">
          <h2 className={`text-xl font-black ${dm ? 'text-white' : 'text-gray-900'}`}>Track Order</h2>
          <button onClick={onClose} className={`p-2 rounded-xl ${dm ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          <div className="relative">
            <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              autoFocus
              type="text"
              value={id}
              onChange={e => { setId(e.target.value); setErr(''); }}
              onKeyDown={e => e.key === 'Enter' && search()}
              placeholder="Enter your Order ID…"
              className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm ${dm ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900'}`}
            />
          </div>
          {err && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{err}</p>}
          <button
            onClick={search}
            disabled={busy || !id.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {busy ? <Loader className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {busy ? 'Searching…' : 'Track Order'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function PaymentCheckout() {
  const { data: session } = useSession();

  const [dm, setDm] = useState(false);
  useEffect(() => {
    const check = () => setDm(document.documentElement.classList.contains('dark'));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const [tab, setTab]                   = useState<'fees' | 'hardcopy' | 'cart'>('fees');
  const [feePlans, setFeePlans]         = useState<FeePlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');
  const [notes, setNotes]               = useState<Note[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [noteSearch, setNoteSearch]     = useState('');
  const [noteSubjectFilter, setNoteSubjectFilter] = useState('all');
  const [noteClassFilter, setNoteClassFilter]     = useState('all');
  const [selectedPlans, setSelectedPlans] = useState<Record<string, boolean>>({});
  const [hardcopyQty, setHardcopyQty]   = useState<Record<string, number>>({});
  const [couponCode, setCouponCode]     = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; label: string } | null>(null);
  const [couponError, setCouponError]   = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [showAddress, setShowAddress]   = useState(false);
  const [address, setAddress]           = useState<AddressForm>({ name: '', phone: '', email: session?.user?.email || '', address: '', city: '', state: '', pincode: '', landmark: '' });
  const [showPaymentModal, setShowPaymentModal]   = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'qr' | 'cod' | null>(null);
  const [showOrderSummaryModal, setShowOrderSummaryModal] = useState(false);
  const [orderPlaced, setOrderPlaced]   = useState<Order | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  // Track modal state — separate modal for input and for result
  const [showTrackInput, setShowTrackInput]   = useState(false);
  const [trackedOrder, setTrackedOrder]       = useState<Order | null>(null);

  const MIN_ORDER = 200;

  const { startUpload: uploadPaymentProof, isUploading: isUploadingProof } = useUploadThing('paymentProof', {
    onClientUploadComplete: async (res) => {
      if (res?.[0] && orderPlaced) {
        const url = res[0].url;
        const r = await fetch('/api/payments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update-payment-proof', orderId: orderPlaced.id, proofUrl: url }) });
        const d = await r.json();
        if (d.success) {
          alert('Payment proof uploaded! We will verify and confirm your order.');
          resetCart();
        } else { alert(d.error || 'Failed to update order'); }
      }
      setUploadingProof(false);
    },
    onUploadError: (err: Error) => { alert(`Upload failed: ${err.message}`); setUploadingProof(false); },
  });

  const resetCart = () => {
    setOrderPlaced(null); setSelectedPaymentMethod(null);
    setSelectedPlans({}); setHardcopyQty({});
    setAppliedCoupon(null); setCouponCode(''); setTab('fees');
  };

  useEffect(() => {
    fetch('/api/payments?action=fee-plans').then(r => r.json()).then(d => {
      if (d.success) {
        setFeePlans(d.plans);
        const cls = [...new Set(d.plans.map((p: FeePlan) => p.class))] as string[];
        if (cls.length) setSelectedClass(cls[0]);
      }
    }).finally(() => setPlansLoading(false));
    fetch('/api/payments?action=notes').then(r => r.json()).then(d => { if (d.success) setNotes(d.notes); }).finally(() => setNotesLoading(false));
  }, []);

  // ── Derived ──
  const classes       = [...new Set(feePlans.map(p => p.class))];
  const plansForClass = feePlans.filter(p => p.class === selectedClass);
  const noteSubjects  = ['all', ...Array.from(new Set(notes.map(n => n.subject)))];
  const noteClasses   = ['all', ...Array.from(new Set(notes.map(n => n.class)))];
  const filteredNotes = notes.filter(n => {
    const ms = noteSubjectFilter === 'all' || n.subject === noteSubjectFilter;
    const mc = noteClassFilter   === 'all' || n.class   === noteClassFilter;
    const mq = !noteSearch || n.title.toLowerCase().includes(noteSearch.toLowerCase()) || n.subject.toLowerCase().includes(noteSearch.toLowerCase());
    return ms && mc && mq;
  });

  const cartItems: CartItem[] = [
    ...feePlans.filter(p => selectedPlans[p.id]).map(p => ({ id: p.id, type: 'fee' as const, name: `${p.class} · ${p.subject} (${p.duration})`, price: p.price, subject: p.subject, class: p.class })),
    ...Object.entries(hardcopyQty).filter(([, q]) => q > 0).map(([noteId, qty]) => {
      const note = notes.find(n => n.id === noteId);
      const up = note?.price || 30;
      return { id: noteId, type: 'hardcopy' as const, name: note?.title || 'Note', price: up * qty, qty, unitPrice: up, subject: note?.subject };
    }),
  ];

  const subtotal       = cartItems.reduce((s, i) => s + i.price, 0);
  const couponDiscount = appliedCoupon?.discount || 0;
  const total          = Math.max(subtotal - couponDiscount, 0);
  const hasHardcopy    = cartItems.some(i => i.type === 'hardcopy');
  const hasOnlyFees    = cartItems.length > 0 && cartItems.every(i => i.type === 'fee');
  const meetsMinOrder  = total >= MIN_ORDER;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError(''); setCouponLoading(true);
    try {
      const res  = await fetch('/api/payments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'validate-coupon', code: couponCode, subtotal }) });
      const data = await res.json();
      if (!res.ok) setCouponError(data.error);
      else setAppliedCoupon({ code: data.code, discount: data.discount, label: data.label });
    } catch { setCouponError('Network error.'); }
    finally { setCouponLoading(false); }
  };

  const handleOpenPaymentModal = () => {
    if (!cartItems.length) return;
    if (!meetsMinOrder) { alert(`Minimum order is ₹${MIN_ORDER}. Add ₹${MIN_ORDER - total} more.`); return; }
    if (hasHardcopy && (!address.name || !address.phone || !address.address || !address.city || !address.pincode)) {
      alert('Please fill all delivery address fields'); setShowAddress(true); return;
    }
    setShowPaymentModal(true);
  };

  const selectPaymentMethod = (m: 'qr' | 'cod') => { setSelectedPaymentMethod(m); setShowPaymentModal(false); setShowOrderSummaryModal(true); };

  const placeOrder = async () => {
    if (!selectedPaymentMethod) return;
    setIsCreatingOrder(true);
    try {
      const res  = await fetch('/api/payments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-order', items: cartItems, subtotal, couponDiscount, total, couponCode: appliedCoupon?.code || null, address: hasHardcopy ? address : null, userEmail: session?.user?.email, paymentMethod: selectedPaymentMethod }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setOrderPlaced(data.order);
      setShowOrderSummaryModal(false);
      if (selectedPaymentMethod === 'cod') { alert('Order placed! You\'ll receive a confirmation email after admin approval.'); resetCart(); }
    } catch (e: any) { alert(e?.message || 'Failed to place order'); }
    finally { setIsCreatingOrder(false); }
  };

  // ── Modals ──────────────────────────────────────────────────────────────────

  // Track input modal
  if (showTrackInput) {
    return <TrackInputModal dm={dm} onClose={() => setShowTrackInput(false)} onFound={o => { setTrackedOrder(o); setShowTrackInput(false); }} />;
  }

  // Track result modal
  if (trackedOrder) {
    return <TrackModal order={trackedOrder} dm={dm} onClose={() => setTrackedOrder(null)} />;
  }

  // Payment method picker
  if (showPaymentModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
        <div className={`max-w-md w-full rounded-3xl shadow-2xl ${dm ? 'bg-gray-900' : 'bg-white'}`}>
          <div className={`p-5 border-b-2 flex items-center justify-between ${dm ? 'border-gray-800' : 'border-gray-100'}`}>
            <div><h2 className={`text-xl font-black ${dm ? 'text-white' : 'text-gray-900'}`}>Select Payment</h2><p className={`text-xs mt-0.5 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Total: ₹{fmt(total)}</p></div>
            <button onClick={() => setShowPaymentModal(false)} className={`p-2 rounded-xl ${dm ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}><X className="w-5 h-5" /></button>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button onClick={() => selectPaymentMethod('qr')} className={`p-5 rounded-2xl border-2 text-center transition-all hover:border-violet-500 hover:-translate-y-0.5 hover:shadow-lg ${dm ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center"><QrCode className="w-7 h-7 text-white" /></div>
              <h3 className={`font-black text-sm mb-1 ${dm ? 'text-white' : 'text-gray-900'}`}>Pay via QR</h3>
              <p className={`text-xs ${dm ? 'text-gray-500' : 'text-gray-400'}`}>Scan & pay with any UPI app</p>
            </button>
            {!hasOnlyFees && (
              <button onClick={() => selectPaymentMethod('cod')} className={`p-5 rounded-2xl border-2 text-center transition-all hover:border-emerald-500 hover:-translate-y-0.5 hover:shadow-lg ${dm ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center"><DollarSign className="w-7 h-7 text-white" /></div>
                <h3 className={`font-black text-sm mb-1 ${dm ? 'text-white' : 'text-gray-900'}`}>Cash on Delivery</h3>
                <p className={`text-xs ${dm ? 'text-gray-500' : 'text-gray-400'}`}>Pay when you receive</p>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Order summary / confirm
  if (showOrderSummaryModal && selectedPaymentMethod) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
        <div className={`max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl ${dm ? 'bg-gray-900' : 'bg-white'}`}>
          <div className={`sticky top-0 z-10 p-5 border-b-2 flex items-center justify-between ${dm ? 'border-gray-800 bg-gray-900' : 'border-gray-100 bg-white'}`}>
            <h2 className={`text-xl font-black ${dm ? 'text-white' : 'text-gray-900'}`}>Confirm Order</h2>
            <button onClick={() => { setShowOrderSummaryModal(false); setSelectedPaymentMethod(null); }} className={`p-2 rounded-xl ${dm ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}><X className="w-5 h-5" /></button>
          </div>
          <div className="p-5 space-y-4">
            <div className={`p-4 rounded-xl border-2 flex items-center gap-3 ${selectedPaymentMethod === 'qr' ? dm ? 'border-violet-700 bg-violet-950/30' : 'border-violet-200 bg-violet-50' : dm ? 'border-emerald-700 bg-emerald-950/30' : 'border-emerald-200 bg-emerald-50'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedPaymentMethod === 'qr' ? dm ? 'bg-violet-800' : 'bg-violet-100' : dm ? 'bg-emerald-800' : 'bg-emerald-100'}`}>
                {selectedPaymentMethod === 'qr' ? <QrCode className={`w-5 h-5 ${dm ? 'text-violet-300' : 'text-violet-600'}`} /> : <DollarSign className={`w-5 h-5 ${dm ? 'text-emerald-300' : 'text-emerald-600'}`} />}
              </div>
              <div>
                <p className={`font-bold text-sm ${dm ? 'text-white' : 'text-gray-900'}`}>{selectedPaymentMethod === 'qr' ? 'QR Code Payment' : 'Cash on Delivery'}</p>
                <p className={`text-xs ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{selectedPaymentMethod === 'qr' ? 'Pay via UPI by scanning QR code' : 'Pay when you receive the order'}</p>
              </div>
            </div>

            <div className={`rounded-xl border-2 overflow-hidden ${dm ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className={`p-4 border-b-2 ${dm ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}><h3 className={`font-black text-sm ${dm ? 'text-white' : 'text-gray-900'}`}>Order Summary</h3></div>
              <div className="p-4 space-y-2 text-sm">
                {cartItems.map((item, i) => (
                  <div key={i} className={`flex justify-between ${dm ? 'text-gray-300' : 'text-gray-600'}`}>
                    <span>{item.name}{item.qty ? ` × ${item.qty}` : ''}</span>
                    <span className="font-medium">₹{fmt(item.price)}</span>
                  </div>
                ))}
                <div className={`border-t pt-2 ${dm ? 'border-gray-700' : 'border-gray-200'} space-y-1`}>
                  <div className={`flex justify-between ${dm ? 'text-gray-400' : 'text-gray-500'}`}><span>Subtotal</span><span>₹{fmt(subtotal)}</span></div>
                  {couponDiscount > 0 && <div className="flex justify-between text-green-500"><span>Discount ({appliedCoupon?.code})</span><span>-₹{fmt(couponDiscount)}</span></div>}
                  {hasHardcopy && <div className="flex justify-between"><span>Delivery</span><span className="text-green-500">FREE</span></div>}
                  <div className={`flex justify-between font-bold text-base pt-1 ${dm ? 'text-white' : 'text-gray-900'}`}>
                    <span>Total</span><span className={selectedPaymentMethod === 'qr' ? 'text-violet-500' : 'text-emerald-500'}>₹{fmt(total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {hasHardcopy && (<div className={`rounded-xl border-2 p-4 text-sm ${dm ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`font-black mb-2 ${dm ? 'text-white' : 'text-gray-900'}`}>Delivery Address</h3>
              <div className={`space-y-0.5 ${dm ? 'text-gray-300' : 'text-gray-600'}`}>
                <p><strong>{address.name}</strong> · {address.phone}</p>
                <p>{address.address}, {address.city} - {address.pincode}</p>
              </div>
            </div>)}

            <button onClick={placeOrder} disabled={isCreatingOrder} className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black disabled:opacity-50 flex items-center justify-center gap-2">
              {isCreatingOrder ? <Loader className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
              {isCreatingOrder ? 'Placing Order…' : `Place Order · ₹${fmt(total)}`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // QR upload modal
  if (orderPlaced && selectedPaymentMethod === 'qr') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
        <div className={`max-w-md w-full max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl ${dm ? 'bg-gray-900' : 'bg-white'}`}>
          <div className={`sticky top-0 z-10 p-5 border-b-2 flex items-center justify-between ${dm ? 'border-gray-800 bg-gray-900' : 'border-gray-100 bg-white'}`}>
            <div><h2 className={`text-xl font-black ${dm ? 'text-white' : 'text-gray-900'}`}>Complete Payment</h2><p className={`text-xs mt-0.5 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Order #{orderPlaced.id.slice(0,8)} · ₹{fmt(orderPlaced.total)}</p></div>
            <button onClick={() => { setOrderPlaced(null); setSelectedPaymentMethod(null); }} className={`p-2 rounded-xl ${dm ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}><X className="w-5 h-5" /></button>
          </div>
          <div className="p-5 space-y-4">
            <div className={`p-5 rounded-2xl border-2 text-center ${dm ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <h3 className={`font-black text-base mb-3 ${dm ? 'text-white' : 'text-gray-900'}`}>Scan & Pay</h3>
              <div className="flex justify-center mb-4">
                <div className="w-44 h-44 bg-white rounded-2xl shadow-lg flex items-center justify-center p-4">
                  <img src="/paytm-qr-placeholder.jpeg" alt="QR" className="w-full h-full object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              </div>
              <p className={`text-sm mb-1 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Pay <span className="font-black text-violet-500">₹{fmt(orderPlaced.total)}</span> via any UPI app</p>
              <p className={`text-xs font-mono ${dm ? 'text-gray-400' : 'text-gray-500'}`}>UPI ID: <span className="font-bold text-violet-500">9810493309@ptsbi</span></p>
            </div>

            <div className="space-y-3">
              <label className={`block text-sm font-bold ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Upload Payment Screenshot</label>
              <div className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${paymentProof ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/20' : dm ? 'border-gray-600 hover:border-violet-500' : 'border-gray-300 hover:border-violet-400'}`}>
                <input type="file" accept="image/*" onChange={e => setPaymentProof(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <Upload className={`w-7 h-7 mx-auto mb-2 ${paymentProof ? 'text-violet-500' : dm ? 'text-gray-500' : 'text-gray-400'}`} />
                <p className={`text-sm ${paymentProof ? 'text-violet-500 font-medium' : dm ? 'text-gray-400' : 'text-gray-500'}`}>{paymentProof ? paymentProof.name.substring(0, 35) + (paymentProof.name.length > 35 ? '…' : '') : 'Click or drag to upload'}</p>
                <p className={`text-xs mt-1 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>PNG, JPG up to 5MB</p>
              </div>
              <button onClick={async () => { if (!paymentProof || !orderPlaced) return; setUploadingProof(true); await uploadPaymentProof([paymentProof]); }} disabled={!paymentProof || uploadingProof || isUploadingProof}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                {uploadingProof || isUploadingProof ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {uploadingProof || isUploadingProof ? 'Uploading…' : 'Submit Payment Proof'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Page ──────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen ${dm ? 'bg-gray-950' : 'bg-gradient-to-br from-slate-50 via-white to-violet-50/20'}`}>

      {/* Header */}
      <div className={`sticky top-0 z-30 border-b-2 backdrop-blur-md ${dm ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-100'} shadow-sm`}>
        <div className="max-w-6xl mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between py-2 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md flex-shrink-0">
                <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h1 className={`text-base sm:text-xl font-black leading-none ${dm ? 'text-white' : 'text-gray-900'}`}>Fees & Payments</h1>
                <p className={`text-[10px] sm:text-xs hidden sm:block ${dm ? 'text-gray-500' : 'text-gray-400'}`}>Intense Learners Coaching Centre</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Track button — opens modal directly, no prompt() */}
              <button onClick={() => setShowTrackInput(true)}
                className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl border-2 text-xs sm:text-sm font-bold flex items-center gap-1 ${dm ? 'border-gray-700 text-gray-300 hover:border-violet-500' : 'border-gray-200 text-gray-600 hover:border-violet-400'}`}>
                <Truck className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Track</span>
              </button>
              <button onClick={() => setTab('cart')} className={`relative flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl border-2 font-bold text-xs sm:text-sm transition-all ${tab === 'cart' ? 'bg-violet-600 border-violet-600 text-white' : dm ? 'bg-gray-800 border-gray-700 text-white hover:border-violet-500' : 'bg-white border-gray-200 text-gray-800 hover:border-violet-400'}`}>
                <Wallet className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Cart</span>
                {cartItems.length > 0 && (<>
                  <span className="absolute -top-2 -right-2 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-red-500 text-white text-[8px] sm:text-[10px] font-black flex items-center justify-center">{cartItems.length}</span>
                  <span className="text-violet-400 font-black text-[10px] sm:text-sm">₹{fmt(total)}</span>
                </>)}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-0.5 sm:gap-1 overflow-x-auto scrollbar-hide">
            {([
              { id: 'fees',     label: 'Fee Structure', icon: GraduationCap },
              { id: 'hardcopy', label: 'Hardcopy Notes', icon: Printer      },
              { id: 'cart',     label: cartItems.length > 0 ? `Cart (${cartItems.length})` : 'Checkout', icon: CreditCard },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-sm font-bold whitespace-nowrap flex-shrink-0 border-b-2 transition-all -mb-px ${
                  tab === id ? 'border-violet-500 text-violet-500' : dm ? 'border-transparent text-gray-500 hover:text-gray-300' : 'border-transparent text-gray-400 hover:text-gray-700'
                }`}>
                <Icon className="w-3 h-3 sm:w-4 sm:h-4" />{label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8">

        {/* Min order warning */}
        {cartItems.length > 0 && !meetsMinOrder && (
          <div className={`mb-4 p-3 rounded-xl border-2 ${dm ? 'bg-amber-950/30 border-amber-900' : 'bg-amber-50 border-amber-200'}`}>
            <p className="text-xs sm:text-sm font-medium text-amber-600 dark:text-amber-400">⚠️ Minimum order ₹{MIN_ORDER}. Add ₹{MIN_ORDER - total} more to proceed.</p>
          </div>
        )}

        {/* ── FEE STRUCTURE TAB ── */}
        {tab === 'fees' && (
          <div>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-6">
              {[
                { icon: Users,     val: '100+',      label: 'Students',    c: 'text-blue-500',    bg: dm ? 'bg-blue-950/60'    : 'bg-blue-50'    },
                { icon: Award,     val: '95%',       label: 'Pass Rate',   c: 'text-emerald-500', bg: dm ? 'bg-emerald-950/60' : 'bg-emerald-50' },
                { icon: Star,      val: '4.9 ★',     label: 'Rating',      c: 'text-amber-500',   bg: dm ? 'bg-amber-950/60'   : 'bg-amber-50'   },
                { icon: TrendingUp,val: '3× faster', label: 'Learning',    c: 'text-violet-500',  bg: dm ? 'bg-violet-950/60'  : 'bg-violet-50'  },
              ].map(({ icon: Icon, val, label, c, bg }) => (
                <div key={label} className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-4 rounded-2xl border-2 ${dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} shadow-sm`}>
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}><Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${c}`} /></div>
                  <div className="min-w-0">
                    <p className={`text-sm sm:text-base font-black ${dm ? 'text-white' : 'text-gray-900'}`}>{val}</p>
                    <p className={`text-[8px] sm:text-xs font-medium truncate ${dm ? 'text-gray-500' : 'text-gray-400'}`}>{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Class selector */}
            <div className="mb-5">
              <h2 className={`text-base sm:text-xl font-black mb-3 flex items-center gap-2 ${dm ? 'text-white' : 'text-gray-900'}`}><GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500" />Select Your Class</h2>
              {plansLoading ? <div className="flex items-center gap-2"><Loader className="w-4 h-4 text-violet-500 animate-spin" /><span className={`text-xs ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Loading…</span></div> : (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {classes.map(cls => (
                    <button key={cls} onClick={() => setSelectedClass(cls)}
                      className={`px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-2xl font-black text-xs sm:text-sm transition-all border-2 flex-shrink-0 ${
                        selectedClass === cls ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-transparent shadow-lg' : dm ? 'bg-gray-900 border-gray-700 text-gray-300 hover:border-violet-500' : 'bg-white border-gray-200 text-gray-700 hover:border-violet-400'
                      }`}>{cls}</button>
                  ))}
                </div>
              )}
            </div>

            {selectedClass && (
              <>
                <h3 className={`text-sm sm:text-lg font-black mb-3 ${dm ? 'text-white' : 'text-gray-900'}`}>Plans for {selectedClass}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {plansForClass.map(plan => {
                    const isSel = !!selectedPlans[plan.id];
                    const save  = plan.originalPrice - plan.price;
                    const pct   = Math.round(save / plan.originalPrice * 100);
                    const grad  = getGrad(plan.subject);
                    return (
                      <div key={plan.id} onClick={() => setSelectedPlans(p => ({ ...p, [plan.id]: !p[plan.id] }))}
                        className={`relative rounded-2xl border-2 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-xl overflow-hidden ${
                          isSel ? dm ? 'border-violet-500 shadow-lg shadow-violet-500/20' : 'border-violet-500 shadow-lg shadow-violet-500/15' : dm ? 'border-gray-800 hover:border-gray-700' : 'border-gray-100 hover:border-gray-200'
                        } ${dm ? 'bg-gray-900' : 'bg-white'}`}>
                        <div className={`h-1.5 bg-gradient-to-r ${grad}`} />
                        {plan.popular && (<div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded-lg text-[9px] font-black text-white bg-gradient-to-r ${grad}`}>★ Popular</div>)}
                        <div className="p-3 sm:p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-md flex-shrink-0`}><BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" /></div>
                            <div><h4 className={`font-black text-xs sm:text-sm leading-tight ${dm ? 'text-white' : 'text-gray-900'}`}>{plan.subject}</h4><p className={`text-[9px] sm:text-[11px] ${dm ? 'text-gray-500' : 'text-gray-400'}`}>{plan.duration}</p></div>
                          </div>
                          <div className="mb-3">
                            <div className="flex items-baseline gap-1.5">
                              <span className={`text-xl sm:text-2xl font-black ${dm ? 'text-white' : 'text-gray-900'}`}>₹{fmt(plan.price)}</span>
                              <span className={`text-xs line-through ${dm ? 'text-gray-600' : 'text-gray-400'}`}>₹{fmt(plan.originalPrice)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="px-1.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-[9px] font-black">{pct}% OFF</span>
                              <span className={`text-[9px] ${dm ? 'text-gray-500' : 'text-gray-400'}`}>Save ₹{fmt(save)}</span>
                            </div>
                          </div>
                          <button className={`w-full py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-black transition-all ${isSel ? `bg-gradient-to-r ${grad} text-white shadow-md` : dm ? 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700' : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'}`}>
                            {isSel ? <span className="flex items-center justify-center gap-1"><Check className="w-3.5 h-3.5" />Selected</span> : <span className="flex items-center justify-center gap-1">Select<ArrowRight className="w-3.5 h-3.5" /></span>}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {Object.values(selectedPlans).some(Boolean) && (
                  <div className={`mt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl border-2 border-violet-500 ${dm ? 'bg-violet-950/30' : 'bg-violet-50'}`}>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-violet-500 flex-shrink-0" />
                      <div>
                        <p className={`font-black text-xs sm:text-sm ${dm ? 'text-white' : 'text-gray-900'}`}>{Object.values(selectedPlans).filter(Boolean).length} plan(s) selected</p>
                        <p className={`text-[10px] ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Add printed notes or go to checkout</p>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button onClick={() => setTab('hardcopy')} className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-bold border-2 ${dm ? 'border-gray-700 text-gray-300' : 'border-gray-300 text-gray-700'}`}>+ Notes</button>
                      <button onClick={() => setTab('cart')} className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex items-center justify-center gap-1">Checkout <ArrowRight className="w-3 h-3" /></button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── HARDCOPY TAB ── */}
        {tab === 'hardcopy' && (
          <div>
            <div className={`flex items-center gap-3 p-4 rounded-2xl border-2 mb-5 ${dm ? 'bg-amber-950/30 border-amber-900' : 'bg-amber-50 border-amber-200'}`}>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0"><Printer className="w-5 h-5 text-white" /></div>
              <div><p className={`font-black text-sm ${dm ? 'text-amber-300' : 'text-amber-800'}`}>Order Printed Notes</p><p className={`text-xs ${dm ? 'text-amber-400/60' : 'text-amber-700/60'}`}>Each note has its own price · Free delivery · 3–5 days</p></div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="relative flex-1">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input type="text" value={noteSearch} onChange={e => setNoteSearch(e.target.value)} placeholder="Search notes…"
                  className={`w-full pl-8 pr-4 py-2 border-2 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent ${dm ? 'bg-gray-900 border-gray-800 text-white placeholder-gray-600' : 'bg-white border-gray-200 text-gray-900'}`} />
              </div>
              <select value={noteSubjectFilter} onChange={e => setNoteSubjectFilter(e.target.value)} className={`px-2 py-2 border-2 rounded-xl text-xs sm:text-sm font-semibold ${dm ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-800'}`}>
                {noteSubjects.map(s => <option key={s} value={s}>{s === 'all' ? 'All Subjects' : s}</option>)}
              </select>
              <select value={noteClassFilter} onChange={e => setNoteClassFilter(e.target.value)} className={`px-2 py-2 border-2 rounded-xl text-xs sm:text-sm font-semibold ${dm ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-800'}`}>
                {noteClasses.map(c => <option key={c} value={c}>{c === 'all' ? 'All Classes' : c}</option>)}
              </select>
            </div>

            {notesLoading ? <div className="flex justify-center py-16"><Loader className="w-8 h-8 text-violet-500 animate-spin" /></div>
              : filteredNotes.length === 0 ? (
                <div className={`rounded-2xl border-2 p-12 text-center ${dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                  <FileText className={`w-14 h-14 mx-auto mb-3 ${dm ? 'text-gray-700' : 'text-gray-300'}`} />
                  <p className={`font-black text-lg ${dm ? 'text-white' : 'text-gray-900'}`}>No notes found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {filteredNotes.map(note => {
                    const qty = hardcopyQty[note.id] || 0;
                    const up  = note.price || 30;
                    return (
                      <div key={note.id} className={`rounded-2xl border-2 overflow-hidden ${dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                        <div className={`h-1 bg-gradient-to-r ${getGrad(note.subject)}`} />
                        <div className={`relative h-24 sm:h-32 flex items-center justify-center overflow-hidden ${dm ? 'bg-gray-800' : 'bg-gray-50'}`}>
                          {note.thumbnailUrl ? <img src={note.thumbnailUrl} alt={note.title} className="w-full h-full object-cover" loading="lazy" /> : <FileText className={`w-8 h-8 ${dm ? 'text-gray-700' : 'text-gray-300'}`} />}
                          {qty > 0 && <div className="absolute top-2 right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-violet-600 text-white text-[9px] font-black flex items-center justify-center">{qty}</div>}
                        </div>
                        <div className="p-3 sm:p-4">
                          <div className="flex flex-wrap gap-1 mb-2">
                            <span className={`px-1.5 py-0.5 rounded-lg text-[9px] font-bold border ${getSubColor(note.subject, dm)}`}>{note.subject}</span>
                            <span className={`px-1.5 py-0.5 rounded-lg text-[9px] font-bold border ${dm ? 'bg-blue-900/40 text-blue-300 border-blue-800' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{note.class}</span>
                          </div>
                          <h3 className={`text-xs sm:text-sm font-bold mb-2 line-clamp-2 ${dm ? 'text-white' : 'text-gray-900'}`}>{note.title}</h3>
                          <div className={`flex items-center justify-between p-2 sm:p-3 rounded-xl border-2 ${dm ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                            <p className={`text-base sm:text-lg font-black ${dm ? 'text-white' : 'text-gray-900'}`}>₹{up}<span className="text-xs font-normal">/copy</span></p>
                            {qty === 0 ? (
                              <button onClick={() => setHardcopyQty(p => ({ ...p, [note.id]: 1 }))} className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-violet-600 text-white text-[10px] sm:text-xs font-black">Add</button>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <button onClick={() => setHardcopyQty(p => { const n = { ...p }; if (n[note.id] <= 1) delete n[note.id]; else n[note.id]--; return n; })} className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg font-black text-sm ${dm ? 'bg-gray-700' : 'bg-gray-200'}`}>−</button>
                                <span className="font-black text-xs sm:text-sm w-4 text-center">{qty}</span>
                                <button onClick={() => setHardcopyQty(p => ({ ...p, [note.id]: (p[note.id] || 0) + 1 }))} className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-violet-600 text-white font-black text-sm">+</button>
                              </div>
                            )}
                          </div>
                          {qty > 0 && <p className="text-[10px] text-center mt-1 font-medium text-violet-500">Total: ₹{up * qty}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            {Object.keys(hardcopyQty).length > 0 && (
              <div className={`sticky bottom-4 mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border-2 border-violet-500 shadow-2xl backdrop-blur-md ${dm ? 'bg-gray-900/95' : 'bg-white/95'}`}>
                <div>
                  <p className={`font-black text-xs sm:text-sm ${dm ? 'text-white' : 'text-gray-900'}`}>{Object.values(hardcopyQty).reduce((s, q) => s + q, 0)} copies selected</p>
                  <p className="text-xs font-bold text-violet-500">₹{Object.entries(hardcopyQty).reduce((s, [id, q]) => s + (notes.find(n => n.id === id)?.price || 30) * q, 0)} · Free delivery 🚚</p>
                </div>
                <button onClick={() => setTab('cart')} className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black text-xs sm:text-sm">Checkout →</button>
              </div>
            )}
          </div>
        )}

        {/* ── CHECKOUT TAB ── */}
        {tab === 'cart' && (
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
            <div className="flex-1 space-y-4">
              {/* Cart items */}
              <div className={`rounded-2xl border-2 overflow-hidden ${dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                <div className={`p-4 border-b-2 ${dm ? 'border-gray-800' : 'border-gray-100'}`}><h3 className={`font-black text-sm ${dm ? 'text-white' : 'text-gray-900'}`}>Cart ({cartItems.length} items)</h3></div>
                {cartItems.length === 0 ? (
                  <div className="p-10 text-center">
                    <p className={`text-sm mb-3 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Your cart is empty</p>
                    <button onClick={() => setTab('fees')} className="px-4 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold">Browse Plans</button>
                  </div>
                ) : cartItems.map((item, i) => (
                  <div key={item.id} className={`flex justify-between p-4 text-sm ${i < cartItems.length - 1 ? `border-b ${dm ? 'border-gray-800' : 'border-gray-100'}` : ''}`}>
                    <div>
                      <p className={`font-medium ${dm ? 'text-white' : 'text-gray-900'}`}>{item.name}</p>
                      {item.qty && item.unitPrice && <p className={`text-xs ${dm ? 'text-gray-500' : 'text-gray-400'}`}>₹{item.unitPrice} × {item.qty}</p>}
                    </div>
                    <p className="font-bold">₹{fmt(item.price)}</p>
                  </div>
                ))}
              </div>

              {/* Delivery address */}
              {hasHardcopy && cartItems.length > 0 && (
                <div className={`rounded-2xl border-2 p-4 ${dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                  <button onClick={() => setShowAddress(v => !v)} className="w-full flex justify-between items-center">
                    <h3 className={`font-black text-sm ${dm ? 'text-white' : 'text-gray-900'}`}>Delivery Address {!showAddress && address.name && <span className="text-violet-500 text-xs ml-2">✓ Filled</span>}</h3>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showAddress ? 'rotate-180' : ''}`} />
                  </button>
                  {showAddress && (
                    <div className="mt-3 space-y-2">
                      {[
                        { key: 'name',    ph: 'Full Name',    type: 'text' },
                        { key: 'phone',   ph: 'Phone',        type: 'tel'  },
                        { key: 'address', ph: 'Full Address', type: 'text' },
                      ].map(({ key, ph, type }) => (
                        <input key={key} type={type} placeholder={ph} value={(address as any)[key]} onChange={e => setAddress(a => ({ ...a, [key]: e.target.value }))}
                          className={`w-full p-2.5 rounded-xl border-2 text-sm ${dm ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'}`} />
                      ))}
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="City" value={address.city} onChange={e => setAddress(a => ({ ...a, city: e.target.value }))} className={`p-2.5 rounded-xl border-2 text-sm ${dm ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'}`} />
                        <input type="text" placeholder="PIN Code" value={address.pincode} onChange={e => setAddress(a => ({ ...a, pincode: e.target.value }))} className={`p-2.5 rounded-xl border-2 text-sm ${dm ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'}`} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Coupon */}
              {cartItems.length > 0 && (
                <div className={`rounded-2xl border-2 p-4 ${dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                  <h3 className={`font-black text-sm mb-3 ${dm ? 'text-white' : 'text-gray-900'}`}>🏷️ Coupon Code</h3>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border-2 border-emerald-500">
                      <div><p className="text-emerald-500 font-black text-sm">{appliedCoupon.code}</p><p className="text-emerald-600 text-xs">{appliedCoupon.label} · Saved ₹{fmt(appliedCoupon.discount)}</p></div>
                      <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="text-red-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input type="text" placeholder="Enter code" value={couponCode} onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }} onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                        className={`flex-1 p-2.5 rounded-xl border-2 text-sm font-mono ${dm ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'}`} />
                      <button onClick={handleApplyCoupon} disabled={couponLoading || !couponCode.trim()} className="px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-black disabled:opacity-50 flex items-center gap-1">
                        {couponLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />} Apply
                      </button>
                    </div>
                  )}
                  {couponError && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{couponError}</p>}
                </div>
              )}
            </div>

            {/* Summary sidebar */}
            <div className="lg:w-96">
              <div className={`rounded-2xl border-2 p-4 sm:p-5 lg:sticky lg:top-24 ${dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                <h3 className={`font-black text-base mb-4 ${dm ? 'text-white' : 'text-gray-900'}`}>Order Summary</h3>
                <div className="space-y-2 text-sm mb-4">
                  <div className={`flex justify-between ${dm ? 'text-gray-400' : 'text-gray-500'}`}><span>Subtotal</span><span>₹{fmt(subtotal)}</span></div>
                  {couponDiscount > 0 && <div className="flex justify-between text-green-500"><span>Discount</span><span>-₹{fmt(couponDiscount)}</span></div>}
                  {hasHardcopy && <div className="flex justify-between"><span className={dm ? 'text-gray-400' : 'text-gray-500'}>Delivery</span><span className="text-green-500 font-medium">FREE</span></div>}
                  <div className={`flex justify-between font-black text-base border-t pt-2 ${dm ? 'border-gray-800 text-white' : 'border-gray-100 text-gray-900'}`}><span>Total</span><span className="text-violet-500">₹{fmt(total)}</span></div>
                </div>
                <button onClick={handleOpenPaymentModal} disabled={cartItems.length === 0 || !meetsMinOrder}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black text-sm disabled:opacity-40 flex items-center justify-center gap-2 hover:shadow-lg transition-all">
                  <Lock className="w-4 h-4" /> Proceed to Payment
                </button>
                {!meetsMinOrder && cartItems.length > 0 && <p className="text-[10px] text-center mt-2 text-amber-500">Minimum order: ₹{MIN_ORDER}</p>}
                <div className={`flex items-center justify-center gap-3 mt-4 pt-4 border-t text-xs ${dm ? 'border-gray-800 text-gray-500' : 'border-gray-100 text-gray-400'}`}>
                  <span className="flex items-center gap-1"><Shield className="w-3 h-3" />Secure</span>
                  <span className="flex items-center gap-1"><Lock className="w-3 h-3" />Encrypted</span>
                  <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" />Trusted</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}