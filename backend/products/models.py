from django.db import models
from django.utils.text import slugify


class Category(models.TextChoices):
    HERBS      = 'herbs',      'Herbs'
    TEAS       = 'teas',       'Teas'
    SPICES     = 'spices',     'Spices'
    GIFT_BOXES = 'gift-boxes', 'Gift Boxes'


class Product(models.Model):
    name            = models.CharField(max_length=200)
    slug            = models.SlugField(unique=True, blank=True)
    description     = models.TextField()
    price           = models.DecimalField(max_digits=8, decimal_places=2)
    category        = models.CharField(max_length=20, choices=Category.choices)
    origin          = models.CharField(max_length=200)

    # ── Multilingual fields ───────────────────────────────────────────────────
    name_fr         = models.CharField(max_length=200, blank=True, default='',
                        help_text="Product name in French")
    name_ar         = models.CharField(max_length=200, blank=True, default='',
                        help_text="Product name in Arabic")
    description_fr  = models.TextField(blank=True, default='',
                        help_text="Product description in French")
    description_ar  = models.TextField(blank=True, default='',
                        help_text="Product description in Arabic")

    # ── Images ────────────────────────────────────────────────────────────────
    image_url_path  = models.CharField(
        max_length=500, blank=True,
        help_text="Relative URL, e.g. /images/products/mint.jpg — used when no file is uploaded"
    )
    image           = models.ImageField(upload_to='products/', blank=True, null=True)

    badge           = models.CharField(max_length=50, blank=True)
    # ── Multilingual badge ────────────────────────────────────────────────────
    badge_fr        = models.CharField(max_length=50, blank=True, default='',
                        help_text="Badge text in French, e.g. 'Nouveau'")
    badge_ar        = models.CharField(max_length=50, blank=True, default='',
                        help_text="Badge text in Arabic, e.g. 'جديد'")

    is_organic      = models.BooleanField(default=False)
    is_vegan        = models.BooleanField(default=False)
    is_gluten_free  = models.BooleanField(default=False)
    is_fair_trade   = models.BooleanField(default=False)
    is_featured     = models.BooleanField(default=False,
                        help_text="Show on homepage Featured section")
    is_seasonal     = models.BooleanField(default=False,
                        help_text="Show in Seasonal Treasures section")
    in_stock        = models.BooleanField(default=True)
    stock_quantity  = models.PositiveIntegerField(default=100)
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name)
            slug = base
            n = 1
            while Product.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base}-{n}"
                n += 1
            self.slug = slug
        super().save(*args, **kwargs)


class ProductReview(models.Model):
    product    = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    author     = models.CharField(max_length=100)
    rating     = models.PositiveSmallIntegerField()   # 1-5
    comment    = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.author} – {self.product.name} ({self.rating}/5)'