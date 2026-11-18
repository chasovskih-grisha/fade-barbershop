// Канонічний шлях до телефонного запису з передобраним клієнтом (T-046,
// admin-screens §6.2). Один споживач у списку CRM, другий — на картці клієнта.
//
// `clientId` — саме `User.id`, не `ClientProfile.id`. `/bookings/phone` резолвить
// картку через `GET /admin/clients/by-user/:userId` і пише той самий id у
// `origin.clientId`, а читачі візитів клієнта (`list-client-appointments`,
// `own-appointment`) шукають записи за `User.id`. Профільний id дав би візит,
// невидимий у кабінеті клієнта — тиху втрату даних (розбір у T-046).
export function phoneBookingPath(client: { userId: string; phone: string }): string {
  const params = new URLSearchParams({ clientId: client.userId, phone: client.phone });
  return `/bookings/phone?${params.toString()}`;
}
