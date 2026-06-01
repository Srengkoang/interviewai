const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createSession = async (req, res, next) => {
  try {
    const { title, language } = req.body;

    const session = await prisma.session.create({
      data: {
        userId: req.user.id,
        title: title || 'Technical Interview',
        language: language || 'javascript',
        status: 'PENDING',
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    req.io.emit('session:created', { sessionId: session.id });

    res.status(201).json({ session });
  } catch (err) {
    next(err);
  }
};

const getSessions = async (req, res, next) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { userId: req.user.id },
      include: {
        evaluation: true,
        _count: { select: { messages: true, submissions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ sessions });
  } catch (err) {
    next(err);
  }
};

const getSession = async (req, res, next) => {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        messages: { orderBy: { createdAt: 'asc' } },
        submissions: { orderBy: { createdAt: 'desc' } },
        evaluation: true,
      },
    });

    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.userId !== req.user.id && req.user.role !== 'INTERVIEWER') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ session });
  } catch (err) {
    next(err);
  }
};

const startSession = async (req, res, next) => {
  try {
    const session = await prisma.session.update({
      where: { id: req.params.id },
      data: { status: 'ACTIVE', startedAt: new Date() },
    });

    req.io.to(req.params.id).emit('session:started', { sessionId: session.id });

    res.json({ session });
  } catch (err) {
    next(err);
  }
};

const endSession = async (req, res, next) => {
  try {
    const session = await prisma.session.update({
      where: { id: req.params.id },
      data: { status: 'COMPLETED', endedAt: new Date() },
    });

    req.io.to(req.params.id).emit('session:ended', { sessionId: session.id });

    res.json({ session });
  } catch (err) {
    next(err);
  }
};

module.exports = { createSession, getSessions, getSession, startSession, endSession };
