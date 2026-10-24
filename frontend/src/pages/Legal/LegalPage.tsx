import { Link } from 'react-router-dom'
import { TopBar } from '../../components/common/TopBar'
import { useTranslation } from '../../i18n'

interface LegalPageProps {
  document: 'terms' | 'privacy'
}

interface LegalSection {
  title: string
  paragraphs?: readonly string[]
  items?: readonly string[]
  pageLink?: { before: string; to: string; label: string; after: string }
  contactLine?: string
}

interface LegalDocument {
  title: string
  intro: string
  lastUpdatedLabel: string
  studentNote: string
  sections: readonly LegalSection[]
}

const CONTACT_EMAIL = 'mohamedamintarza@gmail.com'
const LAST_UPDATED_EN = '14 October 2026'
const LAST_UPDATED_FR = '14 octobre 2026'
const LAST_UPDATED_AR = '14 أكتوبر 2026'

const documentsEn: Record<LegalPageProps['document'], LegalDocument> = {
  privacy: {
    title: 'Privacy Policy',
    intro:
      'This page explains what AutoWallet collects about you, why, who else receives it, how long we keep it, and what you can do about it.',
    lastUpdatedLabel: 'Last updated: ' + LAST_UPDATED_EN,
    studentNote:
      'AutoWallet is a student project (ft_transcendence at 1337, part of the 42 network). Questions about this page or your data? Write to ',
    sections: [
      {
        title: 'Who is responsible',
        paragraphs: [
          "AutoWallet is built and run by the student team listed in our project's README, as our ft_transcendence project at 1337 (42 network) in Morocco. The team is responsible for the personal data described on this page.",
        ],
        contactLine: 'Contact:',
      },
      {
        title: 'What we collect',
        items: [
          'Account: your full name, email address, password and bank account ID. We store only a bcrypt hash of your password, never the password itself.',
          'Google sign-in, if you use it: your Google account ID, name and email address. We never receive your Google password.',
          'Two-factor authentication, if you turn it on: a secret key used to check your 6-digit codes.',
          'Your budget: the balances of your five envelopes (main, rent, tax, savings and free), your splitting rules, your payments (reference, amount, status and dates), and how much of each payment went into each envelope.',
          'AI assistant: the questions you ask it (see "The AI assistant and Google Gemini" below).',
        ],
      },
      {
        title: 'Why we use it',
        items: [
          'To create your account and let you sign in securely.',
          'To split each payment between your envelopes according to your rules, and to show you your balances and history.',
          'To show you charts and totals of your payments for the period you choose (the Analytics page), and to export them as a CSV or PDF file when you ask.',
          'To answer your questions with the AI assistant, using your own envelopes and rules.',
          'To email you about your account, for example the code that confirms deleting it, or a notice when your data is exported.',
          'To keep the service safe, for example by limiting how many AI questions each account can send per minute.',
        ],
      },
      {
        title: 'The AI assistant and Google Gemini',
        paragraphs: [
          'When you ask the assistant a question, AutoWallet sends it to Gemini, an AI service run by Google, together with your current envelope balances, your active rules and your last five payments (date, amount and status). We do not send your name, email address, password or bank account ID.',
          "AutoWallet does not save your questions or the assistant's answers. Google processes them under its own terms, and on the free version of Gemini, Google may use them to improve its products. Please do not type personal details you want to keep private into your questions.",
        ],
      },
      {
        title: 'Information stored in your browser',
        items: [
          'After you sign in, your browser keeps an access token in local storage. It is removed when you log out, and it stops working after 24 hours.',
          "While you sign up, the details you type (email address, first and last name, bank account ID and rule values) are kept in session storage, and your password stays only in the page's memory. They are deleted when you finish signing up or close the tab.",
          'If you sign in with Google, the server sets one small security cookie that protects the sign-in from attacks. It lasts 10 minutes at most.',
          'AutoWallet does not use advertising or tracking cookies.',
        ],
      },
      {
        title: 'Who else receives your data',
        items: [
          'Google, when you choose to sign in with Google, and when you use the AI assistant (Gemini).',
          'Our bank simulator, a test service run by the team, which only knows your bank account ID and simulated payments.',
          'Our email service, which delivers the emails we send you. It receives your email address and the message.',
          'Nobody else: we do not sell your data, and we do not use advertising or analytics services.',
        ],
      },
      {
        title: 'How long we keep it',
        items: [
          'Your account, envelopes, rules and payments: until you delete your account or ask us to delete it.',
          'Your AI questions and answers: not stored by AutoWallet.',
          'The counter that limits AI questions: deleted automatically after 60 seconds.',
          'The code that confirms deleting your account: 15 minutes at most.',
          'The access token in your browser: until you log out. It stops working after 24 hours.',
        ],
      },
      {
        title: 'How we protect it',
        items: [
          'Passwords are stored only as bcrypt hashes.',
          'Sign-in tokens are signed by our server and stop working after 24 hours.',
          'You can turn on two-factor authentication for extra protection.',
          'Each account can only read its own envelopes, rules and payments.',
          'Secret keys, such as the AI service key, stay on the server and are never sent to your browser.',
        ],
      },
      {
        title: 'Your rights',
        pageLink: {
          before: 'You can download a copy of your data (JSON or CSV) or delete your account yourself, at any time, on the',
          to: '/account/privacy',
          label: 'Privacy & data',
          after: ' page of your account. To delete it, you type a 6-digit code that we send to your email address.',
        },
        paragraphs: [
          'You can also write to us to see a copy of your data, to correct it, or to delete your account and all its data. We answer within 30 days.',
          'These rights come from the EU General Data Protection Regulation (GDPR) and from Moroccan law 09-08 on the protection of personal data.',
        ],
        contactLine: 'To use them, write to us at',
      },
      {
        title: 'Changes to this page',
        paragraphs: ['When we change this policy, we update the date at the top of this page.'],
      },
    ],
  },
  terms: {
    title: 'Terms of Service',
    intro:
      'These terms explain what AutoWallet is, what you can expect from it, and what we expect from you. By creating an account, you accept them.',
    lastUpdatedLabel: 'Last updated: ' + LAST_UPDATED_EN,
    studentNote:
      'AutoWallet is a student project (ft_transcendence at 1337, part of the 42 network). Questions about this page or your data? Write to ',
    sections: [
      {
        title: 'What AutoWallet is',
        paragraphs: [
          'AutoWallet is a budgeting tool: when a payment arrives, it divides the amount between your envelopes (main, rent, tax, savings and free) according to rules you choose.',
          'AutoWallet is a budgeting ledger, not a bank. It never holds, moves or transfers real money, and it does not connect to your real bank account.',
        ],
      },
      {
        title: 'Your account',
        items: [
          'Give accurate information, and only link a bank account ID that you are allowed to use.',
          'Keep your password private. We recommend turning on two-factor authentication.',
          'You are responsible for what happens in your account. Tell us quickly if you think someone else is using it.',
          'One account per person.',
        ],
      },
      {
        title: 'Payments and previews',
        items: [
          'Payments come from our bank simulator, a test service that creates simulated payments. They are not real transfers.',
          'The Try a payment screen during signup is calculated in your browser. It does not submit a payment or change any balance.',
          'The rule values you choose during signup (rent amount, tax %, savings % and savings cap) are saved as your account rules.',
          'Always check calculated amounts yourself before relying on them.',
        ],
      },
      {
        title: 'The AI assistant',
        items: [
          'Its answers are written automatically by an AI model and can be wrong or incomplete.',
          'It is not financial, tax or legal advice. For important decisions, check with an official source or a qualified accountant.',
          'To keep the service fair, each account can ask a limited number of questions per minute (currently 20).',
          "Do not use it to share other people's personal data.",
        ],
      },
      {
        title: 'Acceptable use',
        items: [
          "Do not try to access other users' accounts or data.",
          'Do not attack, overload or scan the service, or try to get around its limits.',
          'Do not use AutoWallet for anything illegal or harmful.',
        ],
      },
      {
        title: 'Availability',
        paragraphs: [
          'AutoWallet is a student project. We provide it as it is, without any guarantee: it may contain mistakes, change, be unavailable or stop at any time, and data may be reset while we develop it.',
        ],
      },
      {
        title: 'Liability',
        paragraphs: [
          "As far as the law allows, the AutoWallet team is not responsible for any loss caused by using AutoWallet, by relying on its calculations, or by following the AI assistant's answers.",
        ],
      },
      {
        title: 'Ending your account',
        paragraphs: [
          'You can stop using AutoWallet at any time and ask us to delete your account and its data, as explained in the Privacy Policy. We may suspend an account that breaks these terms.',
        ],
      },
      {
        title: 'Changes to these terms',
        paragraphs: [
          'We may update these terms. The date at the top of this page shows the latest version. If you keep using AutoWallet after a change, you accept the new terms.',
        ],
      },
      {
        title: 'Contact',
        contactLine: 'Questions about these terms? Write to us at',
      },
    ],
  },
}

