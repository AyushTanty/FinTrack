import React, { useState, useEffect, useRef } from 'react';
import { Modal, Form, Button, Spinner, Alert, Row, Col, ButtonGroup } from 'react-bootstrap';
import { useToast } from '../../context/ToastContext.jsx';
import { categoryService } from '../../services/categoryService.js';
import { expenseService } from '../../services/expenseService.js';
import { incomeService } from '../../services/incomeService.js';
import { plannedPurchaseService } from '../../services/plannedPurchaseService.js';
import { savingsService } from '../../services/savingsService.js';
import { parseTransactionSentence } from '../../utils/transactionParser.js';
import { formatCurrency } from '../../utils/formatCurrency.js';

export default function QuickAddModal({ show, onHide, onSuccess }) {
  const { showToast } = useToast();
  const todayStr = new Date().toISOString().split('T')[0];

  const [categories, setCategories] = useState([]);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Natural language sentence input
  const [sentence, setSentence] = useState('');
  const [confidenceNote, setConfidenceNote] = useState(null);

  // Unified direct-editable transaction state
  const [type, setType] = useState('expense'); // 'expense' | 'income' | 'purchase' | 'savings'
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [incomeType, setIncomeType] = useState('SALARY');
  const [savingsGoalId, setSavingsGoalId] = useState('');
  const [date, setDate] = useState(todayStr);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [priority, setPriority] = useState('MEDIUM');
  const [notes, setNotes] = useState('');

  const sentenceInputRef = useRef(null);

  // Load categories and savings goals
  useEffect(() => {
    if (show) {
      setError(null);
      setSentence('');
      setConfidenceNote(null);
      setAmount('');
      setDescription('');
      setDate(todayStr);
      setNotes('');
      setType('expense');

      categoryService.getCategories()
        .then(res => {
          const cats = res.data?.data || [];
          setCategories(cats);
          if (cats.length > 0) setCategoryId(cats[0].id);
        })
        .catch(() => {});

      savingsService.listGoals()
        .then(res => {
          const goals = res.data?.data || [];
          setSavingsGoals(goals);
          if (goals.length > 0) setSavingsGoalId(goals[0].id);
        })
        .catch(() => {});

      setTimeout(() => {
        if (sentenceInputRef.current) sentenceInputRef.current.focus();
      }, 100);
    }
  }, [show]);

  // Real-time natural language parsing when typing sentence
  const handleSentenceChange = (e) => {
    const val = e.target.value;
    setSentence(val);
    setError(null);

    if (!val.trim()) {
      setConfidenceNote(null);
      return;
    }

    const parsed = parseTransactionSentence(val, categories);

    if (parsed.type) setType(parsed.type);
    if (parsed.amount) setAmount(String(parsed.amount));
    if (parsed.description) setDescription(parsed.description);
    if (parsed.categoryId) setCategoryId(parsed.categoryId);
    if (parsed.incomeType) setIncomeType(parsed.incomeType);
    if (parsed.date) setDate(parsed.date);
    if (parsed.note) setConfidenceNote(parsed.note);
    else setConfidenceNote(null);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please specify a valid amount.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const parsedAmount = parseFloat(amount);

      if (type === 'income') {
        await incomeService.addIncome({
          source: description || 'Income',
          amount: parsedAmount,
          type: incomeType,
          date,
          notes: notes || undefined
        });
        showToast(`Income of ${formatCurrency(parsedAmount)} recorded!`, 'success');
      } else if (type === 'purchase') {
        await plannedPurchaseService.addPurchase({
          name: description || 'Planned Item',
          expectedAmount: parsedAmount,
          categoryId: categoryId || (categories[0]?.id || undefined),
          expectedDate: date,
          priority,
          notes: notes || undefined
        });
        showToast(`Planned purchase of ${formatCurrency(parsedAmount)} saved!`, 'success');
      } else if (type === 'savings') {
        if (!savingsGoalId) {
          throw new Error('Please select or create a savings goal first.');
        }
        await savingsService.addContribution(savingsGoalId, {
          amount: parsedAmount,
          date,
          notes: notes || undefined
        });
        showToast(`Savings contribution of ${formatCurrency(parsedAmount)} recorded!`, 'success');
      } else {
        // Default: Expense
        await expenseService.addExpense({
          description: description || 'Expense',
          amount: parsedAmount,
          categoryId: categoryId || (categories[0]?.id || ''),
          date,
          paymentMethod,
          notes: notes || undefined
        });
        showToast(`Expense of ${formatCurrency(parsedAmount)} recorded!`, 'success');
      }

      if (onSuccess) onSuccess();
      onHide();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Only submit if amount is present
      if (amount && parseFloat(amount) > 0) {
        e.preventDefault();
        handleSubmit();
      }
    }
  };

  // Type styling details
  const typeConfig = {
    expense: { label: 'Expense', color: '#ef4444', badge: 'danger' },
    income: { label: 'Income', color: '#10b981', badge: 'success' },
    purchase: { label: 'Planned Purchase', color: '#06b6d4', badge: 'info' },
    savings: { label: 'Savings', color: '#14b8a6', badge: 'teal' }
  };

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static" size="lg">
      <Modal.Header closeButton className="border-secondary border-opacity-25 bg-dark">
        <div>
          <Modal.Title className="fw-bold fs-5 text-white">Quick Add Transaction</Modal.Title>
          <div className="text-secondary small">
            Type naturally or adjust any field directly below
          </div>
        </div>
      </Modal.Header>

      <Modal.Body className="bg-dark p-3 p-md-4">
        {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

        {/* 1. Natural Language Sentence Input */}
        <div className="mb-4">
          <Form.Label htmlFor="quick-add-sentence" className="small fw-semibold text-secondary mb-1">
            Type anything (e.g. "coffee 40", "salary 45000", "buy headphones 2500", "save 2000")
          </Form.Label>
          <Form.Control
            id="quick-add-sentence"
            name="quickAddSentence"
            ref={sentenceInputRef}
            type="text"
            className="bg-black bg-opacity-40 text-white border-secondary py-2"
            placeholder="Type a sentence... (auto-fills all fields below)"
            value={sentence}
            onChange={handleSentenceChange}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />
          {confidenceNote && (
            <div className="text-warning small mt-1">
              ⚠️ {confidenceNote}
            </div>
          )}
        </div>

        {/* 2. Transaction Type Direct Selector */}
        <div className="mb-3">
          <Form.Label className="small fw-semibold text-secondary mb-1 d-block">
            Transaction Type
          </Form.Label>
          <div className="d-flex flex-wrap gap-2">
            {[
              { id: 'expense', label: '💸 Expense', activeClass: 'btn-danger' },
              { id: 'income', label: '💰 Income', activeClass: 'btn-success' },
              { id: 'purchase', label: '🛒 Planned Purchase', activeClass: 'btn-info text-white' },
              { id: 'savings', label: '🎯 Savings', activeClass: 'btn-teal text-white' }
            ].map(t => (
              <Button
                key={t.id}
                size="sm"
                variant={type === t.id ? t.activeClass.replace('btn-', '') : 'outline-secondary'}
                className={`px-3 py-1.5 rounded-pill fw-medium ${type === t.id ? 'text-white' : 'text-light'}`}
                style={type === t.id && t.id === 'savings' ? { backgroundColor: '#14b8a6', borderColor: '#14b8a6' } : {}}
                onClick={() => setType(t.id)}
              >
                {t.label}
              </Button>
            ))}
          </div>
        </div>

        {/* 3. Direct Unified Form */}
        <Form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
          <Row className="g-3">
            {/* Amount */}
            <Col xs={12} sm={6}>
              <Form.Group controlId="transaction-amount">
                <Form.Label className="small fw-semibold text-secondary">
                  Amount (₹) *
                </Form.Label>
                <Form.Control
                  id="transaction-amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  className="bg-black bg-opacity-40 text-white border-secondary fw-bold fs-5"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </Form.Group>
            </Col>

            {/* Description / Item / Source */}
            <Col xs={12} sm={6}>
              <Form.Group controlId="transaction-description">
                <Form.Label className="small fw-semibold text-secondary">
                  {type === 'income' ? 'Income Source *' : type === 'purchase' ? 'Item Name *' : 'Description / Item *'}
                </Form.Label>
                <Form.Control
                  id="transaction-description"
                  name="description"
                  type="text"
                  required
                  placeholder={type === 'income' ? 'e.g. Monthly Salary, Freelance' : 'e.g. Coffee, Grocery, Uber'}
                  className="bg-black bg-opacity-40 text-white border-secondary"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Form.Group>
            </Col>

            {/* Dynamic Type-specific fields */}
            {(type === 'expense' || type === 'purchase') && (
              <Col xs={12} sm={6}>
                <Form.Group controlId="transaction-category">
                  <Form.Label className="small fw-semibold text-secondary">
                    Category *
                  </Form.Label>
                  <Form.Select
                    id="transaction-category"
                    name="categoryId"
                    className="bg-dark text-white border-secondary"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.icon || '🏷️'} {c.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            )}

            {type === 'income' && (
              <Col xs={12} sm={6}>
                <Form.Group controlId="income-type">
                  <Form.Label className="small fw-semibold text-secondary">
                    Income Type
                  </Form.Label>
                  <Form.Select
                    id="income-type"
                    name="incomeType"
                    className="bg-dark text-white border-secondary"
                    value={incomeType}
                    onChange={(e) => setIncomeType(e.target.value)}
                  >
                    <option value="SALARY">Salary</option>
                    <option value="FREELANCE">Freelance</option>
                    <option value="ONE_TIME">One Time</option>
                    <option value="OTHER">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            )}

            {type === 'savings' && (
              <Col xs={12} sm={6}>
                <Form.Group controlId="savings-goal">
                  <Form.Label className="small fw-semibold text-secondary">
                    Savings Goal *
                  </Form.Label>
                  <Form.Select
                    id="savings-goal"
                    name="savingsGoalId"
                    className="bg-dark text-white border-secondary"
                    value={savingsGoalId}
                    onChange={(e) => setSavingsGoalId(e.target.value)}
                  >
                    {savingsGoals.length === 0 ? (
                      <option value="">No savings goals found (create one in Savings)</option>
                    ) : (
                      savingsGoals.map(g => (
                        <option key={g.id} value={g.id}>
                          {g.name} (Target: ₹{g.targetAmount})
                        </option>
                      ))
                    )}
                  </Form.Select>
                </Form.Group>
              </Col>
            )}

            {/* Date */}
            <Col xs={12} sm={6}>
              <Form.Group controlId="transaction-date">
                <Form.Label className="small fw-semibold text-secondary">
                  {type === 'purchase' ? 'Target Date' : 'Date'}
                </Form.Label>
                <Form.Control
                  id="transaction-date"
                  name="date"
                  type="date"
                  className="bg-black bg-opacity-40 text-white border-secondary"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </Form.Group>
            </Col>

            {/* Expense: Payment Method */}
            {type === 'expense' && (
              <Col xs={12} sm={6}>
                <Form.Group controlId="expense-payment-method">
                  <Form.Label className="small fw-semibold text-secondary">
                    Payment Method
                  </Form.Label>
                  <Form.Select
                    id="expense-payment-method"
                    name="paymentMethod"
                    className="bg-dark text-white border-secondary"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="UPI">UPI</option>
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="OTHER">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            )}

            {/* Purchase: Priority */}
            {type === 'purchase' && (
              <Col xs={12} sm={6}>
                <Form.Group controlId="purchase-priority">
                  <Form.Label className="small fw-semibold text-secondary">
                    Priority
                  </Form.Label>
                  <Form.Select
                    id="purchase-priority"
                    name="priority"
                    className="bg-dark text-white border-secondary"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            )}

            {/* Notes */}
            <Col xs={12}>
              <Form.Group controlId="transaction-notes">
                <Form.Label className="small fw-semibold text-secondary">
                  Optional Notes
                </Form.Label>
                <Form.Control
                  id="transaction-notes"
                  name="notes"
                  type="text"
                  placeholder="Any extra context or tags"
                  className="bg-black bg-opacity-40 text-white border-secondary"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top border-secondary border-opacity-25">
            <span className="text-secondary small">
              Press <kbd className="bg-dark border border-secondary text-secondary">Enter</kbd> to save
            </span>
            <div className="d-flex gap-2">
              <Button variant="outline-secondary" size="sm" onClick={onHide} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant={type === 'income' ? 'success' : type === 'purchase' ? 'info' : 'primary'}
                size="sm"
                className={`px-4 fw-semibold ${type === 'purchase' ? 'text-white' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <Spinner size="sm" animation="border" />
                ) : (
                  `Save ${typeConfig[type]?.label || 'Transaction'}`
                )}
              </Button>
            </div>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}
