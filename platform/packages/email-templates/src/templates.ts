export const emailTemplates = {
  appointmentConfirmation: {
    subject: "Appointment Confirmed: {{serviceName}} with {{barberName}}",
    html: `
      <h2>Hi {{customerName}},</h2>
      <p>Your appointment has been successfully confirmed. We are eagerly looking forward to welcoming you to {{brandName}} for your grooming session.</p>
      
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="card">
        <tr>
          <td>
            <div class="card-item"><span class="card-label">Service</span> <span class="card-value"><strong>{{serviceName}}</strong></span></div>
            <div class="card-item"><span class="card-label">Barber</span> <span class="card-value">{{barberName}}</span></div>
            <div class="card-item"><span class="card-label">Date &amp; Time</span> <span class="card-value">{{appointmentDate}} at {{appointmentTime}}</span></div>
            <div class="card-item"><span class="card-label">Location</span> <span class="card-value">{{locationName}}</span></div>
            <div class="card-item"><span class="card-label">Address</span> <span class="card-value">{{locationAddress}}</span></div>
            {% if totalAmount %}
            <div class="divider" style="margin: 16px 0;"></div>
            <div class="card-item"><span class="card-label">Total Amount</span> <span class="card-value" style="color: #2563eb; font-weight: 700;">{{totalAmount}}</span></div>
            {% endif %}
          </td>
        </tr>
      </table>

      <p>If you need to reschedule or cancel your appointment, please use the button below at least 24 hours in advance.</p>

      <div class="button-container">
        <a href="{{manageUrl}}" class="btn">Manage Appointment</a>
      </div>
      
      <p style="font-size: 14px; color: #64748b; margin-top: 24px; text-align: center;">Please arrive 5 minutes prior to your scheduled slot. Complimentary beverages are available upon arrival.</p>
    `
  },

  appointmentReminder: {
    subject: "Reminder: Upcoming Appointment Tomorrow at {{appointmentTime}}",
    html: `
      <h2>Hello {{customerName}},</h2>
      <p>This is a friendly reminder that you have an upcoming grooming appointment at {{brandName}} tomorrow.</p>
      
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="card">
        <tr>
          <td>
            <div class="card-item"><span class="card-label">Service</span> <span class="card-value"><strong>{{serviceName}}</strong></span></div>
            <div class="card-item"><span class="card-label">Barber</span> <span class="card-value">{{barberName}}</span></div>
            <div class="card-item"><span class="card-label">Time</span> <span class="card-value">{{appointmentDate}} at {{appointmentTime}}</span></div>
            <div class="card-item"><span class="card-label">Location</span> <span class="card-value">{{locationName}}</span></div>
          </td>
        </tr>
      </table>

      <p>Please arrive 5 minutes prior to your scheduled time so your barber can prepare your station. See you soon!</p>

      <div class="button-container">
        <a href="{{manageUrl}}" class="btn">View Appointment Details</a>
      </div>
    `
  },

  cancellationNotice: {
    subject: "Appointment Cancelled: {{serviceName}}",
    html: `
      <h2>Hello {{customerName}},</h2>
      <p>Your appointment for <strong>{{serviceName}}</strong> on {{appointmentDate}} has been successfully cancelled as requested.</p>
      
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="card">
        <tr>
          <td>
            <div class="card-item"><span class="card-label">Cancelled Service</span> <span class="card-value">{{serviceName}}</span></div>
            <div class="card-item"><span class="card-label">Original Time</span> <span class="card-value">{{appointmentDate}} at {{appointmentTime}}</span></div>
            <div class="card-item"><span class="card-label">Reason</span> <span class="card-value">{{cancellationReason | default: "Requested by client"}}</span></div>
          </td>
        </tr>
      </table>

      <p>We would love to serve you again in the future. You can book a new appointment anytime using the link below.</p>

      <div class="button-container">
        <a href="{{bookUrl}}" class="btn">Book New Appointment</a>
      </div>
    `
  },

  membershipWelcome: {
    subject: "Welcome to {{tierName}} Membership! 🎉",
    html: `
      <h2>Welcome aboard, {{customerName}}!</h2>
      <p>Thank you for joining the <strong>{{tierName}} Membership</strong> at {{brandName}}. Your exclusive perks, priority booking, and VIP privileges are now fully active.</p>
      
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="card">
        <tr>
          <td>
            <div class="card-item"><span class="card-label">Membership Tier</span> <span class="card-value"><span class="badge">{{tierName}}</span></span></div>
            <div class="card-item"><span class="card-label">Monthly Investment</span> <span class="card-value">{{monthlyPrice}}</span></div>
            <div class="card-item"><span class="card-label">Next Renewal</span> <span class="card-value">{{renewalDate}}</span></div>
          </td>
        </tr>
      </table>

      <p>Enjoy your unlimited grooming sessions, priority scheduling, and complimentary top-shelf beverage bar on every single visit.</p>

      <div class="button-container">
        <a href="{{portalUrl}}" class="btn">Access Member Portal</a>
      </div>
    `
  },

  passwordReset: {
    subject: "Reset Your {{brandName}} Password",
    html: `
      <h2>Password Reset Request</h2>
      <p>Hi {{customerName}}, we received a request to reset the password associated with your {{brandName}} account.</p>
      
      <p>Click the secure button below to choose a new password. For your security, this link is valid for exactly <strong>60 minutes</strong>.</p>

      <div class="button-container">
        <a href="{{resetUrl}}" class="btn">Reset Password</a>
      </div>

      <p style="font-size: 14px; color: #64748b; background-color: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0;">If you didn't request this change, you can safely ignore this email. Your account remains secure and no changes were made.</p>
    `
  },

  giftCardReceipt: {
    subject: "Your {{brandName}} Gift Card is Here! 🎁",
    html: `
      <h2>Your Gift Card Purchase</h2>
      <p>Hi {{customerName}}, thank you for purchasing a gift card from {{brandName}}! Here are your complete redemption details:</p>
      
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="card" style="text-align: center; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);">
        <tr>
          <td style="padding: 10px;">
            <p style="font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 8px;">Gift Card Code</p>
            <p style="font-size: 24px; font-weight: 800; color: #2563eb; letter-spacing: 2px; margin: 0 0 16px 0;">{{giftCardCode}}</p>
            <div class="divider" style="margin: 12px 0;"></div>
            <div style="display: flex; justify-content: space-around; margin-top: 12px;">
              <span style="font-size: 14px; color: #334155;"><strong>Value:</strong> {{giftCardAmount}}</span>
              <span style="font-size: 14px; color: #334155;"><strong>For:</strong> {{recipientName}}</span>
            </div>
            {% if recipientMessage %}
            <p style="font-style: italic; color: #475569; margin-top: 16px; font-size: 14px;">"{{recipientMessage}}"</p>
            {% endif %}
          </td>
        </tr>
      </table>

      <p>The recipient can redeem this unique code online during checkout or present it directly in-store at any {{brandName}} location for services or retail products.</p>

      <div class="button-container">
        <a href="{{redeemUrl}}" class="btn">View Gift Card &amp; Balance</a>
      </div>
    `
  },

  /* --- NEW ENHANCED TEMPLATES --- */

  appointmentFeedback: {
    subject: "How was your experience at {{brandName}}?",
    html: `
      <h2>How was your cut, {{customerName}}?</h2>
      <p>We hope you love your fresh look by <strong>{{barberName}}</strong>! At {{brandName}}, we strive for perfection on every visit.</p>
      
      <p>Could you take 30 seconds to rate your recent appointment and let us know how we did?</p>

      <div class="button-container">
        <a href="{{feedbackUrl}}" class="btn">Rate Your Experience</a>
      </div>

      <p style="font-size: 14px; color: #64748b; text-align: center;">Your feedback directly helps us maintain our high standards of craftsmanship.</p>
    `
  },

  loyaltyMilestone: {
    subject: "Congratulations! You've unlocked a Reward 🎉",
    html: `
      <h2>Milestone Reached, {{customerName}}!</h2>
      <p>Thank you for being such a loyal client of {{brandName}}. You have just reached <strong>{{loyaltyPoints}} loyalty points</strong>!</p>
      
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="card">
        <tr>
          <td>
            <div class="card-item"><span class="card-label">Current Status</span> <span class="card-value"><span class="badge">VIP Tier</span></span></div>
            <div class="card-item"><span class="card-label">Unlocked Reward</span> <span class="card-value" style="color: #2563eb; font-weight: 700;">{{rewardTitle}}</span></div>
            <div class="card-item"><span class="card-label">Valid Until</span> <span class="card-value">{{expiryDate}}</span></div>
          </td>
        </tr>
      </table>

      <p>Claim your complimentary reward on your next visit by showing this email to your barber or receptionist.</p>

      <div class="button-container">
        <a href="{{rewardsUrl}}" class="btn">View Rewards Wallet</a>
      </div>
    `
  },

  accountVerification: {
    subject: "Verify your email address for {{brandName}}",
    html: `
      <h2>Verify Your Account</h2>
      <p>Hi {{customerName}}, welcome to {{brandName}}! Please verify your email address to secure your account and start booking appointments seamlessly.</p>

      <div class="button-container">
        <a href="{{verificationUrl}}" class="btn">Verify Email Address</a>
      </div>

      <p style="font-size: 14px; color: #64748b;">If you did not create an account with {{brandName}}, please disregard this email.</p>
    `
  },

  staffTipReceipt: {
    subject: "Tip Receipt for your visit with {{barberName}}",
    html: `
      <h2>Tip Confirmation</h2>
      <p>Hi {{customerName}}, thank you for taking care of your barber! Your gratuity tip has been successfully processed.</p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="card">
        <tr>
          <td>
            <div class="card-item"><span class="card-label">Barber</span> <span class="card-value">{{barberName}}</span></div>
            <div class="card-item"><span class="card-label">Service Date</span> <span class="card-value">{{appointmentDate}}</span></div>
            <div class="card-item"><span class="card-label">Tip Amount</span> <span class="card-value" style="color: #16a34a; font-weight: 700;">{{tipAmount}}</span></div>
          </td>
        </tr>
      </table>

      <p style="font-size: 14px; color: #64748b; text-align: center;">100% of tips go directly to your service provider.</p>
    `
  }
};
