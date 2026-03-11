# chatbot/responses.py
"""
Multilingual rule-based response engine.
Supports: English (en), French (fr), Arabic (ar)
Quick-reply values are i18n keys (e.g. 'chat.quick.browseProducts')
so the React frontend can render them in the current language.
"""

import re
from typing import Optional

# ─── Quick-reply i18n key constants ───────────────────────────────────────────
Q_BROWSE_PRODUCTS   = 'chat.quick.browseProducts'
Q_BROWSE_HERBS      = 'chat.quick.browseHerbs'
Q_BROWSE_TEAS       = 'chat.quick.browseTeas'
Q_BROWSE_SPICES     = 'chat.quick.browseSpices'
Q_BUILD_GIFT        = 'chat.quick.buildGiftBox'
Q_OPEN_GIFT_BUILDER = 'chat.quick.openGiftBuilder'
Q_GIFT_BOXES        = 'chat.quick.giftBoxes'
Q_TRACK_ORDER       = 'chat.quick.trackOrder'
Q_MY_ORDER          = 'chat.quick.myOrder'
Q_MY_PROFILE        = 'chat.quick.myProfile'
Q_LOG_IN            = 'chat.quick.logIn'
Q_SIGN_UP           = 'chat.quick.signUp'
Q_CONTACT_SUPPORT   = 'chat.quick.contactSupport'
Q_CONTACT_US        = 'chat.quick.contactUs'
Q_GO_TO_CONTACT     = 'chat.quick.goToContact'
Q_ABOUT_US          = 'chat.quick.aboutUs'
Q_SHIPPING_INFO     = 'chat.quick.shippingInfo'
Q_RETURNS_POLICY    = 'chat.quick.returnsPolicy'
Q_PRIVACY_POLICY    = 'chat.quick.privacyPolicy'
Q_TERMS_OF_SERVICE  = 'chat.quick.termsOfService'

# ─── Quick-reply key → URL map (used by serializer / frontend) ─────────────────
QUICK_REPLY_URLS = {
    Q_BROWSE_PRODUCTS:   '/products',
    Q_BROWSE_HERBS:      '/products?category=herbs',
    Q_BROWSE_TEAS:       '/products?category=teas',
    Q_BROWSE_SPICES:     '/products?category=spices',
    Q_BUILD_GIFT:        '/gift-builder',
    Q_OPEN_GIFT_BUILDER: '/gift-builder',
    Q_GIFT_BOXES:        '/products?category=gift-boxes',
    Q_TRACK_ORDER:       '/profile',
    Q_MY_ORDER:          '/profile',
    Q_MY_PROFILE:        '/profile',
    Q_LOG_IN:            '/login',
    Q_SIGN_UP:           '/signup',
    Q_CONTACT_SUPPORT:   '/contact',
    Q_CONTACT_US:        '/contact',
    Q_GO_TO_CONTACT:     '/contact',
    Q_ABOUT_US:          '/about',
    Q_SHIPPING_INFO:     '/shipping',
    Q_RETURNS_POLICY:    '/returns',
    Q_PRIVACY_POLICY:    '/privacy',
    Q_TERMS_OF_SERVICE:  '/terms',
}

# ─── Translations ──────────────────────────────────────────────────────────────
# Structure: RESPONSES_BY_LANG[lang] = list of { patterns, reply, quick }
# Patterns are always matched against lowercased input regardless of language.
# Arabic patterns use Arabic script; French/English use Latin.

