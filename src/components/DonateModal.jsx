import { useEffect } from 'react';

export default function DonateModal({ open, onClose, qrSrc = '/qr.svg' }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose?.(); }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="donate-modal" onClick={(e) => e.stopPropagation()}>
        <div className="donate-grid">
          <div className="donate-logo" aria-hidden="true">
            <div className="donate-logo-mark" />
          </div>
          <div className="donate-title">
            <h2>ФИНАНСОВАЯ<br/>ПОДДЕРЖКА</h2>
            <p className="muted" style={{ marginTop: 10, lineHeight: 1.5 }}>
              Отсканируйте QR‑код банковским приложением.
              <br /><br />
              В назначении платежа напишите:
              <br />
              «Добровольный взнос на уставные цели некоммерческой организации»
            </p>
          </div>
          <div className="donate-spacer" />
          <div className="donate-qr">
            <img src={qrSrc} alt="QR код для перевода" loading="lazy" />
          </div>
        </div>
        <div className="actions" style={{ marginTop: 12, justifyContent: 'flex-end' }}>
          <button className="action action-secondary" onClick={onClose}>Закрыть</button>
        </div>
      </div>
    </div>
  );
}
