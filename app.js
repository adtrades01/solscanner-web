import React, { useState, useEffect, useMemo, useRef, memo } from 'react';
import { createRoot } from 'react-dom/client';
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

// Provide fallback definitions for the configuration variables. If the global
// variables are not defined (as in this standalone environment), we assign
// placeholder values. These dummy values allow the application to load
// without throwing exceptions. In a production deployment these would be
// injected by the build system.
const __firebase_config = (typeof window !== 'undefined' && window.__firebase_config) || '{"apiKey":"demo","authDomain":"demo.firebaseapp.com","projectId":"demo","appId":"demo"}';
const __app_id = (typeof window !== 'undefined' && window.__app_id) || 'default-app-id';
const __initial_auth_token = (typeof window !== 'undefined' && window.__initial_auth_token) || '';

// --- FIREBASE SETUP ---
const firebaseConfig = JSON.parse(__firebase_config);
let app;
let auth;
let db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.warn('Firebase initialization failed', e);
  // Create fallbacks to prevent runtime errors if Firebase cannot be initialized.
  app = {};
  auth = {};
  db = {};
}

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

  const liquidity = pair?.liquidity?.usd || 0;
  const volume24 = pair?.volume?.h24 || 0;
  const fdv = pair?.fdv || 0;

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

  if (pair?.priceChange?.h24 > 10000 && volume24 < 50000) {
    score -= 50;
    reasons.push('Artificial Pump (No Volume Support)');
  }

  if (!pair?.info?.socials || pair.info.socials.length === 0) {
    score -= 20;
    reasons.push('No Social Links');
  }

  return { score: Math.max(0, score), reasons };
};

const analyzeNarrative = (name = '', description = '') => {
  const text = (name + ' ' + description).toLowerCase();
  if (text.includes('ai') || text.includes('gpt') || text.includes('agent') || text.includes('neural')) return 'AI Agent';
  if (text.includes('cat') || text.includes('neko') || text.includes('kitty')) return 'Cat Meta';
  if (text.includes('dog') || text.includes('inu') || text.includes('pup') || text.includes('shiba')) return 'Dog Meta';
  if (text.includes('pepe') || text.includes('frog')) return 'Frog Meta';
  if (text.includes('trump') || text.includes('maga')) return 'PolitiFi';
  return 'Meme';
};

