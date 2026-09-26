const { calculateAccountBalance, calculateTotalBalance } = require('../analytics/balanceCalc');

async function getAccountBalance(accountId) {
  return calculateAccountBalance(accountId);
}

async function getTotalBalance(userId) {
  return calculateTotalBalance(userId);
}

module.exports = { getAccountBalance, getTotalBalance };
