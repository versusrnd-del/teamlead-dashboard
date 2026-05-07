import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  LineChart, Line
} from 'recharts';
import { 
  Activity, AlertTriangle, CheckCircle, ShieldAlert, Clock, Shield, Database,
  LayoutDashboard, Pencil, PieChart, GitMerge, FileText, Award, Users, BookOpen, Save, Copy, Check, Plus, Trash2, 
  Settings, HelpCircle, FileSearch, ArrowRight, Target, Calendar, Flame, Search, Archive,
  Medal, Star, ThumbsUp, ShieldCheck, Zap, Heart, User, TrendingUp, Sparkles, DownloadCloud, Timer, ChevronDown, Layers, Lock, Key, LogOut, UserPlus, RefreshCcw, Server, PieChart as PieChartIcon, Download, Edit3, PhoneCall
} from 'lucide-react';

// --- КОНСТАНТЫ И НАСТРОЙКИ ---
const USER_DICTIONARY = {
  "obe1": "Петр Скляренко",
  "obe": "Петр Скляренко",
  "u002209": "Антон Лысов",
  "u0105": "Максим Нестеров",
  "u0279": "Никита Лысов",
  "u05112": "Владимир Приходько",
  "u01002": "Виктор С.",
  "rem": "Роман Нор",
  "u0287": "Марк Соколов",
  "u0608": "Максим Гуртов",
  "u0607": "Максим Отрошко",
  "mvol": "Михаил Волков",
  "tea1": "Евгений Тихонов",
  "dbog": "Дмитрий Богатырев"
};

const BASE_CAPACITY = 50; 
const TEAM_LEAD_ID = "u01002"; // ID тимлида для исключения из таблиц отчета
const TEAM_LEAD_NAME = "Виктор С.";
const THIRD_LINE_ADMINS = ["Антон Лысов", "Петр Скляренко", "Максим Нестеров", "Роман Нор", "e0197"];

const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const availableYears = Array.from({ length: 31 }, (_, i) => 2020 + i);

