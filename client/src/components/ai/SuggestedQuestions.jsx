import React from 'react';

const QUESTIONS = [
  "How much did I spend this month?",
  "How much can I spend today?",
  "What bills are coming up?",
  "Where did most of my money go?",
  "What subscriptions do I have?",
  "Am I over my food budget?",
  "How much have I saved?"
];

export default function SuggestedQuestions({ onSelect }) {
  return (
    <div className="d-flex flex-wrap justify-content-center gap-2 mt-2" style={{ maxWidth: '600px' }}>
      {QUESTIONS.map((q, i) => (
        <button
          key={i}
          className="btn btn-sm text-secondary"
          style={{
            backgroundColor: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid #334155',
            borderRadius: '9999px',
            fontSize: '12.5px',
            padding: '5px 12px',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#6366F1';
            e.currentTarget.style.color = '#F8FAFC';
            e.currentTarget.style.backgroundColor = 'rgba(79, 70, 229, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#334155';
            e.currentTarget.style.color = '#94A3B8';
            e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.8)';
          }}
          onClick={() => onSelect(q)}
        >
          {q}
        </button>
      ))}
    </div>
  );
}
