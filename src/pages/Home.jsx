// Plain React page without UI libs

const categories = [
  { key: 'love', label: 'Любовь и отношения ❤️' },
  { key: 'money', label: 'Деньги и изобилие 💰' },
  { key: 'health', label: 'Здоровье и гармония 🌿' },
  { key: 'confidence', label: 'Уверенность и сила 💪' },
  { key: 'calm', label: 'Спокойствие и расслабление 🕊️' },
  { key: 'growth', label: 'Саморазвитие и цели 🚀' },
  { key: 'feminine', label: 'Женская энергия 🌸' },
];

export default function Home() {
  return (
    <div>
      <h1 style={{ marginBottom: 16 }}>Главная</h1>
      <p className="muted" style={{ marginBottom: 16 }}>Выбери категорию аффирмаций:</p>
      <div className="chips">
        {categories.map((c) => (
          <span key={c.key} className="chip">{c.label}</span>
        ))}
      </div>
      <div className="card placeholder" style={{ marginTop: 24 }}>
        <p>Карточка аффирмации появится здесь (дальше сделаем).</p>
      </div>
    </div>
  );
}
