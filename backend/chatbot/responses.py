# chatbot/responses.py
"""
Pure rule-based response engine.
No external API needed — all answers are baked in from the site content.
"""

import re
from typing import Optional

# ─── Knowledge base ───────────────────────────────────────────────────────────

RESPONSES = [
    # ── Greetings ──────────────────────────────────────────────────────────
    {
        'patterns': [
            r'\b(hi|hello|hey|marhaba|salam|bonjour|salut)\b',
            r'^(good morning|good afternoon|good evening)',
        ],
        'reply': (
            "Marhaba! 🌿 Welcome to HarvestTable.\n\n"
            "I can help you with our products, gift boxes, orders, shipping, returns, and more. "
            "What would you like to know?"
        ),
        'quick': ['🌿 Browse products', '🎁 Gift boxes', '📦 My order', '✉️ Contact us'],
    },

    # ── Products / catalogue ───────────────────────────────────────────────
    {
        'patterns': [
            r'\b(product|products|catalogue|catalog|collection|what do you sell|what you sell)\b',
            r'\b(sell|offer|available|shop|store)\b',
        ],
        'reply': (
            "We carry 200+ premium Moroccan botanicals across four categories:\n\n"
            "🌿 **Herbs** — dried medicinal & culinary herbs\n"
            "☕ **Teas** — loose-leaf blends & single-origin teas\n"
            "🌶 **Spices** — hand-ground Moroccan spices\n"
            "🎁 **Gift Boxes** — curated sets with premium packaging\n\n"
            "Everything is 100% organic, fair-trade certified, and ethically sourced."
        ),
        'quick': ['🌿 Browse herbs', '☕ Browse teas', '🌶 Browse spices', '🎁 Gift boxes'],
    },

    # ── Herbs ──────────────────────────────────────────────────────────────
    {
        'patterns': [r'\b(herb|herbs)\b'],
        'reply': (
            "Our herbs collection includes premium dried medicinal and culinary herbs sourced "
            "directly from Moroccan farms. 🌿\n\n"
            "Head to our Products page and filter by **Herbs** to see everything available."
        ),
        'quick': ['🌿 Browse herbs', '🎁 Build a gift box'],
    },

    # ── Teas ───────────────────────────────────────────────────────────────
    {
        'patterns': [r'\b(tea|teas|mint tea|green tea|herbal tea)\b'],
        'reply': (
            "We have a beautiful range of loose-leaf teas — from classic Moroccan mint to "
            "single-origin green teas and soothing herbal blends. ☕\n\n"
            "Browse the full tea collection on our Products page."
        ),
        'quick': ['☕ Browse teas', '🎁 Build a gift box'],
    },

    # ── Spices ─────────────────────────────────────────────────────────────
    {
        'patterns': [r'\b(spice|spices|ras el hanout|cumin|turmeric|cinnamon|saffron)\b'],
        'reply': (
            "Our spices are hand-ground and freshly packed — including Ras el Hanout, "
            "Saffron, Cumin, Turmeric, Cinnamon, and more. 🌶\n\n"
            "Filter by **Spices** on our Products page to explore the full range."
        ),
        'quick': ['🌶 Browse spices', '🎁 Build a gift box'],
    },

    # ── Gift boxes / Gift Builder ──────────────────────────────────────────
    {
        'patterns': [
            r'\b(gift|gifts|gift box|gift boxes|gift set)\b',
            r'\b(gift builder|build a gift|custom gift|personaliz)\b',
            r'\b(present|presents|gifting)\b',
        ],
        'reply': (
            "Our Gift Builder lets you create a personalised Moroccan gift box! 🎁\n\n"
            "Choose from three sizes:\n"
            "• **Small** — up to 3 items (+$5 packaging)\n"
            "• **Medium** — up to 5 items (+$8 packaging)\n"
            "• **Large** — up to 8 items (+$12 packaging)\n\n"
            "Pick any herbs, teas, or spices you like and we'll wrap it beautifully."
        ),
        'quick': ['🎁 Open Gift Builder'],
    },

    # ── Pricing ────────────────────────────────────────────────────────────
    {
        'patterns': [r'\b(price|prices|pricing|cost|how much|expensive|cheap|afford)\b'],
        'reply': (
            "Prices vary by product — you'll find individual prices listed on each product page. "
            "Gift box packaging adds $5–$12 depending on the size you choose.\n\n"
            "Head to our Products page to browse with prices."
        ),
        'quick': ['🌿 Browse products', '🎁 Gift boxes'],
    },

    # ── Organic / quality ──────────────────────────────────────────────────
    {
        'patterns': [
            r'\b(organic|natural|pure|quality|authentic|certified)\b',
            r'\b(fair.?trade|ethical|sustainable|sourcing)\b',
        ],
        'reply': (
            "Quality is at the heart of everything we do. ✨\n\n"
            "All our products are:\n"
            "• 100% certified organic\n"
            "• Fair-trade certified\n"
            "• Ethically sourced directly from Moroccan farms\n"
            "• Free from additives, preservatives, and artificial anything\n\n"
            "We work directly with small-scale farmers to ensure authenticity and freshness."
        ),
    },

    # ── Shipping ───────────────────────────────────────────────────────────
    {
        'patterns': [
            r'\b(ship|ships|shipping|delivery|deliver|delivers|dispatch)\b',
            r'\b(how long|when will|arrive|arrival|transit)\b',
            r'\b(free shipping|free delivery)\b',
        ],
        'reply': (
            "We ship worldwide! 📦\n\n"
            "• Free shipping is available on qualifying orders — check our Shipping page for the current threshold.\n"
            "• Standard delivery times vary by destination.\n"
            "• Orders are carefully packed to preserve freshness.\n\n"
            "Visit our Shipping page for full details and estimated delivery times."
        ),
        'quick': ['📄 Shipping info'],
    },

    # ── Returns ────────────────────────────────────────────────────────────
    {
        'patterns': [
            r'\b(return|returns|refund|refunds|exchange|exchanges)\b',
            r'\b(send back|money back|wrong item|damaged)\b',
        ],
        'reply': (
            "We accept returns within **14 days of delivery** on unopened products. 🔄\n\n"
            "If your order arrived damaged or incorrect, please contact us straight away at "
            "support@harvesttable.com and we'll make it right.\n\n"
            "Full details are on our Returns page."
        ),
        'quick': ['📄 Returns policy', '✉️ Contact us'],
    },

    # ── Order tracking / status ────────────────────────────────────────────
    {
        'patterns': [
            r'\b(order|orders|track|tracking|status|where is|where\'s)\b',
            r'\b(my order|my purchase|my package|my parcel)\b',
        ],
        'reply': (
            "To check your order status, log into your account and head to the **Orders** tab "
            "in your Profile — all your orders and tracking details are there. 📦\n\n"
            "If you're having trouble, our support team responds to order queries within 12 hours:\n"
            "✉️ support@harvesttable.com"
        ),
        'quick': ['🔑 My profile', '✉️ Contact us'],
    },

    # ── Account / login / signup ───────────────────────────────────────────
    {
        'patterns': [
            r'\b(account|sign up|signup|register|login|log in|sign in)\b',
            r'\b(create account|my account|forgot password|reset password)\b',
        ],
        'reply': (
            "You can create a free account to:\n\n"
            "• Track your orders in real time\n"
            "• Save items to your wishlist\n"
            "• Speed up checkout with saved addresses\n"
            "• Manage your notification preferences\n\n"
            "Sign up takes less than a minute!"
        ),
        'quick': ['🔑 Log in', '📝 Sign up'],
    },

    # ── Payment ────────────────────────────────────────────────────────────
    {
        'patterns': [
            r'\b(pay|payment|payments|card|credit card|debit card|visa|mastercard|paypal)\b',
            r'\b(checkout|how to pay|payment method)\b',
        ],
        'reply': (
            "We accept all major payment methods:\n\n"
            "💳 Visa, Mastercard, American Express\n"
            "💳 Debit cards\n"
            "🔒 All transactions are secured and encrypted.\n\n"
            "Simply add items to your cart and proceed to checkout!"
        ),
        'quick': ['🌿 Browse products'],
    },

    # ── Contact / support ─────────────────────────────────────────────────
    {
        'patterns': [
            r'\b(contact|support|help|assist|speak|talk|human|agent|representative)\b',
            r'\b(email|phone|reach you|get in touch|customer service)\b',
        ],
        'reply': (
            "Our support team is always happy to help! ✉️\n\n"
            "**Email:** support@harvesttable.com\n"
            "**Live chat:** Available Mon–Fri, 9am–6pm GMT\n\n"
            "Response times:\n"
            "• General queries — within 24 hours\n"
            "• Order issues — within 12 hours\n"
            "• Wholesale enquiries — within 48 hours\n"
            "• Partnership proposals — within 72 hours"
        ),
        'quick': ['✉️ Go to Contact page'],
    },

    # ── About / story ──────────────────────────────────────────────────────
    {
        'patterns': [
            r'\b(about|story|who are you|who is|founded|history|brand|company|harvesttable)\b',
        ],
        'reply': (
            "HarvestTable is a premium Moroccan botanicals brand — we connect you directly "
            "with the finest herbs, teas, spices, and botanicals from Moroccan farms. 🌿\n\n"
            "We're built on three values: authenticity, sustainability, and quality. "
            "Every product is organic, fair-trade certified, and traceable to its source.\n\n"
            "Read our full story on the About page!"
        ),
        'quick': ['📖 About us'],
    },

    # ── Ratings / reviews ─────────────────────────────────────────────────
    {
        'patterns': [r'\b(rating|ratings|review|reviews|stars|trusted|reputation)\b'],
        'reply': (
            "We're proud to have a **4.9★ average rating** from thousands of customers "
            "across the world. ✨\n\n"
            "Our customers love the freshness of our products, the beautiful packaging, "
            "and our friendly support team."
        ),
        'quick': ['🌿 Browse products'],
    },

    # ── Wholesale / bulk ──────────────────────────────────────────────────
    {
        'patterns': [r'\b(wholesale|bulk|bulk order|resell|reseller|b2b|business)\b'],
        'reply': (
            "We do offer wholesale and bulk ordering for businesses! 📦\n\n"
            "Please reach out to us at support@harvesttable.com with your requirements "
            "and we'll get back to you within 48 hours with pricing and details."
        ),
        'quick': ['✉️ Contact us'],
    },

    # ── Privacy / data ────────────────────────────────────────────────────
    {
        'patterns': [r'\b(privacy|data|gdpr|personal data|my data|information)\b'],
        'reply': (
            "We take your privacy seriously. 🔒\n\n"
            "We only collect what's needed to process your orders and improve your experience. "
            "We never sell your data to third parties.\n\n"
            "Read our full Privacy Policy for all the details."
        ),
        'quick': ['📄 Privacy policy'],
    },

    # ── Terms ─────────────────────────────────────────────────────────────
    {
        'patterns': [r'\b(terms|terms of service|terms and conditions|tos|legal)\b'],
        'reply': (
            "Our Terms of Service are available on the Terms page — "
            "they cover everything from ordering to returns and intellectual property."
        ),
        'quick': ['📄 Terms of service'],
    },

    # ── Thank you ─────────────────────────────────────────────────────────
    {
        'patterns': [r'\b(thank|thanks|thank you|merci|shukran|cheers)\b'],
        'reply': (
            "You're so welcome! 🌿 It's our pleasure to help.\n\n"
            "Is there anything else I can assist you with?"
        ),
    },

    # ── Goodbye ───────────────────────────────────────────────────────────
    {
        'patterns': [r'\b(bye|goodbye|see you|ciao|au revoir|ma3 salama)\b'],
        'reply': "Ma3 salama! 🌿 Come back anytime — we're always here.",
    },
]

