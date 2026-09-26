const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  { name: 'Food', type: 'VARIABLE', icon: '🍽️', color: '#f59e0b' },
  { name: 'Rent', type: 'FIXED', icon: '🏠', color: '#6366f1' },
  { name: 'Electricity', type: 'FIXED', icon: '⚡', color: '#f97316' },
  { name: 'Internet', type: 'FIXED', icon: '🌐', color: '#06b6d4' },
  { name: 'Mobile', type: 'FIXED', icon: '📱', color: '#8b5cf6' },
  { name: 'Transport', type: 'VARIABLE', icon: '🚗', color: '#10b981' },
  { name: 'Shopping', type: 'DISCRETIONARY', icon: '🛍️', color: '#ec4899' },
  { name: 'Health', type: 'VARIABLE', icon: '❤️', color: '#ef4444' },
  { name: 'Education', type: 'VARIABLE', icon: '📚', color: '#3b82f6' },
  { name: 'Entertainment', type: 'DISCRETIONARY', icon: '🎬', color: '#a78bfa' },
  { name: 'Subscriptions', type: 'FIXED', icon: '🔄', color: '#14b8a6' },
  { name: 'Personal Care', type: 'VARIABLE', icon: '🧴', color: '#f43f5e' },
  { name: 'Other', type: 'DISCRETIONARY', icon: '📦', color: '#94a3b8' },
];

async function seedDefaultCategories(userId) {
  const categoriesToCreate = DEFAULT_CATEGORIES.map(cat => ({
    ...cat,
    userId,
    isDefault: true,
  }));
  
  await prisma.category.createMany({
    data: categoriesToCreate
  });
}

module.exports = {
  seedDefaultCategories
};