RESPONSES_BY_LANG = {

    # ══════════════════════════════════════════════════════════════════════════
    # ENGLISH
    # ══════════════════════════════════════════════════════════════════════════
    'en': [
        # ── Greetings ──────────────────────────────────────────────────────
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
            'quick': [Q_BROWSE_PRODUCTS, Q_GIFT_BOXES, Q_MY_ORDER, Q_CONTACT_US],
        },

        # ── Products / catalogue ───────────────────────────────────────────
        {
            'patterns': [
                r'\b(product|products|catalogue|catalog|collection|what do you sell|what you sell)\b',
                r'\b(sell|offer|available|shop|store)\b',
            ],
            'reply': (
                "We carry 200+ premium Moroccan botanicals across four categories:\n\n"
                "🌿 Herbs — dried medicinal & culinary herbs\n"
                "☕ Teas — loose-leaf blends & single-origin teas\n"
                "🌶 Spices — hand-ground Moroccan spices\n"
                "🎁 Gift Boxes — curated sets with premium packaging\n\n"
                "Everything is 100% organic, fair-trade certified, and ethically sourced."
            ),
            'quick': [Q_BROWSE_HERBS, Q_BROWSE_TEAS, Q_BROWSE_SPICES, Q_GIFT_BOXES],
        },

        # ── Herbs ──────────────────────────────────────────────────────────
        {
            'patterns': [r'\b(herb|herbs)\b'],
            'reply': (
                "Our herbs collection includes premium dried medicinal and culinary herbs sourced "
                "directly from Moroccan farms. 🌿\n\n"
                "Head to our Products page and filter by Herbs to see everything available."
            ),
            'quick': [Q_BROWSE_HERBS, Q_BUILD_GIFT],
        },

        # ── Teas ───────────────────────────────────────────────────────────
        {
            'patterns': [r'\b(tea|teas|mint tea|green tea|herbal tea)\b'],
            'reply': (
                "We have a beautiful range of loose-leaf teas — from classic Moroccan mint to "
                "single-origin green teas and soothing herbal blends. ☕\n\n"
                "Browse the full tea collection on our Products page."
            ),
            'quick': [Q_BROWSE_TEAS, Q_BUILD_GIFT],
        },

        # ── Spices ─────────────────────────────────────────────────────────
        {
            'patterns': [r'\b(spice|spices|ras el hanout|cumin|turmeric|cinnamon|saffron)\b'],
            'reply': (
                "Our spices are hand-ground and freshly packed — including Ras el Hanout, "
                "Saffron, Cumin, Turmeric, Cinnamon, and more. 🌶\n\n"
                "Filter by Spices on our Products page to explore the full range."
            ),
            'quick': [Q_BROWSE_SPICES, Q_BUILD_GIFT],
        },

        # ── Gift boxes ─────────────────────────────────────────────────────
        {
            'patterns': [
                r'\b(gift|gifts|gift box|gift boxes|gift set)\b',
                r'\b(gift builder|build a gift|custom gift|personaliz)\b',
                r'\b(present|presents|gifting)\b',
            ],
            'reply': (
                "Our Gift Builder lets you create a personalised Moroccan gift box! 🎁\n\n"
                "Choose from three sizes:\n"
                "• Small — up to 3 items (+$5 packaging)\n"
                "• Medium — up to 5 items (+$8 packaging)\n"
                "• Large — up to 8 items (+$12 packaging)\n\n"
                "Pick any herbs, teas, or spices you like and we'll wrap it beautifully."
            ),
            'quick': [Q_OPEN_GIFT_BUILDER],
        },

        # ── Pricing ────────────────────────────────────────────────────────
        {
            'patterns': [r'\b(price|prices|pricing|cost|how much|expensive|cheap|afford)\b'],
            'reply': (
                "Prices vary by product — you'll find individual prices listed on each product page. "
                "Gift box packaging adds $5–$12 depending on the size you choose.\n\n"
                "Head to our Products page to browse with prices."
            ),
            'quick': [Q_BROWSE_PRODUCTS, Q_GIFT_BOXES],
        },

        # ── Organic / quality ──────────────────────────────────────────────
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
            'quick': [Q_BROWSE_PRODUCTS, Q_ABOUT_US],
        },

        # ── Shipping ───────────────────────────────────────────────────────
        {
            'patterns': [
                r'\b(ship|ships|shipping|delivery|deliver|delivers|dispatch)\b',
                r'\b(how long|when will|arrive|arrival|transit)\b',
                r'\b(free shipping|free delivery)\b',
            ],
            'reply': (
                "We ship worldwide! 📦\n\n"
                "• Free shipping on orders over $50 — applied automatically\n"
                "• Standard delivery: 5–8 business days\n"
                "• Express delivery: 2–3 business days\n"
                "• Orders packed and dispatched within 24 hours\n\n"
                "Visit our Shipping page for full details."
            ),
            'quick': [Q_SHIPPING_INFO],
        },

        # ── Returns ────────────────────────────────────────────────────────
        {
            'patterns': [
                r'\b(return|returns|refund|refunds|exchange|exchanges)\b',
                r'\b(send back|money back|wrong item|damaged)\b',
            ],
            'reply': (
                "We accept returns within 14 days of delivery on unopened products. 🔄\n\n"
                "If your order arrived damaged or incorrect, please contact us straight away at "
                "support@harvesttable.com and we'll make it right.\n\n"
                "Full details are on our Returns page."
            ),
            'quick': [Q_RETURNS_POLICY, Q_CONTACT_US],
        },

        # ── Order tracking ─────────────────────────────────────────────────
        {
            'patterns': [
                r'\b(order|orders|track|tracking|status|where is|where\'s)\b',
                r'\b(my order|my purchase|my package|my parcel)\b',
            ],
            'reply': (
                "To check your order status, log into your account and head to the Orders tab "
                "in your Profile — all your orders and tracking details are there. 📦\n\n"
                "If you're having trouble, our support team responds to order queries within 12 hours:\n"
                "✉️ support@harvesttable.com"
            ),
            'quick': [Q_MY_PROFILE, Q_CONTACT_US],
        },

        # ── Account / login ────────────────────────────────────────────────
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
            'quick': [Q_LOG_IN, Q_SIGN_UP],
        },

        # ── Payment ────────────────────────────────────────────────────────
        {
            'patterns': [
                r'\b(pay|payment|payments|card|credit card|debit card|visa|mastercard|paypal)\b',
                r'\b(checkout|how to pay|payment method|cash on delivery|cod)\b',
            ],
            'reply': (
                "We accept all major payment methods:\n\n"
                "💳 Visa, Mastercard, American Express\n"
                "💳 Debit cards\n"
                "🚚 Cash on Delivery (available at checkout)\n"
                "🔒 All card transactions are secured and encrypted.\n\n"
                "Simply add items to your cart and proceed to checkout!"
            ),
            'quick': [Q_BROWSE_PRODUCTS],
        },

        # ── Contact / support ──────────────────────────────────────────────
        {
            'patterns': [
                r'\b(contact|support|help|assist|speak|talk|human|agent|representative)\b',
                r'\b(email|phone|reach you|get in touch|customer service)\b',
            ],
            'reply': (
                "Our support team is always happy to help! ✉️\n\n"
                "Email: support@harvesttable.com\n"
                "Live chat: Available Mon–Fri, 9am–6pm GMT\n\n"
                "Response times:\n"
                "• General queries — within 24 hours\n"
                "• Order issues — within 12 hours\n"
                "• Wholesale enquiries — within 48 hours"
            ),
            'quick': [Q_GO_TO_CONTACT],
        },

        # ── About ──────────────────────────────────────────────────────────
        {
            'patterns': [
                r'\b(about|story|who are you|who is|founded|history|brand|company|harvesttable)\b',
            ],
            'reply': (
                "HarvestTable is a premium Moroccan botanicals brand. 🌿\n\n"
                "We connect you directly with the finest herbs, teas, spices, and botanicals "
                "from Moroccan farms — built on authenticity, sustainability, and quality.\n\n"
                "Every product is organic, fair-trade certified, and traceable to its source."
            ),
            'quick': [Q_ABOUT_US, Q_BROWSE_PRODUCTS],
        },

        # ── Ratings / reviews ──────────────────────────────────────────────
        {
            'patterns': [r'\b(rating|ratings|review|reviews|stars|trusted|reputation)\b'],
            'reply': (
                "We're proud to have a 4.9★ average rating from thousands of customers worldwide. ✨\n\n"
                "Our customers love the freshness of our products, the beautiful packaging, "
                "and our friendly support team."
            ),
            'quick': [Q_BROWSE_PRODUCTS],
        },

        # ── Wholesale ──────────────────────────────────────────────────────
        {
            'patterns': [r'\b(wholesale|bulk|bulk order|resell|reseller|b2b|business)\b'],
            'reply': (
                "We offer wholesale and bulk ordering for businesses! 📦\n\n"
                "Please reach out at support@harvesttable.com with your requirements "
                "and we'll get back to you within 48 hours."
            ),
            'quick': [Q_CONTACT_US],
        },

        # ── Privacy ────────────────────────────────────────────────────────
        {
            'patterns': [r'\b(privacy|data|gdpr|personal data|my data)\b'],
            'reply': (
                "We take your privacy seriously. 🔒\n\n"
                "We only collect what's needed to process your orders and improve your experience. "
                "We never sell your data to third parties.\n\n"
                "Read our full Privacy Policy for all the details."
            ),
            'quick': [Q_PRIVACY_POLICY],
        },

        # ── Terms ──────────────────────────────────────────────────────────
        {
            'patterns': [r'\b(terms|terms of service|terms and conditions|tos|legal)\b'],
            'reply': (
                "Our Terms of Service cover everything from ordering to returns and intellectual property. "
                "You can read them on the Terms page."
            ),
            'quick': [Q_TERMS_OF_SERVICE],
        },

        # ── Thank you ──────────────────────────────────────────────────────
        {
            'patterns': [r'\b(thank|thanks|thank you|merci|shukran|cheers)\b'],
            'reply': (
                "You're so welcome! 🌿 It's our pleasure to help.\n\n"
                "Is there anything else I can assist you with?"
            ),
            'quick': [Q_BROWSE_PRODUCTS, Q_CONTACT_US],
        },

        # ── Goodbye ────────────────────────────────────────────────────────
        {
            'patterns': [r'\b(bye|goodbye|see you|ciao|au revoir|ma3 salama)\b'],
            'reply': "Ma3 salama! 🌿 Come back anytime — we're always here.",
            'quick': [],
        },
    ],

    # ══════════════════════════════════════════════════════════════════════════
    # FRENCH
    # ══════════════════════════════════════════════════════════════════════════
    'fr': [
        # ── Salutations ────────────────────────────────────────────────────
        {
            'patterns': [
                r'\b(bonjour|salut|bonsoir|marhaba|salam|hello|hi|hey)\b',
                r'^(bonne? matin[ée]e?|bonne? apr[eè]s.?midi|bonne? soir[ée]e?)',
            ],
            'reply': (
                "Marhaba ! 🌿 Bienvenue sur HarvestTable.\n\n"
                "Je peux vous aider avec nos produits, coffrets cadeaux, commandes, livraison, retours et bien plus encore. "
                "Que souhaitez-vous savoir ?"
            ),
            'quick': [Q_BROWSE_PRODUCTS, Q_GIFT_BOXES, Q_MY_ORDER, Q_CONTACT_US],
        },

        # ── Produits / catalogue ───────────────────────────────────────────
        {
            'patterns': [
                r'\b(produit|produits|catalogue|collection|qu.est.ce que vous vendez|ce que vous vendez)\b',
                r'\b(vendre|offrir|disponible|boutique|magasin|shop)\b',
            ],
            'reply': (
                "Nous proposons plus de 200 botaniques marocains premium dans quatre catégories :\n\n"
                "🌿 Herbes — herbes médicinales et culinaires séchées\n"
                "☕ Thés — mélanges en feuilles et thés à origine unique\n"
                "🌶 Épices — épices marocaines moulues à la main\n"
                "🎁 Coffrets Cadeaux — sélections soignées avec emballage premium\n\n"
                "Tout est 100% biologique, certifié commerce équitable et sourcé éthiquement."
            ),
            'quick': [Q_BROWSE_HERBS, Q_BROWSE_TEAS, Q_BROWSE_SPICES, Q_GIFT_BOXES],
        },

        # ── Herbes ─────────────────────────────────────────────────────────
        {
            'patterns': [r'\b(herbe|herbes|plante|plantes)\b'],
            'reply': (
                "Notre collection d'herbes comprend des herbes médicinales et culinaires séchées de première qualité, "
                "sourcées directement des fermes marocaines. 🌿\n\n"
                "Rendez-vous sur notre page Produits et filtrez par Herbes pour voir tout ce qui est disponible."
            ),
            'quick': [Q_BROWSE_HERBS, Q_BUILD_GIFT],
        },

        # ── Thés ───────────────────────────────────────────────────────────
        {
            'patterns': [r'\b(th[eé]|th[eé]s|th[eé] [àa] la menthe|th[eé] vert|tisane)\b'],
            'reply': (
                "Nous avons une belle gamme de thés en feuilles — de la menthe marocaine classique aux "
                "thés verts à origine unique et aux mélanges d'herbes apaisantes. ☕\n\n"
                "Parcourez la collection complète de thés sur notre page Produits."
            ),
            'quick': [Q_BROWSE_TEAS, Q_BUILD_GIFT],
        },

        # ── Épices ─────────────────────────────────────────────────────────
        {
            'patterns': [r'\b([eé]pice|[eé]pices|ras el hanout|cumin|curcuma|cannelle|safran)\b'],
            'reply': (
                "Nos épices sont moulues à la main et fraîchement emballées — Ras el Hanout, "
                "Safran, Cumin, Curcuma, Cannelle, et bien plus. 🌶\n\n"
                "Filtrez par Épices sur notre page Produits pour explorer la gamme complète."
            ),
            'quick': [Q_BROWSE_SPICES, Q_BUILD_GIFT],
        },

        # ── Coffrets cadeaux ───────────────────────────────────────────────
        {
            'patterns': [
                r'\b(cadeau|cadeaux|coffret|coffrets|bo[iî]te cadeau|set cadeau)\b',
                r'\b(cr[eé]ateur de cadeau|cr[eé]er un cadeau|cadeau personnalis[eé])\b',
                r'\b(offrir|offre|offrir un cadeau)\b',
            ],
            'reply': (
                "Notre Créateur de Coffret vous permet de créer un coffret cadeau marocain personnalisé ! 🎁\n\n"
                "Choisissez parmi trois tailles :\n"
                "• Petit — jusqu'à 3 articles (+5€ emballage)\n"
                "• Moyen — jusqu'à 5 articles (+8€ emballage)\n"
                "• Grand — jusqu'à 8 articles (+12€ emballage)\n\n"
                "Choisissez les herbes, thés ou épices que vous aimez et nous l'emballerons magnifiquement."
            ),
            'quick': [Q_OPEN_GIFT_BUILDER],
        },

        # ── Prix ───────────────────────────────────────────────────────────
        {
            'patterns': [r'\b(prix|tarif|tarifs|co[uû]t|combien|cher|pas cher|abordable)\b'],
            'reply': (
                "Les prix varient selon les produits — vous trouverez les prix individuels sur chaque page produit. "
                "L'emballage coffret cadeau ajoute 5€–12€ selon la taille choisie.\n\n"
                "Rendez-vous sur notre page Produits pour naviguer avec les prix."
            ),
            'quick': [Q_BROWSE_PRODUCTS, Q_GIFT_BOXES],
        },

        # ── Bio / qualité ──────────────────────────────────────────────────
        {
            'patterns': [
                r'\b(bio|biologique|naturel|pur|qualit[eé]|authentique|certifi[eé])\b',
                r'\b(commerce [eé]quitable|[eé]thique|durable|approvisionnement)\b',
            ],
            'reply': (
                "La qualité est au cœur de tout ce que nous faisons. ✨\n\n"
                "Tous nos produits sont :\n"
                "• 100% certifiés biologiques\n"
                "• Certifiés commerce équitable\n"
                "• Sourcés éthiquement directement des fermes marocaines\n"
                "• Sans additifs, conservateurs ni rien d'artificiel\n\n"
                "Nous travaillons directement avec de petits agriculteurs pour garantir authenticité et fraîcheur."
            ),
            'quick': [Q_BROWSE_PRODUCTS, Q_ABOUT_US],
        },

        # ── Livraison ──────────────────────────────────────────────────────
        {
            'patterns': [
                r'\b(livr(er|aison|ons)|exp[eé]dition|exp[eé]dier|d[eé]lai)\b',
                r'\b(combien de temps|quand|arriv(er|ée?)|transit)\b',
                r'\b(livraison gratuite)\b',
            ],
            'reply': (
                "Nous livrons partout dans le monde ! 📦\n\n"
                "• Livraison gratuite dès 50€ — appliquée automatiquement\n"
                "• Livraison standard : 5–8 jours ouvrés\n"
                "• Livraison express : 2–3 jours ouvrés\n"
                "• Commandes emballées et expédiées sous 24 heures\n\n"
                "Consultez notre page Livraison pour tous les détails."
            ),
            'quick': [Q_SHIPPING_INFO],
        },

        # ── Retours ────────────────────────────────────────────────────────
        {
            'patterns': [
                r'\b(retour|retours|remboursement|remboursements|[eé]change|renvoyer)\b',
                r'\b(mauvais article|article endommag[eé]|article incorrect)\b',
            ],
            'reply': (
                "Nous acceptons les retours dans les 14 jours suivant la livraison pour les produits non ouverts. 🔄\n\n"
                "Si votre commande est arrivée endommagée ou incorrecte, contactez-nous immédiatement à "
                "support@harvesttable.com et nous arrangerons cela.\n\n"
                "Tous les détails sont sur notre page Retours."
            ),
            'quick': [Q_RETURNS_POLICY, Q_CONTACT_US],
        },

        # ── Suivi de commande ──────────────────────────────────────────────
        {
            'patterns': [
                r'\b(commande|commandes|suivi|suivre|statut|o[uù] est|o[uù] en est)\b',
                r'\b(ma commande|mon achat|mon colis|mon paquet)\b',
            ],
            'reply': (
                "Pour vérifier le statut de votre commande, connectez-vous à votre compte et rendez-vous "
                "dans l'onglet Commandes de votre Profil — tous vos détails de commande et de suivi sont là. 📦\n\n"
                "Si vous avez des difficultés, notre équipe répond aux questions de commande dans les 12 heures :\n"
                "✉️ support@harvesttable.com"
            ),
            'quick': [Q_MY_PROFILE, Q_CONTACT_US],
        },

        # ── Compte / connexion ─────────────────────────────────────────────
        {
            'patterns': [
                r'\b(compte|inscription|s.inscrire|s.enregistrer|connexion|se connecter|login)\b',
                r'\b(cr[eé]er un compte|mon compte|mot de passe oubli[eé]|r[eé]initialiser)\b',
            ],
            'reply': (
                "Vous pouvez créer un compte gratuit pour :\n\n"
                "• Suivre vos commandes en temps réel\n"
                "• Sauvegarder des articles dans votre liste de souhaits\n"
                "• Accélérer la commande avec des adresses sauvegardées\n"
                "• Gérer vos préférences de notifications\n\n"
                "L'inscription prend moins d'une minute !"
            ),
            'quick': [Q_LOG_IN, Q_SIGN_UP],
        },

        # ── Paiement ───────────────────────────────────────────────────────
        {
            'patterns': [
                r'\b(payer|paiement|carte|carte de cr[eé]dit|carte bancaire|visa|mastercard|paypal)\b',
                r'\b(r[eè]glement|comment payer|mode de paiement|paiement [àa] la livraison)\b',
            ],
            'reply': (
                "Nous acceptons tous les principaux modes de paiement :\n\n"
                "💳 Visa, Mastercard, American Express\n"
                "💳 Cartes de débit\n"
                "🚚 Paiement à la livraison (disponible à la caisse)\n"
                "🔒 Toutes les transactions par carte sont sécurisées et chiffrées.\n\n"
                "Ajoutez simplement des articles à votre panier et passez à la caisse !"
            ),
            'quick': [Q_BROWSE_PRODUCTS],
        },

        # ── Contact / support ──────────────────────────────────────────────
        {
            'patterns': [
                r'\b(contact|support|aide|assist(er|ance)|parler|humain|agent|représentant)\b',
                r'\b(email|t[eé]l[eé]phone|joindre|nous contacter|service client)\b',
            ],
            'reply': (
                "Notre équipe de support est toujours heureuse d'aider ! ✉️\n\n"
                "E-mail : support@harvesttable.com\n"
                "Chat en direct : Lun–Ven, 9h–18h GMT\n\n"
                "Délais de réponse :\n"
                "• Demandes générales — sous 24 heures\n"
                "• Problèmes de commande — sous 12 heures\n"
                "• Demandes en gros — sous 48 heures"
            ),
            'quick': [Q_GO_TO_CONTACT],
        },

        # ── À propos ───────────────────────────────────────────────────────
        {
            'patterns': [
                r'\b(a.?propos|histoire|qui [eê]tes.vous|fond[eé]|fondation|marque|entreprise|soci[eé]t[eé])\b',
            ],
            'reply': (
                "HarvestTable est une marque premium de botaniques marocaines. 🌿\n\n"
                "Nous vous connectons directement avec les meilleures herbes, thés, épices et botaniques "
                "des fermes marocaines — construite sur l'authenticité, la durabilité et la qualité.\n\n"
                "Chaque produit est biologique, certifié commerce équitable et traçable à sa source."
            ),
            'quick': [Q_ABOUT_US, Q_BROWSE_PRODUCTS],
        },

        # ── Avis / notes ───────────────────────────────────────────────────
        {
            'patterns': [r'\b(note|notes|avis|[eé]toiles|fiable|r[eé]putation)\b'],
            'reply': (
                "Nous sommes fiers d'avoir une note moyenne de 4,9★ de milliers de clients dans le monde. ✨\n\n"
                "Nos clients adorent la fraîcheur de nos produits, le bel emballage "
                "et notre équipe de support sympathique."
            ),
            'quick': [Q_BROWSE_PRODUCTS],
        },

        # ── Gros / professionnel ───────────────────────────────────────────
        {
            'patterns': [r'\b(gros|en gros|commande en gros|revendeur|b2b|professionnel|entreprise)\b'],
            'reply': (
                "Nous proposons des commandes en gros pour les entreprises ! 📦\n\n"
                "Contactez-nous à support@harvesttable.com avec vos besoins "
                "et nous vous répondrons dans les 48 heures."
            ),
            'quick': [Q_CONTACT_US],
        },

        # ── Confidentialité ────────────────────────────────────────────────
        {
            'patterns': [r'\b(confidentialit[eé]|donn[eé]es|rgpd|donn[eé]es personnelles|mes donn[eé]es)\b'],
            'reply': (
                "Nous prenons votre confidentialité très au sérieux. 🔒\n\n"
                "Nous collectons uniquement ce qui est nécessaire pour traiter vos commandes et améliorer votre expérience. "
                "Nous ne vendons jamais vos données à des tiers.\n\n"
                "Lisez notre Politique de confidentialité complète pour tous les détails."
            ),
            'quick': [Q_PRIVACY_POLICY],
        },

        # ── Conditions ─────────────────────────────────────────────────────
        {
            'patterns': [r'\b(conditions|conditions d.utilisation|mentions l[eé]gales|cgu|juridique|legal)\b'],
            'reply': (
                "Nos Conditions d'utilisation couvrent tout, des commandes aux retours en passant par la propriété intellectuelle. "
                "Vous pouvez les lire sur la page Conditions."
            ),
            'quick': [Q_TERMS_OF_SERVICE],
        },

        # ── Merci ──────────────────────────────────────────────────────────
        {
            'patterns': [r'\b(merci|thank|thanks|shukran)\b'],
            'reply': (
                "De rien ! 🌿 C'est notre plaisir de vous aider.\n\n"
                "Y a-t-il autre chose avec laquelle je peux vous aider ?"
            ),
            'quick': [Q_BROWSE_PRODUCTS, Q_CONTACT_US],
        },

        # ── Au revoir ──────────────────────────────────────────────────────
        {
            'patterns': [r'\b(au revoir|bye|[àa] bient[oô]t|ciao|salut)\b'],
            'reply': "Au revoir ! 🌿 Revenez quand vous voulez — nous sommes toujours là.",
            'quick': [],
        },
    ],

    # ══════════════════════════════════════════════════════════════════════════
    # ARABIC
    # ══════════════════════════════════════════════════════════════════════════
    'ar': [
        # ── تحيات ──────────────────────────────────────────────────────────
        {
            'patterns': [
                r'(مرحبا|مرحباً|أهلا|أهلاً|السلام عليكم|هلا|صباح الخير|مساء الخير)',
                r'\b(hi|hello|hey|salam|marhaba)\b',
            ],
            'reply': (
                "مرحبا! 🌿 أهلاً وسهلاً بك في هارفيست تيبل.\n\n"
                "يمكنني مساعدتك في منتجاتنا وصناديق الهدايا والطلبات والشحن والإرجاع وأكثر من ذلك. "
                "ماذا تريد أن تعرف؟"
            ),
            'quick': [Q_BROWSE_PRODUCTS, Q_GIFT_BOXES, Q_MY_ORDER, Q_CONTACT_US],
        },

        # ── المنتجات ────────────────────────────────────────────────────────
        {
            'patterns': [
                r'(منتج|منتجات|مجموعة|كتالوج|ماذا تبيعون|ما الذي تبيعونه)',
                r'(متجر|بضاعة|تشكيلة|عندكم)',
            ],
            'reply': (
                "لدينا أكثر من 200 نبات مغربي فاخر في أربع فئات:\n\n"
                "🌿 أعشاب — أعشاب طبية وطهوية مجففة\n"
                "☕ شاي — مزيج أوراق شاي وشاي أحادي المصدر\n"
                "🌶 توابل — توابل مغربية مطحونة يدوياً\n"
                "🎁 صناديق هدايا — مجموعات مختارة بعناية مع تغليف فاخر\n\n"
                "كل شيء 100% عضوي ومعتمد تجارة عادلة ومصدره أخلاقي."
            ),
            'quick': [Q_BROWSE_HERBS, Q_BROWSE_TEAS, Q_BROWSE_SPICES, Q_GIFT_BOXES],
        },

        # ── الأعشاب ──────────────────────────────────────────────────────────
        {
            'patterns': [r'(عشب|أعشاب|نبات|نباتات)'],
            'reply': (
                "تضم مجموعة أعشابنا أعشاباً طبية وطهوية مجففة من الدرجة الأولى، "
                "مصدرها مباشرة من المزارع المغربية. 🌿\n\n"
                "توجه إلى صفحة المنتجات وفلتر حسب الأعشاب لترى كل ما هو متاح."
            ),
            'quick': [Q_BROWSE_HERBS, Q_BUILD_GIFT],
        },

        # ── الشاي ────────────────────────────────────────────────────────────
        {
            'patterns': [r'(شاي|شاي بالنعناع|شاي أخضر|شاي أعشاب|مشروب)'],
            'reply': (
                "لدينا مجموعة رائعة من أوراق الشاي — من النعناع المغربي الكلاسيكي إلى "
                "الشاي الأخضر أحادي المصدر والمزيج العشبي المهدئ. ☕\n\n"
                "تصفح مجموعة الشاي الكاملة على صفحة المنتجات."
            ),
            'quick': [Q_BROWSE_TEAS, Q_BUILD_GIFT],
        },

        # ── التوابل ──────────────────────────────────────────────────────────
        {
            'patterns': [r'(توابل|بهارات|كمون|كركم|قرفة|زعفران|راس الحانوت)'],
            'reply': (
                "توابلنا مطحونة يدوياً ومعبأة طازجة — بما في ذلك راس الحانوت، "
                "الزعفران، الكمون، الكركم، القرفة والمزيد. 🌶\n\n"
                "فلتر حسب التوابل على صفحة المنتجات لاستكشاف النطاق الكامل."
            ),
            'quick': [Q_BROWSE_SPICES, Q_BUILD_GIFT],
        },

        # ── صناديق الهدايا ────────────────────────────────────────────────────
        {
            'patterns': [
                r'(هدية|هدايا|صندوق هدايا|صناديق هدايا|تغليف هدايا)',
                r'(بناء هدية|إنشاء هدية|هدية مخصصة)',
            ],
            'reply': (
                "صانع الهدايا لدينا يتيح لك إنشاء صندوق هدايا مغربي مخصص! 🎁\n\n"
                "اختر من ثلاثة أحجام:\n"
                "• صغير — حتى 3 منتجات (+5$ تغليف)\n"
                "• متوسط — حتى 5 منتجات (+8$ تغليف)\n"
                "• كبير — حتى 8 منتجات (+12$ تغليف)\n\n"
                "اختر الأعشاب والشاي والتوابل التي تحبها وسنغلفها بشكل جميل."
            ),
            'quick': [Q_OPEN_GIFT_BUILDER],
        },

        # ── الأسعار ──────────────────────────────────────────────────────────
        {
            'patterns': [r'(سعر|أسعار|تكلفة|كم يكلف|غالي|رخيص|ميسور)'],
            'reply': (
                "الأسعار تختلف حسب المنتج — ستجد الأسعار الفردية مدرجة على كل صفحة منتج. "
                "تغليف صندوق الهدايا يضيف 5$–12$ حسب الحجم الذي تختاره.\n\n"
                "توجه إلى صفحة المنتجات للتصفح مع الأسعار."
            ),
            'quick': [Q_BROWSE_PRODUCTS, Q_GIFT_BOXES],
        },

        # ── عضوي / جودة ─────────────────────────────────────────────────────
        {
            'patterns': [
                r'(عضوي|طبيعي|نقي|جودة|أصيل|معتمد)',
                r'(تجارة عادلة|أخلاقي|مستدام|مصدر)',
            ],
            'reply': (
                "الجودة في صميم كل ما نقوم به. ✨\n\n"
                "جميع منتجاتنا:\n"
                "• معتمدة عضوياً 100%\n"
                "• معتمدة تجارة عادلة\n"
                "• مصدرها أخلاقي مباشرة من المزارع المغربية\n"
                "• خالية من المضافات والمواد الحافظة وأي شيء اصطناعي\n\n"
                "نعمل مباشرة مع صغار المزارعين لضمان الأصالة والنضارة."
            ),
            'quick': [Q_BROWSE_PRODUCTS, Q_ABOUT_US],
        },

        # ── الشحن ────────────────────────────────────────────────────────────
        {
            'patterns': [
                r'(شحن|توصيل|يصل|متى يصل|وقت التوصيل)',
                r'(شحن مجاني|توصيل مجاني)',
            ],
            'reply': (
                "نشحن إلى جميع أنحاء العالم! 📦\n\n"
                "• شحن مجاني للطلبات فوق 50$ — يطبق تلقائياً\n"
                "• توصيل عادي: 5–8 أيام عمل\n"
                "• توصيل سريع: 2–3 أيام عمل\n"
                "• الطلبات تُعبأ وتُشحن خلال 24 ساعة\n\n"
                "قم بزيارة صفحة الشحن للحصول على التفاصيل الكاملة."
            ),
            'quick': [Q_SHIPPING_INFO],
        },

        # ── الإرجاع ──────────────────────────────────────────────────────────
        {
            'patterns': [
                r'(إرجاع|استرجاع|استرداد|تبديل|أعيد)',
                r'(منتج تالف|منتج خاطئ|مشكلة في الطلب)',
            ],
            'reply': (
                "نقبل الإرجاع خلال 14 يوماً من التسليم للمنتجات غير المفتوحة. 🔄\n\n"
                "إذا وصل طلبك تالفاً أو خاطئاً، تواصل معنا فوراً على "
                "support@harvesttable.com وسنصلح الأمر.\n\n"
                "التفاصيل الكاملة موجودة على صفحة الإرجاع."
            ),
            'quick': [Q_RETURNS_POLICY, Q_CONTACT_US],
        },

        # ── تتبع الطلب ───────────────────────────────────────────────────────
        {
            'patterns': [
                r'(طلب|طلبات|تتبع|تتبع طلب|حالة الطلب|أين طلبي)',
                r'(طلبي|مشترياتي|شحنتي)',
            ],
            'reply': (
                "لمعرفة حالة طلبك، سجّل الدخول إلى حسابك وتوجه إلى تبويب الطلبات "
                "في ملفك الشخصي — جميع تفاصيل طلباتك وتتبعها موجودة هناك. 📦\n\n"
                "إذا واجهت أي مشكلة، فريق الدعم لدينا يرد على استفسارات الطلبات خلال 12 ساعة:\n"
                "✉️ support@harvesttable.com"
            ),
            'quick': [Q_MY_PROFILE, Q_CONTACT_US],
        },

        # ── الحساب / تسجيل الدخول ────────────────────────────────────────────
        {
            'patterns': [
                r'(حساب|إنشاء حساب|تسجيل|تسجيل الدخول|اشتراك)',
                r'(كلمة مرور|نسيت كلمة المرور|إعادة تعيين)',
            ],
            'reply': (
                "يمكنك إنشاء حساب مجاني لـ:\n\n"
                "• تتبع طلباتك في الوقت الفعلي\n"
                "• حفظ المنتجات في قائمة المفضلة\n"
                "• تسريع الطلب بالعناوين المحفوظة\n"
                "• إدارة تفضيلات الإشعارات\n\n"
                "التسجيل يستغرق أقل من دقيقة!"
            ),
            'quick': [Q_LOG_IN, Q_SIGN_UP],
        },

        # ── الدفع ────────────────────────────────────────────────────────────
        {
            'patterns': [
                r'(دفع|طرق الدفع|بطاقة|فيزا|ماستركارد|باي بال)',
                r'(كيف أدفع|الدفع عند الاستلام|كاش)',
            ],
            'reply': (
                "نقبل جميع طرق الدفع الرئيسية:\n\n"
                "💳 فيزا، ماستركارد، أمريكان إكسبريس\n"
                "💳 بطاقات الخصم\n"
                "🚚 الدفع عند الاستلام (متاح عند الدفع)\n"
                "🔒 جميع المعاملات بالبطاقة مؤمنة ومشفرة.\n\n"
                "فقط أضف المنتجات إلى سلتك وانتقل إلى الدفع!"
            ),
            'quick': [Q_BROWSE_PRODUCTS],
        },

        # ── التواصل / الدعم ──────────────────────────────────────────────────
        {
            'patterns': [
                r'(تواصل|دعم|مساعدة|خدمة عملاء|التحدث|وكيل)',
                r'(بريد إلكتروني|هاتف|الاتصال بكم)',
            ],
            'reply': (
                "فريق الدعم لدينا دائماً سعيد بالمساعدة! ✉️\n\n"
                "البريد الإلكتروني: support@harvesttable.com\n"
                "الدردشة المباشرة: الإثنين–الجمعة، 9ص–6م GMT\n\n"
                "أوقات الرد:\n"
                "• الاستفسارات العامة — خلال 24 ساعة\n"
                "• مشكلات الطلبات — خلال 12 ساعة\n"
                "• استفسارات الجملة — خلال 48 ساعة"
            ),
            'quick': [Q_GO_TO_CONTACT],
        },

        # ── من نحن ───────────────────────────────────────────────────────────
        {
            'patterns': [
                r'(من أنتم|عنكم|قصتكم|تأسيس|تاريخ|الشركة|هارفيست)',
            ],
            'reply': (
                "هارفيست تيبل هي علامة تجارية فاخرة للنباتات المغربية. 🌿\n\n"
                "نربطك مباشرة بأجود الأعشاب والشاي والتوابل والنباتات "
                "من المزارع المغربية — مبنية على الأصالة والاستدامة والجودة.\n\n"
                "كل منتج عضوي ومعتمد تجارة عادلة وقابل للتتبع حتى مصدره."
            ),
            'quick': [Q_ABOUT_US, Q_BROWSE_PRODUCTS],
        },

        # ── التقييمات ────────────────────────────────────────────────────────
        {
            'patterns': [r'(تقييم|تقييمات|مراجعة|نجوم|موثوق|سمعة)'],
            'reply': (
                "نفخر بمتوسط تقييم 4.9★ من آلاف العملاء حول العالم. ✨\n\n"
                "عملاؤنا يحبون نضارة منتجاتنا والتغليف الجميل "
                "وفريق الدعم الودود."
            ),
            'quick': [Q_BROWSE_PRODUCTS],
        },

        # ── الجملة ───────────────────────────────────────────────────────────
        {
            'patterns': [r'(جملة|بالجملة|طلب كبير|موزع|b2b|أعمال)'],
            'reply': (
                "نوفر طلبات الجملة للشركات! 📦\n\n"
                "تواصل معنا على support@harvesttable.com مع متطلباتك "
                "وسنرد عليك خلال 48 ساعة."
            ),
            'quick': [Q_CONTACT_US],
        },

        # ── الخصوصية ─────────────────────────────────────────────────────────
        {
            'patterns': [r'(خصوصية|بيانات|بياناتي|بيانات شخصية|حماية البيانات)'],
            'reply': (
                "نأخذ خصوصيتك على محمل الجد. 🔒\n\n"
                "نجمع فقط ما هو ضروري لمعالجة طلباتك وتحسين تجربتك. "
                "لا نبيع بياناتك أبداً لأطراف ثالثة.\n\n"
                "اقرأ سياسة الخصوصية الكاملة لمزيد من التفاصيل."
            ),
            'quick': [Q_PRIVACY_POLICY],
        },

        # ── الشروط ───────────────────────────────────────────────────────────
        {
            'patterns': [r'(شروط|شروط الخدمة|شروط وأحكام|قانوني)'],
            'reply': (
                "تغطي شروط الخدمة لدينا كل شيء من الطلبات إلى الإرجاع والملكية الفكرية. "
                "يمكنك قراءتها على صفحة الشروط."
            ),
            'quick': [Q_TERMS_OF_SERVICE],
        },

        # ── شكراً ────────────────────────────────────────────────────────────
        {
            'patterns': [r'(شكراً|شكرا|شكراً جزيلاً|ممنون|متشكر)'],
            'reply': (
                "على الرحب والسعة! 🌿 يسعدنا المساعدة.\n\n"
                "هل هناك شيء آخر يمكنني مساعدتك به؟"
            ),
            'quick': [Q_BROWSE_PRODUCTS, Q_CONTACT_US],
        },

        # ── مع السلامة ───────────────────────────────────────────────────────
        {
            'patterns': [r'(مع السلامة|وداعاً|إلى اللقاء|bye|goodbye)'],
            'reply': "مع السلامة! 🌿 عودة في أي وقت — نحن دائماً هنا.",
            'quick': [],
        },
    ],
}

