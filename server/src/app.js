const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');
const auth = require('./middleware/auth');

const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const incomeRoutes = require('./routes/income.routes');
const expenseRoutes = require('./routes/expense.routes');
const categoryRoutes = require('./routes/category.routes');
const budgetRoutes = require('./routes/budget.routes');
const monthlyPlanRoutes = require('./routes/monthlyPlan.routes');
const recurringExpenseRoutes = require('./routes/recurringExpense.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const plannedPurchaseRoutes = require('./routes/plannedPurchase.routes');
const savingsRoutes = require('./routes/savings.routes');
const reportsRoutes = require('./routes/reports.routes');
const settingsRoutes = require('./routes/settings.routes');
const auditRoutes = require('./routes/audit.routes');
const aiRoutes = require('./routes/ai.routes');

const app = express();

app.use(helmet());
const allowedOrigins = process.env.CLIENT_URL 
  ? process.env.CLIENT_URL.split(',').map(s => s.trim()) 
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production' || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(rateLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use('/api/income', auth, incomeRoutes);
app.use('/api/expenses', auth, expenseRoutes);
app.use('/api/categories', auth, categoryRoutes);
app.use('/api/budgets', auth, budgetRoutes);
app.use('/api/monthly-plans', auth, monthlyPlanRoutes);
app.use('/api/recurring-expenses', auth, recurringExpenseRoutes);
app.use('/api/subscriptions', auth, subscriptionRoutes);
app.use('/api/planned-purchases', auth, plannedPurchaseRoutes);
app.use('/api/savings', auth, savingsRoutes);
app.use('/api/reports', auth, reportsRoutes);
app.use('/api/settings', auth, settingsRoutes);
app.use('/api/audit', auth, auditRoutes);
app.use('/api/ai', auth, aiRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use(errorHandler);

module.exports = app;
