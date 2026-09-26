const prisma = require('../utils/prisma');

async function deleteCategory(userId, id) {
  const expenses = await prisma.expense.count({ where: { categoryId: id } });
  const recurrings = await prisma.recurringExpense.count({ where: { categoryId: id } });
  const budgets = await prisma.budget.count({ where: { categoryId: id } });
  const planned = await prisma.plannedPurchase.count({ where: { categoryId: id } });

  if (expenses > 0 || recurrings > 0 || budgets > 0 || planned > 0) {
    const error = new Error('Category is in use');
    error.status = 409;
    error.statusCode = 409;
    error.details = { expenses, recurrings, budgets, planned };
    throw error;
  }

  const cat = await prisma.category.findFirst({ where: { id, userId } });
  if (!cat) {
    const error = new Error('Category not found');
    error.status = 404;
    error.statusCode = 404;
    throw error;
  }

  return prisma.category.delete({ where: { id } });
}

async function listCategories(userId) {
  return prisma.category.findMany({ where: { userId } });
}

module.exports = {
  deleteCategory,
  listCategories
};
