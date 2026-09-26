/**
 * actionService.js
 *
 * Executes confirmed AI-detected financial actions using the SAME existing
 * service functions as manual entry. No separate AI database implementation.
 *
 * The user MUST confirm before this runs — controller enforces that.
 */

const prisma = require('../../utils/prisma');
const expenseService = require('../../services/expense.service');
const incomeService = require('../../services/income.service');
const savingsService = require('../../services/savings.service');
const plannedPurchaseService = require('../../services/plannedPurchase.service');

async function executeAction(userId, actionData) {
  try {
    const { action } = actionData;
    if (!action) return { success: false, message: 'Missing action type', data: null };

    switch (action) {
      case 'add_expense': {
        // Resolve categoryId by name (case-insensitive) — fall back to first DISCRETIONARY
        let categoryId = null;
        if (actionData.category) {
          const cat = await prisma.category.findFirst({
            where: { userId, name: { equals: actionData.category, mode: 'insensitive' } }
          });
          if (cat) categoryId = cat.id;
        }
        if (!categoryId) {
          const fallback = await prisma.category.findFirst({
            where: { userId, type: 'DISCRETIONARY' }
          });
          if (fallback) categoryId = fallback.id;
        }
        if (!categoryId) {
          // If still no category, pick any category
          const anyCat = await prisma.category.findFirst({ where: { userId } });
          if (anyCat) categoryId = anyCat.id;
        }
        if (!categoryId) {
          return { success: false, message: `Category "${actionData.category || 'unknown'}" not found and no fallback available.`, data: null };
        }

        const expense = await expenseService.createExpense(userId, {
          amount: parseFloat(actionData.amount),
          description: actionData.description || `${actionData.category || 'Expense'} (via AI)`,
          date: actionData.date ? new Date(actionData.date) : new Date(),
          categoryId,
          paymentMethod: 'OTHER',
          notes: 'Added via AI Assistant'
        });

        return { success: true, message: 'Expense added successfully', data: expense };
      }

      case 'add_income': {
        const income = await incomeService.createIncome(userId, {
          source: actionData.source || 'Other',
          type: 'ONE_TIME',
          amount: parseFloat(actionData.amount),
          date: actionData.date ? new Date(actionData.date) : new Date(),
          notes: 'Added via AI Assistant'
        });

        return { success: true, message: 'Income added successfully', data: income };
      }

      case 'add_savings': {
        const goals = await savingsService.listGoals(userId);

        const goalName = (actionData.goalName || '').toLowerCase();
        let goal = goals.find(g => g.name.toLowerCase().includes(goalName));
        if (!goal && goals.length > 0) goal = goals[0];

        if (!goal) {
          return { success: false, message: 'No active savings goal found. Please create a savings goal first.', data: null };
        }

        const contribution = await savingsService.addContribution(userId, goal.id, {
          amount: parseFloat(actionData.amount),
          date: actionData.date ? new Date(actionData.date) : new Date(),
          notes: 'Added via AI Assistant'
        });

        return { success: true, message: `Added ₹${actionData.amount} to "${goal.name}"`, data: contribution };
      }

      case 'add_purchase': {
        const purchase = await plannedPurchaseService.createPurchase(userId, {
          name: actionData.name,
          expectedAmount: parseFloat(actionData.amount),
          expectedDate: actionData.date ? new Date(actionData.date) : null,
          priority: 'MEDIUM',
          notes: 'Added via AI Assistant'
        });

        return { success: true, message: 'Planned purchase added successfully', data: purchase };
      }

      default:
        return { success: false, message: `Unknown action type: "${action}"`, data: null };
    }
  } catch (err) {
    console.error('[actionService.executeAction]', err.message);
    return { success: false, message: err.message || 'Failed to execute action', data: null };
  }
}

module.exports = { executeAction };
