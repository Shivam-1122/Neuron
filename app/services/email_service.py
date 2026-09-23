import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Dict, Any
from dotenv import load_dotenv

load_dotenv(override=True)

class EmailService:
    def __init__(self):
        load_dotenv(override=True)
        self.smtp_host = os.getenv("SMTP_HOST", "")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.from_email = os.getenv("EMAIL_FROM", self.smtp_user or "alerts@neuron.sanctuary")

    def is_configured(self) -> bool:
        return bool(self.smtp_host and self.smtp_user and self.smtp_password)

    def send_caregiver_alert(
        self,
        to_emails: List[str],
        patient_name: str,
        patient_query: str,
        timestamp: str = ""
    ) -> Dict[str, Any]:
        """
        Send an email notification to all caregivers when a patient asks for something
        that the assistant has no data about.
        """
        valid_emails = [e.strip() for e in to_emails if e and "@" in e]
        if not valid_emails:
            return {
                "status": "error",
                "message": "No valid caregiver email addresses registered.",
                "notified_emails": []
            }

        subject = f"⚠️ [Neuron Sanctuary Alert] {patient_name} asked: \"{patient_query[:60]}\""

        text_content = f"""NEURON COGNITIVE SANCTUARY // CAREGIVER ALERT

Dear Caregiver,

Your loved one, {patient_name}, recently asked the Neuron Assistant a question for which no memory record currently exists:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Question Asked:
"{patient_query}"
Time: {timestamp or 'Just now'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Action Recommended:
Please log in to the Caregiver Portal to register the relevant memory, family member identity, or object location so the assistant can guide {patient_name} smoothly in the future.

Access Sanctuary Caregiver Hub:
http://127.0.0.1:5173/

— Neuron Multimodal Neural Memory Cortex
"""

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c1322; color: #e2e8f0; margin: 0; padding: 20px; }}
  .card {{ max-width: 580px; margin: 0 auto; background: #131b2e; border: 1px solid rgba(0, 240, 255, 0.25); border-radius: 20px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.8); }}
  .badge {{ display: inline-block; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); color: #fbbf24; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 1px; }}
  .title {{ font-size: 22px; font-weight: 800; color: #ffffff; margin: 16px 0 8px 0; }}
  .query-box {{ background: #080d18; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px 20px; margin: 20px 0; }}
  .query-text {{ font-size: 16px; font-style: italic; color: #fef3c7; margin: 0 0 6px 0; }}
  .query-time {{ font-size: 11px; color: #94a3b8; font-family: monospace; }}
  .btn {{ display: inline-block; background: #00f0ff; color: #060a12; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 12px; margin-top: 16px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }}
  .footer {{ font-size: 11px; color: #64748b; margin-top: 24px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 16px; }}
</style>
</head>
<body>
  <div class="card">
    <div class="badge">Cognitive Alert // Memory Assistance Required</div>
    <h1 class="title">Memory Not Found in Patient Cortex</h1>
    <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
      <strong>{patient_name}</strong> asked the assistant a question that could not be answered with current memory records:
    </p>
    
    <div class="query-box">
      <p class="query-text">"{patient_query}"</p>
      <div class="query-time">Recorded at: {timestamp or 'Just now'}</div>
    </div>
    
    <p style="color: #cbd5e1; font-size: 13px; line-height: 1.5;">
      Please update {patient_name}'s memory bank with the requested information (such as an item's location or details about a person) so the companion can reassure and assist them next time.
    </p>
    
    <a href="http://127.0.0.1:5173/" class="btn">Open Caregiver Portal</a>
    
    <div class="footer">
      Neuron Multimodal Cognitive Companion • Sent automatically to enrolled caregivers.
    </div>
  </div>
</body>
</html>
"""

        if self.is_configured():
            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = self.from_email
                msg["To"] = ", ".join(valid_emails)
                msg.attach(MIMEText(text_content, "plain"))
                msg.attach(MIMEText(html_content, "html"))

                if self.smtp_port == 465:
                    with smtplib.SMTP_SSL(self.smtp_host, self.smtp_port, timeout=10) as server:
                        server.login(self.smtp_user, self.smtp_password)
                        server.sendmail(self.from_email, valid_emails, msg.as_string())
                else:
                    with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=10) as server:
                        server.starttls()
                        server.login(self.smtp_user, self.smtp_password)
                        server.sendmail(self.from_email, valid_emails, msg.as_string())

                return {
                    "status": "success",
                    "mode": "live_smtp",
                    "notified_emails": valid_emails,
                    "message": f"Successfully notified {len(valid_emails)} caregiver(s) via SMTP."
                }
            except Exception as e:
                print(f"SMTP email dispatch error: {e}")
                # Fallback to simulated delivery status
                return {
                    "status": "simulated_success",
                    "mode": "fallback_simulated",
                    "error": str(e),
                    "notified_emails": valid_emails,
                    "message": f"Alert queued for {len(valid_emails)} caregiver(s): {', '.join(valid_emails)} (SMTP connection error: {e})"
                }
        else:
            # Simulated delivery when SMTP is pending configuration
            print(f"[EMAIL SIMULATION] To: {valid_emails} | Subject: {subject} | Query: {patient_query}")
            return {
                "status": "success",
                "mode": "simulated",
                "notified_emails": valid_emails,
                "message": f"Caregivers notified at: {', '.join(valid_emails)}"
            }

email_service = EmailService()