# ─── Fallback replies per language ────────────────────────────────────────────
FALLBACK_BY_LANG = {
    'en': {
        'reply': (
            "I'm not sure about that one! 🌿 "
            "I'm best at answering questions about our products, orders, shipping, and returns.\n\n"
            "For anything else, our team is happy to help at support@harvesttable.com"
        ),
        'quick': [Q_BROWSE_PRODUCTS, Q_GIFT_BOXES, Q_CONTACT_US],
    },
    'fr': {
        'reply': (
            "Je ne suis pas sûre de cela ! 🌿 "
            "Je suis meilleure pour répondre aux questions sur nos produits, commandes, livraisons et retours.\n\n"
            "Pour autre chose, notre équipe est heureuse d'aider à support@harvesttable.com"
        ),
        'quick': [Q_BROWSE_PRODUCTS, Q_GIFT_BOXES, Q_CONTACT_US],
    },
    'ar': {
        'reply': (
            "لست متأكدة من ذلك! 🌿 "
            "أنا أجيد الإجابة على أسئلة حول منتجاتنا والطلبات والشحن والإرجاع.\n\n"
            "لأي شيء آخر، فريقنا سعيد بالمساعدة على support@harvesttable.com"
        ),
        'quick': [Q_BROWSE_PRODUCTS, Q_GIFT_BOXES, Q_CONTACT_US],
    },
}


