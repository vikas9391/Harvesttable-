# contact/emails.py
import logging
import os
from django.conf import settings
from django.utils import timezone
from .models import ContactMessage

logger = logging.getLogger('contact')
BRAND  = getattr(settings, 'BRAND_NAME', 'HarvestTable')

AUTO_REPLY: dict[str, dict[str, str]] = {
    'en': {
        'subject': f'We received your message — {BRAND}',
        'body': (
            "Hello {name},\n\n"
            "Thank you for reaching out to {brand}!\n\n"
            "We've received your message and our team will get back to you within 24 hours.\n\n"
            "Your message:\n"
            "Subject: {subject}\n"
            "──────────────────────────\n"
            "{message}\n"
            "──────────────────────────\n\n"
            "If you have any urgent questions, feel free to reply to this email.\n\n"
            "Warm regards,\n"
            "The {brand} Team\n"
            "support@harvesttable.com"
        ),
    },
    'fr': {
        'subject': f'Nous avons reçu votre message — {BRAND}',
        'body': (
            "Bonjour {name},\n\n"
            "Merci d'avoir contacté {brand} !\n\n"
            "Nous avons bien reçu votre message et notre équipe vous répondra dans les 24 heures.\n\n"
            "Votre message :\n"
            "Sujet : {subject}\n"
            "──────────────────────────\n"
            "{message}\n"
            "──────────────────────────\n\n"
            "Cordialement,\n"
            "L'équipe {brand}\n"
            "support@harvesttable.com"
        ),
    },
    'ar': {
        'subject': f'استلمنا رسالتك — {BRAND}',
        'body': (
            "مرحباً {name}،\n\n"
            "شكراً لتواصلك مع {brand}!\n\n"
            "لقد استلمنا رسالتك وسيتواصل معك فريقنا خلال 24 ساعة.\n\n"
            "رسالتك:\n"
            "الموضوع: {subject}\n"
            "──────────────────────────\n"
            "{message}\n"
            "──────────────────────────\n\n"
            "مع تحيات فريق {brand}\n"
            "support@harvesttable.com"
        ),
    },
}


def _get_config() -> tuple[str, str, str]:
    """
    Read all email config fresh at call time — never at module import.
    Returns (api_key, from_email, staff_email).
    """
    api_key     = getattr(settings, 'BREVO_API_KEY',        None) or os.getenv('BREVO_API_KEY',        '')
    from_email  = getattr(settings, 'DEFAULT_FROM_EMAIL',   None) or os.getenv('DEFAULT_FROM_EMAIL',   '')
    staff_email = getattr(settings, 'CONTACT_STAFF_EMAIL',  None) or os.getenv('CONTACT_STAFF_EMAIL',  '')

    # Always log so we can verify in Render logs
    logger.info(
        '[contact] config — from_email=%r  staff_email=%r  api_key_prefix=%s',
        from_email, staff_email, (api_key or '')[:12],
    )

    if not api_key:
        raise ValueError('BREVO_API_KEY is not set in environment')
    if not from_email:
        raise ValueError('DEFAULT_FROM_EMAIL is not set in environment')
    if not staff_email:
        raise ValueError('CONTACT_STAFF_EMAIL is not set in environment')

    return api_key, from_email, staff_email


def _send_via_brevo(
    to_email:   str,
    to_name:    str,
    subject:    str,
    body:       str,
    from_email: str,
    api_key:    str,
    reply_to:   str | None = None,
) -> None:
    import sib_api_v3_sdk

    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = api_key

    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(
        sib_api_v3_sdk.ApiClient(configuration)
    )

    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
        sender       = {'name': BRAND, 'email': from_email},
        to           = [{'email': to_email, 'name': to_name}],
        reply_to     = {'email': reply_to} if reply_to else None,
        subject      = subject,
        text_content = body,
    )

    api_instance.send_transac_email(send_smtp_email)


def send_auto_reply(msg: ContactMessage) -> None:
    api_key, from_email, _ = _get_config()

    lang     = msg.lang if msg.lang in AUTO_REPLY else 'en'
    template = AUTO_REPLY[lang]

    body = template['body'].format(
        name    = msg.name,
        brand   = BRAND,
        subject = msg.subject,
        message = msg.message,
    )

    _send_via_brevo(
        to_email   = msg.email,
        to_name    = msg.name,
        subject    = template['subject'],
        body       = body,
        from_email = from_email,
        api_key    = api_key,
    )


def send_staff_notification(msg: ContactMessage) -> None:
    api_key, from_email, staff_email = _get_config()

    submitted_at = (
        msg.created_at.strftime('%Y-%m-%d %H:%M UTC')
        if msg.created_at
        else timezone.now().strftime('%Y-%m-%d %H:%M UTC')
    )

    body = (
        f"New contact message received on {BRAND}\n\n"
        f"ID        : #{msg.pk}\n"
        f"Name      : {msg.name}\n"
        f"Email     : {msg.email}\n"
        f"Language  : {msg.get_lang_display()}\n"  # type: ignore[attr-defined]
        f"Subject   : {msg.subject}\n"
        f"Submitted : {submitted_at}\n"
        f"IP        : {msg.ip_address or 'unknown'}\n\n"
        f"Message:\n"
        f"──────────────────────────\n"
        f"{msg.message}\n"
        f"──────────────────────────\n\n"
        f"Reply directly to: {msg.email}\n"
        f"Admin panel: https://harvesttable.com/admin/contact/contactmessage/{msg.pk}/change/\n"
    )

    _send_via_brevo(
        to_email   = staff_email,
        to_name    = f'{BRAND} Support',
        subject    = f'[{BRAND} Contact] #{msg.pk} — {msg.subject[:80]}',
        body       = body,
        from_email = from_email,
        api_key    = api_key,
        reply_to   = msg.email,
    )