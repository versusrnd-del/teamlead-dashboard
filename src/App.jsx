import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  LineChart, Line
} from 'recharts';
import { 
  Activity, AlertTriangle, CheckCircle, ShieldAlert, Clock, Shield, Database,
  LayoutDashboard, Pencil, PieChart, GitMerge, FileText, Award, Users, BookOpen, Save, Copy, Check, Plus, Trash2, 
  Settings, HelpCircle, FileSearch, ArrowRight, Target, Calendar, Flame, Search, Archive,
  Medal, Star, ThumbsUp, ShieldCheck, Zap, Heart, User, TrendingUp, Sparkles, DownloadCloud, Timer, ChevronDown, Layers, Lock, Key, LogOut, UserPlus, RefreshCcw, ActivitySquare, Server
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
  "u0607": "Максим Отрошко"
};

const BASE_CAPACITY = 50; 

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

const replaceLoginsWithNames = (text) => {
  if (typeof text !== 'string') return String(text || '');
  let result = text;
  for (const [login, name] of Object.entries(USER_DICTIONARY)) {
    const regex = new RegExp(login, 'gi');
    result = result.replace(regex, name);
  }
  return result;
};

const safeString = (val) => {
  if (val === null || val === undefined) return '';
  if (Array.isArray(val)) return val.map(v => typeof v === 'object' ? JSON.stringify(v) : String(v)).join(' ');
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
};

const formatCSAT = (val) => {
  if (val === null || val === undefined) return '0.0';
  const num = Number(val);
  return isNaN(num) ? '0.0' : num.toFixed(1);
};