# ─── Quick-reply navigation map (used in serializer) ──────────────────────────
QUICK_REPLY_URLS = {
    '🌿 Browse products':   '/products',
    '🌿 Browse herbs':      '/products?category=herbs',
    '☕ Browse teas':       '/products?category=teas',
    '🌶 Browse spices':     '/products?category=spices',
    '🎁 Gift boxes':        '/products?category=gift-boxes',
    '🎁 Build a gift box':  '/gift-builder',
    '🎁 Open Gift Builder': '/gift-builder',
    '📦 My order':          '/profile',
    '🔑 My profile':        '/profile',
    '🔑 Log in':            '/login',
    '📝 Sign up':           '/signup',
    '✉️ Contact us':        '/contact',
    '✉️ Go to Contact page': '/contact',
    '📖 About us':          '/about',
    '📄 Shipping info':     '/shipping',
    '📄 Returns policy':    '/returns',
    '📄 Privacy policy':    '/privacy',
    '📄 Terms of service':  '/terms',
}

FALLBACK_REPLY = (
    "I'm not sure about that one! 🌿 "
    "I'm best at answering questions about our products, orders, shipping, and returns.\n\n"
    "For anything else, our team is happy to help at support@harvesttable.com"
)
FALLBACK_QUICK = ['🌿 Browse products', '🎁 Gift boxes', '✉️ Contact us']


def get_reply(message: str) -> dict:
    """
    Match the user message against patterns and return:
    { 'reply': str, 'quick': list[str] }
    """
    text = message.lower().strip()

    for item in RESPONSES:
        for pattern in item['patterns']:
            if re.search(pattern, text, re.IGNORECASE):
                return {
                    'reply': item['reply'],
                    'quick': item.get('quick', []),
                }

    return {'reply': FALLBACK_REPLY, 'quick': FALLBACK_QUICK}