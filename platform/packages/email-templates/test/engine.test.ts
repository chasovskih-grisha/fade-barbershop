import { EmailTemplateEngine } from "../src";

describe("EmailTemplateEngine", () => {
  let engine: EmailTemplateEngine;

  beforeEach(() => {
    engine = new EmailTemplateEngine();
  });

  it("renders appointmentConfirmation template correctly", async () => {
    const result = await engine.render("appointmentConfirmation", {
      customerName: "Alex Mercer",
      serviceName: "Executive Haircut & Beard Trim",
      barberName: "Marcus Vance",
      appointmentDate: "November 20, 2026",
      appointmentTime: "3:00 PM",
      locationName: "Downtown Flagship",
      locationAddress: "123 Grooming Lane, Suite 100",
      manageUrl: "https://fadebarbershop.com/appointments/manage/123"
    });

    expect(result.subject).toContain("Appointment Confirmed");
    expect(result.html).toContain("Alex Mercer");
    expect(result.html).toContain("Executive Haircut & Beard Trim");
    expect(result.html).toContain("Marcus Vance");
    expect(result.html).toContain("Downtown Flagship");
    expect(result.text).toContain("Alex Mercer");
  });

  it("renders membershipWelcome template correctly", async () => {
    const result = await engine.render("membershipWelcome", {
      customerName: "Sarah Connor",
      tierName: "Black Card Elite",
      monthlyPrice: "$120/month",
      renewalDate: "December 15, 2026",
      portalUrl: "https://fadebarbershop.com/portal"
    });

    expect(result.subject).toContain("Welcome to Black Card Elite Membership");
    expect(result.html).toContain("Sarah Connor");
    expect(result.html).toContain("Black Card Elite");
  });

  it("renders new templates correctly", async () => {
    const feedbackResult = await engine.render("appointmentFeedback", {
      customerName: "David",
      barberName: "Marcus",
      feedbackUrl: "https://fadebarbershop.com/feedback"
    });
    expect(feedbackResult.subject).toContain("How was your experience");
    expect(feedbackResult.html).toContain("David");

    const loyaltyResult = await engine.render("loyaltyMilestone", {
      customerName: "Elena",
      loyaltyPoints: "500",
      rewardTitle: "Free Beard Trim & Hot Towel",
      expiryDate: "January 30, 2027",
      rewardsUrl: "https://fadebarbershop.com/rewards"
    });
    expect(loyaltyResult.subject).toContain("Reward");
    expect(loyaltyResult.html).toContain("500");
  });

  it("renders giftCardReceipt template correctly", async () => {
    const result = await engine.render("giftCardReceipt", {
      customerName: "John Doe",
      giftCardCode: "FADE-GIFT-9876",
      giftCardAmount: "$75.00",
      recipientName: "Jane Smith",
      recipientMessage: "Happy Birthday! Enjoy a fresh cut.",
      redeemUrl: "https://fadebarbershop.com/gift/redeem"
    });

    expect(result.subject).toContain("Gift Card");
    expect(result.html).toContain("FADE-GIFT-9876");
    expect(result.html).toContain("$75.00");
    expect(result.html).toContain("Jane Smith");
  });

  it("throws error for non-existent template", async () => {
    await expect(engine.render("nonExistent" as any, {})).rejects.toThrow("Email template 'nonExistent' not found.");
  });
});
