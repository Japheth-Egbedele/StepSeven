import { useToasts } from '../../context/ToastContext';
import '../../styles/Toast.css';

const ToastContainer = () => {
  const { toasts, removeToast } = useToasts();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container" role="region" aria-label="Notifications">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <div className="toast-content">
            {t.title ? <div className="toast-title">{t.title}</div> : null}
            {t.message ? <div className="toast-message">{t.message}</div> : null}
          </div>
          <button className="toast-close" onClick={() => removeToast(t.id)} aria-label="Dismiss notification">
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;

