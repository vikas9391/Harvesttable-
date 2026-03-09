export interface Product {
  id:              number
  name:            string
  slug:            string
  description:     string
  price:           string
  original_price?: string
  category:        string
  origin:          string
  imageType?:      string        
  image_url?:      string | null
  badge?:          string

  // ── Multilingual fields ───────────────────────────────────────────────────
  name_fr?:        string
  name_ar?:        string
  description_fr?: string
  description_ar?: string
  badge_fr?:       string
  badge_ar?:       string

  is_organic:      boolean
  is_vegan:        boolean
  is_gluten_free:  boolean
  is_fair_trade:   boolean
  is_featured?:    boolean
  is_seasonal?:    boolean
  in_stock:        boolean
  stock_quantity:  number
  created_at:      string
}

export interface FilterState {
  category: string
  dietary: {
    organic:    boolean
    vegan:      boolean
    glutenFree: boolean
    fairTrade:  boolean
  }
}

export interface CartItem {
  cartItemId?: number
  product:     Product
  quantity:    number
}

export interface CartContextType {
  items:          CartItem[]
  addToCart:      (product: Product) => void
  removeFromCart: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  clearCart:      () => void
  totalItems:     number
  totalPrice:     number
  syncing:        boolean
}