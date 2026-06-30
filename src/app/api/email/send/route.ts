import { createServerClient } from "@/core/database/server";
import { NextRequest, NextResponse } from "next/server";

// Template variable replacement function
function replaceTemplateVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    result = result.replace(regex, value || "");
  });
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      templateKey,
      recipientEmail,
      variables = {},
      subject,
      htmlBody,
      entityType,
      entityId,
    } = body;

    if (!recipientEmail) {
      return NextResponse.json(
        { error: "Missing recipient email" },
        { status: 400 }
      );
    }

    let finalSubject = subject;
    let finalHtmlBody = htmlBody;

    // If using a template, fetch and process it
    if (templateKey) {
      const { data: template } = await supabase
        .from("email_templates")
        .select("*")
        .eq("organization_id", userData.organization_id)
        .eq("template_key", templateKey)
        .eq("is_active", true)
        .single();

      if (template) {
        finalSubject = replaceTemplateVariables(template.subject_template, variables);
        finalHtmlBody = replaceTemplateVariables(
          template.body_html_template,
          variables
        );
        // finalTextTemplate would be used for plain text emails if needed
        // const finalTextTemplate = template.body_text_template
        //   ? replaceTemplateVariables(template.body_text_template, variables)
        //   : finalHtmlBody;
      }
    }

    if (!finalSubject || !finalHtmlBody) {
      return NextResponse.json(
        { error: "Missing email content" },
        { status: 400 }
      );
    }

    // Log the email before sending
    const { data: emailLog } = await supabase
      .from("email_logs")
      .insert({
        organization_id: userData.organization_id,
        user_id: user.id,
        recipient_email: recipientEmail,
        template_key: templateKey,
        subject: finalSubject,
        status: "pending",
        metadata: { variables, entityType, entityId },
      })
      .select()
      .single();

    // For now, we'll prepare the email to be sent
    // In production, integrate with SendGrid, Mailgun, AWS SES, etc.
    // This creates a log entry that can be processed by a background job
    try {
      // Placeholder for actual email sending
      // Replace with your email service integration
      // emailContent would be sent to email service:
      // {
      //   to: recipientEmail,
      //   from: "noreply@thuiszorghub.nl",
      //   subject: finalSubject,
      //   html: finalHtmlBody,
      //   text: finalTextBody,
      //   replyTo: "support@thuiszorghub.nl",
      // }

      // TODO: Send email using your email service
      // For now, mark as sent in the log
      await supabase
        .from("email_logs")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .eq("id", emailLog.id);

      // Log communication
      if (entityType && entityId) {
        await supabase
          .from("communication_logs")
          .insert({
            organization_id: userData.organization_id,
            entity_type: entityType,
            entity_id: entityId,
            communication_type: "email",
            subject: finalSubject,
            recipient_email: recipientEmail,
            sent_by: user.id,
            sent_at: new Date().toISOString(),
            status: "sent",
          });
      }

      return NextResponse.json(
        { data: { success: true, emailLogId: emailLog.id } },
        { status: 200 }
      );
    } catch (emailError) {
      console.error("Error sending email:", emailError);

      // Update log with error status
      await supabase
        .from("email_logs")
        .update({
          status: "failed",
          error_message: emailError instanceof Error ? emailError.message : "Unknown error",
        })
        .eq("id", emailLog.id);

      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error processing email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
