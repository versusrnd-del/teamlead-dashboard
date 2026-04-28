import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend 
} from 'recharts';
import { 
  Activity, AlertTriangle, CheckCircle, Clock, Server, Shield, 
  LayoutDashboard, Edit, BarChart2, GitMerge, FileText, Award, Users, BookOpen, Save, Copy, Check, Plus, Trash2, PieChart,
  Settings, CheckCircle2, HelpCircle, FileSearch, ArrowRight, Target, Calendar,
  Medal, Star, ThumbsUp, ShieldCheck, Zap, Heart, User, TrendingUp, ShieldAlert, Sparkles, DownloadCloud, Timer, MessageSquare, Tags, ChevronDown, Layers
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

// --- ХЕЛПЕРЫ И ЗАЩИТА ДАННЫХ ---

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

// Броня от падений React (Objects are not valid as a React child)
const safeString = (val) => {
  if (val === null || val === undefined) return '';
  if (Array.isArray(val)) return val.map(v => typeof v === 'object' ? JSON.stringify(v) : String(v)).join(' ');
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val);
    } catch (e) {
      return '';
    }
  }
  return String(val);
};

const formatCSAT = (val) => {
  if (val === null || val === undefined) return '0.0';
  const num = Number(val);
  return isNaN(num) ? '0.0' : num.toFixed(1);
};

// --- НАЧАЛЬНЫЕ ДАННЫЕ (ЧИСТЫЙ СТЕЙТ) ---

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

const defaultAchievements = [];
const defaultProfiles = [];

// --- ПЕРЕИСПОЛЬЗУЕМЫЕ КОМПОНЕНТЫ ---

const WeekSelector = ({ historyKeys, selectedKey, onSelect, activeData }) => (
  <div className="bg-slate-800/50 p-2 rounded-lg border border-slate-700/50 flex items-center gap-3">
    <div className="text-right hidden sm:block">
      <div className="text-sm font-bold text-slate-200">{monthNames[activeData.month] || ''} {activeData.year || ''}</div>
      <div className="text-slate-400 text-xs">Неделя {activeData.weekNumber || ''}</div>
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
          return <option key={k} value={k}>Неделя {parts[1]} ({parts[0]})</option>;
        })}
      </select>
      <ChevronDown size={14} className="absolute right-2 top-2 text-slate-400 pointer-events-none" />
    </div>
  </div>
);

// --- ВКЛАДКА: ПУЛЬС КОМАНДЫ ---

