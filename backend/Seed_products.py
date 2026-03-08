"""
python manage.py seed_products

Seeds the database with 20 Moroccan herbal products covering all four categories.
Safe to run multiple times — uses get_or_create on slug.
"""
from django.core.management.base import BaseCommand
from products.models import Product


PRODUCTS = [
    # ── HERBS ──────────────────────────────────────────────────────────────
    {
        "name": "Dried Spearmint",
        "description": (
            "Freshly harvested Moroccan spearmint, sun-dried in the Atlas Mountain air. "
            "Intensely aromatic with a sweet, cooling flavour. Perfect for Moroccan mint "
            "tea, salads, or digestive infusions. Handpicked at peak season."
        ),
        "price": "8.99",
        "category": "herbs",
        "origin": "Meknes, Morocco",
        "image_url_path": "/static/images/products/spearmint.jpg",
        "badge": "Best Seller",
        "is_organic": True,
        "is_vegan": True,
        "is_gluten_free": True,
        "is_fair_trade": True,
        "is_featured": True,
        "is_seasonal": False,
        "in_stock": True,
        "stock_quantity": 150,
    },
    {
        "name": "Dried Vervain (Louisa)",
        "description": (
            "Lemon verbena — known as Louisa in Morocco — prized for its intense citrus "
            "fragrance and calming properties. Brewed as a soothing bedtime tea or blended "
            "with green tea. Grown in the fertile Saïs plain."
        ),
        "price": "9.49",
        "category": "herbs",
        "origin": "Fès-Meknès, Morocco",
        "image_url_path": "/static/images/products/vervain.jpg",
        "badge": "",
        "is_organic": True,
        "is_vegan": True,
        "is_gluten_free": True,
        "is_fair_trade": False,
        "is_featured": False,
        "is_seasonal": False,
        "in_stock": True,
        "stock_quantity": 120,
    },
    {
        "name": "Wild Thyme (Zaâtar)",
        "description": (
            "Aromatic wild thyme harvested from the slopes of the High Atlas. Rich in "
            "thymol with a robust, earthy flavour. Used in Moroccan spice blends, flatbreads, "
            "marinades, and as a powerful antiseptic tea."
        ),
        "price": "7.49",
        "category": "herbs",
        "origin": "High Atlas, Morocco",
        "image_url_path": "/static/images/products/thyme.jpg",
        "badge": "Seasonal",
        "is_organic": True,
        "is_vegan": True,
        "is_gluten_free": True,
        "is_fair_trade": True,
        "is_featured": False,
        "is_seasonal": True,
        "in_stock": True,
        "stock_quantity": 80,
    },
    {
        "name": "Dried Rosemary",
        "description": (
            "Robust Moroccan rosemary with deep resinous notes. Harvested from coastal "
            "hillsides near Essaouira where sea breezes impart a unique mineral quality. "
            "Ideal for roasting, grilling, and herbal teas."
        ),
        "price": "7.99",
        "category": "herbs",
        "origin": "Essaouira, Morocco",
        "image_url_path": "/static/images/products/rosemary.jpg",
        "badge": "",
        "is_organic": True,
        "is_vegan": True,
        "is_gluten_free": True,
        "is_fair_trade": False,
        "is_featured": False,
        "is_seasonal": False,
        "in_stock": True,
        "stock_quantity": 100,
    },
    {
        "name": "Chamomile Flowers",
        "description": (
            "Whole dried chamomile blossoms from the Ourika Valley, famous for its fertile "
            "soil and pure mountain water. Brew a golden, honey-scented infusion to ease "
            "tension, aid sleep, and soothe digestion."
        ),
        "price": "10.99",
        "category": "herbs",
        "origin": "Ourika Valley, Morocco",
        "image_url_path": "/static/images/products/chamomile.jpg",
        "badge": "Seasonal",
        "is_organic": True,
        "is_vegan": True,
        "is_gluten_free": True,
        "is_fair_trade": True,
        "is_featured": True,
        "is_seasonal": True,
        "in_stock": True,
        "stock_quantity": 60,
    },

    # ── TEAS ───────────────────────────────────────────────────────────────
    {
        "name": "Moroccan Gunpowder Green Tea",
        "description": (
            "Classic Chinese Gunpowder green tea blended Moroccan-style — the traditional "
            "base for atay, the famous sweet mint tea ritual. Tightly rolled pellets unfurl "
            "to release a bold, slightly smoky brew that pairs perfectly with fresh mint."
        ),
        "price": "12.99",
        "category": "teas",
        "origin": "Marrakech, Morocco",
        "image_url_path": "/static/images/products/gunpowder.jpg",
        "badge": "Best Seller",
        "is_organic": False,
        "is_vegan": True,
        "is_gluten_free": True,
        "is_fair_trade": False,
        "is_featured": True,
        "is_seasonal": False,
        "in_stock": True,
        "stock_quantity": 200,
    },
    {
        "name": "Atlas Mountain Herbal Blend",
        "description": (
            "A hand-blended tisane of wild thyme, sage, rosemary, and mountain savory — "
            "all gathered at altitude in the High Atlas. Deeply aromatic and rich in "
            "antioxidants. Brew as a restorative daily tea or use as a cooking herb blend."
        ),
        "price": "14.49",
        "category": "teas",
        "origin": "High Atlas, Morocco",
        "image_url_path": "/static/images/products/atlas-blend.jpg",
        "badge": "",
        "is_organic": True,
        "is_vegan": True,
        "is_gluten_free": True,
        "is_fair_trade": True,
        "is_featured": True,
        "is_seasonal": False,
        "in_stock": True,
        "stock_quantity": 90,
    },
    {
        "name": "Rose & Hibiscus Infusion",
        "description": (
            "Vibrant crimson blend of dried Tafilalt rose petals and Sudanese hibiscus "
            "calyces. Tart, floral, and naturally caffeine-free. Served hot or as a chilled "
            "summer drink. Rich in vitamin C and anthocyanins."
        ),
        "price": "11.99",
        "category": "teas",
        "origin": "Tafilalt, Morocco",
        "image_url_path": "/static/images/products/rose-hibiscus.jpg",
        "badge": "Seasonal",
        "is_organic": True,
        "is_vegan": True,
        "is_gluten_free": True,
        "is_fair_trade": True,
        "is_featured": False,
        "is_seasonal": True,
        "in_stock": True,
        "stock_quantity": 75,
    },
    {
        "name": "Sage & Honey Bush Tea",
        "description": (
            "Moroccan sage (Salmiya) combined with South African honeybush for a warm, "
            "naturally sweet infusion with woody undertones. Traditionally used to relieve "
            "sore throats and digestive discomfort. Caffeine-free."
        ),
        "price": "13.49",
        "category": "teas",
        "origin": "Souss Valley, Morocco",
        "image_url_path": "/static/images/products/sage-honeybush.jpg",
        "badge": "",
        "is_organic": True,
        "is_vegan": True,
        "is_gluten_free": True,
        "is_fair_trade": False,
        "is_featured": False,
        "is_seasonal": False,
        "in_stock": True,
        "stock_quantity": 55,
    },
    {
        "name": "Fenugreek Seed Tea",
        "description": (
            "Whole golden fenugreek seeds from Tafilalt, lightly toasted for a rich maple-like "
            "aroma. Brew as a warming tea or grind into spice blends. Used for centuries in "
            "Moroccan wellness traditions to support energy and digestion."
        ),
        "price": "9.99",
        "category": "teas",
        "origin": "Tafilalt, Morocco",
        "image_url_path": "/static/images/products/fenugreek.jpg",
        "badge": "",
        "is_organic": True,
        "is_vegan": True,
        "is_gluten_free": True,
        "is_fair_trade": True,
        "is_featured": False,
        "is_seasonal": False,
        "in_stock": True,
        "stock_quantity": 110,
    },

    # ── SPICES ─────────────────────────────────────────────────────────────
    {
        "name": "Ras el Hanout",
        "description": (
            "The king of Moroccan spice blends — up to 30 hand-selected spices including "
            "cumin, coriander, ginger, turmeric, cinnamon, cardamom, and rose petals. "
            "Our family recipe is ground fresh weekly. Essential for tagines and couscous."
        ),
        "price": "13.99",
        "category": "spices",
        "origin": "Marrakech Medina, Morocco",
        "image_url_path": "/static/images/products/ras-el-hanout.jpg",
        "badge": "Best Seller",
        "is_organic": False,
        "is_vegan": True,
        "is_gluten_free": True,
        "is_fair_trade": False,
        "is_featured": True,
        "is_seasonal": False,
        "in_stock": True,
        "stock_quantity": 180,
    },
    {
        "name": "Cumin Seeds (Kamoun)",
        "description": (
            "Premium earthy cumin from the arid plains of Figuig, hand-harvested and "
            "naturally sun-dried. Richer and more fragrant than supermarket varieties. "
            "The cornerstone of Moroccan cooking — used in tagines, harira soup, and kefta."
        ),
        "price": "6.99",
        "category": "spices",
        "origin": "Figuig, Morocco",
        "image_url_path": "/static/images/products/cumin.jpg",
        "badge": "",
        "is_organic": True,
        "is_vegan": True,
        "is_gluten_free": True,
        "is_fair_trade": True,
        "is_featured": False,
        "is_seasonal": False,
        "in_stock": True,
        "stock_quantity": 160,
    },
    {
        "name": "Saffron Threads (Zaâfrane)",
        "description": (
            "World-renowned Taliouine saffron — the finest in the world. Deep crimson "
            "threads with powerful colouring and a rich, honeyed floral aroma. Harvested "
            "by hand each October from Crocus sativus. Use sparingly; a pinch transforms a dish."
        ),
        "price": "24.99",
        "category": "spices",
        "origin": "Taliouine, Morocco",
        "image_url_path": "/static/images/products/saffron.jpg",
        "badge": "Premium",
        "is_organic": True,
        "is_vegan": True,
        "is_gluten_free": True,
        "is_fair_trade": True,
        "is_featured": True,
        "is_seasonal": True,
        "in_stock": True,
        "stock_quantity": 30,
    },
    {
        "name": "Paprika (Felfla Hamra)",
        "description": (
            "Sweet and smoky red paprika made from peppers grown in the Souss Valley. "
            "Stone-ground to preserve colour and flavour. The essential base for chermoula "
            "marinade, harissa paste, and Moroccan fish dishes."
        ),
        "price": "8.49",
        "category": "spices",
        "origin": "Souss Valley, Morocco",
        "image_url_path": "/static/images/products/paprika.jpg",
        "badge": "",
        "is_organic": False,
        "is_vegan": True,
        "is_gluten_free": True,
        "is_fair_trade": False,
        "is_featured": False,
        "is_seasonal": False,
        "in_stock": True,
        "stock_quantity": 140,
    },
    {
        "name": "Dried Ginger & Turmeric Mix",
        "description": (
            "Warming blend of dried and finely ground ginger (Skinjbir) and turmeric "
            "from the Marrakech souk. Anti-inflammatory and deeply fragrant. Perfect for "
            "golden milk, tagines, and lentil dishes."
        ),
        "price": "10.49",
        "category": "spices",
        "origin": "Marrakech, Morocco",
        "image_url_path": "/static/images/products/ginger-turmeric.jpg",
        "badge": "Seasonal",
        "is_organic": True,
        "is_vegan": True,
        "is_gluten_free": True,
        "is_fair_trade": True,
        "is_featured": False,
        "is_seasonal": True,
        "in_stock": True,
        "stock_quantity": 70,
    },

    # ── GIFT BOXES ─────────────────────────────────────────────────────────
    {
        "name": "Moroccan Tea Ritual Box",
        "description": (
            "Everything you need to host an authentic Moroccan tea ceremony. Includes: "
            "100g Gunpowder green tea, 30g dried spearmint, 20g dried verbena, a hand-painted "
            "ceramic tea glass, and a printed brewing guide. Gift-wrapped in a cedar-wood box."
        ),
        "price": "39.99",
        "category": "gift-boxes",
        "origin": "Marrakech, Morocco",
        "image_url_path": "/static/images/products/tea-ritual-box.jpg",
        "badge": "Best Seller",
        "is_organic": True,
        "is_vegan": True,
        "is_gluten_free": True,
        "is_fair_trade": True,
        "is_featured": True,
        "is_seasonal": False,
        "in_stock": True,
        "stock_quantity": 45,
    },
    {
        "name": "Spice Souk Discovery Box",
        "description": (
            "A curated journey through the Marrakech spice souk. Six hand-labelled glass "
            "jars: Ras el Hanout, Saffron, Cumin, Paprika, Ginger-Turmeric blend, and "
            "Cinnamon sticks. Beautifully presented in a hand-stamped linen pouch with recipe cards."
        ),
        "price": "54.99",
        "category": "gift-boxes",
        "origin": "Marrakech, Morocco",
        "image_url_path": "/static/images/products/spice-box.jpg",
        "badge": "Premium",
        "is_organic": False,
        "is_vegan": True,
        "is_gluten_free": True,
        "is_fair_trade": True,
        "is_featured": True,
        "is_seasonal": False,
        "in_stock": True,
        "stock_quantity": 25,
    },
    {
        "name": "Wellness Herb Collection",
        "description": (
            "Four therapeutic Moroccan herbs selected by our herbalist: Chamomile, Vervain, "
            "Rosemary, and Wild Thyme. Each in a resealable kraft pouch with health notes. "
            "Presented in a recycled-cardboard gift box with a care guide booklet."
        ),
        "price": "34.99",
        "category": "gift-boxes",
        "origin": "Atlas Mountains, Morocco",
        "image_url_path": "/static/images/products/wellness-box.jpg",
        "badge": "",
        "is_organic": True,
        "is_vegan": True,
        "is_gluten_free": True,
        "is_fair_trade": True,
        "is_featured": False,
        "is_seasonal": False,
        "in_stock": True,
        "stock_quantity": 35,
    },
    {
        "name": "Saffron & Rose Luxury Box",
        "description": (
            "An opulent gift combining Taliouine saffron threads, dried Tafilalt rose petals, "
            "and rose-infused argan honey. Nestled in a hand-stitched velvet tray inside "
            "a lacquered box. A statement gift for any occasion."
        ),
        "price": "69.99",
        "category": "gift-boxes",
        "origin": "Various, Morocco",
        "image_url_path": "/static/images/products/saffron-rose-box.jpg",
        "badge": "Premium",
        "is_organic": True,
        "is_vegan": False,   # contains honey
        "is_gluten_free": True,
        "is_fair_trade": True,
        "is_featured": False,
        "is_seasonal": True,
        "in_stock": True,
        "stock_quantity": 15,
    },
    {
        "name": "Family Tagine Spice Set",
        "description": (
            "Everything to spice three classic Moroccan tagines. Three recipe-specific "
            "blends: Lamb & Prune (Ras el Hanout base), Chicken & Preserved Lemon "
            "(turmeric-ginger blend), Fish Chermoula (paprika-cumin blend). Plus a "
            "signed recipe booklet from our Marrakech chef partner."
        ),
        "price": "29.99",
        "category": "gift-boxes",
        "origin": "Marrakech, Morocco",
        "image_url_path": "/static/images/products/tagine-set.jpg",
        "badge": "",
        "is_organic": False,
        "is_vegan": True,
        "is_gluten_free": True,
        "is_fair_trade": False,
        "is_featured": False,
        "is_seasonal": False,
        "in_stock": True,
        "stock_quantity": 50,
    },
]


class Command(BaseCommand):
    help = "Seed the database with 20 Moroccan herbal products."

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Delete all existing products before seeding.',
        )

    def handle(self, *args, **options):
        if options['clear']:
            deleted, _ = Product.objects.all().delete()
            self.stdout.write(self.style.WARNING(f"Deleted {deleted} existing products."))

        created = updated = 0
        for data in PRODUCTS:
            # derive slug from name so get_or_create is stable
            from django.utils.text import slugify
            slug = slugify(data['name'])
            obj, is_new = Product.objects.get_or_create(slug=slug, defaults=data)
            if not is_new:
                for k, v in data.items():
                    setattr(obj, k, v)
                obj.save()
                updated += 1
            else:
                created += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Done — {created} created, {updated} updated ({len(PRODUCTS)} total products)."
            )
        )