export const LANGUAGES = [
  { code: "en", label: "EN", dir: "ltr", locale: "en-US" },
  { code: "fr", label: "FR", dir: "ltr", locale: "fr-FR" },
  { code: "ar", label: "AR", dir: "rtl", locale: "ar-MA" },
];

export const CATEGORY_LABELS = {
  salary: { en: "Salary", fr: "Salaire", ar: "راتب" },
  freelance: { en: "Freelance", fr: "Freelance", ar: "عمل حر" },
  "other-income": { en: "Other income", fr: "Autre revenu", ar: "دخل آخر" },
  food: { en: "Food", fr: "Alimentation", ar: "طعام" },
  transport: { en: "Transport", fr: "Transport", ar: "مواصلات" },
  housing: { en: "Housing", fr: "Logement", ar: "سكن" },
  utilities: { en: "Utilities", fr: "Charges", ar: "مرافق" },
  shopping: { en: "Shopping", fr: "Achats", ar: "تسوق" },
  health: { en: "Health", fr: "Santé", ar: "صحة" },
  entertainment: { en: "Entertainment", fr: "Loisirs", ar: "ترفيه" },
  "other-expense": { en: "Other", fr: "Autre", ar: "أخرى" },
};

export const TRANSLATIONS = {
  en: {
    appName: "The Ledger",
    tagline: "Personal accounts",

    // Auth
    signIn: "Sign in",
    signUp: "Sign up",
    email: "Email",
    password: "Password",
    createAccount: "Create account",
    pleaseWait: "Please wait…",
    authMissingFields: "Enter both an email and a password.",
    authShortPassword: "Password must be at least 6 characters.",
    authSignupNotice: "Account created. Check your email if confirmation is required, then sign in.",

    // Setup notice
    setupTitle: "One-time setup needed",
    setupStep1: "Create a free project at",
    setupStep2Pre: "In the SQL Editor, run the contents of",
    setupStep2Post: "from this project.",
    setupStep3: "In Project Settings → API, copy the Project URL and anon public key.",
    setupStep4Pre: "Copy",
    setupStep4Mid: "to",
    setupStep4Post: "and paste the two values in.",
    setupStep5Pre: "Restart",

    // Header / nav
    exportCsv: "Export CSV",
    backupJson: "Backup JSON",
    restoreBackup: "Restore backup",
    signOut: "Sign out",
    signedInAs: "Signed in as {email}. Your data is stored in your own database — use \"Backup JSON\" for an offline copy.",
    restoreConfirm: "This will replace everything currently in the app with the backup from this file ({count} transactions). This can't be undone. Continue?",
    restoreGenericError: "Couldn't restore that backup.",
    tabLedger: "Ledger",
    tabBudgets: "Budgets",
    tabRecurring: "Recurring",
    tabTrends: "Trends",
    allEntries: "All entries",

    // Entry form
    newEntry: "New entry",
    editEntry: "Edit entry",
    ledgerSlip: "Ledger slip",
    debit: "Debit",
    credit: "Credit",
    amount: "Amount",
    category: "Category",
    date: "Date",
    note: "Note",
    optional: "(optional)",
    notePlaceholder: "What was this for?",
    errorAmount: "Enter an amount greater than 0.",
    errorDate: "Pick a date.",
    cancel: "Cancel",
    saveChanges: "Save changes",
    recordEntry: "Record entry",

    // Ledger table
    emptyLedgerTitle: "The ledger is empty",
    emptyLedgerBody: "Record your first entry to start the running balance.",
    colDate: "Date",
    colCategory: "Category",
    colDescription: "Description",
    colAmount: "Amount",
    edit: "Edit",
    editEntryAria: "Edit entry",
    deleteEntryAria: "Delete entry",

    // Balance summary
    thisMonth: "This month",
    income: "Income",
    expenses: "Expenses",
    balance: "Balance",

    // Category breakdown
    byCategory: "By category",
    noExpensesThisMonth: "No expenses recorded this month yet.",

    // Budgets
    monthlyBudgets: "Monthly budgets",
    perCategory: "Per category",
    setLimit: "set limit",
    overBudget: "over budget",

    // Recurring
    newRecurringEntry: "New recurring entry",
    monthly: "Monthly",
    dayOfMonth: "Day of month",
    label: "Label",
    recurringLabelPlaceholder: "e.g. Rent, Netflix, Salary",
    errorDay: "Day of month must be between 1 and 31.",
    addRecurringEntry: "Add recurring entry",
    recurringHint: "Starts this month. Logged automatically to the ledger each time you open the app on or after its day.",
    noRecurringEntries: "No recurring entries yet.",
    dayOfMonthLabel: "day {day} of each month",
    deleteRecurringAria: "Delete recurring entry",

    // Trends
    lastNMonths: "Last {n} months",

    // Language
    language: "Language",
  },
  fr: {
    appName: "Le Grand Livre",
    tagline: "Comptes personnels",

    signIn: "Connexion",
    signUp: "Inscription",
    email: "E-mail",
    password: "Mot de passe",
    createAccount: "Créer un compte",
    pleaseWait: "Veuillez patienter…",
    authMissingFields: "Renseignez un e-mail et un mot de passe.",
    authShortPassword: "Le mot de passe doit contenir au moins 6 caractères.",
    authSignupNotice: "Compte créé. Vérifiez votre e-mail si une confirmation est requise, puis connectez-vous.",

    setupTitle: "Configuration initiale requise",
    setupStep1: "Créez un projet gratuit sur",
    setupStep2Pre: "Dans l'éditeur SQL, exécutez le contenu de",
    setupStep2Post: "depuis ce projet.",
    setupStep3: "Dans Project Settings → API, copiez l'URL du projet et la clé publique anon.",
    setupStep4Pre: "Copiez",
    setupStep4Mid: "vers",
    setupStep4Post: "et collez-y les deux valeurs.",
    setupStep5Pre: "Redémarrez",

    exportCsv: "Exporter CSV",
    backupJson: "Sauvegarde JSON",
    restoreBackup: "Restaurer",
    signOut: "Déconnexion",
    signedInAs: "Connecté en tant que {email}. Vos données sont stockées dans votre propre base — utilisez « Sauvegarde JSON » pour une copie hors ligne.",
    restoreConfirm: "Cela remplacera tout ce qui se trouve actuellement dans l'application par la sauvegarde de ce fichier ({count} transactions). Action irréversible. Continuer ?",
    restoreGenericError: "Impossible de restaurer cette sauvegarde.",
    tabLedger: "Registre",
    tabBudgets: "Budgets",
    tabRecurring: "Récurrent",
    tabTrends: "Tendances",
    allEntries: "Toutes les écritures",

    newEntry: "Nouvelle écriture",
    editEntry: "Modifier l'écriture",
    ledgerSlip: "Bordereau",
    debit: "Débit",
    credit: "Crédit",
    amount: "Montant",
    category: "Catégorie",
    date: "Date",
    note: "Note",
    optional: "(facultatif)",
    notePlaceholder: "À quoi correspond cette écriture ?",
    errorAmount: "Saisissez un montant supérieur à 0.",
    errorDate: "Choisissez une date.",
    cancel: "Annuler",
    saveChanges: "Enregistrer",
    recordEntry: "Ajouter l'écriture",

    emptyLedgerTitle: "Le registre est vide",
    emptyLedgerBody: "Ajoutez votre première écriture pour démarrer le solde.",
    colDate: "Date",
    colCategory: "Catégorie",
    colDescription: "Description",
    colAmount: "Montant",
    edit: "Modifier",
    editEntryAria: "Modifier l'écriture",
    deleteEntryAria: "Supprimer l'écriture",

    thisMonth: "Ce mois-ci",
    income: "Revenus",
    expenses: "Dépenses",
    balance: "Solde",

    byCategory: "Par catégorie",
    noExpensesThisMonth: "Aucune dépense enregistrée ce mois-ci.",

    monthlyBudgets: "Budgets mensuels",
    perCategory: "Par catégorie",
    setLimit: "définir une limite",
    overBudget: "dépassement",

    newRecurringEntry: "Nouvelle écriture récurrente",
    monthly: "Mensuel",
    dayOfMonth: "Jour du mois",
    label: "Libellé",
    recurringLabelPlaceholder: "ex. Loyer, Netflix, Salaire",
    errorDay: "Le jour du mois doit être compris entre 1 et 31.",
    addRecurringEntry: "Ajouter l'écriture récurrente",
    recurringHint: "Débute ce mois-ci. Ajoutée automatiquement au registre à chaque ouverture de l'application à partir de cette date.",
    noRecurringEntries: "Aucune écriture récurrente pour l'instant.",
    dayOfMonthLabel: "le {day} de chaque mois",
    deleteRecurringAria: "Supprimer l'écriture récurrente",

    lastNMonths: "{n} derniers mois",

    language: "Langue",
  },
  ar: {
    appName: "الدفتر",
    tagline: "الحسابات الشخصية",

    signIn: "تسجيل الدخول",
    signUp: "إنشاء حساب",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    createAccount: "إنشاء حساب",
    pleaseWait: "يرجى الانتظار…",
    authMissingFields: "أدخل البريد الإلكتروني وكلمة المرور.",
    authShortPassword: "يجب ألا تقل كلمة المرور عن 6 أحرف.",
    authSignupNotice: "تم إنشاء الحساب. تحقق من بريدك الإلكتروني إذا لزم التأكيد، ثم سجّل الدخول.",

    setupTitle: "الإعداد الأولي مطلوب",
    setupStep1: "أنشئ مشروعًا مجانيًا على",
    setupStep2Pre: "في محرر SQL، نفّذ محتوى الملف",
    setupStep2Post: "من هذا المشروع.",
    setupStep3: "من إعدادات المشروع → API، انسخ رابط المشروع ومفتاح anon العام.",
    setupStep4Pre: "انسخ",
    setupStep4Mid: "إلى",
    setupStep4Post: "والصق القيمتين هناك.",
    setupStep5Pre: "أعد تشغيل",

    exportCsv: "تصدير CSV",
    backupJson: "نسخة احتياطية JSON",
    restoreBackup: "استعادة نسخة",
    signOut: "تسجيل الخروج",
    signedInAs: "تم تسجيل الدخول باسم {email}. بياناتك مخزّنة في قاعدة بياناتك الخاصة — استخدم «نسخة احتياطية JSON» للحصول على نسخة غير متصلة.",
    restoreConfirm: "سيستبدل هذا كل شيء موجود حاليًا في التطبيق بالنسخة الاحتياطية من هذا الملف ({count} معاملة). لا يمكن التراجع عن هذا. متابعة؟",
    restoreGenericError: "تعذّرت استعادة هذه النسخة الاحتياطية.",
    tabLedger: "الدفتر",
    tabBudgets: "الميزانيات",
    tabRecurring: "المتكررة",
    tabTrends: "الاتجاهات",
    allEntries: "جميع القيود",

    newEntry: "قيد جديد",
    editEntry: "تعديل القيد",
    ledgerSlip: "إيصال دفتر",
    debit: "مدين",
    credit: "دائن",
    amount: "المبلغ",
    category: "الفئة",
    date: "التاريخ",
    note: "ملاحظة",
    optional: "(اختياري)",
    notePlaceholder: "ما سبب هذا القيد؟",
    errorAmount: "أدخل مبلغًا أكبر من 0.",
    errorDate: "اختر تاريخًا.",
    cancel: "إلغاء",
    saveChanges: "حفظ التغييرات",
    recordEntry: "تسجيل القيد",

    emptyLedgerTitle: "الدفتر فارغ",
    emptyLedgerBody: "سجّل أول قيد لبدء الرصيد الجاري.",
    colDate: "التاريخ",
    colCategory: "الفئة",
    colDescription: "الوصف",
    colAmount: "المبلغ",
    edit: "تعديل",
    editEntryAria: "تعديل القيد",
    deleteEntryAria: "حذف القيد",

    thisMonth: "هذا الشهر",
    income: "الدخل",
    expenses: "المصاريف",
    balance: "الرصيد",

    byCategory: "حسب الفئة",
    noExpensesThisMonth: "لا توجد مصاريف مسجّلة هذا الشهر بعد.",

    monthlyBudgets: "الميزانيات الشهرية",
    perCategory: "لكل فئة",
    setLimit: "تحديد حد",
    overBudget: "تجاوز الميزانية",

    newRecurringEntry: "قيد متكرر جديد",
    monthly: "شهري",
    dayOfMonth: "يوم الشهر",
    label: "التسمية",
    recurringLabelPlaceholder: "مثال: الإيجار، Netflix، الراتب",
    errorDay: "يجب أن يكون يوم الشهر بين 1 و31.",
    addRecurringEntry: "إضافة القيد المتكرر",
    recurringHint: "يبدأ هذا الشهر. يُسجَّل تلقائيًا في الدفتر في كل مرة تفتح فيها التطبيق في يومه المحدد أو بعده.",
    noRecurringEntries: "لا توجد قيود متكررة بعد.",
    dayOfMonthLabel: "اليوم {day} من كل شهر",
    deleteRecurringAria: "حذف القيد المتكرر",

    lastNMonths: "آخر {n} أشهر",

    language: "اللغة",
  },
};

export function translate(lang, key, vars) {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
  let str = dict[key] ?? TRANSLATIONS.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(`{${k}}`, v);
    }
  }
  return str;
}

export function categoryLabel(lang, categoryId) {
  return CATEGORY_LABELS[categoryId]?.[lang] ?? CATEGORY_LABELS[categoryId]?.en ?? categoryId;
}
