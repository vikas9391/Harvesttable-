# products/management/commands/seed_products.py
from django.core.management.base import BaseCommand
from products.models import Product

PRODUCTS = [
    dict(name='Premium Moroccan Saffron', description='Hand-harvested saffron threads from the Taliouine region, known as the world\'s finest saffron. Deep crimson threads with an intense aroma and subtle honey notes.', price='24.99', category='spices', origin='Taliouine, Morocco', badge='Seasonal', is_organic=True, is_vegan=True, is_gluten_free=True),
    dict(name='Nana Mint Tea', description='Traditional Moroccan spearmint leaves, hand-picked and sun-dried. The authentic base for the beloved Moroccan mint tea ceremony.', price='12.99', category='teas', origin='Meknes, Morocco', is_organic=True, is_vegan=True, is_gluten_free=True, is_fair_trade=True),
    dict(name='Ras el Hanout Blend', description='Our signature "top of the shop" spice blend featuring 15 carefully balanced spices including cardamom, cumin, coriander, cinnamon, and rose petals.', price='16.99', category='spices', origin='Marrakech, Morocco', is_organic=True, is_vegan=True, is_gluten_free=True),
    dict(name='Dried Rose Buds', description='Whole dried rose buds from the Dades Valley, known as the "Valley of Roses". Delicate floral aroma perfect for teas and culinary creations.', price='14.99', category='herbs', origin='Dades Valley, Morocco', is_organic=True, is_vegan=True, is_gluten_free=True),
    dict(name='Lemon Verbena', description='Fragrant lemon verbena leaves with a bright citrus aroma. A traditional Moroccan digestive tea enjoyed after meals.', price='11.99', category='herbs', origin='Fes, Morocco', is_organic=True, is_vegan=True, is_gluten_free=True),
    dict(name='Whole Cumin Seeds', description='Aromatic whole cumin seeds with a warm, earthy flavor. Essential in Moroccan cuisine for tagines, couscous, and grilled meats.', price='9.99', category='spices', origin='Essaouira, Morocco', is_organic=True, is_vegan=True, is_gluten_free=True),
    dict(name='Orange Blossom Petals', description='Delicate dried orange blossom petals from Moroccan citrus groves. Adds a subtle floral sweetness to teas and desserts.', price='13.99', category='herbs', origin='Agadir, Morocco', is_organic=True, is_vegan=True, is_gluten_free=True, is_fair_trade=True),
    dict(name='Gunpowder Green Tea', description='Tightly rolled green tea leaves that unfurl when steeped. The traditional base for Moroccan mint tea with a bold, slightly smoky flavor.', price='10.99', category='teas', origin='Imported via Tangier, Morocco', is_organic=True, is_vegan=True, is_gluten_free=True, is_fair_trade=True),
    dict(name="Tea Lover's Collection", description='Curated selection of our finest teas and herbs including Nana Mint, Lemon Verbena, Orange Blossom, and Gunpowder Green Tea. Beautifully packaged in a handcrafted gift box.', price='49.99', category='gift-boxes', origin='Curated in Marrakech', is_organic=True, is_vegan=True, is_gluten_free=True, is_fair_trade=True),
    dict(name="Spice Master's Collection", description='Premium selection of essential Moroccan spices including Saffron, Ras el Hanout, Cumin, and Rose Buds. Perfect for the adventurous home chef.', price='59.99', category='gift-boxes', origin='Curated in Marrakech', is_organic=True, is_vegan=True, is_gluten_free=True),
    dict(name='Wild Mountain Thyme', description='Wild-harvested thyme from the Atlas Mountains with an intense, aromatic flavor. Used in traditional Moroccan meat dishes and marinades.', price='10.99', category='herbs', origin='Atlas Mountains, Morocco', is_organic=True, is_vegan=True, is_gluten_free=True),
    dict(name='Ceylon Cinnamon Sticks', description='True Ceylon cinnamon sticks with a delicate, sweet flavor. Essential for Moroccan tagines, pastries, and spiced tea blends.', price='13.99', category='spices', origin='Traded via Casablanca', is_organic=True, is_vegan=True, is_gluten_free=True, is_fair_trade=True),
]


class Command(BaseCommand):
    help = 'Seed the database with initial product data'

    def handle(self, *args, **options):
        Product.objects.all().delete()
        for data in PRODUCTS:
            Product.objects.create(**data)
            self.stdout.write(f'  Created: {data["name"]}')
        self.stdout.write(self.style.SUCCESS(f'\nSuccessfully seeded {len(PRODUCTS)} products.'))
