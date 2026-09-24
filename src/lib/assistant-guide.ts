import type { UserRole } from "@/components/auth/auth-provider";

export type GuideReply = {
  text: string;
  href?: string;
  link?: string;
};

type Locale = "en" | "fr";

type Topic = {
  id: string;
  keywords: string[];
  en: string;
  fr: string;
  href?: string;
  linkEn?: string;
  linkFr?: string;
  pharmacy?: boolean;
};

const TOPICS: Topic[] = [
  {
    id: "medical",
    keywords: [
      "posologie",
      "effet secondaire",
      "effets secondaires",
      "side effect",
      "enceinte",
      "grossesse",
      "pregnant",
      "surdosage",
      "overdose",
      "quelle dose",
      "what dose",
      "how many tablets",
      "combien de comprimes",
      "is it safe",
      "est ce dangereux",
    ],
    en: "I help you use AIDCELIX. For a dose, a side effect, or any health question, follow the doctor’s paper and ask the pharmacist.",
    fr: "Je vous aide à utiliser AIDCELIX. Pour une dose, un effet secondaire, ou une question de santé, suivez l’ordonnance du médecin et demandez au pharmacien.",
  },
  {
    id: "scan",
    keywords: [
      "scan",
      "scanner",
      "photo",
      "photograph",
      "camera",
      "camera",
      "ordonnance",
      "prescription",
      "notice",
      "booklet",
      "lire les medicaments",
    ],
    en: "Open Scan a prescription. Photograph the doctor’s paper, or the medication booklet. Keep the page flat and bright. Then tap Read medications. If a handwritten line is wrong, correct the text and search again. Choose the right product, then order from the nearest pharmacy that has it.",
    fr: "Ouvrez Scanner une ordonnance. Photographiez l’ordonnance du médecin, ou la notice du médicament. Gardez la page à plat, avec une bonne lumière. Appuyez ensuite sur Lire les médicaments. Si une ligne manuscrite est mal lue, corrigez le texte, puis relancez la recherche. Choisissez le bon produit, puis commandez dans la pharmacie la plus proche qui l’a.",
    href: "/scan",
    linkEn: "Open the scanner",
    linkFr: "Ouvrir le scanner",
  },
  {
    id: "search",
    keywords: [
      "search",
      "recherch",
      "find a medicine",
      "find medicine",
      "trouver",
      "trouver un medicament",
      "paracetamol",
      "paracetamol",
      "nom du medicament",
      "en stock",
      "in stock",
      "disponible",
    ],
    en: "Type the medicine name in the search bar. You can use the brand, the generic name, or the category. AIDCELIX lists the nearest pharmacies that have it in stock. Open a result to see the price and order.",
    fr: "Écrivez le nom du médicament dans la barre de recherche. Vous pouvez utiliser la marque, le nom générique, ou la catégorie. AIDCELIX affiche les pharmacies les plus proches qui l’ont en stock. Ouvrez un résultat pour voir le prix et commander.",
    href: "/search",
    linkEn: "Search medicines",
    linkFr: "Rechercher un médicament",
  },
  {
    id: "location",
    keywords: ["gps", "location", "localisation", "position", "nearby", "proche", "adresse", "zone"],
    en: "Allow location when the browser asks. AIDCELIX then sorts pharmacies from the closest one. If location is blocked, type your area. The delivery address itself is entered later, when you place the order.",
    fr: "Autorisez la position quand le navigateur le demande. AIDCELIX classe alors les pharmacies en commençant par la plus proche. Si la position est bloquée, saisissez votre zone. L’adresse de livraison se remplit plus tard, au moment de la commande.",
  },
  {
    id: "order",
    keywords: ["order", "commander", "commande", "nearest", "pharmacie la plus proche", "add to cart", "panier"],
    en: "Open the medicine, then choose Order here on the nearest in-stock pharmacy. It goes into your cart. Open the cart, then continue to checkout. You need an account before you pay.",
    fr: "Ouvrez le médicament, puis choisissez Commander ici sur la pharmacie en stock la plus proche. Il va dans votre panier. Ouvrez le panier, puis continuez vers le paiement. Un compte est nécessaire avant de payer.",
    href: "/cart",
    linkEn: "Open the cart",
    linkFr: "Ouvrir le panier",
  },
  {
    id: "order-pay",
    keywords: ["commander et payer", "order and pay", "commande et paiement"],
    en: "Open the medicine and tap Order here on the nearest pharmacy that has it. From the cart, continue to checkout and enter the delivery address. Confirm, then pay with MTN Money or Orange Money. AIDCELIX gives you a collection code for that pharmacy. Show it so they know the medication is yours.",
    fr: "Ouvrez le médicament et appuyez sur Commander ici, sur la pharmacie la plus proche qui l’a. Depuis le panier, continuez vers le paiement et indiquez l’adresse de livraison. Confirmez, puis payez avec MTN Money ou Orange Money. AIDCELIX vous donne un code de remise pour cette pharmacie. Présentez-le pour qu’elle sache que le médicament vous appartient.",
    href: "/cart",
    linkEn: "Open the cart",
    linkFr: "Ouvrir le panier",
  },
  {
    id: "checkout",
    keywords: ["checkout", "delivery address", "adresse de livraison", "livraison", "where to deliver", "ou livrer"],
    en: "At checkout, enter the delivery address for this order. Neighbourhood, city, and a landmark are enough. The address is not asked when you create the account. Check the pharmacy, the medicines, and the total, then confirm.",
    fr: "Au paiement, indiquez l’adresse de livraison de cette commande. Le quartier, la ville, et un repère suffisent. Cette adresse n’est pas demandée à la création du compte. Vérifiez la pharmacie, les médicaments, et le total, puis confirmez.",
    href: "/checkout",
    linkEn: "Go to checkout",
    linkFr: "Aller au paiement",
  },
  {
    id: "pay",
    keywords: ["pay", "payer", "paiement", "momo", "mtn", "orange money", "orange", "mobile money"],
    en: "After you confirm the order, pay in the app with MTN Money or Orange Money. Enter the phone number that will be charged. When the payment succeeds, Gozem is notified for delivery.",
    fr: "Après avoir confirmé la commande, payez dans l’application avec MTN Money ou Orange Money. Indiquez le numéro qui sera débité. Quand le paiement réussit, Gozem est prévenu pour la livraison.",
  },
  {
    id: "track",
    keywords: ["track", "suivi", "gozem", "delivery status", "ou est", "commande en cours", "my order", "mes commandes"],
    en: "Open your orders to follow the command. You will see payment, preparation, and the Gozem delivery status, from pickup to your door.",
    fr: "Ouvrez vos commandes pour suivre la commande. Vous y voyez le paiement, la préparation, et le statut Gozem, de la collecte jusqu’à votre porte.",
    href: "/orders",
    linkEn: "View orders",
    linkFr: "Voir les commandes",
  },
  {
    id: "account",
    keywords: ["account", "compte", "sign up", "signup", "register", "inscription", "login", "connexion", "password", "mot de passe"],
    en: "Create an account with your name, email, phone, and password. Choose customer, or pharmacy. Customers use the store login. The delivery address is asked only when you place an order.",
    fr: "Créez un compte avec votre nom, votre e-mail, votre téléphone, et un mot de passe. Choisissez client, ou pharmacie. Les clients utilisent la connexion de la boutique. L’adresse de livraison n’est demandée qu’au moment de la commande.",
    href: "/register",
    linkEn: "Create an account",
    linkFr: "Créer un compte",
  },
  {
    id: "language",
    keywords: ["french", "english", "francais", "anglais", "language", "langue", "traduire", "translate"],
    en: "Use the EN / FR button at the top of the page. The whole app switches between English and French, and I answer in the same language.",
    fr: "Utilisez le bouton EN / FR en haut de la page. Toute l’application passe du français à l’anglais, et je réponds dans la même langue.",
  },
  {
    id: "pharmacy-start",
    keywords: [
      "pharmacy account",
      "compte pharmacie",
      "i am a pharmacy",
      "je suis une pharmacie",
      "register pharmacy",
      "inscription pharmacie",
      "pharmacy dashboard",
      "tableau de bord pharmacie",
    ],
    pharmacy: true,
    en: "On the sign-up page, choose pharmacy. After login, open the dashboard. First save the pharmacy name, address, phone, opening hours, and preparation time. The catalog opens after the pharmacy is saved.",
    fr: "Sur la page d’inscription, choisissez pharmacie. Après la connexion, ouvrez le tableau de bord. Enregistrez d’abord le nom, l’adresse, le téléphone, les horaires, et le temps de préparation. Le catalogue s’ouvre une fois la pharmacie enregistrée.",
    href: "/dashboard/pharmacy",
    linkEn: "Open the pharmacy dashboard",
    linkFr: "Ouvrir le tableau de bord pharmacie",
  },
  {
    id: "pharmacy-stock",
    keywords: [
      "stock",
      "inventory",
      "inventaire",
      "catalogue",
      "catalog",
      "in stock",
      "out of stock",
      "low stock",
      "rupture",
      "stock faible",
      "en stock",
      "ajouter un medicament",
      "add medication",
      "update stock",
      "mettre a jour",
    ],
    pharmacy: true,
    en: "On the pharmacy dashboard, search the Cameroon catalog. Mark the medicine as offered if you sell it. Then set it to in stock, low stock, or out of stock. Customers only see the medicines you offer, and the nearest stock comes first.",
    fr: "Sur le tableau de bord pharmacie, cherchez le médicament dans le catalogue du Cameroun. Indiquez qu’il est proposé si vous le vendez. Choisissez ensuite En stock, Stock faible, ou Rupture de stock. Les clients ne voient que les médicaments que vous proposez, et le stock le plus proche apparaît en premier.",
    href: "/dashboard/pharmacy",
    linkEn: "Update stock",
    linkFr: "Mettre le stock à jour",
  },
  {
    id: "pharmacy-orders",
    keywords: ["pharmacy order", "commande pharmacie", "incoming order", "commandes recues", "prepare order", "preparer"],
    pharmacy: true,
    en: "Orders for your pharmacy appear on the pharmacy dashboard with the customer’s name and a collection code. Match that code before you hand over the medication, then follow the status through to Gozem pickup.",
    fr: "Les commandes de votre pharmacie apparaissent sur le tableau de bord, avec le nom du client et un code de remise. Vérifiez ce code avant de remettre le médicament, puis suivez le statut jusqu’à la collecte Gozem.",
    href: "/dashboard/pharmacy",
    linkEn: "See pharmacy orders",
    linkFr: "Voir les commandes pharmacie",
  },
];

