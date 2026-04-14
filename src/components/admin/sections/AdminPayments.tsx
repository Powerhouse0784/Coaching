/**
 * FILE: src/components/admin/sections/AdminPayments.tsx
 *
 * Usage:
 *   import AdminPayments from '@/components/admin/sections/AdminPayments';
 *   {activeSection === 'payments' && <AdminPayments />}
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, RefreshCw, Loader, AlertCircle,
  ChevronLeft, ChevronRight, CreditCard, TrendingUp,
  CheckCircle2, XCircle, Clock,
} from 'lucide-react';

function useDarkMode() {
  const [dm, setDm] = useState(false);
  useEffect(() => {
    const check = () => setDm(document.documentElement.classList.contains('dark'));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return dm;
}

function adminFetch(path: string, opts: RequestInit = {}) {
  const token = sessionStorage.getItem('admin_auth') || '';
  return fetch(`/api/admin/${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
  }).then(r => r.json());
}

const STATUS_CONFIG: Record<string, { color: string; icon: React.ElementType }> = {
  paid:    { color: 'bg-green-500/15 text-green-400',  icon: CheckCircle2 },
  pending: { color: 'bg-yellow-500/15 text-yellow-400', icon: Clock        },
  failed:  { color: 'bg-red-500/15 text-red-400',       icon: XCircle      },
};

export default function AdminPayments() {
  const dm = useDarkMode();
  const [items,        setItems]        = useState<any[]>([]);
  const [total,        setTotal]        = useState(0);
  const [totalRevenue, setTotalRevenue] = useState('₹0');
  const [page,         setPage]         = useState(1);
  const [search,       setSearch]       = useState('');
  const [status,       setStatus]       = useState('');
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT), search });
      if (status) params.set('status', status);
      const data = await adminFetch(`payments?${params}`);
      if (data.success) {
        setItems(data.payments ?? []);
        setTotal(data.total ?? 0);
        setTotalRevenue(data.totalRevenue ?? '₹0');
      } else setError(data.error || 'Failed to load');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, status]);

  const totalPages = Math.ceil(total / LIMIT);
  const tp   = dm ? 'text-white' : 'text-gray-900';
  const tm   = dm ? 'text-gray-400' : 'text-gray-500';
  const bdr  = dm ? 'border-gray-700' : 'border-gray-200';
  const card = `rounded-2xl border-2 ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`;
  const inputCls = `px-3 py-2 border-2 rounded-xl text-sm outline-none transition ${dm ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500' : 'bg-white border-gray-200 text-gray-900 focus:border-orange-500'}`;

  return (
    <div className="space-y-4">
      {/* Revenue banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total Revenue', value: totalRevenue, icon: TrendingUp, color: 'from-emerald-500 to-teal-500' },
          { label: 'Total Orders',  value: total,         icon: CreditCard,  color: 'from-blue-500 to-cyan-500'   },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className={`${card} p-4`}>
            <div className={`w-9 h-9 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center mb-2`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <p className={`text-lg font-black ${tp}`}>{value}</p>
            <p className={`text-xs ${tm}`}>{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${tm}`} />
          <input type="text" placeholder="Search by name or order ID…" value={search} onChange={e => setSearch(e.target.value)} className={`${inputCls} w-full pl-9`} />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)} className={`${inputCls} min-w-[140px]`}>
          <option value="">All statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
        <div className="flex items-center gap-2">
          <button onClick={load} className={`p-2 rounded-xl transition ${dm ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border-2 border-red-500/30 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
          <button onClick={load} className="ml-auto px-3 py-1 bg-red-500 text-white rounded-lg text-xs font-semibold">Retry</button>
        </div>
      )}

      {/* Table */}
      <div className={`rounded-2xl border-2 overflow-hidden ${bdr}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className={dm ? 'bg-gray-800' : 'bg-gray-50'}>
                {['Order ID', 'User', 'Amount', 'Status', 'Items', 'Date'].map(h => (
                  <th key={h} className={`text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider ${tm}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${dm ? 'divide-gray-700' : 'divide-gray-100'}`}>
              {loading ? (
                <tr><td colSpan={6} className="py-16 text-center"><Loader className="w-8 h-8 text-orange-500 animate-spin mx-auto" /></td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className={`py-16 text-center text-sm ${tm}`}>No payments found</td></tr>
              ) : items.map(item => {
                const sc = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending;
                const StatusIcon = sc.icon;
                return (
                  <tr key={item.id} className={`transition-colors ${dm ? 'hover:bg-gray-700/40' : 'hover:bg-orange-50/40'}`}>
                    <td className="px-4 py-3">
                      <span className={`font-mono text-xs ${tm}`}>{item.orderId?.slice(-12) ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className={`font-semibold text-sm ${tp}`}>{item.user?.name ?? '—'}</p>
                      <p className={`text-xs ${tm}`}>{item.user?.email ?? '—'}</p>
                    </td>
                    <td className={`px-4 py-3 font-bold text-sm ${tp}`}>
                      ₹{item.amount?.toLocaleString('en-IN') ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${sc.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {item.status}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-xs ${tm}`}>{item.items?.length ?? 0} item(s)</td>
                    <td className={`px-4 py-3 text-xs ${tm}`}>{new Date(item.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className={`flex items-center justify-between px-4 py-3 border-t ${dm ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${page === 1 ? 'opacity-40 cursor-not-allowed' : dm ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'}`}>
              <ChevronLeft className="w-4 h-4" />Prev
            </button>
            <span className={`text-xs ${tm}`}>Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${page === totalPages ? 'opacity-40 cursor-not-allowed' : dm ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'}`}>
              Next<ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}