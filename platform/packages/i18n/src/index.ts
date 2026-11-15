export type SupportedLocale = 'en' | 'uk' | 'es' | 'fr' | 'de' | 'ar' | 'he' | 'it' | 'pl';

export interface TranslationDictionary {
  [key: string]: string;
}

export const translations: Record<SupportedLocale, TranslationDictionary> = {
  en: {
    book_now: "Book Now",
    select_barber: "Select Barber",
    select_service: "Select Service",
    select_time: "Select Time",
    confirm_appointment: "Confirm Appointment",
    cancel_appointment: "Cancel Appointment",
    total_price: "Total Price",
    currency: "Currency",
    card_payment: "Card Payment",
    apple_pay: "Apple Pay",
    google_pay: "Google Pay",
    cash: "Cash",
    loyalty_points: "Loyalty Points",
    membership_tier: "Membership Tier",
    discount: "Discount",
    appointment_reminder: "Appointment Reminder",
    review_prompt: "How was your experience?",
    welcome_message: "Welcome to FADE Premium Barbershop",
    profile: "Profile",
    settings: "Settings",
    notifications: "Notifications",
    history: "History"
  },
  uk: {
    book_now: "Забронювати",
    select_barber: "Вибрати барбера",
    select_service: "Вибрати послугу",
    select_time: "Вибрати час",
    confirm_appointment: "Підтвердити запис",
    cancel_appointment: "Скасувати запис",
    total_price: "Загальна сума",
    currency: "Валюта",
    card_payment: "Оплата карткою",
    apple_pay: "Apple Pay",
    google_pay: "Google Pay",
    cash: "Готівка",
    loyalty_points: "Бали лояльності",
    membership_tier: "Рівень членства",
    discount: "Знижка",
    appointment_reminder: "Нагадування про запис",
    review_prompt: "Як пройшов ваш візит?",
    welcome_message: "Ласкаво просимо до преміум-барбершопу FADE",
    profile: "Профіль",
    settings: "Налаштування",
    notifications: "Сповіщення",
    history: "Історія"
  },
  es: {
    book_now: "Reservar Ahora",
    select_barber: "Seleccionar Barbero",
    select_service: "Seleccionar Servicio",
    select_time: "Seleccionar Hora",
    confirm_appointment: "Confirmar Cita",
    cancel_appointment: "Cancelar Cita",
    total_price: "Precio Total",
    currency: "Moneda",
    card_payment: "Pago con Tarjeta",
    apple_pay: "Apple Pay",
    google_pay: "Google Pay",
    cash: "Efectivo",
    loyalty_points: "Puntos de Lealtad",
    membership_tier: "Nivel de Membresía",
    discount: "Descuento",
    appointment_reminder: "Recordatorio de Cita",
    review_prompt: "¿Cómo fue tu experiencia?",
    welcome_message: "Bienvenido a FADE Barbershop Premium",
    profile: "Perfil",
    settings: "Configuración",
    notifications: "Notificaciones",
    history: "Historial"
  },
  fr: {
    book_now: "Réserver",
    select_barber: "Sélectionner un barbier",
    select_service: "Sélectionner un service",
    select_time: "Sélectionner l'heure",
    confirm_appointment: "Confirmer le rendez-vous",
    cancel_appointment: "Annuler le rendez-vous",
    total_price: "Prix Total",
    currency: "Devise",
    card_payment: "Paiement par carte",
    apple_pay: "Apple Pay",
    google_pay: "Google Pay",
    cash: "Espèces",
    loyalty_points: "Points de fidélité",
    membership_tier: "Niveau d'adhésion",
    discount: "Remise",
    appointment_reminder: "Rappel de rendez-vous",
    review_prompt: "Comment s'est passée votre expérience ?",
    welcome_message: "Bienvenue chez FADE Barbershop Premium",
    profile: "Profil",
    settings: "Paramètres",
    notifications: "Notifications",
    history: "Historique"
  },
  de: {
    book_now: "Jetzt Buchen",
    select_barber: "Barbier Auswählen",
    select_service: "Dienstleistung Auswählen",
    select_time: "Uhrzeit Auswählen",
    confirm_appointment: "Termin Bestätigen",
    cancel_appointment: "Termin Stornieren",
    total_price: "Gesamtpreis",
    currency: "Währung",
    card_payment: "Kartenzahlung",
    apple_pay: "Apple Pay",
    google_pay: "Google Pay",
    cash: "Bargeld",
    loyalty_points: "Treuepunkte",
    membership_tier: "Mitgliedschaftsstufe",
    discount: "Rabatt",
    appointment_reminder: "Terminerinnerung",
    review_prompt: "Wie war Ihre Erfahrung?",
    welcome_message: "Willkommen im FADE Premium Barbershop",
    profile: "Profil",
    settings: "Einstellungen",
    notifications: "Benachrichtigungen",
    history: "Verlauf"
  },
  ar: {
    book_now: "احجز الآن",
    select_barber: "اختر الحلاق",
    select_service: "اختر الخدمة",
    select_time: "اختر الوقت",
    confirm_appointment: "تأكيد الموعد",
    cancel_appointment: "إلغاء الموعد",
    total_price: "السعر الإجمالي",
    currency: "العملة",
    card_payment: "الدفع بالبطاقة",
    apple_pay: "Apple Pay",
    google_pay: "Google Pay",
    cash: "نقداً",
    loyalty_points: "نقاط الولاء",
    membership_tier: "مستوى العضوية",
    discount: "خصم",
    appointment_reminder: "تذكير الموعد",
    review_prompt: "كيف كانت تجربتك؟",
    welcome_message: "مرحباً بك في صالون FADE الفاخر للحلاقة",
    profile: "الملف الشخصي",
    settings: "الإعدادات",
    notifications: "الإشعارات",
    history: "السجل"
  },
  he: {
    book_now: "הזמן עכשיו",
    select_barber: "בחר ספר",
    select_service: "בחר שירות",
    select_time: "בחר זמן",
    confirm_appointment: "אשר פגישה",
    cancel_appointment: "בטל פגישה",
    total_price: "מחיר כולל",
    currency: "מטבע",
    card_payment: "תשלום בכרטיס",
    apple_pay: "Apple Pay",
    google_pay: "Google Pay",
    cash: "מזומן",
    loyalty_points: "נקודות נאמנות",
    membership_tier: "רמת חברות",
    discount: "הנחה",
    appointment_reminder: "תזכורת פגישה",
    review_prompt: "איך היתה החוויה שלך?",
    welcome_message: "ברוכים הבאים למספרת הפרימיום FADE",
    profile: "פרופיל",
    settings: "הגדרות",
    notifications: "הודעות",
    history: "היסטוריה"
  },
  it: {
    book_now: "Prenota Ora",
    select_barber: "Seleziona Barbiere",
    select_service: "Seleziona Servizio",
    select_time: "Seleziona Orario",
    confirm_appointment: "Conferma Appuntamento",
    cancel_appointment: "Cancella Appuntamento",
    total_price: "Prezzo Totale",
    currency: "Valuta",
    card_payment: "Pagamento con Carta",
    apple_pay: "Apple Pay",
    google_pay: "Google Pay",
    cash: "Contanti",
    loyalty_points: "Punti Fedeltà",
    membership_tier: "Livello Abbonamento",
    discount: "Sconto",
    appointment_reminder: "Promemoria Appuntamento",
    review_prompt: "Com'è stata la tua esperienza?",
    welcome_message: "Benvenuto nel Barbershop Premium FADE",
    profile: "Profilo",
    settings: "Impostazioni",
    notifications: "Notifiche",
    history: "Cronologia"
  },
  pl: {
    book_now: "Zarezerwuj Teraz",
    select_barber: "Wybierz Barbera",
    select_service: "Wybierz Usługę",
    select_time: "Wybierz Czas",
    confirm_appointment: "Potwierdź Wizytę",
    cancel_appointment: "Anuluj Wizytę",
    total_price: "Cena Całkowita",
    currency: "Waluta",
    card_payment: "Płatność Kartą",
    apple_pay: "Apple Pay",
    google_pay: "Google Pay",
    cash: "Gotówka",
    loyalty_points: "Punkty Lojalnościowe",
    membership_tier: "Poziom Członkostwa",
    discount: "Rabat",
    appointment_reminder: "Przypomnienie o Wizycie",
    review_prompt: "Jak oceniasz swoje doświadczenie?",
    welcome_message: "Witamy w Salonie Fryzjerskim FADE Premium",
    profile: "Profil",
    settings: "Ustawienia",
    notifications: "Powiadomienia",
    history: "Historia"
  }
};

