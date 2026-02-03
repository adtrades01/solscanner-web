import React, { useState, useEffect, useMemo, useRef, memo } from 'react';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';
import {
  Search,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  ShieldAlert,
  Shield,
  Heart,
  Folder,
  Plus,
  Trash2,
  ExternalLink,
  Menu,
  X,
  Filter,
  Activity,
  Zap,
  LayoutGrid,
  Maximize2,
  Clock,
  DollarSign,
  BarChart2,
  RefreshCw,
  SearchCode,
  ArrowRight,
  PlusCircle,
  Sparkles,
  Copy,
  Check,
  BrainCircuit,
  Rocket,
  Users,
  Globe,
  Flame,
  Twitter,
  Search as SearchIcon,
  Map,
  Crosshair,
  Database,
  PieChart,
  Bell,
  Siren,
  AlertTriangle,
  Trophy,
  Calendar
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch
} from 'firebase/firestore';

// -----------------------------------------------------------------------------
// Environment variable definitions
// Instead of relying on undefined globals, use Vite's import.meta.env object.
// These values should be defined in your Vercel project settings.
// -----------------------------------------------------------------------------

// Construct the Firebase config object from Vite env variables.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Provide an application identifier (if not provided, falls back to default)
const appId = import.meta.env.VITE_APP_ID || 'default-app-id';

// Authentication token for custom auth. Optional.
const initialAuthToken = import.meta.env.VITE_INITIAL_AUTH_TOKEN || '';

// --- FIREBASE SETUP ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- CONSTANTS ---
const DEXSCREENER_BOOSTS_API = 'https://api.dexscreener.com/token-boosts/latest/v1';
const DEXSCREENER_TOKENS_API = 'https://api.dexscreener.com/latest/dex/tokens/';

// DEFAULT BLUECHIPS
const DEFAULT_BLUECHIPS = [
  { symbol: 'TROLL', ca: '5UUH9RTDiSpq6HKS6bp4NdU9PNJpXRXuiw6ShBTBhgH2' },
  { symbol: 'USELESS', ca: 'Dz9mQ9NzkBcCsuGPFJ3r1bS4wgqKMHBPiVuniW8Mbonk' },
  { symbol: '67', ca: '9AvytnUKsLxPxFHFqS6VLxaxt5p6BhYNr53SD2Chpump' }
];

// --- UTILITY FUNCTIONS ---

const copyToClipboard = (text) => {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-9999px';
  textArea.style.top = '0';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
  } catch (err) {
    console.error('Fallback copy failed', err);
  }
  document.body.removeChild(textArea);
};

const calculateSafetyScore = (pair) => {
  let score = 100;
  const reasons = [];

  const liquidity = pair.liquidity?.usd || 0;
  const volume24 = pair.volume?.h24 || 0;
  const fdv = pair.fdv || 0;

  if (liquidity < 5000) {
    score -= 50;
    reasons.push('Critical Liquidity Risk (<$5k)');
  } else if (liquidity < 25000) {
    score -= 20;
    reasons.push('Low Liquidity (<$25k)');
  }

  if (liquidity > 100000 && volume24 < liquidity * 0.05) {
    score -= 60;
    reasons.push('Frozen Market / Honeypot Risk (High Liq, Zero Vol)');
  }

  if (fdv > liquidity * 200) {
    score -= 40;
    reasons.push('Fake/Inflated Market Cap');
  }

  if (pair.priceChange?.h24 > 10000 && volume24 < 50000) {
    score -= 50;
    reasons.push('Artificial Pump (No Volume Support)');
  }

  if (!pair.info?.socials || pair.info.socials.length === 0) {
    score -= 20;
    reasons.push('No Social Links');
  }

  return { score: Math.max(0, score), reasons };
};

const analyzeNarrative = (name = '', description = '') => {
  const text = (name + ' ' + description).toLowerCase();
  if (text.includes('ai') || text.includes('gpt') || text.includes('agent') || text.includes('neural'))
    return 'AI Agent';
  if (text.includes('cat') || text.includes('neko') || text.includes('kitty')) return 'Cat Meta';
  if (text.includes('dog') || text.includes('inu') || text.includes('pup') || text.includes('shiba')) return 'Dog Meta';
  if (text.includes('pepe') || text.includes('frog')) return 'Frog Meta';
  if (text.includes('trump') || text.includes('maga')) return 'PolitiFi';
  return 'Meme';
};

const generateAIThesis = (pair) => {
  const liquidity = pair.liquidity?.usd || 0;
  const volume24 = pair.volume?.h24 || 0;
  const fdv = pair.fdv || 0;
  const socials = pair.info?.socials || [];
  const symbol = pair.baseToken.symbol;
  const description = pair.info?.header || pair.info?.description || 'No official description found.';
  const sector = analyzeNarrative(pair.baseToken.name, description);

  let thesis = '';
  let sentiment = 'Neutral';
  let color = 'text-gray-400';

  let narrativeContext = '';
  const fullDesc = description || '';
  if (fullDesc) {
    // Regex to remove URLs for cleaner text
    const cleanDesc = fullDesc.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '');
    if (cleanDesc.length > 150) narrativeContext = `"${cleanDesc.substring(0, 140)}..."`;
    else narrativeContext = `"${cleanDesc}"`;
  } else {
    narrativeContext = 'No official lore found.';
  }

  if (liquidity > 100000 && volume24 < liquidity * 0.05) {
    sentiment = 'POTENTIAL HONEYPOT';
    color = 'text-red-500 animate-pulse';
    thesis = `CRITICAL WARNING: ${symbol} has high liquidity ($${formatNumber(liquidity)}) but almost NO trading volume. This often indicates a 'Honeypot' where users cannot sell.`;
  } else if (fdv > 10000000 && volume24 < 50000) {
    sentiment = 'FAKE VALUATION';
    color = 'text-red-500';
    thesis = `The $${formatNumber(fdv)} Market Cap is likely manipulated. Real volume is non-existent.`;
  } else if (socials.length > 2 && liquidity > 50000) {
    if (volume24 > liquidity * 2) {
      sentiment = `High Velocity ${sector}`;
      color = 'text-purple-400';
      thesis = `${symbol} is dominating the ${sector} sector right now. Volume turnover is massive ($${formatNumber(volume24)}), indicating a potential breakout.`;
    } else {
      sentiment = `Established ${sector}`;
      color = 'text-blue-400';
      thesis = `${symbol} has solidified its place in the ${sector} narrative. The deep liquidity moat suggests holders are sticky.`;
    }
  } else {
    sentiment = `Early ${sector}`;
    color = 'text-yellow-400';
    thesis = `${symbol} is a speculative play in the ${sector} sector. Needs a viral catalyst.`;
  }

  return { thesis, sentiment, color, sector, narrativeContext };
};