const generateAIThesis = (pair) => {
  const liquidity = pair?.liquidity?.usd || 0;
  const volume24 = pair?.volume?.h24 || 0;
  const fdv = pair?.fdv || 0;
  const socials = pair?.info?.socials || [];
  const symbol = pair?.baseToken?.symbol || '';
  const description = pair?.info?.header || pair?.info?.description || 'No official description found.';
  const sector = analyzeNarrative(pair?.baseToken?.name, description);

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
      <div className="bg-gray-900/90 border border-green-500/50 p-4 rounded-xl shadow-2xl shadow-green-500/10 backdrop-blur-md max-w-sm flex items-start gap-4 transition-transform group-hover:scale-105">
        <div className="p-2 bg-green-500/20 rounded-full text-green-400 shrink-0">
          <Bell className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-white mb-1">New Gem Detected!</h4>
          <p className="text-xs text-gray-300 mb-2">
            <span className="font-bold text-green-400">{token.baseToken.symbol}</span> matches your AI safety criteria.
          </p>
          <div className="text-[10px] font-mono text-gray-500">MCap: {formatCurrency(token.fdv)}</div>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }} 
          className="text-gray-500 hover:text-white"
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
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
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
      className="relative w-full bg-[#0A0A0A] border border-gray-800 rounded-lg overflow-hidden group cursor-pointer mb-1 hover:border-gray-600 transition-colors h-14 flex items-center" 
      onClick={() => onClick(`BINANCE:${symbol}`)}
    >
      <div className="absolute inset-0 z-10 bg-transparent" />
      
      <div className="px-4 relative z-20 pointer-events-none flex justify-between items-center w-full">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
           {name}
        </div>
        <div className="text-sm font-mono font-bold text-white tracking-tight">
           {typeof price === 'number' ? `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '...'}
        </div>
      </div>

      <div className="absolute right-0 bottom-0 w-1/2 h-full opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none">
         <div ref={containerRef} className="tradingview-widget-container h-full w-full transform scale-125 origin-center"></div> 
      </div>
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
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
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
          <button onClick={onClose} className="p-2 bg-black/50 hover:bg-gray-800 rounded-full text-white transition-colors">
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
    <div className="fixed top-0 left-0 right-0 h-8 bg-black/90 border-b border-green-900/30 z-50 flex items-center overflow-hidden">
      <div className="flex animate-ticker whitespace-nowrap hover:pause">
        {loopedItems.map((item, i) => (
          <div 
            key={`${item.pairAddress}-${i}`} 
            className="flex-shrink-0 flex items-center px-6 text-xs font-mono border-r border-white/5 cursor-pointer hover:bg-white/5 transition-colors whitespace-nowrap"
            onClick={() => onItemClick(item)}
          >
            <span className="font-bold text-green-400 mr-2">{item.baseToken.symbol}</span>
            <span className="text-gray-300 mr-2">MCap: {formatCurrency(item.fdv || item.marketCap)}</span>
            <span className={item?.priceChange?.h24 >= 0 ? 'text-green-500' : 'text-red-500'}>
              {item?.priceChange?.h24}%
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
const TokenCard = memo(({ pair, onLike, isLiked, folders, onAddToFolder, onClick, isCustom, onDelete, entryPrice, ath }) => {
  const { score, reasons } = useMemo(() => calculateSafetyScore(pair), [pair]);
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  let SafetyIcon = ShieldCheck;
  let safetyColor = 'text-green-400';
  let borderColor = 'border-green-500/20';
  
  if (score < 50) { SafetyIcon = ShieldAlert; safetyColor = 'text-red-500'; borderColor = 'border-red-500/30'; } 
  else if (score < 80) { SafetyIcon = Shield; safetyColor = 'text-yellow-400'; borderColor = 'border-yellow-500/30'; }

  const handleCopyCA = (e) => {
    e.stopPropagation();
    if (pair?.baseToken?.address) {
      copyToClipboard(pair.baseToken.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Safe parsing of numbers to prevent "Object" errors
  const currentPrice = parseFloat(pair?.priceUsd) || 0;
  const safeEntryPrice = parseFloat(entryPrice) || 0;
  const safeAth = parseFloat(ath) || 0;

  const sinceEntryPct = safeEntryPrice > 0 ? ((currentPrice - safeEntryPrice) / safeEntryPrice) * 100 : 0;
  const downFromAth = safeAth > 0 ? ((currentPrice - safeAth) / safeAth) * 100 : 0;

  const athValue = safeAth > 0 ? safeAth * (parseFloat(pair?.fdv) / currentPrice) : 0;

  return (
    <div className={`bg-[#0a0a0a] border ${borderColor} rounded-xl p-4 hover:bg-gray-900 transition-all group relative overflow-hidden flex flex-col justify-between h-full`}>
      <div className="absolute inset-0 z-0 cursor-pointer" onClick={() => onClick(pair)} />

      <div className="relative z-10 pointer-events-none">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-gray-800 flex-shrink-0 flex items-center justify-center overflow-hidden border border-white/5">
              {pair?.info?.imageUrl ? <img src={pair.info.imageUrl} alt={pair.baseToken.symbol} className="w-full h-full object-cover" loading="lazy" /> : <span className="text-xs font-bold text-gray-500">{pair?.baseToken?.symbol?.[0]}</span>}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white leading-none truncate">{pair?.baseToken?.name}</h3>
                <button 
                  onClick={handleCopyCA}
                  className="pointer-events-auto p-1 hover:bg-gray-800 rounded text-gray-500 hover:text-white transition-colors flex-shrink-0"
                  title="Copy CA"
                >
                  {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <span className="text-xs font-mono text-gray-400 truncate block">{pair?.baseToken?.symbol}</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-sm font-bold font-mono text-white flex items-center justify-end gap-1 whitespace-nowrap">
              <span className="text-gray-500 text-[10px] uppercase">MCap</span>
              {formatCurrency(pair?.fdv || pair?.marketCap)}
            </div>
            
            {safeEntryPrice > 0 ? (
              <div className="flex flex-col items-end">
                <div className={`text-[10px] font-mono font-bold flex items-center gap-1 ${sinceEntryPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  <Rocket className="w-3 h-3" />
                  {sinceEntryPct > 0 ? '+' : ''}{sinceEntryPct.toFixed(2)}%
                </div>
                <div className="text-[9px] text-gray-600 font-mono whitespace-nowrap">
                   ATH: {formatCurrency(athValue)} <span className={downFromAth < -20 ? 'text-red-500' : 'text-gray-500'}>({downFromAth.toFixed(1)}%)</span>
                </div>
              </div>
            ) : (
              <div className={`text-xs font-mono ${pair?.priceChange?.h24 >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {pair?.priceChange?.h24}% (24h)
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mb-4">
          <div className="bg-black/40 rounded p-2 flex flex-col">
            <span className="text-[10px] text-gray-600 uppercase">Liquidity</span>
            <span className="text-gray-200 font-mono">{formatNumber(pair?.liquidity?.usd)}</span>
          </div>
          <div className="bg-black/40 rounded p-2 flex flex-col">
            <span className="text-[10px] text-gray-600 uppercase">Vol (24h)</span>
            <span className="text-gray-200 font-mono">{formatNumber(pair?.volume?.h24)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-white/5 relative z-20">
        <div className="group/tooltip relative">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/40 border border-white/5 ${safetyColor} cursor-help`}>
            <SafetyIcon className="w-3.5 h-3.5" />
            <span className="text-xs font-bold">{score}</span>
          </div>
          <div className="absolute bottom-full left-0 mb-2 w-48 bg-gray-950 border border-gray-800 rounded-lg p-3 shadow-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50">
            <h4 className="text-xs font-bold text-white mb-1 border-b border-gray-800 pb-1">Safety Scan</h4>
            {reasons.length > 0 ? (
              <ul className="space-y-1">
                {reasons.map((r, i) => <li key={i} className="text-[10px] text-red-400 flex items-start gap-1"><span className="mt-0.5">•</span>{r}</li>)}
              </ul>
            ) : (
              <div className="text-[10px] text-green-400">All checks passed.</div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
           {isCustom && (
             <button 
               onClick={(e) => { e.stopPropagation(); onDelete(pair.pairAddress); }}
               className="p-1.5 rounded-md hover:bg-red-900/30 text-gray-500 hover:text-red-400 transition-colors"
               title="Remove"
             >
               <Trash2 className="w-4 h-4" />
             </button>
           )}
           <div className="relative">
             <button 
               onClick={(e) => { e.stopPropagation(); setShowFolderMenu(!showFolderMenu); }}
               className="p-1.5 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
             >
               <Folder className="w-4 h-4" />
             </button>
             {showFolderMenu && (
               <div className="absolute bottom-full right-0 mb-2 w-40 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-40">
                 <div className="px-3 py-2 text-xs font-bold text-gray-500 border-b border-gray-800">Add to Folder</div>
                 {folders.length === 0 ? (
                   <div className="px-3 py-2 text-xs text-gray-500 italic">No folders created</div>
                 ) : (
                   folders.map(folder => (
                     <button
                       key={folder.id}
                       onClick={(e) => { e.stopPropagation(); onAddToFolder(pair, folder.id); setShowFolderMenu(false); }}
                       className="w-full text-left px-3 py-2 text-xs text-gray-200 hover:bg-green-900/30 hover:text-green-400 transition-colors"
                     >
                       {folder.name}
                     </button>
                   ))
                 )}
               </div>
             )}
           </div>

           <button 
             onClick={(e) => { e.stopPropagation(); onLike(pair); }}
             className={`p-1.5 rounded-md hover:bg-gray-800 transition-colors ${isLiked ? 'text-pink-500' : 'text-gray-400 hover:text-pink-400'}`}
           >
             <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
           </button>
        </div>
      </div>
    </div>
  );
});

// Token Detail Modal
const TokenDetailModal = ({ pair, entryData, onClose, onReportRug }) => {
  const [livePair, setLivePair] = useState(pair);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await fetch(`${DEXSCREENER_TOKENS_API}${pair.baseToken.address}`);
        const data = await res.json();
        if (data.pairs) {
          const updated = data.pairs.find(p => p.pairAddress === pair.pairAddress);
          if (updated) setLivePair(updated);
        }
      } catch (e) { console.error('Live update fail', e); }
    };
    const interval = setInterval(fetchLatest, 10000);
    return () => clearInterval(interval);
  }, [pair]);

  const handleCopyCA = () => {
    if (livePair?.baseToken?.address) {
      copyToClipboard(livePair.baseToken.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!livePair) return null;
  const { score, reasons } = calculateSafetyScore(livePair);
  const { thesis, sentiment, color, sector, narrativeContext } = generateAIThesis(livePair);

  const txns = livePair?.txns?.h1 || { buys: 0, sells: 0 };
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
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#0f0f0f] border border-gray-800 w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 relative">
        
        <div className="bg-gray-900/50 border-b border-gray-800 p-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-black border border-gray-700 overflow-hidden">
               {livePair?.info?.imageUrl && <img src={livePair.info.imageUrl} alt="" className="w-full h-full object-cover"/>}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-white">{livePair?.baseToken?.name}</h2>
                <button 
                  onClick={handleCopyCA}
                  className="flex items-center gap-1 text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded-lg transition-colors text-gray-300"
                >
                  {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy CA'}
                </button>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                <span className="font-mono text-xs">{livePair?.baseToken?.address}</span>
                <span className="flex items-center gap-1 text-green-400 animate-pulse text-xs"><Clock className="w-3 h-3"/> Live</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <div className="text-2xl font-bold font-mono text-white flex items-center gap-2 justify-end">
                <span className="text-xs text-gray-500 uppercase font-sans">Market Cap</span>
                {formatCurrency(livePair?.fdv)}
              </div>
              <div className={`${livePair?.priceChange?.h24 >= 0 ? 'text-green-500' : 'text-red-500'} text-sm font-mono`}>
                {livePair?.priceChange?.h24}% (24h)
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          <div className="flex-1 bg-black relative h-[35vh] md:h-auto md:flex-1 shrink-0 border-b md:border-b-0 md:border-r border-gray-800">
            <iframe 
              src={`https://dexscreener.com/solana/${livePair.pairAddress}?embed=1&theme=dark&trades=0&info=0`}
              className="absolute inset-0 w-full h-full border-0"
              title="DexScreener Chart"
            />
          </div>

          <div className="flex-1 w-full md:w-96 bg-[#111] overflow-y-auto p-6 space-y-6">
            
            {/* REPORT RUG */}
            <button 
              onClick={() => { onReportRug(livePair.pairAddress); onClose(); }}
              className="w-full flex items-center justify-center gap-2 bg-red-900/20 border border-red-500/20 text-red-400 hover:bg-red-900/40 hover:text-red-200 p-3 rounded-xl transition-colors font-bold text-xs"
            >
               <AlertTriangle className="w-4 h-4" /> REPORT RUG / BAD CALL (Train AI)
            </button>

            {/* ENTRY STATS */}
            {entryMcap && (
               <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
                    <Rocket className="w-4 h-4" /> Discovery Stats
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-[10px] text-gray-500">Detected At MCap</div>
                      <div className="text-lg font-mono text-white font-bold">{formatCurrency(entryMcap)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-gray-500">Total Gain</div>
                      <div className={`${totalGain >= 0 ? 'text-green-400' : 'text-red-400'} text-xl font-mono font-bold`}>
                        {totalGain > 0 ? '+' : ''}{totalGain?.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  {ath && (
                    <div className="text-[10px] text-gray-400 text-right pt-2 border-t border-blue-500/20 mt-2">
                       ATH Since Discovery: <span className="text-white font-bold font-mono">{formatCurrency(ath * (parseFloat(livePair.fdv) / parseFloat(livePair.priceUsd)))}</span>
                    </div>
                  )}
               </div>
            )}

            {/* AI THESIS SECTION */}
            <div className="bg-gradient-to-b from-purple-900/20 to-transparent p-4 rounded-xl border border-purple-500/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-purple-400" />
                  <span className="text-sm font-bold text-white">Narrative Scan</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full">{sector}</span>
              </div>
              <div className={`${color} text-lg font-bold mb-2`}>{sentiment}</div>
              <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{thesis}</p>
              <div className="mt-2 p-2 bg-black/40 rounded text-[10px] text-gray-500 italic border-l-2 border-gray-700">
                "{narrativeContext}"
              </div>
            </div>

            <div className="space-y-3">
               <div className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-2">Due Diligence</div>
               
               <div className="space-y-1">
                 <div className="flex justify-between text-[10px] text-gray-400">
                   <span>Buys: {txns.buys}</span>
                   <span>Sells: {txns.sells}</span>
                 </div>
                 <div className="h-2 bg-red-500/30 rounded-full overflow-hidden flex">
                   <div className="h-full bg-green-500" style={{ width: `${buyPressure}%` }}></div>
                 </div>
                 <div className="text-center text-[10px] text-gray-500">{buyPressure?.toFixed(0)}% Buy Pressure (1h)</div>
               </div>

               <div className="grid grid-cols-2 gap-2">
                 <a 
                   href={`https://app.bubblemaps.io/sol/token/${livePair.baseToken.address}`}
                   target="_blank"
                   rel="noreferrer"
                   className="flex items-center justify-center gap-2 p-3 bg-gray-800/50 hover:bg-blue-600/20 border border-gray-800 hover:border-blue-500 rounded-lg transition-all group"
                 >
                   <Map className="w-4 h-4 text-blue-400 group-hover:text-blue-300" />
                   <span className="text-xs text-gray-400 group-hover:text-white">Bubblemap</span>
                 </a>
                 
                 <a 
                   href={`https://solscan.io/token/${livePair.baseToken.address}#holders`}
                   target="_blank"
                   rel="noreferrer"
                   className="flex items-center justify-center gap-2 p-3 bg-gray-800/50 hover:bg-purple-600/20 border border-gray-800 hover:border-purple-500 rounded-lg transition-all group"
                 >
                   <Database className="w-4 h-4 text-purple-400 group-hover:text-purple-300" />
                   <span className="text-xs text-gray-400 group-hover:text-white">Holders List</span>
                 </a>
               </div>
            </div>

            <div className="bg-gray-900/30 rounded-xl p-4 border border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-green-500"/> Safety Score
                </span>
                <span className={`${score > 80 ? 'text-green-500' : 'text-red-500'} text-lg font-bold`}>{score}/100</span>
              </div>
              {reasons.length > 0 ? (
                 <ul className="space-y-2 mb-4">
                   {reasons.map((r, i) => (<li key={i} className="text-xs text-red-400 flex items-start gap-2 bg-red-900/10 p-2 rounded"><ShieldAlert className="w-3 h-3 shrink-0 mt-0.5"/> {r}</li>))}
                 </ul>
              ) : <div className="text-xs text-green-400 bg-green-900/10 p-2 rounded mb-4 flex items-center gap-2"><ShieldCheck className="w-3 h-3"/> No flags.</div>}
              <a href={`https://rugcheck.xyz/tokens/${livePair.baseToken.address}`} target="_blank" rel="noreferrer" className="block w-full text-center py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors">
                Detailed Rug Report
              </a>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
               {livePair?.info?.websites?.map((w, i) => (
                 <a key={i} href={w.url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 py-2 rounded-lg text-xs text-gray-300 transition-colors">
                   <Globe className="w-3 h-3" /> Website
                 </a>
               ))}
               {livePair?.info?.socials?.map((s, i) => (
                 <a key={i} href={s.url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 py-2 rounded-lg text-xs text-gray-300 transition-colors capitalize">
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

function SolScanner() {
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

  const alertHistoryRef = useRef({}); 

  // Sync persistent stats to ref for logic check
  useEffect(() => {
    alertHistoryRef.current = { ...savedEntryStats };
  }, [savedEntryStats]);

  // Auth
  useEffect(() => {
    // Skip authentication if Firebase isn't available
    if (!auth || !getAuth) return;
    const initAuth = async () => {
      try {
        if (__initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.warn('Auth error', e);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe?.();
  }, []);

  // Firestore listeners for user data
  useEffect(() => {
    if (!user || !db || !collection) return;
    // PUBLIC DATA (Universal Feed)
    // We disable Firestore sync in this offline environment. In a real app this
    // would listen for new tokens discovered by the AI. Without Firebase these
    // listeners will simply return dummy values.
    const unsubPublic = () => {};
    const unsubFolders = () => {};
    const unsubLiked = () => {};
    const unsubBluechips = () => {};
    const unsubStats = () => {};
    const unsubBlacklist = () => {};
    const unsubFolderItems = () => {};
    return () => {};
  }, [user]);

  // WEBSOCKET PRICES (Binance)
  useEffect(() => {
    // Skip WebSocket in offline environment to avoid CORS errors
    return () => {};
  }, []);

  // Main Fetch
  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    if (!isManual && loading) setLoading(true);
    try {
      // 1. FETCH BLUECHIPS
      const allBluechips = [...DEFAULT_BLUECHIPS, ...customBluechips];
      const uniqueCAs = [...new Set(allBluechips.map(b => b.ca))];
      const bluechipPromises = uniqueCAs.map(async (ca) => {
        try {
          const res = await fetch(`${DEXSCREENER_TOKENS_API}${ca}`);
          const data = await res.json();
          if (data.pairs && data.pairs.length > 0) {
            const bestPair = data.pairs.sort((a, b) => (b?.liquidity?.usd || 0) - (a?.liquidity?.usd || 0))[0];
            return bestPair;
          }
        } catch (e) { console.error('Bluechip fetch err', e); }
        return null;
      });
      const bluechipResults = (await Promise.all(bluechipPromises)).filter(Boolean);
      setBluechipData(bluechipResults);

      // 2. FETCH SCANNER
      const boostRes = await fetch(DEXSCREENER_BOOSTS_API);
      const boostData = await boostRes.json();
      let rawPairs = [];
      if (Array.isArray(boostData)) {
         const solBoosts = boostData.filter(b => b.chainId === 'solana').slice(0, 40);
         const addresses = solBoosts.map(b => b.tokenAddress).join(',');
         if(addresses) {
            const pairRes = await fetch(`${DEXSCREENER_TOKENS_API}${addresses}`);
            const pairData = await pairRes.json();
            if (pairData.pairs) {
              const uniqueTokens = {};
              pairData.pairs.forEach(p => {
                 if (blacklist.includes(p.pairAddress)) return;
                 if (!uniqueTokens[p.baseToken.address] || (p?.liquidity?.usd > uniqueTokens[p.baseToken.address]?.liquidity?.usd)) {
                   uniqueTokens[p.baseToken.address] = p;
                 }
              });
              rawPairs = Object.values(uniqueTokens);
            }
         }
      }

      // SPIKE DETECTION
      const spikes = rawPairs.filter(p => {
         if (!p.volume || !p.volume.h1) return false;
         return (p.volume.m5 || 0) > (p.volume.h1 * 0.1);
      }).slice(0, 5);
      setVolumeSpikes(spikes);

      const trending = rawPairs.filter(p => {
         if (!p.liquidity || p.liquidity.usd < 5000) return false;
         if (!p.volume || p.volume.h24 < 10000) return false;
         if (p.liquidity.usd > 100000 && p.volume.h24 < p.liquidity.usd * 0.02) return false; 
         return true;
      }).sort((a, b) => (b?.volume?.h24 || 0) - (a?.volume?.h24 || 0));

      const ai = rawPairs.filter(p => {
         if (!p.liquidity || p.liquidity.usd < 15000) return false;
         if (!p.volume || p.volume.h24 < 50000) return false;
         if (!p.info?.socials || p.info.socials.length === 0) return false;
         const fdv = p.fdv || 0;
         const liq = p.liquidity.usd;
         if (fdv > liq * 200) return false; 
         if (liq > 100000 && p.volume.h24 < liq * 0.05) return false;
         return true;
      }).sort((a, b) => (b?.volume?.h1 || 0) - (a?.volume?.h1 || 0));

      setTrendingData(trending);
      setAiPicks(ai);
      setScannerData(rawPairs);
      setLastRefreshed(new Date());

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
    const interval = setInterval(() => fetchData(false), 5000); // slower refresh to avoid API rate limits
    return () => clearInterval(interval);
  }, [customBluechips, savedEntryStats, blacklist]); 

  const handleCASearch = async () => {
    if (!caInput.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${DEXSCREENER_TOKENS_API}${caInput.trim()}`);
      const data = await res.json();
      if (data.pairs && data.pairs.length > 0) {
        const bestPair = data.pairs.sort((a, b) => (b?.liquidity?.usd || 0) - (a?.liquidity?.usd || 0))[0];
        setSelectedPair(bestPair);
        setCaInput('');
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleReportRug = async (pairAddress) => {
    // In this simplified environment we just blacklist locally
    setBlacklist(prev => [...prev, pairAddress]);
  };

  const handleAddBluechip = async () => {
    if (!bluechipInput.trim()) return;
    setIsAddingBluechip(true);
    try {
      const res = await fetch(`${DEXSCREENER_TOKENS_API}${bluechipInput.trim()}`);
      const data = await res.json();
      if (data.pairs && data.pairs.length > 0) {
        const pair = data.pairs[0];
        setCustomBluechips(prev => [...prev, { ca: pair.baseToken.address, symbol: pair.baseToken.symbol }]);
        setBluechipInput('');
      }
    } catch (e) { console.error(e); } finally { setIsAddingBluechip(false); }
  };

  const handleDeleteCustomBluechip = async (pairAddress) => {
    const token = bluechipData.find(p => p.pairAddress === pairAddress);
    if (token) setCustomBluechips(prev => prev.filter(c => c.ca !== token.baseToken.address));
  };

  const handleLike = async (pair) => {
    const isLiked = likedCoins.find(c => c.pairAddress === pair.pairAddress);
    if (isLiked) setLikedCoins(prev => prev.filter(c => c.pairAddress !== pair.pairAddress));
    else setLikedCoins(prev => [...prev, { ...pair, likedAt: Date.now(), pairAddress: pair.pairAddress }]);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    const folderId = `folder_${Date.now()}`;
    setFolders(prev => [...prev, { id: folderId, name: newFolderName, createdAt: Date.now() }]);
    setNewFolderName('');
  };

  const handleDeleteFolder = async (folderId, e) => {
    e.stopPropagation();
    setFolders(prev => prev.filter(f => f.id !== folderId));
    if (activeTab === `folder:${folderId}`) setActiveTab('ai_picks');
  };

  const handleAddToFolder = async (pair, folderId) => {
    setFolderItems(prev => [...prev, { ...pair, folderId, addedAt: Date.now() }]);
  };

  const renderContent = () => {
    let tokensToShow = [];
    let title = '';
    
    if (activeTab === 'ai_picks') { tokensToShow = aiPicks; title = 'AI Picks'; }
    else if (activeTab === 'trending') { tokensToShow = trendingData; title = 'Trending'; } 
    else if (activeTab === 'bluechips') { tokensToShow = bluechipData; title = 'Bluechip Zone'; } 
    else if (activeTab === 'liked') { tokensToShow = likedCoins; title = 'Watchlist'; } 
    else if (activeTab.startsWith('folder:')) { 
      const folderId = activeTab.split(':')[1];
      tokensToShow = folderItems.filter(item => item.folderId === folderId); 
      title = folders.find(f => f.id === folderId)?.name || 'Folder'; 
    }

    if (loading && tokensToShow.length === 0) return (
      <div className="flex flex-col items-center justify-center h-full text-green-500 animate-pulse mt-20">
        <Activity className="w-12 h-12 mb-4" />
        <div className="font-mono">AI ANALYZING CHAIN...</div>
      </div>
    );

    return (
      <div className="p-6 pb-24 md:pb-6">
        <div className="mb-6">
          <div className="flex items-end justify-between border-b border-gray-800 pb-4">
            <div className="flex items-end gap-4">
               <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                 {title}
                 {activeTab === 'ai_picks' && <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse"/>}
                 {activeTab === 'trending' && <Flame className="w-5 h-5 text-orange-500 animate-pulse"/>}
               </h2>
               <span className="text-gray-500 font-mono text-sm mb-1">
                 {tokensToShow.length} Pairs Found
               </span>
            </div>
            
            <button 
               onClick={() => fetchData(true)} 
               className="bg-green-900/20 hover:bg-green-900/40 text-green-400 border border-green-500/30 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm transition-all"
            >
               <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
               Refresh
            </button>
          </div>

          {activeTab === 'bluechips' && (
            <div className="mt-4 bg-purple-900/10 border border-purple-500/20 rounded-xl p-4 flex items-center gap-4">
              <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <input 
                  type="text" 
                  className="w-full bg-transparent border-b border-purple-500/30 text-white text-sm py-1 focus:outline-none focus:border-purple-500 placeholder-purple-300/30 font-mono"
                  placeholder="Paste Contract Address (CA) to add custom bluechip..."
                  value={bluechipInput}
                  onChange={(e) => setBluechipInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddBluechip()}
                />
              </div>
              <button onClick={handleAddBluechip} disabled={isAddingBluechip} className="text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-colors">
                {isAddingBluechip ? 'Adding...' : 'ADD COIN'}
              </button>
            </div>
          )}
        </div>

        {tokensToShow.length === 0 ? (
          <div className="text-center py-20 text-gray-700 border border-gray-900 border-dashed rounded-xl">
            {activeTab === 'ai_picks' ? 'Market is quiet. No high-conviction setups found.' : 'No signals detected.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tokensToShow.map(pair => {
              const isCustom = activeTab === 'bluechips' && customBluechips.some(c => c.ca === pair?.baseToken?.address);
              const stats = savedEntryStats[pair?.pairAddress];
              return (
                <TokenCard 
                  key={pair.pairAddress} 
                  pair={pair} 
                  onLike={handleLike}
                  isLiked={likedCoins.some(c => c.pairAddress === pair.pairAddress)}
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
    <div className="min-h-screen bg-black text-gray-200 font-sans selection:bg-green-500/30 flex flex-col overflow-hidden">
      
      <TopTicker items={scannerData} onItemClick={setSelectedPair} />

      <div className="flex flex-1 pt-8 overflow-hidden">
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:block fixed inset-y-0 left-0 z-40 w-72 bg-[#050505] border-r border-gray-900 transform transition-transform duration-300 pt-12 flex flex-col`}>
          <div className="p-4 space-y-8 flex-1 overflow-y-auto">
            <div className="flex items-center gap-2 px-2">
              <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center text-black font-bold"><Zap className="w-5 h-5 fill-current" /></div>
              <span className="font-bold text-xl text-white tracking-tight">SolScanner</span>
            </div>

            <div className="px-1">
               <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Contract Lookup</div>
               <div className="flex gap-2">
                 <input type="text" className="w-full bg-gray-900 border border-gray-800 rounded text-xs px-2 py-2 focus:border-green-500 focus:outline-none" placeholder="Paste Address..." value={caInput} onChange={(e) => setCaInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCASearch()} />
                 <button onClick={handleCASearch} className="bg-gray-800 hover:bg-green-600 hover:text-white rounded p-2 text-gray-400 transition-colors"><SearchCode className="w-4 h-4"/></button>
               </div>
            </div>

            <nav className="space-y-1">
              <button onClick={() => { setActiveTab('ai_picks'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded transition-colors ${activeTab === 'ai_picks' ? 'bg-green-900/20 text-green-400 border-l-2 border-green-500' : 'text-gray-500 hover:text-white'}`}><Activity className="w-4 h-4" /> AI Picks</button>
              <button onClick={() => { setActiveTab('trending'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded transition-colors ${activeTab === 'trending' ? 'bg-orange-900/20 text-orange-400 border-l-2 border-orange-500' : 'text-gray-500 hover:text-white'}`}><Flame className="w-4 h-4" /> Trending</button>
              <button onClick={() => { setActiveTab('bluechips'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded transition-colors ${activeTab === 'bluechips' ? 'bg-purple-900/20 text-purple-400 border-l-2 border-purple-500' : 'text-gray-500 hover:text-white'}`}><LayoutGrid className="w-4 h-4" /> Bluechips</button>
              <button onClick={() => { setActiveTab('liked'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded transition-colors ${activeTab === 'liked' ? 'bg-pink-900/20 text-pink-400 border-l-2 border-pink-500' : 'text-gray-500 hover:text-white'}`}><Heart className="w-4 h-4" /> Watchlist</button>
              
              {/* FOLDERS */}
              <div className="pt-2">
                <div className="flex items-center justify-between px-3 mb-2 text-[10px] font-bold text-gray-600 uppercase tracking-widest">Folders</div>
                <div className="flex items-center gap-2 mb-3 px-3">
                  <input type="text" placeholder="New Folder..." className="bg-gray-900 border border-gray-800 rounded px-2 py-1 text-xs text-white w-full focus:border-green-500 focus:outline-none placeholder-gray-700" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}/>
                  <button onClick={handleCreateFolder} className="p-1 bg-gray-900 border border-gray-800 rounded hover:border-green-500 text-green-500"><Plus className="w-3 h-3" /></button>
                </div>
                <nav className="space-y-0.5">
                  {folders.map(folder => (
                     <div key={folder.id} onClick={() => { setActiveTab(`folder:${folder.id}`); setSidebarOpen(false); }} className={`group flex items-center justify-between px-3 py-2 rounded cursor-pointer text-sm transition-colors ${activeTab === `folder:${folder.id}` ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-white'}`}>
                       <div className="flex items-center gap-3"><Folder className="w-4 h-4" /><span className="truncate max-w-[100px]">{folder.name}</span></div>
                       <button onClick={(e) => handleDeleteFolder(folder.id, e)} className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                     </div>
                  ))}
                </nav>
              </div>

              {/* TOP CALLS */}
              <div className="pt-4 border-t border-gray-800 mt-2">
                 <div className="flex items-center gap-2 px-3 mb-2 text-[10px] font-bold text-yellow-500 uppercase tracking-widest">
                   <Trophy className="w-3 h-3" /> Top Calls (24h)
                 </div>
                 <div className="space-y-1 px-1">
                   {topCalls.day.map(t => (
                      <div key={t.pairAddress} onClick={() => setSelectedPair(t)} className="cursor-pointer px-3 py-2 rounded hover:bg-yellow-900/10 border border-transparent hover:border-yellow-900/30 transition-colors flex justify-between items-center">
                         <span className="text-xs font-bold text-gray-300">{t?.baseToken?.symbol || 'UNKNOWN'}</span>
                         <span className="text-[10px] font-mono text-green-400">
                            +{(((t.currentPrice - t.entryPrice)/t.entryPrice) * 100).toFixed(0)}%
                         </span>
                      </div>
                   ))}
                   {topCalls.day.length === 0 && <div className="px-3 text-[10px] text-gray-600 italic">No data yet...</div>}
                 </div>
              </div>

              {/* VOLUME ALERTS */}
              {volumeSpikes.length > 0 && (
                <div className="pt-4 border-t border-gray-800 mt-2">
                   <div className="flex items-center gap-2 px-3 mb-2 text-[10px] font-bold text-red-400 uppercase tracking-widest animate-pulse">
                     <Siren className="w-3 h-3" /> Volume Spikes
                   </div>
                   <div className="space-y-1 px-1">
                     {volumeSpikes.map(t => (
                       <div key={t.pairAddress} onClick={() => setSelectedPair(t)} className="cursor-pointer px-3 py-2 rounded hover:bg-red-900/10 border border-transparent hover:border-red-900/30 transition-colors flex justify-between items-center">
                         <span className="text-xs font-bold text-gray-300">{t.baseToken.symbol}</span>
                         <span className="text-[10px] font-mono text-red-400">+{(((t.volume?.m5 || 0) / (t.volume?.h1 || 1))*100).toFixed(0)}% Vol</span>
                       </div>
                     ))}
                   </div>
                </div>
              )}

            </nav>
          </div>

          {/* DESKTOP MARKET PULSE (Sidebar - Text Only) */}
          <div className="hidden md:block pt-4 border-t border-gray-900 space-y-2 bg-[#020202]">
             <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-4 pt-2">Market Pulse</div>
             <MajorCryptoCard symbol="BTCUSDT" price={majorPrices?.bitcoin?.usd} name="Bitcoin" onClick={setExpandedChartSymbol} />
             <MajorCryptoCard symbol="ETHUSDT" price={majorPrices?.ethereum?.usd} name="Ethereum" onClick={setExpandedChartSymbol} />
             <MajorCryptoCard symbol="SOLUSDT" price={majorPrices?.solana?.usd} name="Solana" onClick={setExpandedChartSymbol} />
             <div className="px-4 py-2 text-[10px] text-gray-700 font-mono text-center">Feed • {lastRefreshed.toLocaleTimeString()}</div>
          </div>
        </aside>

        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="fixed bottom-36 right-6 z-40 p-3 bg-green-500 text-black rounded-full shadow-lg md:hidden"><Menu className="w-6 h-6" /></button>

        <main className="flex-1 relative flex flex-col h-[calc(100vh-2rem)] overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none fixed"></div>
          <div className="flex-1 overflow-y-auto pb-32 md:pb-0">
            {renderContent()}
          </div>
        </main>

        {/* MOBILE MARKET PULSE (Bottom Fixed - Text Only) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-gray-800 z-50 p-2 grid grid-cols-3 gap-2 pb-safe">
           <MajorCryptoCard symbol="BTCUSDT" price={majorPrices?.bitcoin?.usd} name="BTC" onClick={setExpandedChartSymbol} />
           <MajorCryptoCard symbol="ETHUSDT" price={majorPrices?.ethereum?.usd} name="ETH" onClick={setExpandedChartSymbol} />
           <MajorCryptoCard symbol="SOLUSDT" price={majorPrices?.solana?.usd} name="SOL" onClick={setExpandedChartSymbol} />
        </div>
      </div>

      {/* ALERT */}
      <AlertToast token={newAlert} onClose={() => setNewAlert(null)} onClick={setSelectedPair} />

      {selectedPair && <TokenDetailModal pair={selectedPair} entryData={savedEntryStats[selectedPair.pairAddress]} onClose={() => setSelectedPair(null)} onReportRug={handleReportRug} />}
      {expandedChartSymbol && <TradingViewModal symbol={expandedChartSymbol} onClose={() => setExpandedChartSymbol(null)} />}
    </div>
  );
}

// Render the application to the DOM
const rootElement = document.getElementById('root');
const root = createRoot(rootElement);
root.render(React.createElement(SolScanner));
