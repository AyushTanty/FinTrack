import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Form, Spinner, Alert, Badge } from 'react-bootstrap';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend, AreaChart, Area, ComposedChart 
} from 'recharts';
import { reportsService } from '../../services/reportsService';
import { formatCurrency } from '../../utils/formatCurrency';
import { getCurrentMonthYear, getMonthName } from '../../utils/dateHelpers';
import { formatAxisCurrency, darkTooltipStyle, CHART_PALETTE } from '../../utils/chartHelpers';

const CHART_COLORS = CHART_PALETTE;

export default function ReportsPage() {
  const [period, setPeriod] = useState(getCurrentMonthYear());
  const [monthsRange, setMonthsRange] = useState(6);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data states for reports
  const [trendData, setTrendData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [budgetVsActualData, setBudgetVsActualData] = useState([]);
  const [fixedVsVariableData, setFixedVsVariableData] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [subscriptionData, setSubscriptionData] = useState([]);
  const [costOfLivingData, setCostOfLivingData] = useState([]);
  const [savingsData, setSavingsData] = useState([]);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        resTrend,
        resCat,
        resBvA,
        resFvV,
        resDaily,
        resSub,
        resCol,
        resSav
      ] = await Promise.all([
        reportsService.monthlyTrend(monthsRange),
        reportsService.categoryBreakdown(period.month, period.year),
        reportsService.budgetVsActual(period.month, period.year),
        reportsService.fixedVsVariable(monthsRange),
        reportsService.dailySpending(period.month, period.year),
        reportsService.subscriptionSpending(monthsRange),
        reportsService.costOfLiving(monthsRange),
        reportsService.savingsProgress()
      ]);

      setTrendData(resTrend.data?.data || []);
      setCategoryData((resCat.data?.data || []).map(c => ({ ...c, value: c.total })));
      setBudgetVsActualData(resBvA.data?.data || []);
      setFixedVsVariableData(resFvV.data?.data || []);
      setDailyData(resDaily.data?.data || []);
      setSubscriptionData(resSub.data?.data || []);
      setCostOfLivingData(resCol.data?.data || []);
      setSavingsData(resSav.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch financial reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [period.month, period.year, monthsRange]);

  const totalCategorySpend = categoryData.reduce((acc, c) => acc + (c.value || 0), 0);

  return (
    <div className="pb-4">
      {/* Header & Controls */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h2 className="mb-1 fw-bold tracking-tight text-white">Financial Reports & Visual Trends</h2>
          <span className="text-secondary small">
            Accurate multi-month comparisons, lifestyle living costs, and category allocations
          </span>
        </div>

        {/* Period & Range Controls */}
        <div className="d-flex align-items-center gap-2">
          <Form.Select 
            size="sm" 
            value={monthsRange} 
            onChange={e => setMonthsRange(parseInt(e.target.value))}
            style={{ width: '135px' }}
            className="bg-dark text-white border-secondary border-opacity-25"
          >
            <option value="3">Last 3 Months</option>
            <option value="6">Last 6 Months</option>
            <option value="12">Last 12 Months</option>
          </Form.Select>

          <div className="d-flex align-items-center border border-secondary border-opacity-25 rounded px-2 py-1 bg-dark">
            <Button 
              variant="link" 
              size="sm" 
              className="p-0 text-secondary text-decoration-none px-2"
              onClick={() => setPeriod(p => p.month === 1 ? { month: 12, year: p.year - 1 } : { ...p, month: p.month - 1 })}
            >
              ‹
            </Button>
            <span className="mx-2 small fw-bold text-white font-monospace">
              {getMonthName(period.month)} {period.year}
            </span>
            <Button 
              variant="link" 
              size="sm" 
              className="p-0 text-secondary text-decoration-none px-2"
              onClick={() => setPeriod(p => p.month === 12 ? { month: 1, year: p.year + 1 } : { ...p, month: p.month + 1 })}
            >
              ›
            </Button>
          </div>
        </div>
      </div>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <div className="text-secondary small mt-2">Computing report analytics...</div>
        </div>
      ) : (
        <Row className="g-4">
          {/* 1. Monthly Spending Trend */}
          <Col md={12}>
            <Card className="h-100">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="fw-semibold text-white">1. Monthly Spending Trend</div>
                  <div className="text-secondary small">Income vs Expenses over the selected period</div>
                </div>
                <Badge bg="dark" className="border border-secondary border-opacity-25 text-secondary">
                  Last {monthsRange} Months
                </Badge>
              </Card.Header>
              <Card.Body>
                <div style={{ height: 290 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 10, right: 15, left: -5, bottom: 0 }}>
                      <defs>
                        <linearGradient id="repIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="repSpentGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EF4444" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
                      <XAxis dataKey="name" stroke="#64748B" tick={{ fontSize: 12, fill: '#94A3B8' }} tickLine={false} />
                      <YAxis stroke="#64748B" tickFormatter={formatAxisCurrency} domain={[0, 'auto']} tick={{ fontSize: 12, fill: '#94A3B8' }} tickLine={false} />
                      <RechartsTooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const inc = payload.find(p => p.dataKey === 'income')?.value || 0;
                            const exp = payload.find(p => p.dataKey === 'spent')?.value || 0;
                            const net = inc - exp;
                            return (
                              <div style={darkTooltipStyle}>
                                <div className="fw-bold text-white mb-2 pb-1 border-bottom border-secondary border-opacity-25">{label}</div>
                                <div className="d-flex justify-content-between gap-3 text-success small mb-1">
                                  <span>Income:</span>
                                  <strong className="tabular-nums">+{formatCurrency(inc)}</strong>
                                </div>
                                <div className="d-flex justify-content-between gap-3 text-danger small mb-1.5">
                                  <span>Expenses:</span>
                                  <strong className="tabular-nums">-{formatCurrency(exp)}</strong>
                                </div>
                                <div className={`d-flex justify-content-between gap-3 small pt-1 border-top border-secondary border-opacity-25 ${net >= 0 ? 'text-primary' : 'text-warning'}`}>
                                  <span>{net >= 0 ? 'Net Saved:' : 'Deficit:'}</span>
                                  <strong className="tabular-nums">{net >= 0 ? `+${formatCurrency(net)}` : `-${formatCurrency(Math.abs(net))}`}</strong>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend verticalAlign="top" align="right" height={32} wrapperStyle={{ color: '#94A3B8', fontSize: '12px' }} />
                      <Area type="monotone" name="Income" dataKey="income" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#repIncomeGrad)" dot={{ r: 3, fill: '#10b981' }} activeDot={{ r: 5 }} />
                      <Area type="monotone" name="Expenses" dataKey="spent" stroke="#ef4444" strokeWidth={2.5} fillOpacity={1} fill="url(#repSpentGrad)" dot={{ r: 3, fill: '#ef4444' }} activeDot={{ r: 5 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* 2. Spending by Category */}
          <Col md={6}>
            <Card className="h-100">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="fw-semibold text-white">2. Spending by Category</div>
                  <div className="text-secondary small">Distribution in {getMonthName(period.month)} {period.year}</div>
                </div>
                {totalCategorySpend > 0 && (
                  <Badge bg="dark" className="border border-secondary border-opacity-25 text-white">
                    {formatCurrency(totalCategorySpend)}
                  </Badge>
                )}
              </Card.Header>
              <Card.Body className="d-flex flex-column justify-content-between">
                <div style={{ height: 230, position: 'relative' }}>
                  {totalCategorySpend === 0 ? (
                    <div className="text-center text-secondary py-5 d-flex flex-column align-items-center justify-content-center h-100">
                      <span className="fs-3 mb-2">🍽️</span>
                      <div className="text-white fw-medium">No expense records found</div>
                      <div className="small text-secondary mt-1">No transactions recorded for {getMonthName(period.month)} {period.year}.</div>
                    </div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            innerRadius={62}
                            outerRadius={86}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {categoryData.map((entry, idx) => (
                              <Cell
                                key={`cat-${idx}`}
                                fill={entry.color || CHART_COLORS[idx % CHART_COLORS.length]}
                                stroke="#0F172A"
                                strokeWidth={2}
                              />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const item = payload[0];
                                const percent = totalCategorySpend > 0
                                  ? ((item.value / totalCategorySpend) * 100).toFixed(1)
                                  : 0;
                                return (
                                  <div style={darkTooltipStyle}>
                                    <div className="fw-bold text-white mb-1 d-flex align-items-center gap-1.5">
                                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: item.payload.color || item.color }}></span>
                                      <span>{item.name}</span>
                                    </div>
                                    <div className="text-secondary small">
                                      Amount: <strong className="text-white">{formatCurrency(item.value)}</strong>
                                    </div>
                                    <div className="text-success small fw-semibold">
                                      Share: {percent}% of month
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>

                      {/* Center total metric */}
                      <div
                        className="position-absolute d-flex flex-column align-items-center justify-content-center text-center"
                        style={{
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          pointerEvents: 'none'
                        }}
                      >
                        <span className="text-secondary text-uppercase fw-semibold" style={{ fontSize: '0.62rem', letterSpacing: '0.05em' }}>
                          Total Spent
                        </span>
                        <span className="fw-bold text-white tabular-nums" style={{ fontSize: '0.9rem' }}>
                          {formatCurrency(totalCategorySpend)}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Category Pills List */}
                {totalCategorySpend > 0 && (
                  <div className="d-flex flex-wrap justify-content-center gap-1.5 mt-2 pt-2 border-top border-secondary border-opacity-25" style={{ maxHeight: '72px', overflowY: 'auto' }}>
                    {categoryData.map((c, idx) => {
                      const pct = ((c.value / totalCategorySpend) * 100).toFixed(0);
                      return (
                        <span
                          key={idx}
                          className="badge bg-black bg-opacity-40 border border-secondary border-opacity-25 text-white fw-normal d-inline-flex align-items-center gap-1 py-1 px-1.5 small"
                        >
                          <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: c.color || CHART_COLORS[idx % CHART_COLORS.length] }}></span>
                          <span>{c.name}:</span>
                          <strong className="text-white">{formatCurrency(c.value)}</strong>
                          <span className="text-secondary" style={{ fontSize: '0.68rem' }}>({pct}%)</span>
                        </span>
                      );
                    })}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* 3. Budget vs Actual */}
          <Col md={6}>
            <Card className="h-100">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="fw-semibold text-white">3. Budget vs Actual</div>
                  <div className="text-secondary small">Category limits vs real expenditure</div>
                </div>
              </Card.Header>
              <Card.Body>
                <div style={{ height: 280 }}>
                  {budgetVsActualData.length === 0 ? (
                    <div className="text-center text-secondary py-5 d-flex flex-column align-items-center justify-content-center h-100">
                      <span className="fs-3 mb-2">🎯</span>
                      <div className="text-white fw-medium">No budgets configured</div>
                      <div className="small text-secondary mt-1">Set monthly category budgets to track limits and prevent overspending.</div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={budgetVsActualData} margin={{ top: 10, right: 15, left: -5, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
                        <XAxis dataKey="name" stroke="#64748B" tick={{ fontSize: 12, fill: '#94A3B8' }} tickLine={false} />
                        <YAxis stroke="#64748B" tickFormatter={formatAxisCurrency} domain={[0, 'auto']} tick={{ fontSize: 12, fill: '#94A3B8' }} tickLine={false} />
                        <RechartsTooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const budgeted = payload.find(p => p.dataKey === 'budgeted')?.value || 0;
                              const actual = payload.find(p => p.dataKey === 'actual')?.value || 0;
                              const variance = budgeted - actual;
                              const isOver = variance < 0;
                              return (
                                <div style={darkTooltipStyle}>
                                  <div className="fw-bold text-white mb-2 pb-1 border-bottom border-secondary border-opacity-25">{label}</div>
                                  <div className="d-flex justify-content-between gap-3 text-secondary small mb-1">
                                    <span>Budget Limit:</span>
                                    <strong className="text-white">{formatCurrency(budgeted)}</strong>
                                  </div>
                                  <div className="d-flex justify-content-between gap-3 text-white small mb-1.5">
                                    <span>Actual Spent:</span>
                                    <strong className={isOver ? 'text-danger' : 'text-success'}>{formatCurrency(actual)}</strong>
                                  </div>
                                  <div className={`d-flex justify-content-between gap-3 small pt-1 border-top border-secondary border-opacity-25 ${isOver ? 'text-danger' : 'text-success'}`}>
                                    <span>{isOver ? 'Over Budget by:' : 'Remaining:'}</span>
                                    <strong>{formatCurrency(Math.abs(variance))}</strong>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend verticalAlign="top" align="right" height={32} wrapperStyle={{ color: '#94A3B8', fontSize: '12px' }} />
                        <Bar name="Budgeted" dataKey="budgeted" fill="#6366F1" radius={[4, 4, 0, 0]} maxBarSize={32} />
                        <Bar name="Actual Spent" dataKey="actual" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={32} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* 4. Fixed vs Variable Lifestyle Costs */}
          <Col md={6}>
            <Card className="h-100">
              <Card.Header>
                <div className="fw-semibold text-white">4. Fixed vs Variable Lifestyle Costs</div>
                <div className="text-secondary small">Committed essentials vs flexible daily expenses</div>
              </Card.Header>
              <Card.Body>
                <div style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={fixedVsVariableData} margin={{ top: 10, right: 15, left: -5, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradFixed" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#6366F1" stopOpacity={0.05}/>
                        </linearGradient>
                        <linearGradient id="gradVariable" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.05}/>
                        </linearGradient>
                        <linearGradient id="gradDisc" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EC4899" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#EC4899" stopOpacity={0.05}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
                      <XAxis dataKey="name" stroke="#64748B" tick={{ fontSize: 12, fill: '#94A3B8' }} tickLine={false} />
                      <YAxis stroke="#64748B" tickFormatter={formatAxisCurrency} domain={[0, 'auto']} tick={{ fontSize: 12, fill: '#94A3B8' }} tickLine={false} />
                      <RechartsTooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const f = payload.find(p => p.dataKey === 'fixed')?.value || 0;
                            const v = payload.find(p => p.dataKey === 'variable')?.value || 0;
                            const d = payload.find(p => p.dataKey === 'discretionary')?.value || 0;
                            const tot = f + v + d;
                            return (
                              <div style={darkTooltipStyle}>
                                <div className="fw-bold text-white mb-2 pb-1 border-bottom border-secondary border-opacity-25">{label}</div>
                                <div className="d-flex justify-content-between gap-3 text-secondary small mb-1">
                                  <span>Fixed (Bills/Rent):</span>
                                  <strong className="text-white">{formatCurrency(f)}</strong>
                                </div>
                                <div className="d-flex justify-content-between gap-3 text-secondary small mb-1">
                                  <span>Variable (Food/Travel):</span>
                                  <strong className="text-white">{formatCurrency(v)}</strong>
                                </div>
                                <div className="d-flex justify-content-between gap-3 text-secondary small mb-1.5">
                                  <span>Discretionary (Shopping):</span>
                                  <strong className="text-white">{formatCurrency(d)}</strong>
                                </div>
                                <div className="d-flex justify-content-between gap-3 small pt-1 border-top border-secondary border-opacity-25 text-primary">
                                  <span>Total Monthly Cost:</span>
                                  <strong>{formatCurrency(tot)}</strong>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend verticalAlign="top" align="right" height={32} wrapperStyle={{ color: '#94A3B8', fontSize: '12px' }} />
                      <Area type="monotone" name="Fixed" dataKey="fixed" stackId="1" stroke="#6366F1" strokeWidth={2} fill="url(#gradFixed)" />
                      <Area type="monotone" name="Variable" dataKey="variable" stackId="1" stroke="#F59E0B" strokeWidth={2} fill="url(#gradVariable)" />
                      <Area type="monotone" name="Discretionary" dataKey="discretionary" stackId="1" stroke="#EC4899" strokeWidth={2} fill="url(#gradDisc)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* 5. Total Cost of Living Trend */}
          <Col md={6}>
            <Card className="h-100">
              <Card.Header>
                <div className="fw-semibold text-white">5. Total Cost of Living Trend</div>
                <div className="text-secondary small">Aggregated lifestyle expenditure trajectory</div>
              </Card.Header>
              <Card.Body>
                <div style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={costOfLivingData} margin={{ top: 10, right: 15, left: -5, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
                      <XAxis dataKey="name" stroke="#64748B" tick={{ fontSize: 12, fill: '#94A3B8' }} tickLine={false} />
                      <YAxis stroke="#64748B" tickFormatter={formatAxisCurrency} domain={[0, 'auto']} tick={{ fontSize: 12, fill: '#94A3B8' }} tickLine={false} />
                      <RechartsTooltip
                        formatter={(val) => [formatCurrency(val), 'Total Living Cost']}
                        contentStyle={darkTooltipStyle}
                      />
                      <Legend verticalAlign="top" align="right" height={32} wrapperStyle={{ color: '#94A3B8', fontSize: '12px' }} />
                      <Bar name="Living Cost" dataKey="total" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={36} />
                      <Line type="monotone" name="Trend" dataKey="total" stroke="#60A5FA" strokeWidth={2} dot={{ r: 3 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* 6. Daily Spending Pattern */}
          <Col md={6}>
            <Card className="h-100">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="fw-semibold text-white">6. Daily Spending Pattern</div>
                  <div className="text-secondary small">Daily activity in {getMonthName(period.month)} {period.year}</div>
                </div>
              </Card.Header>
              <Card.Body>
                <div style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyData} margin={{ top: 10, right: 15, left: -5, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
                      <XAxis
                        dataKey="day"
                        stroke="#64748B"
                        tick={{ fontSize: 11, fill: '#94A3B8' }}
                        interval={window.innerWidth < 768 ? 4 : 2}
                        tickLine={false}
                      />
                      <YAxis stroke="#64748B" tickFormatter={formatAxisCurrency} domain={[0, 'auto']} tick={{ fontSize: 12, fill: '#94A3B8' }} tickLine={false} />
                      <RechartsTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div style={darkTooltipStyle}>
                                <div className="fw-bold text-white mb-1">
                                  {d.day} {getMonthName(period.month)} {period.year}
                                </div>
                                <div className="text-success small">
                                  Daily Spent: <strong>{formatCurrency(d.total)}</strong>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar name="Daily Total" dataKey="total" fill="#10B981" radius={[3, 3, 0, 0]} maxBarSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* 7. Monthly Subscription Spending */}
          <Col md={6}>
            <Card className="h-100">
              <Card.Header>
                <div className="fw-semibold text-white">7. Recurring Subscription Spend</div>
                <div className="text-secondary small">Total subscription expenses tracked across months</div>
              </Card.Header>
              <Card.Body>
                <div style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subscriptionData} margin={{ top: 10, right: 15, left: -5, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
                      <XAxis dataKey="name" stroke="#64748B" tick={{ fontSize: 12, fill: '#94A3B8' }} tickLine={false} />
                      <YAxis stroke="#64748B" tickFormatter={formatAxisCurrency} domain={[0, 'auto']} tick={{ fontSize: 12, fill: '#94A3B8' }} tickLine={false} />
                      <RechartsTooltip
                        formatter={(val) => [formatCurrency(val), 'Subscriptions Total']}
                        contentStyle={darkTooltipStyle}
                      />
                      <Bar name="Subscriptions" dataKey="total" fill="#8B5CF6" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
}
