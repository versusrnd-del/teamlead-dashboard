import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  "u0627": "Руслан Халеддинов",
   "mvol": "Михаил Волков",
  "tea1": "Евгений Тихонов",
  "dbog": "Дмитрий Богатырев"
};

const BASE_CAPACITY = 50; 
const TEAM_LEAD_ID = "u01002"; // ID тимлида для исключения из таблиц отчета
const TEAM_LEAD_NAME = "Виктор С.";
const THIRD_LINE_ADMINS = ["Антон Лысов", "Петр Скляренко", "Максим Нестеров", "Роман Нор", "e0197"];
const FIRST_LINE_REPORT_EXCLUDED_ADMINS = ["Владимир Приходько", "u05112"];
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

const generateFintechLabReport = ({
  week = {},
  metrics = [],
  routeDistribution = [],
  slaByRoute = [],
  topNonSelfTopics = [],
  deltas = [],
  dataQuality = {},
  statusWeek = {},
  healthyImprovement = {},
  mainAction = {},
  seniorWorkRows = [],
  loadContext = {},
  periodAnalytics = {},
  summary = '',
  commentAudit = {},
  generatedAt = new Date()
} = {}) => {
  const html = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
  const num = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };
  const pct = (value) => {
    const parsed = num(value);
    return parsed === null ? 'данные пока не подключены' : `${parsed.toFixed(1).replace('.0', '')}%`;
  };
  const count = (value) => {
    const parsed = num(value);
    return parsed === null ? 'данные пока не подключены' : `${Math.round(parsed)} шт.`;
  };
  const pointWord = (value) => {
    const rounded = Math.abs(Number(value) || 0);
    const integer = Math.round(rounded);
    if (integer % 10 === 1 && integer % 100 !== 11) return 'пункт';
    if ([2, 3, 4].includes(integer % 10) && ![12, 13, 14].includes(integer % 100)) return 'пункта';
    return 'пунктов';
  };
  const deltaText = (metric) => {
    const parsed = num(metric?.delta);
    if (parsed === null) return 'первая неделя сбора';
    if (metric?.suffix === '%') {
      if (metric.previousValue === null || metric.previousValue === undefined) return 'первая неделя сбора';
      const current = num(metric.value);
      const previous = num(metric.previousValue);
      if (current === null || previous === null) return 'первая неделя сбора';
      if (parsed === 0) return `было ${pct(previous)}, стало ${pct(current)} — без изменений`;
      const isGood = metric.goodDirection === 'down' ? parsed < 0 : parsed > 0;
      return `было ${pct(previous)}, стало ${pct(current)} — ${isGood ? 'лучше' : 'хуже'} на ${Math.abs(parsed).toFixed(1).replace('.0', '')} ${pointWord(parsed)}`;
    }
    return `${parsed > 0 ? '+' : ''}${Math.round(parsed)} шт. к прошлой неделе`;
  };
  const metricTone = (metric) => {
    if (metric.tone === 'good' || metric.tone === 'warn' || metric.tone === 'risk' || metric.tone === 'bad' || metric.tone === 'violet') return metric.tone;
    return 'neutral';
  };
  const width = (value) => `${Math.max(0, Math.min(100, Number(value) || 0))}%`;
  const generatedDate = generatedAt instanceof Date ? generatedAt : new Date(generatedAt);
  const period = week?.dates || `Неделя ${week?.weekNumber || ''}`.trim() || 'данные пока не подключены';
  const quality = num(dataQuality.routeDataQualityPercent);
  const improvementTopic = Object.keys(mainAction || {}).length ? mainAction : (topNonSelfTopics[0] || {});
  const improvementFocus = improvementTopic.focusTitle || improvementTopic.specificTheme || improvementTopic.theme || 'тема не выбрана';
  const improvementCategory = improvementTopic.category || (
    improvementTopic.theme && improvementTopic.theme !== improvementFocus ? improvementTopic.theme : ''
  );
  const improvementSystems = Array.isArray(improvementTopic.affectedSystems) ? improvementTopic.affectedSystems.filter(Boolean).slice(0, 6) : [];
  const improvementSymptoms = Array.isArray(improvementTopic.topSymptoms) ? improvementTopic.topSymptoms.filter(Boolean).slice(0, 5) : [];
  const improvementExamples = Array.isArray(improvementTopic.examples) ? improvementTopic.examples.filter(Boolean).slice(0, 5) : [];
  const improvementResolutions = Array.isArray(improvementTopic.resolutionPatterns) ? improvementTopic.resolutionPatterns.filter(Boolean).slice(0, 5) : [];
  const resolutionCoverage = num(improvementTopic.resolutionCoveragePercent);
  const improvementHasDetails = Boolean(
    improvementCategory || improvementSystems.length || improvementSymptoms.length || improvementExamples.length || improvementTopic.rootCauseHypothesis
  );
  const improvementEvidence = [
    Number.isFinite(Number(improvementTopic.count)) ? `${Math.round(Number(improvementTopic.count))} тикетов` : '',
    improvementTopic.slaBreaches !== null && improvementTopic.slaBreaches !== undefined ? `${Math.round(Number(improvementTopic.slaBreaches) || 0)} SLA-просрочек` : '',
    improvementTopic.mainRoute || ''
  ].filter(Boolean).join(' · ');
  const improvementDetail = `
    <div class="improvement-focus">
      <div class="focus-main">
        <small>Конкретный фокус</small>
        <strong>${html(improvementFocus)}</strong>
        ${improvementCategory ? `<span class="category-chip">${html(improvementCategory)}</span>` : ''}
        <p>${html(improvementEvidence || 'Количественная база появится после детального анализа CSV.')}</p>
      </div>
      <div class="focus-side">
        <div><small>Затронутые системы</small><strong>${html(improvementSystems.length ? improvementSystems.join(' · ') : 'не выделены в данных')}</strong></div>
        <div><small>Гипотеза причины</small><strong>${html(improvementTopic.rootCauseHypothesis || 'нужно подтвердить на 3–5 реальных тикетах')}</strong></div>
      </div>
    </div>
    ${improvementSymptoms.length ? `<div class="evidence-grid">${improvementSymptoms.map(item => `<div><small>Симптом</small><strong>${html(typeof item === 'string' ? item : (item.name || item.title || item.symptom || 'без названия'))}</strong><span>${typeof item === 'object' && item.count !== undefined ? html(count(item.count)) : ''}</span></div>`).join('')}</div>` : ''}
    ${improvementResolutions.length ? `<div class="resolution-summary"><div class="resolution-head"><div><small>Повторяющиеся способы решения</small><strong>Что уже можно закрепить в БЗ</strong></div><span>Заполненность хода решения: ${resolutionCoverage === null ? 'нет данных' : html(pct(resolutionCoverage))}</span></div><div class="evidence-grid">${improvementResolutions.map(item => `<div><small>Способ решения</small><strong>${html(typeof item === 'string' ? item : (item.name || item.resolution || 'без описания'))}</strong><span>${typeof item === 'object' && item.count !== undefined ? html(count(item.count)) : ''}</span></div>`).join('')}</div></div>` : ''}
    ${improvementExamples.length ? `<table class="example-table"><thead><tr><th>Тикет</th><th>Что произошло</th><th>Как диагностировали</th><th>Как решено</th><th>Маршрут / SLA</th></tr></thead><tbody>${improvementExamples.map(item => `<tr><td><strong>${html(item.id || item.key || 'без номера')}</strong></td><td>${html(item.title || item.summary || item.symptom || 'описание не передано')}</td><td>${html(item.diagnosis || 'не зафиксировано')}</td><td><strong>${html(item.resolution || item.solution || item.resolutionText || 'не зафиксировано')}</strong>${item.reusableStep ? `<br><small>В БЗ: ${html(item.reusableStep)}</small>` : ''}</td><td>${html(item.route || item.mainRoute || 'маршрут не указан')}${item.slaBreached === true || Number(item.overdueMin) > 0 ? ' · SLA нарушен' : ''}</td></tr>`).join('')}</tbody></table>` : ''}
    ${improvementExamples.length && improvementExamples.every(item => !item.resolution && !item.solution && !item.resolutionText) ? '<div class="data-gap"><strong>Ход решения не заполнен.</strong> Видно, что произошло, но пока нельзя доказательно сказать, как команда восстанавливала работу.</div>' : ''}
    ${!improvementHasDetails ? '<div class="data-gap"><strong>Нужна детализация CSV.</strong> Категория слишком широкая: добавьте конкретный сценарий, системы, симптомы и 3–5 примеров тикетов. До этого вывод считается предварительным.</div>' : ''}`;
  const metricCards = metrics.map(metric => `
    <article class="metric-card ${metricTone(metric)}">
      <div class="metric-label">${html(metric.label)}</div>
      <div class="metric-value">${html(metric.suffix === '%' ? pct(metric.value) : count(metric.value))}</div>
      ${metric.status ? `<div class="metric-status">${html(metric.status)}</div>` : ''}
      ${metric.target ? `<div class="target-row"><span>Прогресс до цели: ${html(pct(metric.value))} / ${html(pct(metric.target))}</span><strong>${Number(metric.value) >= Number(metric.target) ? 'цель достигнута' : `не хватает ${html((Number(metric.target) - Number(metric.value)).toFixed(1).replace('.0', ''))} ${html(pointWord(Number(metric.target) - Number(metric.value)))}`}</strong></div><div class="progress-track"><div class="progress-fill" style="width:${width((Number(metric.value) || 0) * 100 / (Number(metric.target) || 100))}"></div></div>` : ''}
      <div class="metric-delta">${html(deltaText(metric))}</div>
      <p>${html(metric.hint || '')}</p>
    </article>`).join('');
  const periodDeltaRows = deltas.length ? deltas.map(item => {
    const parsed = num(item.deltaValue);
    const delta = parsed === null ? 'база формируется' : `${parsed === 0 ? 'без изменений' : `${item.isGood ? 'лучше' : 'хуже'} на ${Math.abs(parsed).toFixed(1).replace('.0', '')} ${pointWord(parsed)}`}`;
    return `<div class="delta-card"><small>${html(item.label)}</small><strong>${html(delta)}</strong><span>${item.previous === null || item.previous === undefined ? `текущее: ${html(pct(item.current))}` : `было ${html(pct(item.previous))}, стало ${html(pct(item.current))}`}</span></div>`;
  }).join('') : '<p class="muted">База формируется. Общая дельта появится после 2-3 недель сбора маршрутизации.</p>';
  const routeRows = routeDistribution.length ? routeDistribution.map(item => `
    <div class="route-row">
      <div class="route-meta"><strong>${html(item.displayRoute || item.route || 'Другое')}</strong><span>${html(count(item.count))} / ${html(pct(item.percentage))}</span></div>
      <div class="bar-track"><div class="bar-fill" style="width:${width(item.percentage)}"></div></div>
    </div>`).join('') : '<p class="muted">Данные по маршрутам пока не подключены.</p>';
  const slaRows = slaByRoute.map(row => `
    <tr><td>${html(row.route)}</td><td class="num">${html(count(row.count))}</td><td class="num">${row.primarySla === null || row.primarySla === undefined ? 'нет данных' : html(pct(row.primarySla))}</td><td class="num">${row.resolutionSla === null || row.resolutionSla === undefined ? 'нет данных' : html(pct(row.resolutionSla))}</td><td><span class="badge">${html(row.conclusion || 'мало данных для вывода')}</span></td></tr>`).join('');
  const topicCards = topNonSelfTopics.length ? topNonSelfTopics.slice(0, 5).map((topic, index) => `
    <article class="topic-card">
      <div class="topic-head"><h3>${index + 1}. ${html(topic.focusTitle || topic.specificTheme || topic.theme || 'Без темы')}</h3><span>${html(count(topic.count))}</span></div>
      ${topic.category || (topic.focusTitle && topic.theme !== topic.focusTitle) ? `<div class="category-chip">${html(topic.category || topic.theme)}</div>` : ''}
      <div class="topic-grid"><div><small>Основной маршрут</small><strong>${html(topic.mainRoute || 'данные пока не подключены')}</strong></div><div><small>SLA-просрочки</small><strong>${topic.slaBreaches === null || topic.slaBreaches === undefined ? 'нет данных' : html(count(topic.slaBreaches))}</strong></div><div><small>Чаще требовалась помощь</small><strong>${html(topic.supportLevel || 'данные пока не подключены')}</strong></div><div><small>Тип проблемы</small><strong>${html(topic.problemType || 'нужен разбор типовых тикетов')}</strong></div></div>
      <p><strong>Что делать:</strong> ${html(topic.actionNeeded || 'Разобрать 3-5 типовых тикетов и решить: инструкция, обучение, права или маршрут.')}</p>
      <p class="check-line"><strong>Проверка:</strong> ${html(topic.check || 'через неделю смотрим помощь выше 1-й линии по теме и показатель «Решение в срок».')}</p>
    </article>`).join('') : '<p class="muted">Топ тем пока не подключен. Нужен анализ не-самостоятельных маршрутов.</p>';
  const bottleneckMax = Math.max(1, ...topNonSelfTopics.slice(0, 4).map(topic => Number(topic.count) || 0));
  const bottleneckVisual = topNonSelfTopics.length ? topNonSelfTopics.slice(0, 4).map((topic, index) => {
    const countValue = Number(topic.count) || 0;
    const breachValue = topic.slaBreaches === null || topic.slaBreaches === undefined ? null : Number(topic.slaBreaches) || 0;
    const barWidth = width(countValue * 100 / bottleneckMax);
    return `
      <article class="bottleneck-card">
        <div class="bottleneck-top"><span>${index + 1}</span><strong>${html(topic.focusTitle || topic.specificTheme || topic.theme || 'Без темы')}</strong></div>
        <div class="bottleneck-bar"><i style="width:${barWidth}"></i></div>
        <div class="bottleneck-meta">
          <div><small>Тикеты</small><b>${html(count(countValue))}</b></div>
          <div><small>SLA-просрочки</small><b>${breachValue === null ? 'нет данных' : html(count(breachValue))}</b></div>
          <div><small>Маршрут</small><b>${html(topic.mainRoute || topic.supportLevel || 'не определен')}</b></div>
        </div>
        <p>${html(topic.actionNeeded || 'Разобрать типовые тикеты и уточнить действие.')}</p>
      </article>`;
  }).join('') : '<p class="muted">Карта узких мест появится после загрузки bottleneckThemes по не-самостоятельным маршрутам.</p>';
  const seniorRows = seniorWorkRows.length ? seniorWorkRows.map(row => `
    <tr><td>${html(row.level)}</td><td>${html(row.themes || 'Недостаточно данных')}</td><td class="num">${html(count(row.count))}</td><td>${html(row.meaning || 'Недостаточно данных для устойчивого вывода, продолжаем сбор.')}</td><td>${html(row.action || 'Разобрать типовые тикеты и уточнить маршрут.')}</td></tr>`).join('') : '<tr><td colspan="5" class="muted">Недостаточно данных для устойчивого вывода, продолжаем сбор.</td></tr>';
  const temperature = periodAnalytics.temperature || {};
  const traffic = periodAnalytics.trafficLight || {};
  const currentComparisons = periodAnalytics.currentComparisons || {};
  const executiveSignal = periodAnalytics.executiveSignal || {};
  const periodTrend = Array.isArray(periodAnalytics.periodTrend) ? periodAnalytics.periodTrend : [];
  const routeTrend = Array.isArray(periodAnalytics.routeTrend) ? periodAnalytics.routeTrend : [];
  const abnormalWeeks = Array.isArray(periodAnalytics.abnormalWeeks) ? periodAnalytics.abnormalWeeks : [];
  const recurringThemes = Array.isArray(periodAnalytics.recurringThemes) ? periodAnalytics.recurringThemes : [];
  const firstLineLoad = periodAnalytics.firstLineLoad || {};
  const telephony = periodAnalytics.telephony || {};
  const seniorTaskFlow = periodAnalytics.seniorTaskFlow || {};
  const seniorReserve = periodAnalytics.seniorReserve || {};
  const planning = periodAnalytics.planning || {};
  const monthPlan = periodAnalytics.monthPlan || {};
  const planningGaps = Array.isArray(periodAnalytics.planningGaps) ? periodAnalytics.planningGaps : [];
  const performerDiagnostics = Array.isArray(periodAnalytics.performerDiagnostics) ? periodAnalytics.performerDiagnostics : [];
  const tempSteps = ['Спокойно', 'Нормально', 'Зона внимания', 'Горячо', 'Перегрев'];
  const tempIndex = Math.max(0, tempSteps.indexOf(temperature.label || 'Нормально'));
  const tempMarker = `${tempIndex * 25}%`;
  const periodTrendRows = periodTrend.length ? periodTrend.map(row => `
    <tr><td>${html(row.week)}</td><td>${html(row.period || '')}</td><td>${html(row.weekTypeLabel)}</td><td class="num">${html(count(row.inflow))}</td><td class="num">${html(count(row.closed))}</td><td class="num">${html(count(row.queue))}</td><td class="num">${row.primarySla === null || row.primarySla === undefined ? 'нет данных' : html(pct(row.primarySla))}</td><td class="num">${row.resolutionSla === null || row.resolutionSla === undefined ? 'нет данных' : html(pct(row.resolutionSla))}</td><td>${html(row.mainTheme || 'нет данных')}</td><td>${html(row.comment || '')}</td></tr>
  `).join('') : '<tr><td colspan="10" class="muted">Данные по динамике пока не подключены.</td></tr>';
  const routeTrendRows = routeTrend.length ? routeTrend.map(row => `
    <tr><td>${html(row.week)}</td><td class="num">${html(pct(row.selfPercent))}</td><td class="num">${html(pct(row.helpPercent))}</td><td class="num">${html(pct(row.routeQuality))}</td><td class="num">${html(count(row.unknownCount))}</td><td>${html(row.mainSupportRoute || 'нет данных')}</td><td>${html(row.conclusion || '')}</td></tr>
  `).join('') : '<tr><td colspan="7" class="muted">Метрика маршрута решения ещё не собиралась в доступном периоде.</td></tr>';
  const abnormalRows = abnormalWeeks.length ? abnormalWeeks.map(row => `
    <tr><td>${html(row.week)}</td><td class="num">${html(count(row.inflow))}</td><td>${html(row.weekTypeLabel)}</td><td class="num">${html(pct(row.primarySla))}</td><td class="num">${html(pct(row.resolutionSla))}</td><td class="num">${html(pct(row.helpPercent))}</td><td>${html(row.probableCause)}</td><td>${html(row.mainTheme || 'нет явной темы')}</td><td class="num">${html(count(row.themeCount))}</td><td class="num">${html(pct(row.themeShare))}</td><td>${html(row.mainSupportRoute || 'не определен')}</td><td>${html(row.conclusion)}</td></tr>
  `).join('') : '<tr><td colspan="12" class="muted">Аномальные недели за период не найдены или данных пока недостаточно.</td></tr>';
  const recurringThemeRows = recurringThemes.length ? recurringThemes.map(row => `
    <tr><td>${html(row.theme)}</td><td class="num">${html(row.weeksCount)}</td><td class="num">${html(count(row.totalCount))}</td><td>${html(row.mainRoute || 'не определен')}</td><td class="num">${html(count(row.totalSlaBreaches))}</td><td>${html(row.actionNeeded)}</td></tr>
  `).join('') : '<tr><td colspan="6" class="muted">Повторяющиеся темы появятся после 2+ недель с bottleneckThemes.</td></tr>';
  const seniorReserveRows = (seniorReserve.rows || []).length ? seniorReserve.rows.map(row => `
    <tr><td>${html(row.label)}</td><td class="num">${html(count(row.count))}</td><td class="num">${html(row.hoursText)}</td></tr>
  `).join('') : '<tr><td colspan="3" class="muted">Данные по маршрутам помощи пока не подключены.</td></tr>';
  const diagnosticsRows = performerDiagnostics.length ? performerDiagnostics.slice(0, 8).map(row => `
    <tr><td>${html(row.displayName || row.name)}</td><td class="num">${html(count(row.closed))}</td><td class="num" title="${html(row.avgTimeHint || '')}">${html(row.medianTimeText || row.avgTimeText)}</td><td class="num">${html(row.csatText)}</td><td>${html(row.profile)}</td></tr>
  `).join('') : '<tr><td colspan="5" class="muted">Данные исполнителей пока не подключены.</td></tr>';
  const monthResourceRows = (monthPlan.resources || []).length ? monthPlan.resources.map(row => `
    <tr><td>${html(row.resource)}</td><td>${html(row.calculation)}</td><td class="num">${html(row.monthFund)}</td><td>${html(row.role)}</td></tr>
  `).join('') : '<tr><td colspan="4" class="muted">Ресурс команды пока не рассчитан.</td></tr>';
  const monthWorkstreamRows = (monthPlan.workstreams || []).length ? monthPlan.workstreams.map(row => `
    <tr><td><strong>${html(row.name)}</strong></td><td>${html(row.howToPlan)}</td><td>${html(row.metrics)}</td><td>${html(row.risk)}</td></tr>
  `).join('') : '<tr><td colspan="4" class="muted">Плановые блоки появятся после расчета нагрузки.</td></tr>';
  const planningGapRows = planningGaps.length ? planningGaps.map(item => `<li>${html(item)}</li>`).join('') : '<li>Качество заполнения маршрута решения.</li><li>Связка звонок → тикет.</li><li>Повторные обращения.</li>';
  const commentAuditPatterns = Array.isArray(commentAudit.patterns) ? commentAudit.patterns.filter(Boolean).slice(0, 7) : [];
  const commentAuditPatternRows = commentAuditPatterns.length
    ? commentAuditPatterns.map(item => `<div><b>${html(item.name || item.resolution || 'Способ решения')}</b><span class="muted">${html(count(item.count))}${Array.isArray(item.evidenceIds) && item.evidenceIds.length ? ` · ${html(item.evidenceIds.slice(0, 5).join(', '))}` : ''}</span></div>`).join('')
    : '<div><b>Паттерны пока не выделены</b><span class="muted">Появятся после новой выгрузки с аудитом комментариев.</span></div>';
  const seniorTaskCards = (seniorTaskFlow.cards || []).length ? seniorTaskFlow.cards.map(card => `
    <article class="senior-task-card ${html(card.tone || 'neutral')}">
      <small>${html(card.label)}</small>
      <strong>${html(card.value)}</strong>
      <p>${html(card.hint || '')}</p>
    </article>
  `).join('') : '<p class="muted">Данные по задачам старших администраторов пока не подключены.</p>';
  const seniorTaskBalance = seniorTaskFlow.hasData ? `
    <div class="balance-card">
      <div class="balance-head"><span>Баланс недели</span><strong>${html(seniorTaskFlow.balanceLabel || 'база формируется')}</strong></div>
      <div class="balance-track">
        <i class="balance-help" style="width:${width(seniorTaskFlow.helpShare || 0)}"></i>
        <i class="balance-project" style="width:${width(seniorTaskFlow.projectShare || 0)}"></i>
      </div>
      <div class="balance-legend"><span><b class="dot help"></b>Обращения с помощью выше 1-й линии: ${html(Math.round(Number(seniorTaskFlow.helpCount) || 0))} обращ.</span><span><b class="dot project"></b>Закрытые задачи старших: ${html(Math.round(Number(seniorTaskFlow.closedCount) || 0))} задач</span></div>
      <p>${html(seniorTaskFlow.balanceNote || 'Смотрим, не съедает ли поддержка первой линии проектную работу старших администраторов.')}</p>
    </div>
  ` : '<div class="note">Баланс появится после загрузки задач и маршрутов решения за неделю.</div>';
  const heavyTaskGallery = (seniorTaskFlow.heavyTasks || []).length ? seniorTaskFlow.heavyTasks.map(task => `
    <article class="heavy-task">
      <div><span>${html(task.sizeLabel || 'Сложно')}</span><strong>${html(task.title || 'Без названия')}</strong></div>
      <p>${html(task.details || '')}</p>
    </article>
  `).join('') : '<p class="muted">Тяжелые закрытые задачи за неделю не найдены или еще не размечены.</p>';
  const primaryMetric = metrics.find(item => item.label === 'Взятие в работу ≤15 мин');
  const resolutionMetric = metrics.find(item => item.label === 'Решение в срок');
  const primaryValue = num(primaryMetric?.value);
  const resolutionValue = num(resolutionMetric?.value);
  const weakestSla = Math.min(primaryValue ?? 0, resolutionValue ?? 0);
  const slaSignalValue = weakestSla >= 95 ? 'в норме' : (weakestSla >= 80 ? 'ниже цели' : 'критично');
  const slaSignalHint = weakestSla >= 95 ? 'SLA на целевом уровне' : 'нужен разбор причин';
  const signalRows = [
    { label: 'Нагрузка', value: traffic.current === null || traffic.current === undefined ? 'нет данных' : `${Math.round(Number(traffic.current) || 0)} инцидентов`, hint: traffic.label || 'данные пока не подключены' },
    { label: 'SLA', value: slaSignalValue, hint: slaSignalHint },
    { label: 'Улучшение', value: improvementFocus, hint: improvementEvidence || (improvementHasDetails ? 'конкретный фокус недели' : 'нужна детализация исходного CSV') }
  ].map(item => `<article class="signal-tile"><span>${html(item.label)}</span><strong>${html(item.value)}</strong><p>${html(item.hint)}</p></article>`).join('');

  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Финтехлаб — практика по метрикам</title><style>
    :root{--ink:#102033;--muted:#64748b;--line:#d9e2ec;--paper:#f7fafc;--card:#fff;--green:#047857;--blue:#2563eb;--amber:#b45309;--orange:#ea580c;--red:#dc2626;--violet:#7c3aed;--soft-blue:#eff6ff;--soft-amber:#fffbeb;--soft-orange:#fff7ed;--soft-red:#fef2f2}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:Aptos,Calibri,"Segoe UI",Arial,sans-serif;line-height:1.5}.page{max-width:1120px;margin:0 auto;padding:36px 28px 56px}.cover{background:#102033;color:white;border-radius:24px;padding:36px;box-shadow:0 24px 60px rgba(15,23,42,.14);margin-bottom:20px}.cover-head{max-width:760px}.eyebrow{color:#9ce7d1;font-size:12px;text-transform:uppercase;letter-spacing:.16em;font-weight:800;margin-bottom:10px}h1{font-size:38px;line-height:1.05;margin:0 0 8px;letter-spacing:-.02em}h2{font-size:21px;margin:0 0 14px;letter-spacing:-.01em}h3{margin:0;font-size:15px}.cover-subtitle{font-size:18px;color:#dbeafe;margin:0 0 22px}.cover-grid,.metric-grid,.quality-grid,.delta-grid,.signal-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.cover-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.cover-item{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.16);border-radius:16px;padding:14px}.cover-item span,small{display:block;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.08em;font-weight:800}.cover-item span{color:#b9d8ff}.cover-item strong{display:block;margin-top:4px;font-size:14px}.signal-tile{border:1px solid var(--line);border-top:4px solid #2563eb;border-radius:18px;padding:18px;background:#fff}.signal-tile span{display:block;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.1em;font-weight:900}.signal-tile strong{display:block;color:#102033;font-size:25px;line-height:1.1;margin:8px 0 4px}.signal-tile p{margin:0;color:#64748b;font-size:13px}section{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:22px;margin:16px 0;box-shadow:0 10px 28px rgba(15,23,42,.05)}.note{background:#f8fafc;border:1px solid var(--line);border-radius:16px;padding:14px;color:#475569;font-size:13px}.note strong{color:#203044}.status-grid,.note-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.status-grid{grid-template-columns:1.1fr 1.4fr 1fr}.status-box{border:1px solid var(--line);border-radius:16px;padding:14px;background:#f8fafc}.status-box h3{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin:0 0 8px}.status-title{font-size:18px;font-weight:900;color:#1d4ed8}.status-box ul{margin:0;padding-left:18px;color:#475569;font-size:13px}.metric-card,.quality-box,.topic-card,.delta-card{border:1px solid var(--line);border-top:4px solid #dbeafe;border-radius:18px;padding:18px;background:#fff}.metric-label{color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.1em;font-weight:900}.metric-value{color:#173a5e;font-size:31px;line-height:1.1;font-weight:900;margin:9px 0 4px}.metric-card.good{border-top-color:#10b981}.metric-card.warn{border-top-color:#f59e0b}.metric-card.risk{border-top-color:#f97316}.metric-card.bad{border-top-color:#ef4444}.metric-card.violet{border-top-color:#8b5cf6}.metric-status{display:inline-block;border-radius:999px;background:#f1f5f9;color:#334155;padding:4px 8px;font-size:11px;font-weight:900;margin-bottom:7px}.metric-card.good .metric-status{background:#ecfdf5;color:var(--green)}.metric-card.warn .metric-status{background:var(--soft-amber);color:var(--amber)}.metric-card.risk .metric-status{background:var(--soft-orange);color:var(--orange)}.metric-card.bad .metric-status{background:var(--soft-red);color:var(--red)}.metric-card.violet .metric-status{background:#f5f3ff;color:var(--violet)}.target-row{display:flex;justify-content:space-between;gap:10px;color:#475569;font-size:11px;font-weight:800;margin:8px 0 5px}.progress-track{height:7px;background:#e2e8f0;border-radius:999px;overflow:hidden;margin-bottom:9px}.progress-fill{height:100%;background:linear-gradient(90deg,#2563eb,#38bdf8);border-radius:999px}.metric-card.good .progress-fill{background:#10b981}.metric-card.warn .progress-fill{background:#f59e0b}.metric-card.risk .progress-fill{background:#f97316}.metric-card.bad .progress-fill{background:#ef4444}.metric-delta{display:inline-block;color:var(--blue);background:var(--soft-blue);border-radius:999px;padding:4px 8px;font-size:12px;font-weight:800;margin-bottom:8px}.metric-card p,.muted{color:var(--muted);margin:0;font-size:13px}.quality-box strong,.delta-card strong{display:block;font-size:28px;color:var(--blue);margin-top:4px}.delta-card span{display:block;color:var(--muted);font-size:12px;margin-top:4px}.warning{margin-top:14px;padding:12px 14px;background:var(--soft-amber);border:1px solid #fcd34d;border-radius:14px;color:var(--amber);font-weight:800}table{width:100%;border-collapse:collapse;font-size:13px}th{text-align:left;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.08em;padding:10px;border-bottom:1px solid var(--line)}td{padding:12px 10px;border-bottom:1px solid #edf2f7;vertical-align:top}.num{text-align:right;white-space:nowrap;font-weight:800}.route-row{margin:13px 0}.route-meta{display:flex;justify-content:space-between;gap:16px;font-size:13px;margin-bottom:6px}.route-meta span{color:var(--muted);font-weight:800;white-space:nowrap}.bar-track{height:12px;background:#e2e8f0;border-radius:999px;overflow:hidden}.bar-fill{height:100%;background:linear-gradient(90deg,var(--green),#38bdf8);border-radius:999px}.badge{display:inline-block;border-radius:999px;background:var(--soft-blue);color:var(--blue);padding:4px 9px;font-weight:800}.topic-list,.bottleneck-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.topic-head{display:flex;justify-content:space-between;gap:12px;margin-bottom:12px}.topic-head span{color:var(--green);font-weight:900;white-space:nowrap}.topic-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:12px}.topic-grid div{background:white;border:1px solid #e7eef6;border-radius:12px;padding:10px}.topic-grid strong{display:block;font-size:12px;margin-top:3px}.topic-card p{color:#475569;font-size:13px;margin:10px 0 0}.check-line{background:#f8fafc;border:1px solid #e7eef6;border-radius:12px;padding:10px}.category-chip{display:inline-block;width:max-content;border-radius:999px;background:#eff6ff;color:#1d4ed8;padding:4px 9px;font-size:11px;font-weight:900;margin:0 0 10px}.improvement-focus{display:grid;grid-template-columns:1.35fr 1fr;gap:14px}.focus-main,.focus-side div{border:1px solid #dbeafe;border-radius:16px;padding:16px;background:linear-gradient(135deg,#f8fbff,#fff)}.focus-main>strong{display:block;font-size:24px;line-height:1.15;margin:6px 0 10px}.focus-main p{margin:0;color:#475569}.focus-side{display:grid;gap:10px}.focus-side strong{display:block;margin-top:5px;font-size:13px}.evidence-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:12px}.evidence-grid div{border:1px solid #e2e8f0;border-radius:14px;padding:12px}.evidence-grid strong,.evidence-grid span{display:block;font-size:13px}.evidence-grid span{color:#64748b;margin-top:3px}.example-table{margin-top:14px}.resolution-summary{margin-top:14px;padding:16px;border:1px solid #a7f3d0;background:#ecfdf5;border-radius:16px}.resolution-head{display:flex;justify-content:space-between;gap:16px;align-items:end}.resolution-head>div>strong{display:block;margin-top:4px}.resolution-head>span{color:#047857;font-size:12px;font-weight:900}.data-gap{margin-top:12px;border:1px solid #f59e0b;background:#fffbeb;color:#92400e;border-radius:14px;padding:13px}.bottleneck-card{border:1px solid #dbeafe;border-radius:18px;padding:16px;background:#fbfdff}.bottleneck-top{display:flex;gap:10px;align-items:flex-start}.bottleneck-top span{display:grid;place-items:center;width:26px;height:26px;border-radius:999px;background:#eff6ff;color:#1d4ed8;font-weight:900}.bottleneck-top strong{font-size:15px;color:#102033}.bottleneck-bar{height:10px;background:#e2e8f0;border-radius:999px;overflow:hidden;margin:14px 0}.bottleneck-bar i{display:block;height:100%;background:linear-gradient(90deg,#2563eb,#38bdf8);border-radius:999px}.bottleneck-meta{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.bottleneck-meta div{background:#fff;border:1px solid #e7eef6;border-radius:12px;padding:9px}.bottleneck-meta b{display:block;font-size:12px;color:#102033}.bottleneck-card p{margin:12px 0 0;color:#475569;font-size:13px}.executive-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.traffic-badge{display:inline-block;border-radius:999px;padding:5px 10px;font-weight:900;font-size:12px;background:#f1f5f9;color:#334155}@media(max-width:820px){.cover-head,.cover-grid,.metric-grid,.quality-grid,.delta-grid,.topic-list,.bottleneck-grid,.note-grid,.status-grid,.signal-grid,.executive-grid,.improvement-focus,.evidence-grid{grid-template-columns:1fr}.resolution-head{display:block}.resolution-head>span{display:block;margin-top:8px}h1{font-size:32px}.cover{padding:28px}}@media print{body{background:white}.page{padding:0}section,.cover{box-shadow:none;break-inside:avoid}}
	  </style><style>
	    .senior-task-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.senior-task-card{border:1px solid var(--line);border-top:4px solid #94a3b8;border-radius:18px;padding:16px;background:linear-gradient(180deg,#fff,#f8fafc)}.senior-task-card strong{display:block;font-size:29px;line-height:1.05;margin:8px 0 5px;color:#102033}.senior-task-card p{margin:0;color:#64748b;font-size:12px}.senior-task-card.good{border-top-color:#10b981}.senior-task-card.warn{border-top-color:#f59e0b}.senior-task-card.risk{border-top-color:#f97316}.senior-task-card.violet{border-top-color:#8b5cf6}.balance-card{margin-top:14px;border:1px solid #c7d2fe;border-radius:18px;padding:16px;background:linear-gradient(135deg,#eef2ff,#f8fafc)}.balance-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:10px}.balance-head span{color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:.08em;font-weight:900}.balance-head strong{color:#102033;font-size:16px}.balance-track{display:flex;height:18px;background:#e2e8f0;border-radius:999px;overflow:hidden;border:1px solid #dbeafe}.balance-track i{display:block;height:100%}.balance-help{background:linear-gradient(90deg,#f97316,#f59e0b)}.balance-project{background:linear-gradient(90deg,#2563eb,#22c55e)}.balance-legend{display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px;margin:10px 0;color:#475569;font-size:12px;font-weight:800}.dot{display:inline-block;width:9px;height:9px;border-radius:999px;margin-right:5px}.dot.help{background:#f97316}.dot.project{background:#2563eb}.balance-card p{margin:0;color:#475569;font-size:13px}.heavy-gallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:14px}.heavy-task{border:1px solid #e2e8f0;border-radius:14px;padding:12px;background:#fff}.heavy-task span{display:inline-block;margin-bottom:5px;border-radius:999px;background:#fff7ed;color:#c2410c;border:1px solid #fed7aa;padding:3px 8px;font-size:10px;font-weight:900;text-transform:uppercase}.heavy-task strong{display:block;font-size:13px;color:#102033}.heavy-task p{margin:6px 0 0;color:#64748b;font-size:12px}@media(max-width:820px){.senior-task-grid,.heavy-gallery{grid-template-columns:1fr}}
	    body{background:#e7edf5}.page{max-width:1080px;padding-top:28px}.cover{position:relative;overflow:hidden;border:1px solid #264768;background-color:#081524;background-image:linear-gradient(rgba(56,189,248,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(56,189,248,.055) 1px,transparent 1px),radial-gradient(circle at 88% 12%,rgba(16,185,129,.22),transparent 30%),linear-gradient(135deg,#07111f,#0d2238 58%,#0f3045);background-size:28px 28px,28px 28px,auto,auto;box-shadow:0 28px 70px rgba(7,17,31,.25)}.cover:after{content:"";position:absolute;right:-90px;bottom:-120px;width:330px;height:330px;border:1px solid rgba(56,189,248,.18);border-radius:50%;box-shadow:0 0 0 34px rgba(56,189,248,.035),0 0 0 68px rgba(56,189,248,.025)}.cover-head,.cover-grid,.report-brand{position:relative;z-index:1}.report-brand{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:24px;padding-bottom:12px;border-bottom:1px solid rgba(148,163,184,.22);font:800 10px/1.2 Consolas,"Courier New",monospace;letter-spacing:.16em;text-transform:uppercase;color:#7dd3fc}.report-brand b{color:#a7f3d0;font-weight:800}.eyebrow{font-family:Consolas,"Courier New",monospace;color:#67e8f9}.cover h1{max-width:760px;font-size:38px}.cover-grid{margin-top:22px;grid-template-columns:repeat(3,minmax(0,1fr))}.cover-item{backdrop-filter:blur(8px);background:rgba(8,21,36,.62);border-color:rgba(125,211,252,.18);border-radius:12px}.cover-item span{font-family:Consolas,"Courier New",monospace}.signal-tile{border-radius:14px;border-color:#cbd8e6;border-top-width:3px;box-shadow:0 10px 26px rgba(15,35,55,.06);padding:16px}.signal-tile:nth-child(1){border-top-color:#38bdf8}.signal-tile:nth-child(2){border-top-color:#f59e0b}.signal-tile:nth-child(3){border-top-color:#10b981}.signal-tile strong{font-size:20px}.signal-tile span,.metric-label,small,th{font-family:Consolas,"Courier New",monospace}section{position:relative;border-radius:16px;border-color:#cdd9e6;box-shadow:0 10px 28px rgba(15,35,55,.055);overflow:hidden}section:before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:linear-gradient(#38bdf8,#10b981);opacity:.72}section h2{display:flex;align-items:center;gap:10px;font-size:19px;color:#0b2035}section h2:before{content:"";width:8px;height:8px;border-radius:2px;background:#0ea5e9;box-shadow:0 0 0 4px #e0f2fe}.metric-card,.quality-box,.delta-card,.topic-card{border-radius:14px;box-shadow:none}.metric-card{background:linear-gradient(180deg,#fff,#f8fbfe)}.metric-value,.quality-box strong,.delta-card strong{font-family:Consolas,"Courier New",monospace}.status-grid.compact{grid-template-columns:1fr 1.25fr}.status-box{border-radius:12px}.status-title{font-size:17px}.note{border-radius:12px;background:#f6f9fc}.focus-main,.focus-side div,.bottleneck-card,.heavy-task{border-radius:12px}table{border:1px solid #d6e0ea;border-radius:12px;overflow:hidden}th{background:#0d2238;color:#b9d7ee;padding:11px 10px;border-bottom-color:#24445f}td{color:#334155}tbody tr:nth-child(even){background:#f7fafc}tbody tr:hover{background:#eff8ff}.badge,.category-chip{font-family:Consolas,"Courier New",monospace;border-radius:6px}.resolution-summary{border-radius:12px;border-color:#86efac;background:linear-gradient(135deg,#ecfdf5,#f8fffc)}.data-gap{border-radius:10px}.senior-task-card{border-radius:14px}.balance-card{border-radius:14px}.report-appendix{margin:18px 0;border:1px solid #cbd8e6;border-radius:14px;background:#f8fafc;overflow:hidden}.report-appendix>summary{cursor:pointer;padding:15px 18px;color:#334155;font:800 12px/1.3 Consolas,"Courier New",monospace;text-transform:uppercase;letter-spacing:.08em}.report-appendix[open]>summary{border-bottom:1px solid #dbe4ee;background:#eef4f9}.report-appendix-body{padding:4px 16px 16px}.report-appendix section{box-shadow:none}@media print{body{background:#fff}.page{max-width:none}.cover{border-radius:0;box-shadow:none}.cover:after{display:none}section{box-shadow:none;break-inside:avoid}section:before{background:#0ea5e9}.report-brand{color:#bae6fd}.report-appendix>summary{display:none}.report-appendix>.report-appendix-body{display:block}}
	  </style></head><body><main class="page">
	    <header class="cover"><div class="report-brand"><span>OPS INTELLIGENCE / SERVICE DESK</span><b>WEEKLY REVIEW · FINTECHLAB</b></div><div class="cover-head"><div class="eyebrow">Короткий командный отчёт</div><h1>Финтехлаб — главное за неделю</h1><p class="cover-subtitle">Что произошло, что улучшить и какое действие берём в работу</p></div><div class="cover-grid"><div class="cover-item"><span>Период</span><strong>${html(period)}</strong></div><div class="cover-item"><span>Контур</span><strong>1-я линия техподдержки</strong></div><div class="cover-item"><span>Сформировано</span><strong>${html(generatedDate.toLocaleDateString('ru-RU'))}</strong></div></div></header>
    <section><h2>Неделя в одном экране</h2><div class="signal-grid">${signalRows}</div></section>
    <section><h2>Управленческий вывод</h2><div class="status-grid compact"><div class="status-box"><h3>Статус</h3><div class="status-title">${html(statusWeek.title || 'База формируется')}</div><p class="muted">${html(statusWeek.summary || summary || 'Данные пока не подключены.')}</p></div><div class="status-box"><h3>Что делаем</h3><p><strong>${html(statusWeek.nextAction || mainAction.actionNeeded || 'выбрать тему после накопления данных')}</strong></p><p class="muted">${html(mainAction.check || 'через неделю проверить эффект по SLA и доле помощи выше 1-й линии')}</p></div></div></section>
    <section><h2>Одна тема для улучшения</h2>${improvementDetail}</section>
    <section><h2>Решение на следующую неделю</h2><div class="note"><strong>${html(improvementFocus)}</strong><br>${html(mainAction.details || mainAction.actionNeeded || 'Нужны данные по топу не-самостоятельных маршрутов.')}<br><strong>Критерий проверки:</strong> ${html(mainAction.check || 'сравнить помощь выше 1-й линии и решение в срок по выбранной теме через неделю')}</div></section>
    <section><h2>Качество описания решений</h2><div class="note"><strong>${commentAudit.coveragePercent === null || commentAudit.coveragePercent === undefined ? 'Покрытие пока не рассчитано.' : `Содержательный ход решения заполнен в ${html(pct(commentAudit.coveragePercent))} закрытых обращений.`}</strong> Служебные сообщения, автоматические проверки и просьбы оценить работу в анализ не входят.</div><div class="plan" style="margin-top:14px">${commentAuditPatternRows}</div></section>
    <details class="report-appendix"><summary>Приложение: метрики и техническая диагностика</summary><div class="report-appendix-body">
      <section><h2>Контрольные метрики</h2><div class="metric-grid">${metricCards}</div></section>
      <section><h2>SLA по маршрутам</h2><table><thead><tr><th>Маршрут</th><th>Тикеты</th><th>Взятие ≤15 мин</th><th>Решение в срок</th><th>Вывод</th></tr></thead><tbody>${slaRows}</tbody></table></section>
      <section><h2>Работа старших администраторов</h2><div class="senior-task-grid">${seniorTaskCards}</div>${seniorTaskBalance}<div class="heavy-gallery">${heavyTaskGallery}</div></section>
      <section><h2>Что улучшить в данных</h2><div class="note"><ul style="margin:0;padding-left:18px">${planningGapRows}</ul></div></section>
    </div></details>
  </main></body></html>`;
};

const generateTopProblemPostmortemReport = ({
  week = {},
  topic = {},
  training = {},
  routes = [],
  slaByRoute = [],
  relatedCases = [],
  subProblems = [],
  medianResolutionMinutes = null,
  phoneAvgMinutes = 5,
  telephony = {},
  generatedAt = new Date()
} = {}) => {
  const html = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
  const num = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const pct = (value) => `${num(value).toFixed(1).replace('.0', '')}%`;
  const count = (value) => `${Math.round(num(value))} шт.`;
  const requestCount = (value) => {
    const amount = Math.round(num(value));
    const mod10 = amount % 10;
    const mod100 = amount % 100;
    const word = mod10 === 1 && mod100 !== 11
      ? 'обращение'
      : ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100) ? 'обращения' : 'обращений');
    return `${amount} ${word}`;
  };
  const period = week?.dates || `Неделя ${week?.weekNumber || ''}`.trim() || 'текущий период';
  const generatedDate = generatedAt instanceof Date ? generatedAt : new Date(generatedAt);
  const rawTopicName = safeString(topic.focusTitle || topic.specificTheme || topic.theme || 'Топ-проблема недели').trim();
  const broadTopicName = /^(бизнес-приложения|бизнес приложения|офисное по|рабочие места\s*\/\s*по|программное обеспечение|прочее|другое)/i.test(rawTopicName);
  const problemTypeText = safeString(topic.problemType || topic.topSymptoms?.[0] || topic.symptom).trim();
  const affectedSystemNames = Array.isArray(topic.affectedSystems)
    ? topic.affectedSystems.map(safeString).map(item => item.trim()).filter(Boolean)
    : safeString(topic.affectedSystems).split(/[,;|]/).map(item => item.trim()).filter(Boolean);
  const actionSystemMatch = safeString(topic.actionNeeded).match(/(?:входа?\s+и\s+запуска|запуска)\s+(.+?)(?=,\s*(?:затем|после|далее)|[.;]|$)/i);
  const actionSystemText = safeString(actionSystemMatch?.[1]).replace(/ОперДня/gi, 'ОперДень').trim();
  const specificSystemsText = affectedSystemNames.length ? affectedSystemNames.join(', ') : actionSystemText;
  const problemLabel = /вход.*запуск|запуск.*вход/i.test(problemTypeText)
    ? 'Проблемы входа и запуска'
    : (problemTypeText ? `${problemTypeText.charAt(0).toUpperCase()}${problemTypeText.slice(1)}` : 'Конкретная проблема недели');
  const topicName = broadTopicName
    ? `${problemLabel}${specificSystemsText ? `: ${specificSystemsText}` : ''}`
    : rawTopicName;
  const topicCategory = topic.category || (topic.theme && topic.theme !== topicName ? topic.theme : '');
  const topicSystems = Array.isArray(topic.affectedSystems) ? topic.affectedSystems.filter(Boolean).slice(0, 5) : [];
  const topicCount = num(topic.count);
  const totalClosed = num(training.closed);
  const topicShare = totalClosed > 0 ? topicCount * 100 / totalClosed : 0;
  const weekLoadState = totalClosed > 300
    ? { label: 'Аварийная неделя', note: 'объём выше 300 обращений', color: '#fb7185' }
    : (totalClosed > 250
      ? { label: 'Повышенная нагрузка', note: '251–300 обращений', color: '#fbbf24' }
      : (totalClosed >= 200
        ? { label: 'Стандартная неделя', note: '200–250 обращений', color: '#34d399' }
        : (totalClosed > 0
          ? { label: 'Спокойная / неполная', note: 'меньше 200 обращений', color: '#60a5fa' }
          : { label: 'Данные не загружены', note: 'нет объёма за неделю', color: '#64748b' })));
  const helpPercent = num(training.helpPercent);
  const primarySla = num(training.successRate);
  const resolutionSla = num(training.resolutionSuccessRate);
  const worstSla = Math.min(primarySla || 0, resolutionSla || 0);
  const primaryGap = Math.max(0, 95 - primarySla);
  const resolutionGap = Math.max(0, 95 - resolutionSla);
  const caseResolutionValues = relatedCases
    .map(item => num(item.totalResolutionMin ?? item.resolutionMinutes ?? item.resolveMinutes ?? item.durationMin))
    .filter(value => value > 0)
    .sort((a, b) => a - b);
  const medianFromCases = caseResolutionValues.length
    ? (caseResolutionValues.length % 2
      ? caseResolutionValues[Math.floor(caseResolutionValues.length / 2)]
      : (caseResolutionValues[caseResolutionValues.length / 2 - 1] + caseResolutionValues[caseResolutionValues.length / 2]) / 2)
    : null;
  const resolutionMedianText = num(medianResolutionMinutes) > 0
    ? `${Math.round(num(medianResolutionMinutes))} мин`
    : (medianFromCases ? `${Math.round(medianFromCases)} мин` : 'нет данных');
  const phoneTotalCalls = num(telephony.totalCalls ?? telephony.total ?? telephony.callsCount ?? telephony.calls);
  const phoneAnswered = num(telephony.answeredCount ?? telephony.answered ?? telephony.callsCount ?? telephony.calls ?? telephony.totalCalls ?? telephony.total);
  const hasPhoneMissedData = telephony.missedCount !== undefined
    || telephony.missed !== undefined
    || telephony.lost !== undefined
    || telephony.notAnswered !== undefined;
  const phoneMissed = hasPhoneMissedData ? num(telephony.missedCount ?? telephony.missed ?? telephony.lost ?? telephony.notAnswered) : 0;
  const phoneMissedTarget = num(telephony.missedTarget) > 0 ? num(telephony.missedTarget) : 15;
  const phoneCalls = phoneTotalCalls || phoneAnswered;
  const hasPhoneData = phoneCalls > 0 || hasPhoneMissedData;
  const phoneSourceLabel = safeString(telephony.sourceLabel || 'telephonyData выбранной недели');
  const phoneAnsweredText = hasPhoneData ? `${Math.round(phoneCalls)}` : 'нет данных';
  const cleanPhoneAvgMinutes = num(phoneAvgMinutes) > 0 ? num(phoneAvgMinutes) : 5;
  const phoneLoadMinutes = phoneCalls * cleanPhoneAvgMinutes;
  const phoneLoadHours = phoneLoadMinutes / 60;
  const phoneAvgPerDay = phoneCalls > 0 ? phoneCalls / 6 : 0;
  const phoneAvgPerDayText = phoneCalls > 0
    ? (telephony.avgPerDayText || `${phoneAvgPerDay.toFixed(1).replace('.0', '')} звонков/день`)
    : 'нет данных';
  const phoneLoadText = phoneCalls > 0
    ? `${Math.round(phoneLoadMinutes)} мин${phoneLoadHours >= 1 ? ` / ${phoneLoadHours.toFixed(1).replace('.0', '')} ч` : ''}`
    : 'нет данных';
  const phoneAvailability = phoneTotalCalls > 0
    ? Math.round(((phoneTotalCalls - phoneMissed) / phoneTotalCalls) * 100)
    : (telephony.availabilityPercent ?? telephony.availability ?? null);
  const phoneMissedGap = Math.max(0, phoneMissed - phoneMissedTarget);
  const phoneLoadSuffix = phoneCalls > 220 ? ' При этом нагрузка высокая.' : '';
  const phoneStates = [
    { key: 'no_data', label: 'Телефония: нет данных', min: null, max: null, color: '#64748b', note: 'нужно загрузить принятые и пропущенные звонки' },
    { key: 'excellent', label: 'Телефония без потерь', min: 0, max: 0, color: '#06b6d4', note: 'пропущенных нет, линия удержана' },
    { key: 'target', label: 'Телефония в цели', min: 1, max: phoneMissedTarget, color: '#10b981', note: `пропущено в пределах лимита ${phoneMissedTarget}` },
    { key: 'risk', label: 'Риск по телефонии', min: phoneMissedTarget + 1, max: phoneMissedTarget * 2, color: '#f59e0b', note: `пропущенных больше лимита на ${phoneMissedGap}` },
    { key: 'bad', label: 'Просадка телефонии', min: phoneMissedTarget * 2 + 1, max: Infinity, color: '#f97316', note: `пропущенных больше лимита на ${phoneMissedGap}` }
  ];
  const currentPhoneState = hasPhoneData
    ? (phoneStates.find(state => state.min !== null && phoneMissed >= state.min && phoneMissed <= state.max) || phoneStates[phoneStates.length - 1])
    : phoneStates[0];
  const slaBreaches = topic.slaBreaches === null || topic.slaBreaches === undefined ? null : num(topic.slaBreaches);
  const breachShare = topicCount > 0 && slaBreaches !== null ? slaBreaches * 100 / topicCount : 0;
  const pressureScore = Math.max(0, Math.min(100,
    (100 - worstSla) * 0.45 +
    helpPercent * 0.25 +
    Math.min(topicShare, 45) * 0.45 +
    Math.min(breachShare, 60) * 0.25
  ));
  const trafficStates = [
    { key: 'very_bad', label: 'Критично по SLA', min: 0, max: 79.9, color: '#dc2626', bg: '#fef2f2', note: 'SLA ниже 80%, срочный разбор' },
    { key: 'bad', label: 'Риск по SLA', min: 80, max: 89.9, color: '#ea580c', bg: '#fff7ed', note: 'SLA 80-89,9%, разбираем причины' },
    { key: 'normal', label: 'Зона внимания к SLA', min: 90, max: 94.9, color: '#f59e0b', bg: '#fffbeb', note: 'SLA 90-94,9%, близко к цели' },
    { key: 'good', label: 'Хорошо по SLA', min: 95, max: 97.9, color: '#10b981', bg: '#ecfdf5', note: 'SLA 95-97,9%, цель выполнена' },
    { key: 'excellent', label: 'Очень хорошо по SLA', min: 98, max: 100, color: '#06b6d4', bg: '#ecfeff', note: 'SLA от 98%, можно закреплять стандарт' }
  ];
  const currentState = trafficStates.find(state => worstSla >= state.min && worstSla <= state.max) || trafficStates[0];
  const worstSlaLabel = primarySla <= resolutionSla ? 'Взятие в работу ≤15 мин' : 'Решение в срок';
  const weakRoute = [...slaByRoute]
    .filter(row => (num(row.count) >= 5) && (row.primarySla !== null || row.resolutionSla !== null))
    .sort((a, b) => Math.min(num(a.primarySla || 100), num(a.resolutionSla || 100)) - Math.min(num(b.primarySla || 100), num(b.resolutionSla || 100)))[0];
  const routeRows = routes.length ? routes.slice(0, 6).map(route => `
    <tr>
      <td>${html(route.displayRoute || route.route || 'Маршрут не указан')}</td>
      <td class="num">${html(count(route.count))}</td>
      <td class="num">${html(pct(route.percentage))}</td>
    </tr>
  `).join('') : '<tr><td colspan="3" class="muted">Данные по маршрутам пока не подключены.</td></tr>';
  const slaRows = slaByRoute.length ? slaByRoute.slice(0, 6).map(row => `
    <tr>
      <td>${html(row.route || 'Маршрут')}</td>
      <td class="num">${html(count(row.count))}</td>
      <td class="num">${row.primarySla === null || row.primarySla === undefined ? 'нет данных' : html(pct(row.primarySla))}</td>
      <td class="num">${row.resolutionSla === null || row.resolutionSla === undefined ? 'нет данных' : html(pct(row.resolutionSla))}</td>
      <td>${html(row.conclusion || 'нужен разбор')}</td>
    </tr>
  `).join('') : '<tr><td colspan="5" class="muted">SLA по маршрутам пока не подключен.</td></tr>';
  const commentAudit = training.resolutionCommentAudit && typeof training.resolutionCommentAudit === 'object'
    ? training.resolutionCommentAudit
    : {};
  const relatedCaseIds = new Set(relatedCases.map(item => safeString(item.id || item.key || item.issueKey)).filter(Boolean));
  const auditResolutionPatterns = (Array.isArray(commentAudit.patterns) ? commentAudit.patterns : [])
    .filter(item => Array.isArray(item?.evidenceIds) && item.evidenceIds.some(id => relatedCaseIds.has(safeString(id))));
  const resolutionPatternMap = new Map();
  [
    ...(Array.isArray(topic.resolutionPatterns) ? topic.resolutionPatterns : []),
    ...auditResolutionPatterns
  ].filter(Boolean).forEach(item => {
    const name = safeString(typeof item === 'string' ? item : (item.name || item.resolution)).trim();
    if (name && !resolutionPatternMap.has(name.toLowerCase())) resolutionPatternMap.set(name.toLowerCase(), item);
  });
  const isMeaningfulResolutionText = (value) => {
    const text = safeString(value).replace(/\s+/g, ' ').trim();
    if (text.length < 12) return false;
    return !/^(?:не зафиксировано|нет данных|готово|решено|выполнено|закрыто|проблема решена|помогли пользователю|#resolved)[.!\s]*$/i.test(text);
  };
  const resolutionPatterns = [...resolutionPatternMap.values()].slice(0, 5);
  const supportedResolutionPatterns = resolutionPatterns.filter(item => {
    if (typeof item === 'string') return false;
    const evidenceIds = Array.isArray(item?.evidenceIds) ? item.evidenceIds.map(safeString).filter(Boolean) : [];
    return isMeaningfulResolutionText(item?.name || item?.resolution) && evidenceIds.length > 0;
  });
  const resolvedRelatedCases = relatedCases.filter(item => isMeaningfulResolutionText(item.resolution || item.solution || item.resolutionText || item.comment));
  const resolvedRelatedCount = resolvedRelatedCases.length;
  const resolutionCoverage = topic.resolutionCoveragePercent === null || topic.resolutionCoveragePercent === undefined
    ? (relatedCases.length ? roundMetric(resolvedRelatedCount * 100 / relatedCases.length, 1) : null)
    : num(topic.resolutionCoveragePercent);
  const resolutionEvidenceIds = [...new Set([
    ...supportedResolutionPatterns.flatMap(item => item.evidenceIds || []),
    ...resolvedRelatedCases.map(item => item.id || item.key || item.issueKey)
  ].map(safeString).filter(Boolean))];
  const actionPlan = topic.actionPlan && typeof topic.actionPlan === 'object' ? topic.actionPlan : {};
  const actionDataGap = safeString(topic.actionDataGap).trim();
  const actionPlanEvidenceIds = Array.isArray(actionPlan.evidenceIds) ? actionPlan.evidenceIds.map(safeString).filter(Boolean) : [];
  const actionPlanHasTrace = actionPlanEvidenceIds.length > 0
    && actionPlanEvidenceIds.some(id => resolutionEvidenceIds.includes(id))
    && isMeaningfulResolutionText(actionPlan.problemFact)
    && isMeaningfulResolutionText(actionPlan.observedResolution)
    && isMeaningfulResolutionText(actionPlan.action);
  const proposedAction = safeString(actionPlan.action || topic.actionNeeded).trim();
  const isGenericAdvice = /провести\s+обучение|добавить\s+инструкц|обновить\s+инструкц|закрепить.*(?:бз|баз[аеы]\s+знаний)|разобрать\s+(?:3\s*[-–]\s*5|типов)|уточнить\s+(?:маршрут|критерии)|сделать\s+(?:чек-лист|карточку)/i.test(proposedAction);
  const legacyActionHasEvidence = resolutionEvidenceIds.length > 0 && isMeaningfulResolutionText(proposedAction) && !isGenericAdvice;
  const hasResolutionEvidence = resolutionEvidenceIds.length > 0;
  const actionNeeded = actionPlanHasTrace
    ? proposedAction
    : (legacyActionHasEvidence
      ? proposedAction
      : `План не сформирован: ${actionDataGap || 'сначала нужны 3–5 обращений этой темы с описанием проблемы и содержательным итоговым комментарием исполнителя.'}`);
  const checkText = actionPlanHasTrace
    ? safeString(actionPlan.successMetric || topic.check || 'Через неделю проверить эффект по обращениям этой темы.').trim()
    : (legacyActionHasEvidence
      ? safeString(topic.check || 'Через неделю проверить повторяемость проблемы и эффект по обращениям этой темы.').trim()
      : 'После следующей выгрузки проверить, появились ли минимум 3 обращения с подтверждённым ходом решения.');
  const confirmedResolutionText = actionPlanHasTrace
    ? safeString(actionPlan.observedResolution).trim()
    : (supportedResolutionPatterns.length
      ? safeString(supportedResolutionPatterns[0].name || supportedResolutionPatterns[0].resolution).trim()
      : (resolvedRelatedCases.length
        ? safeString(resolvedRelatedCases[0].resolution || resolvedRelatedCases[0].solution || resolvedRelatedCases[0].resolutionText || resolvedRelatedCases[0].comment).trim()
        : 'Не подтверждено комментариями исполнителей.'));
  const confirmedProblemFact = actionPlanHasTrace
    ? safeString(actionPlan.problemFact).trim()
    : (resolvedRelatedCases.length
      ? safeString(resolvedRelatedCases[0].problemContext || resolvedRelatedCases[0].symptom || resolvedRelatedCases[0].title || resolvedRelatedCases[0].summary).trim()
      : safeString(topic.rootCauseHypothesis || topic.problemType || 'Фактический контекст обращений ещё не собран.').trim());
  const resolutionEvidenceText = resolutionEvidenceIds.length
    ? `Подтверждение: ${resolutionEvidenceIds.slice(0, 5).join(', ')}${resolutionEvidenceIds.length > 5 ? ` +${resolutionEvidenceIds.length - 5}` : ''}`
    : 'Подтверждающих обращений в выгрузке нет';
  const resolutionPatternCards = supportedResolutionPatterns.length
    ? supportedResolutionPatterns.map(item => `<div><b>${html(item.name || item.resolution || 'Способ не описан')}</b><span class="muted">${item.count !== undefined ? `${html(count(item.count))} подтверждено` : 'подтверждено обращениями'} · ${html((item.evidenceIds || []).slice(0, 4).join(', '))}</span></div>`).join('')
    : '<div><b>Способы решения не подтверждены</b><span class="muted">Нужны содержательные итоговые комментарии исполнителей, связанные с номерами обращений.</span></div>';
  const subProblemRows = subProblems.length ? subProblems.map((item, index) => `
    <tr>
      <td><strong>${index + 1}. ${html(item.name)}</strong></td>
      <td class="num">${html(count(item.count))}</td>
      <td class="num">${html(pct(item.share))}</td>
      <td>${html(item.meaning)}</td>
      <td>${html(hasResolutionEvidence ? item.action : 'Сначала подтвердить фактический способ решения по комментариям обращений.')}</td>
    </tr>
  `).join('') : `
    <tr><td><strong>1. Основная тема</strong></td><td class="num">${html(count(topicCount))}</td><td class="num">${html(pct(topicShare))}</td><td>${html(topic.problemType || 'тип проблемы требует уточнения')}</td><td>${html(actionNeeded)}</td></tr>
    <tr><td><strong>2. Доказательства решения</strong></td><td class="num">${html(count(resolvedRelatedCount))}</td><td class="num">${resolutionCoverage === null ? 'нет данных' : html(pct(resolutionCoverage))}</td><td>${html(confirmedResolutionText)}</td><td>${html(checkText)}</td></tr>
  `;
  const commentAuditFiltered = (Number(commentAudit.automationFilteredCount) || 0)
    + (Number(commentAudit.ratingFilteredCount) || 0)
    + (Number(commentAudit.formalFilteredCount) || 0);
  const topicEvidenceText = [
    `${Math.round(topicCount)} тикетов`,
    slaBreaches === null ? '' : `${Math.round(slaBreaches)} SLA-просрочек`,
    topic.mainRoute || topic.supportLevel || ''
  ].filter(Boolean).join(' · ');
  const caseRows = relatedCases.length ? relatedCases.slice(0, 12).map(item => {
    const resolutionText = item.resolution || item.solution || item.resolutionText || item.comment || 'Не зафиксировано';
    return `
    <tr>
      <td><strong>${html(item.id || item.key || item.issueKey || 'без номера')}</strong><br><span class="muted">${html(item.assignee || item.executor || item.responsible || 'исполнитель не указан')}</span></td>
      <td><strong>${html(item.title || item.summary || item.reason || 'Описание не передано')}</strong>${item.symptom ? `<br><span class="muted">Симптом: ${html(item.symptom)}</span>` : ''}</td>
      <td>${html(item.diagnosis || 'Не зафиксировано')}</td>
      <td><strong>${html(resolutionText)}</strong>${item.resolutionSource ? `<br><span class="muted">Источник: ${html(item.resolutionSource)}</span>` : ''}</td>
      <td>${html(item.route || item.slaType || item.domain || 'маршрут не указан')}${item.overdueMin !== undefined && item.overdueMin !== null ? `<br><span class="muted">Просрочка: ${html(Math.round(num(item.overdueMin)))} мин</span>` : ''}</td>
      <td>${html(item.reusableStep || 'Пока нечего переносить в БЗ')}</td>
    </tr>
  `; }).join('') : '<tr><td colspan="6" class="muted">Список обращений не найден в JSON. Для следующей выгрузки желательно добавить примеры обращений по топ-теме.</td></tr>';
  const slaDropCards = [
    {
      title: 'Где просело',
      value: worstSlaLabel,
      text: worstSla >= 95
        ? 'SLA достиг цели 95%. На дейли показываем это как стандарт, который нужно удержать.'
        : `До цели 95% не хватает ${Math.max(primaryGap, resolutionGap).toFixed(1).replace('.0', '')} п.п. Смотрим причины по маршрутам и топ-теме.`
    },
    {
      title: 'Самый слабый маршрут',
      value: weakRoute?.route || topic.mainRoute || topic.supportLevel || 'нужно уточнить',
      text: weakRoute
        ? `По этому маршруту хуже всего выглядит SLA: взятие ${weakRoute.primarySla === null ? 'нет данных' : pct(weakRoute.primarySla)}, решение ${weakRoute.resolutionSla === null ? 'нет данных' : pct(weakRoute.resolutionSla)}.`
        : 'Пока недостаточно SLA-данных по маршрутам. Используем топ-тему и примеры обращений.'
    },
    {
      title: 'Главная причина недели',
      value: topicName,
      text: `${count(topicCount)}, ${pct(topicShare)} от закрытых. Действие недели: ${actionNeeded}.`
    }
  ];
  const dataGaps = [
    relatedCases.length ? '' : 'Добавить в JSON примеры тикетов по топ-теме: id, title, resolution, route, assignee, SLA.',
    hasResolutionEvidence ? '' : 'В примерах нет содержательного хода решения: команда видит проблему, но не может переиспользовать способ устранения.',
    topic.slaBreaches === null || topic.slaBreaches === undefined ? 'Передавать SLA-просрочки внутри bottleneckThemes.' : '',
    'Фиксировать итог постмортема: причина, действие, владелец, дата проверки.'
  ].filter(Boolean).map(item => `<li>${html(item)}</li>`).join('');
  const postmortemSymptoms = (Array.isArray(topic.topSymptoms) ? topic.topSymptoms : [])
    .map(item => ({
      name: safeString(typeof item === 'string' ? item : (item?.name || item?.symptom)).trim(),
      count: typeof item === 'object' && item?.count !== undefined ? num(item.count) : null
    }))
    .filter(item => item.name)
    .slice(0, 3);
  const postmortemBreakdown = (Array.isArray(subProblems) ? subProblems : [])
    .filter(item => safeString(item?.name).trim())
    .slice(0, 3);
  const postmortemCauseText = safeString(topic.rootCauseHypothesis).trim()
    || 'Причина пока не подтверждена: нужен разбор контекста и итоговых комментариев связанных обращений.';
  const compactActionText = hasResolutionEvidence
    ? actionNeeded
    : 'Разбор решения пока не готов. Собрать минимум 3 обращения с контекстом проблемы и итоговым комментарием исполнителя.';

  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Постмортем ТОП-1 проблемы</title><style>
    :root{--ink:#102033;--muted:#64748b;--line:#d9e2ec;--paper:#f7fafc;--blue:#2563eb}
    *{box-sizing:border-box}body{margin:0;background:#eef2f7;color:var(--ink);font-family:Aptos,Calibri,"Segoe UI",Arial,sans-serif;line-height:1.48}.page{max-width:1120px;margin:0 auto;padding:34px 28px 56px}
    .hero{background:radial-gradient(circle at 78% 18%,rgba(56,189,248,.30),transparent 28%),linear-gradient(135deg,#0f172a,#102033 54%,#13294b);color:#fff;border-radius:28px;padding:34px;box-shadow:0 28px 70px rgba(15,23,42,.22);overflow:hidden}
    .hero-grid{display:grid;grid-template-columns:1fr 1.22fr;gap:30px;align-items:center}.eyebrow{color:#9ce7d1;font-size:12px;text-transform:uppercase;letter-spacing:.16em;font-weight:900;margin-bottom:10px}h1{font-size:38px;line-height:1.05;margin:0 0 10px}.subtitle{margin:0;color:#dbeafe;font-size:16px}.meter-grid{display:grid;grid-template-columns:1fr;gap:14px}.pulse,.phone-pulse{position:relative;border:1px solid rgba(255,255,255,.16);border-top:4px solid ${currentState.color};background:linear-gradient(135deg,rgba(255,255,255,.10),rgba(255,255,255,.045));border-radius:24px;padding:16px;min-height:178px;overflow:hidden;display:grid;grid-template-columns:120px 1fr;grid-template-areas:"head head" "visual title" "visual note" "visual target";column-gap:18px;align-items:center}.phone-pulse{border-top-color:var(--phone);background:linear-gradient(135deg,rgba(14,165,233,.12),rgba(255,255,255,.045))}.pulse:before,.phone-pulse:before{content:"";position:absolute;inset:-70px auto auto -70px;width:150px;height:150px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.14),transparent 62%)}.meter-head{grid-area:head;position:relative;z-index:1;display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px;padding-bottom:9px;border-bottom:1px solid rgba(255,255,255,.12)}.meter-head span{display:block;color:#fff;font-size:12px;text-transform:uppercase;letter-spacing:.12em;font-weight:900}.meter-head em{display:block;color:#bfdbfe;font-size:10px;font-style:normal;text-align:right;line-height:1.25}.orb,.phone-art{grid-area:visual;position:relative;width:108px;height:108px;border-radius:50%;margin:0;background:radial-gradient(circle at 36% 32%,#fff,${currentState.color} 28%,#111827 74%);box-shadow:0 0 32px ${currentState.color},inset 0 0 24px rgba(255,255,255,.18)}.orb:after,.phone-art:after{content:"";position:absolute;inset:-8px;border:1px solid rgba(255,255,255,.14);border-radius:50%}.phone-art{background:radial-gradient(circle at 38% 32%,rgba(255,255,255,.92),var(--phone) 34%,#0f172a 76%);box-shadow:0 0 32px var(--phone),inset 0 0 24px rgba(255,255,255,.16);display:grid;place-items:center}.phone-art:before{content:"";position:absolute;inset:20px;border-radius:50%;border:1px solid rgba(255,255,255,.18)}.phone-wave,.phone-core{display:none}.phone-svg{position:relative;z-index:1;width:52px;height:52px;fill:#fff;filter:drop-shadow(0 8px 16px rgba(0,0,0,.38))}.missed-badge{position:absolute;z-index:2;right:-6px;top:-6px;min-width:34px;height:28px;border-radius:999px;background:var(--phone);color:#fff;display:grid;place-items:center;font-size:13px;font-weight:900;box-shadow:0 8px 18px rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.45)}.pulse-title{grid-area:title;text-align:left;font-size:21px;font-weight:900;color:#fff;align-self:end}.pulse-note{grid-area:note;text-align:left;color:#cbd5e1;font-size:12px;margin-top:3px;min-height:0;align-self:start}.sla-target{grid-area:target;margin-top:8px;text-align:left;background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.16);border-radius:14px;padding:10px 12px}.sla-target b{display:block;font-size:28px;color:#fff;line-height:1.05}.sla-target span{font-size:10px;color:#dbeafe;text-transform:uppercase;letter-spacing:.08em;font-weight:900}.scale-label{margin:22px 0 8px;color:#93c5fd;font-size:11px;text-transform:uppercase;letter-spacing:.14em;font-weight:900}.traffic{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}.state{border:1px solid rgba(255,255,255,.12);border-top:5px solid var(--c);border-radius:16px;padding:10px;background:rgba(255,255,255,.08)}.state b{display:block;font-size:12px}.state span{display:block;color:#cbd5e1;font-size:10px;margin-top:3px}.kpi{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin:16px 0}.card,section{background:#fff;border:1px solid var(--line);border-radius:18px;box-shadow:0 12px 28px rgba(15,23,42,.05)}.card{padding:16px}.card small{display:block;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.08em;font-weight:900}.card strong{display:block;font-size:27px;margin-top:6px;color:#102033}.flow{display:grid;grid-template-columns:1fr 34px 1fr 34px 1fr 34px 1fr;align-items:stretch;gap:8px;margin:16px 0}.flow-step{border:1px solid var(--line);border-top:5px solid var(--c);border-radius:18px;padding:16px;background:#fff}.flow-step small{display:block;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:.08em;font-weight:900}.flow-step b{display:block;font-size:21px;margin:6px 0;color:#102033}.flow-step p{font-size:12px;color:#475569}.arrow{display:grid;place-items:center;color:#64748b;font-size:28px;font-weight:900}.drop-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.drop-card{border:1px solid var(--line);border-left:6px solid ${currentState.color};border-radius:16px;padding:14px;background:#fff}.drop-card small{display:block;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:.08em;font-weight:900}.drop-card b{display:block;font-size:16px;margin:5px 0;color:#102033}.modal-toggle{display:none}.modal{display:none;position:fixed;z-index:50;inset:0;background:rgba(15,23,42,.72);padding:36px;overflow:auto}.modal-toggle:checked+.modal{display:block}.modal-panel{max-width:980px;margin:0 auto;background:#fff;border-radius:24px;padding:24px;box-shadow:0 30px 80px rgba(0,0,0,.35)}.modal-head{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;margin-bottom:14px}.modal-close,.modal-open{display:inline-block;cursor:pointer;border:0;border-radius:999px;font-weight:900}.modal-close{background:#0f172a;color:#fff;padding:9px 13px}.modal-open{margin-top:12px;background:#102033;color:#fff;padding:10px 15px;box-shadow:0 10px 22px rgba(15,23,42,.18)}.signal-strip{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px}.signal-strip div{border:1px solid #dbeafe;background:linear-gradient(135deg,#f8fbff,#fff);border-radius:14px;padding:12px}.signal-strip b{display:block;color:#1d4ed8}section{padding:22px;margin:16px 0}h2{font-size:21px;margin:0 0 12px}p{margin:0 0 10px}.note{background:#f8fafc;border:1px solid var(--line);border-radius:14px;padding:14px;color:#334155}.focus{border-left:6px solid ${currentState.color};background:${currentState.bg};padding:16px;border-radius:16px;color:#102033}table{width:100%;border-collapse:collapse;font-size:13px}th{text-align:left;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:.08em;padding:10px;border-bottom:1px solid var(--line)}td{padding:10px;border-bottom:1px solid #edf2f7;vertical-align:top}.num{text-align:right;white-space:nowrap;font-weight:900}.muted{color:#64748b}.plan{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.plan div{background:#f8fafc;border:1px solid var(--line);border-radius:14px;padding:14px}.plan b{display:block;color:#1d4ed8;margin-bottom:6px}@media(max-width:980px){.hero-grid{grid-template-columns:1fr}}@media(max-width:820px){.kpi,.traffic,.plan,.flow,.drop-grid,.signal-strip{grid-template-columns:1fr}.pulse,.phone-pulse{grid-template-columns:1fr;grid-template-areas:"head" "visual" "title" "note" "target";text-align:center}.orb,.phone-art{margin:0 auto}.pulse-title,.pulse-note,.sla-target{text-align:center}.arrow{display:none}h1{font-size:30px}.modal{padding:16px}}@media print{body{background:#fff}.page{padding:0}.hero,section,.card{box-shadow:none;break-inside:avoid}.modal{display:block;position:static;background:#fff;padding:0}.modal-close,.modal-open{display:none}}
  </style></head><body><main class="page">
	    <style>
	      .hero-grid{grid-template-columns:1fr;gap:22px}.meter-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
      .pulse,.phone-pulse{min-height:0;grid-template-columns:76px 1fr;grid-template-areas:"head head" "visual title" "visual note" "visual target";column-gap:14px}
      .orb,.phone-art{width:66px;height:66px;box-shadow:0 0 20px ${currentState.color},inset 0 0 16px rgba(255,255,255,.16)}
      .phone-art{box-shadow:0 0 20px var(--phone),inset 0 0 16px rgba(255,255,255,.16)}.phone-svg{width:32px;height:32px}.pulse-title{font-size:19px}
      .sla-target{display:flex;align-items:end;justify-content:space-between;gap:12px}.sla-target b{font-size:24px}
	      .team-snapshot{display:grid;grid-template-columns:.75fr 1.1fr 1.15fr 1.15fr;gap:0;margin:16px 0;background:#fff;border:1px solid var(--line);border-radius:16px;overflow:hidden;box-shadow:0 12px 28px rgba(15,23,42,.06)}
      .snapshot-item{padding:17px;border-right:1px solid var(--line)}.snapshot-item:last-child{border-right:0}.snapshot-item small{display:block;color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:.1em;font-weight:900}.snapshot-item strong{display:block;margin:6px 0 3px;font-size:17px;line-height:1.2}.snapshot-item span{display:block;color:#64748b;font-size:12px}.snapshot-status{border-top:5px solid ${currentState.color};background:${currentState.bg}}.snapshot-cause{border-top:5px solid #8b5cf6}.snapshot-action{border-top:5px solid #2563eb}
	      .weekly-showcase{position:relative;isolation:isolate;overflow:hidden;aspect-ratio:16/9;min-height:610px;border:1px solid rgba(103,232,249,.28);border-radius:28px;padding:34px;color:#fff;background:radial-gradient(circle at 12% 12%,rgba(34,211,238,.34),transparent 28%),radial-gradient(circle at 88% 18%,rgba(249,115,22,.42),transparent 30%),radial-gradient(circle at 72% 90%,rgba(168,85,247,.34),transparent 30%),linear-gradient(135deg,#020817 0%,#08182b 44%,#11112d 72%,#251025 100%);box-shadow:0 34px 90px rgba(2,8,23,.38)}.weekly-showcase:before{content:"";position:absolute;z-index:-2;inset:0;background-image:linear-gradient(rgba(125,211,252,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(125,211,252,.06) 1px,transparent 1px);background-size:32px 32px;mask-image:linear-gradient(to bottom,#000,transparent 88%)}.weekly-showcase:after{content:"";position:absolute;z-index:-1;width:420px;height:420px;right:-160px;bottom:-210px;border:1px solid rgba(255,255,255,.18);border-radius:50%;box-shadow:0 0 0 42px rgba(255,255,255,.025),0 0 0 84px rgba(255,255,255,.018)}.showcase-top{display:flex;align-items:center;justify-content:space-between;gap:20px;padding-bottom:18px;border-bottom:1px solid rgba(255,255,255,.14)}.showcase-brand{display:flex;align-items:center;gap:12px;font:900 11px/1 Consolas,"Courier New",monospace;letter-spacing:.18em;text-transform:uppercase;color:#67e8f9}.showcase-brand i{display:block;width:12px;height:12px;border-radius:3px;background:linear-gradient(135deg,#22d3ee,#a855f7);box-shadow:0 0 24px #22d3ee}.showcase-period{font:800 11px/1.2 Consolas,"Courier New",monospace;color:#cbd5e1;text-align:right}.showcase-period b{display:block;margin-top:4px;color:#fff;font-size:13px}.showcase-main{display:grid;grid-template-columns:.86fr 1.14fr;gap:26px;align-items:stretch;margin-top:26px}.showcase-outcome{display:flex;flex-direction:column;justify-content:center;min-width:0}.showcase-kicker{font:900 11px/1 Consolas,"Courier New",monospace;letter-spacing:.18em;text-transform:uppercase;color:#a5f3fc}.showcase-number{margin:14px 0 0;font:950 clamp(86px,10vw,144px)/.78 Aptos,Calibri,"Segoe UI",sans-serif;letter-spacing:-.08em;color:#fff;text-shadow:0 0 42px rgba(34,211,238,.34)}.showcase-number-label{margin-top:18px;font-size:20px;font-weight:900;color:#dbeafe}.showcase-number-note{margin-top:5px;color:#94a3b8;font-size:12px}.showcase-kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin-top:24px}.showcase-kpi{border:1px solid rgba(255,255,255,.13);border-top:3px solid var(--accent);border-radius:13px;padding:11px;background:rgba(2,8,23,.48);backdrop-filter:blur(10px)}.showcase-kpi span{display:block;color:#94a3b8;font:800 9px/1.25 Consolas,"Courier New",monospace;text-transform:uppercase;letter-spacing:.08em}.showcase-kpi b{display:block;margin-top:6px;color:#fff;font-size:20px;line-height:1}.showcase-problem{position:relative;overflow:hidden;display:flex;flex-direction:column;border:1px solid rgba(251,146,60,.34);border-radius:22px;padding:22px;background:linear-gradient(145deg,rgba(120,53,15,.46),rgba(69,10,10,.38) 45%,rgba(15,23,42,.72));box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 20px 60px rgba(0,0,0,.18)}.showcase-problem:before{content:"TOP 01";position:absolute;right:-9px;top:36px;color:rgba(255,255,255,.035);font:950 84px/1 Aptos,Calibri,sans-serif;letter-spacing:-.08em;transform:rotate(-4deg)}.showcase-problem-head{position:relative;display:flex;align-items:center;justify-content:space-between;gap:12px}.showcase-problem-head span{font:900 10px/1 Consolas,"Courier New",monospace;letter-spacing:.16em;text-transform:uppercase;color:#fed7aa}.showcase-problem-count{display:grid;place-items:center;min-width:52px;height:34px;border:1px solid rgba(253,186,116,.38);border-radius:999px;background:rgba(249,115,22,.18);color:#fff;font:900 14px/1 Consolas,"Courier New",monospace;box-shadow:0 0 28px rgba(249,115,22,.2)}.showcase-problem h2{position:relative;margin:17px 0 8px;max-width:92%;font-size:clamp(28px,3vw,42px);line-height:1.02;letter-spacing:-.045em;color:#fff}.showcase-problem-meta{position:relative;color:#fdba74;font:800 11px/1.45 Consolas,"Courier New",monospace}.showcase-problem p{position:relative;margin:8px 0 0;color:#cbd5e1;font-size:12px}.showcase-resolution,.showcase-action{position:relative;border-radius:13px;padding:10px 12px}.showcase-resolution{margin-top:10px;border:1px solid rgba(34,211,238,.26);background:linear-gradient(135deg,rgba(8,47,73,.62),rgba(15,23,42,.62))}.showcase-resolution span,.showcase-action span{display:block;font:900 9px/1 Consolas,"Courier New",monospace;letter-spacing:.14em;text-transform:uppercase}.showcase-resolution span{color:#67e8f9}.showcase-resolution strong,.showcase-action strong{display:block;margin-top:6px;font-size:12px;line-height:1.32}.showcase-resolution strong{color:#ecfeff}.showcase-resolution small{display:block;margin-top:5px;color:#7dd3fc;font:700 9px/1.25 Consolas,"Courier New",monospace}.showcase-action{margin-top:8px;border:1px solid rgba(110,231,183,.24);background:linear-gradient(135deg,rgba(6,78,59,.56),rgba(15,23,42,.66))}.showcase-action span{color:#6ee7b7}.showcase-action strong{color:#ecfdf5}.showcase-action.is-gap{border-color:rgba(251,191,36,.34);background:linear-gradient(135deg,rgba(120,53,15,.46),rgba(15,23,42,.66))}.showcase-action.is-gap span{color:#fcd34d}.showcase-action.is-gap strong{color:#fffbeb}.showcase-footer{display:grid;grid-template-columns:.7fr .7fr 1.6fr;gap:10px;margin-top:20px}.showcase-footer>div{border:1px solid rgba(255,255,255,.11);border-radius:12px;padding:10px 12px;background:rgba(2,8,23,.42)}.showcase-footer span{display:block;color:#64748b;font:800 8px/1 Consolas,"Courier New",monospace;text-transform:uppercase;letter-spacing:.12em}.showcase-footer b{display:block;margin-top:5px;color:#e2e8f0;font-size:12px}.showcase-footer .showcase-message{display:flex;align-items:center;color:#c4b5fd;font-size:11px;font-weight:800;border-color:rgba(196,181,253,.2)}.detail-divider{display:flex;align-items:center;gap:14px;margin:25px 2px 14px;color:#64748b;font:900 10px/1 Consolas,"Courier New",monospace;letter-spacing:.16em;text-transform:uppercase}.detail-divider:before,.detail-divider:after{content:"";height:1px;flex:1;background:linear-gradient(90deg,transparent,#94a3b8)}.detail-divider:after{background:linear-gradient(90deg,#94a3b8,transparent)}
	      body{background:#e7edf5}.page{max-width:1180px;padding-top:28px}.hero{position:relative;border:1px solid #28475f;background-color:#071421;background-image:linear-gradient(rgba(56,189,248,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(56,189,248,.055) 1px,transparent 1px),radial-gradient(circle at 86% 12%,rgba(245,158,11,.22),transparent 28%),linear-gradient(135deg,#07111f,#0d2238 58%,#102a43);background-size:28px 28px,28px 28px,auto,auto;box-shadow:0 28px 70px rgba(7,17,31,.25)}.hero:after{content:"";position:absolute;right:-95px;bottom:-135px;width:350px;height:350px;border:1px solid rgba(56,189,248,.18);border-radius:50%;box-shadow:0 0 0 36px rgba(56,189,248,.035),0 0 0 72px rgba(56,189,248,.024)}.hero-grid,.scale-label,.traffic,.report-brand{position:relative;z-index:1}.report-brand{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:25px;padding-bottom:14px;border-bottom:1px solid rgba(148,163,184,.22);font:800 10px/1.2 Consolas,"Courier New",monospace;letter-spacing:.16em;text-transform:uppercase;color:#7dd3fc}.report-brand b{color:#fde68a}.eyebrow,.meter-head span,.meter-head em,.scale-label,.state b,.state span,.card small,.flow-step small,.drop-card small,th{font-family:Consolas,"Courier New",monospace}.hero h1{font-size:42px;max-width:760px}.pulse,.phone-pulse{border-radius:16px;background:rgba(7,20,33,.72);backdrop-filter:blur(8px)}.team-snapshot{border-color:#cbd8e6}.snapshot-item{background:linear-gradient(180deg,#fff,#f8fbfe)}.kpi .card{border-radius:14px;border-color:#cbd8e6;background:linear-gradient(180deg,#fff,#f8fbfe);box-shadow:0 8px 22px rgba(15,35,55,.055)}.card strong,.flow-step b{font-family:Consolas,"Courier New",monospace}.flow-step{border-radius:14px;box-shadow:0 8px 22px rgba(15,35,55,.05)}section{position:relative;border-radius:16px;border-color:#cdd9e6;box-shadow:0 10px 28px rgba(15,35,55,.055);overflow:hidden}section:before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:linear-gradient(#38bdf8,#f59e0b);opacity:.72}section h2{display:flex;align-items:center;gap:10px;font-size:19px;color:#0b2035}section h2:before{content:"";width:8px;height:8px;border-radius:2px;background:#f59e0b;box-shadow:0 0 0 4px #fef3c7}.note,.focus{border-radius:12px}.focus{border-left-color:#0ea5e9;background:linear-gradient(135deg,#eff8ff,#f8fbff)}.drop-card,.plan div,.signal-strip div{border-radius:12px}.modal-panel{border:1px solid #cbd8e6;border-radius:18px}.modal-close,.modal-open{border-radius:7px;font-family:Consolas,"Courier New",monospace;text-transform:uppercase;letter-spacing:.04em}table{border:1px solid #d6e0ea;border-radius:12px;overflow:hidden}th{background:#0d2238;color:#b9d7ee;padding:11px 10px;border-bottom-color:#24445f}td{color:#334155}tbody tr:nth-child(even){background:#f7fafc}tbody tr:hover{background:#fff8e8}table td:nth-child(4) strong{color:#047857}.muted{color:#64748b}.scale-label{margin-top:16px}.traffic{opacity:.9}.state{padding:8px;background:rgba(7,20,33,.66)}.state b{font-size:11px}.state span{color:#94a3b8}
	      .showcase-frame{position:relative;isolation:isolate;overflow:hidden;aspect-ratio:16/9;min-height:610px;border-radius:28px;padding:34px;color:#fff;box-shadow:0 34px 90px rgba(2,8,23,.34);margin-bottom:24px}.showcase-frame:before{content:"";position:absolute;z-index:-2;inset:0;background-image:linear-gradient(rgba(125,211,252,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(125,211,252,.055) 1px,transparent 1px);background-size:32px 32px;mask-image:linear-gradient(to bottom,#000,transparent 90%)}.showcase-frame:after{content:"";position:absolute;z-index:-1;width:430px;height:430px;right:-175px;bottom:-230px;border:1px solid rgba(255,255,255,.16);border-radius:50%;box-shadow:0 0 0 44px rgba(255,255,255,.022),0 0 0 88px rgba(255,255,255,.014)}.ops-showcase{background:radial-gradient(circle at 12% 12%,rgba(34,211,238,.32),transparent 28%),radial-gradient(circle at 88% 22%,rgba(37,99,235,.30),transparent 34%),linear-gradient(135deg,#020817,#071a2d 55%,#111a38);border:1px solid rgba(103,232,249,.28)}.ops-stage{display:grid;grid-template-columns:.88fr 1.12fr;gap:34px;align-items:stretch;margin-top:28px}.ops-control{border:1px solid rgba(125,211,252,.22);border-radius:22px;padding:24px;background:linear-gradient(145deg,rgba(8,47,73,.66),rgba(2,8,23,.74));box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 20px 60px rgba(0,0,0,.20)}.ops-control-head{display:flex;justify-content:space-between;align-items:center;padding-bottom:15px;border-bottom:1px solid rgba(255,255,255,.12)}.ops-control-head span{color:#7dd3fc;font:900 10px/1 Consolas,"Courier New",monospace;letter-spacing:.16em;text-transform:uppercase}.ops-control-head b{font-size:13px;color:${currentState.color}}.ops-sla-hero{display:grid;grid-template-columns:150px 1fr;gap:22px;align-items:center;padding:24px 0 18px}.ops-ring{width:142px;height:142px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(${currentState.color} ${Math.max(0, Math.min(100, primarySla))}%,rgba(255,255,255,.09) 0);box-shadow:0 0 42px color-mix(in srgb,${currentState.color} 35%,transparent);position:relative}.ops-ring:after{content:"";position:absolute;inset:13px;border-radius:50%;background:#071629;border:1px solid rgba(255,255,255,.10)}.ops-ring div{position:relative;z-index:1;text-align:center}.ops-ring strong{display:block;font-size:34px;line-height:1}.ops-ring span{display:block;margin-top:6px;color:#94a3b8;font:800 9px/1.2 Consolas,"Courier New",monospace;text-transform:uppercase}.ops-sla-copy small{display:block;color:#94a3b8;font:900 9px/1 Consolas,"Courier New",monospace;letter-spacing:.12em;text-transform:uppercase}.ops-sla-copy h2{margin:8px 0;color:#fff;font-size:27px;line-height:1.08}.ops-sla-copy p{color:#cbd5e1;font-size:13px}.ops-sla-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.ops-sla-card{border:1px solid rgba(255,255,255,.11);border-radius:14px;padding:13px;background:rgba(2,8,23,.45)}.ops-sla-card span{display:block;color:#94a3b8;font:800 9px/1.25 Consolas,"Courier New",monospace;text-transform:uppercase;letter-spacing:.08em}.ops-sla-card b{display:block;margin-top:7px;font-size:21px;color:#fff}.ops-sla-card small{display:block;margin-top:5px;color:#7dd3fc;font-size:10px}.ops-footer{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:20px}.ops-footer div{border:1px solid rgba(255,255,255,.11);border-radius:13px;padding:11px 13px;background:rgba(2,8,23,.42)}.ops-footer span{display:block;color:#64748b;font:800 8px/1 Consolas,"Courier New",monospace;text-transform:uppercase;letter-spacing:.12em}.ops-footer b{display:block;margin-top:5px;color:#e2e8f0;font-size:12px}.postmortem-showcase{background:radial-gradient(circle at 88% 12%,rgba(249,115,22,.34),transparent 30%),radial-gradient(circle at 12% 88%,rgba(168,85,247,.30),transparent 32%),linear-gradient(135deg,#07111f,#15132f 55%,#271023);border:1px solid rgba(251,146,60,.28)}.pm-heading{display:flex;justify-content:space-between;gap:24px;align-items:end;margin:24px 0 18px}.pm-heading small{display:block;color:#fdba74;font:900 10px/1 Consolas,"Courier New",monospace;letter-spacing:.16em;text-transform:uppercase}.pm-heading h2{max-width:840px;margin:10px 0 0;color:#fff;font-size:clamp(32px,4vw,50px);line-height:1;letter-spacing:-.045em}.pm-count{text-align:right;min-width:150px}.pm-count strong{display:block;color:#fff;font-size:43px;line-height:.95}.pm-count span{color:#fed7aa;font-size:12px}.pm-story{display:grid;grid-template-columns:1fr 1fr;gap:16px}.pm-panel{border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:18px;background:rgba(2,8,23,.52);backdrop-filter:blur(10px)}.pm-panel-label{display:block;color:#94a3b8;font:900 9px/1 Consolas,"Courier New",monospace;letter-spacing:.14em;text-transform:uppercase}.pm-fact strong{display:block;margin-top:10px;color:#fff;font-size:18px;line-height:1.28}.pm-meta{margin-top:10px;color:#fdba74;font:800 10px/1.4 Consolas,"Courier New",monospace}.pm-symptoms{display:flex;flex-wrap:wrap;gap:7px;margin-top:14px}.pm-symptom{border:1px solid rgba(251,146,60,.25);border-radius:999px;padding:7px 10px;background:rgba(124,45,18,.24);color:#ffedd5;font-size:10px;font-weight:800}.pm-breakdown{margin-top:17px;padding-top:14px;border-top:1px solid rgba(255,255,255,.10)}.pm-breakdown-label{display:block;color:#94a3b8;font:900 9px/1 Consolas,"Courier New",monospace;letter-spacing:.13em;text-transform:uppercase}.pm-breakdown-row{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;margin-top:8px;border-radius:10px;padding:8px 10px;background:rgba(255,255,255,.045)}.pm-breakdown-row span{color:#e2e8f0;font-size:11px;font-weight:800}.pm-breakdown-row b{color:#fbbf24;font:900 11px/1 Consolas,"Courier New",monospace}.pm-analysis{display:grid;grid-template-rows:auto auto auto;gap:9px}.pm-analysis-card{border:1px solid rgba(255,255,255,.11);border-left:4px solid var(--pm-accent);border-radius:13px;padding:11px 13px;background:rgba(2,8,23,.48)}.pm-analysis-card span{display:block;color:var(--pm-accent);font:900 9px/1 Consolas,"Courier New",monospace;letter-spacing:.12em;text-transform:uppercase}.pm-analysis-card strong{display:block;margin-top:6px;color:#f8fafc;font-size:12px;line-height:1.35}.pm-analysis-card small{display:block;margin-top:5px;color:#94a3b8;font-size:9px}.pm-analysis-card.is-gap{--pm-accent:#fbbf24!important}.pm-evidence{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:15px;border:1px solid rgba(196,181,253,.19);border-radius:13px;padding:11px 13px;background:rgba(46,16,101,.20)}.pm-evidence span{color:#c4b5fd;font:900 9px/1 Consolas,"Courier New",monospace;letter-spacing:.12em;text-transform:uppercase}.pm-evidence b{color:#fff;font-size:11px;text-align:right}.technical-details{margin-top:22px}.technical-details>summary{cursor:pointer;list-style:none;border:1px solid #cbd8e6;border-radius:14px;padding:15px 18px;background:#fff;color:#0d2238;box-shadow:0 10px 28px rgba(15,35,55,.08);font:900 12px/1.3 Consolas,"Courier New",monospace;text-transform:uppercase;letter-spacing:.06em}.technical-details>summary::-webkit-details-marker{display:none}.technical-details>summary:after{content:"↓";float:right;color:#0ea5e9;font-size:17px}.technical-details[open]>summary:after{content:"↑"}.technical-body{padding-top:16px}
	      .showcase-kicker-row{display:flex;align-items:center;justify-content:space-between;gap:12px}.week-load-badge{border:1px solid color-mix(in srgb,var(--load-color) 45%,transparent);border-radius:999px;padding:7px 10px;background:color-mix(in srgb,var(--load-color) 13%,transparent);color:var(--load-color);font:900 9px/1 Consolas,"Courier New",monospace;text-transform:uppercase;letter-spacing:.08em;white-space:nowrap}.ops-phone-band{display:grid;grid-template-columns:auto 1fr 1fr 1fr 1.25fr;gap:12px;align-items:center;margin-top:11px;border:1px solid color-mix(in srgb,var(--phone-status) 42%,transparent);border-radius:15px;padding:12px 14px;background:linear-gradient(135deg,color-mix(in srgb,var(--phone-status) 13%,transparent),rgba(2,8,23,.58));box-shadow:inset 0 1px 0 rgba(255,255,255,.05)}.ops-phone-mark{width:38px;height:38px;display:grid;place-items:center;border-radius:12px;background:color-mix(in srgb,var(--phone-status) 20%,transparent);color:var(--phone-status);font-size:21px}.ops-phone-metric{padding-left:12px;border-left:1px solid rgba(255,255,255,.10)}.ops-phone-metric span{display:block;color:#94a3b8;font:800 8px/1.2 Consolas,"Courier New",monospace;text-transform:uppercase;letter-spacing:.08em}.ops-phone-metric b{display:block;margin-top:5px;color:#fff;font-size:20px;line-height:1}.ops-phone-state{padding-left:12px;border-left:1px solid rgba(255,255,255,.10)}.ops-phone-state span{display:block;color:#94a3b8;font:800 8px/1.2 Consolas,"Courier New",monospace;text-transform:uppercase}.ops-phone-state b{display:block;margin-top:5px;color:var(--phone-status);font-size:14px;line-height:1.1}.ops-phone-state small{display:block;margin-top:4px;color:#cbd5e1;font-size:9px}
	      .page{max-width:1520px}.email-sheet{background:linear-gradient(180deg,#fff,#f8fafc);border:1px solid #d7e1ec;border-radius:24px;padding:18px;box-shadow:0 24px 70px rgba(15,35,55,.12)}.email-dashboard-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.email-dashboard-grid .showcase-frame{min-height:0;margin:0;padding:21px;border-radius:22px;box-shadow:0 18px 42px rgba(2,8,23,.24)}.email-dashboard-grid .showcase-frame:before{background-size:23px 23px}.email-dashboard-grid .showcase-frame:after{width:290px;height:290px;right:-125px;bottom:-165px}.email-dashboard-grid .showcase-top{gap:12px;padding-bottom:11px}.email-dashboard-grid .showcase-brand{gap:8px;font-size:7px;letter-spacing:.14em}.email-dashboard-grid .showcase-brand i{width:8px;height:8px}.email-dashboard-grid .showcase-period{font-size:7px}.email-dashboard-grid .showcase-period b{margin-top:3px;font-size:8px}.email-dashboard-grid .ops-stage{grid-template-columns:.8fr 1.2fr;gap:15px;margin-top:15px}.email-dashboard-grid .showcase-kicker{font-size:7px;letter-spacing:.13em}.email-dashboard-grid .week-load-badge{padding:5px 7px;font-size:6px}.email-dashboard-grid .showcase-number{margin-top:11px;font-size:74px}.email-dashboard-grid .showcase-number-label{margin-top:12px;font-size:14px}.email-dashboard-grid .showcase-number-note{font-size:8px}.email-dashboard-grid .showcase-kpis{gap:5px;margin-top:13px}.email-dashboard-grid .showcase-kpi{padding:7px;border-radius:9px}.email-dashboard-grid .showcase-kpi span{font-size:6px}.email-dashboard-grid .showcase-kpi b{font-size:14px}.email-dashboard-grid .ops-control{padding:13px;border-radius:15px}.email-dashboard-grid .ops-control-head{padding-bottom:9px}.email-dashboard-grid .ops-control-head span{font-size:6px}.email-dashboard-grid .ops-control-head b{font-size:8px}.email-dashboard-grid .ops-sla-hero{grid-template-columns:78px 1fr;gap:12px;padding:12px 0 10px}.email-dashboard-grid .ops-ring{width:76px;height:76px}.email-dashboard-grid .ops-ring:after{inset:8px}.email-dashboard-grid .ops-ring strong{font-size:20px}.email-dashboard-grid .ops-ring span{font-size:5px}.email-dashboard-grid .ops-sla-copy small{font-size:6px}.email-dashboard-grid .ops-sla-copy h2{margin:5px 0;font-size:15px}.email-dashboard-grid .ops-sla-copy p{font-size:8px}.email-dashboard-grid .ops-sla-grid{gap:5px}.email-dashboard-grid .ops-sla-card{padding:7px;border-radius:9px}.email-dashboard-grid .ops-sla-card span{font-size:6px}.email-dashboard-grid .ops-sla-card b{margin-top:4px;font-size:13px}.email-dashboard-grid .ops-sla-card small{margin-top:3px;font-size:6px}.email-dashboard-grid .ops-phone-band{grid-template-columns:auto repeat(3,1fr);gap:6px;margin-top:7px;padding:7px 8px;border-radius:10px}.email-dashboard-grid .ops-phone-mark{width:24px;height:24px;border-radius:7px;font-size:13px}.email-dashboard-grid .ops-phone-metric{padding-left:6px}.email-dashboard-grid .ops-phone-metric span{font-size:5px}.email-dashboard-grid .ops-phone-metric b{margin-top:3px;font-size:12px}.email-dashboard-grid .ops-phone-state{grid-column:1/-1;padding:6px 0 0;border-left:0;border-top:1px solid rgba(255,255,255,.10);display:flex;align-items:center;justify-content:space-between;gap:8px}.email-dashboard-grid .ops-phone-state span{font-size:5px}.email-dashboard-grid .ops-phone-state b{margin:0;font-size:9px}.email-dashboard-grid .ops-phone-state small{margin:0;font-size:6px}.email-dashboard-grid .ops-footer{gap:6px;margin-top:11px}.email-dashboard-grid .ops-footer div{padding:7px 8px;border-radius:8px}.email-dashboard-grid .ops-footer span{font-size:5px}.email-dashboard-grid .ops-footer b{margin-top:3px;font-size:7px}.email-dashboard-grid .pm-heading{gap:12px;margin:14px 0 11px}.email-dashboard-grid .pm-heading small{font-size:6px}.email-dashboard-grid .pm-heading h2{max-width:510px;margin-top:6px;font-size:25px}.email-dashboard-grid .pm-count{min-width:70px}.email-dashboard-grid .pm-count strong{font-size:26px}.email-dashboard-grid .pm-count span{font-size:7px}.email-dashboard-grid .pm-story{gap:8px}.email-dashboard-grid .pm-panel{padding:10px;border-radius:12px}.email-dashboard-grid .pm-panel-label,.email-dashboard-grid .pm-breakdown-label{font-size:6px}.email-dashboard-grid .pm-fact strong{margin-top:6px;font-size:11px}.email-dashboard-grid .pm-meta{margin-top:6px;font-size:6px}.email-dashboard-grid .pm-symptoms{gap:4px;margin-top:8px}.email-dashboard-grid .pm-symptom{padding:4px 6px;font-size:6px}.email-dashboard-grid .pm-breakdown{margin-top:9px;padding-top:8px}.email-dashboard-grid .pm-breakdown-row{gap:7px;margin-top:5px;padding:5px 6px;border-radius:7px}.email-dashboard-grid .pm-breakdown-row span,.email-dashboard-grid .pm-breakdown-row b{font-size:7px}.email-dashboard-grid .pm-analysis{gap:5px}.email-dashboard-grid .pm-analysis-card{padding:7px 8px;border-left-width:3px;border-radius:9px}.email-dashboard-grid .pm-analysis-card span{font-size:6px}.email-dashboard-grid .pm-analysis-card strong{margin-top:4px;font-size:8px;line-height:1.25}.email-dashboard-grid .pm-analysis-card small{margin-top:3px;font-size:6px}.email-dashboard-grid .pm-evidence{gap:8px;margin-top:8px;padding:7px 8px;border-radius:9px}.email-dashboard-grid .pm-evidence span{font-size:6px}.email-dashboard-grid .pm-evidence b{font-size:7px}.email-brief{display:grid;grid-template-columns:.8fr 1fr 1.35fr;gap:12px;margin-top:14px}.email-brief-card{position:relative;overflow:hidden;border:1px solid #dbe4ee;border-radius:15px;padding:14px 15px;background:#fff}.email-brief-card:before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--brief-accent)}.email-brief-card span{display:block;color:#64748b;font:900 8px/1 Consolas,"Courier New",monospace;text-transform:uppercase;letter-spacing:.11em}.email-brief-card strong{display:block;margin-top:7px;color:#102033;font-size:14px;line-height:1.25}.email-brief-card small{display:block;margin-top:5px;color:#64748b;font-size:10px;line-height:1.35}
	      /* Lotus Notes: больше полезной площади, ровная светлая подложка и читаемая типографика. */
	      body{background:#f4f7fb}.page{max-width:1780px}.email-sheet{padding:14px;border:1px solid #cbd5e1;border-radius:17px;background:#e8eef5;box-shadow:none}.email-dashboard-grid{gap:18px}.email-dashboard-grid .showcase-frame{padding:24px;border-radius:19px;box-shadow:0 12px 28px rgba(15,23,42,.20)}.email-dashboard-grid .ops-showcase{background:radial-gradient(circle at 12% 12%,rgba(34,211,238,.24),transparent 28%),radial-gradient(circle at 88% 22%,rgba(37,99,235,.22),transparent 34%),linear-gradient(135deg,#03111f,#08223a 56%,#111d3b)}.email-dashboard-grid .postmortem-showcase{background:radial-gradient(circle at 88% 12%,rgba(249,115,22,.25),transparent 30%),radial-gradient(circle at 12% 88%,rgba(168,85,247,.23),transparent 32%),linear-gradient(135deg,#081322,#171732 56%,#2b1423)}.email-dashboard-grid .showcase-frame:before{opacity:.58}.email-dashboard-grid .showcase-brand{font-size:8px}.email-dashboard-grid .showcase-period{font-size:8px}.email-dashboard-grid .showcase-period b{font-size:10px}.email-dashboard-grid .ops-stage{gap:18px;margin-top:18px}.email-dashboard-grid .showcase-kicker{font-size:8px}.email-dashboard-grid .week-load-badge{font-size:7px}.email-dashboard-grid .showcase-number{font-size:88px}.email-dashboard-grid .showcase-number-label{font-size:16px}.email-dashboard-grid .showcase-number-note{font-size:10px;color:#cbd5e1}.email-dashboard-grid .showcase-kpi{padding:9px;background:rgba(2,8,23,.72)}.email-dashboard-grid .showcase-kpi span{font-size:7px;color:#b6c5d8}.email-dashboard-grid .showcase-kpi b{font-size:17px}.email-dashboard-grid .ops-control{padding:15px;background:linear-gradient(145deg,rgba(8,47,73,.86),rgba(2,8,23,.88))}.email-dashboard-grid .ops-control-head span{font-size:7px}.email-dashboard-grid .ops-control-head b{font-size:10px}.email-dashboard-grid .ops-sla-hero{grid-template-columns:92px 1fr;gap:15px;padding:14px 0 12px}.email-dashboard-grid .ops-ring{width:90px;height:90px}.email-dashboard-grid .ops-ring strong{font-size:25px}.email-dashboard-grid .ops-ring span{font-size:6px}.email-dashboard-grid .ops-sla-copy small{font-size:7px;color:#b6c5d8}.email-dashboard-grid .ops-sla-copy h2{font-size:19px}.email-dashboard-grid .ops-sla-copy p{font-size:10px;color:#e2e8f0}.email-dashboard-grid .ops-sla-card{padding:9px;background:rgba(2,8,23,.70)}.email-dashboard-grid .ops-sla-card span{font-size:7px;color:#b6c5d8}.email-dashboard-grid .ops-sla-card b{font-size:16px}.email-dashboard-grid .ops-sla-card small{font-size:7px}.email-dashboard-grid .ops-phone-band{padding:9px 10px;background:linear-gradient(135deg,color-mix(in srgb,var(--phone-status) 18%,transparent),rgba(2,8,23,.76))}.email-dashboard-grid .ops-phone-mark{width:28px;height:28px;font-size:15px}.email-dashboard-grid .ops-phone-metric span{font-size:7px;color:#b6c5d8}.email-dashboard-grid .ops-phone-metric b{font-size:15px}.email-dashboard-grid .ops-phone-state span{font-size:7px}.email-dashboard-grid .ops-phone-state b{font-size:11px}.email-dashboard-grid .ops-phone-state small{font-size:7px}.email-dashboard-grid .ops-footer span{font-size:6px;color:#9fb0c4}.email-dashboard-grid .ops-footer b{font-size:9px}.email-dashboard-grid .pm-heading{margin:17px 0 13px}.email-dashboard-grid .pm-heading small{font-size:7px}.email-dashboard-grid .pm-heading h2{font-size:31px}.email-dashboard-grid .pm-count strong{font-size:32px}.email-dashboard-grid .pm-count span{font-size:8px}.email-dashboard-grid .pm-panel{padding:13px;background:rgba(2,8,23,.72)}.email-dashboard-grid .pm-panel-label,.email-dashboard-grid .pm-breakdown-label{font-size:7px;color:#a9b8ca}.email-dashboard-grid .pm-fact strong{font-size:13px}.email-dashboard-grid .pm-meta{font-size:8px}.email-dashboard-grid .pm-symptom{font-size:8px}.email-dashboard-grid .pm-breakdown-row{padding:6px 8px;background:rgba(255,255,255,.065)}.email-dashboard-grid .pm-breakdown-row span,.email-dashboard-grid .pm-breakdown-row b{font-size:9px}.email-dashboard-grid .pm-analysis-card{padding:9px 10px;background:rgba(2,8,23,.70)}.email-dashboard-grid .pm-analysis-card span{font-size:7px}.email-dashboard-grid .pm-analysis-card strong{font-size:10px}.email-dashboard-grid .pm-analysis-card small{font-size:7px;color:#b6c5d8}.email-dashboard-grid .pm-evidence{padding:9px 10px;background:rgba(46,16,101,.28)}.email-dashboard-grid .pm-evidence span{font-size:7px}.email-dashboard-grid .pm-evidence b{font-size:9px}.email-brief{gap:14px;margin-top:14px}.email-brief-card{padding:16px 17px;border-color:#c7d2df;border-radius:12px;box-shadow:0 4px 12px rgba(15,35,55,.045)}.email-brief-card span{font-size:9px}.email-brief-card strong{font-size:16px}.email-brief-card small{font-size:11px;color:#52657a}
	      /* Режим для ручного скриншота: две крупные самостоятельные сцены вместо мелкой почтовой пары. */
	      .page{max-width:1240px}.email-sheet{padding:20px;background:#eef3f8}.email-dashboard-grid{grid-template-columns:1fr;gap:28px}.email-dashboard-grid .showcase-frame{aspect-ratio:16/9;padding:34px;border-radius:26px}.email-dashboard-grid .showcase-brand{font-size:10px}.email-dashboard-grid .showcase-period{font-size:10px}.email-dashboard-grid .showcase-period b{font-size:12px}.email-dashboard-grid .ops-stage{grid-template-columns:.88fr 1.12fr;gap:28px;margin-top:25px}.email-dashboard-grid .showcase-kicker{font-size:10px}.email-dashboard-grid .week-load-badge{padding:7px 10px;font-size:9px}.email-dashboard-grid .showcase-number{font-size:112px}.email-dashboard-grid .showcase-number-label{font-size:19px}.email-dashboard-grid .showcase-number-note{font-size:12px}.email-dashboard-grid .showcase-kpi{padding:12px}.email-dashboard-grid .showcase-kpi span{font-size:9px}.email-dashboard-grid .showcase-kpi b{font-size:22px}.email-dashboard-grid .ops-control{padding:22px}.email-dashboard-grid .ops-control-head span{font-size:9px}.email-dashboard-grid .ops-control-head b{font-size:12px}.email-dashboard-grid .ops-sla-hero{grid-template-columns:132px 1fr;gap:20px;padding:20px 0 16px}.email-dashboard-grid .ops-ring{width:126px;height:126px}.email-dashboard-grid .ops-ring strong{font-size:31px}.email-dashboard-grid .ops-ring span{font-size:8px}.email-dashboard-grid .ops-sla-copy small{font-size:8px}.email-dashboard-grid .ops-sla-copy h2{font-size:25px}.email-dashboard-grid .ops-sla-copy p{font-size:12px}.email-dashboard-grid .ops-sla-card{padding:12px}.email-dashboard-grid .ops-sla-card span{font-size:8px}.email-dashboard-grid .ops-sla-card b{font-size:19px}.email-dashboard-grid .ops-sla-card small{font-size:9px}.email-dashboard-grid .ops-phone-band{padding:12px 14px}.email-dashboard-grid .ops-phone-mark{width:38px;height:38px;font-size:21px}.email-dashboard-grid .ops-phone-metric span{font-size:8px}.email-dashboard-grid .ops-phone-metric b{font-size:20px}.email-dashboard-grid .ops-phone-state span{font-size:8px}.email-dashboard-grid .ops-phone-state b{font-size:14px}.email-dashboard-grid .ops-phone-state small{font-size:9px}.email-dashboard-grid .ops-footer span{font-size:8px}.email-dashboard-grid .ops-footer b{font-size:12px}.email-dashboard-grid .pm-heading{margin:24px 0 18px}.email-dashboard-grid .pm-heading small{font-size:10px}.email-dashboard-grid .pm-heading h2{max-width:850px;font-size:46px}.email-dashboard-grid .pm-count{min-width:130px}.email-dashboard-grid .pm-count strong{font-size:42px}.email-dashboard-grid .pm-count span{font-size:11px}.email-dashboard-grid .pm-story{gap:16px}.email-dashboard-grid .pm-panel{padding:18px}.email-dashboard-grid .pm-panel-label,.email-dashboard-grid .pm-breakdown-label{font-size:9px}.email-dashboard-grid .pm-fact strong{font-size:17px}.email-dashboard-grid .pm-meta{font-size:10px}.email-dashboard-grid .pm-symptom{font-size:10px}.email-dashboard-grid .pm-breakdown-row{padding:8px 10px}.email-dashboard-grid .pm-breakdown-row span,.email-dashboard-grid .pm-breakdown-row b{font-size:11px}.email-dashboard-grid .pm-analysis-card{padding:11px 13px}.email-dashboard-grid .pm-analysis-card span{font-size:9px}.email-dashboard-grid .pm-analysis-card strong{font-size:12px}.email-dashboard-grid .pm-analysis-card small{font-size:9px}.email-dashboard-grid .pm-evidence{padding:11px 13px}.email-dashboard-grid .pm-evidence span{font-size:9px}.email-dashboard-grid .pm-evidence b{font-size:11px}
	      @media(max-width:820px){.meter-grid,.team-snapshot,.showcase-main,.showcase-footer,.ops-stage,.pm-story{grid-template-columns:1fr}.snapshot-item{border-right:0;border-bottom:1px solid var(--line)}.snapshot-item:last-child{border-bottom:0}.weekly-showcase,.showcase-frame{aspect-ratio:auto;min-height:0;padding:24px}.showcase-top{align-items:flex-start}.showcase-number{font-size:88px}.showcase-kpis{grid-template-columns:repeat(3,minmax(0,1fr))}.showcase-problem h2{font-size:31px}.ops-sla-hero{grid-template-columns:110px 1fr}.ops-ring{width:104px;height:104px}.ops-footer{grid-template-columns:1fr}.pm-heading{align-items:flex-start}.pm-heading h2{font-size:31px}.pm-count strong{font-size:32px}}
	      @media(max-width:1240px){.email-dashboard-grid{grid-template-columns:1fr}.email-dashboard-grid .showcase-frame{aspect-ratio:auto}.email-dashboard-grid .ops-stage,.email-dashboard-grid .pm-story{grid-template-columns:1fr}.email-brief{grid-template-columns:1fr}}
	      .report-toolbar{position:sticky;top:10px;z-index:40;display:flex;justify-content:space-between;align-items:center;gap:16px;margin:0 0 14px;padding:10px 14px;border:1px solid #cbd8e6;border-radius:12px;background:rgba(255,255,255,.94);box-shadow:0 10px 28px rgba(15,35,55,.12);backdrop-filter:blur(10px);color:#475569;font:700 12px/1.3 Consolas,"Courier New",monospace}.report-toolbar button{border:0;border-radius:8px;background:#0d2238;color:#fff;padding:9px 13px;font:800 12px/1 Consolas,"Courier New",monospace;cursor:pointer}.report-toolbar button:hover{background:#173a5e}
	      @media print{body{background:#fff}.page{max-width:none}.hero{border-radius:0;box-shadow:none}.hero:after{display:none}section,.card,.team-snapshot{box-shadow:none;break-inside:avoid}.report-brand{color:#bae6fd}.report-toolbar{display:none}.weekly-showcase,.showcase-frame{break-inside:avoid;box-shadow:none}.technical-details>summary{display:none}.technical-details>.technical-body{display:block!important}.technical-details:not([open])>.technical-body{display:block!important}}
	    </style>
	    <div class="report-toolbar"><span>Две премиальные сцены 16:9 · результат недели и постмортем TOP-1</span><button type="button" onclick="window.print()">Печать / PDF</button></div>
	    <div class="email-sheet">
	    <div class="email-dashboard-grid">
	    <div class="weekly-showcase showcase-frame ops-showcase">
	      <div class="showcase-top">
	        <div class="showcase-brand"><i></i><span>Team Ops / Service Performance</span></div>
	        <div class="showcase-period">Отчётный период<b>${html(period)}</b></div>
	      </div>
	      <div class="ops-stage">
	        <div class="showcase-outcome">
	          <div class="showcase-kicker-row"><div class="showcase-kicker">Результат первой линии</div><div class="week-load-badge" style="--load-color:${weekLoadState.color}">${html(weekLoadState.label)}</div></div>
	          <div class="showcase-number">${html(Math.round(totalClosed))}</div>
	          <div class="showcase-number-label">обращений закрыто</div>
	          <div class="showcase-number-note">Главный операционный результат команды за неделю</div>
	          <div class="showcase-kpis">
	            <div class="showcase-kpi" style="--accent:${primarySla >= 95 ? '#34d399' : '#fb923c'}"><span>Взятие ≤15 мин</span><b>${html(pct(primarySla))}</b></div>
	            <div class="showcase-kpi" style="--accent:${resolutionSla >= 95 ? '#34d399' : '#f472b6'}"><span>Решение в срок</span><b>${html(pct(resolutionSla))}</b></div>
	            <div class="showcase-kpi" style="--accent:#22d3ee"><span>Всего звонков</span><b>${html(phoneAnsweredText)}</b></div>
	          </div>
	        </div>
	        <div class="ops-control">
	          <div class="ops-control-head"><span>SLA control / service health</span><b>${html(currentState.label)}</b></div>
	          <div class="ops-sla-hero">
	            <div class="ops-ring"><div><strong>${html(pct(primarySla))}</strong><span>взятие ≤15 мин</span></div></div>
	            <div class="ops-sla-copy"><small>Главный сигнал недели</small><h2>${html(worstSlaLabel)}</h2><p>${primaryGap > 0 ? `До цели 95% не хватает ${html(primaryGap.toFixed(1).replace('.0', ''))} п.п.` : 'Цель 95% выполнена.'} ${html(currentState.note)}.</p></div>
	          </div>
	          <div class="ops-sla-grid">
	            <div class="ops-sla-card"><span>Решение в срок</span><b>${html(pct(resolutionSla))}</b><small>цель 95%</small></div>
	            <div class="ops-sla-card"><span>TOP-1 проблема</span><b>${html(Math.round(topicCount))}</b><small>${html(pct(topicShare))} от закрытых</small></div>
	            <div class="ops-sla-card"><span>Помощь старших</span><b>${html(pct(helpPercent))}</b><small>${html(topic.mainRoute || 'маршрут уточняется')}</small></div>
	          </div>
	          <div class="ops-phone-band" style="--phone-status:${currentPhoneState.color}">
	            <div class="ops-phone-mark">☎</div>
	            <div class="ops-phone-metric"><span>Всего звонков</span><b>${hasPhoneData ? html(Math.round(phoneCalls)) : '—'}</b></div>
	            <div class="ops-phone-metric"><span>Пропущено</span><b>${hasPhoneData ? html(Math.round(phoneMissed)) : '—'}</b></div>
	            <div class="ops-phone-metric"><span>Допустимый лимит</span><b>${hasPhoneData ? html(Math.round(phoneMissedTarget)) : '—'}</b></div>
	            <div class="ops-phone-state"><span>Состояние линии</span><b>${hasPhoneData ? (phoneMissedGap > 0 ? `Просадка +${html(Math.round(phoneMissedGap))}` : 'В пределах лимита') : 'Нет данных'}</b><small>${hasPhoneData ? `${html(Math.round(phoneCalls))} всего · ${html(Math.round(phoneMissed))} пропущено` : 'загрузите телефонию недели'}</small></div>
	          </div>
	        </div>
	      </div>
	      <div class="ops-footer">
	        <div><span>Статус сервиса</span><b>${html(currentState.label)}</b></div>
	        <div><span>Тип недели</span><b style="color:${weekLoadState.color}">${html(weekLoadState.label)} · ${html(weekLoadState.note)}</b></div>
	        <div><span>Следующий экран</span><b>Постмортем TOP-1 · ${html(requestCount(topicCount))}</b></div>
	      </div>
	    </div>
	    <div class="postmortem-showcase showcase-frame">
	      <div class="showcase-top">
	        <div class="showcase-brand"><i></i><span>Ops Intelligence / Incident Review</span></div>
	        <div class="showcase-period">TOP-1 · ${html(period)}<b>Командный постмортем</b></div>
	      </div>
	      <div class="pm-heading">
	        <div><small>Главная повторяющаяся проблема недели</small><h2>${html(topicName)}</h2></div>
	        <div class="pm-count"><strong>${html(Math.round(topicCount))}</strong><span>${html(requestCount(topicCount).replace(/^\d+\s*/, ''))} · ${html(pct(topicShare))} от закрытых</span></div>
	      </div>
	      <div class="pm-story">
	        <div class="pm-panel pm-fact">
	          <span class="pm-panel-label">01 / Что происходило по факту</span>
	          <strong>${html(confirmedProblemFact)}</strong>
	          <div class="pm-meta">${html(topicCategory || 'Категория уточняется')}${topicSystems.length ? ` · ${html(topicSystems.join(', '))}` : ''}</div>
	          <div class="pm-symptoms">${postmortemSymptoms.length ? postmortemSymptoms.map(item => `<span class="pm-symptom">${html(item.name)}${item.count === null ? '' : ` · ${html(Math.round(item.count))}`}</span>`).join('') : '<span class="pm-symptom">Симптомы требуют детализации из обращений</span>'}</div>
	          <div class="pm-breakdown"><span class="pm-breakdown-label">Расшифровка TOP-1</span>${postmortemBreakdown.length ? postmortemBreakdown.map(item => `<div class="pm-breakdown-row"><span>${html(item.name)}</span><b>${html(Math.round(num(item.count)))} · ${html(pct(item.share))}</b></div>`).join('') : '<div class="pm-breakdown-row"><span>Подтемы появятся после детализации обращений</span><b>нет данных</b></div>'}</div>
	        </div>
	        <div class="pm-analysis">
	          <div class="pm-analysis-card" style="--pm-accent:#fb923c"><span>02 / Причина</span><strong>${html(postmortemCauseText)}</strong><small>${actionPlanHasTrace ? 'Связано с подтверждёнными обращениями' : 'Гипотеза до подтверждения разбором обращений'}</small></div>
	          <div class="pm-analysis-card" style="--pm-accent:#22d3ee"><span>03 / Метод решения</span><strong>${html(confirmedResolutionText)}</strong><small>${html(resolutionEvidenceText)}</small></div>
	          <div class="pm-analysis-card${hasResolutionEvidence ? '' : ' is-gap'}" style="--pm-accent:#34d399"><span>04 / Что меняем</span><strong>${html(compactActionText)}</strong><small>${html(checkText)}</small></div>
	        </div>
	      </div>
	      <div class="pm-evidence"><span>Evidence chain</span><b>${resolutionEvidenceIds.length ? html(resolutionEvidenceIds.slice(0, 8).join(' · ')) : 'Пока нет подтверждающих IS — вывод не подменяется предположением'}${resolutionCoverage === null ? '' : ` · покрытие решений ${html(pct(resolutionCoverage))}`}</b></div>
	    </div>
	    </div>
	    <div class="email-brief">
	      <div class="email-brief-card" style="--brief-accent:${weekLoadState.color}"><span>Нагрузка недели</span><strong>${html(weekLoadState.label)} · ${html(Math.round(totalClosed))} закрыто</strong><small>${html(weekLoadState.note)}. Порог аварийной недели — более 300 обращений.</small></div>
	      <div class="email-brief-card" style="--brief-accent:${currentPhoneState.color}"><span>Телефонная линия</span><strong>${hasPhoneData ? `${html(Math.round(phoneCalls))} звонков · ${html(Math.round(phoneMissed))} пропущено` : 'Телефония не загружена'}</strong><small>${hasPhoneData ? (phoneMissedGap > 0 ? `Превышение допустимого лимита на ${html(Math.round(phoneMissedGap))}. Нужна проверка смены и периодов пропуска.` : `Линия в пределах допустимого лимита ${html(Math.round(phoneMissedTarget))}.`) : 'Загрузите данные телефонии за выбранную неделю.'}</small></div>
	      <div class="email-brief-card" style="--brief-accent:#8b5cf6"><span>Фокус команды</span><strong>${html(topicName)} · ${html(requestCount(topicCount))}</strong><small>${html(compactActionText)}</small></div>
	    </div>
	    </div>
	    <div class="detail-divider">Техническая расшифровка и доказательства</div>
	    <details class="technical-details">
	      <summary>Открыть детальный постмортем: обращения, маршруты, SLA и комментарии</summary>
	      <div class="technical-body">
	    <header class="hero">
	      <div class="report-brand"><span>OPS INTELLIGENCE / INCIDENT REVIEW</span><b>TOP-1 PROBLEM · TEAM POSTMORTEM</b></div>
	      <div class="hero-grid">
        <div><div class="eyebrow">Понедельничный пульс команды</div><h1>Постмортем ТОП-1 проблемы недели</h1><p class="subtitle">${html(topicName)} · ${html(period)} · сформировано ${html(generatedDate.toLocaleDateString('ru-RU'))}</p></div>
        <div class="meter-grid">
          <div class="pulse"><div class="meter-head"><span>SLA инцидентов</span><em>качество реакции</em></div><div class="orb"></div><div class="pulse-title">${html(currentState.label)} · ${html(pct(worstSla))}</div><div class="pulse-note">Худший SLA недели: ${html(worstSlaLabel)}. ${html(currentState.note)}.</div><div class="sla-target"><span>Факт / цель</span><b>${html(pct(worstSla))} / 95%</b></div></div>
          <div class="phone-pulse" style="--phone:${currentPhoneState.color}"><div class="meter-head"><span>Телефонная линия</span><em>доступность канала</em></div><div class="phone-art"><svg class="phone-svg" viewBox="0 0 64 64" aria-hidden="true"><path d="M46.6 41.7c-2.8-1.3-5.4-1.9-7.4.5l-2.2 2.7c-5.8-3.2-10.4-7.8-13.7-13.7l2.7-2.2c2.4-2 1.8-4.6.5-7.4l-2.1-4.5c-1.2-2.6-3.5-3.9-6.1-3.1l-5.2 1.6c-2.1.7-3.6 2.7-3.4 5 .8 15.6 17.9 32.7 33.5 33.5 2.3.1 4.3-1.3 5-3.4l1.6-5.2c.7-2.6-.6-4.9-3.2-6.1l-4.5-2.2z"/></svg><div class="missed-badge">${hasPhoneData ? html(Math.round(phoneMissed)) : '—'}</div></div><div class="pulse-title">${html(currentPhoneState.label)}</div><div class="pulse-note">${hasPhoneData ? `Звонков ${html(phoneAnsweredText)}, пропущено ${html(Math.round(phoneMissed))}. ${html(currentPhoneState.note + phoneLoadSuffix)}` : `В источнике ${html(phoneSourceLabel)} нет строк телефонии.`}</div><div class="sla-target"><span>Пропущено / лимит</span><b>${hasPhoneData ? `${html(Math.round(phoneMissed))}/${html(Math.round(phoneMissedTarget))}` : '—'}</b></div></div>
        </div>
      </div>
      <div class="scale-label">Шкала SLA: цель 95%</div><div class="traffic">${trafficStates.map(state => `<div class="state" style="--c:${state.color};${state.key === currentState.key ? 'background:rgba(255,255,255,.18);' : ''}"><b>${html(state.label)}</b><span>${html(state.min)}-${html(state.max)}%</span></div>`).join('')}</div>
    </header>
    <div class="team-snapshot">
      <div class="snapshot-item snapshot-status"><small>1. Что случилось</small><strong>${html(currentState.label)}: ${html(pct(worstSla))}</strong><span>${html(worstSlaLabel)} · до цели не хватает ${html(Math.max(primaryGap, resolutionGap).toFixed(1).replace('.0', ''))} п.п.</span></div>
      <div class="snapshot-item snapshot-cause"><small>2. Где фокус</small><strong>${html(topicName)}</strong><span>${html(topicCategory ? `${topicCategory} · ${topicEvidenceText}` : topicEvidenceText)}${topicSystems.length ? ` · ${html(topicSystems.join(', '))}` : ''}</span></div>
      <div class="snapshot-item" style="border-top:5px solid #10b981"><small>3. Как решали</small><strong>${html(confirmedResolutionText)}</strong><span>${html(resolutionEvidenceText)} · покрытие ${resolutionCoverage === null ? 'нет данных' : html(pct(resolutionCoverage))}</span></div>
      <div class="snapshot-item snapshot-action"><small>4. Что закрепляем</small><strong>${html(actionNeeded)}</strong><span>${html(checkText)}</span></div>
    </div>
    <div class="kpi">
      <div class="card"><small>Топ-проблема</small><strong>${html(count(topicCount))}</strong><span class="muted">${html(pct(topicShare))} от закрытых</span></div>
      <div class="card"><small>Взятие в работу</small><strong>${html(pct(primarySla))}</strong><span class="muted">цель 95%</span></div>
      <div class="card"><small>Решение в срок</small><strong>${html(pct(resolutionSla))}</strong><span class="muted">цель 95%</span></div>
      <div class="card"><small>Помощь выше 1-й линии</small><strong>${html(pct(helpPercent))}</strong><span class="muted">${html(topic.mainRoute || topic.supportLevel || 'маршрут уточняется')}</span></div>
      <div class="card"><small>Телефонная линия</small><strong>${phoneCalls > 0 ? `${html(Math.round(phoneCalls))} звонков` : 'нет данных'}</strong><span class="muted">пропущено ${html(Math.round(phoneMissed))} / лимит ${html(Math.round(phoneMissedTarget))}${phoneAvailability === null ? '' : ` · доступность ${html(phoneAvailability)}%`}</span></div>
    </div>
    <div class="flow"><div class="flow-step" style="--c:#2563eb"><small>Поток</small><b>${html(count(totalClosed))}</b><p>закрыто за неделю</p></div><div class="arrow">→</div><div class="flow-step" style="--c:${primarySla >= 95 ? '#10b981' : currentState.color}"><small>Взятие ≤15 мин</small><b>${html(pct(primarySla))}</b><p>${primaryGap > 0 ? `не хватает ${primaryGap.toFixed(1).replace('.0', '')} п.п.` : 'цель выполнена'}</p></div><div class="arrow">→</div><div class="flow-step" style="--c:${resolutionSla >= 95 ? '#10b981' : currentState.color}"><small>Решение в срок</small><b>${html(pct(resolutionSla))}</b><p>${resolutionGap > 0 ? `не хватает ${resolutionGap.toFixed(1).replace('.0', '')} п.п.` : 'цель выполнена'}</p></div><div class="arrow">→</div><div class="flow-step" style="--c:#8b5cf6"><small>ТОП-1 узкое место</small><b>${html(count(topicCount))}</b><p>${html(topicName)}</p></div></div>
    <section><h2>Почему просел SLA на прошлой неделе</h2><div class="drop-grid">${slaDropCards.map(item => `<div class="drop-card"><small>${html(item.title)}</small><b>${html(item.value)}</b><p>${html(item.text)}</p></div>`).join('')}</div></section>
    <input class="modal-toggle" type="checkbox" id="top-breakdown-modal">
    <div class="modal"><div class="modal-panel"><div class="modal-head"><div><h2>Расшифровка ТОП-проблемы</h2><p class="muted">${html(topicName)} · разбивка для постмортема команды</p></div><label class="modal-close" for="top-breakdown-modal">Закрыть</label></div><table><thead><tr><th>Подтема / сигнал</th><th>Кол-во</th><th>Доля</th><th>Что видно по смыслу</th><th>Что делаем</th></tr></thead><tbody>${subProblemRows}</tbody></table><div class="note" style="margin-top:12px">Если в JSON нет примеров обращений по теме, эта разбивка является рабочей гипотезой для понедельничного разбора. После постмортема ее нужно подтвердить 3-5 реальными обращениями.</div></div></div>
    <section><h2>Короткий вывод для команды</h2><div class="focus"><strong>${html(topicName)}</strong><br>Разбираем не только саму проблему, но и фактический путь устранения: диагностика, действие, маршрут и переиспользуемый шаг. На неделю закрепляем одно изменение и проверяем эффект по SLA и доле помощи выше 1-й линии.<br><label class="modal-open" for="top-breakdown-modal">Открыть расшифровку ТОП-проблемы</label></div><div class="signal-strip"><div><b>1. Что повторяется</b><span class="muted">${html(topicName)}</span></div><div><b>2. Как реально решали</b><span class="muted">${resolutionCoverage === null ? 'нужно заполнить ход решения' : `${html(pct(resolutionCoverage))} примеров с решением`}</span></div><div><b>3. Что закрепляем</b><span class="muted">${html(actionNeeded)}</span></div></div></section>
    <section><h2>Обращения ТОП-проблемы: от симптома до решения</h2><div class="note" style="margin-bottom:12px">Каждая строка связывает исходную проблему с очищенным комментарием исполнителя. Сообщения ServiceDesk, автоматические проверки, просьбы оценить и формальные ответы исключены.</div><table><thead><tr><th>Тикет / исполнитель</th><th>Что произошло</th><th>Диагностика</th><th>Как решено</th><th>Маршрут / SLA</th><th>Что в БЗ</th></tr></thead><tbody>${caseRows}</tbody></table></section>
    <section><h2>Повторяющиеся способы решения</h2><div class="note" style="margin-bottom:12px"><strong>Покрытие решений по обращениям ТОП-проблемы:</strong> ${resolutionCoverage === null ? 'нет данных' : html(pct(resolutionCoverage))}. Здесь остаются только подтвержденные действия, связанные с обращениями этой темы.</div><div class="plan">${resolutionPatternCards}</div></section>
    <section><h2>Задача команде на неделю</h2><div class="plan"><div><b>1. Разобрать</b>Взять 3-5 обращений выше и проверить общий сценарий диагностики и решения.</div><div><b>2. Закрепить</b>${html(actionNeeded)}</div><div><b>3. Проверить</b>${html(checkText)}</div></div></section>
    <section><h2>SLA и маршруты</h2><div class="plan"><div><b>Основной SLA</b>Взятие в работу ≤15 мин: ${html(pct(primarySla))}. Просрочек: ${html(count(training.primaryViolations))}.</div><div><b>Вторичный SLA</b>Решение в срок: ${html(pct(resolutionSla))}. Просрочек: ${html(count(training.resolutionViolations))}.</div><div><b>Маршрут помощи</b>${html(topic.mainRoute || topic.supportLevel || 'нужно уточнить по тикетам')}.</div></div><table style="margin-top:12px"><thead><tr><th>Маршрут</th><th>Тикеты</th><th>Взятие</th><th>Решение</th><th>Вывод</th></tr></thead><tbody>${slaRows}</tbody></table></section>
    <section><h2>Маршруты решения недели</h2><table><thead><tr><th>Маршрут</th><th>Кол-во</th><th>Доля</th></tr></thead><tbody>${routeRows}</tbody></table></section>
    <section><h2>Качество исходных комментариев</h2><div class="plan"><div><b>Содержательный ход решения</b>${commentAudit.coveragePercent === null || commentAudit.coveragePercent === undefined ? 'Нет данных новой выгрузки' : html(pct(commentAudit.coveragePercent))} · ${html(count(commentAudit.meaningfulCount))} из ${html(count(commentAudit.totalClosed))}</div><div><b>Без полезного комментария</b>${html(count(commentAudit.missingOrInvalidCount))} после очистки служебных сообщений</div><div><b>Отфильтровано автоматикой</b>${html(count(commentAuditFiltered))}: переоткрытие, просьба оценить и формальные ответы</div></div></section>
    <section><h2>Правило разбора</h2><div class="note">Не ищем виноватых и не делаем рейтинг сотрудников. Смотрим процесс: где не хватает инструкции, прав, маршрута или первичной диагностики.</div></section>
	      </div>
	    </details>
  </main></body></html>`;
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

const isExcludedFromFirstLineReport = (value) => {
  const raw = safeString(value).trim().toLowerCase();
  const fullName = safeString(getFullName(value)).trim().toLowerCase();
  return FIRST_LINE_REPORT_EXCLUDED_ADMINS.some(name => {
    const normalized = safeString(name).trim().toLowerCase();
    return normalized === raw || normalized === fullName;
  });
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

const getNonDeliveryReason = (task = {}) => {
  const text = safeString([
    task.resolutionType,
    task.resolution,
    task['Решение'],
    task.status,
    task['Статус'],
    task.comments,
    task.comment
  ].join(' ')).toLowerCase().replace(/ё/g, 'е');
  if (text.includes('нет активности по кейсу') || text.includes('закрыто по бездействию') || text.includes('бездейств')) {
    return 'Нет активности по кейсу';
  }
  if (text.includes('отклон')) return 'Отклонено';
  if (text.includes('отмен')) return 'Отменено';
  return '';
};

const isNonDeliveryTask = (task = {}) => Boolean(getNonDeliveryReason(task));

const normalizeDroppedTask = (task = {}, fallbackReason = '') => ({
  id: typeof task === 'object' ? safeString(task.id || task.key || task.issueKey || task['Ключ']).trim() : safeString(task).trim(),
  title: typeof task === 'object' ? safeString(task.title || task.summary || task.name || task['Тема']).trim() : '',
  reason: typeof task === 'object' ? safeString(task.reason || fallbackReason || getNonDeliveryReason(task) || 'Закрыто без выполнения').trim() : safeString(fallbackReason || 'Закрыто без выполнения').trim()
});

const enrichPerformersWithNonDeliveryTasks = (performers = [], detailedTasks = []) => {
  const droppedByName = new Map();
  (Array.isArray(detailedTasks) ? detailedTasks : []).forEach(task => {
    const reason = getNonDeliveryReason(task);
    if (!reason) return;
    const assignee = safeString(task.assignee || task.executor || task.owner || task.responsible || task['Исполнитель']).trim();
    if (!assignee || !isKnownTeamMember(assignee) || isExcludedUser(assignee)) return;
    const fullName = getFullName(assignee);
    if (!droppedByName.has(fullName)) droppedByName.set(fullName, []);
    droppedByName.get(fullName).push(normalizeDroppedTask(task, reason));
  });

  const seenNames = new Set();
  const normalizedPerformers = (Array.isArray(performers) ? performers : []).map(performer => {
    const fullName = getFullName(performer?.name);
    seenNames.add(fullName);
    const existingDropped = Array.isArray(performer?.droppedTasks)
      ? performer.droppedTasks.map(item => normalizeDroppedTask(item))
      : [];
    const existingIds = new Set(existingDropped.map(item => item.id).filter(Boolean));
    const derivedDropped = (droppedByName.get(fullName) || []).filter(item => item.id && !existingIds.has(item.id));
    const droppedTasks = [...existingDropped, ...derivedDropped];
    const adjustedClosed = Math.max(0, (Number(performer?.closed) || 0) - derivedDropped.length);
    return {
      ...performer,
      closed: adjustedClosed,
      droppedTasks
    };
  });

  droppedByName.forEach((items, fullName) => {
    if (seenNames.has(fullName)) return;
    normalizedPerformers.push({
      name: fullName,
      closed: 0,
      wip: 0,
      avgTimeMin: 0,
      commentsFreq: 'Низкая',
      taskContext: 'Есть закрытия без выполнения',
      droppedTasks: items,
      techDebtClosed: [],
      reopenedTasks: [],
      csat: 5.0
    });
  });

  return normalizedPerformers;
};

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
const TEAM_METRIC_EXPECTED_DAYS = { S: 1, M: 3, L: 7, XL: 14 };
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
  'Серверная инфраструктура',
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

const DEFAULT_WORD_REPORT_SECTIONS = [
  { id: 'pci-dss', title: 'PCI DSS', color: '#2563eb', hidden: false, order: 0 },
  { id: 'hrdwr', title: 'HRDWR', color: '#64748b', hidden: false, order: 1 },
  { id: 'zabbix', title: 'ZABBIX', color: '#f59e0b', hidden: false, order: 2 },
  { id: 'windows', title: 'WINDOWS', color: '#0ea5e9', hidden: false, order: 3 },
  { id: 'idm', title: 'IDM', color: '#7c3aed', hidden: false, order: 4 },
  { id: 'server', title: 'Серверная инфраструктура', color: '#0891b2', hidden: false, order: 5 },
  { id: 'workplace', title: 'Рабочие места / ПО', color: '#10b981', hidden: false, order: 6 },
  { id: 'network', title: 'Сеть / BinkD', color: '#1d4ed8', hidden: false, order: 7 },
  { id: 'lotus', title: 'Lotus', color: '#4f46e5', hidden: false, order: 8 },
  { id: 'mail', title: 'Почта / Мессенджеры', color: '#db2777', hidden: false, order: 9 },
  { id: 'other', title: 'Регламентные работы', color: '#334155', hidden: false, order: 10 }
];

const createDefaultWordReportConfig = () => ({
  sections: DEFAULT_WORD_REPORT_SECTIONS,
  updatedAt: new Date().toISOString()
});

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
  if (source.includes('терминал') || source.includes('rds') || source.includes('remote') || source.includes('цб ')) return 'Серверная инфраструктура';
  if (source.includes('binkd') || source.includes('бинк') || source.includes('vpn') || source.includes('сеть') || source.includes('сетев') || source.includes('маршрут') || source.includes('wi fi') || source.includes('wifi')) return 'Сеть / BinkD';
  if (source.includes('фин') || source.includes('финист') || source.includes('кредит') || source.includes('юл ') || source.includes('фл ')) return 'Бизнес-системы';
  if (source.includes('бд ') || source.includes('база') || source.includes('oracle') || source.includes('sql')) return 'Базы данных';
  if (source.includes('сервер') || source.includes('host') || source.includes('vm') || source.includes('виртуал')) return 'Серверная инфраструктура';
  if (source.includes('ос ') || source.includes('windows') || source.includes('рабоч') || source.includes('арм') || source.includes('по ')) return 'Рабочие места / ПО';
  if (source.includes('миграц') || source.includes('проект') || source.includes('внедр') || source.includes('регламент') || source.includes('процесс')) return 'Проекты / процессы';
  if (domain.includes('сеть') || domain.includes('vpn')) return 'Сеть / BinkD';
  if (domain.includes('citrix') || domain.includes('цитрикс') || domain.includes('ферм')) return 'Citrix / фермы';
  if (domain.includes('скрипт') || domain.includes('автоматизац')) return 'Скрипты / автоматизация';
  if (domain.includes('zabbix') || domain.includes('заббикс') || domain.includes('мониторинг')) return 'Zabbix / мониторинг';
  if (domain.includes('2fa') || domain.includes('otp') || domain.includes('аутентификац')) return '2FA';
  if (domain.includes('терминал') || domain.includes('rds') || domain.includes('виртуал') || domain.includes('сервер')) return 'Серверная инфраструктура';
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

const parseMetricDate = (value) => {
  const raw = safeString(value).trim();
  if (!raw) return null;
  const nativeDate = new Date(raw);
  if (!Number.isNaN(nativeDate.getTime())) return nativeDate;
  const monthMap = {
    янв: 0, январ: 0,
    фев: 1, феврал: 1,
    мар: 2, март: 2,
    апр: 3, апрел: 3,
    май: 4, мая: 4,
    июн: 5, июнь: 5,
    июл: 6, июль: 6,
    авг: 7, август: 7,
    сен: 8, сент: 8, сентябр: 8,
    окт: 9, октябр: 9,
    ноя: 10, ноябр: 10,
    дек: 11, декабр: 11
  };
  const ruMatch = raw.toLowerCase().replace(/ё/g, 'е').match(/(\d{1,2})\/([а-яa-z]{3,12})\/(\d{2,4})/i);
  if (ruMatch) {
    const day = Number(ruMatch[1]);
    const monthKey = Object.keys(monthMap).find(key => ruMatch[2].startsWith(key));
    const month = monthKey !== undefined ? monthMap[monthKey] : null;
    const year = Number(ruMatch[3].length === 2 ? `20${ruMatch[3]}` : ruMatch[3]);
    if (month !== null) {
      const parsed = new Date(year, month, day);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
  }
  const match = raw.match(/(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})/);
  if (match) {
    const year = Number(match[3].length === 2 ? `20${match[3]}` : match[3]);
    const month = Number(match[2]) - 1;
    const day = Number(match[1]);
    const parsed = new Date(year, month, day);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

const getMetricTaskWeekKey = (task = {}, fallbackWeekKey = '') => {
  const explicit = safeString(task.weekKey || task.week || task.reportWeek || task.periodKey).trim();
  if (explicit) return explicit;
  if (fallbackWeekKey) return fallbackWeekKey;
  const date = parseMetricDate(task.resolved || task.resolutionDate || task.closedAt || task.created);
  if (!date) return '';
  return `${date.getFullYear()}-${getISOWeekNumber(date)}`;
};

const getMetricTaskCycleDays = (task = {}) => {
  const direct = Number(task.assigneeCycleTime ?? task.assigneeCycleDays ?? task.assignedCycleTime ?? task.assignedCycleDays);
  if (Number.isFinite(direct) && direct >= 0) return direct;
  const assignedAt = parseMetricDate(task.assignedAt || task.assignedDate || task.assignmentDate);
  const resolvedAt = parseMetricDate(task.resolved || task.resolutionDate || task.closedAt);
  if (assignedAt && resolvedAt && resolvedAt >= assignedAt) {
    return Math.round(((resolvedAt.getTime() - assignedAt.getTime()) / 86400000) * 10) / 10;
  }
  const fallbackDirect = Number(task.cycleTime ?? task.cycleDays ?? task.leadTime ?? task.durationDays);
  if (Number.isFinite(fallbackDirect) && fallbackDirect >= 0) return fallbackDirect;
  return null;
};

const getMetricTaskLeadDays = (task = {}) => {
  const direct = Number(task.cycleTime ?? task.cycleDays ?? task.leadTime ?? task.durationDays);
  if (Number.isFinite(direct) && direct >= 0) return direct;
  const created = parseMetricDate(task.created);
  const resolved = parseMetricDate(task.resolved || task.resolutionDate || task.closedAt);
  if (created && resolved && resolved >= created) {
    return Math.round(((resolved.getTime() - created.getTime()) / 86400000) * 10) / 10;
  }
  return null;
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

const rebuildMetricRowFromTaskDetails = (row = {}) => {
  const details = Object.values(row.taskDetails || {}).filter(task => task && task.id);
  const next = {
    ...row,
    name: row.name || 'Неизвестно',
    totalTasks: 0,
    totalWeight: 0,
    impactTasks: 0,
    sizes: { S: 0, M: 0, L: 0, XL: 0 },
    domainScores: {},
    taskIds: {},
    taskDetails: {},
    updatedAt: new Date().toISOString()
  };
  details.forEach(task => {
    const id = safeString(task.id).trim();
    if (!id) return;
    const size = normalizeTaskSize(task.size) || 'M';
    const weight = TEAM_METRIC_SIZE_WEIGHTS[size] || TEAM_METRIC_SIZE_WEIGHTS.M;
    const domain = normalizeMetricDomain(task.domain || task.originalDomain || '', task.title || '') || 'Прочее';
    const detail = { ...task, id, size, weight, domain };
    next.totalTasks += 1;
    next.totalWeight += weight;
    next.impactTasks += detail.impact ? 1 : 0;
    next.sizes[size] = (Number(next.sizes[size]) || 0) + 1;
    next.domainScores[domain] = (Number(next.domainScores[domain]) || 0) + weight;
    next.taskIds[id] = true;
    next.taskDetails[id] = detail;
  });
  return next;
};

const createMetricTaskDetail = (task = {}, index = 0, options = {}) => {
  const size = getMetricTaskSize(task);
  const id = getMetricTaskId(task, index);
  const domain = inferTaskDomain(task);
  const cycleTime = getMetricTaskCycleDays(task);
  const leadTime = getMetricTaskLeadDays(task);
  const weekKey = getMetricTaskWeekKey(task, options.weekKey);
  return {
    id,
    title: safeString(task.title || task.summary || task.name || id).trim(),
    assignee: getFullName(task.assignee || task.executor || task.owner || task.responsible || task['Исполнитель'] || task['Ответственный']),
    domain,
    originalDomain: domain,
    size,
    originalSize: size,
    weight: TEAM_METRIC_SIZE_WEIGHTS[size] || TEAM_METRIC_SIZE_WEIGHTS.M,
    cycleTime,
    leadTime,
    created: safeString(task.created || task.createdAt || '').trim(),
    assignedAt: safeString(task.assignedAt || task.assignedDate || task.assignmentDate || '').trim(),
    resolved: safeString(task.resolved || task.resolutionDate || task.closedAt || '').trim(),
    weekKey,
    impact: isMetricImpactTask(task),
    manualSize: false,
    manualDomain: false,
    updatedAt: new Date().toISOString()
  };
};

const mergeTasksIntoTeamMetrics = (memory = {}, tasks = [], options = {}) => {
  const next = JSON.parse(JSON.stringify(memory || {}));
  let added = 0;
  let skipped = 0;
  const updatedEmployees = new Set();

  (Array.isArray(tasks) ? tasks : []).forEach((task, index) => {
    if (isNonDeliveryTask(task)) { skipped += 1; return; }
    const rawAssignee = safeString(task.assignee || task.executor || task.owner || task.responsible || task['Исполнитель'] || task['Ответственный']).trim();
    if (!rawAssignee) { skipped += 1; return; }
    const fullName = getFullName(rawAssignee);
    if (!fullName || fullName === 'Неизвестно' || fullName === TEAM_LEAD_NAME || isExcludedUser(rawAssignee)) { skipped += 1; return; }
    const taskId = getMetricTaskId(task, index);
    if (!next[fullName]) next[fullName] = createMetricRow(fullName);
    next[fullName].taskDetails = { ...(next[fullName].taskDetails || {}) };
    if (next[fullName].taskIds?.[taskId]) {
      const incomingDetail = createMetricTaskDetail(task, index, options);
      if (!next[fullName].taskDetails[taskId]) {
        next[fullName].taskDetails[taskId] = incomingDetail;
        next[fullName].updatedAt = new Date().toISOString();
      } else {
        next[fullName].taskDetails[taskId] = {
          ...incomingDetail,
          ...next[fullName].taskDetails[taskId],
          cycleTime: next[fullName].taskDetails[taskId].cycleTime ?? incomingDetail.cycleTime,
          leadTime: next[fullName].taskDetails[taskId].leadTime ?? incomingDetail.leadTime,
          created: next[fullName].taskDetails[taskId].created || incomingDetail.created,
          assignedAt: next[fullName].taskDetails[taskId].assignedAt || incomingDetail.assignedAt,
          resolved: next[fullName].taskDetails[taskId].resolved || incomingDetail.resolved,
          weekKey: next[fullName].taskDetails[taskId].weekKey || incomingDetail.weekKey
        };
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
    next[fullName].taskDetails[taskId] = createMetricTaskDetail(task, index, options);
    next[fullName].updatedAt = new Date().toISOString();
    updatedEmployees.add(fullName);
    added += 1;
  });

  return { memory: next, stats: { added, skipped, employees: updatedEmployees.size } };
};

const buildTeamMetricRows = (memory = {}, options = {}) => {
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
  const mediumTasksCount = Number(sizes.M) || 0;
  const complexTasksCount = (Number(sizes.L) || 0) + (Number(sizes.XL) || 0);
  const cycleTasks = taskDetails
    .map(task => {
      const size = normalizeTaskSize(task.size) || 'M';
      const cycleTime = getMetricTaskCycleDays(task);
      return cycleTime === null ? null : { ...task, size, cycleTime };
    })
    .filter(Boolean);
  const avgCycleTime = cycleTasks.length > 0
    ? Math.round((cycleTasks.reduce((sum, task) => sum + task.cycleTime, 0) / cycleTasks.length) * 10) / 10
    : null;
  const onTimeTasks = cycleTasks.filter(task => task.cycleTime <= (TEAM_METRIC_EXPECTED_DAYS[task.size] || TEAM_METRIC_EXPECTED_DAYS.M));
  const onTimeShare = cycleTasks.length > 0 ? Math.round((onTimeTasks.length / cycleTasks.length) * 100) : null;
  const speedScore = onTimeShare === null ? null : onTimeShare;
  const slowSimpleTasks = cycleTasks
    .filter(task => ['S', 'M'].includes(task.size) && task.cycleTime > (TEAM_METRIC_EXPECTED_DAYS[task.size] || TEAM_METRIC_EXPECTED_DAYS.M))
    .sort((a, b) => b.cycleTime - a.cycleTime)
    .slice(0, 3);
  const weekKeys = [...new Set(taskDetails.map(task => safeString(task.weekKey).trim()).filter(Boolean))].sort();
  const currentWeekKey = safeString(options.currentWeekKey).trim() || weekKeys[weekKeys.length - 1] || '';
  const weeklyTasks = currentWeekKey ? taskDetails.filter(task => safeString(task.weekKey).trim() === currentWeekKey) : [];
  const weeklyWeight = weeklyTasks.reduce((sum, task) => sum + (TEAM_METRIC_SIZE_WEIGHTS[normalizeTaskSize(task.size) || 'M'] || TEAM_METRIC_SIZE_WEIGHTS.M), 0);
  const weeklyCycleTasks = weeklyTasks
    .map(task => {
      const size = normalizeTaskSize(task.size) || 'M';
      const cycleTime = getMetricTaskCycleDays(task);
      return cycleTime === null ? null : { ...task, size, cycleTime };
    })
    .filter(Boolean);
  const weeklyOnTimeShare = weeklyCycleTasks.length > 0
    ? Math.round((weeklyCycleTasks.filter(task => task.cycleTime <= (TEAM_METRIC_EXPECTED_DAYS[task.size] || TEAM_METRIC_EXPECTED_DAYS.M)).length / weeklyCycleTasks.length) * 100)
    : null;
  const comparableWeeks = Math.max(0, weekKeys.length - (currentWeekKey && weekKeys.includes(currentWeekKey) ? 1 : 0));
  const historicalWeight = Math.max(0, totalWeight - weeklyWeight);
  const weeklyAverageWeight = comparableWeeks > 0 ? Math.round((historicalWeight / comparableWeeks) * 10) / 10 : weeklyWeight;
  const weeklyWeightDelta = weeklyWeight - weeklyAverageWeight;
  const hasMeaningfulWeeklyDrop = weeklyAverageWeight > 0 && weeklyWeightDelta <= -15 && weeklyWeight <= weeklyAverageWeight * 0.65;
  const hasMeaningfulWeeklyGrowth = weeklyAverageWeight > 0 && weeklyWeightDelta >= 15 && weeklyWeight >= weeklyAverageWeight * 1.3;
  let weeklyTrend = { type: 'stable', label: 'неделя без резких изменений', color: '#64748b', bg: '#f8fafc', border: '#cbd5e1', icon: '→' };
  if (hasMeaningfulWeeklyGrowth) {
    weeklyTrend = { type: 'up', label: 'заметный рост недели', color: '#047857', bg: '#ecfdf5', border: '#a7f3d0', icon: '↑' };
  } else if (hasMeaningfulWeeklyDrop) {
    weeklyTrend = { type: 'down', label: 'существенная просадка недели', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca', icon: '↓' };
  }
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
    mediumTasksCount,
    complexTasksCount,
    avgCycleTime,
    onTimeShare,
    speedScore,
    slowSimpleTasks,
    weeklyWeight,
    weeklyAverageWeight,
    weeklyOnTimeShare,
    weeklyTrend,
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
    const rawIndex = Math.round((volumeShare * 0.70) + (row.heavyWeightShare * 0.30));
    const confidenceCap = row.totalTasks < 15 ? 55 : row.totalTasks < 40 ? 68 : 100;
    const efficiencyIndex = Math.min(rawIndex, confidenceCap);
    const confidenceLabel = row.totalTasks < 15 ? 'мало данных' : row.totalTasks < 40 ? 'средняя выборка' : 'достаточно данных';
    const mainStrength = row.topDomains?.[0]?.[0] || 'Профиль пока не подтвержден';
    const riskNotes = [];
    if (row.totalTasks < 40) riskNotes.push('низкий объем относительно команды');
    if (row.complexTasksCount === 0 || row.heavyWeightShare < 15) riskNotes.push('фокус на потоковых и рутинных задачах');
    if (row.onTimeShare !== null && row.onTimeShare < 60) riskNotes.push('проверить длительность задач после назначения');
    if (row.weeklyTrend?.type === 'down') riskNotes.push('текущая неделя ниже личной базы');
    const summary = `Опора: ${mainStrength}. Факт: ${row.totalTasks} задач, вес ${row.totalWeight}, сложные+ ${row.complexTasksCount}. ${riskNotes.length > 0 ? `Зона проверки: ${riskNotes.slice(0, 2).join('; ')}.` : 'Зона проверки: явных просадок по объему и сложности не видно.'}`;
    return {
      ...row,
      volumeShare,
      contributionIndex: efficiencyIndex,
      efficiencyIndex,
      rawEfficiencyIndex: rawIndex,
      confidenceCap,
      confidenceLabel,
      summary,
      isGrowth: efficiencyIndex >= 80 && row.heavyWeightShare >= 40 && row.totalWeight >= 250
    };
  }).sort((a, b) => b.efficiencyIndex - a.efficiencyIndex || b.totalWeight - a.totalWeight);
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
    cycleTime: pick(record, ['cycletime', 'cycle time', 'leadtime', 'lead time', 'дней', 'цикл', 'since creation', 'time to resolution']),
    assigneeCycleTime: pick(record, ['время от начала работы до завершения', 'execution time', 'assignee cycle', 'assigned cycle']),
    created: pick(record, ['created', 'создан', 'дата создан']),
    assignedAt: pick(record, ['дата назначения', 'assigned', 'assignment']),
    resolved: pick(record, ['resolved', 'closed', 'решен', 'дата реш', 'закрыт']),
    weekKey: pick(record, ['weekkey', 'week', 'недел', 'период']),
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

const getFirstLineProfileMeta = (perf = {}) => {
  const closed = Number(perf.closed) || 0;
  const avgTime = Number(perf.avgTimeMin) || 0;
  const reopenedCount = Array.isArray(perf.reopenedTasks) ? perf.reopenedTasks.length : (Number(perf.reopenedTasks) || 0);
  const droppedCount = Array.isArray(perf.droppedTasks) ? perf.droppedTasks.length : (Number(perf.droppedTasks) || 0);
  const csat = Number(perf.csat) || 5;
  const context = safeString(perf.taskContext).trim();
  const hasContext = context && context !== '-' && context.toLowerCase() !== 'нет данных';

  if (reopenedCount > 0 || droppedCount > 0 || csat < 4.8) {
    return {
      label: 'Контроль качества',
      tone: 'risk',
      detail: hasContext ? context : 'Есть сигналы по возвратам, закрытиям без выполнения или оценкам пользователей.'
    };
  }
  if (closed >= 30 && avgTime > 0 && avgTime <= 45) {
    return {
      label: 'Потоковый решатель',
      tone: 'success',
      detail: hasContext ? context : 'Высокий объем закрытий при коротком среднем времени решения.'
    };
  }
  if (closed >= 20 && avgTime > 90) {
    return {
      label: 'Сложные обращения',
      tone: 'complex',
      detail: hasContext ? context : 'Заметная нагрузка с длинным средним временем: стоит смотреть состав обращений.'
    };
  }
  if (closed >= 15) {
    return {
      label: 'Стабильный поток',
      tone: 'steady',
      detail: hasContext ? context : 'Регулярно закрывает обращения без явных сигналов качества.'
    };
  }
  if (avgTime >= 180) {
    return {
      label: 'Долгие кейсы',
      tone: 'complex',
      detail: hasContext ? context : 'Небольшой объем, но высокое среднее время: проверить, были ли сложные консультации.'
    };
  }
  return {
    label: 'Точечное участие',
    tone: 'neutral',
    detail: hasContext ? context : 'Небольшой объем обращений в текущем периоде.'
  };
};

// --- НАЧАЛЬНЫЕ ДАННЫЕ ---
const defaultWeekData = {
  year: new Date().getFullYear(), month: new Date().getMonth(), weekNumber: getISOWeekNumber(new Date()), dates: "Текущая неделя", 
  status: "green", managementIndex: 100, inflowThisWeek: 0,
  avgCycleTime: 0, reopenRate: 0, techDebtCategories: [],
  mainInsight: "Ожидание данных аналитики...", mainRisk: "Ожидание данных аналитики...",
  nextFocus: "Ожидание данных аналитики...", trainingHypothesis: "Ожидание данных аналитики...",
  weekType: "normal",
  resourceAudit: "",
  incidentsClosed: 0, incidentsQueue: 0, sprintPlanned: 0, sprintCompleted: 0, sprintCarriedOver: 0,
  urgentCompleted: 0, urgentQueue: 0, backlog: 0, backlogOld30: 0, backlogCompleted: 0,
  mainWin: "", thanks: "", sprintWin: "", sprintRisk: "", shieldHero: "", blockersAndWaste: "Ожидание данных аналитики...",
  topIncidents: [], slaMetrics: [], slaBreachDetails: [], topPerformers: [], taskPerformers: [], taskComplexity: [], taskTypesDistribution: [], staleBacklog: [], telephonyData: [], telephonyInsight: "",
  trainingSection: null
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
  const incidentTrend = prevWeekData ? (Number(weekData.incidentsClosed) || 0) - (Number(prevWeekData.incidentsClosed) || 0) : 0;

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
  const closedDetailedTasks = (weekData.detailedTasks || []).filter(task => isClosedTask(task) && !isNonDeliveryTask(task));
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

  const getFirstLineProfileBadge = (perf) => {
    const meta = getFirstLineProfileMeta(perf);
    const toneClass = {
      success: 'bg-emerald-500/10 text-emerald-300 border-emerald-400/30 shadow-[0_0_18px_rgba(16,185,129,0.08)]',
      steady: 'bg-cyan-500/10 text-cyan-300 border-cyan-400/30',
      complex: 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-400/30',
      risk: 'bg-rose-500/10 text-rose-300 border-rose-400/30',
      neutral: 'bg-slate-500/10 text-slate-300 border-slate-500/30'
    }[meta.tone] || 'bg-slate-500/10 text-slate-300 border-slate-500/30';

    return (
      <div className="group relative flex justify-center cursor-help">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.08em] border whitespace-nowrap ${toneClass}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80"></span>
          {meta.label}
        </span>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 pb-3 w-[360px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 text-left">
          <div className="p-4 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl text-[12px] leading-relaxed text-slate-300 relative cursor-auto pointer-events-auto">
            <div className="text-white font-bold mb-1">{meta.label}</div>
            <div>{meta.detail}</div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-600"></div>
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

  const taskPerformersWithNonDelivery = enrichPerformersWithNonDeliveryTasks(weekData.taskPerformers || [], weekData.detailedTasks || []);

  let filteredTaskPerformers = taskPerformersWithNonDelivery.filter(p => {
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
      'Сеть / BinkD': ['Серверная инфраструктура'],
      'Серверная инфраструктура': ['Сеть / BinkD', 'Zabbix / мониторинг', 'Citrix / фермы'],
      'IDM': ['Проекты / процессы'],
      '2FA': ['Проекты / процессы'],
      'Zabbix / мониторинг': ['Серверная инфраструктура', 'Сеть / BinkD'],
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
  const visiblePulseTelephony = (weekData.telephonyData || []).filter(row => isFirstLinePulseOperator(row.name) && !isExcludedFromFirstLineReport(row.name));
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
    const lowParticipation = answered <= 3 && closed === 0;
    const riskLevel = (missed >= 10 || availability < 75) ? 'risk' : ((missed > 0 || availability < 90 || footballRate >= 60 || lowParticipation) ? 'watch' : 'ok');
    let label = 'Норма';
    let note = 'Линия и Jira выглядят сбалансированно.';
    if (riskLevel === 'risk') {
      label = 'Риск KPI линии';
      note = `Доступность ${availability}%, пропущено ${missed}. Проверить смену, АТС и фактическое участие.`;
    } else if (lowParticipation) {
      label = 'Низкое участие';
      note = `Принято ${answered} из ${total}, Jira-закрытий 0. Даже для короткой смены это низкий фактический вклад; проверить график и роль на линии.`;
    } else if (footballRate >= 60 && answered < 10) {
      label = 'Передача без решения';
      note = `Принятый поток малый, но прокси передачи дальше ${footballRate}%: личного закрытия в Jira не видно.`;
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
    const confidence = row.total >= 5 ? 'достаточно данных' : (row.total >= 3 ? 'средне' : 'мало данных');
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

  const buildDisplaySlaMetrics = () => {
    const sourceMetrics = Array.isArray(weekData.slaMetrics) ? weekData.slaMetrics : [];
    const details = Array.isArray(weekData.slaBreachDetails) ? weekData.slaBreachDetails : [];

    const isPrimaryReaction = (value) => {
      const text = safeString(value).toLowerCase();
      return text.includes('инцидент от момента')
        || text.includes('взят')
        || text.includes('перв')
        || text.includes('создан')
        || text.includes('момент')
        || text.includes('reaction')
        || text.includes('first');
    };

    const isResolution = (value) => {
      const text = safeString(value).toLowerCase();
      return text.includes('решен')
        || text.includes('решени')
        || text.includes('закрыт')
        || text.includes('resolution')
        || text.includes('resolve');
    };

    const getOverdueMinutes = (item) => Number(item?.overdueMin ?? item?.overdueMinutes ?? item?.overdue ?? item?.avgOverdueMin ?? 0) || 0;
    const averageOverdue = (items) => {
      const values = items.map(getOverdueMinutes).filter(value => value > 0);
      if (values.length === 0) return 0;
      return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
    };

    const metricLabel = (item) => item?.name || item?.slaType || item?.type || item?.metric || '';
    const metricByName = (predicate) => sourceMetrics.find(item => predicate(metricLabel(item)));
    const metricFromDetails = (name, predicate) => {
      const items = details.filter(item => predicate(metricLabel(item)));
      return { name, avgOverdueMin: averageOverdue(items), violations: items.length };
    };

    const primaryMetric = metricByName(isPrimaryReaction);
    const resolutionMetric = metricByName(isResolution);

    const primary = primaryMetric
      ? { name: 'Инцидент от момента создания', avgOverdueMin: Number(primaryMetric.avgOverdueMin) || 0, violations: Number(primaryMetric.violations) || 0 }
      : metricFromDetails('Инцидент от момента создания', isPrimaryReaction);

    const resolution = resolutionMetric
      ? { name: 'До решения', avgOverdueMin: Number(resolutionMetric.avgOverdueMin) || 0, violations: Number(resolutionMetric.violations) || 0 }
      : metricFromDetails('До решения', isResolution);

    if (sourceMetrics.length === 0 && details.length === 0) return [];
    return [primary, resolution];
  };

  const displaySlaMetrics = buildDisplaySlaMetrics();

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
            <div className="flex flex-col gap-1 mb-1">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">{Number(weekData.incidentsClosed) || 0}</span>
                <span className="text-slate-500 text-sm font-medium">закрыто</span>
              </div>
              {prevWeekData && (
                <div className={`text-xs font-bold flex items-center gap-1 ${incidentTrend > 0 ? 'text-red-400' : incidentTrend < 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                   {incidentTrend !== 0 && (incidentTrend > 0 ? <TrendingUp size={14} /> : <TrendingUp size={14} className="rotate-180" />)}
                   {incidentTrend === 0 ? 'без изменений к прошлой нед.' : `${incidentTrend > 0 ? '+' : '-'}${Math.abs(incidentTrend)} к прошлой нед.`}
                </div>
              )}
            </div>
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

      <h2 className="text-lg font-medium text-white mb-4 mt-8 flex items-center gap-2"><Sparkles size={20} className="text-indigo-400" />Глубокая аналитика потока</h2>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50 shadow-sm">
          <h3 className="text-base font-medium text-slate-200 flex items-center gap-2 mb-5"><Timer size={18} className="text-red-400" /> Мониторинг SLA</h3>
          <div className="space-y-4">
            {displaySlaMetrics.map((sla, idx) => (
              <div key={idx} className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 flex justify-between items-center">
                <div><h4 className="text-sm font-medium text-slate-300">{safeString(sla.name) || 'Неизвестно'}</h4><p className="text-xs text-slate-500 mt-1">Ср. время просрочки: <span className="text-red-400 font-bold">{Number(sla.avgOverdueMin) || 0} мин</span></p></div>
                <div className="text-center bg-red-500/10 px-3 py-1.5 rounded border border-red-500/20"><span className="block text-lg font-bold text-red-400 leading-none">{Number(sla.violations) || 0}</span><span className="text-[10px] text-red-400/80 uppercase">нарушений</span></div>
              </div>
            ))}
            {displaySlaMetrics.length === 0 && <p className="text-sm text-slate-500">Нет данных по SLA</p>}
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
                                -{droppedCount} без вып.
                              </span>
                              {droppedList.length > 0 && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 pb-3 w-[350px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                  <div className="p-4 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl text-[12px] text-slate-300 text-left relative cursor-auto pointer-events-auto">
                                    <div className="font-bold text-slate-300 mb-2 border-b border-slate-700 pb-2 text-sm">Закрыто без выполнения:</div>
                                    <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                                      {droppedList.map((dt, i) => (
                                        <div key={i} className="leading-tight bg-slate-900/60 p-3 rounded-lg border border-slate-700/50">
                                          <span className="text-slate-300 font-bold text-[13px]">{dt.id}</span><br/>
                                          <span className="truncate block w-full text-[12px] text-slate-400 mt-1">{dt.title}</span>
                                          {dt.reason && <span className="block text-[11px] text-amber-300 mt-1">Причина: {dt.reason}</span>}
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
                        <td className="py-3 text-center">{getFirstLineProfileBadge(perf)}</td>
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
                                  -{droppedCount} без вып.
                                </span>
                                {droppedList.length > 0 && (
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 pb-3 w-[350px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                    <div className="p-4 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl text-[12px] text-slate-300 text-left relative cursor-auto pointer-events-auto">
                                      <div className="font-bold text-slate-300 mb-2 border-b border-slate-700 pb-2 text-sm">Закрыто без выполнения:</div>
                                      <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                                        {droppedList.map((dt, i) => (
                                          <div key={i} className="leading-tight bg-slate-900/60 p-3 rounded-lg border border-slate-700/50">
                                            <span className="text-slate-300 font-bold text-[13px]">{dt.id}</span><br/>
                                            <span className="truncate block w-full text-[12px] text-slate-400 mt-1">{dt.title}</span>
                                            {dt.reason && <span className="block text-[11px] text-amber-300 mt-1">Причина: {dt.reason}</span>}
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

const TrainingBoard = ({ weekData, historyKeys, weeksHistory, selectedWeekKey, onWeekSelect, aiTaskMemory, embedded = false }) => {
  const [topReportPreview, setTopReportPreview] = useState('');
  const [topReportError, setTopReportError] = useState('');

  const normalizeRoute = (route) => {
    const text = safeString(route).trim();
    if (!text || ['-', '—', 'null', 'undefined'].includes(text.toLowerCase())) return 'Старые / некорректные значения поля';
    return text;
  };

  const VALID_TRAINING_ROUTES = [
    '1-я линия решила самостоятельно',
    'Решено с помощью администратора 1-й линии',
    'Решено с помощью дежурного администратора',
    'Решено с помощью администратора направления',
    'Передано / требуется участие смежной команды',
    'Другое'
  ];
  const isValidRoute = (route) => VALID_TRAINING_ROUTES.includes(normalizeRoute(route));
  const getRouteDisplayName = (route, hasTraining = true) => {
    if (!isValidRoute(route)) return 'Старые / некорректные значения поля';
    return normalizeRoute(route);
  };
  const isSelfRoute = (route) => normalizeRoute(route) === '1-я линия решила самостоятельно';
  const isHelpRoute = (route) => {
    const normalized = normalizeRoute(route);
    return isValidRoute(normalized) && !isSelfRoute(normalized) && normalized !== 'Другое';
  };

  const isRouteDataGap = (route) => !isValidRoute(route);

  const roundMetric = (value, digits = 1) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return 0;
    const factor = 10 ** digits;
    return Math.round(number * factor) / factor;
  };

  const percentOf = (value, total) => {
    const numerator = Number(value) || 0;
    const denominator = Number(total) || 0;
    return denominator > 0 ? roundMetric(numerator * 100 / denominator, 1) : 0;
  };

  const planningCapacityConfig = {
    traineeCount: 3,
    traineeHoursPerDayMin: 4,
    traineeHoursPerDayMax: 8,
    workdaysPerWeek: 5,
    firstLineAdminCount: 2,
    staffHoursPerDay: 8,
    incidentInitialTriageMinutes: 5,
    incidentSelfSolvedMinutes: 15,
    phoneCallAvgMinutes: 5
  };

  const reportingWeekConfig = {
    weekStartsOn: 'monday',
    weekEndsOn: 'saturday',
    includeSunday: false
  };

  const defaultRouteEffortMinutes = {
    'Решено с помощью администратора 1-й линии': 10,
    'Решено с помощью дежурного администратора': 30,
    'Решено с помощью администратора направления': 45,
    'Передано / требуется участие смежной команды': 15,
    'Другое': 15
  };

  const classifyWeekTypeByInflow = (inflow) => {
    const value = Number(inflow) || 0;
    if (value > 300) return 'incident';
    if (value > 250) return 'high_load';
    if (value >= 200) return 'normal';
    return 'calm';
  };

  const getYearFromWeekKey = (key) => {
    const year = Number(safeString(key).split('-')[0]);
    return Number.isFinite(year) && year > 2000 ? year : new Date().getFullYear();
  };

  const parseReportPeriod = (data = {}, key = '') => {
    const raw = safeString(data.period || data.dates || data.weekDates || data.dateRange);
    const matches = raw.match(/(\d{1,2})[.\-/](\d{1,2})(?:[.\-/](\d{2,4}))?/g) || [];
    if (matches.length < 2) return null;
    const parsePart = (part, fallbackYear) => {
      const pieces = part.split(/[.\-/]/).map(Number);
      const day = pieces[0];
      const month = pieces[1];
      const yearValue = pieces[2] ? (pieces[2] < 100 ? 2000 + pieces[2] : pieces[2]) : fallbackYear;
      if (!day || !month || !yearValue) return null;
      return new Date(yearValue, month - 1, day);
    };
    const fallbackYear = Number(data.year) || getYearFromWeekKey(key || selectedWeekKey);
    const start = parsePart(matches[0], fallbackYear);
    let end = parsePart(matches[matches.length - 1], fallbackYear);
    if (!start || !end) return null;
    if (end < start) end = new Date(end.getFullYear() + 1, end.getMonth(), end.getDate());
    return { start, end, raw };
  };

  const getReportingWeekCompleteness = (data = {}, key = '') => {
    const section = data.trainingSection && typeof data.trainingSection === 'object' ? data.trainingSection : null;
    const explicitPartial = Boolean(
      section?.isPartial === true ||
      section?.partial === true ||
      data.isPartial === true ||
      data.partial === true ||
      safeString(section?.weekCompleteness || data.weekCompleteness).toLowerCase() === 'partial' ||
      safeString(section?.completeness || data.completeness).toLowerCase() === 'partial'
    );
    if (explicitPartial) return { isFull: false, reason: 'explicit' };
    const period = parseReportPeriod(data, key);
    if (!period) return { isFull: true, reason: 'period_not_available' };
    const startDay = period.start.getDay() || 7;
    const endDay = period.end.getDay() || 7;
    const coversStart = reportingWeekConfig.weekStartsOn === 'monday' ? startDay === 1 : true;
    const coversEnd = reportingWeekConfig.weekEndsOn === 'saturday' ? endDay >= 6 : endDay === 7;
    const daysCovered = Math.round((period.end - period.start) / 86400000) + 1;
    const minDays = reportingWeekConfig.includeSunday ? 7 : 6;
    if (coversStart && coversEnd && daysCovered >= minDays) return { isFull: true, reason: 'monday_saturday_covered' };
    return { isFull: false, reason: 'before_saturday' };
  };

  const isPrimarySlaName = (value) => {
    const text = safeString(value).toLowerCase();
    return text.includes('инцидент от момента') || text.includes('взят') || text.includes('перв') || text.includes('реакц') || text.includes('создан') || text.includes('момент');
  };

  const isResolutionSlaName = (value) => {
    const text = safeString(value).toLowerCase();
    return text.includes('до решения') || text.includes('решен') || text.includes('решени') || text.includes('закрыт') || text.includes('resolution') || text.includes('resolve');
  };

  const getSlaViolations = (data, predicate) => {
    const metrics = Array.isArray(data?.slaMetrics) ? data.slaMetrics : [];
    const primary = metrics.find(item => {
      const text = safeString(item?.name || item?.slaType || item?.type || item?.metric).toLowerCase();
      return predicate(text);
    });
    if (primary) return Number(primary.violations) || 0;
    const details = Array.isArray(data?.slaBreachDetails) ? data.slaBreachDetails : [];
    return details.filter(item => {
      const text = safeString(item?.slaType || item?.type || item?.name || item?.metric).toLowerCase();
      return predicate(text);
    }).length;
  };

  const getMedianSlaOverdue = (data, predicate) => {
    const details = Array.isArray(data?.slaBreachDetails) ? data.slaBreachDetails : [];
    const values = details
      .filter(item => {
        const text = safeString(item?.slaType || item?.type || item?.name || item?.metric).toLowerCase();
        return predicate(text);
      })
      .map(item => Number(item?.overdueMin))
      .filter(value => Number.isFinite(value) && value > 0)
      .sort((a, b) => a - b);
    if (values.length === 0) return 0;
    const mid = Math.floor(values.length / 2);
    return values.length % 2 ? values[mid] : roundMetric((values[mid - 1] + values[mid]) / 2, 1);
  };

  const getRepeatCount = (data = {}, section = null) => {
    const direct = Number(section?.repeatIncidentsCount ?? section?.repeatedIncidentsCount ?? data.repeatIncidentsCount ?? data.repeatedIncidentsCount ?? data.returnsCount ?? data.reopenCount);
    if (Number.isFinite(direct) && direct > 0) return direct;
    const performers = Array.isArray(data.topPerformers) ? data.topPerformers : [];
    return performers.reduce((sum, perf) => {
      if (Array.isArray(perf?.reopenedTasks)) return sum + perf.reopenedTasks.length;
      return sum + (Number(perf?.reopenedTasks) || Number(perf?.reopenCount) || 0);
    }, 0);
  };

  const getRepeatRate = (data = {}, closed = 0, section = null) => {
    const direct = Number(section?.repeatIncidentsRate ?? section?.repeatedIncidentsRate ?? data.repeatIncidentsRate ?? data.repeatedIncidentsRate ?? data.returnsRate ?? data.returnRate ?? data.reopenRate);
    if (Number.isFinite(direct) && direct > 0) return roundMetric(direct, 1);
    return percentOf(getRepeatCount(data, section), closed);
  };

  const normalizeTrainingWeek = (data = {}, key = '') => {
    const section = data.trainingSection && typeof data.trainingSection === 'object' ? data.trainingSection : null;
    const closed = Number(section?.closedCount ?? data.incidentsClosed) || 0;
    const queue = Number(section?.queueCount ?? data.incidentsQueue) || 0;
    const inflow = Number(section?.inflowCount ?? (closed + queue)) || 0;
    const manualWeekType = safeString(section?.weekType || data.weekType);
    const completeness = getReportingWeekCompleteness(data, key);
    const normalizedManualType = manualWeekType.toLowerCase();
    const weekType = completeness.isFull
      ? (normalizedManualType && normalizedManualType !== 'partial' ? normalizedManualType : classifyWeekTypeByInflow(inflow))
      : 'partial';
    const primaryViolations = getSlaViolations(data, isPrimarySlaName);
    const resolutionViolations = getSlaViolations(data, isResolutionSlaName);
    const fallbackSuccess = closed > 0 ? Math.max(0, 100 - (primaryViolations / closed) * 100) : 0;
    const resolutionFallbackSuccess = closed > 0 ? Math.max(0, 100 - (resolutionViolations / closed) * 100) : 0;
    const successRate = Number(section?.slaFirstReaction?.successRatePercent ?? fallbackSuccess) || 0;
    const resolutionSuccessRate = Number(section?.slaResolution?.successRatePercent ?? section?.resolutionSla?.successRatePercent ?? resolutionFallbackSuccess) || 0;
    const slaBreachRate = Number(section?.slaBreachRatePercent ?? (closed > 0 ? (primaryViolations / closed) * 100 : 0)) || 0;
    const resolutionSlaBreachRate = Number(section?.resolutionSlaBreachRatePercent ?? (closed > 0 ? (resolutionViolations / closed) * 100 : 0)) || 0;
    const medianSlaBreachMinutes = Number(section?.medianSlaBreachMinutes ?? getMedianSlaOverdue(data, isPrimarySlaName)) || 0;
    const medianResolutionSlaBreachMinutes = Number(section?.medianResolutionSlaBreachMinutes ?? getMedianSlaOverdue(data, isResolutionSlaName)) || 0;
    const sourceRoutes = Array.isArray(section?.routeDistribution) ? section.routeDistribution : [];
    const routeDistribution = sourceRoutes.length > 0
      ? sourceRoutes.map(item => {
        const count = Number(item?.count) || 0;
        return {
          route: normalizeRoute(item?.route),
          count,
          percentage: Number.isFinite(Number(item?.percentage)) ? roundMetric(Number(item.percentage), 1) : (closed > 0 ? roundMetric(count * 100 / closed, 1) : 0)
        };
      })
      : [{ route: 'Старые / некорректные значения поля', count: closed, percentage: closed > 0 ? 100 : 0 }];
    const routeTotal = routeDistribution.reduce((sum, item) => sum + (Number(item.count) || 0), 0) || closed || 0;
    const selfCount = routeDistribution.filter(item => isSelfRoute(item.route)).reduce((sum, item) => sum + (Number(item.count) || 0), 0);
    const helpCount = routeDistribution.filter(item => isHelpRoute(item.route)).reduce((sum, item) => sum + (Number(item.count) || 0), 0);
    const invalidRouteCount = routeDistribution.filter(item => isRouteDataGap(item.route)).reduce((sum, item) => sum + (Number(item.count) || 0), 0);
    const filledRouteCount = routeDistribution.filter(item => isValidRoute(item.route)).reduce((sum, item) => sum + (Number(item.count) || 0), 0);
    const repeatCount = getRepeatCount(data, section);
    const repeatRate = getRepeatRate(data, closed, section);
    const bottleneckThemes = Array.isArray(section?.bottleneckThemes) ? section.bottleneckThemes : [];
    const rawCommentAudit = section?.resolutionCommentAudit && typeof section.resolutionCommentAudit === 'object'
      ? section.resolutionCommentAudit
      : {};
    const hasResolutionCommentAudit = Object.keys(rawCommentAudit).length > 0;
    const commentAuditTotal = Number(rawCommentAudit.totalClosed) || closed || 0;
    const commentAuditMeaningful = Number(rawCommentAudit.meaningfulCount) || 0;
    const resolutionCommentAudit = {
      totalClosed: commentAuditTotal,
      meaningfulCount: commentAuditMeaningful,
      missingOrInvalidCount: Number.isFinite(Number(rawCommentAudit.missingOrInvalidCount))
        ? Number(rawCommentAudit.missingOrInvalidCount)
        : Math.max(0, commentAuditTotal - commentAuditMeaningful),
      automationFilteredCount: Number(rawCommentAudit.automationFilteredCount) || 0,
      ratingFilteredCount: Number(rawCommentAudit.ratingFilteredCount) || 0,
      formalFilteredCount: Number(rawCommentAudit.formalFilteredCount) || 0,
      coveragePercent: hasResolutionCommentAudit && Number.isFinite(Number(rawCommentAudit.coveragePercent))
        ? roundMetric(Number(rawCommentAudit.coveragePercent), 1)
        : (hasResolutionCommentAudit ? percentOf(commentAuditMeaningful, commentAuditTotal) : null),
      patterns: Array.isArray(rawCommentAudit.patterns) ? rawCommentAudit.patterns : [],
      examples: Array.isArray(rawCommentAudit.examples) ? rawCommentAudit.examples : [],
      hasData: hasResolutionCommentAudit
    };
    return {
      hasTraining: Boolean(section),
      weekType,
      isFullReportingWeek: completeness.isFull,
      reportingWeekReason: completeness.reason,
      sectionSummary: safeString(section?.sectionSummary || 'Для этой недели нет отдельного trainingSection. Экран использует fallback из общих инцидентных метрик, маршруты помечены как старые данные.'),
      inflow,
      closed,
      queue,
      successRate: roundMetric(successRate, 1),
      resolutionSuccessRate: roundMetric(resolutionSuccessRate, 1),
      slaBreachRate: roundMetric(slaBreachRate, 1),
      resolutionSlaBreachRate: roundMetric(resolutionSlaBreachRate, 1),
      medianSlaBreachMinutes: roundMetric(medianSlaBreachMinutes, 1),
      medianResolutionSlaBreachMinutes: roundMetric(medianResolutionSlaBreachMinutes, 1),
      primaryViolations,
      resolutionViolations,
      routeDistribution,
      routeTotal,
      filledRouteCount,
      selfCount,
      helpCount,
      unknownCount: invalidRouteCount,
      routeDataQualityPercent: percentOf(filledRouteCount, closed || routeTotal),
      selfPercent: percentOf(selfCount, filledRouteCount),
      helpPercent: percentOf(helpCount, filledRouteCount),
      unknownPercent: percentOf(invalidRouteCount, closed || routeTotal),
      repeatCount,
      repeatRate,
      hasRepeatData: repeatCount > 0 || repeatRate > 0,
      bottleneckThemes,
      resolutionCommentAudit,
      routeSlaBreaches: Array.isArray(section?.routeSlaBreaches) ? section.routeSlaBreaches : []
    };
  };

  const selectedTraining = normalizeTrainingWeek(weekData, selectedWeekKey);
  const sortedKeys = [...(historyKeys || [])].sort();
  const currentIndex = sortedKeys.indexOf(selectedWeekKey);
  const endIndex = currentIndex >= 0 ? currentIndex : sortedKeys.length - 1;
  const TRAINING_BASE_WEEK = 23;
  const hasLoadSlaMetrics = (data = {}) => {
    const normalized = normalizeTrainingWeek(data);
    return normalized.inflow > 0 || normalized.closed > 0 || normalized.successRate > 0 || normalized.resolutionSuccessRate > 0 || normalized.queue > 0;
  };
  const hasRouteMetrics = (data = {}) => {
    const section = data.trainingSection && typeof data.trainingSection === 'object' ? data.trainingSection : null;
    return Boolean(section && Array.isArray(section.routeDistribution) && section.routeDistribution.length > 0);
  };
  const isTrainingCollectionWeek = (key) => {
    const data = weeksHistory?.[key] || {};
    const weekNumber = Number(data.weekNumber || key.split('-')[1]);
    return weekNumber >= TRAINING_BASE_WEEK && hasRouteMetrics(data);
  };
  const allVisibleKeys = sortedKeys.filter(key => sortedKeys.indexOf(key) <= endIndex && hasLoadSlaMetrics(weeksHistory?.[key] || {}));
  const collectionKeys = sortedKeys.filter(key => isTrainingCollectionWeek(key));
  const visibleCollectionKeys = collectionKeys.filter(key => sortedKeys.indexOf(key) <= endIndex);
  const trendKeys = visibleCollectionKeys.length > 0 ? visibleCollectionKeys : sortedKeys.slice(Math.max(0, endIndex - 7), endIndex + 1);
  const buildTrendPoint = (key) => {
    const data = weeksHistory?.[key] || {};
    const normalized = normalizeTrainingWeek(data, key);
    return {
      key,
      name: `Н${data.weekNumber || key.split('-')[1] || ''}`,
      self: normalized.selfPercent,
      sla: normalized.successRate,
      slaResolution: normalized.resolutionSuccessRate,
      help: normalized.helpPercent,
      quality: normalized.routeDataQualityPercent,
      old: normalized.hasTraining ? 0 : 1
    };
  };
  const trendData = trendKeys.map(buildTrendPoint);

  const aggregatePeriod = (keys) => keys.reduce((acc, key) => {
    const normalized = normalizeTrainingWeek(weeksHistory?.[key] || {}, key);
    acc.inflow += normalized.inflow;
    acc.closed += normalized.closed;
    acc.queue += normalized.queue;
    acc.self += normalized.selfCount;
    acc.help += normalized.helpCount;
    acc.total += normalized.filledRouteCount;
    acc.slaWeighted += normalized.successRate * Math.max(normalized.closed, normalized.routeTotal, 0);
    acc.resolutionSlaWeighted += normalized.resolutionSuccessRate * Math.max(normalized.closed, normalized.routeTotal, 0);
    acc.slaWeight += Math.max(normalized.closed, normalized.routeTotal, 0);
    acc.qualityClosed += normalized.closed;
    acc.qualityFilled += normalized.filledRouteCount;
    acc.oldWeeks += normalized.hasTraining ? 0 : 1;
    return acc;
  }, { inflow: 0, closed: 0, queue: 0, self: 0, help: 0, total: 0, slaWeighted: 0, resolutionSlaWeighted: 0, slaWeight: 0, qualityClosed: 0, qualityFilled: 0, oldWeeks: 0 });

  const latestAgg = aggregatePeriod(visibleCollectionKeys);
  const loadAgg = aggregatePeriod(allVisibleKeys);
  const routeBaselineKeys = visibleCollectionKeys.filter(key => ['calm', 'normal'].includes(normalizeTrainingWeek(weeksHistory?.[key] || {}, key).weekType));
  const loadBaselineKeys = allVisibleKeys.filter(key => {
    const normalized = normalizeTrainingWeek(weeksHistory?.[key] || {}, key);
    return normalized.isFullReportingWeek && ['calm', 'normal'].includes(normalized.weekType);
  });
  const medianValue = (values) => {
    const clean = values.map(Number).filter(Number.isFinite).sort((a, b) => a - b);
    if (clean.length === 0) return null;
    const mid = Math.floor(clean.length / 2);
    return clean.length % 2 ? clean[mid] : roundMetric((clean[mid - 1] + clean[mid]) / 2, 1);
  };
  const baselineMetrics = routeBaselineKeys.length >= 3 ? {
    selfPercent: medianValue(routeBaselineKeys.map(key => normalizeTrainingWeek(weeksHistory?.[key] || {}, key).selfPercent)),
    helpPercent: medianValue(routeBaselineKeys.map(key => normalizeTrainingWeek(weeksHistory?.[key] || {}, key).helpPercent)),
    successRate: medianValue(routeBaselineKeys.map(key => normalizeTrainingWeek(weeksHistory?.[key] || {}, key).successRate)),
    resolutionSuccessRate: medianValue(routeBaselineKeys.map(key => normalizeTrainingWeek(weeksHistory?.[key] || {}, key).resolutionSuccessRate)),
    routeDataQualityPercent: medianValue(routeBaselineKeys.map(key => normalizeTrainingWeek(weeksHistory?.[key] || {}, key).routeDataQualityPercent))
  } : null;
  const loadBaselineMetrics = loadBaselineKeys.length >= 3 ? {
    inflow: medianValue(loadBaselineKeys.map(key => normalizeTrainingWeek(weeksHistory?.[key] || {}, key).inflow)),
    successRate: medianValue(loadBaselineKeys.map(key => normalizeTrainingWeek(weeksHistory?.[key] || {}, key).successRate)),
    resolutionSuccessRate: medianValue(loadBaselineKeys.map(key => normalizeTrainingWeek(weeksHistory?.[key] || {}, key).resolutionSuccessRate))
  } : null;
  const periodMetrics = (agg) => ({
    selfPercent: percentOf(agg.self, agg.total),
    helpPercent: percentOf(agg.help, agg.total),
    sla: agg.slaWeight > 0 ? roundMetric(agg.slaWeighted / agg.slaWeight, 1) : 0,
    slaResolution: agg.slaWeight > 0 ? roundMetric(agg.resolutionSlaWeighted / agg.slaWeight, 1) : 0,
    quality: percentOf(agg.qualityFilled, agg.qualityClosed)
  });
  const latestMetrics = periodMetrics(latestAgg);
  const loadMetrics = periodMetrics(loadAgg);
  const delta = {
    self: baselineMetrics ? roundMetric(latestMetrics.selfPercent - baselineMetrics.selfPercent, 1) : null,
    sla: baselineMetrics ? roundMetric(latestMetrics.sla - baselineMetrics.successRate, 1) : null,
    help: baselineMetrics ? roundMetric(latestMetrics.helpPercent - baselineMetrics.helpPercent, 1) : null,
    slaResolution: baselineMetrics ? roundMetric(latestMetrics.slaResolution - baselineMetrics.resolutionSuccessRate, 1) : null,
    quality: baselineMetrics ? roundMetric(latestMetrics.quality - baselineMetrics.routeDataQualityPercent, 1) : null
  };
  const selectedCollectionIndex = visibleCollectionKeys.indexOf(selectedWeekKey);
  const previousTrainingKey = selectedCollectionIndex > 0 ? visibleCollectionKeys[selectedCollectionIndex - 1] : null;
  const previousTraining = previousTrainingKey ? normalizeTrainingWeek(weeksHistory?.[previousTrainingKey] || {}, previousTrainingKey) : null;
  const inflowDelta = previousTraining ? selectedTraining.inflow - previousTraining.inflow : null;
  const inflowHint = previousTraining
    ? (inflowDelta === 0 ? 'К прошлой неделе: без изменений' : `К прошлой неделе: ${inflowDelta > 0 ? 'выше' : 'ниже'} на ${Math.abs(inflowDelta)}`)
    : 'База формируется';

  const formatPercent = (value) => `${roundMetric(value, 1)}%`;
  const pointWord = (value) => {
    const rounded = Math.round(Math.abs(Number(value) || 0));
    if (rounded % 10 === 1 && rounded % 100 !== 11) return 'пункт';
    if ([2, 3, 4].includes(rounded % 10) && ![12, 13, 14].includes(rounded % 100)) return 'пункта';
    return 'пунктов';
  };
  const formatTargetGap = (current, target = 95) => {
    const gap = roundMetric(target - (Number(current) || 0), 1);
    if (gap <= 0) return `Текущее значение ${formatPercent(current)}, цель ${target}%, цель достигнута.`;
    return `Ниже цели. Текущее значение ${formatPercent(current)}, цель ${target}%, до цели не хватает ${gap} ${pointWord(gap)}.`;
  };
  const getSlaStatus = (value) => {
    const number = Number(value) || 0;
    if (number >= 95) return { label: 'в норме', tone: 'text-emerald-300', reportTone: 'good' };
    if (number >= 90) return { label: 'зона внимания', tone: 'text-amber-300', reportTone: 'warn' };
    if (number >= 80) return { label: 'риск, нужен разбор', tone: 'text-orange-300', reportTone: 'risk' };
    return { label: 'критично', tone: 'text-red-300', reportTone: 'bad' };
  };
  const primarySlaStatus = getSlaStatus(selectedTraining.successRate);
  const resolutionSlaStatus = getSlaStatus(selectedTraining.resolutionSuccessRate);
  const formatPointDelta = (current, previous, positiveGood = true) => {
    if (!Number.isFinite(Number(current)) || !Number.isFinite(Number(previous))) return 'база формируется';
    const diff = roundMetric(Number(current) - Number(previous), 1);
    if (diff === 0) return `было ${formatPercent(previous)}, стало ${formatPercent(current)} — без изменений`;
    const good = positiveGood ? diff > 0 : diff < 0;
    return `было ${formatPercent(previous)}, стало ${formatPercent(current)} — ${good ? 'лучше' : 'хуже'} на ${Math.abs(diff)} ${pointWord(diff)}`;
  };
  const formatSignedNumber = (value) => {
    if (!Number.isFinite(Number(value))) return 'база формируется';
    const rounded = roundMetric(Number(value), 1);
    return `${rounded > 0 ? '+' : ''}${rounded}`;
  };
  const hasComparisonBase = Boolean(previousTraining);
  const comparisonRows = [
    { label: 'Самостоятельность', current: selectedTraining.selfPercent, previous: previousTraining?.selfPercent, positiveGood: true },
    { label: 'Помощь выше 1-й линии', current: selectedTraining.helpPercent, previous: previousTraining?.helpPercent, positiveGood: false },
    { label: 'Взятие в работу ≤15 мин', current: selectedTraining.successRate, previous: previousTraining?.successRate, positiveGood: true },
    { label: 'Решение в срок', current: selectedTraining.resolutionSuccessRate, previous: previousTraining?.resolutionSuccessRate, positiveGood: true },
    { label: 'Качество данных', current: selectedTraining.routeDataQualityPercent, previous: previousTraining?.routeDataQualityPercent, positiveGood: true }
  ].map(item => {
    const deltaValue = hasComparisonBase ? roundMetric(item.current - item.previous, 1) : null;
    const isGood = deltaValue === null ? null : (item.positiveGood ? deltaValue >= 0 : deltaValue <= 0);
    return { ...item, deltaValue, isGood };
  });

  const targetRows = [
    { label: 'Взятие в работу ≤15 мин', current: selectedTraining.successRate, target: 95 },
    { label: 'Решение в срок', current: selectedTraining.resolutionSuccessRate, target: 95 },
    { label: 'Качество данных маршрута', current: selectedTraining.routeDataQualityPercent, target: 95 },
    { label: 'Самостоятельность', current: selectedTraining.selfPercent, target: null },
    { label: 'Помощь выше 1-й линии', current: selectedTraining.helpPercent, target: null }
  ];

  const getRouteBucket = (route) => {
    const normalized = normalizeRoute(route);
    return isValidRoute(normalized) ? normalized : 'Старые / некорректные значения поля';
  };

  const routeSlaIndex = (selectedTraining.routeSlaBreaches || []).reduce((acc, item) => {
    const bucket = getRouteBucket(item?.route);
    const primary = Number(item?.slaInputViolations ?? item?.primaryViolations ?? item?.slaFirstReactionViolations ?? item?.violations) || 0;
    const resolution = Number(item?.slaResolutionViolations ?? item?.resolutionViolations ?? item?.resolveViolations ?? item?.violationsResolution) || 0;
    acc[bucket] = {
      primaryViolations: (acc[bucket]?.primaryViolations || 0) + primary,
      resolutionViolations: (acc[bucket]?.resolutionViolations || 0) + resolution,
      hasPrimary: Boolean(acc[bucket]?.hasPrimary || item?.slaInputViolations !== undefined || item?.primaryViolations !== undefined || item?.slaFirstReactionViolations !== undefined || item?.violations !== undefined),
      hasResolution: Boolean(acc[bucket]?.hasResolution || item?.slaResolutionViolations !== undefined || item?.resolutionViolations !== undefined || item?.resolveViolations !== undefined || item?.violationsResolution !== undefined)
    };
    return acc;
  }, {});

  const routeSlaRows = [...VALID_TRAINING_ROUTES, 'Старые / некорректные значения поля']
    .map(route => {
      const count = selectedTraining.routeDistribution
        .filter(item => getRouteBucket(item.route) === route)
        .reduce((sum, item) => sum + (Number(item.count) || 0), 0);
      const slaInfo = routeSlaIndex[route] || {};
      const primaryViolations = Number(slaInfo.primaryViolations) || 0;
      const resolutionViolations = Number(slaInfo.resolutionViolations) || 0;
      const primarySla = count > 0 && slaInfo.hasPrimary ? roundMetric(Math.max(0, 100 - primaryViolations * 100 / count), 1) : null;
      const resolutionSla = count > 0 && slaInfo.hasResolution ? roundMetric(Math.max(0, 100 - resolutionViolations * 100 / count), 1) : null;
      const conclusionSla = resolutionSla ?? primarySla;
      const conclusion = count < 5
        ? 'мало данных для вывода'
        : (conclusionSla === null ? 'нет данных по SLA' : (conclusionSla >= 95 ? 'маршрут стабилен' : (conclusionSla >= 90 ? 'зона внимания' : (conclusionSla >= 80 ? 'риск, нужен разбор' : 'критично, срочный разбор'))));
      return { route, count, primarySla, resolutionSla, conclusion };
    });

  const getThemeRoute = (item) => getRouteDisplayName(item?.mainRoute || item?.route || item?.dominantRoute || item?.topRoute || 'Старые / некорректные значения поля', selectedTraining.hasTraining);
  const getThemeSlaBreaches = (item) => {
    const value = Number(item?.slaBreaches ?? item?.slaBreachCount ?? item?.slaViolations ?? item?.violations);
    return Number.isFinite(value) && value > 0 ? value : null;
  };
  const getThemeAction = (item) => {
    const existing = safeString(item?.actionNeeded);
    if (existing) return existing;
    return '';
  };
  const getSupportLevel = (route) => {
    const text = safeString(route).toLowerCase();
    if (text.includes('администратора 1-й линии')) return 'Администратор 1-й линии';
    if (text.includes('дежур')) return 'Дежурный администратор';
    if (text.includes('направления')) return 'Администратор направления';
    if (text.includes('смеж')) return 'Смежная команда';
    if (text.includes('другое')) return 'Другое';
    return 'Старший уровень не определен';
  };
  const getProblemType = (item) => {
    const explicit = safeString(item?.problemType || item?.incidentType || item?.type || item?.category);
    if (explicit) return explicit;
    const text = safeString(item?.theme).toLowerCase();
    if (text.includes('lotus') || text.includes('bpm') || text.includes('twcms') || text.includes('од')) return 'вход / запуск / первичная диагностика приложений';
    if (text.includes('доступ') || text.includes('прав') || text.includes('учет')) return 'доступы / учетные записи / права';
    if (text.includes('печать') || text.includes('мфу') || text.includes('скан')) return 'печать / МФУ / сканирование';
    if (text.includes('диск') || text.includes('файл') || text.includes('папк')) return 'файлы / диски / документы';
    return 'нужен разбор типовых тикетов';
  };

  const routeChartData = selectedTraining.routeDistribution
    .map(item => {
      const displayRoute = getRouteDisplayName(item.route, selectedTraining.hasTraining);
      return {
        ...item,
        displayRoute,
        label: safeString(displayRoute).length > 28 ? `${safeString(displayRoute).slice(0, 28)}...` : safeString(displayRoute)
      };
    })
    .sort((a, b) => (Number(b.count) || 0) - (Number(a.count) || 0));

  const weekTypeLabels = {
    calm: 'спокойная неделя',
    normal: 'нормальная неделя',
    high_load: 'повышенная нагрузка',
    incident: 'аномальная неделя / возможная авария',
    partial: 'неполная неделя'
  };
  const weekTypeLabel = weekTypeLabels[selectedTraining.weekType] || 'обычная неделя';
  const abnormalWeekNote = selectedTraining.weekType === 'partial'
    ? 'Неполная неделя не используется как эталонная база.'
    : (selectedTraining.weekType === 'incident'
      ? 'Аномальная неделя / возможная авария не используется как эталонная база.'
      : (selectedTraining.weekType === 'high_load'
        ? 'Неделя с повышенной нагрузкой не используется как эталонная база.'
        : ''));
  const validRouteBaseText = selectedTraining.filledRouteCount > 0
    ? `От всех закрытых тикетов: ${formatPercent(percentOf(selectedTraining.selfCount, selectedTraining.closed || selectedTraining.routeTotal))}.`
    : 'Валидные маршруты пока не накоплены.';
  const kpiCards = [
    { label: 'Входящий поток', value: selectedTraining.inflow, suffix: 'шт.', tone: 'text-slate-100', hint: `Тип недели: ${weekTypeLabel}. ${inflowHint}.${abnormalWeekNote ? ` ${abnormalWeekNote}` : ''}` },
    { label: 'Взятие в работу ≤15 мин', value: selectedTraining.successRate, suffix: '%', tone: primarySlaStatus.tone, status: primarySlaStatus.label, target: 95, hint: `${formatPercent(selectedTraining.successRate)} обращений взяли в работу за 15 минут. ${selectedTraining.primaryViolations} обращений — позже нормы. До цели 95% ${selectedTraining.successRate >= 95 ? 'разрыва нет' : `не хватает ${roundMetric(95 - selectedTraining.successRate, 1)} ${pointWord(95 - selectedTraining.successRate)}`}.` },
    { label: 'Решение в срок', value: selectedTraining.resolutionSuccessRate, suffix: '%', tone: resolutionSlaStatus.tone, status: resolutionSlaStatus.label, target: 95, hint: `${formatPercent(selectedTraining.resolutionSuccessRate)} обращений решены в рамках SLA. Просрочек решения: ${selectedTraining.resolutionViolations}. До цели 95% ${selectedTraining.resolutionSuccessRate >= 95 ? 'разрыва нет' : `не хватает ${roundMetric(95 - selectedTraining.resolutionSuccessRate, 1)} ${pointWord(95 - selectedTraining.resolutionSuccessRate)}`}.` },
    { label: 'Самостоятельность', value: selectedTraining.selfPercent, suffix: '%', tone: 'text-cyan-300', hint: `Считается по тикетам с валидным маршрутом решения. ${validRouteBaseText}` },
    { label: 'Помощь выше 1-й линии', value: selectedTraining.helpPercent, suffix: '%', tone: 'text-fuchsia-300', hint: 'Показывает, какая доля инцидентов потребовала участия уровня выше самостоятельного решения 1-й линии.' },
    { label: 'Качество данных маршрута', value: selectedTraining.routeDataQualityPercent, suffix: '%', tone: selectedTraining.routeDataQualityPercent >= 95 ? 'text-emerald-300' : (selectedTraining.routeDataQualityPercent >= 80 ? 'text-amber-300' : 'text-red-300'), status: selectedTraining.routeDataQualityPercent >= 95 ? 'в норме' : (selectedTraining.routeDataQualityPercent >= 80 ? 'предварительно' : 'нужна очистка'), hint: `${formatPercent(selectedTraining.routeDataQualityPercent)} тикетов имеют корректный маршрут. ${selectedTraining.unknownCount} строк нужно очистить. До очистки выводы по маршрутам предварительные.` }
  ];

  const fintechReportCards = kpiCards.filter(card => card.label !== 'Входящий поток');
  const fintechMetrics = fintechReportCards.map(card => {
    const previousMap = {
      'Входящий поток': previousTraining?.inflow,
      'Взятие в работу ≤15 мин': previousTraining?.successRate,
      'Решение в срок': previousTraining?.resolutionSuccessRate,
      'Самостоятельность': previousTraining?.selfPercent,
      'Помощь выше 1-й линии': previousTraining?.helpPercent,
      'Качество данных маршрута': previousTraining?.routeDataQualityPercent
    };
    const previousValue = previousMap[card.label];
    const tone = card.label === 'Взятие в работу ≤15 мин'
      ? primarySlaStatus.reportTone
      : (card.label === 'Решение в срок'
        ? resolutionSlaStatus.reportTone
        : (card.label === 'Самостоятельность'
      ? 'neutral'
      : (card.label === 'Помощь выше 1-й линии'
        ? 'violet'
        : (card.tone.includes('emerald') ? 'good' : (card.tone.includes('amber') ? 'warn' : (card.tone.includes('red') ? 'bad' : 'neutral'))))));
    return {
      label: card.label,
      value: card.value,
      suffix: card.suffix,
      hint: card.hint,
      status: card.status,
      target: card.target,
      previousValue: previousTraining && Number.isFinite(Number(previousValue)) ? Number(previousValue) : null,
      delta: previousTraining && Number.isFinite(Number(previousValue)) ? roundMetric(Number(card.value) - Number(previousValue), 1) : null,
      goodDirection: card.label === 'Помощь выше 1-й линии' ? 'down' : 'up',
      tone
    };
  });

  const fintechTopics = selectedTraining.bottleneckThemes.slice(0, 5).map(item => {
    const theme = safeString(item.theme || item.category) || 'Без темы';
    const focusTitle = safeString(item.focusTitle || item.specificTheme || item.problemFocus) || theme;
    return {
      theme,
      category: safeString(item.category) || (focusTitle !== theme ? theme : ''),
      focusTitle,
      affectedSystems: Array.isArray(item.affectedSystems) ? item.affectedSystems.map(safeString).filter(Boolean) : [],
      topSymptoms: Array.isArray(item.topSymptoms || item.symptoms) ? (item.topSymptoms || item.symptoms) : [],
      examples: Array.isArray(item.examples) ? item.examples : [],
      resolutionPatterns: Array.isArray(item.resolutionPatterns) ? item.resolutionPatterns : [],
      resolutionCoveragePercent: Number.isFinite(Number(item.resolutionCoveragePercent)) ? Number(item.resolutionCoveragePercent) : null,
      actionPlan: item.actionPlan && typeof item.actionPlan === 'object' ? item.actionPlan : null,
      actionDataGap: safeString(item.actionDataGap),
      rootCauseHypothesis: safeString(item.rootCauseHypothesis || item.rootCause || item.hypothesis),
      ownerRole: safeString(item.ownerRole || item.owner),
      count: Number(item.count) || 0,
      mainRoute: getThemeRoute(item),
      supportLevel: safeString(item.supportLevel || item.helpLevel || item.seniorLevel) || getSupportLevel(getThemeRoute(item)),
      problemType: getProblemType(item),
      slaBreaches: getThemeSlaBreaches(item),
      actionNeeded: getThemeAction(item),
      check: safeString(item.check || item.verification || item.howToCheck) || 'Через неделю смотрим: снизилась ли помощь выше 1-й линии по этой теме и улучшилось ли Решение в срок.'
    };
  });

  const weakestSlaValue = Math.min(selectedTraining.successRate || 0, selectedTraining.resolutionSuccessRate || 0);
  const getResolvedWeekStatus = () => {
    const slaTail = weakestSlaValue < 80
      ? 'SLA ниже критического порога, нужен срочный разбор.'
      : (weakestSlaValue < 90
        ? 'SLA ниже цели, нужен разбор причин.'
        : (weakestSlaValue < 95 ? 'SLA ниже цели, зона внимания.' : 'SLA на целевом уровне.'));
    if (selectedTraining.weekType === 'partial') {
      return {
        key: 'partial',
        title: `Неполная неделя: статус предварительный. ${slaTail}`,
        summary: `${weekTypeLabel}. Нагрузка в пределах ${selectedTraining.inflow >= 200 && selectedTraining.inflow <= 250 ? 'нормального диапазона' : 'текущего диапазона'}, но неделя не используется как база.`
      };
    }
    if (weakestSlaValue < 80) return { key: 'critical', title: 'Критично: SLA требует срочного разбора', summary: 'Один из SLA ниже 80%. Красный статус используется только для таких случаев.' };
    if (selectedTraining.weekType === 'incident') return { key: 'incident', title: 'Аномальная неделя / возможная авария', summary: 'Входящий поток выше 300 или неделя помечена как аварийная. Для базы не используем.' };
    if (selectedTraining.weekType === 'high_load') return { key: 'high_load', title: 'Повышенная нагрузка', summary: 'Поток выше нормального диапазона. Для эталонной базы неделю не используем.' };
    if (weakestSlaValue < 90) return { key: 'risk', title: 'Риск по SLA: нужен разбор причин', summary: 'SLA в диапазоне 80-89,9%. Это риск, но не критичный красный статус.' };
    if (weakestSlaValue < 95) return { key: 'attention', title: 'Зона внимания: SLA ниже цели', summary: 'SLA в диапазоне 90-94,9%. Нужен контроль причин и динамики.' };
    return { key: selectedTraining.weekType, title: 'Сервис стабилен', summary: `${weekTypeLabel}. SLA на целевом уровне.` };
  };
  const resolvedWeekStatus = getResolvedWeekStatus();
  const weakestSlaRoute = routeSlaRows
    .filter(row => row.count >= 5 && row.resolutionSla !== null)
    .sort((a, b) => (a.resolutionSla || 0) - (b.resolutionSla || 0))[0];
  const mainActionTopic = fintechTopics[0] || null;
  const reportStatusWeek = {
    title: resolvedWeekStatus.title,
    summary: resolvedWeekStatus.summary || selectedTraining.sectionSummary,
    points: [
      `Тип недели: ${weekTypeLabel}.`,
      `Взятие в работу ≤15 мин: ${formatPercent(selectedTraining.successRate)}, цель 95%, ${selectedTraining.successRate >= 95 ? 'цель достигнута' : `не хватает ${roundMetric(95 - selectedTraining.successRate, 1)} ${pointWord(95 - selectedTraining.successRate)}`}.`,
      `Решение в срок: ${formatPercent(selectedTraining.resolutionSuccessRate)}, цель 95%, ${selectedTraining.resolutionSuccessRate >= 95 ? 'цель достигнута' : `не хватает ${roundMetric(95 - selectedTraining.resolutionSuccessRate, 1)} ${pointWord(95 - selectedTraining.resolutionSuccessRate)}`}.`,
      `Самостоятельность 1-й линии: ${formatPercent(selectedTraining.selfPercent)} по валидным маршрутам.`,
      `Помощь выше 1-й линии: ${formatPercent(selectedTraining.helpPercent)} валидных маршрутов — требуется разбор тем и маршрутов.`,
      weakestSlaRoute ? `Самая слабая точка по SLA: ${weakestSlaRoute.route}.` : 'По маршрутам пока недостаточно SLA-данных.',
      abnormalWeekNote || (loadBaselineKeys.length < 3 ? 'База нагрузки и SLA формируется: нужно минимум 3 полные обычные недели.' : 'База нагрузки и SLA считается по медиане полных обычных недель.')
    ],
    nextAction: mainActionTopic ? `На следующей неделе разбираем конкретный сценарий: ${mainActionTopic.focusTitle}.` : 'Накопить топ тем с не-самостоятельным маршрутом.'
  };
  const selfTrendUp = previousTraining ? selectedTraining.selfPercent >= previousTraining.selfPercent : false;
  const helpTrendDown = previousTraining ? selectedTraining.helpPercent <= previousTraining.helpPercent : false;
  const slaNotWorse = previousTraining ? selectedTraining.successRate >= previousTraining.successRate && selectedTraining.resolutionSuccessRate >= previousTraining.resolutionSuccessRate : false;
  const repeatNotGrowing = previousTraining && selectedTraining.hasRepeatData && previousTraining.hasRepeatData ? selectedTraining.repeatRate <= previousTraining.repeatRate : false;
  const reportHealthyImprovement = !selectedTraining.hasRepeatData
    ? {
      title: 'Вывод предварительный',
      summary: `Улучшение считается здоровым, если самостоятельность растет, помощь выше 1-й линии снижается, Взятие в работу и Решение в срок не ухудшаются, повторные обращения не растут. Повторные обращения пока не подключены. Вывод предварительный.${weakestSlaValue < 95 ? ' Сначала разбираем SLA: рост самостоятельности нельзя считать успехом, если одновременно ухудшается скорость или качество решения.' : ''}`
    }
    : (selfTrendUp && helpTrendDown && slaNotWorse && repeatNotGrowing
      ? { title: 'Улучшение выглядит здоровым', summary: 'Самостоятельность растет, помощь выше 1-й линии снижается, SLA и повторы не ухудшаются.' }
      : { title: 'Нужно проверить качество улучшения', summary: 'Динамика маршрутов сама по себе недостаточна: проверяем SLA и повторные обращения.' });
  const reportMainAction = mainActionTopic ? {
    theme: mainActionTopic.theme,
    category: mainActionTopic.category,
    focusTitle: mainActionTopic.focusTitle,
    affectedSystems: mainActionTopic.affectedSystems,
    topSymptoms: mainActionTopic.topSymptoms,
    examples: mainActionTopic.examples,
    resolutionPatterns: mainActionTopic.resolutionPatterns,
    resolutionCoveragePercent: mainActionTopic.resolutionCoveragePercent,
    rootCauseHypothesis: mainActionTopic.rootCauseHypothesis,
    mainRoute: mainActionTopic.mainRoute,
    count: mainActionTopic.count,
    slaBreaches: mainActionTopic.slaBreaches,
    actionNeeded: mainActionTopic.actionNeeded,
    details: `Почему выбрали: эта тема чаще всего требует помощи выше 1-й линии и дает заметную долю SLA-просрочек. Тикетов: ${mainActionTopic.count}, SLA-просрочки: ${mainActionTopic.slaBreaches === null ? 'нет данных' : mainActionTopic.slaBreaches}, основной маршрут: ${mainActionTopic.mainRoute}. Что делаем: разбираем 5-7 типовых тикетов; выделяем общий сценарий; обновляем инструкцию, чек-лист или маршрут; обсуждаем на коротком синке с 1-й линией.`,
    check: mainActionTopic.check || 'Как проверяем через неделю: доля помощи выше 1-й линии по теме; показатель «Решение в срок» по теме; количество повторных обращений, если данные есть.'
  } : {};
  const seniorWorkMap = fintechTopics.reduce((acc, topic) => {
    const level = topic.supportLevel || 'Старший уровень не определен';
    if (!acc[level]) acc[level] = { level, count: 0, themes: [], problemTypes: new Set() };
    acc[level].count += Number(topic.count) || 0;
    if (topic.focusTitle) acc[level].themes.push(topic.focusTitle);
    if (topic.problemType) acc[level].problemTypes.add(topic.problemType);
    return acc;
  }, {});
  const seniorWorkRows = Object.values(seniorWorkMap)
    .sort((a, b) => b.count - a.count)
    .map(row => {
      const themeText = row.themes.slice(0, 4).join(', ') || 'Недостаточно данных';
      if (row.level === 'Администратор 1-й линии') return { level: row.level, themes: themeText, count: row.count, meaning: '1-й линии не хватает инструкции, прав или понятного первого шага.', action: 'Чек-листы, обучение, типовые права.' };
      if (row.level === 'Дежурный администратор') return { level: row.level, themes: themeText, count: row.count, meaning: 'Часть обращений требует инфраструктурной проверки или прав.', action: 'Маршрут диагностики и критерии передачи дежурному.' };
      if (row.level === 'Администратор направления') return { level: row.level, themes: themeText, count: row.count, meaning: 'Сложные или редкие кейсы могут отвлекать от задач развития.', action: 'Разбор точечных кейсов, при необходимости задача в развитие.' };
      if (row.level === 'Смежная команда') return { level: row.level, themes: themeText, count: row.count, meaning: 'Есть внешняя зависимость вне зоны ОСО.', action: 'Минимальный набор данных для передачи смежникам.' };
      return { level: row.level, themes: themeText, count: row.count, meaning: 'Недостаточно данных для устойчивого вывода, продолжаем сбор.', action: 'Разобрать типовые тикеты и уточнить маршрут.' };
    });
  const loadContext = {
    inflow: selectedTraining.inflow,
    closed: selectedTraining.closed,
    queue: selectedTraining.queue,
    weekTypeLabel,
    inflowChange: previousTraining ? (selectedTraining.inflow === previousTraining.inflow ? 'без изменений' : `${selectedTraining.inflow > previousTraining.inflow ? 'выше' : 'ниже'} на ${Math.abs(selectedTraining.inflow - previousTraining.inflow)} шт.`) : 'база формируется',
    note: abnormalWeekNote || 'Эти показатели объясняют нагрузку, но не являются основной оценкой качества процесса.'
  };

  const formatHours = (value) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return 'данные пока не подключены';
    return `${roundMetric(number, 1)} ч`;
  };

  const getMainThemeForWeek = (normalized, data = {}) => {
    const fromTraining = [...(normalized.bottleneckThemes || [])]
      .map(item => ({
        theme: safeString(item.theme || item.name || item.title),
        count: Number(item.count) || 0,
        route: getThemeRoute(item),
        supportLevel: safeString(item.supportLevel || item.helpLevel || item.seniorLevel) || getSupportLevel(getThemeRoute(item)),
        slaBreaches: getThemeSlaBreaches(item),
        actionNeeded: getThemeAction(item)
      }))
      .filter(item => item.theme);
    const fromTopIncidents = Array.isArray(data.topIncidents)
      ? data.topIncidents.map(item => ({
        theme: safeString(item.theme || item.title || item.name || item.category),
        count: Number(item.count || item.value || item.total) || 0,
        route: 'не определен',
        supportLevel: 'не определен',
        slaBreaches: null,
        actionNeeded: 'Разобрать типовые тикеты и уточнить маршрут.'
      })).filter(item => item.theme)
      : [];
    return [...fromTraining, ...fromTopIncidents].sort((a, b) => b.count - a.count)[0] || null;
  };

  const getWeekTypeReportLabel = (type) => weekTypeLabels[type] || 'нормальная неделя';
  const isBaselineEligibleType = (type) => ['calm', 'normal'].includes(type);
  const loadBaselineText = loadBaselineMetrics
    ? `Сформирована по медиане ${loadBaselineKeys.length} полных обычных недель. High-load, incident и partial исключены.`
    : `База нагрузки и SLA формируется. Нужно минимум 3 полные обычные недели. Сейчас доступно: ${loadBaselineKeys.length}.`;
  const routeBaselineText = baselineMetrics
    ? `Сформирована по медиане ${routeBaselineKeys.length} недель с маршрутом решения. High-load, incident и partial исключены.`
    : `База маршрутов формируется. Нужно минимум 3 обычные недели с routeDistribution. Сейчас доступно: ${routeBaselineKeys.length}.`;

  const periodTrendRows = allVisibleKeys.map(key => {
    const data = weeksHistory?.[key] || {};
    const normalized = normalizeTrainingWeek(data, key);
    const mainTheme = getMainThemeForWeek(normalized, data);
    return {
      week: `Н${data.weekNumber || key.split('-')[1] || ''}`,
      period: data.dates || data.period || data.weekDates || '',
      weekType: normalized.weekType,
      weekTypeLabel: getWeekTypeReportLabel(normalized.weekType),
      inflow: normalized.inflow,
      closed: normalized.closed,
      queue: normalized.queue,
      primarySla: normalized.successRate,
      resolutionSla: normalized.resolutionSuccessRate,
      helpPercent: normalized.helpPercent,
      mainTheme: mainTheme?.theme || '',
      comment: normalized.hasTraining ? 'маршрут доступен' : 'маршрут решения ещё не собирался в этот период'
    };
  });

  const routeTrendRows = visibleCollectionKeys.map(key => {
    const data = weeksHistory?.[key] || {};
    const normalized = normalizeTrainingWeek(data, key);
    const routeLeader = normalized.routeDistribution
      .filter(item => isHelpRoute(item.route))
      .sort((a, b) => (Number(b.count) || 0) - (Number(a.count) || 0))[0];
    const conclusion = normalized.routeDataQualityPercent < 80
      ? 'сначала очистить данные маршрута'
      : (normalized.helpPercent >= 40 ? 'высокая доля помощи старших' : 'маршрутная динамика читается');
    return {
      week: `Н${data.weekNumber || key.split('-')[1] || ''}`,
      selfPercent: normalized.selfPercent,
      helpPercent: normalized.helpPercent,
      routeQuality: normalized.routeDataQualityPercent,
      unknownCount: normalized.unknownCount,
      mainSupportRoute: routeLeader?.route || 'нет выраженного маршрута помощи',
      conclusion
    };
  });

  const inflowValues = allVisibleKeys.map(key => normalizeTrainingWeek(weeksHistory?.[key] || {}, key).inflow).filter(value => Number.isFinite(value) && value > 0);
  const averageInflow = inflowValues.length ? roundMetric(inflowValues.reduce((sum, value) => sum + value, 0) / inflowValues.length, 1) : null;
  const medianInflow = medianValue(inflowValues);
  const inflowDeviation = medianInflow === null ? null : roundMetric(selectedTraining.inflow - medianInflow, 1);
  const trafficLabel = selectedTraining.inflow > 300
    ? 'аномальная неделя / возможная авария'
    : (selectedTraining.inflow > 250 ? 'повышенная нагрузка, нужен анализ' : (selectedTraining.inflow >= 200 ? 'нормальная нагрузка' : 'спокойная нагрузка'));

  const abnormalWeekRows = allVisibleKeys
    .map(key => {
      const data = weeksHistory?.[key] || {};
      const normalized = normalizeTrainingWeek(data, key);
      const mainTheme = getMainThemeForWeek(normalized, data);
      const themeShare = mainTheme ? percentOf(mainTheme.count, normalized.inflow) : 0;
      const abnormal = normalized.weekType === 'incident' || normalized.inflow > 300;
      if (!abnormal) return null;
      const probableCause = mainTheme && themeShare >= 15
        ? `Вероятная причина всплеска: ${mainTheme.theme}`
        : 'Аномальный рост входящего потока. Причина требует дополнительного разбора.';
      return {
        week: `Н${data.weekNumber || key.split('-')[1] || ''}`,
        inflow: normalized.inflow,
        weekTypeLabel: getWeekTypeReportLabel(normalized.weekType),
        primarySla: normalized.successRate,
        resolutionSla: normalized.resolutionSuccessRate,
        helpPercent: normalized.helpPercent,
        probableCause,
        mainTheme: mainTheme?.theme || '',
        themeCount: mainTheme?.count || 0,
        themeShare,
        mainSupportRoute: mainTheme?.route || mainTheme?.supportLevel || '',
        conclusion: 'Неделя не используется как эталонная база.'
      };
    })
    .filter(Boolean);

  const recurringThemeMap = visibleCollectionKeys.reduce((acc, key) => {
    const data = weeksHistory?.[key] || {};
    const normalized = normalizeTrainingWeek(data, key);
    const addRecurringTheme = (item, fallback = {}) => {
      const theme = safeString(item.theme || item.name || item.title);
      if (!theme) return;
      if (!acc[theme]) acc[theme] = { theme, weeks: new Set(), totalCount: 0, routes: {}, totalSlaBreaches: 0, actionNeeded: '' };
      acc[theme].weeks.add(key);
      acc[theme].totalCount += Number(item.count) || 0;
      const route = fallback.route || getThemeRoute(item);
      acc[theme].routes[route] = (acc[theme].routes[route] || 0) + (Number(item.count) || 0);
      acc[theme].totalSlaBreaches += Number(fallback.slaBreaches ?? getThemeSlaBreaches(item)) || 0;
      if (!acc[theme].actionNeeded) acc[theme].actionNeeded = fallback.actionNeeded || getThemeAction(item);
    };
    (normalized.bottleneckThemes || []).forEach(item => addRecurringTheme(item));
    (Array.isArray(data.topIncidents) ? data.topIncidents : []).forEach(item => addRecurringTheme({
      theme: item.theme || item.title || item.name || item.category,
      count: item.count || item.value || item.total
    }, {
      route: 'не определен',
      slaBreaches: 0,
      actionNeeded: 'Проверить, требует ли тема инструкции, прав, обучения или изменения маршрута.'
    }));
    return acc;
  }, {});
  const recurringThemes = Object.values(recurringThemeMap)
    .map(item => {
      const mainRoute = Object.entries(item.routes).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
      return {
        theme: item.theme,
        weeksCount: item.weeks.size,
        totalCount: item.totalCount,
        mainRoute,
        totalSlaBreaches: item.totalSlaBreaches,
        actionNeeded: item.weeks.size >= 2
          ? `${item.actionNeeded} Повторяющаяся тема, кандидат на инструкцию / права / обучение / изменение маршрута.`
          : item.actionNeeded
      };
    })
    .filter(item => item.weeksCount >= 2)
    .sort((a, b) => b.weeksCount - a.weeksCount || b.totalCount - a.totalCount)
    .slice(0, 7);

  const traineeMinHours = planningCapacityConfig.traineeCount * planningCapacityConfig.traineeHoursPerDayMin * planningCapacityConfig.workdaysPerWeek;
  const traineeMaxHours = planningCapacityConfig.traineeCount * planningCapacityConfig.traineeHoursPerDayMax * planningCapacityConfig.workdaysPerWeek;
  const firstLineIncidentHours = (selectedTraining.inflow * planningCapacityConfig.incidentInitialTriageMinutes + selectedTraining.selfCount * planningCapacityConfig.incidentSelfSolvedMinutes) / 60;

  const currentRouteCount = (route) => selectedTraining.routeDistribution
    .filter(item => normalizeRoute(item.route) === route)
    .reduce((sum, item) => sum + (Number(item.count) || 0), 0);
  const seniorReserveRows = Object.entries(defaultRouteEffortMinutes).map(([route, minutes]) => {
    const countValue = currentRouteCount(route);
    const hours = countValue * minutes / 60;
    return { label: route, count: countValue, hours, hoursText: formatHours(hours) };
  }).filter(row => row.count > 0 || row.label !== 'Другое');
  const totalSeniorSupportHours = seniorReserveRows.reduce((sum, row) => sum + row.hours, 0);

  const getPhoneSummary = (data) => {
    const rowSources = [data?.telephonyData, data?.telephonyRows, data?.phoneData, data?.callsData];
    const rows = rowSources.find(Array.isArray) || [];
    const fromRows = rows.reduce((acc, row) => {
      const missed = Number(row?.missed ?? row?.missedCount ?? row?.lost ?? row?.notAnswered ?? row?.unanswered ?? 0);
      const answered = Number(row?.answered ?? row?.answeredCount ?? row?.accepted ?? row?.handled ?? row?.incoming ?? row?.calls ?? row?.count ?? 0);
      const total = Number(row?.total ?? row?.totalCalls ?? row?.all ?? row?.callsTotal ?? 0);
      const cleanMissed = Number.isFinite(missed) ? missed : 0;
      const cleanAnswered = Number.isFinite(answered) ? answered : 0;
      const cleanTotal = Number.isFinite(total) && total > 0 ? total : cleanAnswered + cleanMissed;
      acc.answered += cleanAnswered;
      acc.missed += cleanMissed;
      acc.total += cleanTotal;
      return acc;
    }, { answered: 0, missed: 0, total: 0 });
    if (fromRows.answered > 0 || fromRows.missed > 0 || fromRows.total > 0) {
      return { ...fromRows, rowsCount: rows.length, source: 'telephonyData' };
    }

    const summary = data?.telephonySummary || data?.phoneSummary || data?.telephony || data?.callMetrics || {};
    const hasSummarySource = summary && typeof summary === 'object' && Object.keys(summary).length > 0;
    const missed = Number(summary?.missed ?? summary?.missedCount ?? summary?.lost ?? summary?.notAnswered ?? summary?.unanswered ?? 0);
    const answered = Number(summary?.answered ?? summary?.answeredCount ?? summary?.accepted ?? summary?.handled ?? summary?.callsCount ?? summary?.calls ?? 0);
    const total = Number(summary?.total ?? summary?.totalCalls ?? summary?.callsTotal ?? 0);
    const cleanMissed = Number.isFinite(missed) ? missed : 0;
    const cleanAnswered = Number.isFinite(answered) ? answered : 0;
    const cleanTotal = Number.isFinite(total) && total > 0 ? total : cleanAnswered + cleanMissed;
    return {
      answered: cleanAnswered,
      missed: cleanMissed,
      total: cleanTotal,
      rowsCount: cleanAnswered > 0 || cleanMissed > 0 || cleanTotal > 0 ? 1 : 0,
      source: hasSummarySource ? 'telephonySummary' : 'telephonyData'
    };
  };
  const phoneSummary = getPhoneSummary(weekData);
  const phoneCallsCount = phoneSummary.total || phoneSummary.answered;
  const telephonyHistoryRows = Object.entries(weeksHistory || {})
    .map(([key, data]) => ({ key, summary: getPhoneSummary(data) }))
    .filter(item => item.summary.answered > 0 || item.summary.missed > 0 || item.summary.total > 0)
    .sort((a, b) => b.key.localeCompare(a.key));
  const phoneSourceLabel = `history[${selectedWeekKey}].${phoneSummary.source || 'telephonyData'}`;
  const previousPhoneSummary = previousTrainingKey ? getPhoneSummary(weeksHistory?.[previousTrainingKey] || {}) : null;
  const previousPhoneCallsCount = previousPhoneSummary ? (previousPhoneSummary.total || previousPhoneSummary.answered) : null;
  const phoneDeltaText = previousPhoneCallsCount === null
    ? 'база формируется'
    : (phoneCallsCount === previousPhoneCallsCount ? 'без изменений' : `${phoneCallsCount > previousPhoneCallsCount ? '+' : '-'}${Math.abs(phoneCallsCount - previousPhoneCallsCount)} звонков к прошлой неделе`);
  const phoneMissedTarget = 15;
  const phoneMissedDeltaText = previousPhoneSummary === null
    ? 'база формируется'
    : (phoneSummary.missed === previousPhoneSummary.missed ? 'без изменений' : `${phoneSummary.missed > previousPhoneSummary.missed ? '+' : '-'}${Math.abs(phoneSummary.missed - previousPhoneSummary.missed)} пропущенных к прошлой неделе`);
  const phoneLoadHours = phoneCallsCount * planningCapacityConfig.phoneCallAvgMinutes / 60;
  const seniorTaskAdmins = new Set([...THIRD_LINE_ADMINS, 'Владимир Приходько'].map(name => safeString(name).toLowerCase()));
  const isClosedDetailedTask = (task) => {
    const status = safeString(task?.status).toLowerCase();
    return Boolean(task?.resolved || task?.resolutionDate || task?.closedAt || ['закрыт', 'готово', 'resolved', 'завершен', 'done'].some(item => status.includes(item)));
  };
  const getTaskMemory = (task = {}) => {
    const id = safeString(task.id || task.key || task.issueKey).trim();
    return id ? (aiTaskMemory?.[id] || aiTaskMemory?.[id.toUpperCase()] || {}) : {};
  };
  const getReportTaskSize = (task = {}) => normalizeTaskSize(getTaskMemory(task).complexity || task.size || task.complexity || task.name) || getMetricTaskSize(task);
  const getReportTaskValue = (task = {}) => safeString(getTaskMemory(task).priority || task.valueCategory || task.impactCategory || task.category || task.valueType || task.type).toLowerCase();
  const getTaskAssigneeName = (task = {}) => getFullName(task.assignee || task.executor || task.owner || task.responsible || task['Исполнитель'] || task['Ответственный']);
  const isSeniorTask = (task = {}) => {
    const assignee = getTaskAssigneeName(task);
    return seniorTaskAdmins.has(safeString(assignee).toLowerCase());
  };
  const selectedDetailedTasks = Array.isArray(weekData?.detailedTasks) ? weekData.detailedTasks : [];
  const seniorDetailedTasks = selectedDetailedTasks.filter(task => task && !isNonDeliveryTask(task) && isSeniorTask(task));
  const seniorClosedTasks = seniorDetailedTasks.filter(isClosedDetailedTask);
  const seniorBacklogFromTasks = seniorDetailedTasks.filter(task => !isClosedDetailedTask(task)).length;
  const seniorBacklogFromPerformers = (Array.isArray(weekData?.taskPerformers) ? weekData.taskPerformers : [])
    .filter(row => seniorTaskAdmins.has(safeString(getFullName(row?.name || row?.assignee)).toLowerCase()))
    .reduce((sum, row) => sum + (Number(row?.wip || row?.backlog || row?.open || row?.active || 0) || 0), 0);
  const seniorBacklog = Math.max(seniorBacklogFromTasks, seniorBacklogFromPerformers);
  const seniorCycleTasks = seniorClosedTasks
    .map(task => ({ task, size: getReportTaskSize(task), cycleDays: getMetricTaskCycleDays(task) }))
    .filter(item => Number.isFinite(Number(item.cycleDays)));
  const seniorAvgCycleDays = seniorCycleTasks.length
    ? roundMetric(seniorCycleTasks.reduce((sum, item) => sum + Number(item.cycleDays), 0) / seniorCycleTasks.length, 1)
    : null;
  const isHeavySeniorTask = (task = {}) => {
    const size = getReportTaskSize(task);
    const value = getReportTaskValue(task);
    const cycleDays = Number(getMetricTaskCycleDays(task));
    return ['L', 'XL'].includes(size)
      || value.includes('impact')
      || value.includes('business')
      || value.includes('важ')
      || value.includes('техдолг')
      || (Number.isFinite(cycleDays) && cycleDays >= 30);
  };
  const seniorHeavyClosedTasks = seniorClosedTasks
    .filter(isHeavySeniorTask)
    .map(task => {
      const size = getReportTaskSize(task);
      const cycleDays = getMetricTaskCycleDays(task);
      const domain = inferTaskDomain(task);
      return {
        id: safeString(task.id || task.key || task.issueKey),
        title: safeString(task.title || task.summary || task.name || 'Без названия'),
        size,
        sizeLabel: getTaskSizeLabel(size),
        cycleDays,
        domain,
        assignee: getTaskAssigneeName(task)
      };
    })
    .sort((a, b) => (Number(b.cycleDays) || 0) - (Number(a.cycleDays) || 0))
    .slice(0, 4);
  const seniorHeavyShare = percentOf(seniorHeavyClosedTasks.length, seniorClosedTasks.length);
  const taskThroughputDelta = previousTrainingKey
    ? seniorClosedTasks.length - (Array.isArray(weeksHistory?.[previousTrainingKey]?.detailedTasks) ? weeksHistory[previousTrainingKey].detailedTasks : [])
      .filter(task => task && !isNonDeliveryTask(task) && isSeniorTask(task) && isClosedDetailedTask(task)).length
    : null;
  const seniorProjectShare = seniorClosedTasks.length + selectedTraining.helpCount > 0 ? percentOf(seniorClosedTasks.length, seniorClosedTasks.length + selectedTraining.helpCount) : 0;
  const seniorHelpShare = seniorClosedTasks.length + selectedTraining.helpCount > 0 ? percentOf(selectedTraining.helpCount, seniorClosedTasks.length + selectedTraining.helpCount) : 0;
  const totalTaskBacklog = Number(weekData?.backlog || weekData?.backlogTotal || 0) || 0;
  const seniorTaskFlow = {
    hasData: seniorClosedTasks.length > 0 || seniorBacklog > 0 || selectedTraining.helpCount > 0,
    closedCount: seniorClosedTasks.length,
    helpCount: selectedTraining.helpCount,
    totalBacklog: totalTaskBacklog,
    backlogCount: seniorBacklog,
    heavyClosedCount: seniorHeavyClosedTasks.length,
    heavyShare: seniorHeavyShare,
    avgCycleDays: seniorAvgCycleDays,
    helpShare: seniorHelpShare,
    projectShare: seniorProjectShare,
    balanceLabel: selectedTraining.helpCount > seniorClosedTasks.length * 3 ? 'высокий фон поддержки 1-й линии' : (selectedTraining.helpCount > seniorClosedTasks.length ? 'поддержка заметна, нужен резерв' : 'проектная работа держится'),
    balanceNote: selectedTraining.helpCount > 0
      ? `Это не самостоятельность 1-й линии. Шкала сравнивает два разных потока недели: ${selectedTraining.helpCount} обращений с помощью выше 1-й линии и ${seniorClosedTasks.length} закрытых задач старших.`
      : 'Маршруты помощи выше 1-й линии за неделю не зафиксированы или еще не загружены.',
    cards: [
      {
        label: 'Закрыто задач старшими',
        value: `${seniorClosedTasks.length} шт.`,
        hint: taskThroughputDelta === null ? 'первая неделя сравнения' : `${taskThroughputDelta === 0 ? 'без изменений' : `${taskThroughputDelta > 0 ? '+' : ''}${taskThroughputDelta}`} к прошлой неделе`,
        tone: 'good'
      },
      {
        label: 'Открыто у старших',
        value: `${seniorBacklog} шт.`,
        hint: totalTaskBacklog > 0 ? `не общий бэклог; общий бэклог недели: ${totalTaskBacklog}` : 'только незакрытые задачи старших из выгрузки',
        tone: seniorBacklog > 30 ? 'risk' : 'warn'
      },
      {
        label: 'Тяжелые закрытия',
        value: `${seniorHeavyClosedTasks.length} шт.`,
        hint: `${formatPercent(seniorHeavyShare)} от закрытых задач`,
        tone: seniorHeavyClosedTasks.length > 0 ? 'violet' : 'neutral'
      },
      {
        label: 'Цикл выполнения',
        value: seniorAvgCycleDays === null ? 'нет данных' : `${seniorAvgCycleDays} дн.`,
        hint: 'от взятия в работу до закрытия',
        tone: seniorAvgCycleDays !== null && seniorAvgCycleDays > 14 ? 'risk' : 'good'
      }
    ],
    heavyTasks: seniorHeavyClosedTasks.map(task => ({
      ...task,
      details: `${task.domain || 'Прочее'}${Number.isFinite(Number(task.cycleDays)) ? ` · цикл ${task.cycleDays} дн.` : ''}${task.assignee ? ` · ${task.assignee}` : ''}`
    })),
    note: 'Задачи показываются как управленческий контекст: закрытия, хвост, сложность и влияние помощи 1-й линии на проектную работу старших.'
  };
  const ordinaryKeys = visibleCollectionKeys.filter(key => isBaselineEligibleType(normalizeTrainingWeek(weeksHistory?.[key] || {}, key).weekType));
  const ordinaryHelpCounts = ordinaryKeys.map(key => normalizeTrainingWeek(weeksHistory?.[key] || {}, key).helpCount);
  const abnormalHelpCounts = visibleCollectionKeys
    .filter(key => ['high_load', 'incident', 'partial'].includes(normalizeTrainingWeek(weeksHistory?.[key] || {}, key).weekType))
    .map(key => normalizeTrainingWeek(weeksHistory?.[key] || {}, key).helpCount);
  const avg = (values) => values.length ? roundMetric(values.reduce((sum, value) => sum + value, 0) / values.length, 1) : null;
  const planningSummary = selectedTraining.weekType === 'incident' || selectedTraining.inflow > 300
    ? `Неделя аномальная. Для планирования базовой емкости ее не используем, но используем для расчета аварийного резерва и анализа причины всплеска. При текущем входящем потоке ${selectedTraining.inflow} инцидентов оценочная нагрузка 1-й линии составляет ${formatHours(firstLineIncidentHours)}, резерв помощи старших за неделю — ${formatHours(totalSeniorSupportHours)}.`
    : `При текущем входящем потоке ${selectedTraining.inflow} инцидентов в неделю минимальная емкость стажеров составляет ${traineeMinHours} часов, максимальная — ${traineeMaxHours} часов. Оценочная нагрузка 1-й линии по тикетам составляет ${formatHours(firstLineIncidentHours)}. По маршрутам решения резерв помощи старших за неделю составляет ${formatHours(totalSeniorSupportHours)}, за месяц около ${formatHours(totalSeniorSupportHours * 4.3)}. Эти часы нужно учитывать при планировании задач развития, иначе проектные задачи будут проседать.`;
  const workdaysPerMonth = 20;
  const monthMultiplier = 4.3;
  const traineeMonthMinHours = planningCapacityConfig.traineeCount * planningCapacityConfig.traineeHoursPerDayMin * workdaysPerMonth;
  const traineeMonthMaxHours = planningCapacityConfig.traineeCount * planningCapacityConfig.traineeHoursPerDayMax * workdaysPerMonth;
  const firstLineAdminMonthHours = planningCapacityConfig.firstLineAdminCount * 140;
  const seniorAdminCount = 5;
  const seniorMonthHours = seniorAdminCount * 140;
  const regularWeekHours = firstLineIncidentHours + phoneLoadHours;
  const regularMonthHours = regularWeekHours * monthMultiplier;
  const seniorMonthReserveHours = totalSeniorSupportHours * monthMultiplier;
  const developmentTheme = recurringThemes[0] || fintechTopics[0] || null;
  const traineeLoadStatus = regularWeekHours > traineeMinHours
    ? 'минимальный график стажеров почти без запаса'
    : 'минимального графика стажеров достаточно с запасом';
  const monthPlanSummary = `Регулярку держим как поток, инциденты и аварии планируем через резерв, проекты — от остаточной емкости старших администраторов, развитие — через одну повторяющуюся тему.`;
  const monthPlanConclusion = `Текущая оценка регулярной нагрузки: ${formatHours(regularWeekHours)} в неделю, около ${formatHours(regularMonthHours)} в месяц. Резерв помощи выше 1-й линии: ${formatHours(totalSeniorSupportHours)} в неделю, около ${formatHours(seniorMonthReserveHours)} в месяц. ${traineeLoadStatus}.`;

  const classifyTemperature = () => {
    if (selectedTraining.weekType === 'partial') {
      return { label: 'Нет оценки', summary: 'Температура не рассчитывается: неделя неполная.', unavailable: true };
    }
    if (selectedTraining.weekType === 'incident' || selectedTraining.inflow > 300 || selectedTraining.successRate < 80 || selectedTraining.resolutionSuccessRate < 80) {
      return { label: 'Перегрев', summary: 'Есть критичный SLA ниже 80% или входящий поток выше 300.' };
    }
    if (selectedTraining.successRate < 90 || selectedTraining.resolutionSuccessRate < 90) {
      return { label: 'Горячо', summary: 'Один из SLA в диапазоне 80-89,9%, нужен разбор причин.' };
    }
    if (selectedTraining.successRate < 95 || selectedTraining.resolutionSuccessRate < 95 || selectedTraining.inflow > 250) {
      return { label: 'Зона внимания', summary: 'Есть SLA ниже цели или повышенный входящий поток.' };
    }
    if (selectedTraining.inflow < 200) return { label: 'Спокойно', summary: 'SLA на целевом уровне, входящий поток спокойный.' };
    return { label: 'Нормально', summary: 'SLA на целевом уровне, входящий поток в обычном диапазоне.' };
  };

  const getSignalTone = (value) => {
    const status = getSlaStatus(value);
    return status.reportTone === 'risk' ? 'risk' : status.reportTone;
  };

  const executiveSignal = (() => {
    if (!loadBaselineMetrics || !Number.isFinite(Number(loadMetrics.sla))) {
      return {
        tone: 'warn',
        valueText: 'база формируется',
        label: 'SLA взятия в работу за период',
        note: `Нужно минимум 3 полные обычные недели. Сейчас: ${loadBaselineKeys.length}.`
      };
    }
    const diff = roundMetric(loadMetrics.sla - loadBaselineMetrics.successRate, 1);
    const direction = diff === 0 ? 'без изменений' : (diff > 0 ? 'лучше' : 'хуже');
    return {
      tone: getSignalTone(loadMetrics.sla),
      valueText: `${formatPercent(loadMetrics.sla)}`,
      label: `к базе ${formatPercent(loadBaselineMetrics.successRate)}`,
      note: `${direction}${diff === 0 ? '' : ` на ${Math.abs(diff)} ${pointWord(diff)}`} за весь период.`
    };
  })();

  const periodAnalytics = {
    temperature: classifyTemperature(),
    trafficLight: {
      current: selectedTraining.inflow,
      average: averageInflow,
      median: medianInflow,
      label: trafficLabel,
      deviationText: inflowDeviation === null ? 'база формируется' : `${inflowDeviation > 0 ? '+' : ''}${inflowDeviation} шт. к медиане`,
      note: selectedTraining.inflow > 300 ? 'Неделя не используется как эталонная база, так как входящий поток выше аварийного порога.' : ''
    },
    currentComparisons: { loadBaselineText, routeBaselineText },
    executiveSignal,
    periodTrend: periodTrendRows,
    routeTrend: routeTrendRows,
    abnormalWeeks: abnormalWeekRows.slice(-6),
    recurringThemes,
    monthPlan: {
      summary: monthPlanSummary,
      mainConclusion: monthPlanConclusion,
      resources: [
        {
          resource: `${planningCapacityConfig.traineeCount} стажера`,
          calculation: `${planningCapacityConfig.traineeCount} × ${planningCapacityConfig.traineeHoursPerDayMin}-${planningCapacityConfig.traineeHoursPerDayMax} ч × ${workdaysPerMonth} рабочих дней`,
          monthFund: `${traineeMonthMinHours}-${traineeMonthMaxHours} ч/мес`,
          role: 'основной поток звонков и инцидентов'
        },
        {
          resource: `${planningCapacityConfig.firstLineAdminCount} администратора 1-й линии`,
          calculation: `${planningCapacityConfig.firstLineAdminCount} × 140 ч`,
          monthFund: `${firstLineAdminMonthHours} ч/мес`,
          role: 'буфер для стажеров, типовые задачи и права'
        },
        {
          resource: `${seniorAdminCount} старших администраторов`,
          calculation: `${seniorAdminCount} × 140 ч`,
          monthFund: `${seniorMonthHours} ч/мес`,
          role: 'сложные случаи, дежурства, срочная линия, развитие и проекты'
        }
      ],
      workstreams: [
        {
          name: 'Регулярные работы',
          howToPlan: `Планируем как поток. Ориентир: 200-250 входящих в неделю — норма, 250-300 — повышенная нагрузка, выше 300 — аномалия.`,
          metrics: 'входящий поток, взятие в работу, решение в срок, нагрузка тикеты + телефония, самостоятельность',
          risk: 'при минимальном графике стажеров нужен буфер администраторов 1-й линии'
        },
        {
          name: 'Инциденты / аварии',
          howToPlan: `Планируем через резерв ролей. Текущий резерв помощи выше 1-й линии: ${formatHours(totalSeniorSupportHours)} в неделю.`,
          metrics: 'помощь выше 1-й линии, SLA по маршрутам, топ тем с не-самостоятельным маршрутом',
          risk: 'если резерв не заложить, старшие администраторы уходят из задач развития'
        },
        {
          name: 'Проекты',
          howToPlan: 'Планируем от остаточной емкости после регулярки, дежурств, срочной линии и помощи 1-й линии.',
          metrics: 'доступная емкость старших, фактическая помощь 1-й линии, доля аварийных недель',
          risk: 'без учета поддержки проектные и спринтовые задачи будут проседать'
        },
        {
          name: 'Развитие',
          howToPlan: developmentTheme
            ? `Берем одну повторяющуюся тему: ${developmentTheme.theme}.`
            : 'Берем одну повторяющуюся тему после накопления данных по bottleneckThemes.',
          metrics: 'количество тикетов по теме, помощь выше 1-й линии по теме, решение в срок, повторы',
          risk: 'если не выбрать одну тему, улучшения расползутся и эффект будет трудно проверить'
        }
      ]
    },
    planningGaps: [
      'Качество заполнения маршрута решения.',
      'Связка звонок → тикет.',
      'Повторные обращения.',
      'Кто был дежурным на конкретной неделе.',
      'Разделение задач OSO_Support на регулярку, развитие и проекты.'
    ],
    firstLineLoad: {
      traineeCapacityText: `${traineeMinHours}-${traineeMaxHours} часов в неделю`,
      incidentHoursText: formatHours(firstLineIncidentHours),
      qualityNote: selectedTraining.routeDataQualityPercent < 80 ? 'нужна очистка данных маршрута' : 'расчет предварительный',
      note: 'Формула: входящий поток × 5 минут первичного разбора + самостоятельные решения × 15 минут дополнительной работы.'
    },
    telephony: {
      status: phoneCallsCount > 0 ? 'подключена' : 'данные пока не подключены',
      callsCount: phoneCallsCount || null,
      answeredCount: phoneSummary.answered || null,
      missedCount: phoneSummary.missed,
      totalCalls: phoneSummary.total || null,
      missedTarget: phoneMissedTarget,
      availabilityPercent: phoneSummary.total > 0 ? Math.round(((phoneSummary.total - phoneSummary.missed) / phoneSummary.total) * 100) : null,
      avgPerDayText: phoneCallsCount > 0 ? `${roundMetric(phoneCallsCount / planningCapacityConfig.workdaysPerWeek, 1)} звонков` : 'данные пока не подключены',
      deltaText: phoneDeltaText,
      missedDeltaText: phoneMissedDeltaText,
      rowsCount: phoneSummary.rowsCount || 0,
      sourceLabel: phoneSourceLabel,
      note: `Цель телефонной линии: не больше ${phoneMissedTarget} пропущенных за неделю. Связка звонок → тикет пока не подключена, поэтому звонки показываются как отдельный контекст нагрузки.`
    },
    seniorTaskFlow,
    seniorReserve: {
      rows: seniorReserveRows,
      totalWeekHoursText: formatHours(totalSeniorSupportHours),
      totalMonthHoursText: formatHours(totalSeniorSupportHours * 4.3),
      note: 'Это плановая оценка, а не точный учет времени. Для точного расчета нужна двухнедельная проверка фактического времени помощи.'
    },
    planning: {
      summary: `${planningSummary} Среднее количество тикетов с помощью старших в обычные недели: ${avg(ordinaryHelpCounts) ?? 'данные пока не подключены'}. В аномальные недели: ${avg(abnormalHelpCounts) ?? 'данные пока не подключены'}. Телефония: ${phoneCallsCount > 0 ? 'подключена' : 'не подключена'}.`
    },
    performerDiagnostics: (Array.isArray(weekData?.topPerformers) ? weekData.topPerformers : []).map((item, index) => {
      const rawLogin = safeString(item.login || item.user || item.assigneeLogin || item.id).trim();
      const rawName = safeString(item.name || item.assignee || item.responsible).trim();
      const averageMinutes = Number(item.avgTimeMin || item.avgResolutionMin || item.avgTime);
      const medianMinutes = Number(item.medianTimeMin || item.medianResolutionMin || item.medianTime || item.median);
      const cleanMedian = Number.isFinite(medianMinutes) && medianMinutes > 0 ? medianMinutes : null;
      const cleanAverage = Number.isFinite(averageMinutes) && averageMinutes > 0 ? averageMinutes : null;
      const displayMinutes = cleanMedian ?? cleanAverage;
      const isOutlier = cleanAverage !== null && cleanAverage > 10080;
      const resolvedLoginName = rawLogin ? getFullName(rawLogin) : '';
      const resolvedRawName = rawName ? getFullName(rawName) : '';
      const loginWasResolved = rawLogin && safeString(resolvedLoginName).toLowerCase() !== rawLogin.toLowerCase();
      const displayName = safeString(loginWasResolved ? resolvedLoginName : resolvedRawName).trim() || `Исполнитель ${index + 1}`;
      return {
        displayName,
        name: displayName,
        closed: Number(item.closed || item.count || item.incidents || item.total) || 0,
        medianTimeText: isOutlier ? 'выброс / проверить данные' : (displayMinutes !== null ? `${roundMetric(displayMinutes, 1)} мин` : 'нет данных'),
        avgTimeText: cleanAverage !== null ? `${roundMetric(cleanAverage, 1)} мин` : 'нет данных',
        avgTimeHint: cleanAverage !== null ? `Среднее: ${roundMetric(cleanAverage, 1)} мин` : '',
        csatText: Number.isFinite(Number(item.csat || item.avgCsat)) ? `${roundMetric(Number(item.csat || item.avgCsat), 1)}` : 'нет данных',
        profile: safeString(item.profile || item.loadProfile || item.role) || 'профиль нагрузки требует разбора'
      };
    })
  };

  const getPostmortemKeywords = (value) => {
    const stopWords = new Set(['проблем', 'обращ', 'заявк', 'пользоват', 'требует', 'решение', 'настройк', 'недел', 'прочие', 'другое', 'инцидент']);
    return safeString(value)
      .toLowerCase()
      .replace(/ё/g, 'е')
      .split(/[^a-zа-я0-9]+/i)
      .map(word => word.trim())
      .filter(word => word.length >= 4 && !stopWords.has(word))
      .slice(0, 8);
  };

  const getPostmortemCaseText = (item = {}) => safeString([
    item.title,
    item.summary,
    item.name,
    item.reason,
    item.domain,
    item.category,
    item.comments,
    item.comment,
    item.description,
    item.diagnosis,
    item.resolution,
    item.solution,
    item.resolutionText,
    item.reusableStep,
    item.slaType
  ].filter(Boolean).join(' ')).toLowerCase().replace(/ё/g, 'е');

  const classifyPostmortemSubtype = (item = {}, fallbackTopic = '') => {
    const text = `${getPostmortemCaseText(item)} ${safeString(fallbackTopic).toLowerCase()}`;
    if (text.includes('печ') || text.includes('принт') || text.includes('мфу') || text.includes('скан')) return { name: 'Печать / МФУ / сканирование', meaning: 'Повторяются обращения по печати, доступности устройств или сканированию.', action: 'Собрать чек-лист первичной диагностики и типовые шаги восстановления.' };
    if (text.includes('доступ') || text.includes('прав') || text.includes('учет') || text.includes('парол')) return { name: 'Доступы / права / учетные записи', meaning: 'Тема упирается в доступы, права или учетные записи.', action: 'Проверить права 1-й линии и маршрут согласования в IDM.' };
    if (text.includes('lotus') || text.includes('bpm') || text.includes('citrix') || text.includes('вход') || text.includes('запуск')) return { name: 'Вход / запуск бизнес-приложений', meaning: 'Проблема связана с запуском, входом или первичной диагностикой приложения.', action: 'Обновить карточку диагностики и критерии передачи выше.' };
    if (text.includes('диск') || text.includes('файл') || text.includes('папк') || text.includes('сетев')) return { name: 'Файлы / сетевые ресурсы', meaning: 'Повторяются обращения по файлам, папкам или сетевым ресурсам.', action: 'Зафиксировать типовые проверки доступа и доступности ресурса.' };
    if (text.includes('звон') || text.includes('голос') || text.includes('телефон')) return { name: 'Телефония / голосовые обращения', meaning: 'Нагрузка приходит через голосовой канал или связана с маршрутизацией звонков.', action: 'Уточнить связь звонок -> тикет и шаблон регистрации.' };
    if (text.includes('ошиб') || text.includes('сбой') || text.includes('недоступ') || text.includes('не работает')) return { name: 'Сбой / недоступность сервиса', meaning: 'Пользователь видит отказ или нестабильность сервиса.', action: 'Разделить массовый сбой и индивидуальный кейс, добавить признаки эскалации.' };
    return { name: 'Типовые обращения без уточненной подкатегории', meaning: 'Данных достаточно для фокуса, но подтип нужно уточнить по примерам тикетов.', action: 'На постмортеме разметить 3-5 кейсов и обновить правило классификации.' };
  };

  const createFallbackPostmortemSubProblems = (topic = {}) => {
    const title = safeString(topic.theme || topic.problemType).toLowerCase().replace(/ё/g, 'е');
    const total = Math.max(1, Number(topic.count) || 0);
    const allocate = (items) => {
      let used = 0;
      return items.map((item, index) => {
        const count = index === items.length - 1
          ? Math.max(1, total - used)
          : Math.max(1, Math.round(total * item.weight));
        used += count;
        return {
          ...item,
          count,
          share: total > 0 ? roundMetric(count * 100 / total, 1) : 0
        };
      });
    };
    if (title.includes('доступ') || title.includes('парол') || title.includes('учет') || title.includes('прав')) {
      return allocate([
        { name: 'Пароли и вход', weight: 0.35, meaning: 'Пользователь не может войти, пароль не подходит или требуется восстановление доступа.', action: 'Сделать короткий чек-лист: где проверяем учетку, пароль, блокировку и что просим у пользователя.' },
        { name: 'Права и роли', weight: 0.25, meaning: 'Обращения требуют проверки прав или роли в системе.', action: 'Проверить, какие права может выдавать 1-я линия, а что уходит через IDM/согласование.' },
        { name: 'Блокировки / учетные записи', weight: 0.22, meaning: 'Возможны блокировки, отключенные учетные записи или некорректные атрибуты.', action: 'Закрепить порядок первичной проверки учетной записи и признаки передачи выше.' },
        { name: 'Маршрут и полнота данных', weight: 0.18, meaning: 'Часть кейсов может уходить выше из-за неполных данных в заявке.', action: 'Добавить шаблон вопроса пользователю и минимальный набор данных перед эскалацией.' }
      ]);
    }
    if (title.includes('печ') || title.includes('принт') || title.includes('мфу') || title.includes('скан')) {
      return allocate([
        { name: 'Не печатает / не выводит документы', weight: 0.32, meaning: 'Документ отправлен, но печать не выходит или зависает.', action: 'Собрать быстрый сценарий проверки очереди, принтера по умолчанию и доступности устройства.' },
        { name: 'Принтер пропал / недоступен', weight: 0.28, meaning: 'Пользователь не видит устройство или подключение слетело.', action: 'Описать повторное подключение и признаки сетевой проблемы.' },
        { name: 'Сканирование / МФУ', weight: 0.22, meaning: 'Отдельный пласт обращений связан со сканированием или МФУ.', action: 'Сделать отдельную карточку БЗ по сетевому сканированию.' },
        { name: 'Кассовая / специальная печать', weight: 0.18, meaning: 'Специальные сценарии требуют отличать типовую печать от бизнес-критичной.', action: 'Уточнить маршрут эскалации и минимальный набор диагностики.' }
      ]);
    }
    return allocate([
      { name: 'Типовой сценарий', weight: 0.4, meaning: 'Повторяется одна пользовательская боль, которую можно стандартизировать.', action: 'Разобрать 3-5 кейсов и оформить короткую инструкцию.' },
      { name: 'Маршрут помощи', weight: 0.25, meaning: 'Часть обращений требует участия выше 1-й линии.', action: 'Зафиксировать критерии самостоятельного решения и передачи выше.' },
      { name: 'SLA-причина', weight: 0.2, meaning: 'SLA мог просесть из-за ожидания данных, прав или участия старших.', action: 'Проверить кейсы с просрочкой и определить общий блокер.' },
      { name: 'Качество данных', weight: 0.15, meaning: 'Для точного вывода нужны примеры тикетов и причины SLA.', action: 'В следующей выгрузке передать примеры кейсов по топ-теме.' }
    ]);
  };

  const buildTopProblemPostmortemData = () => {
    const topic = fintechTopics[0] || {
      theme: selectedTraining.bottleneckThemes?.[0]?.theme || 'Топ-проблема недели не определена',
      focusTitle: selectedTraining.bottleneckThemes?.[0]?.focusTitle || selectedTraining.bottleneckThemes?.[0]?.specificTheme || selectedTraining.bottleneckThemes?.[0]?.theme || 'Топ-проблема недели не определена',
      count: selectedTraining.bottleneckThemes?.[0]?.count || 0,
      mainRoute: 'нужно накопить bottleneckThemes',
      actionNeeded: 'Добавить анализ топ-тем с не-самостоятельным маршрутом в JSON.',
      check: 'После следующей выгрузки проверить топ-1 тему и маршруты помощи.'
    };
    const affectedSystems = Array.isArray(topic.affectedSystems)
      ? topic.affectedSystems
      : safeString(topic.affectedSystems).split(/[,;|]/).map(item => item.trim()).filter(Boolean);
    const keywords = getPostmortemKeywords(`${topic.focusTitle || ''} ${topic.theme || ''} ${affectedSystems.join(' ')}`);
    const rawCaseCandidates = [
      ...(Array.isArray(weekData?.topIncidents) ? weekData.topIncidents : []),
      ...(Array.isArray(weekData?.slaBreachDetails) ? weekData.slaBreachDetails : []),
      ...(Array.isArray(weekData?.trainingSection?.bottleneckThemes) ? weekData.trainingSection.bottleneckThemes.flatMap(item => Array.isArray(item?.examples) ? item.examples : []) : []),
      ...(Array.isArray(selectedTraining?.resolutionCommentAudit?.examples) ? selectedTraining.resolutionCommentAudit.examples : [])
    ];
    const rawCaseMap = new Map();
    rawCaseCandidates.forEach((item, index) => {
      const id = safeString(item?.id || item?.key || item?.issueKey).trim();
      const key = id || `anonymous-${index}`;
      const current = rawCaseMap.get(key) || {};
      rawCaseMap.set(key, {
        ...current,
        ...item,
        id: id || current.id,
        title: safeString(item?.title || item?.summary || current.title || current.summary),
        diagnosis: safeString(item?.diagnosis || current.diagnosis),
        resolution: safeString(item?.resolution || item?.solution || item?.resolutionText || item?.comment || current.resolution || current.comment),
        resolutionSource: safeString(item?.resolutionSource || current.resolutionSource),
        reusableStep: safeString(item?.reusableStep || current.reusableStep),
        route: safeString(item?.route || current.route),
        assignee: safeString(item?.assignee || current.assignee)
      });
    });
    const rawCases = [...rawCaseMap.values()];
    const scoredCases = rawCases
      .map(item => {
        const text = getPostmortemCaseText(item);
        const score = keywords.reduce((sum, word) => sum + (text.includes(word) ? 1 : 0), 0);
        return { item, score };
      })
      .filter(entry => entry.score > 0 || rawCases.length <= 8)
      .sort((a, b) => b.score - a.score)
      .map(entry => entry.item);
    const relatedCases = scoredCases
      .filter(item => safeString(item?.id || item?.key || item?.issueKey).trim())
      .slice(0, 16);
    const subtypeMap = new Map();
    relatedCases.forEach(item => {
      const meta = classifyPostmortemSubtype(item, topic.focusTitle || topic.theme);
      const current = subtypeMap.get(meta.name) || { ...meta, count: 0 };
      current.count += Number(item.count || item.total || item.incidents || 1) || 1;
      subtypeMap.set(meta.name, current);
    });
    if (subtypeMap.size === 0 && topic.count > 0) {
      const meta = classifyPostmortemSubtype(topic, topic.focusTitle || topic.theme);
      subtypeMap.set(meta.name, { ...meta, count: Number(topic.count) || 0 });
    }
    const builtSubProblems = [...subtypeMap.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(item => ({
        ...item,
        share: Number(topic.count) > 0 ? roundMetric(item.count * 100 / Number(topic.count), 1) : 0
      }));
    const subProblems = builtSubProblems.length <= 1 && Number(topic.count) > 0
      ? createFallbackPostmortemSubProblems(topic)
      : builtSubProblems;
    return { topic, relatedCases, subProblems };
  };

  const downloadGeneratedHtml = (content, filename) => {
    const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    window.setTimeout(() => {
      link.remove();
      URL.revokeObjectURL(url);
    }, 2000);
  };

  const handleDownloadFintechLabReport = () => {
    const html = generateFintechLabReport({
      week: {
        weekNumber: weekData?.weekNumber,
        dates: weekData?.dates
      },
      metrics: fintechMetrics,
      routeDistribution: routeChartData,
      slaByRoute: routeSlaRows.filter(row => row.count > 0 || row.primarySla !== null || row.resolutionSla !== null),
      topNonSelfTopics: fintechTopics,
      deltas: comparisonRows,
      dataQuality: {
        routeDataQualityPercent: selectedTraining.routeDataQualityPercent,
        unknownCount: selectedTraining.unknownCount,
        closedCount: selectedTraining.closed
      },
      statusWeek: reportStatusWeek,
      healthyImprovement: reportHealthyImprovement,
      mainAction: reportMainAction,
      seniorWorkRows,
      loadContext,
      periodAnalytics,
      summary: selectedTraining.sectionSummary,
      commentAudit: selectedTraining.resolutionCommentAudit,
      generatedAt: new Date()
    });
    const weekNumber = weekData?.weekNumber || selectedWeekKey?.split('-')?.[1];
    const dateStamp = new Date().toISOString().slice(0, 10);
    downloadGeneratedHtml(
      html,
      weekNumber ? `fintechlab_report_week_${weekNumber}.html` : `fintechlab_report_${dateStamp}.html`
    );
  };

  const handleOpenTopProblemPostmortem = () => {
    setTopReportError('');
    try {
      const postmortem = buildTopProblemPostmortemData();
      const html = generateTopProblemPostmortemReport({
        week: {
          weekNumber: weekData?.weekNumber,
          dates: weekData?.dates
        },
        topic: postmortem.topic,
        training: selectedTraining,
        routes: Array.isArray(routeChartData) ? routeChartData : [],
        slaByRoute: Array.isArray(routeSlaRows)
          ? routeSlaRows.filter(row => row && (row.count > 0 || row.primarySla !== null || row.resolutionSla !== null))
          : [],
        relatedCases: Array.isArray(postmortem.relatedCases) ? postmortem.relatedCases : [],
        subProblems: Array.isArray(postmortem.subProblems) ? postmortem.subProblems : [],
        medianResolutionMinutes: null,
        phoneAvgMinutes: planningCapacityConfig?.phoneCallAvgMinutes,
        telephony: periodAnalytics?.telephony && typeof periodAnalytics.telephony === 'object' ? periodAnalytics.telephony : {},
        generatedAt: new Date()
      });
      setTopReportPreview(html);
    } catch (error) {
      console.error('TOP-1 preview generation failed', error);
      try {
        const sourceTopic = fintechTopics[0] || {};
        const fallbackHtml = generateTopProblemPostmortemReport({
          week: { weekNumber: weekData?.weekNumber, dates: weekData?.dates },
          topic: {
            focusTitle: safeString(sourceTopic.focusTitle || sourceTopic.specificTheme || sourceTopic.theme) || 'Топ-проблема недели',
            theme: safeString(sourceTopic.theme),
            category: safeString(sourceTopic.category),
            count: Number(sourceTopic.count) || 0,
            problemType: safeString(sourceTopic.problemType || sourceTopic.rootCauseHypothesis),
            actionNeeded: safeString(sourceTopic.actionNeeded),
            check: safeString(sourceTopic.check)
          },
          training: {
            closed: Number(selectedTraining?.closed) || 0,
            helpPercent: Number(selectedTraining?.helpPercent) || 0,
            successRate: Number(selectedTraining?.successRate) || 0,
            resolutionSuccessRate: Number(selectedTraining?.resolutionSuccessRate) || 0,
            primaryViolations: Number(selectedTraining?.primaryViolations) || 0,
            resolutionViolations: Number(selectedTraining?.resolutionViolations) || 0
          },
          phoneAvgMinutes: planningCapacityConfig?.phoneCallAvgMinutes,
          telephony: periodAnalytics?.telephony && typeof periodAnalytics.telephony === 'object'
            ? periodAnalytics.telephony
            : {},
          generatedAt: new Date()
        });
        setTopReportError('В реальных данных недели найден нестандартный формат. Витрина открыта в безопасном режиме без части детализации.');
        setTopReportPreview(fallbackHtml);
      } catch (fallbackError) {
        console.error('TOP-1 fallback preview generation failed', fallbackError);
        setTopReportError('Не удалось собрать TOP-1 из данных выбранной недели. Обновите страницу; если ошибка повторится, потребуется проверить формат bottleneckThemes этой недели.');
      }
    }
  };

  const handleDownloadTopProblemPostmortem = () => {
    if (!topReportPreview) return;
    const weekNumber = weekData?.weekNumber || selectedWeekKey?.split('-')?.[1];
    const dateStamp = new Date().toISOString().slice(0, 10);
    downloadGeneratedHtml(
      topReportPreview,
      weekNumber ? `top_problem_postmortem_week_${weekNumber}.html` : `top_problem_postmortem_${dateStamp}.html`
    );
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl pb-10">
      {topReportPreview && createPortal((
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-sm p-3 md:p-5 flex flex-col">
          <div className="shrink-0 flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-t-2xl border border-slate-700 bg-slate-900 px-4 py-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-400">Incident review / HTML preview</div>
              <div className="text-lg font-black text-white">Постмортем ТОП-1</div>
              {topReportError && <div className="mt-1 text-[11px] font-bold text-amber-200">{topReportError}</div>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadTopProblemPostmortem}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-black text-slate-950 hover:bg-amber-400"
              >
                <DownloadCloud size={16} />
                Скачать HTML
              </button>
              <button
                type="button"
                onClick={() => document.getElementById('top-report-preview-frame')?.contentWindow?.print()}
                className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm font-bold text-slate-100 hover:bg-slate-700"
              >
                Печать / PDF
              </button>
              <button
                type="button"
                onClick={() => setTopReportPreview('')}
                className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm font-bold text-slate-300 hover:text-white"
              >
                Закрыть
              </button>
            </div>
          </div>
          <iframe
            id="top-report-preview-frame"
            title="Предпросмотр постмортема ТОП-1"
            srcDoc={topReportPreview}
            className="min-h-0 flex-1 w-full rounded-b-2xl border-x border-b border-slate-700 bg-white"
          />
        </div>
      ), document.body)}
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5 mb-8 rounded-2xl border border-slate-700/60 bg-slate-950/35 p-5 shadow-xl shadow-slate-950/10">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-400 mb-2">Ops intelligence / incident review</div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">{embedded ? 'Постмортемы и разбор команды' : 'Обучение'}</h1>
          <p className="text-slate-400 text-sm">{embedded ? 'Финтехлаб, ТОП-1 проблема недели и диагностические метрики для командного разбора.' : 'Метрики самостоятельности 1-й линии, теневой эскалации и тем для инструкций.'}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <button
            onClick={handleDownloadFintechLabReport}
            className="inline-flex items-center justify-center gap-2 border border-emerald-400/40 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-950/20 transition-colors"
          >
            <DownloadCloud size={18} />
            Скачать Финтехлаб
          </button>
          <button
            onClick={handleOpenTopProblemPostmortem}
            className="inline-flex items-center justify-center gap-2 border border-amber-400/40 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black px-4 py-2.5 rounded-xl shadow-lg shadow-amber-950/20 transition-colors"
            title="Открыть встроенный предпросмотр постмортема ТОП-1"
          >
            <FileSearch size={18} />
            Открыть витрину ТОП-1
          </button>
          <WeekSelector historyKeys={historyKeys} weeksHistory={weeksHistory} selectedKey={selectedWeekKey} onSelect={onWeekSelect} activeData={weekData} />
        </div>
      </div>

      {topReportError && !topReportPreview && (
        <div className="mb-6 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-100">
          {topReportError}
        </div>
      )}

      {phoneCallsCount <= 0 && (
        <div className="mb-6 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-4 text-amber-50">
          <div className="text-sm font-black">Телефония не найдена в выбранной неделе</div>
          <div className="mt-1 text-xs leading-relaxed text-amber-100/80">
            Проверен источник <span className="font-mono text-amber-200">{phoneSourceLabel}</span>: строк со звонками нет.
            {telephonyHistoryRows.length === 0
              ? ' В истории сайта сейчас не найдено ни одной недели с сохранённой телефонией.'
              : ' Ниже показаны недели, в которых звонки действительно сохранены.'}
          </div>
          {telephonyHistoryRows.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {telephonyHistoryRows.slice(0, 8).map(item => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onWeekSelect(item.key)}
                  className="rounded-lg border border-amber-300/30 bg-slate-950/50 px-3 py-2 text-xs font-bold text-amber-100 hover:border-amber-300/70"
                >
                  Неделя {weeksHistory?.[item.key]?.weekNumber || item.key}: {item.summary.total || item.summary.answered} звонков, {item.summary.missed} пропущено
                </button>
              ))}
            </div>
          )}
          <div className="mt-3 text-xs font-bold text-amber-200">
            Для недели {weekData?.weekNumber || selectedWeekKey}: «Заполнить неделю» → «Импорт Телефонии» → загрузить таблицу → «Сохранить данные».
          </div>
        </div>
      )}

      <div className={`rounded-xl border p-5 mb-6 ${selectedTraining.hasTraining ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800/80 border-slate-700/60'}`}>
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
          <div>
            <div className="text-xs uppercase font-black tracking-wider text-emerald-300 mb-2 flex items-center gap-2"><BookOpen size={16} /> Вывод для UI</div>
            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{selectedTraining.sectionSummary}</p>
          </div>
          {!selectedTraining.hasTraining && (
            <span className="text-xs font-bold text-slate-400 bg-slate-950/70 border border-slate-700 rounded-lg px-3 py-2 shrink-0">Старые данные</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {kpiCards.map(card => (
          <div key={card.label} className="bg-slate-800 rounded-xl p-4 border border-slate-700/50 shadow-sm">
            <div className="text-[10px] uppercase font-black tracking-wider text-slate-500 mb-2">{card.label}</div>
            <div className={`text-3xl font-black ${card.tone}`}>{card.value}<span className="text-sm text-slate-500 ml-1">{card.suffix}</span></div>
            <div className="text-[11px] text-slate-500 mt-2 leading-snug">{card.hint}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700/50 shadow-sm">
          <h2 className="text-base font-medium text-white flex items-center gap-2 mb-4"><Database size={18} className="text-cyan-400" /> Качество данных</h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <div className="text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Валидные маршруты</div>
              <div className={`text-2xl font-black ${selectedTraining.routeDataQualityPercent >= 95 ? 'text-emerald-300' : 'text-amber-300'}`}>{selectedTraining.routeDataQualityPercent}<span className="text-xs text-slate-500 ml-1">%</span></div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Некорректно</div>
              <div className="text-2xl font-black text-slate-200">{selectedTraining.unknownCount}<span className="text-xs text-slate-500 ml-1">шт.</span></div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">В расчете</div>
              <div className="text-2xl font-black text-slate-200">{selectedTraining.closed}<span className="text-xs text-slate-500 ml-1">шт.</span></div>
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">Самостоятельность и помощь выше 1-й линии считаются только по тикетам с валидным маршрутом решения.</p>
        </div>

        <div className="xl:col-span-2 bg-slate-800 rounded-xl p-5 border border-slate-700/50 shadow-sm">
          <h2 className="text-base font-medium text-white flex items-center gap-2 mb-4"><RefreshCcw size={18} className="text-amber-400" /> Повторные обращения</h2>
          {selectedTraining.hasRepeatData ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-3">
                <div className="text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Доля</div>
                <div className="text-2xl font-black text-amber-300">{selectedTraining.repeatRate}<span className="text-xs text-slate-500 ml-1">%</span></div>
              </div>
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-3">
                <div className="text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Количество</div>
                <div className="text-2xl font-black text-slate-100">{selectedTraining.repeatCount}<span className="text-xs text-slate-500 ml-1">шт.</span></div>
              </div>
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-3">
                <div className="text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Динамика</div>
                <div className="text-sm font-bold text-slate-100 leading-snug">{previousTraining ? formatPointDelta(selectedTraining.repeatRate, previousTraining.repeatRate, false) : '—'}</div>
                <div className="text-[11px] text-slate-500 mt-1">{previousTraining ? 'сравнение с прошлой неделей' : 'база формируется'}</div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 text-sm text-slate-400 leading-relaxed">
              Данные по повторным обращениям пока не подключены. Метрика нужна как защита от формального быстрого закрытия ради SLA.
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="xl:col-span-2 bg-slate-800 rounded-xl p-6 border border-slate-700/50 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-5">
            <div>
              <h2 className="text-lg font-medium text-white flex items-center gap-2"><TrendingUp size={20} className="text-emerald-400" /> Тренд с недели 23</h2>
              <p className="text-xs text-slate-500 mt-1">Самостоятельность, взятие в работу до 15 минут и доля помощи старших с начала сбора маршрутизации.</p>
            </div>
            <span className="text-xs text-slate-400 bg-slate-900/80 px-2 py-1.5 rounded border border-slate-700/50">С недели {TRAINING_BASE_WEEK}: {trendKeys.length} нед.</span>
          </div>
          <div className="h-72">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 8, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} />
                  <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis stroke="#64748b" tickLine={false} axisLine={false} fontSize={11} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '12px' }} formatter={(value) => [`${value}%`, '']} />
                  <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="self" name="Самостоятельность" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="sla" name="Взятие в работу ≤15 мин" stroke="#38bdf8" strokeWidth={3} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="slaResolution" name="Решение в срок" stroke="#818cf8" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="help" name="Помощь выше 1-й линии" stroke="#f59e0b" strokeWidth={3} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="quality" name="Качество данных" stroke="#94a3b8" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-500">Нет недель для тренда</div>
            )}
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50 shadow-sm">
          <h2 className="text-lg font-medium text-white flex items-center gap-2 mb-4"><Activity size={20} className="text-amber-400" /> Изменение к базе / прошлой неделе</h2>
          {hasComparisonBase ? (
            <div className="space-y-2">
              {comparisonRows.map(row => (
                <div key={row.label} className="bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className="text-xs font-bold text-slate-300">{row.label}</span>
                    <span className={`text-xs font-black text-right ${row.isGood ? 'text-emerald-300' : 'text-amber-300'}`}>{formatPointDelta(row.current, row.previous, row.positiveGood)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Текущее: {formatPercent(row.current)}</span>
                    <span>Прошлая: {formatPercent(row.previous)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
              <div className="text-lg font-black text-slate-200 mb-1">База формируется</div>
              <p className="text-xs text-slate-500 leading-relaxed">Сравнение появится после 2-3 недель сбора маршрутизации.</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50 shadow-sm">
          <h2 className="text-lg font-medium text-white flex items-center gap-2 mb-4"><Target size={20} className="text-emerald-400" /> Разрыв до цели</h2>
          <div className="space-y-3">
            {targetRows.map(row => (
              <div key={row.label} className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-3">
                <div className="text-xs font-bold text-slate-300 mb-1">{row.label}</div>
                {row.target ? (
                  <div className="text-xs text-slate-500 leading-relaxed">
                    Текущее: <span className="text-slate-100 font-bold">{formatPercent(row.current)}</span>, цель: <span className="text-emerald-300 font-bold">{row.target}%</span>, <span className={(row.current - row.target) >= 0 ? 'text-emerald-300 font-bold' : 'text-amber-300 font-bold'}>{row.current >= row.target ? 'цель достигнута' : `не хватает ${roundMetric(row.target - row.current, 1)} пункта`}</span>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 leading-relaxed">Цель будет задана после формирования базовой линии.</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-2 bg-slate-800 rounded-xl p-6 border border-slate-700/50 shadow-sm">
          <h2 className="text-lg font-medium text-white flex items-center gap-2 mb-4"><ShieldAlert size={20} className="text-amber-400" /> Где теряется SLA</h2>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-700/60">
                  <th className="py-2 pr-3">Маршрут решения</th>
                  <th className="py-2 px-3 text-right">Тикеты</th>
                  <th className="py-2 px-3 text-right">Взятие в работу ≤15 мин</th>
                  <th className="py-2 px-3 text-right">Решение в срок</th>
                  <th className="py-2 pl-3">Вывод</th>
                </tr>
              </thead>
              <tbody>
                {routeSlaRows.map(row => (
                  <tr key={row.route} className="border-b border-slate-700/35 last:border-0">
                    <td className="py-3 pr-3 text-slate-300 font-medium min-w-[220px]">{row.route}</td>
                    <td className="py-3 px-3 text-right text-slate-100 font-black">{row.count}</td>
                    <td className="py-3 px-3 text-right text-slate-300">{row.primarySla === null ? 'нет данных' : formatPercent(row.primarySla)}</td>
                    <td className="py-3 px-3 text-right text-slate-300">{row.resolutionSla === null ? 'нет данных' : formatPercent(row.resolutionSla)}</td>
                    <td className={`py-3 pl-3 text-xs font-bold ${row.conclusion.includes('узкое') ? 'text-red-300' : (row.conclusion.includes('риск') ? 'text-amber-300' : (row.conclusion.includes('стабилен') ? 'text-emerald-300' : 'text-slate-500'))}`}>{row.conclusion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50 shadow-sm mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-lg font-medium text-white flex items-center gap-2"><FileText size={20} className="text-emerald-400" /> Качество итоговых комментариев</h2>
            <p className="text-xs text-slate-500 mt-1">Служебные сообщения ServiceDesk, проверки маршрута, переоткрытие, просьбы оценить и формальные ответы исключаются.</p>
          </div>
          <span className="w-fit rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-300">
            {selectedTraining.resolutionCommentAudit.hasData ? `${selectedTraining.resolutionCommentAudit.coveragePercent}% содержательных` : 'Появится после новой выгрузки'}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            { label: 'Содержательные', value: selectedTraining.resolutionCommentAudit.meaningfulCount, hint: `из ${selectedTraining.resolutionCommentAudit.totalClosed} закрытых` },
            { label: 'Без полезного итога', value: selectedTraining.resolutionCommentAudit.missingOrInvalidCount, hint: 'после очистки комментариев' },
            { label: 'Автоматизация', value: selectedTraining.resolutionCommentAudit.automationFilteredCount, hint: 'проверки и переоткрытие' },
            { label: 'Оценка / формальные', value: selectedTraining.resolutionCommentAudit.ratingFilteredCount + selectedTraining.resolutionCommentAudit.formalFilteredCount, hint: 'CSAT, 123, готово, решено' }
          ].map(item => (
            <div key={item.label} className="rounded-xl border border-slate-700 bg-slate-950/50 p-4">
              <div className="text-[10px] uppercase tracking-wider font-black text-slate-500">{item.label}</div>
              <div className="text-2xl font-black text-white mt-2">{item.value}</div>
              <div className="text-xs text-slate-500 mt-1">{item.hint}</div>
            </div>
          ))}
        </div>
        {selectedTraining.resolutionCommentAudit.patterns.length > 0 && (
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
            {selectedTraining.resolutionCommentAudit.patterns.slice(0, 6).map((item, index) => (
              <div key={`${item.name}-${index}`} className="rounded-xl border border-slate-700 bg-slate-950/40 px-4 py-3">
                <div className="text-xs font-bold text-slate-200">{safeString(item.name || item.resolution)}</div>
                <div className="text-[10px] text-slate-500 mt-1">{Number(item.count) || 0} подтверждений{Array.isArray(item.evidenceIds) && item.evidenceIds.length ? ` · ${item.evidenceIds.slice(0, 4).join(', ')}` : ''}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-5">
            <div>
              <h2 className="text-lg font-medium text-white flex items-center gap-2"><PieChartIcon size={20} className="text-cyan-400" /> Маршруты решения</h2>
              <p className="text-xs text-slate-500 mt-1">Фактическая оцифровка раздергиваний по выбранной неделе.</p>
            </div>
            <span className="text-xs font-bold text-slate-400 bg-slate-900 px-2 py-1 rounded">{selectedTraining.routeTotal} шт.</span>
          </div>
          <div className="h-80">
            {routeChartData.length > 0 && selectedTraining.routeTotal > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={routeChartData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} />
                  <XAxis type="number" stroke="#64748b" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis type="category" dataKey="label" width={150} stroke="#94a3b8" tickLine={false} axisLine={false} fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '12px' }} formatter={(value, name, props) => [`${value} шт. / ${props?.payload?.percentage || 0}%`, props?.payload?.displayRoute || props?.payload?.route || name]} />
                  <Bar dataKey="count" name="Инциденты" fill="#22c55e" radius={[0, 6, 6, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-500">Нет данных по маршрутам</div>
            )}
          </div>
          <div className="mt-4 space-y-2">
            {routeChartData.map(item => (
              <div key={item.route} className="flex items-center justify-between gap-3 text-xs bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2">
                <span className={isRouteDataGap(item.route) ? 'text-slate-500' : 'text-slate-300'}>{item.displayRoute}</span>
                <span className="font-black text-slate-100 shrink-0">{item.count} / {item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50 shadow-sm">
          <h2 className="text-lg font-medium text-white flex items-center gap-2 mb-5"><Target size={20} className="text-fuchsia-400" /> Топ тем с не-самостоятельным маршрутом решения</h2>
          {selectedTraining.bottleneckThemes.length > 0 ? (
            <div className="space-y-3">
              {selectedTraining.bottleneckThemes.slice(0, 3).map((item, idx) => (
                <div key={`${item.theme}-${idx}`} className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="text-sm font-bold text-white leading-snug">{idx + 1}. {safeString(item.theme) || 'Без темы'}</div>
                    <span className="text-xs font-black text-fuchsia-300 bg-fuchsia-500/10 border border-fuchsia-500/30 rounded px-2 py-1 shrink-0">{Number(item.count) || 0} шт.</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                    <div className="bg-slate-950/50 border border-slate-700/50 rounded-lg px-3 py-2">
                      <div className="text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Основной маршрут</div>
                      <div className="text-xs text-slate-200 font-bold">{getThemeRoute(item)}</div>
                    </div>
                    <div className="bg-slate-950/50 border border-slate-700/50 rounded-lg px-3 py-2">
                      <div className="text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">SLA-просрочки</div>
                      <div className="text-xs text-slate-200 font-bold">{getThemeSlaBreaches(item) === null ? 'нет данных' : `${getThemeSlaBreaches(item)} шт.`}</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 border border-slate-700/50 rounded-lg p-3">
                    <span className="text-slate-500 font-bold uppercase tracking-wider block mb-1">Что сделать</span>
                    {getThemeAction(item)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-10 bg-slate-900/40 rounded-xl border border-slate-700/50 border-dashed text-center">
              <BookOpen size={42} className="text-slate-600 mb-4" />
              <p className="text-slate-300 text-sm font-bold">Нет топов по обучению</p>
              <p className="text-slate-500 text-xs mt-1 max-w-md">В JSON выбранной недели нет `trainingSection.bottleneckThemes`. Для этого блока внешний анализ должен вернуть топ тем только по маршрутам с помощью дежурного, администратора направления или смежников.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const WeeklyCompetenciesBoard = ({ weekData, historyKeys, weeksHistory, selectedWeekKey, onWeekSelect, aiTaskMemory }) => {
  const normalizeAnalysisText = (value) => safeString(value)
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^а-яa-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const getTaskDomain = (task) => {
    const explicitDomain = safeString(task?.domain || task?.competenceDomain || task?.serviceDomain).trim();
    const text = normalizeAnalysisText(`${task?.title || ''} ${task?.comments || ''} ${task?.tags || ''} ${task?.workType || ''}`);
    return normalizeMetricDomain(explicitDomain, text);
  };

  const isClosedTask = (task) => task && (task.status === 'Закрыт' || task.status === 'Готово' || task.status === 'Resolved' || task.status === 'Завершен' || task.resolved);
  const getTaskSize = (task) => {
    const taskId = safeString(task?.id).trim();
    const memorySize = taskId ? aiTaskMemory?.[taskId]?.complexity : null;
    return normalizeTaskSize(memorySize || task?.size || task?.complexity || task?.name);
  };

  const closedDetailedTasks = (weekData.detailedTasks || []).filter(task => isClosedTask(task) && !isNonDeliveryTask(task));
  const skillMatrixRows = Object.values(closedDetailedTasks.reduce((acc, task) => {
    const assignee = getFullName(task.assignee);
    if (!assignee || assignee === 'Неизвестно' || assignee === TEAM_LEAD_NAME || isExcludedUser(task.assignee)) return acc;
    if (!acc[assignee]) acc[assignee] = { assignee, total: 0, sizes: { S: 0, M: 0, L: 0, XL: 0 }, categories: {}, domains: {}, heavy: 0, samples: [] };
    const size = getTaskSize(task) || 'M';
    const category = safeString(task.valueCategory || task.category || 'standard') || 'standard';
    const domain = getTaskDomain(task);
    acc[assignee].total += 1;
    acc[assignee].sizes[size] = (acc[assignee].sizes[size] || 0) + 1;
    acc[assignee].categories[category] = (acc[assignee].categories[category] || 0) + 1;
    acc[assignee].domains[domain] = (acc[assignee].domains[domain] || 0) + 1;
    if (acc[assignee].samples.length < 5) acc[assignee].samples.push(task);
    if (['L', 'XL'].includes(size)) acc[assignee].heavy += 1;
    return acc;
  }, {})).map(row => {
    const topCategory = Object.entries(row.categories).sort((a, b) => b[1] - a[1])[0]?.[0] || 'standard';
    const topSize = Object.entries(row.sizes).sort((a, b) => b[1] - a[1])[0]?.[0] || 'M';
    const topDomains = Object.entries(row.domains).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const heavyShare = row.total > 0 ? Math.round((row.heavy / row.total) * 100) : 0;
    const confidence = row.total >= 5 ? 'достаточно данных' : (row.total >= 3 ? 'средне' : 'мало данных');
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

  const totalClosed = skillMatrixRows.reduce((sum, row) => sum + row.total, 0);
  const totalHeavy = skillMatrixRows.reduce((sum, row) => sum + row.heavy, 0);
  const topDomains = Object.entries(skillMatrixRows.reduce((acc, row) => {
    Object.entries(row.domains).forEach(([domain, count]) => {
      acc[domain] = (acc[domain] || 0) + count;
    });
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl pb-10">
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Компетенции недели</h1>
          <p className="text-slate-400 text-sm">Оперативный срез по закрытым задачам периода: сложность, домены и опорные работы админов.</p>
        </div>
        <WeekSelector historyKeys={historyKeys} weeksHistory={weeksHistory} selectedKey={selectedWeekKey} onSelect={onWeekSelect} activeData={weekData} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700/50"><div className="text-xs text-slate-500 uppercase font-bold mb-2">Закрытые задачи</div><div className="text-3xl font-black text-white">{totalClosed}</div><div className="text-xs text-slate-400 mt-1">учтены только задачи команды</div></div>
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700/50"><div className="text-xs text-slate-500 uppercase font-bold mb-2">Сложные+</div><div className="text-3xl font-black text-orange-300">{totalHeavy}</div><div className="text-xs text-slate-400 mt-1">Сложно и Очень сложно</div></div>
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700/50"><div className="text-xs text-slate-500 uppercase font-bold mb-2">Покрытые домены</div><div className="text-3xl font-black text-cyan-300">{topDomains.length}</div><div className="text-xs text-slate-400 mt-1">{topDomains.map(([domain]) => domain).slice(0, 2).join(', ') || 'нет данных'}</div></div>
      </div>

      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-5">
          <div>
            <h2 className="text-lg font-medium text-white flex items-center gap-2"><Users size={20} className="text-cyan-400" /> Недельная матрица компетенций</h2>
            <p className="text-xs text-slate-500 mt-1">T-shape по закрытым задачам недели: домены, трудоемкость и доля сложных задач.</p>
          </div>
          <span className="text-xs text-slate-400 bg-slate-900/80 px-2 py-1.5 rounded border border-slate-700/50">На базе detailedTasks</span>
        </div>
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 mb-4 text-xs text-slate-400 leading-relaxed">
          Это недельный срез, а не кадровая оценка. Сложность берется из поля `size` или ручной AI-памяти задач, домены - из поля `domain` или темы/комментария. Историческая оценка остается во вкладке `Команда`.
        </div>

        {skillMatrixRows.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {skillMatrixRows.map(row => (
              <div key={row.assignee} className="bg-slate-900/50 rounded-lg border border-slate-700/50 p-4 hover:border-cyan-500/40 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div><div className="font-bold text-slate-100">{row.assignee}</div><div className="text-xs text-cyan-300 mt-1">{row.profile}</div></div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs font-bold text-slate-300 bg-slate-950/70 border border-slate-700 rounded px-2 py-1">{row.total} задач</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full border uppercase font-bold ${row.confidence === 'достаточно данных' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : row.confidence === 'средне' ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' : 'bg-slate-700/40 text-slate-400 border-slate-600'}`}>{row.confidence}</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-1.5 mb-3">
                  {['S', 'M', 'L', 'XL'].map(size => <div key={size} className="bg-slate-950/60 rounded border border-slate-700/50 px-2 py-1 text-center"><div className="text-[9px] text-slate-500 font-bold">{getTaskSizeLabel(size)}</div><div className="text-sm text-white font-black">{row.sizes[size] || 0}</div></div>)}
                </div>
                <div className="flex items-center justify-between text-xs"><span className="text-slate-400">Сложные</span><span className={row.heavyShare >= 45 ? 'text-orange-300 font-bold' : 'text-slate-300 font-bold'}>{row.heavyShare}%</span></div>
                <div className="mt-3 pt-3 border-t border-slate-700/50">
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Домены</div>
                  <div className="space-y-2">
                    {row.topDomains.map(([domain, count]) => (
                      <div key={`${row.assignee}-${domain}`}>
                        <div className="flex justify-between text-[10px] mb-1"><span className="text-cyan-200">{domain}</span><span className="text-slate-400">{count}</span></div>
                        <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800"><div className="h-full bg-cyan-500/70" style={{ width: `${Math.max(10, Math.round((count / row.total) * 100))}%` }}></div></div>
                      </div>
                    ))}
                  </div>
                </div>
                {row.keyTasks.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-700/50">
                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Опорные задачи</div>
                    <div className="space-y-1.5">{row.keyTasks.slice(0, 2).map(task => <div key={`${row.assignee}-${task.id}`} className="text-[11px] text-slate-300 bg-slate-950/50 border border-slate-700/50 rounded px-2 py-1.5 leading-snug"><span className="text-cyan-300 font-bold">{task.id}</span> · {safeString(task.title).slice(0, 90)}{safeString(task.title).length > 90 ? '...' : ''}</div>)}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 bg-slate-900/40 rounded-xl border border-slate-700/50 border-dashed">
            <Users size={44} className="text-slate-600 mb-4" />
            <p className="text-slate-300 text-sm font-bold">Нет данных для недельной матрицы</p>
            <p className="text-slate-500 text-xs mt-1">Она появится после импорта задач с `detailedTasks` за выбранную неделю.</p>
          </div>
        )}
      </div>
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

      // Jira-импорт не должен стирать уже загруженную телефонию пустыми полями из JSON.
      if (!Array.isArray(parsedData.telephonyData) || parsedData.telephonyData.length === 0) {
          finalData.telephonyData = Array.isArray(formData.telephonyData) ? formData.telephonyData : [];
      }
      if (!safeString(parsedData.telephonyInsight).trim()) {
          finalData.telephonyInsight = formData.telephonyInsight;
      }
      
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
            setTeamMetricsMemory(prev => mergeTasksIntoTeamMetrics(prev, parsedData.detailedTasks.filter(task => !isNonDeliveryTask(task)), { weekKey: selectedKey }).memory);
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
    weekType: 'normal',
    trainingSection: null,
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
  const [newTaskColor, setNewTaskColor] = useState('#3b82f6'); // В работе по умолчанию
  const [draggedProjectTaskId, setDraggedProjectTaskId] = useState(null);

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
      if (nextEntry.priority || nextEntry.complexity || Object.prototype.hasOwnProperty.call(nextEntry, 'manualDetails')) {
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

  const handleSaveManualTaskDetails = (taskId, title, detailsText) => {
    const cleanId = safeString(taskId).trim();
    if (!cleanId) return;
    setAiTaskMemory(prev => {
      const previous = (prev || {})[cleanId] || {};
      return {
        ...(prev || {}),
        [cleanId]: {
          ...previous,
          id: cleanId,
          title: safeString(title).trim() || previous.title || cleanId,
          manualDetails: safeString(detailsText).trim(),
          updatedAt: new Date().toISOString()
        }
      };
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
      completedWeekKey: null,
      priority: (projectTasks || []).length
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
      setProjectTasks((projectTasks || []).filter(t => t.id !== id).map((task, index) => ({ ...task, priority: index })));
    }
  };

  const handleMoveProjectTask = (id, direction) => {
    setProjectTasks(prev => {
      const list = [...(prev || [])];
      const currentIndex = list.findIndex(t => t.id === id);
      const targetIndex = currentIndex + direction;
      if (currentIndex < 0 || targetIndex < 0 || targetIndex >= list.length) return prev;
      [list[currentIndex], list[targetIndex]] = [list[targetIndex], list[currentIndex]];
      return list.map((task, index) => ({ ...task, priority: index }));
    });
  };

  const handleProjectTaskDragStart = (event, id) => {
    setDraggedProjectTaskId(id);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', id);
  };

  const handleProjectTaskDrop = (event, targetId) => {
    event.preventDefault();
    const sourceId = draggedProjectTaskId || event.dataTransfer.getData('text/plain');
    if (!sourceId || sourceId === targetId) {
      setDraggedProjectTaskId(null);
      return;
    }
    setProjectTasks(prev => {
      const list = [...(prev || [])];
      const sourceIndex = list.findIndex(t => t.id === sourceId);
      const targetIndex = list.findIndex(t => t.id === targetId);
      if (sourceIndex < 0 || targetIndex < 0) return prev;
      const [movedTask] = list.splice(sourceIndex, 1);
      list.splice(targetIndex, 0, movedTask);
      return list.map((task, index) => ({ ...task, priority: index }));
    });
    setDraggedProjectTaskId(null);
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

      const getProjectTaskGroupMeta = (task, isCompleted) => {
        if (isCompleted) {
          return { key: 'done', title: 'Выполнено и подтверждено', note: 'Поручения, закрытые по Jira или вручную', accent: '#22c55e', bg: '#f0fdf4', text: '#166534' };
        }
        const color = safeString(task.color).toLowerCase();
        if (color === '#3b82f6') return { key: 'blue', title: 'В работе', note: 'Активные поручения с нормальным ходом выполнения', accent: '#3b82f6', bg: '#eff6ff', text: '#1d4ed8' };
        if (color === '#10b981') return { key: 'green', title: 'В рабочем режиме', note: 'Поручения без явного риска, которые остаются на контроле', accent: '#10b981', bg: '#ecfdf5', text: '#047857' };
        if (color === '#f59e0b') return { key: 'yellow', title: 'На контроле срока', note: 'Нужен следующий шаг, дата или проверка блокера', accent: '#f59e0b', bg: '#fffbeb', text: '#b45309' };
        if (color === '#ef4444') return { key: 'red', title: 'Риски и эскалация', note: 'Поручения, требующие управленческого внимания', accent: '#ef4444', bg: '#fef2f2', text: '#b91c1c' };
        return { key: 'dark', title: 'Пауза или ожидание', note: 'Отложенные поручения или ожидание внешнего действия', accent: '#64748b', bg: '#f8fafc', text: '#334155' };
      };
      
      const taskCards = tasksForThisWeek.map(t => {
        const weeksActive = getWeeksDiff(t.createdWeekKey, selectedKey);
        const isCompleted = isProjectTaskCompletedInWeek(t, selectedKey);
        const agingMeta = getProjectTaskAgingMeta(weeksActive);
        const bgColor = isCompleted ? '#f0fdf4' : '#ffffff';
        const borderColor = isCompleted ? '#bbf7d0' : '#e2e8f0';
        const titleColor = isCompleted ? '#166534' : '#0f172a';
        const titleText = isCompleted ? `<s>${safeString(t.title)}</s>` : safeString(t.title);
        const managementStamp = `<span style="display: inline-block; color: #1d4ed8; border: 1px solid #93c5fd; background: #eff6ff; padding: 1px 6px; border-radius: 999px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.02em; white-space: nowrap;">Поручение руководства</span>`;
        
        const statusBadge = isCompleted 
          ? `<span style="color: #16a34a; font-weight: 800; background: #dcfce3; padding: 1px 6px; border-radius: 999px; font-size: 10px; text-transform: uppercase;">Выполнено</span>`
          : `<span style="color: ${t.color}; font-weight: 700;">${safeString(t.comment)}</span>`;

        const delaySticker = !isCompleted
          ? `<span style="display: inline-block; background-color: ${agingMeta.bg}; color: ${agingMeta.color}; border: 1px solid ${agingMeta.border}; padding: 1px 6px; border-radius: 999px; font-size: 9px; font-weight: 800; white-space: nowrap;">${agingMeta.label}</span>`
          : '';

        return `
          <div style="background-color: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 6px; margin-bottom: 7px; padding: 8px 10px;">
             <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 4px;">
               <div style="font-weight: 800; font-size: 13px; line-height: 1.32; color: ${titleColor};">
                   ${titleText}
               </div>
               ${isCompleted ? managementStamp : delaySticker}
             </div>
             ${!isCompleted ? `
               <div style="font-size: 10px; text-align: left; color: #64748b; display: flex; flex-wrap: wrap; align-items: center; gap: 6px;">
                   <span style="font-weight: 700; color: #64748b;">Статус:</span> 
                   ${statusBadge}
               </div>
               ${weeksActive >= 1 ? `<div style="font-size: 10px; color: #64748b; margin-top: 3px; line-height: 1.35;">${agingMeta.note}</div>` : ''}
             ` : `
               <div style="font-size: 10px; text-align: left; margin-top: 3px; color: #64748b; display: flex; flex-wrap: wrap; gap: 6px; align-items: center;">
                   ${statusBadge} <span>Итог: ${safeString(t.comment)}</span>
               </div>
             `}
          </div>
        `;
      });

      const groupedTasks = [];
      tasksForThisWeek.forEach((task, index) => {
        const isCompleted = isProjectTaskCompletedInWeek(task, selectedKey);
        const groupMeta = getProjectTaskGroupMeta(task, isCompleted);
        let group = groupedTasks.find(item => item.key === groupMeta.key);
        if (!group) {
          group = { ...groupMeta, cards: [] };
          groupedTasks.push(group);
        }
        group.cards.push(taskCards[index]);
      });

      return groupedTasks.map(group => `
        <div style="border: 1px solid #e2e8f0; border-left: 4px solid ${group.accent}; border-radius: 8px; overflow: hidden; margin-bottom: 12px; background: #ffffff;">
          <div style="display: flex; justify-content: space-between; gap: 10px; align-items: flex-start; padding: 8px 12px; background: ${group.bg}; border-bottom: 1px solid #e2e8f0;">
            <div>
              <div style="font-size: 12px; font-weight: 900; color: ${group.text}; text-transform: uppercase; letter-spacing: 0.02em;">${group.title}</div>
              <div style="font-size: 10px; color: #64748b; margin-top: 2px;">${group.note}</div>
            </div>
            <span style="min-width: 24px; height: 20px; border-radius: 999px; border: 1px solid ${group.accent}; color: ${group.text}; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900; background: #ffffff;">${group.cards.length}</span>
          </div>
          <div style="padding: 8px 10px 2px 10px;">
            ${group.cards.join('')}
          </div>
        </div>
      `).join('');
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
      const manualDetailsMap = options.manualDetailsMap || {};
      const reportData = weekData || {};
      const sortedIncidents = weekData.topIncidents ? [...weekData.topIncidents].sort((a,b)=>(Number(b.count)||0)-(Number(a.count)||0)) : [];
      const top3 = sortedIncidents.slice(0, 3);
      const top3Text = top3.map(i => `${safeString(i.name)} (${Number(i.count)||0})`).join(', ');

      const sortedReportKeys = [...(historyKeys || [])].sort();
      const reportWeekIndex = sortedReportKeys.indexOf(selectedKey);
      const prevReportWeekKey = reportWeekIndex > 0 ? sortedReportKeys[reportWeekIndex - 1] : null;
      const prevReportWeekData = prevReportWeekKey ? weeksHistory?.[prevReportWeekKey] : null;
      const totalIncidentsFromList = (weekData.topIncidents || []).reduce((sum, item) => sum + (Number(item.count) || 0), 0);
      const totalClosedCount = (Number(weekData.sprintCompleted)||0) + (Number(weekData.urgentCompleted)||0) + (Number(weekData.backlogCompleted)||0);
      const totalIncidents = Number(weekData.incidentsClosed) || 0;
      const incidentTrend = prevReportWeekData ? totalIncidents - (Number(prevReportWeekData.incidentsClosed) || 0) : 0;
      const incidentTrendHtml = prevReportWeekData
        ? `<span style="display: inline-block; margin-left: 6px; color: ${incidentTrend > 0 ? '#dc2626' : incidentTrend < 0 ? '#059669' : '#64748b'}; font-size: 12px; font-weight: 800;">${incidentTrend === 0 ? 'без изменений' : `${incidentTrend > 0 ? '+' : '-'}${Math.abs(incidentTrend)} к прошлой нед.`}</span>`
        : '';
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

      let sortedTaskPerformers = [...enrichPerformersWithNonDeliveryTasks(weekData.taskPerformers || [], weekData.detailedTasks || [])]
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
        .filter(t => t && (t.status === 'Закрыт' || t.status === 'Готово' || t.status === 'Resolved' || t.status === 'Завершен' || t.resolved) && !isNonDeliveryTask(t))
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
        ? completedDetailedTasks.filter(task => ['main', 'idm'].includes(getTaskReportBucket(task)))
        : completedDetailedTasks;
      const idmDetailedTasks = [];
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
         return fName !== TEAM_LEAD_NAME && row.name !== TEAM_LEAD_ID && !String(row.name).includes('Виктор') && !isExcludedUser(row.name) && !isExcludedFromFirstLineReport(row.name) && isReportFirstLineOperator(row.name);
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
          const lowParticipation = answeredCalls <= 3 && closedTickets === 0;
          const hasKpiWarning = missedCalls > 0 || availability < 90 || footballRate >= 60 || lowParticipation;
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
          } else if (lowParticipation) {
            workloadLabel = 'Низкое участие';
            workloadColor = '#b45309';
            workloadBg = '#fffbeb';
            workloadText = `Принято ${answeredCalls} из ${totalCalls}, закрытий в Jira 0. Даже для короткой смены это низкий фактический вклад; проверить график и роль на линии.`;
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
          } else if (footballRate >= 60 && answeredCalls > 0) {
            workloadLabel = 'Передача без решения';
            workloadColor = '#b45309';
            workloadBg = '#fffbeb';
            workloadText = `Принятый поток малый, но прокси передачи дальше ${footballRate}%: личного закрытия в Jira не видно.`;
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
            ${sampleTask ? (() => {
              const sampleTitle = cleanReportTaskTitle(sampleTask.title);
              return `<div style="font-size: 11px; color: #64748b; line-height: 1.35; margin-top: 7px;">Пример: <b style="color: ${group.color};">${escapeHtml(sampleTask.id)}</b> ${escapeHtml(sampleTitle.slice(0, 74))}${sampleTitle.length > 74 ? '...' : ''}</div>`;
            })() : ''}
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
          'Сеть / BinkD': ['Серверная инфраструктура'],
          'Серверная инфраструктура': ['Сеть / BinkD', 'Zabbix / мониторинг', 'Citrix / фермы'],
          'IDM': ['Проекты / процессы'],
          '2FA': ['Проекты / процессы'],
          'Zabbix / мониторинг': ['Серверная инфраструктура', 'Сеть / BinkD'],
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
          const confidence = row.total >= 5 ? 'достаточно данных' : (row.total >= 3 ? 'средне' : 'мало данных');
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
        const mergedMetrics = mergeTasksIntoTeamMetrics(teamMetricsMemory || {}, completedDetailedTasks, { weekKey: selectedKey }).memory;
        const isReportableEmployeeRow = (row) => {
          const name = safeString(row?.name).trim();
          const normalized = name.toLowerCase().replace(/ё/g, 'е');
          if (!name || ['не назначен', 'без автора', 'неизвестно', 'не назначено', 'без исполнителя'].includes(normalized)) return false;
          return isKnownTeamMember(name) && !isExcludedUser(name);
        };
        const rows = buildTeamMetricRows(mergedMetrics, { currentWeekKey: selectedKey }).filter(isReportableEmployeeRow).slice(0, 10);
        const domainRankMap = buildDomainRankMap(rows);
        const renderTrendBadge = (trend) => {
          const trendType = trend?.type || 'stable';
          const title = trend?.label || (trendType === 'up' ? 'Заметный рост недели' : (trendType === 'down' ? 'Существенная просадка недели' : 'Неделя без резких изменений'));
          if (trendType === 'down') {
            return `
              <span class="trend-kpi-drop" title="${escapeHtml(title)}" aria-label="${escapeHtml(title)}">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block; flex:0 0 auto;">
                  <path d="M4 6.5h3.2l2.1 3.2 2.7-5.1 2.7 8 1.8-3.1H20" stroke="#991b1b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M15.5 15.5 19 19m0 0 3.5-3.5M19 19V11" stroke="#dc2626" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="4" cy="6.5" r="1.4" fill="#ef4444"/>
                  <circle cx="20" cy="9.5" r="1.4" fill="#ef4444"/>
                </svg>
                <span>просадка KPI</span>
              </span>
            `;
          }
          if (trendType === 'stable') {
            return `
              <span class="trend-kpi-stable" title="${escapeHtml(title)}" aria-label="${escapeHtml(title)}">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block; flex:0 0 auto;">
                  <path d="M4 12h3.2l2.1-3.2 2.7 6.4 2.7-6.4 1.8 3.2H20" stroke="#0369a1" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M7 18h10" stroke="#0ea5e9" stroke-width="2.1" stroke-linecap="round"/>
                  <path d="M9.5 15.5 7 18l2.5 2.5M14.5 15.5 17 18l-2.5 2.5" stroke="#0ea5e9" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="4" cy="12" r="1.4" fill="#0ea5e9"/>
                  <circle cx="20" cy="12" r="1.4" fill="#0ea5e9"/>
                </svg>
                <span>стабильно KPI</span>
              </span>
            `;
          }
          return `
            <span class="trend-kpi-grow" title="${escapeHtml(title)}" aria-label="${escapeHtml(title)}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block; flex:0 0 auto;">
                <path d="M4 17.5h3.2l2.1-3.2 2.7 5.1 2.7-8 1.8 3.1H20" stroke="#047857" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M15.5 8.5 19 5m0 0 3.5 3.5M19 5v8" stroke="#10b981" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="4" cy="17.5" r="1.4" fill="#10b981"/>
                <circle cx="20" cy="14.5" r="1.4" fill="#10b981"/>
              </svg>
              <span>рост KPI</span>
            </span>
          `;
        };
        const getSpeedText = (row) => row.onTimeShare === null
          ? 'нет данных'
          : `${row.onTimeShare}% в норме${row.avgCycleTime !== null ? ` · ср. ${row.avgCycleTime} дн.` : ''}`;
        const getCompactFocus = (row) => {
          if (row.totalTasks < 15) return 'Небольшой объем в исторической базе';
          if (row.totalTasks < 40) return 'Наблюдать следующий период';
          if (row.complexTasksCount === 0 || row.heavyWeightShare <= 0) return 'Фокус на потоковых и рутинных задачах (Легко/Средне)';
          if (row.heavyWeightShare <= 15) return 'Привлекается к сложным техническим задачам';
          return 'Берет на себя тяжелые проекты и архитектурные задачи';
        };
        const renderDomainBadges = (row, limit = 2) => {
          const domains = row.topDomains.slice(0, limit);
          if (domains.length === 0) return '<span style="color:#94a3b8;">Нет данных</span>';
          return domains.map(([domain, score]) => {
            const share = row.totalWeight > 0 ? Math.round(((Number(score) || 0) / row.totalWeight) * 100) : 0;
            const rank = getDomainRank(domainRankMap, domain, row.name);
            const badge = getExpertiseBadge(score, rank, share);
            return `<span style="display:inline-block; background:${badge.bg}; color:${badge.color}; border:1px solid ${badge.border}; border-radius:999px; padding:3px 7px; font-size:10px; font-weight:800; margin:2px 3px 2px 0;">${badge.icon ? `${badge.icon} ` : ''}${escapeHtml(domain)}: ${score}</span>`;
          }).join('');
        };
        return `
          <h3 style="font-size: 14px; color: #475569; margin-bottom: 10px;">Матрица эффективности и компетенций админов</h3>
          ${rows.length > 0 ? `
            <div style="font-size:12px; color:#334155; line-height:1.45; background:#f8fafc; border:1px solid #e2e8f0; border-left:4px solid #0891b2; border-radius:10px; padding:10px 12px; margin-bottom:14px;">
              <b style="color:#0f172a;">Методика:</b> вес задач = Легко 1 / Средне 3 / Сложно 8 / Очень сложно 15; индекс = 70% вес относительно лидера + 30% доля сложных работ.
              <br/><span style="color:#64748b;">Сроки показаны только как справочный сигнал до появления надежной даты назначения задачи конкретному админу.</span>
            </div>
            <div style="display:grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap:12px; margin-bottom:16px;">
              ${rows.slice(0, 3).map((row, idx) => {
                const accents = ['#f59e0b', '#06b6d4', '#64748b'];
                const bg = ['linear-gradient(135deg,#fffbeb 0%,#ffffff 72%)', 'linear-gradient(135deg,#ecfeff 0%,#ffffff 72%)', 'linear-gradient(135deg,#f8fafc 0%,#ffffff 72%)'];
                const rankNames = ['1 место', '2 место', '3 место'];
                const rankTitles = ['Лидер вклада', 'Сильный вклад', 'Стабильный вклад'];
                return `
                  <div style="border:1px solid ${accents[idx]}; border-radius:14px; padding:14px; background:${bg[idx]}; box-shadow:0 10px 24px rgba(15,23,42,0.08);">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
                      <div>
                        <div style="font-size:10px; color:${accents[idx]}; font-weight:900; text-transform:uppercase; letter-spacing:0.04em;">${rankNames[idx]} · ${rankTitles[idx]}</div>
                        <div style="font-size:15px; color:#0f172a; font-weight:900; margin-top:4px;">${escapeHtml(row.name)}</div>
                      </div>
                      <div style="text-align:right;">
                        <div style="font-size:30px; color:${accents[idx]}; font-weight:900; line-height:1;">${row.efficiencyIndex}</div>
                        <div style="font-size:9px; color:#64748b; font-weight:900; text-transform:uppercase;">индекс</div>
                      </div>
                    </div>
                    <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:6px; margin-top:11px;">
                      <div style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:6px; font-size:10px; color:#64748b;">Закрыто<br><b style="color:#0f172a; font-size:14px;">${row.totalTasks}</b></div>
                      <div style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:6px; font-size:10px; color:#64748b;">Вес<br><b style="color:#0f172a; font-size:14px;">${row.totalWeight}</b></div>
                      <div style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:6px; font-size:10px; color:#64748b;">Сложные+<br><b style="color:#0f172a; font-size:14px;">${row.complexTasksCount}</b></div>
                    </div>
                    <div style="margin-top:10px; min-height:26px;">${renderDomainBadges(row, 2)}</div>
                    <div style="display:flex; justify-content:flex-end; gap:6px; align-items:center; margin-top:7px; min-height:24px;">
                      ${renderTrendBadge(row.weeklyTrend)}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
            <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:10px; overflow:hidden;">
              <table class="data-table resource-audit-table" style="margin:0; border:0;">
                <thead>
                  <tr>
                    <th>Сотрудник</th>
                    <th>Закрыто</th>
                    <th>Вес</th>
                    <th>Сложные+</th>
                    <th>Индекс</th>
                    <th>Ключевые направления</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows.map((row, idx) => `
                    <tr>
                      <td>
                        <b>${idx < 3 ? `${idx + 1}. ` : ''}${escapeHtml(row.name)}</b>
                      </td>
                      <td><b style="font-size:15px; color:#0f172a;">${row.totalTasks}</b></td>
                      <td><b style="font-size:15px; color:#0f172a;">${row.totalWeight}</b></td>
                      <td>
                        <b style="font-size:15px; color:${row.complexTasksCount > 0 ? '#0e7490' : '#64748b'};">${row.complexTasksCount}</b>
                        <div style="font-size:10px; color:#64748b;">${row.heavyWeightShare}% веса</div>
                      </td>
                      <td>
                        <b style="font-size:16px; color:${row.efficiencyIndex >= 75 ? '#d97706' : '#0e7490'};">${row.efficiencyIndex}</b>
                        <div style="font-size:10px; color:#64748b;">вес ${row.volumeShare}%</div>
                      </td>
                      <td>${renderDomainBadges(row, 2)}</td>
                      <td>
                        <div style="font-size:11px; color:#334155; font-weight:800;">${escapeHtml(getCompactFocus(row))}</div>
                        <div style="font-size:10px; color:#64748b; margin-top:3px;">Сроки: ${escapeHtml(getSpeedText(row))}</div>
                        <div style="margin-top:4px;">${renderTrendBadge(row.weeklyTrend)}</div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            <div style="margin-top:10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:9px 11px; color:#475569; font-size:11px; line-height:1.45;">
              <b style="color:#0f172a;">Как читать:</b> сначала закрыто и вес, затем сложные+ и домены. Сроки сейчас не штрафуют рейтинг, а помогают найти задачи для ручной проверки.
            </div>
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

      const getFirstLineProfileHtml = (perf) => {
        const meta = getFirstLineProfileMeta(perf);
        const tone = {
          success: { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' },
          steady: { bg: '#ecfeff', color: '#0e7490', border: '#a5f3fc' },
          complex: { bg: '#fdf4ff', color: '#a21caf', border: '#f5d0fe' },
          risk: { bg: '#fff1f2', color: '#be123c', border: '#fecdd3' },
          neutral: { bg: '#f8fafc', color: '#475569', border: '#cbd5e1' }
        }[meta.tone] || { bg: '#f8fafc', color: '#475569', border: '#cbd5e1' };
        return `
          <span class="first-line-profile" title="${escapeHtml(meta.detail)}" style="background:${tone.bg}; color:${tone.color}; border-color:${tone.border};">
            <span class="first-line-profile-dot"></span>${escapeHtml(meta.label)}
          </span>
        `;
      };

      const taskRows = sortedTaskPerformers.map(p => {
         const droppedCount = Array.isArray(p.droppedTasks) ? p.droppedTasks.length : (Number(p.droppedTasks) || 0);
         const closedHtml = droppedCount > 0 
            ? `${p.closed || 0}<br/><span style="font-size: 10px; color: #94a3b8; font-weight: normal;">(-${droppedCount} без вып.)</span>`
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
            ? `${p.closed || 0}<br/><span style="font-size: 10px; color: #94a3b8; font-weight: normal;">(-${droppedCount} без вып.)</span>`
            : `${p.closed || 0}`;
         return [`${getFullName(p.name)} ${getBurnoutBadge(0, p.closed, 'inc')}`, closedHtml, `${p.avgTimeMin || 0} мин.`, getFirstLineProfileHtml(p), renderReportCsatCell(p)];
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

      const csatScores = sortedIncPerformers
        .map(p => Number(p.csat))
        .filter(score => Number.isFinite(score) && score > 0);
      const overallCsat = csatScores.length > 0
        ? (csatScores.reduce((sum, score) => sum + score, 0) / csatScores.length).toFixed(1)
        : 'нет данных';
      const lowCsatCount = csatFeedbackItems.length;
      const overallCsatHtml = `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; background:#f8fafc; border:1px solid #e2e8f0; border-left:4px solid ${lowCsatCount > 0 ? '#f59e0b' : '#10b981'}; border-radius:10px; padding:10px 12px; margin:0 0 12px 0;">
          <div>
            <div style="font-size:11px; color:#64748b; font-weight:900; text-transform:uppercase; letter-spacing:0.04em;">Общий CSAT первой линии</div>
            <div style="font-size:12px; color:#475569; margin-top:2px;">Средняя оценка по сотрудникам в таблице контроля качества.</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:22px; color:#0f172a; font-weight:900; line-height:1;">${overallCsat}</div>
            <div style="font-size:10px; color:${lowCsatCount > 0 ? '#b45309' : '#047857'}; font-weight:900; margin-top:3px;">оценок ниже 5: ${lowCsatCount}</div>
          </div>
        </div>
      `;

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
      const sourceSlaMetrics = Array.isArray(weekData.slaMetrics) ? weekData.slaMetrics : [];
      const isPrimarySlaType = (value) => {
        const type = safeString(value).toLowerCase();
        return type.includes('инцидент от момента')
          || type.includes('момент')
          || type.includes('создан')
          || type.includes('взят')
          || type.includes('перв')
          || type.includes('first')
          || type.includes('reaction');
      };
      const isResolutionSlaType = (value) => {
        const type = safeString(value).toLowerCase();
        return type.includes('решен') || type.includes('решени') || type.includes('закрыт') || type.includes('resolution') || type.includes('resolve');
      };
      const primaryMetric = sourceSlaMetrics.find(item => isPrimarySlaType(item.name || item.slaType || item.type || item.metric));
      const resolutionMetric = sourceSlaMetrics.find(item => isResolutionSlaType(item.name || item.slaType || item.type || item.metric));
      const primarySlaBreaches = slaBreachDetails.filter(item => {
        return isPrimarySlaType(getBreachType(item));
      });
      const resolutionSlaBreaches = slaBreachDetails.filter(item => {
        return isResolutionSlaType(getBreachType(item));
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
      const primaryMetricViolations = Number(primaryMetric?.violations) || 0;
      const resolutionMetricViolations = Number(resolutionMetric?.violations) || 0;
      const primaryViolationCount = Math.max(primarySlaBreaches.length, primaryMetricViolations);
      const resolutionViolationCount = Math.max(resolutionSlaBreaches.length, resolutionMetricViolations);
      const primaryAvgOverdue = getAvgOverdue(primarySlaBreaches) || (Number(primaryMetric?.avgOverdueMin) || 0);
      const resolutionAvgOverdue = getAvgOverdue(resolutionSlaBreaches) || (Number(resolutionMetric?.avgOverdueMin) || 0);
      const slaHeat = primaryViolationCount >= 50 || primaryEasyShare >= 50
        ? { label: 'Критично', color: '#dc2626', bg: '#fff7ed', border: '#fed7aa', fill: 92 }
        : (primaryViolationCount >= 20 || primaryEasyShare >= 30
          ? { label: 'Риск', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', fill: 68 }
          : (primaryViolationCount > 0
            ? { label: 'Контроль', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', fill: 38 }
            : { label: 'Норма', color: '#047857', bg: '#ecfdf5', border: '#a7f3d0', fill: 8 }));
      let slaDiagnosis = 'Нет нарушений основного SLA `Инцидент от момента создания`.';
      if (primaryViolationCount > 0 && primarySlaBreaches.length === 0) {
        slaDiagnosis = `Есть ${primaryViolationCount} нарушений основного SLA, но в JSON нет детализации кейсов. Нужна выгрузка \`slaBreachDetails\` по SLA "Инцидент от момента создания", чтобы понять исполнителей, домены и причины.`;
      } else if (primarySlaBreaches.length > 0) {
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
      const slaFocusAction = primaryViolationCount === 0
        ? 'Действий не требуется: нарушений основного SLA нет.'
        : (primarySlaBreaches.length === 0
          ? 'Фокус руководителя: повторить выгрузку инцидентов с деталями `slaBreachDetails` по SLA "Инцидент от момента создания"; без списка кейсов нельзя честно разобрать причины.'
        : (primaryEasyShare >= 35
          ? 'Фокус руководителя: проверить очередь первой линии и правило взятия простых обращений в первые 15 минут. Основной риск не в сложности, а в реакции на типовые обращения.'
          : (primaryComplexShare >= 40
            ? 'Фокус руководителя: отделить массовые и сложные кейсы от обычной очереди, зафиксировать быстрый маршрут эскалации и шаблон первичного ответа пользователю.'
            : 'Фокус руководителя: разобрать несколько показательных кейсов, подтвердить причину просрочки и проверить, не смешались ли дисциплина реакции и сложность.')));
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
      const slaBreachHtml = (primaryViolationCount > 0 || resolutionViolationCount > 0 || slaBreachDetails.length > 0) ? `
        <h3 style="font-size: 14px; color: #475569; margin-bottom: 10px; margin-top: 20px;">SLA-температура основного контроля</h3>
        <div style="background: ${slaHeat.bg}; border: 1px solid ${slaHeat.border}; border-left: 5px solid ${slaHeat.color}; border-radius: 10px; padding: 12px 14px; margin-bottom: 14px;">
          <div style="display: flex; justify-content: space-between; gap: 16px; align-items: flex-start;">
            <div style="min-width: 0; flex: 1;">
              <div style="font-size: 12px; color: ${slaHeat.color}; font-weight: 900; text-transform: uppercase; letter-spacing: 0.04em;">Температура SLA: ${slaHeat.label}</div>
              <div style="height: 7px; background: #ffffff; border: 1px solid ${slaHeat.border}; border-radius: 999px; overflow: hidden; margin: 7px 0 8px 0;">
                <div style="height: 100%; width: ${slaHeat.fill}%; background: linear-gradient(90deg, #10b981, #f59e0b, #ef4444);"></div>
              </div>
              <div style="font-size: 12px; color: #334155; line-height: 1.45;">${escapeHtml(slaDiagnosis)}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 5px;">Основной SLA: <b>Инцидент от момента создания</b>. Вторичный SLA: <b>До решения</b>.</div>
              ${slaReviewSummary ? `<div style="font-size: 11px; color: #64748b; margin-top: 5px;">Ручная память: ${slaReviewSummary}.</div>` : ''}
            </div>
            <div style="display: grid; grid-template-columns: repeat(4, minmax(64px, 1fr)); gap: 6px; min-width: 340px;">
              <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 7px; padding: 7px;"><span style="display:block; color:#64748b; font-size:8px; font-weight:900; text-transform:uppercase;">Основной SLA</span><b style="font-size:17px; color:#0f172a;">${primaryViolationCount}</b><span style="display:block; color:#64748b; font-size:9px;">+${primaryAvgOverdue} мин</span></div>
              <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 7px; padding: 7px;"><span style="display:block; color:#64748b; font-size:8px; font-weight:900; text-transform:uppercase;">До решения</span><b style="font-size:17px; color:#0f172a;">${resolutionViolationCount}</b><span style="display:block; color:#64748b; font-size:9px;">+${resolutionAvgOverdue} мин</span></div>
              <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 7px; padding: 7px;"><span style="display:block; color:#64748b; font-size:8px; font-weight:900; text-transform:uppercase;">Простые</span><b style="font-size:17px; color:#0f172a;">${primaryEasyShare}%</b></div>
              <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 7px; padding: 7px;"><span style="display:block; color:#64748b; font-size:8px; font-weight:900; text-transform:uppercase;">Сложные</span><b style="font-size:17px; color:#0f172a;">${primaryComplexShare}%</b></div>
            </div>
          </div>
          <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:8px 10px; font-size: 12px; color:#334155; margin-top:9px; line-height:1.45;">
            <b>Что делать:</b> ${escapeHtml(slaFocusAction)}
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
      const cleanTaskDetailsText = (value) => {
        let text = safeString(value)
          .replace(/\r\n/g, '\n')
          .replace(/\r/g, '\n')
          .replace(/\[~[^\]]+\]/g, '')
          .replace(/\[(HOST|PATH|DOMAIN|PHONE|IP|LOGIN|USER|EMAIL)\]/gi, '')
          .replace(/\bu\d{3,}\b/gi, '')
          .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '')
          .replace(/\bСНИЛС\b\s*[:№#-]?\s*/gi, '')
          .replace(/\b\d{3}[-\s]?\d{3}[-\s]?\d{3}[-\s]?\d{2}\b/g, '')
          .replace(/\b\d{2,3}[-\s]\d{2,3}[-\s]\d{2,3}(?:[-\s]\d{1,3})?\b/g, '')
          .replace(/!\S+?\.(png|jpg|jpeg|gif)\|[^!]*!/gi, '')
          .replace(/\b(public|internal)\s*;;/gi, '')
          .replace(/;public;;|;internal;;/gi, '')
          .replace(/\[LINK\]/gi, '')
          .replace(/\b\d{1,2}\/[а-яё]{3,}\/\d{2}\s+\d{1,2}:\d{2};[^;]+;/gi, '')
          .replace(/\b\d{1,2}\.\d{1,2}\.\d{2,4}\s+\d{1,2}:\d{2};[^;]+;/gi, '')
          .replace(/\s*-->\s*/g, ' -> ')
          .replace(/\|{2,}/g, '|')
          .replace(/\s*\|\s*/g, ' | ')
          .replace(/\s+([,.!?;:])/g, '$1')
          .replace(/[ \t]+/g, ' ')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
        const noisyPatterns = [
          'мы кажется уже делали',
          'напомни пожалуйста',
          'админ наш просто подстраховывал',
          'нет данных',
          'готово',
          'решено'
        ];
        const normalized = text.toLowerCase().replace(/ё/g, 'е');
        if (!text || text.length < 12 || noisyPatterns.some(pattern => normalized.includes(pattern))) return '';
        const sentences = text
          .split(/(?<=[.!?])\s+|\n+/)
          .map(item => item.trim())
          .filter(item => item.length >= 12)
          .slice(0, 3);
        const result = sentences.join(' ');
        return result.length > 420 ? `${result.slice(0, 417).trim()}...` : result;
      };

      const cleanReportTaskTitle = (value) => safeString(value)
        .replace(/\[(HOST|PATH|DOMAIN|PHONE|IP|LOGIN|USER|EMAIL)\]/gi, '')
        .replace(/\bu\d{3,}\b/gi, '')
        .replace(/\bСНИЛС\b\s*[:№#-]?\s*/gi, '')
        .replace(/\b\d{3}[-\s]?\d{3}[-\s]?\d{3}[-\s]?\d{2}\b/g, '')
        .replace(/\s{2,}/g, ' ')
        .replace(/\s+([,.!?;:])/g, '$1')
        .trim();

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
        const taskId = safeString(t.id).trim();
        const memoryDetails = taskId && Object.prototype.hasOwnProperty.call(manualDetailsMap, taskId)
          ? manualDetailsMap[taskId]
          : (taskId && Object.prototype.hasOwnProperty.call(aiTaskMemory?.[taskId] || {}, 'manualDetails')
          ? aiTaskMemory?.[taskId]?.manualDetails
          : null);
        const cleanedDetails = cleanTaskDetailsText(memoryDetails !== null ? memoryDetails : (t.comments || t.description || t.summary || ''));
        const commentLower = cleanedDetails.toLowerCase();
        const isGeneric = genericPhrases.some(phrase => commentLower.includes(phrase));
        
        if (cleanedDetails && !isGeneric) {
           contextHtml = `
             <div style="font-size: 12px; color: #334155; margin-top: 8px; background-color: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0;">
               <span style="font-weight: 800; color: #64748b; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em;">Детали решения:</span><br/>
               <div data-manual-task-details="true" data-task-id="${escapeHtml(taskId)}" data-task-title="${escapeHtml(t.title)}" style="margin-top: 4px; white-space: pre-wrap; line-height: 1.5;">${escapeHtml(cleanedDetails)}</div>
             </div>`;
        }

        // 2. Добавляем стикер Техдолга (если задача старая)
        const cycleDays = Number(t.cycleTime) || 0;
        let debtBadge = '';
        if (cycleDays >= 30) {
          debtBadge = `Старый долг: ${cycleDays} дн.`;
        } else {
          debtBadge = exportMode ? '' : `<span style="background-color: #f0fdf4; color: #10b981; border: 1px solid #bbf7d0; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em;">⚡ Свежая задача</span>`;
        }

        // 3. Сопоставляем с задачами руководства (умный и ЖЕСТКИЙ матчинг корней слов)
        const matchedProjectTask = findMatchingProjectTask(t);
        const isMgmtTask = Boolean(matchedProjectTask);

        let mgmtBadge = isMgmtTask 
          ? `Поручение руководства` 
          : '';

        // Выбираем цвет полоски (Синяя если от руководства, красная если долг, иначе базовая серая)
        const memoryEntry = getTaskMemoryEntry(t);
        const taskPriority = getTaskPriority(t);
        const isIdmTask = getTaskWorkType(t) === 'IDM';
        const memoryBorderColor = taskPriority === 'Impact' ? '#f59e0b' : (taskPriority === 'Routine' ? '#64748b' : '#334155');
        const memoryBgColor = taskPriority === 'Impact' ? '#fffbeb' : (taskPriority === 'Routine' ? '#f8fafc' : '#f8fafc');
        const memoryFrameColor = taskPriority === 'Impact' ? '#fde68a' : (taskPriority === 'Routine' ? '#cbd5e1' : '#cbd5e1');
        const borderColor = isIdmTask ? '#7c3aed' : (memoryEntry ? memoryBorderColor : (isMgmtTask ? '#2563eb' : (cycleDays >= 30 ? '#ef4444' : '#94a3b8')));
        const cardBgStyle = isIdmTask
          ? 'background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 8px; padding: 12px 12px 12px 14px;'
          : (memoryEntry ? `background: ${memoryBgColor}; border: 1px solid ${memoryFrameColor}; border-radius: 8px; padding: 12px 12px 12px 14px;` : '');
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

        if (exportMode) {
          const domain = getReportTaskDomain(t);
          const serviceType = isIdmTask ? 'IDM' : domain;
          const impactLabel = taskPriority === 'Impact' ? 'Важная работа' : (taskPriority === 'Routine' ? 'Фоновая поддержка' : 'Рабочее изменение');
          const detailsBlock = contextHtml
            ? `<div class="itil-task-details">${contextHtml}</div>`
            : '';
          const sideLines = [
            `Тип: ${impactLabel}`,
            `Трудоемкость: ${complexityMeta.label}`,
            isMgmtTask ? 'Поручение руководства' : '',
            cycleDays >= 30 ? `Старый долг: ${cycleDays} дн.` : ''
          ].filter(Boolean);
          return `
            <div class="itil-task-row">
              <div class="itil-task-main">
                <div class="itil-task-title">
                  <span>${escapeHtml(t.id)}</span>
                  ${escapeHtml(cleanReportTaskTitle(t.title))}
                </div>
                <div class="itil-task-meta">
                  <span>Исполнитель: <b>${escapeHtml(getFullName(t.assignee))}</b></span>
                  <span>Направление: <b>${escapeHtml(serviceType)}</b></span>
                  ${cycleDays > 0 ? `<span>Cycle Time: <b>${cycleDays} дн.</b></span>` : ''}
                </div>
                ${detailsBlock}
              </div>
              <div class="itil-task-side">
                ${sideLines.map(line => `<div>${escapeHtml(line)}</div>`).join('')}
              </div>
            </div>
          `;
        }

        return `
          <div style="${cardBgStyle} margin-bottom: 24px; border-left: 4px solid ${borderColor}; border-bottom: 1px solid #e2e8f0; padding-left: 14px; padding-bottom: 16px;">
             <div style="font-weight: 700; font-size: 14px; color: #0f172a; margin-bottom: 6px;">
               <span style="color: #3b82f6;">${t.id}</span>: ${cleanReportTaskTitle(t.title)}
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
              <span style="color: #7c3aed;">${escapeHtml(t.id)}</span>: ${escapeHtml(cleanReportTaskTitle(t.title))}
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
            title: 'Ключевые изменения',
            subtitle: 'Отмечены для показа выше: заметный результат и высокая трудоемкость',
            accent: '#f59e0b',
            background: '#fffbeb',
            tasks: importantHeavyTasks
          }),
          renderTaskGroup({
            title: 'Значимые работы',
            subtitle: 'Отмечены для основного отчета: результат важнее рутинного потока',
            accent: '#3b82f6',
            background: '#eff6ff',
            tasks: importantMediumTasks
          }),
          renderTaskGroup({
            title: 'Быстрые полезные изменения',
            subtitle: 'Небольшие задачи с понятным результатом для недели',
            accent: '#10b981',
            background: '#ecfdf5',
            tasks: importantLightTasks
          }),
          renderTaskGroup({
            title: 'Трудоемкие работы',
            subtitle: 'Сложные задачи, которые стоит видеть отдельно от обычного потока',
            accent: '#f97316',
            background: '#fff7ed',
            tasks: heavyTasks
          }),
          renderTaskGroup({
            title: 'Рабочий поток',
            subtitle: 'Регулярная выполненная работа без отдельного управленческого акцента',
            accent: '#64748b',
            background: '#f8fafc',
            tasks: standardTasks
          })
        ].join('');
      };

      const detailedTasksHtmlRendered = exportMode
        ? renderMainTaskGroups(keyDetailedTasks)
        : keyDetailedTasks.map(renderDetailedTaskCard).join('');

      const idmTasksHtmlRendered = '';

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
                  <span style="color: #94a3b8;"> — ${escapeHtml(cleanReportTaskTitle(t.title))}</span>
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
          <div>${escapeHtml(replaceLoginsWithNames(safeString(text).trim() || 'Нет данных')).replace(/\n/g, '<br/>')}</div>
        </div>
      `;

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
          .first-line-profile { display: inline-flex; align-items: center; justify-content: center; gap: 5px; border: 1px solid; border-radius: 999px; padding: 4px 8px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.03em; white-space: nowrap; }
          .first-line-profile-dot { width: 6px; height: 6px; border-radius: 999px; background: currentColor; opacity: .75; }
          .value-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-bottom: 20px; }
          .value-summary { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-left: 5px solid #10b981; border-radius: 10px; padding: 12px 14px; margin-bottom: 12px; }
          .value-summary-title { color: #0f172a; font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.03em; margin-bottom: 3px; }
          .value-summary-text { color: #475569; font-size: 12px; line-height: 1.45; }
          .value-summary-stats { flex-shrink: 0; display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
          .value-summary-stats span { display: inline-block; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 999px; padding: 4px 8px; color: #475569; font-size: 11px; font-weight: 800; }
          .value-summary-stats b { color: #0f172a; }
          .value-card { border: 1px solid #e2e8f0; border-top: 4px solid #64748b; border-radius: 8px; padding: 12px; min-height: 104px; }
          .task-group { border: 1px solid #e2e8f0; border-left: 4px solid var(--group-accent); border-radius: 10px; padding: 0; margin: 16px 0 18px 0; background: #ffffff !important; overflow: hidden; }
          .task-group-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; border-bottom: 1px solid #e2e8f0; padding: 12px 14px; margin-bottom: 0; background: #f8fafc; }
          .task-group-title { color: #0f172a; font-size: 14px; font-weight: 900; letter-spacing: 0; line-height: 1.25; }
          .task-group-subtitle { color: #64748b; font-size: 12px; margin-top: 2px; }
          .task-group-count { flex-shrink: 0; color: var(--group-accent); background: #ffffff; border: 1px solid #e2e8f0; border-radius: 999px; padding: 3px 9px; font-size: 12px; font-weight: 900; }
          .task-group-body { padding: 0; }
          .task-group-body > div:last-child { border-bottom: 0 !important; }
          .task-group-compact { box-shadow: none; }
          .trend-kpi-drop { display: inline-flex; align-items: center; gap: 6px; background: linear-gradient(135deg,#fff1f2 0%,#fee2e2 55%,#ffffff 100%); color: #991b1b; border: 1px solid #fca5a5; border-radius: 999px; padding: 3px 8px; font-size: 10px; font-weight: 900; letter-spacing: 0.02em; box-shadow: 0 0 0 1px rgba(239,68,68,0.08), 0 6px 14px rgba(239,68,68,0.16); white-space: nowrap; }
          .trend-kpi-grow { display: inline-flex; align-items: center; gap: 6px; background: linear-gradient(135deg,#ecfdf5 0%,#d1fae5 55%,#ffffff 100%); color: #047857; border: 1px solid #6ee7b7; border-radius: 999px; padding: 3px 8px; font-size: 10px; font-weight: 900; letter-spacing: 0.02em; box-shadow: 0 0 0 1px rgba(16,185,129,0.08), 0 6px 14px rgba(16,185,129,0.16); white-space: nowrap; }
          .trend-kpi-stable { display: inline-flex; align-items: center; gap: 6px; background: linear-gradient(135deg,#f8fafc 0%,#e0f2fe 55%,#ffffff 100%); color: #0369a1; border: 1px solid #7dd3fc; border-radius: 999px; padding: 3px 8px; font-size: 10px; font-weight: 900; letter-spacing: 0.02em; box-shadow: 0 0 0 1px rgba(14,165,233,0.08), 0 6px 14px rgba(14,165,233,0.14); white-space: nowrap; }
          .trend-kpi-drop span { text-transform: uppercase; }
          .trend-kpi-grow span { text-transform: uppercase; }
          .trend-kpi-stable span { text-transform: uppercase; }
          .itil-task-row { display: grid; grid-template-columns: minmax(0, 1fr) 170px; gap: 14px; padding: 14px 14px; border-bottom: 1px solid #e2e8f0; background: #ffffff; }
          .itil-task-row:nth-child(even) { background: #fbfdff; }
          .itil-task-main { min-width: 0; }
          .itil-task-title { color: #0f172a; font-size: 13px; line-height: 1.35; font-weight: 800; }
          .itil-task-title span { color: #64748b; font-weight: 900; margin-right: 6px; white-space: nowrap; }
          .itil-task-meta { display: flex; flex-wrap: wrap; gap: 6px 12px; color: #64748b; font-size: 11px; margin-top: 6px; }
          .itil-task-meta b { color: #334155; }
          .itil-task-side { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; color: #475569; font-size: 11px; line-height: 1.35; border-left: 1px solid #e2e8f0; padding-left: 12px; }
          .itil-task-details > div { margin-top: 9px !important; background: #f8fafc !important; border: 1px solid #e2e8f0 !important; border-radius: 8px !important; padding: 8px 10px !important; }
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

            <div class="section-title" style="--accent: #3b82f6;">Операционная сводка (KPI)</div>
            
            <div class="kpi-grid">
              <div class="kpi-card" style="border-top: 4px solid ${incColor};">
                <div style="font-size: 12px; color: #64748b; text-transform: uppercase; margin-bottom: 5px;">Инциденты (1 линия)</div>
                <div style="font-size: 24px; font-weight: bold; color: ${incColor}; margin-bottom: 5px;">${totalIncidents} <span style="font-size: 14px; font-weight: normal; color: #64748b;">решено</span>${incidentTrendHtml}</div>
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

            <div class="section-title" style="--accent: #0f172a;">1. Главное за неделю: Риски и Стратегия</div>
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
            </div>

            <div class="section-title" style="--accent: #10b981;">2. Контроль качества (1-я линия)</div>
            
            <h3 style="font-size: 14px; color: #475569; margin-bottom: 10px;">Эффективность смен (без учета тимлида)</h3>
            ${overallCsatHtml}
            ${generateTableHtml(['Администратор', 'Закрыто', 'Ср. Время', 'Профиль', 'CSAT'], incRows.slice(0, 5))}
            ${csatFeedbackHtml}

            <h3 style="font-size: 14px; color: #475569; margin-bottom: 10px; margin-top: 20px;">Ключевые системные проблемы (Топ-3)</h3>
            ${topIncidentsHtml || '<p style="font-size: 13px; color: #64748b;">Нет данных</p>'}
            ${slaBreachHtml}

            <h3 style="font-size: 14px; color: #475569; margin-bottom: 10px; margin-top: 20px;">Сводка по Телефонии</h3>
            ${telephonyHtml}
            ${telephonyInsightHtml}

            <div class="section-title" style="--accent: #a855f7;">3. Основные выполненные задачи недели</div>
            
            ${weekData.taskTypesDistribution && weekData.taskTypesDistribution.length > 0 ? `
              <h3 style="font-size: 14px; color: #475569; margin-bottom: 10px;">Распределение фокуса (Ценность vs Рутина)</h3>
              ${renderPieChart()}
              <div style="margin-bottom: 20px;"></div>
            ` : ''}

            <h3 style="font-size: 14px; color: #475569; margin-bottom: 10px;">Нагрузка администраторов (без учета тимлида)</h3>
            ${generateTableHtml(['Администратор', 'В работе (WIP)', 'Закрыто', 'Cycle Time', 'Профиль'], taskRows.slice(0, 7))}
            ${renderValueShowcase()}

            ${keyDetailedTasks.length > 0 ? `
              ${detailedTasksHtmlRendered}
            ` : (completedDetailedTasks.length > 0 ? '<p style="font-size: 13px; color: #64748b; font-style: italic;">Все закрытые задачи помечены как фоновая поддержка и вынесены в KTLO-блок.</p>' : '')}
            ${idmTasksHtmlRendered}

            <div class="section-title" style="--accent: #f59e0b;">4. Проекты и поручения руководства</div>
            <div id="management-tasks-container">
               ${generateTasksHtml()}
            </div>

            <div class="section-title" style="--accent: #0e7490;">5. Эффективность команды и матрица компетенций</div>
            ${renderResourceAuditReport()}

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

  useEffect(() => {
    const reportEl = reportRef.current;
    if (!reportEl) return;
    const handleManualDetailsBlur = (event) => {
      const detailsEl = event.target.closest?.('[data-manual-task-details]');
      if (!detailsEl || !reportEl.contains(detailsEl)) return;
      handleSaveManualTaskDetails(detailsEl.dataset.taskId, detailsEl.dataset.taskTitle, detailsEl.innerText);
    };
    reportEl.addEventListener('focusout', handleManualDetailsBlur);
    return () => reportEl.removeEventListener('focusout', handleManualDetailsBlur);
  }, [aiTaskMemory]);

  const collectManualTaskDetailsFromPreview = () => {
    if (!reportRef.current) return {};
    const detailsMap = {};
    reportRef.current.querySelectorAll('[data-manual-task-details]').forEach(detailsEl => {
      const taskId = safeString(detailsEl.dataset.taskId).trim();
      if (!taskId) return;
      detailsMap[taskId] = safeString(detailsEl.innerText).trim();
    });
    return detailsMap;
  };

  const persistManualTaskDetailsFromPreview = () => {
    const detailsMap = collectManualTaskDetailsFromPreview();
    const entries = Object.entries(detailsMap);
    if (!entries.length) return detailsMap;
    setAiTaskMemory(prev => {
      const next = { ...(prev || {}) };
      entries.forEach(([taskId, detailsText]) => {
        const existing = next[taskId] || {};
        const detailsEl = reportRef.current?.querySelector(`[data-manual-task-details][data-task-id="${CSS.escape(taskId)}"]`);
        next[taskId] = {
          ...existing,
          id: taskId,
          title: safeString(detailsEl?.dataset?.taskTitle).trim() || existing.title || taskId,
          manualDetails: detailsText,
          updatedAt: new Date().toISOString()
        };
      });
      return next;
    });
    setIsDirty(false);
    return detailsMap;
  };

  // Функция для очистки HTML перед экспортом
  const getCleanHtml = () => {
    if (!reportRef.current) return '';
    const manualDetailsMap = persistManualTaskDetailsFromPreview();
    const clone = document.createElement('div');
    clone.innerHTML = weekData.isReportFrozen && weekData.customReportHtml
      ? reportRef.current.innerHTML
      : getReportHtmlString({ exportMode: true, manualDetailsMap });
    
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
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Портфель поручений руководства (Глобальный)</h2>
              <p className="text-[11px] text-fuchsia-200/70 mt-0.5">Порядок сверху вниз задает важность в отчете; перетащи поручение за ручку слева, чтобы изменить порядок.</p>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4 mb-6">
              {tasksForThisWeek.map(t => {
                const weeksActive = getWeeksDiff(t.createdWeekKey, selectedKey);
                const isCompleted = isProjectTaskCompletedInWeek(t, selectedKey);
                const agingMeta = getProjectTaskAgingMeta(weeksActive);
                
                return (
                  <div
                    key={t.id}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => handleProjectTaskDrop(event, t.id)}
                    className={`p-4 rounded-lg border ${isCompleted ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-900/50 border-slate-700/50'} ${draggedProjectTaskId === t.id ? 'opacity-50 border-fuchsia-400' : ''} flex flex-col gap-3 relative transition-all`}
                  >
                    
                    <div className="absolute top-3 right-3 flex items-center gap-1">
                      <button onClick={() => handleDeleteProjectTask(t.id)} className="w-7 h-7 rounded border border-slate-700 bg-slate-950/60 text-slate-500 hover:text-red-400 hover:border-red-500/50 transition-colors flex items-center justify-center" title="Удалить навсегда">
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="flex gap-4 items-start pr-10">
                       <div
                         draggable
                         onDragStart={(event) => handleProjectTaskDragStart(event, t.id)}
                         onDragEnd={() => setDraggedProjectTaskId(null)}
                         className="mt-1 flex-shrink-0 w-6 h-10 rounded border border-slate-700 bg-slate-950/70 text-slate-500 hover:text-fuchsia-300 hover:border-fuchsia-500 cursor-grab active:cursor-grabbing flex items-center justify-center text-sm leading-none select-none"
                         title="Зажми и перетащи для изменения важности"
                       >
                         ⋮⋮
                       </div>
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
                                <option value="#3b82f6">🔵 В работе</option>
                                <option value="#10b981">🟢 В рабочем режиме</option>
                                <option value="#f59e0b">🟡 На контроле срока</option>
                                <option value="#ef4444">🔴 Риск / эскалация</option>
                                <option value="#0f172a">⚫ Пауза / ожидание</option>
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
                    <option value="#3b82f6">🔵 В работе</option>
                    <option value="#10b981">🟢 В рабочем режиме</option>
                    <option value="#f59e0b">🟡 На контроле срока</option>
                    <option value="#ef4444">🔴 Риск / эскалация</option>
                    <option value="#0f172a">⚫ Пауза / ожидание</option>
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

// --- WORD-ОРИЕНТИРОВАННЫЙ ОТЧЕТ ДЛЯ КОПИРОВАНИЯ РУКОВОДСТВУ ---

const WordReportGenerator = ({ weekData, historyKeys, weeksHistory, selectedKey, onWeekSelect, projectTasks, setProjectTasks, csatReviews, aiTaskMemory, setAiTaskMemory, wordReportConfig, setWordReportConfig, teamMetricsMemory, embedded = false }) => {
  const [copiedId, setCopiedId] = useState(null);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newProjectTaskTitle, setNewProjectTaskTitle] = useState('');
  const [newProjectTaskComment, setNewProjectTaskComment] = useState('');
  const [newProjectTaskColor, setNewProjectTaskColor] = useState('#3b82f6');
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const previewRef = useRef(null);
  const wordFontFamily = "'Aptos', 'Calibri', 'Segoe UI', Arial, sans-serif";

  const getSections = () => {
    const savedSections = Array.isArray(wordReportConfig?.sections) ? wordReportConfig.sections : [];
    const savedById = savedSections.reduce((acc, section) => {
      if (section?.id) acc[section.id] = section;
      return acc;
    }, {});
    const mergedDefaults = DEFAULT_WORD_REPORT_SECTIONS.map(section => {
      const saved = savedById[section.id] || {};
      if (section.id === 'other' && (!saved.title || safeString(saved.title).trim() === 'Прочее')) return { ...section, ...saved, title: section.title, color: section.color };
      return { ...section, ...saved };
    });
    const customSections = savedSections.filter(section => section?.id && !DEFAULT_WORD_REPORT_SECTIONS.some(defaultSection => defaultSection.id === section.id));
    return [...mergedDefaults, ...customSections].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
  };

  const updateSections = (updater) => {
    const currentSections = getSections();
    const nextSections = updater(currentSections).map((section, index) => ({ ...section, order: index }));
    setWordReportConfig({
      ...(wordReportConfig || {}),
      sections: nextSections,
      updatedAt: new Date().toISOString()
    });
  };

  const cleanWordReportText = (value) => safeString(value)
    .replace(/\[(HOST|PATH|DOMAIN|PHONE|IP|LOGIN|USER|EMAIL)\]/gi, '')
    .replace(/\bu\d{3,}\b/gi, '')
    .replace(/\bСНИЛС\b\s*[:№#-]?\s*/gi, '')
    .replace(/\b\d{3}[-\s]?\d{3}[-\s]?\d{3}[-\s]?\d{2}\b/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+([,.!?;:])/g, '$1')
    .trim();

  const inferWordSectionId = (task) => {
    const text = normalizeMetricText(`${task?.title || ''} ${task?.comments || ''} ${task?.description || ''} ${task?.domain || ''}`);
    const domain = normalizeMetricDomain(task?.domain || task?.competenceDomain || task?.serviceDomain || '', text);
    if (text.includes('pci') || text.includes('pcidss') || text.includes('аудит')) return 'pci-dss';
    if (text.includes('hrdwr') || text.includes('hardware') || text.includes('оборудован') || text.includes('ноутбук') || text.includes('пк ')) return 'hrdwr';
    if (domain === 'Zabbix / мониторинг') return 'zabbix';
    if (text.includes('windows') || text.includes('винд') || text.includes('ос ') || text.includes('обновлен')) return 'windows';
    if (domain === 'IDM') return 'idm';
    if (domain === 'Серверная инфраструктура' || domain === 'Citrix / фермы') return 'server';
    if (domain === 'Рабочие места / ПО' || domain === 'Принтера') return 'workplace';
    if (domain === 'Сеть / BinkD') return 'network';
    if (domain === 'Работы по Лотус') return 'lotus';
    if (domain === 'Почта / Мессенджеры') return 'mail';
    return 'other';
  };

  const getTaskMemory = (task, overrides = {}) => {
    const taskId = safeString(task?.id).trim();
    return { ...(taskId ? aiTaskMemory?.[taskId] || {} : {}), ...(taskId ? overrides[taskId] || {} : {}) };
  };

  const getWordTaskSectionId = (task, overrides = {}) => {
    const taskId = safeString(task?.id).trim();
    const memory = getTaskMemory(task, overrides);
    return safeString(memory.wordSection || '').trim() || inferWordSectionId(task) || 'other';
  };

  const getWordTaskTitle = (task, overrides = {}) => {
    const memory = getTaskMemory(task, overrides);
    return cleanWordReportText(memory.wordTitle || task?.title || task?.summary || task?.id || 'Задача');
  };

  const getWordTaskDetails = (task, overrides = {}) => {
    const memory = getTaskMemory(task, overrides);
    const source = memory.wordDetails ?? task?.comments ?? task?.description ?? task?.summary ?? '';
    const cleaned = cleanWordReportText(source);
    const lowered = cleaned.toLowerCase();
    const blockedPhrases = [
      'в работе',
      'нет данных',
      'ожидание данных',
      'добавьте короткое описание результата',
      'согласно заявке',
      'стандартная процедура',
      'готово',
      'решено'
    ];
    if (!cleaned || cleaned.length <= 8) return '';
    if (blockedPhrases.some(phrase => lowered === phrase || lowered.includes(phrase))) return '';
    const compact = cleaned
      .split(/\n+/)
      .map(line => line.trim())
      .filter(Boolean)
      .find(line => line.length > 12) || cleaned;
    const limit = 165;
    return compact.length > limit ? `${compact.slice(0, limit).trim()}...` : compact;
  };

  const getWordTaskOrder = (task, overrides = {}) => {
    const memory = getTaskMemory(task, overrides);
    const order = Number(memory.wordOrder);
    return Number.isFinite(order) ? order : 9999;
  };

  const isClosedTask = (task) => {
    const status = safeString(task?.status).toLowerCase();
    return Boolean(task?.resolved) || ['закрыт', 'готово', 'resolved', 'завершен', 'done'].some(word => status.includes(word));
  };

  const isDisplayableTask = (task) => {
    if (!task) return false;
    const assignee = getFullName(task.assignee);
    if (!assignee || assignee === 'Не назначен' || assignee === 'Без автора' || assignee === 'Без исполнителя') return false;
    return isClosedTask(task);
  };

  const getWordTasks = (overrides = {}) => {
    const sections = getSections();
    const sectionIds = new Set(sections.map(section => section.id));
    return (weekData?.detailedTasks || [])
      .filter(isDisplayableTask)
      .map((task, index) => {
        const taskId = safeString(task.id || task.key || task.issueKey || `task-${index}`).trim();
        const sectionId = sectionIds.has(getWordTaskSectionId(task, overrides)) ? getWordTaskSectionId(task, overrides) : 'other';
        return {
          ...task,
          id: taskId,
          wordTitle: getWordTaskTitle(task, overrides),
          wordDetails: getWordTaskDetails(task, overrides),
          wordSectionId: sectionId,
          wordOrder: getWordTaskOrder(task, overrides),
          originalIndex: index
        };
      })
      .sort((a, b) => {
        if (a.wordSectionId !== b.wordSectionId) return 0;
        if (a.wordOrder !== b.wordOrder) return a.wordOrder - b.wordOrder;
        return a.originalIndex - b.originalIndex;
      });
  };

  const handleSaveWordTaskField = (taskId, title, field, value) => {
    const cleanId = safeString(taskId).trim();
    if (!cleanId) return;
    setAiTaskMemory(prev => {
      const previous = (prev || {})[cleanId] || {};
      return {
        ...(prev || {}),
        [cleanId]: {
          ...previous,
          id: cleanId,
          title: safeString(title).trim() || previous.title || cleanId,
          [field]: field === 'wordDetails' || field === 'wordTitle' ? cleanWordReportText(value) : value,
          updatedAt: new Date().toISOString()
        }
      };
    });
  };

  const persistWordPreviewEdits = () => {
    const overrides = {};
    const projectOverrides = {};
    if (!previewRef.current) return { taskOverrides: overrides, projectOverrides };
    previewRef.current.querySelectorAll('[data-word-task-id]').forEach(taskEl => {
      const taskId = safeString(taskEl.dataset.wordTaskId).trim();
      if (!taskId) return;
      const titleEl = taskEl.querySelector('[data-word-task-title]');
      const detailsEl = taskEl.querySelector('[data-word-task-details]');
      const sectionSelect = taskEl.querySelector('[data-word-task-section]');
      overrides[taskId] = {
        wordTitle: cleanWordReportText(titleEl?.innerText || ''),
        wordDetails: cleanWordReportText(detailsEl?.innerText || ''),
        wordSection: safeString(sectionSelect?.value).trim(),
        updatedAt: new Date().toISOString()
      };
    });
    previewRef.current.querySelectorAll('[data-word-project-id]').forEach(taskEl => {
      const taskId = safeString(taskEl.dataset.wordProjectId).trim();
      if (!taskId) return;
      const titleEl = taskEl.querySelector('[data-word-project-title]');
      const commentEl = taskEl.querySelector('[data-word-project-comment]');
      projectOverrides[taskId] = {
        title: cleanWordReportText(titleEl?.innerText || ''),
        comment: cleanWordReportText(commentEl?.innerText || '')
      };
    });
    const entries = Object.entries(overrides);
    if (entries.length) {
      setAiTaskMemory(prev => {
        const next = { ...(prev || {}) };
        entries.forEach(([taskId, patch]) => {
          next[taskId] = { ...(next[taskId] || {}), id: taskId, title: patch.wordTitle || next[taskId]?.title || taskId, ...patch };
        });
        return next;
      });
    }
    const projectEntries = Object.entries(projectOverrides);
    if (projectEntries.length && setProjectTasks) {
      setProjectTasks(prev => (prev || []).map(task => {
        const patch = projectOverrides[task.id];
        return patch ? { ...task, ...patch } : task;
      }));
    }
    return { taskOverrides: overrides, projectOverrides };
  };

  const handleMoveTaskToSection = (task, sectionId) => {
    const sectionTasksCount = getWordTasks().filter(item => item.wordSectionId === sectionId).length;
    handleSaveWordTaskField(task.id, task.wordTitle || task.title, 'wordSection', sectionId);
    handleSaveWordTaskField(task.id, task.wordTitle || task.title, 'wordOrder', sectionTasksCount);
  };

  const handleTaskDragStart = (event, taskId) => {
    setDraggedTaskId(taskId);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', taskId);
  };

  const handleTaskDrop = (event, sectionId, targetTaskId = null) => {
    event.preventDefault();
    event.stopPropagation();
    const sourceId = draggedTaskId || event.dataTransfer.getData('text/plain');
    if (!sourceId) return;
    const tasks = getWordTasks();
    const sourceTask = tasks.find(task => task.id === sourceId);
    if (!sourceTask) return;
    const sectionTasks = tasks.filter(task => task.wordSectionId === sectionId && task.id !== sourceId);
    const targetIndex = targetTaskId ? Math.max(0, sectionTasks.findIndex(task => task.id === targetTaskId)) : sectionTasks.length;
    sectionTasks.splice(targetIndex < 0 ? sectionTasks.length : targetIndex, 0, { ...sourceTask, wordSectionId: sectionId });
    setAiTaskMemory(prev => {
      const next = { ...(prev || {}) };
      sectionTasks.forEach((task, index) => {
        next[task.id] = {
          ...(next[task.id] || {}),
          id: task.id,
          title: task.wordTitle || task.title || task.id,
          wordSection: sectionId,
          wordOrder: index,
          updatedAt: new Date().toISOString()
        };
      });
      return next;
    });
    setDraggedTaskId(null);
  };

  const handleAddSection = () => {
    const title = safeString(newSectionTitle).trim();
    if (!title) return;
    const id = `custom-${Date.now()}`;
    updateSections(sections => [...sections, { id, title, color: '#334155', hidden: false, order: sections.length }]);
    setNewSectionTitle('');
  };

  const moveSection = (sectionId, direction) => {
    updateSections(sections => {
      const list = [...sections];
      const index = list.findIndex(section => section.id === sectionId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= list.length) return sections;
      [list[index], list[target]] = [list[target], list[index]];
      return list;
    });
  };

  const getProjectTaskStatusMeta = (task, isCompleted) => {
    if (isCompleted || task?.status === 'completed') return { label: 'Готово', color: '#166534', bg: '#dcfce7', border: '#86efac' };
    const color = safeString(task?.color).toLowerCase();
    if (color === '#ef4444') return { label: 'Риск / эскалация', color: '#991b1b', bg: '#fee2e2', border: '#fecaca' };
    if (color === '#f59e0b') return { label: 'На контроле срока', color: '#92400e', bg: '#fef3c7', border: '#fde68a' };
    if (color === '#10b981') return { label: 'В рабочем режиме', color: '#047857', bg: '#d1fae5', border: '#a7f3d0' };
    return { label: 'В работе', color: '#1d4ed8', bg: '#dbeafe', border: '#bfdbfe' };
  };

  const compareWeekKeysLocal = (leftKey, rightKey) => {
    const [leftYear, leftWeek] = safeString(leftKey).split('-').map(Number);
    const [rightYear, rightWeek] = safeString(rightKey).split('-').map(Number);
    if (!leftYear || !leftWeek || !rightYear || !rightWeek) return 0;
    if (leftYear !== rightYear) return leftYear - rightYear;
    return leftWeek - rightWeek;
  };

  const isProjectTaskVisible = (task) => {
    const createdKey = task?.createdWeekKey || selectedKey;
    if (compareWeekKeysLocal(createdKey, selectedKey) > 0) return false;
    if (task?.completedWeekKey) return compareWeekKeysLocal(selectedKey, task.completedWeekKey) <= 0;
    return task?.status === 'active';
  };

  const getManagementTasks = (projectOverrides = {}) => (projectTasks || [])
    .filter(isProjectTaskVisible)
    .map(task => ({ ...task, ...(projectOverrides?.[task.id] || {}) }))
    .sort((a, b) => (Number(a.priority) || 0) - (Number(b.priority) || 0));

  const getManagementTaskGroups = (projectOverrides = {}) => {
    const tasks = getManagementTasks(projectOverrides);
    return {
      done: tasks.filter(task => task.status === 'completed'),
      active: tasks.filter(task => task.status !== 'completed')
    };
  };

  const handleUpdateProjectTaskField = (taskId, field, value) => {
    if (!setProjectTasks) return;
    const cleanId = safeString(taskId).trim();
    setProjectTasks(prev => (prev || []).map(task => task.id === cleanId ? { ...task, [field]: cleanWordReportText(value) } : task));
  };

  const handleMoveProjectTaskPriority = (taskId, direction) => {
    if (!setProjectTasks) return;
    const visibleTasks = getManagementTasks();
    const currentIndex = visibleTasks.findIndex(task => task.id === taskId);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= visibleTasks.length) return;
    const reordered = [...visibleTasks];
    [reordered[currentIndex], reordered[targetIndex]] = [reordered[targetIndex], reordered[currentIndex]];
    const orderMap = new Map(reordered.map((task, index) => [task.id, index]));
    setProjectTasks(prev => (prev || []).map(task => orderMap.has(task.id) ? { ...task, priority: orderMap.get(task.id) } : task));
  };

  const handleUpdateProjectTaskStatus = (taskId, status) => {
    if (!setProjectTasks) return;
    const cleanStatus = status === 'completed' ? 'completed' : 'active';
    setProjectTasks(prev => (prev || []).map(task => {
      if (task.id !== taskId) return task;
      return {
        ...task,
        status: cleanStatus,
        completedWeekKey: cleanStatus === 'completed' ? (task.completedWeekKey || selectedKey) : null
      };
    }));
  };

  const handleDeleteProjectTask = (taskId) => {
    if (!setProjectTasks) return;
    setProjectTasks(prev => (prev || []).filter(task => task.id !== taskId).map((task, index) => ({ ...task, priority: index })));
  };

  const handleAddWordProjectTask = () => {
    if (!setProjectTasks) return;
    const title = cleanWordReportText(newProjectTaskTitle);
    if (!title) return;
    const nextTask = {
      id: `pt-${Date.now()}`,
      title,
      comment: cleanWordReportText(newProjectTaskComment),
      color: newProjectTaskColor,
      status: 'active',
      createdWeekKey: selectedKey,
      priority: (projectTasks || []).length,
      createdAt: new Date().toISOString()
    };
    setProjectTasks(prev => [...(prev || []), nextTask]);
    setNewProjectTaskTitle('');
    setNewProjectTaskComment('');
    setNewProjectTaskColor('#3b82f6');
  };

  const getTeamTaskLeaders = () => {
    const fromTasks = getWordTasks().reduce((acc, task) => {
      const name = getFullName(task.assignee);
      if (!acc[name]) acc[name] = { name, closed: 0 };
      acc[name].closed += 1;
      return acc;
    }, {});
    const taskRows = Object.values(fromTasks);
    const performerRows = Object.entries(weekData?.taskPerformers || {}).map(([name, row]) => ({
      name: getFullName(row?.name || row?.assignee || name),
      closed: Number(row?.closed || row?.count || row?.total || 0)
    }));
    const rows = taskRows.length ? taskRows : performerRows;
    return rows
      .filter(row => row.name && row.name !== TEAM_LEAD_NAME && !EXCLUDED_USER_IDS.includes(row.name))
      .sort((a, b) => b.closed - a.closed)
      .slice(0, 5);
  };

  const getIncidentLeaders = () => (weekData?.topPerformers || [])
    .map(item => ({ name: getFullName(item.name || item.assignee), closed: Number(item.closed || item.count || item.total || 0) }))
    .filter(item => item.name)
    .sort((a, b) => b.closed - a.closed)
    .slice(0, 5);

  const getTelephonySummary = () => {
    const rows = Array.isArray(weekData?.telephonyData) ? weekData.telephonyData : [];
    const total = rows.reduce((sum, row) => sum + (Number(row.total || row.calls || row.all || row.answered || 0) || 0), 0);
    const missed = rows.reduce((sum, row) => sum + (Number(row.missed || row.lost || row.notAnswered || 0) || 0), 0);
    return { total, missed, availability: total > 0 ? Math.round(((total - missed) / total) * 100) : null };
  };

  const getFirstLineRows = () => {
    const telephonyByName = (Array.isArray(weekData?.telephonyData) ? weekData.telephonyData : []).reduce((acc, row) => {
      const name = getFullName(row.name || row.employee || row.operator || row.assignee);
      if (name) acc[name] = row;
      return acc;
    }, {});
    return (weekData?.topPerformers || [])
      .map(item => {
        const name = getFullName(item.name || item.assignee);
        const phone = telephonyByName[name] || {};
        const totalCalls = Number(phone.total || phone.calls || phone.all || phone.answered || 0) || 0;
        const missed = Number(phone.missed || phone.lost || phone.notAnswered || 0) || 0;
        const availability = totalCalls > 0 ? Math.round(((totalCalls - missed) / totalCalls) * 100) : null;
        return {
          name,
          closed: Number(item.closed || item.count || item.total || 0) || 0,
          avgTime: Number(item.avgTime || item.avgResolution || item.averageTime || item.time || 0) || 0,
          csat: Number(item.csat || item.csatAverage || item.avgCsat || 0) || null,
          calls: totalCalls,
          missed,
          availability
        };
      })
      .filter(item => item.name && !THIRD_LINE_ADMINS.includes(item.name) && !isExcludedFromFirstLineReport(item.name))
      .sort((a, b) => b.closed - a.closed)
      .slice(0, 6);
  };

  const getCsatValue = () => {
    const direct = Number(weekData?.csatAverage || weekData?.csat || weekData?.avgCsat);
    if (Number.isFinite(direct) && direct > 0) return direct.toFixed(1);
    const details = Array.isArray(weekData?.csatDetails) ? weekData.csatDetails : [];
    const values = details.map(item => Number(item.rating || item.score || item.value)).filter(Number.isFinite);
    if (!values.length) return '5.0';
    return (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1);
  };

  const getWordCsatComments = () => {
    const directDetails = Array.isArray(weekData?.csatDetails) ? weekData.csatDetails : [];
    const performerDetails = (weekData?.topPerformers || []).flatMap(performer => (
      Array.isArray(performer?.csatDetails)
        ? performer.csatDetails.map(item => ({ ...item, assignee: item.assignee || item.name || performer.name || performer.assignee }))
        : []
    ));
    const details = [...directDetails, ...performerDetails];
    const rows = details.map((item, index) => {
      const id = safeString(item.id || item.key || item.issueKey || item.incidentId || item.ticket || item.taskId || `csat-${index}`).trim();
      const reviewText = cleanWordReportText(csatReviews?.[id] || item.comment || item.review || item.feedback || item.text || item.message || item.csatComment || '');
      if (/Комментарий\s+Оценка\s+Ключ\s+Агенты\s+Получено/i.test(reviewText)) return null;
      const rating = Number(item.rating || item.score || item.value || item.csat || item.mark);
      const title = cleanWordReportText(item.theme || item.title || item.summary || item.taskTitle || item.subject || id);
      const assignee = getFullName(item.assignee || item.executor || item.admin || item.performer || item.name || item.owner || '');
      return {
        id,
        rating: Number.isFinite(rating) ? rating : null,
        title,
        assignee: assignee || 'Не указан',
        comment: reviewText
      };
    }).filter(item => item?.comment);
    const seen = new Set();
    return rows.filter(item => {
      const key = `${item.id}-${item.comment}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const getPreviousWeekData = () => {
    const sortedKeys = [...(historyKeys || [])].sort();
    const currentIndex = sortedKeys.indexOf(selectedKey);
    const previousKey = currentIndex > 0 ? sortedKeys[currentIndex - 1] : null;
    return previousKey ? weeksHistory?.[previousKey] : null;
  };

  const getWordKpiSummary = () => {
    const previousWeekData = getPreviousWeekData();
    const incidentsClosed = Number(weekData?.incidentsClosed) || 0;
    const previousIncidents = Number(previousWeekData?.incidentsClosed) || 0;
    const incidentTrend = previousWeekData ? incidentsClosed - previousIncidents : 0;
    const tasksClosed = (Number(weekData?.sprintCompleted) || 0) + (Number(weekData?.urgentCompleted) || 0) + (Number(weekData?.backlogCompleted) || 0);
    const slaSnapshot = getWordSlaSnapshot();
    const primaryRate = incidentsClosed > 0 ? slaSnapshot.primaryCount / incidentsClosed : 0;
    const resolutionRate = incidentsClosed > 0 ? slaSnapshot.resolutionCount / incidentsClosed : 0;
    const trainingSla = Number(weekData?.trainingSection?.slaFirstReaction?.successRatePercent);
    const slaFirstReactionPercent = Number.isFinite(trainingSla) && trainingSla > 0
      ? Math.round(trainingSla * 10) / 10
      : (incidentsClosed > 0 ? Math.round(Math.max(0, 100 - (primaryRate * 100)) * 10) / 10 : 0);
    const trainingResolutionSla = Number(weekData?.trainingSection?.slaResolution?.successRatePercent ?? weekData?.trainingSection?.resolutionSla?.successRatePercent);
    const slaResolutionPercent = Number.isFinite(trainingResolutionSla) && trainingResolutionSla > 0
      ? Math.round(trainingResolutionSla * 10) / 10
      : (incidentsClosed > 0 ? Math.round(Math.max(0, 100 - (resolutionRate * 100)) * 10) / 10 : 0);
    const returnsRate = Number(weekData?.reopenRate || weekData?.returnRate || weekData?.returnsRate || 0) || 0;
    const backlog = Number(weekData?.backlog || weekData?.backlogTotal || 0) || 0;
    const backlogOld30 = Number(weekData?.backlogOld30) || 0;
    const inflow = Number(weekData?.inflowThisWeek) || 0;
    return {
      incidentsClosed,
      incidentTrend,
      tasksClosed,
      slaFirstReactionPercent,
      slaResolutionPercent,
      slaPrimaryCount: slaSnapshot.primaryCount,
      slaResolutionCount: slaSnapshot.resolutionCount,
      returnsRate,
      queue: Number(weekData?.incidentsQueue) || 0,
      inflow,
      backlog,
      backlogOld30
    };
  };

  const getWordKpiCards = () => {
    const summary = getWordKpiSummary();
    const incidentTrendText = summary.incidentTrend === 0
      ? 'без изменений'
      : `${summary.incidentTrend > 0 ? '+' : '-'}${Math.abs(summary.incidentTrend)} к прошлой неделе`;
    return [
      {
        key: 'incidents',
        title: 'Инциденты (1 линия)',
        value: summary.incidentsClosed,
        suffix: 'решено',
        accent: '#10b981',
        progress: Math.min(100, Math.max(8, Math.round((summary.incidentsClosed / Math.max(summary.incidentsClosed + summary.queue, 1)) * 100))),
        hint: `Очередь: ${summary.queue}. Динамика: ${incidentTrendText}`,
        trend: '',
        trendTone: summary.incidentTrend > 0 ? 'red' : (summary.incidentTrend < 0 ? 'green' : 'slate')
      },
      {
        key: 'tasks',
        title: 'Задачи (инфра)',
        value: summary.tasksClosed,
        suffix: 'закрыто',
        accent: '#3b82f6',
        progress: Math.min(100, Math.max(8, Math.round((summary.tasksClosed / Math.max(summary.tasksClosed + summary.backlog, 1)) * 100))),
        hint: `Приток: ${summary.inflow} новых | Бэклог: ${summary.backlog} (>30д: ${summary.backlogOld30})`,
        trend: '',
        trendTone: 'slate'
      },
      {
        key: 'sla',
        title: 'Взятие в работу ≤15 мин',
        value: summary.slaFirstReactionPercent,
        suffix: '%',
        accent: summary.slaFirstReactionPercent >= 95 ? '#10b981' : (summary.slaFirstReactionPercent >= 80 ? '#f59e0b' : '#ef4444'),
        progress: Math.min(100, Math.max(0, summary.slaFirstReactionPercent)),
        hint: `Цель: 95%. Просрочек взятия в работу: ${summary.slaPrimaryCount} | Решение в срок: ${summary.slaResolutionPercent}%`,
        trend: '',
        trendTone: 'slate'
      }
    ];
  };

  const getTrendColor = (tone) => {
    if (tone === 'red') return '#dc2626';
    if (tone === 'green') return '#059669';
    return '#64748b';
  };

  const getWordSystemProblems = () => {
    const total = Number(weekData?.incidentsClosed) || 0;
    const colors = ['#ef4444', '#f97316', '#f59e0b'];
    return (Array.isArray(weekData?.topIncidents) ? weekData.topIncidents : [])
      .slice(0, 3)
      .map((item, index) => {
        const count = Number(item.count || item.total || item.value || 0) || 0;
        return {
          title: cleanWordReportText(item.name || item.title || item.category || `Проблема ${index + 1}`),
          count,
          percent: total > 0 ? Math.round((count / total) * 100) : 0,
          description: cleanWordReportText(item.analysis || item.summary || item.recommendation || item.recommendedAction || ''),
          color: colors[index] || '#64748b'
        };
      })
      .filter(item => item.title);
  };

  const getWordSlaSnapshot = () => {
    const details = Array.isArray(weekData?.slaBreachDetails) ? weekData.slaBreachDetails : [];
    const metrics = Array.isArray(weekData?.slaMetrics) ? weekData.slaMetrics : [];
    const isPrimary = (value) => /создан|момента|взят|реакц|15/i.test(safeString(value));
    const isResolution = (value) => /решен|решени|resolution/i.test(safeString(value));
    const primaryDetails = details.filter(item => isPrimary(item.slaType || item.metric || item.type || item.name));
    const resolutionDetails = details.filter(item => isResolution(item.slaType || item.metric || item.type || item.name));
    const primaryMetric = metrics.find(item => isPrimary(item.name || item.metric || item.type || item.slaType));
    const resolutionMetric = metrics.find(item => isResolution(item.name || item.metric || item.type || item.slaType));
    const getOverdueMinutes = (item) => Number(item?.overdueMin ?? item?.overdueMinutes ?? item?.overdue ?? item?.avgOverdueMin ?? 0) || 0;
    const averageOverdue = (items) => {
      const values = items.map(getOverdueMinutes).filter(value => value > 0);
      return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
    };
    const getMetricAverage = (metric, fallbackDetails) => Number(
      metric?.avgOverdueMin ??
      metric?.avgOverdue ??
      metric?.avgDelay ??
      metric?.avgMinutes ??
      metric?.average ??
      0
    ) || averageOverdue(fallbackDetails);
    const primaryCount = primaryDetails.length || Number(primaryMetric?.violations || primaryMetric?.count || primaryMetric?.value || 0) || 0;
    const resolutionCount = resolutionDetails.length || Number(resolutionMetric?.violations || resolutionMetric?.count || resolutionMetric?.value || 0) || 0;
    const primaryAvg = getMetricAverage(primaryMetric, primaryDetails);
    const resolutionAvg = getMetricAverage(resolutionMetric, resolutionDetails);
    const simpleShare = primaryDetails.length
      ? Math.round((primaryDetails.filter(item => /прост/i.test(safeString(item.complexity || item.size || item.classification))).length / primaryDetails.length) * 100)
      : 0;
    const complexShare = primaryDetails.length
      ? Math.round((primaryDetails.filter(item => /слож/i.test(safeString(item.complexity || item.size || item.classification))).length / primaryDetails.length) * 100)
      : 0;
    const heat = primaryCount >= 30 ? { label: 'Критично', color: '#ef4444', bg: '#fef2f2', border: '#fca5a5', width: 88 } :
      (primaryCount > 0 || simpleShare >= 30 ? { label: 'Риск', color: '#f59e0b', bg: '#fffbeb', border: '#fbbf24', width: 68 } : { label: 'Норма', color: '#059669', bg: '#ecfdf5', border: '#6ee7b7', width: 18 });
    const diagnosis = primaryCount > 0
      ? (simpleShare >= 30
        ? `Высокая доля простых первичных просрочек (${simpleShare}%). Это похоже на проблему реакции линии: обращения не брали в работу, а не были сложными.`
        : 'Просрочки смешанные: нужно смотреть домены и смены, без вывода только по одному человеку.')
      : 'Нарушений основного SLA не выявлено.';
    return { primaryCount, resolutionCount, primaryAvg, resolutionAvg, simpleShare, complexShare, heat, diagnosis };
  };

  const getWordReportHtmlString = (options = {}) => {
    const exportMode = Boolean(options.exportMode);
    const htmlCopyMode = Boolean(options.htmlCopyMode);
    const tasksClipboardMode = Boolean(options.tasksClipboardMode);
    const overrides = options.memoryOverrides || {};
    const projectOverrides = options.projectOverrides || {};
    const sections = getSections().filter(section => !section.hidden);
    const tasks = getWordTasks(overrides);
    const tasksBySection = sections.map(section => ({
      ...section,
      tasks: tasks.filter(task => task.wordSectionId === section.id)
    })).filter(section => section.tasks.length > 0 || !exportMode);
    const htmlCopyTasksBySection = exportMode
      ? tasksBySection.filter(section => section.tasks.length > 0)
      : tasksBySection;
    const compactTasksBySection = (() => {
      const filled = tasksBySection.filter(section => section.tasks.length > 0);
      const major = filled.filter(section => section.tasks.length > 1);
      const minor = filled.filter(section => section.tasks.length === 1);
      const minorTasks = minor.flatMap(section => section.tasks);
      const compact = [...major];
      if (minorTasks.length) {
        compact.push({
          id: 'planning-other-done',
          title: 'Прочие выполненные задачи',
          color: '#3b82f6',
          tasks: minorTasks
        });
      }
      return exportMode ? compact : tasksBySection;
    })();
    const managementGroups = getManagementTaskGroups(projectOverrides);
    const taskLeaders = getTeamTaskLeaders();
    const incidentLeaders = getIncidentLeaders();
    const firstLineRows = getFirstLineRows();
    const telephony = getTelephonySummary();
    const csatComments = getWordCsatComments();
    const badCsatComments = csatComments.filter(item => item.rating !== null && item.rating < 4);
    const systemProblems = getWordSystemProblems();
    const slaSnapshot = getWordSlaSnapshot();
    const weekTitle = `Неделя ${weekData?.weekNumber || ''}${weekData?.dates ? ` (${weekData.dates})` : ''}`;
    const kpiCards = getWordKpiCards();

    const renderKpi = () => `
      <table style="width:100%; border-collapse:separate; border-spacing:12px 0; margin: 0 0 20px 0;">
        <tr>
          ${kpiCards.map(card => `
            <td style="width:33.33%; border:1px solid #dbeafe; border-top:4px solid ${card.accent}; border-radius:10px; padding:14px; background:#ffffff; vertical-align:top; box-shadow:0 3px 10px rgba(15,23,42,0.10);">
              <div style="font-size:11px; color:#64748b; text-transform:uppercase; letter-spacing:0.04em; margin-bottom:12px; font-weight:900;">${escapeHtml(card.title)}</div>
              <div style="margin-bottom:8px;">
                <span style="font-size:24px; color:${card.accent}; font-weight:900;">${escapeHtml(card.value)}</span>
                <span style="font-size:12px; color:#475569;"> ${escapeHtml(card.suffix)}</span>
                ${card.trend ? `<span style="font-size:11px; color:${getTrendColor(card.trendTone)}; font-weight:800; margin-left:4px;">${escapeHtml(card.trend)}</span>` : ''}
              </div>
              <div style="font-size:12px; color:#475569; margin-bottom:10px;">${escapeHtml(card.hint)}</div>
              <div style="height:5px; background:#e2e8f0; border-radius:99px; overflow:hidden;">
                <div style="height:5px; width:${card.progress}%; background:${card.accent}; border-radius:99px;"></div>
              </div>
            </td>
        `).join('')}
        </tr>
      </table>`;

    const renderTask = (task) => {
      return `
      <div style="padding:9px 10px; border-top:1px solid #dbeafe; background:#ffffff;">
        <div style="font-weight:900; color:#0f172a; font-size:13px; line-height:1.35;">${escapeHtml(task.wordTitle)};</div>
        ${task.wordDetails ? `<div style="font-size:12px; color:#475569; margin-top:3px; line-height:1.45;">${escapeHtml(task.wordDetails)}</div>` : ''}
      </div>`;
    };

    const wordCopyFontFamily = "Aptos, Calibri, Arial, sans-serif";
    const wordCopyFontStyle = `font-family:${wordCopyFontFamily}; mso-ascii-font-family:Aptos; mso-hansi-font-family:Aptos;`;

    const renderHtmlCopyTask = (task) => `
      <div style="margin:0 0 5px 0; padding:0; ${wordCopyFontStyle} color:#0f172a; font-size:12px; line-height:1.25; mso-line-height-rule:exactly;">
        <p style="margin:0; padding:0; ${wordCopyFontStyle} font-size:12px; line-height:1.25; mso-line-height-rule:exactly;"><font face="Aptos, Calibri, Arial" style="font-size:12px; color:#0f172a;"><b>${escapeHtml(task.wordTitle)};</b></font></p>
        ${task.wordDetails ? `<p style="margin:0; padding:0; ${wordCopyFontStyle} font-size:11px; font-weight:400; color:#475569; line-height:1.25; mso-line-height-rule:exactly;"><font face="Aptos, Calibri, Arial" style="font-size:11px; color:#475569;">${escapeHtml(task.wordDetails)}</font></p>` : ''}
      </div>`;

    const renderHtmlCopyTaskSections = () => htmlCopyTasksBySection.map((section, index) => `
      ${index > 0 ? `<div style="height:8px; line-height:8px; font-size:1px; margin:0; padding:0;">&nbsp;</div>` : ''}
      <div style="margin:0 0 10px 0; padding:0; border:0; background:#ffffff; ${wordCopyFontStyle}">
        <div style="margin:0 0 4px 0; padding:3px 8px; background:#eff6ff; ${wordCopyFontStyle} color:#1d4ed8; text-transform:uppercase; font-size:11px; line-height:1.15; mso-line-height-rule:exactly;">
          <font face="Aptos, Calibri, Arial" style="font-size:11px; color:#1d4ed8;"><b>${escapeHtml(section.title)}</b></font>
        </div>
        <div style="margin:0; padding:0 8px 1px 8px; background:#ffffff; ${wordCopyFontStyle}">
          ${section.tasks.length ? section.tasks.map(task => renderHtmlCopyTask(task)).join('') : `<p style="margin:0; padding:0; ${wordCopyFontStyle} color:#94a3b8; font-size:11px;"><font face="Aptos, Calibri, Arial" style="font-size:11px; color:#94a3b8;">Нет задач в разделе</font></p>`}
        </div>
      </div>
    `).join('');

    const renderTaskSections = () => compactTasksBySection.map(section => `
      <div style="border:1px solid #bfdbfe; border-left:5px solid #3b82f6; border-radius:8px; margin:0 0 12px 0; overflow:hidden;">
        <div style="background:#eff6ff; padding:7px 10px; font-weight:900; color:#1d4ed8; text-transform:uppercase; font-size:12px; letter-spacing:0.03em;">
          ${escapeHtml(section.title)}
        </div>
        ${section.tasks.length ? section.tasks.map(task => renderTask(task)).join('') : `<div style="padding:8px 10px; color:#94a3b8; font-size:12px; background:#ffffff;">Нет задач в разделе</div>`}
      </div>
    `).join('');

    const renderHtmlCopyManagementGroup = (title, tasks, isDoneGroup) => {
      if (!tasks.length) return '';
      const headerBg = isDoneGroup ? '#ecfdf5' : '#eff6ff';
      const headerColor = isDoneGroup ? '#0f766e' : '#1d4ed8';
      return `
        <div style="margin:0 0 8px 0; padding:0; border:0; background:${isDoneGroup ? '#f8fffc' : '#ffffff'}; ${wordCopyFontStyle}">
          <div style="margin:0 0 4px 0; padding:3px 8px; background:${headerBg}; ${wordCopyFontStyle} color:${headerColor}; text-transform:uppercase; font-size:11px; line-height:1.15; mso-line-height-rule:exactly;">
            <font face="Aptos, Calibri, Arial" style="font-size:11px; color:${headerColor};"><b>${escapeHtml(title)}</b></font>
          </div>
          <div style="margin:0; padding:0 8px 1px 8px; background:${isDoneGroup ? '#f8fffc' : '#ffffff'}; ${wordCopyFontStyle}">
            ${tasks.map(task => `
              <div style="margin:0 0 5px 0; padding:0; ${wordCopyFontStyle} color:#0f172a; font-size:12px; line-height:1.25; mso-line-height-rule:exactly;">
                <p style="margin:0; padding:0; ${wordCopyFontStyle} font-size:12px; line-height:1.25; mso-line-height-rule:exactly;"><font face="Aptos, Calibri, Arial" style="font-size:12px; color:#0f172a;"><b>${escapeHtml(task.title)}</b></font></p>
                ${task.comment ? `<p style="margin:0; padding:0; ${wordCopyFontStyle} font-size:11px; font-weight:400; color:#475569; line-height:1.25; mso-line-height-rule:exactly;"><font face="Aptos, Calibri, Arial" style="font-size:11px; color:#475569;">${escapeHtml(task.comment)}</font></p>` : ''}
              </div>
            `).join('')}
          </div>
        </div>`;
    };

    const renderHtmlCopyManagementTasks = () => {
      if (!managementGroups.done.length && !managementGroups.active.length) return '<div style="font-size:12px; color:#64748b;">Нет задач в работе.</div>';
      const doneHtml = renderHtmlCopyManagementGroup('Выполнено', managementGroups.done, true);
      const activeHtml = renderHtmlCopyManagementGroup('В работе по приоритету', managementGroups.active, false);
      const spacer = doneHtml && activeHtml ? '<div style="height:8px; line-height:8px; font-size:1px; margin:0; padding:0;">&nbsp;</div>' : '';
      return `${doneHtml}${spacer}${activeHtml}`;
    };

    const renderManagementTasks = () => {
      const renderGroup = (title, tasks, isDoneGroup) => {
        if (!tasks.length) return '';
        return `
          <div style="border:1px solid ${isDoneGroup ? '#a7f3d0' : '#bfdbfe'}; border-left:5px solid ${isDoneGroup ? '#14b8a6' : '#3b82f6'}; border-radius:8px; margin-bottom:12px; overflow:hidden;">
            <div style="background:${isDoneGroup ? '#ecfdf5' : '#eff6ff'}; padding:7px 10px; font-weight:900; color:${isDoneGroup ? '#0f766e' : '#1d4ed8'}; text-transform:uppercase; font-size:12px; letter-spacing:0.03em;">${escapeHtml(title)}</div>
            ${tasks.map(task => {
              return `
                <div style="padding:9px 10px; border-top:1px solid ${isDoneGroup ? '#ccfbf1' : '#dbeafe'}; background:${isDoneGroup ? '#f8fffc' : '#ffffff'};">
                  <div style="font-weight:900; color:#0f172a; font-size:13px;">${escapeHtml(task.title)}</div>
                  ${task.comment ? `<div style="font-size:12px; color:#475569; margin-top:3px;">${escapeHtml(task.comment)}</div>` : ''}
                </div>`;
            }).join('')}
          </div>`;
      };
      if (!managementGroups.done.length && !managementGroups.active.length) return '<div style="font-size:12px; color:#64748b;">Нет задач в работе.</div>';
      return `${renderGroup('Выполнено', managementGroups.done, true)}${renderGroup('В работе по приоритету', managementGroups.active, false)}`;
    };

    const renderLeaderList = (rows, color) => rows.length
      ? `<table style="width:100%; border-collapse:collapse;">${rows.map((row, index) => `
          <tr>
            <td style="width:26px; padding:5px 0; color:#64748b; font-size:12px; border-bottom:1px solid #e2e8f0;">${index + 1}.</td>
            <td style="padding:5px 6px; font-size:13px; font-weight:800; color:#0f172a; border-bottom:1px solid #e2e8f0;">${escapeHtml(row.name)}</td>
            <td style="width:46px; padding:5px 0; text-align:right; font-size:14px; font-weight:900; color:${color}; border-bottom:1px solid #e2e8f0;">${row.closed}</td>
          </tr>`).join('')}</table>`
      : '<div style="font-size:12px; color:#64748b;">Нет данных</div>';

    const renderTeamMetrics = () => `
      <div style="border:1px solid #dbe4ef; border-radius:10px; overflow:hidden; margin-top:8px; background:#ffffff;">
        <table style="width:100%; border-collapse:collapse;">
          <tr>
            <td style="width:50%; padding:14px 16px; border-right:1px solid #e2e8f0; border-top:4px solid #3b82f6; vertical-align:top; background:#f8fbff;">
              <div style="font-size:12px; color:#1d4ed8; font-weight:900; text-transform:uppercase; margin-bottom:10px;">Топ по задачам</div>
              ${renderLeaderList(taskLeaders, '#1d4ed8')}
            </td>
            <td style="width:50%; padding:14px 16px; border-top:4px solid #10b981; vertical-align:top; background:#f8fffc;">
              <div style="font-size:12px; color:#047857; font-weight:900; text-transform:uppercase; margin-bottom:10px;">Топ по инцидентам</div>
              ${renderLeaderList(incidentLeaders, '#047857')}
            </td>
          </tr>
        </table>
        <div style="border-top:1px solid #e2e8f0; background:#fffdf5; padding:12px 16px;">
          <span style="font-size:12px; color:#92400e; font-weight:900; text-transform:uppercase; margin-right:16px;">Качество и линия</span>
          <span style="font-size:13px; color:#0f172a; margin-right:18px;">CSAT <b style="font-size:18px;">${escapeHtml(getCsatValue())}</b></span>
          <span style="font-size:13px; color:#0f172a; margin-right:18px;">Звонков <b>${telephony.total || 'нет данных'}</b></span>
          <span style="font-size:13px; color:#0f172a;">Пропущено <b>${telephony.missed || 0}</b>${telephony.availability !== null ? ` · доступность ${telephony.availability}%` : ''}</span>
        </div>
      </div>`;

    const renderFirstLine = () => {
      if (!firstLineRows.length) return '';
      return `
        <div style="margin-top:12px; border:1px solid #dbeafe; border-radius:8px; overflow:hidden;">
          <div style="background:#f8fafc; padding:8px 10px; font-size:12px; color:#334155; font-weight:900; text-transform:uppercase;">Первая линия: основные показатели</div>
          <table style="width:100%; border-collapse:collapse;">
            <tr style="background:#ffffff;">
              <th style="text-align:left; padding:7px; border-bottom:1px solid #e2e8f0; font-size:11px; color:#64748b;">Администратор</th>
              <th style="text-align:right; padding:7px; border-bottom:1px solid #e2e8f0; font-size:11px; color:#64748b;">Инциденты</th>
              <th style="text-align:right; padding:7px; border-bottom:1px solid #e2e8f0; font-size:11px; color:#64748b;">Звонки</th>
              <th style="text-align:right; padding:7px; border-bottom:1px solid #e2e8f0; font-size:11px; color:#64748b;">Пропущено</th>
              <th style="text-align:right; padding:7px; border-bottom:1px solid #e2e8f0; font-size:11px; color:#64748b;">Доступность</th>
              <th style="text-align:right; padding:7px; border-bottom:1px solid #e2e8f0; font-size:11px; color:#64748b;">CSAT</th>
            </tr>
            ${firstLineRows.map(row => `
              <tr>
                <td style="padding:7px; border-bottom:1px solid #f1f5f9; font-size:12px; font-weight:800;">${escapeHtml(row.name)}</td>
                <td style="padding:7px; border-bottom:1px solid #f1f5f9; text-align:right; font-size:12px;">${row.closed}</td>
                <td style="padding:7px; border-bottom:1px solid #f1f5f9; text-align:right; font-size:12px;">${row.calls || 'нет'}</td>
                <td style="padding:7px; border-bottom:1px solid #f1f5f9; text-align:right; font-size:12px;">${row.missed || 0}</td>
                <td style="padding:7px; border-bottom:1px solid #f1f5f9; text-align:right; font-size:12px;">${row.availability !== null ? `${row.availability}%` : '-'}</td>
                <td style="padding:7px; border-bottom:1px solid #f1f5f9; text-align:right; font-size:12px; font-weight:900;">${row.csat ? row.csat.toFixed(1) : '-'}</td>
              </tr>`).join('')}
          </table>
        </div>`;
    };

    const renderFlowControlAppendix = () => {
      if (!systemProblems.length && !slaSnapshot.primaryCount && !slaSnapshot.resolutionCount) return '';
      return `
        <h2 style="font-size:16px; margin:18px 0 8px 0; color:#0f172a;">5. Контроль потока инцидентов</h2>
        ${systemProblems.length ? `
          <div style="margin-bottom:14px;">
            <div style="font-size:13px; color:#334155; font-weight:900; margin-bottom:8px;">Ключевые системные проблемы (Топ-3)</div>
            ${systemProblems.map((item, index) => `
              <div style="border-left:4px solid ${item.color}; background:#f8fafc; border-radius:5px; padding:9px 10px; margin-bottom:8px;">
                <div style="font-size:13px; font-weight:900; color:#0f172a;">
                  ${index + 1}. ${escapeHtml(item.title)}
                  <span style="float:right; color:${item.color}; font-size:12px;">${item.count} шт. (${item.percent}%)</span>
                </div>
                <div style="height:4px; background:#e2e8f0; border-radius:999px; margin:7px 0 8px 0;">
                  <div style="height:4px; width:${Math.min(100, Math.max(4, item.percent))}%; background:${item.color}; border-radius:999px;"></div>
                </div>
                ${item.description ? `<div style="font-size:12px; color:#475569;">${escapeHtml(item.description)}</div>` : ''}
              </div>`).join('')}
          </div>` : ''}
        <div style="border:1px solid ${slaSnapshot.heat.border}; border-left:5px solid ${slaSnapshot.heat.color}; background:${slaSnapshot.heat.bg}; border-radius:8px; padding:12px;">
          <div style="font-size:13px; color:${slaSnapshot.heat.color}; font-weight:900; text-transform:uppercase; margin-bottom:10px;">SLA основной контроль: ${slaSnapshot.heat.label}</div>
          <table style="width:100%; border-collapse:separate; border-spacing:8px 0; margin-bottom:10px;">
            <tr>
              <td style="width:33%; border:1px solid #fecaca; background:#fff7f7; border-radius:7px; padding:8px; vertical-align:top;">
                <div style="font-size:11px; color:#64748b; font-weight:900; text-transform:uppercase;">Основной SLA</div>
                <div style="font-size:24px; color:#991b1b; font-weight:900;">${slaSnapshot.primaryCount}</div>
                <div style="font-size:11px; color:#64748b;">Инцидент от момента создания</div>
                <div style="font-size:11px; color:#dc2626; font-weight:800;">+${Math.round(slaSnapshot.primaryAvg || 0)} мин</div>
              </td>
              <td style="width:33%; border:1px solid #fed7aa; background:#fff7ed; border-radius:7px; padding:8px; vertical-align:top;">
                <div style="font-size:11px; color:#64748b; font-weight:900; text-transform:uppercase;">До решения</div>
                <div style="font-size:24px; color:#c2410c; font-weight:900;">${slaSnapshot.resolutionCount}</div>
                <div style="font-size:11px; color:#64748b;">Вторичный контроль</div>
                <div style="font-size:11px; color:#c2410c; font-weight:800;">+${Math.round(slaSnapshot.resolutionAvg || 0)} мин</div>
              </td>
              <td style="width:33%; border:1px solid #cbd5e1; background:#ffffff; border-radius:7px; padding:8px; vertical-align:top;">
                <div style="font-size:11px; color:#64748b; font-weight:900; text-transform:uppercase;">Характер просрочки</div>
                <div style="font-size:18px; color:#0f172a; font-weight:900;">${slaSnapshot.simpleShare}%</div>
                <div style="font-size:11px; color:#64748b;">простые обращения</div>
                <div style="font-size:11px; color:#64748b;">сложные: ${slaSnapshot.complexShare}%</div>
              </td>
            </tr>
          </table>
          <div style="font-size:12px; color:#334155; line-height:1.45;">${escapeHtml(slaSnapshot.diagnosis)}</div>
          <div style="font-size:11px; color:#64748b; margin-top:6px;">Основной SLA: <b>Инцидент от момента создания</b>. Вторичный SLA: <b>До решения</b>.</div>
        </div>`;
    };

    const renderCsatComments = () => {
      const renderComment = (item, tone = 'neutral') => `
        <div style="border:1px solid ${tone === 'bad' ? '#fecaca' : '#dbeafe'}; border-left:4px solid ${tone === 'bad' ? '#ef4444' : '#38bdf8'}; border-radius:8px; padding:9px 10px; margin-bottom:8px; background:${tone === 'bad' ? '#fff7f7' : '#f8fbff'};">
          <div style="font-size:12px; color:#334155; margin-bottom:4px;"><b>${escapeHtml(item.assignee)}</b>${item.rating !== null ? ` · оценка ${escapeHtml(item.rating)}` : ''}${item.title ? ` · ${escapeHtml(item.title)}` : ''}</div>
          <div style="font-size:13px; color:#0f172a; line-height:1.45;">“${escapeHtml(item.comment)}”</div>
        </div>`;
      return `
        <h2 style="font-size:16px; margin:18px 0 8px 0; color:#0f172a;">4. Комментарии пользователей</h2>
        <div style="border:1px solid #dbeafe; border-radius:8px; padding:10px; background:#ffffff;">
          <div style="font-size:12px; color:#64748b; margin-bottom:8px;">Живые комментарии за период из CSAT-выгрузки.</div>
          ${csatComments.length ? csatComments.slice(0, 8).map(item => renderComment(item)).join('') : '<div style="font-size:12px; color:#64748b; padding:8px 10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:7px;">Живые комментарии за период не загружены.</div>'}
          ${badCsatComments.length ? `
            <div style="margin-top:12px; padding-top:10px; border-top:1px solid #fecaca;">
              <div style="font-size:12px; color:#991b1b; font-weight:900; text-transform:uppercase; margin-bottom:8px;">Оценки ниже 4</div>
              ${badCsatComments.map(item => renderComment(item, 'bad')).join('')}
            </div>` : ''}
        </div>`;
    };

    if (tasksClipboardMode) {
      return `
      <div style="font-family:Aptos, Calibri, Arial, sans-serif; mso-ascii-font-family:Aptos; mso-hansi-font-family:Aptos; color:#0f172a; font-size:12px; line-height:1.25;">
        <h2 style="font-family:Aptos, Calibri, Arial, sans-serif; font-size:14px; margin:0 0 8px 0; color:#0f172a;">1. Решенные задачи за неделю</h2>
        ${renderTaskSections()}
        <h2 style="font-family:Aptos, Calibri, Arial, sans-serif; font-size:14px; margin:14px 0 8px 0; color:#0f172a;">2. Задачи в работе</h2>
        ${renderManagementTasks()}
      </div>`;
    }

    return `
      <div style="font-family: ${wordFontFamily}; color:#0f172a; line-height:1.35;">
        <div style="border-bottom:4px solid #2563eb; padding-bottom:10px; margin-bottom:14px;">
          <div style="font-size:24px; color:#0f172a; font-weight:900; letter-spacing:0.01em;">ОТЧЕТ РУКОВОДИТЕЛЮ</div>
          <div style="font-size:12px; color:#94a3b8; margin-top:3px;">${escapeHtml(weekTitle)}</div>
        </div>
        ${renderKpi()}
        <h2 style="font-size:16px; margin:18px 0 8px 0; color:#0f172a;">1. Решенные задачи за неделю</h2>
        ${htmlCopyMode ? renderHtmlCopyTaskSections() : renderTaskSections()}
        <h2 style="font-size:16px; margin:18px 0 8px 0; color:#0f172a;">2. Задачи в работе</h2>
        ${htmlCopyMode ? renderHtmlCopyManagementTasks() : renderManagementTasks()}
        <h2 style="font-size:16px; margin:18px 0 8px 0; color:#0f172a;">3. Показатели команды</h2>
        ${renderTeamMetrics()}
        ${renderFirstLine()}
        ${renderCsatComments()}
        ${renderFlowControlAppendix()}
      </div>`;
  };

  const handleCopyWordReport = async () => {
    const persisted = persistWordPreviewEdits();
    const htmlContent = getWordReportHtmlString({ exportMode: true, memoryOverrides: persisted.taskOverrides, projectOverrides: persisted.projectOverrides });
    try {
      const blobHtml = new Blob([htmlContent], { type: 'text/html' });
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      const blobText = new Blob([tempDiv.innerText], { type: 'text/plain' });
      await navigator.clipboard.write([new ClipboardItem({ 'text/html': blobHtml, 'text/plain': blobText })]);
      setCopiedId('word');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = htmlContent.replace(/<[^>]+>/g, ' ');
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedId('word');
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleDownloadWordReport = () => {
    const persisted = persistWordPreviewEdits();
    const htmlContent = getWordReportHtmlString({ exportMode: true, memoryOverrides: persisted.taskOverrides, projectOverrides: persisted.projectOverrides });
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Word Report Week ${weekData?.weekNumber || ''}</title><style>body{font-family:${wordFontFamily};}</style></head><body>${htmlContent}</body></html>`;
    const blob = new Blob([html], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Word_Report_Week_${weekData?.weekNumber || 'current'}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadWordHtmlReport = () => {
    const persisted = persistWordPreviewEdits();
    const htmlContent = getWordReportHtmlString({ exportMode: true, htmlCopyMode: true, memoryOverrides: persisted.taskOverrides, projectOverrides: persisted.projectOverrides });
    const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>HTML Report Week ${weekData?.weekNumber || ''}</title>
  <style>
    :root {
      color-scheme: light;
      --page-bg: #f8fafc;
      --ink: #0f172a;
      --muted: #64748b;
      --blue: #2563eb;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #0f172a;
      color: var(--ink);
      font-family: ${wordFontFamily};
      line-height: 1.35;
    }
    .html-report-shell {
      max-width: 1120px;
      margin: 28px auto;
      padding: 22px;
      background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
      border: 1px solid rgba(148, 163, 184, 0.22);
      border-radius: 20px;
      box-shadow: 0 24px 70px rgba(2, 6, 23, 0.35);
    }
    .html-report-toolbar {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: flex-end;
      padding: 0 2px 16px;
      color: #e2e8f0;
    }
    .html-report-toolbar h1 {
      margin: 0;
      font-size: 22px;
      letter-spacing: 0.01em;
    }
    .html-report-toolbar p {
      margin: 4px 0 0;
      color: #94a3b8;
      font-size: 13px;
    }
    .html-report-badge {
      border: 1px solid rgba(56, 189, 248, 0.35);
      background: rgba(14, 165, 233, 0.10);
      color: #bae6fd;
      border-radius: 999px;
      padding: 8px 12px;
      font-size: 12px;
      font-weight: 800;
      white-space: nowrap;
    }
    .html-report-page {
      background: #ffffff;
      max-width: 920px;
      margin: 0 auto;
      padding: 34px;
      border-radius: 14px;
      box-shadow: 0 18px 45px rgba(15, 23, 42, 0.18);
    }
    .copy-note {
      max-width: 920px;
      margin: 14px auto 0;
      color: #cbd5e1;
      font-size: 12px;
      text-align: center;
    }
    @media print {
      body { background: #ffffff; }
      .html-report-shell { margin: 0; padding: 0; background: #ffffff; border: 0; box-shadow: none; }
      .html-report-toolbar, .copy-note { display: none; }
      .html-report-page { box-shadow: none; border-radius: 0; max-width: none; padding: 0; }
    }
  </style>
</head>
<body>
  <main class="html-report-shell">
    <div class="html-report-toolbar">
      <div>
        <h1>Отчет руководителю</h1>
        <p>${escapeHtml(`Неделя ${weekData?.weekNumber || ''}${weekData?.dates ? ` (${weekData.dates})` : ''}`)}</p>
      </div>
      <div class="html-report-badge">Таблицы — для скриншотов · задачи — для копирования в Lotus</div>
    </div>
    <article class="html-report-page">
      ${htmlContent}
    </article>
    <div class="copy-note">Для письма в Lotus выделяй блоки задач в отчете. KPI и таблицы удобнее вставлять скриншотами.</div>
  </main>
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HTML_Report_Week_${weekData?.weekNumber || 'current'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sections = getSections();
  const visibleSections = sections.filter(section => !section.hidden);
  const wordTasks = getWordTasks();
  const tasksBySection = visibleSections.map(section => ({
    ...section,
    tasks: wordTasks.filter(task => task.wordSectionId === section.id)
  }));
  const managementGroups = getManagementTaskGroups();
  const wordCsatComments = getWordCsatComments();
  const badWordCsatComments = wordCsatComments.filter(item => item.rating !== null && item.rating < 4);
  const wordSystemProblems = getWordSystemProblems();
  const wordSlaSnapshot = getWordSlaSnapshot();

  return (
    <div className="animate-in fade-in duration-500 pb-10 max-w-7xl">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">{embedded ? 'Еженедельный отчёт руководству' : 'Word-отчет'}</h1>
          <p className="text-slate-400 text-sm">{embedded ? 'Распределите задачи по категориям, проверьте итог и выгрузите HTML или Word.' : 'Лаконичный отчет для Word, письма и копирования руководителю выше'}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <WeekSelector historyKeys={historyKeys} weeksHistory={weeksHistory} selectedKey={selectedKey} onSelect={onWeekSelect} activeData={weekData} />
          <button onClick={handleCopyWordReport} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg transition-colors shadow-lg flex items-center gap-2">
            {copiedId === 'word' ? <Check size={18} /> : <Copy size={18} />} {copiedId === 'word' ? 'Скопировано' : 'Копировать в Word'}
          </button>
          <button onClick={handleDownloadWordReport} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-lg transition-colors shadow-lg flex items-center gap-2">
            <Download size={18} /> Скачать Word
          </button>
          <button onClick={handleDownloadWordHtmlReport} className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2.5 rounded-lg transition-colors shadow-lg flex items-center gap-2" title="Скачать самостоятельный HTML-отчет для скриншотов и копирования задач">
            <Download size={18} /> Скачать HTML
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[460px_1fr] gap-6">
        <div className="space-y-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700/50 p-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Разделы отчета</h2>
            <div className="space-y-2">
              {sections.map((section) => (
                <div key={section.id} className="bg-slate-900/60 border border-slate-700 rounded-lg p-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: section.color }} />
                    <input
                      value={section.title}
                      onChange={(event) => updateSections(list => list.map(item => item.id === section.id ? { ...item, title: event.target.value } : item))}
                      className="min-w-0 flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-2">
                    <label className="flex items-center gap-1 text-[11px] text-slate-400">
                      <input type="checkbox" checked={!section.hidden} onChange={(event) => updateSections(list => list.map(item => item.id === section.id ? { ...item, hidden: !event.target.checked } : item))} />
                      показывать
                    </label>
                    <div className="flex gap-1">
                      <button onClick={() => moveSection(section.id, -1)} className="px-2 py-1 rounded bg-slate-950 border border-slate-700 text-[11px] text-slate-300">↑</button>
                      <button onClick={() => moveSection(section.id, 1)} className="px-2 py-1 rounded bg-slate-950 border border-slate-700 text-[11px] text-slate-300">↓</button>
                      {section.id.startsWith('custom-') && (
                        <button onClick={() => updateSections(list => list.filter(item => item.id !== section.id))} className="px-2 py-1 rounded bg-red-500/10 border border-red-500/30 text-[11px] text-red-300">Удалить</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <input value={newSectionTitle} onChange={(event) => setNewSectionTitle(event.target.value)} placeholder="Новый раздел..." className="min-w-0 flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" />
              <button onClick={handleAddSection} className="bg-sky-600 hover:bg-sky-500 text-white px-3 py-2 rounded-lg"><Plus size={16} /></button>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700/50 p-4 text-xs text-slate-400 leading-relaxed">
            <div className="font-bold text-slate-200 mb-1">Как пользоваться</div>
            <p>Задачи раскладываются автоматически. Заголовок и детали можно править прямо в карточке; раздел меняется выпадающим списком или перетаскиванием задачи.</p>
          </div>

          {!embedded && <div className="bg-slate-800 rounded-xl border border-slate-700/50 p-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Задачи в работе</h2>
            <div className="space-y-2 mb-3">
              <input
                value={newProjectTaskTitle}
                onChange={(event) => setNewProjectTaskTitle(event.target.value)}
                placeholder="Новое поручение..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              />
              <input
                value={newProjectTaskComment}
                onChange={(event) => setNewProjectTaskComment(event.target.value)}
                placeholder="Краткий статус..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              />
              <div className="flex gap-2">
                <select value={newProjectTaskColor} onChange={(event) => setNewProjectTaskColor(event.target.value)} className="min-w-0 flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white">
                  <option value="#3b82f6">В работе</option>
                  <option value="#10b981">Рабочий режим</option>
                  <option value="#f59e0b">Контроль срока</option>
                  <option value="#ef4444">Риск / эскалация</option>
                </select>
                <button onClick={handleAddWordProjectTask} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg text-xs font-black">Добавить</button>
              </div>
            </div>
            <div className="space-y-2 max-h-[520px] overflow-y-auto custom-scrollbar pr-1">
              {getManagementTasks().map(task => {
                const isDone = task.status === 'completed';
                return (
                  <div key={`side-${task.id}`} className="bg-slate-900/60 border border-slate-700 rounded-lg p-2">
                    <div className="text-xs font-bold text-slate-100 mb-2">{task.title}</div>
                    {task.comment && <div className="text-[11px] text-slate-400 mb-2 line-clamp-2">{task.comment}</div>}
                    <div className="flex flex-wrap gap-1.5">
                      <button onClick={() => handleMoveProjectTaskPriority(task.id, -1)} className="px-2 py-1 rounded bg-slate-950 border border-slate-700 text-[11px] text-slate-300">↑</button>
                      <button onClick={() => handleMoveProjectTaskPriority(task.id, 1)} className="px-2 py-1 rounded bg-slate-950 border border-slate-700 text-[11px] text-slate-300">↓</button>
                      <button onClick={() => handleUpdateProjectTaskStatus(task.id, isDone ? 'active' : 'completed')} className={`px-2 py-1 rounded border text-[11px] font-bold ${isDone ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'}`}>
                        {isDone ? 'В работу' : 'Выполнено'}
                      </button>
                      <button onClick={() => handleDeleteProjectTask(task.id)} className="px-2 py-1 rounded bg-red-500/10 border border-red-500/30 text-[11px] text-red-300">Удалить</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>}
        </div>

        <div ref={previewRef} className="bg-slate-300 rounded-xl p-6 overflow-auto custom-scrollbar" style={{ maxHeight: '78vh' }}>
          <div className="bg-white text-slate-900 shadow-2xl mx-auto p-8" style={{ maxWidth: 900 }}>
            <div className="border-b-4 border-blue-600 pb-3 mb-4">
              <h2 className="text-2xl font-black tracking-tight">ОТЧЕТ РУКОВОДИТЕЛЮ</h2>
              <p className="text-sm text-slate-500">Неделя {weekData?.weekNumber || ''}{weekData?.dates ? ` (${weekData.dates})` : ''}</p>
            </div>

            <section className="mb-6" style={{ fontFamily: wordFontFamily }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {getWordKpiCards().map(card => (
                  <div key={card.key} className="border border-blue-100 rounded-lg bg-white p-4 shadow-sm border-t-4" style={{ borderTopColor: card.accent }}>
                    <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-3">{card.title}</div>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-3xl font-black" style={{ color: card.accent }}>{card.value}</span>
                      <span className="text-sm text-slate-600">{card.suffix}</span>
                      {card.trend && <span className="text-xs font-black ml-1" style={{ color: getTrendColor(card.trendTone) }}>{card.trend}</span>}
                    </div>
                    <div className="text-sm text-slate-600 mb-3">{card.hint}</div>
                    <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${card.progress}%`, background: card.accent }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-6" style={{ fontFamily: wordFontFamily }}>
              <h3 className="text-lg font-black mb-3">1. Решенные задачи за неделю</h3>
              <div className="space-y-4">
                {tasksBySection.map(section => (
                  <div key={section.id} onDragOver={(event) => event.preventDefault()} onDrop={(event) => handleTaskDrop(event, section.id)} className="overflow-hidden">
                    <div className="bg-blue-50 border border-blue-200 border-l-4 border-l-blue-500 px-3 py-2 flex justify-between items-center">
                      <h4 className="font-black text-blue-700 uppercase tracking-wide text-xs">{section.title}</h4>
                    </div>
                    <div className="border-x border-b border-blue-100 bg-white">
                      {section.tasks.length ? section.tasks.map(task => (
                        (() => {
                          const isRoutineSection = section.id === 'other';
                          return (
                        <div
                          key={task.id}
                          data-word-task-id={task.id}
                          draggable
                          onDragStart={(event) => handleTaskDragStart(event, task.id)}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => handleTaskDrop(event, section.id, task.id)}
                          className={`${isRoutineSection ? 'py-2' : 'py-2.5'} px-3 border-t border-blue-100 first:border-t-0 hover:bg-slate-50/70 transition-colors ${draggedTaskId === task.id ? 'opacity-50' : ''}`}
                        >
                          <div className="flex flex-col md:flex-row md:items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className={`${isRoutineSection ? 'text-[13px]' : 'text-[14px]'} text-slate-950 leading-snug`}>
                                <span
                                  data-word-task-title="true"
                                  contentEditable
                                  suppressContentEditableWarning
                                  onBlur={(event) => handleSaveWordTaskField(task.id, task.wordTitle, 'wordTitle', event.currentTarget.innerText)}
                                  className={`${isRoutineSection ? 'font-extrabold' : 'font-black'} outline-none border-b border-transparent focus:border-blue-300`}
                                >
                                  {task.wordTitle}
                                </span>
                                <span className="font-black">;</span>
                              </div>
                              <div
                                data-word-task-details="true"
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(event) => handleSaveWordTaskField(task.id, task.wordTitle, 'wordDetails', event.currentTarget.innerText)}
                                className="mt-1 text-[12.5px] leading-relaxed text-slate-600 min-h-[20px] outline-none focus:text-slate-800 whitespace-pre-wrap"
                              >
                                {task.wordDetails || ''}
                              </div>
                            </div>
                            <select
                              data-word-task-section="true"
                              value={task.wordSectionId}
                              onChange={(event) => handleMoveTaskToSection(task, event.target.value)}
                              className="bg-white border border-slate-200 rounded-md px-2 py-1 text-[11px] font-bold text-slate-500"
                            >
                              {sections.filter(item => !item.hidden).map(sectionOption => <option key={`${task.id}-${sectionOption.id}`} value={sectionOption.id}>{sectionOption.title}</option>)}
                            </select>
                          </div>
                        </div>
                          );
                        })()
                      )) : (
                        <div className="p-3 text-sm text-slate-400">Перетащите сюда задачи или скройте пустой раздел.</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-6" style={{ fontFamily: wordFontFamily }}>
              <h3 className="text-lg font-black mb-3">2. Задачи в работе</h3>
              <div className="space-y-2">
                {(!managementGroups.done.length && !managementGroups.active.length) && <div className="text-sm text-slate-500">Нет задач в работе.</div>}
                {[
                  { title: 'Выполнено', tasks: managementGroups.done, done: true },
                  { title: 'В работе по приоритету', tasks: managementGroups.active, done: false }
                ].filter(group => group.tasks.length).map(group => (
                  <div key={group.title} className={`rounded-lg border overflow-hidden ${group.done ? 'border-emerald-200 bg-emerald-50/60' : 'border-blue-200 bg-blue-50/50'}`}>
                      <div className={`px-3 py-2 text-xs font-black uppercase tracking-wide ${group.done ? 'text-teal-700 bg-emerald-50' : 'text-blue-700 bg-blue-50'}`}>
                        {group.title}
                      </div>
                    <div className="divide-y divide-slate-200">
                      {group.tasks.map(task => {
                        return (
                          <div key={task.id} data-word-project-id={task.id} className="bg-white/80 px-3 py-2.5">
                            <div className="flex items-start gap-2">
                              <div className="flex flex-col gap-1 pt-0.5">
                                <button onClick={() => handleMoveProjectTaskPriority(task.id, -1)} className="w-6 h-5 rounded border border-slate-200 text-[11px] font-black text-slate-500 hover:bg-slate-100">↑</button>
                                <button onClick={() => handleMoveProjectTaskPriority(task.id, 1)} className="w-6 h-5 rounded border border-slate-200 text-[11px] font-black text-slate-500 hover:bg-slate-100">↓</button>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div
                                  data-word-project-title="true"
                                  contentEditable
                                  suppressContentEditableWarning
                                  onBlur={(event) => handleUpdateProjectTaskField(task.id, 'title', event.currentTarget.innerText)}
                                  className="font-black text-slate-950 outline-none border-b border-transparent focus:border-blue-300"
                                >
                                  {task.title}
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                                  <span
                                    data-word-project-comment="true"
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={(event) => handleUpdateProjectTaskField(task.id, 'comment', event.currentTarget.innerText)}
                                    className="min-w-[180px] outline-none border-b border-transparent focus:border-blue-300"
                                  >
                                    {task.comment || 'Добавьте краткий статус...'}
                                  </span>
                                </div>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-1">
                                <button onClick={() => handleUpdateProjectTaskStatus(task.id, group.done ? 'active' : 'completed')} className={`px-2 py-1 rounded border text-[11px] font-bold ${group.done ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                                  {group.done ? 'Вернуть в работу' : 'Отметить выполненным'}
                                </button>
                                <button onClick={() => handleDeleteProjectTask(task.id)} className="px-2 py-1 rounded border border-red-200 bg-red-50 text-[11px] font-bold text-red-700">Удалить</button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section style={{ fontFamily: wordFontFamily }}>
              <h3 className="text-lg font-black mb-3">3. Показатели команды</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="border border-blue-200 border-t-4 border-t-blue-500 rounded-lg p-3 bg-blue-50/30">
                  <div className="text-xs font-black uppercase text-blue-700 mb-2">Топ по задачам</div>
                  {getTeamTaskLeaders().map((row, index) => (
                    <div key={`${row.name}-${index}`} className="flex justify-between gap-2 text-sm py-1">
                      <span><span className="text-slate-400 font-bold mr-1">{index + 1}.</span><b>{row.name}</b></span>
                      <span className="font-black">{row.closed}</span>
                    </div>
                  ))}
                </div>
                <div className="border border-emerald-200 border-t-4 border-t-emerald-500 rounded-lg p-3 bg-emerald-50/30">
                  <div className="text-xs font-black uppercase text-emerald-700 mb-2">Топ по инцидентам</div>
                  {getIncidentLeaders().length ? getIncidentLeaders().map((row, index) => (
                    <div key={`${row.name}-${index}`} className="flex justify-between gap-2 text-sm py-1">
                      <span><span className="text-slate-400 font-bold mr-1">{index + 1}.</span><b>{row.name}</b></span>
                      <span className="font-black">{row.closed}</span>
                    </div>
                  )) : <div className="text-sm text-slate-500">Нет данных</div>}
                </div>
                <div className="border border-amber-200 border-t-4 border-t-amber-500 rounded-lg p-3 bg-amber-50/30">
                  <div className="text-xs font-black uppercase text-amber-700 mb-2">Качество и линия</div>
                  <div className="text-sm py-1">CSAT: <b className="text-lg">{getCsatValue()}</b></div>
                  <div className="text-sm py-1">Звонков: <b>{getTelephonySummary().total || 'нет данных'}</b></div>
                  <div className="text-sm py-1">Пропущено: <b>{getTelephonySummary().missed || 0}</b>{getTelephonySummary().availability !== null ? ` · доступность ${getTelephonySummary().availability}%` : ''}</div>
                </div>
              </div>
            </section>

            {getFirstLineRows().length > 0 && (
              <section className="mt-5" style={{ fontFamily: wordFontFamily }}>
                <h3 className="text-base font-black mb-2">Первая линия: основные показатели</h3>
                <div className="overflow-hidden rounded-lg border border-blue-100">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-[11px] uppercase text-slate-500">
                      <tr>
                        <th className="text-left p-2">Администратор</th>
                        <th className="text-right p-2">Инциденты</th>
                        <th className="text-right p-2">Звонки</th>
                        <th className="text-right p-2">Пропущено</th>
                        <th className="text-right p-2">Доступность</th>
                        <th className="text-right p-2">CSAT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFirstLineRows().map(row => (
                        <tr key={`fl-${row.name}`} className="border-t border-slate-100">
                          <td className="p-2 font-bold">{row.name}</td>
                          <td className="p-2 text-right">{row.closed}</td>
                          <td className="p-2 text-right">{row.calls || 'нет'}</td>
                          <td className="p-2 text-right">{row.missed || 0}</td>
                          <td className="p-2 text-right">{row.availability !== null ? `${row.availability}%` : '-'}</td>
                          <td className="p-2 text-right font-black">{row.csat ? row.csat.toFixed(1) : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            <section className="mt-6">
              <h3 className="text-lg font-black mb-3">4. Комментарии пользователей</h3>
              <div className="border border-blue-100 rounded-lg bg-white p-3">
                <div className="text-xs text-slate-500 mb-3">Живые комментарии за период из CSAT-выгрузки.</div>
                {wordCsatComments.length > 0 ? (
                  <div className="space-y-2">
                    {wordCsatComments.slice(0, 8).map(item => (
                      <div key={`${item.id}-${item.comment}`} className="border border-blue-100 border-l-4 border-l-sky-400 rounded-lg bg-blue-50/30 p-3">
                        <div className="text-xs text-slate-600 mb-1"><b>{item.assignee}</b>{item.rating !== null ? ` · оценка ${item.rating}` : ''}{item.title ? ` · ${item.title}` : ''}</div>
                        <div className="text-sm text-slate-900 leading-relaxed">“{item.comment}”</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 border border-slate-200 bg-slate-50 rounded-lg px-3 py-2">Живые комментарии за период не загружены.</div>
                )}
                  {badWordCsatComments.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-red-100">
                      <div className="text-xs font-black uppercase text-red-700 mb-2">Оценки ниже 4</div>
                      <div className="space-y-2">
                        {badWordCsatComments.map(item => (
                          <div key={`bad-${item.id}-${item.comment}`} className="border border-red-100 border-l-4 border-l-red-500 rounded-lg bg-red-50/40 p-3">
                            <div className="text-xs text-slate-600 mb-1"><b>{item.assignee}</b>{item.rating !== null ? ` · оценка ${item.rating}` : ''}{item.title ? ` · ${item.title}` : ''}</div>
                            <div className="text-sm text-slate-900 leading-relaxed">“{item.comment}”</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </section>

            {(wordSystemProblems.length > 0 || wordSlaSnapshot.primaryCount > 0 || wordSlaSnapshot.resolutionCount > 0) && (
              <section className="mt-6" style={{ fontFamily: wordFontFamily }}>
                <h3 className="text-lg font-black mb-3">5. Контроль потока инцидентов</h3>
                {wordSystemProblems.length > 0 && (
                  <div className="mb-5">
                    <div className="text-sm font-black text-slate-700 mb-2">Ключевые системные проблемы (Топ-3)</div>
                    <div className="space-y-2">
                      {wordSystemProblems.map((item, index) => (
                        <div key={`${item.title}-${index}`} className="rounded-md bg-slate-50 p-3" style={{ borderLeft: `4px solid ${item.color}` }}>
                          <div className="flex items-center justify-between gap-3">
                            <div className="font-black text-sm">{index + 1}. {item.title}</div>
                            <div className="text-xs font-black" style={{ color: item.color }}>{item.count} шт. ({item.percent}%)</div>
                          </div>
                          <div className="h-1 bg-slate-200 rounded-full overflow-hidden my-2">
                            <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(4, item.percent))}%`, background: item.color }} />
                          </div>
                          {item.description && <div className="text-xs text-slate-600">{item.description}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="rounded-lg p-4" style={{ border: `1px solid ${wordSlaSnapshot.heat.border}`, borderLeft: `5px solid ${wordSlaSnapshot.heat.color}`, background: wordSlaSnapshot.heat.bg }}>
                  <div className="text-sm font-black uppercase mb-3" style={{ color: wordSlaSnapshot.heat.color }}>SLA основной контроль: {wordSlaSnapshot.heat.label}</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                      <div className="text-[11px] font-black uppercase text-slate-500">Основной SLA</div>
                      <div className="text-2xl font-black text-red-800">{wordSlaSnapshot.primaryCount}</div>
                      <div className="text-xs text-slate-500">Инцидент от момента создания</div>
                      <div className="text-xs font-bold text-red-600">+{Math.round(wordSlaSnapshot.primaryAvg || 0)} мин</div>
                    </div>
                    <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                      <div className="text-[11px] font-black uppercase text-slate-500">До решения</div>
                      <div className="text-2xl font-black text-orange-700">{wordSlaSnapshot.resolutionCount}</div>
                      <div className="text-xs text-slate-500">Вторичный контроль</div>
                      <div className="text-xs font-bold text-orange-700">+{Math.round(wordSlaSnapshot.resolutionAvg || 0)} мин</div>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <div className="text-[11px] font-black uppercase text-slate-500">Характер просрочки</div>
                      <div className="text-2xl font-black text-slate-900">{wordSlaSnapshot.simpleShare}%</div>
                      <div className="text-xs text-slate-500">простые обращения</div>
                      <div className="text-xs text-slate-500">сложные: {wordSlaSnapshot.complexShare}%</div>
                    </div>
                  </div>
                  <div className="text-sm text-slate-700">{wordSlaSnapshot.diagnosis}</div>
                  <div className="text-xs text-slate-500 mt-2">Основной SLA: <b>Инцидент от момента создания</b>. Вторичный SLA: <b>До решения</b>.</div>
                </div>
              </section>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

// --- ЕДИНЫЙ ЦЕНТР ОТЧЕТОВ ---

const ManagementTasksBoard = ({ projectTasks, setProjectTasks, selectedKey, historyKeys, weeksHistory, weekData, onWeekSelect }) => {
  const [newTitle, setNewTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  const [newColor, setNewColor] = useState('#3b82f6');

  const compareWeekKeys = (leftKey, rightKey) => {
    const [leftYear, leftWeek] = safeString(leftKey).split('-').map(Number);
    const [rightYear, rightWeek] = safeString(rightKey).split('-').map(Number);
    if (!leftYear || !leftWeek || !rightYear || !rightWeek) return 0;
    if (leftYear !== rightYear) return leftYear - rightYear;
    return leftWeek - rightWeek;
  };

  const visibleTasks = (projectTasks || [])
    .filter(task => {
      const createdKey = task?.createdWeekKey || selectedKey;
      if (compareWeekKeys(createdKey, selectedKey) > 0) return false;
      if (task?.completedWeekKey) return compareWeekKeys(selectedKey, task.completedWeekKey) <= 0;
      return task?.status === 'active';
    })
    .sort((a, b) => (Number(a.priority) || 0) - (Number(b.priority) || 0));

  const activeCount = visibleTasks.filter(task => task.status !== 'completed').length;
  const completedCount = visibleTasks.length - activeCount;
  const riskCount = visibleTasks.filter(task => task.status !== 'completed' && safeString(task.color).toLowerCase() === '#ef4444').length;

  const handleAdd = () => {
    const title = safeString(newTitle).trim();
    if (!title) return;
    setProjectTasks(prev => [
      ...(prev || []),
      {
        id: `pt-${Date.now()}`,
        title,
        comment: safeString(newComment).trim(),
        color: newColor,
        status: 'active',
        createdWeekKey: selectedKey,
        completedWeekKey: null,
        priority: (prev || []).length,
        createdAt: new Date().toISOString()
      }
    ]);
    setNewTitle('');
    setNewComment('');
    setNewColor('#3b82f6');
  };

  const handleUpdate = (taskId, field, value) => {
    setProjectTasks(prev => (prev || []).map(task => task.id === taskId ? { ...task, [field]: value } : task));
  };

  const handleToggle = (task) => {
    const nextStatus = task.status === 'completed' ? 'active' : 'completed';
    setProjectTasks(prev => (prev || []).map(item => item.id === task.id ? {
      ...item,
      status: nextStatus,
      completedWeekKey: nextStatus === 'completed' ? selectedKey : null
    } : item));
  };

  const handleMove = (taskId, direction) => {
    const currentIndex = visibleTasks.findIndex(task => task.id === taskId);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= visibleTasks.length) return;
    const reordered = [...visibleTasks];
    [reordered[currentIndex], reordered[targetIndex]] = [reordered[targetIndex], reordered[currentIndex]];
    const orderMap = new Map(reordered.map((task, index) => [task.id, index]));
    setProjectTasks(prev => (prev || []).map(task => orderMap.has(task.id) ? { ...task, priority: orderMap.get(task.id) } : task));
  };

  const handleDelete = (taskId) => {
    if (!window.confirm('Удалить поручение навсегда?')) return;
    setProjectTasks(prev => (prev || []).filter(task => task.id !== taskId).map((task, index) => ({ ...task, priority: index })));
  };

  const statusOptions = [
    { value: '#3b82f6', label: '🔵 В работе' },
    { value: '#10b981', label: '🟢 Рабочий режим' },
    { value: '#f59e0b', label: '🟡 Контроль срока' },
    { value: '#ef4444', label: '🔴 Риск / эскалация' },
    { value: '#0f172a', label: '⚫ Пауза / ожидание' }
  ];

  return (
    <div className="animate-in fade-in duration-500 pb-10 max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] font-black text-fuchsia-300 mb-2">Рабочий контур отчёта</div>
          <h2 className="text-3xl font-bold text-white tracking-tight mb-1">Поручения руководства</h2>
          <p className="text-slate-400 text-sm max-w-2xl">Единый глобальный список. Порядок задаёт важность в еженедельном отчёте, а выполненные поручения фиксируются в выбранной неделе.</p>
        </div>
        <WeekSelector historyKeys={historyKeys} weeksHistory={weeksHistory} selectedKey={selectedKey} onSelect={onWeekSelect} activeData={weekData} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {[
          { label: 'В работе', value: activeCount, tone: 'text-blue-300', border: 'border-blue-500/30' },
          { label: 'Выполнено в срезе', value: completedCount, tone: 'text-emerald-300', border: 'border-emerald-500/30' },
          { label: 'Риск / эскалация', value: riskCount, tone: 'text-red-300', border: 'border-red-500/30' }
        ].map(item => (
          <div key={item.label} className={`bg-slate-800 rounded-xl border ${item.border} p-4`}>
            <div className="text-[10px] uppercase tracking-widest font-black text-slate-500 mb-1">{item.label}</div>
            <div className={`text-3xl font-black ${item.tone}`}>{item.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700/60 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-slate-700/60 bg-fuchsia-500/10">
          <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2"><Plus size={16} className="text-fuchsia-300" /> Новое поручение</h3>
        </div>
        <div className="p-5 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr_220px_auto] gap-3 items-end">
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-black text-slate-500 mb-1">Что нужно сделать</label>
            <input value={newTitle} onChange={event => setNewTitle(event.target.value)} placeholder="Суть поручения..." className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-fuchsia-500" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-black text-slate-500 mb-1">Текущий статус</label>
            <input value={newComment} onChange={event => setNewComment(event.target.value)} placeholder="Короткий комментарий..." className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-fuchsia-500" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-black text-slate-500 mb-1">Состояние</label>
            <select value={newColor} onChange={event => setNewColor(event.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white outline-none">
              {statusOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <button onClick={handleAdd} disabled={!newTitle.trim()} className="bg-fuchsia-600 hover:bg-fuchsia-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg px-5 py-2.5 font-black text-sm flex items-center justify-center gap-2">
            <Plus size={16} /> Добавить
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {visibleTasks.map((task, index) => {
          const isDone = task.status === 'completed';
          return (
            <div key={task.id} className={`bg-slate-800 rounded-xl border p-4 ${isDone ? 'border-emerald-500/30' : 'border-slate-700/60'}`}>
              <div className="flex flex-col xl:flex-row gap-4">
                <div className="flex gap-2 xl:flex-col">
                  <button onClick={() => handleMove(task.id, -1)} disabled={index === 0} className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-700 text-slate-400 disabled:opacity-25">↑</button>
                  <button onClick={() => handleMove(task.id, 1)} disabled={index === visibleTasks.length - 1} className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-700 text-slate-400 disabled:opacity-25">↓</button>
                </div>
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1.3fr_1fr_210px] gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-black text-slate-500 mb-1">Поручение #{index + 1}</label>
                    <input value={task.title || ''} onChange={event => handleUpdate(task.id, 'title', event.target.value)} className={`w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-fuchsia-500 ${isDone ? 'text-emerald-300 line-through' : 'text-white'}`} />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-black text-slate-500 mb-1">Комментарий</label>
                    <input value={task.comment || ''} onChange={event => handleUpdate(task.id, 'comment', event.target.value)} placeholder="Текущий статус..." className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:border-fuchsia-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-black text-slate-500 mb-1">Состояние</label>
                    <select value={task.color || '#3b82f6'} onChange={event => handleUpdate(task.id, 'color', event.target.value)} disabled={isDone} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none disabled:opacity-50">
                      {statusOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex xl:flex-col gap-2 xl:w-36 justify-end">
                  <button onClick={() => handleToggle(task)} className={`flex-1 rounded-lg px-3 py-2 text-xs font-black border ${isDone ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'}`}>
                    {isDone ? 'Вернуть' : 'Выполнено'}
                  </button>
                  <button onClick={() => handleDelete(task.id)} className="rounded-lg px-3 py-2 text-xs font-black bg-red-500/10 border border-red-500/30 text-red-300 flex items-center justify-center gap-1">
                    <Trash2 size={14} /> Удалить
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {visibleTasks.length === 0 && (
          <div className="bg-slate-800/60 border border-dashed border-slate-700 rounded-xl p-10 text-center">
            <Target size={34} className="text-slate-600 mx-auto mb-3" />
            <div className="font-bold text-slate-300">Поручений для выбранной недели нет</div>
            <div className="text-sm text-slate-500 mt-1">Добавьте первое поручение через форму выше.</div>
          </div>
        )}
      </div>
    </div>
  );
};

const TraineeDevelopmentReport = ({ weekData, weeksHistory, selectedKey, dbStatus }) => {
  const trainees = [
    { id: 'u0607', name: 'Максим Отрошко', reportName: 'Отрошко Максим', direction: 'Специалист тех.поддержки', startDate: '03.04.2026' },
    { id: 'u0608', name: 'Максим Гуртов', reportName: 'Гуртов Максим', direction: 'Специалист тех.поддержки', startDate: '03.04.2026' },
    { id: 'u0627', name: 'Руслан Халеддинов', reportName: 'Халеддинов Руслан', direction: 'Специалист тех.поддержки', startDate: '07.05.2026' }
  ];
  const toInputDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const getDefaultPeriod = () => {
    const now = new Date();
    const endMonthOffset = now.getDate() >= 20 ? 0 : -1;
    const end = new Date(now.getFullYear(), now.getMonth() + endMonthOffset, 19);
    const start = new Date(end.getFullYear(), end.getMonth() - 1, 20);
    return { from: toInputDate(start), to: toInputDate(end) };
  };
  const defaultPeriod = getDefaultPeriod();
  const [fromDate, setFromDate] = useState(defaultPeriod.from);
  const [toDate, setToDate] = useState(defaultPeriod.to);
  const [copiedRows, setCopiedRows] = useState(false);
  const defaultMetricSnapshots = {
    '2026-06-20_2026-07-19': {
      u0607: '334',
      u0608: '224',
      u0627: '195'
    }
  };
  const [metricSnapshots, setMetricSnapshots] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('trainee_monthly_metric_snapshots') || '{}');
      return { ...defaultMetricSnapshots, ...saved };
    } catch (error) {
      return defaultMetricSnapshots;
    }
  });
  const [traineeMeta, setTraineeMeta] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('trainee_monthly_report_meta') || '{}');
      return trainees.reduce((acc, trainee) => ({
        ...acc,
        [trainee.id]: {
          direction: trainee.direction,
          startDate: trainee.startDate,
          hours: '',
          amount: '',
          previousMonth: '',
          comment: '',
          ...(saved[trainee.id] || {})
        }
      }), {});
    } catch (error) {
      return trainees.reduce((acc, trainee) => ({
        ...acc,
        [trainee.id]: { direction: trainee.direction, startDate: trainee.startDate, hours: '', amount: '', previousMonth: '', comment: '' }
      }), {});
    }
  });
  useEffect(() => {
    localStorage.setItem('trainee_monthly_report_meta', JSON.stringify(traineeMeta));
  }, [traineeMeta]);
  useEffect(() => {
    localStorage.setItem('trainee_monthly_metric_snapshots', JSON.stringify(metricSnapshots));
  }, [metricSnapshots]);
  const updateTraineeMeta = (traineeId, field, value) => {
    setTraineeMeta(prev => ({ ...prev, [traineeId]: { ...(prev[traineeId] || {}), [field]: value } }));
  };
  const periodKey = `${fromDate}_${toDate}`;
  const updateMetricSnapshot = (traineeId, value) => {
    setMetricSnapshots(prev => ({
      ...prev,
      [periodKey]: {
        ...(prev[periodKey] || {}),
        [traineeId]: value
      }
    }));
  };
  const parseCaseDate = (value) => {
    const text = safeString(value).trim().toLowerCase();
    if (!text) return null;
    const monthMap = { янв: 0, фев: 1, мар: 2, апр: 3, май: 4, июн: 5, июл: 6, авг: 7, сен: 8, окт: 9, ноя: 10, дек: 11 };
    const ruMatch = text.match(/(\d{1,2})[/. -]([а-яё]{3,8})[/. -](\d{2,4})/i);
    if (ruMatch) {
      const monthKey = Object.keys(monthMap).find(key => ruMatch[2].startsWith(key));
      if (monthKey) {
        const rawYear = Number(ruMatch[3]);
        return new Date(rawYear < 100 ? 2000 + rawYear : rawYear, monthMap[monthKey], Number(ruMatch[1]));
      }
    }
    const numericMatch = text.match(/(\d{1,2})[/. -](\d{1,2})[/. -](\d{2,4})/);
    if (numericMatch) {
      const rawYear = Number(numericMatch[3]);
      return new Date(rawYear < 100 ? 2000 + rawYear : rawYear, Number(numericMatch[2]) - 1, Number(numericMatch[1]));
    }
    const parsed = new Date(text);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };
  const from = new Date(`${fromDate}T00:00:00`);
  const to = new Date(`${toDate}T23:59:59`);
  const isInPeriod = (value) => {
    const date = parseCaseDate(value);
    return date && date >= from && date <= to;
  };
  const weekEntries = Object.entries({ ...(weeksHistory || {}), [selectedKey]: weekData || {} });
  const caseMap = new Map();
  const addCase = (item, source) => {
    if (!item || !trainees.some(trainee => trainee.id === safeString(item.assignee))) return;
    const caseDate = item.date || item.resolved || item.resolutionDate || item.created;
    if (!isInPeriod(caseDate)) return;
    const id = safeString(item.id || item.key || item.issueKey);
    if (!id) return;
    const key = `${source}:${id}`;
    if (!caseMap.has(key)) caseMap.set(key, { ...item, id, source, date: caseDate });
  };
  weekEntries.forEach(([, data]) => {
    (Array.isArray(data?.traineeIncidentCases) ? data.traineeIncidentCases : []).forEach(item => addCase(item, 'Инцидент'));
    (Array.isArray(data?.traineeTaskCases) ? data.traineeTaskCases : []).forEach(item => addCase(item, 'Задача'));
  });
  const structuredTaskIds = new Set([...caseMap.values()].filter(item => item.source === 'Задача').map(item => item.id));
  weekEntries.forEach(([, data]) => {
    (Array.isArray(data?.detailedTasks) ? data.detailedTasks : []).forEach(task => {
      const assignee = safeString(task?.assignee);
      const id = safeString(task?.id);
      if (!trainees.some(trainee => trainee.id === assignee) || !id || structuredTaskIds.has(id)) return;
      const size = safeString(task.size || task.complexity).toUpperCase();
      const assigneeDays = Number(task.assigneeCycleTime);
      const tags = safeString(task.tags).toLowerCase();
      const priority = safeString(task.priority).toLowerCase();
      const valueCategory = safeString(task.valueCategory);
      const signals = [];
      if (['L', 'XL'].includes(size)) signals.push('сложное');
      if (Number.isFinite(assigneeDays) && assigneeDays >= 5) signals.push('длительное');
      if (priority === 'impact' || tags.includes('срочная')) signals.push('необычное');
      if (['optimization', 'business', 'stability'].includes(valueCategory) && size !== 'S') signals.push('нетиповая практика');
      if (!signals.length) return;
      addCase({
        ...task,
        assignee,
        date: task.resolved,
        signals,
        complexityLevel: size === 'XL' ? 5 : (size === 'L' ? 4 : 3),
        whyNotable: [
          ['L', 'XL'].includes(size) ? `размер ${size}` : '',
          Number.isFinite(assigneeDays) && assigneeDays >= 5 ? `${assigneeDays} дн. у исполнителя` : '',
          priority === 'impact' ? 'задача с заметным эффектом' : ''
        ].filter(Boolean).join(' · '),
        resolution: task.comments,
        qualificationEvidence: task.domain && task.domain !== 'Прочее'
          ? `Практика выполнения нетиповой работы в домене «${task.domain}».`
          : 'Практика выполнения нетиповой задачи подтверждена карточкой Jira.'
      }, 'Задача');
    });
  });
  const allCases = [...caseMap.values()].sort((left, right) => {
    const leftDate = parseCaseDate(left.date)?.getTime() || 0;
    const rightDate = parseCaseDate(right.date)?.getTime() || 0;
    return rightDate - leftDate;
  });
  const importedPeriodMetrics = weekEntries
    .flatMap(([, data]) => Array.isArray(data?.traineePeriodMetrics) ? data.traineePeriodMetrics : [])
    .filter(item => safeString(item?.from) === fromDate && safeString(item?.to) === toDate);
  const getIsoWeekStart = (weekKey) => {
    const match = safeString(weekKey).match(/^(\d{4})-(\d{1,2})$/);
    if (!match) return null;
    const year = Number(match[1]);
    const week = Number(match[2]);
    const januaryFourth = new Date(year, 0, 4);
    const januaryFourthDay = januaryFourth.getDay() || 7;
    const firstMonday = new Date(year, 0, 4 - januaryFourthDay + 1);
    const monday = new Date(firstMonday);
    monday.setDate(firstMonday.getDate() + (week - 1) * 7);
    monday.setHours(0, 0, 0, 0);
    return monday;
  };
  const fullPeriodWeekEntries = weekEntries
    .map(([weekKey, data]) => {
      const weekStart = getIsoWeekStart(weekKey);
      if (!weekStart) return null;
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      return { weekKey, data, weekStart, weekEnd };
    })
    .filter(item => item && item.weekStart >= from && item.weekEnd <= to)
    .sort((left, right) => left.weekStart - right.weekStart);
  const weeklyMetricByTrainee = trainees.reduce((acc, trainee) => {
    const rows = fullPeriodWeekEntries
      .map(item => (Array.isArray(item.data?.topPerformers) ? item.data.topPerformers : [])
        .find(performer => safeString(performer?.name) === trainee.id))
      .filter(Boolean);
    acc[trainee.id] = {
      available: rows.length > 0,
      incidents: rows.reduce((sum, performer) => sum + (Number(performer?.closed) || 0), 0),
      weeks: rows.length
    };
    return acc;
  }, {});
  const weeklyCoverageText = fullPeriodWeekEntries.length
    ? `${toInputDate(fullPeriodWeekEntries[0].weekStart)} — ${toInputDate(fullPeriodWeekEntries[fullPeriodWeekEntries.length - 1].weekEnd)}`
    : '';
  const getRequestWord = (count) => {
    const value = Math.abs(Number(count)) % 100;
    const tail = value % 10;
    if (value >= 11 && value <= 19) return 'запросов';
    if (tail === 1) return 'запрос';
    if (tail >= 2 && tail <= 4) return 'запроса';
    return 'запросов';
  };
  const exactTaskMap = new Map();
  weekEntries.forEach(([, data]) => {
    (Array.isArray(data?.detailedTasks) ? data.detailedTasks : []).forEach(task => {
      const id = safeString(task?.id);
      const assignee = safeString(task?.assignee);
      if (!id || !trainees.some(trainee => trainee.id === assignee) || !isInPeriod(task?.resolved)) return;
      exactTaskMap.set(id, task);
    });
  });
  const traineeRows = trainees.map(trainee => {
    const cases = allCases.filter(item => safeString(item.assignee) === trainee.id);
    const qualifications = [...new Set(cases.map(item => safeString(item.qualificationEvidence)).filter(Boolean))];
    const domains = [...new Set(cases.map(item => safeString(item.domain)).filter(value => value && value !== 'Прочее'))];
    const importedMetric = importedPeriodMetrics.find(item => safeString(item?.assignee) === trainee.id);
    const snapshotValue = metricSnapshots[periodKey]?.[trainee.id];
    const rawIncidentCount = snapshotValue !== undefined && snapshotValue !== ''
      ? snapshotValue
      : importedMetric?.requests;
    const parsedIncidentCount = Number(rawIncidentCount);
    const hasExactIncidents = rawIncidentCount !== undefined && rawIncidentCount !== '' && Number.isFinite(parsedIncidentCount);
    const weeklyMetric = weeklyMetricByTrainee[trainee.id] || { available: false, incidents: 0, weeks: 0 };
    const hasWeeklyIncidents = !hasExactIncidents && weeklyMetric.available;
    const metrics = {
      incidents: hasExactIncidents ? parsedIncidentCount : (hasWeeklyIncidents ? weeklyMetric.incidents : null),
      tasks: [...exactTaskMap.values()].filter(task => safeString(task?.assignee) === trainee.id).length,
      calls: null,
      missed: null,
      hasExactIncidents,
      hasWeeklyIncidents,
      source: hasExactIncidents ? 'exact' : (hasWeeklyIncidents ? 'weekly' : 'none'),
      coveredWeeks: weeklyMetric.weeks
    };
    const workLines = [
      `За период с ${fromDate.split('-').reverse().join('.')} по ${toDate.split('-').reverse().join('.')}`,
      metrics.hasExactIncidents ? `обработано ${metrics.incidents} ${getRequestWord(metrics.incidents)} Jira` : '',
      metrics.hasWeeklyIncidents ? `по базе закрыто ${metrics.incidents} инцидентов за ${metrics.coveredWeeks} полностью входящих недель` : '',
      metrics.hasWeeklyIncidents && weeklyCoverageText ? `покрытие недельных данных: ${weeklyCoverageText}; неполные пограничные недели не включены` : '',
      metrics.source === 'none' ? 'количество запросов Jira не заполнено: в базе нет подходящих полных недель или точной выгрузки периода' : '',
      metrics.tasks > 0 ? `выполнено ${metrics.tasks} задач` : '',
    ].filter(Boolean);
    const qualificationText = qualifications.length
      ? qualifications.join('\n')
      : 'Недостаточно доказательных нетиповых кейсов для вывода о повышении квалификации.';
    return {
      ...trainee,
      cases,
      qualifications,
      domains,
      metrics,
      workText: workLines.join('\n- '),
      qualificationText,
      meta: traineeMeta[trainee.id] || {}
    };
  });
  const comparableIncidentCounts = traineeRows.filter(item => item.metrics.source !== 'none').map(item => item.metrics.incidents);
  const maxIncidentCount = comparableIncidentCounts.length ? Math.max(...comparableIncidentCounts) : 0;
  traineeRows.forEach(item => {
    const highlights = [
      item.metrics.source !== 'none' && maxIncidentCount > 0 && item.metrics.incidents === maxIncidentCount
        ? `ТОП-1 среди стажёров ${item.metrics.hasExactIncidents ? 'по количеству запросов Jira' : 'по закрытым инцидентам в покрытых неделях'}`
        : ''
    ].filter(Boolean);
    if (highlights.length) item.workText += `\n- ${highlights.join('\n- ')}`;
  });
  const html = (value) => safeString(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  const handleCopyRows = async () => {
    const header = ['ФИО СТАЖЕРА', 'Направление', 'Дата начала стажировки', 'Количество отработанных часов', 'Согласованная сумма', 'Прошлый месяц', 'Выполненная работа', 'Повысил квалификацию', 'Комментарий'];
    const rows = traineeRows.map(trainee => [
      trainee.reportName,
      trainee.meta.direction,
      trainee.meta.startDate,
      trainee.meta.hours,
      trainee.meta.amount,
      trainee.meta.previousMonth,
      trainee.workText,
      trainee.qualificationText,
      trainee.meta.comment
    ]);
    await navigator.clipboard.writeText([header, ...rows].map(row => row.map(value => safeString(value).replace(/\t/g, ' ').replace(/\r?\n/g, ' | ')).join('\t')).join('\n'));
    setCopiedRows(true);
    setTimeout(() => setCopiedRows(false), 1800);
  };
  const handleDownload = () => {
    const tableRows = traineeRows.map(trainee => `<tr><td><strong>${html(trainee.reportName)}</strong></td><td>${html(trainee.meta.direction)}</td><td>${html(trainee.meta.startDate)}</td><td class="num">${html(trainee.meta.hours)}</td><td class="num">${html(trainee.meta.amount)}</td><td class="num">${html(trainee.meta.previousMonth)}</td><td>${html(trainee.workText).replace(/\n/g, '<br>')}</td><td>${html(trainee.qualificationText).replace(/\n/g, '<br>')}</td><td>${html(trainee.meta.comment)}</td></tr>`).join('');
    const details = traineeRows.map(trainee => `<section><h2>${html(trainee.reportName)} — доказательная расшифровка</h2>${trainee.cases.map(item => `<article><strong>${html(item.id)} · ${html(item.title)}</strong><p><b>Почему выделено:</b> ${html(item.whyNotable || (item.signals || []).join(', '))}</p><p><b>Вклад стажёра:</b> ${html(item.traineeContribution || 'не описан отдельно')}</p><p><b>Как решено:</b> ${html(item.resolution || 'не зафиксировано')}</p></article>`).join('') || '<p class="empty">Нет доказательных кейсов в загруженных данных.</p>'}</section>`).join('');
    const reportHtml = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>Отчет по стажерам</title><style>body{margin:0;background:#f3f6fa;color:#172033;font:13px/1.45 Calibri,Arial,sans-serif}.page{max-width:1500px;margin:auto;padding:26px}.cover{background:#102033;color:#fff;padding:22px;margin-bottom:14px}h1{margin:0 0 6px}.report-table{width:100%;border-collapse:collapse;background:#fff}.report-table th{background:#ffd966;color:#111;font-family:Georgia,serif;font-size:12px}.report-table th,.report-table td{border:1px solid #111;padding:10px;vertical-align:top}.report-table td{min-width:110px}.report-table td:nth-child(7),.report-table td:nth-child(8){min-width:260px}.num{text-align:center}section{background:#fff;border:1px solid #dbe3ec;padding:18px;margin:14px 0}section h2{margin:0 0 10px;font-size:17px}article{border-left:4px solid #8b5cf6;background:#f8fafc;padding:11px;margin:8px 0}article p{margin:5px 0}.empty{color:#64748b}@media print{body{background:#fff}.page{padding:0}.cover,section{break-inside:avoid}}</style></head><body><main class="page"><header class="cover"><h1>Отчёт по стажёрам</h1><div>Отчётный период: ${html(fromDate)} — ${html(toDate)}</div></header><table class="report-table"><thead><tr><th>ФИО СТАЖЕРА</th><th>Направление</th><th>Дата начала стажировки</th><th>Количество отработанных часов</th><th>Согласованная сумма (до вычета налогов)</th><th>Прошлый месяц</th><th>Выполненная работа</th><th>Повысил квалификацию</th><th>Комментарий</th></tr></thead><tbody>${tableRows}</tbody></table>${details}</main></body></html>`;
    const blob = new Blob([reportHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `trainee_development_${fromDate}_${toDate}.html`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="bg-slate-800 rounded-2xl border border-slate-700/60 p-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] font-black text-violet-300 mb-2">Ежемесячный срез к 20 числу</div>
            <h2 className="text-2xl font-black text-white">Развитие стажёров</h2>
            <p className="text-sm text-slate-400 mt-2 max-w-2xl">Не рейтинг по количеству. Здесь собираются доказательные сложные, редкие, необычные и длительные кейсы, которые показывают новую практику или рост самостоятельности.</p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-xs text-slate-400">С даты<input type="date" value={fromDate} onChange={event => setFromDate(event.target.value)} className="block mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200" /></label>
            <label className="text-xs text-slate-400">По дату<input type="date" value={toDate} onChange={event => setToDate(event.target.value)} className="block mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200" /></label>
            <button onClick={handleCopyRows} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-black"><Copy size={16} /> {copiedRows ? 'Скопировано' : 'Копировать строки'}</button>
            <button onClick={handleDownload} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-black"><Download size={16} /> Скачать HTML</button>
          </div>
        </div>
      </div>

      {dbStatus !== 'connected' && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-100">
          <strong className="block text-amber-300">Облачная база не подключена</strong>
          <span className="block mt-1 text-xs leading-relaxed text-amber-100/70">
            Сейчас отчёт читает только локальный кэш этого компьютера. Для загрузки сохранённой истории Supabase нужны `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY` в `.env.local`, затем следует перезапустить сайт.
          </span>
        </div>
      )}

      <div className="bg-slate-800 rounded-2xl border border-slate-700/60 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-black text-white">Точные показатели Jira за период</h3>
            <p className="text-xs text-slate-400 mt-1">Значения относятся строго к датам выше. Суммы пересекающихся недель больше не используются.</p>
          </div>
          <span className="w-fit rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-300">
            {periodKey === '2026-06-20_2026-07-19' ? 'Сверено по Jira · 20.07.2026' : 'Ручная сверка / месячная выгрузка'}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {trainees.map(trainee => (
            <label key={trainee.id} className="rounded-xl border border-slate-700 bg-slate-950/40 p-3 text-xs text-slate-400">
              <span className="block font-bold text-slate-200 mb-2">{trainee.reportName}</span>
              <input
                type="number"
                min="0"
                value={
                  metricSnapshots[periodKey]?.[trainee.id]
                  ?? importedPeriodMetrics.find(item => safeString(item?.assignee) === trainee.id)?.requests
                  ?? (weeklyMetricByTrainee[trainee.id]?.available ? weeklyMetricByTrainee[trainee.id].incidents : '')
                }
                onChange={event => updateMetricSnapshot(trainee.id, event.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-lg font-black text-white"
                placeholder="Запросов за период"
              />
              <span className="block mt-2 text-[10px] leading-relaxed text-slate-500">
                {metricSnapshots[periodKey]?.[trainee.id] !== undefined
                  ? 'Сохранённый точный снимок периода'
                  : importedPeriodMetrics.some(item => safeString(item?.assignee) === trainee.id)
                    ? 'Точная месячная выгрузка из базы'
                    : weeklyMetricByTrainee[trainee.id]?.available
                      ? `Авто из базы: ${weeklyMetricByTrainee[trainee.id].weeks} полных недель`
                      : 'В сохранённой истории нет подходящих недель'}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-slate-800 rounded-2xl border border-slate-700/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700/60">
          <h3 className="font-black text-white">Готовые строки для отчёта 20 числа</h3>
          <p className="text-xs text-slate-500 mt-1">Служебные значения часов и сумм редактируются вручную и сохраняются на этом компьютере. Объём сверяется по точному периоду Jira, квалификация собирается из доказательных кейсов.</p>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-[1650px] w-full text-xs">
            <thead className="bg-amber-300 text-slate-950">
              <tr>
                {['ФИО СТАЖЕРА', 'Направление', 'Дата начала стажировки', 'Отработано часов', 'Согласованная сумма', 'Прошлый месяц', 'Выполненная работа', 'Повысил квалификацию', 'Комментарий'].map(title => <th key={title} className="px-3 py-3 border-r border-amber-500/50 text-left font-black">{title}</th>)}
              </tr>
            </thead>
            <tbody>
              {traineeRows.map(trainee => (
                <tr key={trainee.id} className="border-t border-slate-700 align-top">
                  <td className="p-3 font-black text-white">{trainee.reportName}</td>
                  <td className="p-2"><input value={trainee.meta.direction || ''} onChange={event => updateTraineeMeta(trainee.id, 'direction', event.target.value)} className="w-full min-w-[150px] bg-slate-950/60 border border-slate-700 rounded px-2 py-2 text-slate-200" /></td>
                  <td className="p-2"><input value={trainee.meta.startDate || ''} onChange={event => updateTraineeMeta(trainee.id, 'startDate', event.target.value)} className="w-full min-w-[100px] bg-slate-950/60 border border-slate-700 rounded px-2 py-2 text-slate-200" /></td>
                  <td className="p-2"><input type="number" value={trainee.meta.hours || ''} onChange={event => updateTraineeMeta(trainee.id, 'hours', event.target.value)} className="w-24 bg-slate-950/60 border border-slate-700 rounded px-2 py-2 text-slate-200" placeholder="0" /></td>
                  <td className="p-2"><input type="number" value={trainee.meta.amount || ''} onChange={event => updateTraineeMeta(trainee.id, 'amount', event.target.value)} className="w-28 bg-slate-950/60 border border-slate-700 rounded px-2 py-2 text-slate-200" placeholder="0" /></td>
                  <td className="p-2"><input type="number" value={trainee.meta.previousMonth || ''} onChange={event => updateTraineeMeta(trainee.id, 'previousMonth', event.target.value)} className="w-28 bg-slate-950/60 border border-slate-700 rounded px-2 py-2 text-slate-200" placeholder="0" /></td>
                  <td className="p-3 min-w-[300px] whitespace-pre-line text-slate-300 leading-relaxed">{trainee.workText}</td>
                  <td className="p-3 min-w-[320px] whitespace-pre-line text-emerald-200 leading-relaxed">{trainee.qualificationText}</td>
                  <td className="p-2"><textarea value={trainee.meta.comment || ''} onChange={event => updateTraineeMeta(trainee.id, 'comment', event.target.value)} className="w-full min-w-[180px] min-h-[100px] bg-slate-950/60 border border-slate-700 rounded px-2 py-2 text-slate-200 resize-y" placeholder="Комментарий руководителя" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {traineeRows.map(trainee => (
          <div key={trainee.id} className="bg-slate-800 rounded-2xl border border-slate-700/60 overflow-hidden">
            <div className="p-5 border-b border-slate-700/60 bg-slate-900/30">
              <div className="flex justify-between gap-3">
                <div><h3 className="font-black text-white">{trainee.name}</h3><p className="text-xs text-slate-500 mt-1">{trainee.id}</p></div>
                <span className="h-fit rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 px-3 py-1 text-xs font-black">{trainee.cases.length} кейсов</span>
              </div>
              <p className="text-xs text-slate-400 mt-3">Домены: {trainee.domains.join(', ') || 'пока не выделены'}</p>
            </div>
            <div className="p-5 space-y-3">
              {trainee.qualifications.length > 0 && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <div className="text-[10px] uppercase tracking-wider font-black text-emerald-300 mb-2">Подтвержденная практика</div>
                  {trainee.qualifications.map((item, index) => <p key={`${item}-${index}`} className="text-xs text-emerald-100 mb-1 last:mb-0">{item}</p>)}
                </div>
              )}
              {trainee.cases.length ? trainee.cases.map(item => (
                <div key={`${item.source}-${item.id}`} className="rounded-xl border border-slate-700 bg-slate-950/40 p-3">
                  <div className="flex items-start justify-between gap-2"><div className="text-sm font-bold text-slate-100">{item.id} · {safeString(item.title)}</div><span className="text-[10px] text-violet-300 shrink-0">{item.source}</span></div>
                  <div className="flex flex-wrap gap-1 mt-2">{(item.signals || []).map(signal => <span key={signal} className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">{signal}</span>)}</div>
                  <p className="text-xs text-slate-400 mt-2"><strong className="text-slate-300">Почему:</strong> {safeString(item.whyNotable || 'нетиповой кейс')}</p>
                  <p className="text-xs text-slate-400 mt-2"><strong className="text-slate-300">Как решено:</strong> {safeString(item.resolution || 'не зафиксировано')}</p>
                </div>
              )) : <div className="rounded-xl border border-dashed border-slate-700 p-5 text-center text-xs text-slate-500">За выбранный период нет доказательных нетиповых кейсов. Это не означает отсутствие развития — возможно, в старых JSON ещё нет новых массивов анализа.</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ReportsWorkspace = ({
  weekData,
  historyKeys,
  weeksHistory,
  selectedKey,
  onWeekSelect,
  projectTasks,
  setProjectTasks,
  csatReviews,
  aiTaskMemory,
  setAiTaskMemory,
  wordReportConfig,
  setWordReportConfig,
  teamMetricsMemory,
  dbStatus
}) => {
  const [workspaceTab, setWorkspaceTab] = useState('weekly');
  const workspaceTabs = [
    {
      id: 'weekly',
      step: '01',
      title: 'Еженедельный отчёт',
      description: 'Разметить задачи по разделам и выгрузить HTML или Word.',
      icon: FileText,
      activeClass: 'border-sky-400 bg-sky-500/15 text-sky-100',
      iconClass: 'text-sky-300'
    },
    {
      id: 'management',
      step: '02',
      title: 'Поручения руководства',
      description: 'Добавить, обновить и приоритизировать задачи руководства.',
      icon: Target,
      activeClass: 'border-fuchsia-400 bg-fuchsia-500/15 text-fuchsia-100',
      iconClass: 'text-fuchsia-300'
    },
    {
      id: 'postmortems',
      step: '03',
      title: 'Постмортемы',
      description: 'Выгрузить Финтехлаб и разбор ТОП-1 проблемы недели.',
      icon: FileSearch,
      activeClass: 'border-amber-400 bg-amber-500/15 text-amber-100',
      iconClass: 'text-amber-300'
    },
    {
      id: 'trainees',
      step: '04',
      title: 'Развитие стажёров',
      description: 'Собрать сложные и редкие кейсы для ежемесячной квалификационной оценки.',
      icon: Award,
      activeClass: 'border-violet-400 bg-violet-500/15 text-violet-100',
      iconClass: 'text-violet-300'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <div className="mb-7">
        <div className="text-[10px] uppercase tracking-[0.24em] font-black text-emerald-300 mb-2">Единый рабочий процесс</div>
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Центр отчётов</h1>
        <p className="text-slate-400 text-sm max-w-3xl">Все регулярные сценарии собраны в одном месте: подготовка еженедельного отчёта, ведение поручений руководства и материалы для разбора с командой.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-8">
        {workspaceTabs.map(item => {
          const Icon = item.icon;
          const isActive = workspaceTab === item.id;
          return (
            <button key={item.id} onClick={() => setWorkspaceTab(item.id)} className={`text-left rounded-xl border p-4 transition-all ${isActive ? item.activeClass : 'border-slate-700/60 bg-slate-800/70 text-slate-300 hover:border-slate-600 hover:bg-slate-800'}`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg bg-slate-950/60 border border-white/5 flex items-center justify-center ${item.iconClass}`}><Icon size={20} /></div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-widest font-black opacity-60">Шаг {item.step}</div>
                  <div className="font-black mt-0.5">{item.title}</div>
                  <div className="text-xs opacity-65 mt-1 leading-relaxed">{item.description}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {workspaceTab === 'weekly' && (
        <WordReportGenerator
          weekData={weekData}
          historyKeys={historyKeys}
          weeksHistory={weeksHistory}
          selectedKey={selectedKey}
          onWeekSelect={onWeekSelect}
          projectTasks={projectTasks}
          setProjectTasks={setProjectTasks}
          csatReviews={csatReviews}
          aiTaskMemory={aiTaskMemory}
          setAiTaskMemory={setAiTaskMemory}
          wordReportConfig={wordReportConfig}
          setWordReportConfig={setWordReportConfig}
          teamMetricsMemory={teamMetricsMemory}
          embedded
        />
      )}

      {workspaceTab === 'management' && (
        <ManagementTasksBoard
          projectTasks={projectTasks}
          setProjectTasks={setProjectTasks}
          selectedKey={selectedKey}
          historyKeys={historyKeys}
          weeksHistory={weeksHistory}
          weekData={weekData}
          onWeekSelect={onWeekSelect}
        />
      )}

      {workspaceTab === 'postmortems' && (
        <TrainingBoard
          weekData={weekData}
          historyKeys={historyKeys}
          weeksHistory={weeksHistory}
          selectedWeekKey={selectedKey}
          onWeekSelect={onWeekSelect}
          aiTaskMemory={aiTaskMemory}
          embedded
        />
      )}

      {workspaceTab === 'trainees' && (
        <TraineeDevelopmentReport
          weekData={weekData}
          weeksHistory={weeksHistory}
          selectedKey={selectedKey}
          dbStatus={dbStatus}
        />
      )}
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
  const avgEfficiency = rows.length > 0 ? Math.round(rows.reduce((sum, row) => sum + row.efficiencyIndex, 0) / rows.length) : 0;
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
      next[assignee] = rebuildMetricRowFromTaskDetails(row);
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
      next[assignee] = rebuildMetricRowFromTaskDetails(row);
      return next;
    });
  };

  const handleCommitTaskCalibration = (assignee, taskId) => {
    if (!assignee || !taskId) return;
    setTeamMetricsMemory(prev => {
      const next = JSON.parse(JSON.stringify(prev || {}));
      const row = next[assignee];
      const task = row?.taskDetails?.[taskId];
      if (!task) return prev || {};
      const size = normalizeTaskSize(task.size || task.originalSize) || 'M';
      const domain = normalizeMetricDomain(task.domain || task.originalDomain || '', task.title || '') || 'Прочее';
      task.size = size;
      task.weight = TEAM_METRIC_SIZE_WEIGHTS[size] || TEAM_METRIC_SIZE_WEIGHTS.M;
      task.domain = domain;
      task.manualSize = true;
      task.manualDomain = true;
      task.updatedAt = new Date().toISOString();
      next[assignee] = rebuildMetricRowFromTaskDetails(row);
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
      next[assignee] = rebuildMetricRowFromTaskDetails(row);
      return next;
    });
  };

  const handleDeleteStoredTask = (assignee, taskId) => {
    if (!assignee || !taskId) return;
    setTeamMetricsMemory(prev => {
      const next = JSON.parse(JSON.stringify(prev || {}));
      const row = next[assignee];
      if (!row?.taskDetails?.[taskId]) return prev || {};
      delete row.taskDetails[taskId];
      if (row.taskIds) delete row.taskIds[taskId];
      const rebuilt = rebuildMetricRowFromTaskDetails(row);
      if (Object.keys(rebuilt.taskDetails || {}).length === 0) delete next[assignee];
      else next[assignee] = rebuilt;
      return next;
    });
  };

  const handleClearUncalibratedTasks = () => {
    let removedCount = 0;
    const next = JSON.parse(JSON.stringify(teamMetricsMemory || {}));
    Object.keys(next).forEach(assignee => {
      const row = next[assignee];
      Object.keys(row?.taskDetails || {}).forEach(taskId => {
        const task = row.taskDetails[taskId];
        if (!(task?.manualSize && task?.manualDomain)) {
          delete row.taskDetails[taskId];
          if (row.taskIds) delete row.taskIds[taskId];
          removedCount += 1;
        }
      });
      const rebuilt = rebuildMetricRowFromTaskDetails(row);
      if (Object.keys(rebuilt.taskDetails || {}).length === 0) delete next[assignee];
      else next[assignee] = rebuilt;
    });
    setTeamMetricsMemory(next);
    setImportResult({ type: 'cleanup', fileName: 'Очистка очереди', removed: removedCount });
    setTimeout(() => setImportResult(null), 5000);
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
        <div className={`mb-6 rounded-xl border p-4 ${importResult.type === 'success' || importResult.type === 'cleanup' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100' : 'bg-red-500/10 border-red-500/30 text-red-100'}`}>
          {importResult.type === 'cleanup'
            ? `Очистка выполнена: удалено неразмеченных задач из памяти: ${importResult.removed}. При следующем импорте недели они загрузятся заново.`
            : importResult.type === 'success'
            ? `Импортировано: ${importResult.added}. Дубликаты/пропуски: ${importResult.skipped}. Обновлено сотрудников: ${importResult.employees}. Файл: ${importResult.fileName}.`
            : `Не удалось разобрать файл ${importResult.fileName}. Проверь JSON или CSV-колонки.`}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700/50">
          <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Вес выполненных задач</div>
          <div className="text-3xl font-black text-white mt-2">{totalWeight}</div>
          <div className="text-xs text-slate-400 mt-1">Легко=1, Средне=3, Сложно=8, Очень сложно=15 · {totalTasks} задач</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700/50">
          <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Средний индекс эффективности</div>
          <div className="text-3xl font-black text-cyan-300 mt-2">{avgEfficiency}</div>
          <div className="text-xs text-slate-400 mt-1">70% вес задач + 30% сложность. Сроки справочно</div>
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
          Это не автоматическое кадровое решение, а калиброванный срез работы системных админов. Вес считается по закрытым задачам: Легко=1, Средне=3, Сложно=8, Очень сложно=15. Индекс эффективности складывается из веса задач относительно лидера и доли сложных работ. Сроки пока справочные: они не штрафуют админа, пока в данных нет надежной даты назначения задачи именно на него.
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
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Award size={20} className="text-amber-400" /> Лидеры эффективности</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {podiumRows.map((row, index) => {
                const rankColors = [
                  'border-amber-300 bg-amber-500/10 shadow-[0_0_34px_rgba(245,158,11,0.22)]',
                  'border-cyan-300 bg-cyan-500/10 shadow-[0_0_30px_rgba(34,211,238,0.18)]',
                  'border-slate-500 bg-slate-700/30'
                ];
                const rankLabels = ['1 место · лидер эффективности', '2 место · сильная эффективность', '3 место · стабильная эффективность'];
                return (
                  <div key={`podium-${row.name}`} className={`rounded-xl border p-5 ${rankColors[index] || 'border-slate-700 bg-slate-800'}`}>
                    <div className="flex justify-between items-start gap-3 mb-4">
                      <div>
                        <div className="text-xs uppercase font-black tracking-wider text-slate-400">{rankLabels[index]}</div>
                        <div className="text-lg font-black text-white mt-1">{index === 0 ? '🏆 ' : index === 1 ? '✦ ' : ''}{row.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-4xl font-black text-cyan-300">{row.efficiencyIndex}</div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold">Индекс эффективности</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center mb-4">
                      <div className="bg-slate-950/60 rounded border border-slate-700 p-2"><div className="text-[10px] text-slate-500 uppercase font-bold">Средние</div><div className="text-white font-black">{row.mediumTasksCount}</div></div>
                      <div className="bg-slate-950/60 rounded border border-slate-700 p-2"><div className="text-[10px] text-slate-500 uppercase font-bold">Сложные+</div><div className="text-white font-black">{row.complexTasksCount}</div></div>
                      <div className="bg-slate-950/60 rounded border border-slate-700 p-2"><div className="text-[10px] text-slate-500 uppercase font-bold">Вес</div><div className="text-white font-black">{row.totalWeight}</div></div>
                    </div>
                    <div className="flex items-center justify-between gap-2 mb-4 text-xs">
                      <span className="text-slate-400">Сроки справочно: <b className={row.onTimeShare !== null && row.onTimeShare < 60 ? 'text-amber-300' : 'text-emerald-300'}>{row.onTimeShare === null ? 'нет данных' : `${row.onTimeShare}% в норме`}</b></span>
                      <span className="px-2 py-0.5 rounded-full border font-bold" style={{ background: row.weeklyTrend.bg, color: row.weeklyTrend.color, borderColor: row.weeklyTrend.border }}>{row.weeklyTrend.icon} {row.weeklyTrend.label}</span>
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
                    <div className="text-xs text-slate-500">{row.totalTasks} задач · вес {row.totalWeight}</div>
                  </div>
                  <div className="col-span-2 text-cyan-300 font-black text-xl">{row.efficiencyIndex}</div>
                  <div className="col-span-2 text-sm text-slate-300">Вес {row.totalWeight}<br/><span className="text-slate-500">Сроки справочно {row.onTimeShare === null ? '-' : `${row.onTimeShare}%`}</span></div>
                  <div className="col-span-4 flex flex-wrap gap-2">
                    {row.topDomains.slice(0, 2).map(([domain, score]) => {
                      const share = row.totalWeight > 0 ? Math.round(((Number(score) || 0) / row.totalWeight) * 100) : 0;
                      const rank = getDomainRank(domainRankMap, domain, row.name);
                      const badge = getExpertiseBadge(score, rank, share);
                      return <span key={`table-${row.name}-${domain}`} className="px-2.5 py-1 rounded-full text-[11px] font-bold border" style={{ background: badge.bg, color: badge.color, borderColor: badge.border }}>{badge.icon} {domain}: {score} · {badge.label}</span>;
                    })}
                  </div>
                  <div className="col-span-12 text-xs text-slate-400 leading-relaxed bg-slate-900/40 border border-slate-700/40 rounded-lg px-3 py-2">
                    {row.summary}
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
                  onClick={handleClearUncalibratedTasks}
                  className="px-3 py-2 rounded-lg text-xs font-bold border bg-red-500/10 text-red-200 border-red-500/30 hover:bg-red-500/20"
                  title="Удалить из памяти все задачи без ручной разметки сложности и домена. При следующем импорте недели они загрузятся заново."
                >
                  Очистить неразмеченные
                </button>
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
                    <div className="flex flex-col gap-1 items-end">
                      <button
                        type="button"
                        onClick={() => handleCommitTaskCalibration(task.assignee, task.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border ${task.manualSize && task.manualDomain ? 'border-emerald-400 bg-emerald-500/10 text-emerald-200' : 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20'}`}
                        title="Записать текущую сложность и домен в память"
                      >
                        В память
                      </button>
                      {task.manualSize && task.manualDomain ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteStoredTask(task.assignee, task.id)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold border border-red-500/40 text-red-200 bg-red-500/10 hover:bg-red-500/20"
                          title="Удалить эту задачу из исторической памяти"
                        >
                          Удалить
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleResetTaskCalibration(task.assignee, task.id)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold border border-slate-700 text-slate-400 bg-slate-950 hover:border-red-400 hover:text-red-200"
                          title="Отменить ручную разметку этой задачи"
                        >
                          Сброс
                        </button>
                      )}
                    </div>
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
  const [wordReportConfig, setWordReportConfig] = useState(() => { try { const saved = localStorage.getItem('teamlead_word_report_config_v1'); if (saved) return JSON.parse(saved); } catch (e) {} return createDefaultWordReportConfig(); });
  
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
        const wordReportRow = cloudData.find(r => r.key_name === 'word_report_config'); if (wordReportRow) setWordReportConfig(wordReportRow.value_data || createDefaultWordReportConfig());
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
  useEffect(() => { saveToDb('word_report_config', wordReportConfig, 'teamlead_word_report_config_v1'); }, [wordReportConfig]);

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
      case 'reports': return <ReportsWorkspace weekData={activeWeekData} historyKeys={historyKeys} weeksHistory={weeksHistory} selectedKey={selectedWeekKey} onWeekSelect={setSelectedWeekKey} projectTasks={projectTasks} setProjectTasks={setProjectTasks} csatReviews={csatReviews} aiTaskMemory={aiTaskMemory} setAiTaskMemory={setAiTaskMemory} wordReportConfig={wordReportConfig} setWordReportConfig={setWordReportConfig} teamMetricsMemory={teamMetricsMemory} dbStatus={dbStatus} />;
      case 'wordReport': return <WordReportGenerator weekData={activeWeekData} historyKeys={historyKeys} weeksHistory={weeksHistory} selectedKey={selectedWeekKey} onWeekSelect={setSelectedWeekKey} projectTasks={projectTasks} setProjectTasks={setProjectTasks} csatReviews={csatReviews} aiTaskMemory={aiTaskMemory} setAiTaskMemory={setAiTaskMemory} wordReportConfig={wordReportConfig} setWordReportConfig={setWordReportConfig} teamMetricsMemory={teamMetricsMemory} />;
      case 'archive': return <TasksArchiveBoard tasksArchive={tasksArchive} />;
      case 'training': return <TrainingBoard weekData={activeWeekData} historyKeys={historyKeys} weeksHistory={weeksHistory} selectedWeekKey={selectedWeekKey} onWeekSelect={setSelectedWeekKey} aiTaskMemory={aiTaskMemory} />;
      case 'weeklyCompetencies': return <WeeklyCompetenciesBoard weekData={activeWeekData} historyKeys={historyKeys} weeksHistory={weeksHistory} selectedWeekKey={selectedWeekKey} onWeekSelect={setSelectedWeekKey} aiTaskMemory={aiTaskMemory} />;
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
    { id: 'reports', icon: FileText, label: 'Центр отчетов', roles: ['admin', 'viewer'] },
    { id: 'team', icon: Users, label: 'Команда', roles: ['admin', 'viewer'] },
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
