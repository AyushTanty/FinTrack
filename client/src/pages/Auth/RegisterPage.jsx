import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';

export default function RegisterPage() {
  const [data, setData] = useState({ name: '', email: '', password: '', confirmPassword: '', startingBalance: 0 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (data.password !== data.confirmPassword) return setError("Passwords do not match");
    setError('');
    setLoading(true);
    try {
      await authService.register(data);
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center vh-100" style={{ backgroundColor: 'var(--canvas-base)' }}>
      <Card className="p-4 shadow-lg" style={{ maxWidth: '440px', width: '100%', backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-subtle)' }}>
        <div className="text-center mb-3">
          <div className="d-inline-flex align-items-center gap-2 mb-2">
            <span className="brand-dot"></span>
            <span className="fw-bold tracking-tight text-white fs-4">FinTrack</span>
          </div>
          <div className="text-secondary small">Create your private financial ledger</div>
        </div>

        {error && <Alert variant="danger" className="small py-2">{error}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-2">
            <Form.Label className="small fw-semibold text-secondary">Full Name</Form.Label>
            <Form.Control type="text" placeholder="John Doe" required onChange={e => setData({...data, name: e.target.value})} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label className="small fw-semibold text-secondary">Email</Form.Label>
            <Form.Control type="email" placeholder="you@example.com" required onChange={e => setData({...data, email: e.target.value})} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label className="small fw-semibold text-secondary">Password</Form.Label>
            <Form.Control type="password" placeholder="••••••••" required onChange={e => setData({...data, password: e.target.value})} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label className="small fw-semibold text-secondary">Confirm Password</Form.Label>
            <Form.Control type="password" placeholder="••••••••" required onChange={e => setData({...data, confirmPassword: e.target.value})} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-semibold text-secondary">Initial Account Balance (₹)</Form.Label>
            <Form.Control type="number" placeholder="0" onChange={e => setData({...data, startingBalance: e.target.value})} />
          </Form.Group>
          <Button type="submit" variant="primary" className="w-100 mb-3 py-2 fw-medium" disabled={loading}>
            {loading ? 'Creating Account...' : 'Get Started'}
          </Button>
          <div className="text-center small text-secondary">
            Already have an account? <Link to="/login" className="fw-semibold text-white text-decoration-underline ms-1">Sign In</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
}
