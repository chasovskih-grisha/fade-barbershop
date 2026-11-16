import { NotificationManager, MockNotificationProvider } from "../src/index";

describe("NotificationManager & Multi-Channel Delivery", () => {
  let manager: NotificationManager;
  let provider: MockNotificationProvider;

  beforeEach(() => {
    provider = new MockNotificationProvider();
    manager = new NotificationManager(provider);
  });

  test("sends templated email successfully", async () => {
    const result = await manager.sendTemplatedEmail(
      "user-1",
      "john@example.com",
      "appointmentConfirmation",
      {
        customerName: "John Doe",
        serviceName: "Fade & Beard Trim",
        barberName: "Marcus",
        appointmentDate: "Nov 20, 2026",
        appointmentTime: "10:00 AM",
        locationName: "Fade Downtown",
        locationAddress: "123 Main St",
        manageUrl: "https://fade.barbershop/manage/123"
      }
    );

    expect(result.success).toBe(true);
    expect(result.channel).toBe("email");
    expect(provider.sentEmails.length).toBe(1);
    expect(provider.sentEmails[0].to).toBe("john@example.com");
    expect(provider.sentEmails[0].subject).toContain("Appointment Confirmed");
    expect(provider.sentEmails[0].html).toContain("John Doe");
  });

  test("sends SMS notification successfully", async () => {
    const result = await manager.sendSMSNotification(
      "user-1",
      "+15550192834",
      "Reminder: Your Fade appointment is tomorrow at 10:00 AM."
    );

    expect(result.success).toBe(true);
    expect(result.channel).toBe("sms");
    expect(provider.sentSMS.length).toBe(1);
    expect(provider.sentSMS[0].to).toBe("+15550192834");
    expect(provider.sentSMS[0].body).toContain("Reminder");
  });

  test("sends push notification successfully", async () => {
    const result = await manager.sendPushNotification(
      "user-1",
      "fcm-token-xyz",
      "Appointment Reminder",
      "Your haircut with Marcus starts in 1 hour.",
      { appointmentId: "apt-789" }
    );

    expect(result.success).toBe(true);
    expect(result.channel).toBe("push");
    expect(provider.sentPush.length).toBe(1);
    expect(provider.sentPush[0].token).toBe("fcm-token-xyz");
    expect(provider.sentPush[0].title).toBe("Appointment Reminder");
    expect(provider.sentPush[0].data?.appointmentId).toBe("apt-789");
  });

  test("respects user preferences for disabling email", async () => {
    manager.setPreferences({
      userId: "user-disabled",
      emailEnabled: false,
      smsEnabled: true,
      pushEnabled: true,
      appointmentReminders: true,
      marketingPromos: true
    });

    const result = await manager.sendTemplatedEmail(
      "user-disabled",
      "disabled@example.com",
      "appointmentConfirmation",
      { customerName: "Jane Doe" }
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("disabled email notifications");
    expect(provider.sentEmails.length).toBe(0);
  });

  test("respects user preferences for disabling marketing SMS", async () => {
    manager.setPreferences({
      userId: "user-nomarketing",
      emailEnabled: true,
      smsEnabled: true,
      pushEnabled: true,
      appointmentReminders: true,
      marketingPromos: false
    });

    const promoResult = await manager.sendSMSNotification(
      "user-nomarketing",
      "+15559998888",
      "Special 20% off all beard trims this weekend!",
      true // isMarketing
    );

    expect(promoResult.success).toBe(false);
    expect(promoResult.error).toContain("disabled marketing promos");
    expect(provider.sentSMS.length).toBe(0);

    const reminderResult = await manager.sendSMSNotification(
      "user-nomarketing",
      "+15559998888",
      "Your appointment is tomorrow at 2 PM.",
      false // isMarketing
    );

    expect(reminderResult.success).toBe(true);
    expect(provider.sentSMS.length).toBe(1);
  });

  test("handles smart multi-channel fallback delivery", async () => {
    manager.setPreferences({
      userId: "user-fallback",
      emailEnabled: true,
      smsEnabled: true,
      pushEnabled: true,
      appointmentReminders: true,
      marketingPromos: true
    });

    // Simulate push failure
    provider.failPushNext = true;

    const result = await manager.sendSmartNotification("user-fallback", [
      { channel: "push", target: "bad-token", payload: { title: "Test", body: "Hello" } },
      { channel: "sms", target: "+15551234567", payload: { body: "Hello via SMS fallback" } }
    ]);

    expect(result.success).toBe(true);
    expect(result.channel).toBe("sms");
    expect(result.fallbackUsed).toBe(true);
    expect(provider.sentSMS.length).toBe(1);
    expect(provider.sentSMS[0].body).toContain("Hello via SMS fallback");
  });

  test("records audit trail for sent and failed notifications", async () => {
    await manager.sendSMSNotification("user-audit", "+15557778888", "Audit test message");
    const audit = manager.getAuditTrail();
    expect(audit.length).toBe(1);
    expect(audit[0].channel).toBe("sms");
    expect(audit[0].success).toBe(true);
    expect(audit[0].recipient).toBe("+15557778888");
  });
});
