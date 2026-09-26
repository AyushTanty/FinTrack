/**
 * intentService.js
 *
 * Lightweight rule-based intent classifier.
 * NO separate LLM call for classification — uses keyword matching only.
 *
 * Architecture: intent-first, not data-dump-first.
 * Each intent retrieves ONLY the data it needs.
 */

const {
  getSpendingSummary,
  getIncomeSummary,
  getBudgetStatus,
  getUpcomingBills,
  getSubscriptions,
  getSavingsGoals,
  getAvailableMoney,
  getPlannedPurchases,
  getAccounts
} = require('./retrievalService');

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Detect if the message is an ACTION command (user wants to record something).
 * Action detection runs FIRST so we can skip unnecessary data retrieval.
 */
function detectActionIntent(q) {
  if (/\bi spent\b|\badd expense\b|\bi paid\b|\bspent ₹|\bpaid ₹/.test(q)) return 'action_expense';
  if (/\bi received\b|\bgot salary\b|\badd income\b|\breceived ₹|\bsalary credited\b/.test(q)) return 'action_income';
  if (/\badd to (my )?savings\b|\bsave ₹|\bcontribute to\b/.test(q)) return 'action_savings';
  if (/\bplan to buy\b|\badd (a |an |my )?purchase\b/.test(q)) return 'action_purchase';
  if (/\badd (a |an )?subscription\b|\bsubscribe to\b/.test(q)) return 'action_subscription';
  return null;
}

/**
 * Detect question intent from keywords.
 * Returns one of: spending | income | budget | available | bills | subscriptions | savings | purchase | accounts | general
 */
function detectQuestionIntent(q) {
  if (/\bspend\b|\bspent\b|\bspending\b|\bexpense\b|\bcost\b|\bpaid\b|\bbought\b|\bwhere did my money\b/.test(q)) {
    return 'spending';
  }
  if (/\bincome\b|\bsalary\b|\bearned\b|\breceived\b/.test(q)) {
    return 'income';
  }
  if (/\bbudget\b|\bover budget\b|\bremaining budget\b/.test(q)) {
    return 'budget';
  }
  if (/\bavailable\b|\bhow much can i spend\b|\bsafe (to spend|daily)\b|\bdaily budget\b|\btam\b/.test(q)) {
    return 'available';
  }
  if (/\bbill\b|\bupcoming\b|\bdue\b|\bpay soon\b|\bobligation\b|\bpayment due\b/.test(q)) {
    return 'bills';
  }
  if (/\bsubscription\b|\bnetflix\b|\bspotify\b|\bmonthly charge\b/.test(q)) {
    return 'subscriptions';
  }
  if (/\bsaving\b|\bsavings\b|\bgoal\b|\bsaved\b/.test(q)) {
    return 'savings';
  }
  if (/\bafford\b|\bpurchase\b|\bplan to buy\b|\bbuy\b/.test(q)) {
    return 'purchase';
  }
  if (/\bbalance\b|\baccount\b|\bwallet\b/.test(q)) {
    return 'accounts';
  }
  return 'general';
}

/**
 * Formats a currency amount in Indian Rupee style.
 */
