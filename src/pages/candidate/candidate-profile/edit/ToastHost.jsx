import React from 'react';

const ToastHost = ({ toasts, onAction }) => (
  <div className="toast-host">
    {toasts.map((t) => (
      <div className={`toast${t.in ? ' in' : ''}`} key={t.id}>
        <span>{t.msg}</span>
        {t.actionLabel && (
          <button
            type="button"
            onClick={() => {
              onAction(t.id);
            }}
          >
            {t.actionLabel}
          </button>
        )}
      </div>
    ))}
  </div>
);

export default ToastHost;
