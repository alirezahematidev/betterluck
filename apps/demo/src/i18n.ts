import { createContext, useContext } from "react";

export type Locale = "en" | "fa";

const en = {
  title: "Fortune Wheel",
  subtitle: "A physics-driven, fully themable prize wheel for React, with RTL and Persian support.",
  language: "فارسی",
  languageLabel: "Switch to Persian",
  github: "GitHub",
  npm: "npm",

  spin: "Spin",
  spinning: "Spinning…",
  hint: "Tip: grab the wheel and flick it.",
  youLanded: "You landed on",
  resultPlaceholder: "Your result will appear here.",
  goodLuck: "Good luck…",
  recent: "Recent spins",
  clear: "Clear",
  noWeight: "Give at least one segment a frequency above 0 to spin.",
  untitled: "Untitled",
  editingPaused: "Editing is paused while the wheel spins.",
  saveFailed: "Changes could not be saved in this browser (storage full or blocked).",
  savedLocally: "Your wheel is saved in this browser.",

  tabSegments: "Segments",
  tabStyle: "Style",
  tabBehavior: "Behavior",
  tabCode: "Code",

  titleField: "Title",
  frequency: "Frequency",
  chance: "Chance",
  textColor: "Text color",
  auto: "Auto",
  imageUrl: "Image URL, or upload",
  upload: "Upload image",
  removeImage: "Remove image",
  presetImages: "Preset images",
  uploaded: "uploaded",
  notAnImage: "That file is not an image.",
  imageReadError: "Could not read that image.",
  moveUp: "Move up",
  moveDown: "Move down",
  duplicate: "Duplicate",
  remove: "Delete",
  addSegment: "Add segment",
  newPrize: "Prize",
  noSegments: "No segments yet. Add one to get started.",
  loadSamples: "Load sample segments",
  segmentN: "Segment",

  theme: "Theme",
  themes: { twilight: "Twilight", casino: "Casino", minimal: "Minimal", neon: "Neon" },
  themeHint: "Recolors the frame, indicator, hub and slices.",
  size: "Size",
  fitContainer: "Fit container",
  fixed: "Fixed",
  diameter: "Diameter",
  frame: "Frame",
  frameWidth: "Rim width",
  frameColor: "Rim color",
  pegs: "Pegs",
  pegColor: "Peg color",
  pegSize: "Peg size",
  dividerColor: "Divider color",
  dividerWidth: "Divider width",
  shading: "Shading",
  indicator: "Indicator",
  position: "Position",
  positions: { top: "Top", right: "Right", bottom: "Bottom", left: "Left" },
  shape: "Shape",
  shapes: { pin: "Pin", triangle: "Triangle", needle: "Needle" },
  color: "Color",
  indicatorSize: "Size",
  flap: "Pegs push it",
  hub: "Hub",
  hubLabel: "Label",
  hubRadius: "Radius",
  hubColor: "Color",
  hubTextColor: "Text color",
  labels: "Labels",
  font: "Font",
  fonts: {
    rounded: "System rounded",
    vazirmatn: "Vazirmatn",
    lalezar: "Lalezar",
    nunito: "Nunito",
    serif: "Serif",
    mono: "Monospace",
  },
  weight: "Weight",
  labelColor: "Color",
  custom: "Custom",
  maxFontSize: "Max font size",
  imageScale: "Image size",
  uniform: "Same size for all labels",
  direction: "Direction",
  directions: { auto: "Auto", ltr: "LTR", rtl: "RTL" },

  sliceSize: "Slice size",
  equal: "Equal",
  proportional: "Proportional",
  equalHint: "Frequency only changes the odds.",
  proportionalHint: "Slice size shows the real odds.",
  spinDirection: "Spin direction",
  clockwise: "Clockwise",
  counterclockwise: "Counter-clockwise",
  interaction: "Interaction",
  sound: "Peg ticks",
  flick: "Grab and flick",
  physics: "Physics",
  physicsHint: (seconds: string, turns: string) =>
    `Coasting follows dω/dt = −μ − k·ω. An average spin lasts about ${seconds} s and makes ${turns} turns.`,
  minLaunchSpeed: "Min launch speed",
  maxLaunchSpeed: "Max launch speed",
  spinUpTime: "Spin-up time",
  friction: "Axle friction μ",
  drag: "Air drag k",
  flickThreshold: "Flick threshold",
  resetPhysics: "Reset physics",
  resetAll: "Reset everything",

  codeIntro: "Install the package, then render the wheel with the options you picked:",
  copy: "Copy",
  copied: "Copied!",

  units: {
    radPerSec: "rad/s",
    seconds: "s",
    radPerSec2: "rad/s²",
    perSec: "1/s",
    px: "px",
    units: "u",
  },
};

