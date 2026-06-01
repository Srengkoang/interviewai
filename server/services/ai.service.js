const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are an expert technical interviewer at a top-tier software company.
Your role is to conduct a professional technical interview.

Guidelines:
- Start by briefly introducing yourself and the interview format
- Ask one clear technical question at a time
- For coding problems, provide clear problem statements with examples
- Review code submissions critically but constructively
- Ask follow-up questions to probe deeper understanding
- Evaluate problem-solving approach, not just the final answer
- Be encouraging but maintain professional standards
- Provide a score (0-100) and detailed feedback at the end

Topics to cover: Data structures, algorithms, system design, coding best practices.`;

const streamChatResponse = async (messages, res) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }));

  const lastMessage = messages[messages.length - 1].content;

  const chat = model.startChat({
    history,
    systemInstruction: SYSTEM_PROMPT,
  });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  let fullText = '';

  const result = await chat.sendMessageStream(lastMessage);

  for await (const chunk of result.stream) {
    const text = chunk.text();
    fullText += text;
    res.write(`data: ${JSON.stringify({ text })}\n\n`);
  }

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();

  return fullText;
};

const generateChallenge = async (language, difficulty = 'medium') => {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const result = await model.generateContent(`Generate a ${difficulty} coding challenge for a technical interview.
Language: ${language}
Format your response as JSON:
{
  "title": "Problem title",
  "description": "Full problem description",
  "examples": [{"input": "...", "output": "..."}],
  "constraints": ["constraint 1", "constraint 2"],
  "starterCode": "// starter code here"
}
Respond with ONLY the JSON, no other text, no markdown backticks.`);

  try {
    const text = result.response.text().replace(/```json|```/g, '').trim();
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const reviewCode = async (code, language, problem) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const result = await model.generateContent(`Review this ${language} code for the following problem:
Problem: ${problem}

Code:
\`\`\`${language}
${code}
\`\`\`

Provide a JSON response:
{
  "score": 0-100,
  "correctness": "correct|partial|incorrect",
  "timeComplexity": "O(...)",
  "spaceComplexity": "O(...)",
  "feedback": "detailed feedback",
  "strengths": ["strength 1"],
  "improvements": ["improvement 1"]
}
Respond with ONLY the JSON, no markdown backticks.`);

  try {
    const text = result.response.text().replace(/```json|```/g, '').trim();
    return JSON.parse(text);
  } catch {
    return null;
  }
};

module.exports = { streamChatResponse, generateChallenge, reviewCode };