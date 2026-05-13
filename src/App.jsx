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
  "ruslan_khaleddinov": "Руслан Халеддинов",
  "khaleddinov": "Руслан Халеддинов",
  "mvol": "Михаил Волков",
  "tea1": "Евгений Тихонов",
  "dbog": "Дмитрий Богатырев"
};

const BASE_CAPACITY = 50; 
const TEAM_LEAD_ID = "u01002"; // ID тимлида для исключения из таблиц отчета
const TEAM_LEAD_NAME = "Виктор С.";
const THIRD_LINE_ADMINS = ["Антон Лысов", "Петр Скляренко", "Максим Нестеров", "Роман Нор", "e0197"];
const EXCLUDED_USER_IDS = ["u0557", "u0549"];

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

const isExcludedUser = (value) => {
  const raw = safeString(value).trim().toLowerCase();
  if (!raw) return false;
  const fullName = safeString(getFullName(raw)).trim().toLowerCase();
  return EXCLUDED_USER_IDS.includes(raw) || EXCLUDED_USER_IDS.includes(fullName);
};

const isKnownTeamMember = (value) => {
  const raw = safeString(value).trim();
  if (!raw) return false;
  if (isExcludedUser(raw)) return false;
  const normalized = raw.toLowerCase();
  const knownLogin = Object.keys(USER_DICTIONARY).some(k => k.toLowerCase() === normalized);
  const knownName = Object.values(USER_DICTIONARY).some(name => name.toLowerCase() === normalized);
  const fullName = getFullName(raw);
  const knownFullName = Object.values(USER_DICTIONARY).some(name => name.toLowerCase() === safeString(fullName).toLowerCase());
  return knownLogin || knownName || knownFullName;
};

const safeString = (val) => {
  if (val === null || val === undefined) return '';
  if (Array.isArray(val)) return val.map(v => typeof v === 'object' ? JSON.stringify(v) : String(v)).join(' ');
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
};

