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
  BookOpen,
  Heading,
  Shield,
  MessageSquareQuote,
  HelpCircle,
  Braces,
  Regex,
  Paintbrush,
  KeyRound,
  Blend,
  Code2,
  ShoppingCart,
  Tag,
  Truck,
  MessageCircle,
  CheckSquare,
  // Shopify Dev
  Bug,
  HardDrive,
  Monitor,
  Database,
  Repeat,
  Trash2,
  LayoutTemplate,
  Library,
  Gauge,
  TestTube,
  // Client Management
  FolderOpen,
  HeartPulse,
  Inbox,
  ThumbsUp,
  UserMinus,
  DoorOpen,
  PieChart,
  TrendingUp,
  // Team
  Megaphone,
  Vote,
  // Projects
  CheckCircle,
  GanttChart,
  Wallet,
  ClipboardCheck,
  FolderCog,
  // SEO
  ImageIcon,
  FileSearch,
  Unlink,
  Target,
  Radar,
  // Paid Ads
  Split,
  Sliders,
  MousePointerClick,
  ExternalLink,
  Percent,
  // Sales
  BookMarked,
  MailPlus,
  Flame,
  FileBarChart,
  Gift,
  // HR Extended
  LogOut,
  UserSearch,
  MessageSquare,
  Eye,
  Grid3X3,
  BookOpenCheck,
  Coffee,
  Scale,
  // YouTube
  Youtube,
  // Social Media
  AtSign,
  Hash,
  Rss,
  Heart,
  LinkIcon,
  Camera,
  CalendarClock,
  UserPlus,
  // Email Marketing
  MailCheck,
  MailX,
  ListFilter,
  Mails,
  ThermometerSun,
  FileSpreadsheet,
  MailQuestion,
  Send,
  Layers,
  // Analytics
  Activity,
  LineChart,
  Goal,
  BarChartHorizontal,
  UserCheck,
  Milestone,
  CalendarRange,
  TrendingDown,
  // Legal
  Gavel,
  Cookie,
  ShieldCheck,
  ScrollText,
  Undo2,
  // CRO
  MousePointer,
  DoorClosed,
  BadgeDollarSign,
  BadgeCheck,
  ShieldAlert,
  // Copywriting
  PencilLine,
  Wand2,
  Quote,
  TypeIcon,
  FileType,
  Megaphone as MegaphoneIcon,
  Bookmark,
  ScanEye,
  Gem,
  CircleDot,
  // Brand Strategy
  Compass,
  Fingerprint,
  UserCog,
  MapPin,
  Volume2,
  // Support
  Headphones,
  LifeBuoy,
  Smile,
  AlarmClock,
  TicketCheck,
  // Products
  Package,
  Boxes,
  FolderTree,
  Warehouse,
  CameraIcon,
  BadgePercent,
  MessagesSquare,
  SearchCheck,
  TagsIcon,
  Puzzle,
  // Agency
  Building2,
  UsersRound,
  Banknote,
  CalendarPlus,
  RotateCcw,
  // Productivity
  LayoutGrid,
  Crosshair,
  Repeat2,
  BookHeart,
  Hourglass,
  // Research
  FlaskConical,
  Globe,
  ScatterChart,
  BarChart2,
  Compass as CompassIcon,
  // Templates
  FolderArchive,
  FileStack,
  Handshake,
  NotebookPen,
  Briefcase,
  // Shopify Extended
  Blocks,
  ShoppingBag,
  Power,
  Globe2,
  Brackets,
  // Freelance
  UserRound,
  MessageSquareDashed,
  WalletCards,
  // Knowledge Base
  GraduationCap,
  BookCopy,
  NotebookText,
  CircleCheckBig,
  // Automation
  Workflow,
  Bot,
  Reply,
  Brain,
  Route,
  Cog,
  // Design
  Figma,
  PenSquare,
  Ruler,
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
  // ── Shopify Design ───────────────────────────────────────────────
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
  // ── Shopify Dev Tools ────────────────────────────────────────────
  {
    name: "Shopify Dev Tools",
    icon: Code2,
    color: "text-blue-500",
    tools: [
      { name: "App Conflict Checker", href: "/shopify-dev/app-conflict", icon: Bug, description: "Detect Shopify app conflicts", replaces: "Manual debugging" },
      { name: "Backup Manager", href: "/shopify-dev/backup-manager", icon: HardDrive, description: "Theme & data backup system", replaces: "Rewind ($39/mo)" },
      { name: "Dev Environment", href: "/shopify-dev/dev-env", icon: Monitor, description: "Local Shopify dev setup", replaces: "Shopify CLI hassle" },
      { name: "Metafield Manager", href: "/shopify-dev/metafield-manager", icon: Database, description: "Browse & edit metafields", replaces: "Metafields Guru ($9/mo)" },
      { name: "Migration Tool", href: "/shopify-dev/migration", icon: Repeat, description: "Platform migration assistant", replaces: "Cart2Cart ($69)" },
      { name: "Product Cleaner", href: "/shopify-dev/product-cleaner", icon: Trash2, description: "Bulk clean product data", replaces: "Manual CSV editing" },
      { name: "Section Builder", href: "/shopify-dev/section-builder", icon: LayoutTemplate, description: "Visual Liquid section builder", replaces: "Shogun ($39/mo)" },
      { name: "Snippet Library", href: "/shopify-dev/snippet-library", icon: Library, description: "Reusable Liquid snippets", replaces: "GitHub Gists" },
      { name: "Speed Optimizer", href: "/shopify-dev/speed-optimizer", icon: Gauge, description: "Performance audit & fixes", replaces: "PageSpeed consultants" },
      { name: "Theme QA", href: "/shopify-dev/theme-qa", icon: TestTube, description: "Cross-browser theme testing", replaces: "BrowserStack ($29/mo)" },
    ],
  },
  // ── Shopify Extended ─────────────────────────────────────────────
  {
    name: "Shopify Extended",
    icon: Blocks,
    color: "text-blue-400",
    tools: [
      { name: "App Boilerplate", href: "/shopify-ext/app-boilerplate", icon: Blocks, description: "Shopify app starter template", replaces: "Manual setup" },
      { name: "Checkout Kit", href: "/shopify-ext/checkout-kit", icon: ShoppingBag, description: "Custom checkout extensions", replaces: "Checkout Plus ($39/mo)" },
      { name: "Kill Switch", href: "/shopify-ext/kill-switch", icon: Power, description: "Emergency store controls", replaces: "Manual theme editing" },
      { name: "Multi-Language", href: "/shopify-ext/multi-lang", icon: Globe2, description: "Store translation manager", replaces: "Langify ($17/mo)" },
      { name: "Schema Generator", href: "/shopify-ext/schema-gen", icon: Brackets, description: "Liquid schema builder", replaces: "Manual JSON editing" },
    ],
  },
  // ── Client Management ────────────────────────────────────────────
  {
    name: "Client Management",
    icon: FolderOpen,
    color: "text-emerald-500",
    tools: [
      { name: "Client Assets", href: "/client-mgmt/assets", icon: FolderOpen, description: "Organize client files & assets", replaces: "Google Drive chaos" },
      { name: "Health Score", href: "/client-mgmt/health-score", icon: HeartPulse, description: "Track client relationship health", replaces: "Gainsight ($500/mo)" },
      { name: "Client Inbox", href: "/client-mgmt/inbox", icon: Inbox, description: "Unified client communication", replaces: "Front ($19/user)" },
      { name: "NPS Surveys", href: "/client-mgmt/nps", icon: ThumbsUp, description: "Net promoter score tracking", replaces: "Delighted ($224/mo)" },
      { name: "Offboarding", href: "/client-mgmt/offboarding", icon: UserMinus, description: "Client offboarding checklists", replaces: "Manual processes" },
      { name: "Onboarding Portal", href: "/client-mgmt/onboarding-portal", icon: DoorOpen, description: "Client onboarding workflows", replaces: "HoneyBook ($19/mo)" },
      { name: "Client Reporting", href: "/client-mgmt/reporting", icon: PieChart, description: "Generate client reports", replaces: "AgencyAnalytics ($12/mo)" },
      { name: "Upsell Tracker", href: "/client-mgmt/upsell", icon: TrendingUp, description: "Track upsell opportunities", replaces: "Salesforce ($25/mo)" },
    ],
  },
  // ── Clients & Projects ───────────────────────────────────────────
  {
    name: "Clients & Projects",
    icon: Users,
    color: "text-sky-500",
    tools: [
      { name: "Client CRM", href: "/clients/crm", icon: Users, description: "Track clients & contacts", replaces: "HubSpot ($20/mo)" },
      { name: "Proposals", href: "/clients/proposals", icon: FileText, description: "Create PDF proposals", replaces: "Proposify ($49/mo)" },
      { name: "Invoices", href: "/clients/invoices", icon: Receipt, description: "Generate professional invoices", replaces: "FreshBooks ($17/mo)" },
      { name: "Kanban Board", href: "/clients/kanban", icon: KanbanSquare, description: "Drag & drop task management", replaces: "Trello ($10/mo)" },
      { name: "Order Tracker", href: "/clients/orders", icon: ClipboardList, description: "Track Fiverr orders & deadlines" },
      { name: "Contracts", href: "/clients/contracts", icon: FileSignature, description: "Freelance contract templates", replaces: "HelloSign ($15/mo)" },
    ],
  },
  // ── HR & Team ────────────────────────────────────────────────────
  {
    name: "HR & Team",
    icon: UserCircle,
    color: "text-orange-500",
    tools: [
      { name: "Team Directory", href: "/hr/directory", icon: UserCircle, description: "Employee profiles & contacts", replaces: "BambooHR ($6/user)" },
      { name: "Attendance", href: "/hr/attendance", icon: Clock, description: "Clock in/out & hours log", replaces: "Clockify Pro ($12/mo)" },
      { name: "Leave Manager", href: "/hr/leave", icon: CalendarOff, description: "PTO requests & balance", replaces: "Calamari ($2/user)" },
      { name: "Payroll", href: "/hr/payroll", icon: Calculator, description: "Salary & tax calculator", replaces: "Gusto ($40/mo)" },
      { name: "Reviews", href: "/hr/reviews", icon: Star, description: "Performance review templates", replaces: "Lattice ($11/user)" },
      { name: "Onboarding", href: "/hr/onboarding", icon: ListChecks, description: "New hire checklists", replaces: "Process.st ($25/mo)" },
    ],
  },
  // ── HR Extended ──────────────────────────────────────────────────
  {
    name: "HR Extended",
    icon: UserSearch,
    color: "text-pink-500",
    tools: [
      { name: "Exit Checklist", href: "/hr-ext/exit-checklist", icon: LogOut, description: "Employee offboarding steps", replaces: "Manual checklists" },
      { name: "Hiring Pipeline", href: "/hr-ext/hiring-pipeline", icon: UserSearch, description: "Track candidates & interviews", replaces: "Workable ($149/mo)" },
      { name: "One-on-One", href: "/hr-ext/one-on-one", icon: MessageSquare, description: "Meeting notes & action items", replaces: "Fellow ($6/user)" },
      { name: "Screening", href: "/hr-ext/screening", icon: Eye, description: "Resume & candidate screening", replaces: "Lever ($500/mo)" },
      { name: "Skill Matrix", href: "/hr-ext/skill-matrix", icon: Grid3X3, description: "Map team skills & gaps", replaces: "Skills Base ($4/user)" },
      { name: "SOP Base", href: "/hr-ext/sop-base", icon: BookOpenCheck, description: "Standard operating procedures", replaces: "Trainual ($49/mo)" },
      { name: "Daily Standup", href: "/hr-ext/standup", icon: Coffee, description: "Async standup check-ins", replaces: "Geekbot ($2.5/user)" },
      { name: "Workload Tracker", href: "/hr-ext/workload", icon: Scale, description: "Balance team workloads", replaces: "Resource Guru ($5/user)" },
    ],
  },
  // ── Team ──────────────────────────────────────────────────────────
  {
    name: "Team",
    icon: Megaphone,
    color: "text-amber-500",
    tools: [
      { name: "Announcements", href: "/team/announcements", icon: Megaphone, description: "Company-wide announcements", replaces: "Slack channels" },
      { name: "Team Polls", href: "/team/polls", icon: Vote, description: "Quick team surveys & votes", replaces: "Polly ($49/mo)" },
    ],
  },
  // ── Projects ─────────────────────────────────────────────────────
  {
    name: "Projects",
    icon: FolderCog,
    color: "text-cyan-500",
    tools: [
      { name: "Approval Flow", href: "/projects/approval", icon: CheckCircle, description: "Multi-stage approval workflows", replaces: "Monday.com ($10/user)" },
      { name: "Gantt Chart", href: "/projects/gantt", icon: GanttChart, description: "Project timeline visualization", replaces: "TeamGantt ($49/mo)" },
      { name: "Profitability", href: "/projects/profitability", icon: Wallet, description: "Project profitability analysis", replaces: "Harvest ($12/user)" },
      { name: "QA Checklist", href: "/projects/qa-checklist", icon: ClipboardCheck, description: "Quality assurance checklists", replaces: "Checklist.com" },
      { name: "Templates", href: "/projects/templates", icon: FolderCog, description: "Reusable project templates", replaces: "Asana ($11/user)" },
    ],
  },
  // ── Marketing ────────────────────────────────────────────────────
  {
    name: "Marketing",
    icon: Share2,
    color: "text-teal-500",
    tools: [
      { name: "SEO Analyzer", href: "/marketing/seo", icon: Search, description: "Audit meta tags & keywords", replaces: "Semrush ($130/mo)" },
      { name: "AI Copywriter", href: "/marketing/copywriter", icon: PenTool, description: "Generate product descriptions", replaces: "Jasper ($49/mo)", badge: "AI" },
      { name: "Social Posts", href: "/marketing/social", icon: Share2, description: "AI social media content", replaces: "Buffer ($6/mo)", badge: "AI" },
      { name: "Email Builder", href: "/marketing/email", icon: Mail, description: "Drag & drop email templates", replaces: "Mailchimp ($13/mo)" },
      { name: "Content Calendar", href: "/marketing/calendar", icon: CalendarDays, description: "Plan & schedule content", replaces: "CoSchedule ($29/mo)" },
      { name: "Meta Tags", href: "/marketing/meta-tags", icon: Tags, description: "SEO meta tag generator", replaces: "Yoast ($99/yr)" },
    ],
  },
  // ── Social Media ─────────────────────────────────────────────────
  {
    name: "Social Media",
    icon: AtSign,
    color: "text-pink-400",
    tools: [
      { name: "Bio Writer", href: "/social/bio-writer", icon: AtSign, description: "AI social media bio generator", replaces: "Manual writing", badge: "AI" },
      { name: "Caption Writer", href: "/social/caption-writer", icon: PencilLine, description: "AI post captions & copy", replaces: "Copy.ai ($49/mo)", badge: "AI" },
      { name: "Competitor Tracker", href: "/social/competitor-tracker", icon: Eye, description: "Monitor competitor social activity", replaces: "Sprout Social ($249/mo)" },
      { name: "Content Ideas", href: "/social/content-ideas", icon: Lightbulb, description: "AI content idea generator", replaces: "BuzzSumo ($199/mo)", badge: "AI" },
      { name: "Engagement Calc", href: "/social/engagement-calc", icon: Heart, description: "Calculate engagement rates", replaces: "Phlanx" },
      { name: "Hashtag Generator", href: "/social/hashtag-gen", icon: Hash, description: "Find trending hashtags", replaces: "Hashtagify ($29/mo)" },
      { name: "Link in Bio", href: "/social/link-bio", icon: LinkIcon, description: "Custom link-in-bio page", replaces: "Linktree ($6/mo)" },
      { name: "Post Scheduler", href: "/social/post-scheduler", icon: CalendarClock, description: "Schedule posts across platforms", replaces: "Later ($25/mo)" },
      { name: "Story Planner", href: "/social/story-planner", icon: Camera, description: "Plan Instagram/TikTok stories", replaces: "Planoly ($13/mo)" },
      { name: "UGC Tracker", href: "/social/ugc-tracker", icon: UserPlus, description: "Track user-generated content", replaces: "TINT ($500/mo)" },
    ],
  },
  // ── Email Marketing ──────────────────────────────────────────────
  {
    name: "Email Marketing",
    icon: Mails,
    color: "text-sky-400",
    tools: [
      { name: "A/B Calculator", href: "/email-mkt/ab-calculator", icon: Split, description: "Email A/B test significance", replaces: "Manual math" },
      { name: "Deliverability", href: "/email-mkt/deliverability", icon: MailCheck, description: "Email deliverability checker", replaces: "GlockApps ($59/mo)" },
      { name: "List Cleaner", href: "/email-mkt/list-cleaner", icon: MailX, description: "Clean & validate email lists", replaces: "ZeroBounce ($16/mo)" },
      { name: "Newsletter Planner", href: "/email-mkt/newsletter-planner", icon: CalendarRange, description: "Plan newsletter content calendar", replaces: "CoSchedule ($29/mo)" },
      { name: "Segment Builder", href: "/email-mkt/segment-builder", icon: ListFilter, description: "Build email audience segments", replaces: "Klaviyo ($45/mo)" },
      { name: "Sequence Builder", href: "/email-mkt/sequence-builder", icon: Send, description: "Drip email sequence designer", replaces: "ConvertKit ($29/mo)" },
      { name: "Subject Tester", href: "/email-mkt/subject-tester", icon: MailQuestion, description: "Test & score subject lines", replaces: "SubjectLine.com" },
      { name: "Template Library", href: "/email-mkt/template-lib", icon: Layers, description: "Email template collection", replaces: "Stripo ($15/mo)" },
      { name: "Unsubscribe Analyzer", href: "/email-mkt/unsubscribe-analyzer", icon: TrendingDown, description: "Analyze unsubscribe patterns", replaces: "Manual tracking" },
      { name: "Warmup Planner", href: "/email-mkt/warmup-planner", icon: ThermometerSun, description: "Email IP warmup scheduler", replaces: "Warmup Inbox ($69/mo)" },
    ],
  },
  // ── SEO ───────────────────────────────────────────────────────────
  {
    name: "SEO",
    icon: Radar,
    color: "text-lime-500",
    tools: [
      { name: "Alt Text Generator", href: "/seo/alt-text", icon: ImageIcon, description: "SEO-optimized image alt text", replaces: "AltText.ai ($5/mo)", badge: "AI" },
      { name: "Content Brief", href: "/seo/content-brief", icon: FileSearch, description: "SEO content brief builder", replaces: "Surfer SEO ($89/mo)" },
      { name: "Internal Links", href: "/seo/internal-links", icon: Unlink, description: "Internal linking suggestions", replaces: "Link Whisper ($77/yr)" },
      { name: "Keyword Cannibal", href: "/seo/keyword-cannibal", icon: Target, description: "Detect keyword cannibalization", replaces: "Ahrefs ($99/mo)" },
      { name: "Technical Crawler", href: "/seo/technical-crawler", icon: Radar, description: "Crawl & audit site issues", replaces: "Screaming Frog ($259/yr)" },
    ],
  },
  // ── Paid Ads ─────────────────────────────────────────────────────
  {
    name: "Paid Ads",
    icon: MousePointerClick,
    color: "text-red-500",
    tools: [
      { name: "A/B Tracker", href: "/ads/ab-tracker", icon: Split, description: "Track A/B test results", replaces: "VWO ($199/mo)" },
      { name: "Budget Allocator", href: "/ads/budget-allocator", icon: Sliders, description: "Optimize ad spend allocation", replaces: "AdEspresso ($49/mo)" },
      { name: "Campaign Builder", href: "/ads/campaign-builder", icon: MousePointerClick, description: "Plan multi-channel campaigns", replaces: "AdRoll ($36/mo)" },
      { name: "Landing Page", href: "/ads/landing-page", icon: ExternalLink, description: "Landing page builder & audit", replaces: "Unbounce ($99/mo)" },
      { name: "ROI Calculator", href: "/ads/roi-calculator", icon: Percent, description: "Ad spend ROI forecasting", replaces: "Spreadsheet formulas" },
    ],
  },
  // ── Sales & Lead Gen ─────────────────────────────────────────────
  {
    name: "Sales & Lead Gen",
    icon: Flame,
    color: "text-fuchsia-500",
    tools: [
      { name: "Case Study Builder", href: "/sales/case-study", icon: BookMarked, description: "Create compelling case studies", replaces: "Case Study Buddy ($2k)" },
      { name: "Cold Email Writer", href: "/sales/cold-email", icon: MailPlus, description: "AI cold outreach templates", replaces: "Lemlist ($59/mo)", badge: "AI" },
      { name: "Lead Scorer", href: "/sales/lead-scorer", icon: Flame, description: "Score & prioritize leads", replaces: "MadKudu ($999/mo)" },
      { name: "Proposal Engine", href: "/sales/proposal-engine", icon: FileBarChart, description: "Auto-generate proposals", replaces: "Qwilr ($35/mo)", badge: "AI" },
      { name: "Referral Tracker", href: "/sales/referral", icon: Gift, description: "Manage referral programs", replaces: "ReferralCandy ($49/mo)" },
    ],
  },
  // ── Analytics ────────────────────────────────────────────────────
  {
    name: "Analytics",
    icon: Activity,
    color: "text-indigo-400",
    tools: [
      { name: "Benchmarks", href: "/analytics/benchmarks", icon: BarChartHorizontal, description: "Industry benchmark comparisons", replaces: "Databox ($72/mo)" },
      { name: "Churn Predictor", href: "/analytics/churn-predictor", icon: TrendingDown, description: "Predict customer churn risk", replaces: "Baremetrics ($108/mo)", badge: "AI" },
      { name: "Client LTV", href: "/analytics/client-ltv", icon: DollarSign, description: "Calculate lifetime value", replaces: "ProfitWell ($0-$1k/mo)" },
      { name: "Cohort Analyzer", href: "/analytics/cohort-analyzer", icon: UserCheck, description: "Retention cohort analysis", replaces: "Mixpanel ($25/mo)" },
      { name: "Funnel Builder", href: "/analytics/funnel-builder", icon: Activity, description: "Visual conversion funnels", replaces: "Funnelytics ($99/mo)" },
      { name: "Goal Tracker", href: "/analytics/goal-tracker", icon: Goal, description: "OKR & goal tracking", replaces: "Lattice ($11/user)" },
      { name: "KPI Dashboard", href: "/analytics/kpi-dashboard", icon: LineChart, description: "Custom KPI dashboards", replaces: "Geckoboard ($49/mo)" },
      { name: "Report Scheduler", href: "/analytics/report-scheduler", icon: CalendarRange, description: "Automated report delivery", replaces: "Google Data Studio" },
      { name: "Revenue Forecast", href: "/analytics/revenue-forecast", icon: TrendingUp, description: "Revenue prediction models", replaces: "Clari ($1k+/mo)", badge: "AI" },
      { name: "Team Metrics", href: "/analytics/team-metrics", icon: Milestone, description: "Team performance dashboards", replaces: "15Five ($6/user)" },
    ],
  },
  // ── CRO ──────────────────────────────────────────────────────────
  {
    name: "CRO",
    icon: MousePointer,
    color: "text-orange-400",
    tools: [
      { name: "CTA Generator", href: "/cro/cta-generator", icon: MousePointer, description: "High-converting CTA builder", replaces: "Manual copywriting", badge: "AI" },
      { name: "Exit Intent", href: "/cro/exit-intent", icon: DoorClosed, description: "Exit-intent popup builder", replaces: "OptinMonster ($16/mo)" },
      { name: "Price Psychology", href: "/cro/price-psychology", icon: BadgeDollarSign, description: "Pricing psychology tactics", replaces: "Pricing consultants" },
      { name: "Social Proof", href: "/cro/social-proof", icon: BadgeCheck, description: "Social proof widget builder", replaces: "ProveSource ($29/mo)" },
      { name: "Trust Badges", href: "/cro/trust-badge", icon: ShieldAlert, description: "Trust badge generator", replaces: "TrustBadge ($5/mo)" },
    ],
  },
  // ── Copywriting ──────────────────────────────────────────────────
  {
    name: "Copywriting",
    icon: PencilLine,
    color: "text-amber-400",
    tools: [
      { name: "Ad Copy Writer", href: "/copywriting/ad-copy", icon: PencilLine, description: "AI ad copy generator", replaces: "Copy.ai ($49/mo)", badge: "AI" },
      { name: "AIDA Writer", href: "/copywriting/aida-writer", icon: Wand2, description: "AIDA framework writer", replaces: "Jasper ($49/mo)", badge: "AI" },
      { name: "Email Subject Lines", href: "/copywriting/email-subject", icon: Mail, description: "Subject line generator", replaces: "SubjectLine.com", badge: "AI" },
      { name: "Headline Formulas", href: "/copywriting/headline-formulas", icon: Heading, description: "Proven headline templates", replaces: "Swipe file collection" },
      { name: "PAS Writer", href: "/copywriting/pas-writer", icon: Quote, description: "Problem-Agitate-Solve copy", replaces: "Jasper ($49/mo)", badge: "AI" },
      { name: "Power Words", href: "/copywriting/power-words", icon: Gem, description: "High-impact word library", replaces: "Swipe file PDFs" },
      { name: "Swipe File", href: "/copywriting/swipe-file", icon: Bookmark, description: "Save & organize copy inspiration", replaces: "Notion boards" },
      { name: "Tagline Generator", href: "/copywriting/tagline-gen", icon: Sparkles, description: "AI brand tagline creator", replaces: "Shopify Slogan Maker", badge: "AI" },
      { name: "Tone Analyzer", href: "/copywriting/tone-analyzer", icon: ScanEye, description: "Analyze & adjust copy tone", replaces: "Grammarly ($12/mo)", badge: "AI" },
      { name: "Value Proposition", href: "/copywriting/value-prop", icon: CircleDot, description: "Value prop canvas builder", replaces: "Strategyzer ($0-$25)" },
    ],
  },
  // ── Brand Strategy ───────────────────────────────────────────────
  {
    name: "Brand Strategy",
    icon: Compass,
    color: "text-purple-400",
    tools: [
      { name: "Mission & Vision", href: "/brand/mission-vision", icon: Compass, description: "Mission & vision statement builder", replaces: "Brand consultants" },
      { name: "Brand Naming", href: "/brand/naming", icon: Fingerprint, description: "Brand name brainstorming tool", replaces: "Squadhelp ($299+)", badge: "AI" },
      { name: "Persona Builder", href: "/brand/persona-builder", icon: UserCog, description: "Customer persona creator", replaces: "HubSpot Make My Persona" },
      { name: "Brand Positioning", href: "/brand/positioning", icon: MapPin, description: "Positioning strategy canvas", replaces: "Strategyzer ($25/mo)" },
      { name: "Voice Guide", href: "/brand/voice-guide", icon: Volume2, description: "Brand voice & tone guide", replaces: "Content style guides" },
    ],
  },
  // ── Legal ────────────────────────────────────────────────────────
  {
    name: "Legal",
    icon: Gavel,
    color: "text-stone-400",
    tools: [
      { name: "Cookie Policy", href: "/legal/cookie-policy", icon: Cookie, description: "Cookie consent policy generator", replaces: "CookieYes ($12/mo)" },
      { name: "GDPR Checker", href: "/legal/gdpr-checker", icon: ShieldCheck, description: "GDPR compliance auditor", replaces: "OneTrust ($500+/mo)" },
      { name: "NDA Generator", href: "/legal/nda-gen", icon: ScrollText, description: "Non-disclosure agreement builder", replaces: "LegalZoom ($10/ea)" },
      { name: "Refund Policy", href: "/legal/refund-policy", icon: Undo2, description: "Return & refund policy generator", replaces: "Termly ($10/mo)" },
      { name: "Terms Generator", href: "/legal/terms-gen", icon: Gavel, description: "Terms of service generator", replaces: "TermsFeed ($12/mo)" },
    ],
  },
  // ── Support ──────────────────────────────────────────────────────
  {
    name: "Support",
    icon: Headphones,
    color: "text-green-400",
    tools: [
      { name: "Knowledge Base", href: "/support/knowledge-base", icon: BookOpen, description: "Self-service help center", replaces: "Zendesk ($55/agent)" },
      { name: "Response Templates", href: "/support/response-templates", icon: LifeBuoy, description: "Canned response library", replaces: "TextExpander ($4/mo)" },
      { name: "Satisfaction", href: "/support/satisfaction", icon: Smile, description: "CSAT survey tool", replaces: "Nicereply ($59/mo)" },
      { name: "SLA Tracker", href: "/support/sla-tracker", icon: AlarmClock, description: "Service level agreement monitor", replaces: "Freshdesk ($15/agent)" },
      { name: "Ticket Tracker", href: "/support/ticket-tracker", icon: TicketCheck, description: "Support ticket management", replaces: "Help Scout ($20/user)" },
    ],
  },
  // ── Products ─────────────────────────────────────────────────────
  {
    name: "Products",
    icon: Package,
    color: "text-emerald-400",
    tools: [
      { name: "Bundle Builder", href: "/products/bundle-builder", icon: Boxes, description: "Product bundle creator", replaces: "Bundler ($10/mo)" },
      { name: "Catalog Manager", href: "/products/catalog-manager", icon: FolderTree, description: "Product catalog organizer", replaces: "Manual spreadsheets" },
      { name: "Collection Planner", href: "/products/collection-planner", icon: LayoutGrid, description: "Plan product collections", replaces: "Notion boards" },
      { name: "Inventory Tracker", href: "/products/inventory-tracker", icon: Warehouse, description: "Stock level monitoring", replaces: "Stocky ($0-$79/mo)" },
      { name: "Photo Guide", href: "/products/photo-guide", icon: CameraIcon, description: "Product photography guide", replaces: "Hire photographer ($500+)" },
      { name: "Price Optimizer", href: "/products/price-optimizer", icon: BadgePercent, description: "Dynamic pricing suggestions", replaces: "Prisync ($99/mo)", badge: "AI" },
      { name: "Review Manager", href: "/products/review-manager", icon: MessagesSquare, description: "Product review aggregator", replaces: "Judge.me ($15/mo)" },
      { name: "SEO Optimizer", href: "/products/seo-optimizer", icon: SearchCheck, description: "Product page SEO audit", replaces: "Plug In SEO ($20/mo)" },
      { name: "Tag Manager", href: "/products/tag-manager", icon: TagsIcon, description: "Bulk product tag editor", replaces: "Manual tagging" },
      { name: "Variant Builder", href: "/products/variant-builder", icon: Puzzle, description: "Product variant generator", replaces: "Infinite Options ($10/mo)" },
    ],
  },
  // ── Agency ───────────────────────────────────────────────────────
  {
    name: "Agency",
    icon: Building2,
    color: "text-violet-400",
    tools: [
      { name: "Capacity Planner", href: "/agency/capacity-planner", icon: UsersRound, description: "Team capacity forecasting", replaces: "Resource Guru ($5/user)" },
      { name: "Meeting Notes", href: "/agency/meeting-notes", icon: NotebookPen, description: "AI meeting summary & actions", replaces: "Otter.ai ($17/mo)", badge: "AI" },
      { name: "Rate Card", href: "/agency/rate-card", icon: Banknote, description: "Service rate card builder", replaces: "Manual rate sheets" },
      { name: "Resource Planner", href: "/agency/resource-planner", icon: CalendarPlus, description: "Allocate team resources", replaces: "Float ($6/user)" },
      { name: "Retrospective", href: "/agency/retrospective", icon: RotateCcw, description: "Sprint retrospective tool", replaces: "Retrium ($29/mo)" },
    ],
  },
  // ── Productivity ─────────────────────────────────────────────────
  {
    name: "Productivity",
    icon: Hourglass,
    color: "text-teal-400",
    tools: [
      { name: "Eisenhower Matrix", href: "/productivity/eisenhower", icon: LayoutGrid, description: "Priority task matrix", replaces: "Todoist ($5/mo)" },
      { name: "Goals", href: "/productivity/goals", icon: Crosshair, description: "Goal setting & tracking", replaces: "Goalscape ($8/mo)" },
      { name: "Habit Tracker", href: "/productivity/habit-tracker", icon: Repeat2, description: "Build positive habits", replaces: "Habitica ($5/mo)" },
      { name: "Journal", href: "/productivity/journal", icon: BookHeart, description: "Daily work journal", replaces: "Day One ($3/mo)" },
      { name: "Pomodoro Timer", href: "/productivity/pomodoro", icon: Hourglass, description: "Focus timer technique", replaces: "Forest ($4/yr)" },
    ],
  },
  // ── Research ─────────────────────────────────────────────────────
  {
    name: "Research",
    icon: FlaskConical,
    color: "text-cyan-400",
    tools: [
      { name: "Market Research", href: "/research/market-research", icon: Globe, description: "Market analysis framework", replaces: "Statista ($149/mo)" },
      { name: "Price Comparison", href: "/research/price-comparison", icon: ScatterChart, description: "Competitor price analysis", replaces: "Prisync ($99/mo)" },
      { name: "Survey Builder", href: "/research/survey-builder", icon: ClipboardList, description: "Custom survey creator", replaces: "Typeform ($25/mo)" },
      { name: "SWOT Analysis", href: "/research/swot", icon: BarChart2, description: "SWOT strategy framework", replaces: "Consulting templates" },
      { name: "Trend Tracker", href: "/research/trend-tracker", icon: TrendingUp, description: "Industry trend monitoring", replaces: "Exploding Topics ($39/mo)" },
    ],
  },
  // ── Templates ────────────────────────────────────────────────────
  {
    name: "Templates",
    icon: FolderArchive,
    color: "text-rose-400",
    tools: [
      { name: "Client Emails", href: "/templates/client-emails", icon: Mail, description: "Professional email templates", replaces: "Template libraries" },
      { name: "Fiverr Messages", href: "/templates/fiverr-messages", icon: MessageSquare, description: "Fiverr communication templates", replaces: "Copy-paste files" },
      { name: "Social DMs", href: "/templates/social-dm", icon: Send, description: "Social media DM templates", replaces: "Manual typing" },
      { name: "SOP Templates", href: "/templates/sop-templates", icon: FileStack, description: "Standard procedure templates", replaces: "Google Docs" },
      { name: "Upwork Proposals", href: "/templates/upwork-proposals", icon: Briefcase, description: "Winning proposal templates", replaces: "Freelancer forums" },
    ],
  },
  // ── Freelance ────────────────────────────────────────────────────
  {
    name: "Freelance",
    icon: UserRound,
    color: "text-yellow-500",
    tools: [
      { name: "Client Feedback", href: "/freelance/client-feedback", icon: MessageSquareDashed, description: "Collect & manage feedback", replaces: "Manual follow-ups" },
      { name: "Income Tracker", href: "/freelance/income-tracker", icon: WalletCards, description: "Freelance income dashboard", replaces: "Wave ($0-$16/mo)" },
    ],
  },
  // ── Knowledge Base ───────────────────────────────────────────────
  {
    name: "Knowledge Base",
    icon: GraduationCap,
    color: "text-blue-300",
    tools: [
      { name: "Checklist Library", href: "/knowledge/checklist-lib", icon: CircleCheckBig, description: "Reusable checklist templates", replaces: "Process.st ($25/mo)" },
      { name: "SOP Generator", href: "/knowledge/sop-generator", icon: BookCopy, description: "Auto-generate SOPs", replaces: "Trainual ($49/mo)", badge: "AI" },
      { name: "Training Hub", href: "/knowledge/training", icon: GraduationCap, description: "Team training materials", replaces: "Lessonly ($300/mo)" },
      { name: "Wiki", href: "/knowledge/wiki", icon: NotebookText, description: "Internal knowledge wiki", replaces: "Notion ($10/user)" },
    ],
  },
  // ── Automation ───────────────────────────────────────────────────
  {
    name: "Automation",
    icon: Workflow,
    color: "text-green-500",
    tools: [
      { name: "Analytics Hub", href: "/automation/analytics-hub", icon: Brain, description: "Centralized analytics overview", replaces: "Databox ($72/mo)" },
      { name: "Canned Responses", href: "/automation/canned-responses", icon: Reply, description: "Quick reply templates", replaces: "TextExpander ($4/mo)" },
      { name: "Competitive Intel", href: "/automation/competitive-intel", icon: Radar, description: "Competitor monitoring", replaces: "Crayon ($500/mo)" },
      { name: "Scheduler", href: "/automation/scheduler", icon: CalendarClock, description: "Task & event scheduler", replaces: "Calendly ($10/mo)" },
      { name: "Task Router", href: "/automation/task-router", icon: Route, description: "Auto-assign tasks to team", replaces: "Monday.com ($10/user)", badge: "AI" },
      { name: "Workflow Builder", href: "/automation/workflow-builder", icon: Workflow, description: "Visual automation workflows", replaces: "Zapier ($20/mo)" },
    ],
  },
  // ── Design ───────────────────────────────────────────────────────
  {
    name: "Design",
    icon: PenSquare,
    color: "text-fuchsia-400",
    tools: [
      { name: "Design Feedback", href: "/design/feedback", icon: MessageCircle, description: "Visual design review tool", replaces: "InVision ($0-$15/mo)" },
      { name: "Style Guide", href: "/design/style-guide", icon: Ruler, description: "Design system builder", replaces: "Frontify ($79/mo)" },
      { name: "Wireframe", href: "/design/wireframe", icon: PenSquare, description: "Quick wireframe sketcher", replaces: "Balsamiq ($9/mo)" },
    ],
  },
  // ── AI Studio ────────────────────────────────────────────────────
  {
    name: "AI Studio",
    icon: Sparkles,
    color: "text-purple-500",
    tools: [
      { name: "Image Generator", href: "/ai-studio/image-gen", icon: ImagePlus, description: "Generate any image with AI", replaces: "Midjourney ($10/mo)", badge: "AI" },
      { name: "BG Remover", href: "/ai-studio/bg-remove", icon: Eraser, description: "Remove & replace backgrounds", replaces: "remove.bg ($9/mo)", badge: "AI" },
      { name: "Name Generator", href: "/ai-studio/name-gen", icon: Lightbulb, description: "AI business name ideas", replaces: "Namelix", badge: "AI" },
      { name: "Translator", href: "/ai-studio/translate", icon: Languages, description: "Translate store content", replaces: "DeepL Pro ($25/mo)", badge: "AI" },
    ],
  },
  // ── Finance & Analytics ──────────────────────────────────────────
  {
    name: "Finance & Analytics",
    icon: DollarSign,
    color: "text-indigo-500",
    tools: [
      { name: "Expense Tracker", href: "/finance/expense-tracker", icon: Receipt, description: "Track business expenses by category", replaces: "Expensify ($5/mo)" },
      { name: "Time Tracker", href: "/finance/time-tracker", icon: Timer, description: "Billable hours & invoice generation", replaces: "Toggl ($10/mo)" },
      { name: "Tax Calculator", href: "/finance/tax-calculator", icon: Calculator, description: "Freelancer tax estimator with brackets", replaces: "TurboTax ($89/yr)" },
      { name: "Currency Converter", href: "/finance/currency-converter", icon: ArrowLeftRight, description: "Convert 15+ world currencies", replaces: "XE.com" },
      { name: "Subscription Manager", href: "/finance/subscription-manager", icon: CreditCard, description: "Track subscriptions & renewals", replaces: "TrackMySubs ($36/yr)" },
    ],
  },
  // ── E-commerce+ ──────────────────────────────────────────────────
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
  // ── Content & Legal ──────────────────────────────────────────────
  {
    name: "Content & Legal",
    icon: BookOpen,
    color: "text-stone-500",
    tools: [
      { name: "Blog Outlines", href: "/content/blog-outline", icon: BookOpen, description: "Generate structured blog outlines", replaces: "Frase ($15/mo)" },
      { name: "Headline Analyzer", href: "/content/headline-analyzer", icon: Heading, description: "Score & optimize headlines", replaces: "CoSchedule Analyzer" },
      { name: "Privacy Policy", href: "/content/privacy-policy", icon: Shield, description: "GDPR/CCPA policy generator", replaces: "Termly ($10/mo)" },
      { name: "Testimonials", href: "/content/testimonial-builder", icon: MessageSquareQuote, description: "Manage & embed reviews", replaces: "Testimonial.to ($20/mo)" },
      { name: "FAQ Builder", href: "/content/faq-builder", icon: HelpCircle, description: "Build FAQ pages with schema", replaces: "Helpjuice ($120/mo)" },
    ],
  },
  // ── Developer Tools ──────────────────────────────────────────────
  {
    name: "Developer Tools",
    icon: Code2,
    color: "text-zinc-500",
    tools: [
      { name: "JSON Formatter", href: "/developer/json-formatter", icon: Braces, description: "Format, validate & beautify JSON", replaces: "JSON Editor Online" },
      { name: "Regex Tester", href: "/developer/regex-tester", icon: Regex, description: "Test patterns with live highlighting", replaces: "Regex101" },
      { name: "Color Converter", href: "/developer/color-converter", icon: Paintbrush, description: "HEX/RGB/HSL + contrast checker", replaces: "ColorHexa" },
      { name: "Password Gen", href: "/developer/password-gen", icon: KeyRound, description: "Secure passwords & passphrases", replaces: "1Password Generator" },
      { name: "CSS Gradients", href: "/developer/css-gradient", icon: Blend, description: "Visual gradient builder", replaces: "CSS Gradient.io" },
    ],
  },
  // ── Utilities ────────────────────────────────────────────────────
  {
    name: "Utilities",
    icon: BarChart3,
    color: "text-slate-500",
    tools: [
      { name: "QR Generator", href: "/utilities/qr-code", icon: QrCode, description: "Custom branded QR codes", replaces: "QR Monkey Pro" },
      { name: "UTM Builder", href: "/utilities/utm", icon: Link, description: "Campaign tracking URLs", replaces: "UTM.io ($25/mo)" },
      { name: "Competitor Spy", href: "/utilities/competitor", icon: BarChart3, description: "Analyze competitor stores", replaces: "BuiltWith ($295/mo)" },
      { name: "Profit Calculator", href: "/utilities/profit", icon: DollarSign, description: "Revenue & margin calculator" },
      { name: "Image Converter", href: "/utilities/converter", icon: FileImage, description: "Convert & resize images", replaces: "CloudConvert" },
    ],
  },
  // ── YouTube & Content ────────────────────────────────────────────
  {
    name: "YouTube & Content",
    icon: Youtube,
    color: "text-rose-600",
    tools: [
      { name: "Video Ideas", href: "/youtube/video-ideas", icon: Lightbulb, description: "AI-powered video topic generator", replaces: "TubeBuddy ($9/mo)", badge: "AI" },
      { name: "SEO Optimizer", href: "/youtube/seo-optimizer", icon: Search, description: "YouTube SEO title & tag optimizer", replaces: "vidIQ ($10/mo)" },
      { name: "Sponsorship", href: "/youtube/sponsorship", icon: Handshake, description: "Sponsorship deal tracker", replaces: "Grin ($500/mo)" },
      { name: "Thumbnail", href: "/youtube/thumbnail", icon: ImageIcon, description: "Thumbnail design & A/B test", replaces: "Canva Pro ($13/mo)" },
      { name: "Transcript to Blog", href: "/youtube/transcript-blog", icon: FileText, description: "Convert video to blog post", replaces: "Descript ($24/mo)", badge: "AI" },
    ],
  },
];

export const dashboardLink = {
  name: "Dashboard",
  href: "/",
  icon: LayoutDashboard,
};