# ─── Main entry point ─────────────────────────────────────────────────────────
def get_reply(message: str, lang: str = 'en') -> dict:
    """
    Match the user message against patterns for the given language and return:
    { 'reply': str, 'quick': list[str] }

    quick values are i18n keys (e.g. 'chat.quick.browseProducts') so the
    React frontend can render them translated.

    Falls back to English if an unsupported lang is passed.
    """
    # Normalise lang code — accept 'en-US', 'fr-FR' etc.
    lang_code = lang.lower().split('-')[0] if lang else 'en'
    if lang_code not in RESPONSES_BY_LANG:
        lang_code = 'en'

    text = message.strip()
    # For Arabic keep original case; for others lowercase for pattern matching
    text_lower = text.lower()
    match_text = text if lang_code == 'ar' else text_lower

    for item in RESPONSES_BY_LANG[lang_code]:
        for pattern in item['patterns']:
            if re.search(pattern, match_text, re.IGNORECASE):
                return {
                    'reply': item['reply'],
                    'quick': item.get('quick', []),
                }

    # If no match in the requested language, try English as a last resort
    # (useful if user types English while app is in FR/AR mode)
    if lang_code != 'en':
        for item in RESPONSES_BY_LANG['en']:
            for pattern in item['patterns']:
                if re.search(pattern, text_lower, re.IGNORECASE):
                    return {
                        'reply': item['reply'],
                        'quick': item.get('quick', []),
                    }

    fallback = FALLBACK_BY_LANG.get(lang_code, FALLBACK_BY_LANG['en'])
    return {'reply': fallback['reply'], 'quick': fallback['quick']}