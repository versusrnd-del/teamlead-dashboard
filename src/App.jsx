import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend 
} from 'recharts';
import { 
  Activity, AlertTriangle, CheckCircle, Clock, Server, Shield, 
  LayoutDashboard, Edit, BarChart2, GitMerge, FileText, Award, Users, BookOpen, Save, Copy, Check, Plus, Trash2, PieChart,
  Settings, CheckCircle2, HelpCircle, FileSearch, ArrowRight, Target, Calendar,
  Medal, Star, ThumbsUp, ShieldCheck, Zap, Heart, User, TrendingUp, ShieldAlert, Sparkles, DownloadCloud, Timer, MessageSquare, Tags, ChevronDown, Layers, Lock, Key, LogOut, UserPlus
} from 'lucide-react';

// --- КОНСТАНТЫ И НАСТРОЙКИ ---

const USER_DICTIONARY = {
  "u002209": "Антон Л.",
  "obe1": "Петр С.",
  "rem": "Роман Н.",
  "u05112": "Владимир П.",
  "u0287": "Марк Соколов",
  "u0279": "Никита Лысов",
  "u0105": "Максим Н.",
  "u0608": "Максим Гуртов",
  "u0607": "Максим Отрошко"
};

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
  status: "green", managementIndex: 0,
  mainInsight: "Ожидание данных AI-анализа...", mainRisk: "Ожидание данных AI-анализа...",
  nextFocus: "Ожидание данных AI-анализа...", trainingHypothesis: "Ожидание данных AI-анализа...",
  incidentsClosed: 0, incidentsQueue: 0, sprintPlanned: 0, sprintCompleted: 0, sprintCarriedOver: 0,
  urgentCompleted: 0, urgentQueue: 0, backlog: 0, backlogOld30: 0,
  mainWin: "", thanks: "", sprintWin: "", sprintRisk: "", shieldHero: "",
  topIncidents: [], slaMetrics: [], topPerformers: [], taskComplexity: []
};

const defaultProcesses = [
  { id: 1, name: "Первая линия (Маршрутизация)", status: "working", goal: "Быстрая классификация обращений.", owner: "Дежурный 1-й линии", currentProblem: "Ожидание аналитики", nextExperiment: "Ожидание данных" },
  { id: 4, name: "Работа с бэклогом (Техдолг)", status: "working", goal: "Не давать старым задачам протухать (> 30 дней).", owner: "Тимлид", currentProblem: "Ожидание аналитики", nextExperiment: "Ожидание данных" },
  { id: 2, name: "Срочная линия (Роль 'Щит')", status: "working", goal: "Один дежурный забирает внезапный хаос.", owner: "Выделенный дежурный", currentProblem: "Ожидание аналитики", nextExperiment: "Ожидание данных" },
  { id: 3, name: "Недельный спринт (Планирование)", status: "working", goal: "Гарантированная поставка плановых задач.", owner: "Вся команда", currentProblem: "Ожидание аналитики", nextExperiment: "Ожидание данных" }
];

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

      <div className="w-full max-w-md bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl p-8 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/30 mb-4 shadow-lg shadow-emerald-900/10">
            <Shield size={32} className="text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Control Room</h1>
          <p className="text-sm text-slate-400 mt-1">Авторизация в системе</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Пользователь</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" required value={username} onChange={e => setUsername(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all"
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
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-2 text-red-400 text-sm animate-in fade-in zoom-in-95">
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          <button 
            type="submit" disabled={isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
            {isLoading ? <Activity size={20} className="animate-spin" /> : <><Key size={18} /> Войти в систему</>}
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
        Неделя {activeData.weekNumber || ''}
        {activeData.dates && activeData.dates !== "Текущая неделя" ? ` (${activeData.dates})` : ''}
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
          const datesInfo = weeksHistory && weeksHistory[k] ? weeksHistory[k].dates : null;
          const periodLabel = datesInfo && datesInfo !== "Текущая неделя" ? datesInfo : parts[0];
          return <option key={k} value={k}>Неделя {parts[1]} ({periodLabel})</option>;
        })}
      </select>
      <ChevronDown size={14} className="absolute right-2 top-2 text-slate-400 pointer-events-none" />
    </div>
  </div>
);

