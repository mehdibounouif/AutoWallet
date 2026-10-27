import type { LegalDocuments } from './types'

const LAST_UPDATED_FR = '14 octobre 2026'

export const legalFr: LegalDocuments = {
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
