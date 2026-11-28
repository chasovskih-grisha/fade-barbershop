const mockNotifications = {
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  IosAuthorizationStatus: { DENIED: 0 },
};

export const __mocks__ = mockNotifications;
export default mockNotifications;

// Тут ми не можемо використовувати `jest.mock` на рівні модуля, бо він
// імпортується різними тестами. Натомість, кожен тест, який потрібну
// підмінити `expo-notifications`, робить це явно.
