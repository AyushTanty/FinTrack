import { INCOME_KEYWORDS, EXPENSE_KEYWORDS, PURCHASE_KEYWORDS, SAVINGS_KEYWORDS, CATEGORY_KEYWORDS } from '../config/transactionKeywords.js';

/**
 * Normalizes string for case-insensitive keyword searching.
 */
function cleanText(text) {
  return (text || '').toLowerCase().trim();
}

/**
 * Extracts numbers and candidate amounts from a sentence.
 * Handles currency prefixes (₹, rs, rs., inr) and commas (e.g. 2,500, 1,50,000, 49.50).
 */
function extractAmounts(sentence) {
  const normalized = sentence.replace(/,/g, '');
  // 1. Matches with explicit currency prefix or symbol
  const currencyRegex = /(?:₹|rs\.?|inr)\s*(\d+(?:\.\d{1,2})?)/gi;
  // 2. Matches with trailing currency symbol
  const trailingCurrencyRegex = /(\d+(?:\.\d{1,2})?)\s*(?:₹|rs\.?|inr)\b/gi;
  // 3. Generic number matches
  const genericNumberRegex = /\b(\d+(?:\.\d{1,2})?)\b/g;

  let currencyMatches = [];
  let match;

  while ((match = currencyRegex.exec(normalized)) !== null) {
    currencyMatches.push({
      value: parseFloat(match[1]),
      raw: match[0],
      numStr: match[1],
      hasCurrency: true,
      index: match.index
    });
  }

  while ((match = trailingCurrencyRegex.exec(normalized)) !== null) {
    currencyMatches.push({
      value: parseFloat(match[1]),
      raw: match[0],
      numStr: match[1],
      hasCurrency: true,
      index: match.index
    });
  }

  if (currencyMatches.length > 0) {
    // If explicit currency was attached, take the first explicit currency match
    return {
      selected: currencyMatches[0],
      allCount: currencyMatches.length,
      isAmbiguous: currencyMatches.length > 1
    };
  }

  // No explicit currency symbol. Find all generic numbers.
  let genericMatches = [];
  while ((match = genericNumberRegex.exec(normalized)) !== null) {
    genericMatches.push({
      value: parseFloat(match[1]),
      raw: match[0],
      numStr: match[1],
      hasCurrency: false,
      index: match.index
    });
  }

  if (genericMatches.length === 0) {
    return { selected: null, allCount: 0, isAmbiguous: false };
  }

  if (genericMatches.length === 1) {
    return { selected: genericMatches[0], allCount: 1, isAmbiguous: false };
  }

  // Multiple generic numbers found (e.g., "2 coffees 100")
  // Check if first number is likely a quantity (e.g. small integer followed by words, then another number)
  // Usually the last number or the larger number in a sentence is the total price.
  const lastNum = genericMatches[genericMatches.length - 1];
  return {
    selected: lastNum,
    allCount: genericMatches.length,
    isAmbiguous: true
  };
}

/**
 * Determines transaction type (expense, income, purchase, savings).
 */
function extractType(lowerSentence) {
  for (const kw of PURCHASE_KEYWORDS) {
    if (new RegExp(`\\b${kw}\\b`, 'i').test(lowerSentence)) {
      return 'purchase';
    }
  }
  for (const kw of SAVINGS_KEYWORDS) {
    if (new RegExp(`\\b${kw}\\b`, 'i').test(lowerSentence)) {
      return 'savings';
    }
  }
  for (const kw of INCOME_KEYWORDS) {
    const regex = new RegExp(`\\b${kw}\\b`, 'i');
    if (regex.test(lowerSentence)) {
      return 'income';
    }
  }
  return 'expense';
}

/**
 * Matches categories from existing user categories list.
 */
function extractCategory(lowerSentence, categories) {
  if (!categories || categories.length === 0) {
    return { category: null, matchType: 'none', count: 0 };
  }

  // 1. Literal category name matching (takes highest priority)
  for (const cat of categories) {
    const catNameLower = cat.name.toLowerCase();
    const regex = new RegExp(`\\b${catNameLower}\\b`, 'i');
    if (regex.test(lowerSentence)) {
      return { category: cat, matchType: 'literal', count: 1 };
    }
  }

  // 2. Keyword synonyms matching
  const matches = [];
  for (const cat of categories) {
    const catNameLower = cat.name.toLowerCase();
    const synonyms = CATEGORY_KEYWORDS[catNameLower] || [];
    for (const syn of synonyms) {
      const regex = new RegExp(`\\b${syn}\\b`, 'i');
      if (regex.test(lowerSentence)) {
        matches.push(cat);
        break; // Match category once
      }
    }
  }

  if (matches.length === 1) {
    return { category: matches[0], matchType: 'keyword', count: 1 };
  }

  if (matches.length > 1) {
    // Pick the first by existing display order, mark as multiple matches
    return { category: matches[0], matchType: 'multiple_keywords', count: matches.length };
  }

  // 3. Fallback to default/Other category
  const defaultCat = categories.find(c => c.name.toLowerCase() === 'other' || c.isDefault) || categories[0];
  return { category: defaultCat, matchType: 'fallback', count: 0 };
}