const documentsFr: Record<LegalPageProps['document'], LegalDocument> = {
  privacy: {
    title: 'Politique de confidentialité',
    intro:
      'Cette page explique ce qu’AutoWallet recueille sur vous, pourquoi, qui d’autre le reçoit, combien de temps nous le conservons et ce que vous pouvez faire à ce sujet.',
    lastUpdatedLabel: 'Dernière mise à jour : ' + LAST_UPDATED_FR,
    studentNote:
      'AutoWallet est un projet étudiant (ft_transcendence à 1337, réseau 42). Des questions sur cette page ou sur vos données ? Écrivez à ',
    sections: [
      {
        title: 'Qui est responsable',
        paragraphs: [
          'AutoWallet est conçu et géré par l’équipe d’étudiants mentionnée dans le README de notre projet, dans le cadre de notre projet ft_transcendence à 1337 (réseau 42) au Maroc. L’équipe est responsable des données personnelles décrites sur cette page.',
        ],
        contactLine: 'Contact :',
      },
      {
        title: 'Ce que nous recueillons',
        items: [
          'Compte : votre nom complet, votre adresse e-mail, votre mot de passe et votre RIB. Nous ne conservons qu’un hachage bcrypt de votre mot de passe, jamais le mot de passe lui-même.',
          'Connexion Google, si vous l’utilisez : votre identifiant Google, votre nom et votre adresse e-mail. Nous ne recevons jamais votre mot de passe Google.',
          'Authentification à deux facteurs, si vous l’activez : une clé secrète pour vérifier vos codes à 6 chiffres.',
          'Votre budget : les soldes de vos cinq enveloppes, vos règles de répartition, vos paiements et l’historique des versements.',
          'Assistant IA : les questions que vous lui posez.',
        ],
      },
      {
        title: 'Pourquoi nous l’utilisons',
        items: [
          'Pour créer votre compte et vous permettre de vous connecter en toute sécurité.',
          'Pour répartir chaque paiement entre vos enveloppes selon vos règles.',
          'Pour vous afficher des graphiques et des bilans de vos paiements (page Analyses) et les exporter au format CSV ou PDF.',
          'Pour répondre à vos questions avec l’assistant IA en utilisant vos enveloppes et vos règles.',
          'Pour sécuriser le service en limitant les requêtes abusives.',
        ],
      },
      {
        title: 'L’assistant IA et Google Gemini',
        paragraphs: [
          'Lorsque vous posez une question à l’assistant, AutoWallet l’envoie à Gemini, un service d’IA géré par Google, accompagné des soldes actuels de vos enveloppes, de vos règles actives et de vos 5 derniers paiements. Nous n’envoyons ni votre nom, ni votre e-mail, ni votre mot de passe, ni votre RIB.',
          'AutoWallet n’enregistre pas vos questions ni les réponses de l’assistant. Veuillez ne pas inclure de données sensibles ou confidentielles dans vos questions.',
        ],
      },
      {
        title: 'Informations stockées dans votre navigateur',
        items: [
          'Après votre connexion, votre navigateur conserve un jeton d’accès dans le stockage local. Il est supprimé lors de la déconnexion et expire après 24 heures.',
          'AutoWallet n’utilise aucun cookie publicitaire ou de pistage.',
        ],
      },
      {
        title: 'Qui d’autre reçoit vos données',
        items: [
          'Google, lorsque vous choisissez la connexion Google ou utilisez l’assistant IA (Gemini).',
          'Notre simulateur bancaire interne de test.',
          'Notre service d’envoi d’e-mails (pour les confirmations et codes de sécurité).',
          'Personne d’autre : nous ne vendons aucune de vos données.',
        ],
      },
      {
        title: 'Combien de temps nous les conservons',
        items: [
          'Vos données de compte : jusqu’à ce que vous supprimiez votre compte.',
          'Questions et réponses IA : non stockées par AutoWallet.',
          'Les jetons d’accès : 24 heures maximum.',
        ],
      },
      {
        title: 'Comment nous les protégeons',
        items: [
          'Les mots de passe sont hachés avec bcrypt.',
          'Les jetons sont signés cryptographiquement et expirent après 24 heures.',
          'Possibilité d’activer l’authentification à deux facteurs.',
        ],
      },
      {
        title: 'Vos droits',
        pageLink: {
          before: 'Vous pouvez télécharger une copie de vos données (JSON ou CSV) ou supprimer votre compte à tout moment sur la page',
          to: '/account/privacy',
          label: 'Données et confidentialité',
          after: ' de votre compte.',
        },
        paragraphs: [
          'Ces droits sont conformes au RGPD et à la loi marocaine 09-08 relative à la protection des données personnelles.',
        ],
        contactLine: 'Pour les exercer, écrivez-nous à',
      },
      {
        title: 'Modifications de cette page',
        paragraphs: ['En cas de modification, nous mettons à jour la date en haut de cette page.'],
      },
    ],
  },
  terms: {
    title: 'Conditions d’utilisation',
    intro:
      'Ces conditions expliquent ce qu’est AutoWallet, ce que vous pouvez en attendre et ce que nous attendons de vous. En créant un compte, vous les acceptez.',
    lastUpdatedLabel: 'Dernière mise à jour : ' + LAST_UPDATED_FR,
    studentNote:
      'AutoWallet est un projet étudiant (ft_transcendence à 1337, réseau 42). Des questions sur cette page ou sur vos données ? Écrivez à ',
    sections: [
      {
        title: 'Ce qu’est AutoWallet',
        paragraphs: [
          'AutoWallet est un outil de gestion budgétaire : à chaque versement reçu, il le répartit entre vos enveloppes selon vos règles.',
          'AutoWallet n’est pas une banque. Il ne détient ni ne transfère jamais d’argent réel et n’est pas relié à votre compte bancaire réel.',
        ],
      },
      {
        title: 'Votre compte',
        items: [
          'Fournissez des informations exactes.',
          'Conservez votre mot de passe confidentiel.',
          'Un seul compte par personne.',
        ],
      },
      {
        title: 'Paiements et aperçus',
        items: [
          'Les paiements proviennent de notre simulateur de test, ce ne sont pas de véritables transferts financiers.',
          'Vérifiez toujours vos montants avant de vous y fier.',
        ],
      },
      {
        title: 'L’assistant IA',
        items: [
          'Les réponses sont générées automatiquement et peuvent comporter des erreurs.',
          'Ceci ne constitue en aucun cas un conseil financier, fiscal ou juridique.',
        ],
      },
      {
        title: 'Utilisation acceptable',
        items: [
          'Ne tentez pas d’accéder aux comptes d’autrui.',
          'N’attaquez pas le service et ne contournez pas ses limites.',
          'N’utilisez pas AutoWallet à des fins illégales.',
        ],
      },
      {
        title: 'Disponibilité',
        paragraphs: [
          'AutoWallet est un projet éducatif fourni tel quel, sans garantie de disponibilité continue.',
        ],
      },
      {
        title: 'Responsabilité',
        paragraphs: [
          'Dans la mesure permise par la loi, l’équipe AutoWallet n’est pas responsable des pertes résultant de l’utilisation de l’application.',
        ],
      },
      {
        title: 'Clôture de votre compte',
        paragraphs: [
          'Vous pouvez fermer votre compte à tout moment depuis les paramètres de confidentialité.',
        ],
      },
      {
        title: 'Modifications de ces conditions',
        paragraphs: [
          'Nous pouvons mettre à jour ces conditions. L’utilisation continue du service vaut acceptation.',
        ],
      },
      {
        title: 'Contact',
        contactLine: 'Des questions sur ces conditions ? Écrivez-nous à',
      },
    ],
  },
}

