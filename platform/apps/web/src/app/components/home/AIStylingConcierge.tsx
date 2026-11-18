'use client';

import { useState } from 'react';
import Link from 'next/link';

interface HairProfile {
  faceShape: 'oval' | 'square' | 'round' | 'heart' | 'diamond';
  hairType: 'straight' | 'wavy' | 'curly' | 'coily';
  lifestyle: 'business' | 'casual' | 'active' | 'creative';
  beardGoal: 'clean' | 'stubble' | 'full' | 'faded';
}

interface Recommendation {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  matchScore: number;
  price: number;
  duration: number;
  recommendedBarber: string;
  benefits: string[];
}

const STYLE_PRESETS: Record<HairProfile['faceShape'], Recommendation[]> = {
  oval: [
    {
      id: 'crop-textured',
      name: 'Modern Textured Crop & Low Fade',
      subtitle: 'Ідеально підкреслює пропорції овального обличчя',
      description: 'Текстурний верх з акцентом на природний обʼєм та плавний перехід на скронях.',
      matchScore: 98,
      price: 650,
      duration: 45,
      recommendedBarber: 'Максим Воронов (Master Barber)',
      benefits: ['Не потребує складної щоденної укладки', 'Візуально збалансовані лінії', 'Свіжий та сучасний вигляд']
    },
    {
      id: 'executive-pompadour',
      name: 'Executive Pompadour & Beard Trim',
      subtitle: 'Класика з сучасним шармом',
      description: 'Елегантна зачесана назад форма з чистими контурами та доглянутою бородою.',
      matchScore: 94,
      price: 950,
      duration: 60,
      recommendedBarber: 'Артем Шевченко (Top Stylist)',
      benefits: ['Бездоганний діловий стиль', 'Включає ритуал гарячого рушника', 'Преміальні стайлінг-продукти']
    }
  ],
  square: [
    {
      id: 'skin-fade-sharp',
      name: 'High Skin Fade & Hard Part',
      subtitle: 'Підкреслює сильну лінію щелепи',
      description: 'Високий контрастний перехід з чітко виділеним проділом та графітовим контуром.',
      matchScore: 99,
      price: 600,
      duration: 45,
      recommendedBarber: 'Денис Коваленко (Fade Specialist)',
      benefits: ['Максимально мускулистої форми', 'Ідеальні кути та геометрія', 'Стійкість форми до 3 тижнів']
    }
  ],
  round: [
    {
      id: 'volume-top-fade',
      name: 'High Volume Quiff & Mid Fade',
      subtitle: 'Візуально витягує форму обличчя',
      description: 'Акцент на обʼєм у верхній частині з короткими скронями для гармонійного силуету.',
      matchScore: 96,
      price: 650,
      duration: 45,
      recommendedBarber: 'Максим Воронов (Master Barber)',
      benefits: ['Візуально стрункіший силует', 'Легкий контроль обʼєму', 'Чудово пасує під щоденний кежуал']
    }
  ],
  heart: [
    {
      id: 'textured-fringe',
      name: 'Soft Fringe & Balanced Beard',
      subtitle: 'Збалансовує вузький підборіддя',
      description: 'Мʼяка текстурна стрижка з акцентом на середню довжину та густу бороду для повноти.',
      matchScore: 95,
      price: 700,
      duration: 50,
      recommendedBarber: 'Артем Шевченко (Top Stylist)',
      benefits: ['Гармонізація пропорцій', 'Природна рухливість волосся', 'Комплексний догляд за бородою']
    }
  ],
  diamond: [
    {
      id: 'side-sweep-fade',
      name: 'Side Swept Undercut & Taper',
      subtitle: 'Помʼякшує вилиці та додає балансу',
      description: 'Асиметричний напрямок пасм з акуратним звуженням на потилиці та скронях.',
      matchScore: 97,
      price: 650,
      duration: 45,
      recommendedBarber: 'Денис Коваленко (Fade Specialist)',
      benefits: ['Маскування широких вилиць', 'Стильний асиметричний акцент', 'Легкість трансформації у класику']
    }
  ]
};

