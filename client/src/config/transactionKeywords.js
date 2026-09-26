/**
 * Configurable keyword map for natural-language transaction parsing.
 * This dictionary lives in a single editable file and can be extended without touching UI code.
 */

export const INCOME_KEYWORDS = [
  'salary',
  'received',
  'credited',
  'earned',
  'freelance',
  'bonus',
  'refund',
  'cashback',
  'income',
  'dividend',
  'interest',
  'stipend'
];

export const EXPENSE_KEYWORDS = [
  'spent',
  'paid',
  'bought',
  'gave',
  'debited',
  'bill',
  'expense',
  'cost'
];

export const PURCHASE_KEYWORDS = [
  'plan to buy',
  'planning to buy',
  'want to buy',
  'wishlist',
  'planned purchase',
  'will buy'
];

export const SAVINGS_KEYWORDS = [
  'save',
  'saved',
  'savings',
  'deposit to savings',
  'contribute',
  'emergency fund'
];

export const CATEGORY_KEYWORDS = {
  'food': [
    'coffee', 'tea', 'chai', 'lunch', 'dinner', 'breakfast', 'food',
    'groceries', 'grocery', 'swiggy', 'zomato', 'restaurant', 'cafe',
    'snack', 'snacks', 'milk', 'bread', 'vegetables', 'fruits', 'burger',
    'pizza', 'biryani', 'drink', 'beverage', 'eating', 'coffees'
  ],
  'rent': [
    'rent', 'house rent', 'flat rent', 'room rent', 'landlord', 'pg'
  ],
  'electricity': [
    'electricity', 'electric', 'power bill', 'light bill', 'bijli', 'power'
  ],
  'internet': [
    'internet', 'wifi', 'wi-fi', 'broadband', 'fiber', 'net'
  ],
  'mobile': [
    'mobile', 'recharge', 'phone bill', 'sim', 'airtel', 'jio', 'vi', 'vodafone', 'bsnl'
  ],
  'transport': [
    'transport', 'fuel', 'petrol', 'diesel', 'cab', 'uber', 'ola',
    'auto', 'metro', 'bus', 'train', 'flight', 'fare', 'parking', 'toll', 'travel', 'rickshaw'
  ],
  'shopping': [
    'shopping', 'clothes', 'amazon', 'flipkart', 'myntra', 'shoes',
    'dress', 'shirt', 'pants', 'tshirt', 'jeans', 'mall'
  ],
  'health': [
    'health', 'medicine', 'medicines', 'doctor', 'hospital', 'clinic',
    'pharmacy', 'medical', 'dentist', 'meds', 'tablet', 'tablets'
  ],
  'education': [
    'education', 'course', 'books', 'book', 'tuition', 'fee', 'fees',
    'school', 'college', 'exam', 'class', 'classes', 'study'
  ],
  'entertainment': [
    'entertainment', 'movie', 'movies', 'cinema', 'game', 'gaming',
    'concert', 'party', 'show', 'outing', 'theatre', 'theater'
  ],
  'subscriptions': [
    'subscription', 'subscriptions', 'netflix', 'spotify', 'prime',
    'youtube', 'hotstar', 'disney', 'apple music'
  ],
  'personal care': [
    'salon', 'haircut', 'parlour', 'grooming', 'skincare', 'spa', 'shaving', 'barber'
  ],
  'other': [
    'other', 'misc', 'miscellaneous'
  ]
};
