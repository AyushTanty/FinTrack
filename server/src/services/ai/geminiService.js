const axios = require('axios');
const path = require('path');
const dotenv = require('dotenv');

/**
 * Calls AI provider (Groq / Kimi / Modal / OpenAI-compatible model proxy)
 * with system prompt, user message, retrieved financial context, and recent conversation history.
 *
 * Configured via environment variables:
 * - AI_API_KEY or GROQ_API_KEY
 * - AI_BASE_URL (defaults to https://api.groq.com/openai/v1 for Groq)
 * - AI_MODEL (defaults to 'openai/gpt-oss-120b')
 *
 * @param {string} systemPrompt - Instructions for the AI
 * @param {string} userMessage  - The user's question or command
 * @param {string} contextText  - Intent-specific retrieved financial data (RAG context)
 * @param {Array}  history      - Recent conversation messages [{role, content}] (capped)
 * @returns {{ answer: string, actionData: object|null }}
 */
async function askGemini(systemPrompt, userMessage, contextText, history = []) {
  // Reload .env dynamically so credential changes take effect immediately without restarting
  try {
    dotenv.config({ path: path.resolve(__dirname, '../../../.env'), override: true });
    dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });
  } catch (_) {}

  // Resolve token
  let token = process.env.GROQ_API_KEY ||
    process.env.AI_API_KEY ||
    process.env.KIMI_API_KEY ||
    process.env.GEMINI_API_KEY;

  if (process.env.MODAL_PROXY_TOKEN_ID && process.env.MODAL_PROXY_TOKEN_SECRET) {
    token = `${process.env.MODAL_PROXY_TOKEN_ID.trim()}.${process.env.MODAL_PROXY_TOKEN_SECRET.trim()}`;
  }

  if (token && token.startsWith('wk-') && !token.includes('.') && process.env.MODAL_PROXY_TOKEN_SECRET) {
    token = `${token}.${process.env.MODAL_PROXY_TOKEN_SECRET.trim()}`;
  }

  if (!token) {
    return {
      answer: 'AI assistant is not configured. Please set AI_API_KEY or GROQ_API_KEY in the server .env file.',
      actionData: null
    };
  }

  token = token.trim();

  // If using Groq token (starts with gsk_), default to Groq endpoint
  const isGroq = token.startsWith('gsk_') || (process.env.AI_BASE_URL && process.env.AI_BASE_URL.includes('groq.com'));

  const rawBaseUrl = process.env.AI_BASE_URL ||
    (isGroq ? 'https://api.groq.com/openai/v1' : 'https://ayushtanty003--ep-kimi-k3-server.us-west.modal.direct/v1');

  // Normalize base URL
  let baseUrl = rawBaseUrl.trim().replace(/\/+$/, '');
  let endpoint = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;

  const model = process.env.AI_MODEL || (isGroq ? 'openai/gpt-oss-120b' : 'moonshotai/Kimi-K3');

  try {
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Format recent chat history
    if (Array.isArray(history) && history.length > 0) {
      history.forEach(msg => {
        messages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
        });
      });
    }

    // Combine retrieved financial context + user request
    const userContent = contextText
      ? `Financial Context from user records:\n${contextText}\n\nUser Request:\n${userMessage}`
      : userMessage;

    messages.push({
      role: 'user',
      content: userContent
    });

    const payload = {
      model,
      messages,
      temperature: isGroq ? 0.3 : 0.3,
      max_tokens: 2048,
      top_p: 1,
      stream: false
    };

    // Add reasoning_effort if supported by the model
    if (model.includes('gpt-oss') || model.includes('Kimi')) {
      payload.reasoning_effort = 'medium';
    }

    const response = await axios.post(
      endpoint,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 45000
      }
    );

    const messageObj = response.data?.choices?.[0]?.message;
    const rawText = messageObj?.content || messageObj?.reasoning || '';
    let answer = rawText;
    let actionData = null;

    // Check if the model produced an actionable JSON payload
    const jsonMatch = rawText.match(/\{[\s\S]*?"action"[\s\S]*?\}/);
    if (jsonMatch) {
      try {
        actionData = JSON.parse(jsonMatch[0]);
        answer = rawText.replace(jsonMatch[0], '').trim();
        if (!answer) {
          answer = "I've understood your request. Please confirm below to save it.";
        }
      } catch (_) {
        // Fall back to raw text if parsing fails
      }
    }

    return { answer, actionData };
  } catch (err) {
    const errData = err.response?.data;
    console.error('[AI Provider Error]:', errData || err.message);

    if (err.response?.status === 429 && errData?.error) {
      const msg = typeof errData.error === 'string' ? errData.error : (errData.error.message || JSON.stringify(errData.error));
      return {
        answer: `AI Provider Notice: ${msg}. Your normal myBudget features are still available.`,
        actionData: null
      };
    }

    return {
      answer: "I couldn't connect to the AI assistant right now. Your normal myBudget features are still available.",
      actionData: null
    };
  }
}

module.exports = { askGemini };
