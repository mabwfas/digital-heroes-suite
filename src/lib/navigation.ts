import {
  Palette,
  Type,
  Image,
  PanelTop,
  Sparkles,
  SwatchBook,
  Crown,
  Users,
  FileText,
  Receipt,
  KanbanSquare,
  ClipboardList,
  FileSignature,
  UserCircle,
  Clock,
  CalendarOff,
  Calculator,
  Star,
  ListChecks,
  Search,
  PenTool,
  Share2,
  Mail,
  CalendarDays,
  Tags,
  ImagePlus,
  Eraser,
  Lightbulb,
  Languages,
  QrCode,
  Link,
  BarChart3,
  DollarSign,
  FileImage,
  LayoutDashboard,
  Timer,
  ArrowLeftRight,
  CreditCard,
  // Content tools
  BookOpen,
  Heading,
  Shield,
  MessageSquareQuote,
  HelpCircle,
  // Developer tools
  Braces,
  Regex,
  Paintbrush,
  KeyRound,
  Blend,
  Code2,
  // E-commerce tools
  ShoppingCart,
  Tag,
  Truck,
  MessageCircle,
  CheckSquare,
  type LucideIcon,
} from "lucide-react";

export interface ToolItem {
  name: string;
  href: string;
  icon: LucideIcon;
  description: string;
  replaces?: string;
  badge?: string;
}

export interface ToolCategory {
  name: string;
  icon: LucideIcon;
  color: string;
  tools: ToolItem[];
}