const WELCOME: Record<Locale, Record<"customer" | "pharmacy", string>> = {
  en: {
    customer:
      "Hello. I am Aidcel. I can walk you through search, a prescription photo, ordering, payment, and delivery. If you run a pharmacy, I can also show you how to update stock.",
    pharmacy:
      "Hello. I am Aidcel. I can show you how to save your pharmacy, add medicines, and set stock to in stock, low, or out of stock. I can also guide your customers through an order.",
  },
  fr: {
    customer:
      "Bonjour. Je suis Aidcel. Je peux vous guider pour la recherche, la photo d’ordonnance, la commande, le paiement, et la livraison. Si vous tenez une pharmacie, je peux aussi vous montrer comment mettre le stock à jour.",
    pharmacy:
      "Bonjour. Je suis Aidcel. Je peux vous montrer comment enregistrer votre pharmacie, ajouter des médicaments, et indiquer En stock, Stock faible, ou Rupture. Je peux aussi guider vos clients pour une commande.",
  },
};

const FALLBACK: Record<Locale, string> = {
  en: "I can help you search a medicine, scan a prescription, order, pay, and track Gozem. For a pharmacy, I can explain how to save your shop and update stock. What would you like to do?",
  fr: "Je peux vous aider à chercher un médicament, scanner une ordonnance, commander, payer, et suivre Gozem. Pour une pharmacie, je peux expliquer comment enregistrer l’officine et mettre le stock à jour. Que voulez-vous faire ?",
};

