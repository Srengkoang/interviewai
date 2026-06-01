const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

router.get('/dashboard', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [totalSessions, completedSessions, submissions, evaluations, recentSessions] =
      await Promise.all([
        prisma.session.count({ where: { userId } }),
        prisma.session.count({ where: { userId, status: 'COMPLETED' } }),
        prisma.submission.count({ where: { session: { userId } } }),
        prisma.evaluation.findMany({
          where: { session: { userId } },
          select: { aiScore: true, createdAt: true },
        }),
        prisma.session.findMany({
          where: { userId },
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { evaluation: true },
        }),
      ]);

    const avgScore =
      evaluations.length > 0
        ? Math.round(evaluations.reduce((sum, e) => sum + e.aiScore, 0) / evaluations.length)
        : 0;

    res.json({
      stats: {
        totalSessions,
        completedSessions,
        totalSubmissions: submissions,
        averageScore: avgScore,
      },
      recentSessions,
      scoreHistory: evaluations.map((e) => ({
        score: e.aiScore,
        date: e.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