export function translate(
  key: string,
  locale: SupportedLocale = 'en',
  params?: Record<string, string | number>
): string {
  const dict = translations[locale] || translations['en'];
  let text = dict[key] || translations['en'][key] || key;

  if (params) {
    for (const [pKey, pVal] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
    }
  }

  return text;
}

export function formatCurrency(
  amount: number,
  currencyCode: string = 'USD',
  locale: SupportedLocale = 'en'
): string {
  const localeTag = 
    locale === 'uk' ? 'uk-UA' : 
    locale === 'es' ? 'es-ES' : 
    locale === 'fr' ? 'fr-FR' : 
    locale === 'de' ? 'de-DE' : 
    locale === 'ar' ? 'ar-SA' : 
    locale === 'he' ? 'he-IL' : 
    locale === 'it' ? 'it-IT' : 
    locale === 'pl' ? 'pl-PL' : 'en-US';
  try {
    return new Intl.NumberFormat(localeTag, {
      style: 'currency',
      currency: currencyCode
    }).format(amount);
  } catch {
    return `${amount} ${currencyCode}`;
  }
}

export function formatDate(
  date: Date,
  locale: SupportedLocale = 'en',
  timeZone?: string
): string {
  const localeTag = 
    locale === 'uk' ? 'uk-UA' : 
    locale === 'es' ? 'es-ES' : 
    locale === 'fr' ? 'fr-FR' : 
    locale === 'de' ? 'de-DE' : 
    locale === 'ar' ? 'ar-SA' : 
    locale === 'he' ? 'he-IL' : 
    locale === 'it' ? 'it-IT' : 
    locale === 'pl' ? 'pl-PL' : 'en-US';
  try {
    return new Intl.DateTimeFormat(localeTag, {
      dateStyle: 'long',
      timeZone
    }).format(date);
  } catch {
    return date.toISOString().split('T')[0];
  }
}

export function formatTime(
  date: Date,
  locale: SupportedLocale = 'en',
  timeZone?: string
): string {
  const localeTag = 
    locale === 'uk' ? 'uk-UA' : 
    locale === 'es' ? 'es-ES' : 
    locale === 'fr' ? 'fr-FR' : 
    locale === 'de' ? 'de-DE' : 
    locale === 'ar' ? 'ar-SA' : 
    locale === 'he' ? 'he-IL' : 
    locale === 'it' ? 'it-IT' : 
    locale === 'pl' ? 'pl-PL' : 'en-US';
  try {
    return new Intl.DateTimeFormat(localeTag, {
      timeStyle: 'short',
      timeZone
    }).format(date);
  } catch {
    return date.toTimeString().substring(0, 5);
  }
}

export function getLayoutDirection(locale: SupportedLocale): 'ltr' | 'rtl' {
  if (locale === 'ar' || locale === 'he') {
    return 'rtl';
  }
  return 'ltr';
}
