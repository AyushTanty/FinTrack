const { resolveContext } = require('../services/ai/intentService');
const { askGemini } = require('../services/ai/geminiService');
const { executeAction } = require('../services/ai/actionService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// Maximum recent messages sent to the AI for context.
// Older history is NOT sent — prevents ever-growing context and uncontrolled cost.
const MAX_HISTORY_MESSAGES = 8;

const SYSTEM_PROMPT = `You are FinTrack AI, a personal financial assistant for an Indian user managing their monthly budget.
You have access to the user's actual financial data provided as context.
Always answer based on the context data. Never invent numbers.
Keep responses concise — 2 to 5 sentences max for questions. Be direct and clear.
Use Indian Rupee symbol ₹ for amounts.

For financial ACTIONS (when the user says they spent, received, want to save, or plan to buy something):
Output ONLY a JSON block on its own line, exactly like one of these:
{"action":"add_expense","amount":350,"category":"Food","description":"food expense","date":"2026-09-26"}
{"action":"add_income","amount":25000,"source":"Salary","date":"2026-09-26"}
{"action":"add_savings","goalName":"Emergency Fund","amount":2000,"date":"2026-09-26"}
{"action":"add_purchase","name":"Laptop","amount":80000,"date":"2027-03-01"}

For non-action questions: answer conversationally. Do NOT output JSON.`;

async function chat(req, res) {
  try {
    const { message, month, year, history } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return errorResponse(res, 'Message is required');
    }

    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();

    // Cap conversation history — only pass the most recent N messages
    const recentHistory = Array.isArray(history)
      ? history.slice(-MAX_HISTORY_MESSAGES)
      : [];

    const { contextText, intent } = await resolveContext(req.user.id, message, m, y);
    const { answer, actionData } = await askGemini(SYSTEM_PROMPT, message, contextText, recentHistory);

    return successResponse(res, { answer, intent, actionData });
  } catch (err) {
    console.error('[AI chat error]', err);
    return errorResponse(res, 'AI assistant is temporarily unavailable', 500);
  }
}

// Voice endpoint: the browser transcribes speech via Web Speech API,
// then sends the transcript here. We treat it identically to a chat message.
async function voice(req, res) {
  try {
    const { transcript, month, year, history } = req.body;
    if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
      return errorResponse(res, 'Transcript is required');
    }
    // Delegate to the same chat logic — voice is just another input method
    req.body.message = transcript;
    return chat(req, res);
  } catch (err) {
    console.error('[AI voice error]', err);
    return errorResponse(res, 'AI voice processing failed', 500);
  }
}

async function confirmAction(req, res) {
  try {
    const { actionData } = req.body;
    if (!actionData || typeof actionData !== 'object') {
      return errorResponse(res, 'actionData is required');
    }

    const result = await executeAction(req.user.id, actionData);
    if (result.success) {
      return successResponse(res, result);
    } else {
      return errorResponse(res, result.message);
    }
  } catch (err) {
    console.error('[AI confirmAction error]', err);
    return errorResponse(res, 'Failed to execute action', 500);
  }
}

module.exports = { chat, voice, confirmAction };
