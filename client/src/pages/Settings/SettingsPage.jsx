import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { settingsService } from '../../services/settingsService';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState(null);

  const [profileForm, setProfileForm] = useState({
    name: '',
    currency: 'INR',
    defaultEmergencyBuffer: '0'
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    settingsService.getSettings()
      .then(res => {
        const s = res.data?.data || {};
        setProfileForm({
          name: s.name || '',
          currency: s.currency || 'INR',
          defaultEmergencyBuffer: s.defaultEmergencyBuffer || '0'
        });
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await settingsService.updateSettings({
        name: profileForm.name,
        currency: profileForm.currency,
        defaultEmergencyBuffer: parseFloat(profileForm.defaultEmergencyBuffer) || 0
      });
      showToast('Profile and settings updated!', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update settings', 'danger');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('New passwords do not match', 'danger');
      return;
    }
    setSavingPassword(true);
    try {
      await authService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      showToast('Password changed successfully!', 'success');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to change password', 'danger');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>;
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="mb-0 fw-bold">Settings & Configuration</h2>
        <span className="text-secondary small">Profile, baseline emergency buffer, categories, and account security</span>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="g-4">
        <Col md={8}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header>
              <div className="fw-semibold text-white">Profile & Financial Defaults</div>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleProfileSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold">Email Address (Read-only)</Form.Label>
                  <Form.Control type="email" value={user?.email || ''} disabled className="bg-dark text-secondary border-secondary border-opacity-25" />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold">Your Name</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={profileForm.name}
                    onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                  />
                </Form.Group>

                <Row className="g-2 mb-3">
                  <Col md={6}>
                    <Form.Group>
                  <Form.Label className="small fw-semibold">Currency</Form.Label>
                  <Form.Select 
                    value={profileForm.currency}
                    onChange={e => setProfileForm({ ...profileForm, currency: e.target.value })}
                  >
                    <option value="INR">₹ INR (Indian Rupee)</option>
                  </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                  <Form.Label className="small fw-semibold">Default Emergency Buffer (₹)</Form.Label>
                  <Form.Control 
                    type="number" 
                    step="0.01"
                    value={profileForm.defaultEmergencyBuffer}
                    onChange={e => setProfileForm({ ...profileForm, defaultEmergencyBuffer: e.target.value })}
                  />
                  <Form.Text className="text-secondary small">
                    Baseline seed for new monthly plans.
                  </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Button type="submit" variant="primary" size="sm" disabled={savingProfile}>
                  {savingProfile ? <Spinner size="sm" animation="border" /> : 'Save Profile Settings'}
                </Button>
              </Form>
            </Card.Body>
          </Card>

          {/* Change Password */}
          <Card className="border-0 shadow-sm">
            <Card.Header>
              <div className="fw-semibold text-white">Security & Password</div>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handlePasswordSubmit}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Current Password</Form.Label>
                  <Form.Control 
                    type="password" 
                    required
                    value={passwordForm.currentPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  />
                </Form.Group>

                <Row className="g-2 mb-3">
                  <Col md={6}>
                    <Form.Group>
                  <Form.Label className="small fw-semibold">New Password</Form.Label>
                  <Form.Control 
                    type="password" 
                    required
                    value={passwordForm.newPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                  <Form.Label className="small fw-semibold">Confirm New Password</Form.Label>
                  <Form.Control 
                    type="password" 
                    required
                    value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  />
                    </Form.Group>
                  </Col>
                </Row>

                <Button type="submit" variant="outline-danger" size="sm" disabled={savingPassword}>
                  {savingPassword ? <Spinner size="sm" animation="border" /> : 'Update Password'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Quick Links Column */}
        <Col md={4}>
          <Card className="border-0 shadow-sm mb-3">
            <Card.Body>
              <h6 className="fw-bold mb-2 text-white">Category Management</h6>
              <p className="text-secondary small mb-3">
                Customize your spending categories and cost-of-living classifications.
              </p>
              <Button as={Link} to="/settings/categories" variant="outline-primary" size="sm" className="w-100">
                Manage Categories
              </Button>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm mb-3">
            <Card.Body>
              <h6 className="fw-bold mb-2 text-white">Bank & Wallet Accounts</h6>
              <p className="text-secondary small mb-3">
                Configure bank accounts, cash in hand, and digital UPI wallets.
              </p>
              <Button as={Link} to="/settings/accounts" variant="outline-secondary" size="sm" className="w-100">
                Manage Accounts
              </Button>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h6 className="fw-bold mb-1 text-white">Timezone & Precision</h6>
              <p className="small text-secondary mb-0">
                Calculations follow <strong>Asia/Kolkata</strong> day boundaries and PostgreSQL <code>NUMERIC(15,2)</code> precision.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
