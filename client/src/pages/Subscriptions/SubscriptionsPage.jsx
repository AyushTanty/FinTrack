import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Modal, Form, Spinner, Alert, OverlayTrigger, Tooltip, Row, Col, Nav } from 'react-bootstrap';
import { Calendar, Trash2, Edit3, CheckCircle, XCircle, PauseCircle, Plus, Info, Sparkles } from 'lucide-react';
import { subscriptionService } from '../../services/subscriptionService';
import { categoryService } from '../../services/categoryService';
import { formatCurrency } from '../../utils/formatCurrency';
import { useToast } from '../../context/ToastContext';

// Complete Subscription Types with rich metadata & styling
export const SUBSCRIPTION_TYPES = {
  FOOD: {
    label: 'Food & Meal Plan',
    icon: '🍱',
    color: '#10B981',
    badgeClass: 'border border-success text-success bg-success bg-opacity-10',
    isFlexibleDefault: true,
    isDailyPlan: true,
    description: 'Tiffin, mess, or meal delivery with daily skip & holiday deduction'
  },
  GYM: {
    label: 'Gym & Fitness',
    icon: '🏋️',
    color: '#F59E0B',
    badgeClass: 'border border-warning text-warning bg-warning bg-opacity-10',
    isFlexibleDefault: true,
    isDailyPlan: true,
    description: 'Fitness memberships, yoga, training with holiday/skip pause'
  },
  OTT: {
    label: 'OTT & Streaming',
    icon: '🎬',
    color: '#8B5CF6',
    badgeClass: 'border border-primary text-primary bg-primary bg-opacity-10',
    isFlexibleDefault: false,
    isDailyPlan: false,
    description: 'Netflix, Prime, Spotify, YouTube Premium'
  },
  INTERNET: {
    label: 'Broadband & Wifi',
    icon: '🌐',
    color: '#06B6D4',
    badgeClass: 'border border-info text-info bg-info bg-opacity-10',
    isFlexibleDefault: false,
    isDailyPlan: false,
    description: 'Home fiber, high-speed internet connection'
  },
  MOBILE: {
    label: 'Mobile Recharge',
    icon: '📱',
    color: '#3B82F6',
    badgeClass: 'border border-primary text-primary bg-primary bg-opacity-10',
    isFlexibleDefault: false,
    isDailyPlan: false,
    description: 'Postpaid bill or recurring prepaid pack'
  },
  SOFTWARE: {
    label: 'Software / SaaS',
    icon: '💻',
    color: '#6366F1',
    badgeClass: 'border border-indigo text-indigo bg-indigo bg-opacity-10',
    isFlexibleDefault: false,
    isDailyPlan: false,
    description: 'Cloud storage, AI tools, developer software'
  },
  COURSE: {
    label: 'Course & Learning',
    icon: '📚',
    color: '#EC4899',
    badgeClass: 'border border-danger text-danger bg-danger bg-opacity-10',
    isFlexibleDefault: false,
    isDailyPlan: false,
    description: 'Online learning, coaching, certifications'
  },
  OTHER: {
    label: 'Other Subscription',
    icon: '📦',
    color: '#94A3B8',
    badgeClass: 'border border-secondary text-secondary bg-secondary bg-opacity-10',
    isFlexibleDefault: false,
    isDailyPlan: false,
    description: 'Newspaper, milk delivery, or general recurring plan'
  }
};

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [subToDelete, setSubToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Usage Heatmap Modal State
  const [calendarSub, setCalendarSub] = useState(null);
  const [usageLogs, setUsageLogs] = useState({}); // key: 'YYYY-MM-DD' -> { status, notes }
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [selectedDayObj, setSelectedDayObj] = useState(null);
  const [editingNote, setEditingNote] = useState('');
  const [editingStatus, setEditingStatus] = useState('SKIPPED');
  const [savingDay, setSavingDay] = useState(false);

  const { showToast } = useToast();
  const todayStr = new Date().toISOString().split('T')[0];

  const addDaysToDate = (dateStr, days) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  // Comprehensive, intelligent Form State
  const [formData, setFormData] = useState({
    name: '',
    type: 'FOOD',
    categoryId: '',
    amount: '',
    durationPreset: '15', // '15' | '30' | '7' | 'CUSTOM'
    billingCycle: 'MONTHLY',
    startDate: todayStr,
    nextBillingDate: addDaysToDate(todayStr, 15),
    isFlexible: true,
    skipRule: 'REFUND_PER_DAY',
    notes: ''
  });

  const fetchSubs = async () => {
    setLoading(true);
    try {
      const [resSubs, resCats] = await Promise.all([
        subscriptionService.list(),
        categoryService.getCategories()
      ]);
      setSubs(resSubs.data?.data || []);
      const cats = resCats.data?.data || [];
      setCategories(cats);
      if (cats.length > 0 && !formData.categoryId) {
        const defaultCat = cats.find(c => c.name.toLowerCase().includes('food'))?.id || cats[0]?.id;
        setFormData(prev => ({ ...prev, categoryId: defaultCat }));
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubs();
  }, []);

  // Smart Type Selector that preconfigures intelligent defaults without hiding any controls
  const handleTypeSelect = (selectedType) => {
    const meta = SUBSCRIPTION_TYPES[selectedType] || SUBSCRIPTION_TYPES.OTHER;
    const isFlex = meta.isFlexibleDefault;
    const preset = selectedType === 'FOOD' ? '15' : '30';
    const days = parseInt(preset, 10) || 30;

    let matchedCatId = formData.categoryId;
    if (categories.length > 0) {
      if (selectedType === 'FOOD') {
        const c = categories.find(cat => cat.name.toLowerCase().includes('food'));
        if (c) matchedCatId = c.id;
      } else if (selectedType === 'OTT') {
        const c = categories.find(cat => cat.name.toLowerCase().includes('entertainment') || cat.name.toLowerCase().includes('subscription'));
        if (c) matchedCatId = c.id;
      }
    }

    setFormData(prev => ({
      ...prev,
      type: selectedType,
      categoryId: matchedCatId,
      isFlexible: isFlex,
      durationPreset: preset,
      skipRule: isFlex ? 'REFUND_PER_DAY' : 'NO_ADJUSTMENT',
      nextBillingDate: addDaysToDate(prev.startDate, days)
    }));
  };

  // Duration Presets (15 Days, 30 Days, 7 Days, Custom)
  const handlePresetSelect = (preset) => {
    if (preset === 'CUSTOM') {
      setFormData(prev => ({ ...prev, durationPreset: 'CUSTOM' }));
      return;
    }
    const days = parseInt(preset, 10) || 30;
    setFormData(prev => ({
      ...prev,
      durationPreset: preset,
      billingCycle: days <= 7 ? 'WEEKLY' : 'MONTHLY',
      nextBillingDate: addDaysToDate(prev.startDate, days)
    }));
  };

  const handleStartDateChange = (newStart) => {
    setFormData(prev => {
      if (prev.durationPreset !== 'CUSTOM') {
        const days = parseInt(prev.durationPreset, 10) || 15;
        return {
          ...prev,
          startDate: newStart,
          nextBillingDate: addDaysToDate(newStart, days)
        };
      }
      return { ...prev, startDate: newStart };
    });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const parsedAmount = parseFloat(formData.amount);
      if (!parsedAmount || parsedAmount <= 0) {
        showToast('Please specify a valid amount', 'danger');
        return;
      }

      await subscriptionService.add({
        name: formData.name,
        type: formData.type,
        categoryId: formData.categoryId || undefined,
        amount: parsedAmount,
        billingCycle: formData.billingCycle,
        startDate: formData.startDate,
        nextBillingDate: formData.nextBillingDate,
        isFlexible: formData.isFlexible,
        skipRule: formData.isFlexible ? formData.skipRule : 'NO_ADJUSTMENT',
        notes: formData.notes || undefined
      });

      showToast(`Added ${formData.name}! ${formData.isFlexible ? 'Skips and holidays will automatically deduct from price.' : ''}`, 'success');
      setShowAddModal(false);

      // Reset
      const defaultCat = categories.find(c => c.name.toLowerCase().includes('food'))?.id || categories[0]?.id || '';
      setFormData({
        name: '',
        type: 'FOOD',
        categoryId: defaultCat,
        amount: '',
        durationPreset: '15',
        billingCycle: 'MONTHLY',
        startDate: todayStr,
        nextBillingDate: addDaysToDate(todayStr, 15),
        isFlexible: true,
        skipRule: 'REFUND_PER_DAY',
        notes: ''
      });

      fetchSubs();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to add subscription', 'danger');
    }
  };

  // Toggle active/cancelled state (Cancel / Reactivate)
  const handleToggleActive = async (sub) => {
    try {
      if (sub.isActive) {
        await subscriptionService.cancel(sub.id);
        showToast(`Cancelled ${sub.name}. Billing and daily tracking stopped.`, 'info');
      } else {
        await subscriptionService.reactivate(sub.id);
        showToast(`Reactivated ${sub.name}!`, 'success');
      }
      fetchSubs();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update subscription status', 'danger');
    }
  };

  // Delete subscription
  const handleDeleteSub = async () => {
    if (!subToDelete) return;
    setDeleteLoading(true);
    try {
      const res = await subscriptionService.delete(subToDelete.id);
      if (res.data?.data?.disabled) {
        showToast(res.data.data.message || 'Subscription marked as Cancelled due to past expenses', 'info');
      } else {
        showToast(`Successfully deleted ${subToDelete.name}`, 'success');
      }
      setSubToDelete(null);
      fetchSubs();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete subscription', 'danger');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Build the exact array of plan days
  const getSubscriptionPlanDays = (sub) => {
    if (!sub) return [];
    const sDate = new Date(sub.startDate);
    const eDate = new Date(sub.nextBillingDate);
    const diffMs = eDate.getTime() - sDate.getTime();
    let daysCount = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (daysCount <= 0) {
      daysCount = sub.type === 'FOOD' ? 15 : 30;
    }
    daysCount = Math.min(Math.max(1, daysCount), 60);

    const days = [];
    for (let i = 0; i < daysCount; i++) {
      const d = new Date(sDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayNum = i + 1;
      const log = usageLogs[dateStr] || { status: 'USED', notes: '' };
      days.push({
        dayIndex: dayNum,
        dateStr,
        fullDate: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        displayDate: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        isToday: dateStr === todayStr,
        status: log.status || 'USED',
        notes: log.notes || ''
      });
    }
    return days;
  };

  // Open usage calendar for flexible subscription
  const openCalendar = async (sub) => {
    if (!sub.isFlexible) {
      showToast('Heatmap tracking is only enabled for flexible or daily plans (e.g. Food, Gym)', 'info');
      return;
    }
    setCalendarSub(sub);
    setSelectedDayObj(null);
    setLoadingUsage(true);

    // Seed map immediately from sub.usageLogs if present
    const map = {};
    if (sub.usageLogs && Array.isArray(sub.usageLogs)) {
      sub.usageLogs.forEach(log => {
        const dateStr = new Date(log.date).toISOString().split('T')[0];
        map[dateStr] = { status: log.status, notes: log.notes || '' };
      });
      setUsageLogs(map);
    }

    try {
      const res = await subscriptionService.getUsage(sub.id);
      (res.data?.data || []).forEach(log => {
        const dateStr = new Date(log.date).toISOString().split('T')[0];
        map[dateStr] = { status: log.status, notes: log.notes || '' };
      });
      setUsageLogs({ ...map });
    } catch {
      // Use existing logs if network fails
    } finally {
      setLoadingUsage(false);
    }
  };

  // Selecting a day to edit note or status
  const handleSelectDay = (dayObj) => {
    setSelectedDayObj(dayObj);
    const existing = usageLogs[dayObj.dateStr] || { status: dayObj.status, notes: dayObj.notes };
    setEditingStatus(existing.status || 'SKIPPED');
    setEditingNote(existing.notes || '');
  };

  // Save updated day log with status and note
  const handleSaveDayLog = async () => {
    if (!calendarSub || !selectedDayObj) return;
    setSavingDay(true);
    try {
      await subscriptionService.logUsage(calendarSub.id, {
        date: selectedDayObj.dateStr,
        status: editingStatus,
        notes: editingNote.trim() || null
      });

      // Update local state map
      setUsageLogs(prev => ({
        ...prev,
        [selectedDayObj.dateStr]: {
          status: editingStatus,
          notes: editingNote.trim() || ''
        }
      }));

      // Update in master subs list as well so table instantly updates
      setSubs(prevSubs => prevSubs.map(s => {
        if (s.id === calendarSub.id) {
          const updatedLogs = [...(s.usageLogs || []).filter(l => new Date(l.date).toISOString().split('T')[0] !== selectedDayObj.dateStr)];
          updatedLogs.push({ date: selectedDayObj.dateStr, status: editingStatus, notes: editingNote.trim() || null });
          return { ...s, usageLogs: updatedLogs };
        }
        return s;
      }));

      const isDeducted = editingStatus === 'SKIPPED' || editingStatus === 'HOLIDAY';
      showToast(`Updated Day ${selectedDayObj.dayIndex}! ${isDeducted ? 'Price minused for this day.' : 'Marked as food consumed.'}`, 'success');
      setSelectedDayObj(null);
    } catch {
      showToast('Failed to save day record', 'danger');
    } finally {
      setSavingDay(false);
    }
  };

  // Quick double-click cycle
  const handleQuickToggle = async (dayObj) => {
    if (!calendarSub) return;
    const current = usageLogs[dayObj.dateStr]?.status || dayObj.status || 'USED';
    let nextStatus = 'SKIPPED';
    if (current === 'SKIPPED') nextStatus = 'HOLIDAY';
    else if (current === 'HOLIDAY') nextStatus = 'USED';

    const currentNotes = usageLogs[dayObj.dateStr]?.notes || dayObj.notes || '';

    try {
      await subscriptionService.logUsage(calendarSub.id, {
        date: dayObj.dateStr,
        status: nextStatus,
        notes: currentNotes || null
      });
      setUsageLogs(prev => ({
        ...prev,
        [dayObj.dateStr]: {
          status: nextStatus,
          notes: currentNotes
        }
      }));
      setSubs(prevSubs => prevSubs.map(s => {
        if (s.id === calendarSub.id) {
          const updatedLogs = [...(s.usageLogs || []).filter(l => new Date(l.date).toISOString().split('T')[0] !== dayObj.dateStr)];
          updatedLogs.push({ date: dayObj.dateStr, status: nextStatus, notes: currentNotes });
          return { ...s, usageLogs: updatedLogs };
        }
        return s;
      }));
    } catch {
      showToast('Failed to toggle day', 'danger');
    }
  };

  // All subscriptions shown directly without separate filter tabs
  const filteredSubs = subs;

  // Calculate stats for Calendar Modal
  const planDays = calendarSub ? getSubscriptionPlanDays(calendarSub) : [];
  const totalDaysInPlan = planDays.length || 1;
  const skippedCount = planDays.filter(p => p.status === 'SKIPPED').length;
  const holidayCount = planDays.filter(p => p.status === 'HOLIDAY').length;
  const totalDeductedDays = skippedCount + holidayCount;
  const usedCount = planDays.filter(p => p.status === 'USED').length;
  const planDailyRate = calendarSub ? (Number(calendarSub.amount) / totalDaysInPlan) : 0;
  const totalDeduction = totalDeductedDays * planDailyRate;
  const effectiveCost = Math.max(0, (Number(calendarSub?.amount || 0) - totalDeduction));

  // Live calculation for Add Modal
  const currentPlanDaysCount = Math.max(1, Math.round((new Date(formData.nextBillingDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24))) || 15;
  const currentDailyRate = parseFloat(formData.amount) > 0 ? (parseFloat(formData.amount) / currentPlanDaysCount) : 0;

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 mb-md-4 gap-2">
        <div>
          <h2 className="mb-0 fw-bold tracking-tight text-white fs-4 fs-md-2">Subscriptions & Plans</h2>
          <span className="text-secondary small d-none d-sm-inline">
            Track OTT, gym, and daily meal plans with automated skip & holiday price deductions
          </span>
        </div>
        <Button
          className="btn-quick-add d-flex align-items-center gap-1.5 shadow-sm py-1.5 px-3"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span className="fw-semibold">Add Subscription</span>
        </Button>
      </div>

      {/* Overview Stats Bar (All plans shown directly without separate filter tabs) */}
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 pb-3 border-bottom border-secondary border-opacity-25 gap-2">
        <div className="d-flex align-items-center gap-2 small flex-wrap">
          <span className="badge rounded-pill bg-dark border border-secondary border-opacity-25 text-white px-3 py-1.5 fw-medium">
            {subs.length} Plans Total
          </span>
          <span className="badge rounded-pill bg-success bg-opacity-15 border border-success border-opacity-25 text-success px-3 py-1.5 fw-medium d-flex align-items-center gap-1.5">
            <span className="status-dot-pulse"></span>
            {subs.filter(s => s.isActive).length} Active
          </span>
          {subs.filter(s => !s.isActive).length > 0 && (
            <span className="badge rounded-pill bg-secondary bg-opacity-20 border border-secondary border-opacity-25 text-secondary px-3 py-1.5 fw-medium">
              {subs.filter(s => !s.isActive).length} Cancelled
            </span>
          )}
        </div>

        <div className="text-secondary small">
          Active Monthly Commitment: <strong className="text-white tabular-nums fs-6 ms-1">{formatCurrency(subs.filter(s => s.isActive).reduce((acc, s) => acc + Number(s.amount || 0), 0))}</strong>
        </div>
      </div>

      {/* Table Card */}
      <Card className="border-0 shadow-sm bg-dark">
        <Card.Body className="p-0">
          {error && <Alert variant="danger" className="m-3">{error}</Alert>}

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <div className="text-secondary small mt-2">Loading subscriptions...</div>
            </div>
          ) : filteredSubs.length === 0 ? (
            <div className="text-center py-5 text-secondary">
              <div className="fs-1 mb-2">📋</div>
              <p className="mb-2 fw-medium text-white">No subscriptions tracked yet.</p>
              <p className="small mb-3 text-secondary">Track meal plans, streaming, utilities, and daily consumption with ease.</p>
              <Button variant="outline-primary" size="sm" onClick={() => setShowAddModal(true)}>
                Add First Subscription
              </Button>
            </div>
          ) : (
            <>
              {/* 1. Desktop Multi-Column Table (Hidden on mobile) */}
              <div className="table-responsive d-none d-md-block">
                <Table hover className="align-middle mb-0 text-white table-dark bg-transparent">
                  <thead>
                    <tr className="small text-secondary border-bottom border-secondary border-opacity-25">
                      <th className="ps-3">Service & Nature</th>
                      <th>Type</th>
                      <th>Cycle & Duration</th>
                      <th>Next Billing</th>
                      <th className="text-end">Payable Amount</th>
                      <th className="text-center">Daily Skip Heatmap</th>
                      <th>Status</th>
                      <th className="text-end pe-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubs.map(sub => {
                      const meta = SUBSCRIPTION_TYPES[sub.type] || SUBSCRIPTION_TYPES.OTHER;
                      const s = new Date(sub.startDate);
                      const e = new Date(sub.nextBillingDate);
                      const dDiff = Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)));
                      const perDay = Number(sub.amount) / dDiff;

                      // Calculate live deductions from usage logs
                      const logs = sub.usageLogs || [];
                      const skippedAndHolidays = logs.filter(l => l.status === 'SKIPPED' || l.status === 'HOLIDAY').length;
                      const totalDeducted = Math.round(skippedAndHolidays * perDay * 100) / 100;
                      const netPayable = Math.max(0, Number(sub.amount) - totalDeducted);

                      return (
                        <tr key={sub.id} className={!sub.isActive ? 'opacity-50' : ''}>
                          {/* Service Name & Nature */}
                          <td className="ps-3 py-3">
                            <div className="d-flex align-items-center gap-2">
                              <span className="fs-5">{meta.icon}</span>
                              <div>
                                <div className="fw-semibold text-white">{sub.name}</div>
                                <div className="small text-secondary">
                                  {sub.isFlexible ? (
                                    <span className="text-success fw-medium">
                                      Daily Plan · {formatCurrency(perDay)}/day (Auto-deducts on skip/holiday)
                                    </span>
                                  ) : (
                                    <span className="text-secondary">Fixed Recurring Bill</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Type Badge */}
                          <td>
                            <Badge bg="transparent" className={`px-2 py-1 rounded small fw-medium ${meta.badgeClass}`}>
                              {meta.label}
                            </Badge>
                          </td>

                          {/* Cycle & Duration */}
                          <td>
                            <div className="small text-white fw-medium">
                              {dDiff === 15 ? '15 Days (Bi-weekly)' : `${dDiff} Days`}
                            </div>
                            <div className="text-secondary small" style={{ fontSize: '0.75rem' }}>
                              {sub.billingCycle}
                            </div>
                          </td>

                          {/* Next Billing */}
                          <td className="small text-secondary">
                            {new Date(sub.nextBillingDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>

                          {/* Price (with real-time deduction if food not given) */}
                          <td className="text-end tabular-nums">
                            {sub.isFlexible && totalDeducted > 0 ? (
                              <div>
                                <div className="text-secondary small text-decoration-line-through">
                                  {formatCurrency(sub.amount)}
                                </div>
                                <div className="text-success fw-bold">
                                  {formatCurrency(netPayable)}
                                </div>
                                <div className="text-danger small" style={{ fontSize: '0.72rem' }}>
                                  -{formatCurrency(totalDeducted)} deducted ({skippedAndHolidays} days off)
                                </div>
                              </div>
                            ) : (
                              <div className="text-white fw-bold">
                                {formatCurrency(sub.amount)}
                              </div>
                            )}
                          </td>

                          {/* Heatmap button */}
                          <td className="text-center">
                            {sub.isFlexible ? (
                              <Button
                                variant="outline-success"
                                size="sm"
                                className="py-1 px-2.5 small rounded-pill d-inline-flex align-items-center gap-1.5"
                                onClick={() => openCalendar(sub)}
                                title="Click to view daily skip heatmap & minus prices"
                              >
                                <Calendar size={13} />
                                <span>{dDiff}-Day Heatmap</span>
                              </Button>
                            ) : (
                              <OverlayTrigger
                                placement="top"
                                overlay={<Tooltip>Fixed bill — daily skip tracking not needed</Tooltip>}
                              >
                                <span className="text-secondary small fst-italic cursor-help" style={{ userSelect: 'none' }}>
                                  Fixed Bill
                                </span>
                              </OverlayTrigger>
                            )}
                          </td>

                          {/* Status */}
                          <td>
                            <Badge bg={sub.isActive ? 'success' : 'secondary'} className="px-2 py-1">
                              {sub.isActive ? 'Active' : 'Cancelled'}
                            </Badge>
                          </td>

                          {/* Actions */}
                          <td className="text-end pe-3">
                            <div className="d-flex justify-content-end align-items-center gap-1.5">
                              <Button
                                variant={sub.isActive ? 'outline-danger' : 'outline-success'}
                                size="sm"
                                className="py-0.5 px-2 small"
                                onClick={() => handleToggleActive(sub)}
                                title={sub.isActive ? 'Cancel subscription' : 'Reactivate subscription'}
                              >
                                {sub.isActive ? 'Cancel' : 'Reactivate'}
                              </Button>

                              <Button
                                variant="outline-secondary"
                                size="sm"
                                className="py-0.5 px-1.5 text-danger border-0 hover-bg-danger"
                                onClick={() => setSubToDelete(sub)}
                                title="Delete subscription"
                              >
                                <Trash2 size={15} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>

              {/* 2. Mobile Native Cards View (Strictly Zero Horizontal Scroll, Ultra-Polished Fintech UI) */}
              <div className="d-md-none d-flex flex-column gap-3 p-2.5">
                {filteredSubs.map(sub => {
                  const meta = SUBSCRIPTION_TYPES[sub.type] || SUBSCRIPTION_TYPES.OTHER;
                  const s = new Date(sub.startDate);
                  const e = new Date(sub.nextBillingDate);
                  const dDiff = Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)));
                  const perDay = Number(sub.amount) / dDiff;

                  // Calculate live deductions from usage logs
                  const logs = sub.usageLogs || [];
                  const skippedCount = logs.filter(l => l.status === 'SKIPPED').length;
                  const holidayCount = logs.filter(l => l.status === 'HOLIDAY').length;
                  const skippedAndHolidays = skippedCount + holidayCount;
                  const totalDeducted = Math.round(skippedAndHolidays * perDay * 100) / 100;
                  const netPayable = Math.max(0, Number(sub.amount) - totalDeducted);
                  const eatenCount = Math.max(0, dDiff - skippedAndHolidays);
                  const eatenPct = Math.min(100, Math.round((eatenCount / dDiff) * 100));

                  return (
                    <div
                      key={`mob-${sub.id}`}
                      className={`mobile-sub-card p-3 position-relative ${!sub.isActive ? 'opacity-60' : ''}`}
                    >
                      {/* Top Header: Glowing Icon Squircle, Title, Badges & Pulsing Status */}
                      <div className="d-flex justify-content-between align-items-start gap-2 mb-2.5">
                        <div className="d-flex align-items-center gap-2.5">
                          <div
                            className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0 shadow-sm"
                            style={{
                              width: 44,
                              height: 44,
                              backgroundColor: `${meta.color}22`,
                              border: `1px solid ${meta.color}45`,
                              fontSize: '1.35rem'
                            }}
                          >
                            {meta.icon}
                          </div>
                          <div>
                            <div className="fw-bold text-white fs-6 text-truncate" style={{ maxWidth: '180px' }}>
                              {sub.name}
                            </div>
                            <div className="d-flex align-items-center gap-1.5 mt-1 flex-wrap">
                              <span
                                className="badge px-2 py-0.5 rounded-pill small fw-medium"
                                style={{
                                  backgroundColor: `${meta.color}18`,
                                  color: meta.color,
                                  border: `1px solid ${meta.color}35`,
                                  fontSize: '0.68rem'
                                }}
                              >
                                {meta.label}
                              </span>
                              <span className="text-secondary small" style={{ fontSize: '0.72rem' }}>
                                • {dDiff === 15 ? '15 Days' : `${dDiff} Days`} ({sub.billingCycle})
                              </span>
                            </div>
                          </div>
                        </div>

                        {sub.isActive ? (
                          <span
                            className="badge rounded-pill bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1 small d-flex align-items-center gap-1.5"
                            style={{ fontSize: '0.72rem' }}
                          >
                            <span className="status-dot-pulse"></span>
                            Active
                          </span>
                        ) : (
                          <span
                            className="badge rounded-pill bg-secondary bg-opacity-20 text-secondary border border-secondary border-opacity-25 px-2 py-1 small"
                            style={{ fontSize: '0.72rem' }}
                          >
                            Cancelled
                          </span>
                        )}
                      </div>

                      {/* Financial Hero Box */}
                      <div className="sub-price-hero p-2.5 my-2.5">
                        <div className="d-flex justify-content-between align-items-baseline mb-1">
                          <span className="text-secondary small fw-medium">Net to Pay:</span>
                          {sub.isFlexible && totalDeducted > 0 ? (
                            <div className="text-end">
                              <span className="text-secondary small text-decoration-line-through me-1.5 tabular-nums">
                                {formatCurrency(sub.amount)}
                              </span>
                              <span className="text-success fw-bold fs-5 tabular-nums">
                                {formatCurrency(netPayable)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-white fw-bold fs-5 tabular-nums">
                              {formatCurrency(sub.amount)}
                            </span>
                          )}
                        </div>

                        {sub.isFlexible && totalDeducted > 0 && (
                          <div className="d-flex align-items-center justify-content-between pt-1.5 mt-1 border-top border-secondary border-opacity-15">
                            <span className="text-danger small" style={{ fontSize: '0.74rem' }}>
                              ✂️ Auto-deduction:
                            </span>
                            <span className="badge bg-danger bg-opacity-15 text-danger border border-danger border-opacity-25 px-2 py-0.5" style={{ fontSize: '0.72rem' }}>
                              -{formatCurrency(totalDeducted)} saved ({skippedAndHolidays} days off)
                            </span>
                          </div>
                        )}

                        <div className="d-flex justify-content-between align-items-center small text-secondary mt-1.5 pt-1.5 border-top border-secondary border-opacity-15">
                          <span style={{ fontSize: '0.74rem' }}>Next Renewal:</span>
                          <span className="text-light fw-medium" style={{ fontSize: '0.74rem' }}>
                            {new Date(sub.nextBillingDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })} ({dDiff === 15 ? '15-Day Cycle' : sub.billingCycle})
                          </span>
                        </div>

                        {/* Visual Progress Bar for Food/Flexible Plans */}
                        {sub.isFlexible && (
                          <div className="mt-2.5 pt-1.5 border-top border-secondary border-opacity-15">
                            <div className="d-flex justify-content-between align-items-center small mb-1">
                              <span className="text-secondary" style={{ fontSize: '0.72rem' }}>
                                Plan Attendance: <strong className="text-white">{eatenCount} of {dDiff} days</strong>
                              </span>
                              <span className="text-success fw-bold tabular-nums" style={{ fontSize: '0.72rem' }}>
                                {formatCurrency(perDay)}/day
                              </span>
                            </div>
                            <div className="progress" style={{ height: '6px', borderRadius: '4px', backgroundColor: 'rgba(255, 255, 255, 0.08)' }}>
                              <div
                                className="progress-bar bg-success"
                                role="progressbar"
                                style={{ width: `${eatenPct}%` }}
                                title={`${eatenCount} days eaten`}
                              />
                              {skippedAndHolidays > 0 && (
                                <div
                                  className="progress-bar bg-danger"
                                  role="progressbar"
                                  style={{ width: `${(skippedAndHolidays / dDiff) * 100}%` }}
                                  title={`${skippedAndHolidays} days skipped/holiday`}
                                />
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Toolbar */}
                      <div className="d-flex flex-column gap-2 pt-1">
                        {sub.isFlexible ? (
                          <Button
                            className="sub-btn-heatmap w-100 d-flex align-items-center justify-content-between shadow-sm"
                            onClick={() => openCalendar(sub)}
                          >
                            <div className="d-flex align-items-center gap-2">
                              <Calendar size={15} />
                              <span className="small">{dDiff}-Day Heatmap & Skip Manager</span>
                            </div>
                            <span className="small opacity-75" style={{ fontSize: '0.75rem' }}>Open ›</span>
                          </Button>
                        ) : null}

                        <div className="d-flex align-items-center justify-content-between gap-2">
                          <Button
                            variant={sub.isActive ? 'outline-secondary' : 'outline-success'}
                            size="sm"
                            className="flex-grow-1 py-1 px-3 small rounded-3"
                            onClick={() => handleToggleActive(sub)}
                          >
                            {sub.isActive ? 'Pause / Cancel' : 'Reactivate Plan'}
                          </Button>

                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="py-1 px-2.5 small rounded-3 border-secondary border-opacity-25 text-danger hover-bg-danger d-flex align-items-center gap-1"
                            onClick={() => setSubToDelete(sub)}
                            aria-label="Delete subscription"
                          >
                            <Trash2 size={15} />
                            <span className="small">Delete</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      {/* Usage Calendar Heatmap Modal */}
      {calendarSub && (
        <Modal show={true} onHide={() => { setCalendarSub(null); setSelectedDayObj(null); }} size="lg" centered backdrop="static">
          <Modal.Header closeButton className="border-secondary border-opacity-25 bg-dark py-2.5 px-3">
            <div className="d-flex align-items-center gap-2.5">
              <div
                className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0 shadow-sm"
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: `${SUBSCRIPTION_TYPES[calendarSub.type]?.color || '#10B981'}22`,
                  border: `1px solid ${SUBSCRIPTION_TYPES[calendarSub.type]?.color || '#10B981'}45`,
                  fontSize: '1.3rem'
                }}
              >
                {SUBSCRIPTION_TYPES[calendarSub.type]?.icon || '🍱'}
              </div>
              <div>
                <Modal.Title className="fs-6 fw-bold text-white mb-0 text-truncate" style={{ maxWidth: '210px' }}>
                  {calendarSub.name}
                </Modal.Title>
                <div className="text-secondary small" style={{ fontSize: '0.72rem' }}>
                  {totalDaysInPlan} Days · <strong>{formatCurrency(planDailyRate)}/day</strong> · Tap day to minus price
                </div>
              </div>
            </div>
          </Modal.Header>

          <Modal.Body className="bg-dark p-3 p-md-4">
            {/* Price Breakdown Banner showing real-time price deduction for Skips and Holidays */}
            <div className="row g-2 mb-3">
              <div className="col-6 col-md-3">
                <div className="p-2.5 rounded bg-black bg-opacity-40 border border-secondary border-opacity-25 h-100">
                  <div className="text-secondary small text-uppercase fw-semibold" style={{ fontSize: '0.7rem' }}>Total Plan Cost</div>
                  <div className="text-white fw-bold fs-5 mt-1 tabular-nums">{formatCurrency(calendarSub.amount)}</div>
                  <div className="text-secondary small mt-0.5">{totalDaysInPlan} Days Total</div>
                </div>
              </div>

              <div className="col-6 col-md-3">
                <div className="p-2.5 rounded bg-black bg-opacity-40 border border-success border-opacity-25 h-100">
                  <div className="text-success small text-uppercase fw-semibold" style={{ fontSize: '0.7rem' }}>Food Given (Used)</div>
                  <div className="text-success fw-bold fs-5 mt-1">{usedCount} Days</div>
                  <div className="text-secondary small mt-0.5">Consumed</div>
                </div>
              </div>

              <div className="col-6 col-md-3">
                <div className="p-2.5 rounded bg-black bg-opacity-40 border border-danger border-opacity-25 h-100">
                  <div className="text-danger small text-uppercase fw-semibold" style={{ fontSize: '0.7rem' }}>Food Not Given (Minus)</div>
                  <div className="text-danger fw-bold fs-5 mt-1 tabular-nums">-{formatCurrency(totalDeduction)}</div>
                  <div className="text-secondary small mt-0.5">{skippedCount} Skips · {holidayCount} Holidays</div>
                </div>
              </div>

              <div className="col-6 col-md-3">
                <div className="p-2.5 rounded bg-black bg-opacity-40 border border-primary border-opacity-50 h-100">
                  <div className="text-primary small text-uppercase fw-semibold" style={{ fontSize: '0.7rem' }}>Final Amount to Pay</div>
                  <div className="text-primary fw-bold fs-5 mt-1 tabular-nums">{formatCurrency(effectiveCost)}</div>
                  <div className="text-success small mt-0.5 fw-medium">Net after deductions</div>
                </div>
              </div>
            </div>

            {/* Heatmap Legend */}
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 small text-secondary">
              <span className="fw-medium text-white">Click any day to minus price for Skip or Holiday. Hover to view notes:</span>
              <div className="d-flex align-items-center gap-3">
                <span className="d-inline-flex align-items-center gap-1.5">
                  <span style={{ width: 12, height: 12, backgroundColor: '#10B981', borderRadius: 3 }}></span>
                  <span className="text-white">Food Given</span>
                </span>
                <span className="d-inline-flex align-items-center gap-1.5">
                  <span style={{ width: 12, height: 12, backgroundColor: '#EF4444', borderRadius: 3 }}></span>
                  <span className="text-white">Skipped (-₹{planDailyRate.toFixed(1)})</span>
                </span>
                <span className="d-inline-flex align-items-center gap-1.5">
                  <span style={{ width: 12, height: 12, backgroundColor: '#F59E0B', borderRadius: 3 }}></span>
                  <span className="text-white">Holiday (-₹{planDailyRate.toFixed(1)})</span>
                </span>
              </div>
            </div>

            {loadingUsage ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <div className="text-secondary small mt-2">Loading day records...</div>
              </div>
            ) : (
              <div>
                {/* Dynamic Heatmap Grid (Exactly 15 Days for 15-day food plan) */}
                <div
                  className="d-grid gap-2 p-3 rounded border border-secondary border-opacity-25"
                  style={{
                    backgroundColor: 'rgba(2, 6, 23, 0.4)',
                    gridTemplateColumns: totalDaysInPlan <= 15
                      ? 'repeat(5, 1fr)'
                      : 'repeat(auto-fill, minmax(52px, 1fr))'
                  }}
                >
                  {planDays.map((dayObj) => {
                    const isSelected = selectedDayObj?.dateStr === dayObj.dateStr;
                    let bgColor = '#10B981';
                    let borderColor = 'transparent';
                    let statusLabel = 'Food Eaten / Given';

                    if (dayObj.status === 'SKIPPED') {
                      bgColor = '#EF4444';
                      statusLabel = `Food Skipped (-${formatCurrency(planDailyRate)} deducted)`;
                    } else if (dayObj.status === 'HOLIDAY') {
                      bgColor = '#F59E0B';
                      statusLabel = `Holiday / Mess Closed (-${formatCurrency(planDailyRate)} deducted)`;
                    }

                    if (isSelected) {
                      borderColor = '#60A5FA';
                    }

                    const tooltipContent = (
                      <Tooltip id={`tip-${dayObj.dateStr}`}>
                        <div className="text-start p-1">
                          <div className="fw-bold border-bottom pb-1 mb-1">
                            Day {dayObj.dayIndex} of {totalDaysInPlan} • {dayObj.fullDate}
                          </div>
                          <div><strong>Status:</strong> {statusLabel}</div>
                          {dayObj.notes ? (
                            <div className="mt-1 text-warning">
                              <strong>Note:</strong> "{dayObj.notes}"
                            </div>
                          ) : (
                            <div className="text-muted small mt-1">No note (Click to add reason)</div>
                          )}
                        </div>
                      </Tooltip>
                    );

                    return (
                      <OverlayTrigger key={dayObj.dateStr} placement="top" overlay={tooltipContent}>
                        <div
                          onClick={() => handleSelectDay(dayObj)}
                          onDoubleClick={() => handleQuickToggle(dayObj)}
                          className="d-flex flex-column align-items-center justify-content-center p-2 position-relative"
                          style={{
                            backgroundColor: bgColor,
                            border: `2px solid ${borderColor}`,
                            borderRadius: '10px',
                            cursor: 'pointer',
                            minHeight: totalDaysInPlan <= 15 ? '62px' : '54px',
                            color: '#ffffff',
                            userSelect: 'none',
                            boxShadow: isSelected ? '0 0 14px rgba(96, 165, 250, 0.75)' : '0 2px 4px rgba(0,0,0,0.2)',
                            transform: isSelected ? 'scale(1.06)' : 'scale(1)',
                            transition: 'transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.16s ease'
                          }}
                        >
                          <div className="small fw-bold lh-1" style={{ fontSize: '0.8rem' }}>
                            Day {dayObj.dayIndex}
                          </div>
                          <div className="small opacity-90 mt-1" style={{ fontSize: '0.68rem' }}>
                            {dayObj.displayDate}
                          </div>

                          {/* Minus Badge if Skipped or Holiday */}
                          {(dayObj.status === 'SKIPPED' || dayObj.status === 'HOLIDAY') && (
                            <div className="badge bg-black bg-opacity-60 text-white mt-1 px-1 py-0.5" style={{ fontSize: '0.62rem' }}>
                              -₹{Math.round(planDailyRate)}
                            </div>
                          )}

                          {/* Note Indicator dot */}
                          {dayObj.notes && (
                            <div
                              className="position-absolute top-0 end-0 p-1"
                              title={`Note: ${dayObj.notes}`}
                            >
                              <span
                                style={{
                                  display: 'inline-block',
                                  width: 7,
                                  height: 7,
                                  backgroundColor: '#FFFFFF',
                                  borderRadius: '50%',
                                  boxShadow: '0 0 4px #000'
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </OverlayTrigger>
                    );
                  })}
                </div>

                {/* Day Editor Panel */}
                {selectedDayObj ? (
                  <div className="mt-4 p-3 rounded border border-primary border-opacity-50" style={{ backgroundColor: 'rgba(30, 41, 59, 0.6)' }}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="fw-bold text-white d-flex align-items-center gap-2">
                        <Edit3 size={16} className="text-primary" />
                        <span>Day {selectedDayObj.dayIndex} of {totalDaysInPlan} ({selectedDayObj.fullDate})</span>
                      </div>
                      <Button
                        variant="link"
                        size="sm"
                        className="text-secondary p-0 text-decoration-none"
                        onClick={() => setSelectedDayObj(null)}
                      >
                        Cancel
                      </Button>
                    </div>

                    <Row className="g-3 align-items-end">
                      <Col xs={12} md={6}>
                        <Form.Label className="small text-secondary fw-semibold mb-1">
                          Did you receive / eat food on this day?
                        </Form.Label>
                        <div className="d-flex gap-1.5 gap-sm-2 flex-wrap flex-sm-nowrap">
                          <Button
                            size="sm"
                            variant={editingStatus === 'USED' ? 'success' : 'outline-secondary'}
                            className="flex-fill d-flex align-items-center justify-content-center gap-1.5 py-2 px-2 rounded-3 shadow-sm fw-semibold"
                            onClick={() => setEditingStatus('USED')}
                          >
                            <CheckCircle size={15} />
                            <span>Food Given</span>
                          </Button>
                          <Button
                            size="sm"
                            variant={editingStatus === 'SKIPPED' ? 'danger' : 'outline-secondary'}
                            className="flex-fill d-flex align-items-center justify-content-center gap-1.5 py-2 px-2 rounded-3 shadow-sm fw-semibold"
                            onClick={() => setEditingStatus('SKIPPED')}
                          >
                            <XCircle size={15} />
                            <span>Skipped (-₹{Math.round(planDailyRate)})</span>
                          </Button>
                          <Button
                            size="sm"
                            variant={editingStatus === 'HOLIDAY' ? 'warning' : 'outline-secondary'}
                            className="flex-fill d-flex align-items-center justify-content-center gap-1.5 py-2 px-2 rounded-3 shadow-sm fw-semibold"
                            onClick={() => setEditingStatus('HOLIDAY')}
                          >
                            <PauseCircle size={15} />
                            <span>Holiday (-₹{Math.round(planDailyRate)})</span>
                          </Button>
                        </div>
                      </Col>

                      <Col xs={12} md={4}>
                        <Form.Label className="small text-secondary fw-semibold mb-1">
                          Reason / Note (Shown on hover):
                        </Form.Label>
                        <Form.Control
                          size="sm"
                          type="text"
                          placeholder="e.g. Fasting, Mess closed, Travelled home..."
                          value={editingNote}
                          onChange={e => setEditingNote(e.target.value)}
                        />
                      </Col>

                      <Col xs={12} md={2}>
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-100"
                          onClick={handleSaveDayLog}
                          disabled={savingDay}
                        >
                          {savingDay ? <Spinner size="sm" animation="border" /> : 'Save Day'}
                        </Button>
                      </Col>
                    </Row>

                    <div className="text-secondary small mt-2">
                      💡 Marking as <strong>Skipped</strong> or <strong>Holiday</strong> immediately minuses {formatCurrency(planDailyRate)} from your total cost.
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-secondary small mt-3">
                    💡 Click on any day cell above to mark Food Skipped or Mess Holiday and minus {formatCurrency(planDailyRate)} from your bill.
                  </div>
                )}
              </div>
            )}
          </Modal.Body>

          <Modal.Footer className="border-secondary border-opacity-25 bg-dark py-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { setCalendarSub(null); setSelectedDayObj(null); }}
            >
              Close Heatmap
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Complete, Professional & Smart Add Subscription Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-secondary border-opacity-25 bg-dark">
          <Modal.Title className="fs-6 fw-bold text-white d-flex align-items-center gap-2">
            <Sparkles size={18} className="text-primary" />
            <span>Add Subscription & Recurring Plan</span>
          </Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleAddSubmit}>
          <Modal.Body className="bg-dark p-3 p-md-4">
            {/* Complete 8 Subscription Types Carousel Grid */}
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <Form.Label className="small text-secondary fw-semibold text-uppercase tracking-wider mb-0">
                  Select Subscription Type *
                </Form.Label>
                <span className="text-secondary small" style={{ fontSize: '0.75rem' }}>
                  {SUBSCRIPTION_TYPES[formData.type]?.description}
                </span>
              </div>

              <div className="d-flex flex-wrap gap-2">
                {Object.entries(SUBSCRIPTION_TYPES).map(([typeKey, meta]) => {
                  const isSelected = formData.type === typeKey;
                  return (
                    <button
                      key={typeKey}
                      type="button"
                      onClick={() => handleTypeSelect(typeKey)}
                      className={`btn btn-sm d-flex align-items-center gap-1.5 px-3 py-1.5 rounded-pill transition-all ${
                        isSelected
                          ? 'btn-primary text-white fw-bold shadow-sm'
                          : 'btn-outline-secondary text-secondary'
                      }`}
                      style={{
                        backgroundColor: isSelected ? meta.color : 'rgba(15, 23, 42, 0.6)',
                        borderColor: isSelected ? meta.color : 'rgba(51, 65, 85, 0.6)'
                      }}
                    >
                      <span className="fs-6">{meta.icon}</span>
                      <span>{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Basic Information: Name & Category */}
            <Row className="g-3 mb-3">
              <Col xs={12} md={7}>
                <Form.Group>
                  <Form.Label className="small text-white fw-semibold">Service / Plan Name *</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    placeholder="e.g. Daily Tiffin Service, Netflix, Gold's Gym, Airtel Fiber"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    autoFocus
                  />
                </Form.Group>
              </Col>

              <Col xs={12} md={5}>
                <Form.Group>
                  <Form.Label className="small text-white fw-semibold">Category</Form.Label>
                  <Form.Select
                    value={formData.categoryId}
                    onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {/* Financial Details: Cost & Billing Cycle */}
            <Row className="g-3 mb-3">
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label className="small text-white fw-semibold">Total Cost (₹) *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 1300"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label className="small text-white fw-semibold">Billing Frequency</Form.Label>
                  <Form.Select
                    value={formData.billingCycle}
                    onChange={e => setFormData({ ...formData, billingCycle: e.target.value })}
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="WEEKLY">Weekly</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {/* Plan Duration & Dates Section */}
            <div className="mb-3 p-3 rounded border border-secondary border-opacity-25" style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)' }}>
              <div className="d-flex flex-wrap justify-content-between align-items-center mb-2 gap-2">
                <Form.Label className="small text-white fw-semibold mb-0">
                  Plan Validity & Duration:
                </Form.Label>
                {currentDailyRate > 0 && (
                  <Badge bg="success" className="bg-opacity-20 text-success border border-success border-opacity-25 py-1 px-2">
                    Rate: {formatCurrency(currentDailyRate)}/day ({currentPlanDaysCount} Days)
                  </Badge>
                )}
              </div>

              {/* 1-Click Duration Presets */}
              <div className="d-flex flex-wrap gap-2 mb-3">
                <Button
                  size="sm"
                  variant={formData.durationPreset === '15' ? 'success' : 'outline-secondary'}
                  className={`rounded-pill px-3 py-1 ${formData.durationPreset === '15' ? 'fw-bold' : ''}`}
                  onClick={() => handlePresetSelect('15')}
                  type="button"
                >
                  🍱 15 Days (Bi-weekly Plan)
                </Button>
                <Button
                  size="sm"
                  variant={formData.durationPreset === '30' ? 'primary' : 'outline-secondary'}
                  className={`rounded-pill px-3 py-1 ${formData.durationPreset === '30' ? 'fw-bold' : ''}`}
                  onClick={() => handlePresetSelect('30')}
                  type="button"
                >
                  🗓️ 30 Days (1 Month)
                </Button>
                <Button
                  size="sm"
                  variant={formData.durationPreset === '7' ? 'primary' : 'outline-secondary'}
                  className={`rounded-pill px-3 py-1 ${formData.durationPreset === '7' ? 'fw-bold' : ''}`}
                  onClick={() => handlePresetSelect('7')}
                  type="button"
                >
                  ⚡ 7 Days (1 Week)
                </Button>
                <Button
                  size="sm"
                  variant={formData.durationPreset === 'CUSTOM' ? 'primary' : 'outline-secondary'}
                  className={`rounded-pill px-3 py-1 ${formData.durationPreset === 'CUSTOM' ? 'fw-bold' : ''}`}
                  onClick={() => handlePresetSelect('CUSTOM')}
                  type="button"
                >
                  ✏️ Custom Dates
                </Button>
              </div>

              {/* Date Inputs */}
              <Row className="g-2">
                <Col xs={12} sm={6}>
                  <Form.Group>
                    <Form.Label className="small text-secondary">Start Date *</Form.Label>
                    <Form.Control
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={e => handleStartDateChange(e.target.value)}
                    />
                  </Form.Group>
                </Col>

                <Col xs={12} sm={6}>
                  <Form.Group>
                    <Form.Label className="small text-secondary">Next Billing / Cycle End *</Form.Label>
                    <Form.Control
                      type="date"
                      required
                      value={formData.nextBillingDate}
                      onChange={e => setFormData({ ...formData, nextBillingDate: e.target.value, durationPreset: 'CUSTOM' })}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* Flexible Daily Tracking & Price Deduction Section */}
            <div className="mb-3 p-3 rounded border border-secondary border-opacity-25" style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)' }}>
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <Form.Check
                    type="switch"
                    id="isFlexibleSwitch"
                    label={<strong className="text-white">Enable Flexible Daily Skip & Holiday Deductions</strong>}
                    checked={formData.isFlexible}
                    onChange={e => setFormData({ ...formData, isFlexible: e.target.checked })}
                  />
                  <div className="text-secondary small mt-1 ms-4">
                    Recommended for food, mess, tiffin, milk, gym subscriptions. Every skipped day or holiday minuses the day's price.
                  </div>
                </div>
              </div>

              {formData.isFlexible && (
                <div className="mt-3 pt-3 border-top border-secondary border-opacity-25">
                  <Row className="g-2 align-items-center">
                    <Col xs={12} sm={5}>
                      <Form.Label className="small text-secondary mb-0 fw-semibold">
                        Skip Adjustment Rule:
                      </Form.Label>
                    </Col>
                    <Col xs={12} sm={7}>
                      <Form.Select
                        size="sm"
                        value={formData.skipRule}
                        onChange={e => setFormData({ ...formData, skipRule: e.target.value })}
                      >
                        <option value="REFUND_PER_DAY">Refund per skipped day (Deduct from bill)</option>
                        <option value="CREDIT_PER_DAY">Credit next cycle per skipped day</option>
                        <option value="CARRY_FORWARD">Carry forward unused days</option>
                        <option value="NO_ADJUSTMENT">No adjustment (Track only)</option>
                      </Form.Select>
                    </Col>
                  </Row>

                  {currentDailyRate > 0 && (
                    <div className="alert alert-dark border-secondary border-opacity-25 small mt-2 mb-0 py-1.5 px-2 text-white">
                      💡 <strong>Deduction guarantee:</strong> Marking any day as <em>Skipped</em> or <em>Mess Holiday</em> will automatically minus {formatCurrency(currentDailyRate)} from your total cost.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Notes Section */}
            <Form.Group className="mb-2">
              <Form.Label className="small text-secondary fw-semibold">Notes / Remarks (optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="e.g. Mess off on Sundays, shared with roommate, cash paid upfront"
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>

          <Modal.Footer className="border-secondary border-opacity-25 bg-dark py-2">
            <Button variant="outline-secondary" size="sm" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" className="fw-semibold px-3">
              Save Subscription
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      {subToDelete && (
        <Modal show={true} onHide={() => setSubToDelete(null)} centered>
          <Modal.Header closeButton className="border-secondary border-opacity-25 bg-dark">
            <Modal.Title className="fs-6 fw-bold text-white d-flex align-items-center gap-2">
              <Trash2 size={16} className="text-danger" />
              <span>Delete Subscription</span>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="bg-dark text-white">
            <p className="mb-2">
              Are you sure you want to delete <strong>{subToDelete.name}</strong>?
            </p>
            <div className="text-secondary small">
              If this subscription has no past recorded expense transactions, it will be permanently deleted. If historical expenses exist, it will be marked as Cancelled to preserve your accounting records.
            </div>
          </Modal.Body>
          <Modal.Footer className="border-secondary border-opacity-25 bg-dark py-2">
            <Button variant="outline-secondary" size="sm" onClick={() => setSubToDelete(null)}>
              Keep Subscription
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeleteSub} disabled={deleteLoading}>
              {deleteLoading ? <Spinner size="sm" animation="border" /> : 'Yes, Delete'}
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
}