const documentsAr: Record<LegalPageProps['document'], LegalDocument> = {
  privacy: {
    title: 'سياسة الخصوصية',
    intro:
      'تشرح هذه الصفحة ما تجمعه AutoWallet عنك، ولماذا، ومن يتلقاه، ومدة احتفاظنا به، وحقوقك بشأنه.',
    lastUpdatedLabel: 'آخر تحديث: ' + LAST_UPDATED_AR,
    studentNote:
      'AutoWallet هو مشروع طلابي (ft_transcendence في 1337، شبكة 42). هل لديك استفسارات حول هذه الصفحة أو بياناتك؟ راسلنا على ',
    sections: [
      {
        title: 'من هو المسؤول',
        paragraphs: [
          'تم بناء AutoWallet وإدارته بواسطة فريق الطلاب المدرج في ملف README الخاص بالمشروع، كمشروع ft_transcendence في مدرسة 1337 (شبكة 42) في المغرب. الفريق مسؤول عن البيانات الشخصية الموضحة في هذه الصفحة.',
        ],
        contactLine: 'الاتصال:',
      },
      {
        title: 'ما نجمعه',
        items: [
          'الحساب: اسمك الكامل، عنوان بريدك الإلكتروني، كلمة المرور ومعرف حسابك البنكي (RIB). نقوم بتخزين تجزئة bcrypt فقط لكلمة مرورك، ولا نخزن كلمة المرور أبداً.',
          'تسجيل الدخول عبر Google: معرف حساب Google واسمك وبريدك الإلكتروني.',
          'المصادقة الثنائية (2FA): مفتاح سري يستخدم للتحقق من الرموز المكونة من 6 أرقام.',
          'ميزانيتك: أرصدة أظرفك الخمسة، وقواعد التقسيم، والدفعات وتوزيعاتها.',
          'المساعد الذكي: الأسئلة التي تطرحها عليه.',
        ],
      },
      {
        title: 'لماذا نستخدمها',
        items: [
          'لإنشاء حسابك وتمكينك من تسجيل الدخول بأمان.',
          'لتقسيم كل دفعة بين أظرفك وفقاً لقواعدك وعرض أرصدتك وتاريخ معاملاتك.',
          'لعرض الرسوم البيانية وتصديرها كملفات CSV أو PDF.',
          'للإجابة على أسئلتك المالية باستخدام المساعد الذكي.',
          'لإرسال رسائل الأمان مثل تأكيد حذف الحساب أو تنبيهات تصدير البيانات.',
        ],
      },
      {
        title: 'المساعد الذكي وGoogle Gemini',
        paragraphs: [
          'عندما تسأل المساعد سؤالاً، ترسل AutoWallet السؤال إلى Gemini، وهي خدمة ذكاء اصطناعي تديرها Google، إلى جانب أرصدة أظرفك الحالية وقواعدك النشطة وآخر 5 دفعات. نحن لا نرسل اسمك أو بريدك الإلكتروني أو كلمة المرور أو رقم حسابك البنكي.',
          'لا تحفظ AutoWallet أسئلتك أو إجابات المساعد. يرجى عدم كتابة تفاصيل شخصية أو سرية في أسئلتك.',
        ],
      },
      {
        title: 'المعلومات المخزنة في متصفحك',
        items: [
          'بعد تسجيل الدخول، يحتفظ متصفحك برمز وصول في التخزين المحلي. تتم إزالته عند تسجيل الخروج، وتنتهي صلاحيته بعد 24 ساعة.',
          'لا تستخدم AutoWallet ملفات تعريف الارتباط الإعلانية أو التتبعية.',
        ],
      },
      {
        title: 'من يتلقى بياناتك أيضاً',
        items: [
          'Google، عند اختيار تسجيل الدخول باستخدام Google أو استخدام المساعد الذكي.',
          'محاكي البنك التجريبي الخاص بنا.',
          'خدمة البريد الإلكتروني لإرسال الرسائل الرسمية.',
          'لا أحد آخر: نحن لا نبيع بياناتك أبداً.',
        ],
      },
      {
        title: 'مدة احتفاظنا بالبيانات',
        items: [
          'بيانات حسابك وأظرفك وقواعدك: حتى تقوم بحذف حسابك.',
          'أسئلة وإجابات الذكاء الاصطناعي: لا يتم تخزينها في خوادم AutoWallet.',
          'رموز الوصول: 24 ساعة كحد أقصى.',
        ],
      },
      {
        title: 'كيف نحمي بياناتك',
        items: [
          'يتم تشفير كلمات المرور باستخدام خوارزمية bcrypt.',
          'رموز تسجيل الدخول موقعة رقمياً وتتوقف بعد 24 ساعة.',
          'إمكانية تفعيل المصادقة الثنائية لحماية إضافية.',
        ],
      },
      {
        title: 'حقوقك',
        pageLink: {
          before: 'يمكنك تنزيل نسخة من بياناتك أو حذف حسابك بنفسك في أي وقت من صفحة',
          to: '/account/privacy',
          label: 'البيانات والخصوصية',
          after: ' في حسابك.',
        },
        paragraphs: [
          'تستند هذه الحقوق إلى اللائحة العامة لحماية البيانات (GDPR) والقانون المغربي 09-08 المتعلق بحماية الأشخاص الذاتيين تجاه معالجة المعطيات ذات الطابع الشخصي.',
        ],
        contactLine: 'لممارسة هذه الحقوق، راسلنا على',
      },
      {
        title: 'التغييرات على هذه الصفحة',
        paragraphs: ['عندما نقوم بتحديث هذه السياسة، نقوم بتحديث التاريخ أعلى هذه الصفحة.'],
      },
    ],
  },
  terms: {
    title: 'شروط الخدمة',
    intro:
      'توضح هذه الشروط طبيعة AutoWallet، وما يمكنك توقعه منها، وما نتوقعه منك. بإنشاء حساب، فإنك تقبل بهذه الشروط.',
    lastUpdatedLabel: 'آخر تحديث: ' + LAST_UPDATED_AR,
    studentNote:
      'AutoWallet هو مشروع طلابي (ft_transcendence في 1337، شبكة 42). هل لديك استفسارات حول هذه الصفحة أو بياناتك؟ راسلنا على ',
    sections: [
      {
        title: 'ما هي AutoWallet',
        paragraphs: [
          'AutoWallet هي أداة لتخطيط وإدارة الميزانية: عندما تصل دفعة، فإنها تقسم المبلغ بين أظرفك وفقاً لقواعد تختارها.',
          'AutoWallet ليست بنكاً. إنها لا تحتفظ بأموال حقيقية ولا تنقلها، ولا تتصل بحسابك البنكي الفعلي.',
        ],
      },
      {
        title: 'حسابك',
        items: [
          'قدم معلومات صحيحة ودقيقة.',
          'حافظ على سرية كلمة المرور الخاصة بك. نوصي بتفعيل المصادقة الثنائية.',
          'حساب واحد لكل شخص.',
        ],
      },
      {
        title: 'الدفعات والمعاينات',
        items: [
          'تأتي الدفعات من محاكي البنك التجريبي الخاص بنا، وليست تحويلات مالية حقيقية.',
          'تحقق دائماً من المبالغ المحسوبة بنفسك قبل الاعتماد عليها.',
        ],
      },
      {
        title: 'المساعد الذكي',
        items: [
          'تتم كتابة إجاباته تلقائياً بواسطة نموذج ذكاء اصطناعي ويمكن أن تحتوي على أخطاء.',
          'لا تشكل إجاباته أي استشارة مالية أو ضريبية أو قانونية.',
        ],
      },
      {
        title: 'الاستخدام المقبول',
        items: [
          'لا تحاول الوصول إلى حسابات المستخدمين الآخرين أو بياناتهم.',
          'لا تهاجم الخدمة أو تحاول تجاوز حدودها.',
          'لا تستخدم AutoWallet لأي غرض غير قانوني.',
        ],
      },
      {
        title: 'التوفر والجاهزية',
        paragraphs: [
          'AutoWallet هو مشروع تعليمي طلابي مقدم كما هو، دون أي ضمان للتوفر المستمر.',
        ],
      },
      {
        title: 'المسؤولية القانونية',
        paragraphs: [
          'إلى أقصى حد يسمح به القانون، لا يتحمل فريق AutoWallet أي مسؤولية عن أي خسارة ناجمة عن استخدام التطبيق أو الاعتماد على حساباته.',
        ],
      },
      {
        title: 'إنهاء حسابك',
        paragraphs: [
          'يمكنك التوقف عن استخدام AutoWallet وحذف حسابك وبياناتك في أي وقت من إعدادات الخصوصية.',
        ],
      },
      {
        title: 'التغييرات على هذه الشروط',
        paragraphs: [
          'يجوز لنا تحديث هذه الشروط. إذا واصلت استخدام AutoWallet بعد التغيير، فهذا يعني قبولك بالشروط الجديدة.',
        ],
      },
      {
        title: 'الاتصال',
        contactLine: 'هل لديك أسئلة حول هذه الشروط؟ راسلنا على',
      },
    ],
  },
}

