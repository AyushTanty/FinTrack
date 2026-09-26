import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Badge, Modal, Form, Spinner, Alert, ProgressBar } from 'react-bootstrap';
import { Edit2, Trash2, Plus } from 'lucide-react';
import { savingsService } from '../../services/savingsService';
import { formatCurrency } from '../../utils/formatCurrency';
import { useToast } from '../../context/ToastContext';

export default function SavingsPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [deletingGoal, setDeletingGoal] = useState(null);
  const [contributingGoal, setContributingGoal] = useState(null);
  const [contribAmount, setContribAmount] = useState('');
  const [contribNotes, setContribNotes] = useState('');

  const { showToast } = useToast();

  const [goalForm, setGoalForm] = useState({
    name: '',
    targetAmount: '',
    targetDate: '',
    monthlyContribution: '',
    notes: ''
  });

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await savingsService.listGoals();
      setGoals(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load savings goals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleAddGoal = async (e) => {
    e.preventDefault();
    try {
      await savingsService.addGoal({
        ...goalForm,
        targetAmount: parseFloat(goalForm.targetAmount),
        monthlyContribution: goalForm.monthlyContribution ? parseFloat(goalForm.monthlyContribution) : 0,
        targetDate: goalForm.targetDate ? new Date(goalForm.targetDate) : undefined
      });
      showToast('Savings goal created!', 'success');
      setShowAddGoalModal(false);
      setGoalForm({ name: '', targetAmount: '', targetDate: '', monthlyContribution: '', notes: '' });
      fetchGoals();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create goal', 'danger');
    }
  };

  const handleAddContribution = async (e) => {
    e.preventDefault();
    if (!contributingGoal || !contribAmount) return;
    try {
      await savingsService.addContribution(contributingGoal.id, {
        amount: parseFloat(contribAmount),
        date: new Date().toISOString(),
        notes: contribNotes
      });
      showToast('Contribution added to savings goal!', 'success');
      setContributingGoal(null);
      setContribAmount('');
      setContribNotes('');
      fetchGoals();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to add contribution', 'danger');
    }
  };

  const handleEditGoalSubmit = async (e) => {
    e.preventDefault();
    if (!editingGoal) return;
    try {
      await savingsService.updateGoal(editingGoal.id, {
        name: editingGoal.name,
        targetAmount: parseFloat(editingGoal.targetAmount),
        currentAmount: parseFloat(editingGoal.currentAmount || 0),
        monthlyContribution: editingGoal.monthlyContribution ? parseFloat(editingGoal.monthlyContribution) : 0,
        targetDate: editingGoal.targetDate ? editingGoal.targetDate : null,
        status: editingGoal.status,
        notes: editingGoal.notes || ''
      });
      showToast('Savings goal updated successfully!', 'success');
      setEditingGoal(null);
      fetchGoals();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update goal', 'danger');
    }
  };

  const handleDeleteGoal = async () => {
    if (!deletingGoal) return;
    try {
      await savingsService.deleteGoal(deletingGoal.id);
      showToast('Savings goal removed successfully!', 'success');
      setDeletingGoal(null);
      fetchGoals();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete goal', 'danger');
    }
  };

  const totalSaved = goals.reduce((sum, g) => sum + Number(g.currentAmount || 0), 0);
  const totalTarget = goals.reduce((sum, g) => sum + Number(g.targetAmount || 0), 0);

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h2 className="mb-0 fw-bold">Savings Goals</h2>
          <span className="text-secondary small">Emergency funds, asset building, and planned savings targets</span>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowAddGoalModal(true)}>
          New Savings Goal
        </Button>
      </div>

      {/* Overview Cards */}
      <Row className="mb-4 g-3">
        <Col md={6}>
          <Card className="h-100 p-3">
            <div className="text-secondary small text-uppercase fw-semibold tracking-wider">Total Saved Across Goals</div>
            <h3 className="mb-0 fw-bold text-white tabular-nums mt-2">{formatCurrency(totalSaved)}</h3>
            <div className="text-secondary small mt-1">Out of {formatCurrency(totalTarget)} target</div>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="h-100 p-3">
            <div className="text-secondary small text-uppercase fw-semibold tracking-wider">Active Goals</div>
            <h3 className="mb-0 fw-bold text-white tabular-nums mt-2">{goals.filter(g => g.status === 'ACTIVE').length} Active</h3>
            <div className="text-secondary small mt-1">{goals.filter(g => g.status === 'COMPLETED').length} Completed</div>
          </Card>
        </Col>
      </Row>

      {/* Goals Grid */}
      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : goals.length === 0 ? (
        <Card className="text-center py-5">
          <Card.Body>
            <h5 className="fw-bold text-white">No Savings Goals Yet</h5>
            <p className="text-secondary small mb-3">Create an Emergency Fund, Laptop fund, or vacation target.</p>
            <Button variant="primary" size="sm" onClick={() => setShowAddGoalModal(true)}>
              Create First Savings Goal
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-3">
          {goals.map(goal => {
            const current = Number(goal.currentAmount || 0);
            const target = Number(goal.targetAmount || 1);
            const percent = Math.min(100, Math.round((current / target) * 100));
            const remaining = Math.max(0, target - current);
            const monthly = Number(goal.monthlyContribution || 0);

            let projectionText = null;
            if (goal.status === 'COMPLETED') {
              projectionText = 'Goal completed!';
            } else if (remaining <= 0) {
              projectionText = 'Target reached';
            } else if (monthly > 0) {
              const monthsNeeded = Math.ceil(remaining / monthly);
              const projDate = new Date();
              projDate.setMonth(projDate.getMonth() + monthsNeeded);
              const formattedDate = projDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
              projectionText = `Projected completion: ${formattedDate} (~${monthsNeeded} mo${monthsNeeded > 1 ? 's' : ''})`;
            }

            return (
              <Col md={6} key={goal.id}>
                <Card className="h-100 p-3">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h5 className="fw-bold mb-1 text-white">{goal.name}</h5>
                      <span className="text-secondary small">
                        {goal.targetDate ? `Target Date: ${new Date(goal.targetDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}` : 'No deadline'}
                      </span>
                    </div>
                    <Badge bg={goal.status === 'COMPLETED' ? 'success' : 'dark'} className="border border-secondary border-opacity-25 text-secondary">
                      {goal.status}
                    </Badge>
                  </div>

                  <div className="my-2">
                    <div className="d-flex justify-content-between small mb-1">
                      <span className="text-secondary">Saved: <strong className="text-white tabular-nums">{formatCurrency(current)}</strong></span>
                      <span className="text-secondary">Target: <strong className="text-white tabular-nums">{formatCurrency(target)}</strong></span>
                    </div>
                    <ProgressBar 
                      now={percent} 
                      variant={percent >= 100 ? 'success' : percent > 50 ? 'info' : 'primary'}
                      style={{ height: '6px' }}
                    />
                    <div className="d-flex justify-content-between small text-secondary mt-1 tabular-nums">
                      <span>{percent}% Complete</span>
                      <span>{formatCurrency(remaining)} remaining</span>
                    </div>
                  </div>

                  <div className="small p-2 rounded text-secondary mb-3 mt-2" style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)' }}>
                    <div>Monthly target: <strong className="text-white tabular-nums">{monthly > 0 ? formatCurrency(monthly) : 'Not set'}</strong></div>
                    {projectionText && (
                      <div className="text-info mt-1">{projectionText}</div>
                    )}
                  </div>

                  <div className="mt-auto pt-3 border-top border-secondary border-opacity-25 d-flex align-items-center gap-2">
                    <Button 
                      variant="outline-success" 
                      size="sm" 
                      className="flex-grow-1 py-1.5 d-flex align-items-center justify-content-center gap-1.5 fw-medium"
                      onClick={() => setContributingGoal(goal)}
                    >
                      <Plus size={15} />
                      <span>Add Contribution</span>
                    </Button>
                    <Button 
                      variant="outline-secondary" 
                      size="sm" 
                      className="py-1.5 px-2.5 d-flex align-items-center gap-1"
                      onClick={() => setEditingGoal({
                        ...goal,
                        targetDate: goal.targetDate ? new Date(goal.targetDate).toISOString().split('T')[0] : ''
                      })}
                      title="Edit Savings Goal"
                    >
                      <Edit2 size={13} />
                      <span>Edit</span>
                    </Button>
                    <Button 
                      variant="outline-danger" 
                      size="sm" 
                      className="py-1.5 px-2.5 d-flex align-items-center gap-1"
                      onClick={() => setDeletingGoal(goal)}
                      title="Delete Savings Goal"
                    >
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </Button>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* Add Goal Modal */}
      <Modal show={showAddGoalModal} onHide={() => setShowAddGoalModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold">Create Savings Goal</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddGoal}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Goal Name *</Form.Label>
              <Form.Control 
                type="text" 
                required 
                placeholder="e.g. Emergency Fund, Laptop, Vacation"
                value={goalForm.name}
                onChange={e => setGoalForm({ ...goalForm, name: e.target.value })}
              />
            </Form.Group>

            <Row className="g-2 mb-3">
              <Col xs={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Target Amount (₹) *</Form.Label>
                  <Form.Control 
                    type="number" 
                    step="0.01"
                    required 
                    placeholder="e.g. 50000"
                    value={goalForm.targetAmount}
                    onChange={e => setGoalForm({ ...goalForm, targetAmount: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Target Date</Form.Label>
                  <Form.Control 
                    type="date" 
                    value={goalForm.targetDate}
                    onChange={e => setGoalForm({ ...goalForm, targetDate: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Planned Monthly Contribution (₹)</Form.Label>
              <Form.Control 
                type="number" 
                step="0.01" 
                placeholder="e.g. 5000"
                value={goalForm.monthlyContribution}
                onChange={e => setGoalForm({ ...goalForm, monthlyContribution: e.target.value })}
              />
              <Form.Text className="text-secondary small">
                Used to project goal completion date.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label className="small fw-semibold">Notes</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={2} 
                placeholder="Notes or milestone targets"
                value={goalForm.notes}
                onChange={e => setGoalForm({ ...goalForm, notes: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="py-2">
            <Button variant="outline-secondary" size="sm" onClick={() => setShowAddGoalModal(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit">Save Goal</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Add Contribution Modal */}
      <Modal show={!!contributingGoal} onHide={() => setContributingGoal(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold">Add Contribution: {contributingGoal?.name}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddContribution}>
          <Modal.Body>
            <div className="mb-3 p-2 rounded small text-secondary" style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)' }}>
              Target: <strong className="text-white tabular-nums">{formatCurrency(contributingGoal?.targetAmount || 0)}</strong> · Current: <strong className="text-white tabular-nums">{formatCurrency(contributingGoal?.currentAmount || 0)}</strong>
            </div>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Contribution Amount (₹) *</Form.Label>
              <Form.Control 
                type="number" 
                step="0.01" 
                required 
                autoFocus
                placeholder="e.g. 2000"
                value={contribAmount}
                onChange={e => setContribAmount(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label className="small fw-semibold">Note</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="e.g. Monthly salary transfer"
                value={contribNotes}
                onChange={e => setContribNotes(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="py-2">
            <Button variant="outline-secondary" size="sm" onClick={() => setContributingGoal(null)}>Cancel</Button>
            <Button variant="success" size="sm" type="submit">Save Contribution</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit Goal Modal */}
      {editingGoal && (
        <Modal show={true} onHide={() => setEditingGoal(null)} centered>
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 fw-bold">Edit Savings Goal</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleEditGoalSubmit}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">Goal Name *</Form.Label>
                <Form.Control 
                  type="text" 
                  required 
                  value={editingGoal.name}
                  onChange={e => setEditingGoal({ ...editingGoal, name: e.target.value })}
                />
              </Form.Group>

              <Row className="g-2 mb-3">
                <Col xs={6}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Target Amount (₹) *</Form.Label>
                    <Form.Control 
                      type="number" 
                      step="0.01"
                      required 
                      value={editingGoal.targetAmount}
                      onChange={e => setEditingGoal({ ...editingGoal, targetAmount: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col xs={6}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Current Saved (₹)</Form.Label>
                    <Form.Control 
                      type="number" 
                      step="0.01"
                      value={editingGoal.currentAmount || 0}
                      onChange={e => setEditingGoal({ ...editingGoal, currentAmount: e.target.value })}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="g-2 mb-3">
                <Col xs={6}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Planned Monthly (₹)</Form.Label>
                    <Form.Control 
                      type="number" 
                      step="0.01" 
                      value={editingGoal.monthlyContribution || ''}
                      onChange={e => setEditingGoal({ ...editingGoal, monthlyContribution: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col xs={6}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Status</Form.Label>
                    <Form.Select 
                      value={editingGoal.status || 'ACTIVE'}
                      onChange={e => setEditingGoal({ ...editingGoal, status: e.target.value })}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="PAUSED">Paused</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">Target Date</Form.Label>
                <Form.Control 
                  type="date" 
                  value={editingGoal.targetDate || ''}
                  onChange={e => setEditingGoal({ ...editingGoal, targetDate: e.target.value })}
                />
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label className="small fw-semibold">Notes</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={2} 
                  placeholder="Notes or milestone targets"
                  value={editingGoal.notes || ''}
                  onChange={e => setEditingGoal({ ...editingGoal, notes: e.target.value })}
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer className="py-2">
              <Button variant="outline-secondary" size="sm" onClick={() => setEditingGoal(null)}>Cancel</Button>
              <Button variant="primary" size="sm" type="submit">Save Changes</Button>
            </Modal.Footer>
          </Form>
        </Modal>
      )}

      {/* Delete Goal Confirmation Modal */}
      {deletingGoal && (
        <Modal show={true} onHide={() => setDeletingGoal(null)} centered>
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 fw-bold text-danger">Delete Savings Goal</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p className="mb-2">
              Are you sure you want to remove <strong>{deletingGoal.name}</strong>?
            </p>
            <div className="p-2.5 rounded bg-dark border border-secondary border-opacity-25 small text-secondary">
              <div>Target: <strong className="text-white">{formatCurrency(deletingGoal.targetAmount)}</strong></div>
              <div>Current Saved: <strong className="text-white">{formatCurrency(deletingGoal.currentAmount || 0)}</strong></div>
            </div>
            <div className="text-danger small mt-2">
              This will permanently delete this savings goal and all associated contributions.
            </div>
          </Modal.Body>
          <Modal.Footer className="py-2">
            <Button variant="outline-secondary" size="sm" onClick={() => setDeletingGoal(null)}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={handleDeleteGoal}>Yes, Delete</Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
}
