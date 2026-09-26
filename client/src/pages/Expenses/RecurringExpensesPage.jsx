import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Modal, Form, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { Plus } from 'lucide-react';
import { recurringExpenseService } from '../../services/recurringExpenseService';
import { categoryService } from '../../services/categoryService';
import { formatCurrency } from '../../utils/formatCurrency';
import { useToast } from '../../context/ToastContext';

export default function RecurringExpensesPage() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    amount: '',
    frequency: 'MONTHLY',
    dayOfMonth: 5,
    monthOfYear: 1,
    startDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resItems, resCats] = await Promise.all([
        recurringExpenseService.list(),
        categoryService.getCategories()
      ]);
      setItems(resItems.data?.data || []);
      const cats = resCats.data?.data || [];
      setCategories(cats);
      if (cats.length > 0 && !formData.categoryId) {
        setFormData(prev => ({ ...prev, categoryId: cats[0].id }));
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load recurring expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await recurringExpenseService.add({
        ...formData,
        amount: parseFloat(formData.amount),
        dayOfMonth: parseInt(formData.dayOfMonth) || 1,
        monthOfYear: formData.frequency === 'YEARLY' ? parseInt(formData.monthOfYear) : undefined
      });
      showToast('Recurring expense added successfully!', 'success');
      setShowAddModal(false);
      setFormData({
        name: '',
        categoryId: categories[0]?.id || '',
        amount: '',
        frequency: 'MONTHLY',
        dayOfMonth: 5,
        monthOfYear: 1,
        startDate: new Date().toISOString().split('T')[0],
        notes: ''
      });
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to add recurring expense', 'danger');
    }
  };

  const handleToggleActive = async (item) => {
    try {
      if (item.isActive) {
        await recurringExpenseService.deactivate(item.id);
        showToast(`Deactivated ${item.name}`, 'info');
      } else {
        await recurringExpenseService.update(item.id, { isActive: true });
        showToast(`Activated ${item.name}`, 'success');
      }
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update status', 'danger');
    }
  };

  const totalMonthlyCommitment = items
    .filter(i => i.isActive)
    .reduce((sum, i) => {
      const amt = Number(i.amount);
      if (i.frequency === 'MONTHLY') return sum + amt;
      if (i.frequency === 'QUARTERLY') return sum + (amt / 3);
      if (i.frequency === 'YEARLY') return sum + (amt / 12);
      return sum + amt;
    }, 0);

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 mb-md-4 gap-2">
        <div>
          <h2 className="mb-0 fw-bold fs-4 fs-md-2">Fixed & Recurring Bills</h2>
          <span className="text-secondary small d-none d-sm-inline">Automatic commitments: Rent, Internet, Regular Bills</span>
        </div>
        <Button 
          variant="primary" 
          size="sm" 
          className="d-flex align-items-center gap-1.5 px-3 py-1.5 fw-semibold"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Add Recurring Bill</span>
        </Button>
      </div>

      <Row className="mb-3 mb-md-4 g-2 g-md-3">
        <Col xs={6} md={4}>
          <Card className="h-100 p-2.5 p-sm-3">
            <div className="text-secondary small text-uppercase fw-semibold tracking-wider" style={{ fontSize: '0.7rem' }}>Total Active Bills</div>
            <h3 className="mb-0 fw-bold text-white tabular-nums mt-1 fs-5 fs-md-4">{items.filter(i => i.isActive).length}</h3>
          </Card>
        </Col>
        <Col xs={6} md={8}>
          <Card className="h-100 p-2.5 p-sm-3">
            <div className="text-secondary small text-uppercase fw-semibold tracking-wider" style={{ fontSize: '0.7rem' }}>Est. Monthly Committed</div>
            <h3 className="mb-0 fw-bold text-white tabular-nums mt-1 fs-5 fs-md-4">{formatCurrency(totalMonthlyCommitment)}</h3>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {error && <Alert variant="danger" className="m-3">{error}</Alert>}

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-5 text-secondary">
              <p className="mb-2">No recurring expenses set up yet.</p>
              <Button variant="outline-primary" size="sm" onClick={() => setShowAddModal(true)}>
                + Add your first fixed bill (e.g. Rent, Internet)
              </Button>
            </div>
          ) : (
            <>
              {/* 1. Desktop Multi-Column Table (Hidden on Mobile) */}
              <div className="table-responsive d-none d-md-block">
                <Table hover className="align-middle mb-0">
                  <thead>
                    <tr className="small text-secondary">
                      <th>Bill Name</th>
                      <th>Category</th>
                      <th>Frequency</th>
                      <th>Due Day</th>
                      <th className="text-end">Amount</th>
                      <th>Status</th>
                      <th className="text-end pe-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.id} className={!item.isActive ? 'opacity-50' : ''}>
                        <td className="fw-semibold text-white">{item.name}</td>
                        <td>
                          <Badge bg="dark" className="border border-secondary border-opacity-25 text-secondary">{item.category?.name || 'Fixed Bill'}</Badge>
                        </td>
                        <td>
                          <span className="badge bg-dark text-secondary border border-secondary border-opacity-25">{item.frequency}</span>
                        </td>
                        <td className="small text-secondary">
                          {item.dayOfMonth}th of month
                          {item.frequency === 'YEARLY' && item.monthOfYear && ` (Month ${item.monthOfYear})`}
                        </td>
                        <td className="text-end fw-bold text-danger tabular-nums">
                          {formatCurrency(item.amount)}
                        </td>
                        <td>
                          <Badge bg={item.isActive ? 'success' : 'secondary'}>
                            {item.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="text-end pe-3">
                          <Button 
                            variant={item.isActive ? 'outline-danger' : 'outline-success'}
                            size="sm"
                            className="py-0 px-2 small"
                            onClick={() => handleToggleActive(item)}
                          >
                            {item.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {/* 2. Mobile Native Cards (Strictly Zero Horizontal Scroll, Non-overlapping Spacing) */}
              <div className="d-md-none mobile-cards-container">
                {items.map(item => (
                  <div
                    key={`mob-rec-${item.id}`}
                    className={`mobile-expense-card ${!item.isActive ? 'opacity-60' : ''}`}
                  >
                    {/* Top Header Row: Icon + Name + Amount */}
                    <div className="d-flex align-items-start justify-content-between mb-2" style={{ gap: '12px' }}>
                      <div className="d-flex align-items-start overflow-hidden" style={{ minWidth: 0, flex: 1, gap: '10px' }}>
                        <div
                          className="exp-avatar flex-shrink-0"
                          style={{
                            backgroundColor: 'rgba(99, 102, 241, 0.15)',
                            border: '1px solid rgba(99, 102, 241, 0.35)',
                          }}
                        >
                          {item.category?.icon || '⚡'}
                        </div>
                        <div className="overflow-hidden" style={{ minWidth: 0, flex: 1 }}>
                          <div className="exp-title text-truncate" title={item.name}>
                            {item.name}
                          </div>
                          <div className="text-secondary small" style={{ fontSize: '0.78rem', lineHeight: 1.3 }}>
                            Due {item.dayOfMonth}th of month{item.frequency === 'YEARLY' && item.monthOfYear && ` (Month ${item.monthOfYear})`}
                          </div>
                        </div>
                      </div>

                      <div className="text-end flex-shrink-0 ps-1">
                        <div className="exp-amount tabular-nums text-danger">
                          {formatCurrency(item.amount)}
                        </div>
                      </div>
                    </div>

                    {/* Middle Meta Row */}
                    <div className="exp-meta-row">
                      <span 
                        className="badge rounded-pill bg-dark text-secondary border border-secondary border-opacity-30 fw-normal"
                        style={{ fontSize: '0.72rem', padding: '4px 9px', lineHeight: 1.25 }}
                      >
                        {item.category?.name || 'Fixed Bill'}
                      </span>
                      <span 
                        className="badge rounded-pill bg-dark text-secondary border border-secondary border-opacity-30 fw-normal"
                        style={{ fontSize: '0.72rem', padding: '4px 9px', lineHeight: 1.25 }}
                      >
                        {item.frequency}
                      </span>
                    </div>

                    {/* Bottom Actions Row */}
                    <div className="exp-actions justify-content-between">
                      <Badge bg={item.isActive ? 'success' : 'secondary'} className="small fw-normal px-2.5 py-1">
                        {item.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button 
                        variant={item.isActive ? 'outline-danger' : 'outline-success'}
                        size="sm"
                        className="py-1 px-3 small d-inline-flex align-items-center"
                        style={{ fontSize: '0.78rem', fontWeight: 500 }}
                        onClick={() => handleToggleActive(item)}
                      >
                        {item.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      {/* Add Recurring Bill Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold">Add Recurring Bill</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddSubmit}>
          <Modal.Body>
            <Form.Group className="mb-2">
              <Form.Label className="small fw-semibold">Bill Name *</Form.Label>
              <Form.Control 
                type="text" 
                required 
                placeholder="e.g. Apartment Rent, Wifi Broadband"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
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
                    placeholder="e.g. 15000"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  />
                </Form.Group>
              </div>
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
            </div>

            <div className="row g-2 mb-2">
              <div className="col-6">
                <Form.Group>
                  <Form.Label className="small fw-semibold">Frequency</Form.Label>
                  <Form.Select 
                    value={formData.frequency}
                    onChange={e => setFormData({ ...formData, frequency: e.target.value })}
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="YEARLY">Yearly</option>
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-6">
                <Form.Group>
                  <Form.Label className="small fw-semibold">Day of Month</Form.Label>
                  <Form.Control 
                    type="number" 
                    min="1" 
                    max="31" 
                    value={formData.dayOfMonth}
                    onChange={e => setFormData({ ...formData, dayOfMonth: e.target.value })}
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
            <Button variant="primary" size="sm" type="submit">Save Bill</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
