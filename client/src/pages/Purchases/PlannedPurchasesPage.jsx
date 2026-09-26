import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Modal, Form, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { Trash2, Plus } from 'lucide-react';
import { plannedPurchaseService } from '../../services/plannedPurchaseService';
import { categoryService } from '../../services/categoryService';
import { formatCurrency } from '../../utils/formatCurrency';
import { useToast } from '../../context/ToastContext';

export default function PlannedPurchasesPage() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);

  // Simulator state
  const [simAmount, setSimAmount] = useState('');
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [convertingItem, setConvertingItem] = useState(null);
  const [convertForm, setConvertForm] = useState({ paymentMethod: 'UPI', date: new Date().toISOString().split('T')[0] });

  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    expectedAmount: '',
    categoryId: '',
    expectedDate: new Date().toISOString().split('T')[0],
    priority: 'MEDIUM',
    notes: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resItems, resCats] = await Promise.all([
        plannedPurchaseService.list(),
        categoryService.getCategories()
      ]);
      setItems(resItems.data?.data || []);
      const cats = resCats.data?.data || [];
      setCategories(cats);
      if (cats.length > 0 && !formData.categoryId) {
        setFormData(prev => ({ ...prev, categoryId: cats[0].id }));
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load planned purchases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSimulate = async (e) => {
    e.preventDefault();
    if (!simAmount || isNaN(simAmount) || parseFloat(simAmount) <= 0) return;
    setSimLoading(true);
    try {
      const res = await plannedPurchaseService.simulate(parseFloat(simAmount));
      setSimResult(res.data?.data);
    } catch (err) {
      showToast('Simulation failed', 'danger');
    } finally {
      setSimLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await plannedPurchaseService.addPurchase({
        ...formData,
        expectedAmount: parseFloat(formData.expectedAmount)
      });
      showToast('Planned purchase saved!', 'success');
      setShowAddModal(false);
      setFormData({
        name: '',
        expectedAmount: '',
        categoryId: categories[0]?.id || '',
        expectedDate: new Date().toISOString().split('T')[0],
        priority: 'MEDIUM',
        notes: ''
      });
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save', 'danger');
    }
  };

  const handleConvertSubmit = async (e) => {
    e.preventDefault();
    if (!convertingItem) return;
    try {
      await plannedPurchaseService.convert(convertingItem.id, convertForm);
      showToast(`Converted "${convertingItem.name}" to Expense!`, 'success');
      setConvertingItem(null);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to convert', 'danger');
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      await plannedPurchaseService.deletePurchase(deletingItem.id);
      showToast(`Deleted planned purchase "${deletingItem.name}"`, 'success');
      setDeletingItem(null);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete purchase', 'danger');
    }
  };

  const priorityColors = {
    HIGH: 'danger',
    MEDIUM: 'warning',
    LOW: 'success'
  };

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h2 className="mb-0 fw-bold">Planned Purchases</h2>
          <span className="text-secondary small">Forecast future purchases and simulate their financial impact</span>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
          Add Planned Purchase
        </Button>
      </div>

      {/* Purchase Impact Simulator */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-3">
          <div className="fw-semibold text-white mb-1">Purchase Impact Simulator</div>
          <p className="text-secondary small mb-3">
            Enter a potential purchase to see how it affects your <strong>True Available Money</strong> and <strong>Safe Daily Budget</strong> before you buy.
          </p>

          <Form onSubmit={handleSimulate} className="row g-2 align-items-center mb-3">
            <Col xs={12} sm={6} md={4}>
              <Form.Control 
                type="number" 
                step="0.01" 
                placeholder="Enter amount (e.g. 2000)" 
                value={simAmount}
                onChange={e => setSimAmount(e.target.value)}
                required
              />
            </Col>
            <Col xs={12} sm={6} md={3}>
              <Button type="submit" variant="outline-primary" className="w-100" disabled={simLoading}>
                {simLoading ? <Spinner size="sm" animation="border" /> : 'Simulate Impact'}
              </Button>
            </Col>
          </Form>

          {simResult && (
            <div className="p-3 rounded border border-secondary border-opacity-25" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }}>
              <Row className="g-3 text-center">
                <Col md={4} className="border-end border-secondary border-opacity-25">
                  <div className="text-secondary small">Before Purchase</div>
                  <div className="fw-bold mt-1 text-white tabular-nums">Flexible: {formatCurrency(simResult.before?.flexibleMoney || 0)}</div>
                  <div className="text-success small tabular-nums">Daily: {formatCurrency(simResult.before?.dailyBudget || 0)}/day</div>
                </Col>
                <Col md={4} className="border-end border-secondary border-opacity-25">
                  <div className="text-secondary small">After Purchase</div>
                  <div className="fw-bold mt-1 text-primary tabular-nums">Flexible: {formatCurrency(simResult.after?.flexibleMoney || 0)}</div>
                  <div className="text-warning small fw-bold tabular-nums">Daily: {formatCurrency(simResult.after?.dailyBudget || 0)}/day</div>
                </Col>
                <Col md={4}>
                  <div className="text-secondary small">Difference</div>
                  <div className="fw-bold text-danger mt-1 tabular-nums">Flexible: -{formatCurrency(simResult.simulatedAmount)}</div>
                  <div className="text-danger small tabular-nums">Daily: -{formatCurrency(simResult.difference?.dailyBudget || 0)}/day</div>
                </Col>
              </Row>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {error && <Alert variant="danger" className="m-3">{error}</Alert>}

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-5 text-secondary">
              <p className="mb-2">No planned purchases found.</p>
              <Button variant="outline-primary" size="sm" onClick={() => setShowAddModal(true)}>
                Add Planned Purchase
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="table-responsive d-none d-md-block">
                <Table hover className="align-middle mb-0">
                  <thead>
                    <tr className="small text-secondary">
                      <th>Item</th>
                      <th>Category</th>
                      <th>Priority</th>
                      <th>Target Date</th>
                      <th className="text-end">Expected Amount</th>
                      <th>Status</th>
                      <th className="text-end pe-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.id}>
                        <td className="fw-semibold text-white">{item.name}</td>
                        <td>
                          <Badge bg="dark" className="border border-secondary border-opacity-25 text-secondary">{item.category?.name || 'Item'}</Badge>
                        </td>
                        <td>
                          <Badge bg={priorityColors[item.priority] || 'secondary'}>{item.priority}</Badge>
                        </td>
                        <td className="small text-secondary">
                          {item.expectedDate ? new Date(item.expectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                        </td>
                        <td className="text-end fw-bold text-white tabular-nums">
                          {formatCurrency(item.expectedAmount)}
                        </td>
                        <td>
                          <Badge bg={item.status === 'PURCHASED' ? 'success' : item.status === 'PLANNED' ? 'dark' : 'secondary'} className="border border-secondary border-opacity-25">
                            {item.status}
                          </Badge>
                        </td>
                        <td className="text-end pe-3">
                          {item.status === 'PLANNED' && (
                            <Button 
                              variant="outline-success" 
                              size="sm" 
                              className="py-0 px-2 small me-1"
                              onClick={() => setConvertingItem(item)}
                            >
                              Convert to Expense
                            </Button>
                          )}
                          <Button 
                            variant="outline-danger" 
                            size="sm" 
                            className="py-0 px-2 small"
                            onClick={() => setDeletingItem(item)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {/* Mobile Native Card View (No Horizontal Scroll) */}
              <div className="d-md-none mobile-cards-container">
                {items.map(item => (
                  <div key={`mob-item-${item.id}`} className="mobile-expense-card">
                    <div className="d-flex align-items-start justify-content-between mb-2" style={{ gap: '10px' }}>
                      <div className="overflow-hidden" style={{ minWidth: 0, flex: 1 }}>
                        <div className="exp-title text-truncate" title={item.name}>{item.name}</div>
                        <div className="text-secondary small" style={{ fontSize: '0.78rem' }}>
                          Target: {item.expectedDate ? new Date(item.expectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No date set'}
                        </div>
                      </div>
                      <div className="text-end flex-shrink-0">
                        <div className="exp-amount tabular-nums text-white">
                          {formatCurrency(item.expectedAmount)}
                        </div>
                      </div>
                    </div>

                    <div className="exp-meta-row">
                      <Badge bg="dark" className="border border-secondary border-opacity-25 text-secondary">
                        {item.category?.name || 'Item'}
                      </Badge>
                      <Badge bg={priorityColors[item.priority] || 'secondary'}>
                        {item.priority}
                      </Badge>
                      <Badge bg={item.status === 'PURCHASED' ? 'success' : item.status === 'PLANNED' ? 'dark' : 'secondary'} className="border border-secondary border-opacity-25">
                        {item.status}
                      </Badge>
                    </div>

                    {item.notes && (
                      <div className="exp-notes fst-italic">
                        "{item.notes}"
                      </div>
                    )}

                    <div className="exp-actions">
                      {item.status === 'PLANNED' && (
                        <Button 
                          variant="outline-success" 
                          size="sm" 
                          className="py-1 px-3 d-inline-flex align-items-center gap-1.5"
                          style={{ fontSize: '0.78rem', fontWeight: 500 }}
                          onClick={() => setConvertingItem(item)}
                        >
                          Convert to Expense
                        </Button>
                      )}
                      <Button 
                        variant="outline-danger" 
                        size="sm" 
                        className="py-1 px-3 d-inline-flex align-items-center gap-1.5"
                        style={{ fontSize: '0.78rem', fontWeight: 500 }}
                        onClick={() => setDeletingItem(item)}
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      {/* Convert to Expense Modal */}
      {convertingItem && (
        <Modal show={true} onHide={() => setConvertingItem(null)} centered>
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 fw-bold">Convert to Expense</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleConvertSubmit}>
            <Modal.Body>
              <p className="small text-secondary mb-3">
                You bought <strong>{convertingItem.name}</strong> for <strong className="text-white tabular-nums">{formatCurrency(convertingItem.expectedAmount)}</strong>. 
                This will record it as an active Expense and mark the plan as PURCHASED.
              </p>
              <Form.Group className="mb-2">
                <Form.Label className="small fw-semibold">Payment Method</Form.Label>
                <Form.Select 
                  value={convertForm.paymentMethod}
                  onChange={e => setConvertForm({ ...convertForm, paymentMethod: e.target.value })}
                >
                  <option value="UPI">UPI</option>
                  <option value="CARD">Card</option>
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="OTHER">Other</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label className="small fw-semibold">Purchase Date</Form.Label>
                <Form.Control 
                  type="date" 
                  value={convertForm.date}
                  onChange={e => setConvertForm({ ...convertForm, date: e.target.value })}
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer className="py-2">
              <Button variant="outline-secondary" size="sm" onClick={() => setConvertingItem(null)}>Cancel</Button>
              <Button variant="success" size="sm" type="submit">Confirm Expense</Button>
            </Modal.Footer>
          </Form>
        </Modal>
      )}

      {/* Add Planned Purchase Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold">Add Planned Purchase</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddSubmit}>
          <Modal.Body>
            <Form.Group className="mb-2">
              <Form.Label className="small fw-semibold">Item Name *</Form.Label>
              <Form.Control 
                type="text" 
                required 
                placeholder="e.g. Winter Jacket, Laptop Bag"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </Form.Group>

            <div className="row g-2 mb-2">
              <div className="col-6">
                <Form.Group>
                  <Form.Label className="small fw-semibold">Expected Amount (₹) *</Form.Label>
                  <Form.Control 
                    type="number" 
                    step="0.01" 
                    required 
                    placeholder="e.g. 1500"
                    value={formData.expectedAmount}
                    onChange={e => setFormData({ ...formData, expectedAmount: e.target.value })}
                  />
                </Form.Group>
              </div>
              <div className="col-6">
                <Form.Group>
                  <Form.Label className="small fw-semibold">Priority</Form.Label>
                  <Form.Select 
                    value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="HIGH">High (Essential)</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low (Wishlist)</option>
                  </Form.Select>
                </Form.Group>
              </div>
            </div>

            <div className="row g-2 mb-2">
              <div className="col-6">
                <Form.Group>
                  <Form.Label className="small fw-semibold">Category</Form.Label>
                  <Form.Select 
                    value={formData.categoryId}
                    onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-6">
                <Form.Group>
                  <Form.Label className="small fw-semibold">Target Date</Form.Label>
                  <Form.Control 
                    type="date" 
                    value={formData.expectedDate}
                    onChange={e => setFormData({ ...formData, expectedDate: e.target.value })}
                  />
                </Form.Group>
              </div>
            </div>

            <Form.Group className="mb-2">
              <Form.Label className="small fw-semibold">Notes</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="Optional notes"
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="py-2">
            <Button variant="outline-secondary" size="sm" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit">Save Planned Purchase</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <Modal show={true} onHide={() => setDeletingItem(null)} centered>
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 fw-bold text-danger">Delete Planned Purchase</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Are you sure you want to delete <strong>{deletingItem.name}</strong> ({formatCurrency(deletingItem.expectedAmount)})?
          </Modal.Body>
          <Modal.Footer className="py-2">
            <Button variant="outline-secondary" size="sm" onClick={() => setDeletingItem(null)}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>Delete</Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
}
