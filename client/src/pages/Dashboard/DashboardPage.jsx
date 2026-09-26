import React, { useState } from 'react';
import { Card, Row, Col, Spinner, Alert, Table, Button, ProgressBar, Badge, Collapse } from 'react-bootstrap';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { useDashboard } from '../../hooks/useDashboard';
import { getCurrentMonthYear, getMonthName } from '../../utils/dateHelpers';
import { formatAxisCurrency, darkTooltipStyle, CHART_PALETTE } from '../../utils/chartHelpers';
import QuickAddModal from '../../components/QuickAdd/QuickAddModal';
import FiscalCalendarModal from '../../components/Dashboard/FiscalCalendarModal';

const CHART_COLORS = CHART_PALETTE;

export default function DashboardPage() {
  const actualCurrent = getCurrentMonthYear();
  const [period, setPeriod] = useState(actualCurrent);
  const [showCalculation, setShowCalculation] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showFiscalModal, setShowFiscalModal] = useState(false);

  const isCurrentMonth = (period.month === actualCurrent.month && period.year === actualCurrent.year);

  const { data, loading, error, refetch } = useDashboard(period.month, period.year);

  const handlePrevMonth = () => {
    setPeriod(prev => {
      if (prev.month === 1) return { month: 12, year: prev.year - 1 };
      return { month: prev.month - 1, year: prev.year };
    });
  };

  const handleNextMonth = () => {
    setPeriod(prev => {
      if (prev.month === 12) return { month: 1, year: prev.year + 1 };
      return { month: prev.month + 1, year: prev.year };
    });
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '350px' }}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-3 text-secondary">Loading financial records...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="d-flex justify-content-between align-items-center my-4">
        <div><strong>Error loading dashboard:</strong> {error}</div>
        <Button variant="outline-danger" size="sm" onClick={refetch}>Retry</Button>
      </Alert>
    );
  }

  const summary = data?.summary || {};
  const tam = data?.trueAvailableMoney || 0;
  const sdb = data?.safeDailyBudget || 0;
  const daysRemaining = data?.daysRemaining || 1;
  const breakdown = data?.tamBreakdown || {};
  const upcomingDetails = data?.upcomingObligationsDetail || [];
  const budgetStatus = data?.budgetStatus || [];
  const trend = data?.trend || [];
  const categories = data?.categories || [];

  return (
    <div className="pb-4">
      {/* Month Navigator & Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h2 className="mb-1 fw-bold tracking-tight text-white">Fiscal Overview</h2>
          <span className="text-secondary small">Quiet Fiscal Clarity • Single Source of Truth</span>
        </div>

        <div className="d-flex align-items-center gap-3">
          {/* Simple text displaying Today's Date (opens calendar heatmap modal on click) */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setShowFiscalModal(true)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setShowFiscalModal(true)}
            className="text-secondary small cursor-pointer d-flex align-items-center gap-1.5 py-1 px-1 rounded transition-all text-decoration-none"
            style={{ cursor: 'pointer', userSelect: 'none' }}
            title="Click to view month-wise spending & activity heatmap"
          >
            <span className="text-white fw-medium">
              {isCurrentMonth 
                ? `Today, ${new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' })}`
                : `Viewing: ${getMonthName(period.month)} ${period.year}`
              }
            </span>
            <span className="text-secondary small" style={{ fontSize: '0.65rem' }}>▼</span>
          </div>
        </div>
      </div>

      {/* 4 Financial Summary Cards */}
      <Row className="mb-4 g-3">
        <Col xs={12} sm={6} lg={3}>
          <Card className="h-100 p-3">
            <div className="text-secondary small text-uppercase fw-semibold tracking-wider">Monthly Income</div>
            <div className="d-flex align-items-baseline gap-2 mt-2">
              <h3 className="mb-0 fw-bold text-white tabular-nums">{formatCurrency(summary.income || 0)}</h3>
            </div>
            <div className="text-secondary small mt-2">Recorded this month</div>
          </Card>
        </Col>

        <Col xs={12} sm={6} lg={3}>
          <Card className="h-100 p-3">
            <div className="text-secondary small text-uppercase fw-semibold tracking-wider">Total Spent</div>
            <div className="d-flex align-items-baseline gap-2 mt-2">
              <h3 className="mb-0 fw-bold text-white tabular-nums">{formatCurrency(summary.spent || 0)}</h3>
            </div>
            <div className="text-secondary small mt-2">Fixed: {formatCurrency(summary.fixedExpenses || 0)}</div>
          </Card>
        </Col>

        <Col xs={12} sm={6} lg={3}>
          <Card className="h-100 p-3">
            <div className="text-secondary small text-uppercase fw-semibold tracking-wider">Savings Committed</div>
            <div className="d-flex align-items-baseline gap-2 mt-2">
              <h3 className="mb-0 fw-bold text-white tabular-nums">{formatCurrency(summary.savings || 0)}</h3>
            </div>
            <div className="text-secondary small mt-2">
              {summary.actualSaved ? `${formatCurrency(summary.actualSaved)} contributed this month` : 'Allocated to goals'}
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={6} lg={3}>
          <Card className="h-100 p-3">
            <div className="text-secondary small text-uppercase fw-semibold tracking-wider">Total Net Balance</div>
            <div className="d-flex align-items-baseline gap-2 mt-2">
              <h3 className="mb-0 fw-bold text-white tabular-nums">{formatCurrency(summary.balance || 0)}</h3>
            </div>
            <div className="text-secondary small mt-2">Live computed on read</div>
          </Card>
        </Col>
      </Row>

      {/* True Available Money & Safe Daily Budget */}
      <Row className="mb-4 g-3">
        <Col lg={7}>
          <Card className="h-100 p-4">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="badge mb-2" style={{ backgroundColor: 'rgba(79, 70, 229, 0.15)', color: '#A5B4FC', border: '1px solid rgba(79, 70, 229, 0.3)' }}>
                  True Available Money (TAM)
                </span>
                <h1 className="fw-bold mb-0 text-white tabular-nums display-6">{formatCurrency(tam)}</h1>
              </div>
              <Button
                variant="outline-secondary"
                size="sm"
                className="d-flex align-items-center gap-1 py-1 px-2"
                onClick={() => setShowCalculation(!showCalculation)}
              >
                <span>Breakdown</span>
                {showCalculation ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </Button>
            </div>
            <div className="text-secondary small mt-2">
              Discretionary liquid cash after subtracting upcoming bills, planned purchases, and emergency buffer.
            </div>

            {/* Collapsible calculation panel */}
            <Collapse in={showCalculation}>
              <div className="mt-3 pt-3 border-top border-secondary border-opacity-25 p-3 rounded" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }}>
                {/* 1. Current Balance */}
                <div className="d-flex justify-content-between text-secondary small py-1">
                  <span>Current Balance</span>
                  <span className="fw-semibold text-white tabular-nums">{formatCurrency(breakdown.totalBalance || 0)}</span>
                </div>

                {/* 2. minus Savings Allocation */}
                <div className="d-flex justify-content-between text-secondary small py-1">
                  <span>minus Savings Allocation</span>
                  <span className="text-danger tabular-nums">-{formatCurrency(breakdown.savingsAllocation || 0)}</span>
                </div>

                {/* 3. minus Emergency Buffer */}
                <div className="d-flex justify-content-between text-secondary small py-1">
                  <span>minus Emergency Buffer</span>
                  <span className="text-danger tabular-nums">-{formatCurrency(breakdown.emergencyBuffer || 0)}</span>
                </div>

                {/* 4. minus Upcoming Obligations */}
                <div className="d-flex justify-content-between text-secondary small py-1">
                  <span>minus Upcoming Obligations</span>
                  <span className="text-danger tabular-nums">-{formatCurrency(breakdown.upcomingObligations || 0)}</span>
                </div>
                {breakdown.upcomingList && breakdown.upcomingList.length > 0 && (
                  <div className="ps-3 pe-1 py-1 mb-1 border-start border-secondary border-opacity-25">
                    {breakdown.upcomingList.map((item, idx) => (
                      <div key={idx} className="d-flex justify-content-between text-secondary small py-0" style={{ fontSize: '0.8rem' }}>
                        <span>• {item.name} — {item.dueText || (item.dueDay ? `due ${item.dueDay}th` : 'due this month')}</span>
                        <span className="tabular-nums">-{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 5. minus Planned Purchases this month */}
                <div className="d-flex justify-content-between text-secondary small py-1">
                  <span>minus Planned Purchases this month</span>
                  <span className="text-danger tabular-nums">-{formatCurrency(breakdown.plannedPurchases || 0)}</span>
                </div>
                {breakdown.plannedList && breakdown.plannedList.length > 0 && (
                  <div className="ps-3 pe-1 py-1 mb-1 border-start border-secondary border-opacity-25">
                    {breakdown.plannedList.map((p, idx) => (
                      <div key={idx} className="d-flex justify-content-between text-secondary small py-0" style={{ fontSize: '0.8rem' }}>
                        <span>• {p.name} — {p.dueText || 'this month'}</span>
                        <span className="tabular-nums">-{formatCurrency(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 6. = Remaining pool */}
                <div className="d-flex justify-content-between fw-bold pt-2 mt-2 border-top border-secondary border-opacity-25">
                  <span className="text-white">= Remaining pool</span>
                  <span className="text-white tabular-nums" style={{ color: '#818CF8' }}>
                    {formatCurrency(breakdown.remainingPool !== undefined ? breakdown.remainingPool : tam)}
                  </span>
                </div>

                {/* 7. divided by Days Remaining */}
                <div className="d-flex justify-content-between text-secondary small py-1">
                  <span>divided by Days Remaining</span>
                  <span className="text-info tabular-nums">{daysRemaining} days left in {getMonthName(period.month)}</span>
                </div>

                {/* 8. = Safe Daily Budget */}
                <div className="d-flex justify-content-between fw-bold pt-2 mt-1 border-top border-secondary border-opacity-25">
                  <span className="text-success">= Safe Daily Budget</span>
                  <span className="text-success tabular-nums fs-6">
                    {formatCurrency(sdb)} / day
                  </span>
                </div>
              </div>
            </Collapse>
          </Card>
        </Col>

        <Col lg={5}>
          <Card className="h-100 p-4">
            <div>
              <span className="badge mb-2" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                Safe Daily Budget
              </span>
              <h1 className="fw-bold mb-0 text-white tabular-nums display-6" style={{ color: '#10B981' }}>
                {formatCurrency(sdb)}
                <span className="fs-6 text-secondary fw-normal"> / day</span>
              </h1>
              <div className="text-secondary small mt-2">
                Calculated over <strong>{daysRemaining}</strong> remaining days in {getMonthName(period.month)}.
              </div>
            </div>
            <div className="mt-3 p-2 rounded small text-secondary" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }}>
              Formula: TAM ({formatCurrency(tam)}) ÷ {daysRemaining} days (floor)
            </div>
          </Card>
        </Col>
      </Row>

      {/* Upcoming Obligations & Budget Status */}
      <Row className="mb-4 g-4">
        <Col md={6}>
          <Card className="h-100">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <span className="fw-semibold text-white">Upcoming Obligations</span>
              <Badge bg="warning" text="dark" className="fw-semibold px-2 py-1">{upcomingDetails.length} pending</Badge>
            </Card.Header>
            <Card.Body className="p-0">
              {upcomingDetails.length === 0 ? (
                <div className="text-secondary text-center py-5">
                  No upcoming unpaid obligations this month.
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover className="align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Obligation</th>
                        <th>Type</th>
                        <th>Due</th>
                        <th className="text-end">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {upcomingDetails.map((item, idx) => (
                        <tr key={idx}>
                          <td className="fw-medium text-white">{item.name}</td>
                          <td>
                            <Badge bg="dark" className="border border-secondary border-opacity-25 text-secondary font-monospace">
                              {item.category || item.type}
                            </Badge>
                          </td>
                          <td className="text-secondary small">
                            {item.dueDay ? `${item.dueDay}th` : (item.billingDate ? new Date(item.billingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'This month')}
                          </td>
                          <td className="text-end fw-semibold text-danger tabular-nums">
                            -{formatCurrency(item.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="h-100">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <span className="fw-semibold text-white">Budget vs Actual</span>
              <span className="text-secondary small">Category Limits</span>
            </Card.Header>
            <Card.Body className="p-3">
              {budgetStatus.length === 0 ? (
                <div className="text-secondary text-center py-5">
                  No category budgets set for this month.
                  <div className="small mt-1 text-muted">Configure budgets under Settings &gt; Categories.</div>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {budgetStatus.slice(0, 5).map((item, idx) => {
                    const isOver = item.actual > item.budgeted;
                    return (
                      <div key={idx}>
                        <div className="d-flex justify-content-between align-items-center mb-1 small">
                          <span className="fw-medium text-white">{item.name}</span>
                          <span className="tabular-nums">
                            <strong className="text-white">{formatCurrency(item.actual)}</strong>
                            <span className="text-secondary"> / {formatCurrency(item.budgeted)}</span>
                            <span className={isOver ? 'text-danger ms-2 fw-semibold' : 'text-success ms-2'}>
                              ({isOver ? `+${formatCurrency(item.actual - item.budgeted)}` : `${formatCurrency(item.remaining)} left`})
                            </span>
                          </span>
                        </div>
                        <ProgressBar
                          now={Math.min(100, item.percent)}
                          variant={isOver ? 'danger' : item.percent > 80 ? 'warning' : 'primary'}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Visualizations: Monthly Spending Trend & Category Donut */}
      {(() => {
        const totalCategorySpend = categories.reduce((sum, c) => sum + (c.value || 0), 0);
        const displayTrend = trend.slice(-3);
        const hasTrendData = displayTrend.some(t => (t.spent || 0) > 0 || (t.income || 0) > 0);

        return (
          <Row className="mb-4 g-4">
            <Col lg={8}>
              <Card className="h-100">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="fw-semibold text-white">Monthly Spending Trend</div>
                    <div className="text-secondary small">Income vs Expenses comparison across the last 3 months</div>
                  </div>
                  {hasTrendData && (
                    <span className="badge bg-dark text-secondary border border-secondary border-opacity-25 small font-monospace">
                      3 Months Trend
                    </span>
                  )}
                </Card.Header>
                <Card.Body>
                  <div style={{ height: 290 }}>
                    {hasTrendData ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={displayTrend} margin={{ top: 12, right: 20, left: -5, bottom: 0 }}>
                          <defs>
                            <linearGradient id="dashIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10B981" stopOpacity={0.25}/>
                              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="dashSpentGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#EF4444" stopOpacity={0.25}/>
                              <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
                          <XAxis
                            dataKey="name"
                            stroke="#64748B"
                            tick={{ fontSize: 12, fill: '#94A3B8' }}
                            tickLine={false}
                            padding={{ left: 24, right: 24 }}
                          />
                          <YAxis
                            stroke="#64748B"
                            tickFormatter={formatAxisCurrency}
                            domain={[0, 'auto']}
                            tick={{ fontSize: 12, fill: '#94A3B8' }}
                            tickLine={false}
                          />
                          <RechartsTooltip
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                const inc = payload.find(p => p.dataKey === 'income')?.value || 0;
                                const exp = payload.find(p => p.dataKey === 'spent')?.value || 0;
                                const net = inc - exp;
                                return (
                                  <div style={darkTooltipStyle}>
                                    <div className="fw-bold text-white mb-2 pb-1 border-bottom border-secondary border-opacity-25">
                                      {label}
                                    </div>
                                    <div className="d-flex justify-content-between gap-3 text-success small mb-1">
                                      <span>Income:</span>
                                      <strong className="tabular-nums">+{formatCurrency(inc)}</strong>
                                    </div>
                                    <div className="d-flex justify-content-between gap-3 text-danger small mb-1.5">
                                      <span>Expenses:</span>
                                      <strong className="tabular-nums">-{formatCurrency(exp)}</strong>
                                    </div>
                                    <div className={`d-flex justify-content-between gap-3 small pt-1 border-top border-secondary border-opacity-25 ${net >= 0 ? 'text-primary' : 'text-warning'}`}>
                                      <span>{net >= 0 ? 'Monthly Net Saved:' : 'Monthly Deficit:'}</span>
                                      <strong className="tabular-nums">{net >= 0 ? `+${formatCurrency(net)}` : `-${formatCurrency(Math.abs(net))}`}</strong>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend
                            verticalAlign="top"
                            align="right"
                            height={32}
                            wrapperStyle={{ color: '#94A3B8', fontSize: '12px' }}
                          />
                          <Area
                            type="monotone"
                            name="Income"
                            dataKey="income"
                            stroke="#10B981"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#dashIncomeGrad)"
                            dot={{ r: 4, fill: '#10B981', strokeWidth: 1.5, stroke: '#0F172A' }}
                            activeDot={{ r: 6 }}
                          />
                          <Area
                            type="monotone"
                            name="Expenses"
                            dataKey="spent"
                            stroke="#EF4444"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#dashSpentGrad)"
                            dot={{ r: 4, fill: '#EF4444', strokeWidth: 1.5, stroke: '#0F172A' }}
                            activeDot={{ r: 6 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-secondary text-center py-5 d-flex flex-column align-items-center justify-content-center h-100">
                        <span className="fs-3 mb-2">📈</span>
                        <div className="fw-medium text-white">No historical trend data yet</div>
                        <div className="small text-secondary mt-1">Income and expense trends will appear here across months.</div>
                      </div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4}>
              <Card className="h-100">
                <Card.Header>
                  <div className="fw-semibold text-white">Spending by Category</div>
                  <div className="text-secondary small">Distribution this month</div>
                </Card.Header>
                <Card.Body className="d-flex flex-column justify-content-between">
                  <div style={{ height: 210, position: 'relative' }}>
                    {totalCategorySpend > 0 ? (
                      <>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={categories}
                              innerRadius={62}
                              outerRadius={86}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {categories.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]}
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
                                        Spent: <strong className="text-white">{formatCurrency(item.value)}</strong>
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

                        {/* Centered Total inside Donut */}
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
                    ) : (
                      <div className="text-secondary text-center py-4 d-flex flex-column align-items-center justify-content-center h-100">
                        <span className="fs-3 mb-2">🍽️</span>
                        <div className="fw-medium text-white">No expenses recorded</div>
                        <div className="small text-secondary mt-1">Expenses logged this month will appear here by category.</div>
                      </div>
                    )}
                  </div>

                  {/* Clean Category Legend Pills */}
                  {totalCategorySpend > 0 && (
                    <div
                      className="d-flex flex-wrap justify-content-center gap-1.5 mt-2 pt-2 border-top border-secondary border-opacity-25"
                      style={{ maxHeight: '72px', overflowY: 'auto' }}
                    >
                      {categories.map((c, i) => {
                        const pct = ((c.value / totalCategorySpend) * 100).toFixed(0);
                        return (
                          <span
                            key={i}
                            className="badge bg-black bg-opacity-40 border border-secondary border-opacity-25 text-white fw-normal d-inline-flex align-items-center gap-1 py-1 px-1.5 small"
                          >
                            <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: c.color || CHART_COLORS[i % CHART_COLORS.length] }}></span>
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
          </Row>
        );
      })()}

      {/* Quick Add Modal */}
      <QuickAddModal
        show={showQuickAdd}
        onHide={() => setShowQuickAdd(false)}
        onSuccess={refetch}
      />

      {/* Fiscal Calendar & Monthly Spending Heatmap Modal */}
      <FiscalCalendarModal
        show={showFiscalModal}
        onHide={() => setShowFiscalModal(false)}
        currentPeriod={period}
        onSelectPeriod={(p) => setPeriod(p)}
      />
    </div>
  );
}
