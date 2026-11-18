import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import StaffScheduleOvertimeGuard from './StaffScheduleOvertimeGuard';

describe('StaffScheduleOvertimeGuard', () => {
  it('renders total hours and blocks submission when weekly hours exceed max limit', async () => {
    const handleSave = jest.fn().mockResolvedValue(true);
    // 6 days of 10 hours = 60 hours (> 40 max limit)
    const heavyShifts = [
      { dayOfWeek: 0, startTime: '08:00', endTime: '18:00' },
      { dayOfWeek: 1, startTime: '08:00', endTime: '18:00' },
      { dayOfWeek: 2, startTime: '08:00', endTime: '18:00' },
      { dayOfWeek: 3, startTime: '08:00', endTime: '18:00' },
      { dayOfWeek: 4, startTime: '08:00', endTime: '18:00' },
      { dayOfWeek: 5, startTime: '08:00', endTime: '18:00' },
    ];

    render(
      <StaffScheduleOvertimeGuard
        barberId="barber-1"
        barberName="Олександр Шевченко"
        maxWeeklyHours={40}
        initialShifts={heavyShifts}
        onSaveSchedule={handleSave}
      />
    );

    expect(screen.getByText(/Всього: 60.0 \/ 40 год/)).toBeInTheDocument();
    expect(screen.getByText(/⚠️ Перевищення ліміту овертайму/)).toBeInTheDocument();

    const saveButton = screen.getByRole('button', { name: 'Блоковано (Овертайм)' });
    expect(saveButton).toBeDisabled();

    // Attempting submit should show warning
    fireEvent.click(saveButton);
    expect(handleSave).not.toHaveBeenCalled();
  });

  it('allows saving when total hours are within max limit', async () => {
    const handleSave = jest.fn().mockResolvedValue(true);
    // 3 days of 8 hours = 24 hours (<= 40 max limit)
    const normalShifts = [
      { dayOfWeek: 0, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
    ];

    render(
      <StaffScheduleOvertimeGuard
        barberId="barber-1"
        barberName="Олександр Шевченко"
        maxWeeklyHours={40}
        initialShifts={normalShifts}
        onSaveSchedule={handleSave}
      />
    );

    expect(screen.getByText(/Всього: 24.0 \/ 40 год/)).toBeInTheDocument();

    const saveButton = screen.getByRole('button', { name: 'Зберегти захищений графік' });
    expect(saveButton).not.toBeDisabled();

    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledWith(normalShifts);
      expect(screen.getByText('Графік та ліміти робочих годин успішно збережено')).toBeInTheDocument();
    });
  });
});