const escapeHtml = (value) => safeString(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const normalizeTaskSize = (value) => {
  const raw = safeString(value).trim();
  if (!raw) return '';
  const upper = raw.toUpperCase();
  const normalized = raw.toLowerCase().replace(/[^a-zа-яё0-9]/gi, '');
  if (upper === 'XL' || normalized.includes('xlarge') || normalized.includes('extra') || normalized.includes('тяж') || normalized.includes('стар') || normalized.includes('долг')) return 'XL';
  if (upper === 'L' || normalized.includes('large') || normalized.includes('слож') || normalized.includes('круп')) return 'L';
  if (upper === 'M' || normalized.includes('medium') || normalized.includes('сред')) return 'M';
  if (upper === 'S' || normalized.includes('small') || normalized.includes('легк') || normalized.includes('прост') || normalized.includes('быстр')) return 'S';
  return '';
};

const TEAM_METRIC_SIZE_WEIGHTS = { S: 1, M: 3, L: 8, XL: 15 };
const TASK_SIZE_LABELS = {
  S: 'Легко',
  M: 'Средне',
  L: 'Сложно',
  XL: 'Очень сложно'
};
const getTaskSizeLabel = (size) => TASK_SIZE_LABELS[normalizeTaskSize(size)] || 'Средне';
const TEAM_DOMAIN_OPTIONS = [
  'Citrix / фермы',
  'Скрипты / автоматизация',
  'Виртуализация / серверы',
  'Терминалы / Серверы',
  'Сеть / BinkD',
  'Работы по Лотус',
  'IDM',
  '2FA',
  'Zabbix / мониторинг',
  'Принтера',
  'Почта / Мессенджеры',
  'ИБ / сертификаты',
  'Файлы / каталоги',
  'Бизнес-системы',
  'Базы данных',
  'Рабочие места / ПО',
  'Проекты / процессы',
  'Прочее'
];

const normalizeMetricText = (value) => safeString(value)
  .toLowerCase()
  .replace(/ё/g, 'е')
  .replace(/[^а-яa-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const normalizeMetricDomain = (explicitDomain, text) => {
  const domain = normalizeMetricText(explicitDomain);
  const source = normalizeMetricText(`${explicitDomain || ''} ${text || ''}`);
  if (source.includes('citrix') || source.includes('цитрикс') || source.includes('ферм')) return 'Citrix / фермы';
  if (source.includes('скрипт') || source.includes('powershell') || source.includes('ps ') || source.includes('автоматизац') || source.includes('шаблон')) return 'Скрипты / автоматизация';
  if (source.includes('2fa') || source.includes('otp') || source.includes('двухфактор') || source.includes('аутентификац')) return '2FA';
  if (source.includes('zabbix') || source.includes('заббикс') || source.includes('мониторинг') || source.includes('триггер') || source.includes('trigger')) return 'Zabbix / мониторинг';
  if (source.includes('lotus') || source.includes('лотус') || source.includes('notes')) return 'Работы по Лотус';
  if (source.includes('idm') || source.includes('роль') || source.includes('роли') || source.includes('доступ') || source.includes('учетн') || source.includes('парол')) return 'IDM';
  if (source.includes('принтер') || source.includes('печать') || source.includes('скан')) return 'Принтера';
  if (source.includes('почт') || source.includes('email') || source.includes('mail') || source.includes('рассылк') || source.includes('мессендж') || source.includes('messenger')) return 'Почта / Мессенджеры';
  if (source.includes('сертификат') || source.includes('крипт') || source.includes('безопасност') || source.includes('иб ')) return 'ИБ / сертификаты';
  if (source.includes('папк') || source.includes('файл') || source.includes('шар') || source.includes('каталог')) return 'Файлы / каталоги';
  if (source.includes('терминал') || source.includes('rds') || source.includes('remote') || source.includes('цб ')) return 'Терминалы / Серверы';
  if (source.includes('binkd') || source.includes('бинк') || source.includes('vpn') || source.includes('сеть') || source.includes('сетев') || source.includes('маршрут') || source.includes('wi fi') || source.includes('wifi')) return 'Сеть / BinkD';
  if (source.includes('фин') || source.includes('финист') || source.includes('кредит') || source.includes('юл ') || source.includes('фл ')) return 'Бизнес-системы';
  if (source.includes('бд ') || source.includes('база') || source.includes('oracle') || source.includes('sql')) return 'Базы данных';
  if (source.includes('сервер') || source.includes('host') || source.includes('vm') || source.includes('виртуал')) return 'Виртуализация / серверы';
  if (source.includes('ос ') || source.includes('windows') || source.includes('рабоч') || source.includes('арм') || source.includes('по ')) return 'Рабочие места / ПО';
  if (source.includes('миграц') || source.includes('проект') || source.includes('внедр') || source.includes('регламент') || source.includes('процесс')) return 'Проекты / процессы';
  if (domain.includes('сеть') || domain.includes('vpn')) return 'Сеть / BinkD';
  if (domain.includes('citrix') || domain.includes('цитрикс') || domain.includes('ферм')) return 'Citrix / фермы';
  if (domain.includes('скрипт') || domain.includes('автоматизац')) return 'Скрипты / автоматизация';
  if (domain.includes('zabbix') || domain.includes('заббикс') || domain.includes('мониторинг')) return 'Zabbix / мониторинг';
  if (domain.includes('2fa') || domain.includes('otp') || domain.includes('аутентификац')) return '2FA';
  if (domain.includes('терминал') || domain.includes('rds')) return 'Терминалы / Серверы';
  if (domain.includes('lotus') || domain.includes('лотус')) return 'Работы по Лотус';
  if (domain.includes('idm') || domain.includes('доступ')) return 'IDM';
  if (domain.includes('печать') || domain.includes('принтер')) return 'Принтера';
  if (domain.includes('почт') || domain.includes('мессендж')) return 'Почта / Мессенджеры';
  return safeString(explicitDomain).trim() || (domain ? safeString(explicitDomain).trim() : 'Прочее');
};

const inferTaskDomain = (task = {}) => {
  const text = normalizeMetricText(`${task.title || ''} ${task.summary || ''} ${task.comments || ''} ${task.comment || ''} ${task.tags || ''} ${task.workType || ''}`);
  const explicitDomain = safeString(task.domain || task.competenceDomain || task.serviceDomain || task.system || task.application).trim();
  return normalizeMetricDomain(explicitDomain, text);
};

const getMetricTaskSize = (task = {}) => normalizeTaskSize(task.size || task.complexity || task.name || task.tshirt || task.tShirt) || 'M';
const getMetricTaskWeight = (task = {}) => TEAM_METRIC_SIZE_WEIGHTS[getMetricTaskSize(task)] || TEAM_METRIC_SIZE_WEIGHTS.M;
const isMetricImpactTask = (task = {}) => {
  const priority = safeString(task.priority || task.importance || task.impact || task.type).toLowerCase();
  const valueCategory = safeString(task.valueCategory || task.category).toLowerCase();
  return priority === 'impact' || priority.includes('важ') || priority.includes('important') || valueCategory === 'business';
};

const getMetricTaskId = (task = {}, index = 0) => {
  const id = safeString(task.id || task.key || task.issueKey || task.taskId).trim();
  if (id) return id.toUpperCase();
  return normalizeMetricText(`${task.assignee || task.executor || task.owner || 'unknown'}-${task.title || task.summary || 'task'}-${task.created || task.resolved || index}`).slice(0, 120);
};

const createMetricRow = (name) => ({
  name,
  totalTasks: 0,
  totalWeight: 0,
  impactTasks: 0,
  sizes: { S: 0, M: 0, L: 0, XL: 0 },
  domainScores: {},
  taskIds: {},
  taskDetails: {},
  updatedAt: new Date().toISOString()
});

const createMetricTaskDetail = (task = {}, index = 0) => {
  const size = getMetricTaskSize(task);
  const id = getMetricTaskId(task, index);
  const domain = inferTaskDomain(task);
  return {
    id,
    title: safeString(task.title || task.summary || task.name || id).trim(),
    assignee: getFullName(task.assignee || task.executor || task.owner || task.responsible || task['Исполнитель'] || task['Ответственный']),
    domain,
    originalDomain: domain,
    size,
    originalSize: size,
    weight: TEAM_METRIC_SIZE_WEIGHTS[size] || TEAM_METRIC_SIZE_WEIGHTS.M,
    impact: isMetricImpactTask(task),
    manualSize: false,
    manualDomain: false,
    updatedAt: new Date().toISOString()
  };
};

const mergeTasksIntoTeamMetrics = (memory = {}, tasks = []) => {
  const next = JSON.parse(JSON.stringify(memory || {}));
  let added = 0;
  let skipped = 0;
  const updatedEmployees = new Set();

  (Array.isArray(tasks) ? tasks : []).forEach((task, index) => {
    const rawAssignee = safeString(task.assignee || task.executor || task.owner || task.responsible || task['Исполнитель'] || task['Ответственный']).trim();
    if (!rawAssignee) { skipped += 1; return; }
    const fullName = getFullName(rawAssignee);
    if (!fullName || fullName === 'Неизвестно' || fullName === TEAM_LEAD_NAME || isExcludedUser(rawAssignee)) { skipped += 1; return; }
    const taskId = getMetricTaskId(task, index);
    if (!next[fullName]) next[fullName] = createMetricRow(fullName);
    next[fullName].taskDetails = { ...(next[fullName].taskDetails || {}) };
    if (next[fullName].taskIds?.[taskId]) {
      if (!next[fullName].taskDetails[taskId]) {
        next[fullName].taskDetails[taskId] = createMetricTaskDetail(task, index);
        next[fullName].updatedAt = new Date().toISOString();
      }
      skipped += 1;
      return;
    }

    const size = getMetricTaskSize(task);
    const weight = getMetricTaskWeight(task);
    const domain = inferTaskDomain(task);
    next[fullName].name = fullName;
    next[fullName].totalTasks = (Number(next[fullName].totalTasks) || 0) + 1;
    next[fullName].totalWeight = (Number(next[fullName].totalWeight) || 0) + weight;
    next[fullName].impactTasks = (Number(next[fullName].impactTasks) || 0) + (isMetricImpactTask(task) ? 1 : 0);
    next[fullName].sizes = { S: 0, M: 0, L: 0, XL: 0, ...(next[fullName].sizes || {}) };
    next[fullName].sizes[size] = (Number(next[fullName].sizes[size]) || 0) + 1;
    next[fullName].domainScores = { ...(next[fullName].domainScores || {}) };
    next[fullName].domainScores[domain] = (Number(next[fullName].domainScores[domain]) || 0) + weight;
    next[fullName].taskIds = { ...(next[fullName].taskIds || {}), [taskId]: true };
    next[fullName].taskDetails[taskId] = createMetricTaskDetail(task, index);
    next[fullName].updatedAt = new Date().toISOString();
    updatedEmployees.add(fullName);
    added += 1;
  });

  return { memory: next, stats: { added, skipped, employees: updatedEmployees.size } };
};

const buildTeamMetricRows = (memory = {}) => {
  const baseRows = Object.values(memory || {}).filter(row => !isExcludedUser(row.name)).map(row => {
  const taskDetails = Object.values(row.taskDetails || {}).filter(task => task && task.id);
  const aggregateTasks = Number(row.totalTasks) || 0;
  const canUseDetails = taskDetails.length > 0 && taskDetails.length >= aggregateTasks;
  const sizes = canUseDetails
    ? taskDetails.reduce((acc, task) => {
        const size = normalizeTaskSize(task.size) || 'M';
        acc[size] = (Number(acc[size]) || 0) + 1;
        return acc;
      }, { S: 0, M: 0, L: 0, XL: 0 })
    : { S: 0, M: 0, L: 0, XL: 0, ...(row.sizes || {}) };
  const totalTasks = canUseDetails ? taskDetails.length : aggregateTasks;
  const totalWeight = canUseDetails
    ? taskDetails.reduce((sum, task) => sum + (TEAM_METRIC_SIZE_WEIGHTS[normalizeTaskSize(task.size) || 'M'] || TEAM_METRIC_SIZE_WEIGHTS.M), 0)
    : (Number(row.totalWeight) || 0);
  const impactTasks = canUseDetails ? taskDetails.filter(task => task.impact).length : (Number(row.impactTasks) || 0);
  const impactShare = totalTasks > 0 ? Math.round((impactTasks / totalTasks) * 100) : 0;
  const heavyWeight = (Number(sizes.L) || 0) * TEAM_METRIC_SIZE_WEIGHTS.L + (Number(sizes.XL) || 0) * TEAM_METRIC_SIZE_WEIGHTS.XL;
  const heavyWeightShare = totalWeight > 0 ? Math.round((heavyWeight / totalWeight) * 100) : 0;
  const domainScores = canUseDetails
    ? taskDetails.reduce((acc, task) => {
        const domain = normalizeMetricDomain(task.domain || 'Прочее', task.title || '') || 'Прочее';
        const size = normalizeTaskSize(task.size) || 'M';
        acc[domain] = (Number(acc[domain]) || 0) + (TEAM_METRIC_SIZE_WEIGHTS[size] || TEAM_METRIC_SIZE_WEIGHTS.M);
        return acc;
      }, {})
    : Object.entries(row.domainScores || {}).reduce((acc, [domain, score]) => {
        const normalizedDomain = normalizeMetricDomain(domain, '') || 'Прочее';
        acc[normalizedDomain] = (Number(acc[normalizedDomain]) || 0) + (Number(score) || 0);
        return acc;
      }, {});
  const topDomains = Object.entries(domainScores)
    .filter(([domain]) => safeString(domain) !== 'Прочее')
    .sort((a, b) => (Number(b[1]) || 0) - (Number(a[1]) || 0));
  return {
    ...row,
    name: row.name || 'Неизвестно',
    totalTasks,
    totalWeight,
    impactTasks,
    impactShare,
    heavyWeightShare,
    sizes,
    topDomains,
    taskDetails,
    taskDetailsReady: canUseDetails,
    isGrowth: false
  };
  });

  const maxWeight = Math.max(1, ...baseRows.map(row => row.totalWeight));
  return baseRows.map(row => {
    const volumeShare = Math.round((row.totalWeight / maxWeight) * 100);
    const rawIndex = Math.round((volumeShare * 0.45) + (row.heavyWeightShare * 0.30) + (row.impactShare * 0.25));
    const contributionIndex = row.totalTasks < 15 ? Math.min(rawIndex, 55) : row.totalTasks < 40 ? Math.min(rawIndex, 68) : rawIndex;
    return {
      ...row,
      volumeShare,
      contributionIndex,
      isGrowth: contributionIndex >= 80 && row.impactShare >= 30 && row.heavyWeightShare >= 40 && row.totalWeight >= 250
    };
  }).sort((a, b) => b.contributionIndex - a.contributionIndex || b.totalWeight - a.totalWeight);
};

const buildDomainRankMap = (rows = []) => rows.reduce((acc, row) => {
  (row.topDomains || []).forEach(([domain, score]) => {
    if (!acc[domain]) acc[domain] = [];
    acc[domain].push({ name: row.name, score: Number(score) || 0 });
  });
  return acc;
}, {});

const getDomainRank = (domainRankMap, domain, name) => {
  const ranked = [...(domainRankMap?.[domain] || [])].sort((a, b) => b.score - a.score);
  const idx = ranked.findIndex(item => item.name === name);
  return idx >= 0 ? idx + 1 : 999;
};

const getExpertiseBadge = (score, rank = 999, share = 0) => {
  const value = Number(score) || 0;
  if (value > 50 && rank === 1 && share >= 20) return { label: 'Эксперт домена', icon: '👑', color: '#a16207', bg: '#fef3c7', border: '#facc15' };
  if (value >= 15 || rank <= 3) return { label: 'Ведущий специалист', icon: '', color: '#0369a1', bg: '#e0f2fe', border: '#7dd3fc' };
  return { label: 'Накопление экспертизы', icon: '', color: '#475569', bg: '#f8fafc', border: '#cbd5e1' };
};

const parseHistoryCsv = (text) => {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  const source = safeString(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    const next = source[i + 1];
    if (char === '"' && quoted && next === '"') { cell += '"'; i += 1; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if ((char === ',' || char === ';' || char === '\t') && !quoted) { row.push(cell.trim()); cell = ''; continue; }
    if (char === '\n' && !quoted) { row.push(cell.trim()); rows.push(row); row = []; cell = ''; continue; }
    cell += char;
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  if (rows.length < 2) return [];
  const headers = rows[0].map(h => normalizeMetricText(h));
  const pick = (record, names) => {
    const idx = headers.findIndex(header => names.some(name => header.includes(name)));
    return idx >= 0 ? record[idx] : '';
  };
  return rows.slice(1).filter(record => record.some(Boolean)).map((record, index) => ({
    id: pick(record, ['id', 'key', 'ключ', 'номер']) || `CSV-${index + 1}`,
    title: pick(record, ['тема', 'summary', 'title', 'название', 'задач']),
    assignee: pick(record, ['исполнитель', 'assignee', 'executor', 'ответствен']),
    domain: pick(record, ['домен', 'domain', 'system', 'систем', 'направлен']),
    size: pick(record, ['размер', 'size', 'complexity', 'сложност']),
    priority: pick(record, ['важност', 'priority', 'impact', 'приоритет']),
    valueCategory: pick(record, ['valuecategory', 'ценност', 'категор'])
  }));
};

const parseHistoryInputToTasks = (text) => {
  const source = safeString(text).trim();
  if (!source) return [];
  try {
    const parsed = JSON.parse(source);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.detailedTasks)) return parsed.detailedTasks;
    if (Array.isArray(parsed.tasks)) return parsed.tasks;
  } catch (e) {}
  return parseHistoryCsv(source);
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
  resourceAudit: "",
  incidentsClosed: 0, incidentsQueue: 0, sprintPlanned: 0, sprintCompleted: 0, sprintCarriedOver: 0,
  urgentCompleted: 0, urgentQueue: 0, backlog: 0, backlogOld30: 0, backlogCompleted: 0,
  mainWin: "", thanks: "", sprintWin: "", sprintRisk: "", shieldHero: "", blockersAndWaste: "Ожидание данных аналитики...",
  topIncidents: [], slaMetrics: [], slaBreachDetails: [], topPerformers: [], taskPerformers: [], taskComplexity: [], taskTypesDistribution: [], staleBacklog: [], telephonyData: [], telephonyInsight: ""
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

const PulseDashboard = ({ weekData, historyKeys, weeksHistory, selectedWeekKey, onWeekSelect, csatReviews, aiTaskMemory, setAiTaskMemory, projectTasks, tasksArchive }) => {
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

  const isClosedTask = (task) => task && (task.status === 'Закрыт' || task.status === 'Готово' || task.status === 'Resolved' || task.status === 'Завершен' || task.resolved);
  const getTaskSize = (task) => {
    const taskId = safeString(task?.id).trim();
    const memorySize = taskId ? aiTaskMemory?.[taskId]?.complexity : null;
    return normalizeTaskSize(memorySize || task?.size || task?.complexity || task?.name);
  };
  const closedDetailedTasks = (weekData.detailedTasks || []).filter(isClosedTask);
  const hasDetailedSizingForPulse = closedDetailedTasks.some(task => getTaskSize(task));
  const defaultSizeDescriptions = {
    S: 'Быстрые точечные задачи: короткие настройки, хосты, доступы и типовая эксплуатация.',
    M: 'Средние задачи с несколькими шагами: доступы, рабочие места, уточнение параметров и координация.',
    L: 'Крупные прикладные и инфраструктурные работы: обновления ОС, серверы, DNS, сеть и терминальная среда.',
    XL: 'Очень сложные задачи и старый технический долг: миграции, мониторинг, регламенты, модернизация и долгие хвосты.'
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
     return !isTeamLead && !isThirdLine && !isUnknown && !isLiterallyUnknown && !isExcludedUser(p.name);
  });

  let filteredTaskPerformers = (weekData.taskPerformers || []).filter(p => {
     const fName = getFullName(p.name);
     const isTeamLead = p.name === TEAM_LEAD_ID || fName === TEAM_LEAD_NAME || String(p.name).includes('Виктор');
     const isUnknown = fName === p.name && !Object.keys(USER_DICTIONARY).includes(p.name.toLowerCase());
     const isLiterallyUnknown = String(p.name).toLowerCase() === 'неизвестно' || fName.toLowerCase() === 'неизвестно';
     return !isTeamLead && !isUnknown && !isLiterallyUnknown && !isExcludedUser(p.name);
  });

  const normalizeAnalysisText = (value) => safeString(value)
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^а-яa-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const getMeaningfulTokens = (value) => {
    const stopWords = new Set([
      'задача', 'задачи', 'работа', 'работы', 'через', 'после', 'перед', 'нужно', 'надо', 'если', 'или', 'для', 'при', 'это', 'как', 'что',
      'систем', 'проблем', 'инцидент', 'поручение', 'организовать', 'организация', 'обмен', 'информация', 'информацией', 'рабочими', 'местами',
      'пользователь', 'пользователи', 'филиал', 'филиалы', 'сбор', 'собрать', 'обсудить', 'контроль', 'контролировать'
    ]);
    return normalizeAnalysisText(value)
      .split(' ')
      .filter(token => token.length >= 4 && !stopWords.has(token))
      .map(token => token.slice(0, 6));
  };

  const getTaskSearchText = (task) => normalizeAnalysisText(`${task?.id || ''} ${task?.title || ''} ${task?.comments || ''} ${task?.comment || ''} ${task?.tags || ''} ${task?.valueCategory || ''}`);

  const getTaskDomain = (task) => {
    const explicitDomain = safeString(task?.domain || task?.competenceDomain || task?.serviceDomain).trim();
    const text = normalizeAnalysisText(`${task?.title || ''} ${task?.comments || ''} ${task?.tags || ''} ${task?.workType || ''}`);
    return normalizeMetricDomain(explicitDomain, text);
  };

  const isTeamOwnedTask = (task) => {
    const assignee = safeString(task?.assignee).trim();
    if (!assignee) return false;
    const fullName = getFullName(assignee);
    return isKnownTeamMember(assignee) && fullName !== TEAM_LEAD_NAME && !isExcludedUser(assignee);
  };

  const getIncidentDomain = (incident) => getTaskDomain({
    title: incident?.name,
    comments: `${incident?.analysis || ''} ${incident?.recommendedAction || ''} ${incident?.rootCause || ''}`,
    domain: incident?.domain
  });

  const isDomainMatch = (incidentDomain, taskDomain) => {
    if (!incidentDomain || incidentDomain === 'Прочее') return true;
    if (incidentDomain === taskDomain) return true;
    const related = {
      'Сеть / BinkD': ['Терминалы / Серверы', 'Виртуализация / серверы'],
      'Терминалы / Серверы': ['Сеть / BinkD', 'Виртуализация / серверы'],
      'Виртуализация / серверы': ['Сеть / BinkD', 'Терминалы / Серверы'],
      'IDM': ['Проекты / процессы'],
      '2FA': ['Проекты / процессы'],
      'Zabbix / мониторинг': ['Виртуализация / серверы', 'Сеть / BinkD'],
      'Проекты / процессы': ['IDM']
    };
    return (related[incidentDomain] || []).includes(taskDomain);
  };

  const isActionableResolutionTask = (task) => {
    const text = normalizeAnalysisText(`${task?.title || ''} ${task?.comments || ''} ${task?.comment || ''}`);
    const weakProcessWords = ['организовать обмен', 'обмен информацией', 'сбор информации', 'собрать информацию', 'обсудить', 'совещание', 'контроль проблем', 'мониторинг проблем'];
    if (weakProcessWords.some(pattern => text.includes(pattern))) return false;
    const actionWords = ['настро', 'исправ', 'устран', 'обнов', 'перенастро', 'созда', 'выда', 'добав', 'удал', 'замен', 'перев', 'восстанов', 'продл', 'подключ', 'перезап', 'миграц'];
    return actionWords.some(token => text.includes(token));
  };

  const getTaskMatchScore = (task, tokens, incidentDomain, incidentName) => {
    const taskText = getTaskSearchText(task);
    const tokenScore = tokens.filter(token => taskText.includes(token)).length;
    const domainScore = isDomainMatch(incidentDomain, getTaskDomain(task)) ? 3 : 0;
    const feedback = getSolutionFeedback(task.id, incidentName);
    const feedbackScore = feedback === 'helpful' ? 5 : (feedback === 'miss' ? -5 : 0);
    return tokenScore + domainScore + feedbackScore;
  };

  const hasStrongTaskMatch = (task, tokens, incidentDomain, incidentName) => {
    const taskText = getTaskSearchText(task);
    const matchedTokenCount = tokens.filter(token => taskText.includes(token)).length;
    const feedback = getSolutionFeedback(task.id, incidentName);
    return isDomainMatch(incidentDomain, getTaskDomain(task))
      && isActionableResolutionTask(task)
      && (feedback === 'helpful' || matchedTokenCount >= 2 || getTaskMatchScore(task, tokens, incidentDomain, incidentName) >= 6);
  };

  const getSolutionFeedbackKey = (incidentName) => normalizeAnalysisText(incidentName).slice(0, 80) || 'general';
  const getSolutionFeedback = (taskId, incidentName) => {
    const entry = taskId ? aiTaskMemory?.[taskId] : null;
    return entry?.solutionFeedback?.[getSolutionFeedbackKey(incidentName)] || '';
  };
  const handleSolutionFeedback = (task, incidentName, verdict) => {
    const taskId = safeString(task?.id).trim();
    if (!taskId || !setAiTaskMemory) return;
    const feedbackKey = getSolutionFeedbackKey(incidentName);
    setAiTaskMemory(prev => {
      const previous = (prev || {})[taskId] || {};
      return {
        ...(prev || {}),
        [taskId]: {
          ...previous,
          id: taskId,
          title: previous.title || safeString(task?.title),
          solutionFeedback: {
            ...(previous.solutionFeedback || {}),
            [feedbackKey]: verdict
          },
          updatedAt: new Date().toISOString()
        }
      };
    });
  };

  const normalizePersonForMatch = (name) => normalizeAnalysisText(getFullName(name)).split(' ').filter(part => part.length > 1);
  const isSamePersonForPulse = (leftName, rightName) => {
    const leftTokens = normalizePersonForMatch(leftName);
    const rightTokens = normalizePersonForMatch(rightName);
    if (leftTokens.length === 0 || rightTokens.length === 0) return false;
    return rightTokens.every(token => leftTokens.includes(token));
  };

  const parseDurationToSeconds = (value) => {
    const parts = safeString(value).match(/\d+/g);
    if (!parts || parts.length === 0) return 0;
    const [hours = 0, minutes = 0, seconds = 0] = parts.map(Number);
    if (parts.length === 1) return Number(parts[0]) || 0;
    if (parts.length === 2) return ((Number(hours) || 0) * 60) + (Number(minutes) || 0);
    return ((Number(hours) || 0) * 3600) + ((Number(minutes) || 0) * 60) + (Number(seconds) || 0);
  };

  const formatDurationShort = (seconds) => {
    const value = Number(seconds) || 0;
    if (value <= 0) return '-';
    const minutes = Math.floor(value / 60);
    const restSeconds = value % 60;
    if (minutes <= 0) return `${restSeconds}с`;
    return `${minutes}м ${String(restSeconds).padStart(2, '0')}с`;
  };

  const FIRST_LINE_PULSE_NAMES = ['Халеддинов Руслан', 'Руслан Халеддинов', 'Никита Лысов', 'Максим Отрошко', 'Максим Гуртов', 'Марк Соколов'];
  const isFirstLinePulseOperator = (name) => FIRST_LINE_PULSE_NAMES.some(target => isSamePersonForPulse(name, target));
  const visiblePulseTelephony = (weekData.telephonyData || []).filter(row => isFirstLinePulseOperator(row.name));
  const pulseTalkDurations = visiblePulseTelephony.map(row => parseDurationToSeconds(row.avgTalk)).filter(Boolean);
  const pulseAvgTalk = pulseTalkDurations.length > 0 ? Math.round(pulseTalkDurations.reduce((sum, value) => sum + value, 0) / pulseTalkDurations.length) : 0;
  const findPulseIncidentPerformer = (operatorName) => filteredTopPerformers.find(p => isSamePersonForPulse(p.name, operatorName));
  const firstLineControlRows = visiblePulseTelephony.map(row => {
    const perf = findPulseIncidentPerformer(row.name);
    const closed = perf ? (Number(perf.closed) || 0) : 0;
    const answered = Number(row.answered) || 0;
    const total = Number(row.total) || 0;
    const missed = Number(row.missed) || 0;
    const availability = total > 0 ? Math.round(((total - missed) / total) * 100) : 100;
    const avgTalk = parseDurationToSeconds(row.avgTalk);
    const talkDiffPct = pulseAvgTalk > 0 && avgTalk > 0 ? Math.round(((avgTalk - pulseAvgTalk) / pulseAvgTalk) * 100) : 0;
    const jiraPerCall = answered > 0 ? Number((closed / answered).toFixed(1)) : 0;
    const explicitFirstLineSolved = perf && perf.firstLineSolved !== undefined ? Number(perf.firstLineSolved) || 0 : null;
    const explicitHandoff = perf && perf.handoffCount !== undefined ? Number(perf.handoffCount) || 0 : null;
    const dispatchGap = explicitHandoff !== null ? explicitHandoff : Math.max(answered - closed, 0);
    const footballRate = answered > 0 ? Math.round((dispatchGap / answered) * 100) : 0;
    const fcrBase = explicitFirstLineSolved !== null ? explicitFirstLineSolved : Math.min(closed, answered);
    const fcrProxy = answered > 0 ? Math.min(100, Math.round((fcrBase / answered) * 100)) : 0;
    const avgResolveMin = perf ? (Number(perf.avgTimeMin) || 0) : 0;
    const riskLevel = (missed >= 10 || availability < 75) ? 'risk' : ((missed > 0 || availability < 90 || footballRate >= 60) ? 'watch' : 'ok');
    let label = 'Норма';
    let note = 'Линия и Jira выглядят сбалансированно.';
    if (riskLevel === 'risk') {
      label = 'Риск KPI линии';
      note = `Доступность ${availability}%, пропущено ${missed}. Проверить смену, АТС и фактическое участие.`;
    } else if (footballRate >= 60 && answered >= 10) {
      label = 'Диспетчеризация';
      note = `Много принятых звонков без личного закрытия: прокси передачи дальше ${footballRate}%.`;
    } else if (closed >= 45 && avgResolveMin >= 15) {
      label = 'Решатель';
      note = `Закрытия выглядят содержательными: ${closed} инцидентов, среднее решение ${avgResolveMin} мин.`;
    } else if (talkDiffPct <= -30 && closed >= 40) {
      label = 'Проверить простые';
      note = `Разговоры короче среднего линии на ${Math.abs(talkDiffPct)}%, проверить долю легких закрытий.`;
    }
    return { row, perf, closed, answered, total, missed, availability, avgTalk, talkDiffPct, jiraPerCall, footballRate, fcrProxy, label, note, riskLevel };
  });

  const incidentResolutionLinks = sortedIncidents.slice(0, 5).map(incident => {
    const tokens = getMeaningfulTokens(`${incident.name} ${incident.analysis || ''}`);
    const incidentDomain = getIncidentDomain(incident);
    const matchedTasks = closedDetailedTasks.filter(task => {
      return isTeamOwnedTask(task)
        && tokens.length > 0
        && hasStrongTaskMatch(task, tokens, incidentDomain, incident.name);
    }).sort((a, b) => getTaskMatchScore(b, tokens, incidentDomain, incident.name) - getTaskMatchScore(a, tokens, incidentDomain, incident.name)).slice(0, 4);
    const matchedProjectTasks = (projectTasks || [])
      .filter(task => tokens.length > 0 && hasStrongTaskMatch(task, tokens, incidentDomain, incident.name))
      .slice(0, 3);
    const solutionHints = (tasksArchive || [])
      .filter(task => {
        const taskText = getTaskSearchText(task);
        const taskId = safeString(task.id);
        const isCurrentMatch = matchedTasks.some(matched => safeString(matched.id) === taskId);
        const feedback = getSolutionFeedback(task.id, incident.name);
        return isTeamOwnedTask(task)
          && tokens.length > 0
          && !isCurrentMatch
          && feedback !== 'miss'
          && hasStrongTaskMatch(task, tokens, incidentDomain, incident.name);
      })
      .sort((a, b) => getTaskMatchScore(b, tokens, incidentDomain, incident.name) - getTaskMatchScore(a, tokens, incidentDomain, incident.name))
      .slice(0, 3);
    const status = matchedTasks.length > 0 ? 'covered' : (matchedProjectTasks.length > 0 ? 'planned' : 'gap');
    return { incident, tokens, incidentDomain, matchedTasks, matchedProjectTasks, solutionHints, status };
  });

  const skillMatrixRows = Object.values(closedDetailedTasks.reduce((acc, task) => {
    const assignee = getFullName(task.assignee);
    if (!assignee || assignee === 'Неизвестно' || assignee === TEAM_LEAD_NAME || isExcludedUser(task.assignee)) return acc;
    if (!acc[assignee]) {
      acc[assignee] = { assignee, total: 0, sizes: { S: 0, M: 0, L: 0, XL: 0 }, categories: {}, domains: {}, domainTasks: {}, heavy: 0, samples: [] };
    }
    const size = getTaskSize(task) || 'M';
    const category = safeString(task.valueCategory || task.category || 'standard') || 'standard';
    const domain = getTaskDomain(task);
    acc[assignee].total += 1;
    acc[assignee].sizes[size] = (acc[assignee].sizes[size] || 0) + 1;
    acc[assignee].categories[category] = (acc[assignee].categories[category] || 0) + 1;
    acc[assignee].domains[domain] = (acc[assignee].domains[domain] || 0) + 1;
    acc[assignee].domainTasks[domain] = acc[assignee].domainTasks[domain] || [];
    acc[assignee].domainTasks[domain].push(task);
    if (acc[assignee].samples.length < 5) acc[assignee].samples.push(task);
    if (['L', 'XL'].includes(size)) acc[assignee].heavy += 1;
    return acc;
  }, {})).map(row => {
    const topCategory = Object.entries(row.categories).sort((a, b) => b[1] - a[1])[0]?.[0] || 'standard';
    const topSize = Object.entries(row.sizes).sort((a, b) => b[1] - a[1])[0]?.[0] || 'M';
    const topDomains = Object.entries(row.domains).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const heavyShare = row.total > 0 ? Math.round((row.heavy / row.total) * 100) : 0;
    const confidence = row.total >= 5 ? 'устойчиво' : (row.total >= 3 ? 'средне' : 'мало данных');
    let profile = 'Универсал';
    if (heavyShare >= 45) profile = 'Тяжелые задачи';
    else if (topCategory === 'stability') profile = 'Стабильность';
    else if (topCategory === 'optimization') profile = 'Оптимизация';
    else if (topCategory === 'business') profile = 'Бизнес-проекты';
    else if (topSize === 'S') profile = 'Быстрая рутина';
    const keyTasks = [...row.samples]
      .sort((a, b) => {
        const sizeRank = { XL: 4, L: 3, M: 2, S: 1 };
        return (sizeRank[getTaskSize(b)] || 0) - (sizeRank[getTaskSize(a)] || 0);
      })
      .slice(0, 3);
    return { ...row, topCategory, topSize, topDomains, heavyShare, confidence, profile, keyTasks };
  }).sort((a, b) => b.total - a.total);

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

      {firstLineControlRows.length > 0 && (
        <div className="space-y-4 mb-8">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-lg font-medium text-white flex items-center gap-2"><PhoneCall size={20} className="text-sky-400" /> Пульс первой линии</h2>
                  <p className="text-xs text-slate-500 mt-1">Телефония + Jira. Решение на 1Л и передачи дальше считаются как прокси, пока нет связки звонок {'->'} IS.</p>
                </div>
                <span className="text-xs text-slate-400 bg-slate-900/80 px-2 py-1.5 rounded border border-slate-700/50">Средний разговор: {formatDurationShort(pulseAvgTalk)}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {firstLineControlRows.map(item => (
                  <div key={item.row.name} className={`rounded-lg border p-4 ${item.riskLevel === 'risk' ? 'bg-red-500/5 border-red-500/25' : item.riskLevel === 'watch' ? 'bg-amber-500/5 border-amber-500/25' : 'bg-slate-900/50 border-slate-700/50'}`}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="font-bold text-slate-100">{item.row.name}</div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${item.riskLevel === 'risk' ? 'bg-red-500/10 text-red-300 border-red-500/30' : item.riskLevel === 'watch' ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'}`}>{item.label}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-slate-950/60 rounded border border-slate-700/50 p-2.5 min-h-[58px]"><div className="text-[10px] text-slate-500 uppercase font-bold leading-none mb-1">Jira</div><div className="text-white font-black text-lg leading-tight">{item.closed}</div></div>
                      <div className="bg-slate-950/60 rounded border border-slate-700/50 p-2.5 min-h-[58px]"><div className="text-[10px] text-slate-500 uppercase font-bold leading-none mb-1">Принято</div><div className="text-white font-black text-lg leading-tight">{item.answered}</div><div className="text-[10px] text-slate-500 mt-1">из {item.total} всего</div></div>
                      <div className="bg-slate-950/60 rounded border border-slate-700/50 p-2.5 min-h-[58px]"><div className="text-[10px] text-slate-500 uppercase font-bold leading-none mb-1">Решено 1Л*</div><div className="text-sky-300 font-black text-lg leading-tight">{item.fcrProxy}%</div></div>
                      <div className="bg-slate-950/60 rounded border border-slate-700/50 p-2.5 min-h-[58px]"><div className="text-[10px] text-slate-500 uppercase font-bold leading-none mb-1">Передано*</div><div className={`${item.footballRate >= 60 ? 'text-red-300' : 'text-slate-200'} font-black text-lg leading-tight`}>{item.footballRate}%</div></div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <span className="text-[10px] bg-slate-950/70 border border-slate-700 text-slate-300 px-2 py-0.5 rounded-full">доступность {item.availability}%</span>
                      <span className="text-[10px] bg-slate-950/70 border border-slate-700 text-slate-300 px-2 py-0.5 rounded-full">разговор {formatDurationShort(item.avgTalk)}</span>
                      <span className="text-[10px] bg-slate-950/70 border border-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{item.jiraPerCall} Jira/звонок</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{item.note}</p>
                  </div>
                ))}
              </div>
          </div>
        </div>
      )}

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

      {/* ТРУДОЕМКОСТЬ СПРИНТА И ТИПЫ РАБОТ */}
      {(weekData.taskComplexity?.length > 0 || hasDetailedSizingForPulse || weekData.sprintWin || weekData.sprintRisk || weekData.shieldHero || weekData.taskTypesDistribution?.length > 0) && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50 shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4">
          
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
            <div className="xl:col-span-2">
              {(weekData.taskComplexity?.length > 0 || hasDetailedSizingForPulse) && (
                <>
                  <h2 className="text-lg font-medium text-white mb-5 flex items-center gap-2"><Layers size={20} className="text-indigo-400" /> Трудоемкость выполненных задач</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {['S', 'M', 'L', 'XL'].map((size) => {
                      // ЗАЩИТА ОТ ГАЛЛЮЦИНАЦИЙ ИИ: проверяем оба ключа (size и name)
                      const taskInfo = (weekData.taskComplexity || []).find(t => normalizeTaskSize(t.size || t.name) === size);
                      const tasksOfSize = closedDetailedTasks.filter(t => getTaskSize(t) === size);
                      const count = hasDetailedSizingForPulse ? tasksOfSize.length : (taskInfo ? Number(taskInfo.count) : 0);
                      const desc = taskInfo ? safeString(taskInfo.description) : defaultSizeDescriptions[size];
                      
                      return (
                        <div key={size} className={`group relative p-4 rounded-xl border flex flex-col ${count > 0 ? 'bg-slate-900/80 border-slate-700/50 shadow-inner hover:border-indigo-500/50 transition-colors cursor-help' : 'bg-slate-900/30 border-slate-800/50 opacity-50'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <span className={`text-sm font-black px-2.5 py-1 rounded-lg border-2 border-b-4 ${count > 0 ? getSizeColor(size) : 'bg-slate-800 text-slate-600 border-slate-700'}`}>{getTaskSizeLabel(size)}</span>
                            <span className="text-3xl font-bold text-slate-300">{count}</span>
                          </div>
                          <div className="mt-2 text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">{desc}</div>
                          
                          {/* TOOLTIP С ЗАДАЧАМИ ПО РАЗМЕРАМ */}
                          {count > 0 && tasksOfSize.length > 0 && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 pb-3 w-[500px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                              <div className="p-5 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl text-[12px] text-slate-300 text-left relative cursor-auto pointer-events-auto">
                                <div className="font-bold text-white mb-3 border-b border-slate-700 pb-3 text-sm flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded text-[12px] ${getSizeColor(size)} border`}>{getTaskSizeLabel(size)}</span>
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
            <div className={`grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch ${(weekData.taskComplexity?.length > 0 || hasDetailedSizingForPulse) ? 'pt-6 border-t border-slate-700/50' : ''}`}>
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

      {skillMatrixRows.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50 shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-5">
            <div>
              <h2 className="text-lg font-medium text-white flex items-center gap-2"><Users size={20} className="text-cyan-400" /> Матрица компетенций</h2>
              <p className="text-xs text-slate-500 mt-1">T-shape по закрытым задачам недели: категории ценности и доля сложных задач.</p>
            </div>
            <span className="text-xs text-slate-400 bg-slate-900/80 px-2 py-1.5 rounded border border-slate-700/50">На базе detailedTasks</span>
          </div>
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 mb-4 text-xs text-slate-400 leading-relaxed">
            Считается по сохраненным закрытым задачам недели из `detailedTasks`; отдельная память компетенций не ведется. Сложность берется из поля `size` или ручной AI-памяти задач, домены - из поля `domain` или темы/комментария. При 1-2 задачах вывод помечается как `мало данных`.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {skillMatrixRows.slice(0, 9).map(row => (
              <div key={row.assignee} className="group relative bg-slate-900/50 rounded-lg border border-slate-700/50 p-4 hover:border-cyan-500/40 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="font-bold text-slate-100">{row.assignee}</div>
                    <div className="text-xs text-cyan-300 mt-1">{row.profile}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs font-bold text-slate-300 bg-slate-950/70 border border-slate-700 rounded px-2 py-1">{row.total} задач</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full border uppercase font-bold ${row.confidence === 'устойчиво' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : row.confidence === 'средне' ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' : 'bg-slate-700/40 text-slate-400 border-slate-600'}`}>{row.confidence}</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-1.5 mb-3">
                  {['S', 'M', 'L', 'XL'].map(size => (
                    <div key={size} className="bg-slate-950/60 rounded border border-slate-700/50 px-2 py-1 text-center">
                      <div className="text-[9px] text-slate-500 font-bold">{getTaskSizeLabel(size)}</div>
                      <div className="text-sm text-white font-black">{row.sizes[size] || 0}</div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Сложные</span>
                  <span className={row.heavyShare >= 45 ? 'text-orange-300 font-bold' : 'text-slate-300 font-bold'}>{row.heavyShare}%</span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-700/50">
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Домены</div>
                  <div className="space-y-2">
                    {row.topDomains.map(([domain, count]) => (
                      <div key={`${row.assignee}-${domain}`}>
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-cyan-200">{domain}</span>
                          <span className="text-slate-400">{count}</span>
                        </div>
                        <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                          <div className="h-full bg-cyan-500/70" style={{ width: `${Math.max(10, Math.round((count / row.total) * 100))}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {row.keyTasks.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-700/50">
                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Опорные задачи</div>
                    <div className="space-y-1.5">
                      {row.keyTasks.slice(0, 2).map(task => (
                        <div key={`${row.assignee}-${task.id}`} className="text-[11px] text-slate-300 bg-slate-950/50 border border-slate-700/50 rounded px-2 py-1.5 leading-snug">
                          <span className="text-cyan-300 font-bold">{task.id}</span> · {safeString(task.title).slice(0, 90)}{safeString(task.title).length > 90 ? '...' : ''}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="absolute left-1/2 top-full -translate-x-1/2 pt-3 w-[420px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <div className="bg-slate-800 border border-slate-600 rounded-xl shadow-2xl p-4 text-left cursor-auto pointer-events-auto">
                    <div className="text-sm font-bold text-white mb-2">{row.assignee}: расшифровка компетенций</div>
                    <div className="text-xs text-slate-400 leading-relaxed mb-3">
                      Профиль рассчитан по {row.total} закрытым задачам недели. Уверенность: <span className="text-cyan-300 font-bold">{row.confidence}</span>. Домены показывают, с какими типами работ сотрудник реально соприкасался в этой выборке.
                    </div>
                    <div className="space-y-2 max-h-[260px] overflow-y-auto custom-scrollbar pr-1">
                      {row.keyTasks.map(task => (
                        <div key={`tooltip-${row.assignee}-${task.id}`} className="bg-slate-900/70 border border-slate-700 rounded-lg p-3">
                          <div className="flex justify-between gap-2 mb-1">
                            <span className="text-cyan-300 font-bold text-xs">{task.id}</span>
                            <span className="text-[10px] text-slate-400">{getTaskSize(task) || 'M'} · {getTaskDomain(task)}</span>
                          </div>
                          <div className="text-xs text-slate-200 leading-snug">{safeString(task.title)}</div>
                          {safeString(task.comments).trim().length > 20 && (
                            <div className="text-[11px] text-slate-500 mt-1 leading-snug">{safeString(task.comments).slice(0, 160)}{safeString(task.comments).length > 160 ? '...' : ''}</div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-600"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
              <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2"><Activity size={16} className="text-blue-400"/> Расчетная модель недельного объема</h3>
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
            <p className="text-[10px] text-slate-500 mt-2">Не дневная Jira-статистика: распределение расчетное, только для оценки баланса план/бэклог/срочная.</p>
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

const FillWeekForm = ({ historyKeys, selectedKey, onWeekSelect, weekData, onSaveWeek, setProfiles, setTasksArchive, weeksHistory, csatReviews, setCsatReviews, setTeamMetricsMemory }) => {
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
         if (setTeamMetricsMemory) {
            setTeamMetricsMemory(prev => mergeTasksIntoTeamMetrics(prev, parsedData.detailedTasks).memory);
         }
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
    const FIRST_LINE_KEYWORDS = ["Халеддинов", "Руслан", "Отрошко", "Гуртов", "Соколов", "Лысов", "Нестеров", "стажер", "младший"];
    
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

  const buildEmptyReportPeriodData = () => ({
    ...defaultWeekData,
    year: formData.year,
    month: formData.month,
    weekNumber: formData.weekNumber,
    dates: formData.dates,
    status: 'green',
    managementIndex: 0,
    mainInsight: 'Ожидание данных недели.',
    mainRisk: 'Ожидание данных недели.',
    nextFocus: 'Ожидание данных недели.',
    trainingHypothesis: 'Ожидание данных недели.',
    blockersAndWaste: '',
    mainWin: '',
    thanks: '',
    sprintWin: '',
    sprintRisk: '',
    shieldHero: '',
    topIncidents: [],
    slaMetrics: [],
    slaBreachDetails: [],
    topPerformers: [],
    taskPerformers: [],
    taskComplexity: [],
    taskTypesDistribution: [],
    techDebtCategories: [],
    staleBacklog: [],
    detailedTasks: [],
    telephonyData: [],
    telephonyInsight: '',
    customReportHtml: null,
    isReportFrozen: false
  });

  const handleResetReportPeriod = () => {
    const label = `неделю ${formData.weekNumber} (${safeString(formData.dates)})`;
    if (!window.confirm(`Обнулить отчетный период за ${label}? Метрики, импорт Jira, телефония и сгенерированный HTML будут очищены. Поручения руководства останутся.`)) return;
    const emptyData = buildEmptyReportPeriodData();
    setFormData(emptyData);
    setImportJson('');
    setImportTelephonyText('');
    setImportCsatText('');
    setImportStatus('reset');
    setTelephonyStatus(null);
    setCsatImportStatus(null);
    setLastCsatPreview([]);
    onSaveWeek(emptyData);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      setImportStatus(null);
    }, 3000);
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
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-medium text-white uppercase tracking-tighter">Отчетный период</h3>
              <p className="text-xs text-slate-500 mt-1">Обнуление чистит данные выбранной недели, поручения руководства остаются.</p>
            </div>
            <button type="button" onClick={handleResetReportPeriod} className="bg-red-950/50 hover:bg-red-900/70 border border-red-500/40 text-red-300 px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 shadow-lg">
              <Trash2 size={14} /> Обнулить период
            </button>
          </div>
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

const ReportsGenerator = ({ weekData, historyKeys, weeksHistory, selectedKey, onWeekSelect, onSaveWeek, projectTasks, setProjectTasks, csatReviews, aiTaskMemory, setAiTaskMemory, tasksArchive, teamMetricsMemory }) => {
  const [copiedId, setCopiedId] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  
  // Состояния для формы новой задачи руководства
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskComment, setNewTaskComment] = useState('в работе');
  const [newTaskColor, setNewTaskColor] = useState('#10b981'); // Зеленый по умолчанию

  const reportRef = useRef(null);

  const normalizeTaskPriority = (value) => {
    const raw = safeString(value).trim().toLowerCase();
    if (raw === 'impact' || raw === 'важное' || raw === 'important' || raw === 'high') return 'Impact';
    if (raw === 'routine' || raw === 'рутина' || raw === 'ktlo' || raw === 'low') return 'Routine';
    return 'Standard';
  };

  const getTaskPriority = (task) => {
    const taskId = safeString(task?.id).trim();
    const memoryPriority = taskId ? aiTaskMemory?.[taskId]?.priority : null;
    return normalizeTaskPriority(memoryPriority || task?.priority || task?.valuePriority || 'Standard');
  };

  const getTaskMemoryEntry = (task) => {
    const taskId = safeString(task?.id).trim();
    return taskId ? aiTaskMemory?.[taskId] : null;
  };

  const getTaskComplexity = (task) => {
    const taskId = safeString(task?.id).trim();
    const memoryComplexity = taskId ? aiTaskMemory?.[taskId]?.complexity : null;
    return normalizeTaskSize(memoryComplexity || task?.size || task?.complexity);
  };

  const getTaskWorkType = (task) => {
    const taskId = safeString(task?.id).trim();
    const memoryWorkType = taskId ? aiTaskMemory?.[taskId]?.workType : null;
    const raw = safeString(memoryWorkType || task?.workType || task?.taskType || '').trim().toUpperCase();
    if (raw === 'IDM') return 'IDM';
    return '';
  };

  const getTaskReportBucket = (task) => {
    const workType = getTaskWorkType(task);
    if (workType === 'IDM') return 'idm';
    const priority = getTaskPriority(task);
    if (priority === 'Routine') return 'ktlo';
    return 'main';
  };

  const getTaskReportBucketLabel = (task) => {
    const bucket = getTaskReportBucket(task);
    if (bucket === 'idm') return { label: 'В отчете: IDM', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' };
    if (bucket === 'ktlo') return { label: 'В отчете: KTLO', color: '#64748b', bg: '#f8fafc', border: '#cbd5e1' };
    return { label: 'В отчете: основной блок', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' };
  };

  const slaReviewOptions = [
    { value: 'reaction_discipline', label: 'Не взяли в 15 мин', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
    { value: 'complexity', label: 'Сложный кейс', color: '#c2410c', bg: '#fff7ed', border: '#fed7aa' },
    { value: 'false_breach', label: 'Ложная просрочка', color: '#64748b', bg: '#f8fafc', border: '#cbd5e1' }
  ];

  const normalizeSlaReview = (value) => {
    const raw = safeString(value).trim();
    if (raw === 'shift_gap') return '';
    return slaReviewOptions.some(option => option.value === raw) ? raw : '';
  };

  const getSlaMemoryKey = (incidentId) => {
    const cleanId = safeString(incidentId).trim();
    return cleanId ? `sla:${cleanId}` : '';
  };

  const getSlaReviewMeta = (value) => slaReviewOptions.find(option => option.value === normalizeSlaReview(value)) || null;

  const getSlaReview = (incidentId) => {
    const key = getSlaMemoryKey(incidentId);
    return key ? normalizeSlaReview(aiTaskMemory?.[key]?.slaReview) : '';
  };

  const handleSetSlaReview = (incidentId, title, review) => {
    const cleanId = safeString(incidentId).trim();
    const cleanReview = normalizeSlaReview(review);
    if (!cleanId || !cleanReview) return;
    const memoryKey = getSlaMemoryKey(cleanId);
    setAiTaskMemory(prev => {
      const previous = (prev || {})[memoryKey] || {};
      return {
        ...(prev || {}),
        [memoryKey]: {
          ...previous,
          id: memoryKey,
          incidentId: cleanId,
          title: safeString(title).trim() || previous.title || cleanId,
          slaReview: cleanReview,
          kind: 'sla',
          updatedAt: new Date().toISOString()
        }
      };
    });
    setIsDirty(false);
  };

  const handleClearSlaReview = (incidentId) => {
    const memoryKey = getSlaMemoryKey(incidentId);
    if (!memoryKey) return;
    setAiTaskMemory(prev => {
      const next = { ...(prev || {}) };
      delete next[memoryKey];
      return next;
    });
    setIsDirty(false);
  };

  const handleSetTaskPriority = (taskId, title, priority) => {
    const cleanId = safeString(taskId).trim();
    if (!cleanId) return;
    const cleanPriority = normalizeTaskPriority(priority);
    setAiTaskMemory(prev => {
      const previous = (prev || {})[cleanId] || {};
      return {
        ...(prev || {}),
        [cleanId]: {
          ...previous,
          id: cleanId,
          title: safeString(title).trim() || previous.title || cleanId,
          priority: cleanPriority,
          updatedAt: new Date().toISOString()
        }
      };
    });
    setIsDirty(false);
  };

  const handleSetTaskComplexity = (taskId, title, complexity) => {
    const cleanId = safeString(taskId).trim();
    if (!cleanId) return;
    const cleanComplexity = normalizeTaskSize(complexity);
    if (!cleanComplexity) return;
    setAiTaskMemory(prev => {
      const previous = (prev || {})[cleanId] || {};
      return {
        ...(prev || {}),
        [cleanId]: {
          ...previous,
          id: cleanId,
          title: safeString(title).trim() || previous.title || cleanId,
          complexity: cleanComplexity,
          updatedAt: new Date().toISOString()
        }
      };
    });
    setIsDirty(false);
  };

  const handleSetTaskWorkType = (taskId, title, workType) => {
    const cleanId = safeString(taskId).trim();
    if (!cleanId) return;
    const cleanWorkType = safeString(workType).trim().toUpperCase();
    if (cleanWorkType !== 'IDM') return;
    setAiTaskMemory(prev => {
      const previous = (prev || {})[cleanId] || {};
      return {
        ...(prev || {}),
        [cleanId]: {
          ...previous,
          id: cleanId,
          title: safeString(title).trim() || previous.title || cleanId,
          workType: cleanWorkType,
          updatedAt: new Date().toISOString()
        }
      };
    });
    setIsDirty(false);
  };

  const handleClearTaskWorkType = (taskId) => {
    const cleanId = safeString(taskId).trim();
    if (!cleanId) return;
    setAiTaskMemory(prev => {
      const previous = (prev || {})[cleanId];
      if (!previous) return prev || {};
      const nextEntry = { ...previous };
      delete nextEntry.workType;
      const next = { ...(prev || {}) };
      if (nextEntry.priority || nextEntry.complexity) {
        next[cleanId] = nextEntry;
      } else {
        delete next[cleanId];
      }
      return next;
    });
    setIsDirty(false);
  };

  const handleClearTaskMemory = (taskId) => {
    const cleanId = safeString(taskId).trim();
    if (!cleanId) return;
    setAiTaskMemory(prev => {
      const next = { ...(prev || {}) };
      delete next[cleanId];
      return next;
    });
    setIsDirty(false);
  };

  const handleDownloadAiMemory = () => {
    const weights = Object.values(aiTaskMemory || {})
      .filter(item => item && item.title)
      .map(item => {
        const entry = {
          id: safeString(item.id),
          task: safeString(item.title),
          type: normalizeTaskPriority(item.priority)
        };
        const complexity = normalizeTaskSize(item.complexity);
        if (complexity) entry.complexity = complexity;
        if (safeString(item.workType).trim().toUpperCase() === 'IDM') entry.workType = 'IDM';
        if (item.solutionFeedback && typeof item.solutionFeedback === 'object') entry.solutionFeedback = item.solutionFeedback;
        if (item.kind === 'sla' || item.slaReview) {
          entry.kind = 'sla';
          entry.incidentId = safeString(item.incidentId || item.id).replace(/^sla:/, '');
          entry.slaReview = normalizeSlaReview(item.slaReview);
        }
        if (item.updatedAt) entry.updatedAt = safeString(item.updatedAt);
        return entry;
      });
    const taskCalibration = Object.values(teamMetricsMemory || {}).flatMap(row => {
      const assignee = safeString(row?.name).trim();
      return Object.values(row?.taskDetails || {}).map(task => {
        const id = safeString(task?.id).trim();
        if (!id) return null;
        return {
          id,
          task: safeString(task.title || id),
          assignee,
          domain: normalizeMetricDomain(task.domain || task.originalDomain || 'Прочее', task.title || ''),
          complexity: normalizeTaskSize(task.size || task.originalSize) || 'M',
          manualDomain: Boolean(task.manualDomain),
          manualSize: Boolean(task.manualSize),
          impact: Boolean(task.impact),
          updatedAt: safeString(task.updatedAt || row?.updatedAt)
        };
      }).filter(Boolean);
    });
    const payload = {
      schemaVersion: 2,
      exportedAt: new Date().toISOString(),
      weights,
      taskCalibration,
      teamMetricsMemory: teamMetricsMemory || {}
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai_weights_config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderPriorityControls = (task) => {
    const taskId = safeString(task.id).trim();
    if (!taskId) return '';
    const activePriority = getTaskPriority(task);
    const options = [
      { value: 'Impact', label: '🌟 Важное', color: '#f59e0b' },
      { value: 'Standard', label: '⚙️ Обычное', color: '#334155' },
      { value: 'Routine', label: '🪫 Рутина', color: '#64748b' }
    ];
    return `
      <div class="no-print ai-priority-controls" contenteditable="false" style="display: flex; flex-wrap: wrap; gap: 6px; margin: 10px 0 8px 0;">
        ${options.map(option => {
          const active = activePriority === option.value;
          return `
            <button type="button"
              data-task-priority="${option.value}"
              data-task-id="${escapeHtml(taskId)}"
              data-task-title="${escapeHtml(task.title)}"
              style="border: 1px solid ${active ? option.color : '#cbd5e1'}; background: ${active ? option.color : '#ffffff'}; color: ${active ? '#ffffff' : '#475569'}; border-radius: 999px; padding: 4px 8px; font-size: 10px; font-weight: 800; cursor: pointer;">
              ${option.label}
            </button>
          `;
        }).join('')}
      </div>
    `;
  };

  const renderSlaReviewControls = (item) => {
    const incidentId = safeString(item?.id || item?.key || item?.issueKey).trim();
    if (!incidentId) return '';
    const title = safeString(item?.title || item?.theme || item?.summary || incidentId);
    const activeReview = getSlaReview(incidentId);
    const buttons = slaReviewOptions.map(option => {
      const active = activeReview === option.value;
      return `
        <button type="button"
          data-sla-review="${option.value}"
          data-sla-id="${escapeHtml(incidentId)}"
          data-sla-title="${escapeHtml(title)}"
          style="border: 1px solid ${active ? option.color : '#cbd5e1'}; background: ${active ? option.color : '#ffffff'}; color: ${active ? '#ffffff' : '#475569'}; border-radius: 999px; padding: 3px 7px; font-size: 10px; font-weight: 800; cursor: pointer;">
          ${option.label}
        </button>
      `;
    }).join('');
    const clearButton = activeReview ? `
      <button type="button"
        data-sla-review-clear="true"
        data-sla-id="${escapeHtml(incidentId)}"
        style="border: 1px solid #cbd5e1; background: #f8fafc; color: #64748b; border-radius: 999px; padding: 3px 7px; font-size: 10px; font-weight: 800; cursor: pointer;">
        Сбросить
      </button>
    ` : '';
    return `
      <div class="no-print sla-review-controls" contenteditable="false" style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 6px;">
        ${buttons}${clearButton}
      </div>
    `;
  };

  const renderComplexityControls = (task) => {
    const taskId = safeString(task.id).trim();
    if (!taskId) return '';
    const activeComplexity = getTaskComplexity(task);
    const options = [
      { value: 'S', label: 'Легко', color: '#10b981' },
      { value: 'M', label: 'Средне', color: '#3b82f6' },
      { value: 'L', label: 'Сложно', color: '#f97316' },
      { value: 'XL', label: 'Очень сложно', color: '#ef4444' }
    ];
    return `
      <div class="no-print ai-complexity-controls" contenteditable="false" style="display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 10px 0;">
        ${options.map(option => {
          const active = activeComplexity === option.value;
          return `
            <button type="button"
              data-task-complexity="${option.value}"
              data-task-id="${escapeHtml(taskId)}"
              data-task-title="${escapeHtml(task.title)}"
              style="border: 1px solid ${active ? option.color : '#cbd5e1'}; background: ${active ? option.color : '#ffffff'}; color: ${active ? '#ffffff' : '#475569'}; border-radius: 999px; padding: 4px 8px; font-size: 10px; font-weight: 800; cursor: pointer;">
              ${option.label}
            </button>
          `;
        }).join('')}
      </div>
    `;
  };

  const renderWorkTypeControls = (task) => {
    const taskId = safeString(task.id).trim();
    if (!taskId) return '';
    const activeWorkType = getTaskWorkType(task);
    return `
      <div class="no-print ai-worktype-controls" contenteditable="false" style="display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 10px 0;">
        <button type="button"
          data-task-work-type="IDM"
          data-task-id="${escapeHtml(taskId)}"
          data-task-title="${escapeHtml(task.title)}"
          style="border: 1px solid ${activeWorkType === 'IDM' ? '#7c3aed' : '#cbd5e1'}; background: ${activeWorkType === 'IDM' ? '#7c3aed' : '#ffffff'}; color: ${activeWorkType === 'IDM' ? '#ffffff' : '#475569'}; border-radius: 999px; padding: 4px 8px; font-size: 10px; font-weight: 800; cursor: pointer;">
          🪪 IDM
        </button>
        ${activeWorkType === 'IDM' ? `
          <button type="button"
            data-task-work-type-clear="true"
            data-task-id="${escapeHtml(taskId)}"
            style="border: 1px solid #ddd6fe; background: #ffffff; color: #7c3aed; border-radius: 999px; padding: 4px 8px; font-size: 10px; font-weight: 800; cursor: pointer;">
            Снять IDM
          </button>
        ` : ''}
      </div>
    `;
  };

  const renderMemoryStatusControls = (task) => {
    const taskId = safeString(task.id).trim();
    if (!taskId || !getTaskMemoryEntry(task)) return '';
    return `
      <div class="no-print ai-memory-status" contenteditable="false" style="display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 0 0 10px 0;">
        <span style="display: inline-flex; align-items: center; gap: 5px; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; border-radius: 999px; padding: 4px 9px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.04em;">
          🧠 Добавлена в память
        </span>
        <button type="button"
          data-task-memory-clear="true"
          data-task-id="${escapeHtml(taskId)}"
          style="border: 1px solid #fecaca; background: #ffffff; color: #dc2626; border-radius: 999px; padding: 4px 8px; font-size: 10px; font-weight: 800; cursor: pointer;">
          Сбросить память
        </button>
      </div>
    `;
  };

  const renderReportBucketBadge = (task) => {
    const bucket = getTaskReportBucketLabel(task);
    return `
      <div class="no-print ai-report-bucket" contenteditable="false" style="display: inline-flex; align-items: center; margin: 0 0 10px 0; background: ${bucket.bg}; color: ${bucket.color}; border: 1px solid ${bucket.border}; border-radius: 999px; padding: 4px 9px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.04em;">
        ${bucket.label}
      </div>
    `;
  };

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

  const compareWeekKeys = (leftKey, rightKey) => {
    const [leftYear, leftWeek] = safeString(leftKey).split('-').map(Number);
    const [rightYear, rightWeek] = safeString(rightKey).split('-').map(Number);
    if (!leftYear || !leftWeek || !rightYear || !rightWeek) return 0;
    if (leftYear !== rightYear) return leftYear - rightYear;
    return leftWeek - rightWeek;
  };

  const isProjectTaskVisibleInWeek = (task, weekKey) => {
    if (!task) return false;
    const createdKey = task.createdWeekKey || weekKey;
    if (compareWeekKeys(createdKey, weekKey) > 0) return false;
    if (task.completedWeekKey) return compareWeekKeys(weekKey, task.completedWeekKey) <= 0;
    return task.status === 'active';
  };

  const isProjectTaskCompletedInWeek = (task, weekKey) => {
    if (!task || task.status !== 'completed' || !task.completedWeekKey) return false;
    return compareWeekKeys(weekKey, task.completedWeekKey) >= 0;
  };

  const getProjectTaskAgingMeta = (weeksActive) => {
    if (weeksActive >= 4) {
      return {
        label: `Эскалация: ${weeksActive + 1}-я неделя`,
        color: '#b91c1c',
        bg: '#fef2f2',
        border: '#fecaca',
        note: 'Нужен владелец, решение по блокеру или закрытие как неактуальной.'
      };
    }
    if (weeksActive >= 2) {
      return {
        label: `Просрочено: ${weeksActive + 1}-я неделя`,
        color: '#dc2626',
        bg: '#fef2f2',
        border: '#fecaca',
        note: 'Нужен следующий конкретный шаг и срок.'
      };
    }
    if (weeksActive === 1) {
      return {
        label: 'Контроль срока: 2-я неделя',
        color: '#b45309',
        bg: '#fffbeb',
        border: '#fde68a',
        note: 'Проверить, есть ли блокер или дата выполнения.'
      };
    }
    return {
      label: 'Новая задача',
      color: '#2563eb',
      bg: '#eff6ff',
      border: '#bfdbfe',
      note: 'Нормальный старт в текущем отчетном периоде.'
    };
  };

  // Поручение видно с недели создания до недели закрытия. В прошлые недели до создания оно не попадает.
  const tasksForThisWeek = (projectTasks || []).filter(t => isProjectTaskVisibleInWeek(t, selectedKey));

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
        const isCompleted = isProjectTaskCompletedInWeek(t, selectedKey);
        const agingMeta = getProjectTaskAgingMeta(weeksActive);
        const bgColor = isCompleted ? '#f0fdf4' : '#ffffff';
        const borderColor = isCompleted ? '#bbf7d0' : '#e2e8f0';
        const leftBorderColor = isCompleted ? '#22c55e' : t.color;
        const titleColor = isCompleted ? '#166534' : '#0f172a';
        const titleText = isCompleted ? `<s>${safeString(t.title)}</s>` : safeString(t.title);
        
        const statusBadge = isCompleted 
          ? `<span style="color: #16a34a; font-weight: bold; background: #dcfce3; padding: 2px 6px; border-radius: 4px; font-size: 11px; text-transform: uppercase;">Выполнено</span>`
          : `[ <span style="color: ${t.color}; font-weight: bold;">${safeString(t.comment)}</span> ]`;

        const delaySticker = !isCompleted
          ? `<span style="display: inline-block; margin-top: 6px; background-color: ${agingMeta.bg}; color: ${agingMeta.color}; border: 1px solid ${agingMeta.border}; padding: 2px 7px; border-radius: 999px; font-size: 11px; font-weight: bold;">${agingMeta.label}</span>`
          : '';

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
               ${weeksActive >= 1 ? `<div style="font-size: 12px; color: #64748b; margin-top: 5px;">${agingMeta.note}</div>` : ''}
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
  const getReportHtmlString = (options = {}) => {
    try {
      const exportMode = Boolean(options.exportMode);
      const reportData = weekData || {};
      const sortedIncidents = weekData.topIncidents ? [...weekData.topIncidents].sort((a,b)=>(Number(b.count)||0)-(Number(a.count)||0)) : [];
      const top3 = sortedIncidents.slice(0, 3);
      const top3Text = top3.map(i => `${safeString(i.name)} (${Number(i.count)||0})`).join(', ');

      const totalIncidentsFromList = (weekData.topIncidents || []).reduce((sum, item) => sum + (Number(item.count) || 0), 0);
      const totalClosedCount = (Number(weekData.sprintCompleted)||0) + (Number(weekData.urgentCompleted)||0) + (Number(weekData.backlogCompleted)||0);
      const totalIncidents = Number(weekData.incidentsClosed) || 0;
      const managementIndex = Number(weekData.managementIndex) || 0;
      const slaViolationsTotal = (weekData.slaMetrics || []).reduce((sum, item) => sum + (Number(item.violations) || 0), 0);
      const flowSituationText = [
        `Индекс SLA ${managementIndex}/100${slaViolationsTotal > 0 ? `, нарушений SLA: ${slaViolationsTotal}` : ''}.`,
        totalIncidents > 0 ? `Закрыто инцидентов 1-й линии: ${totalIncidents}.` : '',
        managementIndex < 70
          ? 'Поток в зоне риска: нужен контроль просрочек SLA и причин повторяемых обращений.'
          : 'Поток выглядит управляемо, но повторяемые драйверы инцидентов остаются на контроле.'
      ].filter(Boolean).join(' ');

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
           return p.name !== TEAM_LEAD_ID && fName !== TEAM_LEAD_NAME && !String(p.name).includes('Виктор') && !isUnknown && !isExcludedUser(p.name);
        })
        .sort((a,b) => (Number(b.closed)||0) - (Number(a.closed)||0));
        
      let sortedIncPerformers = [...(weekData.topPerformers || [])]
        .filter(p => {
           const fName = getFullName(p.name);
           const isTeamLead = p.name === TEAM_LEAD_ID || fName === TEAM_LEAD_NAME || String(p.name).includes('Виктор');
           const isThirdLine = THIRD_LINE_ADMINS.includes(fName) || THIRD_LINE_ADMINS.includes(p.name);
           const isUnknown = String(p.name).toLowerCase() === 'неизвестно' || fName.toLowerCase() === 'неизвестно';
           // Убираем Тимлида И 3-ю линию из Инцидентов
           return !isTeamLead && !isThirdLine && !isUnknown && !isExcludedUser(p.name);
        })
        .sort((a,b) => (Number(b.closed)||0) - (Number(a.closed)||0));

      const completedDetailedTasks = (weekData.detailedTasks || [])
        .filter(t => t && (t.status === 'Закрыт' || t.status === 'Готово' || t.status === 'Resolved' || t.status === 'Завершен' || t.resolved))
        .filter(t => {
           // В автоматическую сводку попадают только администраторы из USER_DICTIONARY; чужие исполнители отсекаются.
           const fName = getFullName(t.assignee);
           const isTeamLead = fName === TEAM_LEAD_NAME || t.assignee === TEAM_LEAD_ID || String(t.assignee).includes('Виктор');
           return !isTeamLead && isKnownTeamMember(t.assignee) && !isExcludedUser(t.assignee);
        })
        .sort((a, b) => {
            const idA = parseInt(String(a.id).replace(/\D/g, '')) || 0;
            const idB = parseInt(String(b.id).replace(/\D/g, '')) || 0;
            return idB - idA;
        });

      const keyDetailedTasks = exportMode
        ? completedDetailedTasks.filter(task => getTaskReportBucket(task) === 'main')
        : completedDetailedTasks;
      const idmDetailedTasks = exportMode
        ? completedDetailedTasks.filter(task => getTaskReportBucket(task) === 'idm')
        : [];
      const routineDetailedTasks = exportMode
        ? completedDetailedTasks.filter(task => getTaskReportBucket(task) === 'ktlo')
        : [];

      const normalizeReportPersonName = (name) => safeString(name).toLowerCase().replace(/ё/g, 'е').replace(/[^а-яa-z\s-]/g, ' ').replace(/\s+/g, ' ').trim();
      const getReportPersonTokens = (name) => normalizeReportPersonName(name).split(/[\s-]+/).filter(part => part.length > 1);
      const isSameReportPerson = (leftName, rightName) => {
        const leftTokens = getReportPersonTokens(leftName);
        const rightTokens = getReportPersonTokens(rightName);
        if (leftTokens.length === 0 || rightTokens.length === 0) return false;
        return rightTokens.every(token => leftTokens.includes(token));
      };
      const FIRST_LINE_REPORT_NAMES = [
        'Халеддинов Руслан',
        'Руслан Халеддинов',
        'Никита Лысов',
        'Максим Отрошко',
        'Максим Гуртов',
        'Марк Соколов'
      ];
      const isReportFirstLineOperator = (name) => FIRST_LINE_REPORT_NAMES.some(targetName => isSameReportPerson(name, targetName));

      const parseReportDurationToSeconds = (value) => {
        const parts = safeString(value).match(/\d+/g);
        if (!parts || parts.length === 0) return 0;
        const [hours = 0, minutes = 0, seconds = 0] = parts.map(Number);
        if (parts.length === 1) return Number(parts[0]) || 0;
        if (parts.length === 2) return ((Number(hours) || 0) * 60) + (Number(minutes) || 0);
        return ((Number(hours) || 0) * 3600) + ((Number(minutes) || 0) * 60) + (Number(seconds) || 0);
      };

      const formatReportDurationShort = (seconds) => {
        const value = Number(seconds) || 0;
        if (value <= 0) return '-';
        const minutes = Math.floor(value / 60);
        const restSeconds = value % 60;
        if (minutes <= 0) return `${restSeconds}с`;
        return `${minutes}м ${String(restSeconds).padStart(2, '0')}с`;
      };

      // В отчете по телефонии показываем только целевую 1-ю линию; 2-3 линия может помогать, но не попадает в управленческий контроль.
      const visibleTelephony = (weekData.telephonyData || []).filter(row => {
         const fName = getFullName(row.name);
         return fName !== TEAM_LEAD_NAME && row.name !== TEAM_LEAD_ID && !String(row.name).includes('Виктор') && !isExcludedUser(row.name) && isReportFirstLineOperator(row.name);
      });

      const buildReportTelephonyInsight = () => {
        if (!visibleTelephony || visibleTelephony.length === 0) return '';
        const findJiraPerformer = (operatorName) => {
          const opTokens = getReportPersonTokens(operatorName);
          if (opTokens.length === 0) return null;
          const candidates = sortedIncPerformers.map(p => ({
            performer: p,
            tokens: getReportPersonTokens(getFullName(p.name)),
            rawTokens: getReportPersonTokens(p.name)
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
        let closedTotal = 0;
        const talkDurations = visibleTelephony
          .map(op => parseReportDurationToSeconds(op.avgTalk))
          .filter(value => value > 0);
        const avgLineTalk = talkDurations.length > 0
          ? Math.round(talkDurations.reduce((sum, value) => sum + value, 0) / talkDurations.length)
          : 0;
        const corporateAchievements = [];

        const operatorCards = visibleTelephony.map(op => {
          total += Number(op.total) || 0;
          missed += Number(op.missed) || 0;
          const perf = findJiraPerformer(op.name);
          const closedTickets = perf ? (Number(perf.closed) || 0) : 0;
          closedTotal += closedTickets;
          const missedCalls = Number(op.missed) || 0;
          const answeredCalls = Number(op.answered) || 0;
          const totalCalls = Number(op.total) || 0;
          const missRate = Number(op.total) > 0 ? Math.round((missedCalls / Number(op.total)) * 100) : 0;
          const availability = Math.max(0, 100 - missRate);
          const avgResolveMin = perf ? (Number(perf.avgTimeMin) || 0) : 0;
          const avgTalkSeconds = parseReportDurationToSeconds(op.avgTalk);
          const talkDiffPct = avgLineTalk > 0 && avgTalkSeconds > 0 ? Math.round(((avgTalkSeconds - avgLineTalk) / avgLineTalk) * 100) : 0;
          const closedPerAnswered = answeredCalls > 0 ? Number((closedTickets / answeredCalls).toFixed(1)) : 0;
          const explicitFirstLineSolved = perf && perf.firstLineSolved !== undefined ? Number(perf.firstLineSolved) || 0 : null;
          const explicitHandoff = perf && perf.handoffCount !== undefined ? Number(perf.handoffCount) || 0 : null;
          const dispatchGap = explicitHandoff !== null ? explicitHandoff : Math.max(answeredCalls - closedTickets, 0);
          const fcrBase = explicitFirstLineSolved !== null ? explicitFirstLineSolved : Math.min(closedTickets, answeredCalls);
          const fcrProxy = answeredCalls > 0 ? Math.min(100, Math.round((fcrBase / answeredCalls) * 100)) : 0;
          const footballRate = answeredCalls > 0 ? Math.round((dispatchGap / answeredCalls) * 100) : 0;
          const hasKpiRisk = missedCalls >= 10 || availability < 75;
          const hasKpiWarning = missedCalls > 0 || availability < 90 || footballRate >= 60;
          const hasShortTalkRisk = avgLineTalk > 0 && avgTalkSeconds > 0 && talkDiffPct <= -30;
          if (totalCalls >= 15 && missedCalls === 0) {
            corporateAchievements.push({
              name: op.name,
              title: 'Идеальная доступность линии',
              text: `${answeredCalls} принятых из ${totalCalls}, без пропущенных звонков.`
            });
          } else if (totalCalls >= 30 && missRate <= 3) {
            corporateAchievements.push({
              name: op.name,
              title: 'Стабильная линия',
              text: `Потери всего ${missRate}% при ${totalCalls} входящих вызовах.`
            });
          }
          let status = { label: 'Норма', color: '#047857', bg: '#ecfdf5', border: '#a7f3d0' };
          let recommendation = 'Держит линию в рабочем режиме.';
          let workloadLabel = 'Сбалансированная работа';
          let workloadColor = '#2563eb';
          let workloadBg = '#eff6ff';
          let workloadText = 'Закрытия и телефонная нагрузка выглядят ровно.';
          if (hasKpiRisk) {
            status = { label: 'Риск KPI линии', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' };
            recommendation = 'Проверить график смены, статусы АТС и фактическое участие на линии; если сотрудник не был в смене, исключить из оценки дежурства.';
          } else if (hasKpiWarning) {
            status = { label: 'Контроль KPI', color: '#b45309', bg: '#fffbeb', border: '#fde68a' };
            recommendation = 'Есть потери звонков; держать на контроле дисциплину линии и статусы АТС.';
          }

          if (hasKpiRisk) {
            workloadLabel = 'Просадка KPI линии';
            workloadColor = '#b91c1c';
            workloadBg = '#fef2f2';
            workloadText = `Доступность ${availability}%, пропущено ${missedCalls} из ${totalCalls} вызовов. Закрыто ${closedTickets} инцидентов: это зона риска по KPI линии, а не сбалансированная работа.`;
          } else if (closedTickets >= 65 && avgResolveMin > 20) {
            workloadLabel = 'Сложная нагрузка';
            workloadColor = '#c2410c';
            workloadBg = '#fff7ed';
            workloadText = `Много закрытий при среднем решении ${avgResolveMin} мин.: похоже на реальную тяжелую смену, а не набор легких тикетов.`;
          } else if (closedTickets >= 65 && avgResolveMin > 0 && avgResolveMin <= 10) {
            workloadLabel = 'Риск легких закрытий';
            workloadColor = '#b45309';
            workloadBg = '#fffbeb';
            workloadText = `Высокое число закрытий при среднем решении ${avgResolveMin} мин.: стоит проверить, не набирались ли в основном быстрые однотипные обращения.`;
          } else if (closedTickets >= 45 && avgResolveMin >= 15) {
            workloadLabel = 'Работал с содержательными';
            workloadColor = '#2563eb';
            workloadBg = '#eff6ff';
            workloadText = `Закрытий достаточно, среднее решение ${avgResolveMin} мин.: нагрузка выглядит не только количественной.`;
          } else if (footballRate >= 60 && answeredCalls >= 10) {
            workloadLabel = 'Диспетчеризация';
            workloadColor = '#b45309';
            workloadBg = '#fffbeb';
            workloadText = `Прокси передачи дальше ${footballRate}%: много принятых звонков без личного закрытия в Jira.`;
          } else if (closedTickets < 35 && answeredCalls >= 25) {
            workloadLabel = 'Фокус на линии';
            workloadColor = '#475569';
            workloadBg = '#f8fafc';
            workloadText = 'Jira-закрытий немного, но есть заметный телефонный поток: оценивать вместе с дежурством на линии.';
          }

          let talkText = avgTalkSeconds > 0
            ? `Средний разговор ${formatReportDurationShort(avgTalkSeconds)}.`
            : 'Средний разговор не распознан из телефонии.';
          if (avgLineTalk > 0 && avgTalkSeconds > 0) {
            if (talkDiffPct >= 30) {
              talkText = `Разговоры длиннее среднего линии на ${talkDiffPct}%: вероятны консультации или сложные обращения.`;
            } else if (hasShortTalkRisk) {
              talkText = `Разговоры короче среднего линии на ${Math.abs(talkDiffPct)}%: проверить, были ли это короткие простые обращения или сотрудник фактически не держал смену.`;
            }
          }

          return `
            <div class="telephony-operator-card">
              <div class="telephony-operator-head">
                <div style="font-weight: 900; color: #0f172a; font-size: 13px;">${escapeHtml(op.name)}</div>
                <span style="background: ${status.bg}; color: ${status.color}; border: 1px solid ${status.border}; border-radius: 999px; padding: 3px 8px; font-size: 10px; font-weight: 900; text-transform: uppercase;">${status.label}</span>
              </div>
              <div class="telephony-metrics">
                <div><span>Инциденты</span><b>${closedTickets}</b></div>
                <div><span>Принято</span><b>${answeredCalls}</b><em style="display: block; color: #64748b; font-size: 10px; font-style: normal; margin-top: 1px;">из ${totalCalls} всего</em></div>
                <div><span>Пропущено</span><b style="color: ${missedCalls > 0 ? '#dc2626' : '#047857'};">${missedCalls}</b></div>
                <div><span>Ср. разговор</span><b>${formatReportDurationShort(avgTalkSeconds)}</b></div>
              </div>
              <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;">
                <span style="background: ${workloadBg}; color: ${workloadColor}; border: 1px solid ${workloadColor}; border-radius: 999px; padding: 2px 7px; font-size: 10px; font-weight: 900; text-transform: uppercase;">${workloadLabel}</span>
                <span style="background: #f8fafc; color: #475569; border: 1px solid #cbd5e1; border-radius: 999px; padding: 2px 7px; font-size: 10px; font-weight: 900;">доступность ${availability}%</span>
                ${closedPerAnswered > 0 ? `<span style="background: #f8fafc; color: #475569; border: 1px solid #cbd5e1; border-radius: 999px; padding: 2px 7px; font-size: 10px; font-weight: 900;">${closedPerAnswered} Jira/звонок</span>` : ''}
                ${answeredCalls > 0 ? `<span style="background: #f8fafc; color: #475569; border: 1px solid #cbd5e1; border-radius: 999px; padding: 2px 7px; font-size: 10px; font-weight: 900;">Решено 1Л* ${fcrProxy}%</span>` : ''}
                ${answeredCalls > 0 ? `<span style="background: ${footballRate >= 60 ? '#fffbeb' : '#f8fafc'}; color: ${footballRate >= 60 ? '#b45309' : '#475569'}; border: 1px solid ${footballRate >= 60 ? '#f59e0b' : '#cbd5e1'}; border-radius: 999px; padding: 2px 7px; font-size: 10px; font-weight: 900;">Передано дальше* ${footballRate}%</span>` : ''}
              </div>
              <div style="font-size: 12px; color: #475569; line-height: 1.45; margin-top: 8px;">${workloadText}</div>
              <div style="font-size: 12px; color: #475569; line-height: 1.45; margin-top: 4px;">${talkText}</div>
              <div style="font-size: 12px; color: #64748b; line-height: 1.45; margin-top: 4px;">${recommendation}</div>
            </div>
          `;
        }).join('');

        const missRateTotal = total > 0 ? Math.round((missed / total) * 100) : 0;
        const summaryStatus = missed > 0
          ? { label: 'Есть потери звонков', color: '#b45309', bg: '#fffbeb', border: '#fde68a' }
          : { label: 'Без потерь', color: '#047857', bg: '#ecfdf5', border: '#a7f3d0' };
        const achievementsHtml = corporateAchievements.length > 0 ? `
            <div class="corporate-achievements">
              <div class="corporate-achievements-title">Корпоративные ачивки недели</div>
              <div class="corporate-achievements-grid">
                ${corporateAchievements.slice(0, 4).map(item => `
                  <div class="corporate-achievement-card">
                    <div style="font-size: 11px; color: #92400e; font-weight: 900; text-transform: uppercase;">${escapeHtml(item.title)}</div>
                    <div style="font-size: 13px; color: #0f172a; font-weight: 900; margin-top: 2px;">${escapeHtml(item.name)}</div>
                    <div style="font-size: 12px; color: #475569; line-height: 1.4; margin-top: 4px;">${escapeHtml(item.text)}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : '';

        return `
          <div class="telephony-panel">
            <div class="telephony-panel-head">
              <div>
                <div class="telephony-panel-title">Контроль первой линии</div>
                <div class="telephony-panel-subtitle">Телефония, закрытые инциденты и доступность операторов поддержки</div>
              </div>
              <span style="background: ${summaryStatus.bg}; color: ${summaryStatus.color}; border: 1px solid ${summaryStatus.border}; border-radius: 999px; padding: 5px 10px; font-size: 11px; font-weight: 900; text-transform: uppercase;">${summaryStatus.label}</span>
            </div>
            <div class="telephony-summary-grid">
              <div><span>Всего вызовов</span><b>${total}</b></div>
              <div><span>Пропущено</span><b style="color: ${missed > 0 ? '#dc2626' : '#047857'};">${missed}</b></div>
              <div><span>Потери</span><b>${missRateTotal}%</b></div>
              <div><span>Ср. разговор</span><b>${formatReportDurationShort(avgLineTalk)}</b></div>
            </div>
            ${achievementsHtml}
            <div class="telephony-operators-grid">
              ${operatorCards}
            </div>
          </div>
        `;
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
        if (!keyDetailedTasks || keyDetailedTasks.length === 0) return '';
        const groups = [
          { key: 'business', label: 'Бизнес-проект', value: 'движение проектов и поручений', color: '#8b5cf6', bg: '#f5f3ff', items: [] },
          { key: 'stability', label: 'Стабильность', value: 'меньше сбоев и ручного тушения', color: '#2563eb', bg: '#eff6ff', items: [] },
          { key: 'optimization', label: 'Оптимизация', value: 'ускорение и автоматизация работы', color: '#059669', bg: '#ecfdf5', items: [] },
          { key: 'techDebt', label: 'Техдолг', value: 'снятие старых рисков сопровождения', color: '#dc2626', bg: '#fff1f2', items: [] },
          { key: 'routine', label: 'Рутина', value: 'фоновая эксплуатация без отдельного акцента', color: '#64748b', bg: '#f8fafc', items: [] }
        ];
        keyDetailedTasks.forEach(task => {
          const category = getTaskValueCategory(task);
          const group = groups.find(g => g.key === category.key) || groups[groups.length - 1];
          group.items.push(task);
        });

        const activeGroups = groups.filter(g => g.items.length > 0);
        const valueTasksCount = activeGroups
          .filter(group => group.key !== 'routine')
          .reduce((sum, group) => sum + group.items.length, 0);
        const heavyValueTasksCount = keyDetailedTasks.filter(task => ['L', 'XL'].includes(getTaskComplexity(task))).length;
        const topGroup = activeGroups.length > 0
          ? [...activeGroups].sort((a, b) => b.items.length - a.items.length)[0]
          : null;
        const totalTasks = keyDetailedTasks.length || 1;
        const showcaseConclusion = topGroup
          ? `Главный фокус недели: ${topGroup.label.toLowerCase()} (${topGroup.items.length} из ${keyDetailedTasks.length}). Ценность есть, если эта доля отражает реальные приоритеты недели; детализация ниже раскрывает конкретные задачи.`
          : 'Подробные задачи загружены, но категории ценности пока не распознаны.';

        const cardsHtml = activeGroups.map(group => {
          const percent = Math.round((group.items.length / totalTasks) * 100);
          const sampleTask = group.items[0];
          return `
          <div class="value-card" style="border-top-color: ${group.color}; background: ${group.bg};">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <div style="font-size: 13px; font-weight: 800; color: ${group.color};">${group.label}</div>
              <div style="font-size: 12px; font-weight: 900; color: ${group.color};">${group.items.length} / ${percent}%</div>
            </div>
            <div style="font-size: 12px; color: #475569; line-height: 1.45;">${group.value}</div>
            ${sampleTask ? `<div style="font-size: 11px; color: #64748b; line-height: 1.35; margin-top: 7px;">Пример: <b style="color: ${group.color};">${escapeHtml(sampleTask.id)}</b> ${escapeHtml(safeString(sampleTask.title).slice(0, 74))}${safeString(sampleTask.title).length > 74 ? '...' : ''}</div>` : ''}
          </div>
        `;
        }).join('');

        return `
          <h3 style="font-size: 14px; color: #475569; margin-bottom: 10px; margin-top: 20px;">Витрина ценности закрытых задач</h3>
          <div class="value-summary">
            <div>
              <div class="value-summary-title">Что полезного дала неделя</div>
              <div class="value-summary-text">${escapeHtml(showcaseConclusion)}</div>
            </div>
            <div class="value-summary-stats">
              <span><b>${valueTasksCount}</b> ценных</span>
              <span><b>${heavyValueTasksCount}</b> сложных</span>
            </div>
          </div>
          <div class="value-grid">
            ${cardsHtml}
          </div>
        `;
      };

      const normalizeReportAnalysisText = (value) => safeString(value)
        .toLowerCase()
        .replace(/ё/g, 'е')
        .replace(/[^а-яa-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const getReportMeaningfulTokens = (value) => {
        const stopWords = [
          'проблем', 'инцидент', 'ошибка', 'заявка', 'работ', 'пользователь', 'доступ', 'после', 'через', 'есть', 'нет', 'для', 'или', 'при', 'это',
          'поручение', 'организовать', 'организация', 'обмен', 'информация', 'информацией', 'рабочими', 'местами', 'филиал', 'филиалы', 'собрать',
          'сбор', 'обсудить', 'контроль', 'контролировать'
        ];
        return [...new Set(normalizeReportAnalysisText(value)
          .split(' ')
          .filter(token => token.length >= 5 && !stopWords.includes(token))
          .map(token => token.slice(0, 8)))]
          .slice(0, 8);
      };

      const getReportTaskSearchText = (task) => normalizeReportAnalysisText(`${task?.id || ''} ${task?.title || ''} ${task?.comments || ''} ${task?.comment || ''} ${task?.tags || ''} ${task?.valueCategory || ''}`);

      const getReportTaskDomain = (task) => {
        const explicitDomain = safeString(task?.domain || task?.competenceDomain || task?.serviceDomain).trim();
        const text = normalizeReportAnalysisText(`${task?.title || ''} ${task?.comments || ''} ${task?.tags || ''} ${task?.workType || ''}`);
        return normalizeMetricDomain(explicitDomain, text);
      };

      const isReportTeamOwnedTask = (task) => {
        const assignee = safeString(task?.assignee).trim();
        if (!assignee) return false;
        const fullName = getFullName(assignee);
        return isKnownTeamMember(assignee) && fullName !== TEAM_LEAD_NAME && !isExcludedUser(assignee);
      };

      const getReportIncidentDomain = (incident) => getReportTaskDomain({
        title: incident?.name,
        comments: `${incident?.analysis || ''} ${incident?.recommendedAction || ''} ${incident?.rootCause || ''}`,
        domain: incident?.domain
      });

      const isReportDomainMatch = (incidentDomain, taskDomain) => {
        if (!incidentDomain || incidentDomain === 'Прочее') return true;
        if (incidentDomain === taskDomain) return true;
        const related = {
          'Сеть / BinkD': ['Терминалы / Серверы', 'Виртуализация / серверы'],
          'Терминалы / Серверы': ['Сеть / BinkD', 'Виртуализация / серверы'],
          'Виртуализация / серверы': ['Сеть / BinkD', 'Терминалы / Серверы'],
          'IDM': ['Проекты / процессы'],
          '2FA': ['Проекты / процессы'],
          'Zabbix / мониторинг': ['Виртуализация / серверы', 'Сеть / BinkD'],
          'Проекты / процессы': ['IDM']
        };
        return (related[incidentDomain] || []).includes(taskDomain);
      };

      const isReportActionableResolutionTask = (task) => {
        const text = normalizeReportAnalysisText(`${task?.title || ''} ${task?.comments || ''} ${task?.comment || ''}`);
        const weakProcessWords = ['организовать обмен', 'обмен информацией', 'сбор информации', 'собрать информацию', 'обсудить', 'совещание', 'контроль проблем', 'мониторинг проблем'];
        if (weakProcessWords.some(pattern => text.includes(pattern))) return false;
        const actionWords = ['настро', 'исправ', 'устран', 'обнов', 'перенастро', 'созда', 'выда', 'добав', 'удал', 'замен', 'перев', 'восстанов', 'продл', 'подключ', 'перезап', 'миграц'];
        return actionWords.some(token => text.includes(token));
      };

      const hasReportStrongTaskMatch = (task, tokens, incidentDomain) => {
        const taskText = getReportTaskSearchText(task);
        const matchedTokenCount = tokens.filter(token => taskText.includes(token)).length;
        return isReportDomainMatch(incidentDomain, getReportTaskDomain(task))
          && isReportActionableResolutionTask(task)
          && matchedTokenCount >= 2;
      };

      const renderIncidentResolutionReport = () => {
        const links = sortedIncidents.slice(0, 5).map(incident => {
          const tokens = getReportMeaningfulTokens(`${incident.name || ''} ${incident.analysis || ''}`);
          const incidentDomain = getReportIncidentDomain(incident);
          const matchedTasks = completedDetailedTasks
            .filter(task => tokens.length > 0
              && isReportTeamOwnedTask(task)
              && hasReportStrongTaskMatch(task, tokens, incidentDomain))
            .slice(0, 4);
          const matchedProjectTasks = tasksForThisWeek
            .filter(task => tokens.length > 0 && hasReportStrongTaskMatch(task, tokens, incidentDomain))
            .slice(0, 3);
          const solutionHints = (tasksArchive || [])
            .filter(task => {
              const taskText = getReportTaskSearchText(task);
              const taskId = safeString(task.id);
              const isCurrentMatch = matchedTasks.some(matched => safeString(matched.id) === taskId);
              return tokens.length > 0
                && isReportTeamOwnedTask(task)
                && !isCurrentMatch
                && hasReportStrongTaskMatch(task, tokens, incidentDomain);
            })
            .slice(0, 3);
          const status = matchedTasks.length > 0 ? 'covered' : (matchedProjectTasks.length > 0 ? 'planned' : 'gap');
          return { incident, incidentDomain, matchedTasks, matchedProjectTasks, solutionHints, status };
        }).filter(link => safeString(link.incident?.name));

        if (links.length === 0) return '';

        return `
          <h3 style="font-size: 14px; color: #475569; margin-bottom: 10px; margin-top: 20px;">Инциденты -> устранение</h3>
          <div class="correlation-panel">
            ${links.map((link, idx) => {
              const badgeColor = link.status === 'covered' ? '#059669' : (link.status === 'planned' ? '#2563eb' : '#d97706');
              const badgeBg = link.status === 'covered' ? '#ecfdf5' : (link.status === 'planned' ? '#eff6ff' : '#fffbeb');
              const badgeText = link.status === 'covered' ? 'есть задача устранения' : (link.status === 'planned' ? 'есть поручение' : 'нет связки');
              const taskLines = link.matchedTasks.length > 0
                ? link.matchedTasks.map(task => `<li><b>${escapeHtml(task.id)}</b> ${escapeHtml(safeString(task.title).slice(0, 90))}${safeString(task.title).length > 90 ? '...' : ''}</li>`).join('')
                : link.matchedProjectTasks.map(task => `<li>${escapeHtml(safeString(task.title).slice(0, 100))}${safeString(task.title).length > 100 ? '...' : ''}</li>`).join('');
              const hintLines = link.solutionHints.map(task => `<li><b>${escapeHtml(task.id)}</b> ${escapeHtml(safeString(task.title).slice(0, 90))}${safeString(task.title).length > 90 ? '...' : ''}</li>`).join('');
              return `
                <div class="correlation-card" style="border-left-color: ${badgeColor};">
                  <div style="display: flex; justify-content: space-between; gap: 12px; align-items: flex-start;">
                    <div style="font-size: 13px; color: #0f172a; font-weight: 900;">${idx + 1}. ${escapeHtml(safeString(link.incident.name))}</div>
                    <div style="white-space: nowrap; font-size: 10px; font-weight: 900; color: ${badgeColor}; background: ${badgeBg}; border: 1px solid ${badgeColor}33; border-radius: 999px; padding: 3px 8px; text-transform: uppercase;">${badgeText}</div>
                  </div>
                  <div style="font-size: 11px; color: #64748b; margin-top: 3px;">Инцидентов: <b>${Number(link.incident.count) || 0}</b> · домен: ${escapeHtml(link.incidentDomain)}</div>
                  ${taskLines
                    ? `<div style="font-size: 10px; color: #059669; font-weight: 900; text-transform: uppercase; margin-top: 7px;">Задачи устранения этой недели</div><ul class="compact-list">${taskLines}</ul>`
                    : '<div style="font-size: 12px; color: #92400e; margin-top: 7px;">Нужна задача или поручение на устранение повторяемой причины.</div>'}
                  ${hintLines ? `
                    <div class="solution-hints">
                      <div style="font-size: 10px; color: #0e7490; font-weight: 900; text-transform: uppercase; margin-bottom: 4px;">Суфлер похожих решений из архива</div>
                      <ul class="compact-list" style="margin-top: 0;">${hintLines}</ul>
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
        `;
      };

      const renderSkillMatrixReport = () => {
        const rows = Object.values(completedDetailedTasks.reduce((acc, task) => {
          const assignee = getFullName(task.assignee);
          if (!assignee || assignee === 'Неизвестно' || assignee === TEAM_LEAD_NAME || isExcludedUser(task.assignee)) return acc;
          if (!acc[assignee]) {
            acc[assignee] = { assignee, total: 0, sizes: { S: 0, M: 0, L: 0, XL: 0 }, categories: {}, domains: {}, heavy: 0, samples: [] };
          }
          const size = getTaskComplexity(task) || 'M';
          const category = getTaskValueCategory(task).label;
          const domain = getReportTaskDomain(task);
          acc[assignee].total += 1;
          acc[assignee].sizes[size] = (acc[assignee].sizes[size] || 0) + 1;
          acc[assignee].categories[category] = (acc[assignee].categories[category] || 0) + 1;
          acc[assignee].domains[domain] = (acc[assignee].domains[domain] || 0) + 1;
          if (acc[assignee].samples.length < 5) acc[assignee].samples.push(task);
          if (['L', 'XL'].includes(size)) acc[assignee].heavy += 1;
          return acc;
        }, {})).map(row => {
          const topCategory = Object.entries(row.categories).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Смешанный профиль';
          const topDomains = Object.entries(row.domains).sort((a, b) => b[1] - a[1]).slice(0, 4);
          const heavyShare = row.total > 0 ? Math.round((row.heavy / row.total) * 100) : 0;
          const confidence = row.total >= 5 ? 'устойчиво' : (row.total >= 3 ? 'средне' : 'мало данных');
          const keyTasks = [...row.samples]
            .sort((a, b) => {
              const sizeRank = { XL: 4, L: 3, M: 2, S: 1 };
              return (sizeRank[getTaskComplexity(b)] || 0) - (sizeRank[getTaskComplexity(a)] || 0);
            })
            .slice(0, 2);
          return {
            ...row,
            topCategory,
            topDomains,
            heavyShare,
            confidence,
            keyTasks,
            profile: heavyShare >= 35 ? `Тяжелые задачи: ${topCategory}` : `Основной фокус: ${topCategory}`
          };
        }).sort((a, b) => b.heavy - a.heavy || b.total - a.total).slice(0, 9);

        if (rows.length === 0) return '';

        return `
          <h3 style="font-size: 14px; color: #475569; margin-bottom: 10px; margin-top: 20px;">Матрица компетенций</h3>
          <div style="font-size: 12px; color: #64748b; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; margin-bottom: 10px;">Считается по закрытым задачам недели: размер из size/AI-памяти, домен из поля domain или темы задачи. Это не отдельная память компетенций, а пересчет по сохраненным задачам. При 1-2 задачах вывод предварительный.</div>
          <div class="skill-matrix-grid">
            ${rows.map(row => `
              <div class="skill-card">
                <div style="display: flex; justify-content: space-between; gap: 10px; align-items: flex-start; margin-bottom: 8px;">
                  <div>
                    <div style="font-size: 13px; color: #0f172a; font-weight: 900;">${escapeHtml(row.assignee)}</div>
                    <div style="font-size: 11px; color: #0891b2; font-weight: 800;">${escapeHtml(row.profile)}</div>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: 11px; color: #475569; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 999px; padding: 3px 8px; white-space: nowrap;"><b>${row.total}</b> задач</div>
                    <div style="font-size: 9px; color: #64748b; margin-top: 3px; text-transform: uppercase;">${escapeHtml(row.confidence)}</div>
                  </div>
                </div>
                <div class="mini-size-grid">
                  ${['S', 'M', 'L', 'XL'].map(size => `<div><span>${getTaskSizeLabel(size)}</span><b>${row.sizes[size] || 0}</b></div>`).join('')}
                </div>
                <div style="font-size: 11px; color: #64748b; margin-top: 7px;">Сложные задачи: <b style="color: #0f172a;">${row.heavyShare}%</b></div>
                <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px;">
                  ${row.topDomains.map(([domain, count]) => `<span style="font-size: 10px; color: #0e7490; background: #ecfeff; border: 1px solid #a5f3fc; border-radius: 999px; padding: 2px 6px;">${escapeHtml(domain)}: ${count}</span>`).join('')}
                </div>
                ${row.keyTasks.length > 0 ? `
                  <div style="border-top: 1px solid #e2e8f0; margin-top: 9px; padding-top: 7px;">
                    <div style="font-size: 10px; color: #64748b; font-weight: 900; text-transform: uppercase; margin-bottom: 4px;">Опорные задачи</div>
                    ${row.keyTasks.map(task => `<div style="font-size: 11px; color: #334155; line-height: 1.35; margin-top: 3px;"><b style="color: #0e7490;">${escapeHtml(task.id)}</b> ${escapeHtml(safeString(task.title).slice(0, 80))}${safeString(task.title).length > 80 ? '...' : ''}</div>`).join('')}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        `;
      };

      const renderResourceAuditReport = () => {
        const mergedMetrics = mergeTasksIntoTeamMetrics(teamMetricsMemory || {}, completedDetailedTasks).memory;
        const rows = buildTeamMetricRows(mergedMetrics).slice(0, 10);
        const domainRankMap = buildDomainRankMap(rows);
        const auditText = safeString(weekData.resourceAudit).trim() || 'Выводы появятся после импорта аналитики.';
        return `
          <h3 style="font-size: 14px; color: #475569; margin-bottom: 10px;">Выводы ИИ</h3>
          <div style="background:#ecfeff; border:1px solid #a5f3fc; border-left:5px solid #06b6d4; border-radius:10px; padding:12px 14px; color:#155e75; font-size:13px; line-height:1.55; margin-bottom:18px;">
            ${escapeHtml(auditText).replace(/\n/g, '<br/>')}
          </div>
          <h3 style="font-size: 14px; color: #475569; margin-bottom: 10px;">Матрица админского вклада и компетенций</h3>
          ${rows.length > 0 ? `
            <div style="font-size: 12px; color: #475569; line-height: 1.45; margin-bottom: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px;">
              Методика адаптирована под системных админов: учитываются устойчивый объем работ, ручная сложность, инфраструктурный эффект и подтвержденные домены. Это не автоматическое кадровое решение; перед выводами нужна ручная калибровка задач и проверка контекста.
            </div>
            <div style="display:grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap:10px; margin-bottom:14px;">
              ${rows.slice(0, 3).map((row, idx) => {
                const accents = ['#f59e0b', '#06b6d4', '#64748b'];
                const bg = ['#fffbeb', '#ecfeff', '#f8fafc'];
                const label = ['Лидер вклада', 'Сильный вклад', 'Стабильный вклад'][idx] || 'Вклад';
                return `
                  <div style="border:1px solid ${accents[idx]}; border-radius:12px; padding:12px; background:${bg[idx]};">
                    <div style="font-size:10px; color:#64748b; font-weight:900; text-transform:uppercase;">${idx + 1} место · ${label}</div>
                    <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start; margin-top:5px;">
                      <div>
                        <div style="font-size:14px; color:#0f172a; font-weight:900;">${escapeHtml(row.name)}</div>
                        <div style="font-size:10px; color:#64748b;">${row.totalTasks} задач · ${row.totalWeight} баллов</div>
                      </div>
                      <div style="font-size:26px; color:${accents[idx]}; font-weight:900; line-height:1;">${row.contributionIndex}</div>
                    </div>
                    <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:5px; margin-top:10px;">
                      <div style="background:#fff; border:1px solid #e2e8f0; border-radius:7px; padding:5px; font-size:10px; color:#64748b;">Важные<br><b style="color:#0f172a; font-size:13px;">${row.impactShare}%</b></div>
                      <div style="background:#fff; border:1px solid #e2e8f0; border-radius:7px; padding:5px; font-size:10px; color:#64748b;">Сложные<br><b style="color:#0f172a; font-size:13px;">${row.heavyWeightShare}%</b></div>
                      <div style="background:#fff; border:1px solid #e2e8f0; border-radius:7px; padding:5px; font-size:10px; color:#64748b;">Объем<br><b style="color:#0f172a; font-size:13px;">${row.totalWeight}</b></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
            <table class="data-table resource-audit-table">
              <thead>
                <tr>
                  <th>Сотрудник</th>
                  <th>Объем работы (баллы)</th>
                  <th>Админский вклад</th>
                  <th>Ключевые направления</th>
                </tr>
              </thead>
              <tbody>
                ${rows.map((row, idx) => `
                  <tr>
                    <td>
                      <b>${idx < 3 ? `${idx + 1}. ` : ''}${escapeHtml(row.name)}</b>
                      <div style="font-size:11px; color:#64748b;">Задач: ${row.totalTasks} · важные: ${row.impactShare}% · сложные: ${row.heavyWeightShare}%</div>
                    </td>
                    <td><b style="font-size:15px; color:#0f172a;">${row.totalWeight}</b></td>
                    <td><b style="font-size:15px; color:${row.contributionIndex >= 75 ? '#d97706' : '#0e7490'};">${row.contributionIndex}</b></td>
                    <td>
                      <div style="display:flex; flex-wrap:wrap; gap:5px;">
                        ${row.topDomains.slice(0, 2).map(([domain, score]) => {
                          const share = row.totalWeight > 0 ? Math.round(((Number(score) || 0) / row.totalWeight) * 100) : 0;
                          const rank = getDomainRank(domainRankMap, domain, row.name);
                          const badge = getExpertiseBadge(score, rank, share);
                          return `<span style="display:inline-block; background:${badge.bg}; color:${badge.color}; border:1px solid ${badge.border}; border-radius:999px; padding:3px 7px; font-size:10px; font-weight:800;">${badge.icon ? `${badge.icon} ` : ''}${escapeHtml(domain)}: ${score} · ${badge.label}</span>`;
                        }).join('') || '<span style="color:#94a3b8;">Нет данных</span>'}
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<p style="font-size:13px; color:#64748b;">Историческая память компетенций пока не загружена.</p>'}
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

      const buildReportCsatItems = (perf) => {
        const details = Array.isArray(perf.csatDetails) ? perf.csatDetails : [];
        if (details.length > 0) {
          return details
            .map(item => {
              const id = normalizeIncidentKey(item.id);
              if (!id) return null;
              const linkedTask = (weekData.detailedTasks || []).find(t => normalizeIncidentKey(t.id) === id);
              const reviewText = safeString(csatReviews?.[id]).trim();
              const themeText = safeString(item.theme || item.title || item.topic || item.summary || linkedTask?.title).trim();
              return {
                id,
                rating: Number(item.rating) || null,
                text: reviewText,
                theme: themeText
              };
            })
            .filter(Boolean);
        }

        const legacyComments = Array.isArray(perf.csatComments) ? perf.csatComments : [];
        return legacyComments
          .map((comment, index) => ({
            id: `legacy-${index + 1}`,
            rating: Number(perf.csat) || null,
            text: safeString(comment).trim(),
            theme: ''
          }))
          .filter(item => item.text);
      };

      const renderReportCsatCell = (perf) => {
        const score = formatCSAT(perf.csat);
        const items = buildReportCsatItems(perf);
        if (items.length === 0) return score;

        const itemsHtml = items.map(item => {
          const rating = Number(item.rating) || null;
          const isDanger = rating > 0 && rating <= 3;
          const isWarning = rating === 4;
          const borderColor = isDanger ? '#ef4444' : (isWarning ? '#f59e0b' : '#10b981');
          const bgColor = isDanger ? '#fef2f2' : (isWarning ? '#fffbeb' : '#f8fafc');
          const textColor = isDanger ? '#991b1b' : (isWarning ? '#92400e' : '#0f172a');
          const payloadHtml = item.text
            ? `<div style="font-size: 12px; color: #0f172a; line-height: 1.45; margin-top: 6px; white-space: pre-wrap;">"${escapeHtml(item.text)}"</div>`
            : `<div style="font-size: 11px; color: #64748b; line-height: 1.45; margin-top: 6px; font-style: italic;">Тема: ${escapeHtml(item.theme || 'не передана в JSON')}</div>`;

          return `
            <div style="background: ${bgColor}; border: 1px solid ${borderColor}; border-left: 4px solid ${borderColor}; border-radius: 6px; padding: 9px 10px; margin-bottom: 8px; text-align: left;">
              <div style="display: flex; justify-content: space-between; gap: 12px; align-items: center; font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 800; color: ${textColor};">
                <span>${escapeHtml(item.id)}</span>
                <span>Оценка ${rating || score}</span>
              </div>
              ${payloadHtml}
            </div>
          `;
        }).join('');

        return `
          <div class="report-csat-cell">
            <span class="report-csat-score">⭐ ${score}</span>
            <div class="report-csat-popover">
              <div style="font-weight: 800; color: #0f172a; font-size: 13px; margin-bottom: 8px; text-align: left;">Отзывы пользователей</div>
              ${itemsHtml}
            </div>
          </div>
        `;
      };
      
      const incRows = sortedIncPerformers.map(p => {
         const droppedCount = Array.isArray(p.droppedTasks) ? p.droppedTasks.length : (Number(p.droppedTasks) || 0);
         const closedHtml = droppedCount > 0 
            ? `${p.closed || 0}<br/><span style="font-size: 10px; color: #94a3b8; font-weight: normal;">(-${droppedCount} безд.)</span>`
            : `${p.closed || 0}`;
         return [`${getFullName(p.name)} ${getBurnoutBadge(0, p.closed, 'inc')}`, closedHtml, `${p.avgTimeMin || 0} мин.`, getContextStringHtml(p.taskContext), renderReportCsatCell(p)];
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

      const slaBreachDetails = Array.isArray(weekData.slaBreachDetails) ? weekData.slaBreachDetails : [];
      const getBreachType = (item) => safeString(item.slaType || item.type || item.name || item.metric);
      const primarySlaBreaches = slaBreachDetails.filter(item => {
        const type = getBreachType(item).toLowerCase();
        return type.includes('момент') || type.includes('создан') || type.includes('first') || type.includes('reaction');
      });
      const resolutionSlaBreaches = slaBreachDetails.filter(item => {
        const type = getBreachType(item).toLowerCase();
        return type.includes('решен') || type.includes('решени') || type.includes('resolution');
      });
      const countByField = (items, getter) => items.reduce((acc, item) => {
        const key = safeString(getter(item)).trim() || 'Неизвестно';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
      const formatTopCounts = (counts, limit = 3) => Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([name, count]) => `${escapeHtml(name)}: <b>${count}</b>`)
        .join(', ');
      const isLikelyEasySla = (item) => {
        if (item?.isLikelyEasy === true) return true;
        const size = safeString(item?.complexity || item?.size).toUpperCase();
        if (size === 'S') return true;
        const text = `${safeString(item?.title)} ${safeString(item?.reason)} ${safeString(item?.domain)}`.toLowerCase();
        return text.includes('парол') || text.includes('ярлык') || text.includes('типов') || text.includes('доступ') || text.includes('консультац');
      };
      const isComplexSla = (item) => {
        const size = safeString(item?.complexity || item?.size).toUpperCase();
        if (size === 'L' || size === 'XL') return true;
        const text = `${safeString(item?.title)} ${safeString(item?.reason)} ${safeString(item?.domain)}`.toLowerCase();
        return text.includes('слож') || text.includes('массов') || text.includes('диагност') || text.includes('передач') || text.includes('эскалац');
      };
      const getAvgOverdue = (items) => {
        const values = items.map(item => Number(item.overdueMin || item.overdueMinutes || item.overdue || 0)).filter(value => value > 0);
        return values.length > 0 ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
      };
      const getTopEntry = (counts) => Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || ['', 0];
      const getSlaAssigneeName = (value) => {
        const raw = safeString(value).trim();
        const fullName = getFullName(raw);
        return fullName && fullName !== 'Неизвестно' ? fullName : (raw || 'Неизвестно');
      };
      const primaryEasyCount = primarySlaBreaches.filter(isLikelyEasySla).length;
      const primaryComplexCount = primarySlaBreaches.filter(isComplexSla).length;
      const resolutionComplexCount = resolutionSlaBreaches.filter(isComplexSla).length;
      const primaryEasyShare = primarySlaBreaches.length > 0 ? Math.round((primaryEasyCount / primarySlaBreaches.length) * 100) : 0;
      const primaryComplexShare = primarySlaBreaches.length > 0 ? Math.round((primaryComplexCount / primarySlaBreaches.length) * 100) : 0;
      const slaReviewCounts = primarySlaBreaches.reduce((acc, item) => {
        const review = getSlaReview(item.id || item.key || item.issueKey);
        if (review) acc[review] = (acc[review] || 0) + 1;
        return acc;
      }, {});
      const slaReviewSummary = slaReviewOptions
        .filter(option => slaReviewCounts[option.value])
        .map(option => `${escapeHtml(option.label)}: <b>${slaReviewCounts[option.value]}</b>`)
        .join(', ');
      const [topPrimaryAssignee, topPrimaryAssigneeCount] = getTopEntry(countByField(primarySlaBreaches, item => getSlaAssigneeName(item.assignee || item.resolver || item.closedBy || item.owner)));
      const [topPrimaryDomain, topPrimaryDomainCount] = getTopEntry(countByField(primarySlaBreaches, item => item.domain || item.category));
      const [topPrimaryReason, topPrimaryReasonCount] = getTopEntry(countByField(primarySlaBreaches, item => item.reason || item.analysis || item.comment));
      const primaryAvgOverdue = getAvgOverdue(primarySlaBreaches);
      const resolutionAvgOverdue = getAvgOverdue(resolutionSlaBreaches);
      const slaHeat = primarySlaBreaches.length >= 50 || primaryEasyShare >= 50
        ? { label: 'Критично', color: '#dc2626', bg: '#fff7ed', border: '#fed7aa', fill: 92 }
        : (primarySlaBreaches.length >= 20 || primaryEasyShare >= 30
          ? { label: 'Риск', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', fill: 68 }
          : (primarySlaBreaches.length > 0
            ? { label: 'Контроль', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', fill: 38 }
            : { label: 'Норма', color: '#047857', bg: '#ecfdf5', border: '#a7f3d0', fill: 8 }));
      let slaDiagnosis = 'Нет деталей по основному SLA для анализа.';
      if (primarySlaBreaches.length > 0) {
        if (slaReviewCounts.reaction_discipline >= 3) {
          slaDiagnosis = `По ручной разметке основной паттерн - обращения не брали в первые 15 минут (${slaReviewCounts.reaction_discipline}). Нужен контроль очереди, статусов АТС/Jira и дежурного окна.`;
        } else if (slaReviewCounts.complexity >= 3) {
          slaDiagnosis = `По ручной разметке заметна сложность кейсов (${slaReviewCounts.complexity}). Нужен быстрый маршрут эскалации и шаблон фиксации массовых/сложных обращений.`;
        } else if (primaryEasyShare >= 35) {
          slaDiagnosis = `Высокая доля простых первичных просрочек (${primaryEasyShare}%). Это похоже на проблему реакции линии: обращения лежали до взятия в работу, а не были сложными.`;
        } else if (primaryComplexCount >= Math.ceil(primarySlaBreaches.length * 0.4)) {
          slaDiagnosis = 'Просрочки первичной реакции заметно связаны со сложными или массовыми обращениями: нужен отдельный порядок быстрой регистрации и эскалации таких кейсов.';
        } else {
          slaDiagnosis = 'Просрочки смешанные: нужно смотреть домены и смены, без вывода только по одному человеку.';
        }
      }
      const slaFocusAction = primarySlaBreaches.length === 0
        ? 'Действий не требуется: нет деталей по первичной реакции.'
        : (primaryEasyShare >= 35
          ? 'Фокус руководителя: проверить очередь первой линии и правило взятия простых обращений в первые 15 минут. Основной риск не в сложности, а в реакции на типовые обращения.'
          : (primaryComplexShare >= 40
            ? 'Фокус руководителя: отделить массовые и сложные кейсы от обычной очереди, зафиксировать быстрый маршрут эскалации и шаблон первичного ответа пользователю.'
            : 'Фокус руководителя: разобрать несколько показательных кейсов, подтвердить причину просрочки и проверить, не смешались ли дисциплина реакции и сложность.'));
      const slaAssigneeStats = Object.entries(primarySlaBreaches.reduce((acc, item) => {
        const assignee = getSlaAssigneeName(item.assignee || item.resolver || item.closedBy || item.owner);
        if (!acc[assignee]) acc[assignee] = { total: 0, easy: 0, complex: 0, overdue: [] };
        acc[assignee].total += 1;
        if (isLikelyEasySla(item)) acc[assignee].easy += 1;
        if (isComplexSla(item)) acc[assignee].complex += 1;
        const overdue = Number(item.overdueMin || item.overdueMinutes || item.overdue || 0);
        if (overdue > 0) acc[assignee].overdue.push(overdue);
        return acc;
      }, {}))
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 4);
      const renderSlaAssigneeChips = () => slaAssigneeStats
        .map(([assignee, stats]) => {
          const avg = stats.overdue.length > 0 ? Math.round(stats.overdue.reduce((sum, value) => sum + value, 0) / stats.overdue.length) : 0;
          return `<span style="display:inline-block; background:#fff; border:1px solid #e2e8f0; border-radius:999px; padding:4px 8px; font-size:11px; color:#334155; margin:3px 4px 0 0;"><b>${escapeHtml(assignee)}</b>: ${stats.total}, простые ${stats.easy}, ср. ${avg > 0 ? `+${avg}м` : '-'}</span>`;
        }).join('');
      const getSlaOverdue = (item) => Number(item.overdueMin || item.overdueMinutes || item.overdue || 0);
      const getSlaExampleReason = (item) => {
        const reviewMeta = getSlaReviewMeta(getSlaReview(item.id || item.key || item.issueKey));
        if (reviewMeta) return reviewMeta.label;
        if (isLikelyEasySla(item)) return 'Типовой кейс';
        if (isComplexSla(item)) return 'Сложный кейс';
        return 'Показательный кейс';
      };
      const selectSlaExamples = (items) => {
        const source = [...items];
        const picked = [];
        const add = (item) => {
          if (!item) return;
          const id = safeString(item.id || item.key || item.issueKey);
          if (picked.some(existing => safeString(existing.id || existing.key || existing.issueKey) === id)) return;
          picked.push(item);
        };
        add(source.filter(isLikelyEasySla).sort((a, b) => getSlaOverdue(b) - getSlaOverdue(a))[0]);
        const topAssigneeItem = topPrimaryAssignee
          ? source
              .filter(item => getSlaAssigneeName(item.assignee || item.resolver || item.closedBy || item.owner) === topPrimaryAssignee)
              .sort((a, b) => getSlaOverdue(b) - getSlaOverdue(a))[0]
          : null;
        add(topAssigneeItem);
        add(source.filter(isComplexSla).sort((a, b) => getSlaOverdue(b) - getSlaOverdue(a))[0]);
        source.sort((a, b) => getSlaOverdue(b) - getSlaOverdue(a)).forEach(add);
        return picked.slice(0, 3);
      };
      const renderSlaBreachItems = (items) => {
        const examples = selectSlaExamples(items);
        const hiddenCount = Math.max(0, items.length - examples.length);
        return `${examples.map(item => {
        const id = safeString(item.id || item.key || item.issueKey);
        const title = safeString(item.title || item.theme || item.summary || 'Без темы');
        const assignee = getSlaAssigneeName(item.assignee || item.resolver || item.closedBy || item.owner);
        const overdue = getSlaOverdue(item);
        const domain = safeString(item.domain || item.category || 'Прочее');
        const reason = safeString(item.reason || item.analysis || item.comment || '').trim();
        const exampleReason = getSlaExampleReason(item);
        const reviewMeta = getSlaReviewMeta(getSlaReview(id));
        const reviewBadge = reviewMeta ? `<span style="display: inline-block; margin-left: 5px; background: ${reviewMeta.bg}; color: ${reviewMeta.color}; border: 1px solid ${reviewMeta.border}; border-radius: 999px; padding: 1px 6px; font-size: 10px; font-weight: 900;">${escapeHtml(reviewMeta.label)}</span>` : '';
        return `
          <li style="margin-bottom: 7px;">
            <div style="display: flex; gap: 8px; align-items: baseline; flex-wrap: wrap;">
              <b style="color: #b91c1c;">${escapeHtml(id)}</b>
              <span style="color:#0f172a;">${escapeHtml(title)}</span>
              ${reviewBadge || `<span style="display:inline-block; background:#f8fafc; border:1px solid #e2e8f0; border-radius:999px; padding:1px 6px; font-size:10px; font-weight:800; color:#475569;">${escapeHtml(exampleReason)}</span>`}
            </div>
            <div style="color: #64748b; font-size: 11px; margin-top: 2px;">${escapeHtml(assignee)} · ${escapeHtml(domain)}${overdue > 0 ? ` · +${overdue} мин` : ''}${reason ? ` · ${escapeHtml(reason).slice(0, 110)}${reason.length > 110 ? '...' : ''}` : ''}</div>
            ${exportMode ? '' : renderSlaReviewControls(item)}
          </li>
        `;
        }).join('')}${hiddenCount > 0 ? `<li style="list-style:none; color:#64748b; font-size:11px; margin-top:5px;">Еще ${hiddenCount} кейсов в разборе. Полный список остается в данных SLA и AI-памяти.</li>` : ''}`;
      };
      const slaBreachHtml = slaBreachDetails.length > 0 ? `
        <h3 style="font-size: 14px; color: #475569; margin-bottom: 10px; margin-top: 20px;">SLA-температура первой реакции</h3>
        <div style="background: ${slaHeat.bg}; border: 1px solid ${slaHeat.border}; border-left: 5px solid ${slaHeat.color}; border-radius: 10px; padding: 12px 14px; margin-bottom: 14px;">
          <div style="display: flex; justify-content: space-between; gap: 16px; align-items: flex-start;">
            <div style="min-width: 0; flex: 1;">
              <div style="font-size: 12px; color: ${slaHeat.color}; font-weight: 900; text-transform: uppercase; letter-spacing: 0.04em;">Температура SLA: ${slaHeat.label}</div>
              <div style="height: 7px; background: #ffffff; border: 1px solid ${slaHeat.border}; border-radius: 999px; overflow: hidden; margin: 7px 0 8px 0;">
                <div style="height: 100%; width: ${slaHeat.fill}%; background: linear-gradient(90deg, #10b981, #f59e0b, #ef4444);"></div>
              </div>
              <div style="font-size: 12px; color: #334155; line-height: 1.45;">${escapeHtml(slaDiagnosis)}</div>
              ${slaReviewSummary ? `<div style="font-size: 11px; color: #64748b; margin-top: 5px;">Ручная память: ${slaReviewSummary}.</div>` : ''}
            </div>
            <div style="display: grid; grid-template-columns: repeat(4, minmax(64px, 1fr)); gap: 6px; min-width: 340px;">
              <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 7px; padding: 7px;"><span style="display:block; color:#64748b; font-size:8px; font-weight:900; text-transform:uppercase;">Первичная</span><b style="font-size:17px; color:#0f172a;">${primarySlaBreaches.length}</b></div>
              <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 7px; padding: 7px;"><span style="display:block; color:#64748b; font-size:8px; font-weight:900; text-transform:uppercase;">До решения</span><b style="font-size:17px; color:#0f172a;">${resolutionSlaBreaches.length}</b></div>
              <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 7px; padding: 7px;"><span style="display:block; color:#64748b; font-size:8px; font-weight:900; text-transform:uppercase;">Простые</span><b style="font-size:17px; color:#0f172a;">${primaryEasyShare}%</b></div>
              <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 7px; padding: 7px;"><span style="display:block; color:#64748b; font-size:8px; font-weight:900; text-transform:uppercase;">Сложные</span><b style="font-size:17px; color:#0f172a;">${primaryComplexShare}%</b></div>
            </div>
          </div>
          <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:8px 10px; font-size: 12px; color:#334155; margin-top:9px; line-height:1.45;">
            <b>Что делать:</b> ${escapeHtml(slaFocusAction)}
          </div>
          <div style="font-size: 11px; color: #475569; margin-top: 8px; line-height: 1.45;">
            <b>Где:</b> ${escapeHtml(topPrimaryDomain || 'нет данных')}${topPrimaryDomainCount ? ` (${topPrimaryDomainCount})` : ''} ·
            <b>Почему:</b> ${escapeHtml(topPrimaryReason || 'нет данных')}${topPrimaryReasonCount ? ` (${topPrimaryReasonCount})` : ''} ·
            <b>Кто закрывал чаще:</b> ${escapeHtml(topPrimaryAssignee || 'нет данных')}${topPrimaryAssigneeCount ? ` (${topPrimaryAssigneeCount})` : ''} ·
            <b>Ср. первичная просрочка:</b> ${primaryAvgOverdue > 0 ? `+${primaryAvgOverdue} мин` : '-'}
          </div>
          ${primarySlaBreaches.length > 0 ? `<div style="margin-top: 6px;">${renderSlaAssigneeChips()}</div>` : ''}
          <div style="border-top: 1px solid ${slaHeat.border}; margin-top: 9px; padding-top: 8px;">
            <div style="font-size: 10px; color: #64748b; font-weight: 900; text-transform: uppercase; margin-bottom: 4px;">3 показательных примера для разбора</div>
            <ul class="compact-list">
              ${renderSlaBreachItems(primarySlaBreaches.length ? primarySlaBreaches : slaBreachDetails)}
            </ul>
          </div>
        </div>
      ` : '';
      
      const telephonyHtml = visibleTelephony && visibleTelephony.length > 0 ? '' : `
        <div class="editable-box" style="background-color: #f1f5f9; border-color: #cbd5e1; color: #64748b; font-style: italic; text-align: center; margin-bottom: 30px;">
          <span contenteditable="true" style="outline: none; border-bottom: 1px dashed #cbd5e1;">[ Загрузите статистику телефонии на вкладке "Заполнить неделю" или вставьте таблицу сюда ]</span>
        </div>
      `;
      
      const reportTelephonyInsight = buildReportTelephonyInsight();
      const telephonyInsightHtml = reportTelephonyInsight ? `
        ${reportTelephonyInsight}
      ` : '';

      // КРАСИВЫЙ БЛОК ДЛЯ ДЕТАЛЬНЫХ ЗАДАЧ С УМНЫМИ БЕЙДЖАМИ И ФИЛЬТРАЦИЕЙ ИИ-ГАЛЛЮЦИНАЦИЙ
      const renderDetailedTaskCard = (t) => {
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
            "обработана задача по idm",
            "обработана задача по доступам",
            "обработана задача по ролям",
            "выполнена проверка и необходимые изменения",
            "выполнены инфраструктурные работы по серверу",
            "ресурсу, мониторингу или сервисной настройке",
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
          debtBadge = exportMode ? '' : `<span style="background-color: #f0fdf4; color: #10b981; border: 1px solid #bbf7d0; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em;">⚡ Свежая задача</span>`;
        }

        // 3. Сопоставляем с задачами руководства (умный и ЖЕСТКИЙ матчинг корней слов)
        const matchedProjectTask = findMatchingProjectTask(t);
        const isMgmtTask = Boolean(matchedProjectTask);

        let mgmtBadge = isMgmtTask 
          ? `<span style="display: inline-block; transform: rotate(-2deg); background-color: rgba(37, 99, 235, 0.05); color: #2563eb; border: 2px solid #2563eb; padding: 2px 6px; border-radius: 4px; font-weight: 800; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; margin-left: 8px;">⭐ ЗАДАЧА РУКОВОДСТВА</span>` 
          : '';

        // Выбираем цвет полоски (Синяя если от руководства, красная если долг, иначе базовая серая)
        const memoryEntry = getTaskMemoryEntry(t);
        const taskPriority = getTaskPriority(t);
        const memoryBorderColor = taskPriority === 'Impact' ? '#f59e0b' : (taskPriority === 'Routine' ? '#64748b' : '#334155');
        const memoryBgColor = taskPriority === 'Impact' ? '#fffbeb' : (taskPriority === 'Routine' ? '#f8fafc' : '#f8fafc');
        const memoryFrameColor = taskPriority === 'Impact' ? '#fde68a' : (taskPriority === 'Routine' ? '#cbd5e1' : '#cbd5e1');
        const borderColor = memoryEntry ? memoryBorderColor : (isMgmtTask ? '#2563eb' : (cycleDays >= 30 ? '#ef4444' : '#94a3b8'));
        const cardBgStyle = memoryEntry ? `background: ${memoryBgColor}; border: 1px solid ${memoryFrameColor}; border-radius: 8px; padding: 12px 12px 12px 14px;` : '';
        const isIdmTask = getTaskWorkType(t) === 'IDM';
        const complexity = getTaskComplexity(t) || 'M';
        const priorityMeta = taskPriority === 'Impact'
          ? { label: 'Важное', color: '#92400e', bg: '#fef3c7', border: '#fcd34d' }
          : (taskPriority === 'Routine'
            ? { label: 'Рутина', color: '#64748b', bg: '#f8fafc', border: '#cbd5e1' }
            : { label: 'Обычное', color: '#475569', bg: '#f8fafc', border: '#cbd5e1' });
        const complexityMeta = {
          S: { label: 'Легко', color: '#047857', bg: '#ecfdf5', border: '#a7f3d0' },
          M: { label: 'Средне', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
          L: { label: 'Сложно', color: '#c2410c', bg: '#fff7ed', border: '#fed7aa' },
          XL: { label: 'Очень сложно', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' }
        }[complexity] || { label: 'Средне', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' };
        const exportBadges = exportMode && !isIdmTask ? `
          <div style="display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 8px 0;">
            <span style="display: inline-block; background: ${priorityMeta.bg}; color: ${priorityMeta.color}; border: 1px solid ${priorityMeta.border}; border-radius: 999px; padding: 2px 7px; font-size: 10px; font-weight: 900; text-transform: uppercase;">${priorityMeta.label}</span>
            <span style="display: inline-block; background: ${complexityMeta.bg}; color: ${complexityMeta.color}; border: 1px solid ${complexityMeta.border}; border-radius: 999px; padding: 2px 7px; font-size: 10px; font-weight: 900; text-transform: uppercase;">${complexityMeta.label}</span>
          </div>
        ` : '';
        const taskMetaBadges = [debtBadge, mgmtBadge].filter(Boolean).join(' ');
        const taskMetaBadgesHtml = taskMetaBadges ? `<span style="color: #cbd5e1;">|</span> ${taskMetaBadges}` : '';

        return `
          <div style="${cardBgStyle} margin-bottom: 24px; border-left: 4px solid ${borderColor}; border-bottom: 1px solid #e2e8f0; padding-left: 14px; padding-bottom: 16px;">
             <div style="font-weight: 700; font-size: 14px; color: #0f172a; margin-bottom: 6px;">
               <span style="color: #3b82f6;">${t.id}</span>: ${safeString(t.title)}
             </div>
             ${exportBadges}
             ${exportMode ? '' : renderPriorityControls(t)}
             ${exportMode ? '' : renderComplexityControls(t)}
             ${exportMode ? '' : renderWorkTypeControls(t)}
             ${exportMode ? '' : renderMemoryStatusControls(t)}
             ${exportMode ? '' : renderReportBucketBadge(t)}
             <div style="font-size: 12px; color: #64748b; display: flex; align-items: center; flex-wrap: wrap; gap: 8px;">
               <span>Исполнитель: <span style="font-weight: 600; color: #1e293b;">${getFullName(t.assignee)}</span></span>
               ${taskMetaBadgesHtml}
             </div>
             ${contextHtml}
          </div>
        `;
      };

      const renderIdmTaskCard = (t) => {
        const cycleDays = Number(t.cycleTime) || 0;
        const debtBadge = cycleDays >= 30
          ? `<span style="background-color: #fef2f2; color: #ef4444; border: 1px solid #fecaca; padding: 2px 6px; border-radius: 999px; font-weight: 800; font-size: 10px; text-transform: uppercase;">старый долг ${cycleDays} дн.</span>`
          : '';
        return `
          <div class="idm-task-card">
            <div style="font-weight: 800; font-size: 13px; color: #0f172a; line-height: 1.35;">
              <span style="color: #7c3aed;">${escapeHtml(t.id)}</span>: ${escapeHtml(t.title)}
            </div>
            <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-top: 7px; color: #64748b; font-size: 12px;">
              <span>Исполнитель: <span style="font-weight: 700; color: #334155;">${escapeHtml(getFullName(t.assignee))}</span></span>
              ${debtBadge}
            </div>
          </div>
        `;
      };

      const renderTaskGroup = ({ title, subtitle, accent, background = '#ffffff', tasks, renderer = renderDetailedTaskCard }) => {
        if (!tasks || tasks.length === 0) return '';
        return `
          <div class="task-group" style="--group-accent: ${accent}; background: ${background};">
            <div class="task-group-header">
              <div>
                <div class="task-group-title">${escapeHtml(title)}</div>
                <div class="task-group-subtitle">${escapeHtml(subtitle)}</div>
              </div>
              <div class="task-group-count">${tasks.length}</div>
            </div>
            <div class="task-group-body">
              ${tasks.map(renderer).join('')}
            </div>
          </div>
        `;
      };

      const renderMainTaskGroups = (tasks) => {
        const importantHeavyTasks = tasks.filter(t => getTaskPriority(t) === 'Impact' && ['L', 'XL'].includes(getTaskComplexity(t)));
        const importantMediumTasks = tasks.filter(t => getTaskPriority(t) === 'Impact' && getTaskComplexity(t) === 'M');
        const importantLightTasks = tasks.filter(t => getTaskPriority(t) === 'Impact' && !['M', 'L', 'XL'].includes(getTaskComplexity(t)));
        const heavyTasks = tasks.filter(t => getTaskPriority(t) !== 'Impact' && ['L', 'XL'].includes(getTaskComplexity(t)));
        const standardTasks = tasks.filter(t => getTaskPriority(t) === 'Standard' && !['L', 'XL'].includes(getTaskComplexity(t)));

        return [
          renderTaskGroup({
            title: 'Важные сложные',
            subtitle: 'Высокий эффект и высокая трудоемкость',
            accent: '#f59e0b',
            background: '#fffbeb',
            tasks: importantHeavyTasks
          }),
          renderTaskGroup({
            title: 'Важные средние',
            subtitle: 'Заметные задачи без перегруза основного отчета',
            accent: '#3b82f6',
            background: '#eff6ff',
            tasks: importantMediumTasks
          }),
          renderTaskGroup({
            title: 'Важные быстрые',
            subtitle: 'Важные, но небольшие изменения',
            accent: '#10b981',
            background: '#ecfdf5',
            tasks: importantLightTasks
          }),
          renderTaskGroup({
            title: 'Трудоемкие без флага важности',
            subtitle: 'Сложные задачи, которые стоит показать даже без флага важности',
            accent: '#f97316',
            background: '#fff7ed',
            tasks: heavyTasks
          }),
          renderTaskGroup({
            title: 'Обычные рабочие задачи',
            subtitle: 'Standard: нормальная выполненная работа без отдельного управленческого акцента',
            accent: '#64748b',
            background: '#f8fafc',
            tasks: standardTasks
          })
        ].join('');
      };

      const detailedTasksHtmlRendered = exportMode
        ? renderMainTaskGroups(keyDetailedTasks)
        : keyDetailedTasks.map(renderDetailedTaskCard).join('');

      const idmTasksHtmlRendered = idmDetailedTasks.length > 0 ? `
        <h3 style="font-size: 14px; color: #475569; margin-bottom: 10px; margin-top: 20px;">Задачи по IDM</h3>
        ${exportMode ? renderTaskGroup({
          title: 'IDM / роли и доступы',
          subtitle: 'Отдельный поток задач по ролям, доступам, IDM CUSTOM и ролевой модели',
          accent: '#7c3aed',
          background: '#f5f3ff',
          tasks: idmDetailedTasks,
          renderer: renderIdmTaskCard
        }) : `<div>${idmDetailedTasks.map(renderDetailedTaskCard).join('')}</div>`}
      ` : '';

      const routineTasksHtmlRendered = routineDetailedTasks.length > 0 ? `
        <div class="task-group task-group-compact" style="--group-accent: #94a3b8; background: #f8fafc;">
          <div class="task-group-header">
            <div>
              <div class="task-group-title">Рутинные задачи</div>
              <div class="task-group-subtitle">Только явно помеченная Routine/KTLO: видима, но не забивает список результатов</div>
            </div>
            <div class="task-group-count">${routineDetailedTasks.length}</div>
          </div>
          <ul style="margin: 12px 0 0 18px; padding: 0; color: #64748b; font-size: 11px; line-height: 1.45;">
            ${routineDetailedTasks.map(t => {
              const complexity = getTaskComplexity(t) || 'M';
              return `
                <li style="margin-bottom: 7px;">
                  <span style="font-weight: 800; color: #475569;">${escapeHtml(t.id)}</span>
                  <span style="display: inline-block; margin-left: 5px; color: #64748b; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 999px; padding: 1px 5px; font-size: 9px; font-weight: 800;">Рутина</span>
                  <span style="display: inline-block; margin-left: 3px; color: #64748b; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 999px; padding: 1px 5px; font-size: 9px; font-weight: 800;">${escapeHtml(getTaskSizeLabel(complexity))}</span>
                  <span style="color: #94a3b8;"> / ${escapeHtml(getFullName(t.assignee))}</span>
                  <span style="color: #94a3b8;"> — ${escapeHtml(t.title)}</span>
                  ${exportMode ? '' : renderPriorityControls(t)}
                  ${exportMode ? '' : renderComplexityControls(t)}
                </li>
              `;
            }).join('')}
          </ul>
        </div>
      ` : '';

      const renderExecutiveSummaryItem = (title, text) => `
        <div class="executive-summary-item">
          <b>${escapeHtml(title)}</b>
          <div>${escapeHtml(safeString(text).trim() || 'Нет данных').replace(/\n/g, '<br/>')}</div>
        </div>
      `;
      const blockersAndWasteText = safeString(reportData.blockersAndWaste).trim();

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
          .section-title { font-size: 16px; font-weight: 800; border-left: 5px solid var(--accent); padding: 11px 12px; margin: 42px 0 18px 0; text-transform: uppercase; color: #0f172a; background: #f8fafc; border-top: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; border-radius: 8px; letter-spacing: 0.02em; }
          .editable-box { background: #fffbeb; border: 1px dashed #f59e0b; border-radius: 8px; padding: 15px; font-size: 13px; color: #92400e; margin-bottom: 30px; font-style: italic; text-align: center; }
          .incident-card { background: #f8fafc; border-left: 3px solid #f59e0b; padding: 10px; margin-bottom: 10px; border-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
          .csat-hover-wrap { display: inline-block; position: relative; margin: 8px 0 18px 0; }
          .csat-summary-pill { display: inline-block; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 999px; padding: 5px 10px; color: #475569; font-size: 12px; font-weight: 800; cursor: default; }
          .csat-popover { display: none; position: absolute; z-index: 20; left: 0; top: 30px; width: 620px; max-height: 360px; overflow-y: auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 10px; box-shadow: 0 18px 50px rgba(15, 23, 42, 0.18); padding: 14px; }
          .csat-hover-wrap:hover .csat-popover { display: block; }
          .report-csat-cell { display: inline-block; position: relative; cursor: default; }
          .report-csat-score { display: inline-flex; align-items: center; gap: 3px; color: #0f172a; font-weight: 800; white-space: nowrap; }
          .report-csat-popover { display: none; position: absolute; z-index: 40; right: 0; top: 24px; width: 520px; max-height: 340px; overflow-y: auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 10px; box-shadow: 0 18px 50px rgba(15, 23, 42, 0.22); padding: 14px; }
          .report-csat-cell:hover .report-csat-popover { display: block; }
          .value-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-bottom: 20px; }
          .value-summary { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-left: 5px solid #10b981; border-radius: 10px; padding: 12px 14px; margin-bottom: 12px; }
          .value-summary-title { color: #0f172a; font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.03em; margin-bottom: 3px; }
          .value-summary-text { color: #475569; font-size: 12px; line-height: 1.45; }
          .value-summary-stats { flex-shrink: 0; display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
          .value-summary-stats span { display: inline-block; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 999px; padding: 4px 8px; color: #475569; font-size: 11px; font-weight: 800; }
          .value-summary-stats b { color: #0f172a; }
          .value-card { border: 1px solid #e2e8f0; border-top: 4px solid #64748b; border-radius: 8px; padding: 12px; min-height: 104px; }
          .task-group { border: 1px solid #e2e8f0; border-left: 5px solid var(--group-accent); border-radius: 10px; padding: 14px 16px; margin: 16px 0 18px 0; box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06); }
          .task-group-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; border-bottom: 1px solid rgba(148, 163, 184, 0.35); padding-bottom: 10px; margin-bottom: 12px; }
          .task-group-title { color: #0f172a; font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.03em; }
          .task-group-subtitle { color: #64748b; font-size: 12px; margin-top: 2px; }
          .task-group-count { flex-shrink: 0; color: var(--group-accent); background: #ffffff; border: 1px solid #e2e8f0; border-radius: 999px; padding: 3px 9px; font-size: 12px; font-weight: 900; }
          .task-group-body > div:last-child { margin-bottom: 0 !important; }
          .task-group-compact { box-shadow: none; }
          .impact-tasks-scroll { max-height: 800px; overflow-y: auto; padding-right: 8px; }
          .impact-tasks-scroll::-webkit-scrollbar { width: 8px; }
          .impact-tasks-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }
          .executive-summary { background: #f8fafc; border: 1px solid #e2e8f0; border-left: 5px solid #0f172a; border-radius: 10px; padding: 16px; margin-bottom: 26px; }
          .executive-summary-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
          .executive-summary-col { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
          .executive-summary-col-title { color: #0f172a; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 9px; }
          .executive-summary-item { color: #475569; font-size: 12px; line-height: 1.5; padding-bottom: 10px; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; }
          .executive-summary-item:last-child { border-bottom: 0; padding-bottom: 0; margin-bottom: 0; }
          .executive-summary-item b { display: block; color: #0f172a; margin-bottom: 3px; }
          .executive-blockers { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 11px 12px; color: #9a3412; font-size: 12px; line-height: 1.5; margin-top: 12px; }
          .idm-task-card { background: #ffffff; border: 1px solid #ddd6fe; border-left: 4px solid #7c3aed; border-radius: 8px; padding: 12px 14px; margin-bottom: 10px; }
          .telephony-panel { background: #ffffff; border: 1px solid #e2e8f0; border-left: 5px solid #2563eb; border-radius: 10px; padding: 16px; margin-bottom: 30px; box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06); }
          .telephony-panel-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 12px; }
          .telephony-panel-title { color: #0f172a; font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.03em; }
          .telephony-panel-subtitle { color: #64748b; font-size: 12px; margin-top: 2px; }
          .telephony-summary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-bottom: 14px; }
          .telephony-summary-grid div { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 9px 10px; }
          .telephony-summary-grid span, .telephony-metrics span { display: block; color: #64748b; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; }
          .telephony-summary-grid b { display: block; color: #0f172a; font-size: 18px; margin-top: 2px; }
          .corporate-achievements { background: #fffbeb; border: 1px solid #fde68a; border-left: 5px solid #f59e0b; border-radius: 10px; padding: 12px; margin: 0 0 14px 0; }
          .corporate-achievements-title { color: #92400e; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 8px; }
          .corporate-achievements-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
          .corporate-achievement-card { background: #ffffff; border: 1px solid #fde68a; border-radius: 8px; padding: 10px; }
          .telephony-operators-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
          .telephony-operator-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
          .telephony-operator-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 9px; }
          .telephony-metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; }
          .telephony-metrics div { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 7px; }
          .telephony-metrics b { display: block; color: #0f172a; font-size: 13px; margin-top: 2px; white-space: nowrap; }
          .correlation-panel { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-bottom: 20px; }
          .correlation-card { background: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid #d97706; border-radius: 8px; padding: 12px; }
          .compact-list { padding-left: 16px; margin: 7px 0 0 0; color: #334155; font-size: 12px; line-height: 1.45; }
          .compact-list li { margin-bottom: 4px; }
          .solution-hints { background: #ecfeff; border: 1px solid #a5f3fc; border-radius: 8px; padding: 9px; margin-top: 9px; }
          .skill-matrix-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-bottom: 20px; }
          .skill-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
          .mini-size-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 5px; }
          .mini-size-grid div { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 5px; text-align: center; }
          .mini-size-grid span { display: block; color: #64748b; font-size: 9px; font-weight: 900; }
          .mini-size-grid b { display: block; color: #0f172a; font-size: 13px; }
          ul.custom-list { padding-left: 20px; margin-top: 5px; list-style-type: square; font-size: 13px; color: #334155; }
          ul.custom-list li { margin-bottom: 6px; }
        </style>

        <div class="report-container">
          
          <div class="header">
            <h1 style="margin: 0 0 5px 0; font-size: 24px; color: #0f172a; text-transform: uppercase;">ОТЧЕТ РУКОВОДИТЕЛЮ</h1>
            <p style="margin: 0; color: #64748b; font-size: 14px;">Статус направления технической поддержки ОСО | Неделя ${weekData.weekNumber} (${safeString(weekData.dates)})</p>
          </div>

          <div style="padding: 0 10px;">

            <div class="section-title" style="--accent: #0f172a;">1. Executive Summary: Риски и Стратегия</div>
            <div class="executive-summary">
              <div class="executive-summary-grid">
                <div class="executive-summary-col">
                  <div class="executive-summary-col-title">Первая линия</div>
                  ${renderExecutiveSummaryItem('Статус потока (1-я линия):', reportData.incidentSummary)}
                  ${renderExecutiveSummaryItem('Драйверы и риски инцидентов:', reportData.incidentRisks)}
                </div>
                <div class="executive-summary-col">
                  <div class="executive-summary-col-title">Задачи на развитие</div>
                  ${renderExecutiveSummaryItem('Главные достижения (Проекты):', reportData.sprintWin)}
                  ${renderExecutiveSummaryItem('Зоны внимания (Задачи):', reportData.sprintRisk)}
                </div>
              </div>
              ${blockersAndWasteText ? `
                <div class="executive-blockers">
                  <b style="display:block; color:#9a3412; margin-bottom:4px;">Препятствия и потери</b>
                  ${escapeHtml(blockersAndWasteText).replace(/\n/g, '<br/>')}
                </div>
              ` : ''}
            </div>

            <div class="section-title" style="--accent: #3b82f6;">Операционная сводка (KPI)</div>
            
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
                <div style="font-size: 12px; color: #64748b;">Приток: ${Number(weekData.inflowThisWeek) || 0} новых | Бэклог: ${weekData.backlog || 0} (>30д: ${weekData.backlogOld30 || 0})</div>
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

            <div class="section-title" style="--accent: #f59e0b;">2. Проекты и поручения руководства</div>
            <div id="management-tasks-container">
               ${generateTasksHtml()}
            </div>

            <div class="section-title" style="--accent: #0e7490;">3. Эффективность команды и матрица компетенций</div>
            ${renderResourceAuditReport()}

            <div class="section-title" style="--accent: #a855f7;">4. Детализация инженерных работ (Impact)</div>
            
            ${weekData.taskTypesDistribution && weekData.taskTypesDistribution.length > 0 ? `
              <h3 style="font-size: 14px; color: #475569; margin-bottom: 10px;">Распределение фокуса (Ценность vs Рутина)</h3>
              ${renderPieChart()}
              <div style="margin-bottom: 20px;"></div>
            ` : ''}

            <h3 style="font-size: 14px; color: #475569; margin-bottom: 10px;">Нагрузка администраторов (без учета тимлида)</h3>
            <p style="font-size: 12px; color: #64748b; margin-bottom: 10px;"><i>Администраторы, отмеченные значком 🔥, находятся в зоне риска выгорания (перегруз).</i></p>
            ${generateTableHtml(['Администратор', 'В работе (WIP)', 'Закрыто', 'Cycle Time', 'Профиль'], taskRows.slice(0, 7))}
            ${renderValueShowcase()}

            ${keyDetailedTasks.length > 0 ? `
              <p style="font-size: 12px; font-weight: bold; color: #475569; margin-bottom: 10px;">Автоматическая сводка из Jira:</p>
              <div class="impact-tasks-scroll">
                ${detailedTasksHtmlRendered}
              </div>
            ` : (completedDetailedTasks.length > 0 ? '<p style="font-size: 13px; color: #64748b; font-style: italic;">Все закрытые задачи помечены как фоновая поддержка и вынесены в KTLO-блок.</p>' : '')}
            ${idmTasksHtmlRendered}

            <div class="section-title" style="--accent: #10b981;">5. Контроль качества (1-я линия)</div>
            
            <h3 style="font-size: 14px; color: #475569; margin-bottom: 10px;">Эффективность смен (без учета тимлида)</h3>
            <p style="font-size: 12px; color: #64748b; margin-bottom: 10px;"><i>Администраторы, отмеченные значком 🔥, находятся в зоне риска выгорания (перегруз).</i></p>
            ${generateTableHtml(['Администратор', 'Закрыто', 'Ср. Время', 'Профиль', 'CSAT'], incRows.slice(0, 5))}
            ${csatFeedbackHtml}

            <h3 style="font-size: 14px; color: #475569; margin-bottom: 10px; margin-top: 20px;">Ключевые системные проблемы (Топ-3)</h3>
            ${topIncidentsHtml || '<p style="font-size: 13px; color: #64748b;">Нет данных</p>'}
            ${slaBreachHtml}

            <h3 style="font-size: 14px; color: #475569; margin-bottom: 10px; margin-top: 20px;">Сводка по Телефонии</h3>
            ${telephonyHtml}
            ${telephonyInsightHtml}

            <div class="section-title" style="--accent: #94a3b8;">6. Фоновая поддержка (KTLO)</div>
            ${routineTasksHtmlRendered || '<p style="font-size: 13px; color: #64748b;">Нет задач, явно помеченных как KTLO/Routine.</p>'}

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
  }, [weekData, aiTaskMemory, teamMetricsMemory]);

  useEffect(() => {
    const reportEl = reportRef.current;
    if (!reportEl) return;
    const handleAiMemoryClick = (event) => {
      const priorityButton = event.target.closest('[data-task-priority]');
      const complexityButton = event.target.closest('[data-task-complexity]');
      const workTypeButton = event.target.closest('[data-task-work-type]');
      const workTypeClearButton = event.target.closest('[data-task-work-type-clear]');
      const clearButton = event.target.closest('[data-task-memory-clear]');
      const slaReviewButton = event.target.closest('[data-sla-review]');
      const slaReviewClearButton = event.target.closest('[data-sla-review-clear]');
      const button = priorityButton || complexityButton || workTypeButton || workTypeClearButton || clearButton || slaReviewButton || slaReviewClearButton;
      if (!button || !reportEl.contains(button)) return;
      event.preventDefault();
      event.stopPropagation();
      if (priorityButton) {
        handleSetTaskPriority(button.dataset.taskId, button.dataset.taskTitle, button.dataset.taskPriority);
      } else if (complexityButton) {
        handleSetTaskComplexity(button.dataset.taskId, button.dataset.taskTitle, button.dataset.taskComplexity);
      } else if (workTypeButton) {
        handleSetTaskWorkType(button.dataset.taskId, button.dataset.taskTitle, button.dataset.taskWorkType);
      } else if (workTypeClearButton) {
        handleClearTaskWorkType(button.dataset.taskId);
      } else if (slaReviewButton) {
        handleSetSlaReview(button.dataset.slaId, button.dataset.slaTitle, button.dataset.slaReview);
      } else if (slaReviewClearButton) {
        handleClearSlaReview(button.dataset.slaId);
      } else {
        handleClearTaskMemory(button.dataset.taskId);
      }
    };
    reportEl.addEventListener('click', handleAiMemoryClick);
    return () => reportEl.removeEventListener('click', handleAiMemoryClick);
  }, [aiTaskMemory]);

  // Функция для очистки HTML перед экспортом
  const getCleanHtml = () => {
    if (!reportRef.current) return '';
    const clone = document.createElement('div');
    clone.innerHTML = weekData.isReportFrozen && weekData.customReportHtml
      ? reportRef.current.innerHTML
      : getReportHtmlString({ exportMode: true });
    
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
                const isCompleted = isProjectTaskCompletedInWeek(t, selectedKey);
                const agingMeta = getProjectTaskAgingMeta(weeksActive);
                
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
                          {!isCompleted && (
                             <div
                               className="text-[10px] font-bold flex items-center gap-1 mt-2 w-max px-2 py-0.5 rounded border"
                               style={{ backgroundColor: agingMeta.bg, color: agingMeta.color, borderColor: agingMeta.border }}
                               title={agingMeta.note}
                             >
                               <AlertTriangle size={12}/> {agingMeta.label}
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
            <button onClick={handleDownloadAiMemory} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2.5 rounded-lg transition-colors shadow-lg flex items-center gap-2" title="Скачать базу классификации задач для ИИ">
              <Download size={18} /> <span className="hidden sm:inline">🧠 Скачать AI-Память</span>
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

const TeamAnalytics = ({ teamMetricsMemory, setTeamMetricsMemory }) => {
  const fileInputRef = useRef(null);
  const [importResult, setImportResult] = useState(null);
  const [taskSearch, setTaskSearch] = useState('');
  const [showCalibratedTasks, setShowCalibratedTasks] = useState(false);
  const rows = buildTeamMetricRows(teamMetricsMemory);
  const domainRankMap = buildDomainRankMap(rows);
  const totalWeight = rows.reduce((sum, row) => sum + row.totalWeight, 0);
  const totalTasks = rows.reduce((sum, row) => sum + row.totalTasks, 0);
  const avgContribution = rows.length > 0 ? Math.round(rows.reduce((sum, row) => sum + row.contributionIndex, 0) / rows.length) : 0;
  const podiumRows = rows.slice(0, 3);
  const tableRows = rows;
  const editableTasks = rows
    .flatMap(row => (row.taskDetails || []).map(task => ({ ...task, assignee: row.name })))
    .filter(task => {
      const query = normalizeMetricText(taskSearch);
      const matchesQuery = !query || normalizeMetricText(`${task.id} ${task.title} ${task.assignee} ${task.domain}`).includes(query);
      const calibrated = Boolean(task.manualSize && task.manualDomain);
      return matchesQuery && (showCalibratedTasks || !calibrated);
    })
    .slice(0, 10);
  const tasksWithDetails = rows.reduce((sum, row) => sum + (row.taskDetails?.length || 0), 0);
  const calibratedTasksCount = rows.reduce((sum, row) => sum + (row.taskDetails || []).filter(task => task.manualSize && task.manualDomain).length, 0);

  const handleHistoryFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const tasks = parseHistoryInputToTasks(text);
      const { memory, stats } = mergeTasksIntoTeamMetrics(teamMetricsMemory, tasks);
      setTeamMetricsMemory(memory);
      setImportResult({ type: 'success', fileName: file.name, ...stats });
    } catch (e) {
      console.error('Team history import error:', e);
      setImportResult({ type: 'error', fileName: file.name, added: 0, skipped: 0, employees: 0 });
    } finally {
      event.target.value = '';
      setTimeout(() => setImportResult(null), 6000);
    }
  };

  const handleStoredTaskSize = (assignee, taskId, size) => {
    const cleanSize = normalizeTaskSize(size);
    if (!cleanSize || !assignee || !taskId) return;
    setTeamMetricsMemory(prev => {
      const next = JSON.parse(JSON.stringify(prev || {}));
      const row = next[assignee];
      if (!row?.taskDetails?.[taskId]) return prev || {};
      row.taskDetails[taskId].size = cleanSize;
      row.taskDetails[taskId].weight = TEAM_METRIC_SIZE_WEIGHTS[cleanSize] || TEAM_METRIC_SIZE_WEIGHTS.M;
      row.taskDetails[taskId].manualSize = true;
      row.taskDetails[taskId].updatedAt = new Date().toISOString();
      row.updatedAt = new Date().toISOString();
      return next;
    });
  };

  const handleStoredTaskDomain = (assignee, taskId, domain) => {
    const cleanDomain = TEAM_DOMAIN_OPTIONS.includes(domain) ? domain : normalizeMetricDomain(domain, '');
    if (!cleanDomain || !assignee || !taskId) return;
    setTeamMetricsMemory(prev => {
      const next = JSON.parse(JSON.stringify(prev || {}));
      const row = next[assignee];
      if (!row?.taskDetails?.[taskId]) return prev || {};
      row.taskDetails[taskId].domain = cleanDomain;
      row.taskDetails[taskId].manualDomain = true;
      row.taskDetails[taskId].updatedAt = new Date().toISOString();
      row.updatedAt = new Date().toISOString();
      return next;
    });
  };

  const handleResetTaskCalibration = (assignee, taskId) => {
    if (!assignee || !taskId) return;
    setTeamMetricsMemory(prev => {
      const next = JSON.parse(JSON.stringify(prev || {}));
      const row = next[assignee];
      const task = row?.taskDetails?.[taskId];
      if (!task) return prev || {};
      const fallbackSize = normalizeTaskSize(task.originalSize) || normalizeTaskSize(task.size) || 'M';
      const fallbackDomain = normalizeMetricDomain(task.originalDomain || '', task.title || '') || normalizeMetricDomain('', task.title || '') || 'Прочее';
      task.size = fallbackSize;
      task.weight = TEAM_METRIC_SIZE_WEIGHTS[fallbackSize] || TEAM_METRIC_SIZE_WEIGHTS.M;
      task.domain = fallbackDomain;
      task.manualSize = false;
      task.manualDomain = false;
      task.updatedAt = new Date().toISOString();
      row.updatedAt = new Date().toISOString();
      return next;
    });
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Команда</h1>
          <p className="text-slate-400 text-sm">Аудит админов, грейдирование и историческая матрица компетенций</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input ref={fileInputRef} type="file" accept=".json,.csv,.txt" onChange={handleHistoryFile} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-lg flex items-center justify-center gap-2">
            <DownloadCloud size={16} /> Загрузить историю за год (JSON/CSV)
          </button>
        </div>
      </div>

      {importResult && (
        <div className={`mb-6 rounded-xl border p-4 ${importResult.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100' : 'bg-red-500/10 border-red-500/30 text-red-100'}`}>
          {importResult.type === 'success'
            ? `Импортировано: ${importResult.added}. Дубликаты/пропуски: ${importResult.skipped}. Обновлено сотрудников: ${importResult.employees}. Файл: ${importResult.fileName}.`
            : `Не удалось разобрать файл ${importResult.fileName}. Проверь JSON или CSV-колонки.`}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700/50">
          <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Исторический объем</div>
          <div className="text-3xl font-black text-white mt-2">{totalWeight}</div>
          <div className="text-xs text-slate-400 mt-1">баллов по {totalTasks} задачам</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700/50">
          <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Средний админский вклад</div>
          <div className="text-3xl font-black text-cyan-300 mt-2">{avgContribution}</div>
          <div className="text-xs text-slate-400 mt-1">объем + сложность + эффект</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700/50">
          <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Покрытие команды</div>
          <div className="text-3xl font-black text-emerald-300 mt-2">{rows.length}</div>
          <div className="text-xs text-slate-400 mt-1">сотрудников в исторической памяти</div>
        </div>
      </div>

      <div className="bg-slate-800/70 border border-slate-700/50 rounded-xl p-4 mb-6 text-sm text-slate-300 leading-relaxed">
        <div className="font-bold text-white mb-1">Как читать этот экран</div>
        <div className="text-slate-400">
          Это не автоматическое кадровое решение, а калиброванный срез работы системных админов: объем показывает устойчивый вклад, сложность - инфраструктурные работы повышенной трудоемкости, важные задачи - эффект для сервиса, безопасности или снижения ручного труда. Для решений по окладу сначала проверьте ручную разметку задач и домены, затем используйте рейтинг как доказательную базу.
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="bg-slate-800/60 border border-dashed border-slate-700 rounded-xl p-10 text-center">
          <Users size={44} className="text-slate-600 mx-auto mb-4" />
          <div className="text-slate-300 font-bold">История компетенций пока не загружена</div>
          <div className="text-slate-500 text-sm mt-2">Загрузите JSON с `detailedTasks` или CSV с исполнителем, доменом, размером и важностью.</div>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Award size={20} className="text-amber-400" /> Лидеры админского вклада</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {podiumRows.map((row, index) => {
                const rankColors = [
                  'border-amber-300 bg-amber-500/10 shadow-[0_0_34px_rgba(245,158,11,0.22)]',
                  'border-cyan-300 bg-cyan-500/10 shadow-[0_0_30px_rgba(34,211,238,0.18)]',
                  'border-slate-500 bg-slate-700/30'
                ];
                const rankLabels = ['1 место · лидер админского вклада', '2 место · сильный вклад', '3 место · стабильный вклад'];
                return (
                  <div key={`podium-${row.name}`} className={`rounded-xl border p-5 ${rankColors[index] || 'border-slate-700 bg-slate-800'}`}>
                    <div className="flex justify-between items-start gap-3 mb-4">
                      <div>
                        <div className="text-xs uppercase font-black tracking-wider text-slate-400">{rankLabels[index]}</div>
                        <div className="text-lg font-black text-white mt-1">{index === 0 ? '🏆 ' : index === 1 ? '✦ ' : ''}{row.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-4xl font-black text-cyan-300">{row.contributionIndex}</div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold">Админский вклад</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center mb-4">
                      <div className="bg-slate-950/60 rounded border border-slate-700 p-2"><div className="text-[10px] text-slate-500 uppercase font-bold">Важные</div><div className="text-white font-black">{row.impactShare}%</div></div>
                      <div className="bg-slate-950/60 rounded border border-slate-700 p-2"><div className="text-[10px] text-slate-500 uppercase font-bold">Сложные</div><div className="text-white font-black">{row.heavyWeightShare}%</div></div>
                      <div className="bg-slate-950/60 rounded border border-slate-700 p-2"><div className="text-[10px] text-slate-500 uppercase font-bold">Баллы</div><div className="text-white font-black">{row.totalWeight}</div></div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {row.topDomains.slice(0, 2).map(([domain, score]) => {
                        const share = row.totalWeight > 0 ? Math.round(((Number(score) || 0) / row.totalWeight) * 100) : 0;
                        const rank = getDomainRank(domainRankMap, domain, row.name);
                        const badge = getExpertiseBadge(score, rank, share);
                        return <span key={`podium-${row.name}-${domain}`} className="px-2.5 py-1 rounded-full text-[11px] font-bold border" style={{ background: badge.bg, color: badge.color, borderColor: badge.border }}>{badge.icon} {domain}: {score}</span>;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700/50 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700/50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Рейтинг команды</h2>
              <span className="text-xs text-slate-500">накоплено за все время</span>
            </div>
            <div className="divide-y divide-slate-700/50">
              {tableRows.map((row, idx) => (
                <div key={`team-row-${row.name}`} className="grid grid-cols-12 gap-3 px-5 py-4 items-center">
                  <div className="col-span-1 text-slate-500 font-black">#{idx + 1}</div>
                  <div className="col-span-3">
                    <div className="font-bold text-white">{row.name}</div>
                    <div className="text-xs text-slate-500">{row.totalTasks} задач · {row.totalWeight} баллов</div>
                  </div>
                  <div className="col-span-2 text-cyan-300 font-black text-xl">{row.contributionIndex}</div>
                  <div className="col-span-2 text-sm text-slate-300">Важные {row.impactShare}%<br/><span className="text-slate-500">Сложные {row.heavyWeightShare}%</span></div>
                  <div className="col-span-4 flex flex-wrap gap-2">
                    {row.topDomains.slice(0, 2).map(([domain, score]) => {
                      const share = row.totalWeight > 0 ? Math.round(((Number(score) || 0) / row.totalWeight) * 100) : 0;
                      const rank = getDomainRank(domainRankMap, domain, row.name);
                      const badge = getExpertiseBadge(score, rank, share);
                      return <span key={`table-${row.name}-${domain}`} className="px-2.5 py-1 rounded-full text-[11px] font-bold border" style={{ background: badge.bg, color: badge.color, borderColor: badge.border }}>{badge.icon} {domain}: {score} · {badge.label}</span>;
                    })}
                  </div>
                </div>
              ))}
              {tableRows.length === 0 && <div className="px-5 py-4 text-slate-500 text-sm">Сотрудников пока нет в исторической памяти.</div>}
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700/50 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700/50 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">Ручная калибровка задач</h2>
                <p className="text-xs text-slate-500 mt-1">Размечайте по 10 задач: сложность и домен сохраняются в историческую память. После полной разметки задача исчезает из очереди.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                <button
                  type="button"
                  onClick={() => setShowCalibratedTasks(prev => !prev)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold border ${showCalibratedTasks ? 'bg-cyan-500 text-slate-950 border-cyan-300' : 'bg-slate-950 text-slate-300 border-slate-700 hover:border-cyan-500'}`}
                >
                  {showCalibratedTasks ? 'Скрыть размеченные' : 'Показать размеченные'}
                </button>
                <input
                  value={taskSearch}
                  onChange={(event) => setTaskSearch(event.target.value)}
                  placeholder="Поиск по IS, ФИО, домену..."
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-500 w-full lg:w-72"
                />
              </div>
            </div>
            <div className="px-5 py-3 bg-slate-900/40 text-xs text-slate-500 border-b border-slate-700/50">
              Всего задач с деталями: {tasksWithDetails}. Полностью размечено: {calibratedTasksCount}. Сейчас показано: {editableTasks.length}. Если список пустой, импортируйте историю заново, чтобы память получила детализацию задач.
            </div>
            <div className="divide-y divide-slate-700/50 max-h-[520px] overflow-y-auto custom-scrollbar">
              {editableTasks.map(task => (
                <div key={`task-edit-${task.assignee}-${task.id}`} className="grid grid-cols-12 gap-3 px-5 py-3 items-center">
                  <div className="col-span-12 lg:col-span-5">
                    <div className="text-sm font-bold text-white"><span className="text-cyan-300">{task.id}</span> {safeString(task.title).slice(0, 120)}</div>
                    <div className="text-xs text-slate-500 mt-1">{task.assignee} · {task.domain || 'Прочее'} · {task.impact ? 'важная' : 'обычная'}</div>
                  </div>
                  <div className="col-span-12 lg:col-span-3">
                    <select
                      value={TEAM_DOMAIN_OPTIONS.includes(task.domain) ? task.domain : normalizeMetricDomain(task.domain || '', task.title || '')}
                      onChange={(event) => handleStoredTaskDomain(task.assignee, task.id, event.target.value)}
                      className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-xs font-bold outline-none ${task.manualDomain ? 'border-emerald-400 text-emerald-200' : 'border-slate-700 text-slate-300 focus:border-cyan-500'}`}
                    >
                      {TEAM_DOMAIN_OPTIONS.map(domain => <option key={`domain-${task.id}-${domain}`} value={domain}>{domain}</option>)}
                    </select>
                  </div>
                  <div className="col-span-10 lg:col-span-3 flex flex-wrap justify-start lg:justify-end gap-2">
                    {['S', 'M', 'L', 'XL'].map(size => (
                      <button
                        key={`task-size-${task.id}-${size}`}
                        type="button"
                        onClick={() => handleStoredTaskSize(task.assignee, task.id, size)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black border transition-colors ${normalizeTaskSize(task.size) === size ? 'bg-cyan-500 text-slate-950 border-cyan-300' : 'bg-slate-950 text-slate-400 border-slate-700 hover:border-cyan-500 hover:text-cyan-200'}`}
                        title={`${getTaskSizeLabel(size)}: ${TEAM_METRIC_SIZE_WEIGHTS[size]} балл.`}
                      >
                        {getTaskSizeLabel(size)}
                      </button>
                    ))}
                  </div>
                  <div className="col-span-2 lg:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleResetTaskCalibration(task.assignee, task.id)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold border border-slate-700 text-slate-400 bg-slate-950 hover:border-red-400 hover:text-red-200"
                      title="Отменить ручную разметку этой задачи"
                    >
                      Сброс
                    </button>
                  </div>
                </div>
              ))}
              {editableTasks.length === 0 && (
                <div className="px-5 py-8 text-center text-slate-500 text-sm">Нет задач для выбранного фильтра или история загружена старым агрегированным форматом.</div>
              )}
            </div>
          </div>
        </div>
      )}
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
  const [aiTaskMemory, setAiTaskMemory] = useState(() => { try { const saved = localStorage.getItem('teamlead_ai_memory_v8'); if (saved) return JSON.parse(saved); } catch (e) {} return {}; });
  const [teamMetricsMemory, setTeamMetricsMemory] = useState(() => { try { const saved = localStorage.getItem('teamlead_metrics_v1'); if (saved) return JSON.parse(saved); } catch (e) {} return {}; });
  
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
        const aiMemoryRow = cloudData.find(r => r.key_name === 'ai_task_memory'); if (aiMemoryRow) setAiTaskMemory(aiMemoryRow.value_data || {});
        const teamMetricsRow = cloudData.find(r => r.key_name === 'team_metrics_memory'); if (teamMetricsRow) setTeamMetricsMemory(teamMetricsRow.value_data || {});
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
  useEffect(() => { saveToDb('ai_task_memory', aiTaskMemory, 'teamlead_ai_memory_v8'); }, [aiTaskMemory]);
  useEffect(() => { saveToDb('team_metrics_memory', teamMetricsMemory, 'teamlead_metrics_v1'); }, [teamMetricsMemory]);

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
      case 'pulse': return <PulseDashboard weekData={activeWeekData} historyKeys={historyKeys} weeksHistory={weeksHistory} selectedWeekKey={selectedWeekKey} onWeekSelect={setSelectedWeekKey} csatReviews={csatReviews} aiTaskMemory={aiTaskMemory} setAiTaskMemory={setAiTaskMemory} projectTasks={projectTasks} tasksArchive={tasksArchive} />;
      case 'fill': return <FillWeekForm weekData={activeWeekData} historyKeys={historyKeys} weeksHistory={weeksHistory} selectedKey={selectedWeekKey} onWeekSelect={setSelectedWeekKey} onSaveWeek={handleSaveWeek} setProfiles={setProfiles} setTasksArchive={setTasksArchive} csatReviews={csatReviews} setCsatReviews={setCsatReviews} setTeamMetricsMemory={setTeamMetricsMemory} />;
      case 'reports': return <ReportsGenerator weekData={activeWeekData} historyKeys={historyKeys} weeksHistory={weeksHistory} selectedKey={selectedWeekKey} onWeekSelect={setSelectedWeekKey} onSaveWeek={handleSaveWeek} projectTasks={projectTasks} setProjectTasks={setProjectTasks} csatReviews={csatReviews} aiTaskMemory={aiTaskMemory} setAiTaskMemory={setAiTaskMemory} tasksArchive={tasksArchive} teamMetricsMemory={teamMetricsMemory} />;
      case 'archive': return <TasksArchiveBoard tasksArchive={tasksArchive} />;
      case 'team': return <TeamAnalytics teamMetricsMemory={teamMetricsMemory} setTeamMetricsMemory={setTeamMetricsMemory} />;
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
    { id: 'team', icon: Users, label: 'Команда', roles: ['admin', 'viewer'] },
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
