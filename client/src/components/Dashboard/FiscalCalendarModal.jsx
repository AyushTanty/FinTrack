import React, { useState, useEffect } from 'react';
import { Modal, Button, Row, Col, Badge, Spinner } from 'react-bootstrap';
import { Calendar, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { reportsService } from '../../services/reportsService';
import { formatCurrency } from '../../utils/formatCurrency';
import { getCurrentMonthYear, getMonthName } from '../../utils/dateHelpers';

export default function FiscalCalendarModal({
  show,
  onHide,
  currentPeriod,
  onSelectPeriod
}) {
  const currentActual = getCurrentMonthYear();
  const [selectedYear, setSelectedYear] = useState(currentPeriod.year);
  const [selectedMonth, setSelectedMonth] = useState(currentPeriod.month);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [loadingDaily, setLoadingDaily] = useState(false);

  // Sync selected month & year when modal opens
  useEffect(() => {
    if (show) {
      setSelectedYear(currentPeriod.year);
      setSelectedMonth(currentPeriod.month);
    }
  }, [show, currentPeriod]);

  // Fetch 12-month trend data
  useEffect(() => {
    if (!show) return;
    setLoadingTrends(true);
    reportsService.monthlyTrend(12)
      .then(res => {
        setMonthlyTrends(res.data?.data || []);
      })
      .catch(() => {})
      .finally(() => setLoadingTrends(false));
  }, [show]);

  // Fetch daily spending data for the currently previewed month in the modal
  useEffect(() => {
    if (!show) return;
    setLoadingDaily(true);
    reportsService.dailySpending(selectedMonth, selectedYear)
      .then(res => {
        setDailyData(res.data?.data || []);
      })
      .catch(() => {})
      .finally(() => setLoadingDaily(false));
  }, [show, selectedMonth, selectedYear]);

  const handleApplyAndClose = (m, y) => {
    const targetMonth = m !== undefined ? m : selectedMonth;
    const targetYear = y !== undefined ? y : selectedYear;
    onSelectPeriod({ month: targetMonth, year: targetYear });
    onHide();
  };

  const handleJumpToCurrent = () => {
    setSelectedMonth(currentActual.month);
    setSelectedYear(currentActual.year);
    handleApplyAndClose(currentActual.month, currentActual.year);
  };

  // Build calendar day cells for selected month
  const firstDayOfWeek = new Date(selectedYear, selectedMonth - 1, 1).getDay();
  const totalDaysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const calendarCells = [];

  // Blank padding cells for days before the 1st
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarCells.push({ isPadding: true, key: `pad-${i}` });
  }

  // Days in month
  const dailySpendMap = {};
  dailyData.forEach(d => {
    dailySpendMap[d.day] = d.total || 0;
  });

  const totalSpentThisMonth = dailyData.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const daysWithSpend = dailyData.filter(d => (d.total || 0) > 0).length;
  const avgDailySpend = totalDaysInMonth > 0 ? Math.round(totalSpentThisMonth / totalDaysInMonth) : 0;

  for (let day = 1; day <= totalDaysInMonth; day++) {
    const amount = dailySpendMap[day] || 0;
    const isToday = (
      day === new Date().getDate() &&
      selectedMonth === currentActual.month &&
      selectedYear === currentActual.year
    );
    calendarCells.push({
      day,
      amount,
      isToday,
      key: `day-${day}`
    });
  }

  // Month grid list (Jan-Dec for selectedYear)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthSpendMap = {};
  monthlyTrends.forEach(t => {
    if (t.year === selectedYear) {
      monthSpendMap[t.month] = t;
    }
  });

  // Calculate highest spend for heatmap normalization
  const maxSpend = Math.max(1, ...monthlyTrends.map(t => t.spent || 0));

  return (
    <Modal show={show} onHide={onHide} size="lg" centered backdrop="static">
      <Modal.Header closeButton className="border-secondary border-opacity-25 bg-dark">
        <div>
          <Modal.Title className="fw-bold fs-5 text-white d-flex align-items-center gap-2">
            <Calendar size={20} className="text-primary" />
            <span>Fiscal Overview & Activity Heatmap</span>
          </Modal.Title>
          <div className="text-secondary small mt-1">
            Browse monthly spending trends or inspect daily financial activity
          </div>
        </div>
      </Modal.Header>

      <Modal.Body className="bg-dark p-3 p-md-4">
        {/* Top Controls: Year Switcher & Quick Current Month Button */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2 pb-3 border-bottom border-secondary border-opacity-25">
          <div className="d-flex align-items-center gap-2 bg-black bg-opacity-40 border border-secondary border-opacity-25 rounded px-2 py-1">
            <Button
              variant="link"
              size="sm"
              className="p-0 text-secondary text-decoration-none px-2"
              onClick={() => setSelectedYear(y => y - 1)}
            >
              <ChevronLeft size={16} />
            </Button>
            <span className="fw-bold text-white small px-2">
              {selectedYear}
            </span>
            <Button
              variant="link"
              size="sm"
              className="p-0 text-secondary text-decoration-none px-2"
              onClick={() => setSelectedYear(y => y + 1)}
            >
              <ChevronRight size={16} />
            </Button>
          </div>

          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              size="sm"
              className="d-flex align-items-center gap-1"
              onClick={handleJumpToCurrent}
            >
              <span>Jump to Current Month</span>
            </Button>
          </div>
        </div>

        {/* Section 1: 12-Month Overview Grid */}
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="text-secondary small fw-semibold text-uppercase tracking-wider">
              {selectedYear} Monthly Spending Heatmap
            </span>
            {loadingTrends && <Spinner size="sm" animation="border" variant="primary" />}
          </div>

          <Row className="g-2">
            {monthNames.map((name, idx) => {
              const mNum = idx + 1;
              const isSelected = (mNum === selectedMonth && selectedYear === currentPeriod.year);
              const isCurrentCalendar = (mNum === currentActual.month && selectedYear === currentActual.year);
              const trendData = monthSpendMap[mNum];
              const spent = trendData?.spent || 0;
              const intensity = spent > 0 ? Math.min(1, spent / maxSpend) : 0;

              // Heatmap background color styling
              let bgColor = 'rgba(30, 41, 59, 0.4)';
              let borderColor = 'rgba(51, 65, 85, 0.5)';
              if (isSelected) {
                borderColor = '#6366f1';
                bgColor = 'rgba(99, 102, 241, 0.15)';
              } else if (spent > 0) {
                if (intensity > 0.6) {
                  bgColor = 'rgba(239, 68, 68, 0.12)';
                  borderColor = 'rgba(239, 68, 68, 0.3)';
                } else if (intensity > 0.3) {
                  bgColor = 'rgba(245, 158, 11, 0.12)';
                  borderColor = 'rgba(245, 158, 11, 0.3)';
                } else {
                  bgColor = 'rgba(16, 185, 129, 0.12)';
                  borderColor = 'rgba(16, 185, 129, 0.3)';
                }
              }

              return (
                <Col xs={4} sm={3} md={2} key={name}>
                  <div
                    onClick={() => setSelectedMonth(mNum)}
                    className="p-2 rounded text-center cursor-pointer transition-all h-100 d-flex flex-column justify-content-between"
                    style={{
                      backgroundColor: bgColor,
                      border: `1px solid ${borderColor}`,
                      cursor: 'pointer',
                      minHeight: '74px'
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className={`small fw-bold ${isSelected ? 'text-primary' : 'text-white'}`}>
                        {name}
                      </span>
                      {isCurrentCalendar && (
                        <span
                          className="badge bg-primary text-white rounded-pill px-1"
                          style={{ fontSize: '0.62rem' }}
                        >
                          Now
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="fw-semibold text-white small tabular-nums" style={{ fontSize: '0.8rem' }}>
                        {formatCurrency(spent)}
                      </div>
                      <div className="text-secondary" style={{ fontSize: '0.68rem' }}>
                        spent
                      </div>
                    </div>
                  </div>
                </Col>
              );
            })}
          </Row>
        </div>

        {/* Section 2: Daily Spending Heatmap for Selected Month */}
        <div className="p-3 rounded border border-secondary border-opacity-25" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <span className="fw-bold text-white fs-6">
                {getMonthName(selectedMonth)} {selectedYear} Daily Activity
              </span>
              <div className="text-secondary small">
                Day-by-day expenditure breakdown
              </div>
            </div>
            {loadingDaily && <Spinner size="sm" animation="border" variant="primary" />}
          </div>

          {/* Days of week header */}
          <div className="d-grid mb-1 text-center text-secondary small fw-semibold" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Calendar Heatmap Grid */}
          <div className="d-grid gap-1 text-center" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {calendarCells.map(cell => {
              if (cell.isPadding) {
                return (
                  <div
                    key={cell.key}
                    className="rounded p-2"
                    style={{ minHeight: '52px', backgroundColor: 'transparent' }}
                  />
                );
              }

              const hasSpend = cell.amount > 0;
              let cellBg = 'rgba(30, 41, 59, 0.3)';
              let cellBorder = cell.isToday ? '#6366f1' : 'rgba(51, 65, 85, 0.3)';
              let textColor = 'text-secondary';

              if (hasSpend) {
                if (cell.amount > 2000) {
                  cellBg = 'rgba(239, 68, 68, 0.2)';
                  cellBorder = 'rgba(239, 68, 68, 0.4)';
                  textColor = 'text-danger';
                } else if (cell.amount > 500) {
                  cellBg = 'rgba(245, 158, 11, 0.2)';
                  cellBorder = 'rgba(245, 158, 11, 0.4)';
                  textColor = 'text-warning';
                } else {
                  cellBg = 'rgba(16, 185, 129, 0.2)';
                  cellBorder = 'rgba(16, 185, 129, 0.4)';
                  textColor = 'text-success';
                }
              }

              return (
                <div
                  key={cell.key}
                  className="rounded p-1 d-flex flex-column justify-content-between"
                  style={{
                    minHeight: '52px',
                    backgroundColor: cellBg,
                    border: `1px solid ${cellBorder}`
                  }}
                  title={hasSpend ? `Day ${cell.day}: ${formatCurrency(cell.amount)}` : `Day ${cell.day}: ₹0`}
                >
                  <div className="d-flex justify-content-between align-items-center px-1">
                    <span className={`small fw-semibold ${cell.isToday ? 'text-primary' : 'text-white'}`} style={{ fontSize: '0.75rem' }}>
                      {cell.day}
                    </span>
                    {cell.isToday && (
                      <span className="badge bg-primary p-1 rounded-circle" style={{ width: '5px', height: '5px' }} />
                    )}
                  </div>
                  {hasSpend ? (
                    <span className={`fw-bold tabular-nums small ${textColor}`} style={{ fontSize: '0.72rem' }}>
                      {formatCurrency(cell.amount)}
                    </span>
                  ) : (
                    <span className="text-secondary opacity-50" style={{ fontSize: '0.68rem' }}>
                      -
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Month Summary Bar */}
          <div className="d-flex flex-wrap justify-content-between align-items-center mt-3 pt-2 border-top border-secondary border-opacity-25 small text-secondary">
            <div>
              Total Month Spent: <strong className="text-white tabular-nums">{formatCurrency(totalSpentThisMonth)}</strong>
            </div>
            <div>
              Daily Average: <strong className="text-white tabular-nums">{formatCurrency(avgDailySpend)}/day</strong>
            </div>
            <div>
              Active Spending Days: <strong className="text-white tabular-nums">{daysWithSpend} of {totalDaysInMonth}</strong>
            </div>
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer className="border-secondary border-opacity-25 bg-dark d-flex justify-content-between">
        <Button variant="outline-secondary" size="sm" onClick={onHide}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          className="d-flex align-items-center gap-1"
          onClick={() => handleApplyAndClose(selectedMonth, selectedYear)}
        >
          <Check size={16} />
          <span>View {getMonthName(selectedMonth)} on Dashboard</span>
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