const PulseDashboard = ({ weekData, historyKeys, selectedWeekKey, onWeekSelect }) => {
  const chartData = [
    { name: 'Пн', Спринт: Math.floor((Number(weekData.sprintCompleted) || 0) * 0.2), Срочная: Math.floor((Number(weekData.urgentCompleted) || 0) * 0.25) },
    { name: 'Вт', Спринт: Math.floor((Number(weekData.sprintCompleted) || 0) * 0.3), Срочная: Math.floor((Number(weekData.urgentCompleted) || 0) * 0.2) },
    { name: 'Ср', Спринт: Math.floor((Number(weekData.sprintCompleted) || 0) * 0.2), Срочная: Math.floor((Number(weekData.urgentCompleted) || 0) * 0.25) },
    { name: 'Чт', Спринт: Math.floor((Number(weekData.sprintCompleted) || 0) * 0.2), Срочная: Math.floor((Number(weekData.urgentCompleted) || 0) * 0.15) },
    { name: 'Пт', Спринт: Math.floor((Number(weekData.sprintCompleted) || 0) * 0.1), Срочная: Math.floor((Number(weekData.urgentCompleted) || 0) * 0.15) },
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

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Пульс команды</h1>
          <p className="text-slate-400 text-sm">Оперативный статус направления технической поддержки</p>
        </div>
        <WeekSelector historyKeys={historyKeys} selectedKey={selectedWeekKey} onSelect={onWeekSelect} activeData={weekData} />
      </div>

      <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2"><BarChart2 size={20} className="text-slate-400" />Операционные показатели</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        
        {/* Индекс управляемости */}
        <div className="bg-slate-800 rounded-xl p-5 border-t-4 border-indigo-500 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Индекс управляемости</h3>
            <div className="flex items-baseline gap-2 mb-1"><span className="text-4xl font-bold text-white">{Number(weekData.managementIndex) || 0}</span><span className="text-slate-500 text-sm font-medium">/ 100</span></div>
            <p className="text-xs text-slate-500 mt-1">Оценка на базе SLA</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-700/50 flex justify-between items-center">
            <span className="text-slate-400 text-xs">Статус:</span>
            <span className={`${Number(weekData.managementIndex) > 70 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'} px-2 py-0.5 rounded font-bold text-xs border`}>
              {Number(weekData.managementIndex) > 70 ? 'Управляемо' : (Number(weekData.managementIndex) === 0 ? 'Нет данных' : 'Зона риска')}
            </span>
          </div>
        </div>

        {/* 1-Я ЛИНИЯ */}
        <div className="bg-slate-800 rounded-xl p-5 border-t-4 border-emerald-500 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> 1-я линия</h3>
            <div className="flex items-baseline gap-2 mb-1"><span className="text-4xl font-bold text-white">{Number(weekData.incidentsClosed) || 0}</span><span className="text-slate-500 text-sm font-medium">закрыто</span></div>
            <p className="text-xs text-slate-500 mt-1">Инциденты за неделю</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-700/50 flex justify-between items-center"><span className="text-slate-400 text-xs">В очереди:</span><span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold text-sm border border-emerald-500/20">{Number(weekData.incidentsQueue) || 0}</span></div>
        </div>
        
        {/* СПРИНТ */}
        <div className="bg-slate-800 rounded-xl p-5 border-t-4 border-amber-500 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Спринт (План)</h3>
            <div className="flex items-baseline gap-2 mb-1"><span className="text-4xl font-bold text-white">{Number(weekData.sprintCompleted) || 0}</span><span className="text-slate-500 text-sm font-medium">выполнено</span></div>
            <p className="text-xs text-amber-400 mt-1">Из {Number(weekData.sprintPlanned) || 0} запланированных</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-700/50 flex justify-between items-center"><span className="text-slate-400 text-xs">Перенесено:</span><span className="bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded font-bold text-sm border border-orange-500/20">{Number(weekData.sprintCarriedOver) || 0}</span></div>
        </div>
        
        {/* СРОЧНАЯ ЛИНИЯ */}
        <div className="bg-slate-800 rounded-xl p-5 border-t-4 border-red-500 shadow-sm relative overflow-hidden bg-gradient-to-b from-slate-800 to-slate-800/80 flex flex-col justify-between">
          <div>
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div> Срочная (Щит)</h3>
            <div className="flex items-baseline gap-2 mb-1"><span className="text-4xl font-bold text-white">{Number(weekData.urgentCompleted) || 0}</span><span className="text-slate-500 text-sm font-medium">отбито</span></div>
            <p className="text-xs text-slate-500 mt-1">Внеплановый хаос</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-700/50 flex justify-between items-center"><span className="text-slate-400 text-xs">Активно в моменте:</span><span className="text-white font-bold">{Number(weekData.urgentQueue) || 0}</span></div>
        </div>
        
        {/* БЭКЛОГ */}
        <div className="bg-slate-800 rounded-xl p-5 border-t-4 border-blue-500 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Бэклог</h3>
            <div className="flex items-baseline gap-2 mb-1"><span className="text-4xl font-bold text-white">{Number(weekData.backlog) || 0}</span><span className="text-slate-500 text-sm font-medium">всего</span></div>
            <p className="text-xs text-slate-500 mt-1">Очередь Support</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-700/50 flex justify-between items-center"><span className="text-slate-400 text-xs">Старше 30 дней:</span><span className="bg-red-500/10 text-red-400 px-2 py-0.5 rounded font-bold text-sm border border-red-500/20 flex items-center gap-1"><Clock size={12} /> {Number(weekData.backlogOld30) || 0}</span></div>
        </div>
      </div>

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
                      <div className="mt-2 text-xs text-slate-400 leading-relaxed">{desc}</div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {(weekData.sprintWin || weekData.sprintRisk || weekData.shieldHero) && (
            <div className={`grid grid-cols-1 lg:grid-cols-3 gap-4 ${weekData.taskComplexity?.length > 0 ? 'pt-6 border-t border-slate-700/50' : ''}`}>
               {weekData.sprintWin && (
                 <div className="bg-emerald-500/5 p-4 rounded-lg border border-emerald-500/20">
                   <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><CheckCircle2 size={14}/> Победа спринта</h4>
                   <p className="text-sm text-slate-300">{safeString(weekData.sprintWin)}</p>
                 </div>
               )}
               {weekData.sprintRisk && (
                 <div className="bg-amber-500/5 p-4 rounded-lg border border-amber-500/20">
                   <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><AlertTriangle size={14}/> Риск / Бэклог</h4>
                   <p className="text-sm text-slate-300">{safeString(weekData.sprintRisk)}</p>
                 </div>
               )}
               {weekData.shieldHero && (
                 <div className="bg-indigo-500/5 p-4 rounded-lg border border-indigo-500/20">
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

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50 shadow-sm xl:col-span-2 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-base font-medium text-slate-200 flex items-center gap-2"><Users size={18} className="text-blue-400" /> Тимлид-аналитика: Качество и нагрузка</h3>
            <span className="text-[10px] bg-slate-900 text-slate-500 px-2 py-1 rounded border border-slate-700/50 uppercase tracking-wider">Не для публичного рейтинга</span>
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
                    <div className="relative z-10 text-xs text-slate-400 bg-slate-950/40 p-2.5 rounded border border-slate-700/50 leading-relaxed border-l-2 shadow-inner" style={{borderLeftColor: accentColor}}>
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
              <span className="text-xs text-slate-500">Закрыто: {(Number(weekData.sprintCompleted) || 0) + (Number(weekData.urgentCompleted) || 0)}</span>
            </div>
            <div className="flex-1 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} fontSize={10} dy={5} />
                  <YAxis stroke="#64748b" tickLine={false} axisLine={false} fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#f8fafc', fontSize: '12px' }} cursor={{ fill: '#334155', opacity: 0.3 }} />
                  <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} iconType="circle" />
                  <Bar dataKey="Спринт" name="Спринт (План)" fill="#f59e0b" radius={[2, 2, 0, 0]} stackId="a" maxBarSize={40} />
                  <Bar dataKey="Срочная" name="Срочная (Щит)" fill="#ef4444" radius={[2, 2, 0, 0]} stackId="a" maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50 shadow-sm flex-1">
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 h-full flex flex-col justify-center">
              <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><BookOpen size={16}/> Гипотеза недели (Обучение)</span>
              <p className="text-sm text-emerald-400 font-medium leading-relaxed">{safeString(weekData.trainingHypothesis)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700/50 shadow-sm overflow-hidden mb-8">
        <div className="bg-indigo-500/10 p-5 border-b border-indigo-500/20 flex items-center gap-3">
          <Sparkles size={24} className="text-indigo-400" />
          <div><h2 className="text-lg font-bold text-white">Управленческий AI-синтез недели</h2><p className="text-xs text-indigo-300/70">Качественные выводы на основе семантического NLP-анализа инцидентов</p></div>
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

// --- ФОРМА ИМПОРТА ---

const FillWeekForm = ({ historyKeys, selectedKey, onWeekSelect, weekData, onSaveWeek, setProfiles }) => {
  const [formData, setFormData] = useState(weekData);
  const [isSaved, setIsSaved] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [status, setStatus] = useState(null);
  const [selectedYear, setSelectedYear] = useState(formData.year || new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(formData.month || new Date().getMonth());
  const weeksOptions = generateMonthWeeks(selectedYear, selectedMonth);

  useEffect(() => { setFormData(weekData); setSelectedYear(weekData.year); setSelectedMonth(weekData.month); }, [weekData]);

  const handleImportData = () => {
    try {
      let raw = importJson;
      const f = raw.indexOf('{');
      const l = raw.lastIndexOf('}');
      if (f !== -1 && l !== -1) raw = raw.substring(f, l + 1);
      
      // СУПЕР-ОЧИСТКА JSON ОТ ГАЛЛЮЦИНАЦИЙ GPT
      raw = raw.replace(/,\s*([\]}])/g, '$1'); // убрать висячие запятые
      raw = raw.replace(/[\n\r\t]+/g, ' '); // убрать реальные переносы строк
      raw = raw.replace(/\\(?!["\\/bfnrtu])/g, "\\\\"); // починить пути в Windows (X:\)
      
      const data = JSON.parse(raw);
      
      let newIndex = formData.managementIndex || 100;
      if (data.slaMetrics && Array.isArray(data.slaMetrics)) {
        const totalViolations = data.slaMetrics.reduce((sum, sla) => sum + (Number(sla.violations) || 0), 0);
        if (totalViolations > 50) newIndex -= 30;
        else if (totalViolations > 20) newIndex -= 15;
      }
      
      // ВАЖНОЕ СЛИЯНИЕ ДАННЫХ (чтобы задачи не затерли инциденты и наоборот)
      const merged = { ...formData, ...data, managementIndex: newIndex };
      
      if (!data.topIncidents && formData.topIncidents) merged.topIncidents = formData.topIncidents;
      if (!data.slaMetrics && formData.slaMetrics) merged.slaMetrics = formData.slaMetrics;
      if (!data.topPerformers && formData.topPerformers) merged.topPerformers = formData.topPerformers;
      if (!data.taskComplexity && formData.taskComplexity) merged.taskComplexity = formData.taskComplexity;

      if (data.topPerformers) {
        merged.topPerformers = data.topPerformers.map(p => ({ ...p, name: USER_DICTIONARY[safeString(p.name).trim()] || safeString(p.name) }));
      }

      ['mainInsight', 'mainRisk', 'nextFocus', 'trainingHypothesis', 'mainWin', 'thanks', 'sprintWin', 'sprintRisk', 'shieldHero'].forEach(field => {
        if (data[field] !== undefined && data[field] !== null) {
          let textVal = data[field];
          if (Array.isArray(textVal)) textVal = textVal.join(' ');
          else if (typeof textVal === 'object') textVal = JSON.stringify(textVal);
          merged[field] = replaceLoginsWithNames(String(textVal));
        } else if (formData[field]) {
          merged[field] = formData[field]; // Сохраняем старое, если GPT не прислал новое
        }
      });

      if (data.teamProfiles && setProfiles) {
         const newProfiles = data.teamProfiles.map((p, i) => {
           const lvl = Number(p.delegationLevel) || 1;
           const color = lvl <= 2 ? 'blue' : (lvl === 3 ? 'emerald' : 'amber');
           return {
             ...p, id: i + 1, color: color, name: replaceLoginsWithNames(safeString(p.name))
           };
         });
         setProfiles(newProfiles);
      }
      
      setFormData(merged);
      setStatus('success');
      setImportJson(''); 
      setTimeout(() => setStatus(null), 3000);
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    } catch (e) {
      console.error("JSON parse error:", e);
      setStatus('error');
      setTimeout(() => setStatus(null), 3000);
    }
  };

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

  const addIncident = () => { setFormData({ ...formData, topIncidents: [...(formData.topIncidents||[]), { name: '', count: 0, analysis: '' }] }); setIsSaved(false); };
  const removeIncident = (index) => { const newIncidents = (formData.topIncidents||[]).filter((_, i) => i !== index); setFormData({ ...formData, topIncidents: newIncidents }); setIsSaved(false); };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanedIncidents = (formData.topIncidents || []).filter(inc => safeString(inc.name).trim() !== '' || (Number(inc.count) || 0) > 0);
    const finalData = { ...formData, topIncidents: cleanedIncidents };
    onSaveWeek(finalData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl pb-24 animate-in fade-in">
      <div className="flex justify-between items-end mb-8 gap-4">
        <div><h1 className="text-3xl font-bold text-white">Импорт данных</h1><p className="text-slate-400 text-sm">Сначала загрузите инциденты, затем задачи. Не забудьте сохранить!</p></div>
        <WeekSelector historyKeys={historyKeys} selectedKey={selectedKey} onSelect={onWeekSelect} activeData={weekData} />
      </div>

      <div className="bg-indigo-900/20 p-6 rounded-xl border border-indigo-500/40 mb-8 shadow-sm">
        <textarea value={importJson} onChange={(e) => setImportJson(e.target.value)} placeholder='Вставьте сгенерированный GPT JSON (сначала инциденты, потом задачи)...' className="w-full h-40 bg-slate-900/80 border border-indigo-500/30 rounded-lg p-4 text-indigo-100 text-xs font-mono custom-scrollbar focus:border-indigo-500 outline-none" />
        <div className="flex items-center gap-4 mt-4">
          <button onClick={handleImportData} disabled={!importJson.trim()} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2"><DownloadCloud size={16} /> Загрузить из JSON</button>
          {status === 'success' && <span className="text-emerald-400 text-sm flex items-center gap-1"><Check size={18}/> Данные загружены. Не забудьте сохранить внизу!</span>}
          {status === 'error' && <span className="text-red-400 text-sm flex items-center gap-1"><AlertTriangle size={18}/> Ошибка формата JSON</span>}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700/50 relative overflow-hidden">
          <Calendar size={80} className="absolute top-0 right-0 opacity-5" />
          <h3 className="text-lg font-medium text-white mb-4 relative z-10">Период отчета</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
            <div><label className="text-xs text-slate-500 mb-1 block">Год</label>
              <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500">{availableYears.map(y => <option key={y} value={y}>{y}</option>)}</select></div>
            <div><label className="text-xs text-slate-500 mb-1 block">Месяц</label>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500">{monthNames.map((n, i) => <option key={n} value={i}>{n}</option>)}</select></div>
            <div><label className="text-xs text-slate-500 mb-1 block">Неделя (ISO)</label>
              <select value={formData.weekNumber || ''} onChange={(e) => { const w = weeksOptions.find(o => o.weekNumber === parseInt(e.target.value)); setFormData({...formData, weekNumber: w.weekNumber, dates: w.dates}); }} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500">{weeksOptions.map(w => <option key={w.weekNumber} value={w.weekNumber}>{w.label}</option>)}</select></div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700/50 shadow-sm">
          <h3 className="text-lg font-medium text-white mb-4">Метрики потоков</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-3 p-3 bg-slate-900/50 rounded-lg border border-emerald-500/20">
              <h4 className="text-sm font-bold text-emerald-400">1-я линия (Инциденты)</h4>
              <div><label className="block text-xs text-slate-400 mb-1">Закрыто за неделю</label><input type="number" name="incidentsClosed" value={formData.incidentsClosed || ''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" /></div>
              <div><label className="block text-xs text-slate-400 mb-1">Остаток в очереди</label><input type="number" name="incidentsQueue" value={formData.incidentsQueue || ''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" /></div>
            </div>
            <div className="space-y-3 p-3 bg-slate-900/50 rounded-lg border border-amber-500/20">
              <h4 className="text-sm font-bold text-amber-400">Спринт (Задачи)</h4>
              <div><label className="block text-xs text-slate-400 mb-1">Запланировали</label><input type="number" name="sprintPlanned" value={formData.sprintPlanned || ''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" /></div>
              <div className="flex gap-2">
                <div className="w-1/2"><label className="block text-xs text-slate-400 mb-1">Выполнили</label><input type="number" name="sprintCompleted" value={formData.sprintCompleted || ''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" /></div>
                <div className="w-1/2"><label className="block text-xs text-slate-400 mb-1">Перенесли</label><input type="number" name="sprintCarriedOver" value={formData.sprintCarriedOver || ''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-orange-400" /></div>
              </div>
            </div>
            <div className="space-y-3 p-3 bg-slate-900/50 rounded-lg border border-red-500/20">
              <h4 className="text-sm font-bold text-red-400">Срочная (Щит)</h4>
              <div><label className="block text-xs text-slate-400 mb-1">Закрыто срочных</label><input type="number" name="urgentCompleted" value={formData.urgentCompleted || ''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" /></div>
              <div><label className="block text-xs text-slate-400 mb-1">Активно в моменте</label><input type="number" name="urgentQueue" value={formData.urgentQueue || ''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" /></div>
            </div>
            <div className="space-y-3 p-3 bg-slate-900/50 rounded-lg border border-blue-500/20">
              <h4 className="text-sm font-bold text-blue-400">Бэклог / Долг</h4>
              <div><label className="block text-xs text-slate-400 mb-1">Всего в очереди</label><input type="number" name="backlog" value={formData.backlog || ''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" /></div>
              <div><label className="block text-xs text-slate-400 mb-1">Старше 30 дней</label><input type="number" name="backlogOld30" value={formData.backlogOld30 || ''} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-red-400" /></div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700/50 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div><h3 className="text-lg font-medium text-white">Топ драйверов (Ручная корректировка)</h3></div>
            <button type="button" onClick={addIncident} className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded text-sm flex items-center gap-1 transition"><Plus size={16} /> Добавить строку</button>
          </div>
          <div className="space-y-3">
            {(formData.topIncidents || []).map((incident, index) => (
              <div key={index} className="flex flex-col gap-2 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 relative group">
                <div className="flex gap-3 items-center">
                  <span className="text-slate-500 font-medium w-5 text-right text-sm">{index + 1}.</span>
                  <input type="text" placeholder="Смысловая проблема (Парето)" value={safeString(incident.name)} onChange={(e) => handleIncidentChange(index, 'name', e.target.value)} className="flex-1 bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 outline-none transition font-medium" />
                  <input type="number" placeholder="Кол-во" value={incident.count !== undefined ? incident.count : ''} onChange={(e) => handleIncidentChange(index, 'count', e.target.value)} className="w-24 bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 outline-none transition" />
                  <button type="button" onClick={() => removeIncident(index)} className="text-slate-500 hover:text-red-400 p-1.5 rounded transition opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                </div>
                <div className="pl-11 pr-11">
                  <textarea placeholder="AI-Микроанализ: была ли авария, как решали..." value={safeString(incident.analysis)} onChange={(e) => handleIncidentChange(index, 'analysis', e.target.value)} rows={2} className="w-full bg-slate-950/50 border border-slate-700/50 rounded p-2 text-xs text-slate-400 focus:border-emerald-500 outline-none transition resize-none custom-scrollbar"></textarea>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700/50 shadow-sm">
          <h3 className="text-lg font-medium text-white mb-4">Управленческие выводы (Инциденты)</h3>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-emerald-400 mb-1">Главный вывод</label><textarea name="mainInsight" value={safeString(formData.mainInsight)} onChange={handleChange} rows={2} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none resize-none custom-scrollbar"></textarea></div>
            <div><label className="block text-sm font-medium text-amber-400 mb-1">Главный риск</label><textarea name="mainRisk" value={safeString(formData.mainRisk)} onChange={handleChange} rows={2} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-amber-500 outline-none resize-none custom-scrollbar"></textarea></div>
            <div><label className="block text-sm font-medium text-blue-400 mb-1">Фокус следующей недели</label><textarea name="nextFocus" value={safeString(formData.nextFocus)} onChange={handleChange} rows={2} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none resize-none custom-scrollbar"></textarea></div>
          </div>
        </div>

        <div className="fixed bottom-0 left-64 right-0 p-4 bg-slate-950/90 backdrop-blur-md border-t border-slate-800 flex justify-center z-10">
          <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-3.5 rounded-xl font-black transition-all shadow-xl shadow-emerald-900/20 active:scale-95 flex items-center gap-2">
            <Save size={20} /> {isSaved ? 'Сохранено в базу портала!' : 'Сохранить данные недели'}
          </button>
        </div>
      </form>
    </div>
  );
};

// --- ВКЛАДКА: ОТЧЕТЫ ---

const ReportsGenerator = ({ weekData, historyKeys, selectedKey, onWeekSelect }) => {
  const [copiedId, setCopiedId] = useState(null);
  const sortedIncidents = weekData.topIncidents ? [...weekData.topIncidents].sort((a,b)=>(Number(b.count)||0)-(Number(a.count)||0)) : [];
  const top3 = sortedIncidents.slice(0, 3);
  const top3Text = top3.map(i => `${safeString(i.name)} (${Number(i.count)||0})`).join(', ');
  const totalListIncidents = sortedIncidents.reduce((sum, i) => sum + (Number(i.count) || 0), 0);
  const top3Sum = top3.reduce((sum, i) => sum + (Number(i.count) || 0), 0);
  const paretoPercent = totalListIncidents > 0 ? Math.round((top3Sum / totalListIncidents) * 100) : 0;

  const reports = [
    {
      id: 'team', title: 'Отчет для команды', icon: Users, color: 'emerald',
      content: `Привет, команда! Итоги ${weekData.weekNumber || ''} недели (${safeString(weekData.dates)}):\n\n✅ 1-я линия круто отработала: закрыто ${weekData.incidentsClosed || 0} инцидентов.\n🔥 Топ-3 проблемы: ${top3Text}.\n🚀 Дежурный "Щит" отбил ${weekData.urgentCompleted || 0} срочных задач.\n⚙️ Спринт: выполнили ${weekData.sprintCompleted || 0} из ${weekData.sprintPlanned || 0} плановых.\n\n🏆 Главная победа: ${safeString(weekData.mainWin) || 'Выдержали темп и не сдались!'}\n🙏 Отдельное спасибо: ${safeString(weekData.thanks) || 'Всей команде за крутую работу!'}\n\n🎯 Вывод: ${safeString(weekData.mainInsight)}\nФокус на след. неделю: ${safeString(weekData.nextFocus)}`
    },
    {
      id: 'manager', title: 'Отчет для руководителя', icon: LayoutDashboard, color: 'blue',
      content: `Статус по направлению ОСО за ${weekData.weekNumber || ''} неделю (${safeString(weekData.dates)})\n\n🔹 Основные метрики:\n- Индекс управляемости: ${weekData.managementIndex || 0}/100\n- Спринт: выполнено ${weekData.sprintCompleted || 0} из ${weekData.sprintPlanned || 0}. Хвост: ${weekData.sprintCarriedOver || 0} задач.\n- Срочная линия: закрыл ${weekData.urgentCompleted || 0} задач.\n- 1-я линия: закрыто ${weekData.incidentsClosed || 0} инцидентов.\n- Бэклог Support: ${weekData.backlog || 0} задач (из них ${weekData.backlogOld30 || 0} старше 30 дней).\n\n⚠️ Аналитика нагрузки (1-я линия):\nТоп-3 проблемы забирают ${paretoPercent}% времени (${top3Text}).\n\n❗️ Основные риски:\n${safeString(weekData.mainRisk)}\n\n📝 План действий:\n${safeString(weekData.nextFocus)}`
    },
    {
      id: 'retro', title: 'Отчет для трекера', icon: BookOpen, color: 'indigo',
      content: `Рефлексия (Этап 2: Процессы и метрики). Неделя ${weekData.weekNumber || ''}.\n\n🧪 Проверяемая гипотеза:\n${safeString(weekData.trainingHypothesis)}\n\n📊 Метрики процесса:\n- Выполнение плана: ${weekData.sprintCompleted || 0}/${weekData.sprintPlanned || 0}.\n- Защита от хаоса: "Щит" закрыл ${weekData.urgentCompleted || 0} внеплановых задач.\n- Эффект "Черри-пикинга": ${weekData.backlogOld30 || 0} задач висят >30 дней.\n- Узкое место (Парето): ${top3Sum} инцидентов (${paretoPercent}%) генерируется 3 типами проблем (${top3Text}).\n\n💡 Управленческий вывод:\n${safeString(weekData.mainInsight)}\n\n🚧 Что мешает процессу:\n${safeString(weekData.mainRisk)}\n\n🛠 Изменение (Эксперимент):\n${safeString(weekData.nextFocus)}`
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
        <div><h1 className="text-3xl font-bold text-white mb-1">Генератор отчетов</h1><p className="text-slate-400 text-sm">Умная сборка метрик</p></div>
        <WeekSelector historyKeys={historyKeys} selectedKey={selectedKey} onSelect={onWeekSelect} activeData={weekData} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {reports.map((report) => {
          const Icon = report.icon; const isCopied = copiedId === report.id;
          return (
            <div key={report.id} className="bg-slate-800 rounded-xl border border-slate-700/50 shadow-sm flex flex-col overflow-hidden">
              <div className={`bg-slate-900/50 p-4 border-b border-slate-700/50 flex justify-between items-center`}><div className="flex items-center gap-2"><Icon size={18} className={`text-${report.color}-400`} /><h3 className="font-medium text-slate-200 text-sm">{report.title}</h3></div></div>
              <div className="p-4 flex-1"><textarea readOnly value={report.content} className="w-full h-full min-h-[300px] bg-transparent text-slate-300 text-sm resize-none outline-none custom-scrollbar" /></div>
              <div className="p-4 bg-slate-900/30 border-t border-slate-700/50"><button onClick={() => handleCopy(report.content, report.id)} className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${isCopied ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600'}`}>{isCopied ? <Check size={16} /> : <Copy size={16} />} {isCopied ? 'Скопировано!' : 'Скопировать'}</button></div>
            </div>
          )
        })}
      </div>
    </div>
  );
};

// --- ВКЛАДКА: ПРОЦЕССЫ ---

const ProcessesMap = ({ processes }) => {
  const getStatusBadge = (status) => {
    switch(status) {
      case 'working': return <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-md text-xs font-bold border border-emerald-500/20"><CheckCircle2 size={14}/> Работает</span>;
      case 'needs_review': return <span className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-md text-xs font-bold border border-amber-500/20"><AlertTriangle size={14}/> Требует пересмотра</span>;
      default: return <span className="flex items-center gap-1.5 bg-slate-700/50 text-slate-400 px-2.5 py-1 rounded-md text-xs font-bold border border-slate-600"><HelpCircle size={14}/> В работе</span>;
    }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-6xl pb-10">
      <div className="flex justify-between items-end mb-8"><div><h1 className="text-3xl font-bold text-white mb-1">Карта процессов</h1><p className="text-slate-400 text-sm">Управление операционной моделью команды</p></div></div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {processes.map(proc => (
          <div key={proc.id} className="bg-slate-800 rounded-xl border border-slate-700/50 shadow-sm overflow-hidden flex flex-col transition-all hover:border-slate-600">
            <div className="p-5 border-b border-slate-700/50 flex justify-between items-start bg-slate-900/20"><div><h3 className="text-lg font-bold text-white mb-1">{safeString(proc.name)}</h3><p className="text-slate-500 text-xs flex items-center gap-1"><Users size={12}/> Владелец: {safeString(proc.owner)}</p></div>{getStatusBadge(proc.status)}</div>
            <div className="p-5 flex-1 space-y-4">
              <div><span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Цель</span><p className="text-sm text-slate-300">{safeString(proc.goal)}</p></div>
              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50"><span className="text-xs font-bold text-amber-400/80 uppercase tracking-wider mb-1 flex items-center gap-1"><FileSearch size={14}/> Симптом / Проблема</span><p className="text-sm text-slate-300">{safeString(proc.currentProblem)}</p></div>
            </div>
            <div className="p-5 bg-slate-900/40 border-t border-slate-700/50"><span className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1"><ArrowRight size={14}/> Гипотеза (Что меняем)</span><p className="text-sm font-medium text-emerald-100">{safeString(proc.nextExperiment)}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- ВКЛАДКА: ДОСТИЖЕНИЯ ---

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
      <div className="flex justify-between items-end mb-8"><div><h1 className="text-3xl font-bold text-white mb-1">Достижения и Признание</h1><p className="text-slate-400 text-sm">Фокус на полезном поведении</p></div></div>
      <div className="bg-slate-800 rounded-xl border border-slate-700/50 shadow-sm p-6 mb-8 flex items-start gap-4">
        <div className="bg-indigo-500/20 p-3 rounded-lg border border-indigo-500/30 text-indigo-400 shrink-0"><ThumbsUp size={24} /></div>
        <div><h3 className="text-slate-200 font-medium mb-1">Почему здесь нет "Сотрудника месяца"?</h3><p className="text-slate-400 text-sm leading-relaxed">Рейтинги заставляют людей заниматься "черри-пикингом". Мы отмечаем конкретное <b>полезное поведение</b>.</p></div>
      </div>
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Users size={20} className="text-blue-400" /> Командные победы</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {teamAchievements.map(a => (
          <div key={a.id} className={`bg-slate-800 rounded-xl p-5 border-t-4 border-${a.color}-500 shadow-sm flex items-start gap-4`}><div className={`bg-${a.color}-500/10 p-3 rounded-lg border border-${a.color}-500/20 shrink-0`}>{getIcon(a.icon, a.color)}</div><div><h3 className="font-bold text-slate-200 mb-1">{safeString(a.title)}</h3><p className="text-slate-400 text-sm">{safeString(a.description)}</p></div></div>
        ))}
        {teamAchievements.length === 0 && <p className="text-slate-500 text-sm col-span-3">Пока нет командных побед на этой неделе.</p>}
      </div>
    </div>
  );
};

// --- ВКЛАДКА: ПРОФИЛИ КОМАНДЫ ---

const TeamProfilesBoard = ({ profiles }) => {
  return (
    <div className="animate-in fade-in duration-500 max-w-6xl pb-10">
      <div className="flex justify-between items-end mb-8"><div><h1 className="text-3xl font-black text-white mb-1">Профили команды (AI Анализ)</h1><p className="text-slate-400 text-sm">Генерируется нейросетью на базе закрытых инцидентов 1-й линии</p></div></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {profiles.map(p => (
          <div key={p.id} className="bg-slate-800 rounded-2xl border border-slate-700/50 overflow-hidden flex flex-col shadow-xl">
            <div className="p-6 border-b border-slate-700/50 bg-slate-900/30 flex gap-5 items-center">
              <div className={`w-16 h-16 rounded-2xl bg-${p.color || 'blue'}-500/20 flex items-center justify-center text-2xl font-black text-${p.color || 'blue'}-400 border-2 border-${p.color || 'blue'}-500/30 shrink-0`}>
                {safeString(p.name).trim() ? safeString(p.name).split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??'}
              </div>
              <div><h3 className="text-xl font-bold text-white">{safeString(p.name)}</h3><p className="text-slate-400 text-sm font-medium">{safeString(p.role)}</p></div>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/30"><span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block mb-2">Сильные стороны</span><p className="text-sm text-slate-300 leading-relaxed font-medium">{safeString(p.strengths)}</p></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/20 p-3 rounded-xl border border-slate-700/20"><span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-1">Точка роста</span><p className="text-xs text-slate-400">{safeString(p.growthZone)}</p></div>
                <div className="bg-slate-900/20 p-3 rounded-xl border border-slate-700/20"><span className="text-[10px] font-black text-red-400 uppercase tracking-widest block mb-1">Риск</span><p className="text-xs text-slate-400">{safeString(p.risks)}</p></div>
              </div>
            </div>
          </div>
        ))}
        {(!profiles || profiles.length === 0) && <div className="col-span-2 flex flex-col items-center justify-center p-12 bg-slate-800/50 rounded-xl border border-slate-700/50 border-dashed"><Users size={48} className="text-slate-600 mb-4" /><p className="text-slate-400 text-sm">Профили не загружены.</p></div>}
      </div>
    </div>
  );
};

// --- ОСНОВНОЕ ПРИЛОЖЕНИЕ ---

const App = () => {
  const [activeTab, setActiveTab] = useState('pulse'); 
  
  const [weeksHistory, setWeeksHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('teamlead_history_data_v10');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { [`${defaultWeekData.year}-${defaultWeekData.weekNumber}`]: defaultWeekData };
  });

  const [selectedWeekKey, setSelectedWeekKey] = useState(() => {
    const keys = Object.keys(weeksHistory);
    return keys.length > 0 ? keys.sort().pop() : `${defaultWeekData.year}-${defaultWeekData.weekNumber}`;
  });

  const [processes, setProcesses] = useState(() => { try { const saved = localStorage.getItem('teamlead_processes_v10'); if (saved) return JSON.parse(saved); } catch (e) {} return defaultProcesses; });
  const [achievements, setAchievements] = useState(() => { try { const saved = localStorage.getItem('teamlead_achievements_v10'); if (saved) return JSON.parse(saved); } catch (e) {} return defaultAchievements; });
  const [profiles, setProfiles] = useState(() => { try { const saved = localStorage.getItem('teamlead_profiles_v10'); if (saved) return JSON.parse(saved); } catch (e) {} return defaultProfiles; });

  useEffect(() => {
    localStorage.setItem('teamlead_history_data_v10', JSON.stringify(weeksHistory));
    localStorage.setItem('teamlead_processes_v10', JSON.stringify(processes));
    localStorage.setItem('teamlead_achievements_v10', JSON.stringify(achievements));
    localStorage.setItem('teamlead_profiles_v10', JSON.stringify(profiles));
  }, [weeksHistory, processes, achievements, profiles]);

  const activeWeekData = weeksHistory[selectedWeekKey] || defaultWeekData;
  const historyKeys = Object.keys(weeksHistory).sort().reverse(); 

  const handleSaveWeek = (newData) => {
    const key = `${newData.year}-${newData.weekNumber}`;
    setWeeksHistory(prev => ({ ...prev, [key]: newData }));
    setSelectedWeekKey(key);
    setActiveTab('pulse');
  };

  const navItems = [
    { id: 'pulse', icon: Activity, label: 'Пульс команды' },
    { id: 'fill', icon: Edit, label: 'Заполнить неделю' },
    { id: 'reports', icon: FileText, label: 'Отчеты' },
    { id: 'processes', icon: GitMerge, label: 'Процессы' },
    { id: 'achievements', icon: Award, label: 'Достижения' },
    { id: 'profiles', icon: Users, label: 'Профили AI' }
  ];

  return (
    <div className="flex h-screen bg-slate-900 font-sans text-slate-200 overflow-hidden">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.1); border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(71, 85, 105, 0.6); border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(100, 116, 139, 0.8); }
      `}</style>
      
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col flex-shrink-0 z-20">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40"><LayoutDashboard size={20} className="text-emerald-400" /></div>
          <div><h1 className="font-black text-white text-sm leading-tight uppercase tracking-tighter">Control Room</h1><p className="text-[10px] text-slate-500 uppercase font-bold">TeamLead Dashboard</p></div>
        </div>
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2 custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-900/10' : 'text-slate-400 hover:bg-slate-800/50'}`}>
                <Icon size={20} />{item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto bg-slate-900 p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'pulse' && <PulseDashboard weekData={activeWeekData} historyKeys={historyKeys} selectedWeekKey={selectedWeekKey} onWeekSelect={setSelectedWeekKey} />}
          {activeTab === 'fill' && <FillWeekForm weekData={activeWeekData} historyKeys={historyKeys} selectedKey={selectedWeekKey} onWeekSelect={setSelectedWeekKey} onSaveWeek={handleSaveWeek} setProfiles={setProfiles} />}
          {activeTab === 'reports' && <ReportsGenerator weekData={activeWeekData} historyKeys={historyKeys} selectedKey={selectedWeekKey} onWeekSelect={setSelectedWeekKey} />}
          {activeTab === 'processes' && <ProcessesMap processes={processes} />}
          {activeTab === 'achievements' && <AchievementsBoard achievements={achievements} />}
          {activeTab === 'profiles' && <TeamProfilesBoard profiles={profiles} />}
        </div>
      </main>
    </div>
  );
};

export default App;
