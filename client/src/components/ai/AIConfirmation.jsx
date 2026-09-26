import React from 'react';
import { Card, Button, Spinner, Badge } from 'react-bootstrap';
import { Check, X, ShieldAlert } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

export default function AIConfirmation({ actionData, onConfirm, onCancel, loading }) {
  if (!actionData) return null;

  const getActionLabel = () => {
    switch (actionData.action) {
      case 'add_expense': return { label: 'New Expense', variant: 'danger' };
      case 'add_income': return { label: 'New Income', variant: 'success' };
      case 'add_savings': return { label: 'Savings Contribution', variant: 'info' };
      case 'add_purchase': return { label: 'Planned Purchase', variant: 'warning' };
      default: return { label: 'Transaction', variant: 'secondary' };
    }
  };

  const { label, variant } = getActionLabel();

  return (
    <Card className="mt-2 mb-3 shadow" style={{ backgroundColor: '#1E293B', borderColor: '#4F46E5', borderWidth: '1px' }}>
      <Card.Body className="p-3">
        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-secondary border-opacity-25">
          <div className="d-flex align-items-center gap-2">
            <Badge bg={variant} className="text-uppercase tracking-wider small fw-semibold">
              {label}
            </Badge>
            <span className="text-white small fw-medium">Confirmation Required</span>
          </div>
          <span className="text-secondary small">Review details before saving</span>
        </div>

        <div className="rounded p-3 mb-3" style={{ backgroundColor: '#0F172A', border: '1px solid #334155' }}>
          {actionData.action === 'add_expense' && (
            <div className="d-flex flex-column gap-2 small">
              <div className="d-flex justify-content-between">
                <span className="text-secondary">Amount</span>
                <span className="fw-bold text-danger fs-6 tabular-nums">{formatCurrency(actionData.amount)}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-secondary">Category</span>
                <span className="text-white fw-medium">{actionData.category || 'General'}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-secondary">Description</span>
                <span className="text-white">{actionData.description || 'Expense'}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-secondary">Date</span>
                <span className="text-secondary">{actionData.date || 'Today'}</span>
              </div>
            </div>
          )}

          {actionData.action === 'add_income' && (
            <div className="d-flex flex-column gap-2 small">
              <div className="d-flex justify-content-between">
                <span className="text-secondary">Amount</span>
                <span className="fw-bold text-success fs-6 tabular-nums">+{formatCurrency(actionData.amount)}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-secondary">Source</span>
                <span className="text-white fw-medium">{actionData.source || 'General'}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-secondary">Date</span>
                <span className="text-secondary">{actionData.date || 'Today'}</span>
              </div>
            </div>
          )}

          {actionData.action === 'add_savings' && (
            <div className="d-flex flex-column gap-2 small">
              <div className="d-flex justify-content-between">
                <span className="text-secondary">Amount</span>
                <span className="fw-bold text-info fs-6 tabular-nums">{formatCurrency(actionData.amount)}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-secondary">Goal</span>
                <span className="text-white fw-medium">{actionData.goalName || actionData.goal || 'General Savings'}</span>
              </div>
            </div>
          )}

          {actionData.action === 'add_purchase' && (
            <div className="d-flex flex-column gap-2 small">
              <div className="d-flex justify-content-between">
                <span className="text-secondary">Estimated Amount</span>
                <span className="fw-bold text-warning fs-6 tabular-nums">{formatCurrency(actionData.amount)}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-secondary">Item Name</span>
                <span className="text-white fw-medium">{actionData.name || 'Planned Item'}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-secondary">Target Date</span>
                <span className="text-secondary">{actionData.targetDate || actionData.date || 'TBD'}</span>
              </div>
            </div>
          )}
        </div>

        <div className="d-flex gap-2 justify-content-end">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={onCancel}
            disabled={loading}
            className="d-flex align-items-center gap-1 px-3"
          >
            <X size={15}/>
            <span>Cancel</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onConfirm}
            disabled={loading}
            className="d-flex align-items-center gap-1 px-3 fw-medium"
          >
            {loading ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                <span className="ms-1">Saving...</span>
              </>
            ) : (
              <>
                <Check size={15}/>
                <span>Confirm & Save</span>
              </>
            )}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}
