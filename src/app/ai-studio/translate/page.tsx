"use client";

import { useState } from "react";
import {
  Languages,
  ArrowLeftRight,
  Copy,
  Check,
  Clock,
  Trash2,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface TranslationRecord {
  id: string;
  sourceLang: string;
  targetLang: string;
  inputText: string;
  outputText: string;
  method: "dictionary" | "prompt";
  createdAt: string;
}

const LANGUAGES = [
  { code: "en", label: "English", flag: "\u{1F1FA}\u{1F1F8}" },
  { code: "es", label: "Spanish", flag: "\u{1F1EA}\u{1F1F8}" },
  { code: "fr", label: "French", flag: "\u{1F1EB}\u{1F1F7}" },
  { code: "de", label: "German", flag: "\u{1F1E9}\u{1F1EA}" },
  { code: "ja", label: "Japanese", flag: "\u{1F1EF}\u{1F1F5}" },
  { code: "zh", label: "Chinese", flag: "\u{1F1E8}\u{1F1F3}" },
  { code: "pt", label: "Portuguese", flag: "\u{1F1F5}\u{1F1F9}" },
  { code: "it", label: "Italian", flag: "\u{1F1EE}\u{1F1F9}" },
  { code: "ko", label: "Korean", flag: "\u{1F1F0}\u{1F1F7}" },
  { code: "ar", label: "Arabic", flag: "\u{1F1F8}\u{1F1E6}" },
  { code: "ru", label: "Russian", flag: "\u{1F1F7}\u{1F1FA}" },
  { code: "nl", label: "Dutch", flag: "\u{1F1F3}\u{1F1F1}" },
  { code: "pl", label: "Polish", flag: "\u{1F1F5}\u{1F1F1}" },
  { code: "tr", label: "Turkish", flag: "\u{1F1F9}\u{1F1F7}" },
  { code: "sv", label: "Swedish", flag: "\u{1F1F8}\u{1F1EA}" },
];

// --- Business phrase dictionary ---
// Keys are "en" phrases. Values map lang code -> translation.
const DICTIONARY: Record<string, Record<string, string>> = {
  "hello": { es: "hola", fr: "bonjour", de: "hallo", ja: "\u3053\u3093\u306B\u3061\u306F", zh: "\u4F60\u597D", pt: "ol\u00E1", it: "ciao", ko: "\uC548\uB155\uD558\uC138\uC694", ar: "\u0645\u0631\u062D\u0628\u0627", ru: "\u043F\u0440\u0438\u0432\u0435\u0442", nl: "hallo", pl: "cze\u015B\u0107", tr: "merhaba", sv: "hej" },
  "thank you": { es: "gracias", fr: "merci", de: "danke", ja: "\u3042\u308A\u304C\u3068\u3046\u3054\u3056\u3044\u307E\u3059", zh: "\u8C22\u8C22", pt: "obrigado", it: "grazie", ko: "\uAC10\uC0AC\uD569\uB2C8\uB2E4", ar: "\u0634\u0643\u0631\u0627", ru: "\u0441\u043F\u0430\u0441\u0438\u0431\u043E", nl: "dank u", pl: "dzi\u0119kuj\u0119", tr: "te\u015Fekk\u00FCr ederim", sv: "tack" },
  "please": { es: "por favor", fr: "s'il vous pla\u00EEt", de: "bitte", ja: "\u304A\u9858\u3044\u3057\u307E\u3059", zh: "\u8BF7", pt: "por favor", it: "per favore", ko: "\uBD80\uB514", ar: "\u0645\u0646 \u0641\u0636\u0644\u0643", ru: "\u043F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430", nl: "alstublieft", pl: "prosz\u0119", tr: "l\u00FCtfen", sv: "tack" },
  "yes": { es: "s\u00ED", fr: "oui", de: "ja", ja: "\u306F\u3044", zh: "\u662F", pt: "sim", it: "s\u00EC", ko: "\uB124", ar: "\u0646\u0639\u0645", ru: "\u0434\u0430", nl: "ja", pl: "tak", tr: "evet", sv: "ja" },
  "no": { es: "no", fr: "non", de: "nein", ja: "\u3044\u3044\u3048", zh: "\u4E0D", pt: "n\u00E3o", it: "no", ko: "\uC544\uB2C8\uC694", ar: "\u0644\u0627", ru: "\u043D\u0435\u0442", nl: "nee", pl: "nie", tr: "hay\u0131r", sv: "nej" },
  "good morning": { es: "buenos d\u00EDas", fr: "bonjour", de: "guten Morgen", ja: "\u304A\u306F\u3088\u3046\u3054\u3056\u3044\u307E\u3059", zh: "\u65E9\u4E0A\u597D", pt: "bom dia", it: "buongiorno", ko: "\uC88B\uC740 \uC544\uCE68", ar: "\u0635\u0628\u0627\u062D \u0627\u0644\u062E\u064A\u0631", ru: "\u0434\u043E\u0431\u0440\u043E\u0435 \u0443\u0442\u0440\u043E", nl: "goedemorgen", pl: "dzie\u0144 dobry", tr: "g\u00FCnayd\u0131n", sv: "god morgon" },
  "goodbye": { es: "adi\u00F3s", fr: "au revoir", de: "auf Wiedersehen", ja: "\u3055\u3088\u3046\u306A\u3089", zh: "\u518D\u89C1", pt: "adeus", it: "arrivederci", ko: "\uC548\uB155\uD788 \uAC00\uC138\uC694", ar: "\u0645\u0639 \u0627\u0644\u0633\u0644\u0627\u0645\u0629", ru: "\u0434\u043E \u0441\u0432\u0438\u0434\u0430\u043D\u0438\u044F", nl: "tot ziens", pl: "do widzenia", tr: "ho\u015F\u00E7a kal\u0131n", sv: "hej d\u00E5" },
  "welcome": { es: "bienvenido", fr: "bienvenue", de: "willkommen", ja: "\u3088\u3046\u3053\u305D", zh: "\u6B22\u8FCE", pt: "bem-vindo", it: "benvenuto", ko: "\uD658\uC601\uD569\uB2C8\uB2E4", ar: "\u0623\u0647\u0644\u0627 \u0648\u0633\u0647\u0644\u0627", ru: "\u0434\u043E\u0431\u0440\u043E \u043F\u043E\u0436\u0430\u043B\u043E\u0432\u0430\u0442\u044C", nl: "welkom", pl: "witamy", tr: "ho\u015F geldiniz", sv: "v\u00E4lkommen" },
  "add to cart": { es: "a\u00F1adir al carrito", fr: "ajouter au panier", de: "in den Warenkorb", ja: "\u30AB\u30FC\u30C8\u306B\u8FFD\u52A0", zh: "\u52A0\u5165\u8D2D\u7269\u8F66", pt: "adicionar ao carrinho", it: "aggiungi al carrello", ko: "\uC7A5\uBC14\uAD6C\uB2C8\uC5D0 \uB2F4\uAE30", ar: "\u0623\u0636\u0641 \u0625\u0644\u0649 \u0627\u0644\u0633\u0644\u0629", ru: "\u0434\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0432 \u043A\u043E\u0440\u0437\u0438\u043D\u0443", nl: "toevoegen aan winkelwagen", pl: "dodaj do koszyka", tr: "sepete ekle", sv: "l\u00E4gg i varukorgen" },
  "buy now": { es: "comprar ahora", fr: "acheter maintenant", de: "jetzt kaufen", ja: "\u4ECA\u3059\u3050\u8CFC\u5165", zh: "\u7ACB\u5373\u8D2D\u4E70", pt: "comprar agora", it: "acquista ora", ko: "\uC9C0\uAE08 \uAD6C\uB9E4", ar: "\u0627\u0634\u062A\u0631\u064A \u0627\u0644\u0622\u0646", ru: "\u043A\u0443\u043F\u0438\u0442\u044C \u0441\u0435\u0439\u0447\u0430\u0441", nl: "nu kopen", pl: "kup teraz", tr: "\u015Fimdi sat\u0131n al", sv: "k\u00F6p nu" },
  "checkout": { es: "pagar", fr: "passer la commande", de: "zur Kasse", ja: "\u30EC\u30B8\u306B\u9032\u3080", zh: "\u7ED3\u8D26", pt: "finalizar compra", it: "cassa", ko: "\uACB0\uC81C\uD558\uAE30", ar: "\u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629 \u0644\u0644\u062F\u0641\u0639", ru: "\u043E\u0444\u043E\u0440\u043C\u0438\u0442\u044C \u0437\u0430\u043A\u0430\u0437", nl: "afrekenen", pl: "do kasy", tr: "\u00F6deme", sv: "till kassan" },
  "free shipping": { es: "env\u00EDo gratis", fr: "livraison gratuite", de: "kostenloser Versand", ja: "\u9001\u6599\u7121\u6599", zh: "\u514D\u8D39\u914D\u9001", pt: "frete gr\u00E1tis", it: "spedizione gratuita", ko: "\uBB34\uB8CC \uBC30\uC1A1", ar: "\u0634\u062D\u0646 \u0645\u062C\u0627\u0646\u064A", ru: "\u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u0430\u044F \u0434\u043E\u0441\u0442\u0430\u0432\u043A\u0430", nl: "gratis verzending", pl: "darmowa wysy\u0142ka", tr: "\u00FCcretsiz kargo", sv: "fri frakt" },
  "contact us": { es: "cont\u00E1ctenos", fr: "contactez-nous", de: "kontaktieren Sie uns", ja: "\u304A\u554F\u3044\u5408\u308F\u305B", zh: "\u8054\u7CFB\u6211\u4EEC", pt: "entre em contato", it: "contattaci", ko: "\uBB38\uC758\uD558\uAE30", ar: "\u0627\u062A\u0635\u0644 \u0628\u0646\u0627", ru: "\u0441\u0432\u044F\u0436\u0438\u0442\u0435\u0441\u044C \u0441 \u043D\u0430\u043C\u0438", nl: "neem contact op", pl: "skontaktuj si\u0119", tr: "bize ula\u015F\u0131n", sv: "kontakta oss" },
  "about us": { es: "sobre nosotros", fr: "\u00E0 propos de nous", de: "\u00FCber uns", ja: "\u4F1A\u793E\u6982\u8981", zh: "\u5173\u4E8E\u6211\u4EEC", pt: "sobre n\u00F3s", it: "chi siamo", ko: "\uD68C\uC0AC \uC18C\uAC1C", ar: "\u0645\u0646 \u0646\u062D\u0646", ru: "\u043E \u043D\u0430\u0441", nl: "over ons", pl: "o nas", tr: "hakk\u0131m\u0131zda", sv: "om oss" },
  "sign in": { es: "iniciar sesi\u00F3n", fr: "se connecter", de: "anmelden", ja: "\u30B5\u30A4\u30F3\u30A4\u30F3", zh: "\u767B\u5F55", pt: "entrar", it: "accedi", ko: "\uB85C\uADF8\uC778", ar: "\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644", ru: "\u0432\u043E\u0439\u0442\u0438", nl: "inloggen", pl: "zaloguj si\u0119", tr: "giri\u015F yap", sv: "logga in" },
  "sign up": { es: "registrarse", fr: "s'inscrire", de: "registrieren", ja: "\u30B5\u30A4\u30F3\u30A2\u30C3\u30D7", zh: "\u6CE8\u518C", pt: "cadastrar", it: "registrati", ko: "\uD68C\uC6D0\uAC00\uC785", ar: "\u0625\u0646\u0634\u0627\u0621 \u062D\u0633\u0627\u0628", ru: "\u0437\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u0442\u044C\u0441\u044F", nl: "aanmelden", pl: "zarejestruj si\u0119", tr: "kay\u0131t ol", sv: "registrera" },
  "search": { es: "buscar", fr: "rechercher", de: "suchen", ja: "\u691C\u7D22", zh: "\u641C\u7D22", pt: "pesquisar", it: "cerca", ko: "\uAC80\uC0C9", ar: "\u0628\u062D\u062B", ru: "\u043F\u043E\u0438\u0441\u043A", nl: "zoeken", pl: "szukaj", tr: "ara", sv: "s\u00F6k" },
  "home": { es: "inicio", fr: "accueil", de: "Startseite", ja: "\u30DB\u30FC\u30E0", zh: "\u9996\u9875", pt: "in\u00EDcio", it: "home", ko: "\uD648", ar: "\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629", ru: "\u0433\u043B\u0430\u0432\u043D\u0430\u044F", nl: "home", pl: "strona g\u0142\u00F3wna", tr: "ana sayfa", sv: "hem" },
  "shop": { es: "tienda", fr: "boutique", de: "Shop", ja: "\u30B7\u30E7\u30C3\u30D7", zh: "\u5546\u5E97", pt: "loja", it: "negozio", ko: "\uC1FC\uD551", ar: "\u0627\u0644\u0645\u062A\u062C\u0631", ru: "\u043C\u0430\u0433\u0430\u0437\u0438\u043D", nl: "winkel", pl: "sklep", tr: "ma\u011Faza", sv: "butik" },
  "cart": { es: "carrito", fr: "panier", de: "Warenkorb", ja: "\u30AB\u30FC\u30C8", zh: "\u8D2D\u7269\u8F66", pt: "carrinho", it: "carrello", ko: "\uC7A5\uBC14\uAD6C\uB2C8", ar: "\u0627\u0644\u0633\u0644\u0629", ru: "\u043A\u043E\u0440\u0437\u0438\u043D\u0430", nl: "winkelwagen", pl: "koszyk", tr: "sepet", sv: "varukorg" },
  "order": { es: "pedido", fr: "commande", de: "Bestellung", ja: "\u6CE8\u6587", zh: "\u8BA2\u5355", pt: "pedido", it: "ordine", ko: "\uC8FC\u6587", ar: "\u0637\u0644\u0628", ru: "\u0437\u0430\u043A\u0430\u0437", nl: "bestelling", pl: "zam\u00F3wienie", tr: "sipari\u015F", sv: "best\u00E4llning" },
  "payment": { es: "pago", fr: "paiement", de: "Zahlung", ja: "\u304A\u652F\u6255\u3044", zh: "\u4ED8\u6B3E", pt: "pagamento", it: "pagamento", ko: "\uACB0\uC81C", ar: "\u0627\u0644\u062F\u0641\u0639", ru: "\u043E\u043F\u043B\u0430\u0442\u0430", nl: "betaling", pl: "p\u0142atno\u015B\u0107", tr: "\u00F6deme", sv: "betalning" },
  "return policy": { es: "pol\u00EDtica de devoluci\u00F3n", fr: "politique de retour", de: "R\u00FCckgaberecht", ja: "\u8FD4\u54C1\u30DD\u30EA\u30B7\u30FC", zh: "\u9000\u8D27\u653F\u7B56", pt: "pol\u00EDtica de devolu\u00E7\u00E3o", it: "politica di reso", ko: "\uBC18\uD488 \uC815\uCC45", ar: "\u0633\u064A\u0627\u0633\u0629 \u0627\u0644\u0625\u0631\u062C\u0627\u0639", ru: "\u043F\u043E\u043B\u0438\u0442\u0438\u043A\u0430 \u0432\u043E\u0437\u0432\u0440\u0430\u0442\u0430", nl: "retourbeleid", pl: "polityka zwrot\u00F3w", tr: "iade politikas\u0131", sv: "returpolicy" },
  "privacy policy": { es: "pol\u00EDtica de privacidad", fr: "politique de confidentialit\u00E9", de: "Datenschutzerkl\u00E4rung", ja: "\u30D7\u30E9\u30A4\u30D0\u30B7\u30FC\u30DD\u30EA\u30B7\u30FC", zh: "\u9690\u79C1\u653F\u7B56", pt: "pol\u00EDtica de privacidade", it: "informativa sulla privacy", ko: "\uAC1C\uC778\uC815\uBCF4 \uCC98\uB9AC\uBC29\uCE68", ar: "\u0633\u064A\u0627\u0633\u0629 \u0627\u0644\u062E\u0635\u0648\u0635\u064A\u0629", ru: "\u043F\u043E\u043B\u0438\u0442\u0438\u043A\u0430 \u043A\u043E\u043D\u0444\u0438\u0434\u0435\u043D\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u0438", nl: "privacybeleid", pl: "polityka prywatno\u015Bci", tr: "gizlilik politikas\u0131", sv: "integritetspolicy" },
  "terms of service": { es: "t\u00E9rminos de servicio", fr: "conditions d'utilisation", de: "Nutzungsbedingungen", ja: "\u5229\u7528\u898F\u7D04", zh: "\u670D\u52A1\u6761\u6B3E", pt: "termos de servi\u00E7o", it: "termini di servizio", ko: "\uC774\uC6A9\uC57D\uAD00", ar: "\u0634\u0631\u0648\u0637 \u0627\u0644\u062E\u062F\u0645\u0629", ru: "\u0443\u0441\u043B\u043E\u0432\u0438\u044F \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u044F", nl: "servicevoorwaarden", pl: "regulamin", tr: "hizmet \u015Fartlar\u0131", sv: "anv\u00E4ndarvillkor" },
  "subscribe": { es: "suscribirse", fr: "s'abonner", de: "abonnieren", ja: "\u8CFC\u8AAD\u3059\u308B", zh: "\u8BA2\u9605", pt: "inscrever-se", it: "iscriviti", ko: "\uAD6C\uB3C5\uD558\uAE30", ar: "\u0627\u0634\u062A\u0631\u0643", ru: "\u043F\u043E\u0434\u043F\u0438\u0441\u0430\u0442\u044C\u0441\u044F", nl: "abonneren", pl: "subskrybuj", tr: "abone ol", sv: "prenumerera" },
  "newsletter": { es: "bolet\u00EDn informativo", fr: "newsletter", de: "Newsletter", ja: "\u30CB\u30E5\u30FC\u30B9\u30EC\u30BF\u30FC", zh: "\u7535\u5B50\u90AE\u4EF6\u901A\u8BAF", pt: "newsletter", it: "newsletter", ko: "\uB274\uC2A4\uB808\uD130", ar: "\u0627\u0644\u0646\u0634\u0631\u0629 \u0627\u0644\u0625\u062E\u0628\u0627\u0631\u064A\u0629", ru: "\u0440\u0430\u0441\u0441\u044B\u043B\u043A\u0430", nl: "nieuwsbrief", pl: "newsletter", tr: "b\u00FClten", sv: "nyhetsbrev" },
  "in stock": { es: "en stock", fr: "en stock", de: "auf Lager", ja: "\u5728\u5EAB\u3042\u308A", zh: "\u6709\u8D27", pt: "em estoque", it: "disponibile", ko: "\uC7AC\uACE0 \uC788\uC74C", ar: "\u0645\u062A\u0648\u0641\u0631", ru: "\u0432 \u043D\u0430\u043B\u0438\u0447\u0438\u0438", nl: "op voorraad", pl: "w magazynie", tr: "stokta", sv: "i lager" },
  "out of stock": { es: "agotado", fr: "en rupture de stock", de: "nicht verf\u00FCgbar", ja: "\u5728\u5EAB\u5207\u308C", zh: "\u7F3A\u8D27", pt: "esgotado", it: "esaurito", ko: "\uD488\uC808", ar: "\u063A\u064A\u0631 \u0645\u062A\u0648\u0641\u0631", ru: "\u043D\u0435\u0442 \u0432 \u043D\u0430\u043B\u0438\u0447\u0438\u0438", nl: "niet op voorraad", pl: "brak w magazynie", tr: "stokta yok", sv: "slut i lager" },
  "sale": { es: "oferta", fr: "soldes", de: "Angebot", ja: "\u30BB\u30FC\u30EB", zh: "\u4FC3\u9500", pt: "promo\u00E7\u00E3o", it: "saldi", ko: "\uC138\uC77C", ar: "\u062A\u062E\u0641\u064A\u0636", ru: "\u0440\u0430\u0441\u043F\u0440\u043E\u0434\u0430\u0436\u0430", nl: "uitverkoop", pl: "wyprzeda\u017C", tr: "indirim", sv: "rea" },
  "new arrival": { es: "novedades", fr: "nouveaut\u00E9", de: "Neuheiten", ja: "\u65B0\u7740", zh: "\u65B0\u54C1", pt: "novidade", it: "novit\u00E0", ko: "\uC2E0\uC0C1\uD488", ar: "\u0648\u0635\u0644 \u062D\u062F\u064A\u062B\u0627", ru: "\u043D\u043E\u0432\u0438\u043D\u043A\u0430", nl: "nieuw binnen", pl: "nowo\u015B\u0107", tr: "yeni \u00FCr\u00FCn", sv: "nyhet" },
  "best seller": { es: "m\u00E1s vendido", fr: "meilleure vente", de: "Bestseller", ja: "\u30D9\u30B9\u30C8\u30BB\u30E9\u30FC", zh: "\u7545\u9500\u54C1", pt: "mais vendido", it: "pi\u00F9 venduto", ko: "\uBCA0\uC2A4\uD2B8\uC140\uB7EC", ar: "\u0627\u0644\u0623\u0643\u062B\u0631 \u0645\u0628\u064A\u0639\u0627", ru: "\u0431\u0435\u0441\u0442\u0441\u0435\u043B\u043B\u0435\u0440", nl: "bestseller", pl: "bestseller", tr: "\u00E7ok satan", sv: "b\u00E4sts\u00E4ljare" },
  "customer support": { es: "atenci\u00F3n al cliente", fr: "support client", de: "Kundenservice", ja: "\u30AB\u30B9\u30BF\u30DE\u30FC\u30B5\u30DD\u30FC\u30C8", zh: "\u5BA2\u6237\u652F\u6301", pt: "suporte ao cliente", it: "assistenza clienti", ko: "\uACE0\uAC1D \uC9C0\uC6D0", ar: "\u062F\u0639\u0645 \u0627\u0644\u0639\u0645\u0644\u0627\u0621", ru: "\u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0430 \u043A\u043B\u0438\u0435\u043D\u0442\u043E\u0432", nl: "klantenservice", pl: "obs\u0142uga klienta", tr: "m\u00FC\u015Fteri deste\u011Fi", sv: "kundsupport" },
  "frequently asked questions": { es: "preguntas frecuentes", fr: "foire aux questions", de: "h\u00E4ufig gestellte Fragen", ja: "\u3088\u304F\u3042\u308B\u8CEA\u554F", zh: "\u5E38\u89C1\u95EE\u9898", pt: "perguntas frequentes", it: "domande frequenti", ko: "\uC790\uC8FC \uBB3B\uB294 \uC9C8\uBB38", ar: "\u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u0627\u0644\u0634\u0627\u0626\u0639\u0629", ru: "\u0447\u0430\u0441\u0442\u043E \u0437\u0430\u0434\u0430\u0432\u0430\u0435\u043C\u044B\u0435 \u0432\u043E\u043F\u0440\u043E\u0441\u044B", nl: "veelgestelde vragen", pl: "cz\u0119sto zadawane pytania", tr: "s\u0131k\u00E7a sorulan sorular", sv: "vanliga fr\u00E5gor" },
  "wishlist": { es: "lista de deseos", fr: "liste de souhaits", de: "Wunschliste", ja: "\u30A6\u30A3\u30C3\u30B7\u30E5\u30EA\u30B9\u30C8", zh: "\u5FC3\u613F\u5355", pt: "lista de desejos", it: "lista dei desideri", ko: "\uC704\uC2DC\uB9AC\uC2A4\uD2B8", ar: "\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0623\u0645\u0646\u064A\u0627\u062A", ru: "\u0441\u043F\u0438\u0441\u043E\u043A \u0436\u0435\u043B\u0430\u043D\u0438\u0439", nl: "verlanglijst", pl: "lista \u017Cycze\u0144", tr: "istek listesi", sv: "\u00F6nskelista" },
  "discount": { es: "descuento", fr: "r\u00E9duction", de: "Rabatt", ja: "\u5272\u5F15", zh: "\u6298\u6263", pt: "desconto", it: "sconto", ko: "\uD560\uC778", ar: "\u062E\u0635\u0645", ru: "\u0441\u043A\u0438\u0434\u043A\u0430", nl: "korting", pl: "zni\u017Cka", tr: "indirim", sv: "rabatt" },
  "review": { es: "rese\u00F1a", fr: "avis", de: "Bewertung", ja: "\u30EC\u30D3\u30E5\u30FC", zh: "\u8BC4\u4EF7", pt: "avalia\u00E7\u00E3o", it: "recensione", ko: "\uB9AC\uBDF0", ar: "\u0645\u0631\u0627\u062C\u0639\u0629", ru: "\u043E\u0442\u0437\u044B\u0432", nl: "beoordeling", pl: "recenzja", tr: "yorum", sv: "recension" },
  "description": { es: "descripci\u00F3n", fr: "description", de: "Beschreibung", ja: "\u8AAC\u660E", zh: "\u63CF\u8FF0", pt: "descri\u00E7\u00E3o", it: "descrizione", ko: "\uC124\uBA85", ar: "\u0648\u0635\u0641", ru: "\u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435", nl: "beschrijving", pl: "opis", tr: "a\u00E7\u0131klama", sv: "beskrivning" },
  "size": { es: "talla", fr: "taille", de: "Gr\u00F6\u00DFe", ja: "\u30B5\u30A4\u30BA", zh: "\u5C3A\u7801", pt: "tamanho", it: "taglia", ko: "\uC0AC\uC774\uC988", ar: "\u0627\u0644\u0645\u0642\u0627\u0633", ru: "\u0440\u0430\u0437\u043C\u0435\u0440", nl: "maat", pl: "rozmiar", tr: "beden", sv: "storlek" },
  "color": { es: "color", fr: "couleur", de: "Farbe", ja: "\u8272", zh: "\u989C\u8272", pt: "cor", it: "colore", ko: "\uC0C9\uC0C1", ar: "\u0627\u0644\u0644\u0648\u0646", ru: "\u0446\u0432\u0435\u0442", nl: "kleur", pl: "kolor", tr: "renk", sv: "f\u00E4rg" },
  "quantity": { es: "cantidad", fr: "quantit\u00E9", de: "Menge", ja: "\u6570\u91CF", zh: "\u6570\u91CF", pt: "quantidade", it: "quantit\u00E0", ko: "\uC218\u7248", ar: "\u0627\u0644\u0643\u0645\u064A\u0629", ru: "\u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E", nl: "aantal", pl: "ilo\u015B\u0107", tr: "miktar", sv: "antal" },
  "price": { es: "precio", fr: "prix", de: "Preis", ja: "\u4FA1\u683C", zh: "\u4EF7\u683C", pt: "pre\u00E7o", it: "prezzo", ko: "\uAC00\uACA9", ar: "\u0627\u0644\u0633\u0639\u0631", ru: "\u0446\u0435\u043D\u0430", nl: "prijs", pl: "cena", tr: "fiyat", sv: "pris" },
  "total": { es: "total", fr: "total", de: "Gesamt", ja: "\u5408\u8A08", zh: "\u603B\u8BA1", pt: "total", it: "totale", ko: "\uCD1D\uC561", ar: "\u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A", ru: "\u0438\u0442\u043E\u0433\u043E", nl: "totaal", pl: "\u0142\u0105cznie", tr: "toplam", sv: "totalt" },
  "shipping": { es: "env\u00EDo", fr: "exp\u00E9dition", de: "Versand", ja: "\u914D\u9001", zh: "\u914D\u9001", pt: "envio", it: "spedizione", ko: "\uBC30\u9001", ar: "\u0627\u0644\u0634\u062D\u0646", ru: "\u0434\u043E\u0441\u0442\u0430\u0432\u043A\u0430", nl: "verzending", pl: "wysy\u0142ka", tr: "kargo", sv: "frakt" },
  "tax": { es: "impuesto", fr: "taxe", de: "Steuer", ja: "\u7A0E\u91D1", zh: "\u7A0E", pt: "imposto", it: "tassa", ko: "\uC138\uAE08", ar: "\u0627\u0644\u0636\u0631\u064A\u0628\u0629", ru: "\u043D\u0430\u043B\u043E\u0433", nl: "belasting", pl: "podatek", tr: "vergi", sv: "skatt" },
  "apply coupon": { es: "aplicar cup\u00F3n", fr: "appliquer le coupon", de: "Gutschein einl\u00F6sen", ja: "\u30AF\u30FC\u30DD\u30F3\u3092\u9069\u7528", zh: "\u4F7F\u7528\u4F18\u60E0\u5238", pt: "aplicar cupom", it: "applica coupon", ko: "\uCFE0\uD3F0 \uC801\uC6A9", ar: "\u062A\u0637\u0628\u064A\u0642 \u0627\u0644\u0642\u0633\u064A\u0645\u0629", ru: "\u043F\u0440\u0438\u043C\u0435\u043D\u0438\u0442\u044C \u043A\u0443\u043F\u043E\u043D", nl: "coupon toepassen", pl: "zastosuj kupon", tr: "kupon uygula", sv: "anv\u00E4nd kupong" },
  "track order": { es: "rastrear pedido", fr: "suivre la commande", de: "Bestellung verfolgen", ja: "\u6CE8\u6587\u3092\u8FFD\u8DE1", zh: "\u8DDF\u8E2A\u8BA2\u5355", pt: "rastrear pedido", it: "traccia ordine", ko: "\uC8FC\u6587 \uCD94\uC801", ar: "\u062A\u062A\u0628\u0639 \u0627\u0644\u0637\u0644\u0628", ru: "\u043E\u0442\u0441\u043B\u0435\u0434\u0438\u0442\u044C \u0437\u0430\u043A\u0430\u0437", nl: "bestelling volgen", pl: "\u015Bled\u017A zam\u00F3wienie", tr: "sipari\u015Fi takip et", sv: "sp\u00E5ra best\u00E4llning" },
  "my account": { es: "mi cuenta", fr: "mon compte", de: "mein Konto", ja: "\u30DE\u30A4\u30A2\u30AB\u30A6\u30F3\u30C8", zh: "\u6211\u7684\u8D26\u6237", pt: "minha conta", it: "il mio account", ko: "\uB0B4 \uACC4\uC815", ar: "\u062D\u0633\u0627\u0628\u064A", ru: "\u043C\u043E\u0439 \u0430\u043A\u043A\u0430\u0443\u043D\u0442", nl: "mijn account", pl: "moje konto", tr: "hesab\u0131m", sv: "mitt konto" },
  "log out": { es: "cerrar sesi\u00F3n", fr: "se d\u00E9connecter", de: "abmelden", ja: "\u30ED\u30B0\u30A2\u30A6\u30C8", zh: "\u9000\u51FA", pt: "sair", it: "esci", ko: "\uB85C\uADF8\uC544\uC6C3", ar: "\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C", ru: "\u0432\u044B\u0439\u0442\u0438", nl: "uitloggen", pl: "wyloguj si\u0119", tr: "\u00E7\u0131k\u0131\u015F yap", sv: "logga ut" },
  "save": { es: "guardar", fr: "sauvegarder", de: "speichern", ja: "\u4FDD\u5B58", zh: "\u4FDD\u5B58", pt: "salvar", it: "salva", ko: "\uC800\uC7A5", ar: "\u062D\u0641\u0638", ru: "\u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C", nl: "opslaan", pl: "zapisz", tr: "kaydet", sv: "spara" },
  "delete": { es: "eliminar", fr: "supprimer", de: "l\u00F6schen", ja: "\u524A\u9664", zh: "\u5220\u9664", pt: "excluir", it: "elimina", ko: "\uC0AD\uC81C", ar: "\u062D\u0630\u0641", ru: "\u0443\u0434\u0430\u043B\u0438\u0442\u044C", nl: "verwijderen", pl: "usu\u0144", tr: "sil", sv: "ta bort" },
  "edit": { es: "editar", fr: "modifier", de: "bearbeiten", ja: "\u7DE8\u96C6", zh: "\u7F16\u8F91", pt: "editar", it: "modifica", ko: "\uD3B8\uC9D1", ar: "\u062A\u0639\u062F\u064A\u0644", ru: "\u0440\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C", nl: "bewerken", pl: "edytuj", tr: "d\u00FCzenle", sv: "redigera" },
  "submit": { es: "enviar", fr: "soumettre", de: "absenden", ja: "\u9001\u4FE1", zh: "\u63D0\u4EA4", pt: "enviar", it: "invia", ko: "\uC81C\uCD9C", ar: "\u0625\u0631\u0633\u0627\u0644", ru: "\u043E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C", nl: "verzenden", pl: "wy\u015Blij", tr: "g\u00F6nder", sv: "skicka" },
  "cancel": { es: "cancelar", fr: "annuler", de: "abbrechen", ja: "\u30AD\u30E3\u30F3\u30BB\u30EB", zh: "\u53D6\u6D88", pt: "cancelar", it: "annulla", ko: "\uCDE8\uC18C", ar: "\u0625\u0644\u063A\u0627\u0621", ru: "\u043E\u0442\u043C\u0435\u043D\u0430", nl: "annuleren", pl: "anuluj", tr: "iptal", sv: "avbryt" },
  "confirm": { es: "confirmar", fr: "confirmer", de: "best\u00E4tigen", ja: "\u78BA\u8A8D", zh: "\u786E\u8BA4", pt: "confirmar", it: "conferma", ko: "\uD655\uC778", ar: "\u062A\u0623\u0643\u064A\u062F", ru: "\u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044C", nl: "bevestigen", pl: "potwierd\u017A", tr: "onayla", sv: "bekr\u00E4fta" },
  "loading": { es: "cargando", fr: "chargement", de: "laden", ja: "\u8AAD\u307F\u8FBC\u307F\u4E2D", zh: "\u52A0\u8F7D\u4E2D", pt: "carregando", it: "caricamento", ko: "\uB85C\uB529 \uC911", ar: "\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062D\u0645\u064A\u0644", ru: "\u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0430", nl: "laden", pl: "\u0142adowanie", tr: "y\u00FCkleniyor", sv: "laddar" },
  "error": { es: "error", fr: "erreur", de: "Fehler", ja: "\u30A8\u30E9\u30FC", zh: "\u9519\u8BEF", pt: "erro", it: "errore", ko: "\uC624\u0448\u0438\u0431\u043A\u0430", ar: "\u062E\u0637\u0623", ru: "\u043E\u0448\u0438\u0431\u043A\u0430", nl: "fout", pl: "b\u0142\u0105d", tr: "hata", sv: "fel" },
};

const MAX_CHARS = 5000;

function lookupDictionary(text: string, targetLang: string): { found: { phrase: string; translation: string }[]; remaining: string } {
  if (targetLang === "en") return { found: [], remaining: text };

  const lower = text.toLowerCase().trim();
  const found: { phrase: string; translation: string }[] = [];
  let remaining = text;

  // Sort dictionary keys by length (longest first) to match longer phrases first
  const sortedKeys = Object.keys(DICTIONARY).sort((a, b) => b.length - a.length);

  for (const key of sortedKeys) {
    const entry = DICTIONARY[key];
    if (entry[targetLang] && lower.includes(key)) {
      found.push({ phrase: key, translation: entry[targetLang] });
      // Remove matched phrase from remaining
      const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      remaining = remaining.replace(regex, "").trim();
    }
  }

  return { found, remaining };
}

function buildTranslationPrompt(text: string, sourceLang: string, targetLang: string): string {
  const srcLabel = LANGUAGES.find((l) => l.code === sourceLang)?.label ?? sourceLang;
  const tgtLabel = LANGUAGES.find((l) => l.code === targetLang)?.label ?? targetLang;
  return `Translate the following text from ${srcLabel} to ${tgtLabel}. Maintain the original tone and formatting. Only provide the translation, no explanations.\n\nText to translate:\n${text}`;
}

export default function TranslatePage() {
  const [history, setHistory] = useLocalStorage<TranslationRecord[]>("translate-history", []);
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("es");
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [dictionaryMatches, setDictionaryMatches] = useState<{ phrase: string; translation: string }[]>([]);
  const [translationMethod, setTranslationMethod] = useState<"dictionary" | "prompt" | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const swapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setInputText(outputText);
    setOutputText(inputText);
    setDictionaryMatches([]);
    setTranslationMethod(null);
  };

  const handleTranslate = () => {
    if (!inputText.trim()) return;

    // Try dictionary lookup first (only works from English)
    if (sourceLang === "en") {
      const { found, remaining } = lookupDictionary(inputText, targetLang);

      if (found.length > 0 && remaining.length < inputText.trim().length * 0.5) {
        // Most of the input was matched by dictionary
        const translatedParts = found.map((f) => f.translation);
        setOutputText(translatedParts.join(" "));
        setDictionaryMatches(found);
        setTranslationMethod("dictionary");

        const record: TranslationRecord = {
          id: generateId(),
          sourceLang,
          targetLang,
          inputText: inputText.trim(),
          outputText: translatedParts.join(" "),
          method: "dictionary",
          createdAt: new Date().toISOString(),
        };
        setHistory((prev) => [record, ...prev].slice(0, 30));
        return;
      }

      if (found.length > 0) {
        // Partial matches - show them but also provide prompt
        setDictionaryMatches(found);
      } else {
        setDictionaryMatches([]);
      }
    } else {
      setDictionaryMatches([]);
    }

    // For full text: build a translation prompt
    const prompt = buildTranslationPrompt(inputText, sourceLang, targetLang);
    setOutputText(prompt);
    setTranslationMethod("prompt");

    const record: TranslationRecord = {
      id: generateId(),
      sourceLang,
      targetLang,
      inputText: inputText.trim(),
      outputText: prompt,
      method: "prompt",
      createdAt: new Date().toISOString(),
    };
    setHistory((prev) => [record, ...prev].slice(0, 30));
  };

  const handleCopy = async (text: string, id: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const loadHistory = (r: TranslationRecord) => {
    setSourceLang(r.sourceLang);
    setTargetLang(r.targetLang);
    setInputText(r.inputText);
    setOutputText(r.outputText);
    setTranslationMethod(r.method);
    setDictionaryMatches([]);
  };

  const deleteHistory = (id: string) => {
    setHistory((prev) => prev.filter((h) => h.id !== id));
  };

  const getLang = (code: string) => LANGUAGES.find((l) => l.code === code);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Translation Workspace"
        description="Translate common business phrases instantly with our built-in dictionary, or generate translation prompts for AI tools like ChatGPT, DeepL, and Google Translate."
        icon={Languages}
        badge="AI Studio"
        replaces="DeepL, Google Translate Pro"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Translator */}
        <div className="lg:col-span-3 space-y-4">
          {/* Language Selector Bar */}
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                {/* Source Language */}
                <div className="flex-1">
                  <Label className="text-[10px] text-muted-foreground uppercase mb-1 block">From</Label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-1">
                    {LANGUAGES.slice(0, 8).map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => setSourceLang(lang.code)}
                        className={`flex flex-col items-center py-1.5 px-1 rounded-lg text-[10px] transition-all ${
                          sourceLang === lang.code
                            ? "bg-violet-500/15 text-violet-600 dark:text-violet-400 font-medium"
                            : "hover:bg-muted/60 text-muted-foreground"
                        }`}
                      >
                        <span className="text-base">{lang.flag}</span>
                        <span className="truncate max-w-full">{lang.label.slice(0, 5)}</span>
                      </button>
                    ))}
                  </div>
                  <select
                    value={sourceLang}
                    onChange={(e) => setSourceLang(e.target.value)}
                    className="mt-1 w-full text-xs rounded-lg border bg-background px-2 py-1.5 text-muted-foreground"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
                    ))}
                  </select>
                </div>

                {/* Swap */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={swapLanguages}
                  className="shrink-0 h-8 w-8 p-0 rounded-full self-end mb-0.5"
                >
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                </Button>

                {/* Target Language */}
                <div className="flex-1">
                  <Label className="text-[10px] text-muted-foreground uppercase mb-1 block">To</Label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-1">
                    {LANGUAGES.slice(0, 8).map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => setTargetLang(lang.code)}
                        className={`flex flex-col items-center py-1.5 px-1 rounded-lg text-[10px] transition-all ${
                          targetLang === lang.code
                            ? "bg-pink-500/15 text-pink-600 dark:text-pink-400 font-medium"
                            : "hover:bg-muted/60 text-muted-foreground"
                        }`}
                      >
                        <span className="text-base">{lang.flag}</span>
                        <span className="truncate max-w-full">{lang.label.slice(0, 5)}</span>
                      </button>
                    ))}
                  </div>
                  <select
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    className="mt-1 w-full text-xs rounded-lg border bg-background px-2 py-1.5 text-muted-foreground"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Text Areas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Input */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{getLang(sourceLang)?.flag}</span>
                    <CardTitle className="text-sm">{getLang(sourceLang)?.label}</CardTitle>
                  </div>
                  <span className={`text-[10px] ${inputText.length > MAX_CHARS * 0.9 ? "text-red-500" : "text-muted-foreground"}`}>
                    {inputText.length}/{MAX_CHARS}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Enter text to translate..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value.slice(0, MAX_CHARS))}
                  className="min-h-[200px] resize-none text-sm"
                />
              </CardContent>
            </Card>

            {/* Output */}
            <Card className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{getLang(targetLang)?.flag}</span>
                    <CardTitle className="text-sm">{getLang(targetLang)?.label}</CardTitle>
                    {translationMethod && (
                      <Badge variant="secondary" className="text-[9px]">
                        {translationMethod === "dictionary" ? "Dictionary" : "AI Prompt"}
                      </Badge>
                    )}
                  </div>
                  {outputText && (
                    <button
                      onClick={() => handleCopy(outputText, "output")}
                      className="p-1 rounded text-muted-foreground hover:text-violet-500 transition-colors"
                    >
                      {copied === "output" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="min-h-[200px] rounded-lg border bg-muted/20 p-3 text-sm">
                  {outputText ? (
                    <p className="whitespace-pre-wrap">{outputText}</p>
                  ) : (
                    <p className="text-muted-foreground/50">Translation or prompt will appear here</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dictionary Matches */}
          {dictionaryMatches.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-violet-500" />
                  Dictionary Matches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {dictionaryMatches.map((match, i) => (
                    <div
                      key={i}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20"
                    >
                      <span className="text-xs text-muted-foreground">{match.phrase}</span>
                      <ArrowLeftRight className="h-2.5 w-2.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-violet-600 dark:text-violet-400">{match.translation}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              onClick={handleTranslate}
              disabled={!inputText.trim()}
              className="bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white border-0 h-11 px-8"
            >
              <Languages className="h-4 w-4 mr-2" />
              Translate
            </Button>
            {outputText && translationMethod === "prompt" && (
              <>
                <Button onClick={() => handleCopy(outputText, "prompt-copy")} variant="outline" className="h-11">
                  {copied === "prompt-copy" ? <Check className="h-4 w-4 mr-2 text-emerald-500" /> : <Copy className="h-4 w-4 mr-2" />}
                  Copy Prompt
                </Button>
                <div className="flex items-center gap-1.5 ml-auto">
                  <span className="text-[10px] text-muted-foreground">Use with:</span>
                  {[
                    { label: "Google Translate", url: "https://translate.google.com/" },
                    { label: "DeepL", url: "https://www.deepl.com/translator" },
                    { label: "ChatGPT", url: "https://chat.openai.com/" },
                  ].map((tool) => (
                    <a
                      key={tool.label}
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {tool.label}
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  ))}
                </div>
              </>
            )}
            {outputText && translationMethod === "dictionary" && (
              <Button onClick={() => handleCopy(outputText, "dict-copy")} variant="outline" className="h-11">
                {copied === "dict-copy" ? <Check className="h-4 w-4 mr-2 text-emerald-500" /> : <Copy className="h-4 w-4 mr-2" />}
                Copy Translation
              </Button>
            )}
          </div>

          {/* Explanation */}
          {translationMethod === "prompt" && (
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-[11px] text-blue-600 dark:text-blue-400">
                <strong>Translation prompt generated.</strong> Copy the prompt above and paste it into Google Translate, DeepL, or ChatGPT for an accurate translation. The built-in dictionary handles common business phrases directly; full text requires an external translation service.
              </p>
            </div>
          )}
        </div>

        {/* History Sidebar */}
        <div>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  History
                </CardTitle>
                {history.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-destructive hover:text-destructive"
                    onClick={() => setHistory([])}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No translations yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="group p-2.5 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors cursor-pointer"
                      onClick={() => loadHistory(item)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <span>{getLang(item.sourceLang)?.flag}</span>
                          <ArrowLeftRight className="h-2.5 w-2.5" />
                          <span>{getLang(item.targetLang)?.flag}</span>
                          <Badge variant="secondary" className="text-[8px] px-1 py-0 ml-1">
                            {item.method === "dictionary" ? "Dict" : "Prompt"}
                          </Badge>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteHistory(item.id); }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-destructive transition-all"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-xs truncate">{item.inputText}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Languages", value: "15" },
          { label: "Dictionary Phrases", value: "50+" },
          { label: "History Saved", value: "Last 30" },
          { label: "Full Translation", value: "Via AI Prompt" },
        ].map((info) => (
          <div key={info.label} className="p-3 rounded-xl bg-muted/30 border text-center">
            <p className="text-xs text-muted-foreground">{info.label}</p>
            <p className="text-sm font-semibold mt-0.5">{info.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
