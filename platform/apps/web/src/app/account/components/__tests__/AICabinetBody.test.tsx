import { render, screen } from '@testing-library/react';
import { AICabinetBody } from '../AICabinetBody';

const noop = () => undefined;

function renderCabinet(
  data: {
    photos: { id: string; url: string; consentGranted: boolean; createdAt: string }[];
    generations: {
      id: string;
      sourcePhotoId: string;
      status: 'pending' | 'processing' | 'ready' | 'failed';
      variants: { url: string; objectKey: string; contentType: string }[];
      createdAt: string;
    }[];
    remainingToday: number;
  } | null
) {
  return render(
    <AICabinetBody
      data={data}
      generatingId={null}
      onUpload={noop}
      onGenerate={noop}
      onConsent={noop}
      onDelete={noop}
      onSelectVariant={noop}
    />
  );
}

describe('AICabinetBody', () => {
  it('does not print zero counters when there are no photos or generations', () => {
    const { container } = renderCabinet({
      photos: [],
      generations: [],
      remainingToday: 3,
    });

    expect(screen.getByText('Фото немає')).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/00/);
    expect(screen.queryByText('Ваші генерації')).not.toBeInTheDocument();
  });
});