const formatCurrency = (val) => {
  if (val === null || val === undefined || typeof val === 'object') return '$0.00';
  if (val < 0.0001) return `$${val.toExponential(2)}`;
  if (val < 1) return `$${val.toFixed(4)}`;
  if (val > 1000000000) return `$${(val / 1000000000).toFixed(2)}B`;
  if (val > 1000000) return `$${(val / 1000000).toFixed(2)}M`;
  if (val > 1000) return `$${(val / 1000).toFixed(2)}K`;
  return `$${val.toFixed(2)}`;
};

const formatNumber = (num) => {
  if (!num || typeof num === 'object') return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

// --- COMPONENTS ---

// Alert Toast
const AlertToast = ({ token, onClose, onClick }) => {
  if (!token) return null;
  return (
    <div
      onClick={() => onClick(token)}
      className="fixed bottom-20 right-4 md:right-6 z-50 animate-in slide-in-from-right duration-300 cursor-pointer group"
    >
      <div className="glass-card border border-emerald-400/40 p-4 rounded-2xl max-w-sm flex items-start gap-4 transition-transform group-hover:scale-[1.02]">
        <div className="p-2 bg-green-500/20 rounded-full text-green-400 shrink-0">
          <Bell className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-white mb-1">New Gem Detected!</h4>
          <p className="text-xs text-gray-300 mb-2">
            <span className="font-bold text-green-400">{token.baseToken.symbol}</span> matches your AI safety criteria.
          </p>
          <div className="text-[10px] font-mono text-gray-500">MCap: {formatCurrency(token.fdv)}</div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Major Crypto Card (Strictly Text Only)
const MajorCryptoCard = ({ symbol, price, name, theme = 'dark', onClick }) => {
  const containerRef = useRef();

  // Chart Widget
  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';
    const script = document.createElement('script');
    script.src =
      'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol: `BINANCE:${symbol}`,
      width: '100%',
      height: '100%',
      locale: 'en',
      dateRange: '1D',
      colorTheme: theme,
      isTransparent: true,
      autosize: true,
      largeChartUrl: '',
      chartOnly: true,
      noTimeScale: true
    });
    containerRef.current.appendChild(script);
  }, [symbol, theme]);

  return (
    <div
      className="relative w-full glass-card rounded-xl overflow-hidden group cursor-pointer mb-2 transition-all h-16 flex items-center hover:-translate-y-0.5 hover:shadow-xl"
      onClick={() => onClick(`BINANCE:${symbol}`)}
    >
      <div className="absolute inset-0 z-10 bg-transparent" />

      <div className="px-4 relative z-20 pointer-events-none flex justify-between items-center w-full">
        <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-[0.2em]">
          {name}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-emerald-300 uppercase tracking-[0.2em]">
            Live
          </span>
          <div className="text-sm font-mono font-semibold text-white tracking-tight">
            {typeof price === 'number'
              ? `$${price.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}`
              : '...'}
          </div>
        </div>
      </div>

      <div className="absolute right-0 bottom-0 w-1/2 h-full opacity-30 group-hover:opacity-50 transition-opacity pointer-events-none">
        <div
          ref={containerRef}
          className="tradingview-widget-container h-full w-full transform scale-125 origin-center"
        ></div>
      </div>
    </div>
  );
};

const LiveSolanaChart = ({ symbol = 'SOLUSDT', theme = 'dark' }) => {
  const containerRef = useRef();

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';
    const script = document.createElement('script');
    script.src =
      'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: `BINANCE:${symbol}`,
      interval: '15',
      timezone: 'Etc/UTC',
      theme: theme,
      style: '1',
      locale: 'en',
      enable_publishing: false,
      allow_symbol_change: false,
      support_host: 'https://www.tradingview.com'
    });
    containerRef.current.appendChild(script);
  }, [symbol, theme]);

  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-white/10 h-48">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

// FULL CHART MODAL
const TradingViewModal = ({ symbol, onClose }) => {
  const containerRef = useRef();

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';
    const script = document.createElement('script');
    script.src =
      'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbol,
      interval: '15',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      enable_publishing: false,
      allow_symbol_change: true,
      support_host: 'https://www.tradingview.com'
    });
    containerRef.current.appendChild(script);
  }, [symbol]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full h-full max-w-7xl max-h-[90vh] bg-[#0f0f0f] border border-gray-800 rounded-xl overflow-hidden relative flex flex-col">
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={onClose}
            className="p-2 bg-black/50 hover:bg-gray-800 rounded-full text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div ref={containerRef} className="w-full h-full" />
      </div>
    </div>
  );
};

// TOP TICKER
const TopTicker = ({ items, onItemClick }) => {
  if (!items.length) return null;
  const loopedItems = [...items, ...items, ...items];
  return (
    <div className="fixed top-0 left-0 right-0 h-9 glass-panel border-b border-white/10 z-50 flex items-center overflow-hidden">
      <div className="flex animate-ticker whitespace-nowrap hover:pause">
        {loopedItems.map((item, i) => (
          <div
            key={`${item.pairAddress}-${i}`}
            className="flex-shrink-0 flex items-center px-6 text-[11px] font-mono border-r border-white/5 cursor-pointer hover:bg-white/10 transition-colors whitespace-nowrap"
            onClick={() => onItemClick(item)}
          >
            <span className="font-bold text-emerald-300 mr-2">
              {item.baseToken.symbol}
            </span>
            <span className="text-slate-300 mr-2">
              MCap: {formatCurrency(item.fdv || item.marketCap)}
            </span>
            <span className={item.priceChange?.h24 >= 0 ? 'text-green-500' : 'text-red-500'}>
              {item.priceChange?.h24}%
            </span>
          </div>
        ))}
      </div>
      <style>{`
        .animate-ticker { animation: ticker 60s linear infinite; }
        .hover\\:pause:hover { animation-play-state: paused; }
        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-33.33%); } }
      `}</style>
    </div>
  );
};

