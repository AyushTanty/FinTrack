import React, { useState } from 'react';
import { Card, ProgressBar, Button, Form, Alert, Row, Col, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { incomeService } from '../../services/incomeService';
import { recurringExpenseService } from '../../services/recurringExpenseService';
import { subscriptionService } from '../../services/subscriptionService';
import { savingsService } from '../../services/savingsService';
import { settingsService } from '../../services/settingsService';
import { formatCurrency } from '../../utils/formatCurrency';

export default function SetupWizard() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Wizard data
  const [incomeData, setIncomeData] = useState({ amount: '25000', source: 'Monthly Salary' });
  const [fixedExpenses, setFixedExpenses] = useState([
    { name: 'Rent', amount: '8000', dayOfMonth: 5, enabled: true },
    { name: 'Electricity', amount: '800', dayOfMonth: 10, enabled: true },
    { name: 'Internet / Wi-Fi', amount: '700', dayOfMonth: 10, enabled: true },
    { name: 'Mobile Recharge', amount: '350', dayOfMonth: 15, enabled: true }
  ]);
  const [subscription, setSubscription] = useState({ name: 'Netflix', amount: '649', billingCycle: 'MONTHLY', enabled: false });
  const [savingsGoal, setSavingsGoal] = useState({ name: 'Emergency Reserve', targetAmount: '50000', monthlyContribution: '3000', enabled: true });
  const [emergencyBuffer, setEmergencyBuffer] = useState('5000');

  const handleNext = () => setStep(s => Math.min(s + 1, 6));
  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const handleCompleteSetup = async () => {
    setLoading(true);
    try {
      // 1. Record initial monthly income
      if (parseFloat(incomeData.amount) > 0) {
        await incomeService.addIncome({
          source: incomeData.source || 'Salary',
          amount: parseFloat(incomeData.amount),
          type: 'SALARY',
          date: new Date().toISOString().split('T')[0],
          isRecurring: true
        });
      }

      // 2. Add enabled fixed expenses
      for (const fe of fixedExpenses) {
        if (fe.enabled && parseFloat(fe.amount) > 0) {
          await recurringExpenseService.add({
            name: fe.name,
            amount: parseFloat(fe.amount),
            frequency: 'MONTHLY',
            dayOfMonth: parseInt(fe.dayOfMonth) || 5,
            startDate: new Date().toISOString().split('T')[0]
          });
        }
      }

      // 3. Add subscription if enabled
      if (subscription.enabled && parseFloat(subscription.amount) > 0) {
        await subscriptionService.add({
          name: subscription.name,
          amount: parseFloat(subscription.amount),
          type: 'OTT',
          billingCycle: subscription.billingCycle,
          startDate: new Date().toISOString().split('T')[0],
          nextBillingDate: new Date().toISOString().split('T')[0]
        });
      }

      // 4. Create savings goal if enabled
      if (savingsGoal.enabled && parseFloat(savingsGoal.targetAmount) > 0) {
        await savingsService.addGoal({
          name: savingsGoal.name,
          targetAmount: parseFloat(savingsGoal.targetAmount),
          monthlyContribution: parseFloat(savingsGoal.monthlyContribution) || 0
        });
      }

      // 5. Update emergency buffer in settings
      if (parseFloat(emergencyBuffer) > 0) {
        await settingsService.updateSettings({
          defaultEmergencyBuffer: parseFloat(emergencyBuffer)
        });
      }

      showToast('First-time setup completed! Welcome to your dashboard.', 'success');
      navigate('/dashboard');
    } catch (err) {
      showToast(err.response?.data?.error || err.message || 'Error finalizing setup', 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-4" style={{ maxWidth: '620px' }}>
      <div className="text-center mb-4">
        <h3 className="fw-bold text-white">Welcome to myBudget</h3>
        <p className="text-secondary small">Set up your monthly foundation in 5 quick steps.</p>
      </div>

      <ProgressBar now={(step / 6) * 100} className="mb-4" style={{ height: '6px' }} />

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-4">
          {/* STEP 1: Income */}
          {step === 1 && (
            <div>
              <h5 className="fw-bold mb-1 text-white">Step 1: Expected Monthly Income</h5>
              <p className="text-secondary small mb-3">What is your primary monthly take-home income?</p>
              
              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">Monthly Income Amount (₹) *</Form.Label>
                <Form.Control 
                  type="number" 
                  step="0.01" 
                  value={incomeData.amount} 
                  onChange={e => setIncomeData({ ...incomeData, amount: e.target.value })}
                  autoFocus 
                  required
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="small fw-semibold">Income Source</Form.Label>
                <Form.Control 
                  type="text" 
                  value={incomeData.source} 
                  onChange={e => setIncomeData({ ...incomeData, source: e.target.value })}
                />
              </Form.Group>

              <div className="d-flex justify-content-end">
                <Button onClick={handleNext} disabled={!incomeData.amount}>
                  Next: Fixed Bills
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Fixed Expenses */}
          {step === 2 && (
            <div>
              <h5 className="fw-bold mb-1 text-white">Step 2: Fixed Monthly Expenses</h5>
              <p className="text-secondary small mb-3">Check the regular commitments that apply to you and adjust amounts:</p>

              {fixedExpenses.map((fe, idx) => (
                <div key={idx} className="p-2 border border-secondary border-opacity-25 rounded mb-2 d-flex align-items-center justify-content-between" style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)' }}>
                  <Form.Check 
                    type="checkbox"
                    id={`fe-${idx}`}
                    label={fe.name}
                    checked={fe.enabled}
                    onChange={e => {
                      const updated = [...fixedExpenses];
                      updated[idx].enabled = e.target.checked;
                      setFixedExpenses(updated);
                    }}
                    className="fw-semibold small text-white"
                  />
                  {fe.enabled && (
                    <div className="d-flex align-items-center gap-2">
                      <span className="small text-secondary">₹</span>
                      <Form.Control 
                        type="number" 
                        size="sm"
                        style={{ width: '100px' }}
                        value={fe.amount}
                        onChange={e => {
                          const updated = [...fixedExpenses];
                          updated[idx].amount = e.target.value;
                          setFixedExpenses(updated);
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}

              <div className="d-flex justify-content-between mt-4">
                <Button variant="outline-secondary" onClick={handleBack}>Back</Button>
                <Button onClick={handleNext}>Next: Subscriptions</Button>
              </div>
            </div>
          )}

          {/* STEP 3: Subscriptions */}
          {step === 3 && (
            <div>
              <h5 className="fw-bold mb-1 text-white">Step 3: Subscriptions</h5>
              <p className="text-secondary small mb-3">Add any major recurring subscriptions (or skip this step):</p>

              <Form.Check 
                type="checkbox"
                id="subEnable"
                label="I have regular digital subscriptions (Netflix, Spotify, Gym)"
                checked={subscription.enabled}
                onChange={e => setSubscription({ ...subscription, enabled: e.target.checked })}
                className="fw-semibold small mb-3"
              />

              {subscription.enabled && (
                <div className="p-3 border border-secondary border-opacity-25 rounded mb-3" style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)' }}>
                  <Form.Group className="mb-2">
                    <Form.Label className="small fw-semibold">Subscription Name</Form.Label>
                    <Form.Control 
                      type="text" 
                      value={subscription.name}
                      onChange={e => setSubscription({ ...subscription, name: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label className="small fw-semibold">Monthly Cost (₹)</Form.Label>
                    <Form.Control 
                      type="number" 
                      value={subscription.amount}
                      onChange={e => setSubscription({ ...subscription, amount: e.target.value })}
                    />
                  </Form.Group>
                </div>
              )}

              <div className="d-flex justify-content-between mt-4">
                <Button variant="outline-secondary" onClick={handleBack}>Back</Button>
                <Button onClick={handleNext}>Next: Savings Goal</Button>
              </div>
            </div>
          )}

          {/* STEP 4: Savings Goal */}
          {step === 4 && (
            <div>
              <h5 className="fw-bold mb-1 text-white">Step 4: Primary Savings Goal</h5>
              <p className="text-secondary small mb-3">Setting a savings target reserves money before it gets spent flexibly.</p>

              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">Goal Name</Form.Label>
                <Form.Control 
                  type="text" 
                  value={savingsGoal.name}
                  onChange={e => setSavingsGoal({ ...savingsGoal, name: e.target.value })}
                />
              </Form.Group>

              <Row className="g-2 mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Target Amount (₹)</Form.Label>
                    <Form.Control 
                      type="number" 
                      value={savingsGoal.targetAmount}
                      onChange={e => setSavingsGoal({ ...savingsGoal, targetAmount: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Monthly Contribution (₹)</Form.Label>
                    <Form.Control 
                      type="number" 
                      value={savingsGoal.monthlyContribution}
                      onChange={e => setSavingsGoal({ ...savingsGoal, monthlyContribution: e.target.value })}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <div className="d-flex justify-content-between mt-4">
                <Button variant="outline-secondary" onClick={handleBack}>Back</Button>
                <Button onClick={handleNext}>Next: Emergency Buffer</Button>
              </div>
            </div>
          )}

          {/* STEP 5: Emergency Buffer */}
          {step === 5 && (
            <div>
              <h5 className="fw-bold mb-1 text-white">Step 5: Emergency Cushion Buffer</h5>
              <p className="text-secondary small mb-3">
                Money you do <strong>not</strong> want to touch during daily spending. This is subtracted from your flexible money calculation to ensure safety.
              </p>

              <Form.Group className="mb-4">
                <Form.Label className="small fw-semibold">Emergency Buffer (₹)</Form.Label>
                <Form.Control 
                  type="number" 
                  value={emergencyBuffer}
                  onChange={e => setEmergencyBuffer(e.target.value)}
                />
                <Form.Text className="text-secondary small">
                  Recommended: ₹3,000 to ₹10,000 for unexpected minor emergencies.
                </Form.Text>
              </Form.Group>

              <div className="d-flex justify-content-between mt-4">
                <Button variant="outline-secondary" onClick={handleBack}>Back</Button>
                <Button onClick={handleNext}>Review & Finish</Button>
              </div>
            </div>
          )}

          {/* STEP 6: Review & Finish */}
          {step === 6 && (
            <div>
              <div className="text-center mb-3">
                <h5 className="fw-bold text-white">Ready to Launch Your Dashboard</h5>
                <p className="text-secondary small">Summary of your initial budget inputs:</p>
              </div>

              <div className="p-3 rounded small mb-4 border border-secondary border-opacity-25" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }}>
                <div className="d-flex justify-content-between py-1">
                  <span className="text-secondary">Expected Income:</span>
                  <strong className="text-success tabular-nums">{formatCurrency(incomeData.amount)}</strong>
                </div>
                <div className="d-flex justify-content-between py-1">
                  <span className="text-secondary">Fixed Monthly Bills:</span>
                  <strong className="text-danger tabular-nums">
                    {formatCurrency(fixedExpenses.filter(f => f.enabled).reduce((s, f) => s + parseFloat(f.amount || 0), 0))}
                  </strong>
                </div>
                {subscription.enabled && (
                  <div className="d-flex justify-content-between py-1">
                    <span className="text-secondary">Subscriptions:</span>
                    <strong className="text-white tabular-nums">{subscription.name} ({formatCurrency(subscription.amount)})</strong>
                  </div>
                )}
                {savingsGoal.enabled && (
                  <div className="d-flex justify-content-between py-1">
                    <span className="text-secondary">Savings Target:</span>
                    <strong className="text-info tabular-nums">{savingsGoal.name} ({formatCurrency(savingsGoal.monthlyContribution)}/mo)</strong>
                  </div>
                )}
                <div className="d-flex justify-content-between py-1 border-top border-secondary border-opacity-25 mt-1 pt-1">
                  <span className="text-secondary">Emergency Buffer:</span>
                  <strong className="text-white tabular-nums">{formatCurrency(emergencyBuffer)}</strong>
                </div>
              </div>

              <div className="d-flex justify-content-between">
                <Button variant="outline-secondary" onClick={handleBack} disabled={loading}>
                  Back
                </Button>
                <Button variant="primary" onClick={handleCompleteSetup} disabled={loading} className="px-4">
                  {loading ? <Spinner size="sm" animation="border" /> : 'Go to Dashboard'}
                </Button>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}
