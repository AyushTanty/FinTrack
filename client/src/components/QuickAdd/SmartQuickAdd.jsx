import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { parseTransactionSentence } from '../../utils/transactionParser.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatTransactionAmount } from '../../utils/formatTransactionAmount.js';
import { expenseService } from '../../services/expenseService.js';
import { incomeService } from '../../services/incomeService.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function SmartQuickAdd({
  categories = [],
  onSuccess,
  onHide,
  onSwitchToManual,
  initialText = ''
}) {
  const [sentence, setSentence] = useState(initialText);
  const [parsed, setParsed] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedIncomeType, setSelectedIncomeType] = useState('SALARY');
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const inputRef = useRef(null);
  const confirmBtnRef = useRef(null);
  const { showToast } = useToast();

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Parse sentence when text or categories change
  useEffect(() => {
    if (!sentence.trim()) {
      setParsed(null);
      setSaveError(null);
      return;
    }
    const result = parseTransactionSentence(sentence, categories);
    setParsed(result);
    if (result.categoryId) {
      setSelectedCategoryId(result.categoryId);
    } else if (categories.length > 0) {
      setSelectedCategoryId(categories[0].id);
    }
    if (result.incomeType) {
      setSelectedIncomeType(result.incomeType);
    }
    setSaveError(null);
  }, [sentence, categories]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // If preview is visible and has an amount, confirm directly
      if (parsed && parsed.confidence !== 'NONE' && parsed.amount) {
        handleConfirm();
      }
    }
  };

  const handleConfirm = async () => {
    if (!parsed || !parsed.amount || loading) return;
    setLoading(true);
    setSaveError(null);

    try {
      if (parsed.type === 'income') {
        await incomeService.addIncome({
          source: parsed.description || 'Income',
          amount: parsed.amount,
          type: selectedIncomeType,
          date: parsed.date,
          notes: parsed.note || undefined
        });
        showToast(`Income of ${formatCurrency(parsed.amount)} added!`, 'success');
      } else {
        await expenseService.addExpense({
          description: parsed.description || 'Expense',
          amount: parsed.amount,
          categoryId: selectedCategoryId,
          date: parsed.date,
          paymentMethod: 'UPI',
          notes: parsed.note || undefined
        });
        showToast(`Expense of ${formatCurrency(parsed.amount)} recorded!`, 'success');
      }

      setSentence('');
      setParsed(null);
      if (onSuccess) onSuccess();
      if (onHide) onHide();
    } catch (err) {
      setSaveError("Couldn't save — try again");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    if (!onSwitchToManual) return;
    onSwitchToManual({
      type: parsed?.type || 'expense',
      amount: parsed?.amount ? String(parsed.amount) : '',
      description: parsed?.description || sentence,
      categoryId: selectedCategoryId || (categories[0]?.id || ''),
      incomeType: selectedIncomeType,
      date: parsed?.date || new Date().toISOString().split('T')[0],
      rawSentence: sentence
    });
  };

  const handleManualSwitchClick = () => {
    if (!onSwitchToManual) return;
    onSwitchToManual({
      type: parsed?.type || 'expense',
      amount: parsed?.amount ? String(parsed.amount) : '',
      description: parsed?.description || sentence,
      categoryId: selectedCategoryId || (categories[0]?.id || ''),
      incomeType: selectedIncomeType,
      date: parsed?.date || new Date().toISOString().split('T')[0],
      rawSentence: sentence
    });
  };

  // Find currently selected category object
  const currentCategory = categories.find(c => c.id === selectedCategoryId) || parsed?.category || categories[0];

  return (
    <div className="smart-quick-add">
      {/* Accessible Input */}
      <Form.Group className="mb-3" controlId="smart-add-sentence">
        <Form.Label className="small fw-semibold text-secondary mb-1">
          Type or paste a transaction sentence
        </Form.Label>
        <Form.Control
          id="smart-add-sentence"
          name="smartAddSentence"
          ref={inputRef}
          type="text"
          className="bg-dark text-light border-secondary py-2"
          placeholder="e.g. bought coffee 20, received salary 25000, rent 2000"
          value={sentence}
          onChange={(e) => setSentence(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          aria-label="Transaction sentence input"
        />
      </Form.Group>

      {/* NONE confidence fallback message */}
      {parsed && parsed.confidence === 'NONE' && (
        <div className="small text-secondary mb-3 p-2 rounded bg-dark border border-secondary border-opacity-25">
          Couldn't find an amount — try including a number, or{' '}
          <Button
            variant="link"
            className="p-0 text-primary small text-decoration-none align-baseline"
            onClick={handleManualSwitchClick}
          >
            switch to manual entry
          </Button>
        </div>
      )}

      {/* Preview Card (HIGH, MEDIUM, LOW confidence) */}
      {parsed && parsed.confidence !== 'NONE' && parsed.amount && (
        <Card className="bg-dark border-secondary mb-3 shadow-sm">
          <Card.Body className="p-3">
            {saveError && (
              <Alert variant="danger" className="py-1 px-2 small mb-3">
                {saveError}
              </Alert>
            )}

            <div className="d-flex justify-content-between align-items-start mb-2">
              <div>
                {/* Signed Amount */}
                <h3 className={`mb-0 fw-bold ${parsed.type === 'income' ? 'text-success' : 'text-danger'}`}>
                  {formatTransactionAmount(parsed.type, parsed.amount).display}
                </h3>
                {/* LOW confidence note */}
                {parsed.confidence === 'LOW' && (
                  <div className="text-secondary small mt-1">
                    Check this amount
                  </div>
                )}
              </div>

              {/* Inline Category Tag / Picker */}
              <div className="text-end">
                {parsed.type === 'expense' ? (
                  !isEditingCategory ? (
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      className="rounded-pill text-light px-2 py-1 small border-secondary d-inline-flex align-items-center gap-1"
                      onClick={() => setIsEditingCategory(true)}
                      title="Click to change category"
                    >
                      <span>{currentCategory?.icon || '🏷️'}</span>
                      <span className="fw-medium">{currentCategory?.name || 'Category'}</span>
                      <span className="small text-secondary">▾</span>
                    </Button>
                  ) : (
                    <Form.Select
                      id="preview-category-select"
                      name="previewCategorySelect"
                      size="sm"
                      value={selectedCategoryId}
                      onChange={(e) => {
                        setSelectedCategoryId(e.target.value);
                        setIsEditingCategory(false);
                      }}
                      onBlur={() => setIsEditingCategory(false)}
                      autoFocus
                      className="bg-dark text-light border-primary py-0 px-2"
                      style={{ width: 'auto', display: 'inline-block' }}
                      aria-label="Select transaction category"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.icon || '🏷️'} {c.name}
                        </option>
                      ))}
                    </Form.Select>
                  )
                ) : (
                  <Form.Select
                    id="preview-income-type-select"
                    name="previewIncomeTypeSelect"
                    size="sm"
                    value={selectedIncomeType}
                    onChange={(e) => setSelectedIncomeType(e.target.value)}
                    className="bg-dark text-success border-secondary py-0 px-2"
                    style={{ width: 'auto', display: 'inline-block' }}
                    aria-label="Select income type"
                  >
                    <option value="SALARY">Salary</option>
                    <option value="FREELANCE">Freelance</option>
                    <option value="ONE_TIME">One Time</option>
                    <option value="OTHER">Other</option>
                  </Form.Select>
                )}
              </div>
            </div>

            {/* Description & Date */}
            <div className="mb-3">
              <div className="text-light fw-medium">{parsed.description || 'Transaction'}</div>
              <div className="text-secondary small">{parsed.dateLabel}</div>
            </div>

            {/* Action Buttons */}
            <div className="d-flex justify-content-end gap-2 pt-2 border-top border-secondary border-opacity-25">
              <Button
                variant="outline-secondary"
                size="sm"
                className="px-3"
                onClick={handleEditClick}
                disabled={loading}
              >
                Edit
              </Button>
              <Button
                ref={confirmBtnRef}
                variant={parsed.type === 'income' ? 'success' : 'primary'}
                size="sm"
                className="px-3"
                onClick={handleConfirm}
                disabled={loading}
              >
                {loading ? <Spinner size="sm" animation="border" /> : 'Confirm'}
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Footer hint */}
      <div className="d-flex justify-content-between align-items-center mt-2">
        <span className="text-secondary small" style={{ fontSize: '0.78rem' }}>
          Press Enter to confirm
        </span>
        <Button
          variant="link"
          className="p-0 text-secondary small text-decoration-none"
          style={{ fontSize: '0.78rem' }}
          onClick={handleManualSwitchClick}
        >
          Manual form →
        </Button>
      </div>
    </div>
  );
}
