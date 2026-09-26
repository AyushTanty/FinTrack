import React from 'react';
import { ToastContainer as BootstrapToastContainer, Toast } from 'react-bootstrap';

export default function ToastContainer({ toasts, onClose }) {
  return (
    <BootstrapToastContainer position="top-end" className="p-3" style={{ zIndex: 1060, position: 'fixed' }}>
      {toasts.map(t => (
        <Toast key={t.id} bg={t.variant} onClose={() => onClose(t.id)} show autohide delay={4000}>
          <Toast.Header><strong className="me-auto">Notification</strong></Toast.Header>
          <Toast.Body className={t.variant === 'warning' || t.variant === 'light' ? 'text-dark' : 'text-white'}>{t.message}</Toast.Body>
        </Toast>
      ))}
    </BootstrapToastContainer>
  );
}
