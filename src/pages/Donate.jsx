import { useState } from 'react';
import DonateModal from '../components/DonateModal';

export default function Donate() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <h1 style={{ marginBottom: 16 }}>Донат</h1>
      <p className="muted" style={{ marginTop: 0 }}>Спасибо за желание поддержать проект. Откройте окно и отсканируйте QR‑код.</p>
      <div className="actions" style={{ marginTop: 12 }}>
        <button className="action action-primary" onClick={() => setOpen(true)}>Открыть окно доната</button>
      </div>

      <DonateModal open={open} onClose={() => setOpen(false)} qrSrc="/qr.svg" />
    </div>
  );
}