// --- ХЕЛПЕРЫ БЕЗОПАСНОСТИ ---
const hashPassword = async (password) => {
  const msgBuffer = new TextEncoder().encode(password + "super_secure_salt_2026");
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// --- ОСТАЛЬНЫЕ ХЕЛПЕРЫ ---
const getISOWeekNumber = (d) => {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};

const generateMonthWeeks = (year, month) => {
  const weeks = [];
  let d = new Date(year, month, 1);
  let day = d.getDay() || 7;
  if (day !== 1) d.setHours(-24 * (day - 1));

  while ((d.getMonth() <= month && d.getFullYear() === year) || weeks.length === 0) {
    let weekStart = new Date(d);
    let weekEnd = new Date(d);
    weekEnd.setDate(weekEnd.getDate() + 6);
    let weekNum = getISOWeekNumber(weekStart);
    let startStr = `${weekStart.getDate().toString().padStart(2, '0')}.${(weekStart.getMonth() + 1).toString().padStart(2, '0')}`;
    let endStr = `${weekEnd.getDate().toString().padStart(2, '0')}.${(weekEnd.getMonth() + 1).toString().padStart(2, '0')}`;
    weeks.push({ weekNumber: weekNum, dates: `${startStr} - ${endStr}`, label: `Неделя ${weekNum} (${startStr} - ${endStr})` });
    d.setDate(d.getDate() + 7);
    if (d.getMonth() !== month && d.getFullYear() >= year) break;
  }
  return weeks;
};

// Вычисление разницы в неделях
const getWeeksDiff = (createdKey, currentKey) => {
  if (!createdKey || !currentKey) return 0;
  try {
    const [y1, w1] = createdKey.split('-').map(Number);
    const [y2, w2] = currentKey.split('-').map(Number);
    return ((y2 - y1) * 52) + (w2 - w1);
  } catch (e) {
    return 0;
  }
};

const replaceLoginsWithNames = (text) => {
  if (typeof text !== 'string') return String(text || '');
  let result = text;
  for (const [login, name] of Object.entries(USER_DICTIONARY)) {
    const regex = new RegExp(`\\b${login}\\b`, 'gi');
    result = result.replace(regex, name);
  }
  return result;
};

const getFullName = (login) => {
  if (!login) return 'Неизвестно';
  const cleanLogin = String(login).trim().toLowerCase();
  const foundKey = Object.keys(USER_DICTIONARY).find(k => k.toLowerCase() === cleanLogin);
  return foundKey ? USER_DICTIONARY[foundKey] : login;
};

const safeString = (val) => {
  if (val === null || val === undefined) return '';
  if (Array.isArray(val)) return val.map(v => typeof v === 'object' ? JSON.stringify(v) : String(v)).join(' ');
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
};

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeIncidentKey = (value) => safeString(value).trim().toUpperCase();

const cleanCsatReviewText = (value) => {
  let text = safeString(value);
  text = text.replace(/\b\d{1,2}\/[А-ЯЁа-яёA-Za-z]{3,12}\/\d{2,4}\s*\d{1,2}:\d{2}\b/g, ' ');
  text = text.replace(/\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\s*\d{1,2}:\d{2}\b/g, ' ');
  text = text.replace(/\b\d{1,2}:\d{2}\b/g, ' ');
  text = text.replace(/\bIS-\d+\b/gi, ' ');
  text = text.replace(/\b(u\d+|obe1?|rem|mvol|tea1|dbog)\b/gi, ' ');
  Object.values(USER_DICTIONARY).forEach(name => {
    const cleanName = safeString(name).trim();
    if (cleanName.length > 2) {
      text = text.replace(new RegExp(escapeRegExp(cleanName), 'gi'), ' ');
    }
  });
  text = text.replace(/[\t\r\n]+/g, ' ');
  text = text.replace(/\s{2,}/g, ' ').trim();
  text = text.replace(/^[\s:;.,'"«»\-–—]+|[\s:;.,'"«»\-–—]+$/g, '');
  const servicePatterns = [
    /^получено$/i,
    /^агент$/i,
    /^оценка$/i,
    /^комментарий$/i,
    /^удовлетворенность$/i,
    /^нет комментария$/i,
    /^без комментария$/i
  ];
  if (!text || servicePatterns.some(pattern => pattern.test(text))) return '';
  return text;
};

const parseCsatReviewsFromText = (rawText) => {
  const source = safeString(rawText);
  const keyRegex = /IS-\d+/gi;
  const boundaryRegex = /\b\d{1,2}\/[А-ЯЁа-яёA-Za-z]{3,12}\/\d{2,4}\s*\d{1,2}:\d{2}\b|\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\s*\d{1,2}:\d{2}\b|\b\d{1,2}:\d{2}\b/g;
  const matches = [...source.matchAll(keyRegex)];
  const parsed = {};
  matches.forEach((match, index) => {
    const key = normalizeIncidentKey(match[0]);
    const prevEnd = index > 0 ? matches[index - 1].index + matches[index - 1][0].length : 0;
    let rawBlock = source.slice(prevEnd, match.index);
    const boundaries = [...rawBlock.matchAll(boundaryRegex)];
    if (boundaries.length > 0) {
      const lastBoundary = boundaries[boundaries.length - 1];
      rawBlock = rawBlock.slice(lastBoundary.index + lastBoundary[0].length);
    }
    const reviewText = cleanCsatReviewText(rawBlock);
    if (key && reviewText) parsed[key] = reviewText;
  });
  return parsed;
};

const formatCSAT = (val) => {
  if (val === null || val === undefined) return '0.0';
  const num = Number(val);
  return isNaN(num) || num === 0 ? '5.0' : num.toFixed(1);
};

// --- НАЧАЛЬНЫЕ ДАННЫЕ ---
const defaultWeekData = {
  year: new Date().getFullYear(), month: new Date().getMonth(), weekNumber: getISOWeekNumber(new Date()), dates: "Текущая неделя", 
  status: "green", managementIndex: 100, inflowThisWeek: 0,
  avgCycleTime: 0, reopenRate: 0, techDebtCategories: [],
  mainInsight: "Ожидание данных аналитики...", mainRisk: "Ожидание данных аналитики...",
  nextFocus: "Ожидание данных аналитики...", trainingHypothesis: "Ожидание данных аналитики...",
  incidentsClosed: 0, incidentsQueue: 0, sprintPlanned: 0, sprintCompleted: 0, sprintCarriedOver: 0,
  urgentCompleted: 0, urgentQueue: 0, backlog: 0, backlogOld30: 0, backlogCompleted: 0,
  mainWin: "", thanks: "", sprintWin: "", sprintRisk: "", shieldHero: "", blockersAndWaste: "Ожидание данных аналитики...",
  topIncidents: [], slaMetrics: [], topPerformers: [], taskPerformers: [], taskComplexity: [], taskTypesDistribution: [], staleBacklog: [], telephonyData: [], telephonyInsight: ""
};

const defaultProcesses = [
  { id: 1, name: "Первая линия (Маршрутизация)", status: "working", goal: "Быстрая классификация обращений.", owner: "Дежурный 1-й линии", currentProblem: "Ожидание аналитики", nextExperiment: "Ожидание данных" },
  { id: 4, name: "Работа с бэклогом (Техдолг)", status: "working", goal: "Не давать старым задачам протухать (> 30 дней).", owner: "Тимлид", currentProblem: "Ожидание аналитики", nextExperiment: "Ожидание данных" },
  { id: 2, name: "Срочная линия (Роль 'Щит')", status: "working", goal: "Один дежурный забирает внезапный хаос.", owner: "Выделенный дежурный", currentProblem: "Ожидание аналитики", nextExperiment: "Ожидание данных" },
  { id: 3, name: "Недельный спринт (Планирование)", status: "working", goal: "Гарантированная поставка плановых задач.", owner: "Вся команда", currentProblem: "Ожидание аналитики", nextExperiment: "Ожидание данных" }
];

const defaultAchievements = [];
const defaultProfiles = [];

// --- ЭКРАН ВХОДА ---
const LoginScreen = ({ onLogin, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await onLogin(username, password);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl p-8 relative z-10 text-center">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/30 mb-4 shadow-lg shadow-emerald-900/10">
            <LayoutDashboard size={32} className="text-emerald-400" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">ЦЕНТР УПРАВЛЕНИЯ</h1>
          <p className="text-sm text-slate-400 mt-1 uppercase tracking-widest opacity-60">Панель Тимлида</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Пользователь</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" required value={username} onChange={e => setUsername(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-600 focus:border-emerald-500 outline-none transition-all"
                placeholder="Логин"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Пароль</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-600 focus:border-emerald-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-2 text-red-400 text-sm animate-in fade-in zoom-in-95"><ShieldAlert size={14} /> {error}</div>}
          <button type="submit" disabled={isLoading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 flex justify-center items-center gap-2">
            {isLoading ? <Activity size={20} className="animate-spin" /> : <><Key size={18} /> ВОЙТИ В СИСТЕМУ</>}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- КОМПОНЕНТЫ ИНТЕРФЕЙСА ---
const WeekSelector = ({ historyKeys, selectedKey, onSelect, activeData, weeksHistory }) => (
  <div className="bg-slate-800/50 p-2 rounded-lg border border-slate-700/50 flex items-center gap-3">
    <div className="text-right hidden sm:block">
      <div className="text-sm font-bold text-slate-200">{monthNames[activeData.month] || ''} {activeData.year || ''}</div>
      <div className="text-slate-400 text-xs">
        Неделя {activeData.weekNumber || ''} {activeData.dates && activeData.dates !== "Текущая неделя" ? `(${activeData.dates})` : ''}
      </div>
    </div>
    <div className="relative">
      <select 
        value={selectedKey} 
        onChange={(e) => onSelect(e.target.value)}
        className="appearance-none bg-slate-900 border border-slate-700 text-white text-sm rounded-md pl-3 pr-8 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
      >
        {historyKeys.map(k => {
          const parts = k.split('-');
          if(parts.length !== 2) return null;
          const datesInfo = weeksHistory && weeksHistory[k] ? weeksHistory[k].dates : parts[0];
          return <option key={k} value={k}>Неделя {parts[1]} ({datesInfo})</option>;
        })}
      </select>
      <ChevronDown size={14} className="absolute right-2 top-2 text-slate-400 pointer-events-none" />
    </div>
  </div>
);

// --- ВКЛАДКА: ПУЛЬС КОМАНДЫ ---

const PulseDashboard = ({ weekData, historyKeys, weeksHistory, selectedWeekKey, onWeekSelect, csatReviews }) => {
  const sortedKeys = [...historyKeys].sort();
  const currentIndex = sortedKeys.indexOf(selectedWeekKey);
  const prevWeekKey = currentIndex > 0 ? sortedKeys[currentIndex - 1] : null;
  const prevWeekData = prevWeekKey ? weeksHistory[prevWeekKey] : null;
  const backlogTrend = prevWeekData ? (Number(weekData.backlog) || 0) - (Number(prevWeekData.backlog) || 0) : 0;

  const totalClosed = (Number(weekData.sprintCompleted) || 0) + (Number(weekData.urgentCompleted) || 0) + (Number(weekData.backlogCompleted) || 0);
  const loadPercentage = Math.min(Math.round((totalClosed / BASE_CAPACITY) * 100), 150);
  
  const totalIncidentsCount = Number(weekData.incidentsClosed) || 0;
  
  let loadStatus = 'Норма';
  let loadColor = 'bg-emerald-500';
  let loadTextColor = 'text-emerald-400';
  let loadBgMuted = 'bg-emerald-500/10';

  if (totalClosed >= BASE_CAPACITY) {
    loadStatus = 'Оверперформ (На пределе)';
    loadColor = 'bg-red-500';
    loadTextColor = 'text-red-400';
    loadBgMuted = 'bg-red-500/10';
  } else if (loadPercentage >= 80) {
    loadStatus = 'Высокая нагрузка';
    loadColor = 'bg-orange-500';
    loadTextColor = 'text-orange-400';
    loadBgMuted = 'bg-orange-500/10';
  }

  const trendData = sortedKeys.map(key => {
    const w = weeksHistory[key];
    return {
      name: `Нед. ${w.weekNumber}`,
      'Бэклог (Остаток)': Number(w.backlog) || 0,
      'Выполнено': (Number(w.sprintCompleted) || 0) + (Number(w.urgentCompleted) || 0) + (Number(w.backlogCompleted) || 0),
      'Приток': Number(w.inflowThisWeek) || 0
    };
  });

  const chartData = [
    { name: 'Пн', Спринт: Math.floor((Number(weekData.sprintCompleted) || 0) * 0.2), Срочная: Math.floor((Number(weekData.urgentCompleted) || 0) * 0.25), Бэклог: Math.floor((Number(weekData.backlogCompleted) || 0) * 0.2) },
    { name: 'Вт', Спринт: Math.floor((Number(weekData.sprintCompleted) || 0) * 0.3), Срочная: Math.floor((Number(weekData.urgentCompleted) || 0) * 0.2), Бэклог: Math.floor((Number(weekData.backlogCompleted) || 0) * 0.2) },
    { name: 'Ср', Спринт: Math.floor((Number(weekData.sprintCompleted) || 0) * 0.2), Срочная: Math.floor((Number(weekData.urgentCompleted) || 0) * 0.25), Бэклог: Math.floor((Number(weekData.backlogCompleted) || 0) * 0.2) },
    { name: 'Чт', Спринт: Math.floor((Number(weekData.sprintCompleted) || 0) * 0.2), Срочная: Math.floor((Number(weekData.urgentCompleted) || 0) * 0.15), Бэклог: Math.floor((Number(weekData.backlogCompleted) || 0) * 0.2) },
    { name: 'Пт', Спринт: Math.floor((Number(weekData.sprintCompleted) || 0) * 0.1), Срочная: Math.floor((Number(weekData.urgentCompleted) || 0) * 0.15), Бэклог: Math.floor((Number(weekData.backlogCompleted) || 0) * 0.2) },
  ];

  const totalIncidentsFromList = (weekData.topIncidents || []).reduce((sum, item) => sum + (Number(item.count) || 0), 0);
  
  const sortedIncidents = [...(weekData.topIncidents || [])].sort((a, b) => {
    const aName = safeString(a.name);
    const bName = safeString(b.name);
    if (aName.includes('Другое')) return 1;
    if (bName.includes('Другое')) return -1;
    return (Number(b.count) || 0) - (Number(a.count) || 0);
  });

  const getSizeColor = (size) => {
    switch (size) {
      case 'S': return 'bg-emerald-500 text-emerald-400 border-emerald-500/30';
      case 'M': return 'bg-blue-500 text-blue-400 border-blue-500/30';
      case 'L': return 'bg-orange-500 text-orange-400 border-orange-500/30';
      case 'XL': return 'bg-red-500 text-red-400 border-red-500/30';
      default: return 'bg-slate-500 text-slate-400 border-slate-500/30';
    }
  };

  const reopenVal = Number(weekData.reopenRate) || 0;
  const reopenColor = reopenVal > 5 ? 'text-red-400' : (reopenVal > 0 ? 'text-amber-400' : 'text-emerald-400');
  
  const cycleVal = Number(weekData.avgCycleTime) || 0;
  const cycleColor = cycleVal > 14 ? 'text-red-400' : (cycleVal > 7 ? 'text-amber-400' : 'text-emerald-400');

  const getCsatHeatClass = (rating) => {
    const numericRating = Number(rating);
    if (numericRating > 0 && numericRating <= 3) return 'bg-red-500/15 border-red-500/40 text-red-100';
    if (numericRating === 4) return 'bg-amber-500/15 border-amber-500/40 text-amber-100';
    return 'bg-slate-900/60 border-slate-700/50 text-slate-200';
  };

  const findIncidentTopicById = (incidentId) => {
    const targetId = normalizeIncidentKey(incidentId);
    if (!targetId) return '';

    const titleFields = ['title', 'topic', 'summary', 'subject', 'name'];
    const idFields = ['id', 'key', 'issueKey', 'incidentId'];
    const visited = new WeakSet();

    const walk = (value, depth = 0) => {
      if (!value || depth > 6) return '';
      if (typeof value !== 'object') return '';
      if (visited.has(value)) return '';
      visited.add(value);

      if (Array.isArray(value)) {
        for (const item of value) {
          const found = walk(item, depth + 1);
          if (found) return found;
        }
        return '';
      }

      const hasTargetId = idFields.some(field => normalizeIncidentKey(value[field]) === targetId)
        || Object.values(value).some(fieldValue => typeof fieldValue === 'string' && normalizeIncidentKey(fieldValue).includes(targetId));

      if (hasTargetId) {
        for (const field of titleFields) {
          const topic = safeString(value[field]).trim();
          if (topic && normalizeIncidentKey(topic) !== targetId) return topic;
        }
      }

      for (const child of Object.values(value)) {
        const found = walk(child, depth + 1);
        if (found) return found;
      }

      return '';
    };

    return walk(weekData);
  };

  const buildCsatTooltipItems = (perf) => {
    const details = Array.isArray(perf.csatDetails) ? perf.csatDetails : [];
    if (details.length > 0) {
      return details
        .map((item) => {
          const id = normalizeIncidentKey(item.id);
          if (!id) return null;
          const linkedTask = (weekData.detailedTasks || []).find(t => normalizeIncidentKey(t.id) === id);
          const reviewText = safeString(csatReviews?.[id]).trim();
          const themeText = safeString(item.theme || item.title || item.topic || item.summary || linkedTask?.title || findIncidentTopicById(id)).trim();
          return {
            id,
            rating: Number(item.rating) || null,
            text: reviewText,
            theme: themeText
          };
        })
        .filter(Boolean);
    }

    const comments = Array.isArray(perf.csatComments) ? perf.csatComments : [];
    return comments.map((comment, index) => ({
      id: `legacy-${index}`,
      rating: null,
      text: safeString(comment).trim()
    })).filter(item => item.text);
  };

  const renderCsatTooltip = (csatTooltipItems) => {
    if (!csatTooltipItems || csatTooltipItems.length === 0) return null;

    return (
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 pb-3 w-[450px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        <div className="p-5 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl text-[12px] text-slate-300 text-left relative cursor-auto pointer-events-auto">
          <div className="font-bold text-emerald-400 mb-2 border-b border-slate-700 pb-2 text-sm">Отзывы пользователей:</div>
          <div className="space-y-3 max-h-72 overflow-y-auto custom-scrollbar pr-2">
            {csatTooltipItems.map((item, i) => {
              const rating = Number(item.rating) || null;
              const ratingColor = rating <= 3 ? 'text-red-300' : rating === 4 ? 'text-amber-300' : 'text-emerald-300';

              return (
                <div key={`${item.id}-${i}`} className={`leading-relaxed p-3 rounded-lg border whitespace-pre-wrap text-[13px] ${getCsatHeatClass(rating)}`}>
                  <div className="flex items-center justify-between gap-3 mb-1.5 text-[11px] uppercase tracking-wider font-bold">
                    <span className="text-slate-300">{item.id.startsWith('legacy-') ? 'Старый отзыв' : item.id}</span>
                    {rating && <span className={ratingColor}>Оценка {rating}</span>}
                  </div>
                  {item.text ? (
                    <div className="text-slate-100 leading-relaxed">"{item.text}"</div>
                  ) : (
                    <div className="space-y-2">
                      <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider border ${getCsatHeatClass(rating)}`}>
                        <Star size={12} className={rating <= 3 ? 'text-red-300' : rating === 4 ? 'text-amber-300' : 'text-emerald-300'} />
                        <span>Оценка {rating || '-'}</span>
                      </div>
                      <div className="text-slate-500/80 italic text-[12px] leading-snug line-clamp-2">
                        Тема: {item.theme || 'не передана в JSON'}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-600"></div>
        </div>
      </div>
    );
  };

  const getContextBadge = (context, options = {}) => {
    if (!context || context.trim() === '') return <span className="text-slate-600">-</span>;
    const { placement = 'top', isTopTaskLeader = false } = options;
    const lower = context.toLowerCase();
    let colorClass = 'bg-slate-500/10 text-slate-400 border-slate-500/20'; 
    let shortText = context;
    if (lower.includes('баланс') || lower.includes('микс')) {
      colorClass = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    } else if (lower.includes('сложн') || lower.includes('архитектур') || lower.includes('спасат') || lower.includes('высок')) {
      colorClass = 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20';
    }
    if (lower.includes('локомотив')) {
      colorClass = 'bg-cyan-500/10 text-cyan-300 border-cyan-400/30';
    }
    if (isTopTaskLeader && lower.includes('локомотив')) {
      colorClass = 'bg-amber-400/15 text-amber-200 border-amber-300/50 shadow-[0_0_18px_rgba(251,191,36,0.18)]';
    }
    if(shortText.length > 15) shortText = shortText.substring(0, 14) + '...';
    const tooltipPositionClass = placement === 'bottom'
      ? 'absolute top-full left-1/2 -translate-x-1/2 pt-3 w-[350px]'
      : 'absolute bottom-full left-1/2 -translate-x-1/2 pb-3 w-[350px]';
    const arrowClass = placement === 'bottom'
      ? 'absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-600'
      : 'absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-600';
    
    return (
      <div className="group relative flex justify-center cursor-help">
        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${colorClass}`}>
          {shortText}
        </span>
        <div className={`${tooltipPositionClass} opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 text-center`}>
          <div className="p-4 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl text-[13px] leading-relaxed text-slate-300 relative cursor-auto pointer-events-auto">
            {context}
            <div className={arrowClass}></div>
          </div>
        </div>
      </div>
    );
  };

  // ФИЛЬТРАЦИЯ ТАБЛИЦ ДЛЯ ЭКРАНА
  let filteredTopPerformers = (weekData.topPerformers || []).filter(p => {
     const fName = getFullName(p.name);
     const isTeamLead = p.name === TEAM_LEAD_ID || fName === TEAM_LEAD_NAME || String(p.name).includes('Виктор');
     const isThirdLine = THIRD_LINE_ADMINS.includes(fName) || THIRD_LINE_ADMINS.includes(p.name);
     const isUnknown = fName === p.name && !Object.keys(USER_DICTIONARY).includes(p.name.toLowerCase());
     const isLiterallyUnknown = String(p.name).toLowerCase() === 'неизвестно' || fName.toLowerCase() === 'неизвестно';
     return !isTeamLead && !isThirdLine && !isUnknown && !isLiterallyUnknown;
  });

  let filteredTaskPerformers = (weekData.taskPerformers || []).filter(p => {
     const fName = getFullName(p.name);
     const isTeamLead = p.name === TEAM_LEAD_ID || fName === TEAM_LEAD_NAME || String(p.name).includes('Виктор');
     const isUnknown = fName === p.name && !Object.keys(USER_DICTIONARY).includes(p.name.toLowerCase());
     const isLiterallyUnknown = String(p.name).toLowerCase() === 'неизвестно' || fName.toLowerCase() === 'неизвестно';
     return !isTeamLead && !isUnknown && !isLiterallyUnknown;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
        <div className="w-full sm:w-auto">
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Пульс команды</h1>
          <p className="text-slate-400 text-sm">Оперативный статус направления техни поддержки</p>
          
          <div className="mt-4 bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 w-full max-w-md">
             <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-300 flex items-center gap-2"><Flame className={loadTextColor} size={16}/> Общая загрузка (Capacity)</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded border border-${loadColor.replace('bg-', '')}/30 ${loadBgMuted} ${loadTextColor}`}>
                  {loadStatus} ({Math.round((totalClosed / BASE_CAPACITY) * 100)}%)
                </span>
             </div>
             <div className="w-full bg-slate-900/80 rounded-full h-3.5 border border-slate-700 overflow-hidden flex shadow-inner">
                <div className={`h-full ${loadColor} transition-all duration-1000 relative`} style={{ width: `${Math.min(loadPercentage, 100)}%` }}>
                  {totalClosed >= BASE_CAPACITY && <div className="absolute inset-0 bg-white/20 w-full animate-[pulse_2s_ease-in-out_infinite]"></div>}
                </div>
                {loadPercentage > 100 && <div className="h-full bg-red-600 animate-pulse border-l border-red-800" style={{ width: `${loadPercentage - 100}%` }}></div>}
             </div>
             <div className="flex justify-between text-[10px] text-slate-500 mt-1.5 font-medium px-1">
                <span>0</span>
                <span>Норма (~{BASE_CAPACITY * 0.8})</span>
                <span className={totalClosed >= BASE_CAPACITY ? 'text-red-400 font-bold' : ''}>Предел ({BASE_CAPACITY}+)</span>
             </div>
          </div>
        </div>
        <WeekSelector historyKeys={historyKeys} weeksHistory={weeksHistory} selectedKey={selectedWeekKey} onSelect={onWeekSelect} activeData={weekData} />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4 mt-8">
        <h2 className="text-lg font-medium text-white flex items-center gap-2"><PieChart size={20} className="text-slate-400" />Операционные показатели</h2>
        <div className="bg-indigo-500/10 text-indigo-400 px-4 py-1.5 rounded-lg border border-indigo-500/20 text-sm font-bold flex items-center gap-2 shadow-inner">
          <DownloadCloud size={16} /> Приток за неделю: {Number(weekData.inflowThisWeek) || 0} новых задач
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {/* КАРТОЧКА 1 - Индекс */}
        <div className="bg-slate-800 rounded-xl p-5 border-t-4 border-indigo-500 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Индекс управляемости</h3>
            <div className="flex items-baseline gap-2 mb-1"><span className="text-4xl font-bold text-white">{Number(weekData.managementIndex) || 0}</span><span className="text-slate-500 text-sm font-medium">/ 100</span></div>
            <p className="text-xs text-slate-500 mt-1">Оценка на базе SLA</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-700/50 flex justify-between items-center">
            <span className="text-slate-400 text-xs">Статус:</span>
            <span className={`${Number(weekData.managementIndex) >= 70 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : (Number(weekData.managementIndex) <= 0 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20')} px-2 py-0.5 rounded font-bold text-xs border`}>
              {Number(weekData.managementIndex) >= 70 ? 'Управляемо' : (Number(weekData.managementIndex) <= 0 ? 'Критично' : 'Зона риска')}
            </span>
          </div>
        </div>

        {/* КАРТОЧКА 2 - 1-я линия */}
        <div className="bg-slate-800 rounded-xl p-5 border-t-4 border-emerald-500 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> 1-я линия</h3>
            <div className="flex items-baseline gap-2 mb-1"><span className="text-4xl font-bold text-white">{Number(weekData.incidentsClosed) || 0}</span><span className="text-slate-500 text-sm font-medium">закрыто</span></div>
            <p className="text-xs text-slate-500 mt-1">Инциденты за неделю</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-700/50 flex justify-between items-center"><span className="text-slate-400 text-xs">В очереди:</span><span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold text-sm border border-emerald-500/20">{Number(weekData.incidentsQueue) || 0}</span></div>
        </div>
        
        {/* КАРТОЧКА 3 - Спринт */}
        <div className="bg-slate-800 rounded-xl p-5 border-t-4 border-amber-500 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Спринт (План)</h3>
            <div className="flex items-baseline gap-2 mb-1"><span className="text-4xl font-bold text-white">{Number(weekData.sprintCompleted) || 0}</span><span className="text-slate-500 text-sm font-medium">выполнено</span></div>
            <p className="text-xs text-amber-400 mt-1">Из {Number(weekData.sprintPlanned) || 0} запланированных</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-700/50 flex justify-between items-center"><span className="text-slate-400 text-xs">Перенесено:</span><span className="bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded font-bold text-sm border border-orange-500/20">{Number(weekData.sprintCarriedOver) || 0}</span></div>
        </div>
        
        {/* КАРТОЧКА 4 - Щит */}
        <div className="bg-slate-800 rounded-xl p-5 border-t-4 border-red-500 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div> Срочная (Щит)</h3>
            <div className="flex items-baseline gap-2 mb-1"><span className="text-4xl font-bold text-white">{Number(weekData.urgentCompleted) || 0}</span><span className="text-slate-500 text-sm font-medium">отбито</span></div>
            <p className="text-xs text-slate-500 mt-1">Внеплановый хаос</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-700/50 flex justify-between items-center"><span className="text-slate-400 text-xs">Активно в моменте:</span><span className="text-white font-bold">{Number(weekData.urgentQueue) || 0}</span></div>
        </div>
        
        {/* КАРТОЧКА 5 - Бэклог с Тултипом */}
        <div className="bg-slate-800 rounded-xl p-5 border-t-4 border-blue-500 shadow-sm relative flex flex-col justify-between z-10">
          <div>
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Бэклог</h3>
            <div className="flex flex-col gap-1 mb-1">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">{Number(weekData.backlog) || 0}</span>
                <span className="text-slate-500 text-sm font-medium">всего</span>
              </div>
              {prevWeekData && backlogTrend !== 0 && (
                <div className={`text-xs font-bold flex items-center gap-1 ${backlogTrend > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                   {backlogTrend > 0 ? <TrendingUp size={14} /> : <TrendingUp size={14} className="rotate-180" />}
                   {backlogTrend > 0 ? '+' : '-'}{Math.abs(backlogTrend)} к прошлой нед.
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">Закрыто напрямую: <span className="text-blue-400 font-bold">{Number(weekData.backlogCompleted) || 0}</span></p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-700/50 flex justify-between items-center">
            <span className="text-slate-400 text-xs">Старше 30 дней:</span>
            
            <div className="group relative flex items-center justify-center cursor-help">
              <span className="bg-red-500/10 text-red-400 px-2 py-0.5 rounded font-bold text-sm border border-red-500/20 flex items-center gap-1">
                <Clock size={12} /> {Number(weekData.backlogOld30) || 0}
              </span>
              
              {/* Всплывающее меню для старых задач (Stale Backlog) */}
              {weekData.staleBacklog && weekData.staleBacklog.length > 0 && (
                <div className="absolute bottom-full right-0 pb-3 w-[450px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <div className="p-5 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl text-xs text-slate-300 relative text-left cursor-auto pointer-events-auto">
                    <div className="font-bold text-red-400 mb-3 border-b border-slate-700 pb-2 text-sm flex items-center gap-1.5">
                      <AlertTriangle size={16}/> Топ старых задач (Кандидаты на Drop)
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                      {weekData.staleBacklog.map((stale, i) => (
                        <div key={i} className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/50">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-red-300 font-bold text-[13px]">{stale.id}</span>
                            <span className="text-slate-500 text-[11px] bg-slate-800 px-2 py-0.5 rounded">{stale.days} дн.</span>
                          </div>
                          <div className="text-slate-200 font-medium mb-2 leading-snug text-[13px]">{stale.title}</div>
                          <div className="text-[12px] text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded inline-block border border-emerald-500/20">Анализ: {stale.action}</div>
                        </div>
                      ))}
                    </div>
                    <div className="absolute top-full right-4 border-4 border-transparent border-t-slate-600"></div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* БЛОК: КАЧЕСТВО И СКОРОСТЬ (FLOW METRICS) */}
      <h2 className="text-lg font-medium text-white mb-4 mt-8 flex items-center gap-2"><GitMerge size={20} className="text-indigo-400" />Качество и Скорость (Flow Metrics)</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        
        {/* CYCLE TIME */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700/50 shadow-sm flex flex-col relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-5 -mt-2 -mr-2"><Clock size={100} /></div>
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2"><Clock size={14} className="text-blue-400"/> Среднее время решения</h3>
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex items-baseline gap-2 mb-1">
              <span className={`text-4xl font-black ${cycleColor}`}>{Number(weekData.avgCycleTime) || 0}</span>
              <span className="text-slate-500 text-sm font-medium">дней</span>
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">Среднее время от создания задачи до ее закрытия. Если мы закрываем много задач, но сроки их выполнения растут — значит, мы копим «незавершенку» (задачи висят в работе).</p>
          </div>
        </div>

        {/* REOPEN RATE */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700/50 shadow-sm flex flex-col relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-5 -mt-2 -mr-2"><RefreshCcw size={100} /></div>
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2"><RefreshCcw size={14} className="text-amber-400"/> Возвраты на доработку</h3>
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex items-baseline gap-2 mb-1">
              <span className={`text-4xl font-black ${reopenColor}`}>{Number(weekData.reopenRate) || 0}</span>
              <span className="text-slate-500 text-sm font-medium">%</span>
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">Доля задач, которые вернулись к администраторам после статуса "Закрыто" или "Готово". Высокий процент бьет по оценке удовлетворенности (CSAT) и съедает время команды.</p>
          </div>
        </div>

        {/* КАТЕГОРИИ ТЕХДОЛГА */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700/50 shadow-sm flex flex-col">
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2"><Archive size={14} className="text-fuchsia-400"/> Структура техдолга (Backlog)</h3>
          <div className="flex-1 flex flex-col space-y-3 overflow-y-auto custom-scrollbar max-h-48 pr-2">
             {weekData.techDebtCategories && weekData.techDebtCategories.length > 0 ? (
               weekData.techDebtCategories.map((c, i) => (
                 <div key={i} className="flex justify-between items-center text-sm border-b border-slate-700/50 pb-2 last:border-0 last:pb-0">
                    <span className="text-slate-300 font-medium truncate pr-2 whitespace-pre-wrap">{safeString(c.name)}</span>
                    <span className="bg-fuchsia-500/10 text-fuchsia-400 px-2 py-0.5 rounded font-bold text-xs border border-fuchsia-500/20">{Number(c.count) || 0}</span>
                 </div>
               ))
             ) : (
               <p className="text-xs text-slate-500 italic my-auto text-center">Нет данных о категориях техдолга</p>
             )}
          </div>
        </div>

      </div>

      {/* ИСТОРИЧЕСКИЙ ТРЕНД ЗА МЕСЯЦ */}
      {sortedKeys.length > 1 && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50 shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-medium text-slate-200 flex items-center gap-2"><Activity size={18} className="text-indigo-400" /> Динамика потока и Бэклога (Тренд)</h3>
              <span className="text-xs text-slate-400 bg-slate-900/80 px-2 py-1.5 rounded border border-slate-700/50">Исторические данные: {sortedKeys.length} нед.</span>
            </div>
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 20, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} fontSize={11} dy={10} />
                  <YAxis stroke="#64748b" tickLine={false} axisLine={false} fontSize={11} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }} 
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="Бэклог (Остаток)" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#0f172a' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Выполнено" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#0f172a' }} />
                  <Line type="monotone" dataKey="Приток" stroke="#a855f7" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3, fill: '#a855f7' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-500 mt-4 text-center italic">Если Выполнено больше Притока — бэклог сокращается. Идеальная картина — когда синяя линия идет вниз.</p>
        </div>
      )}

      {/* ТРУДОЕМКОСТЬ СПРИНТА (T-Shirt Sizing) И ТИПЫ РАБОТ */}
      {(weekData.taskComplexity?.length > 0 || weekData.sprintWin || weekData.sprintRisk || weekData.shieldHero || weekData.taskTypesDistribution?.length > 0) && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50 shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4">
          
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
            <div className="xl:col-span-2">
              {weekData.taskComplexity && weekData.taskComplexity.length > 0 && (
                <>
                  <h2 className="text-lg font-medium text-white mb-5 flex items-center gap-2"><Layers size={20} className="text-indigo-400" /> Трудоемкость выполненных задач (T-Shirt Sizing)</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {['S', 'M', 'L', 'XL'].map((size) => {
                      // ЗАЩИТА ОТ ГАЛЛЮЦИНАЦИЙ ИИ: проверяем оба ключа (size и name)
                      const taskInfo = weekData.taskComplexity.find(t => t.size === size || t.name === size);
                      const count = taskInfo ? Number(taskInfo.count) : 0;
                      const desc = taskInfo ? safeString(taskInfo.description) : 'Задач такого размера не было';
                      
                      // Фильтруем задачи этого размера для всплывающего окна
                      const tasksOfSize = (weekData.detailedTasks || []).filter(t => t.size === size && (t.status === 'Закрыт' || t.status === 'Готово' || t.status === 'Resolved' || t.status === 'Завершен' || t.resolved));

                      return (
                        <div key={size} className={`group relative p-4 rounded-xl border flex flex-col ${count > 0 ? 'bg-slate-900/80 border-slate-700/50 shadow-inner hover:border-indigo-500/50 transition-colors cursor-help' : 'bg-slate-900/30 border-slate-800/50 opacity-50'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <span className={`text-2xl font-black px-2.5 py-0.5 rounded-lg border-2 border-b-4 ${count > 0 ? getSizeColor(size) : 'bg-slate-800 text-slate-600 border-slate-700'}`}>{size}</span>
                            <span className="text-3xl font-bold text-slate-300">{count}</span>
                          </div>
                          <div className="mt-2 text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">{desc}</div>
                          
                          {/* TOOLTIP С ЗАДАЧАМИ ПО РАЗМЕРАМ */}
                          {count > 0 && tasksOfSize.length > 0 && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 pb-3 w-[500px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                              <div className="p-5 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl text-[12px] text-slate-300 text-left relative cursor-auto pointer-events-auto">
                                <div className="font-bold text-white mb-3 border-b border-slate-700 pb-3 text-sm flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded text-[12px] ${getSizeColor(size)} border`}>{size}</span>
                                    <span>Выполненные задачи ({tasksOfSize.length} шт.)</span>
                                  </div>
                                </div>
                                <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                                  {tasksOfSize.map((task, i) => (
                                    <div key={i} className="bg-slate-900/60 p-4 rounded-lg border border-slate-700/50 hover:border-indigo-500/50 transition-colors">
                                       <div className="flex justify-between items-start mb-2">
                                          <span className="text-indigo-400 font-bold text-[13px]">{task.id}</span>
                                          <span className="text-slate-400 text-[11px] truncate ml-2 max-w-[150px] bg-slate-800 px-2 py-1 rounded">{getFullName(task.assignee)}</span>
                                       </div>
                                       <div className="text-slate-200 font-medium leading-relaxed text-[13px] mb-2">{task.title}</div>
                                       {task.comments && task.comments !== "Нет данных" && (
                                           <div className="mt-2 text-[12px] text-slate-400 bg-slate-950/50 p-3 rounded-lg italic whitespace-pre-wrap leading-relaxed border-l-2 border-slate-700">
                                               {task.comments}
                                           </div>
                                       )}
                                    </div>
                                  ))}
                                </div>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-600"></div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* НОВЫЙ БЛОК: ТИПЫ РАБОТ */}
            <div className="xl:col-span-1 border-t xl:border-t-0 xl:border-l border-slate-700/50 pt-6 xl:pt-0 xl:pl-6">
               {weekData.taskTypesDistribution && weekData.taskTypesDistribution.length > 0 ? (
                 <>
                   <h2 className="text-lg font-medium text-white mb-5 flex items-center gap-2"><PieChartIcon size={20} className="text-fuchsia-400" /> Типы работ (Ценность vs Рутина)</h2>
                   <div className="space-y-3">
                     {weekData.taskTypesDistribution.map((item, idx) => (
                        <div key={idx} className="relative w-full bg-slate-900/50 rounded flex flex-col p-3 border border-slate-700/30 overflow-hidden">
                           <div className="absolute top-0 left-0 h-full opacity-20 bg-fuchsia-500" style={{ width: `${item.percent}%` }}></div>
                           <div className="relative z-10 flex justify-between items-center text-sm">
                              <span className="text-slate-200 font-medium truncate pr-2">{safeString(item.name)}</span>
                              <span className="text-fuchsia-400 font-bold shrink-0">{Number(item.percent)}%</span>
                           </div>
                        </div>
                     ))}
                   </div>
                 </>
               ) : (
                 <div className="h-full flex flex-col items-center justify-center opacity-50">
                    <PieChartIcon size={32} className="text-slate-500 mb-2" />
                    <p className="text-xs text-slate-400 text-center">Нет данных о типах работ.<br/>Обновите выгрузку.</p>
                 </div>
               )}
            </div>
          </div>

          {(weekData.sprintWin || weekData.sprintRisk || weekData.shieldHero) && (
            <div className={`grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch ${weekData.taskComplexity?.length > 0 ? 'pt-6 border-t border-slate-700/50' : ''}`}>
               {weekData.sprintWin && (
                 <div className="bg-emerald-500/5 p-4 rounded-lg border border-emerald-500/20 h-full flex flex-col">
                   <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><CheckCircle size={14}/> Победа спринта</h4>
                   <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{safeString(weekData.sprintWin)}</p>
                 </div>
               )}
               {weekData.sprintRisk && (
                 <div className="bg-amber-500/5 p-4 rounded-lg border border-amber-500/20 h-full flex flex-col">
                   <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><ShieldAlert size={14}/> Риск / Бэклог</h4>
                   <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{safeString(weekData.sprintRisk)}</p>
                 </div>
               )}
               {weekData.shieldHero && (
                 <div className="bg-indigo-500/5 p-4 rounded-lg border border-indigo-500/20 h-full flex flex-col">
                   <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Shield size={14}/> Герой щита (Срочная линия)</h4>
                   {/* ПЕРЕВОДИМ ИМЯ ГЕРОЯ ЩИТА НА ЛЕТУ */}
                   <p className="text-sm text-slate-300">{replaceLoginsWithNames(weekData.shieldHero)}</p>
                 </div>
               )}
            </div>
          )}
        </div>
      )}

      <h2 className="text-lg font-medium text-white mb-4 mt-8 flex items-center gap-2"><Sparkles size={20} className="text-indigo-400" />Глубокая аналитика потока</h2>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50 shadow-sm">
          <h3 className="text-base font-medium text-slate-200 flex items-center gap-2 mb-5"><Timer size={18} className="text-red-400" /> Мониторинг SLA</h3>
          <div className="space-y-4">
            {weekData.slaMetrics && weekData.slaMetrics.map((sla, idx) => (
              <div key={idx} className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 flex justify-between items-center">
                <div><h4 className="text-sm font-medium text-slate-300">{safeString(sla.name) || 'Неизвестно'}</h4><p className="text-xs text-slate-500 mt-1">Ср. время просрочки: <span className="text-red-400 font-bold">{Number(sla.avgOverdueMin) || 0} мин</span></p></div>
                <div className="text-center bg-red-500/10 px-3 py-1.5 rounded border border-red-500/20"><span className="block text-lg font-bold text-red-400 leading-none">{Number(sla.violations) || 0}</span><span className="text-[10px] text-red-400/80 uppercase">нарушений</span></div>
              </div>
            ))}
            {(!weekData.slaMetrics || weekData.slaMetrics.length === 0) && <p className="text-sm text-slate-500">Нет данных по SLA</p>}
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50 shadow-sm xl:col-span-2 flex flex-col gap-6">
          
          {/* ТАБЛИЦА 1: ИНЦИДЕНТЫ (topPerformers) */}
          <div className="flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-base font-medium text-slate-200 flex items-center gap-2"><Users size={18} className="text-emerald-400" /> Нагрузка: 1-я линия (Инциденты)</h3>
              <span className="text-[10px] bg-slate-900 text-slate-500 px-2 py-1 rounded border border-slate-700/50 uppercase tracking-wider">Аналитика для Этапа 2</span>
            </div>
            <div className="overflow-visible custom-scrollbar pb-8">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="pb-3 font-medium">Исполнитель</th>
                    <th className="pb-3 font-medium text-center" title="Work in Progress (Открыто сейчас)">WIP</th>
                    <th className="pb-3 font-medium text-center">Закрыто</th>
                    <th className="pb-3 font-medium text-center">Ср. Время</th>
                    <th className="pb-3 font-medium text-center">Профиль</th>
                    <th className="pb-3 font-medium text-center">Логирование</th>
                    <th className="pb-3 font-medium text-center">Возвраты</th>
                    <th className="pb-3 font-medium text-center">CSAT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {filteredTopPerformers.map((perf, idx) => {
                    let commentsFreq = perf.commentsFreq;
                    if (typeof commentsFreq === 'number') {
                      commentsFreq = commentsFreq > 15 ? 'Высокая' : (commentsFreq >= 5 ? 'Средняя' : 'Низкая');
                    } else {
                      commentsFreq = safeString(perf.commentsFreq) || 'Низкая';
                    }
                    const contextStr = safeString(perf.taskContext);
                    
                    const reopenedList = Array.isArray(perf.reopenedTasks) ? perf.reopenedTasks : [];
                    const reopenedCount = reopenedList.length > 0 ? reopenedList.length : (Number(perf.reopenedTasks) || 0);
                    
                    const droppedList = Array.isArray(perf.droppedTasks) ? perf.droppedTasks : [];
                    const droppedCount = droppedList.length > 0 ? droppedList.length : (Number(perf.droppedTasks) || 0);

                    // Обработка отзывов пользователей: новый справочник IS -> отзыв + fallback на старый JSON
                    const csatTooltipItems = buildCsatTooltipItems(perf);

                    return (
                      <tr key={idx} className="hover:bg-slate-900/30 transition-colors">
                        <td className="py-3 font-medium text-slate-200">{getFullName(perf.name)}</td>
                        <td className="py-3 text-center">
                          <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">{Number(perf.wip) || 0}</span>
                        </td>
                        
                        <td className="py-3 text-center">
                          <div className="text-white font-bold">{Number(perf.closed) || 0}</div>
                          {droppedCount > 0 && (
                            <div className="group relative flex items-center justify-center mt-1 cursor-help">
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-500/30 text-slate-300 border border-slate-500/40">
                                -{droppedCount} безд.
                              </span>
                              {droppedList.length > 0 && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 pb-3 w-[350px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                  <div className="p-4 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl text-[12px] text-slate-300 text-left relative cursor-auto pointer-events-auto">
                                    <div className="font-bold text-slate-300 mb-2 border-b border-slate-700 pb-2 text-sm">Закрыто по бездействию:</div>
                                    <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                                      {droppedList.map((dt, i) => (
                                        <div key={i} className="leading-tight bg-slate-900/60 p-3 rounded-lg border border-slate-700/50">
                                          <span className="text-slate-300 font-bold text-[13px]">{dt.id}</span><br/>
                                          <span className="truncate block w-full text-[12px] text-slate-400 mt-1">{dt.title}</span>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-600"></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        
                        <td className="py-3 text-center text-slate-400">{Number(perf.avgTimeMin) || 0} м</td>
                        <td className="py-3 text-center">{getContextBadge(contextStr)}</td>
                        <td className="py-3 text-center"><span className={`text-[10px] px-2 py-1 rounded-full uppercase tracking-wider font-bold ${commentsFreq === 'Высокая' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : commentsFreq === 'Средняя' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>{commentsFreq}</span></td>
                        
                        <td className="py-3 text-center">
                          {reopenedCount > 0 ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                                {reopenedCount} шт.
                              </span>
                              {reopenedList.length > 0 && (
                                <div className="flex flex-wrap justify-center gap-1 max-w-[120px]">
                                  {reopenedList.map((taskItem, i) => {
                                    const tId = typeof taskItem === 'object' ? taskItem.id : taskItem;
                                    const tReason = typeof taskItem === 'object' ? taskItem.reason : 'Причина не проанализирована';
                                    const tTitle = typeof taskItem === 'object' && taskItem.title ? taskItem.title : '';
                                    return (
                                      <div key={i} className="group relative">
                                        <span className="text-[9px] text-slate-400 border-b border-slate-600 border-dashed cursor-help hover:text-white transition-colors">
                                          {tId}
                                        </span>
                                        {/* УЛУЧШЕННЫЙ ТУЛТИП ВОЗВРАТА */}
                                        <div className="absolute top-full right-0 pt-3 w-[450px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                          <div className="p-5 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl text-[12px] text-slate-300 text-left relative cursor-auto pointer-events-auto">
                                            <div className="max-h-72 overflow-y-auto custom-scrollbar pr-2">
                                              <div className="font-bold text-amber-400 mb-2 border-b border-slate-700 pb-2 text-sm">Возврат: {tId}</div>
                                              {tTitle && <div className="text-[13px] text-white font-bold mb-3 line-clamp-3 leading-snug">{tTitle}</div>}
                                              <div className="text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-lg whitespace-pre-wrap text-[13px]">{tReason}</div>
                                            </div>
                                            <div className="absolute bottom-full right-4 border-4 border-transparent border-b-slate-600"></div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>

                        <td className="py-3 text-center">
                          <div className="group relative flex items-center justify-center gap-1 cursor-help">
                            <Star size={14} className={Number(perf.csat) >= 4.8 ? "text-amber-400 fill-amber-400" : Number(perf.csat) >= 4.0 ? "text-amber-400" : "text-slate-500"} />
                            <span className={Number(perf.csat) >= 4.8 ? "text-amber-400 font-bold" : "text-slate-300"}>{formatCSAT(perf.csat)}</span>
                            {renderCsatTooltip(csatTooltipItems)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {(!filteredTopPerformers || filteredTopPerformers.length === 0) && <tr><td colSpan="8" className="py-4 text-center text-slate-500">Данные не загружены</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* ТАБЛИЦА 2: ЗАДАЧИ (taskPerformers) */}
          {weekData.taskPerformers && weekData.taskPerformers.length > 0 && (
            <div className="flex-1 flex flex-col pt-6 border-t border-slate-700/50">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-base font-medium text-slate-200 flex items-center gap-2"><Server size={18} className="text-blue-400" /> Нагрузка: Инфраструктура (Задачи)</h3>
              </div>
              <div className="overflow-visible custom-scrollbar pb-8">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider">
                      <th className="pb-3 font-medium">Исполнитель</th>
                      <th className="pb-3 font-medium text-center" title="Work in Progress (Открыто сейчас)">WIP</th>
                      <th className="pb-3 font-medium text-center">Закрыто</th>
                      <th className="pb-3 font-medium text-center">Cycle Time</th>
                      <th className="pb-3 font-medium text-center">Профиль</th>
                      <th className="pb-3 font-medium text-center">Логирование</th>
                      <th className="pb-3 font-medium text-center">Возвраты</th>
                      <th className="pb-3 font-medium text-center">Качество</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {filteredTaskPerformers.map((perf, idx) => {
                      let commentsFreq = perf.commentsFreq;
                      if (typeof commentsFreq === 'number') {
                        commentsFreq = commentsFreq > 15 ? 'Высокая' : (commentsFreq >= 5 ? 'Средняя' : 'Низкая');
                      } else {
                        commentsFreq = safeString(perf.commentsFreq) || 'Низкая';
                      }
                      const contextStr = safeString(perf.taskContext);
                      
                      const reopenedList = Array.isArray(perf.reopenedTasks) ? perf.reopenedTasks : [];
                      const reopenedCount = reopenedList.length > 0 ? reopenedList.length : (Number(perf.reopenedTasks) || 0);

                      const droppedList = Array.isArray(perf.droppedTasks) ? perf.droppedTasks : [];
                      const droppedCount = droppedList.length > 0 ? droppedList.length : (Number(perf.droppedTasks) || 0);

                      // Обработка отзывов пользователей
                      const csatCommentsList = Array.isArray(perf.csatComments) ? perf.csatComments : [];

                      let calculatedTechDebt = Array.isArray(perf.techDebtClosed) ? perf.techDebtClosed : [];
                      // Если ИИ забыл добавить техдолг внутрь профиля, дашборд вычисляет его сам
                      if ((!calculatedTechDebt || calculatedTechDebt.length === 0) && weekData.detailedTasks) {
                         calculatedTechDebt = weekData.detailedTasks
                            .filter(t => {
                               const isClosed = t.status === 'Закрыт' || t.status === 'Готово' || t.status === 'Resolved' || t.status === 'Завершен' || t.resolved;
                               const isSameAssignee = getFullName(t.assignee) === getFullName(perf.name) || t.assignee === perf.name;
                               const isOld = (Number(t.cycleTime) || 0) >= 30;
                               return isClosed && isSameAssignee && isOld;
                            })
                            .map(t => ({ id: t.id, days: Number(t.cycleTime) || 0, title: t.title }));
                      }
                      const tdCount = calculatedTechDebt.length > 0 ? calculatedTechDebt.length : (typeof perf.techDebtClosed === 'number' ? perf.techDebtClosed : 0);

                      return (
                        <tr key={idx} className="hover:bg-slate-900/30 transition-colors">
                          <td className="py-3 font-medium text-slate-200">{getFullName(perf.name)}</td>
                          <td className="py-3 text-center">
                            <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">{Number(perf.wip) || 0}</span>
                          </td>
                          
                          <td className="py-3 text-center">
                            <div className="text-white font-bold">{Number(perf.closed) || 0}</div>
                            {droppedCount > 0 && (
                              <div className="group relative flex items-center justify-center mt-1 cursor-help">
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-500/30 text-slate-300 border border-slate-500/40">
                                  -{droppedCount} безд.
                                </span>
                                {droppedList.length > 0 && (
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 pb-3 w-[350px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                    <div className="p-4 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl text-[12px] text-slate-300 text-left relative cursor-auto pointer-events-auto">
                                      <div className="font-bold text-slate-300 mb-2 border-b border-slate-700 pb-2 text-sm">Закрыто по бездействию:</div>
                                      <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                                        {droppedList.map((dt, i) => (
                                          <div key={i} className="leading-tight bg-slate-900/60 p-3 rounded-lg border border-slate-700/50">
                                            <span className="text-slate-300 font-bold text-[13px]">{dt.id}</span><br/>
                                            <span className="truncate block w-full text-[12px] text-slate-400 mt-1">{dt.title}</span>
                                          </div>
                                        ))}
                                      </div>
                                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-600"></div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          
                          {/* CYCLE TIME С БЕЙДЖОМ ТЕХДОЛГА И ЗАЩИТОЙ ОТ ПУСТОГО МАССИВА */}
                          <td className="py-3 text-center text-slate-400">
                            <div className="flex flex-col items-center gap-1">
                              <span>{Number(perf.avgTimeMin) || 0} дн.</span>
                              {tdCount > 0 && (
                                <div className="group relative flex items-center justify-center cursor-help">
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                    +{tdCount} стар.
                                  </span>
                                  {calculatedTechDebt.length > 0 && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 pb-3 w-[450px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                      <div className="p-5 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl text-[12px] text-slate-300 text-left relative cursor-auto pointer-events-auto">
                                        <div className="font-bold text-purple-400 mb-3 border-b border-slate-700 pb-2 text-sm">Закрыт старый долг ({'>'}30 дн):</div>
                                        <div className="space-y-3 max-h-72 overflow-y-auto custom-scrollbar pr-2">
                                          {calculatedTechDebt.map((td, i) => (
                                            <div key={i} className="leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-700/50">
                                              <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-purple-300 font-bold text-[13px]">{td.id}</span>
                                                <span className="text-slate-400 font-medium text-[11px]">({td.days} дн.)</span>
                                              </div>
                                              <div className="text-slate-200 text-[13px] leading-snug">{td.title}</div>
                                            </div>
                                          ))}
                                        </div>
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-600"></div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="py-3 text-center">{getContextBadge(contextStr, { placement: 'bottom', isTopTaskLeader: idx === 0 })}</td>
                          <td className="py-3 text-center"><span className={`text-[10px] px-2 py-1 rounded-full uppercase tracking-wider font-bold ${commentsFreq === 'Высокая' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : commentsFreq === 'Средняя' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>{commentsFreq}</span></td>
                          
                          <td className="py-3 text-center">
                            {reopenedCount > 0 ? (
                              <div className="flex flex-col items-center gap-1">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                                  {reopenedCount} шт.
                                </span>
                                {reopenedList.length > 0 && (
                                  <div className="flex flex-wrap justify-center gap-1 max-w-[120px]">
                                    {reopenedList.map((taskItem, i) => {
                                      const tId = typeof taskItem === 'object' ? taskItem.id : taskItem;
                                      const tReason = typeof taskItem === 'object' ? taskItem.reason : 'Причина не проанализирована';
                                      const tTitle = typeof taskItem === 'object' && taskItem.title ? taskItem.title : '';
                                      return (
                                        <div key={i} className="group relative">
                                          <span className="text-[9px] text-slate-400 border-b border-slate-600 border-dashed cursor-help hover:text-white transition-colors">
                                            {tId}
                                          </span>
                                          {/* УЛУЧШЕННЫЙ ТУЛТИП ВОЗВРАТА */}
                                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 pb-3 w-[450px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                            <div className="p-5 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl text-[12px] text-slate-300 text-left relative cursor-auto pointer-events-auto">
                                              <div className="max-h-72 overflow-y-auto custom-scrollbar pr-2">
                                                <div className="font-bold text-amber-400 mb-2 border-b border-slate-700 pb-2 text-sm">Возврат: {tId}</div>
                                                {tTitle && <div className="text-[13px] text-white font-bold mb-3 line-clamp-3 leading-snug">{tTitle}</div>}
                                                <div className="text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-lg whitespace-pre-wrap text-[13px]">{tReason}</div>
                                              </div>
                                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-600"></div>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>

                          <td className="py-3 text-center">
                            <div className="group relative flex items-center justify-center gap-1 cursor-help">
                              <ShieldCheck size={14} className={Number(perf.csat) >= 4.8 ? "text-emerald-400" : "text-amber-400"} />
                              <span className={Number(perf.csat) >= 4.8 ? "text-amber-400 font-bold" : "text-slate-300"}>{formatCSAT(perf.csat)}</span>
                              {csatCommentsList.length > 0 && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 pb-3 w-[450px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                  <div className="p-5 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl text-[12px] text-slate-300 text-left relative cursor-auto pointer-events-auto">
                                    <div className="font-bold text-emerald-400 mb-2 border-b border-slate-700 pb-2 text-sm">Отзывы пользователей:</div>
                                    <div className="space-y-3 max-h-72 overflow-y-auto custom-scrollbar pr-2">
                                      {csatCommentsList.map((comment, i) => (
                                        <div key={i} className="leading-relaxed bg-slate-900/60 p-3 rounded-lg whitespace-pre-wrap italic text-[13px]">"{comment}"</div>
                                      ))}
                                    </div>
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-600"></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-medium text-slate-200 flex items-center gap-2"><PieChart size={18} className="text-emerald-400" /> Топ инцидентов (Семантика)</h3>
            <span className="text-xs font-bold text-slate-400 bg-slate-900 px-2 py-1 rounded">Всего: {totalIncidentsFromList} / {Number(weekData.incidentsClosed)||0}</span>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto max-h-[400px] pr-3 custom-scrollbar">
            {sortedIncidents.map((inc, idx) => {
              const count = Number(inc.count) || 0;
              const totalIncidentsCount = Number(weekData.incidentsClosed) || 1;
              const percent = totalIncidentsCount > 0 ? Math.round((count / totalIncidentsCount) * 100) : 0;
              let bgColor = 'bg-slate-500'; let textColor = 'text-slate-400'; let accentColor = '#64748b';
              if (idx === 0) { bgColor = 'bg-red-500'; textColor = 'text-red-400'; accentColor = '#ef4444'; } 
              else if (idx === 1) { bgColor = 'bg-orange-500'; textColor = 'text-orange-400'; accentColor = '#f97316'; } 
              else if (idx === 2) { bgColor = 'bg-amber-500'; textColor = 'text-amber-400'; accentColor = '#f59e0b'; }
              
              return (
                <div key={idx} className="relative w-full bg-slate-900/50 rounded flex flex-col p-3 border border-slate-700/30 overflow-hidden group gap-2">
                  <div className={`absolute top-0 left-0 h-full opacity-10 transition-all duration-500 ${bgColor}`} style={{ width: `${percent}%` }}></div>
                  <div className="relative w-full flex justify-between items-start z-10 text-sm">
                    <span className={`pr-4 text-slate-200 font-medium leading-snug`}>{idx + 1}. {safeString(inc.name) || 'Не указано'}</span>
                    <div className="flex items-center gap-3 shrink-0 mt-0.5"><span className="text-slate-500 text-xs w-8 text-right">{percent}%</span><span className={`font-bold w-8 text-right ${textColor}`}>{count}</span></div>
                  </div>
                  {inc.analysis && (
                    <div className="relative z-10 text-xs text-slate-400 bg-slate-950/40 p-2.5 rounded border border-slate-700/50 leading-relaxed border-l-2 shadow-inner whitespace-pre-wrap">
                      <div className="font-bold text-slate-300 mb-1 flex items-center gap-1.5"><FileSearch size={12} className="opacity-70" /> Анализ</div>{safeString(inc.analysis)}
                    </div>
                  )}
                </div>
              );
            })}
            {sortedIncidents.length === 0 && <p className="text-slate-500 text-sm">Нет данных по инцидентам</p>}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50 shadow-sm h-56 flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2"><Activity size={16} className="text-blue-400"/> Выполнение плана vs Хаос</h3>
              <span className="text-xs text-slate-500">Закрыто: {(Number(weekData.sprintCompleted) || 0) + (Number(weekData.urgentCompleted) || 0) + (Number(weekData.backlogCompleted) || 0)}</span>
            </div>
            <div className="flex-1 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} fontSize={10} dy={5} />
                  <YAxis stroke="#64748b" tickLine={false} axisLine={false} fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#f8fafc', fontSize: '12px' }} cursor={{ fill: '#334155', opacity: 0.3 }} />
                  <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} iconType="circle" />
                  <Bar dataKey="Спринт" name="Спринт (План)" fill="#f59e0b" radius={[0, 0, 0, 0]} stackId="a" maxBarSize={40} />
                  <Bar dataKey="Бэклог" name="Из бэклога" fill="#3b82f6" radius={[0, 0, 0, 0]} stackId="a" maxBarSize={40} />
                  <Bar dataKey="Срочная" name="Срочная (Щит)" fill="#ef4444" radius={[2, 2, 0, 0]} stackId="a" maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50 flex-1 flex flex-col justify-center shadow-sm">
             <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-2"><BookOpen size={16}/> Обучение и корректировка процесса</span>
             <p className="text-sm text-emerald-400 font-medium leading-relaxed whitespace-pre-wrap">{safeString(weekData.trainingHypothesis)}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-slate-800 rounded-xl border border-slate-700/50 shadow-sm overflow-hidden mb-8">
        <div className="bg-indigo-500/10 p-5 border-b border-indigo-500/20 flex items-center gap-3">
          <Sparkles size={24} className="text-indigo-400" />
          <div><h2 className="text-lg font-bold text-white">Управленческий синтез недели</h2><p className="text-xs text-indigo-300/70">Выявление системных узких мест на основе NLP-анализа инцидентов</p></div>
        </div>
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="flex flex-col gap-3"><div className="flex items-center gap-2"><CheckCircle size={18} className="text-emerald-400" /><h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Главный инсайт потока</h3></div><div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 flex-1 h-full"><p className="text-slate-300 leading-relaxed text-sm whitespace-pre-wrap">{safeString(weekData.mainInsight)}</p></div></div>
          <div className="flex flex-col gap-3"><div className="flex items-center gap-2"><AlertTriangle size={18} className="text-amber-400" /><h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Критический риск SLA</h3></div><div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 flex-1 h-full"><p className="text-slate-300 leading-relaxed text-sm whitespace-pre-wrap">{safeString(weekData.mainRisk)}</p></div></div>
          <div className="flex flex-col gap-3"><div className="flex items-center gap-2"><Target size={18} className="text-blue-400" /><h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider">План расшивки горлышка</h3></div><div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 flex-1 h-full"><p className="text-slate-300 leading-relaxed text-sm whitespace-pre-wrap">{safeString(weekData.nextFocus)}</p></div></div>
        </div>
      </div>

      {weekData.blockersAndWaste && (
        <div className="bg-slate-800 rounded-xl border border-slate-700/50 shadow-sm overflow-hidden mb-8">
          <div className="bg-fuchsia-500/10 p-5 border-b border-fuchsia-500/20 flex items-center gap-3">
            <div className="bg-fuchsia-500/20 p-2 rounded-lg"><Trash2 size={24} className="text-fuchsia-400" /></div>
            <div>
              <h2 className="text-lg font-bold text-white">Аудит затыков (Матрица Эйзенхауэра)</h2>
              <p className="text-xs text-fuchsia-300/70">Выявление неактуальных задач и блокеров в процессе Delivery</p>
            </div>
          </div>
          <div className="p-6">
            <p className="text-slate-300 leading-relaxed text-sm whitespace-pre-wrap">{safeString(weekData.blockersAndWaste)}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// --- ВКЛАДКА: ЗАПОЛНИТЬ НЕДЕЛЮ ---

const FillWeekForm = ({ historyKeys, selectedKey, onWeekSelect, weekData, onSaveWeek, setProfiles, setTasksArchive, weeksHistory, csatReviews, setCsatReviews }) => {
  const [formData, setFormData] = useState(weekData);
  const [isSaved, setIsSaved] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importStatus, setImportStatus] = useState(null);
  const [importCsatText, setImportCsatText] = useState('');
  const [csatImportStatus, setCsatImportStatus] = useState(null);
  const [lastCsatPreview, setLastCsatPreview] = useState([]);

  // Новый стейт для телефонии
  const [importTelephonyText, setImportTelephonyText] = useState('');
  const [telephonyStatus, setTelephonyStatus] = useState(null);

  const [selectedYear, setSelectedYear] = useState(formData.year !== undefined ? formData.year : new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(formData.month !== undefined ? formData.month : new Date().getMonth());
  const [weeksOptions, setWeeksOptions] = useState([]);

  useEffect(() => {
    setFormData(weekData);
    setSelectedYear(weekData.year);
    setSelectedMonth(weekData.month);
  }, [weekData]);

  useEffect(() => {
    const generatedWeeks = generateMonthWeeks(selectedYear, selectedMonth);
    setWeeksOptions(generatedWeeks);
    const currentWeekValid = generatedWeeks.find(w => w.weekNumber === formData.weekNumber);
    if (!currentWeekValid && generatedWeeks.length > 0) {
      setFormData(prev => ({ ...prev, year: selectedYear, month: selectedMonth, weekNumber: generatedWeeks[0].weekNumber, dates: generatedWeeks[0].dates }));
    } else {
      setFormData(prev => ({ ...prev, year: selectedYear, month: selectedMonth }));
    }
  }, [selectedYear, selectedMonth]);

  const handleChange = (e) => {
    const value = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
    setIsSaved(false);
  };

  const handleIncidentChange = (index, field, value) => {
    const newIncidents = [...(formData.topIncidents || [])];
    newIncidents[index] = { ...newIncidents[index], [field]: field === 'count' ? Number(value) : value };
    setFormData({ ...formData, topIncidents: newIncidents });
    setIsSaved(false);
  };

  const addRow = () => { setFormData({ ...formData, topIncidents: [...(formData.topIncidents||[]), { name: '', count: 0, analysis: '' }] }); setIsSaved(false); };
  const delRow = (index) => { const newIncidents = (formData.topIncidents||[]).filter((_, i) => i !== index); setFormData({ ...formData, topIncidents: newIncidents }); setIsSaved(false); };

  const handleImportData = () => {
    try {
      let cleanJson = importJson;
      const firstIdx = cleanJson.indexOf('{');
      const lastIdx = cleanJson.lastIndexOf('}');
      if (firstIdx !== -1 && lastIdx !== -1) {
        cleanJson = cleanJson.substring(firstIdx, lastIdx + 1);
      } else {
        // Если нет скобок, это явно не JSON (например, случайно вставлен текст телефонии)
        throw new Error("Invalid JSON structure");
      }
      
      cleanJson = cleanJson.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
      cleanJson = cleanJson.replace(/,\s*([\]}])/g, '$1');
      cleanJson = cleanJson.replace(/[\n\r\t]+/g, ' ');

      const parsedData = JSON.parse(cleanJson);
      
      // ЗАЩИТА ОТ ОШИБКИ ИИ (Если прислал CSAT вместо Индекса 0-100)
      let newIndex = parsedData.managementIndex !== undefined ? parsedData.managementIndex : formData.managementIndex;
      if (newIndex > 0 && newIndex <= 5) {
          newIndex = Math.round(newIndex * 20); // Превращаем 4.4 в 88
      }
      
      let finalData = { ...formData, ...parsedData, managementIndex: newIndex };
      
      // ОПРЕДЕЛЯЕМ ТИП ИМПОРТА (Задачи или Инциденты)
      const isTasksImport = parsedData.taskPerformers && parsedData.taskPerformers.length > 0;
      const isIncidentsImport = parsedData.topPerformers && parsedData.topPerformers.length > 0;
      
      // УМНОЕ СЛИЯНИЕ (Защита от затирания метрик)
      // Если импортируем Задачи, то защищаем метрики Инцидентов от обнуления
      if (isTasksImport && !isIncidentsImport) {
          if (parsedData.incidentsClosed === 0 || parsedData.incidentsClosed === undefined) finalData.incidentsClosed = formData.incidentsClosed;
          if (parsedData.incidentsQueue === 0 || parsedData.incidentsQueue === undefined) finalData.incidentsQueue = formData.incidentsQueue;
          if (!parsedData.topPerformers || parsedData.topPerformers.length === 0) finalData.topPerformers = formData.topPerformers;
          if (!parsedData.topIncidents || parsedData.topIncidents.length === 0) finalData.topIncidents = formData.topIncidents;
      }
      
      // Если импортируем Инциденты, то защищаем метрики Задач от обнуления
      if (isIncidentsImport && !isTasksImport) {
          const taskFields = ['sprintPlanned', 'sprintCompleted', 'sprintCarriedOver', 'urgentCompleted', 'urgentQueue', 'backlog', 'backlogOld30', 'backlogCompleted'];
          taskFields.forEach(field => {
              if (parsedData[field] === 0 || parsedData[field] === undefined) finalData[field] = formData[field];
          });
          if (!parsedData.taskPerformers || parsedData.taskPerformers.length === 0) finalData.taskPerformers = formData.taskPerformers;
          if (!parsedData.taskComplexity || parsedData.taskComplexity.length === 0) finalData.taskComplexity = formData.taskComplexity;
          if (!parsedData.taskTypesDistribution || parsedData.taskTypesDistribution.length === 0) finalData.taskTypesDistribution = formData.taskTypesDistribution;
          if (!parsedData.techDebtCategories || parsedData.techDebtCategories.length === 0) finalData.techDebtCategories = formData.techDebtCategories;
          if (!parsedData.staleBacklog || parsedData.staleBacklog.length === 0) finalData.staleBacklog = formData.staleBacklog;
      }

      // detailedTasks для task-импорта заменяют текущую неделю, чтобы повторная загрузка не раздувала отчет.
      // Для смешанных JSON оставляем старое безопасное слияние.
      let mergedDetailedTasks = formData.detailedTasks || [];
      if (parsedData.detailedTasks && Array.isArray(parsedData.detailedTasks)) {
         const seenImportedIds = new Set();
         const importedDetailedTasks = parsedData.detailedTasks.filter(t => {
            const id = safeString(t.id).trim();
            if (!id || seenImportedIds.has(id)) return false;
            seenImportedIds.add(id);
            return true;
         });

         if (isTasksImport && !isIncidentsImport) {
            mergedDetailedTasks = importedDetailedTasks;
         } else {
            const existingIds = new Set(mergedDetailedTasks.map(t => safeString(t.id).trim()).filter(Boolean));
            const newTasks = importedDetailedTasks.filter(t => !existingIds.has(safeString(t.id).trim()));
            mergedDetailedTasks = [...newTasks, ...mergedDetailedTasks];
         }
      }
      finalData.detailedTasks = mergedDetailedTasks;

      if (parsedData.detailedTasks && Array.isArray(parsedData.detailedTasks)) {
         setTasksArchive(prev => {
            const existingIds = new Set(prev.map(t => t.id));
            const newTasks = parsedData.detailedTasks.filter(t => t.id && !existingIds.has(t.id));
            return [...newTasks, ...prev];
         });
      }

      setFormData(finalData);
      setImportStatus('success');
      setImportJson(''); 
      setTimeout(() => setImportStatus(null), 3000);
      setIsSaved(false);
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      
    } catch (e) {
      console.error("JSON parse error:", e);
      setImportStatus('error');
      setTimeout(() => setImportStatus(null), 3000);
    }
  };

  // ПАРСЕР ТЕЛЕФОНИИ И ГЕНЕРАТОР АНАЛИТИКИ С УЧЕТОМ АВАРИЙ
  const generateTelephonyInsight = (teleData, jiraData, totalIncClosed, topIncName) => {
    let insights = [];
    let firstLineMissed = 0;
    let firstLineTotal = 0;
    const effectiveTotalIncClosed = (jiraData || []).reduce((sum, p) => sum + (Number(p.closed) || 0), 0) || (Number(totalIncClosed) || 0);
    const normalizePersonName = (name) => safeString(name).toLowerCase().replace(/ё/g, 'е').replace(/[^а-яa-z\s-]/g, ' ').replace(/\s+/g, ' ').trim();
    const getPersonTokens = (name) => normalizePersonName(name).split(/[\s-]+/).filter(part => part.length > 1);
    const findJiraPerformer = (operatorName) => {
        const opTokens = getPersonTokens(operatorName);
        if (opTokens.length === 0 || !jiraData || jiraData.length === 0) return null;

        const candidates = jiraData.map(p => ({
            performer: p,
            tokens: getPersonTokens(getFullName(p.name)),
            rawTokens: getPersonTokens(p.name)
        }));

        const exact = candidates.find(c => {
            const allTokens = [...new Set([...c.tokens, ...c.rawTokens])];
            return opTokens.length >= 2 && opTokens.every(token => allTokens.includes(token));
        });
        if (exact) return exact.performer;

        if (opTokens.length === 1) {
            const bySingleToken = candidates.filter(c => [...new Set([...c.tokens, ...c.rawTokens])].includes(opTokens[0]));
            return bySingleToken.length === 1 ? bySingleToken[0].performer : null;
        }

        return null;
    };
    
    // --- НОВАЯ ЛОГИКА: ИЩЕМ АБСОЛЮТНОГО ЛИДЕРА ---
    let topPerformer = null;
    let maxClosed = 0;
    if (jiraData && jiraData.length > 0) {
        jiraData.forEach(p => {
            const closed = Number(p.closed) || 0;
            if (closed > maxClosed) {
                maxClosed = closed;
                topPerformer = p.name;
            }
        });
    }
    if (topPerformer && maxClosed > 0) {
        insights.push(`🏆 ${getFullName(topPerformer)} — абсолютный лидер (закрыто ${maxClosed} тикетов). Отличная работа!`);
    }
    // ----------------------------------------------
    
    // Ключевые слова для определения 1-й линии
    const FIRST_LINE_KEYWORDS = ["Отрошко", "Гуртов", "Соколов", "Лысов", "Нестеров", "стажер", "младший"];
    
    teleData.forEach(op => {
        const isFirstLine = FIRST_LINE_KEYWORDS.some(k => op.name.toLowerCase().includes(k.toLowerCase()));
        
        if (isFirstLine) {
            firstLineTotal += op.total;
            firstLineMissed += op.missed; 

            let perf = findJiraPerformer(op.name);
            let closedTickets = perf ? perf.closed : 0;

            if (op.missed > 0) {
                if (closedTickets >= 80) { 
                    insights.push(`🔥 ${op.name}: Пропущено ${op.missed} вызовов. Причина: Перегруз (закрыто ${closedTickets} тикетов, норма 50-60). Зона риска выгорания!`);
                } else if (closedTickets >= 50) {
                    if (op.missed <= 15) {
                        insights.push(`👀 ${op.name}: Норма в Jira выполнена (${closedTickets}), небольшой фон пропущенных (${op.missed}). Ситуация рабочая.`);
                    } else {
                        insights.push(`⚠️ ${op.name}: Норма в Jira выполнена (${closedTickets}), но пропущенных много (${op.missed}). Проверить статусы АТС.`);
                    }
                } else { 
                    if (op.missed > 15) {
                        insights.push(`🚨 КРИТИЧНО! ${op.name}: Пропущено ${op.missed} вызовов, при этом выработка ниже нормы (всего ${closedTickets} тикетов). Острое нарушение дисциплины!`);
                    } else {
                        insights.push(`⚠️ ${op.name}: Выработка ниже нормы (${closedTickets} тикетов) и есть пропуски (${op.missed}). Взять на контроль.`);
                    }
                }
            }
        } else {
            // Вторая линия (помощь).
            let perf2 = findJiraPerformer(op.name);
            let closedTickets = perf2 ? perf2.closed : 0;

            if (closedTickets >= 10 || op.answered > 10) {
                // ПРОВЕРКА НА АВАРИЮ (МАССОВЫЙ СБОЙ)
                if (effectiveTotalIncClosed >= 300) {
                    insights.push(`🛡️ ${op.name} (2 линия): Помощь 1-й линии при аварии (>300 тикетов). Отвечено на ${op.answered} звонков, закрыто ${closedTickets} инцидентов. Драйвер: ${topIncName}. Оправдано!`);
                } else {
                    insights.push(`⚠️ ${op.name} (2 линия): Отвлечение на 1-ю линию (отвечено на ${op.answered} звонков, закрыто ${closedTickets} инцидентов). Аварий нет (<300 тикетов). Риск срыва планового спринта!`);
                }
            }
        }
    });
    
    let header = firstLineMissed > 0 
        ? `⚠️ Внимание: Потеряно ${firstLineMissed} вызовов на 1-й линии (из ${firstLineTotal} общих).\n` 
        : `✅ Отличная работа: 1-я линия отработала без пропущенных вызовов.\n`;
        
    if (insights.length === 0) insights.push("Отклонений в дисциплине и перегрузок на 1-й линии не выявлено.");
        
    return header + insights.join('\n');
  };

  const handleTelephonyImport = () => {
    try {
      const lines = importTelephonyText.split('\n');
      const parsedData = [];
      const timeRegex = /\b\d{2}:\d{2}:\d{2}\b/g;

      for (let line of lines) {
        const times = line.match(timeRegex);
        if (!times || times.length < 2) continue;

        const nameMatch = line.match(/^([А-ЯЁа-яёA-Za-z-]+\s+[А-ЯЁа-яёA-Za-z-]+)/);
        if (!nameMatch) continue;
        const name = nameMatch[1];

        let cleaned = line.replace(name, '').replace(timeRegex, ' ');
        
        let nums = [];
        if (line.includes('\t')) {
            nums = cleaned.split('\t').map(s => s.trim()).filter(s => s.match(/^\d+$/));
        } else {
            nums = cleaned.match(/\d+/g) || [];
        }

        if (nums.length >= 2) {
            const total = parseInt(nums[0]);
            let answered = parseInt(nums[1]);
            let missed = 0;
            if (nums.length >= 3) {
                missed = parseInt(nums[nums.length - 1]);
            }
            
            parsedData.push({
                name: name.trim(),
                total,
                answered,
                missed,
                avgWait: times[0],
                totalTalk: times[1],
                avgTalk: times[2] || '-'
            });
        }
      }
      
      if(parsedData.length > 0) {
          const totalIncClosed = formData.incidentsClosed || 0;
          const topIncName = formData.topIncidents && formData.topIncidents.length > 0 ? formData.topIncidents[0].name : "Неизвестно";
          
          const insight = generateTelephonyInsight(parsedData, formData.topPerformers, totalIncClosed, topIncName);
          setFormData(prev => ({ ...prev, telephonyData: parsedData, telephonyInsight: insight }));
          setTelephonyStatus('success');
          setTimeout(() => setTelephonyStatus(null), 3000);
          setIsSaved(false);
          setImportTelephonyText('');
      } else {
          setTelephonyStatus('error');
          setTimeout(() => setTelephonyStatus(null), 3000);
      }
    } catch(e) {
        setTelephonyStatus('error');
        setTimeout(() => setTelephonyStatus(null), 3000);
    }
  };

  const handleCsatReviewsImport = () => {
    try {
      const parsedReviews = parseCsatReviewsFromText(importCsatText);
      const entries = Object.entries(parsedReviews);
      if (entries.length === 0) {
        setCsatImportStatus({ type: 'error', count: 0 });
        setTimeout(() => setCsatImportStatus(null), 3000);
        return;
      }

      setCsatReviews(prev => ({ ...(prev || {}), ...parsedReviews }));
      setLastCsatPreview(entries.slice(-5).reverse());
      setCsatImportStatus({ type: 'success', count: entries.length });
      setImportCsatText('');
      setTimeout(() => setCsatImportStatus(null), 4000);
    } catch (e) {
      setCsatImportStatus({ type: 'error', count: 0 });
      setTimeout(() => setCsatImportStatus(null), 3000);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanedIncidents = (formData.topIncidents || []).filter(inc => safeString(inc.name).trim() !== '' || (Number(inc.count) || 0) > 0);
    const finalData = { ...formData, topIncidents: cleanedIncidents };
    onSaveWeek(finalData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-5xl pb-24 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div><h1 className="text-3xl font-bold text-white tracking-tight mb-1 uppercase tracking-tighter">Заполнить неделю</h1><p className="text-slate-400 text-sm">Ввод метрик вручную или загрузка результатов анализа Jira</p></div>
        <WeekSelector historyKeys={historyKeys} weeksHistory={weeksHistory} selectedKey={selectedKey} onSelect={onWeekSelect} activeData={weekData} />
      </div>

      {/* БЛОКИ ИМПОРТА */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        {/* ИМПОРТ JIRA */}
        <div className="bg-indigo-900/20 p-6 rounded-xl border border-indigo-500/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Sparkles size={80} className="text-indigo-400" /></div>
          <h3 className="text-lg font-bold text-white mb-2 relative z-10 flex items-center gap-2"><Sparkles size={20} className="text-indigo-400" /> Парсинг данных (JSON)</h3>
          <p className="text-xs text-indigo-200/70 mb-4 relative z-10">Скормите CSV-выгрузку из Jira нейросети. Полученный от неё JSON вставьте сюда для автозаполнения.</p>
          
          <div className="relative z-10 space-y-3">
            <textarea 
              value={importJson} onChange={(e) => setImportJson(e.target.value)}
              placeholder='Вставь сюда сгенерированный JSON...'
              className="w-full h-44 bg-slate-900/80 border border-indigo-500/30 rounded-lg p-3 text-indigo-100 text-xs font-mono focus:border-indigo-400 outline-none resize-y placeholder:text-indigo-400/30 custom-scrollbar"
            ></textarea>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={handleImportData} disabled={!importJson.trim()} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 shadow-lg"><DownloadCloud size={14} /> Загрузить JSON</button>
              <button type="button" onClick={() => { setImportJson(''); setImportStatus(null); }} disabled={!importJson.trim()} className="bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/50 disabled:text-slate-600 border border-slate-600 disabled:border-slate-700 text-slate-300 px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 shadow-lg"><Trash2 size={14} /> Очистить поле</button>
              
              {/* КНОПКА ОЧИСТКИ ЗАДАЧ */}
              <button type="button" onClick={() => {
                if(window.confirm('Точно удалить все задачи из памяти этой недели? Это действие очистит архив задач.')) {
                    setFormData(prev => ({ ...prev, detailedTasks: [] }));
                    setIsSaved(false);
                    setImportStatus('cleared');
                    setTimeout(() => setImportStatus(null), 3000);
                }
              }} className="bg-red-900/40 hover:bg-red-800/60 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 shadow-lg">
                <Trash2 size={14} /> Очистить список задач
              </button>

              {importStatus === 'success' && <span className="text-emerald-400 text-xs font-bold flex items-center gap-1"><Check size={14}/> Успешно!</span>}
              {importStatus === 'error' && <span className="text-red-400 text-xs font-bold flex items-center gap-1"><ShieldAlert size={14}/> Ошибка формата.</span>}
              {importStatus === 'cleared' && <span className="text-amber-400 text-xs font-bold flex items-center gap-1"><Check size={14}/> Память очищена! Сохраните отчет.</span>}
            </div>
          </div>
        </div>

        {/* ИМПОРТ ТЕЛЕФОНИИ */}
        <div className="bg-sky-900/20 p-6 rounded-xl border border-sky-500/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><PhoneCall size={80} className="text-sky-400" /></div>
          <h3 className="text-lg font-bold text-white mb-2 relative z-10 flex items-center gap-2"><PhoneCall size={20} className="text-sky-400" /> Импорт Телефонии</h3>
          <p className="text-xs text-sky-200/70 mb-4 relative z-10">Скопируйте таблицу со звонками (Ctrl+C) из вашей АТС/Excel и вставьте сюда как текст.</p>
          
          <div className="relative z-10 space-y-3">
            <textarea 
              value={importTelephonyText} onChange={(e) => setImportTelephonyText(e.target.value)}
              placeholder='Оператор    Входящие вызовы    Всего...'
              className="w-full h-44 bg-slate-900/80 border border-sky-500/30 rounded-lg p-3 text-sky-100 text-xs font-mono focus:border-sky-400 outline-none resize-y placeholder:text-sky-400/30 custom-scrollbar"
            ></textarea>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={handleTelephonyImport} disabled={!importTelephonyText.trim()} className="bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 shadow-lg"><DownloadCloud size={14} /> Обработать звонки</button>
              <button type="button" onClick={() => { setImportTelephonyText(''); setTelephonyStatus(null); }} disabled={!importTelephonyText.trim()} className="bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/50 disabled:text-slate-600 border border-slate-600 disabled:border-slate-700 text-slate-300 px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 shadow-lg"><Trash2 size={14} /> Очистить поле</button>
              {telephonyStatus === 'success' && <span className="text-emerald-400 text-xs font-bold flex items-center gap-1"><Check size={14}/> Загружено!</span>}
              {telephonyStatus === 'error' && <span className="text-red-400 text-xs font-bold flex items-center gap-1"><ShieldAlert size={14}/> Не удалось распознать текст.</span>}
            </div>
          </div>
        </div>

        {/* ИМПОРТ CSAT-ОТЗЫВОВ */}
        <div className="bg-emerald-900/20 p-6 rounded-xl border border-emerald-500/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Star size={80} className="text-emerald-400" /></div>
          <h3 className="text-lg font-bold text-white mb-2 relative z-10 flex items-center gap-2"><Star size={20} className="text-emerald-400" /> Импорт отзывов CSAT</h3>
          <p className="text-xs text-emerald-200/70 mb-4 relative z-10">Вставьте сырую копипасту из отчета удовлетворенности Jira. Сохраняется только связка IS-номер - текст.</p>
          
          <div className="relative z-10 space-y-3">
            <textarea 
              value={importCsatText} onChange={(e) => setImportCsatText(e.target.value)}
              placeholder='04/мая/26 15:50спасибо большоеIS-257386...'
              className="w-full h-44 bg-slate-900/80 border border-emerald-500/30 rounded-lg p-3 text-emerald-100 text-xs font-mono focus:border-emerald-400 outline-none resize-y placeholder:text-emerald-400/30 custom-scrollbar"
            ></textarea>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={handleCsatReviewsImport} disabled={!importCsatText.trim()} className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 shadow-lg"><DownloadCloud size={14} /> Обработать отзывы</button>
              <button type="button" onClick={() => { setImportCsatText(''); setCsatImportStatus(null); }} disabled={!importCsatText.trim()} className="bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/50 disabled:text-slate-600 border border-slate-600 disabled:border-slate-700 text-slate-300 px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 shadow-lg"><Trash2 size={14} /> Очистить поле</button>
              {csatImportStatus?.type === 'success' && <span className="text-emerald-400 text-xs font-bold flex items-center gap-1"><Check size={14}/> Найдено: {csatImportStatus.count}</span>}
              {csatImportStatus?.type === 'error' && <span className="text-red-400 text-xs font-bold flex items-center gap-1"><ShieldAlert size={14}/> Отзывы не найдены.</span>}
            </div>
            {lastCsatPreview.length > 0 && (
              <div className="bg-slate-900/50 border border-emerald-500/20 rounded-lg p-3 max-h-32 overflow-y-auto custom-scrollbar">
                <div className="text-[10px] uppercase tracking-wider text-emerald-300/70 font-bold mb-2">Последние найденные</div>
                <div className="space-y-2">
                  {lastCsatPreview.map(([id, text]) => (
                    <div key={id} className="text-[11px] leading-snug">
                      <span className="text-emerald-300 font-bold">{id}</span>
                      <span className="text-slate-400"> - </span>
                      <span className="text-slate-300">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="text-[10px] text-emerald-200/50">В справочнике: {Object.keys(csatReviews || {}).length}</div>
          </div>
        </div>
      </div>

      <form onSubmit={(e)=>{e.preventDefault(); onSaveWeek(formData); setIsSaved(true); setTimeout(()=>setIsSaved(false), 3000);}} className="space-y-6">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700/50 shadow-sm relative overflow-hidden text-left">
          <div className="absolute top-0 right-0 p-4 opacity-5"><Calendar size={80} /></div>
          <h3 className="text-lg font-medium text-white mb-4 relative z-10 uppercase tracking-tighter">Отчетный период</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
            <div className="text-left"><label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider opacity-60">Год</label><select value={selectedYear} onChange={e=>setSelectedYear(parseInt(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white outline-none focus:border-emerald-500">{availableYears.map(y=><option key={y} value={y}>{y}</option>)}</select></div>
            <div className="text-left"><label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider opacity-60">Месяц</label><select value={selectedMonth} onChange={e=>setSelectedMonth(parseInt(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white outline-none focus:border-emerald-500">{monthNames.map((n,i)=><option key={i} value={i}>{n}</option>)}</select></div>
            <div className="text-left"><label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider opacity-60">Неделя (ISO)</label><select value={formData.weekNumber || ''} onChange={e=>{const w=weeksOptions.find(o=>o.weekNumber===parseInt(e.target.value)); setFormData({...formData, weekNumber:w.weekNumber, dates:w.dates});}} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white outline-none focus:border-emerald-500">{weeksOptions.map(w=><option key={w.weekNumber} value={w.weekNumber}>{w.label}</option>)}</select></div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700/50 shadow-sm text-left">
          <h3 className="text-lg font-medium text-white mb-4 flex justify-between uppercase tracking-tighter">Метрики потоков (Jira) 
            <span className="flex items-center gap-2 text-xs font-bold text-slate-400 tracking-normal normal-case">Индекс управляемости: 
              <input type="number" name="managementIndex" value={formData.managementIndex} onChange={handleChange} className="w-14 bg-slate-900 border border-slate-700 rounded text-center text-white p-1" />
            </span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-3 p-3 bg-slate-900/50 rounded-lg border border-emerald-500/20"><h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">1-я линия</h4>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Закрыто</label><input type="number" name="incidentsClosed" value={formData.incidentsClosed||''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" /></div>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">В очереди</label><input type="number" name="incidentsQueue" value={formData.incidentsQueue||''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" /></div>
            </div>
            <div className="space-y-3 p-3 bg-slate-900/50 rounded-lg border border-amber-500/20"><h4 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-2">Спринт</h4>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Запланировано</label><input type="number" name="sprintPlanned" value={formData.sprintPlanned||''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" /></div>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Выполнено</label><input type="number" name="sprintCompleted" value={formData.sprintCompleted||''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" /></div>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Перенесли</label><input type="number" name="sprintCarriedOver" value={formData.sprintCarriedOver||''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" /></div>
            </div>
            <div className="space-y-3 p-3 bg-slate-900/50 rounded-lg border border-red-500/20"><h4 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2">Срочная (Щит)</h4>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Отбито</label><input type="number" name="urgentCompleted" value={formData.urgentCompleted||''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" /></div>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">В моменте</label><input type="number" name="urgentQueue" value={formData.urgentQueue||''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" /></div>
            </div>
            <div className="space-y-3 p-3 bg-slate-900/50 rounded-lg border border-blue-500/20"><h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Бэклог</h4>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Приток (Inflow)</label><input type="number" name="inflowThisWeek" value={formData.inflowThisWeek||''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-indigo-400 font-bold" /></div>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Всего (В очереди)</label><input type="number" name="backlog" value={formData.backlog||''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" /></div>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Старых ({'>'}30д)</label><input type="number" name="backlogOld30" value={formData.backlogOld30||''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-red-400 font-bold" /></div>
              <div><label className="block text-[10px] font-bold text-blue-400 uppercase mb-1">Закрыто (Напрямую)</label><input type="number" name="backlogCompleted" value={formData.backlogCompleted||''} onChange={handleChange} className="w-full bg-slate-900 border border-blue-500/50 rounded p-2 text-blue-400 font-bold" /></div>
            </div>

            {/* НОВЫЕ ПОЛЯ: КАЧЕСТВО ПОТОКА */}
            <div className="col-span-1 md:col-span-2 lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 pt-4 border-t border-slate-700/50">
               <div>
                 <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><Clock size={12}/> Cycle Time (Дней)</label>
                 <input type="number" step="0.1" name="avgCycleTime" value={formData.avgCycleTime||''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" />
               </div>
               <div>
                 <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><RefreshCcw size={12}/> Reopen Rate (%)</label>
                 <input type="number" step="0.1" name="reopenRate" value={formData.reopenRate||''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" />
               </div>
               <div className="col-span-2 hidden md:flex items-center text-xs text-slate-500 italic mt-4">
                 Эти метрики рассчитываются аналитикой из "Cоздано" и "Дата решения".
               </div>
            </div>
          </div>
        </div>

        {/* БЛОК РУЧНОГО ИИ-АНАЛИЗА ТЕЛЕФОНИИ */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700/50 shadow-sm text-left">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2"><PhoneCall size={18} className="text-sky-400" /> Анализ телефонии и выгорания</h3>
          <p className="text-xs text-slate-500 mb-3">Этот текст генерируется автоматически при импорте таблицы звонков.</p>
          <textarea 
            name="telephonyInsight" value={safeString(formData.telephonyInsight)} onChange={handleChange} rows={4} 
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-sky-500 outline-none custom-scrollbar" 
          />
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700/50 shadow-sm text-left">
          <div className="flex justify-between items-center mb-4">
            <div><h3 className="text-lg font-medium text-white uppercase tracking-tighter">Топ драйверов инцидентов</h3><p className="text-xs text-slate-500 mt-1">Парсинг или ручной ввод.</p></div>
            <button type="button" onClick={addRow} className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition-all"><Plus size={14} /> Добавить строку</button>
          </div>
          <div className="space-y-3">
            {(formData.topIncidents || []).map((inc, idx) => (
              <div key={idx} className="flex gap-2 items-start bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 group text-left">
                <span className="text-slate-600 font-bold mt-2 text-xs">{idx + 1}.</span>
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <input type="text" placeholder="Смысловая проблема" value={inc.name} onChange={e=>handleIncidentChange(idx,'name',e.target.value)} className="flex-1 bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 outline-none" />
                    <input type="number" placeholder="Кол-во" value={inc.count||''} onChange={e=>handleIncidentChange(idx,'count',e.target.value)} className="w-20 bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 outline-none" />
                    <button type="button" onClick={()=>delRow(idx)} className="text-slate-600 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                  </div>
                  <textarea placeholder="Анализ причины и решения..." value={inc.analysis} onChange={e=>handleIncidentChange(idx,'analysis',e.target.value)} rows={2} className="w-full bg-slate-950/50 border border-slate-800 rounded p-2 text-[11px] text-slate-500 outline-none custom-scrollbar" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700/50 shadow-sm text-left">
          <h3 className="text-lg font-medium text-white uppercase tracking-tighter mb-4">Аудит узких мест процесса</h3>
          <div className="space-y-4 text-left">
            <div className="text-left"><label className="block text-xs font-bold text-emerald-400 uppercase mb-1 tracking-wider opacity-60 ml-1">Успешный процесс (Что сработало?)</label><textarea name="mainInsight" value={safeString(formData.mainInsight)} onChange={handleChange} rows={3} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none custom-scrollbar" /></div>
            <div className="text-left"><label className="block text-xs font-bold text-amber-400 uppercase mb-1 tracking-wider opacity-60 ml-1">Критическое узкое горлышко (Где сбоит?)</label><textarea name="mainRisk" value={safeString(formData.mainRisk)} onChange={handleChange} rows={3} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-amber-500 outline-none custom-scrollbar" /></div>
            <div className="text-left"><label className="block text-xs font-bold text-blue-400 uppercase mb-1 tracking-wider opacity-60 ml-1">План расшивки горлышка (Фокус)</label><textarea name="nextFocus" value={safeString(formData.nextFocus)} onChange={handleChange} rows={3} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none custom-scrollbar" /></div>
            <div className="pt-4 border-t border-slate-700/50 text-left"><label className="block text-xs font-bold text-indigo-400 uppercase mb-1 flex items-center gap-2 tracking-wider ml-1"><BookOpen size={14} /> Процессная гипотеза недели</label><textarea name="trainingHypothesis" value={safeString(formData.trainingHypothesis)} onChange={handleChange} rows={2} className="w-full bg-slate-900 border border-indigo-500/30 rounded-lg p-2.5 text-white outline-none custom-scrollbar" /></div>
            
            <div className="pt-4 border-t border-slate-700/50 text-left">
               <label className="block text-xs font-bold text-fuchsia-400 uppercase mb-1 flex items-center gap-2 tracking-wider ml-1"><Trash2 size={14} /> Блокеры и неактуальные задачи (Матрица Эйзенхауэра)</label>
               <textarea name="blockersAndWaste" value={safeString(formData.blockersAndWaste)} onChange={handleChange} rows={5} className="w-full bg-slate-900 border border-fuchsia-500/30 rounded-lg p-2.5 text-white outline-none custom-scrollbar focus:border-fuchsia-500" />
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700/50 shadow-sm text-left">
          <h3 className="text-lg font-medium text-white uppercase tracking-tighter mb-4 flex items-center gap-2"><Star size={18} className="text-amber-400" /> Кайдзен и победы потока</h3>
          <div className="space-y-4 text-left">
            <div className="text-left"><label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider opacity-60 ml-1">Главная системная победа</label><input type="text" name="mainWin" value={safeString(formData.mainWin)} onChange={handleChange} placeholder="Например: Справились с аномальным потоком" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white outline-none focus:border-amber-500" /></div>
            <div className="text-left"><label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider opacity-60 ml-1">Кого хотим отметить за процессное улучшение?</label><textarea name="thanks" value={safeString(formData.thanks)} onChange={handleChange} rows={2} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white outline-none custom-scrollbar focus:border-amber-500" /></div>
          </div>
        </div>

        <div className="fixed bottom-0 left-64 right-0 p-4 bg-slate-950/90 backdrop-blur-md border-t border-slate-800 flex justify-center z-10 shadow-2xl">
          <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-xl shadow-emerald-900/20">
            <Save size={20} /> {isSaved ? 'СОХРАНЕНО!' : 'СОХРАНИТЬ В ОБЛАКО'}
          </button>
        </div>
      </form>
    </div>
  );
};

// --- ВКЛАДКА: АРХИВ / ТЕХДОЛГ ---

const TasksArchiveBoard = ({ tasksArchive }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTasks = tasksArchive.filter(t => {
    const text = `${t.id} ${t.title} ${t.assignee} ${t.status} ${t.comments} ${t.tags || ''}`.toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1 flex items-center gap-3">
            <Archive size={28} className="text-indigo-400" /> Техдолг и Архив задач
          </h1>
          <p className="text-slate-400 text-sm">Сырые данные из Jira для глубокого анализа, сохраненные аналитикой</p>
        </div>
        <div className="bg-indigo-500/10 text-indigo-400 px-4 py-2 rounded-lg border border-indigo-500/20 text-sm font-bold flex items-center gap-2">
          <Database size={16} /> Всего в базе: {tasksArchive.length} задач
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700/50 shadow-sm overflow-hidden flex flex-col h-[70vh]">
        <div className="p-4 border-b border-slate-700/50 bg-slate-900/30 flex justify-between items-center">
          <div className="relative w-full max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Поиск по ключу, теме, исполнителю, тегам..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar p-0">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="sticky top-0 bg-slate-900 border-b border-slate-700 shadow-sm z-10">
              <tr className="text-slate-400 text-xs uppercase tracking-wider">
                <th className="p-4 font-medium">Ключ</th>
                <th className="p-4 font-medium w-full min-w-[300px]">Тема задачи</th>
                <th className="p-4 font-medium">Создано</th>
                <th className="p-4 font-medium">Решено</th>
                <th className="p-4 font-medium text-center">Cycle Time</th>
                <th className="p-4 font-medium text-center">Размер</th>
                <th className="p-4 font-medium">Статус</th>
                <th className="p-4 font-medium">Исполнитель</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredTasks.length > 0 ? filteredTasks.map((task, idx) => (
                <React.Fragment key={task.id || idx}>
                  <tr className="hover:bg-slate-900/20 transition-colors group">
                    <td className="p-4 text-indigo-400 font-bold text-xs">{task.id}</td>
                    <td className="p-4 text-slate-200 whitespace-normal min-w-[300px]">
                      <div className="font-medium">{task.title || 'Без названия'}</div>
                      {task.tags && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {task.tags.split(',').map((tag, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded-md bg-slate-700/50 border border-slate-600/50 text-[10px] text-slate-400 font-medium">
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                      {task.comments && (
                         <div className="mt-1.5 text-xs text-slate-500 italic bg-slate-900/50 p-2 rounded border border-slate-700/30 whitespace-pre-wrap max-h-12 overflow-hidden group-hover:max-h-none transition-all duration-300">
                           <span className="text-slate-400 font-bold not-italic mr-1">Лог:</span>{task.comments}
                         </div>
                      )}
                    </td>
                    <td className="p-4 text-slate-400 text-xs">{task.created || '-'}</td>
                    <td className="p-4 text-slate-400 text-xs">{task.resolved || '-'}</td>
                    <td className="p-4 text-center">
                      <span className="text-slate-300 font-medium text-xs">
                        {task.cycleTime !== undefined && task.cycleTime !== null ? `${task.cycleTime} дн.` : '-'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {task.size ? (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                          task.size === 'S' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                          task.size === 'M' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                          task.size === 'L' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' :
                          'bg-red-500/10 text-red-400 border-red-500/30'
                        }`}>
                          {task.size}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        task.status === 'Закрыт' || task.status === 'Готово' || task.status === 'Resolved' || task.status === 'Завершен'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {task.status || 'Открыто'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300 font-medium">
                      {getFullName(task.assignee)}
                    </td>
                  </tr>
                </React.Fragment>
              )) : (
                <tr>
                  <td colSpan="8" className="p-12 text-center text-slate-500">
                    <Archive size={48} className="mx-auto mb-4 opacity-20" />
                    Задачи не найдены. <br/>Добавь массив `detailedTasks` в импорт JSON на вкладке "Заполнить неделю".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- ВКЛАДКА: НОВЫЙ СТАТУС-ОТЧЕТ (ELITE REPORT) ---

const ReportsGenerator = ({ weekData, historyKeys, weeksHistory, selectedKey, onWeekSelect, onSaveWeek, projectTasks, setProjectTasks, csatReviews }) => {
  const [copiedId, setCopiedId] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  
  // Состояния для формы новой задачи руководства
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskComment, setNewTaskComment] = useState('в работе');
  const [newTaskColor, setNewTaskColor] = useState('#10b981'); // Зеленый по умолчанию

  const reportRef = useRef(null);

  useEffect(() => {
    setIsDirty(false);
  }, [weekData.weekNumber]);

  const handleFreezeReport = () => {
     if (reportRef.current) {
        onSaveWeek({ 
           ...weekData, 
           customReportHtml: reportRef.current.innerHTML,
           isReportFrozen: true
        });
        setIsDirty(false);
     }
  };

  const handleUnfreezeReport = () => {
     onSaveWeek({
        ...weekData,
        customReportHtml: null,
        isReportFrozen: false
     });
     setIsDirty(false);
  };

  // --- ЛОГИКА УПРАВЛЕНИЯ ПОРУЧЕНИЯМИ ---
  
  const handleAddProjectTask = () => {
    if (!newTaskTitle.trim()) return;
    const newTask = {
      id: Date.now().toString(),
      title: newTaskTitle,
      comment: newTaskComment,
      color: newTaskColor,
      status: 'active',
      createdWeekKey: selectedKey,
      completedWeekKey: null
    };
    setProjectTasks([...(projectTasks || []), newTask]);
    setNewTaskTitle('');
    setNewTaskComment('в работе');
  };

  const handleUpdateProjectTask = (id, field, value) => {
    setProjectTasks((projectTasks || []).map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const handleCompleteProjectTask = (id) => {
    setProjectTasks((projectTasks || []).map(t => {
      if (t.id === id) {
        return { 
          ...t, 
          status: t.status === 'active' ? 'completed' : 'active', 
          completedWeekKey: t.status === 'active' ? selectedKey : null 
        };
      }
      return t;
    }));
  };

  const handleDeleteProjectTask = (id) => {
    if (window.confirm("Удалить поручение навсегда?")) {
      setProjectTasks((projectTasks || []).filter(t => t.id !== id));
    }
  };

  const getProjectTaskMatchWords = (title) => {
    const stopWords = new Set(['задач', 'задача', 'нужно', 'надо', 'сдела', 'работ', 'через', 'после', 'перед', 'данны', 'данные']);
    return safeString(title)
      .toLowerCase()
      .trim()
      .split(/[ \.,\-_/]+/)
      .map(w => w.trim())
      .filter(w => w.length > 4)
      .filter(w => !stopWords.has(w.substring(0, 5)));
  };

  const doesProjectTaskMatchJiraTask = (projectTask, jiraTask) => {
    if (!projectTask || !projectTask.title || !jiraTask) return false;

    const cleanJiraTitle = safeString(jiraTask.title).toLowerCase();
    const cleanJiraText = `${safeString(jiraTask.title)} ${safeString(jiraTask.comments)}`.toLowerCase();
    const cleanProjectTitle = safeString(projectTask.title).toLowerCase().trim();

    if (cleanProjectTitle && cleanJiraText.includes(cleanProjectTitle)) return true;

    const words = getProjectTaskMatchWords(cleanProjectTitle);
    if (words.length === 0) return false;
    if (words.length < 2 && !cleanJiraText.includes(cleanProjectTitle)) return false;

    return words.every(w => cleanJiraTitle.includes(w.substring(0, 5)));
  };

  const findMatchingProjectTask = (jiraTask) => {
    return (projectTasks || []).find(pt => doesProjectTaskMatchJiraTask(pt, jiraTask));
  };

  // Фильтруем задачи, которые должны попасть в отчет ТЕКУЩЕЙ недели
  const tasksForThisWeek = (projectTasks || []).filter(t => 
    t.status === 'active' || t.completedWeekKey === selectedKey
  );

  useEffect(() => {
    if (!projectTasks || projectTasks.length === 0 || !weekData.detailedTasks || weekData.isReportFrozen) return;

    const closedJiraTasks = (weekData.detailedTasks || []).filter(t => 
      t && (t.status === 'Закрыт' || t.status === 'Готово' || t.status === 'Resolved' || t.status === 'Завершен' || t.resolved)
    );
    if (closedJiraTasks.length === 0) return;

    setProjectTasks(prev => {
      let hasChanges = false;
      const next = (prev || []).map(pt => {
        if (pt.status !== 'active') return pt;
        const matched = closedJiraTasks.some(jiraTask => doesProjectTaskMatchJiraTask(pt, jiraTask));
        if (!matched) return pt;
        hasChanges = true;
        return {
          ...pt,
          status: 'completed',
          completedWeekKey: selectedKey,
          comment: pt.comment && pt.comment !== 'в работе' ? pt.comment : 'закрыто по Jira'
        };
      });
      return hasChanges ? next : prev;
    });
  }, [projectTasks, weekData.detailedTasks, weekData.isReportFrozen, selectedKey]);

  // --- ГЕНЕРАЦИЯ HTML ДЛЯ ЗАДАЧ ---
  const generateTasksHtml = () => {
    try {
      if (tasksForThisWeek.length === 0) {
        return `<p style="font-size: 13px; color: #64748b; font-style: italic;">На этой неделе нет активных поручений.</p>`;
      }
      
      return tasksForThisWeek.map(t => {
        const weeksActive = getWeeksDiff(t.createdWeekKey, selectedKey);
        const isCompleted = t.status === 'completed';
        const bgColor = isCompleted ? '#f0fdf4' : '#ffffff';
        const borderColor = isCompleted ? '#bbf7d0' : '#e2e8f0';
        const leftBorderColor = isCompleted ? '#22c55e' : t.color;
        const titleColor = isCompleted ? '#166534' : '#0f172a';
        const titleText = isCompleted ? `<s>${safeString(t.title)}</s>` : safeString(t.title);
        
        const statusBadge = isCompleted 
          ? `<span style="color: #16a34a; font-weight: bold; background: #dcfce3; padding: 2px 6px; border-radius: 4px; font-size: 11px; text-transform: uppercase;">Выполнено</span>`
          : `[ <span style="color: ${t.color}; font-weight: bold;">${safeString(t.comment)}</span> ]`;

        // Стикеры просрочки для HTML-отчета
        let delaySticker = '';
        if (!isCompleted && weeksActive > 0) {
          if (weeksActive >= 2) {
              delaySticker = `<span style="display: inline-block; margin-top: 6px; background-color: #fef2f2; color: #ef4444; border: 1px solid #fca5a5; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold;">⚠️ Затянуто: ${weeksActive} нед.</span>`;
          } else {
              delaySticker = `<span style="display: inline-block; margin-top: 6px; background-color: #fffbeb; color: #d97706; border: 1px solid #fcd34d; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold;">⏳ В работе 2-ю неделю</span>`;
          }
        }

        return `
          <div style="background-color: ${bgColor}; border: 1px solid ${borderColor}; border-left: 4px solid ${leftBorderColor}; border-radius: 4px; margin-bottom: 12px; padding: 12px 16px;">
             <div style="font-weight: 700; font-size: 14px; color: ${titleColor}; margin-bottom: 6px;">
                 ${titleText}
             </div>
             ${!isCompleted ? `
               <div style="font-size: 13px; text-align: left;">
                   <span style="font-weight: bold; color: #0f172a;">Статус:</span> 
                   ${statusBadge}
               </div>
               ${delaySticker}
             ` : `
               <div style="font-size: 13px; text-align: left; margin-top: 4px;">
                   ${statusBadge} <span style="color: #475569; margin-left: 8px;">Итог: ${safeString(t.comment)}</span>
               </div>
             `}
          </div>
        `;
      }).join('');
    } catch (e) {
      return `<p style="color: red;">Ошибка отрисовки задач: ${e.message}</p>`;
    }
  };

  // Авто-обновление блока задач внутри отчета (если он не заморожен)
  useEffect(() => {
    if (!reportRef.current || weekData.isReportFrozen) return;
    const container = reportRef.current.querySelector('#management-tasks-container');
    if (container) {
      container.innerHTML = generateTasksHtml();
    }
  }, [projectTasks, selectedKey, weekData.isReportFrozen]);


  // --- ДАННЫЕ ДЛЯ ОТЧЕТА ---
  const getReportHtmlString = () => {
    try {
      const sortedIncidents = weekData.topIncidents ? [...weekData.topIncidents].sort((a,b)=>(Number(b.count)||0)-(Number(a.count)||0)) : [];
      const top3 = sortedIncidents.slice(0, 3);
      const top3Text = top3.map(i => `${safeString(i.name)} (${Number(i.count)||0})`).join(', ');

      const totalIncidentsFromList = (weekData.topIncidents || []).reduce((sum, item) => sum + (Number(item.count) || 0), 0);
      const totalClosedCount = (Number(weekData.sprintCompleted)||0) + (Number(weekData.urgentCompleted)||0) + (Number(weekData.backlogCompleted)||0);
      const totalIncidents = Number(weekData.incidentsClosed) || 0;
      const managementIndex = Number(weekData.managementIndex) || 0;

      const incColor = totalIncidents >= 300 ? '#ef4444' : '#10b981'; 
      const taskColor = totalClosedCount >= 50 ? '#ef4444' : '#3b82f6'; 
      const indexColor = managementIndex < 70 ? '#ef4444' : '#10b981';

      const getBurnoutBadge = (wip, closed, type) => {
        const isOverloaded = (Number(wip) > 20) || (type === 'inc' && Number(closed) >= 80) || (type === 'task' && Number(closed) > 15);
        if (isOverloaded) {
           return `<span style="color: #ef4444; font-size: 14px;" title="Высокий риск выгорания (Норма 50-60)">🔥</span>`;
        }
        return '';
      };

      let sortedTaskPerformers = [...(weekData.taskPerformers || [])]
        .filter(p => {
           const fName = getFullName(p.name);
           const isUnknown = String(p.name).toLowerCase() === 'неизвестно' || fName.toLowerCase() === 'неизвестно';
           // Убираем Тимлида из Инфраструктуры
           return p.name !== TEAM_LEAD_ID && fName !== TEAM_LEAD_NAME && !String(p.name).includes('Виктор') && !isUnknown;
        })
        .sort((a,b) => (Number(b.closed)||0) - (Number(a.closed)||0));
        
      let sortedIncPerformers = [...(weekData.topPerformers || [])]
        .filter(p => {
           const fName = getFullName(p.name);
           const isTeamLead = p.name === TEAM_LEAD_ID || fName === TEAM_LEAD_NAME || String(p.name).includes('Виктор');
           const isThirdLine = THIRD_LINE_ADMINS.includes(fName) || THIRD_LINE_ADMINS.includes(p.name);
           const isUnknown = String(p.name).toLowerCase() === 'неизвестно' || fName.toLowerCase() === 'неизвестно';
           // Убираем Тимлида И 3-ю линию из Инцидентов
           return !isTeamLead && !isThirdLine && !isUnknown;
        })
        .sort((a,b) => (Number(b.closed)||0) - (Number(a.closed)||0));

      const completedDetailedTasks = (weekData.detailedTasks || [])
        .filter(t => t && (t.status === 'Закрыт' || t.status === 'Готово' || t.status === 'Resolved' || t.status === 'Завершен' || t.resolved))
        .filter(t => {
           // Убираем Тимлида из списка видимых задач
           const fName = getFullName(t.assignee);
           return fName !== TEAM_LEAD_NAME && t.assignee !== TEAM_LEAD_ID && !String(t.assignee).includes('Виктор');
        })
        .sort((a, b) => {
            const idA = parseInt(String(a.id).replace(/\D/g, '')) || 0;
            const idB = parseInt(String(b.id).replace(/\D/g, '')) || 0;
            return idB - idA;
        });

      // Фильтруем Тимлида из Телефонии
      const visibleTelephony = (weekData.telephonyData || []).filter(row => {
         const fName = getFullName(row.name);
         return fName !== TEAM_LEAD_NAME && row.name !== TEAM_LEAD_ID && !String(row.name).includes('Виктор');
      });

      const buildReportTelephonyInsight = () => {
        if (!visibleTelephony || visibleTelephony.length === 0) return safeString(weekData.telephonyInsight);
        const normalizePersonName = (name) => safeString(name).toLowerCase().replace(/ё/g, 'е').replace(/[^а-яa-z\s-]/g, ' ').replace(/\s+/g, ' ').trim();
        const getPersonTokens = (name) => normalizePersonName(name).split(/[\s-]+/).filter(part => part.length > 1);
        const findJiraPerformer = (operatorName) => {
          const opTokens = getPersonTokens(operatorName);
          if (opTokens.length === 0) return null;
          const candidates = sortedIncPerformers.map(p => ({
            performer: p,
            tokens: getPersonTokens(getFullName(p.name)),
            rawTokens: getPersonTokens(p.name)
          }));
          const exact = candidates.find(c => {
            const allTokens = [...new Set([...c.tokens, ...c.rawTokens])];
            return opTokens.length >= 2 && opTokens.every(token => allTokens.includes(token));
          });
          if (exact) return exact.performer;
          if (opTokens.length === 1) {
            const bySingleToken = candidates.filter(c => [...new Set([...c.tokens, ...c.rawTokens])].includes(opTokens[0]));
            return bySingleToken.length === 1 ? bySingleToken[0].performer : null;
          }
          return null;
        };

        let missed = 0;
        let total = 0;
        const lines = [];
        const effectiveTotalIncClosed = sortedIncPerformers.reduce((sum, p) => sum + (Number(p.closed) || 0), 0) || totalIncidents;

        visibleTelephony.forEach(op => {
          total += Number(op.total) || 0;
          missed += Number(op.missed) || 0;
          const perf = findJiraPerformer(op.name);
          const closedTickets = perf ? (Number(perf.closed) || 0) : 0;
          const missedCalls = Number(op.missed) || 0;
          const answeredCalls = Number(op.answered) || 0;
          let profileLabel = '';
          if (missedCalls > 0 && closedTickets >= 80) {
            profileLabel = 'Профиль: перегруз';
          } else if (missedCalls > 10 && closedTickets < 50) {
            profileLabel = 'Профиль: дисциплина/доступность';
          } else if (answeredCalls > 10 && closedTickets < 10 && effectiveTotalIncClosed >= 300) {
            profileLabel = 'Профиль: помощь при аварии';
          } else if (missedCalls === 0 && (closedTickets >= 40 || answeredCalls > 0)) {
            profileLabel = 'Профиль: норма';
          }
          if ((Number(op.missed) || 0) > 0) {
            if (closedTickets >= 80) {
              lines.push(`🔥 ${op.name}: ${profileLabel}. Пропущено ${op.missed} вызовов. Причина: перегруз (закрыто ${closedTickets} инцидентов).`);
            } else if (closedTickets >= 50) {
              lines.push(`⚠️ ${op.name}: ${profileLabel || 'Профиль: рабочая нагрузка'}. Норма в Jira выполнена (${closedTickets}), но есть пропущенные вызовы (${op.missed}).`);
            } else {
              lines.push(`⚠️ ${op.name}: ${profileLabel || 'Профиль: контроль'}. Закрыто ${closedTickets} инцидентов, пропущено ${op.missed} вызовов. Взять на контроль.`);
            }
          } else if (profileLabel === 'Профиль: помощь при аварии') {
            lines.push(`🛡️ ${op.name}: ${profileLabel}. Отвечено ${answeredCalls} звонков при аварийном фоне, закрыто ${closedTickets} инцидентов.`);
          }
        });

        const header = missed > 0
          ? `⚠️ Внимание: потеряно ${missed} вызовов на 1-й линии (из ${total} общих). Закрыто инцидентов по Jira: ${effectiveTotalIncClosed}.\n`
          : `✅ Отличная работа: 1-я линия отработала без пропущенных вызовов. Закрыто инцидентов по Jira: ${effectiveTotalIncClosed}.\n`;
        return header + (lines.length > 0 ? lines.join('\n') : 'Отклонений в дисциплине и перегрузок на 1-й линии не выявлено.');
      };

      const renderProgressBar = (value, max, color) => {
        const percentage = Math.min(Math.round((value / max) * 100), 100);
        return `
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 8px; width: 100%; background-color: #e2e8f0; border-radius: 4px;">
            <tr>
              ${percentage > 0 ? `<td width="${percentage}%" style="background-color: ${color}; height: 6px; border-radius: 4px; font-size: 0; line-height: 0;">&nbsp;</td>` : ''}
              ${percentage < 100 ? `<td width="${100 - percentage}%" style="height: 6px; font-size: 0; line-height: 0;">&nbsp;</td>` : ''}
            </tr>
          </table>
        `;
      };

      const renderPieChart = () => {
        if (!weekData.taskTypesDistribution || weekData.taskTypesDistribution.length === 0) return '';
        
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
        let gradientParts = [];
        let currentPercent = 0;
        
        weekData.taskTypesDistribution.forEach((item, index) => {
          const p = Number(item.percent) || 0;
          const color = colors[index % colors.length];
          gradientParts.push(`${color} ${currentPercent}% ${currentPercent + p}%`);
          currentPercent += p;
        });

        const legendHtml = weekData.taskTypesDistribution.map((item, idx) => `
          <div style="margin-bottom: 4px; font-size: 12px; color: #475569;">
            <span style="display: inline-block; width: 8px; height: 8px; background-color: ${colors[idx % colors.length]}; border-radius: 50%; margin-right: 6px;"></span>
            ${safeString(item.name)}: <b>${item.percent}%</b>
          </div>
        `).join('');

        return `
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px;">
            <tr>
              <td width="80" style="vertical-align: top;">
                <div style="width: 60px; height: 60px; border-radius: 50%; background: conic-gradient(${gradientParts.join(', ')});"></div>
              </td>
              <td style="vertical-align: top; padding-left: 10px;">
                ${legendHtml}
              </td>
            </tr>
          </table>
        `;
      };

      const getTaskValueCategory = (task) => {
        const categories = {
          business: { key: 'business', label: 'Бизнес-проект', color: '#8b5cf6', bg: '#f5f3ff' },
          stability: { key: 'stability', label: 'Стабильность', color: '#2563eb', bg: '#eff6ff' },
          optimization: { key: 'optimization', label: 'Оптимизация', color: '#059669', bg: '#ecfdf5' },
          techDebt: { key: 'techDebt', label: 'Техдолг', color: '#dc2626', bg: '#fff1f2' },
          routine: { key: 'routine', label: 'Рутина', color: '#64748b', bg: '#f8fafc' }
        };
        const raw = safeString(task.valueCategory || task.impactCategory || task.category || task.valueType || task.type).toLowerCase();
        const normalizedRaw = raw.replace(/[\s_-]+/g, '');
        if (['business', 'businessproject', 'project', 'biz', 'бизнес', 'бизнеспроект', 'проект'].includes(normalizedRaw)) {
          return categories.business;
        }
        if (['stability', 'reliability', 'incidentprevention', 'стабильность', 'надежность', 'аварии'].includes(normalizedRaw)) {
          return categories.stability;
        }
        if (['optimization', 'automation', 'improvement', 'оптимизация', 'автоматизация', 'улучшение'].includes(normalizedRaw)) {
          return categories.optimization;
        }
        if (['techdebt', 'debt', 'legacy', 'техдолг', 'техническийдолг', 'старыйдолг'].includes(normalizedRaw)) {
          return categories.techDebt;
        }
        if (['routine', 'support', 'operations', 'рутина', 'эксплуатация', 'поддержка'].includes(normalizedRaw)) {
          return categories.routine;
        }

        const text = `${raw} ${safeString(task.title)} ${safeString(task.comments)}`.toLowerCase();
        if (text.includes('бизнес') || text.includes('проект') || text.includes('руковод') || text.includes('миграц')) {
          return categories.business;
        }
        if (text.includes('техдолг') || text.includes('технический долг') || (Number(task.cycleTime) || 0) >= 30) {
          return categories.techDebt;
        }
        if (text.includes('стабиль') || text.includes('авар') || text.includes('сбой') || text.includes('восстанов') || text.includes('сервер') || text.includes('сеть')) {
          return categories.stability;
        }
        if (text.includes('оптим') || text.includes('автомат') || text.includes('ускор') || text.includes('улучш')) {
          return categories.optimization;
        }
        return categories.routine;
      };

      const renderValueShowcase = () => {
        if (!completedDetailedTasks || completedDetailedTasks.length === 0) return '';
        const groups = [
          { key: 'business', label: 'Бизнес-проект', color: '#8b5cf6', bg: '#f5f3ff', items: [] },
          { key: 'stability', label: 'Стабильность', color: '#2563eb', bg: '#eff6ff', items: [] },
          { key: 'optimization', label: 'Оптимизация', color: '#059669', bg: '#ecfdf5', items: [] },
          { key: 'techDebt', label: 'Техдолг', color: '#dc2626', bg: '#fff1f2', items: [] },
          { key: 'routine', label: 'Рутина', color: '#64748b', bg: '#f8fafc', items: [] }
        ];
        completedDetailedTasks.forEach(task => {
          const category = getTaskValueCategory(task);
          const group = groups.find(g => g.key === category.key) || groups[groups.length - 1];
          group.items.push(task);
        });

        const cardsHtml = groups.filter(g => g.items.length > 0).map(group => `
          <div class="value-card" style="border-top-color: ${group.color}; background: ${group.bg};">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <div style="font-size: 13px; font-weight: 800; color: ${group.color};">${group.label}</div>
              <div style="font-size: 12px; font-weight: 800; color: ${group.color};">${group.items.length}</div>
            </div>
            ${group.items.slice(0, 4).map(task => {
              const size = safeString(task.size || task.complexity || '').toUpperCase();
              const sizeBadge = size ? `<span style="font-size: 10px; font-weight: 800; color: ${group.color}; border: 1px solid ${group.color}; border-radius: 999px; padding: 1px 5px; margin-left: 5px;">${size}</span>` : '';
              return `
                <div style="font-size: 12px; color: #334155; line-height: 1.35; margin-bottom: 7px;">
                  <span style="font-weight: 800; color: ${group.color};">${safeString(task.id)}</span>${sizeBadge}
                  <div style="margin-top: 2px;">${safeString(task.title)}</div>
                </div>
              `;
            }).join('')}
          </div>
        `).join('');

        return `
          <h3 style="font-size: 14px; color: #475569; margin-bottom: 10px; margin-top: 20px;">Витрина ценности закрытых задач</h3>
          <div class="value-grid">
            ${cardsHtml}
          </div>
        `;
      };

      const generateTableHtml = (headers, rows) => {
        return `
          <table class="data-table">
            <thead>
              <tr>
                ${headers.map(h => `<th>${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${rows.map(r => `
                <tr>
                  ${r.map((cell, idx) => `<td style="${idx > 0 ? 'text-align: center;' : ''}">${cell}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      };

      // ХЕЛПЕР ДЛЯ ОТЧЕТА: профиль строкой (чтобы нормально рендерилось в письме)
      const getContextStringHtml = (context) => {
        if (!context || context.trim() === '') return '-';
        const lower = context.toLowerCase();
        let color = '#64748b'; // серый
        let shortText = context;
        if (lower.includes('баланс') || lower.includes('микс')) {
          color = '#3b82f6'; // синий
        } else if (lower.includes('сложн') || lower.includes('архитектур') || lower.includes('спасат') || lower.includes('высок')) {
          color = '#d946ef'; // фуксия
        }
        if(shortText.length > 15) shortText = shortText.substring(0, 14) + '...';
        return `<span style="color: ${color}; font-weight: bold; font-size: 11px;" title="${context}">${shortText}</span>`;
      };

      const taskRows = sortedTaskPerformers.map(p => {
         const droppedCount = Array.isArray(p.droppedTasks) ? p.droppedTasks.length : (Number(p.droppedTasks) || 0);
         const closedHtml = droppedCount > 0 
            ? `${p.closed || 0}<br/><span style="font-size: 10px; color: #94a3b8; font-weight: normal;">(-${droppedCount} безд.)</span>`
            : `${p.closed || 0}`;
         return [`${getFullName(p.name)} ${getBurnoutBadge(p.wip, p.closed, 'task')}`, p.wip || 0, closedHtml, `${p.avgTimeMin || 0} дн.`, getContextStringHtml(p.taskContext)];
      });
      
      const incRows = sortedIncPerformers.map(p => {
         const droppedCount = Array.isArray(p.droppedTasks) ? p.droppedTasks.length : (Number(p.droppedTasks) || 0);
         const closedHtml = droppedCount > 0 
            ? `${p.closed || 0}<br/><span style="font-size: 10px; color: #94a3b8; font-weight: normal;">(-${droppedCount} безд.)</span>`
            : `${p.closed || 0}`;
         return [`${getFullName(p.name)} ${getBurnoutBadge(0, p.closed, 'inc')}`, closedHtml, `${p.avgTimeMin || 0} мин.`, getContextStringHtml(p.taskContext), formatCSAT(p.csat)];
      });

      const csatFeedbackItems = sortedIncPerformers.flatMap(p => {
        const details = Array.isArray(p.csatDetails) ? p.csatDetails : [];
        return details
          .map(item => {
            const id = normalizeIncidentKey(item.id);
            const rating = Number(item.rating) || 0;
            if (!id || rating <= 0 || rating >= 5) return null;
            const reviewText = safeString(csatReviews?.[id]).trim();
            const themeText = safeString(item.theme || item.title || item.topic || item.summary).trim();
            return {
              id,
              rating,
              engineer: getFullName(p.name),
              text: reviewText,
              theme: themeText
            };
          })
          .filter(Boolean);
      }).sort((a, b) => a.rating - b.rating);

      const csatFeedbackHtml = csatFeedbackItems.length > 0 ? `
        <div class="csat-hover-wrap">
          <span class="csat-summary-pill">CSAT ниже 5: ${csatFeedbackItems.length}</span>
          <div class="csat-popover">
            <div style="font-weight: 800; color: #0f172a; font-size: 13px; margin-bottom: 8px;">Оценки ниже 5</div>
            ${csatFeedbackItems.slice(0, 8).map(item => {
            const isDanger = item.rating <= 3;
            const borderColor = isDanger ? '#ef4444' : '#f59e0b';
            const bgColor = isDanger ? '#fef2f2' : '#fffbeb';
            const textColor = isDanger ? '#991b1b' : '#92400e';
            const payloadHtml = item.text
              ? `<div style="font-size: 13px; color: #0f172a; line-height: 1.45; margin-top: 6px;">"${safeString(item.text)}"</div>`
              : `<div style="font-size: 12px; color: #64748b; line-height: 1.45; margin-top: 6px; font-style: italic;">Тема: ${safeString(item.theme || 'не передана в JSON')}</div>`;
            return `
              <div style="background: ${bgColor}; border: 1px solid ${borderColor}; border-left: 4px solid ${borderColor}; border-radius: 6px; padding: 10px 12px; margin-bottom: 8px;">
                <div style="display: flex; justify-content: space-between; gap: 12px; align-items: center; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 800; color: ${textColor};">
                  <span>${item.id} · ${safeString(item.engineer)}</span>
                  <span>Оценка ${item.rating}</span>
                </div>
                ${payloadHtml}
              </div>
            `;
            }).join('')}
          </div>
        </div>
      ` : '';

      // БЛОК ТОП-3 ИНЦИДЕНТОВ С ПРАВИЛЬНЫМИ ПРОЦЕНТАМИ
      const topIncidentsHtml = top3.map((inc, idx) => {
        const count = Number(inc.count) || 0;
        // Считаем процент от суммы всех найденных проблем, как на главном дашборде
        const pct = totalIncidentsFromList > 0 ? Math.round((count / totalIncidentsFromList) * 100) : 0;
        
        let borderCol = '#f59e0b';
        if(idx === 0) borderCol = '#ef4444';
        else if(idx === 1) borderCol = '#f97316';
        
        return `
          <div class="incident-card" style="border-left-color: ${borderCol};">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
               <span style="font-weight: 700; font-size: 13px; color: #0f172a; padding-right: 15px;">${idx + 1}. ${safeString(inc.name)}</span>
               <span style="font-size: 12px; font-weight: bold; color: ${borderCol}; white-space: nowrap;">${count} шт. (${pct}%)</span>
            </div>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 6px; margin-bottom: 6px; width: 100%; background-color: #e2e8f0; border-radius: 2px;">
              <tr>
                ${pct > 0 ? `<td width="${pct}%" style="background-color: ${borderCol}; height: 4px; border-radius: 2px; font-size: 0; line-height: 0;">&nbsp;</td>` : ''}
                ${pct < 100 ? `<td width="${100 - pct}%" style="height: 4px; font-size: 0; line-height: 0;">&nbsp;</td>` : ''}
              </tr>
            </table>
            ${inc.analysis ? `<div style="font-size: 12px; color: #475569; margin-top: 6px; padding-top: 6px; border-top: 1px dashed #e2e8f0;">${safeString(inc.analysis)}</div>` : ''}
          </div>
        `;
      }).join('');
      
      const telephonyHtml = visibleTelephony && visibleTelephony.length > 0 ? `
        <table class="data-table" style="margin-bottom: 10px;">
          <thead>
            <tr>
              <th>Оператор</th>
              <th style="text-align: center;">Всего</th>
              <th style="text-align: center;">Отвечено</th>
              <th style="text-align: center;">Пропущено</th>
              <th style="text-align: center;">Ср. ожидание</th>
              <th style="text-align: center;">Ср. разговор</th>
            </tr>
          </thead>
          <tbody>
            ${visibleTelephony.map(row => `
              <tr>
                <td style="font-weight: 500;">${row.name}</td>
                <td style="text-align: center;">${row.total}</td>
                <td style="text-align: center; color: #10b981; font-weight: bold;">${row.answered}</td>
                <td style="text-align: center; color: ${row.missed > 0 ? '#ef4444' : '#64748b'}; font-weight: ${row.missed > 0 ? 'bold' : 'normal'};">${row.missed}</td>
                <td style="text-align: center;">${row.avgWait}</td>
                <td style="text-align: center;">${row.avgTalk}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : `
        <div class="editable-box" style="background-color: #f1f5f9; border-color: #cbd5e1; color: #64748b; font-style: italic; text-align: center; margin-bottom: 30px;">
          <span contenteditable="true" style="outline: none; border-bottom: 1px dashed #cbd5e1;">[ Загрузите статистику телефонии на вкладке "Заполнить неделю" или вставьте таблицу сюда ]</span>
        </div>
      `;
      
      const reportTelephonyInsight = buildReportTelephonyInsight();
      const telephonyInsightHtml = reportTelephonyInsight ? `
        <div style="background-color: #fffbeb; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; font-size: 13px; color: #92400e; margin-bottom: 30px;">
          <div style="font-weight: bold; margin-bottom: 5px;">🤖 Анализ телефонии и выгорания:</div>
          <div style="white-space: pre-wrap;">${safeString(reportTelephonyInsight)}</div>
        </div>
      ` : '';

      // КРАСИВЫЙ БЛОК ДЛЯ ДЕТАЛЬНЫХ ЗАДАЧ С УМНЫМИ БЕЙДЖАМИ И ФИЛЬТРАЦИЕЙ ИИ-ГАЛЛЮЦИНАЦИЙ
      const detailedTasksHtmlRendered = completedDetailedTasks.map(t => {
        let contextHtml = '';
        
        // 1. Проверяем комментарии на предмет мусора от ИИ (заглушки)
        const genericPhrases = [
            "проведена инфраструктурная проработка", 
            "ожидание данных ai", 
            "нет данных",
            "проверены или настроены",
            "выполнена задача",
            "стандартная процедура",
            "согласно заявке",
            "готово",
            "решено"
        ];
        const commentLower = (t.comments || '').toLowerCase();
        const isGeneric = genericPhrases.some(phrase => commentLower.includes(phrase));
        
        if (t.comments && t.comments.trim() !== '' && !isGeneric) {
           contextHtml = `
             <div style="font-size: 12px; color: #334155; margin-top: 8px; background-color: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0;">
               <span style="font-weight: 800; color: #64748b; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em;">Детали решения:</span><br/>
               <div style="margin-top: 4px; white-space: pre-wrap; line-height: 1.5;">${safeString(t.comments)}</div>
             </div>`;
        }

        // 2. Добавляем стикер Техдолга (если задача старая)
        const cycleDays = Number(t.cycleTime) || 0;
        let debtBadge = '';
        if (cycleDays >= 30) {
          debtBadge = `<span style="background-color: #fef2f2; color: #ef4444; border: 1px solid #fecaca; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em;">☠️ Закрыт старый долг (${cycleDays} дн.)</span>`;
        } else {
          debtBadge = `<span style="background-color: #f0fdf4; color: #10b981; border: 1px solid #bbf7d0; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em;">⚡ Свежая задача</span>`;
        }

        // 3. Сопоставляем с задачами руководства (умный и ЖЕСТКИЙ матчинг корней слов)
        const matchedProjectTask = findMatchingProjectTask(t);
        const isMgmtTask = Boolean(matchedProjectTask);

        let mgmtBadge = isMgmtTask 
          ? `<span style="display: inline-block; transform: rotate(-2deg); background-color: rgba(37, 99, 235, 0.05); color: #2563eb; border: 2px solid #2563eb; padding: 2px 6px; border-radius: 4px; font-weight: 800; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; margin-left: 8px;">⭐ ЗАДАЧА РУКОВОДСТВА</span>` 
          : '';

        // Выбираем цвет полоски (Синяя если от руководства, красная если долг, иначе базовая серая)
        const borderColor = isMgmtTask ? '#2563eb' : (cycleDays >= 30 ? '#ef4444' : '#94a3b8');

        return `
          <div style="margin-bottom: 20px; border-left: 3px solid ${borderColor}; padding-left: 14px; padding-bottom: 5px;">
             <div style="font-weight: 700; font-size: 14px; color: #0f172a; margin-bottom: 6px;">
               <span style="color: #3b82f6;">${t.id}</span>: ${safeString(t.title)}
             </div>
             <div style="font-size: 12px; color: #64748b; display: flex; align-items: center; flex-wrap: wrap; gap: 8px;">
               <span>Исполнитель: <span style="font-weight: 600; color: #1e293b;">${getFullName(t.assignee)}</span></span>
               <span style="color: #cbd5e1;">|</span>
               ${debtBadge}
               ${mgmtBadge}
             </div>
             ${contextHtml}
          </div>
        `;
      }).join('');

      let sectionCounter = 1;

      return `
        <style>
          .report-container { font-family: 'Segoe UI', system-ui, sans-serif; color: #1e293b; line-height: 1.6; max-width: 900px; margin: 0 auto; background: #ffffff; text-align: left; }
          .header { border-bottom: 3px solid #10b981; padding-bottom: 15px; margin-bottom: 25px; }
          .kpi-grid { display: flex; gap: 20px; margin-bottom: 30px; }
          .kpi-card { flex: 1; position: relative; background: #fff; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
          .kpi-hint { display: none; position: absolute; z-index: 30; left: 10px; top: 100%; width: 260px; background: #0f172a; color: #e2e8f0; border-radius: 8px; padding: 10px; font-size: 12px; line-height: 1.45; box-shadow: 0 18px 40px rgba(15, 23, 42, 0.25); }
          .kpi-card:hover .kpi-hint { display: block; }
          .data-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .data-table th { background: #f8fafc; padding: 10px 8px; text-align: left; font-size: 12px; text-transform: uppercase; color: #475569; border-bottom: 2px solid #e2e8f0; }
          .data-table td { padding: 10px 8px; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
          .section-title { font-size: 16px; font-weight: 700; border-left: 4px solid var(--accent); padding-left: 10px; margin: 40px 0 15px 0; text-transform: uppercase; color: #0f172a; }
          .editable-box { background: #fffbeb; border: 1px dashed #f59e0b; border-radius: 8px; padding: 15px; font-size: 13px; color: #92400e; margin-bottom: 30px; font-style: italic; text-align: center; }
          .incident-card { background: #f8fafc; border-left: 3px solid #f59e0b; padding: 10px; margin-bottom: 10px; border-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
          .csat-hover-wrap { display: inline-block; position: relative; margin: 8px 0 18px 0; }
          .csat-summary-pill { display: inline-block; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 999px; padding: 5px 10px; color: #475569; font-size: 12px; font-weight: 800; cursor: default; }
          .csat-popover { display: none; position: absolute; z-index: 20; left: 0; top: 30px; width: 620px; max-height: 360px; overflow-y: auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 10px; box-shadow: 0 18px 50px rgba(15, 23, 42, 0.18); padding: 14px; }
          .csat-hover-wrap:hover .csat-popover { display: block; }
          .value-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-bottom: 20px; }
          .value-card { border: 1px solid #e2e8f0; border-top: 4px solid #64748b; border-radius: 8px; padding: 12px; min-height: 120px; }
          ul.custom-list { padding-left: 20px; margin-top: 5px; list-style-type: square; font-size: 13px; color: #334155; }
          ul.custom-list li { margin-bottom: 6px; }
        </style>

        <div class="report-container">
          
          <div class="header">
            <h1 style="margin: 0 0 5px 0; font-size: 24px; color: #0f172a; text-transform: uppercase;">ОТЧЕТ РУКОВОДИТЕЛЮ</h1>
            <p style="margin: 0; color: #64748b; font-size: 14px;">Статус направления технической поддержки ОСО | Неделя ${weekData.weekNumber} (${safeString(weekData.dates)})</p>
          </div>

          <div style="padding: 0 10px;">

            <div class="section-title" style="--accent: #3b82f6;">${sectionCounter++}. Операционная сводка (KPI)</div>
            
            <div class="kpi-grid">
              <div class="kpi-card" style="border-top: 4px solid ${incColor};">
                <div style="font-size: 12px; color: #64748b; text-transform: uppercase; margin-bottom: 5px;">Инциденты (1 линия)</div>
                <div style="font-size: 24px; font-weight: bold; color: ${incColor}; margin-bottom: 5px;">${totalIncidents} <span style="font-size: 14px; font-weight: normal; color: #64748b;">решено</span></div>
                <div style="font-size: 12px; color: #64748b;">Очередь: ${weekData.incidentsQueue || 0}</div>
                ${renderProgressBar(totalIncidents, 400, incColor)}
                <div class="kpi-hint">Реально закрытые инциденты 1-й линии без задач, закрытых по бездействию. Очередь показывает текущий незакрытый остаток.</div>
              </div>
              
              <div class="kpi-card" style="border-top: 4px solid ${taskColor};">
                <div style="font-size: 12px; color: #64748b; text-transform: uppercase; margin-bottom: 5px;">Задачи (Инфра)</div>
                <div style="font-size: 24px; font-weight: bold; color: ${taskColor}; margin-bottom: 5px;">${totalClosedCount} <span style="font-size: 14px; font-weight: normal; color: #64748b;">закрыто</span></div>
                <div style="font-size: 12px; color: #64748b;">Бэклог: ${weekData.backlog || 0} (>30д: ${weekData.backlogOld30 || 0})</div>
                ${renderProgressBar(totalClosedCount, 100, taskColor)}
                <div class="kpi-hint">Сумма закрытых плановых, срочных и бэклог-задач. Бэклог и задачи старше 30 дней показывают технический долг.</div>
              </div>
              
              <div class="kpi-card" style="border-top: 4px solid ${indexColor};">
                <div style="font-size: 12px; color: #64748b; text-transform: uppercase; margin-bottom: 5px;">Индекс SLA</div>
                <div style="font-size: 24px; font-weight: bold; color: ${indexColor}; margin-bottom: 5px;">${managementIndex}<span style="font-size: 14px; font-weight: normal; color: #64748b;">/100</span></div>
                <div style="font-size: 12px; color: #64748b;">Возвраты: ${weekData.reopenRate || 0}%</div>
                ${renderProgressBar(managementIndex, 100, indexColor)}
                <div class="kpi-hint">Индекс строится от соблюдения SLA. Возвраты показывают долю задач, которые пришлось дорабатывать после закрытия.</div>
              </div>
            </div>

            <div class="section-title" style="--accent: #10b981;">${sectionCounter++}. Блок 1-й Линии (Инциденты и Телефония)</div>
            
            <h3 style="font-size: 14px; color: #475569; margin-bottom: 10px;">Эффективность смен (без учета тимлида)</h3>
            <p style="font-size: 12px; color: #64748b; margin-bottom: 10px;"><i>Администраторы, отмеченные значком 🔥, находятся в зоне риска выгорания (перегруз).</i></p>
            ${generateTableHtml(['Администратор', 'Закрыто', 'Ср. Время', 'Профиль', 'CSAT'], incRows.slice(0, 5))}
            ${csatFeedbackHtml}

            <h3 style="font-size: 14px; color: #475569; margin-bottom: 10px; margin-top: 20px;">Ключевые системные проблемы (Топ-3)</h3>
            ${topIncidentsHtml || '<p style="font-size: 13px; color: #64748b;">Нет данных</p>'}

            <h3 style="font-size: 14px; color: #475569; margin-bottom: 10px; margin-top: 20px;">Сводка по Телефонии</h3>
            ${telephonyHtml}
            ${telephonyInsightHtml}

            <div class="section-title" style="--accent: #a855f7;">${sectionCounter++}. Блок Инфраструктуры (Задачи)</div>
            
            ${weekData.taskTypesDistribution && weekData.taskTypesDistribution.length > 0 ? `
              <h3 style="font-size: 14px; color: #475569; margin-bottom: 10px;">Распределение фокуса (Ценность vs Рутина)</h3>
              ${renderPieChart()}
              <div style="margin-bottom: 20px;"></div>
            ` : ''}

            <h3 style="font-size: 14px; color: #475569; margin-bottom: 10px;">Нагрузка администраторов (без учета тимлида)</h3>
            <p style="font-size: 12px; color: #64748b; margin-bottom: 10px;"><i>Администраторы, отмеченные значком 🔥, находятся в зоне риска выгорания (перегруз).</i></p>
            ${generateTableHtml(['Администратор', 'В работе (WIP)', 'Закрыто', 'Cycle Time', 'Профиль'], taskRows.slice(0, 7))}
            ${renderValueShowcase()}

            <h3 style="font-size: 14px; color: #475569; margin-bottom: 10px; margin-top: 20px;">Выполненные ключевые задачи (Ценность)</h3>
            <ul class="custom-list" style="color: #94a3b8; font-style: italic; margin-bottom: 15px;">
              <li><span contenteditable="true" style="outline: none; border-bottom: 1px dashed #cbd5e1;">[ Кликните на этот текст, удалите его и впишите достижения вручную... ]</span></li>
            </ul>
            ${completedDetailedTasks.length > 0 ? `
              <p style="font-size: 12px; font-weight: bold; color: #475569; margin-bottom: 10px;">Автоматическая сводка из Jira:</p>
              <div>
                ${detailedTasksHtmlRendered}
              </div>
            ` : '<p style="font-size: 13px; color: #64748b; font-style: italic;">Список задач загружается через импорт подробного архива JSON.</p>'}

            <div class="section-title" style="--accent: #f59e0b;">${sectionCounter++}. Статусы по проектам и поручениям руководства</div>
            
            <div id="management-tasks-container">
               ${generateTasksHtml()}
            </div>

            <div class="section-title" style="--accent: #ef4444;">${sectionCounter++}. Риски, Инциденты и Улучшения</div>
            <ul class="custom-list" style="line-height: 1.6;">
              <li><b>Топ драйверы инцидентов:</b> ${top3Text || 'Нет данных'}</li>
              <li><b>Ситуация в потоке:</b> ${safeString(weekData.mainRisk).replace(/\n/g, ' ')}</li>
              <li><b>План расшивки:</b> ${safeString(weekData.nextFocus).replace(/\n/g, ' ')}</li>
            </ul>

          </div>
        </div>
      `;
    } catch (err) {
      console.error("Error generating report HTML:", err);
      return `
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; border-radius: 8px;">
           <h3 style="color: #b91c1c; margin-top: 0;">⚠️ Ошибка отрисовки HTML</h3>
           <p style="color: #7f1d1d; font-size: 14px;">${err.message}</p>
           <p style="color: #7f1d1d; font-size: 12px;">Пожалуйста, проверьте целостность JSON-данных или обратитесь к разработчику.</p>
        </div>
      `;
    }
  };

  useEffect(() => {
    if (reportRef.current) {
        if (weekData.isReportFrozen && weekData.customReportHtml) {
            reportRef.current.innerHTML = weekData.customReportHtml;
        } else {
            reportRef.current.innerHTML = getReportHtmlString();
        }
    }
  }, [weekData]);

  // Функция для очистки HTML перед экспортом
  const getCleanHtml = () => {
    if (!reportRef.current) return '';
    const clone = reportRef.current.cloneNode(true);
    
    // Удаляем элементы, которые не должны попасть в экспорт (кнопки +, селекты цветов)
    const noPrints = clone.querySelectorAll('.no-print');
    noPrints.forEach(el => el.remove());

    // Убираем атрибуты редактирования и пунктирные линии подсказок
    const editables = clone.querySelectorAll('[contenteditable]');
    editables.forEach(el => {
        el.removeAttribute('contenteditable');
        el.style.borderBottom = 'none';
        el.style.outline = 'none';
    });

    return clone.innerHTML;
  };

  const handleCopyHtml = async () => {
    try {
      const htmlContent = getCleanHtml();
      const fullHtml = `<html><body>${htmlContent}</body></html>`;
      const blobHtml = new Blob([fullHtml], { type: "text/html" });
      
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      const blobText = new Blob([tempDiv.innerText], { type: "text/plain" });
      
      const data = [new ClipboardItem({ ["text/plain"]: blobText, ["text/html"]: blobHtml })];
      
      await navigator.clipboard.write(data);
      setCopiedId('html');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      const textArea = document.createElement("textarea");
      textArea.value = "Ошибка копирования HTML. Воспользуйтесь выделением текста (Ctrl+A) и копированием (Ctrl+C) прямо внутри белого поля."; 
      document.body.appendChild(textArea); textArea.select();
      document.execCommand('copy'); document.body.removeChild(textArea);
      setCopiedId('html'); setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleDownloadHtml = () => {
    const htmlContent = getCleanHtml();
    const htmlString = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>ОТЧЕТ РУКОВОДИТЕЛЮ - Неделя ${weekData.weekNumber}</title>
      </head>
      <body style="background-color: #f8fafc; padding: 40px;">
        <div style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); max-width: 900px; margin: 0 auto; overflow: hidden; padding: 40px 0;">
          ${htmlContent}
        </div>
      </body>
      </html>
    `;
    const blob = new Blob([htmlString], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Executive_Summary_Week_${weekData.weekNumber}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-in fade-in duration-500 pb-10 flex flex-col items-center">
      
      <div className="w-full max-w-4xl flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1 uppercase tracking-tighter">ОТЧЕТ РУКОВОДИТЕЛЮ</h1>
          <p className="text-slate-400 text-sm">Сборка и экспорт статус-отчета за неделю</p>
        </div>
        <WeekSelector historyKeys={historyKeys} weeksHistory={weeksHistory} selectedKey={selectedKey} onSelect={onWeekSelect} activeData={weekData} />
      </div>

      {/* НОВАЯ ПАНЕЛЬ УПРАВЛЕНИЯ ПОРУЧЕНИЯМИ */}
      {!weekData.isReportFrozen && (
        <div className="w-full max-w-4xl bg-slate-800 rounded-xl border border-slate-700/50 shadow-sm mb-6 overflow-hidden">
          <div className="bg-fuchsia-500/10 py-3 px-6 border-b border-fuchsia-500/20 flex items-center gap-2">
            <FileText size={18} className="text-fuchsia-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Портфель поручений руководства (Глобальный)</h2>
          </div>
          
          <div className="p-6">
            <div className="space-y-4 mb-6">
              {tasksForThisWeek.map(t => {
                const weeksActive = getWeeksDiff(t.createdWeekKey, selectedKey);
                const isCompleted = t.status === 'completed';
                
                return (
                  <div key={t.id} className={`p-4 rounded-lg border ${isCompleted ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-900/50 border-slate-700/50'} flex flex-col gap-3 relative transition-all`}>
                    
                    {/* Кнопка удаления */}
                    <button onClick={() => handleDeleteProjectTask(t.id)} className="absolute top-3 right-3 text-slate-500 hover:text-red-400 transition-colors p-1" title="Удалить навсегда">
                      <Trash2 size={16} />
                    </button>

                    <div className="flex gap-4 items-start pr-8">
                       {/* Чекбокс */}
                       <button onClick={() => handleCompleteProjectTask(t.id)} className={`mt-1 flex-shrink-0 w-6 h-6 rounded border flex items-center justify-center transition-colors ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-slate-800 border-slate-600 text-transparent hover:border-emerald-500'}`}>
                         <Check size={14} />
                       </button>

                       <div className="flex-1 space-y-2">
                          <input 
                            type="text" 
                            value={t.title} 
                            onChange={(e) => handleUpdateProjectTask(t.id, 'title', e.target.value)}
                            disabled={isCompleted}
                            className={`w-full bg-transparent font-bold outline-none border-b border-dashed focus:border-fuchsia-500 transition-colors ${isCompleted ? 'text-emerald-400 border-transparent line-through opacity-70' : 'text-slate-200 border-slate-600'}`}
                          />
                          
                          <div className="flex flex-wrap gap-2 items-center">
                            {!isCompleted && (
                              <select 
                                value={t.color} 
                                onChange={(e) => handleUpdateProjectTask(t.id, 'color', e.target.value)}
                                className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white outline-none cursor-pointer"
                              >
                                <option value="#10b981">🟢 Зеленый</option>
                                <option value="#f59e0b">🟡 Желтый</option>
                                <option value="#ef4444">🔴 Красный</option>
                                <option value="#3b82f6">🔵 Синий</option>
                                <option value="#0f172a">⚫ Черный</option>
                              </select>
                            )}
                            
                            <input 
                              type="text" 
                              value={t.comment} 
                              onChange={(e) => handleUpdateProjectTask(t.id, 'comment', e.target.value)}
                              placeholder="Текущий статус..."
                              className={`flex-1 bg-transparent text-sm outline-none border-b border-dashed focus:border-fuchsia-500 transition-colors ${isCompleted ? 'text-emerald-300 border-transparent' : 'text-slate-400 border-slate-700'}`}
                            />
                          </div>

                          {/* AI Подсказка по срокам */}
                          {!isCompleted && weeksActive > 0 && (
                             <div className={`text-[10px] font-bold flex items-center gap-1 mt-2 w-max px-2 py-0.5 rounded ${weeksActive >= 2 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                               <AlertTriangle size={12}/> {weeksActive >= 2 ? `Внимание: Задача висит ${weeksActive} нед.! Риск затягивания.` : `В работе 2-ю неделю.`}
                             </div>
                          )}
                       </div>
                    </div>
                  </div>
                );
              })}
              
              {tasksForThisWeek.length === 0 && (
                <p className="text-slate-500 text-sm italic text-center py-4">Нет активных поручений.</p>
              )}
            </div>

            {/* Форма добавления */}
            <div className="bg-slate-900 rounded-lg border border-slate-700 p-4 flex flex-col md:flex-row gap-3 items-end">
               <div className="flex-1 w-full">
                 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Новое поручение</label>
                 <input type="text" value={newTaskTitle} onChange={e=>setNewTaskTitle(e.target.value)} placeholder="Суть задачи..." className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-fuchsia-500 outline-none" />
               </div>
               <div className="w-full md:w-48">
                 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Цвет (Статус)</label>
                 <select value={newTaskColor} onChange={e=>setNewTaskColor(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-fuchsia-500 outline-none">
                    <option value="#10b981">🟢 Зеленый</option>
                    <option value="#f59e0b">🟡 Желтый</option>
                    <option value="#ef4444">🔴 Красный</option>
                    <option value="#3b82f6">🔵 Синий</option>
                    <option value="#0f172a">⚫ Черный</option>
                 </select>
               </div>
               <button onClick={handleAddProjectTask} disabled={!newTaskTitle.trim()} className="w-full md:w-auto bg-fuchsia-600 hover:bg-fuchsia-500 disabled:bg-slate-700 text-white px-6 py-2 rounded font-bold text-sm transition-colors shadow-lg flex items-center justify-center gap-2 h-[38px]">
                 <Plus size={16}/> Добавить
               </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-4xl bg-slate-800 rounded-xl border border-slate-700/50 shadow-2xl flex flex-col overflow-hidden mb-8">
        
        <div className="bg-slate-900 py-3 px-6 text-[10px] font-bold uppercase tracking-widest flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            {weekData.isReportFrozen ? (
              <><Lock size={14} className="text-amber-500"/> <span className="text-amber-500/80">Отчет зафиксирован (Включены ручные правки)</span></>
            ) : (
              <><Activity size={14} className="text-emerald-500"/> <span className="text-emerald-500/80">Автообновление (Данные)</span></>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Edit3 size={14} className="text-blue-400"/> Кликни на лист для правки текста
          </div>
        </div>

        <div className="bg-slate-800/80 px-6 py-4 border-b border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex gap-2 w-full sm:w-auto">
             {weekData.isReportFrozen ? (
                <button onClick={handleUnfreezeReport} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-lg flex items-center gap-2" title="Сбросить правки и пересчитать по ИИ">
                   <RefreshCcw size={16} /> <span className="hidden sm:inline">Сбросить правки</span>
                </button>
             ) : (
                <button onClick={() => { handleFreezeReport(); setIsDirty(false); }} className={`${isDirty ? 'bg-amber-500 animate-pulse text-slate-900' : 'bg-amber-600 text-white'} hover:bg-amber-500 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-lg flex items-center gap-2`} title="Сохранить текущий вид и отключить автообновление">
                   <Save size={16} /> <span className="hidden sm:inline">Зафиксировать документ</span>
                </button>
             )}
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={handleCopyHtml} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-colors ${copiedId === 'html' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg'}`}>
              {copiedId === 'html' ? <Check size={18} /> : <Copy size={18} />} 
              <span className="hidden sm:inline">{copiedId === 'html' ? 'Успешно скопировано!' : 'Копировать'}</span>
              <span className="sm:hidden">{copiedId === 'html' ? 'ОК' : 'Copy'}</span>
            </button>
            <button onClick={handleDownloadHtml} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-lg transition-colors shadow-lg flex items-center gap-2" title="Скачать как HTML файл (для PDF)">
              <Download size={18} /> <span className="hidden sm:inline">Скачать HTML</span>
            </button>
          </div>
        </div>
        
        <div className="p-8 bg-slate-300 flex justify-center custom-scrollbar overflow-y-auto" style={{ maxHeight: '70vh' }}>
          <div 
            ref={reportRef}
            contentEditable={true} 
            suppressContentEditableWarning={true}
            onInput={() => { if(!weekData.isReportFrozen) setIsDirty(true); }}
            className="bg-white shadow-2xl outline-none transition-all text-slate-900 text-left" 
            style={{ 
              width: '100%', 
              maxWidth: '900px', 
              minHeight: '1120px', 
              padding: '0' 
            }}
          />
        </div>
      </div>
    </div>
  );
};

// --- ПРОЦЕССЫ, КАЙДЗЕН, ПРОФИЛИ И АДМИНКА ---

const ProcessesMap = ({ processes }) => {
  const getStatusBadge = (status) => {
    switch(status) {
      case 'working': return <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-md text-xs font-bold border border-emerald-500/20"><CheckCircle size={14}/> Работает</span>;
      case 'needs_review': return <span className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-md text-xs font-bold border border-amber-500/20"><AlertTriangle size={14}/> Требует пересмотра</span>;
      default: return <span className="flex items-center gap-1.5 bg-slate-700/50 text-slate-400 px-2.5 py-1 rounded-md text-xs font-bold border border-slate-600"><HelpCircle size={14}/> В работе</span>;
    }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-6xl pb-10">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Процессы и Эскалации</h1>
          <p className="text-slate-400 text-sm">Управление операционной моделью, работа с недоверием и узкими местами</p>
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {processes.map(proc => (
          <div key={proc.id} className="bg-slate-800 rounded-xl border border-slate-700/50 shadow-sm overflow-hidden flex flex-col transition-all hover:border-slate-600">
            <div className="p-5 border-b border-slate-700/50 flex justify-between items-start bg-slate-900/20">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">{safeString(proc.name)}</h3>
                <p className="text-slate-500 text-xs flex items-center gap-1"><Users size={12}/> Владелец: {safeString(proc.owner)}</p>
              </div>
              {getStatusBadge(proc.status)}
            </div>
            <div className="p-5 flex-1 space-y-4">
              <div><span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Цель процесса</span><p className="text-sm text-slate-300">{safeString(proc.goal)}</p></div>
              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                <span className="text-xs font-bold text-amber-400/80 uppercase tracking-wider mb-1 flex items-center gap-1"><AlertTriangle size={14}/> Узкое место / Зона эскалации</span>
                <p className="text-sm text-slate-300">{safeString(proc.currentProblem)}</p>
              </div>
            </div>
            <div className="p-5 bg-slate-900/40 border-t border-slate-700/50">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1"><ArrowRight size={14}/> Гипотеза (Что меняем)</span>
              <p className="text-sm font-medium text-emerald-100">{safeString(proc.nextExperiment)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AchievementsBoard = ({ achievements }) => {
  const teamAchievements = achievements.filter(a => a.type === 'team');
  const individualAchievements = achievements.filter(a => a.type === 'individual');

  const getIcon = (iconName, colorClass) => {
    const props = { size: 24, className: `text-${colorClass}-400` };
    switch(iconName) {
      case 'ShieldCheck': return <ShieldCheck {...props} />;
      case 'Zap': return <Zap {...props} />;
      case 'Medal': return <Medal {...props} />;
      case 'BookOpen': return <BookOpen {...props} />;
      case 'Star': return <Star {...props} />;
      case 'Heart': return <Heart {...props} />;
      default: return <Award {...props} />;
    }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-6xl pb-10">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Кайдзен и Улучшения процессов</h1>
          <p className="text-slate-400 text-sm">Практика непрерывного улучшения (PDCA) и работа с системными ограничениями</p>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700/50 shadow-sm p-6 mb-8 flex items-start gap-4">
        <div className="bg-indigo-500/20 p-3 rounded-lg border border-indigo-500/30 text-indigo-400 shrink-0"><Activity size={24} /></div>
        <div>
          <h3 className="text-slate-200 font-medium mb-1">Управляем потоком, а не людьми</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            На <b>Этапе 2</b> мы фокусируемся на метриках и процессов. Мы отмечаем успешные процессные изменения (гипотезы), 
            которые сократили Cycle Time, снизили Reopen Rate или расшили узкое горлышко (Bottleneck).
          </p>
        </div>
      </div>

      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><GitMerge size={20} className="text-blue-400" /> Командные победы (Delivery)</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {teamAchievements.map(a => (
          <div key={a.id} className={`bg-slate-800 rounded-xl p-5 border-t-4 border-${a.color}-500 shadow-sm flex items-start gap-4`}>
            <div className={`bg-${a.color}-500/10 p-3 rounded-lg border border-${a.color}-500/20 shrink-0`}>{getIcon(a.icon, a.color)}</div>
            <div>
              <h3 className="font-bold text-slate-200 mb-1">{safeString(a.title)}</h3>
              <p className="text-slate-400 text-sm">{safeString(a.description)}</p>
            </div>
          </div>
        ))}
        {teamAchievements.length === 0 && <p className="text-slate-500 text-sm col-span-3">Пока нет командных побед на этой неделе.</p>}
      </div>

      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Star size={20} className="text-amber-400" /> Успешные процессные гипотезы (Кайдзен)</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {individualAchievements.map(a => (
          <div key={a.id} className="bg-slate-800 rounded-xl p-5 border border-slate-700/50 shadow-sm flex flex-col relative overflow-hidden group">
            <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity`}>{getIcon(a.icon, 'slate')}</div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-300 border border-slate-600 shrink-0">
                {safeString(a.person).trim() ? safeString(a.person).split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??'}
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">{safeString(a.person)}</h3>
                <span className={`text-xs font-medium text-${a.color}-400 bg-${a.color}-500/10 px-2 py-0.5 rounded border border-${a.color}-500/20`}>{safeString(a.title)}</span>
              </div>
            </div>
            <p className="text-slate-400 text-sm mt-2">{safeString(a.description)}</p>
          </div>
        ))}
        {individualAchievements.length === 0 && <p className="text-slate-500 text-sm col-span-3">Пока нет личных достижений на этой неделе.</p>}
      </div>
    </div>
  );
};

const TeamProfilesBoard = ({ profiles }) => {
  const getDelegationText = (level) => {
    switch(Number(level)) {
      case 1: return "Выполняет по детальной инструкции";
      case 2: return "Выполняет с регулярной проверкой (ревью)";
      case 3: return "Самостоятельно ведет типовые задачи";
      case 4: return "Может быть владельцем процесса";
      case 5: return "Обучает других и улучшает архитектуру";
      default: return "Не определен";
    }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-6xl pb-10">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Матрица компетенций и Bus Factor (Этап 2)</h1>
          <p className="text-slate-400 text-sm">Управление пропускной способностью, выявление "узких горлышек" и распределение нагрузки</p>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700/50 shadow-sm p-6 mb-8 flex items-start gap-4">
        <div className="bg-emerald-500/20 p-3 rounded-lg border border-emerald-500/30 text-emerald-400 shrink-0"><Users size={24} /></div>
        <div>
          <h3 className="text-slate-200 font-medium mb-1">Аналитика ресурсов (Capacity)</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Система выявляет, на ком из администраторов "замыкаются" процессы (Bus Factor), и показывает `T-shape` потенциал.
            Оценка строится на базе реальных метрик, чтобы выровнять нагрузку и расшить узкие места в потоке (Theory of Constraints).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {profiles && profiles.map(p => (
          <div key={p.id} className="bg-slate-800 rounded-2xl border border-slate-700/50 overflow-hidden flex flex-col shadow-xl">
            <div className="p-6 border-b border-slate-700/50 bg-slate-900/30 flex gap-5 items-center">
              <div className={`w-16 h-16 rounded-2xl bg-${p.color || 'blue'}-500/20 flex items-center justify-center text-2xl font-black text-${p.color || 'blue'}-400 border-2 border-${p.color || 'blue'}-500/30 shrink-0`}>
                {safeString(p.name).trim() ? safeString(p.name).split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??'}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-0.5">{safeString(p.name)}</h3>
                <p className="text-slate-400 text-sm font-medium flex items-center gap-1.5"><Award size={14}/> {safeString(p.role)}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Уровень автономности:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(lvl => (
                      <div key={lvl} className={`w-4 h-4 rounded-sm ${lvl <= Number(p.delegationLevel) ? `bg-${p.color || 'blue'}-500` : 'bg-slate-700'}`} title={`Уровень ${lvl}`}></div>
                    ))}
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 italic">"{getDelegationText(p.delegationLevel)}"</p>
              </div>
            </div>
            
            <div className="p-6 space-y-5 flex-1">
              <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/30">
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block mb-2 flex items-center gap-1.5"><Star size={14}/> Ключевые компетенции в потоке</span>
                <p className="text-sm text-slate-300 leading-relaxed font-medium">{safeString(p.strengths)}</p>
              </div>
              <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-2 flex items-center gap-1.5"><Target size={14}/> Текущая процессная зона</span>
                <p className="text-sm text-slate-300 leading-relaxed">{safeString(p.bestTasks)}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/20 p-3 rounded-xl border border-slate-700/20">
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-1 flex items-center gap-1.5"><TrendingUp size={12}/> Потенциал расширения (T-shape)</span>
                  <p className="text-xs text-slate-400">{safeString(p.growthZone)}</p>
                </div>
                <div className="bg-slate-900/20 p-3 rounded-xl border border-slate-700/20">
                  <span className="text-[10px] font-black text-red-400 uppercase tracking-widest block mb-1 flex items-center gap-1.5"><ShieldAlert size={12}/> Риск узкого горлышка / Bus Factor</span>
                  <p className="text-xs text-slate-400">{safeString(p.risks)}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
        {(!profiles || profiles.length === 0) && (
          <div className="col-span-2 flex flex-col items-center justify-center p-12 bg-slate-800/50 rounded-xl border border-slate-700/50 border-dashed">
            <Users size={48} className="text-slate-600 mb-4" />
            <p className="text-slate-400 text-sm">Профили не загружены.</p>
            <p className="text-slate-500 text-xs mt-1">Они появятся после импорта данных из аналитики.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminSettings = ({ users, onAddUser, onUpdateUser, onDeleteUser }) => {
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('viewer');
  
  const [editId, setEditId] = useState(null);
  const [editPassword, setEditPassword] = useState('');

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newUsername || !newPassword) return;
    await onAddUser({ username: newUsername, password: newPassword, role: newRole });
    setNewUsername(''); setNewPassword('');
  };

  const handleUpdate = async (e, id) => {
    e.preventDefault();
    if (!editPassword) return;
    await onUpdateUser(id, editPassword);
    setEditId(null); setEditPassword('');
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl pb-10">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Настройки доступа</h1>
          <p className="text-slate-400 text-sm">Управление пользователями и ролями</p>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700/50 shadow-sm overflow-hidden mb-8">
        <div className="p-5 border-b border-slate-700/50 bg-slate-900/30">
          <h3 className="text-lg font-bold text-white flex items-center gap-2"><UserPlus size={18} className="text-emerald-400"/> Добавить пользователя</h3>
        </div>
        <form onSubmit={handleAdd} className="p-6 flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:w-1/3">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Логин</label>
            <input type="text" required value={newUsername} onChange={e=>setNewUsername(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none" />
          </div>
          <div className="w-full md:w-1/3">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Пароль</label>
            <input type="password" required value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none" />
          </div>
          <div className="w-full md:w-1/4">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Роль</label>
            <select value={newRole} onChange={e=>setNewRole(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none">
              <option value="admin">Администратор</option>
              <option value="viewer">Просмотр</option>
            </select>
          </div>
          <button type="submit" className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg font-bold transition-colors">Создать</button>
        </form>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700/50 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-700/50 bg-slate-900/30">
          <h3 className="text-lg font-bold text-white flex items-center gap-2"><Users size={18} className="text-blue-400"/> Список пользователей</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700/50 text-slate-400 text-xs uppercase bg-slate-900/50">
                <th className="p-4 font-medium">Логин</th>
                <th className="p-4 font-medium">Роль</th>
                <th className="p-4 font-medium text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-900/20 transition-colors">
                  <td className="p-4 text-white font-medium">{u.username}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold border ${u.role === 'admin' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-slate-700/50 text-slate-300 border-slate-600'}`}>
                      {u.role === 'admin' ? 'Admin' : 'Viewer'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {editId === u.id ? (
                      <form onSubmit={(e) => handleUpdate(e, u.id)} className="flex items-center justify-end gap-2">
                        <input type="password" placeholder="Новый пароль" required value={editPassword} onChange={e=>setEditPassword(e.target.value)} className="w-32 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none" />
                        <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded text-xs font-bold">Сохр.</button>
                        <button type="button" onClick={() => setEditId(null)} className="bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded text-xs font-bold">Отмена</button>
                      </form>
                    ) : (
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => setEditId(u.id)} className="text-slate-400 hover:text-white text-xs font-bold transition-colors">Сменить пароль</button>
                        {u.username !== 'admin' && (
                          <button onClick={() => onDeleteUser(u.id)} className="text-red-400 hover:text-red-300 transition-colors p-1"><Trash2 size={16} /></button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- ОСНОВНОЕ ПРИЛОЖЕНИЕ ---
const App = () => {
  const [activeTab, setActiveTab] = useState('pulse'); 
  const [isLoaded, setIsLoaded] = useState(false);
  const [dbStatus, setDbStatus] = useState('loading'); 
  const isReadyToSave = useRef(false);
  const [supabaseClient, setSupabaseClient] = useState(null);

  // AUTH STATE
  const [currentUser, setCurrentUser] = useState(null);
  const [authUsers, setAuthUsers] = useState([]);
  const [loginError, setLoginError] = useState('');

  // ДАННЫЕ
  const [weeksHistory, setWeeksHistory] = useState(() => {
    try { const saved = localStorage.getItem('teamlead_history_data_v8'); if (saved) return JSON.parse(saved); } catch (e) {}
    return { [`${defaultWeekData.year}-${defaultWeekData.weekNumber}`]: defaultWeekData };
  });

  const [selectedWeekKey, setSelectedWeekKey] = useState(() => {
    const keys = Object.keys(weeksHistory);
    return keys.length > 0 ? keys.sort().pop() : `${defaultWeekData.year}-${defaultWeekData.weekNumber}`;
  });

  const [processes, setProcesses] = useState(() => { try { const saved = localStorage.getItem('teamlead_processes_v8'); if (saved) return JSON.parse(saved); } catch (e) {} return defaultProcesses; });
  const [achievements, setAchievements] = useState(() => { try { const saved = localStorage.getItem('teamlead_achievements_v8'); if (saved) return JSON.parse(saved); } catch (e) {} return defaultAchievements; });
  const [profiles, setProfiles] = useState(() => { try { const saved = localStorage.getItem('teamlead_profiles_v8'); if (saved) return JSON.parse(saved); } catch (e) {} return defaultProfiles; });
  const [tasksArchive, setTasksArchive] = useState(() => { try { const saved = localStorage.getItem('teamlead_tasks_archive_v8'); if (saved) return JSON.parse(saved); } catch (e) {} return []; });
  const [csatReviews, setCsatReviews] = useState(() => { try { const saved = localStorage.getItem('teamlead_csat_reviews_v8'); if (saved) return JSON.parse(saved); } catch (e) {} return {}; });
  
  // НОВЫЙ ГЛОБАЛЬНЫЙ СТЕЙТ ПРОЕКТНЫХ ПОРУЧЕНИЙ РУКОВОДСТВА
  const [projectTasks, setProjectTasks] = useState(() => { try { const saved = localStorage.getItem('teamlead_project_tasks_v8'); if (saved) return JSON.parse(saved); } catch (e) {} return []; });

  // Инициализация (загрузка из облака или кэша)
  useEffect(() => {
    let mounted = true;
    
    const initData = async (client) => {
      let cloudData = null;
      if (client) {
        try {
          const { data, error } = await client.from('app_state').select('*');
          if (data && !error) { cloudData = data; setDbStatus('connected'); } 
          else { setDbStatus('error'); }
        } catch (e) { setDbStatus('error'); }
      } else { setDbStatus('local'); }

      if (!mounted) return;

      // 1. ЗАГРУЗКА ДАННЫХ
      if (cloudData && cloudData.length > 0) {
        const hRow = cloudData.find(r => r.key_name === 'history'); if (hRow) { setWeeksHistory(hRow.value_data); setSelectedWeekKey(Object.keys(hRow.value_data).sort().pop()); }
        const procRow = cloudData.find(r => r.key_name === 'processes'); if (procRow) setProcesses(procRow.value_data);
        const achRow = cloudData.find(r => r.key_name === 'achievements'); if (achRow) setAchievements(achRow.value_data);
        const profRow = cloudData.find(r => r.key_name === 'profiles'); if (profRow) setProfiles(profRow.value_data);
        const taskRow = cloudData.find(r => r.key_name === 'tasks_archive'); if (taskRow) setTasksArchive(taskRow.value_data);
        const projTaskRow = cloudData.find(r => r.key_name === 'project_tasks'); if (projTaskRow) setProjectTasks(projTaskRow.value_data);
        const csatRow = cloudData.find(r => r.key_name === 'csat_reviews'); if (csatRow) setCsatReviews(csatRow.value_data || {});
      }

      // 2. ИНИЦИАЛИЗАЦИЯ ПОЛЬЗОВАТЕЛЕЙ (АВТОРИЗАЦИЯ)
      let loadedAuthUsers = [];
      if (cloudData) {
        const authRow = cloudData.find(r => r.key_name === 'auth_users');
        if (authRow) loadedAuthUsers = authRow.value_data;
      } else {
        try { const localAuth = localStorage.getItem('teamlead_auth_v8'); if (localAuth) loadedAuthUsers = JSON.parse(localAuth); } catch (e) {}
      }

      if (!loadedAuthUsers || loadedAuthUsers.length === 0) {
        const defaultHash = await hashPassword('Wmg82bpe'); 
        loadedAuthUsers = [{ id: Date.now(), username: 'admin', passwordHash: defaultHash, role: 'admin' }];
        
        if (client && dbStatus !== 'error') {
           await client.from('app_state').upsert({ key_name: 'auth_users', value_data: loadedAuthUsers });
        } else {
           localStorage.setItem('teamlead_auth_v8', JSON.stringify(loadedAuthUsers));
        }
      }
      setAuthUsers(loadedAuthUsers);

      try {
        const session = localStorage.getItem('teamlead_session');
        if (session) {
          const { u, h } = JSON.parse(session);
          const foundUser = loadedAuthUsers.find(user => user.username === u && user.passwordHash === h);
          if (foundUser) setCurrentUser(foundUser);
        }
      } catch(e) {}

      setIsLoaded(true);
      setTimeout(() => { if (mounted) isReadyToSave.current = true; }, 1000);
    };

    let url = '';
    let key = '';
    try {
      const env = typeof import.meta !== 'undefined' ? import.meta.env : {};
      url = env.VITE_SUPABASE_URL || '';
      key = env.VITE_SUPABASE_ANON_KEY || '';
    } catch (e) {}

    if (url && key) {
      if (window.supabase) {
        const client = window.supabase.createClient(url, key);
        setSupabaseClient(client);
        initData(client);
      } else {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.7/dist/umd/supabase.min.js';
        script.async = true;
        script.onload = () => {
          if (window.supabase) {
            const client = window.supabase.createClient(url, key);
            setSupabaseClient(client);
            initData(client);
          } else {
            initData(null);
          }
        };
        script.onerror = () => initData(null);
        document.head.appendChild(script);
      }
    } else {
      initData(null);
    }

    return () => { mounted = false; };
  }, []);

  // Синхронизация при изменениях
  const saveToDb = async (key, data, localName) => {
      if (!isReadyToSave.current) return;
      localStorage.setItem(localName, JSON.stringify(data));
      if (supabaseClient && dbStatus === 'connected') {
          await supabaseClient.from('app_state').upsert({ key_name: key, value_data: data });
      }
  };

  useEffect(() => { saveToDb('history', weeksHistory, 'teamlead_history_data_v8'); }, [weeksHistory]);
  useEffect(() => { saveToDb('processes', processes, 'teamlead_processes_v8'); }, [processes]);
  useEffect(() => { saveToDb('achievements', achievements, 'teamlead_achievements_v8'); }, [achievements]);
  useEffect(() => { saveToDb('profiles', profiles, 'teamlead_profiles_v8'); }, [profiles]);
  useEffect(() => { saveToDb('tasks_archive', tasksArchive, 'teamlead_tasks_archive_v8'); }, [tasksArchive]);
  useEffect(() => { saveToDb('auth_users', authUsers, 'teamlead_auth_v8'); }, [authUsers]);
  useEffect(() => { saveToDb('project_tasks', projectTasks, 'teamlead_project_tasks_v8'); }, [projectTasks]);
  useEffect(() => { saveToDb('csat_reviews', csatReviews, 'teamlead_csat_reviews_v8'); }, [csatReviews]);

  // ФУНКЦИИ АВТОРИЗАЦИИ
  const handleLogin = async (username, password) => {
    setLoginError('');
    const inputHash = await hashPassword(password);
    const user = authUsers.find(u => u.username === username && u.passwordHash === inputHash);
    
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('teamlead_session', JSON.stringify({ u: user.username, h: user.passwordHash }));
    } else {
      setLoginError('Неверный логин или пароль');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('teamlead_session');
    setActiveTab('pulse');
  };

  // УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ (АДМИНКА)
  const handleAddUser = async (newUser) => {
    const hash = await hashPassword(newUser.password);
    const newEntry = { id: Date.now(), username: newUser.username, passwordHash: hash, role: newUser.role };
    setAuthUsers([...authUsers, newEntry]);
  };

  const handleUpdatePassword = async (id, newPassword) => {
    const hash = await hashPassword(newPassword);
    setAuthUsers(authUsers.map(u => u.id === id ? { ...u, passwordHash: hash } : u));
    if (currentUser && currentUser.id === id) {
      localStorage.setItem('teamlead_session', JSON.stringify({ u: currentUser.username, h: hash }));
      setCurrentUser({ ...currentUser, passwordHash: hash });
    }
  };

  const handleDeleteUser = (id) => { setAuthUsers(authUsers.filter(u => u.id !== id)); };

  const activeWeekData = weeksHistory[selectedWeekKey] || defaultWeekData;
  const historyKeys = Object.keys(weeksHistory).sort().reverse(); 

  const handleSaveWeek = (newData) => {
    const key = `${newData.year}-${newData.weekNumber}`;
    setWeeksHistory(prev => ({ ...prev, [key]: newData }));
    setSelectedWeekKey(key);
    setActiveTab('pulse');
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'pulse': return <PulseDashboard weekData={activeWeekData} historyKeys={historyKeys} weeksHistory={weeksHistory} selectedWeekKey={selectedWeekKey} onWeekSelect={setSelectedWeekKey} csatReviews={csatReviews} />;
      case 'fill': return <FillWeekForm weekData={activeWeekData} historyKeys={historyKeys} weeksHistory={weeksHistory} selectedKey={selectedWeekKey} onWeekSelect={setSelectedWeekKey} onSaveWeek={handleSaveWeek} setProfiles={setProfiles} setTasksArchive={setTasksArchive} csatReviews={csatReviews} setCsatReviews={setCsatReviews} />;
      case 'reports': return <ReportsGenerator weekData={activeWeekData} historyKeys={historyKeys} weeksHistory={weeksHistory} selectedKey={selectedWeekKey} onWeekSelect={setSelectedWeekKey} onSaveWeek={handleSaveWeek} projectTasks={projectTasks} setProjectTasks={setProjectTasks} csatReviews={csatReviews} />;
      case 'archive': return <TasksArchiveBoard tasksArchive={tasksArchive} />;
      case 'processes': return <ProcessesMap processes={processes} />; 
      case 'achievements': return <AchievementsBoard achievements={achievements} />;
      case 'profiles': return <TeamProfilesBoard profiles={profiles} />;
      case 'settings': return <AdminSettings users={authUsers} onAddUser={handleAddUser} onUpdateUser={handleUpdatePassword} onDeleteUser={handleDeleteUser} />;
      default:
        return (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 h-full mt-20">
            <GitMerge size={64} className="mb-4 opacity-20" />
            <h2 className="text-xl font-medium">Раздел в разработке</h2>
          </div>
        );
    }
  };

  if (!isLoaded) return <div className="h-screen bg-slate-900 flex items-center justify-center text-emerald-400"><Activity className="animate-spin mr-3"/> Загрузка Control Room...</div>;
  if (!currentUser) return <LoginScreen onLogin={handleLogin} error={loginError} />;

  const navItems = [
    { id: 'pulse', icon: Activity, label: 'Пульс команды', roles: ['admin', 'viewer'] },
    { id: 'fill', icon: Pencil, label: 'Заполнить неделю', roles: ['admin'] },
    { id: 'reports', icon: FileText, label: 'Отчеты', roles: ['admin', 'viewer'] },
    { id: 'archive', icon: Archive, label: 'Техдолг / Архив', roles: ['admin', 'viewer'] },
    { id: 'processes', icon: GitMerge, label: 'Процессы и эскалации', roles: ['admin', 'viewer'] },
    { id: 'achievements', icon: Activity, label: 'Кайдзен и улучшения', roles: ['admin', 'viewer'] },
    { id: 'profiles', icon: Users, label: 'Матрица компетенций', roles: ['admin', 'viewer'] },
    { id: 'settings', icon: Settings, label: 'Настройки доступа', roles: ['admin'] },
  ].filter(item => item.roles.includes(currentUser.role));

  return (
    <div className="flex h-screen bg-slate-900 font-sans text-slate-200 overflow-hidden">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.1); border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(71, 85, 105, 0.6); border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(100, 116, 139, 0.8); }
        .group:hover > .absolute { z-index: 9999; }
        .group:hover .pointer-events-auto {
          background: rgba(2, 6, 23, 0.98) !important;
          border-color: rgba(148, 163, 184, 0.55) !important;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.78), 0 0 0 1px rgba(255, 255, 255, 0.08) !important;
        }
        .group:hover .pointer-events-auto .bg-slate-900\\/60 {
          background: rgba(15, 23, 42, 0.96) !important;
        }
      `}</style>
      
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col flex-shrink-0 z-20 relative">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40">
            <LayoutDashboard size={20} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="font-black text-white text-lg leading-tight uppercase tracking-tighter">ЦЕНТР УПРАВЛЕНИЯ</h1>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">ПАНЕЛЬ ТИМЛИДА</p>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2 custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id} onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200
                  ${isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-900/10' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'}`}
              >
                <Icon size={20} className={isActive ? 'text-emerald-400' : 'text-slate-500'} />
                {item.label}
              </button>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="bg-slate-900 rounded-xl p-3 border border-slate-800/50 flex items-center gap-3 shadow-inner">
             <div className={`w-2 h-2 rounded-full ${dbStatus === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : (dbStatus === 'error' ? 'bg-red-500' : 'bg-slate-500')}`}></div>
             <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{dbStatus === 'connected' ? 'СИНХРОНИЗАЦИЯ: ОК' : 'ЛОКАЛЬНЫЙ РЕЖИМ'}</div>
          </div>
          <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white uppercase flex-shrink-0">
                {currentUser.username.substring(0, 2).toUpperCase()}
              </div>
              <div className="overflow-hidden leading-tight">
                 <p className="text-sm font-bold text-slate-200 truncate">{currentUser.username}</p>
                 <p className="text-[10px] text-slate-500 capitalize">{currentUser.role === 'admin' ? 'Админ' : 'Просмотр'}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0" title="Выход"><LogOut size={18} /></button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-slate-900 p-8 custom-scrollbar relative z-0">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