/**
 * Cleans the input sentence to generate a concise description.
 */
function generateDescription(rawSentence, amountObj, type) {
  if (!rawSentence) return type === 'income' ? 'Income' : 'Expense';

  let cleaned = rawSentence;

  // Remove the extracted amount and currency prefix
  if (amountObj) {
    cleaned = cleaned.replace(new RegExp(`(?:₹|rs\\.?|inr)?\\s*${amountObj.numStr}\\s*(?:₹|rs\\.?|inr)?`, 'gi'), ' ');
  }

  // Remove common leading action verbs
  cleaned = cleaned.replace(/^\s*(bought|spent|paid for|paid|received|got|added|add)\b\s*/i, '');
  cleaned = cleaned.replace(/\b(today|yesterday)\b/gi, '');
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();

  if (!cleaned) {
    return rawSentence.trim().charAt(0).toUpperCase() + rawSentence.trim().slice(1);
  }

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Extracts date (today vs yesterday).
 */
function extractDate(lowerSentence) {
  const now = new Date();
  if (/\byesterday\b/i.test(lowerSentence)) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return {
      date: yesterday.toISOString().split('T')[0],
      dateLabel: 'Yesterday'
    };
  }
  return {
    date: now.toISOString().split('T')[0],
    dateLabel: 'Today'
  };
}

/**
 * Main sentence parser function.
 *
 * @param {string} sentence - The sentence typed by the user
 * @param {Array} categories - The user's category list
 * @returns {Object} Parsed transaction object
 */
export function parseTransactionSentence(sentence, categories = []) {
  if (!sentence || typeof sentence !== 'string' || !sentence.trim()) {
    return {
      confidence: 'NONE',
      amount: null,
      type: 'expense',
      category: null,
      categoryId: null,
      categoryName: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      dateLabel: 'Today',
      note: null
    };
  }

  const rawTrimmed = sentence.trim();
  const lowerSentence = cleanText(rawTrimmed);

  // 1. Extract Amount
  const amountInfo = extractAmounts(rawTrimmed);
  if (!amountInfo.selected) {
    return {
      confidence: 'NONE',
      amount: null,
      type: extractType(lowerSentence),
      category: null,
      categoryId: null,
      categoryName: '',
      description: rawTrimmed,
      date: new Date().toISOString().split('T')[0],
      dateLabel: 'Today',
      note: null
    };
  }

  const amount = amountInfo.selected.value;

  // 2. Extract Type
  const type = extractType(lowerSentence);

  // 3. Extract Category
  const { category, matchType } = extractCategory(lowerSentence, categories);

  // 4. Extract Date
  const { date, dateLabel } = extractDate(lowerSentence);

  // 5. Generate Description
  const description = generateDescription(rawTrimmed, amountInfo.selected, type);

  // 6. Determine Confidence
  let confidence = 'HIGH';
  let note = null;

  if (amountInfo.isAmbiguous) {
    confidence = 'LOW';
    note = 'Check this amount';
  } else if (type === 'income') {
    confidence = 'HIGH';
  } else if (matchType === 'fallback' || matchType === 'multiple_keywords') {
    confidence = 'MEDIUM';
  } else {
    confidence = 'HIGH';
  }

  let incomeType = 'SALARY';
  if (/\b(freelance|consulting|contract)\b/i.test(lowerSentence)) {
    incomeType = 'FREELANCE';
  } else if (/\b(bonus|gift|cashback|refund|dividend|interest|stipend)\b/i.test(lowerSentence)) {
    incomeType = 'ONE_TIME';
  } else if (/\b(salary|payroll)\b/i.test(lowerSentence)) {
    incomeType = 'SALARY';
  } else {
    incomeType = 'SALARY';
  }

  return {
    amount,
    rawAmount: amountInfo.selected.numStr,
    type,
    incomeType,
    category,
    categoryId: category?.id || null,
    categoryName: category?.name || (type === 'income' ? 'Income' : 'Other'),
    categoryColor: category?.color || '#94a3b8',
    categoryIcon: category?.icon || '🏷️',
    description,
    date,
    dateLabel,
    confidence,
    note
  };
}
