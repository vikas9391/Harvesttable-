// src/App.tsx
import React, { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CartProvider }    from './context/CartContext'
import { AuthProvider }    from './components/Navbar'
import { LangProvider }    from './context/Languagecontext'
import Navbar              from './components/Navbar'
import Footer              from './components/Footer'
import ScrollToTop         from './components/ScrollToTop'
import ChatBot             from './components/Chatbot'

// ── Lazy-loaded pages ──────────────────────────────────────────────────────────
const HomePage             = lazy(() => import('./pages/HomePage'))
const ProductsPage         = lazy(() => import('./pages/ProductsPage'))
const ProductDetailPage    = lazy(() => import('./pages/ProductDetailPage'))
const GiftBuilderPage      = lazy(() => import('./pages/GiftBuilderPage'))
const AboutPage            = lazy(() => import('./pages/AboutPage'))
const CheckoutPage         = lazy(() => import('./pages/CheckoutPage'))
const ShippingPage         = lazy(() => import('./pages/Shippinginfo'))
const ReturnsPage          = lazy(() => import('./pages/Returns'))
const ContactPage          = lazy(() => import('./pages/Contact'))
const PrivacyPolicyPage    = lazy(() => import('./pages/Privacypolicypage'))
const TermsOfServicePage   = lazy(() => import('./pages/Termsofservicepage'))
const LoginPage            = lazy(() => import('./pages/LoginPage'))
const SignupPage           = lazy(() => import('./pages/signupPage'))
const ProfilePage          = lazy(() => import('./pages/Profilepage'))

// Admin (nested layout + children)
const AdminLayout          = lazy(() => import('./pages/admin/AdminLayout'))
const AdminDashboard       = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminProducts        = lazy(() => import('./pages/admin/AdminProducts'))
const AdminOrders          = lazy(() => import('./pages/admin/AdminOrders'))
const AdminCustomers       = lazy(() => import('./pages/admin/AdminCustomers'))
const AdminSettings        = lazy(() => import('./pages/admin/AdminSettings'))
const AdminContactMessages = lazy(() => import('./pages/admin/Admincontactmessages'))

// ── Fallback UI ────────────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-current border-t-transparent rounded-full animate-spin opacity-40" />
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────

function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter
            future={{
              v7_startTransition:   true,
              v7_relativeSplatPath: true,
            }}
          >
            <ScrollToTop />
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1">
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Public */}
                    <Route path="/"               element={<HomePage />} />
                    <Route path="/products"       element={<ProductsPage />} />
                    <Route path="/products/:slug" element={<ProductDetailPage />} />
                    <Route path="/gift-builder"   element={<GiftBuilderPage />} />
                    <Route path="/about"          element={<AboutPage />} />
                    <Route path="/shipping"       element={<ShippingPage />} />
                    <Route path="/returns"        element={<ReturnsPage />} />
                    <Route path="/contact"        element={<ContactPage />} />
                    <Route path="/privacy"        element={<PrivacyPolicyPage />} />
                    <Route path="/terms"          element={<TermsOfServicePage />} />

                    {/* Auth */}
                    <Route path="/login"          element={<LoginPage />} />
                    <Route path="/signup"         element={<SignupPage />} />

                    {/* Protected */}
                    <Route path="/profile"        element={<ProfilePage />} />
                    <Route path="/checkout"       element={<CheckoutPage />} />

                    {/* Admin (nested) */}
                    <Route path="/admin" element={<AdminLayout />}>
                      <Route index              element={<AdminDashboard />} />
                      <Route path="products"    element={<AdminProducts />} />
                      <Route path="orders"      element={<AdminOrders />} />
                      <Route path="customers"   element={<AdminCustomers />} />
                      <Route path="contact"     element={<AdminContactMessages />} />
                      <Route path="settings"    element={<AdminSettings />} />
                    </Route>
                  </Routes>
                </Suspense>
              </main>
              <Footer />
              <ChatBot />
            </div>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </LangProvider>
  )
}

export default App