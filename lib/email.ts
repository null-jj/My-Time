import { Resend } from "resend";
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
export async function sendInvitationEmail({
  to,
  organizationName,
  inviterName,
  inviteUrl,
}: {
  to: string;
  organizationName: string;
  inviterName: string;
  inviteUrl: string;
}) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: "DTR <noreply@dtr.allgo.cloud>", // Update this with your verified domain
      to: [to],
      subject: `You've been invited to join ${organizationName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; margin-bottom: 20px;">You've been invited!</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            <strong>${escapeHtml(inviterName)}</strong> has invited you to join the organization
            <strong>${escapeHtml(organizationName)}</strong> on DTR (Daily Time Record).
          </p>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
            DTR helps teams track time, manage projects, and stay organized. 
            Click the button below to accept the invitation and get started.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block; 
                      font-weight: bold;">
              Accept Invitation
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            If the button doesn't work, you can copy and paste this link into your browser:<br>
            <a href="${inviteUrl}" style="color: #007bff;">${inviteUrl}</a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px;">
            This invitation was sent from DTR. If you didn't expect this email, 
            you can safely ignore it.
          </p>
        </div>
      `,
    });
    if (error) {
      console.error("Error sending invitation email:", error);
      throw new Error("Failed to send invitation email");
    }
    return data;
  } catch (error) {
    console.error("Error sending invitation email:", error);
    throw new Error("Failed to send invitation email");
  }
}
