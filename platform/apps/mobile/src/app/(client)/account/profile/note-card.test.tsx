import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { updateProfilePreferences } from '@/lib/api/identity';
import { EMPTY_SAVED_NOTE_MESSAGE, NOTE_LIMIT_MESSAGE } from './note';
import { NoteCard } from './note-card';
import { useNoteDraft } from './use-note-draft';

jest.mock('@/lib/api/identity', () => ({
  updateProfilePreferences: jest.fn(),
}));

const updatePreferences = updateProfilePreferences as jest.Mock;

function NoteCardHarness({ stored }: { stored: readonly string[] }) {
  return <NoteCard draft={useNoteDraft(stored)} />;
}

describe('NoteCard (T-4721c)', () => {
  beforeEach(() => updatePreferences.mockReset());

  it('shows the stored note and the hint', () => {
    const { getByText, getByDisplayValue } = render(<NoteCardHarness stored={['без парфумів']} />);

    expect(getByDisplayValue('без парфумів')).toBeTruthy();
    expect(getByText('Цей текст побачить ваш майстер перед візитом')).toBeTruthy();
  });

  it('does not send a note over the limit', () => {
    const { getByTestId, getByLabelText, getByText } = render(<NoteCardHarness stored={[]} />);

    fireEvent.changeText(getByTestId('profile-note-input'), Array(21).fill('рядок').join('\n'));
    fireEvent.press(getByLabelText('Зберегти нотатку'));

    expect(getByText(NOTE_LIMIT_MESSAGE)).toBeTruthy();
    expect(updatePreferences).not.toHaveBeenCalled();
  });

  it('saves trimmed lines', async () => {
    updatePreferences.mockResolvedValue(['коротше з боків']);
    const { getByTestId, getByLabelText } = render(<NoteCardHarness stored={[]} />);

    fireEvent.changeText(getByTestId('profile-note-input'), '  коротше з боків  ');
    fireEvent.press(getByLabelText('Зберегти нотатку'));

    await waitFor(() => expect(updatePreferences).toHaveBeenCalledWith(['коротше з боків']));
  });

  it('shows the empty sentence when nothing is saved', () => {
    const { getByText } = render(<NoteCardHarness stored={[]} />);

    expect(getByText(EMPTY_SAVED_NOTE_MESSAGE)).toBeTruthy();
  });

  it('keeps the quote on the saved note while the client types', () => {
    const { getByTestId, getByText } = render(<NoteCardHarness stored={['без парфумів']} />);

    fireEvent.changeText(getByTestId('profile-note-input'), 'нове побажання');

    expect(getByText('без парфумів')).toBeTruthy();
  });
});
