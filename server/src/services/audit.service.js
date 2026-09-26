const prisma = require('../utils/prisma');

async function log(userId, entity, entityId, action, before = null, after = null) {
  await prisma.auditLog.create({
    data: { userId, entity, entityId, action, before, after }
  });
}

async function getAuditLogs(userId, page = 1, limit = 50, entity) {
  const where = { userId };
  if (entity) where.entity = entity;
  return prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: Number(limit)
  });
}

module.exports = { log, getAuditLogs };
