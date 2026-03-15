# contact/emails.py
from django.conf import settings
from django.core.mail import EmailMessage, get_connection
from django.utils import timezone

from .models import ContactMessage

BRAND       = getattr(settings, 'BRAND_NAME', 'HarvestTable')
STAFF_EMAIL = getattr(settings, 'CONTACT_STAFF_EMAIL', settings.DEFAULT_FROM_EMAIL)
FROM_EMAIL  = settings.DEFAULT_FROM_EMAIL

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


def _get_connection():
    """
    Explicit SMTP connection with timeout and SSL for port 465.
    use_ssl and use_tls are mutually exclusive — never set both to True.
    """
    return get_connection(
        backend  = 'django.core.mail.backends.smtp.EmailBackend',
        timeout  = 15,
        use_ssl  = True,   # port 465
        use_tls  = False,  # must be False when use_ssl=True
    )


def send_auto_reply(msg: ContactMessage) -> None:
    lang     = msg.lang if msg.lang in AUTO_REPLY else 'en'
    template = AUTO_REPLY[lang]

    body = template['body'].format(
        name    = msg.name,
        brand   = BRAND,
        subject = msg.subject,
        message = msg.message,
    )

    EmailMessage(
        subject    = template['subject'],
        body       = body,
        from_email = FROM_EMAIL,
        to         = [msg.email],
        connection = _get_connection(),
    ).send(fail_silently=False)


def send_staff_notification(msg: ContactMessage) -> None:
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
        f"Admin panel      : https://harvesttable.com/admin/contact/contactmessage/{msg.pk}/change/\n"
    )

    EmailMessage(
        subject    = f'[{BRAND} Contact] #{msg.pk} — {msg.subject[:80]}',
        body       = body,
        from_email = FROM_EMAIL,
        to         = [STAFF_EMAIL],
        reply_to   = [msg.email],
        connection = _get_connection(),
    ).send(fail_silently=False)