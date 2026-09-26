import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Modal, Form, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { Edit2, Trash2, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { expenseService } from '../../services/expenseService';
import { categoryService } from '../../services/categoryService';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatTransactionAmount } from '../../utils/formatTransactionAmount';
import { getCurrentMonthYear, getMonthName } from '../../utils/dateHelpers';
import { useToast } from '../../context/ToastContext';
import QuickAddModal from '../../components/QuickAdd/QuickAddModal';

export default function ExpensesPage() {
  const [period, setPeriod] = useState(getCurrentMonthYear());
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [page, setPage] = useState(1);
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deletingExpense, setDeletingExpense] = useState(null);
  const { showToast } = useToast();

  const fetchExpenses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await expenseService.getExpenses({
        month: period.month,
        year: period.year,
        categoryId: categoryId || undefined,
        paymentMethod: paymentMethod || undefined,
        page,
        limit: 50
      });
      setExpenses(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    categoryService.getCategories()
      .then(res => setCategories(res.data?.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [period.month, period.year, categoryId, paymentMethod, page]);

  const handleDelete = async () => {
    if (!deletingExpense) return;
    try {
      await expenseService.deleteExpense(deletingExpense.id);
      showToast('Expense deleted successfully', 'success');
      setDeletingExpense(null);
      fetchExpenses();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete expense', 'danger');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await expenseService.updateExpense(editingExpense.id, {
        description: editingExpense.description,
        amount: parseFloat(editingExpense.amount),
        categoryId: editingExpense.categoryId,
        date: editingExpense.date,
        paymentMethod: editingExpense.paymentMethod,
        notes: editingExpense.notes
      });
      showToast('Expense updated successfully', 'success');
      setEditingExpense(null);
      fetchExpenses();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update expense', 'danger');
    }
  };

  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 mb-md-4 gap-2">
        <div>
          <h2 className="mb-0 fw-bold fs-4 fs-md-2">Expenses</h2>
          <span className="text-secondary small d-none d-sm-inline">Track and manage every expense accurately</span>
        </div>
        <Button 
          variant="primary" 
          size="sm" 
          className="d-flex align-items-center gap-1.5 px-3 py-1.5 fw-semibold"
          onClick={() => setShowQuickAdd(true)}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Add Expense</span>
        </Button>
      </div>

      {/* Filter Card */}
      <Card className="border-0 shadow-sm mb-3 mb-md-4">
        <Card.Body className="p-3">
          <Row className="g-2 g-md-3 align-items-center">
            {/* Month / Year */}
            <Col xs={12} sm={6} md={3}>
              <Form.Label className="small fw-semibold mb-1 text-secondary">Month / Year</Form.Label>
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

            {/* Category */}
            <Col xs={6} sm={6} md={3}>
              <Form.Label className="small fw-semibold mb-1 text-secondary">Category</Form.Label>
              <Form.Select 
                size="sm" 
                value={categoryId} 
                onChange={e => { setCategoryId(e.target.value); setPage(1); }}
                style={{ minHeight: '34px' }}
              >
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Form.Select>
            </Col>

            {/* Payment Method */}
            <Col xs={6} sm={6} md={3}>
              <Form.Label className="small fw-semibold mb-1 text-secondary">Method</Form.Label>
              <Form.Select 
                size="sm" 
                value={paymentMethod} 
                onChange={e => { setPaymentMethod(e.target.value); setPage(1); }}
                style={{ minHeight: '34px' }}
              >
                <option value="">All Methods</option>
                <option value="UPI">UPI</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="OTHER">Other</option>
              </Form.Select>
            </Col>

            {/* Total in view */}
            <Col xs={12} sm={6} md={3} className="text-md-end pt-1 pt-md-4">
              <div className="d-flex justify-content-between justify-content-md-end align-items-center bg-dark bg-opacity-40 px-3 py-1.5 rounded border border-secondary border-opacity-20" style={{ minHeight: '34px' }}>
                <span className="text-secondary small">Total in view:</span>
                <strong className="text-danger fs-6 tabular-nums ms-2">{formatCurrency(totalSpent)}</strong>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Expenses Table & Mobile Cards */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {error && <Alert variant="danger" className="m-3">{error}</Alert>}

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <div className="text-secondary small mt-2">Loading expenses...</div>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-5 text-secondary">
              <p className="mb-2">No expenses found for the selected filter.</p>
              <Button variant="outline-primary" size="sm" onClick={() => setShowQuickAdd(true)}>
                + Record an Expense
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
                      <th>Description</th>
                      <th>Category</th>
                      <th className="text-end">Amount</th>
                      <th>Method</th>
                      <th>Notes</th>
                      <th className="text-end pe-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map(e => {
                      const tx = formatTransactionAmount('expense', e.amount);
                      return (
                        <tr key={e.id}>
                          <td className="small text-secondary">
                            {new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </td>
                          <td className="fw-semibold text-white">{e.description}</td>
                          <td>
                            <Badge bg="dark" className="border border-secondary border-opacity-25 text-secondary">
                              {e.category?.name || 'Expense'}
                            </Badge>
                          </td>
                          <td className={`text-end fw-bold tabular-nums ${tx.colorClass}`}>
                            {tx.display}
                          </td>
                          <td>
                            <span className="badge bg-dark text-secondary border border-secondary border-opacity-25">{e.paymentMethod}</span>
                          </td>
                          <td className="small text-secondary" style={{ maxWidth: '200px' }}>
                            {e.notes || '—'}
                          </td>
                          <td className="text-end pe-3">
                            <Button 
                              variant="outline-secondary" 
                              size="sm" 
                              className="me-1 py-0 px-2 small" 
                              onClick={() => setEditingExpense({
                                ...e,
                                date: new Date(e.date).toISOString().split('T')[0]
                              })}
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm" 
                              className="py-0 px-2 small" 
                              onClick={() => setDeletingExpense(e)}
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

              {/* 2. Mobile Native Card View (Strictly Zero Horizontal Scroll, Ultra-Polished Fintech UI) */}
              <div className="d-md-none mobile-cards-container">
                {expenses.map(e => {
                  const tx = formatTransactionAmount('expense', e.amount);
                  const catColor = e.category?.color || '#6366F1';
                  const catIcon = e.category?.icon || '💸';

                  return (
                    <div
                      key={`mob-exp-${e.id}`}
                      className="mobile-expense-card"
                    >
                      {/* Top Header Row: Category Icon + Description + Amount */}
                      <div className="d-flex align-items-start justify-content-between mb-2" style={{ gap: '12px' }}>
                        {/* Left: Icon + Text Block */}
                        <div className="d-flex align-items-start overflow-hidden" style={{ minWidth: 0, flex: 1, gap: '10px' }}>
                          <div
                            className="exp-avatar flex-shrink-0"
                            style={{
                              backgroundColor: `${catColor}20`,
                              border: `1px solid ${catColor}40`,
                            }}
                          >
                            {catIcon}
                          </div>
                          
                          <div className="overflow-hidden" style={{ minWidth: 0, flex: 1 }}>
                            <div className="exp-title text-truncate" title={e.description}>
                              {e.description}
                            </div>
                            <div className="text-secondary small" style={{ fontSize: '0.78rem', lineHeight: 1.3 }}>
                              {new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                          </div>
                        </div>

                        {/* Right: Amount */}
                        <div className="text-end flex-shrink-0 ps-1">
                          <div className="exp-amount tabular-nums text-danger">
                            {tx.display}
                          </div>
                        </div>
                      </div>

                      {/* Middle Meta Row: Category Badge + Payment Method Pill */}
                      <div className="exp-meta-row">
                        <span
                          className="badge rounded-pill fw-medium"
                          style={{
                            backgroundColor: `${catColor}18`,
                            color: catColor,
                            border: `1px solid ${catColor}35`,
                            fontSize: '0.72rem',
                            padding: '4px 10px',
                            lineHeight: 1.25
                          }}
                        >
                          {e.category?.name || 'Expense'}
                        </span>

                        <span
                          className="badge rounded-pill bg-dark text-secondary border border-secondary border-opacity-30 fw-normal"
                          style={{
                            fontSize: '0.72rem',
                            padding: '4px 9px',
                            lineHeight: 1.25
                          }}
                        >
                          {e.paymentMethod}
                        </span>
                      </div>

                      {/* Notes (if any) */}
                      {e.notes && (
                        <div className="exp-notes fst-italic">
                          "{e.notes}"
                        </div>
                      )}

                      {/* Bottom Actions Row: Edit and Delete Buttons */}
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
                          onClick={() => setEditingExpense({
                            ...e,
                            date: new Date(e.date).toISOString().split('T')[0]
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
                          onClick={() => setDeletingExpense(e)}
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

      {/* Edit Expense Modal */}
      {editingExpense && (
        <Modal show={true} onHide={() => setEditingExpense(null)} centered>
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 fw-bold">Edit Expense</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleEditSubmit}>
            <Modal.Body>
              <Form.Group className="mb-2">
                <Form.Label className="small fw-semibold">Description *</Form.Label>
                <Form.Control 
                  type="text" 
                  required 
                  value={editingExpense.description}
                  onChange={e => setEditingExpense({ ...editingExpense, description: e.target.value })}
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
                      value={editingExpense.amount}
                      onChange={e => setEditingExpense({ ...editingExpense, amount: e.target.value })}
                    />
                  </Form.Group>
                </div>
                <div className="col-6">
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Date *</Form.Label>
                    <Form.Control 
                      type="date" 
                      required 
                      value={editingExpense.date}
                      onChange={e => setEditingExpense({ ...editingExpense, date: e.target.value })}
                    />
                  </Form.Group>
                </div>
              </div>
              <div className="row g-2 mb-2">
                <div className="col-6">
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Category</Form.Label>
                    <Form.Select 
                      value={editingExpense.categoryId}
                      onChange={e => setEditingExpense({ ...editingExpense, categoryId: e.target.value })}
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </div>
                <div className="col-6">
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Payment Method</Form.Label>
                    <Form.Select 
                      value={editingExpense.paymentMethod}
                      onChange={e => setEditingExpense({ ...editingExpense, paymentMethod: e.target.value })}
                    >
                      <option value="UPI">UPI</option>
                      <option value="CASH">Cash</option>
                      <option value="CARD">Card</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="OTHER">Other</option>
                    </Form.Select>
                  </Form.Group>
                </div>
              </div>
              <Form.Group className="mb-2">
                <Form.Label className="small fw-semibold">Notes</Form.Label>
                <Form.Control 
                  type="text" 
                  value={editingExpense.notes || ''}
                  onChange={e => setEditingExpense({ ...editingExpense, notes: e.target.value })}
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer className="py-2">
              <Button variant="outline-secondary" size="sm" onClick={() => setEditingExpense(null)}>Cancel</Button>
              <Button variant="primary" size="sm" type="submit">Save Changes</Button>
            </Modal.Footer>
          </Form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deletingExpense && (
        <Modal show={true} onHide={() => setDeletingExpense(null)} centered>
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 fw-bold text-danger">Delete Expense</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Are you sure you want to delete <strong>{deletingExpense.description}</strong> ({formatCurrency(deletingExpense.amount)})?
            <div className="text-secondary small mt-2">This will update your available money, reports, and balance.</div>
          </Modal.Body>
          <Modal.Footer className="py-2">
            <Button variant="outline-secondary" size="sm" onClick={() => setDeletingExpense(null)}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>Yes, Delete</Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Quick Add Modal */}
      <QuickAddModal 
        show={showQuickAdd} 
        onHide={() => setShowQuickAdd(false)} 
        onSuccess={fetchExpenses} 
      />
    </div>
  );
}
