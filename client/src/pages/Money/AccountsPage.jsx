import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Button, Badge, Modal, Form, Spinner, Alert } from 'react-bootstrap';
import { settingsService } from '../../services/settingsService';
import { formatCurrency } from '../../utils/formatCurrency';
import { useToast } from '../../context/ToastContext';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    type: 'BANK',
    initialBalance: '',
    notes: ''
  });

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await settingsService.getAccounts();
      setAccounts(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await settingsService.addAccount({
        ...formData,
        initialBalance: parseFloat(formData.initialBalance) || 0
      });
      showToast('Account added successfully!', 'success');
      setShowAddModal(false);
      setFormData({ name: '', type: 'BANK', initialBalance: '', notes: '' });
      fetchAccounts();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to add account', 'danger');
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.computedBalance ?? acc.balance ?? 0), 0);

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h2 className="mb-0 fw-bold">Accounts & Wallets</h2>
          <span className="text-secondary small">Manage bank accounts, digital UPI wallets, and cash reserves</span>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
          + Add Account
        </Button>
      </div>

      <Row className="mb-4 g-3">
        <Col md={6}>
          <Card className="h-100 p-3">
            <div className="text-secondary small text-uppercase fw-semibold tracking-wider">Total Live Balance Across Accounts</div>
            <h3 className="mb-0 fw-bold text-white tabular-nums mt-2">{formatCurrency(totalBalance)}</h3>
            <div className="text-secondary small mt-1">Computed dynamically: Initial + Incomes - Expenses</div>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="h-100 p-3">
            <div className="text-secondary small text-uppercase fw-semibold tracking-wider">Total Accounts Tracked</div>
            <h3 className="mb-0 fw-bold text-white tabular-nums mt-2">{accounts.length} Accounts</h3>
            <div className="text-secondary small mt-1">Banks, UPI, and Cash Wallets</div>
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
          ) : accounts.length === 0 ? (
            <div className="text-center py-5 text-secondary">
              <p className="mb-2">No accounts tracked yet.</p>
              <Button variant="outline-primary" size="sm" onClick={() => setShowAddModal(true)}>
                + Add your primary bank or wallet
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="table-responsive d-none d-md-block">
                <Table hover className="align-middle mb-0">
                  <thead>
                    <tr className="small text-secondary">
                      <th>Account Name</th>
                      <th>Type</th>
                      <th className="text-end">Initial Seed</th>
                      <th className="text-end pe-4">Computed Live Balance</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map(acc => (
                      <tr key={acc.id}>
                        <td className="fw-semibold text-white">
                          {acc.name}
                        </td>
                        <td>
                          <Badge bg="dark" className="border border-secondary border-opacity-25 text-secondary">{acc.type}</Badge>
                        </td>
                        <td className="text-end text-secondary small tabular-nums">
                          {formatCurrency(acc.initialBalance)}
                        </td>
                        <td className="text-end fw-bold fs-6 text-white tabular-nums pe-4">
                          {formatCurrency(acc.computedBalance ?? acc.balance ?? 0)}
                        </td>
                        <td>
                          {acc.isDefault ? (
                            <Badge bg="success">Default</Badge>
                          ) : (
                            <span className="text-secondary small">Standard</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {/* Mobile Cards View */}
              <div className="d-md-none mobile-cards-container">
                {accounts.map(acc => (
                  <div key={`mob-acc-${acc.id}`} className="mobile-expense-card">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="d-flex align-items-center gap-2 overflow-hidden" style={{ minWidth: 0, flex: 1 }}>
                        <div className="exp-avatar flex-shrink-0" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.35)' }}>
                          🏦
                        </div>
                        <div className="overflow-hidden" style={{ minWidth: 0 }}>
                          <div className="exp-title text-truncate mb-0">{acc.name}</div>
                          <div className="text-secondary small">{acc.type}</div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ms-2">
                        {acc.isDefault ? (
                          <Badge bg="success">Default</Badge>
                        ) : (
                          <Badge bg="dark" className="border border-secondary border-opacity-25 text-secondary">Standard</Badge>
                        )}
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center pt-2 border-top border-secondary border-opacity-25 mt-2">
                      <span className="text-secondary small">Live Balance:</span>
                      <span className="fw-bold fs-6 text-white tabular-nums">
                        {formatCurrency(acc.computedBalance ?? acc.balance ?? 0)}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mt-1">
                      <span className="text-secondary small" style={{ fontSize: '0.75rem' }}>Initial Seed:</span>
                      <span className="text-secondary small tabular-nums" style={{ fontSize: '0.75rem' }}>
                        {formatCurrency(acc.initialBalance)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      {/* Add Account Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold">Add Account</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddSubmit}>
          <Modal.Body>
            <Form.Group className="mb-2">
              <Form.Label className="small fw-semibold">Account / Wallet Name *</Form.Label>
              <Form.Control 
                type="text" 
                required 
                placeholder="e.g. HDFC Salary Account, Paytm, Cash"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </Form.Group>

            <div className="row g-2 mb-2">
              <div className="col-6">
                <Form.Group>
                  <Form.Label className="small fw-semibold">Type</Form.Label>
                  <Form.Select 
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="BANK">Bank Account</option>
                    <option value="UPI">UPI / Digital App</option>
                    <option value="CASH">Cash in Hand</option>
                    <option value="WALLET">Wallet</option>
                    <option value="OTHER">Other</option>
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-6">
                <Form.Group>
                  <Form.Label className="small fw-semibold">Starting Balance (₹)</Form.Label>
                  <Form.Control 
                    type="number" 
                    step="0.01" 
                    placeholder="e.g. 10000"
                    value={formData.initialBalance}
                    onChange={e => setFormData({ ...formData, initialBalance: e.target.value })}
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
            <Button variant="primary" size="sm" type="submit">Save Account</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