export type Messages = typeof en;

const fa: Messages = {
  title: "گردونه شانس",
  subtitle:
    "گردونه‌ی جایزه برای React، مبتنی بر فیزیک واقعی، کاملاً قابل شخصی‌سازی و با پشتیبانی از راست‌به‌چپ و فارسی.",
  language: "English",
  languageLabel: "تغییر زبان به انگلیسی",
  github: "گیت‌هاب",
  npm: "npm",

  spin: "بچرخان",
  spinning: "در حال چرخش…",
  hint: "نکته: گردونه را بگیرید و با یک حرکت سریع بچرخانید.",
  youLanded: "نتیجه‌ی شما",
  resultPlaceholder: "نتیجه اینجا نمایش داده می‌شود.",
  goodLuck: "موفق باشید…",
  recent: "چرخش‌های اخیر",
  clear: "پاک کردن",
  noWeight: "برای چرخاندن، فراوانی دست‌کم یک بخش باید بیشتر از صفر باشد.",
  untitled: "بی‌عنوان",
  editingPaused: "در حین چرخش، ویرایش غیرفعال است.",
  saveFailed: "تغییرات در این مرورگر ذخیره نشد (فضای ذخیره‌سازی پر یا مسدود است).",
  savedLocally: "گردونه‌ی شما در همین مرورگر ذخیره می‌شود.",

  tabSegments: "بخش‌ها",
  tabStyle: "ظاهر",
  tabBehavior: "رفتار",
  tabCode: "کد",

  titleField: "عنوان",
  frequency: "فراوانی",
  chance: "شانس",
  textColor: "رنگ متن",
  auto: "خودکار",
  imageUrl: "نشانی تصویر یا بارگذاری",
  upload: "بارگذاری تصویر",
  removeImage: "حذف تصویر",
  presetImages: "تصاویر آماده",
  uploaded: "بارگذاری‌شده",
  notAnImage: "این فایل تصویر نیست.",
  imageReadError: "خواندن تصویر ممکن نبود.",
  moveUp: "انتقال به بالا",
  moveDown: "انتقال به پایین",
  duplicate: "تکثیر",
  remove: "حذف",
  addSegment: "افزودن بخش",
  newPrize: "جایزه",
  noSegments: "هنوز بخشی وجود ندارد. برای شروع یکی اضافه کنید.",
  loadSamples: "بارگذاری بخش‌های نمونه",
  segmentN: "بخش",

  theme: "پوسته",
  themes: { twilight: "شفق", casino: "کازینو", minimal: "ساده", neon: "نئون" },
  themeHint: "رنگ قاب، نشانگر، مرکز و بخش‌ها را تغییر می‌دهد.",
  size: "اندازه",
  fitContainer: "هم‌اندازه‌ی ظرف",
  fixed: "ثابت",
  diameter: "قطر",
  frame: "قاب",
  frameWidth: "پهنای لبه",
  frameColor: "رنگ لبه",
  pegs: "میخ‌ها",
  pegColor: "رنگ میخ",
  pegSize: "اندازه‌ی میخ",
  dividerColor: "رنگ جداکننده",
  dividerWidth: "پهنای جداکننده",
  shading: "سایه‌روشن",
  indicator: "نشانگر",
  position: "جایگاه",
  positions: { top: "بالا", right: "راست", bottom: "پایین", left: "چپ" },
  shape: "شکل",
  shapes: { pin: "سنجاق", triangle: "مثلث", needle: "عقربه" },
  color: "رنگ",
  indicatorSize: "اندازه",
  flap: "تکان خوردن با میخ‌ها",
  hub: "مرکز",
  hubLabel: "نوشته",
  hubRadius: "شعاع",
  hubColor: "رنگ",
  hubTextColor: "رنگ نوشته",
  labels: "برچسب‌ها",
  font: "قلم",
  fonts: {
    rounded: "قلم سیستم",
    vazirmatn: "وزیرمتن",
    lalezar: "لاله‌زار",
    nunito: "Nunito",
    serif: "سریف",
    mono: "هم‌عرض",
  },
  weight: "ضخامت",
  labelColor: "رنگ",
  custom: "دلخواه",
  maxFontSize: "بیشینه‌ی اندازه‌ی قلم",
  imageScale: "اندازه‌ی تصویر",
  uniform: "اندازه‌ی یکسان برای همه‌ی برچسب‌ها",
  direction: "جهت متن",
  directions: { auto: "خودکار", ltr: "چپ‌به‌راست", rtl: "راست‌به‌چپ" },

  sliceSize: "اندازه‌ی بخش‌ها",
  equal: "یکسان",
  proportional: "متناسب",
  equalHint: "فراوانی فقط احتمال برنده شدن را تغییر می‌دهد.",
  proportionalHint: "اندازه‌ی هر بخش احتمال واقعی آن را نشان می‌دهد.",
  spinDirection: "جهت چرخش",
  clockwise: "ساعتگرد",
  counterclockwise: "پادساعتگرد",
  interaction: "تعامل",
  sound: "صدای میخ‌ها",
  flick: "گرفتن و پرتاب کردن",
  physics: "فیزیک",
  physicsHint: (seconds: string, turns: string) =>
    `حرکت آزاد از معادله‌ی dω/dt = −μ − k·ω پیروی می‌کند. هر چرخش به‌طور میانگین حدود ${seconds} ثانیه طول می‌کشد و ${turns} دور می‌زند.`,
  minLaunchSpeed: "کمینه‌ی سرعت پرتاب",
  maxLaunchSpeed: "بیشینه‌ی سرعت پرتاب",
  spinUpTime: "زمان شتاب‌گیری",
  friction: "اصطکاک محور μ",
  drag: "مقاومت هوا k",
  flickThreshold: "آستانه‌ی پرتاب",
  resetPhysics: "بازنشانی فیزیک",
  resetAll: "بازنشانی همه‌چیز",

  codeIntro: "بسته را نصب کنید و گردونه را با گزینه‌های انتخاب‌شده رندر کنید:",
  copy: "کپی",
  copied: "کپی شد!",

  units: {
    radPerSec: "rad/s",
    seconds: "ثانیه",
    radPerSec2: "rad/s²",
    perSec: "1/s",
    px: "px",
    units: "واحد",
  },
};

export const MESSAGES: Record<Locale, Messages> = { en, fa };

export interface I18n {
  locale: Locale;
  dir: "ltr" | "rtl";
  t: Messages;
  /** Formats a number with the locale's digits. */
  num: (value: number, maximumFractionDigits?: number) => string;
  percent: (value: number) => string;
}

export function makeI18n(locale: Locale): I18n {
  const tag = locale === "fa" ? "fa-IR" : "en-US";
  const formatters = new Map<number, Intl.NumberFormat>();
  const num = (value: number, digits = 2) => {
    let f = formatters.get(digits);
    if (!f) {
      f = new Intl.NumberFormat(tag, { maximumFractionDigits: digits });
      formatters.set(digits, f);
    }
    return f.format(value);
  };
  const pct = new Intl.NumberFormat(tag, { style: "percent", maximumFractionDigits: 1 });
  return {
    locale,
    dir: locale === "fa" ? "rtl" : "ltr",
    t: MESSAGES[locale],
    num,
    percent: (p) => (p > 0 && p < 0.001 ? `<${pct.format(0.001)}` : pct.format(p)),
  };
}

export const I18nContext = createContext<I18n>(makeI18n("en"));

export const useI18n = (): I18n => useContext(I18nContext);
