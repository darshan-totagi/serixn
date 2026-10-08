export const brandConfig = {
  brandName: 'Serixn',
  logo: 'SERIXN',
  productName: 'Velvet Aura Lip Oil No. 01',
  productDescription: 'A weightless veil of shine, comfort and effortless color.',
  price: '₹599',
  shadeName: 'Nude Hour',
  launchMode: 'prelaunch' as 'prelaunch' | 'full',
  instagramUrl: 'https://www.instagram.com/serixnbeauty',
  // Set VITE_SIGNUP_DESTINATION to a JSON signup endpoint that accepts
  // firstName, email, and optional whatsappNumber. The built-in API is default.
  signupDestination: import.meta.env.VITE_SIGNUP_DESTINATION?.trim() || '/api/early-access',
  publicSiteUrl: import.meta.env.VITE_PUBLIC_URL?.trim().replace(/\/+$/, '') || '',
  images: {
    hero: '/images/hero-lips.jpg',
    product: '/images/product-still.jpg',
    texture: '/images/texture-close.jpg',
    final: '/images/final-campaign.jpg',
  },
  ingredients: '[INGREDIENTS — PENDING FINAL FORMULA CONFIRMATION]',
};

export const primaryCta = brandConfig.launchMode === 'prelaunch' ? 'GET EARLY ACCESS' : 'SHOP NOW';