// --- НАЧАЛЬНЫЕ ДАННЫЕ ---
const defaultWeekData = {
  year: new Date().getFullYear(), month: new Date().getMonth(), weekNumber: getISOWeekNumber(new Date()), dates: "Текущая неделя", 
  status: "green", managementIndex: 100, inflowThisWeek: 0,
  avgCycleTime: 0, reopenRate: 0, techDebtCategories: [],
  mainInsight: "Ожидание данных AI-анализа...", mainRisk: "Ожидание данных AI-анализа...",
  nextFocus: "Ожидание данных AI-анализа...", trainingHypothesis: "Ожидание данных AI-анализа...",
  incidentsClosed: 0, incidentsQueue: 0, sprintPlanned: 0, sprintCompleted: 0, sprintCarriedOver: 0,
  urgentCompleted: 0, urgentQueue: 0, backlog: 0, backlogOld30: 0, backlogCompleted: 0,
  mainWin: "", thanks: "", sprintWin: "", sprintRisk: "", shieldHero: "", blockersAndWaste: "Ожидание данных AI-анализа...",
  topIncidents: [], slaMetrics: [], topPerformers: [], taskPerformers: [], taskComplexity: []
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

const PulseDashboard = ({ weekData, historyKeys, weeksHistory, selectedWeekKey, onWeekSelect }) => {
  const sortedKeys = [...historyKeys].sort();
  const currentIndex = sortedKeys.indexOf(selectedWeekKey);
  const prevWeekKey = currentIndex > 0 ? sortedKeys[currentIndex - 1] : null;
  const prevWeekData = prevWeekKey ? weeksHistory[prevWeekKey] : null;
  const backlogTrend = prevWeekData ? (Number(weekData.backlog) || 0) - (Number(prevWeekData.backlog) || 0) : 0;

  const totalClosed = (Number(weekData.sprintCompleted) || 0) + (Number(weekData.urgentCompleted) || 0) + (Number(weekData.backlogCompleted) || 0);
  const loadPercentage = Math.min(Math.round((totalClosed / BASE_CAPACITY) * 100), 150);
  
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

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
        <div className="w-full sm:w-auto">
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Пульс команды</h1>
          <p className="text-slate-400 text-sm">Оперативный статус направления технической поддержки</p>
          
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
            <span className={`${Number(weekData.managementIndex) >= 70 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : (Number(weekData.managementIndex) === 0 ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20')} px-2 py-0.5 rounded font-bold text-xs border`}>
              {Number(weekData.managementIndex) >= 70 ? 'Управляемо' : (Number(weekData.managementIndex) === 0 ? 'Нет данных' : 'Зона риска')}
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
        
        {/* КАРТОЧКА 5 - Бэклог */}
        <div className="bg-slate-800 rounded-xl p-5 border-t-4 border-blue-500 shadow-sm relative overflow-hidden flex flex-col justify-between">
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
          <div className="mt-4 pt-3 border-t border-slate-700/50 flex justify-between items-center"><span className="text-slate-400 text-xs">Старше 30 дней:</span><span className="bg-red-500/10 text-red-400 px-2 py-0.5 rounded font-bold text-sm border border-red-500/20 flex items-center gap-1"><Clock size={12} /> {Number(weekData.backlogOld30) || 0}</span></div>
        </div>
      </div>

      {/* НОВЫЙ БЛОК: КАЧЕСТВО И СКОРОСТЬ (FLOW METRICS) */}
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
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">Доля задач, которые вернулись к инженерам после статуса "Закрыто" или "Готово". Высокий процент бьет по оценке удовлетворенности (CSAT) и съедает время команды.</p>
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

      {/* ТРУДОЕМКОСТЬ СПРИНТА (T-Shirt Sizing) и АНАЛИТИКА СПРИНТА */}
      {(weekData.taskComplexity?.length > 0 || weekData.sprintWin || weekData.sprintRisk || weekData.shieldHero) && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50 shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4">
          {weekData.taskComplexity && weekData.taskComplexity.length > 0 && (
            <>
              <h2 className="text-lg font-medium text-white mb-5 flex items-center gap-2"><Layers size={20} className="text-indigo-400" /> Трудоемкость выполненных задач (T-Shirt Sizing)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {['S', 'M', 'L', 'XL'].map((size) => {
                  const taskInfo = weekData.taskComplexity.find(t => t.size === size);
                  const count = taskInfo ? Number(taskInfo.count) : 0;
                  const desc = taskInfo ? safeString(taskInfo.description) : 'Задач такого размера не было';
                  
                  return (
                    <div key={size} className={`relative p-4 rounded-xl border flex flex-col ${count > 0 ? 'bg-slate-900/80 border-slate-700/50 shadow-inner' : 'bg-slate-900/30 border-slate-800/50 opacity-50'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-2xl font-black px-2.5 py-0.5 rounded-lg border-2 border-b-4 ${count > 0 ? getSizeColor(size) : 'bg-slate-800 text-slate-600 border-slate-700'}`}>{size}</span>
                        <span className="text-3xl font-bold text-slate-300">{count}</span>
                      </div>
                      <div className="mt-2 text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">{desc}</div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

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
                   <p className="text-sm text-slate-300">{safeString(replaceLoginsWithNames(weekData.shieldHero))}</p>
                 </div>
               )}
            </div>
          )}
        </div>
      )}

      <h2 className="text-lg font-medium text-white mb-4 mt-8 flex items-center gap-2"><Sparkles size={20} className="text-indigo-400" />Глубокая аналитика потока (ИИ)</h2>
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
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="pb-3 font-medium">Исполнитель</th><th className="pb-3 font-medium text-center">Закрыто</th><th className="pb-3 font-medium text-center">Ср. Время</th><th className="pb-3 font-medium text-center">Логирование</th><th className="pb-3 font-medium text-center">CSAT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {weekData.topPerformers && weekData.topPerformers.map((perf, idx) => {
                    const commentsFreq = safeString(perf.commentsFreq) || 'Низкая';
                    return (
                      <tr key={idx} className="hover:bg-slate-900/30 transition-colors">
                        <td className="py-3 font-medium text-slate-200">{safeString(perf.name) || 'Неизвестно'}</td>
                        <td className="py-3 text-center text-white font-bold">{Number(perf.closed) || 0}</td>
                        <td className="py-3 text-center text-slate-400">{Number(perf.avgTimeMin) || 0} м</td>
                        <td className="py-3 text-center"><span className={`text-[10px] px-2 py-1 rounded-full uppercase tracking-wider font-bold ${commentsFreq === 'Высокая' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : commentsFreq === 'Средняя' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>{commentsFreq}</span></td>
                        <td className="py-3 text-center"><div className="flex items-center justify-center gap-1"><Star size={14} className={Number(perf.csat) >= 4.8 ? "text-amber-400 fill-amber-400" : Number(perf.csat) >= 4.0 ? "text-amber-400" : "text-slate-500"} /><span className={Number(perf.csat) >= 4.8 ? "text-amber-400 font-bold" : "text-slate-300"}>{formatCSAT(perf.csat)}</span></div></td>
                      </tr>
                    );
                  })}
                  {(!weekData.topPerformers || weekData.topPerformers.length === 0) && <tr><td colSpan="5" className="py-4 text-center text-slate-500">Данные не загружены</td></tr>}
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
              <div className="overflow-x-auto custom-scrollbar pb-2">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider">
                      <th className="pb-3 font-medium">Исполнитель</th><th className="pb-3 font-medium text-center">Закрыто</th><th className="pb-3 font-medium text-center">Cycle Time</th><th className="pb-3 font-medium text-center">Логирование</th><th className="pb-3 font-medium text-center">Возвраты</th><th className="pb-3 font-medium text-center">Качество</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {weekData.taskPerformers.map((perf, idx) => {
                      const commentsFreq = safeString(perf.commentsFreq) || 'Низкая';
                      return (
                        <tr key={idx} className="hover:bg-slate-900/30 transition-colors">
                          <td className="py-3 font-medium text-slate-200">{safeString(perf.name) || 'Неизвестно'}</td>
                          <td className="py-3 text-center text-white font-bold">{Number(perf.closed) || 0}</td>
                          <td className="py-3 text-center text-slate-400">{Number(perf.avgTimeMin) || 0} дн.</td>
                          <td className="py-3 text-center"><span className={`text-[10px] px-2 py-1 rounded-full uppercase tracking-wider font-bold ${commentsFreq === 'Высокая' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : commentsFreq === 'Средняя' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>{commentsFreq}</span></td>
                          
                          <td className="py-3 text-center">
                            {perf.reopenedTasks && perf.reopenedTasks.length > 0 ? (
                              <div className="flex flex-col items-center gap-1">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                                  {perf.reopenedTasks.length} шт.
                                </span>
                                <div className="flex flex-wrap justify-center gap-1 max-w-[120px]">
                                  {perf.reopenedTasks.map((taskItem, i) => {
                                    // Поддержка как старого массива строк, так и нового массива объектов
                                    const tId = typeof taskItem === 'object' ? taskItem.id : taskItem;
                                    const tReason = typeof taskItem === 'object' ? taskItem.reason : 'Причина не проанализирована';
                                    return (
                                      <div key={i} className="group relative">
                                        <span className="text-[9px] text-slate-400 border-b border-slate-600 border-dashed cursor-help hover:text-white transition-colors">
                                          {tId}
                                        </span>
                                        {/* Всплывающая подсказка (Tooltip) */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-48 p-2 bg-slate-800 border border-slate-600 rounded shadow-xl text-[10px] text-slate-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 text-center pointer-events-none">
                                          <div className="font-bold text-amber-400 mb-1">Причина возврата:</div>
                                          {tReason}
                                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-600"></div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>

                          <td className="py-3 text-center"><div className="flex items-center justify-center gap-1"><ShieldCheck size={14} className={Number(perf.csat) >= 4.8 ? "text-emerald-400" : "text-amber-400"} /><span className={Number(perf.csat) >= 4.8 ? "text-emerald-400 font-bold" : "text-slate-300"}>{formatCSAT(perf.csat)}</span></div></td>
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
            <span className="text-xs font-bold text-slate-400 bg-slate-900 px-2 py-1 rounded">Всего: {totalIncidentsFromList}</span>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto max-h-[400px] pr-3 custom-scrollbar">
            {sortedIncidents.map((inc, idx) => {
              const count = Number(inc.count) || 0;
              const percent = totalIncidentsFromList > 0 ? Math.round((count / totalIncidentsFromList) * 100) : 0;
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
                      <div className="font-bold text-slate-300 mb-1 flex items-center gap-1.5"><FileSearch size={12} className="opacity-70" /> AI-Анализ</div>{safeString(inc.analysis)}
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
          <div><h2 className="text-lg font-bold text-white">Управленческий AI-синтез недели</h2><p className="text-xs text-indigo-300/70">Выявление системных узких мест на основе NLP-анализа инцидентов</p></div>
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

const FillWeekForm = ({ historyKeys, selectedKey, onWeekSelect, weekData, onSaveWeek, setProfiles, setTasksArchive, weeksHistory }) => {
  const [formData, setFormData] = useState(weekData);
  const [isSaved, setIsSaved] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importStatus, setImportStatus] = useState(null);

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
      }
      
      cleanJson = cleanJson.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
      cleanJson = cleanJson.replace(/,\s*([\]}])/g, '$1');
      cleanJson = cleanJson.replace(/[\n\r\t]+/g, ' ');

      const parsedData = JSON.parse(cleanJson);
      
      let newIndex = formData.managementIndex !== undefined ? formData.managementIndex : 100;
      if (parsedData.slaMetrics && Array.isArray(parsedData.slaMetrics)) {
        const totalViolations = parsedData.slaMetrics.reduce((sum, sla) => sum + (Number(sla.violations) || 0), 0);
        if (totalViolations > 50) newIndex -= 30;
        else if (totalViolations > 20) newIndex -= 15;
      }
      
      if (parsedData.topPerformers && Array.isArray(parsedData.topPerformers)) {
        parsedData.topPerformers = parsedData.topPerformers.map(perf => ({
          ...perf,
          name: USER_DICTIONARY[safeString(perf.name).trim()] || safeString(perf.name)
        }));
      }

      // СОХРАНЕНИЕ TASK PERFORMERS (Инженеры задач)
      if (parsedData.taskPerformers && Array.isArray(parsedData.taskPerformers)) {
        parsedData.taskPerformers = parsedData.taskPerformers.map(perf => ({
          ...perf,
          name: USER_DICTIONARY[safeString(perf.name).trim()] || safeString(perf.name)
        }));
      }

      // СОХРАНЕНИЕ ДЕТАЛЬНЫХ ЗАДАЧ (ТЕХДОЛГ / АРХИВ)
      if (parsedData.detailedTasks && Array.isArray(parsedData.detailedTasks)) {
         setTasksArchive(prev => {
            const existingIds = new Set(prev.map(t => t.id));
            // Исключаем дубликаты по id (Ключ проблемы)
            const newTasks = parsedData.detailedTasks.filter(t => t.id && !existingIds.has(t.id));
            return [...newTasks, ...prev]; // Новые сверху
         });
      }

      ['mainInsight', 'mainRisk', 'nextFocus', 'trainingHypothesis', 'mainWin', 'thanks', 'sprintWin', 'sprintRisk', 'shieldHero', 'blockersAndWaste'].forEach(field => {
        if (parsedData[field] !== undefined && parsedData[field] !== null) {
          let textVal = parsedData[field];
          if (Array.isArray(textVal)) textVal = textVal.join(' ');
          else if (typeof textVal === 'object') textVal = JSON.stringify(textVal);
          parsedData[field] = replaceLoginsWithNames(String(textVal));
        }
      });

      if (parsedData.teamProfiles && Array.isArray(parsedData.teamProfiles) && setProfiles) {
         const newProfiles = parsedData.teamProfiles.map((p, i) => {
           const lvl = Number(p.delegationLevel) || 1;
           const color = lvl <= 2 ? 'blue' : (lvl === 3 ? 'emerald' : (lvl === 4 ? 'amber' : 'indigo'));
           return {
             ...p, id: i + 1, color: color, name: replaceLoginsWithNames(safeString(p.name))
           };
         });
         setProfiles(newProfiles);
      }
      
      setFormData(prev => ({ ...prev, ...parsedData, managementIndex: newIndex }));
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanedIncidents = (formData.topIncidents || []).filter(inc => safeString(inc.name).trim() !== '' || (Number(inc.count) || 0) > 0);
    const finalData = { ...formData, topIncidents: cleanedIncidents };
    onSaveWeek(finalData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl pb-24 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div><h1 className="text-3xl font-bold text-white tracking-tight mb-1 uppercase tracking-tighter">Заполнить неделю</h1><p className="text-slate-400 text-sm">Ввод метрик вручную или загрузка результатов AI-анализа Jira</p></div>
        <WeekSelector historyKeys={historyKeys} weeksHistory={weeksHistory} selectedKey={selectedKey} onSelect={onWeekSelect} activeData={weekData} />
      </div>

      <div className="bg-indigo-900/20 p-6 rounded-xl border border-indigo-500/40 mb-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Sparkles size={80} className="text-indigo-400" /></div>
        <h3 className="text-lg font-bold text-white mb-2 relative z-10 flex items-center gap-2"><Sparkles size={20} className="text-indigo-400" /> 🤖 Умный импорт (AI Parsing)</h3>
        <p className="text-sm text-indigo-200/70 mb-4 relative z-10">Скормил CSV-выгрузку из Jira нейросети? Вставь полученный от неё JSON-код сюда. Если в JSON есть массив `detailedTasks` или `taskPerformers`, они автоматически уйдут в Архив и Пульс.</p>
        
        <div className="relative z-10 space-y-3">
          <textarea 
            value={importJson} onChange={(e) => setImportJson(e.target.value)}
            placeholder='Вставь сюда сгенерированный JSON...'
            className="w-full h-24 bg-slate-900/80 border border-indigo-500/30 rounded-lg p-3 text-indigo-100 text-sm font-mono focus:border-indigo-400 outline-none resize-none placeholder:text-indigo-400/30 custom-scrollbar"
          ></textarea>
          <div className="flex items-center gap-4">
            <button type="button" onClick={handleImportData} disabled={!importJson.trim()} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg"><DownloadCloud size={16} /> Загрузить JSON</button>
            {importStatus === 'success' && <span className="text-emerald-400 text-sm font-medium flex items-center gap-1"><Check size={16}/> Успешно! Нажми "Сохранить" внизу 👇</span>}
            {importStatus === 'error' && <span className="text-red-400 text-sm font-medium flex items-center gap-1"><ShieldAlert size={16}/> Ошибка! Неверный формат JSON.</span>}
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
                  Эти метрики рассчитываются AI-агентом из "Cоздано" и "Дата решения".
               </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700/50 shadow-sm text-left">
          <div className="flex justify-between items-center mb-4">
            <div><h3 className="text-lg font-medium text-white uppercase tracking-tighter">Топ драйверов инцидентов</h3><p className="text-xs text-slate-500 mt-1">AI-парсинг или ручной ввод.</p></div>
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
                  <textarea placeholder="AI-анализ причины и решения..." value={inc.analysis} onChange={e=>handleIncidentChange(idx,'analysis',e.target.value)} rows={2} className="w-full bg-slate-950/50 border border-slate-800 rounded p-2 text-[11px] text-slate-500 outline-none custom-scrollbar" />
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
          <p className="text-slate-400 text-sm">Сырые данные из Jira для глубокого анализа, сохраненные нейросетью</p>
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
                      {replaceLoginsWithNames(task.assignee) || 'Не назначен'}
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


// --- ВКЛАДКА: ОТЧЕТЫ ---

const ReportsGenerator = ({ weekData, historyKeys, weeksHistory, selectedKey, onWeekSelect }) => {
  const [copiedId, setCopiedId] = useState(null);
  const sortedIncidents = weekData.topIncidents ? [...weekData.topIncidents].sort((a,b)=>(Number(b.count)||0)-(Number(a.count)||0)) : [];
  const top3 = sortedIncidents.slice(0, 3);
  const top3Text = top3.map(i => `${safeString(i.name)} (${Number(i.count)||0})`).join(', ');
  const totalListIncidents = sortedIncidents.reduce((sum, i) => sum + (Number(i.count) || 0), 0);
  const top3Sum = top3.reduce((sum, i) => sum + (Number(i.count) || 0), 0);
  const paretoPercent = totalListIncidents > 0 ? Math.round((top3Sum / totalListIncidents) * 100) : 0;
  
  const totalClosedCount = (Number(weekData.sprintCompleted)||0) + (Number(weekData.urgentCompleted)||0) + (Number(weekData.backlogCompleted)||0);

  const reports = [
    {
      id: 'team', title: 'Отчет для команды (Telegram / Чат)', icon: Users, color: 'emerald',
      content: `Привет, команда! Итоги ${weekData.weekNumber || ''} недели (${safeString(weekData.dates)}):\n\n✅ 1-я линия отработала поток: закрыто ${weekData.incidentsClosed || 0} инцидентов (в очереди ${weekData.incidentsQueue || 0}).\n🔥 Топ-3 проблемы: ${top3Text}.\n🚀 Выделенный "Щит" отбил ${weekData.urgentCompleted || 0} внеплановых задач.\n⚙️ Delivery: всего закрыли ${totalClosedCount} задач. Из них: Спринт - ${weekData.sprintCompleted || 0} (из ${weekData.sprintPlanned || 0} плановых), Срочные - ${weekData.urgentCompleted || 0}, Напрямую из бэклога - ${weekData.backlogCompleted || 0}. Хвост спринта: ${weekData.sprintCarriedOver || 0}.\n\n🏆 Главный успех процесса: ${safeString(weekData.mainWin) || 'Выдержали темп!'}\n🙏 За Кайдзен и помощь благодарим: ${safeString(weekData.thanks) || 'Всю команду!'}\n\n🎯 Инсайт потока: ${safeString(weekData.mainInsight)}\nФокус на расшивку горлышка: ${safeString(weekData.nextFocus)}`
    },
    {
      id: 'manager', title: 'Отчет для руководителя (Почта / Статус)', icon: LayoutDashboard, color: 'blue',
      content: `Статус по направлению ОСО за ${weekData.weekNumber || ''} неделю (${safeString(weekData.dates)})\n\n🔹 Основные метрики потока (Delivery):\n- Индекс управляемости: ${weekData.managementIndex || 0}/100\n- Общее количество закрытых задач: ${totalClosedCount}. (Спринт: ${weekData.sprintCompleted || 0}, Срочные: ${weekData.urgentCompleted || 0}, Из бэклога напрямую: ${weekData.backlogCompleted || 0}).\n- Срочная линия: ${weekData.urgentCompleted || 0} инцидентов (защита спринта).\n- Инциденты 1-я линия: ${weekData.incidentsClosed || 0}.\n- Ср. время решения (Cycle Time): ${weekData.avgCycleTime || 0} дн.\n- Бэклог Support: ${weekData.backlog || 0} задач в очереди (из них ${weekData.backlogOld30 || 0} старше 30 дней).\n\n⚠️ Узкие места (Теория ограничений):\nТоп-3 проблемы занимают ${paretoPercent}% времени (${top3Text}).\n\n❗️ Риски процесса:\n${safeString(weekData.mainRisk)}\n\n📝 План улучшений:\n${safeString(weekData.nextFocus)}`
    },
    {
      id: 'retro', title: 'Отчет для трекера / Обучения (Этап 2)', icon: BookOpen, color: 'indigo',
      content: `Рефлексия (Этап 2: Процессы и метрики). Неделя ${weekData.weekNumber || ''}.\n\n🎯 Процессная гипотеза недели:\n${safeString(weekData.trainingHypothesis)}\n\n📊 Метрики потока создания ценности:\n- Ср. время решения (Cycle Time): ${weekData.avgCycleTime || 0} дн.\n- Возврат на доработку (Reopen Rate): ${weekData.reopenRate || 0}%\n- Capacity (Выполнено всего): ${totalClosedCount} задач.\n- Распределение нагрузки (Парето): ${top3Sum} инцидентов (${paretoPercent}%) генерируется 3 проблемами (${top3Text}).\n- Возраст техдолга: ${weekData.backlogOld30 || 0} задач висят > 30 дней (Общий бэклог: ${weekData.backlog || 0}).\n\n💡 Аудит процесса (Узкие места):\n${safeString(weekData.mainInsight)}\n\n🚧 Системные ограничения (Bottlenecks):\n${safeString(weekData.mainRisk)}\n\n🛠 Эксперимент / Кайдзен на след. неделю:\n${safeString(weekData.nextFocus)}`
    }
  ];

  const handleCopy = (text, id) => {
    const textArea = document.createElement("textarea");
    textArea.value = text; document.body.appendChild(textArea); textArea.select();
    try { document.execCommand('copy'); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); } catch (err) {}
    document.body.removeChild(textArea);
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-5xl pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Генератор отчетов</h1>
          <p className="text-slate-400 text-sm">Умная сборка метрик для коммуникации с разными ролями</p>
        </div>
        <WeekSelector historyKeys={historyKeys} weeksHistory={weeksHistory} selectedKey={selectedKey} onSelect={onWeekSelect} activeData={weekData} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {reports.map((report) => {
          const Icon = report.icon; const isCopied = copiedId === report.id;
          return (
            <div key={report.id} className="bg-slate-800 rounded-xl border border-slate-700/50 shadow-sm flex flex-col overflow-hidden">
              <div className={`bg-slate-900/50 p-4 border-b border-slate-700/50 flex justify-between items-center`}>
                <div className="flex items-center gap-2"><Icon size={18} className={`text-${report.color}-400`} /><h3 className="font-medium text-slate-200 text-sm">{report.title}</h3></div>
              </div>
              <div className="p-4 flex-1"><textarea readOnly value={report.content} className="w-full h-full min-h-[300px] bg-transparent text-slate-300 text-sm resize-none outline-none focus:ring-0 custom-scrollbar" /></div>
              <div className="p-4 bg-slate-900/30 border-t border-slate-700/50">
                <button onClick={() => handleCopy(report.content, report.id)} className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${isCopied ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600'}`}>
                  {isCopied ? <Check size={16} /> : <Copy size={16} />} {isCopied ? 'Скопировано!' : 'Скопировать текст'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
};

// --- ВКЛАДКА: ПРОЦЕССЫ И ЭСКАЛАЦИИ ---

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

// --- ВКЛАДКА: ОБРАТНАЯ СВЯЗЬ (КАЙДЗЕН) ---

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
        <div className="bg-indigo-500/20 p-3 rounded-lg border border-indigo-500/30 text-indigo-400 shrink-0"><ActivitySquare size={24} /></div>
        <div>
          <h3 className="text-slate-200 font-medium mb-1">Управляем потоком, а не людьми</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            На <b>Этапе 2</b> мы фокусируемся на метриках и процессах. Мы отмечаем успешные процессные изменения (гипотезы), 
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

// --- ВКЛАДКА: ПРОФИЛИ КОМАНДЫ (МАТРИЦА КОМПЕТЕНЦИЙ) ---

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
            Система выявляет, на ком из инженеров "замыкаются" процессы (Bus Factor), и показывает `T-shape` потенциал.
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
            <p className="text-slate-500 text-xs mt-1">Они появятся после импорта данных из AI-анализа.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- ВКЛАДКА: НАСТРОЙКИ ДОСТУПА (АДМИНКА) ---

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
      case 'pulse': return <PulseDashboard weekData={activeWeekData} historyKeys={historyKeys} weeksHistory={weeksHistory} selectedWeekKey={selectedWeekKey} onWeekSelect={setSelectedWeekKey} />;
      case 'fill': return <FillWeekForm weekData={activeWeekData} historyKeys={historyKeys} weeksHistory={weeksHistory} selectedKey={selectedWeekKey} onWeekSelect={setSelectedWeekKey} onSaveWeek={handleSaveWeek} setProfiles={setProfiles} setTasksArchive={setTasksArchive} />;
      case 'reports': return <ReportsGenerator weekData={activeWeekData} historyKeys={historyKeys} weeksHistory={weeksHistory} selectedKey={selectedWeekKey} onWeekSelect={setSelectedWeekKey} />;
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
    { id: 'achievements', icon: ActivitySquare, label: 'Кайдзен и улучшения', roles: ['admin', 'viewer'] },
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