const ABOUT: Topic = {
  id: "about",
    keywords: ["who are you", "qui es tu", "qui etes vous", "what can you", "help", "aidcel", "aida", "assistant", "bonjour", "hello", "salut", "bonsoir"],
  en: "I am Aidcel, the AIDCELIX guide. Ask me how a customer places an order, or how a pharmacy updates its stock. I speak with you, step by step.",
  fr: "Je suis Aidcel, le guide AIDCELIX. Demandez-moi comment un client passe une commande, ou comment une pharmacie met son stock à jour. Je vous parle, étape par étape.",
};

export const GUIDE_STARTERS: Record<Locale, { customer: string[]; pharmacy: string[] }> = {
  en: {
    customer: ["How do I scan a prescription?", "How do I order and pay?", "How do I track delivery?"],
    pharmacy: ["How do I update stock?", "How do I open my pharmacy dashboard?"],
  },
  fr: {
    customer: ["Comment scanner une ordonnance ?", "Comment commander et payer ?", "Comment suivre la livraison ?"],
    pharmacy: ["Comment mettre le stock à jour ?", "Comment ouvrir le tableau de bord pharmacie ?"],
  },
};

function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function scoreTopic(folded: string, topic: Topic) {
  return topic.keywords.reduce((total, keyword) => (folded.includes(keyword) ? total + keyword.length : total), 0);
}

export function guideWelcome(locale: Locale, role: UserRole | null) {
  return WELCOME[locale][role === "pharmacy" ? "pharmacy" : "customer"];
}

export function guideReply(question: string, locale: Locale, role: UserRole | null): GuideReply {
  const folded = fold(question).trim();
  if (!folded) return { text: guideWelcome(locale, role) };

  const pharmacyContext =
    role === "pharmacy" || /pharmac|officine|tableau de bord|dashboard|catalogue|catalog/.test(folded);
  const ranked = [...TOPICS, ABOUT]
    .map((topic) => ({
      topic,
      score: topic.pharmacy && !pharmacyContext ? 0 : scoreTopic(folded, topic),
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);

  const medical = ranked.find((row) => row.topic.id === "medical");
  const specific = ranked.find((row) => row.topic.id !== "about" && row.topic.id !== "medical");
  if (medical && (!specific || medical.score >= specific.score)) return replyOf(medical.topic, locale);
  if (specific) return replyOf(specific.topic, locale);
  if (ranked[0]) return replyOf(ranked[0].topic, locale);
  return { text: FALLBACK[locale] };
}

function replyOf(topic: Topic, locale: Locale): GuideReply {
  return {
    text: locale === "fr" ? topic.fr : topic.en,
    href: topic.href,
    link: locale === "fr" ? topic.linkFr : topic.linkEn,
  };
}
