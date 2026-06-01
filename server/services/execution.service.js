const JUDGE0_URL = process.env.JUDGE0_URL || 'https://judge0-ce.p.rapidapi.com';
const JUDGE0_KEY = process.env.JUDGE0_API_KEY;

// Judge0 language IDs
const LANGUAGE_MAP = {
  javascript: 93,
  python: 71,
  java: 62,
  cpp: 54,
  c: 50,
  typescript: 94,
  go: 60,
  rust: 73,
};

const executeCode = async (code, language, stdin = '') => {
  const languageId = LANGUAGE_MAP[language] || 93;

  const submission = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-RapidAPI-Key': JUDGE0_KEY,
      'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
    },
    body: JSON.stringify({
      source_code: code,
      language_id: languageId,
      stdin,
      cpu_time_limit: 5,
      memory_limit: 128000,
    }),
  });

  const result = await submission.json();

  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    compile_output: result.compile_output || '',
    status: result.status?.description || 'Unknown',
    time: result.time,
    memory: result.memory,
    exit_code: result.exit_code,
  };
};

module.exports = { executeCode, LANGUAGE_MAP };
