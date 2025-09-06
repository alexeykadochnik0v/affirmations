import { Link } from 'react-router-dom';
import { useState } from 'react';
import DonateModal from '../components/DonateModal';

export default function About() {
  const [donateOpen, setDonateOpen] = useState(false);
  return (
    <div className="landing">
      {/* Hero */}
      <section className="landing-hero">
        <div className="container">
          <h1 className="landing-title">Осознанность через аффирмации</h1>
          <p className="landing-sub">Место, где короткая фраза и маленькая практика каждый день меняют состояние и жизнь.</p>
          <div className="actions">
            <Link className="action action-primary" to="/">Начать сейчас</Link>
            <Link className="action action-secondary" to="/favorites">Мои избранные</Link>
          </div>
        </div>
        <div className="landing-hero-bg" aria-hidden />
      </section>

      {/* Features */}
      <section className="landing-section">
        <div className="container">
          <div className="feature-grid">
            <div className="feature">
              <div className="feature-title">Живой смысл</div>
              <p>Каждая аффирмация сопровождается <strong>расшифровкой</strong>, чтобы понимать, как она работает и что в тебе поддерживает.</p>
            </div>
            <div className="feature">
              <div className="feature-title">Шаг в день</div>
              <p><strong>Практика</strong> к каждой фразе превращает слова в действие — спокойно и мягко, без перегруза.</p>
            </div>
            <div className="feature">
              <div className="feature-title">Осознанный ритм</div>
              <p>Если листаешь слишком быстро, мы бережно предложим <strong>паузу</strong> с дыханием и телесной опорой.</p>
            </div>
            <div className="feature">
              <div className="feature-title">Личная коллекция</div>
              <p>Добавляй фразы <strong>в избранное</strong> — возвращайся к ним, когда нужно напоминание и поддержка.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How to */}
      <section className="landing-section alt">
        <div className="container">
          <h2 className="section-title">Как пользоваться</h2>
          <div className="steps">
            <div className="step"><span className="num">1</span><div><strong>Выбери раздел.</strong> Сверху — короткие названия, в карточке — полные.</div></div>
            <div className="step"><span className="num">2</span><div><strong>Прочитай и почувствуй.</strong> Смысл + расшифровка — это твой новый фокус внимания.</div></div>
            <div className="step"><span className="num">3</span><div><strong>Сделай практику.</strong> Один небольшой шаг закрепляет изменения в реальности.</div></div>
            <div className="step"><span className="num">4</span><div><strong>Продолжай в своём темпе.</strong> «Следующая» после завершения шага. Иногда — осознанная пауза.</div></div>
          </div>
        </div>
      </section>

      {/* Deep dive */}
      <section className="landing-section">
        <div className="container">
          <h2 className="section-title">Почему аффирмации работают</h2>
          <div className="deep">
            <div className="card">
              <p>
                Аффирмации — короткие утверждения в настоящем времени. Регулярно возвращая внимание к выбранной формулировке, 
                мы перенастраиваем внутренний диалог и поддерживаем новые паттерны поведения. Меньше шума — больше ясности.
              </p>
              <p style={{ marginBottom: 0 }}>
                В нашем подходе смысл не остаётся «на словах»: <strong>расшифровка</strong> поясняет, что происходит внутри, 
                а <strong>практика</strong> переводит это в действие и ощущение в теле.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="landing-cta">
        <div className="container">
          <h2 className="cta-title">Спасибо, что присоединился(ась) 🌟</h2>
          <p className="cta-sub">Любая поддержка помогает нам развиваться: новые категории, тексты и удобные функции.</p>
          <div className="actions">
            <Link className="action action-primary" to="/">Перейти к практике</Link>
            <button className="action action-secondary" type="button" onClick={() => setDonateOpen(true)}>Поддержать проект</button>
          </div>
        </div>
      </section>
      <DonateModal open={donateOpen} onClose={() => setDonateOpen(false)} qrSrc="/qr.svg" />
    </div>
  );
}
