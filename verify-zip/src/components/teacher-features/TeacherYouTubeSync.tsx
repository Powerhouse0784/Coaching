'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Youtube, RefreshCw, CheckCircle, AlertCircle, Loader, ExternalLink,
  Wifi, ListVideo, Globe, Lock, Eye,
} from 'lucide-react';

interface PlaylistFolder {
  id: string;
  name: string;
  videoCount: number;
  isPublic: boolean;
}

interface PlaylistInfo {
  playlistId: string;
  title: string;
  description: string;
  thumbnail: string;
  itemCount: number;
  isUploads: boolean;
  folder: PlaylistFolder | null;
}

interface ChannelStatus {
  channelId: string;
  channelTitle: string;
  channelThumbnail: string;
  subscriberCount: string;
  videoCount: string;
  playlists: PlaylistInfo[];
}

interface SyncResultItem {
  playlistId: string;
  playlistTitle: string;
  folderId: string;
  folderName: string;
  total: number;
  created: number;
  updated: number;
  removed: number;
}

interface SyncResponse {
  success: boolean;
  synced?: number;
  results?: SyncResultItem[];
  error?: string;
}

export default function TeacherYouTubeSync({
  darkMode = false,
  onViewFolder,
}: {
  darkMode?: boolean;
  onViewFolder?: (folderId: string) => void;
}) {
  const dm = darkMode;
  const [status, setStatus] = useState<ChannelStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // 'all' while syncing every playlist, or a specific playlistId while syncing just that one
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [result, setResult] = useState<SyncResponse | null>(null);

  const card = dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const text = dm ? 'text-white' : 'text-gray-900';
  const sub  = dm ? 'text-gray-400' : 'text-gray-500';

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/teacher/youtube-channel-sync');
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || `Failed to load channel info (HTTP ${res.status})`);
        return;
      }
      const data: ChannelStatus = await res.json();
      setStatus(data);
      setError(null);
    } catch {
      setError('Failed to load channel info');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const runSync = async (playlistId?: string) => {
    setSyncingId(playlistId || 'all');
    setResult(null);
    try {
      const res = await fetch('/api/teacher/youtube-channel-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(playlistId ? { playlistId } : {}),
      });
      const data: SyncResponse = await res.json();
      setResult(data);
      if (data.success) await fetchStatus();
    } catch {
      setResult({ success: false, error: 'Network error. Try again.' });
    } finally {
      setSyncingId(null);
    }
  };

  if (loading) {
    return (
      <div className={`rounded-2xl border-2 p-8 flex items-center justify-center ${card}`}>
        <Loader className="w-5 h-5 animate-spin text-red-500 mr-3" />
        <span className={`font-medium text-sm ${sub}`}>Loading channel status…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-2xl border-2 p-6 space-y-3 ${card}`}>
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className={`font-semibold text-sm ${text}`}>Configuration Error</p>
            <p className={`text-xs mt-1 ${sub}`}>{error}</p>
            <p className={`text-xs mt-2 font-mono p-2 rounded-lg ${dm ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
              Check: YOUTUBE_CHANNEL_ID and YOUTUBE_API_KEY in .env
            </p>
          </div>
        </div>
      </div>
    );
  }

  const playlists = status?.playlists ?? [];

  return (
    <div className="space-y-4">
      {/* Channel header */}
      <div className={`rounded-2xl border-2 overflow-hidden ${card}`}>
        <div className={`p-4 sm:p-5 border-b-2 flex items-center justify-between gap-4 flex-wrap ${dm ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-gradient-to-r from-red-50 to-rose-50'}`}>
          <div className="flex items-center gap-3 min-w-0">
            {status?.channelThumbnail ? (
              <img src={status.channelThumbnail} alt="" className="w-11 h-11 rounded-xl object-cover flex-shrink-0 border-2 border-red-100" />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-red-500 shadow-lg flex items-center justify-center flex-shrink-0">
                <Youtube className="w-5 h-5 text-white" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`font-bold text-sm sm:text-base truncate ${text}`}>{status?.channelTitle ?? 'YouTube Channel'}</h3>
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${dm ? 'bg-green-900/40 text-green-400' : 'bg-green-50 text-green-700'}`}>
                  <Wifi className="w-2.5 h-2.5" /> Connected
                </span>
              </div>
              <p className={`text-xs ${sub}`}>
                {status?.videoCount} videos · {status?.subscriberCount} subscribers · {playlists.length} playlist{playlists.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>
          <button
            onClick={() => runSync()}
            disabled={syncingId !== null}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-red-500/20 flex-shrink-0"
          >
            {syncingId === 'all' ? <Loader className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {syncingId === 'all' ? 'Syncing all…' : 'Sync All Playlists'}
          </button>
        </div>
        {status?.channelId && (
          <div className="px-4 sm:px-5 py-2.5">
            <a
              href={`https://www.youtube.com/channel/${status.channelId}/playlists`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition w-fit"
            >
              <ExternalLink className="w-3 h-3" /> View channel playlists on YouTube
            </a>
          </div>
        )}
      </div>

      {/* Sync Result Banner */}
      {result && (
        <div className={`rounded-2xl border-2 p-4 ${
          result.success
            ? dm ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-200'
            : dm ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start gap-3">
            {result.success
              ? <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              : <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />}
            <div className="flex-1 min-w-0">
              {result.success ? (
                <>
                  <p className={`font-semibold text-sm ${dm ? 'text-green-300' : 'text-green-800'}`}>
                    Synced {result.synced} playlist{result.synced === 1 ? '' : 's'}
                  </p>
                  <div className="mt-2 space-y-1.5">
                    {result.results?.map(r => (
                      <div key={r.playlistId} className={`text-xs flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 ${dm ? 'bg-green-900/30' : 'bg-white'}`}>
                        <span className={`font-medium truncate ${dm ? 'text-green-300' : 'text-green-800'}`}>{r.playlistTitle}</span>
                        <span className={`flex-shrink-0 ${dm ? 'text-green-400' : 'text-green-600'}`}>
                          {r.total} total · {r.created} new · {r.updated} updated{r.removed > 0 ? ` · ${r.removed} removed` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className={`font-semibold text-sm ${dm ? 'text-red-300' : 'text-red-700'}`}>{result.error}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Playlists grid */}
      <div>
        <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${sub}`}>
          Channel Playlists ({playlists.length})
        </p>
        {playlists.length === 0 ? (
          <div className={`rounded-2xl border-2 border-dashed p-8 text-center ${dm ? 'border-gray-600' : 'border-gray-200'} ${card}`}>
            <ListVideo className="w-8 h-8 mx-auto mb-2 text-red-400" />
            <p className={`text-sm font-semibold ${text}`}>No playlists found</p>
            <p className={`text-xs mt-1 ${sub}`}>Make sure your channel has at least one public video.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {playlists.map(p => {
              const isSyncing = syncingId === p.playlistId;
              return (
                <div key={p.playlistId} className={`rounded-2xl border-2 overflow-hidden hover:shadow-lg transition-all ${card}`}>
                  <div className="h-28 relative">
                    {p.thumbnail ? (
                      <img src={p.thumbnail} alt={p.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-red-500 via-rose-500 to-pink-600 flex items-center justify-center">
                        <ListVideo className="w-10 h-10 text-white opacity-70" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-2">
                      {p.isUploads ? (
                        <span className="px-2 py-0.5 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center gap-1">
                          <Youtube className="w-2.5 h-2.5" /> All Uploads
                        </span>
                      ) : <span />}
                      <span className="px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded-full text-white text-[10px] font-semibold">
                        {p.itemCount} videos
                      </span>
                    </div>
                  </div>
                  <div className="p-3 sm:p-4">
                    <h4 className={`font-bold text-sm line-clamp-1 mb-1.5 ${text}`}>{p.title}</h4>
                    {p.folder ? (
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-green-500 font-semibold">
                          <CheckCircle className="w-3.5 h-3.5" /> {p.folder.videoCount} synced
                        </span>
                        {p.folder.isPublic
                          ? <span className="flex items-center gap-0.5 text-[10px] font-semibold text-green-500"><Globe className="w-3 h-3" />Public</span>
                          : <span className="flex items-center gap-0.5 text-[10px] font-semibold text-orange-500"><Lock className="w-3 h-3" />Private</span>}
                      </div>
                    ) : (
                      <p className={`text-xs mb-3 ${sub}`}>Not synced yet</p>
                    )}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => runSync(p.playlistId)}
                        disabled={syncingId !== null}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-60 ${
                          p.folder
                            ? dm ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-red-500 text-white hover:bg-red-600'
                        }`}
                      >
                        {isSyncing ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                        {isSyncing ? 'Syncing…' : p.folder ? 'Re-sync' : 'Sync'}
                      </button>
                      {p.folder && onViewFolder && (
                        <button
                          onClick={() => onViewFolder(p.folder!.id)}
                          className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 bg-gradient-to-r from-red-500 to-rose-500 text-white hover:shadow-lg transition"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* How it works */}
      <div className={`rounded-2xl border-2 p-4 sm:p-5 ${card}`}>
        <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${sub}`}>How it works</p>
        <div className="space-y-2.5">
          {[
            ['1', 'Every public playlist on your channel shows up here automatically, plus an "All Uploads" entry covering every video you\'ve published'],
            ['2', 'Click "Sync" on any playlist to create (or refresh) its own folder with all current videos'],
            ['3', '"Sync All Playlists" refreshes every playlist in one go'],
            ['4', 'Each synced playlist becomes its own folder — students see it in their Video Library and can watch, track progress, bookmark, and resume'],
          ].map(([n, t]) => (
            <div key={n} className="flex items-start gap-3">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 ${dm ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-600'}`}>{n}</span>
              <p className={`text-xs leading-relaxed ${sub}`}>{t}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}