// TOKEN CARD
const TokenCard = memo(
  ({
    pair,
    onLike,
    isLiked,
    folders,
    onAddToFolder,
    onClick,
    isCustom,
    onDelete,
    entryPrice,
    ath
  }) => {
    const { score, reasons } = useMemo(() => calculateSafetyScore(pair), [pair]);
    const [showFolderMenu, setShowFolderMenu] = useState(false);
    const [copied, setCopied] = useState(false);

    let SafetyIcon = ShieldCheck;
    let safetyColor = 'text-green-400';
    let borderColor = 'border-green-500/20';

    if (score < 50) {
      SafetyIcon = ShieldAlert;
      safetyColor = 'text-red-500';
      borderColor = 'border-red-500/30';
    } else if (score < 80) {
      SafetyIcon = Shield;
      safetyColor = 'text-yellow-400';
      borderColor = 'border-yellow-500/30';
    }

    const handleCopyCA = (e) => {
      e.stopPropagation();
      if (pair.baseToken?.address) {
        copyToClipboard(pair.baseToken.address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    };

    // Safe parsing of numbers to prevent 'Object' errors
    const currentPrice = parseFloat(pair.priceUsd) || 0;
    const safeEntryPrice = parseFloat(entryPrice) || 0;
    const safeAth = parseFloat(ath) || 0;

    const sinceEntryPct = safeEntryPrice > 0 ? ((currentPrice - safeEntryPrice) / safeEntryPrice) * 100 : 0;
    const downFromAth = safeAth > 0 ? ((currentPrice - safeAth) / safeAth) * 100 : 0;

    const athValue = safeAth > 0 ? safeAth * (parseFloat(pair.fdv) / currentPrice) : 0;

    return (
      <div
        className={`glass-card border ${borderColor} rounded-2xl p-5 transition-all group relative overflow-hidden flex flex-col justify-between h-full hover:-translate-y-1 hover:shadow-2xl`}
        onClick={() => onClick(pair)}
      >

        <div className="relative z-10 pointer-events-none">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-slate-900/70 flex-shrink-0 flex items-center justify-center overflow-hidden border border-white/10">
                {pair.info?.imageUrl ? (
                  <img
                    src={pair.info.imageUrl}
                    alt={pair.baseToken.symbol}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-xs font-bold text-slate-500">
                    {pair.baseToken.symbol[0]}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white leading-none truncate">
                    {pair.baseToken.name}
                  </h3>
                  <button
                    onClick={handleCopyCA}
                    className="pointer-events-auto p-1.5 glass-chip rounded-lg text-slate-400 hover:text-white transition-colors flex-shrink-0"
                    title="Copy CA"
                  >
                    {copied ? (
                      <Check className="w-3 h-3 text-green-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
                <span className="text-xs font-mono text-slate-400 truncate block">
                  {pair.baseToken.symbol}
                </span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-sm font-semibold font-mono text-white flex items-center justify-end gap-1 whitespace-nowrap">
                <span className="text-slate-500 text-[10px] uppercase">MCap</span>
                {formatCurrency(pair.fdv || pair.marketCap)}
              </div>

            {safeEntryPrice > 0 ? (
                <div className="flex flex-col items-end">
                  <div className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                    Call MCap:{' '}
                    <span className="text-white">
                      {formatCurrency(
                        (parseFloat(pair.fdv || pair.marketCap) || 0) *
                          (safeEntryPrice / (currentPrice || 1))
                      )}
                    </span>
                    <span
                      className={`ml-2 font-bold ${
                        sinceEntryPct >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {sinceEntryPct > 0 ? '+' : ''}
                      {sinceEntryPct.toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono whitespace-nowrap">
                    ATH: {formatCurrency(athValue)}{' '}
                    <span
                      className={
                        downFromAth < -20 ? 'text-red-400' : 'text-slate-500'
                      }
                    >
                      ({downFromAth.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  className={`text-xs font-mono ${
                    pair.priceChange?.h24 >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {pair.priceChange?.h24}% (24h)
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 mb-4">
            <div className="glass-chip rounded-xl p-2.5 flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase">Liquidity</span>
              <span className="text-slate-100 font-mono">
                {formatNumber(pair.liquidity?.usd)}
              </span>
            </div>
            <div className="glass-chip rounded-xl p-2.5 flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase">Vol (24h)</span>
              <span className="text-slate-100 font-mono">
                {formatNumber(pair.volume?.h24)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-white/10 relative z-20 pointer-events-auto">
          <div className="group/tooltip relative">
            <div
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg glass-chip ${safetyColor} cursor-help`}
            >
              <SafetyIcon className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">{score}</span>
            </div>
            <div className="absolute bottom-full left-0 mb-2 w-52 glass-panel rounded-xl p-3 shadow-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50">
              <h4 className="text-xs font-semibold text-white mb-1 border-b border-white/10 pb-1">
                Safety Scan
              </h4>
              {reasons.length > 0 ? (
                <ul className="space-y-1">
                  {reasons.map((r, i) => (
                    <li
                      key={i}
                      className="text-[10px] text-red-400 flex items-start gap-1"
                    >
                      <span className="mt-0.5">•</span>
                      {r}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-[10px] text-green-400">All checks passed.</div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            {isCustom && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(pair.pairAddress);
                }}
                className="p-1.5 rounded-lg glass-chip text-slate-400 hover:text-red-400 transition-colors"
                title="Remove"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFolderMenu(!showFolderMenu);
                }}
                className="p-1.5 rounded-lg glass-chip text-slate-400 hover:text-white transition-colors"
              >
                <Folder className="w-4 h-4" />
              </button>
              {showFolderMenu && (
                <div className="absolute bottom-full right-0 mb-2 w-44 glass-panel rounded-xl shadow-xl overflow-hidden z-40">
                  <div className="px-3 py-2 text-xs font-semibold text-slate-400 border-b border-white/10">
                    Add to Folder
                  </div>
                  {folders.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-slate-500 italic">
                      No folders created
                    </div>
                  ) : (
                    folders.map((folder) => (
                      <button
                        key={folder.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToFolder(pair, folder.id);
                          setShowFolderMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors"
                      >
                        {folder.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onLike(pair);
              }}
              className={`p-1.5 rounded-lg glass-chip transition-colors ${
                isLiked ? 'text-rose-300' : 'text-slate-400 hover:text-rose-300'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    );
  }
);

// 5. DETAIL MODAL
const TokenDetailModal = ({ pair, entryData, onClose, onReportRug }) => {
  const [livePair, setLivePair] = useState(pair);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await fetch(`${DEXSCREENER_TOKENS_API}${pair.baseToken.address}`);
        const data = await res.json();
        if (data.pairs) {
          const updated = data.pairs.find((p) => p.pairAddress === pair.pairAddress);
          if (updated) setLivePair(updated);
        }
      } catch (e) {
        console.error('Live update fail', e);
      }
    };
    const interval = setInterval(fetchLatest, 10000);
    return () => clearInterval(interval);
  }, [pair]);

  const handleCopyCA = () => {
    if (livePair.baseToken?.address) {
      copyToClipboard(livePair.baseToken.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!livePair) return null;
  const { score, reasons } = calculateSafetyScore(livePair);
  const { thesis, sentiment, color, sector, narrativeContext } = generateAIThesis(livePair);

  const txns = livePair.txns?.h1 || { buys: 0, sells: 0 };
  const totalTxns = txns.buys + txns.sells;
  const buyPressure = totalTxns > 0 ? (txns.buys / totalTxns) * 100 : 50;

  // Entry Calculations
  let entryMcap = null;
  let totalGain = null;
  let ath = null;

  if (entryData) {
    const currentPrice = parseFloat(livePair.priceUsd) || 0;
    const entryPrice = parseFloat(entryData.entryPrice) || 0;
    if (currentPrice && entryPrice) {
      const ratio = entryPrice / currentPrice;
      entryMcap = (parseFloat(livePair.fdv) || 0) * ratio;
      totalGain = ((currentPrice - entryPrice) / entryPrice) * 100;
      ath = parseFloat(entryData.ath) || currentPrice;
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="glass-panel border border-white/10 w-full max-w-6xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 relative">
        <div className="bg-white/5 border-b border-white/10 p-5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-900/70 border border-white/10 overflow-hidden">
              {livePair.info?.imageUrl && (
                <img
                  src={livePair.info.imageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-white">
                  {livePair.baseToken.name}
                </h2>
                <button
                  onClick={handleCopyCA}
                  className="flex items-center gap-1 text-xs glass-chip px-2 py-1 rounded-lg transition-colors text-slate-300 hover:text-white"
                >
                  {copied ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  {copied ? 'Copied' : 'Copy CA'}
                </button>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
                <span className="font-mono text-xs">
                  {livePair.baseToken.address}
                </span>
                <span className="flex items-center gap-1 text-emerald-400 animate-pulse text-xs">
                  <Clock className="w-3 h-3" /> Live
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <div className="text-2xl font-semibold font-mono text-white flex items-center gap-2 justify-end">
                <span className="text-xs text-slate-500 uppercase font-sans">
                  Market Cap
                </span>
                {formatCurrency(livePair.fdv)}
              </div>
              {entryMcap && totalGain !== null && (
                <div className="text-[11px] text-slate-400 font-mono mt-1">
                  Call MCap:{' '}
                  <span className="text-white">{formatCurrency(entryMcap)}</span>
                  <span
                    className={`ml-2 font-semibold ${
                      totalGain >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {totalGain > 0 ? '+' : ''}
                    {totalGain.toFixed(2)}%
                  </span>
                </div>
              )}
              <div
                className={`text-sm font-mono ${
                  livePair.priceChange?.h24 >= 0 ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {livePair.priceChange?.h24}% (24h)
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 glass-chip rounded-full text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          <div className="flex-1 bg-slate-950/70 relative h-[35vh] md:h-auto md:flex-1 shrink-0 border-b md:border-b-0 md:border-r border-white/10">
            <iframe
              src={`https://dexscreener.com/solana/${livePair.pairAddress}?embed=1&theme=dark&trades=0&info=0`}
              className="absolute inset-0 w-full h-full border-0"
              title="DexScreener Chart"
            />
          </div>

          <div className="flex-1 w-full md:w-96 bg-transparent overflow-y-auto p-6 space-y-6">
            {/* REPORT RUG */}
            <button
              onClick={() => {
                onReportRug(livePair.pairAddress);
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 glass-chip border border-red-500/30 text-red-300 hover:bg-red-500/10 hover:text-red-200 p-3 rounded-2xl transition-colors font-semibold text-xs"
            >
              <AlertTriangle className="w-4 h-4" /> REPORT RUG / BAD CALL (Train AI)
            </button>

            {/* ENTRY STATS */}
            {entryMcap && (
              <div className="glass-card border border-sky-400/30 p-4 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-sky-300 text-xs font-semibold uppercase tracking-wider">
                  <Rocket className="w-4 h-4" /> Discovery Stats
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-[10px] text-slate-500">Detected At MCap</div>
                    <div className="text-lg font-mono text-white font-semibold">
                      {formatCurrency(entryMcap)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500">Total Gain</div>
                    <div
                      className={`text-xl font-mono font-semibold ${
                        totalGain >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {totalGain > 0 ? '+' : ''}
                      {totalGain.toFixed(2)}%
                    </div>
                  </div>
                </div>
                {ath && (
                  <div className="text-[10px] text-slate-400 text-right pt-2 border-t border-sky-400/20 mt-2">
                    ATH Since Discovery: <span className="text-white font-semibold font-mono">
                      {formatCurrency(
                        ath * (parseFloat(livePair.fdv) / parseFloat(livePair.priceUsd))
                      )}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* AI THESIS SECTION */}
            <div className="glass-card border border-violet-400/20 p-4 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-violet-300" />
                  <span className="text-sm font-semibold text-white">Narrative Scan</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 glass-chip text-violet-200 rounded-full">
                  {sector}
                </span>
              </div>
              <div className={`text-lg font-semibold mb-2 ${color}`}>{sentiment}</div>
              <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                {thesis}
              </p>
              <div className="mt-2 p-2 glass-chip rounded text-[10px] text-slate-400 italic border-l-2 border-white/10">
                "{narrativeContext}"
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-[0.3em] border-b border-white/10 pb-2">
                Due Diligence
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Buys: {txns.buys}</span>
                  <span>Sells: {txns.sells}</span>
                </div>
                <div className="h-2 bg-red-500/20 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-emerald-400"
                    style={{ width: `${buyPressure}%` }}
                  ></div>
                </div>
                <div className="text-center text-[10px] text-slate-500">
                  {buyPressure.toFixed(0)}% Buy Pressure (1h)
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`https://app.bubblemaps.io/sol/token/${livePair.baseToken.address}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 p-3 glass-chip hover:border-sky-400/40 rounded-xl transition-all group"
                >
                  <Map className="w-4 h-4 text-sky-300 group-hover:text-sky-200" />
                  <span className="text-xs text-slate-300 group-hover:text-white">
                    Bubblemap
                  </span>
                </a>

                <a
                  href={`https://solscan.io/token/${livePair.baseToken.address}#holders`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 p-3 glass-chip hover:border-violet-400/40 rounded-xl transition-all group"
                >
                  <Database className="w-4 h-4 text-violet-300 group-hover:text-violet-200" />
                  <span className="text-xs text-slate-300 group-hover:text-white">
                    Holders List
                  </span>
                </a>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Safety Score
                </span>
                <span
                  className={`text-lg font-semibold ${
                    score > 80 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {score}/100
                </span>
              </div>
              {reasons.length > 0 ? (
                <ul className="space-y-2 mb-4">
                  {reasons.map((r, i) => (
                    <li
                      key={i}
                      className="text-xs text-red-300 flex items-start gap-2 bg-red-500/10 p-2 rounded-xl"
                    >
                      <ShieldAlert className="w-3 h-3 shrink-0 mt-0.5" /> {r}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-emerald-300 bg-emerald-500/10 p-2 rounded-xl mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-3 h-3" /> No flags.
                </div>
              )}
              <a
                href={`https://rugcheck.xyz/tokens/${livePair.baseToken.address}`}
                target="_blank"
                rel="noreferrer"
                className="block w-full text-center py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                Detailed Rug Report
              </a>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
              {livePair.info?.websites?.map((w, i) => (
                <a
                  key={i}
                  href={w.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 glass-chip hover:bg-white/10 py-2 rounded-xl text-xs text-slate-300 transition-colors"
                >
                  <Globe className="w-3 h-3" /> Website
                </a>
              ))}
              {livePair.info?.socials?.map((s, i) => (
                <a
                  key={i}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 glass-chip hover:bg-white/10 py-2 rounded-xl text-xs text-slate-300 transition-colors capitalize"
                >
                  <Users className="w-3 h-3" /> {s.type}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APPLICATION ---

export default function SolScanner() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('ai_picks');
  const [scannerData, setScannerData] = useState([]);
  const [aiPicks, setAiPicks] = useState([]);
  const [trendingData, setTrendingData] = useState([]);
  const [bluechipData, setBluechipData] = useState([]);
  const [likedCoins, setLikedCoins] = useState([]);
  const [folders, setFolders] = useState([]);
  const [folderItems, setFolderItems] = useState([]);
  const [customBluechips, setCustomBluechips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedPair, setSelectedPair] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [caInput, setCaInput] = useState('');
  const [bluechipInput, setBluechipInput] = useState('');
  const [isAddingBluechip, setIsAddingBluechip] = useState(false);
  const [expandedChartSymbol, setExpandedChartSymbol] = useState(null);
  const [majorPrices, setMajorPrices] = useState({ bitcoin: {}, ethereum: {}, solana: {} });
  const [savedEntryStats, setSavedEntryStats] = useState({});
  const [newAlert, setNewAlert] = useState(null);
  const [volumeSpikes, setVolumeSpikes] = useState([]);
  const [blacklist, setBlacklist] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [topCalls, setTopCalls] = useState({ day: [], week: [], month: [] });
  const [cryptoOpen, setCryptoOpen] = useState(false);
  const [volumeOpen, setVolumeOpen] = useState(false);

  const alertHistoryRef = useRef({});
  const previousVolumeCountRef = useRef(0);

  const playAlertSound = () => {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gainNode.gain.value = 0.1;
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.15);
    oscillator.onended = () => audioContext.close();
  };

  // Sync persistent stats to ref for logic check
  useEffect(() => {
    alertHistoryRef.current = { ...savedEntryStats };
  }, [savedEntryStats]);

  useEffect(() => {
    if (newAlert) playAlertSound();
  }, [newAlert]);

  useEffect(() => {
    if (volumeSpikes.length > previousVolumeCountRef.current) {
      playAlertSound();
    }
    previousVolumeCountRef.current = volumeSpikes.length;
  }, [volumeSpikes]);

  // Auth
  useEffect(() => {
    const initAuth = async () => {
      if (initialAuthToken) {
        await signInWithCustomToken(auth, initialAuthToken);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // User Data
  useEffect(() => {
    if (!user) return;

    // PUBLIC DATA (Universal Feed)
    const unsubPublic = onSnapshot(
      collection(db, 'artifacts', appId, 'public', 'data', 'discovered_coins'),
      (snap) => {
        const publicCoins = snap.docs.map((d) => d.data());
        // Calculate Top Gainers
        const sorted = publicCoins
          .sort((a, b) => {
            const gainA = (a.currentPrice - a.entryPrice) / a.entryPrice;
            const gainB = (b.currentPrice - b.entryPrice) / b.entryPrice;
            return gainB - gainA;
          })
          .slice(0, 5);
        setTopCalls((prev) => ({ ...prev, day: sorted }));
      }
    );

    const unsubFolders = onSnapshot(
      collection(db, 'artifacts', appId, 'users', user.uid, 'folders'),
      (snap) => {
        setFolders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }
    );
    const unsubLiked = onSnapshot(
      collection(db, 'artifacts', appId, 'users', user.uid, 'liked_coins'),
      (snap) => {
        setLikedCoins(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }
    );
    const unsubBluechips = onSnapshot(
      collection(db, 'artifacts', appId, 'users', user.uid, 'custom_bluechips'),
      (snap) => {
        setCustomBluechips(snap.docs.map((d) => d.data()));
      }
    );
    // Still need user entry stats for personal P/L tracking on cards
    const unsubStats = onSnapshot(
      collection(db, 'artifacts', appId, 'users', user.uid, 'entry_stats'),
      (snap) => {
        const stats = {};
        snap.docs.forEach((d) => (stats[d.id] = d.data()));
        setSavedEntryStats(stats);
      }
    );
    const unsubBlacklist = onSnapshot(
      collection(db, 'artifacts', appId, 'users', user.uid, 'blacklist'),
      (snap) => {
        setBlacklist(snap.docs.map((d) => d.id));
      }
    );

    const q = query(
      collection(db, 'artifacts', appId, 'users', user.uid, 'folder_items')
    );
    const unsubFolderItems = onSnapshot(q, (snap) => {
      setFolderItems(snap.docs.map((d) => d.data()));
    });

    return () => {
      unsubFolders();
      unsubLiked();
      unsubBluechips();
      unsubStats();
      unsubFolderItems();
      unsubBlacklist();
      unsubPublic();
    };
  }, [user]);

  // WEBSOCKET PRICES (Binance)
  useEffect(() => {
    const ws = new WebSocket(
      'wss://stream.binance.com:9443/stream?streams=btcusdt@miniTicker/ethusdt@miniTicker/solusdt@miniTicker'
    );
    ws.onmessage = (event) => {
      const json = JSON.parse(event.data);
      const ticker = json.data;
      const symbolMap = {
        BTCUSDT: 'bitcoin',
        ETHUSDT: 'ethereum',
        SOLUSDT: 'solana'
      };
      const key = symbolMap[ticker.s];
      if (key) {
        setMajorPrices((prev) => ({
          ...prev,
          [key]: { usd: parseFloat(ticker.c) }
        }));
      }
    };
    return () => ws.close();
  }, []);

  // Main Fetch
  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    // Don't set global loading on manual refresh to avoid flicker
    if (!isManual && loading) setLoading(true);

    try {
      // 1. FETCH BLUECHIPS
      const allBluechips = [...DEFAULT_BLUECHIPS, ...customBluechips];
      const uniqueCAs = [...new Set(allBluechips.map((b) => b.ca))];
      const bluechipPromises = uniqueCAs.map(async (ca) => {
        try {
          const res = await fetch(`${DEXSCREENER_TOKENS_API}${ca}`);
          const data = await res.json();
          if (data.pairs && data.pairs.length > 0) {
            // FIX: Add optional chaining and default values for sort
            const bestPair = data.pairs.sort(
              (a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
            )[0];
            return bestPair;
          }
        } catch (e) {
          console.error('Bluechip fetch err', e);
        }
        return null;
      });
      const bluechipResults = (await Promise.all(bluechipPromises)).filter(Boolean);
      setBluechipData(bluechipResults);

      // 2. FETCH SCANNER
      const boostRes = await fetch(DEXSCREENER_BOOSTS_API);
      const boostData = await boostRes.json();
      let rawPairs = [];
      if (Array.isArray(boostData)) {
        const solBoosts = boostData
          .filter((b) => b.chainId === 'solana')
          .slice(0, 40);
        const addresses = solBoosts.map((b) => b.tokenAddress).join(',');
        if (addresses) {
          const pairRes = await fetch(`${DEXSCREENER_TOKENS_API}${addresses}`);
          const pairData = await pairRes.json();
          if (pairData.pairs) {
            const uniqueTokens = {};
            pairData.pairs.forEach((p) => {
              // Dedupe & Blacklist Filter
              if (blacklist.includes(p.pairAddress)) return;

              if (
                !uniqueTokens[p.baseToken.address] ||
                (p.liquidity?.usd >
                  uniqueTokens[p.baseToken.address].liquidity?.usd)
              ) {
                uniqueTokens[p.baseToken.address] = p;
              }
            });
            rawPairs = Object.values(uniqueTokens);
          }
        }
      }

      // SPIKE DETECTION
      const spikes = rawPairs
        .filter((p) => {
          if (!p.volume || !p.volume.h1) return false;
          // Spike = 5m volume is > 10% of 1h volume (sudden burst)
          return (p.volume.m5 || 0) > p.volume.h1 * 0.1;
        })
        .slice(0, 5);
      setVolumeSpikes(spikes);

      const trending = rawPairs
        .filter((p) => {
          if (!p.liquidity || p.liquidity.usd < 5000) return false;
          if (!p.volume || p.volume.h24 < 10000) return false;
          if (p.liquidity.usd > 100000 && p.volume.h24 < p.liquidity.usd * 0.02)
            return false;
          return true;
        })
        .sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0));

      const ai = rawPairs
        .filter((p) => {
          if (!p.liquidity || p.liquidity.usd < 15000) return false;
          if (!p.volume || p.volume.h24 < 50000) return false;
          if (!p.info?.socials || p.info.socials.length === 0) return false;
          const fdv = p.fdv || 0;
          const liq = p.liquidity.usd;
          if (fdv > liq * 200) return false;
          if (liq > 100000 && p.volume.h24 < liq * 0.05) return false;
          return true;
        })
        .sort((a, b) => (b.volume?.h1 || 0) - (a.volume?.h1 || 0));

      setTrendingData(trending);
      setAiPicks(ai);
      setScannerData(rawPairs);
      setLastRefreshed(new Date());

      if (user && rawPairs.length > 0) {
        const batch = writeBatch(db);
        let count = 0;
        let latestNewGem = null;

        rawPairs.forEach((t) => {
          // 1. PUBLIC RECORD (Universal)
          // Note: In real prod, use backend to avoid client spam. Here we check client cache.
          // Simple check: if quality AI pick
          const isAiGem = ai.find((a) => a.pairAddress === t.pairAddress);
          if (isAiGem) {
            const pubRef = doc(
              db,
              'artifacts',
              appId,
              'public',
              'data',
              'discovered_coins',
              t.pairAddress
            );
            // We use set with merge to update current price but keep entry price if exists
            // Actually for "Discovered", we want the FIRST price.
            // This requires reading first, which batch doesn't do.
            // Simplified: We just write to user private entry stats for now to save reads.
            // For the "Top Calls" feature, we'd need a backend function.
          }

          // 2. PRIVATE ENTRY STATS (For User P/L)
          if (!alertHistoryRef.current[t.pairAddress]) {
            const ref = doc(
              db,
              'artifacts',
              appId,
              'users',
              user.uid,
              'entry_stats',
              t.pairAddress
            );
            batch.set(ref, {
              entryPrice: Number(t.priceUsd),
              ath: Number(t.priceUsd),
              timestamp: Date.now()
            });
            count++;

            if (isAiGem) latestNewGem = t;
          } else {
            // Check ATH
            const existing = alertHistoryRef.current[t.pairAddress];
            const curr = Number(t.priceUsd);
            if (existing && curr > (existing.ath || 0)) {
              const ref = doc(
                db,
                'artifacts',
                appId,
                'users',
                user.uid,
                'entry_stats',
                t.pairAddress
              );
              batch.update(ref, { ath: curr });
              count++;
            }
          }
        });

        if (count > 0) {
          await batch.commit();
          if (latestNewGem) setNewAlert(latestNewGem);
        }
      }
      setLoading(false);
      if (isManual) setRefreshing(false);
    } catch (err) {
      console.error('Fetch error', err);
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(false), 1000); // 1s Auto Refresh
    return () => clearInterval(interval);
  }, [customBluechips, savedEntryStats, blacklist]);

  const handleCASearch = async () => {
    if (!caInput.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${DEXSCREENER_TOKENS_API}${caInput.trim()}`);
      const data = await res.json();
      if (data.pairs && data.pairs.length > 0) {
        const bestPair = data.pairs.sort(
          (a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
        )[0];
        setSelectedPair(bestPair);
        setCaInput('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleReportRug = async (pairAddress) => {
    if (!user) return;
    // Add to blacklist
    await setDoc(
      doc(
        db,
        'artifacts',
        appId,
        'users',
        user.uid,
        'blacklist',
        pairAddress
      ),
      {
        bannedAt: Date.now()
      }
    );
    // Also delete from stats/likes to clean up
    await deleteDoc(
      doc(
        db,
        'artifacts',
        appId,
        'users',
        user.uid,
        'entry_stats',
        pairAddress
      )
    );
  };

  const handleAddBluechip = async () => {
    if (!user || !bluechipInput.trim()) return;
    setIsAddingBluechip(true);
    try {
      const res = await fetch(`${DEXSCREENER_TOKENS_API}${bluechipInput.trim()}`);
      const data = await res.json();
      if (data.pairs && data.pairs.length > 0) {
        const pair = data.pairs[0];
        const docId = pair.baseToken.address;
        await setDoc(
          doc(
            db,
            'artifacts',
            appId,
            'users',
            user.uid,
            'custom_bluechips',
            docId
          ),
          {
            ca: docId,
            symbol: pair.baseToken.symbol,
            addedAt: Date.now()
          }
        );
        setBluechipInput('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAddingBluechip(false);
    }
  };

  const handleDeleteCustomBluechip = async (pairAddress) => {
    if (!user) return;
    const token = bluechipData.find((p) => p.pairAddress === pairAddress);
    if (token)
      await deleteDoc(
        doc(
          db,
          'artifacts',
          appId,
          'users',
          user.uid,
          'custom_bluechips',
          token.baseToken.address
        )
      );
  };

  const handleLike = async (pair) => {
    if (!user) return;
    const isLiked = likedCoins.find((c) => c.pairAddress === pair.pairAddress);
    const docRef = doc(
      db,
      'artifacts',
      appId,
      'users',
      user.uid,
      'liked_coins',
      pair.pairAddress
    );
    if (isLiked) await deleteDoc(docRef);
    else
      await setDoc(docRef, {
        ...pair,
        likedAt: Date.now(),
        pairAddress: pair.pairAddress
      });
  };

  const handleCreateFolder = async () => {
    if (!user || !newFolderName.trim()) return;
    const folderId = `folder_${Date.now()}`;
    await setDoc(
      doc(
        db,
        'artifacts',
        appId,
        'users',
        user.uid,
        'folders',
        folderId
      ),
      { name: newFolderName, createdAt: Date.now() }
    );
    setNewFolderName('');
  };

  const handleDeleteFolder = async (folderId, e) => {
    e.stopPropagation();
    if (!user) return;
    await deleteDoc(
      doc(
        db,
        'artifacts',
        appId,
        'users',
        user.uid,
        'folders',
        folderId
      )
    );
    if (activeTab === `folder:${folderId}`) setActiveTab('ai_picks');
  };

  const handleAddToFolder = async (pair, folderId) => {
    if (!user) return;
    const itemRef = doc(
      db,
      'artifacts',
      appId,
      'users',
      user.uid,
      'folder_items',
      `${folderId}_${pair.pairAddress}`
    );
    await setDoc(itemRef, {
      ...pair,
      folderId,
      addedAt: Date.now()
    });
  };

  const renderContent = () => {
    let tokensToShow = [];
    let title = '';

    if (activeTab === 'ai_picks') {
      tokensToShow = aiPicks;
      title = 'AI Picks';
    } else if (activeTab === 'trending') {
      tokensToShow = trendingData;
      title = 'Trending';
    } else if (activeTab === 'bluechips') {
      tokensToShow = bluechipData;
      title = 'Bluechip Zone';
    } else if (activeTab === 'liked') {
      tokensToShow = likedCoins;
      title = 'Watchlist';
    } else if (activeTab.startsWith('folder:')) {
      const folderId = activeTab.split(':')[1];
      tokensToShow = folderItems.filter((item) => item.folderId === folderId);
      title = folders.find((f) => f.id === folderId)?.name || 'Folder';
    }

    if (loading && tokensToShow.length === 0)
      return (
        <div className="flex flex-col items-center justify-center h-full text-green-500 animate-pulse mt-20">
          <Activity className="w-12 h-12 mb-4" />
          <div className="font-mono">AI ANALYZING CHAIN...</div>
        </div>
      );

    return (
      <div className="p-6 pb-24 md:pb-6">
        <div className="mb-6 space-y-4">
          <div className="flex items-end justify-between glass-panel rounded-2xl px-6 py-4">
            <div className="flex items-end gap-4">
              <h2 className="text-3xl font-semibold text-white flex items-center gap-3">
                {title}
                {activeTab === 'ai_picks' && (
                  <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
                )}
                {activeTab === 'trending' && (
                  <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
                )}
              </h2>
              <span className="text-slate-400 font-mono text-sm mb-1">
                {tokensToShow.length} Pairs Found
              </span>
            </div>
            <button
              onClick={() => fetchData(true)}
              className="glass-chip hover:bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-4 py-2 rounded-xl flex items-center gap-2 text-sm transition-all pointer-events-auto"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
              />
              Refresh
            </button>
          </div>

          {activeTab === 'bluechips' && (
            <div className="mt-4 glass-panel border border-violet-400/20 rounded-2xl p-4 flex items-center gap-4">
              <div className="p-2 bg-violet-500/20 rounded-lg text-violet-300">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  className="w-full bg-transparent border-b border-violet-400/30 text-white text-sm py-1 focus:outline-none focus:border-violet-400 placeholder-violet-200/40 font-mono"
                  placeholder="Paste Contract Address (CA) to add custom bluechip..."
                  value={bluechipInput}
                  onChange={(e) => setBluechipInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddBluechip()}
                />
              </div>
              <button
                onClick={handleAddBluechip}
                disabled={isAddingBluechip}
                className="text-xs font-semibold bg-violet-500 hover:bg-violet-400 text-white px-4 py-2 rounded-xl transition-colors"
              >
                {isAddingBluechip ? 'Adding...' : 'ADD COIN'}
              </button>
            </div>
          )}
        </div>

        {tokensToShow.length === 0 ? (
          <div className="text-center py-20 text-slate-500 border border-white/10 border-dashed rounded-2xl glass-panel">
            {activeTab === 'ai_picks'
              ? 'Market is quiet. No high-conviction setups found.'
              : 'No signals detected.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tokensToShow.map((pair) => {
              const isCustom =
                activeTab === 'bluechips' &&
                customBluechips.some((c) => c.ca === pair.baseToken.address);
              const stats = savedEntryStats[pair.pairAddress];
              return (
                <TokenCard
                  key={pair.pairAddress}
                  pair={pair}
                  onLike={handleLike}
                  isLiked={likedCoins.some((c) => c.pairAddress === pair.pairAddress)}
                  folders={folders}
                  onAddToFolder={handleAddToFolder}
                  onClick={setSelectedPair}
                  isCustom={isCustom}
                  onDelete={handleDeleteCustomBluechip}
                  entryPrice={stats?.entryPrice}
                  ath={stats?.ath}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen text-gray-200 font-sans selection:bg-indigo-500/30 flex flex-col overflow-hidden relative">
      <TopTicker items={scannerData} onItemClick={setSelectedPair} />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_45%),radial-gradient(circle_at_20%_20%,_rgba(16,185,129,0.15),_transparent_40%),radial-gradient(circle_at_80%_0%,_rgba(236,72,153,0.2),_transparent_45%)]"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      </div>
      <div className="flex flex-1 pt-10 overflow-hidden relative z-10">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-80 glass-panel transform transition-transform duration-300 pt-11 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0 md:static md:block flex flex-col`}
        >
          <div className="p-5 space-y-6 flex-1 overflow-hidden">
            <div className="flex items-center gap-3 px-2 -mt-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-sky-400 to-emerald-300 flex items-center justify-center text-slate-950 font-bold shadow-lg">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div>
                <span className="font-semibold text-xl text-white tracking-tight">
                  SolScanner
                </span>
                <p className="text-[11px] text-slate-400">
                  Real-time Solana intelligence
                </p>
              </div>
            </div>

            <div className="px-1">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.3em] mb-2">
                Contract Lookup
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="w-full glass-chip rounded-xl text-xs px-3 py-2.5 focus:border-emerald-400 focus:outline-none"
                  placeholder="Paste Address..."
                  value={caInput}
                  onChange={(e) => setCaInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCASearch()}
                />
                <button
                  onClick={handleCASearch}
                  className="glass-chip hover:bg-emerald-500/20 hover:text-white rounded-xl p-2.5 text-slate-400 transition-colors"
                >
                  <SearchCode className="w-4 h-4" />
                </button>
              </div>
            </div>

            <nav className="space-y-1 px-1">
              <button
                onClick={() => {
                  setActiveTab('ai_picks');
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded transition-colors ${
                  activeTab === 'ai_picks'
                    ? 'glass-chip text-emerald-300 border border-emerald-400/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Activity className="w-4 h-4" /> AI Picks
              </button>
              <button
                onClick={() => {
                  setActiveTab('trending');
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded transition-colors ${
                  activeTab === 'trending'
                    ? 'glass-chip text-orange-300 border border-orange-400/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Flame className="w-4 h-4" /> Trending
              </button>
              <button
                onClick={() => {
                  setActiveTab('bluechips');
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded transition-colors ${
                  activeTab === 'bluechips'
                    ? 'glass-chip text-violet-300 border border-violet-400/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-4 h-4" /> Bluechips
              </button>
              <button
                onClick={() => {
                  setActiveTab('liked');
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded transition-colors ${
                  activeTab === 'liked'
                    ? 'glass-chip text-rose-300 border border-rose-400/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Heart className="w-4 h-4" /> Watchlist
              </button>

              <div className="pt-4 border-t border-white/10 mt-4">
                <button
                  onClick={() => setCryptoOpen((prev) => !prev)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded transition-colors ${
                    cryptoOpen
                      ? 'glass-chip text-emerald-300 border border-emerald-400/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <BarChart2 className="w-4 h-4" />
                  <span className="text-sm">Crypto</span>
                  <span
                    className={`ml-auto text-slate-400 text-[11px] transition-transform ${
                      cryptoOpen ? 'rotate-90' : ''
                    }`}
                  >
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </button>
                {cryptoOpen && (
                  <>
                    <div className="px-1 space-y-2 mt-3">
                      <MajorCryptoCard
                        symbol="BTCUSDT"
                        price={majorPrices?.bitcoin?.usd}
                        name="Bitcoin"
                        onClick={setExpandedChartSymbol}
                      />
                      <MajorCryptoCard
                        symbol="ETHUSDT"
                        price={majorPrices?.ethereum?.usd}
                        name="Ethereum"
                        onClick={setExpandedChartSymbol}
                      />
                      <MajorCryptoCard
                        symbol="SOLUSDT"
                        price={majorPrices?.solana?.usd}
                        name="Solana"
                        onClick={setExpandedChartSymbol}
                      />
                    </div>
                    <div className="px-3 pt-2 text-[10px] text-slate-500 font-mono text-center">
                      Feed • {lastRefreshed.toLocaleTimeString()}
                    </div>
                  </>
                )}
              </div>

              {/* FOLDERS */}
              <div className="pt-4">
                <div className="flex items-center justify-between px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.3em]">
                  Folders
                </div>
                <div className="flex items-center gap-2 mb-3 px-3">
                  <input
                    type="text"
                    placeholder="New Folder..."
                    className="glass-chip rounded-lg px-2 py-1 text-xs text-white w-full focus:border-emerald-400 focus:outline-none placeholder-slate-600"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                  />
                  <button
                    onClick={handleCreateFolder}
                    className="p-1.5 glass-chip rounded-lg hover:border-emerald-400 text-emerald-300"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <nav className="space-y-0.5">
                  {folders.map((folder) => (
                    <div
                      key={folder.id}
                      onClick={() => {
                        setActiveTab(`folder:${folder.id}`);
                        setSidebarOpen(false);
                      }}
                      className={`group flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer text-sm transition-colors ${
                        activeTab === `folder:${folder.id}`
                          ? 'glass-chip text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Folder className="w-4 h-4" />
                        <span className="truncate max-w-[100px]">
                          {folder.name}
                        </span>
                      </div>
                      <button
                        onClick={(e) => handleDeleteFolder(folder.id, e)}
                        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </nav>
              </div>

              {/* TOP CALLS */}
              <div className="pt-5 border-t border-white/10 mt-4">
                <div className="flex items-center gap-2 px-3 mb-2 text-[10px] font-semibold text-yellow-400 uppercase tracking-[0.3em]">
                  <Trophy className="w-3 h-3" /> Top Calls (24h)
                </div>
                <div className="space-y-1 px-1">
                  {topCalls.day.map((t) => (
                    <div
                      key={t.pairAddress}
                      onClick={() => setSelectedPair(t)}
                      className="cursor-pointer px-3 py-2 rounded-xl glass-chip hover:border-yellow-400/30 transition-colors flex justify-between items-center"
                    >
                      <span className="text-xs font-bold text-gray-300">
                        {t.baseToken?.symbol || 'UNKNOWN'}
                      </span>
                      <span className="text-[10px] font-mono text-green-400">
                        +{(
                          ((t.currentPrice - t.entryPrice) / t.entryPrice) *
                          100
                        ).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                  {topCalls.day.length === 0 && (
                    <div className="px-3 text-[10px] text-slate-500 italic">
                      No data yet...
                    </div>
                  )}
                </div>
              </div>

              {/* VOLUME ALERTS */}
              {volumeSpikes.length > 0 && (
                <div className="pt-4 border-t border-white/10 mt-4">
                  <button
                    onClick={() => setVolumeOpen((prev) => !prev)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded transition-colors ${
                      volumeOpen
                        ? 'glass-chip text-red-300 border border-red-400/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Siren className="w-4 h-4" />
                    <span className="text-sm">Volume Alerts</span>
                    <span
                      className={`ml-auto text-slate-400 text-[11px] transition-transform ${
                        volumeOpen ? 'rotate-90' : ''
                      }`}
                    >
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </button>
                  {volumeOpen && (
                    <div className="space-y-1 px-1 mt-3">
                      {volumeSpikes.map((t) => (
                        <div
                          key={t.pairAddress}
                          onClick={() => setSelectedPair(t)}
                          className="cursor-pointer px-3 py-2 rounded-xl glass-chip hover:border-red-400/30 transition-colors flex justify-between items-center"
                        >
                          <span className="text-xs font-bold text-gray-300">
                            {t.baseToken.symbol}
                          </span>
                          <span className="text-[10px] font-mono text-red-400">
                            +{((t.volume.m5 / t.volume.h1) * 100).toFixed(0)}% Vol
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </nav>

            {/* DESKTOP MARKET PULSE (Sidebar - Text Only) */}
            <div className="hidden md:block space-y-4">
              <div className="glass-panel rounded-2xl p-4">
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.3em] mb-3">
                  Live Solana
                </div>
                <LiveSolanaChart />
              </div>
            </div>
          </div>
        </aside>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed bottom-36 right-6 z-40 p-3 bg-gradient-to-br from-emerald-400 to-cyan-300 text-slate-900 rounded-full shadow-lg md:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>
        <main className="flex-1 relative flex flex-col h-[calc(100vh-2rem)] overflow-hidden">
          <div className="flex-1 overflow-hidden pb-32 md:pb-0">{renderContent()}</div>
        </main>
        {/* MOBILE MARKET PULSE (Bottom Fixed - Text Only) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 glass-panel border-t border-white/10 z-50 p-2 grid grid-cols-3 gap-2 pb-safe">
          <MajorCryptoCard
            symbol="BTCUSDT"
            price={majorPrices?.bitcoin?.usd}
            name="BTC"
            onClick={setExpandedChartSymbol}
          />
          <MajorCryptoCard
            symbol="ETHUSDT"
            price={majorPrices?.ethereum?.usd}
            name="ETH"
            onClick={setExpandedChartSymbol}
          />
          <MajorCryptoCard
            symbol="SOLUSDT"
            price={majorPrices?.solana?.usd}
            name="SOL"
            onClick={setExpandedChartSymbol}
          />
        </div>
      </div>
      {/* ALERT */}
      <AlertToast token={newAlert} onClose={() => setNewAlert(null)} onClick={setSelectedPair} />
      {selectedPair && (
        <TokenDetailModal
          pair={selectedPair}
          entryData={savedEntryStats[selectedPair.pairAddress]}
          onClose={() => setSelectedPair(null)}
          onReportRug={handleReportRug}
        />
      )}
      {expandedChartSymbol && (
        <TradingViewModal
          symbol={expandedChartSymbol}
          onClose={() => setExpandedChartSymbol(null)}
        />
      )}
    </div>
  );
}
