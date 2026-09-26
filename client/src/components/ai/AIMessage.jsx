import React from 'react';

export default function AIMessage({ role, content }) {
  const isUser = role === 'user';

  return (
    <div className={`d-flex mb-3 ${isUser ? 'justify-content-end' : 'justify-content-start'}`}>
      <div
        className={`p-3 rounded-3 shadow-sm ${
          isUser
            ? 'text-white'
            : 'text-light'
        }`}
        style={{
          maxWidth: '82%',
          whiteSpace: 'pre-wrap',
          backgroundColor: isUser ? '#4F46E5' : '#1E293B',
          border: isUser ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #334155',
          fontSize: '14px',
          lineHeight: '1.6'
        }}
      >
        {content}
      </div>
    </div>
  );
}
