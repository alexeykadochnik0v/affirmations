import { memo } from 'react';

export default memo(function AffirmationCard({ item, onNext, onFavorite, onHide, disabledNext = false }) {
  if (!item) return null;
  return (
    <article className="card" style={{ overflow: 'hidden' }}>
      {item.image && (
        <div style={{
          position: 'relative',
          borderRadius: 12,
          overflow: 'hidden',
          marginBottom: 16,
          aspectRatio: '16 / 9',
          background: '#eee',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.image}
            alt=""
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}

      <h2 style={{ margin: '0 0 10px 0', fontSize: 22, lineHeight: 1.3 }}>{item.text}</h2>

      {item.practice && (
        <div style={{ marginTop: 12, padding: 12, border: '1px dashed var(--border)', borderRadius: 10, background: 'var(--elev)' }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Практика</div>
          <p style={{ margin: 0, color: 'var(--text)' }}>{item.practice}</p>
        </div>
      )}

      <div className="actions" style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
        <button className="action action-primary" onClick={onFavorite} title="Добавить в избранное">В избранное</button>
        <button className="action action-secondary" onClick={onHide} title="Скрыть эту аффирмацию">Скрыть</button>
        <button className="action action-secondary" onClick={onNext} title={disabledNext ? 'Немного паузы для осознанности' : 'Следующая'} disabled={disabledNext}>Следующая</button>
      </div>
    </article>
  );
});