const PulseDashboard = ({ weekData, historyKeys, weeksHistory, selectedWeekKey, onWeekSelect }) => {
  const chartData = [
    { name: 'Пн', Спринт: Math.floor((Number(weekData.sprintCompleted) || 0) * 0.2), Срочная: Math.floor((Number(weekData.urgentCompleted) || 0) * 0.25) },
    { name: 'Вт', Спринт: Math.floor((Number(weekData.sprintCompleted) || 0) * 0.3), Срочная: Math.floor((Number(weekData.urgentCompleted) || 0) * 0.2) },
    { name: 'Ср', Спринт: Math.floor((Number(weekData.sprintCompleted) || 0) * 0.2), Срочная: Math.floor((Number(weekData.urgentCompleted) || 0) * 0.25) },
    { name: 'Чт', Спринт: Math.floor((Number(weekData.sprintCompleted) || 0) * 0.2), Срочная: Math.floor((Number(weekData.urgentCompleted) || 0) * 0.15) },
    { name: 'Пт', Спринт: Math.floor((Number(weekData.sprintCompleted) || 0) * 0.1), Срочная: Math.floor((Number(weekData.urgentCompleted) || 0) * 0.15) },
  ];

  const totalIncCount = (weekData.topIncidents || []).reduce((sum, item) => sum + (Number(item.count) || 0), 0);
  const sortedInc = [...(weekData.topIncidents || [])].sort((a, b) => (Number(b.count) || 0) - (Number(a.count) || 0));

  const getSizeColor = (size) => {
    switch (size) {
      case 'S': return 'bg-emerald-500 text-emerald-400 border-emerald-500/30';
      case 'M': return 'bg-blue-500 text-blue-400 border-blue-500/30';
      case 'L': return 'bg-orange-500 text-orange-400 border-orange-500/30';
      case 'XL': return 'bg-red-500 text-red-400 border-red-500/30';
      default: return 'bg-slate-500 text-slate-400';
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Пульс команды</h1>
          <p className="text-slate-400 text-sm">Оперативный статус технической поддержки</p>
        </div>
        <WeekSelector historyKeys={historyKeys} weeksHistory={weeksHistory} selectedKey={selectedWeekKey} onSelect={onWeekSelect} activeData={weekData} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Индекс упр-сти', val: weekData.managementIndex, sub: 'SLA Качество', color: 'indigo' },
          { label: '1-я линия', val: weekData.incidentsClosed, sub: 'Закрыто', color: 'emerald' },
          { label: 'Спринт', val: weekData.sprintCompleted, sub: 'Выполнено', color: 'amber' },
          { label: 'Срочная (Щит)', val: weekData.urgentCompleted, sub: 'Отбито', color: 'red' },
          { label: 'Бэклог', val: weekData.backlog, sub: `${weekData.backlogOld30} старых`, color: 'blue' }
        ].map((item, i) => (
          <div key={i} className={`bg-slate-800 p-5 rounded-xl border-t-4 border-${item.color}-500 shadow-sm flex flex-col justify-between`}>
             <div className="text-slate-400 text-xs font-bold uppercase mb-2 tracking-wider">{item.label}</div>
             <div className="text-4xl font-bold text-white mb-1">{Number(item.val) || 0}</div>
             <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{item.sub}</div>
          </div>
        ))}
      </div>

      {(weekData.taskComplexity?.length > 0) && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50 shadow-sm mb-8">
          <h2 className="text-lg font-medium text-white mb-5 flex items-center gap-2"><Layers size={20} className="text-indigo-400" /> Трудоемкость спринта (T-Shirt Sizing)</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {['S', 'M', 'L', 'XL'].map((size) => {
              const taskInfo = weekData.taskComplexity.find(t => t.size === size);
              const count = taskInfo ? Number(taskInfo.count) : 0;
              return (
                <div key={size} className={`p-4 rounded-xl border ${count > 0 ? 'bg-slate-900/80 border-slate-700/50' : 'bg-slate-900/30 opacity-40'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-2xl font-black px-2.5 py-0.5 rounded-lg border-2 border-b-4 ${count > 0 ? getSizeColor(size) : 'bg-slate-800 text-slate-600'}`}>{size}</span>
                    <span className="text-3xl font-bold text-slate-300">{count}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight">{taskInfo ? safeString(taskInfo.description) : 'Задач не было'}</div>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-6 border-t border-slate-700/50">
             <div className="bg-emerald-500/5 p-4 rounded-lg border border-emerald-500/20"><h4 className="text-xs font-bold text-emerald-400 uppercase mb-2">Победа спринта</h4><p className="text-sm text-slate-300">{safeString(weekData.sprintWin)}</p></div>
             <div className="bg-amber-500/5 p-4 rounded-lg border border-amber-500/20"><h4 className="text-xs font-bold text-amber-400 uppercase mb-2">Риск / Бэклог</h4><p className="text-sm text-slate-300">{safeString(weekData.sprintRisk)}</p></div>
             <div className="bg-indigo-500/5 p-4 rounded-lg border border-indigo-500/20"><h4 className="text-xs font-bold text-indigo-400 uppercase mb-2 flex items-center gap-1.5"><Shield size={14}/> Герой щита</h4><p className="text-sm text-slate-300">{safeString(replaceLoginsWithNames(weekData.shieldHero))}</p></div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50 shadow-sm flex flex-col">
          <h3 className="text-base font-medium text-slate-200 flex items-center gap-2 mb-6"><PieChart size={18} className="text-emerald-400" /> Топ инцидентов (Семантика)</h3>
          <div className="space-y-4 flex-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
            {sortedInc.map((inc, idx) => {
              const count = Number(inc.count) || 0;
              const percent = totalIncCount > 0 ? Math.round((count / totalIncCount) * 100) : 0;
              const color = idx === 0 ? '#ef4444' : idx === 1 ? '#f97316' : '#f59e0b';
              return (
                <div key={idx} className="relative bg-slate-900/50 rounded p-3 border border-slate-700/30 overflow-hidden">
                  <div className="absolute top-0 left-0 h-full opacity-10" style={{ width: `${percent}%`, backgroundColor: color }}></div>
                  <div className="relative z-10 flex justify-between items-start text-sm">
                    <span className="text-slate-200 font-medium">{idx + 1}. {safeString(inc.name)}</span>
                    <span className="font-bold" style={{color: color}}>{count}</span>
                  </div>
                  {inc.analysis && <p className="relative z-10 text-[10px] text-slate-500 mt-2 italic border-l-2 pl-2" style={{borderLeftColor: color}}>{safeString(inc.analysis)}</p>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50 h-56 shadow-sm flex flex-col">
            <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2 mb-2"><Activity size={16} className="text-blue-400"/> Загрузка: План vs Хаос</h3>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}><XAxis dataKey="name" hide /><YAxis hide /><Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none'}} /><Bar dataKey="Спринт" fill="#f59e0b" stackId="a" radius={[2, 2, 0, 0]} /><Bar dataKey="Срочная" fill="#ef4444" stackId="a" radius={[2, 2, 0, 0]} /></BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50 flex-1 flex flex-col justify-center shadow-sm">
             <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-2">Гипотеза обучения</span>
             <p className="text-sm text-emerald-400 leading-relaxed font-medium">{safeString(weekData.trainingHypothesis)}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-slate-800 rounded-xl border border-slate-700/50 shadow-sm overflow-hidden mb-8">
        <div className="bg-indigo-500/10 p-5 border-b border-indigo-500/20 flex items-center gap-3">
          <Sparkles size={24} className="text-indigo-400" />
          <div><h2 className="text-lg font-bold text-white">Управленческий AI-синтез недели</h2><p className="text-xs text-indigo-300/70">Качественные выводы на основе семантического анализа</p></div>
        </div>
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="flex flex-col gap-3"><div className="flex items-center gap-2"><CheckCircle size={18} className="text-emerald-400" /><h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Главный инсайт</h3></div><div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 flex-1"><p className="text-slate-300 leading-relaxed text-sm">{safeString(weekData.mainInsight)}</p></div></div>
          <div className="flex flex-col gap-3"><div className="flex items-center gap-2"><AlertTriangle size={18} className="text-amber-400" /><h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Критический риск</h3></div><div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 flex-1"><p className="text-slate-300 leading-relaxed text-sm">{safeString(weekData.mainRisk)}</p></div></div>
          <div className="flex flex-col gap-3"><div className="flex items-center gap-2"><Target size={18} className="text-blue-400" /><h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider">План действий</h3></div><div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 flex-1"><p className="text-slate-300 leading-relaxed text-sm">{safeString(weekData.nextFocus)}</p></div></div>
        </div>
      </div>
    </div>
  );
};

// --- ВКЛАДКА: НАСТРОЙКИ (АДМИНКА) ---

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
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">Логин</label>
            <input type="text" required value={newUsername} onChange={e=>setNewUsername(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none" />
          </div>
          <div className="w-full md:w-1/3">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">Пароль</label>
            <input type="password" required value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none" />
          </div>
          <div className="w-full md:w-1/4">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">Роль</label>
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
          <h3 className="text-lg font-bold text-white flex items-center gap-2"><Users size={18} className="text-blue-400"/> Активные пользователи</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700/50 text-slate-400 text-xs uppercase bg-slate-900/50 tracking-widest">
                <th className="p-4 font-bold">Логин</th>
                <th className="p-4 font-bold">Роль</th>
                <th className="p-4 font-bold text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-900/20 transition-colors">
                  <td className="p-4 text-white font-medium">{u.username}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold border uppercase tracking-widest ${u.role === 'admin' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-slate-700/50 text-slate-300 border-slate-600'}`}>
                      {u.role === 'admin' ? 'Admin' : 'Viewer'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {editId === u.id ? (
                      <form onSubmit={(e) => handleUpdate(e, u.id)} className="flex items-center justify-end gap-2">
                        <input type="password" placeholder="Пароль" required value={editPassword} onChange={e=>setEditPassword(e.target.value)} className="w-32 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none" />
                        <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded text-xs font-bold">ОК</button>
                        <button type="button" onClick={() => setEditId(null)} className="bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded text-xs font-bold">X</button>
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

// --- ВКЛАДКА: ПРОФИЛИ AI ---

const TeamProfilesBoard = ({ profiles }) => (
  <div className="animate-in fade-in duration-500 max-w-6xl pb-10">
    <div className="flex justify-between items-end mb-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Профили команды (AI)</h1>
        <p className="text-slate-400 text-sm">Генерируется нейросетью на базе инцидентов</p>
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
            </div>
          </div>
          <div className="p-6 space-y-5 flex-1">
            <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/30">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block mb-2 flex items-center gap-1.5"><Star size={14}/> Сильные стороны</span>
              <p className="text-sm text-slate-300 leading-relaxed font-medium">{safeString(p.strengths)}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/20 p-3 rounded-xl border border-slate-700/20">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-1">Точка роста</span>
                <p className="text-xs text-slate-400">{safeString(p.growthZone)}</p>
              </div>
              <div className="bg-slate-900/20 p-3 rounded-xl border border-slate-700/20">
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest block mb-1">Риск</span>
                <p className="text-xs text-slate-400">{safeString(p.risks)}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// --- ВКЛАДКА: ПРОЦЕССЫ ---
const ProcessesMap = ({ processes }) => (
  <div className="animate-in fade-in duration-500 max-w-6xl pb-10">
    <div className="flex justify-between items-end mb-8">
      <div><h1 className="text-3xl font-bold text-white tracking-tight mb-1">Карта процессов</h1><p className="text-slate-400 text-sm">Управление операционной моделью</p></div>
    </div>
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {processes.map(proc => (
        <div key={proc.id} className="bg-slate-800 rounded-xl border border-slate-700/50 shadow-sm overflow-hidden flex flex-col transition-all hover:border-slate-600">
          <div className="p-5 border-b border-slate-700/50 flex justify-between items-start bg-slate-900/20">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">{safeString(proc.name)}</h3>
              <p className="text-slate-500 text-xs flex items-center gap-1"><Users size={12}/> Владелец: {safeString(proc.owner)}</p>
            </div>
            <span className="bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded text-xs font-bold border border-emerald-500/20">Работает</span>
          </div>
          <div className="p-5 flex-1 space-y-4">
            <div><span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Цель</span><p className="text-sm text-slate-300 font-medium">{safeString(proc.goal)}</p></div>
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
              <span className="text-xs font-bold text-amber-400/80 uppercase tracking-wider mb-1 flex items-center gap-1"><FileSearch size={14}/> Проблема</span>
              <p className="text-sm text-slate-300 font-medium">{safeString(proc.currentProblem)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

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

  // ИСТОРИЯ НЕДЕЛЬ (_v15 ключи)
  const [weeksHistory, setWeeksHistory] = useState(() => {
    try { const saved = localStorage.getItem('teamlead_history_v15'); if (saved) return JSON.parse(saved); } catch (e) {}
    return { [`${defaultWeekData.year}-${defaultWeekData.weekNumber}`]: defaultWeekData };
  });

  const [selectedWeekKey, setSelectedWeekKey] = useState(() => {
    const keys = Object.keys(weeksHistory);
    return keys.length > 0 ? keys.sort().pop() : `${defaultWeekData.year}-${defaultWeekData.weekNumber}`;
  });

  const [processes, setProcesses] = useState(() => { try { const saved = localStorage.getItem('teamlead_processes_v15'); if (saved) return JSON.parse(saved); } catch (e) {} return defaultProcesses; });
  const [achievements, setAchievements] = useState([]);
  const [profiles, setProfiles] = useState(() => { try { const saved = localStorage.getItem('teamlead_profiles_v15'); if (saved) return JSON.parse(saved); } catch (e) {} return []; });

  // Инициализация
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

      if (cloudData && cloudData.length > 0) {
        const hRow = cloudData.find(r => r.key_name === 'history'); if (hRow) { setWeeksHistory(hRow.value_data); setSelectedWeekKey(Object.keys(hRow.value_data).sort().pop()); }
        const procRow = cloudData.find(r => r.key_name === 'processes'); if (procRow) setProcesses(procRow.value_data);
        const achRow = cloudData.find(r => r.key_name === 'achievements'); if (achRow) setAchievements(achRow.value_data);
        const profRow = cloudData.find(r => r.key_name === 'profiles'); if (profRow) setProfiles(profRow.value_data);
      }

      let loadedAuthUsers = [];
      if (cloudData) {
        const authRow = cloudData.find(r => r.key_name === 'auth_users');
        if (authRow) loadedAuthUsers = authRow.value_data;
      }

      if (!loadedAuthUsers || loadedAuthUsers.length === 0) {
        const defaultHash = await hashPassword('Wmg82bpe');
        loadedAuthUsers = [{ id: Date.now(), username: 'admin', passwordHash: defaultHash, role: 'admin' }];
        if (client && dbStatus !== 'error') await client.from('app_state').upsert({ key_name: 'auth_users', value_data: loadedAuthUsers });
      }
      setAuthUsers(loadedAuthUsers);

      const session = localStorage.getItem('teamlead_session');
      if (session) {
        try {
          const { u, h } = JSON.parse(session);
          const found = loadedAuthUsers.find(user => user.username === u && user.passwordHash === h);
          if (found) setCurrentUser(found);
        } catch(e) {}
      }
      setIsLoaded(true);
      setTimeout(() => { if (mounted) isReadyToSave.current = true; }, 1000);
    };

    let url = '', key = '';
    try {
      const env = typeof import.meta !== 'undefined' ? import.meta.env : {};
      url = env.VITE_SUPABASE_URL || ''; key = env.VITE_SUPABASE_ANON_KEY || '';
    } catch (e) {}

    if (url && key) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.7/dist/umd/supabase.min.js';
      script.async = true;
      script.onload = () => {
        if (window.supabase) {
          const client = window.supabase.createClient(url, key); setSupabaseClient(client); initData(client);
        } else { initData(null); }
      };
      document.head.appendChild(script);
    } else { initData(null); }
    return () => { mounted = false; };
  }, []);

  // Синхронизация
  useEffect(() => {
    if (!isReadyToSave.current || !supabaseClient || dbStatus !== 'connected') return;
    const save = async () => {
      await supabaseClient.from('app_state').upsert({ key_name: 'history', value_data: weeksHistory });
      await supabaseClient.from('app_state').upsert({ key_name: 'processes', value_data: processes });
      await supabaseClient.from('app_state').upsert({ key_name: 'profiles', value_data: profiles });
      await supabaseClient.from('app_state').upsert({ key_name: 'auth_users', value_data: authUsers });
    };
    save();
    localStorage.setItem('teamlead_history_v15', JSON.stringify(weeksHistory));
    localStorage.setItem('teamlead_processes_v15', JSON.stringify(processes));
    localStorage.setItem('teamlead_profiles_v15', JSON.stringify(profiles));
  }, [weeksHistory, processes, profiles, authUsers, dbStatus, supabaseClient]);

  const handleLogin = async (username, password) => {
    const inputHash = await hashPassword(password);
    const user = authUsers.find(u => u.username === username && u.passwordHash === inputHash);
    if (user) { setCurrentUser(user); localStorage.setItem('teamlead_session', JSON.stringify({ u: user.username, h: user.passwordHash })); }
    else { setLoginError('Неверный логин или пароль'); }
  };

  const handleLogout = () => { setCurrentUser(null); localStorage.removeItem('teamlead_session'); setActiveTab('pulse'); };

  const activeWeekData = weeksHistory[selectedWeekKey] || defaultWeekData;
  const historyKeys = Object.keys(weeksHistory).sort().reverse(); 

  const handleSaveWeek = (newData) => {
    const key = `${newData.year}-${newData.weekNumber}`;
    setWeeksHistory(prev => ({ ...prev, [key]: newData }));
    setSelectedWeekKey(key); setActiveTab('pulse');
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'pulse': return <PulseDashboard weekData={activeWeekData} historyKeys={historyKeys} weeksHistory={weeksHistory} selectedWeekKey={selectedWeekKey} onWeekSelect={setSelectedWeekKey} />;
      case 'fill': return <FillWeekForm weekData={activeWeekData} historyKeys={historyKeys} selectedKey={selectedWeekKey} onWeekSelect={setSelectedWeekKey} onSaveWeek={handleSaveWeek} setProfiles={setProfiles} />;
      case 'processes': return <ProcessesMap processes={processes} />; 
      case 'profiles': return <TeamProfilesBoard profiles={profiles} />;
      case 'settings': return <AdminSettings users={authUsers} onAddUser={u=>setAuthUsers([...authUsers, u])} onUpdateUser={(id,p)=>hashPassword(p).then(h=>setAuthUsers(authUsers.map(u=>u.id===id?{...u,passwordHash:h}:u)))} onDeleteUser={id=>setAuthUsers(authUsers.filter(u=>u.id!==id))} />;
      default: return <div className="flex-1 flex flex-col items-center justify-center text-slate-600 h-full mt-20 uppercase font-bold"><Target size={64} className="mb-4 opacity-20" /><h2 className="text-xl tracking-tighter">Раздел в разработке</h2></div>;
    }
  };

  if (!isLoaded) return <div className="h-screen bg-slate-900 flex items-center justify-center text-emerald-400 font-bold"><Activity className="animate-spin mr-3"/> Загрузка Центра Управления...</div>;
  if (!currentUser) return <LoginScreen onLogin={handleLogin} error={loginError} />;

  const navItems = [
    { id: 'pulse', icon: Activity, label: 'Пульс команды', roles: ['admin', 'viewer'] },
    { id: 'fill', icon: Edit, label: 'Заполнить неделю', roles: ['admin'] },
    { id: 'reports', icon: FileText, label: 'Отчеты (TBD)', roles: ['admin', 'viewer'] },
    { id: 'processes', icon: GitMerge, label: 'Процессы', roles: ['admin', 'viewer'] },
    { id: 'profiles', icon: Users, label: 'Профили AI', roles: ['admin', 'viewer'] },
    { id: 'metrics', icon: BarChart2, label: 'Метрики (TBD)', roles: ['admin', 'viewer'] },
    { id: 'training', icon: BookOpen, label: 'Обучение (TBD)', roles: ['admin', 'viewer'] },
    { id: 'settings', icon: Settings, label: 'Доступ', roles: ['admin'] },
  ].filter(item => item.roles.includes(currentUser.role));

  return (
    <div className="flex h-screen bg-slate-900 font-sans text-slate-200 overflow-hidden">
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(71, 85, 105, 0.4); border-radius: 10px; }`}</style>
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col z-20">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40">
            <LayoutDashboard size={20} className="text-emerald-400" />
          </div>
          <div><h1 className="font-bold text-white text-sm leading-tight uppercase tracking-tight">Центр управления</h1><p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Панель Тимлида</p></div>
        </div>
        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === item.id ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-900/10' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'}`}><item.icon size={20} className={activeTab === item.id ? 'text-emerald-400' : 'text-slate-500'} />{item.label}</button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="bg-slate-900 rounded-xl p-3 border border-slate-800/50 flex items-center gap-3">
             <div className={`w-2 h-2 rounded-full ${dbStatus === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-red-500'}`}></div>
             <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{dbStatus === 'connected' ? 'Синхронизация: ОК' : 'Локальный режим'}</div>
          </div>
          <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white uppercase">{currentUser.username.substring(0, 2)}</div>
              <div className="overflow-hidden leading-tight"><p className="text-xs font-bold text-slate-200 truncate w-24">{currentUser.username}</p><p className="text-[10px] text-slate-500 capitalize">{currentUser.role === 'admin' ? 'Админ' : 'Просмотр'}</p></div>
            </div>
            <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors"><LogOut size={16} /></button>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-slate-900 p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto">{renderContent()}</div>
      </main>
    </div>
  );
};

// --- ФОРМА ЗАПОЛНЕНИЯ НЕДЕЛИ ---
const FillWeekForm = ({ historyKeys, weeksHistory, selectedKey, onWeekSelect, weekData, onSaveWeek, setProfiles }) => {
  const [formData, setFormData] = useState(weekData);
  const [isSaved, setIsSaved] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importStatus, setImportStatus] = useState(null);
  const [selectedYear, setSelectedYear] = useState(formData.year || new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(formData.month || new Date().getMonth());
  const [weeksOptions, setWeeksOptions] = useState([]);

  useEffect(() => { setFormData(weekData); setSelectedYear(weekData.year); setSelectedMonth(weekData.month); }, [weekData]);
  useEffect(() => {
    const generated = generateMonthWeeks(selectedYear, selectedMonth);
    setWeeksOptions(generated);
    const valid = generated.find(w => w.weekNumber === formData.weekNumber);
    if (!valid && generated.length > 0) setFormData(prev => ({ ...prev, year: selectedYear, month: selectedMonth, weekNumber: generated[0].weekNumber, dates: generated[0].dates }));
    else setFormData(prev => ({ ...prev, year: selectedYear, month: selectedMonth }));
  }, [selectedYear, selectedMonth]);

  const handleChange = (e) => { const val = e.target.type === 'number' ? Number(e.target.value) : e.target.value; setFormData({ ...formData, [e.target.name]: val }); setIsSaved(false); };
  const handleImportData = () => {
    try {
      let raw = importJson;
      const f = raw.indexOf('{'); const l = raw.lastIndexOf('}');
      if (f !== -1 && l !== -1) raw = raw.substring(f, l + 1);
      raw = raw.replace(/\\([^"\\/bfnrtu])/g, '$1').replace(/,\s*([\]}])/g, '$1').replace(/[\n\r\t]+/g, ' ');
      const data = JSON.parse(raw);
      const merged = { ...formData, ...data };
      if (data.topPerformers) merged.topPerformers = data.topPerformers.map(p => ({ ...p, name: USER_DICTIONARY[safeString(p.name).trim()] || safeString(p.name) }));
      if (data.teamProfiles && setProfiles) setProfiles(data.teamProfiles.map((p, i) => ({ ...p, id: Date.now() + i, color: 'emerald', name: replaceLoginsWithNames(safeString(p.name)) })));
      setFormData(merged); setImportStatus('success'); setImportJson(''); setTimeout(() => setImportStatus(null), 3000);
    } catch (e) { setImportStatus('error'); setTimeout(() => setImportStatus(null), 3000); }
  };

  return (
    <div className="max-w-4xl pb-24 animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-8 gap-4">
        <div><h1 className="text-3xl font-bold text-white">Заполнить неделю</h1><p className="text-slate-400 text-sm">Ввод метрик или AI-импорт из Jira</p></div>
        <WeekSelector historyKeys={historyKeys} weeksHistory={weeksHistory} selectedKey={selectedKey} onSelect={onWeekSelect} activeData={weekData} />
      </div>
      <div className="bg-indigo-900/20 p-6 rounded-xl border border-indigo-500/40 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles size={80} className="text-indigo-400" /></div>
        <h3 className="text-lg font-bold text-white mb-2 relative z-10 flex items-center gap-2"><Sparkles size={20} className="text-indigo-400" /> Умный импорт (AI)</h3>
        <textarea value={importJson} onChange={e=>setImportJson(e.target.value)} placeholder='Вставь JSON...' className="w-full h-32 bg-slate-900/80 border border-indigo-500/30 rounded-xl p-4 text-indigo-100 text-xs font-mono focus:border-indigo-400 outline-none resize-none custom-scrollbar" />
        <div className="flex items-center gap-4 mt-4 relative z-10">
          <button onClick={handleImportData} disabled={!importJson.trim()} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"><DownloadCloud size={16} /> Загрузить JSON</button>
          {importStatus === 'success' && <span className="text-emerald-400 text-sm font-bold flex items-center gap-1"><Check size={18}/> Готово! Сохрани внизу.</span>}
          {importStatus === 'error' && <span className="text-red-400 text-sm font-bold flex items-center gap-1"><AlertTriangle size={18}/> Ошибка в JSON</span>}
        </div>
      </div>
      <form onSubmit={e=>{e.preventDefault(); onSaveWeek(formData); setIsSaved(true); setTimeout(()=>setIsSaved(false),3000);}} className="space-y-6">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700/50 flex flex-col md:flex-row gap-6">
          <div className="flex-1"><label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Год</label><select value={selectedYear} onChange={e=>setSelectedYear(parseInt(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-emerald-500">{availableYears.map(y=><option key={y} value={y}>{y}</option>)}</select></div>
          <div className="flex-1"><label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Месяц</label><select value={selectedMonth} onChange={e=>setSelectedMonth(parseInt(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-emerald-500">{monthNames.map((n,i)=><option key={i} value={i}>{n}</option>)}</select></div>
          <div className="flex-1"><label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Неделя</label><select value={formData.weekNumber || ''} onChange={e=>{const w=weeksOptions.find(o=>o.weekNumber===parseInt(e.target.value)); setFormData({...formData, weekNumber:w.weekNumber, dates:w.dates});}} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-emerald-500">{weeksOptions.map(w=><option key={w.weekNumber} value={w.weekNumber}>{w.label}</option>)}</select></div>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700/50 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3"><h4 className="font-bold text-emerald-400 uppercase text-xs tracking-widest">1-я линия</h4><input type="number" name="incidentsClosed" placeholder="Закрыто" value={formData.incidentsClosed||''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white" /></div>
          <div className="space-y-3"><h4 className="font-bold text-amber-400 uppercase text-xs tracking-widest">Спринт</h4><input type="number" name="sprintCompleted" placeholder="Выполнено" value={formData.sprintCompleted||''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white" /></div>
        </div>
        <div className="fixed bottom-0 left-64 right-0 p-4 bg-slate-950/90 backdrop-blur-md border-t border-slate-800 flex justify-center z-10"><button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-xl active:scale-95"><Save size={20} /> {isSaved ? 'СОХРАНЕНО!' : 'СОХРАНИТЬ В ОБЛАКО'}</button></div>
      </form>
    </div>
  );
};

export default App;
