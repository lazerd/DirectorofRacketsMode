import { Resend } from 'resend';
import type { Slot, Client, Coach, Club, SlotForBlast } from '@/types/database';
import { formatInTimeZone } from 'date-fns-tz';

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.EMAIL_FROM || 'notifications@directorofrackets.app';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Format time for emails
function formatSlotTime(startTime: string, endTime: string, timezone: string): string {
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  const dateStr = formatInTimeZone(start, timezone, 'EEEE, MMMM d, yyyy');
  const startStr = formatInTimeZone(start, timezone, 'h:mm a');
  const endStr = formatInTimeZone(end, timezone, 'h:mm a');
  const tzStr = formatInTimeZone(start, timezone, 'zzz');
  
  return `${dateStr} from ${startStr} to ${endStr} (${tzStr})`;
}

function formatSlotTimeShort(startTime: string, endTime: string, timezone: string): string {
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  const dateStr = formatInTimeZone(start, timezone, 'EEE, MMM d');
  const startStr = formatInTimeZone(start, timezone, 'h:mm a');
  const endStr = formatInTimeZone(end, timezone, 'h:mm a');
  
  return `${dateStr} • ${startStr} - ${endStr}`;
}

// ============================================
// COACH BLAST EMAIL
// Sends ONE email per client with all available slots from that coach
// ============================================
export async function sendCoachBlastEmail(
  client: Client,
  coach: Coach,
  slots: SlotForBlast[]
): Promise<EmailResult> {
  if (slots.length === 0) {
    return { success: false, error: 'No slots to send' };
  }

  const timezone = coach.timezone || 'America/New_York';
  
  // Build slots list HTML
  const slotsHtml = slots.map(slot => {
    const claimUrl = `${APP_URL}/claim?slot=${slot.id}&token=${slot.claim_token}&email=${encodeURIComponent(client.email)}`;
    const timeFormatted = formatSlotTimeShort(slot.start_time, slot.end_time, timezone);
    
    return `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
          <div style="font-weight: 600; color: #1a1a1a;">${timeFormatted}</div>
          ${slot.note ? `<div style="font-size: 13px; color: #666; margin-top: 4px;">${slot.note}</div>` : ''}
          <a href="${claimUrl}" style="display: inline-block; margin-top: 8px; padding: 8px 16px; background: #0066cc; color: white; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 500;">Claim This Slot</a>
        </td>
      </tr>
    `;
  }).join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; }
    .container { background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { text-align: center; margin-bottom: 24px; }
    .logo { font-size: 24px; font-weight: 700; color: #0066cc; margin-bottom: 8px; }
    h1 { font-size: 22px; margin: 0 0 16px 0; color: #1a1a1a; }
    .urgent { background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 12px; margin: 16px 0; font-size: 14px; color: #856404; }
    .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🎾 Director of Rackets</div>
    </div>
    
    <h1>Hi ${client.name}! ${coach.name} has ${slots.length} open slot${slots.length > 1 ? 's' : ''}!</h1>
    
    <p>Great news! The following lesson times are available for booking:</p>
    
    <div class="urgent">
      ⚡ <strong>First come, first served!</strong> Click to claim before someone else does.
    </div>
    
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      ${slotsHtml}
    </table>
    
    <div class="footer">
      <p>This email was sent by Director of Rackets on behalf of ${coach.name}.</p>
      <p>You received this because you're on ${coach.name}'s client list.</p>
    </div>
  </div>
</body>
</html>
`;

  const slotsText = slots.map(slot => {
    const claimUrl = `${APP_URL}/claim?slot=${slot.id}&token=${slot.claim_token}&email=${encodeURIComponent(client.email)}`;
    const timeFormatted = formatSlotTimeShort(slot.start_time, slot.end_time, timezone);
    return `📅 ${timeFormatted}${slot.note ? ` - ${slot.note}` : ''}\n   Claim: ${claimUrl}`;
  }).join('\n\n');

  const text = `
Hi ${client.name}!

${coach.name} has ${slots.length} open slot${slots.length > 1 ? 's' : ''} available!

⚡ First come, first served!

${slotsText}

---
This email was sent by Director of Rackets on behalf of ${coach.name}.
`;

  try {
    if (!resend) {
      console.warn('Resend API key not configured - email not sent');
      return { success: false, error: 'Email service not configured' };
    }

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: client.email,
      subject: `🎾 ${slots.length} Open Slot${slots.length > 1 ? 's' : ''} with ${coach.name} - Claim Now!`,
      html,
      text,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// ============================================
// CLUB BLAST EMAIL
// Sends ONE email per client with all available slots from all coaches in the club
// ============================================
interface ClubSlotForBlast extends SlotForBlast {
  coach_name: string;
}

export async function sendClubBlastEmail(
  client: Client,
  club: Club,
  slots: ClubSlotForBlast[],
  timezone: string = 'America/New_York'
): Promise<EmailResult> {
  if (slots.length === 0) {
    return { success: false, error: 'No slots to send' };
  }

  // Group slots by coach
  const slotsByCoach = slots.reduce((acc, slot) => {
    if (!acc[slot.coach_id]) {
      acc[slot.coach_id] = { coach_name: slot.coach_name, slots: [] };
    }
    acc[slot.coach_id].slots.push(slot);
    return acc;
  }, {} as Record<string, { coach_name: string; slots: ClubSlotForBlast[] }>);

  // Build slots list HTML grouped by coach
  let slotsHtml = '';
  for (const coachData of Object.values(slotsByCoach)) {
    slotsHtml += `
      <tr>
        <td style="padding: 16px 0 8px 0; font-weight: 700; font-size: 16px; color: #0066cc; border-bottom: 2px solid #0066cc;">
          🎾 ${coachData.coach_name}
        </td>
      </tr>
    `;
    
    for (const slot of coachData.slots) {
      const claimUrl = `${APP_URL}/claim?slot=${slot.id}&token=${slot.claim_token}&email=${encodeURIComponent(client.email)}`;
      const timeFormatted = formatSlotTimeShort(slot.start_time, slot.end_time, timezone);
      
      slotsHtml += `
        <tr>
          <td style="padding: 12px 0 12px 16px; border-bottom: 1px solid #eee;">
            <div style="font-weight: 600; color: #1a1a1a;">${timeFormatted}</div>
            ${slot.note ? `<div style="font-size: 13px; color: #666; margin-top: 4px;">${slot.note}</div>` : ''}
            <a href="${claimUrl}" style="display: inline-block; margin-top: 8px; padding: 8px 16px; background: #0066cc; color: white; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 500;">Claim This Slot</a>
          </td>
        </tr>
      `;
    }
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; }
    .container { background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { text-align: center; margin-bottom: 24px; }
    .club-name { font-size: 24px; font-weight: 700; color: #0066cc; margin-bottom: 8px; }
    h1 { font-size: 22px; margin: 0 0 16px 0; color: #1a1a1a; }
    .urgent { background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 12px; margin: 16px 0; font-size: 14px; color: #856404; }
    .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="club-name">🏆 ${club.name}</div>
    </div>
    
    <h1>Hi ${client.name}! ${slots.length} lesson slot${slots.length > 1 ? 's' : ''} just opened up!</h1>
    
    <p>Check out these available times from our coaches:</p>
    
    <div class="urgent">
      ⚡ <strong>First come, first served!</strong> Click to claim before someone else does.
    </div>
    
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      ${slotsHtml}
    </table>
    
    <div class="footer">
      <p>This email was sent by ${club.name} via Director of Rackets.</p>
    </div>
  </div>
</body>
</html>
`;

  // Build text version
  let slotsText = '';
  for (const coachData of Object.values(slotsByCoach)) {
    slotsText += `\n🎾 ${coachData.coach_name}\n`;
    for (const slot of coachData.slots) {
      const claimUrl = `${APP_URL}/claim?slot=${slot.id}&token=${slot.claim_token}&email=${encodeURIComponent(client.email)}`;
      const timeFormatted = formatSlotTimeShort(slot.start_time, slot.end_time, timezone);
      slotsText += `   📅 ${timeFormatted}${slot.note ? ` - ${slot.note}` : ''}\n      Claim: ${claimUrl}\n`;
    }
  }

  const text = `
Hi ${client.name}!

${club.name} has ${slots.length} open lesson slot${slots.length > 1 ? 's' : ''} available!

⚡ First come, first served!
${slotsText}
---
This email was sent by ${club.name} via Director of Rackets.
`;

  try {
    if (!resend) {
      console.warn('Resend API key not configured - email not sent');
      return { success: false, error: 'Email service not configured' };
    }

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: client.email,
      subject: `🏆 ${slots.length} Open Slot${slots.length > 1 ? 's' : ''} at ${club.name} - Claim Now!`,
      html,
      text,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// ============================================
// CONFIRMATION EMAILS (after successful claim)
// ============================================
export async function sendClientConfirmationEmail(
  client: Client,
  slot: Slot,
  coach: Coach
): Promise<EmailResult> {
  const timezone = coach.timezone || 'America/New_York';
  const timeFormatted = formatSlotTime(slot.start_time, slot.end_time, timezone);
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; }
    .container { background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { text-align: center; margin-bottom: 24px; }
    .success-icon { font-size: 48px; margin-bottom: 16px; }
    h1 { font-size: 22px; margin: 0 0 24px 0; color: #28a745; }
    .slot-details { background: #d4edda; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #28a745; }
    .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="success-icon">✅</div>
      <h1>Your Lesson is Confirmed!</h1>
    </div>
    
    <p>Great news, ${client.name}! You've successfully claimed this lesson slot:</p>
    
    <div class="slot-details">
      <div style="font-size: 18px; font-weight: 600; color: #155724;">${timeFormatted}</div>
      <div style="color: #155724; margin-top: 8px;">with ${coach.name}</div>
      ${slot.note ? `<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #28a74550; font-style: italic;">"${slot.note}"</div>` : ''}
    </div>
    
    <p>If you need to cancel or have questions, please contact ${coach.name} directly at <a href="mailto:${coach.email}">${coach.email}</a>.</p>
    
    <div class="footer">
      <p>This confirmation was sent by Director of Rackets.</p>
    </div>
  </div>
</body>
</html>
`;

  const text = `Your Lesson is Confirmed! ✅\n\nGreat news, ${client.name}! You've successfully claimed this lesson slot:\n\n📅 ${timeFormatted}\n👤 with ${coach.name}\n${slot.note ? `📝 Note: "${slot.note}"` : ''}\n\nIf you need to cancel or have questions, contact ${coach.name} at ${coach.email}.`;

  try {
    if (!resend) {
      return { success: false, error: 'Email service not configured' };
    }

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: client.email,
      subject: `✅ Lesson Confirmed with ${coach.name}`,
      html,
      text,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function sendCoachNotificationEmail(
  coach: Coach,
  client: Client,
  slot: Slot
): Promise<EmailResult> {
  const timezone = coach.timezone || 'America/New_York';
  const timeFormatted = formatSlotTime(slot.start_time, slot.end_time, timezone);
  const dashboardUrl = `${APP_URL}/dashboard`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; }
    .container { background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { text-align: center; margin-bottom: 24px; }
    h1 { font-size: 22px; margin: 0 0 24px 0; color: #0066cc; }
    .slot-details { background: #e8f4fd; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #0066cc; }
    .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
      <h1>Your Slot Has Been Claimed!</h1>
    </div>
    
    <p>Good news! Your open lesson slot has been booked:</p>
    
    <div class="slot-details">
      <div style="font-size: 20px; font-weight: 600; color: #0066cc;">${client.name}</div>
      <div style="color: #666; font-size: 14px;">${client.email}</div>
      <div style="font-size: 16px; color: #1a1a1a; margin-top: 12px;">📅 ${timeFormatted}</div>
    </div>
    
    <p>The client has been sent a confirmation email.</p>
    
    <a href="${dashboardUrl}" style="display: inline-block; background: #0066cc; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin: 16px 0;">View Dashboard</a>
    
    <div class="footer">
      <p>This notification was sent by Director of Rackets.</p>
    </div>
  </div>
</body>
</html>
`;

  const text = `Your Slot Has Been Claimed! 🎉\n\nGood news! Your open lesson slot has been booked:\n\n👤 ${client.name} (${client.email})\n📅 ${timeFormatted}\n\nThe client has been sent a confirmation email.\n\nView your dashboard: ${dashboardUrl}`;

  try {
    if (!resend) {
      return { success: false, error: 'Email service not configured' };
    }

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: coach.email,
      subject: `🎉 Slot Claimed by ${client.name}`,
      html,
      text,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
