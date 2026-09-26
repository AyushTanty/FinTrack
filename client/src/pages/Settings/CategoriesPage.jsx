import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Modal, Form, Spinner, Alert } from 'react-bootstrap';
import { categoryService } from '../../services/categoryService';
import { useToast } from '../../context/ToastContext';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    type: 'VARIABLE',
    icon: '🏷️',
    color: '#6366f1'
  });

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await categoryService.getCategories();
      setCategories(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await categoryService.addCategory(formData);
      showToast('Category created successfully!', 'success');
      setShowAddModal(false);
      setFormData({ name: '', type: 'VARIABLE', icon: '🏷️', color: '#6366f1' });
      fetchCategories();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create category', 'danger');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingCategory) return;
    try {
      await categoryService.updateCategory(editingCategory.id, {
        name: editingCategory.name,
        type: editingCategory.type,
        icon: editingCategory.icon,
        color: editingCategory.color
      });
      showToast('Category updated!', 'success');
      setEditingCategory(null);
      fetchCategories();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update category', 'danger');
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    setDeleteError(null);
    try {
      await categoryService.deleteCategory(deletingCategory.id);
      showToast('Category deleted successfully', 'success');
      setDeletingCategory(null);
      fetchCategories();
    } catch (err) {
      const resp = err.response?.data;
      if (resp?.details) {
        const d = resp.details;
        setDeleteError(`Cannot delete "${deletingCategory.name}": currently referenced by ${d.expenses || 0} expenses, ${d.recurrings || 0} recurring bills, ${d.budgets || 0} budgets, and ${d.planned || 0} planned purchases. Please reassign or delete these first.`);
      } else {
        setDeleteError(resp?.error || 'Cannot delete category: it is currently referenced by expenses or budgets.');
      }
    }
  };

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h2 className="mb-0 fw-bold">Expense Categories</h2>
          <span className="text-secondary small">Categories for Fixed bills, Variable expenses, and Discretionary shopping</span>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
          + Add Category
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {error && <Alert variant="danger" className="m-3">{error}</Alert>}

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="table-responsive d-none d-md-block">
                <Table hover className="align-middle mb-0">
                  <thead>
                    <tr className="small text-secondary">
                      <th>Icon</th>
                      <th>Category Name</th>
                      <th>Cost of Living Type</th>
                      <th>Color</th>
                      <th className="text-end pe-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map(cat => (
                      <tr key={cat.id}>
                        <td className="fs-5">{cat.icon || '🏷️'}</td>
                        <td className="fw-semibold text-white">{cat.name}</td>
                        <td>
                          <Badge 
                            bg="dark"
                            className="border border-secondary border-opacity-25 text-secondary"
                          >
                            {cat.type}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <span 
                              className="rounded-circle d-inline-block border border-secondary" 
                              style={{ width: '16px', height: '16px', backgroundColor: cat.color || '#6366f1' }}
                            />
                            <span className="small text-secondary font-monospace">{cat.color}</span>
                          </div>
                        </td>
                        <td className="text-end pe-3">
                          <Button 
                            variant="outline-secondary" 
                            size="sm" 
                            className="me-1 py-0 px-2 small" 
                            onClick={() => setEditingCategory(cat)}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm" 
                            className="py-0 px-2 small" 
                            onClick={() => { setDeletingCategory(cat); setDeleteError(null); }}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {/* Mobile Cards View */}
              <div className="d-md-none mobile-cards-container">
                {categories.map(cat => (
                  <div key={`mob-cat-${cat.id}`} className="mobile-expense-card">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="d-flex align-items-center gap-2 overflow-hidden" style={{ minWidth: 0, flex: 1 }}>
                        <div 
                          className="exp-avatar flex-shrink-0"
                          style={{
                            backgroundColor: `${cat.color || '#6366f1'}20`,
                            border: `1px solid ${cat.color || '#6366f1'}40`
                          }}
                        >
                          {cat.icon || '🏷️'}
                        </div>
                        <div className="overflow-hidden" style={{ minWidth: 0 }}>
                          <div className="exp-title text-truncate mb-0">{cat.name}</div>
                          <Badge 
                            bg="dark"
                            className="border border-secondary border-opacity-25 text-secondary mt-1"
                            style={{ fontSize: '0.72rem' }}
                          >
                            {cat.type}
                          </Badge>
                        </div>
                      </div>

                      <div className="exp-actions border-top-0 pt-0 mt-0">
                        <Button 
                          variant="outline-secondary" 
                          size="sm" 
                          className="py-1 px-2.5 small me-1" 
                          onClick={() => setEditingCategory(cat)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm" 
                          className="py-1 px-2.5 small" 
                          onClick={() => { setDeletingCategory(cat); setDeleteError(null); }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      {/* Add Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold">Add Category</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddSubmit}>
          <Modal.Body>
            <Form.Group className="mb-2">
              <Form.Label className="small fw-semibold">Category Name *</Form.Label>
              <Form.Control 
                type="text" 
                required 
                placeholder="e.g. Groceries, Gym, OTT"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </Form.Group>

            <div className="row g-2 mb-2">
              <div className="col-8">
                <Form.Group>
                  <Form.Label className="small fw-semibold">Cost of Living Type</Form.Label>
                  <Form.Select 
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="VARIABLE">Variable (Food, Transport, Daily)</option>
                    <option value="FIXED">Fixed (Rent, Internet, Fixed Bills)</option>
                    <option value="DISCRETIONARY">Discretionary (Shopping, Entertainment)</option>
                    <option value="SAVINGS">Savings</option>
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-4">
                <Form.Group>
                  <Form.Label className="small fw-semibold">Emoji Tag</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={formData.icon}
                    onChange={e => setFormData({ ...formData, icon: e.target.value })}
                  />
                </Form.Group>
              </div>
            </div>

            <Form.Group className="mb-2">
              <Form.Label className="small fw-semibold">Color</Form.Label>
              <Form.Control 
                type="color" 
                value={formData.color}
                onChange={e => setFormData({ ...formData, color: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="py-2">
            <Button variant="outline-secondary" size="sm" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit">Save Category</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit Modal */}
      {editingCategory && (
        <Modal show={true} onHide={() => setEditingCategory(null)} centered>
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 fw-bold">Edit Category: {editingCategory.name}</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleEditSubmit}>
            <Modal.Body>
              <Form.Group className="mb-2">
                <Form.Label className="small fw-semibold">Category Name *</Form.Label>
                <Form.Control 
                  type="text" 
                  required 
                  value={editingCategory.name}
                  onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                />
              </Form.Group>

              <div className="row g-2 mb-2">
                <div className="col-8">
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Cost of Living Type</Form.Label>
                    <Form.Select 
                      value={editingCategory.type}
                      onChange={e => setEditingCategory({ ...editingCategory, type: e.target.value })}
                    >
                      <option value="VARIABLE">Variable</option>
                      <option value="FIXED">Fixed</option>
                      <option value="DISCRETIONARY">Discretionary</option>
                      <option value="SAVINGS">Savings</option>
                    </Form.Select>
                  </Form.Group>
                </div>
                <div className="col-4">
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Emoji Tag</Form.Label>
                    <Form.Control 
                      type="text" 
                      value={editingCategory.icon || '🏷️'}
                      onChange={e => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                    />
                  </Form.Group>
                </div>
              </div>

              <Form.Group className="mb-2">
                <Form.Label className="small fw-semibold">Color</Form.Label>
                <Form.Control 
                  type="color" 
                  value={editingCategory.color || '#6366f1'}
                  onChange={e => setEditingCategory({ ...editingCategory, color: e.target.value })}
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer className="py-2">
              <Button variant="outline-secondary" size="sm" onClick={() => setEditingCategory(null)}>Cancel</Button>
              <Button variant="primary" size="sm" type="submit">Save Changes</Button>
            </Modal.Footer>
          </Form>
        </Modal>
      )}

      {/* Delete Confirmation Modal with 409 In-Use Protection */}
      {deletingCategory && (
        <Modal show={true} onHide={() => { setDeletingCategory(null); setDeleteError(null); }} centered>
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 fw-bold text-danger">Delete Category</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {deleteError && (
              <Alert variant="danger" className="small py-2 mb-3">
                {deleteError}
              </Alert>
            )}
            Are you sure you want to delete category: <strong>{deletingCategory.icon} {deletingCategory.name}</strong>?
            <div className="text-secondary small mt-2">
              Note: Categories currently referenced by existing expenses, recurring bills, or budgets cannot be deleted until those references are removed or reassigned.
            </div>
          </Modal.Body>
          <Modal.Footer className="py-2">
            <Button variant="outline-secondary" size="sm" onClick={() => { setDeletingCategory(null); setDeleteError(null); }}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>Confirm Delete</Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
}
