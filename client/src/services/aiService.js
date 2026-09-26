import api from './api';

// Maximum messages to keep in local history before truncating.
// The server also independently caps at 8 — this is a client-side pre-cap.
const MAX_LOCAL_HISTORY = 10;

/**
 * Ask the AI a financial question or send a natural-language command.
 * Sends the current message, month/year context, and a small window of
 * recent conversation history.
 *
 * @param {string} message  - The user's question or command
 * @param {number} month    - Current month (1–12)
 * @param {number} year     - Current year
 * @param {Array}  history  - Recent messages [{role, content}] — capped before sending
 * @returns {{ answer, intent, actionData }}
 */
export const askAI = async (message, month, year, history = []) => {
  // Client-side cap: only send the most recent N messages
  const recentHistory = history.slice(-MAX_LOCAL_HISTORY);
  const { data } = await api.post('/ai/chat', { message, month, year, history: recentHistory });
  return data.data; // { answer, intent, actionData }
};

/**
 * Send a voice transcript to the AI (same flow as text chat).
 * Speech-to-text happens in the browser via Web Speech API.
 *
 * @param {string} transcript - Transcribed speech text
 * @param {number} month
 * @param {number} year
 * @param {Array}  history
 */
export const askAIVoice = async (transcript, month, year, history = []) => {
  const recentHistory = history.slice(-MAX_LOCAL_HISTORY);
  const { data } = await api.post('/ai/voice', { transcript, month, year, history: recentHistory });
  return data.data;
};

/**
 * Execute a confirmed AI-detected financial action.
 * Only called after explicit user confirmation — never automatically.
 *
 * @param {object} actionData - The structured action from AI response
 */
export const confirmAIAction = async (actionData) => {
  const { data } = await api.post('/ai/action/confirm', { actionData });
  return data.data;
};
