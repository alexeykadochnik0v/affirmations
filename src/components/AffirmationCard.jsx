import { memo } from 'react';

export default memo(function AffirmationCard({ item, onNext, onFavorite, onHide, disabledNext = false, categoryLabel, favorited = false }) {
  if (!item) return null;
  return (
    <article className="card aff-card" style={{ overflow: 'hidden' }}>
      {/* Header: category title and top-right actions */}
      <div className="aff-head">
        <div className="aff-cat">{categoryLabel || 'Аффирмация'}</div>
        <div className="actions">
          <button className="action action-secondary" onClick={onHide} title="Скрыть эту аффирмацию">скрыть</button>
          <button
            className={`action action-fav ${item && (typeof favorited !== 'undefined') && favorited ? 'is-active' : ''}`}
            onClick={onFavorite}
            title={favorited ? 'В избранном' : 'Добавить в избранное'}
          >{favorited ? 'в избранном ★' : 'в избранное'}</button>
        </div>
      </div>

      {/* Main text */}
      <div className="aff-text">
        <div className="quote">«{item.text}»</div>
        <div className="underline" />
      </div>

      {/* Info grid: explanation and practice */}
      <div className="aff-info">
        <div className="aff-block">
          <div className="aff-block-title">РАСШИФРОВКА</div>
          <p className="aff-block-text">{item.explanation || '—'}</p>
        </div>
        <div className="aff-block">
          <div className="aff-block-title tag">практика дня</div>
          <p className="aff-block-text">{item.practice || '—'}</p>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="aff-actions">
        <button className="action action-primary" onClick={onNext} title={disabledNext ? 'Немного паузы для осознанности' : 'Следующая'} disabled={disabledNext}>Следующая аффирмация →</button>
        <button className="action action-secondary" title="Скоро">Хочу аффирмацию на свою тему</button>
      </div>
    </article>
  );
});