function ContactLink() {
  return (
    <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-[#4A53A0] underline">
      {CONTACT_EMAIL}
    </a>
  )
}

export function LegalPage({ document }: LegalPageProps) {
  const { lang, t } = useTranslation()
  const content = lang === 'fr' ? documentsFr[document] : lang === 'ar' ? documentsAr[document] : documentsEn[document]

  return (
    <div className="min-h-screen bg-[#F3F6FA] flex flex-col">
      <TopBar />
      <main className="w-full max-w-[760px] mx-auto flex-1 px-4 py-8 sm:py-12">
        <article className="rounded-2xl border border-[#DDE3EA] bg-white p-6 sm:p-10 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#5A64B4]">AutoWallet</p>
          <h1 className="mt-2 text-3xl font-bold text-[#1A2330]">{content.title}</h1>
          <p className="mt-1 text-sm text-[#5E6B7E]">{content.lastUpdatedLabel}</p>
          <p className="mt-3 text-[#5E6B7E] leading-relaxed">{content.intro}</p>
          <div className="mt-8 space-y-7">
            {content.sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-lg font-semibold text-[#1A2330]">{section.title}</h2>
                {section.pageLink && (
                  <p className="mt-2 text-sm leading-7 text-[#3B495D]">
                    {section.pageLink.before}{' '}
                    <Link to={section.pageLink.to} className="font-medium text-[#4A53A0] underline">
                      {section.pageLink.label}
                    </Link>
                    {section.pageLink.after}
                  </p>
                )}
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph} className="mt-2 text-sm leading-7 text-[#3B495D]">
                    {paragraph}
                  </p>
                ))}
                {section.items && (
                  <ul className="mt-2 list-disc space-y-1.5 ps-5 text-sm leading-7 text-[#3B495D]">
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
                {section.contactLine && (
                  <p className="mt-2 text-sm leading-7 text-[#3B495D]">
                    {section.contactLine} <ContactLink />.
                  </p>
                )}
              </section>
            ))}
          </div>
          <p className="mt-8 rounded-xl bg-[#ECEEFA] px-4 py-3 text-sm text-[#3B495D]">
            {content.studentNote}
            <ContactLink />.
          </p>
          <nav aria-label="Account and legal pages" className="mt-8 flex flex-wrap gap-5 text-sm font-medium text-[#4A53A0]">
            <Link to="/login" className="hover:underline">{t.legalBackToLogin}</Link>
            <Link to={document === 'terms' ? '/privacy' : '/terms'} className="hover:underline">
              {document === 'terms' ? t.legalPrivacyTitle : t.legalTermsTitle}
            </Link>
          </nav>
        </article>
      </main>
    </div>
  )
}