export const toolCategories: ToolCategory[] = [
  {
    name: "Shopify Design",
    icon: Palette,
    color: "text-violet-500",
    tools: [
      { name: "Color Palette", href: "/shopify/colors", icon: SwatchBook, description: "Generate & export color palettes", replaces: "Coolors Pro ($3/mo)" },
      { name: "Typography", href: "/shopify/typography", icon: Type, description: "Font pairing suggestions & preview", replaces: "Fontjoy" },
      { name: "AI Logo Generator", href: "/shopify/logo", icon: Crown, description: "Generate logos with AI", replaces: "Looka ($20/mo)", badge: "AI" },
      { name: "Product Images", href: "/shopify/product-images", icon: Image, description: "AI product photos & mockups", replaces: "Pebblely ($19/mo)", badge: "AI" },
      { name: "Banner Designer", href: "/shopify/banner", icon: PanelTop, description: "Design hero banners & sections", replaces: "Canva Pro ($13/mo)" },
      { name: "Theme Previewer", href: "/shopify/theme", icon: Sparkles, description: "Preview Shopify store themes", replaces: "Shogun ($39/mo)" },
      { name: "Brand Kit", href: "/shopify/brand-kit", icon: Palette, description: "Save brand assets per client", replaces: "Brandfolder" },
    ],
  },
  {
    name: "Clients & Projects",
    icon: Users,
    color: "text-blue-500",
    tools: [
      { name: "Client CRM", href: "/clients/crm", icon: Users, description: "Track clients & contacts", replaces: "HubSpot ($20/mo)" },
      { name: "Proposals", href: "/clients/proposals", icon: FileText, description: "Create PDF proposals", replaces: "Proposify ($49/mo)" },
      { name: "Invoices", href: "/clients/invoices", icon: Receipt, description: "Generate professional invoices", replaces: "FreshBooks ($17/mo)" },
      { name: "Kanban Board", href: "/clients/kanban", icon: KanbanSquare, description: "Drag & drop task management", replaces: "Trello ($10/mo)" },
      { name: "Order Tracker", href: "/clients/orders", icon: ClipboardList, description: "Track Fiverr orders & deadlines" },
      { name: "Contracts", href: "/clients/contracts", icon: FileSignature, description: "Freelance contract templates", replaces: "HelloSign ($15/mo)" },
    ],
  },
  {
    name: "HR & Team",
    icon: UserCircle,
    color: "text-emerald-500",
    tools: [
      { name: "Team Directory", href: "/hr/directory", icon: UserCircle, description: "Employee profiles & contacts", replaces: "BambooHR ($6/user)" },
      { name: "Attendance", href: "/hr/attendance", icon: Clock, description: "Clock in/out & hours log", replaces: "Clockify Pro ($12/mo)" },
      { name: "Leave Manager", href: "/hr/leave", icon: CalendarOff, description: "PTO requests & balance", replaces: "Calamari ($2/user)" },
      { name: "Payroll", href: "/hr/payroll", icon: Calculator, description: "Salary & tax calculator", replaces: "Gusto ($40/mo)" },
      { name: "Reviews", href: "/hr/reviews", icon: Star, description: "Performance review templates", replaces: "Lattice ($11/user)" },
      { name: "Onboarding", href: "/hr/onboarding", icon: ListChecks, description: "New hire checklists", replaces: "Process.st ($25/mo)" },
    ],
  },
  {
    name: "Marketing",
    icon: Share2,
    color: "text-orange-500",
    tools: [
      { name: "SEO Analyzer", href: "/marketing/seo", icon: Search, description: "Audit meta tags & keywords", replaces: "Semrush ($130/mo)" },
      { name: "AI Copywriter", href: "/marketing/copywriter", icon: PenTool, description: "Generate product descriptions", replaces: "Jasper ($49/mo)", badge: "AI" },
      { name: "Social Posts", href: "/marketing/social", icon: Share2, description: "AI social media content", replaces: "Buffer ($6/mo)", badge: "AI" },
      { name: "Email Builder", href: "/marketing/email", icon: Mail, description: "Drag & drop email templates", replaces: "Mailchimp ($13/mo)" },
      { name: "Content Calendar", href: "/marketing/calendar", icon: CalendarDays, description: "Plan & schedule content", replaces: "CoSchedule ($29/mo)" },
      { name: "Meta Tags", href: "/marketing/meta-tags", icon: Tags, description: "SEO meta tag generator", replaces: "Yoast ($99/yr)" },
    ],
  },
  {
    name: "AI Studio",
    icon: Sparkles,
    color: "text-pink-500",
    tools: [
      { name: "Image Generator", href: "/ai-studio/image-gen", icon: ImagePlus, description: "Generate any image with AI", replaces: "Midjourney ($10/mo)", badge: "AI" },
      { name: "BG Remover", href: "/ai-studio/bg-remove", icon: Eraser, description: "Remove & replace backgrounds", replaces: "remove.bg ($9/mo)", badge: "AI" },
      { name: "Name Generator", href: "/ai-studio/name-gen", icon: Lightbulb, description: "AI business name ideas", replaces: "Namelix", badge: "AI" },
      { name: "Translator", href: "/ai-studio/translate", icon: Languages, description: "Translate store content", replaces: "DeepL Pro ($25/mo)", badge: "AI" },
    ],
  },
  {
    name: "Finance & Analytics",
    icon: DollarSign,
    color: "text-emerald-500",
    tools: [
      { name: "Expense Tracker", href: "/finance/expense-tracker", icon: Receipt, description: "Track business expenses by category", replaces: "Expensify ($5/mo)" },
      { name: "Time Tracker", href: "/finance/time-tracker", icon: Timer, description: "Billable hours & invoice generation", replaces: "Toggl ($10/mo)" },
      { name: "Tax Calculator", href: "/finance/tax-calculator", icon: Calculator, description: "Freelancer tax estimator with brackets", replaces: "TurboTax ($89/yr)" },
      { name: "Currency Converter", href: "/finance/currency-converter", icon: ArrowLeftRight, description: "Convert 15+ world currencies", replaces: "XE.com" },
      { name: "Subscription Manager", href: "/finance/subscription-manager", icon: CreditCard, description: "Track subscriptions & renewals", replaces: "TrackMySubs ($36/yr)" },
    ],
  },
  {
    name: "Utilities",
    icon: BarChart3,
    color: "text-amber-500",
    tools: [
      { name: "QR Generator", href: "/utilities/qr-code", icon: QrCode, description: "Custom branded QR codes", replaces: "QR Monkey Pro" },
      { name: "UTM Builder", href: "/utilities/utm", icon: Link, description: "Campaign tracking URLs", replaces: "UTM.io ($25/mo)" },
      { name: "Competitor Spy", href: "/utilities/competitor", icon: BarChart3, description: "Analyze competitor stores", replaces: "BuiltWith ($295/mo)" },
      { name: "Profit Calculator", href: "/utilities/profit", icon: DollarSign, description: "Revenue & margin calculator" },
      { name: "Image Converter", href: "/utilities/converter", icon: FileImage, description: "Convert & resize images", replaces: "CloudConvert" },
    ],
  },
  {
    name: "Content & Legal",
    icon: BookOpen,
    color: "text-cyan-500",
    tools: [
      { name: "Blog Outlines", href: "/content/blog-outline", icon: BookOpen, description: "Generate structured blog outlines", replaces: "Frase ($15/mo)" },
      { name: "Headline Analyzer", href: "/content/headline-analyzer", icon: Heading, description: "Score & optimize headlines", replaces: "CoSchedule Analyzer" },
      { name: "Privacy Policy", href: "/content/privacy-policy", icon: Shield, description: "GDPR/CCPA policy generator", replaces: "Termly ($10/mo)" },
      { name: "Testimonials", href: "/content/testimonial-builder", icon: MessageSquareQuote, description: "Manage & embed reviews", replaces: "Testimonial.to ($20/mo)" },
      { name: "FAQ Builder", href: "/content/faq-builder", icon: HelpCircle, description: "Build FAQ pages with schema", replaces: "Helpjuice ($120/mo)" },
    ],
  },
  {
    name: "Developer Tools",
    icon: Code2,
    color: "text-indigo-500",
    tools: [
      { name: "JSON Formatter", href: "/developer/json-formatter", icon: Braces, description: "Format, validate & beautify JSON", replaces: "JSON Editor Online" },
      { name: "Regex Tester", href: "/developer/regex-tester", icon: Regex, description: "Test patterns with live highlighting", replaces: "Regex101" },
      { name: "Color Converter", href: "/developer/color-converter", icon: Paintbrush, description: "HEX/RGB/HSL + contrast checker", replaces: "ColorHexa" },
      { name: "Password Gen", href: "/developer/password-gen", icon: KeyRound, description: "Secure passwords & passphrases", replaces: "1Password Generator" },
      { name: "CSS Gradients", href: "/developer/css-gradient", icon: Blend, description: "Visual gradient builder", replaces: "CSS Gradient.io" },
    ],
  },
  {
    name: "E-commerce+",
    icon: ShoppingCart,
    color: "text-rose-500",
    tools: [
      { name: "Product Descriptions", href: "/ecommerce/product-desc", icon: PenTool, description: "AIDA/PAS copywriting formulas", replaces: "Jasper ($49/mo)", badge: "AI" },
      { name: "Pricing Calculator", href: "/ecommerce/pricing-calc", icon: Tag, description: "Margins, bundles & strategy", replaces: "Prisync ($99/mo)" },
      { name: "Shipping Calculator", href: "/ecommerce/shipping-calc", icon: Truck, description: "Compare carrier rates & zones", replaces: "ShipStation ($25/mo)" },
      { name: "Review Responder", href: "/ecommerce/review-responder", icon: MessageCircle, description: "Professional review responses", replaces: "Yotpo ($79/mo)" },
      { name: "Store Audit", href: "/ecommerce/store-audit", icon: CheckSquare, description: "50-point Shopify checklist", replaces: "Shopify Expert Audit ($500)" },
    ],
  },
];

export const dashboardLink = {
  name: "Dashboard",
  href: "/",
  icon: LayoutDashboard,
};
