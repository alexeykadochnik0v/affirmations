import { memo } from 'react';

export default memo(function AffirmationCard({ item, onNext, onFavorite, onHide, onOpenAi, onSubmitPublic, submitPublicDone = false, disabledNext = false, categoryLabel, favorited = false }) {
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
            title={favorited ? 'Убрать из избранного' : 'Добавить в избранное'}
          >
            {favorited ? 'в избранном ✦' : 'в избранное ✦'}
          </button>
          {typeof onSubmitPublic === 'function' && (
            <button className="action action-secondary" onClick={onSubmitPublic} disabled={submitPublicDone} title={submitPublicDone? 'Заявка уже отправлена' : 'Отправить на модерацию в общий каталог'}>
              {submitPublicDone ? 'Отправлено на модерацию' : 'Отправить в общий список'}
            </button>
          )}
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
          {(() => {
            const raw = item.practice || '';
            // Try to detect steps and render as list
            // 1) If practice already an array
            const steps = Array.isArray(raw) ? raw
              // 2) Split by numbered bullets like "1.", "2)", "- ", "• "
              : raw.split(/(?:\n|^|\s)(?:\d+\s*[\.)]|[•\-])\s+/g)
                  .map(s => s.trim())
                  .filter(Boolean);
            if (Array.isArray(steps) && steps.length >= 2) {
              return (
                <ul className="aff-block-text" style={{ paddingLeft: 18, margin: 0 }}>
                  {steps.map((s, i) => (<li key={i}>{s}</li>))}
                </ul>
              );
            }
            // 3) Fallback: just show paragraph
            return <p className="aff-block-text">{raw || '—'}</p>;
          })()}
        </div>
      </div>

      {/* Bottom actions */}
      <div className="aff-actions">
        <button className="action action-primary" onClick={onNext} title={disabledNext ? 'Немного паузы для осознанности' : 'Следующая'} disabled={disabledNext}>Следующая аффирмация →</button>
        <button className="action action-secondary" onClick={onOpenAi}>Хочу аффирмацию на свою тему</button>
      </div>
    </article>
  );
});