function fmt(amount) {
  return `₹${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

/**
 * Builds a concise context string for the given intent.
 * Returns the context text and the resolved intent name.
 */
async function resolveContext(userId, question, month, year) {
  const q = question.toLowerCase();
  const monthName = MONTH_NAMES[month - 1];
  const periodLabel = `${monthName} ${year}`;

  // Check action intent FIRST — if it's an action, we only need minimal context
  const actionIntent = detectActionIntent(q);
  if (actionIntent) {
    // For actions, just provide current available money as context (not the full DB)
    const avail = await getAvailableMoney(userId, month, year);
    const contextText = [
      `Period: ${periodLabel}`,
      `Current TAM: ${fmt(avail.tam)}`,
      `Safe daily budget: ${fmt(avail.safeDailyBudget)}`
    ].join('\n');
    return { contextText, intent: actionIntent };
  }

  // Question intent — retrieve only what that intent needs
  const intent = detectQuestionIntent(q);
  let lines = [`Period: ${periodLabel}`];

  try {
    switch (intent) {
      case 'spending': {
        const [spend, budget] = await Promise.all([
          getSpendingSummary(userId, month, year),
          getBudgetStatus(userId, month, year)
        ]);
        lines.push(`Total spent: ${fmt(spend.totalSpent)} (${spend.transactionCount} transactions)`);
        if (spend.topCategory) {
          const pct = spend.totalSpent > 0
            ? Math.round((spend.topCategory.amount / spend.totalSpent) * 100)
            : 0;
          lines.push(`Top category: ${spend.topCategory.name} (${fmt(spend.topCategory.amount)}, ${pct}%)`);
        }
        spend.byCategory.slice(0, 8).forEach(c => {
          lines.push(`  - ${c.name}: ${fmt(c.amount)}`);
        });
        if (budget.length > 0) {
          lines.push('Budget status:');
          budget.forEach(b => {
            const status = b.overBudget ? '⚠ OVER BUDGET' : `${fmt(b.remaining)} remaining`;
            lines.push(`  - ${b.categoryName}: budgeted ${fmt(b.budgeted)}, spent ${fmt(b.actual)} — ${status}`);
          });
        }
        break;
      }

      case 'income': {
        const inc = await getIncomeSummary(userId, month, year);
        lines.push(`Total income: ${fmt(inc.totalIncome)}`);
        inc.sources.forEach(s => lines.push(`  - ${s.source}: ${fmt(s.amount)}`));
        break;
      }

      case 'budget': {
        const budget = await getBudgetStatus(userId, month, year);
        if (budget.length === 0) {
          lines.push('No budgets set for this month.');
        } else {
          budget.forEach(b => {
            const status = b.overBudget ? '⚠ OVER BUDGET' : `${fmt(b.remaining)} remaining`;
            lines.push(`${b.categoryName}: budgeted ${fmt(b.budgeted)}, spent ${fmt(b.actual)} — ${status}`);
          });
        }
        break;
      }

      case 'available': {
        const avail = await getAvailableMoney(userId, month, year);
        lines.push(`Total balance (all accounts): ${fmt(avail.totalBalance)}`);
        lines.push(`Upcoming obligations: ${fmt(avail.upcomingObligations)}`);
        lines.push(`Planned purchases this month: ${fmt(avail.plannedPurchases)}`);
        lines.push(`Savings allocation: ${fmt(avail.savingsAllocation)}`);
        lines.push(`Emergency buffer: ${fmt(avail.emergencyBuffer)}`);
        lines.push(`True Available Money (TAM): ${fmt(avail.tam)}`);
        lines.push(`Safe Daily Budget: ${fmt(avail.safeDailyBudget)} (${avail.daysRemaining} days remaining)`);
        break;
      }

      case 'bills': {
        const bills = await getUpcomingBills(userId, month, year);
        if (bills.length === 0) {
          lines.push('No upcoming bills found for this month.');
        } else {
          lines.push('Upcoming bills this month:');
          bills.forEach(b => lines.push(`  - ${b.name}: ${fmt(b.amount)} due ${b.dueDate}`));
        }
        break;
      }

      case 'subscriptions': {
        const subs = await getSubscriptions(userId);
        if (subs.length === 0) {
          lines.push('No active subscriptions.');
        } else {
          const total = subs.reduce((s, sub) => s + sub.amount, 0);
          lines.push(`Active subscriptions (${subs.length}), total: ${fmt(total)}/month approx`);
          subs.forEach(s => {
            lines.push(`  - ${s.name}: ${fmt(s.amount)} (${s.billingCycle}), next: ${s.nextBillingDate || 'N/A'}`);
          });
        }
        break;
      }

      case 'savings': {
        const goals = await getSavingsGoals(userId);
        if (goals.length === 0) {
          lines.push('No active savings goals.');
        } else {
          goals.forEach(g => {
            lines.push(`${g.name}: ${fmt(g.currentAmount)} / ${fmt(g.targetAmount)} (${g.progress}% complete)`);
            if (g.targetDate) lines.push(`  Target date: ${g.targetDate}`);
          });
        }
        break;
      }

      case 'purchase': {
        const [avail, purchases] = await Promise.all([
          getAvailableMoney(userId, month, year),
          getPlannedPurchases(userId)
        ]);
        lines.push(`True Available Money (TAM): ${fmt(avail.tam)}`);
        lines.push(`Safe Daily Budget: ${fmt(avail.safeDailyBudget)}`);
        if (purchases.length > 0) {
          lines.push('Planned purchases:');
          purchases.forEach(p => {
            lines.push(`  - ${p.name}: ${fmt(p.expectedAmount)} (${p.priority} priority)${p.expectedDate ? ', by ' + p.expectedDate : ''}`);
          });
        }
        break;
      }

      case 'accounts': {
        const accounts = await getAccounts(userId);
        if (accounts.length === 0) {
          lines.push('No accounts found.');
        } else {
          const total = accounts.reduce((s, a) => s + a.balance, 0);
          lines.push(`Total balance across all accounts: ${fmt(total)}`);
          accounts.forEach(a => lines.push(`  - ${a.name} (${a.type}): ${fmt(a.balance)}`));
        }
        break;
      }

      case 'general':
      default: {
        // Fallback: minimal safe summary — NOT a full data dump
        const [spend, avail] = await Promise.all([
          getSpendingSummary(userId, month, year),
          getAvailableMoney(userId, month, year)
        ]);
        lines.push(`Total spent this month: ${fmt(spend.totalSpent)}`);
        if (spend.topCategory) {
          lines.push(`Top spending category: ${spend.topCategory.name} (${fmt(spend.topCategory.amount)})`);
        }
        lines.push(`True Available Money: ${fmt(avail.tam)}`);
        lines.push(`Safe Daily Budget: ${fmt(avail.safeDailyBudget)}`);
        break;
      }
    }
  } catch (err) {
    console.error('[intentService.resolveContext]', err.message);
    lines.push('(Some financial data could not be retrieved.)');
  }

  return { contextText: lines.join('\n'), intent };
}

module.exports = { resolveContext };