export function AIStylingConcierge() {
  const [step, setStep] = useState<number>(1);
  const [profile, setProfile] = useState<HairProfile>({
    faceShape: 'oval',
    hairType: 'straight',
    lifestyle: 'business',
    beardGoal: 'stubble',
  });
  const [selectedStyleId, setSelectedStyleId] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const handleSelectShape = (shape: HairProfile['faceShape']) => {
    setProfile(prev => ({ ...prev, faceShape: shape }));
  };

  const handleSelectLifestyle = (life: HairProfile['lifestyle']) => {
    setProfile(prev => ({ ...prev, lifestyle: life }));
  };

  const handleRunAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setStep(2);
      const recs = (STYLE_PRESETS[profile.faceShape] || STYLE_PRESETS.oval) as Recommendation[];
      const first = recs[0];
      if (first) {
        setSelectedStyleId(first.id);
      }
    }, 1200);
  };

  const currentRecs = (STYLE_PRESETS[profile.faceShape] || STYLE_PRESETS.oval) as Recommendation[];
  const activeRecommendation = (currentRecs && currentRecs.length > 0 
    ? currentRecs.find(r => r.id === selectedStyleId) || currentRecs[0] 
    : STYLE_PRESETS.oval[0])!;

  return (
    <section className="relative overflow-hidden rounded-[var(--radius-card)] bg-surface-raised border border-line p-8 md:p-14 shadow-2xl my-8">
      {/* Glow effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent-blue/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-semantic-warning/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 rounded-pill bg-semantic-warning/10 border border-semantic-warning/30 px-4 py-1.5 text-caption font-semibold uppercase tracking-wider text-semantic-warning">
            ✨ FADE AI • Інтелектуальний Консьєрж Стилю
          </div>
          <h2 className="font-display text-h3 md:text-h2 font-bold text-fg">
            Підберіть свій ідеальний образ за допомогою AI
          </h2>
          <p className="text-body text-fg-secondary max-w-xl mx-auto">
            Наша нейромережа аналізує геометрію обличчя, тип волосся та стиль життя, щоб порекомендувати бездоганну стрижку та майстра.
          </p>
        </div>

        {step === 1 && (
          <div className="space-y-8 bg-surface-sunken/50 p-6 md:p-10 rounded-card border border-line">
            {/* Step 1: Face Shape */}
            <div>
              <label className="block text-sm font-semibold text-fg mb-3">
                1. Оберіть форму вашого обличчя:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { id: 'oval', label: 'Овальне', icon: '🥚' },
                  { id: 'square', label: 'Квадратне', icon: '🧊' },
                  { id: 'round', label: 'Кругле', icon: '⚽' },
                  { id: 'heart', label: 'Серце', icon: '💎' },
                  { id: 'diamond', label: 'Ромб', icon: '🔷' },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectShape(item.id as HairProfile['faceShape'])}
                    className={`flex flex-col items-center justify-center p-4 rounded-card border transition-all ${
                      profile.faceShape === item.id
                        ? 'bg-accent-blue text-white border-accent-blue shadow-lg shadow-accent-blue/25 scale-[1.02]'
                        : 'bg-surface border-line text-fg hover:border-accent-blue/50'
                    }`}
                  >
                    <span className="text-2xl mb-1">{item.icon}</span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Lifestyle */}
            <div>
              <label className="block text-sm font-semibold text-fg mb-3">
                2. Ваш темп та стиль життя:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'business', label: 'Діловий / Formal', desc: 'Строгий та елегантний' },
                  { id: 'casual', label: 'Кежуал / Smart', desc: 'Універсальний та зручний' },
                  { id: 'active', label: 'Активний / Sport', desc: 'Мінімум догляду' },
                  { id: 'creative', label: 'Креативний / Trend', desc: 'Яскрава індивідуальність' },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectLifestyle(item.id as HairProfile['lifestyle'])}
                    className={`p-4 rounded-card border text-left transition-all ${
                      profile.lifestyle === item.id
                        ? 'bg-semantic-warning/15 border-accent-gold text-fg shadow-md'
                        : 'bg-surface border-line text-fg-secondary hover:text-fg hover:border-line-hover'
                    }`}
                  >
                    <div className="font-semibold text-sm text-fg mb-1">{item.label}</div>
                    <div className="text-xs opacity-85">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4 text-center">
              <button
                onClick={handleRunAnalysis}
                disabled={isAnalyzing}
                className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-fg text-surface font-semibold text-body hover:bg-fg/90 transition-all shadow-xl disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-surface" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Аналізуємо пропорції та тренди...
                  </>
                ) : (
                  <>
                    ✨ Запустити FADE AI Консьєрж
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <div className="bg-surface-sunken/60 p-6 md:p-8 rounded-card border border-line flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 text-semantic-warning text-xs font-semibold uppercase tracking-wider mb-2">
                  ✓ Аналіз успішно завершено (Збіг: {activeRecommendation.matchScore}%)
                </div>
                <h3 className="font-display text-h3 font-bold text-fg">
                  {activeRecommendation.name}
                </h3>
                <p className="text-body-sm text-fg-secondary mt-1">
                  {activeRecommendation.description}
                </p>
              </div>

              <div className="flex items-center gap-4 bg-surface p-4 rounded-card border border-line shrink-0">
                <div>
                  <div className="text-caption text-fg-secondary">Вартість / Час</div>
                  <div className="font-display font-bold text-h4 text-fg">{activeRecommendation.price} ₴</div>
                  <div className="text-xs text-accent-blue">{activeRecommendation.duration} хв</div>
                </div>
                <Link
                  href={`/booking?style=${activeRecommendation.id}&barber=${encodeURIComponent(activeRecommendation.recommendedBarber)}`}
                  className="px-6 py-3 rounded-card bg-accent-blue text-white font-semibold text-sm hover:bg-accent-blue/90 shadow-lg shadow-accent-blue/25 transition-all text-center"
                >
                  Записатись на цей образ →
                </Link>
              </div>
            </div>

            {/* Recommendations selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentRecs.map(rec => (
                <div
                  key={rec.id}
                  onClick={() => setSelectedStyleId(rec.id)}
                  className={`p-5 rounded-card border cursor-pointer transition-all ${
                    selectedStyleId === rec.id
                      ? 'bg-surface-raised border-accent-blue shadow-lg ring-1 ring-accent-blue/30'
                      : 'bg-surface border-line hover:border-line-hover opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-pill bg-accent-blue/10 text-accent-blue">
                      {rec.matchScore}% Збіг
                    </span>
                    <span className="font-bold text-fg">{rec.price} ₴</span>
                  </div>
                  <h4 className="font-display font-bold text-fg mb-1">{rec.name}</h4>
                  <p className="text-xs text-fg-secondary mb-3">{rec.subtitle}</p>
                  <div className="text-xs font-medium text-semantic-warning mb-3">
                    Рекомендований майстер: {rec.recommendedBarber}
                  </div>
                  <ul className="space-y-1.5 text-xs text-fg-secondary">
                    {rec.benefits.map((b, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="text-accent-blue">✓</span> {b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="text-center pt-4">
              <button
                onClick={() => setStep(1)}
                className="text-sm font-medium text-fg-secondary hover:text-fg underline transition-all"
              >
                ← Змінити параметри аналізу обличчя
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
