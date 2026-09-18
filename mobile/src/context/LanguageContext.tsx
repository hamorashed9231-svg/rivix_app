import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'ar' | 'en';

const LANGUAGE_KEY = 'user_selected_language';

const translations = {
  ar: {
    // Header & Global
    appName: 'عم عيسى',
    searchPlaceholder: 'ابحث عن صنف أو وجبة...',
    currency: 'ج.م',
    languageToggle: '🇬🇧 EN',
    langName: 'العربية',
    
    // Auth & Account
    loginTitle: 'تسجيل الدخول',
    registerTitle: 'إنشاء حساب جديد',
    emailLabel: 'البريد الإلكتروني',
    passwordLabel: 'كلمة المرور',
    nameLabel: 'الاسم الكامل',
    phoneLabel: 'رقم الهاتف',
    loginButton: 'تسجيل الدخول',
    registerButton: 'إنشاء حساب',
    noAccount: 'ليس لديك حساب؟ سجل الآن',
    hasAccount: 'لديك حساب بالفعل؟ سجل الدخول',
    logout: 'تسجيل الخروج',
    guestUser: 'زائر',
    welcomeBack: 'مرحباً بك مجدداً',

    // Home Screen
    allCategories: 'الكل',
    popularItems: 'الأكثر طلباً',
    ourMenu: 'قائمة الطعام',
    noItemsFound: 'لا توجد أصناف تطابق بحثك',
    addToCart: 'إضافة للسلة',
    viewCart: 'عرض السلة',
    itemsCount: 'أصناف',
    itemCountSingle: 'صنف',
    total: 'الإجمالي',

    // Cart Screen
    cartTitle: 'سلة المشتريات',
    emptyCartTitle: 'السلة فارغة',
    emptyCartSubtitle: 'لم تقم بطلب أي وجبة بعد، تصفح المينيو وأضف أشهى الوجبات!',
    browseMenu: 'تصفح المينيو',
    subtotal: 'المجموع الفرعي',
    deliveryFee: 'رسوم التوصيل',
    freeDelivery: 'مجاني',
    proceedToCheckout: 'متابعة الدفع والتوصيل',
    clearCart: 'مسح السلة',
    
    // Checkout Screen
    checkoutTitle: 'إتمام الطلب',
    deliveryAddress: 'عنوان التوصيل',
    selectAddress: 'اختر العنوان',
    addAddress: 'إضافة عنوان جديد',
    streetDetails: 'تفاصيل العنوان (الشارع / المبنى / الشقة)',
    paymentMethod: 'طريقة الدفع',
    cashOnDelivery: 'الدفع عند الاستلام (كاش)',
    vodafoneCash: 'فودافون كاش (Vodafone Cash)',
    instaPay: 'إنستا باي (InstaPay)',
    orderSummary: 'ملخص الطلب',
    confirmOrder: 'تأكيد وإرسال الطلب',
    orderSuccessTitle: 'تم إرسال طلبك بنجاح! 🎉',
    orderSuccessMessage: 'سيتم تحضير الطلب وتوصيله في أقرب وقت.',
    backToHome: 'العودة للرئيسية',
    notes: 'ملاحظات خاصة بالطلب',
    notesPlaceholder: 'أضف أي ملاحظات للتحضير أو التوصيل...',

    // Validation & Messages
    requiredField: 'هذا الحقل مطلوب',
    invalidEmail: 'يرجى إدخال بريد إلكتروني صحيح',
    shortPassword: 'كلمة المرور يجب أن لا تقل عن 6 أحرف',
    loginError: 'عفواً، فشل تسجيل الدخول. يرجى التأكد من البيانات',
    registerError: 'عفواً، فشل إنشاء الحساب. يرجى المحاولة لاحقاً',
  },
  en: {
    // Header & Global
    appName: 'Am Eissa',
    searchPlaceholder: 'Search for a dish or meal...',
    currency: 'EGP',
    languageToggle: '🇸🇦 عربى',
    langName: 'English',

    // Auth & Account
    loginTitle: 'Sign In',
    registerTitle: 'Create New Account',
    emailLabel: 'Email Address',
    passwordLabel: 'Password',
    nameLabel: 'Full Name',
    phoneLabel: 'Phone Number',
    loginButton: 'Sign In',
    registerButton: 'Register',
    noAccount: "Don't have an account? Sign Up",
    hasAccount: 'Already have an account? Sign In',
    logout: 'Log Out',
    guestUser: 'Guest',
    welcomeBack: 'Welcome Back',

    // Home Screen
    allCategories: 'All',
    popularItems: 'Most Popular',
    ourMenu: 'Menu',
    noItemsFound: 'No items match your search',
    addToCart: 'Add to Cart',
    viewCart: 'View Cart',
    itemsCount: 'items',
    itemCountSingle: 'item',
    total: 'Total',

    // Cart Screen
    cartTitle: 'Shopping Cart',
    emptyCartTitle: 'Your Cart is Empty',
    emptyCartSubtitle: 'You have not added any meals yet. Browse our delicious menu!',
    browseMenu: 'Browse Menu',
    subtotal: 'Subtotal',
    deliveryFee: 'Delivery Fee',
    freeDelivery: 'Free',
    proceedToCheckout: 'Proceed to Checkout',
    clearCart: 'Clear Cart',

    // Checkout Screen
    checkoutTitle: 'Checkout',
    deliveryAddress: 'Delivery Address',
    selectAddress: 'Select Address',
    addAddress: 'Add New Address',
    streetDetails: 'Address Details (Street / Building / Flat)',
    paymentMethod: 'Payment Method',
    cashOnDelivery: 'Cash on Delivery',
    vodafoneCash: 'Vodafone Cash',
    instaPay: 'InstaPay',
    orderSummary: 'Order Summary',
    confirmOrder: 'Confirm & Place Order',
    orderSuccessTitle: 'Order Placed Successfully! 🎉',
    orderSuccessMessage: 'Your order will be prepared and delivered shortly.',
    backToHome: 'Back to Home',
    notes: 'Order Notes',
    notesPlaceholder: 'Add any special instructions...',

    // Validation & Messages
    requiredField: 'This field is required',
    invalidEmail: 'Please enter a valid email address',
    shortPassword: 'Password must be at least 6 characters',
    loginError: 'Login failed. Please check your credentials',
    registerError: 'Registration failed. Please try again',
  }
};

type TranslationKeys = keyof typeof translations.ar;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  toggleLanguage: () => Promise<void>;
  t: (key: TranslationKeys) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLangState] = useState<Language>('ar');

  useEffect(() => {
    // Load saved language preference
    AsyncStorage.getItem(LANGUAGE_KEY).then((saved) => {
      if (saved === 'ar' || saved === 'en') {
        setLangState(saved);
      }
    }).catch((e) => console.error('Error loading language setting:', e));
  }, []);

  const setLanguage = async (lang: Language) => {
    setLangState(lang);
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    } catch (e) {
      console.error('Error saving language setting:', e);
    }
  };

  const toggleLanguage = async () => {
    const nextLang = language === 'ar' ? 'en' : 'ar';
    await setLanguage(nextLang);
  };

  const t = (key: TranslationKeys): string => {
    return translations[language][key] || translations.ar[key] || key;
  };

  const isRTL = language === 'ar';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
