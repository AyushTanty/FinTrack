import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Form, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { auditService } from '../../services/auditService';

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [entityFilter, setEntityFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await auditService.getAuditLog({
        entity: entityFilter || undefined,
        page,
        limit: 25
      });
      setLogs(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load audit history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [entityFilter, page]);

  const actionColors = {
    CREATED: 'success',
    UPDATED: 'warning',
    DELETED: 'danger',
    CONVERTED: 'info',
    ROLLED_OVER: 'primary',
    CONTRIBUTION_ADDED: 'dark'
  };

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h2 className="mb-0 fw-bold">Audit History</h2>
          <span className="text-secondary small">Comprehensive audit trail of all financial mutations and data changes</span>
        </div>
      </div>

      {/* Filter */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-3">
          <Row className="g-3 align-items-center">
            <Col xs={12} sm={6} md={4}>
              <Form.Label className="small fw-semibold mb-1 text-secondary">Filter by Entity</Form.Label>
              <Form.Select 
                size="sm"
                value={entityFilter}
                onChange={e => { setEntityFilter(e.target.value); setPage(1); }}
              >
                <option value="">All Financial Entities</option>
                <option value="Expense">Expenses</option>
                <option value="Income">Income</option>
                <option value="Budget">Budgets</option>
                <option value="Subscription">Subscriptions</option>
                <option value="PlannedPurchase">Planned Purchases</option>
                <option value="SavingsGoal">Savings Goals</option>
                <option value="MonthlyPlan">Monthly Plans / Rollovers</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {error && <Alert variant="danger" className="m-3">{error}</Alert>}

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-5 text-secondary">
              No audit logs recorded for this entity.
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="table-responsive d-none d-md-block">
                <Table hover className="align-middle mb-0">
                  <thead>
                    <tr className="small text-secondary">
                      <th>Timestamp</th>
                      <th>Entity</th>
                      <th>Action</th>
                      <th>Record ID</th>
                      <th>Summary Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => {
                      const snap = log.after || log.before || {};
                      return (
                        <tr key={log.id}>
                          <td className="small text-secondary" style={{ whiteSpace: 'nowrap' }}>
                            {new Date(log.createdAt).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td>
                            <Badge bg="dark" className="border border-secondary border-opacity-25 text-secondary">
                              {log.entity}
                            </Badge>
                          </td>
                          <td>
                            <Badge bg={actionColors[log.action] || 'secondary'}>
                              {log.action}
                            </Badge>
                          </td>
                          <td className="small font-monospace text-secondary">
                            {log.entityId?.slice(0, 10)}...
                          </td>
                          <td className="small text-secondary" style={{ maxWidth: '350px' }}>
                            {snap.description || snap.name || snap.source || JSON.stringify(snap).slice(0, 80)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="d-md-none mobile-cards-container">
                {logs.map(log => {
                  const snap = log.after || log.before || {};
                  return (
                    <div key={`mob-audit-${log.id}`} className="mobile-expense-card">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <Badge bg="dark" className="border border-secondary border-opacity-25 text-secondary">
                            {log.entity}
                          </Badge>
                          <Badge bg={actionColors[log.action] || 'secondary'}>
                            {log.action}
                          </Badge>
                        </div>
                        <span className="text-secondary small" style={{ fontSize: '0.72rem' }}>
                          {new Date(log.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>

                      <div className="exp-notes mt-1 mb-1">
                        {snap.description || snap.name || snap.source || JSON.stringify(snap).slice(0, 100)}
                      </div>

                      <div className="text-secondary small font-monospace" style={{ fontSize: '0.7rem' }}>
                        ID: {log.entityId?.slice(0, 14)}...
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}
