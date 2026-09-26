import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center vh-100" style={{ backgroundColor: 'var(--canvas-base)' }}>
      <Card className="p-4 shadow-lg" style={{ maxWidth: '420px', width: '100%', backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-subtle)' }}>
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center gap-2 mb-2">
            <span className="brand-dot"></span>
            <span className="fw-bold tracking-tight text-white fs-4">FinTrack</span>
          </div>
          <div className="text-secondary small">Quiet Fiscal Clarity • Personal Budget Command Center</div>
        </div>
        
        {error && <Alert variant="danger" className="small py-2">{error}</Alert>}
        
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-semibold text-secondary">Email Address</Form.Label>
            <Form.Control 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              placeholder="you@example.com"
              autoFocus
            />
          </Form.Group>
          <Form.Group className="mb-4">
            <Form.Label className="small fw-semibold text-secondary">Password</Form.Label>
            <Form.Control 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              placeholder="••••••••"
            />
          </Form.Group>
          <Button type="submit" variant="primary" className="w-100 py-2 mb-3 fw-medium" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </Button>
          <div className="text-center small text-secondary">
            Don't have an account? <Link to="/register" className="fw-semibold text-white text-decoration-underline ms-1">Create Account</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
}
