import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AIStylingConcierge } from '../AIStylingConcierge';

describe('AIStylingConcierge Component', () => {
  it('renders initial questionnaire step correctly', () => {
    render(<AIStylingConcierge />);
    expect(screen.getByText(/FADE AI • Інтелектуальний Консьєрж Стилю/i)).toBeInTheDocument();
    expect(screen.getByText(/Оберіть форму вашого обличчя/i)).toBeInTheDocument();
    expect(screen.getByText(/Овальне/i)).toBeInTheDocument();
    expect(screen.getByText(/Квадратне/i)).toBeInTheDocument();
  });

  it('allows selecting face shape and running analysis to show recommendations', async () => {
    render(<AIStylingConcierge />);

    // Select square face shape
    const squareBtn = screen.getByText(/Квадратне/i);
    fireEvent.click(squareBtn);

    // Click analyze button
    const analyzeBtn = screen.getByText(/Запустити FADE AI Консьєрж/i);
    fireEvent.click(analyzeBtn);

    // Should show loading state
    expect(screen.getByText(/Аналізуємо пропорції та тренди/i)).toBeInTheDocument();

    // Wait for recommendation step
    await waitFor(
      () => {
        expect(screen.getByText(/Аналіз успішно завершено/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    expect(screen.getAllByText(/High Skin Fade & Hard Part/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Записатись на цей образ →/i)).toBeInTheDocument();
  });
});
