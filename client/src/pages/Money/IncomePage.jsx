import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Modal, Form, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { Edit2, Trash2, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { incomeService } from '../../services/incomeService';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatTransactionAmount } from '../../utils/formatTransactionAmount';
import { getCurrentMonthYear, getMonthName } from '../../utils/dateHelpers';
import { useToast } from '../../context/ToastContext';

export default function IncomePage() {
  const [period, setPeriod] = useState(getCurrentMonthYear());
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [deletingIncome, setDeletingIncome] = useState(null);

  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    source: '',
    amount: '',
    type: 'SALARY',
    date: new Date().toISOString().split('T')[0],
    isRecurring: false,
    notes: ''
  });

  const fetchIncomes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await incomeService.getIncomes({
        month: period.month,
        year: period.year
      });
      setIncomes(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load incomes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomes();
  }, [period.month, period.year]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await incomeService.addIncome({
        ...formData,
        amount: parseFloat(formData.amount)
      });
      showToast('Income added successfully!', 'success');
      setShowAddModal(false);
      setFormData({ source: '', amount: '', type: 'SALARY', date: new Date().toISOString().split('T')[0], isRecurring: false, notes: '' });
      fetchIncomes();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to add income', 'danger');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingIncome) return;
    try {
      await incomeService.updateIncome(editingIncome.id, {
        source: editingIncome.source,
        amount: parseFloat(editingIncome.amount),
        type: editingIncome.type,
        date: editingIncome.date,
        isRecurring: editingIncome.isRecurring,
        notes: editingIncome.notes || ''
      });
      showToast('Income updated successfully!', 'success');
      setEditingIncome(null);
      fetchIncomes();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update income', 'danger');
    }
  };

  const handleDelete = async () => {
    if (!deletingIncome) return;
    try {
      await incomeService.deleteIncome(deletingIncome.id);
      showToast('Income deleted', 'success');
      setDeletingIncome(null);
      fetchIncomes();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete income', 'danger');
    }
  };

  const totalIncome = incomes.reduce((sum, inc) => sum + Number(inc.amount), 0);

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 mb-md-4 gap-2">
        <div>
          <h2 className="mb-0 fw-bold fs-4 fs-md-2">Income Management</h2>
          <span className="text-secondary small d-none d-sm-inline">Record monthly salary, freelance earnings, and side-income</span>
        </div>
        <Button 
          variant="primary" 
          size="sm" 
          className="d-flex align-items-center gap-1.5 px-3 py-1.5 fw-semibold"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Add Income</span>
        </Button>
      </div>

      {/* Month Selector & Summary */}
      <Row className="mb-3 mb-md-4 g-2 g-md-3 align-items-center">
        <Col xs={12} sm={6} md={4}>
          <div className="d-flex align-items-center border border-secondary border-opacity-25 rounded px-2 py-1 bg-dark" style={{ minHeight: '34px' }}>
            <Button 
              variant="link" 
              size="sm" 
              className="p-0 text-secondary text-decoration-none px-2 d-flex align-items-center"
              onClick={() => setPeriod(p => p.month === 1 ? { month: 12, year: p.year - 1 } : { ...p, month: p.month - 1 })}
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </Button>
            <span className="mx-auto small fw-bold text-white">{getMonthName(period.month)} {period.year}</span>
            <Button 
              variant="link" 
              size="sm" 
              className="p-0 text-secondary text-decoration-none px-2 d-flex align-items-center"
              onClick={() => setPeriod(p => p.month === 12 ? { month: 1, year: p.year + 1 } : { ...p, month: p.month + 1 })}
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </Col>

        <Col xs={12} sm={6} md={8} className="text-sm-end">
          <div className="d-flex justify-content-between justify-content-sm-end align-items-center bg-dark bg-opacity-40 px-3 py-1.5 rounded border border-secondary border-opacity-20" style={{ minHeight: '34px' }}>
            <span className="text-secondary small me-2">Total for {getMonthName(period.month)}:</span>
            <span className="text-success fw-bold fs-6 tabular-nums">+{formatCurrency(totalIncome)}</span>
          </div>
        </Col>
      </Row>

      {/* Table & Mobile Cards */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {error && <Alert variant="danger" className="m-3">{error}</Alert>}

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : incomes.length === 0 ? (
            <div className="text-center py-5 text-secondary">
              <p className="mb-2">No income entries recorded for this month.</p>
              <Button variant="outline-primary" size="sm" onClick={() => setShowAddModal(true)}>
                + Record Your Income
              </Button>
            </div>
          ) : (
            <>
              {/* 1. Desktop Multi-Column Table (Hidden on Mobile) */}
              <div className="table-responsive d-none d-md-block">
                <Table hover className="align-middle mb-0">
                  <thead>
                    <tr className="small text-secondary">
                      <th>Date</th>
                      <th>Source</th>
                      <th>Type</th>
                      <th className="text-end">Amount</th>
                      <th>Recurring</th>
                      <th>Notes</th>
                      <th className="text-end pe-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomes.map(inc => {
                      const tx = formatTransactionAmount('income', inc.amount);
                      return (
                        <tr key={inc.id}>
                          <td className="small text-secondary">
                            {new Date(inc.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </td>
                          <td className="fw-semibold text-white">{inc.source}</td>
                          <td>
                            <Badge bg="dark" className="border border-secondary border-opacity-25 text-secondary">{inc.type}</Badge>
                          </td>
                          <td className={`text-end fw-bold tabular-nums ${tx.colorClass}`}>
                            {tx.display}
                          </td>
                          <td>
                            {inc.isRecurring ? <Badge bg="dark" className="border border-secondary border-opacity-25 text-info">Monthly</Badge> : <span className="text-secondary small">One-time</span>}
                          </td>
                          <td className="small text-secondary" style={{ maxWidth: '200px' }}>
                            {inc.notes || '—'}
                          </td>
                          <td className="text-end pe-3">
                            <Button 
                              variant="outline-secondary" 
                              size="sm" 
                              className="me-1 py-0 px-2 small" 
                              onClick={() => setEditingIncome({
                                ...inc,
                                date: new Date(inc.date).toISOString().split('T')[0]
                              })}
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm" 
                              className="py-0 px-2 small" 
                              onClick={() => setDeletingIncome(inc)}
                            >
                              Delete
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>

              {/* 2. Mobile Native Card View (Strictly Zero Horizontal Scroll, Non-overlapping Spacing) */}
              <div className="d-md-none mobile-cards-container">
                {incomes.map(inc => {
                  const tx = formatTransactionAmount('income', inc.amount);

                  let typeColor = '#10B981';
                  let typeIcon = '💵';
                  if (inc.type === 'SALARY') {
                    typeColor = '#6366F1';
                    typeIcon = '💼';
                  } else if (inc.type === 'FREELANCE') {
                    typeColor = '#F59E0B';
                    typeIcon = '💻';
                  } else if (inc.type === 'ONE_TIME') {
                    typeColor = '#14B8A6';
                    typeIcon = '🎁';
                  }

                  return (
                    <div
                      key={`mob-inc-${inc.id}`}
                      className="mobile-expense-card"
                    >
                      {/* Top Header Row: Icon + Source Name + Amount */}
                      <div className="d-flex align-items-start justify-content-between mb-2" style={{ gap: '12px' }}>
                        <div className="d-flex align-items-start overflow-hidden" style={{ minWidth: 0, flex: 1, gap: '10px' }}>
                          <div
                            className="exp-avatar flex-shrink-0"
                            style={{
                              backgroundColor: `${typeColor}20`,
                              border: `1px solid ${typeColor}40`,
                            }}
                          >
                            {typeIcon}
                          </div>

                          <div className="overflow-hidden" style={{ minWidth: 0, flex: 1 }}>
                            <div className="exp-title text-truncate" title={inc.source}>
                              {inc.source}
                            </div>
                            <div className="text-secondary small" style={{ fontSize: '0.78rem', lineHeight: 1.3 }}>
                              {new Date(inc.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="text-end flex-shrink-0 ps-1">
                          <div className="exp-amount tabular-nums text-success">
                            {tx.display}
                          </div>
                        </div>
                      </div>

                      {/* Middle Meta Row: Type Badge + Recurring Badge */}
                      <div className="exp-meta-row">
                        <span
                          className="badge rounded-pill fw-medium"
                          style={{
                            backgroundColor: `${typeColor}18`,
                            color: typeColor,
                            border: `1px solid ${typeColor}35`,
                            fontSize: '0.72rem',
                            padding: '4px 10px',
                            lineHeight: 1.25
                          }}
                        >
                          {inc.type}
                        </span>

                        <span
                          className="badge rounded-pill bg-dark text-secondary border border-secondary border-opacity-30 fw-normal"
                          style={{
                            fontSize: '0.72rem',
                            padding: '4px 9px',
                            lineHeight: 1.25
                          }}
                        >
                          {inc.isRecurring ? '🔄 Monthly' : 'One-time'}
                        </span>
                      </div>

                      {/* Notes (if any) */}
                      {inc.notes && (
                        <div className="exp-notes fst-italic">
                          "{inc.notes}"
                        </div>
                      )}

                      {/* Bottom Actions Row */}
                      <div className="exp-actions">
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          className="py-1 px-3 d-inline-flex align-items-center gap-1.5"
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 500,
                            borderColor: 'rgba(255, 255, 255, 0.15)',
                            color: '#CBD5E1'
                          }}
                          onClick={() => setEditingIncome({
                            ...inc,
                            date: new Date(inc.date).toISOString().split('T')[0]
                          })}
                        >
                          <Edit2 size={13} />
                          <span>Edit</span>
                        </Button>

                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="py-1 px-3 d-inline-flex align-items-center gap-1.5"
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 500,
                            borderColor: 'rgba(239, 68, 68, 0.35)'
                          }}
                          onClick={() => setDeletingIncome(inc)}
                        >
                          <Trash2 size={13} />
                          <span>Delete</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      {/* Add Income Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold">Add Income</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddSubmit}>
          <Modal.Body>
            <Form.Group className="mb-2">
              <Form.Label className="small fw-semibold">Income Source *</Form.Label>
              <Form.Control 
                type="text" 
                required 
                placeholder="e.g. Monthly Salary, Freelance"
                value={formData.source}
                onChange={e => setFormData({ ...formData, source: e.target.value })}
              />
            </Form.Group>

            <div className="row g-2 mb-2">
              <div className="col-6">
                <Form.Group>
                  <Form.Label className="small fw-semibold">Amount (₹) *</Form.Label>
                  <Form.Control 
                    type="number" 
                    step="0.01" 
                    required 
                    placeholder="e.g. 25000"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  />
                </Form.Group>
              </div>
              <div className="col-6">
                <Form.Group>
                  <Form.Label className="small fw-semibold">Type</Form.Label>
                  <Form.Select 
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="SALARY">Salary</option>
                    <option value="FREELANCE">Freelance</option>
                    <option value="ONE_TIME">One Time</option>
                    <option value="OTHER">Other</option>
                  </Form.Select>
                </Form.Group>
              </div>
            </div>

            <div className="row g-2 mb-2">
              <div className="col-6">
                <Form.Group>
                  <Form.Label className="small fw-semibold">Date</Form.Label>
                  <Form.Control 
                    type="date" 
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                  />
                </Form.Group>
              </div>
              <div className="col-6 d-flex align-items-center pt-3">
                <Form.Check 
                  type="checkbox"
                  id="recurringCheck"
                  label="Recurring Monthly"
                  checked={formData.isRecurring}
                  onChange={e => setFormData({ ...formData, isRecurring: e.target.checked })}
                  className="small fw-semibold"
                />
              </div>
            </div>

            <Form.Group className="mb-2">
              <Form.Label className="small fw-semibold">Notes</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="Optional details"
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="py-2">
            <Button variant="outline-secondary" size="sm" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit">Save Income</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit Income Modal */}
      {editingIncome && (
        <Modal show={true} onHide={() => setEditingIncome(null)} centered>
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 fw-bold">Edit Income</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleEditSubmit}>
            <Modal.Body>
              <Form.Group className="mb-2">
                <Form.Label className="small fw-semibold">Income Source *</Form.Label>
                <Form.Control 
                  type="text" 
                  required 
                  placeholder="e.g. Monthly Salary, Freelance"
                  value={editingIncome.source}
                  onChange={e => setEditingIncome({ ...editingIncome, source: e.target.value })}
                />
              </Form.Group>

              <div className="row g-2 mb-2">
                <div className="col-6">
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Amount (₹) *</Form.Label>
                    <Form.Control 
                      type="number" 
                      step="0.01" 
                      required 
                      placeholder="e.g. 25000"
                      value={editingIncome.amount}
                      onChange={e => setEditingIncome({ ...editingIncome, amount: e.target.value })}
                    />
                  </Form.Group>
                </div>
                <div className="col-6">
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Type</Form.Label>
                    <Form.Select 
                      value={editingIncome.type}
                      onChange={e => setEditingIncome({ ...editingIncome, type: e.target.value })}
                    >
                      <option value="SALARY">Salary</option>
                      <option value="FREELANCE">Freelance</option>
                      <option value="ONE_TIME">One Time</option>
                      <option value="OTHER">Other</option>
                    </Form.Select>
                  </Form.Group>
                </div>
              </div>

              <div className="row g-2 mb-2">
                <div className="col-6">
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Date</Form.Label>
                    <Form.Control 
                      type="date" 
                      value={editingIncome.date}
                      onChange={e => setEditingIncome({ ...editingIncome, date: e.target.value })}
                    />
                  </Form.Group>
                </div>
                <div className="col-6 d-flex align-items-center pt-3">
                  <Form.Check 
                    type="checkbox"
                    id="editRecurringCheck"
                    label="Recurring Monthly"
                    checked={editingIncome.isRecurring || false}
                    onChange={e => setEditingIncome({ ...editingIncome, isRecurring: e.target.checked })}
                    className="small fw-semibold"
                  />
                </div>
              </div>

              <Form.Group className="mb-2">
                <Form.Label className="small fw-semibold">Notes</Form.Label>
                <Form.Control 
                  type="text" 
                  placeholder="Optional details"
                  value={editingIncome.notes || ''}
                  onChange={e => setEditingIncome({ ...editingIncome, notes: e.target.value })}
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer className="py-2">
              <Button variant="outline-secondary" size="sm" onClick={() => setEditingIncome(null)}>Cancel</Button>
              <Button variant="primary" size="sm" type="submit">Update Income</Button>
            </Modal.Footer>
          </Form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deletingIncome && (
        <Modal show={true} onHide={() => setDeletingIncome(null)} centered>
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 fw-bold text-danger">Delete Income</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Are you sure you want to delete <strong>{deletingIncome.source}</strong> ({formatCurrency(deletingIncome.amount)})?
          </Modal.Body>
          <Modal.Footer className="py-2">
            <Button variant="outline-secondary" size="sm" onClick={() => setDeletingIncome(null)}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>Delete</Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
}
