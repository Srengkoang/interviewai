const { PrismaClient } = require('@prisma/client');
const { streamChatResponse, generateChallenge, reviewCode } = require('../services/ai.service');

const prisma = new PrismaClient();

const sendMessage = async (req, res, next) => {
  try {
    const { sessionId, content } = req.body;

    if (!sessionId || !content) {
      return res.status(400).json({ error: 'sessionId and content are required' });
    }

    // Save user message
    await prisma.message.create({
      data: { sessionId, role: 'USER', content },
    });

    // Get conversation history
    const history = await prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });

    const messages = history.map((m) => ({
      role: m.role === 'USER' ? 'user' : 'assistant',
      content: m.content,
    }));

    // Stream response and save when done
    const fullResponse = await streamChatResponse(messages, res);

    await prisma.message.create({
      data: { sessionId, role: 'ASSISTANT', content: fullResponse },
    });
  } catch (err) {
    if (!res.headersSent) next(err);
  }
};

const getChallenge = async (req, res, next) => {
  try {
    const { language, difficulty } = req.query;
    const challenge = await generateChallenge(language || 'javascript', difficulty);

    if (!challenge) return res.status(500).json({ error: 'Failed to generate challenge' });

    res.json({ challenge });
  } catch (err) {
    next(err);
  }
};

const reviewSubmission = async (req, res, next) => {
  try {
    const { code, language, problem, sessionId } = req.body;
    const review = await reviewCode(code, language, problem);

    if (!review) return res.status(500).json({ error: 'Failed to review code' });

    // Save evaluation if sessionId provided
    if (sessionId) {
      await prisma.evaluation.upsert({
        where: { sessionId },
        create: {
          sessionId,
          aiScore: review.score,
          aiFeedback: review.feedback,
          strengths: review.strengths || [],
          improvements: review.improvements || [],
        },
        update: {
          aiScore: review.score,
          aiFeedback: review.feedback,
          strengths: review.strengths || [],
          improvements: review.improvements || [],
        },
      });
    }

    res.json({ review });
  } catch (err) {
    next(err);
  }
};

module.exports = { sendMessage, getChallenge, reviewSubmission };
