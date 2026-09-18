"use client";
import {
  Fragment,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  AnimatePresence,
  motion,
  MotionConfig,
  useReducedMotion,
} from "framer-motion";
import {
  BookOpen,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Flower2,
  Pencil,
  Plus,
  Smile,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  categoryConsistency,
  completion,
  habitsForDay,
  isHabit,
  isScheduledForDate,
  localDateKey,
  ritualGroupsForDate,
  seedHabits,
  toggleHabit,
  type Habit,
  type ActivityHistory,
} from "@/lib/habits";
import { useOdetteTools } from "@/lib/use-odette-tools";
import {
  localeOf,
  makeTranslator,
  type Language,
  type Translate,
} from "@/lib/i18n";
const I18nContext = createContext<Translate>(makeTranslator("English"));
const useT = () => useContext(I18nContext);
function lines(text: string) {
  return text.split("\n").map((line, index) => (
    <Fragment key={index}>
      {index > 0 && <br />}
      {line}
    </Fragment>
  ));
}
const screens = [
  "welcome",
  "signup",
  "login",
  "name",
  "focus",
  "routine",
  "ready",
  "today",
  "daily",
  "progress",
  "calendar",
  "rituals",
  "profile",
  "subscription",
  "help",
] as const;
type Screen = (typeof screens)[number];
type Modal =
  | "addActivity"
  | "editActivity"
  | "addRitual"
  | "editRitual"
  | "photo"
  | "editProfile"
  | "subscribe"
  | "cancelPlan"
  | "signOut"
  | "google"
  | "done"
  | null;
type ProgressTab = "habits" | "rituals";
type ProgressPeriod = "weekly" | "monthly";
type ProgressView = "calendar" | "report";
type Routine = Habit["routine"];
const easing = [0.22, 1, 0.36, 1] as const;
const focusOptions = [
  "Mental Wellness",
  "Physical Health",
  "Self Care",
  "Productivity",
  "Better Sleep",
  "Joy",
];
const routineOptions = [
  "Drink Water",
  "Skincare",
  "Exercise",
  "Journal",
  "Read",
  "Pray/Meditate",
  "Sleep before 11 PM",
];
const emojiOptions = [
  "😀", "😃", "😄", "😁", "😊", "🥰", "😍", "🤩",
  "😌", "😇", "🥹", "😂", "🙂", "🙃", "😉", "😎",
  "🥳", "🤗", "🤭", "🫶", "👏", "🙌", "👍", "✌️",
  "🤞", "🙏", "💪", "🧘", "❤️", "🩷", "🧡", "💛",
  "💚", "🩵", "💙", "💜", "🤍", "✨", "⭐", "🌙",
  "☀️", "🌈", "🔥", "🌸", "🌷", "🌹", "🌻", "🌿",
  "🍀", "🌱", "🪷", "🦋", "🐝", "🐣", "🐱", "🐶",
  "🍓", "🍎", "🥑", "🧁", "☕", "🫖", "🎀", "🎧",
  "📚", "📝", "🎨", "🕯️", "🛁", "🛌", "🏃", "🚶",
];
const categoryOptions = [
  "Mind",
  "Body",
  "Self Care",
  "Wellness",
  "Rest",
  "Productivity",
  "Joy",
];
const periodOptions: DropdownOption[] = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];
const viewByOptions: DropdownOption[] = [
  { value: "", label: "View by", disabled: true },
  ...periodOptions,
];
const languageOptions: DropdownOption[] = [
  { value: "English", label: "English" },
  { value: "Indonesia", label: "Indonesia" },
];
const asOptions = (values: readonly string[]): DropdownOption[] =>
  values.map((value) => ({ value, label: value }));
const activityCategoryOptions: DropdownOption[] = [
  { value: "", label: "Category", disabled: true },
  ...asOptions(categoryOptions),
];
const ritualCategoryOptions = asOptions([
  "Mind",
  "Wellness",
  "Self Care",
  "Body",
]);
const editRitualCategoryOptions = asOptions([
  "Wellness",
  "Mind",
  "Self Care",
  "Body",
]);
const frequencyOptions = asOptions(["Every day", "Weekdays", "Weekends"]);
const timeRangeOptions = asOptions([
  "Morning",
  "Afternoon",
  "Evening",
  "Night",
]);
const plans = [
  {
    id: "monthly",
    name: "Monthly",
    months: 1,
    price: 19999,
    tagline: "Try it gently, stop whenever.",
    highlight: "",
  },
  {
    id: "halfYear",
    name: "6 Months",
    months: 6,
    price: 79999,
    tagline: "A calm half-year of rituals.",
    highlight: "Most loved",
  },
  {
    id: "yearly",
    name: "1 Year",
    months: 12,
    price: 149999,
    tagline: "Best value for a full year.",
    highlight: "Best value",
  },
] as const;
type PlanId = (typeof plans)[number]["id"];
const planBenefits = [
  ["Unlimited rituals", "Build as many rituals as your days need."],
  ["Full progress history", "Weekly and monthly reports, kept forever."],
  ["Every mood & photo memory", "Look back on how each day actually felt."],
  ["Gentle reminders", "Soft nudges for every ritual you keep."],
];
const DEFAULT_USERNAME = "Dummy Name";
const DEFAULT_EMAIL = "dummy@gmail.com";
const monthlyPrice = plans[0].price;
function rupiah(value: number) {
  return `Rp${Math.round(value).toLocaleString("id-ID")}`;
}
function planSavings(plan: (typeof plans)[number]) {
  return Math.round((1 - plan.price / (monthlyPrice * plan.months)) * 100);
}
function addMonths(dateKey: string, months: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1 + months, day);
}
function formatPlanDate(date: Date, locale: string) {
  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
function ordinalDay(day: number) {
  const lastTwoDigits = day % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) return `${day}th`;
  if (day % 10 === 1) return `${day}st`;
  if (day % 10 === 2) return `${day}nd`;
  if (day % 10 === 3) return `${day}rd`;
  return `${day}th`;
}
function formatToday(date: Date, locale: string) {
  const weekday = date.toLocaleDateString(locale, { weekday: "long" });
  const month = date.toLocaleDateString(locale, { month: "long" });
  const day =
    locale === "en-US" ? ordinalDay(date.getDate()) : String(date.getDate());
  return `${weekday}, ${day} ${month} ${date.getFullYear()}`;
}
function formatDailyDate(date: Date, locale: string) {
  return date.toLocaleDateString(locale, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}
function Flower({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  return (
    <img
      draggable={false}
      src={`/images/${name}.webp`}
      alt=""
      aria-hidden="true"
      className={className}
    />
  );
}
function GoogleLogo() {
  return (
    <svg className="google-logo" aria-hidden="true" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09A6.61 6.61 0 0 1 5.49 12c0-.72.12-1.42.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.93l3.66-2.84Z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.55 10.55 0 0 0 12 1a11 11 0 0 0-9.82 6.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}
function Button({
  children,
  onClick,
  type = "button",
  className = "",
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
  disabled?: boolean;
}) {
  return (
    <motion.button
      type={type}
      className={`primary ${className}`}
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.button>
  );
}
function Dot({ checked, tick = false }: { checked: boolean; tick?: boolean }) {
  return (
    <motion.span
      className={`dot ${checked ? "checked" : ""}`}
      animate={{ scale: checked ? [1, 0.88, 1] : 1 }}
      transition={{ duration: 0.25 }}
    >
      {checked && tick && <Check size={12} strokeWidth={3} />}
    </motion.span>
  );
}
function Bar({ value }: { value: number }) {
  const t = useT();
  return (
    <div
      className="progress-track"
      role="progressbar"
      aria-label={t("Completion")}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1.1, ease: easing }}
      />
    </div>
  );
}
function Ring({ value }: { value: number }) {
  const t = useT();
  const reduced = useReducedMotion();
  return (
    <div className="ring-wrap">
      <div
        className="ring"
        role="progressbar"
        aria-label={t("Daily completion")}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <svg viewBox="0 0 140 140">
          <circle className="ring-track" cx="70" cy="70" r="61" />
          <motion.circle
            className="ring-fill"
            cx="70"
            cy="70"
            r="61"
            initial={{
              pathLength: reduced ? value / 100 : 0,
              rotate: reduced ? 0 : -90,
            }}
            animate={{ pathLength: value / 100, rotate: 0 }}
            transition={{ duration: reduced ? 0 : 1.4, ease: easing }}
          />
        </svg>
        <div>
          <strong>{value}%</strong>
          <span>{t("DONE")}</span>
        </div>
      </div>
      <p>{t(value === 100 ? "Beautifully done!" : "Good day!")}</p>
    </div>
  );
}
type DropdownOption = { value: string; label: string; disabled?: boolean };
type DropdownBox = { top: number; left: number; width: number; height: number };
function Dropdown({
  value,
  options,
  onChange,
  label,
  chevron = false,
  menuAlign = "start",
}: {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  label: string;
  chevron?: boolean;
  menuAlign?: "start" | "end";
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState<DropdownBox | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const current = options.find((option) => option.value === value);
  const place = useCallback(() => {
    const anchor = trigger.current?.getBoundingClientRect();
    if (!anchor) return;
    const width = Math.min(Math.max(anchor.width, 176), window.innerWidth - 16);
    const below = window.innerHeight - anchor.bottom - 12,
      above = anchor.top - 12,
      wanted = Math.min(options.length * 57 + 2, 322),
      flip = below < wanted && above > below,
      height = Math.max(114, Math.min(wanted, flip ? above : below));
    setBox({
      top: flip ? anchor.top - 6 - height : anchor.bottom + 6,
      left: Math.min(
        Math.max(8, menuAlign === "end" ? anchor.right - width : anchor.left),
        window.innerWidth - width - 8,
      ),
      width,
      height,
    });
  }, [menuAlign, options.length]);
  useEffect(() => {
    if (!open) return;
    const items = () =>
      Array.from(
        menu.current?.querySelectorAll<HTMLButtonElement>(
          ".dd-option:not(:disabled)",
        ) ?? [],
      );
    const initial = items();
    (
      initial.find((item) => item.dataset.value === value) ?? initial[0]
    )?.focus();
    const away = (event: Event) => {
      const target = event.target as Node;
      if (menu.current?.contains(target) || trigger.current?.contains(target))
        return;
      setOpen(false);
    };
    const key = (event: KeyboardEvent) => {
      if (
        !["Escape", "ArrowDown", "ArrowUp", "Home", "End", "Tab"].includes(
          event.key,
        )
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      const list = items(),
        index = list.indexOf(document.activeElement as HTMLButtonElement);
      if (event.key === "ArrowDown") list[(index + 1) % list.length]?.focus();
      else if (event.key === "ArrowUp")
        list[(index - 1 + list.length) % list.length]?.focus();
      else if (event.key === "Home") list[0]?.focus();
      else if (event.key === "End") list[list.length - 1]?.focus();
      else {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", away, true);
    document.addEventListener("keydown", key, true);
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      document.removeEventListener("pointerdown", away, true);
      document.removeEventListener("keydown", key, true);
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, place, value]);
  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="dd-trigger"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          if (open) {
            setOpen(false);
            return;
          }
          place();
          setOpen(true);
        }}
      >
        <span className="dd-label">{current ? t(current.label) : ""}</span>
        {chevron && <ChevronDown size={14} aria-hidden="true" />}
      </button>
      {open && box
        ? createPortal(
            <motion.div
              ref={menu}
              role="listbox"
              aria-label={label}
              className="dd-menu"
              style={{
                top: box.top,
                left: box.left,
                width: box.width,
                maxHeight: box.height,
              }}
              initial={
                reduced ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: -6 }
              }
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: reduced ? 0 : 0.18, ease: easing }}
            >
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  data-value={option.value}
                  aria-selected={!option.disabled && option.value === value}
                  disabled={option.disabled}
                  className="dd-option"
                  onClick={() => {
                    setOpen(false);
                    trigger.current?.focus();
                    if (option.value !== value) onChange(option.value);
                  }}
                >
                  <span>{t(option.label)}</span>
                  {option.value === value && !option.disabled && (
                    <Check size={19} aria-hidden="true" />
                  )}
                </button>
              ))}
            </motion.div>,
            document.body,
          )
        : null}
    </>
  );
}
function brand(text: ReactNode): ReactNode {
  if (typeof text !== "string") return text;
  return text
    .split(/(odette)/gi)
    .map((part, index) =>
      part.toLowerCase() === "odette" ? (
        <span key={index} className="odette-mark">
          {part}
        </span>
      ) : (
        part
      ),
    );
}
function Dialog({
  children,
  title,
  onClose,
}: {
  children: ReactNode;
  title: string;
  onClose: () => void;
}) {
  const t = useT();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const nodes = () =>
      ref.current?.querySelectorAll<HTMLElement>("button,input,select,a[href]");
    nodes()?.[0]?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const els = nodes();
        if (!els?.length) return;
        if (e.shiftKey && document.activeElement === els[0]) {
          e.preventDefault();
          els[els.length - 1].focus();
        } else if (
          !e.shiftKey &&
          document.activeElement === els[els.length - 1]
        ) {
          e.preventDefault();
          els[0].focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div className="modal-layer">
      <motion.button
        aria-label={t("Close dialog")}
        tabIndex={-1}
        className="scrim"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="sheet"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ duration: 0.5, ease: easing }}
      >
        <span className="sheet-handle" aria-hidden="true" />
        <header>
          <button
            aria-label={t("Close dialog")}
            onClick={onClose}
            className="circle-button"
          >
            <X size={16} />
          </button>
          <h2>{brand(title)}</h2>
        </header>
        {children}
      </motion.div>
    </div>
  );
}
export default function Home() {
  const [screen, setScreen] = useState<Screen>("welcome"),
    [nickname, setNickname] = useState(""),
    [nicknameEmoji, setNicknameEmoji] = useState("🌸"),
    [emojiPickerOpen, setEmojiPickerOpen] = useState(false),
    [focus, setFocus] = useState<string[]>([]),
    [selected, setSelected] = useState<string[]>([]),
    [habits, setHabits] = useState<Habit[]>([]),
    [edited, setEdited] = useState(false),
    [activityHistory, setActivityHistory] = useState<ActivityHistory>({}),
    [habitsDateKey, setHabitsDateKey] = useState(""),
    [loaded, setLoaded] = useState(false),
    [menu, setMenu] = useState(false),
    [modal, setModal] = useState<Modal>(null),
    [progressTab, setProgressTab] = useState<ProgressTab>("habits"),
    [progressPeriod, setProgressPeriod] =
      useState<ProgressPeriod>("monthly"),
    [progressView, setProgressView] = useState<ProgressView>("calendar"),
    [month, setMonth] = useState(5),
    [year, setYear] = useState(2020),
    [today, setToday] = useState<Date | null>(null),
    [detailDate, setDetailDate] = useState("Tuesday, Sep 1"),
    [detailDateKey, setDetailDateKey] = useState(""),
    [toast, setToast] = useState(""),
    [draft, setDraft] = useState<Habit[]>([]),
    [draftDateKey, setDraftDateKey] = useState(""),
    [editingRoutine, setEditingRoutine] = useState<Routine>("Morning"),
    [editingRitual, setEditingRitual] = useState(""),
    [editingActivityId, setEditingActivityId] = useState<string | null>(null),
    [ritualName, setRitualName] = useState(""),
    [ritualCategory, setRitualCategory] = useState("Wellness"),
    [ritualFrequency, setRitualFrequency] = useState("Every day"),
    [ritualTime, setRitualTime] = useState("Morning"),
    [ritualActivities, setRitualActivities] = useState<Habit[]>([]),
    [newActivity, setNewActivity] = useState(""),
    [activityName, setActivityName] = useState(""),
    [activityCategory, setActivityCategory] = useState(""),
    [activityRitual, setActivityRitual] = useState(""),
    [username, setUsername] = useState(DEFAULT_USERNAME),
    [email, setEmail] = useState(DEFAULT_EMAIL),
    [profilePhoto, setProfilePhoto] = useState(""),
    [language, setLanguage] = useState<Language>("English"),
    [planId, setPlanId] = useState<PlanId | null>(null),
    [planStarted, setPlanStarted] = useState(""),
    [planChoice, setPlanChoice] = useState<PlanId>("halfYear"),
    [authFirstName, setAuthFirstName] = useState(""),
    [authLastName, setAuthLastName] = useState(""),
    [authEmail, setAuthEmail] = useState(""),
    [profileDraft, setProfileDraft] = useState({
      username: DEFAULT_USERNAME,
      email: DEFAULT_EMAIL,
    });
  const t = useMemo(() => makeTranslator(language), [language]);
  const locale = localeOf(language);
  const menuRef = useRef<HTMLDivElement>(null),
    menuButton = useRef<HTMLButtonElement>(null),
    uploadInput = useRef<HTMLInputElement>(null),
    cameraInput = useRef<HTMLInputElement>(null);
  useOdetteTools(habits, edited, setHabits, setEdited);
  const closeModal = useCallback(() => setModal(null), []);
  const todayKey = today ? localDateKey(today) : "";
  function go(next: Screen, dateKey?: string) {
    if (next === "progress") {
      setProgressView("calendar");
      setProgressTab("habits");
    }
    setScreen(next);
    setMenu(false);
    window.history.pushState({}, "", `?screen=${next}${dateKey ? `&date=${dateKey}` : ""}`);
    window.scrollTo(0, 0);
  }
  function applyAuthIdentity(isSignup: boolean) {
    const typedName = `${authFirstName.trim()} ${authLastName.trim()}`.trim();
    const typedEmail = authEmail.trim();
    const fromEmail = typedEmail.split("@")[0]?.trim() || "";
    const sameAccount =
      !typedEmail || typedEmail.toLowerCase() === email.toLowerCase();
    const keptName =
      sameAccount && username !== DEFAULT_USERNAME ? username : "";
    const nextName =
      (isSignup ? typedName : "") || keptName || fromEmail || username;
    const nextEmail = typedEmail || email;
    setUsername(nextName);
    setEmail(nextEmail);
    setProfileDraft({ username: nextName, email: nextEmail });
  }
  useEffect(() => {
    const now = new Date();
    setMonth(now.getMonth());
    setYear(now.getFullYear());
  }, []);
  useEffect(() => {
    const updateToday = () => setToday(new Date());
    updateToday();
    const timer = window.setInterval(updateToday, 60_000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    const readScreen = () => {
      const params = new URLSearchParams(window.location.search);
      const v = params.get("screen");
      const date = params.get("date");
      setDetailDateKey(date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "");
      setScreen(screens.includes(v as Screen) ? (v as Screen) : "welcome");
      const period = params.get("period");
      const tab = params.get("tab");
      if (tab === "habits" || tab === "rituals") setProgressTab(tab);
      if (v === "progress" && (period === "weekly" || period === "monthly")) {
        setProgressPeriod(period);
        setProgressView("report");
      } else {
        setProgressView("calendar");
      }
    };
    readScreen();
    setHabitsDateKey(localDateKey(new Date()));
    window.addEventListener("popstate", readScreen);
    try {
      const s = JSON.parse(localStorage.getItem("odette-local-v1") || "null");
      if (s) {
        if (typeof s.habitsDateKey === "string")
          setHabitsDateKey(s.habitsDateKey);
        if (s.activityHistory && typeof s.activityHistory === "object")
          setActivityHistory(Object.fromEntries(
            Object.entries(s.activityHistory).filter(([date, entries]) =>
              /^\d{4}-\d{2}-\d{2}$/.test(date) &&
              Array.isArray(entries) && entries.every(isHabit),
            ),
          ) as ActivityHistory);
        if (typeof s.nickname === "string") setNickname(s.nickname);
        if (typeof s.nicknameEmoji === "string")
          setNicknameEmoji(s.nicknameEmoji);
        if (Array.isArray(s.habits) && s.habits.every(isHabit))
          setHabits(
            s.habits.map((habit: Habit) =>
              typeof habit.ritualName === "undefined"
                ? { ...habit, ritualName: habit.routine }
                : habit,
            ),
          );
        if (typeof s.edited === "boolean") setEdited(s.edited);
        if (Array.isArray(s.focus))
          setFocus(s.focus.filter((v: unknown) => typeof v === "string"));
        if (typeof s.username === "string") setUsername(s.username);
        if (typeof s.email === "string") setEmail(s.email);
        if (typeof s.profilePhoto === "string") setProfilePhoto(s.profilePhoto);
        if (s.language === "English" || s.language === "Indonesia")
          setLanguage(s.language);
        if (plans.some((plan) => plan.id === s.planId)) {
          setPlanId(s.planId);
          setPlanChoice(s.planId);
        }
        if (typeof s.planStarted === "string") setPlanStarted(s.planStarted);
      }
    } catch {}
    setLoaded(true);
    return () => window.removeEventListener("popstate", readScreen);
  }, []);
  useEffect(() => {
    if (loaded)
      try {
        localStorage.setItem(
          "odette-local-v1",
          JSON.stringify({
            nickname,
            nicknameEmoji,
            focus,
            habits,
            edited,
            activityHistory,
            habitsDateKey,
            username,
            email,
            profilePhoto,
            language,
            planId,
            planStarted,
          }),
        );
      } catch {
        setToast(t("This browser could not save changes. Keep this tab open."));
      }
  }, [
    nickname,
    nicknameEmoji,
    focus,
    habits,
    edited,
    activityHistory,
    habitsDateKey,
    username,
    email,
    profilePhoto,
    language,
    planId,
    planStarted,
    loaded,
  ]);
  useEffect(() => {
    if (!loaded || !todayKey || !habitsDateKey) return;
    if (edited) {
      setActivityHistory((history) => ({
        ...history,
        [habitsDateKey]: habits
          .filter((habit) => isScheduledForDate(habit, habitsDateKey))
          .map((habit) => ({ ...habit })),
      }));
    }
    if (habitsDateKey !== todayKey) {
      setHabits((items) => items.map((habit) => ({ ...habit, done: false })));
      setEdited(false);
      setHabitsDateKey(todayKey);
    }
  }, [loaded, todayKey, habitsDateKey, habits, edited]);
  useEffect(() => {
    if (screen !== "daily") return;
    const dateKey = detailDateKey || todayKey;
    if (!dateKey) return;
    setDraft(
      habits
        .filter((habit) => isScheduledForDate(habit, dateKey))
        .map((habit) => ({ ...habit })),
    );
    setDraftDateKey(dateKey);
  }, [screen, detailDateKey, todayKey, loaded, habitsDateKey]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 1200);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    if (!menu) return;
    menuRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(false);
        menuButton.current?.focus();
      }
      if (e.key === "Tab") {
        const items =
          menuRef.current?.querySelectorAll<HTMLButtonElement>("button");
        if (!items?.length) return;
        const first = items[0],
          last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          menuButton.current?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          menuButton.current?.focus();
        } else if (document.activeElement === menuButton.current) {
          e.preventDefault();
          (e.shiftKey ? last : first).focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [menu]);
  const todayHabits = todayKey
      ? habits.filter((habit) => isScheduledForDate(habit, todayKey))
      : habits,
    isHistoricalDay = Boolean(detailDateKey && detailDateKey !== todayKey),
    dailyHabits = detailDateKey > todayKey
      ? habits
          .filter((habit) => habit.ritualName?.trim() && isScheduledForDate(habit, detailDateKey))
          .map((habit) => ({ ...habit, done: false }))
      : isHistoricalDay
        ? habitsForDay(detailDateKey, todayKey, habits, activityHistory)
      : draftDateKey === todayKey ? draft : todayHabits,
    percent = todayHabits.length ? completion(todayHabits, edited) : 0,
    dailyPercent = completion(dailyHabits, true),
    appShell = [
      "today",
      "daily",
      "progress",
      "calendar",
      "rituals",
      "profile",
      "subscription",
      "help",
    ].includes(screen);
  const activePlan = plans.find((plan) => plan.id === planId) ?? null,
    chosenPlan = plans.find((plan) => plan.id === planChoice) ?? plans[1],
    renewsOn =
      activePlan && planStarted
        ? formatPlanDate(addMonths(planStarted, activePlan.months), locale)
        : "";
  const startPlan = (next: PlanId) => {
    const plan = plans.find((item) => item.id === next);
    if (!plan) return;
    setPlanId(next);
    setPlanStarted(localDateKey(today ?? new Date()));
    setModal(null);
    setToast(
      t("Odette Plus {name} is active. Enjoy your softer days.", {
        name: t(plan.name),
      }),
    );
  };
  const getRitualName = (habit: Habit) => habit.ritualName?.trim() || "";
  const dailyStandaloneHabits = dailyHabits.filter((habit) => !getRitualName(habit));
  const dailyRitualGroups = ritualGroupsForDate(dailyHabits, detailDateKey || todayKey);
  const renderDailyHabit = (habit: Habit) => (
    <div className="daily-habit" key={habit.id}>
      <button
        className="daily-habit-toggle"
        disabled={isHistoricalDay}
        onClick={() => setDraft((items) => toggleHabit(items, habit.id))}
        aria-label={`${habit.done ? "Uncheck" : "Complete"} ${habit.name}`}
        aria-pressed={habit.done}
      >
        <Dot tick checked={habit.done} />
      </button>
      <button
        className="daily-habit-edit"
        disabled={isHistoricalDay}
        onClick={() => openActivityEditor(habit)}
        aria-label={`Edit ${habit.name}`}
      >
        <span>{habit.name}</span>
        {!isHistoricalDay && <Pencil size={14} aria-hidden="true" />}
      </button>
    </div>
  );
  const ritualGroups = Array.from(
    todayHabits.reduce((groups, habit) => {
      const name = getRitualName(habit);
      if (!name) return groups;
      const activities = groups.get(name) || [];
      activities.push(habit);
      groups.set(name, activities);
      return groups;
    }, new Map<string, Habit[]>()),
  ).map(([name, activities]) => ({ name, activities }));
  const allRitualGroups = Array.from(
    habits.reduce((groups, habit) => {
      const name = getRitualName(habit);
      if (!name) return groups;
      const activities = groups.get(name) || [];
      activities.push(habit);
      groups.set(name, activities);
      return groups;
    }, new Map<string, Habit[]>()),
  ).map(([name, activities]) => ({ name, activities }));
  const ritualOptions = ritualGroups.map(({ name, activities }) => ({
    name,
    routine: activities[0].routine,
    frequency: activities[0].frequency,
    time: activities[0].time,
  }));
  const toggle = (id: string) => {
    const next = toggleHabit(habits, id);
    setHabits(next);
    setEdited(true);
    if (next.length > 0 && next.every((habit) => habit.done)) {
      setModal("done");
    }
  };
  const pick = (v: string, items: string[], set: (v: string[]) => void) =>
    set(items.includes(v) ? items.filter((x) => x !== v) : [...items, v]);
  const openAddRitual = () => {
    setEditingRoutine("Morning");
    setRitualName("");
    setRitualCategory("Wellness");
    setRitualFrequency("Every day");
    setRitualTime("Morning");
    setRitualActivities([]);
    setNewActivity("");
    setModal("addRitual");
  };
  const openAddActivity = () => {
    setEditingActivityId(null);
    setActivityName("");
    setActivityCategory("");
    setActivityRitual("");
    setModal("addActivity");
  };
  const openActivityEditor = (habit: Habit) => {
    setEditingActivityId(habit.id);
    setActivityName(habit.name);
    setActivityCategory(habit.category);
    setActivityRitual(getRitualName(habit));
    setModal("editActivity");
  };
  const openRitualEditor = (name: string) => {
    const activities = habits.filter((habit) => getRitualName(habit) === name);
    const routine = activities[0]?.routine || "Morning";
    setEditingRoutine(routine);
    setEditingRitual(name);
    setRitualName(name);
    setRitualCategory(activities[0]?.category || "Wellness");
    setRitualFrequency(activities[0]?.frequency || "Every day");
    setRitualTime(
      ["Morning", "Afternoon", "Evening", "Night"].includes(
        activities[0]?.time,
      )
        ? activities[0].time
        : routine,
    );
    setRitualActivities(activities.map((habit) => ({ ...habit })));
    setNewActivity("");
    setModal("editRitual");
  };
  const chooseProfilePhoto = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setToast(t("Please choose an image file."));
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setToast(t("Please choose a photo smaller than 3 MB."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      setProfilePhoto(reader.result);
      setModal(null);
      setToast(t("Profile photo updated."));
    };
    reader.onerror = () => setToast(t("That photo could not be opened."));
    reader.readAsDataURL(file);
  };
  const addDraftActivity = () => {
    const name = newActivity.trim();
    if (!name) return;
    setRitualActivities((activities) => [
      ...activities,
      {
        id: crypto.randomUUID(),
        name,
        ritualName: ritualName.trim(),
        routine: editingRoutine,
        done: false,
        category: ritualCategory,
        frequency: ritualFrequency,
        time: ritualTime,
      },
    ]);
    setNewActivity("");
  };
  const shiftMonth = (n: number) => {
    const d = new Date(year, month + n, 1);
    setMonth(d.getMonth());
    setYear(d.getFullYear());
  };
  const openProgressReport = (period: ProgressPeriod) => {
    const reportTab = progressView === "report" ? progressTab : "habits";
    setProgressPeriod(period);
    setProgressTab(reportTab);
    setProgressView("report");
    window.history.pushState(
      {},
      "",
      `?screen=progress&period=${period}${
        reportTab === "rituals" ? "&tab=rituals" : ""
      }`,
    );
    window.scrollTo(0, 0);
  };
  const openProgressTab = (tab: ProgressTab) => {
    setProgressTab(tab);
    window.history.pushState(
      {},
      "",
      `?screen=progress&period=${progressPeriod}${
        tab === "rituals" ? "&tab=rituals" : ""
      }`,
    );
  };
  const detailHeadingKey = detailDateKey || todayKey;
  const detailHeading = detailHeadingKey
    ? formatDailyDate(new Date(`${detailHeadingKey}T00:00:00`), locale)
    : detailDate;
  const ritualPeriodDays = progressPeriod === "weekly" ? 7 : 30;
  const categoryRanking = categoryConsistency(
    habits,
    activityHistory,
    todayKey,
    ritualPeriodDays,
  );
  const topCategory = categoryRanking[0];
  const ritualSummaries = allRitualGroups.map(({ name, activities }) => {
    const doneCount = activities.filter((activity) => activity.done).length;
    const value = activities.length
      ? Math.round((doneCount / activities.length) * 100)
      : 0;
    return {
      title: name,
      value,
      days: t("{done} / {total} days", {
        done: Math.round((value / 100) * ritualPeriodDays),
        total: ritualPeriodDays,
      }),
    };
  });
  const ritualAverage = ritualSummaries.length
    ? Math.round(
        ritualSummaries.reduce((sum, summary) => sum + summary.value, 0) /
          ritualSummaries.length,
      )
    : 0;
  const ritualBest = ritualSummaries.reduce(
    (best, summary) => Math.max(best, summary.value),
    0,
  );
  const progressReport =
    progressPeriod === "weekly"
      ? {
          overall: edited ? percent : 78,
          currentStreak: edited ? (habits.some((h) => h.done) ? 1 : 0) : 6,
          longestStreak: edited ? (habits.some((h) => h.done) ? 1 : 0) : 7,
          most: 86,
          least: 43,
          periodLabel: "This Week",
          average: ritualAverage,
          bestLabel: "Best day",
          best: ritualBest,
        }
      : {
          overall: percent,
          currentStreak: edited ? (habits.some((h) => h.done) ? 1 : 0) : 12,
          longestStreak: edited ? (habits.some((h) => h.done) ? 1 : 0) : 12,
          most: 82,
          least: 32,
          periodLabel: "This Month",
          average: ritualAverage,
          bestLabel: "Best week",
          best: ritualBest,
        };
  const progressMonth = new Date(year, month, 1).toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });
  const progressRangeTitle =
    progressPeriod === "weekly"
      ? `${new Date(year, month, 1).toLocaleDateString(locale, {
          month: "long",
        })} ${year}`
      : progressMonth;
  const progressRangeSub =
    progressPeriod === "weekly"
      ? `${t("Week")} 1 (1-7)`
      : `(1-${new Date(year, month + 1, 0).getDate()})`;
  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ duration: 0.45, ease: easing }}
    >
      <I18nContext.Provider value={t}>
      <main className={`app screen-${screen}`}>
        {appShell && (
          <>
            <Flower name="lotus-leaf-stem" className="today-flower" />
            <nav className="topbar" aria-label={t("Page navigation")}>
              {screen !== "today" ? (
                <button
                  aria-label={t(
                    screen === "progress" && progressView === "report"
                      ? "Back to Progress calendar"
                      : "Back to Today",
                  )}
                  className="back-button"
                  onClick={() => {
                    if (screen === "progress" && progressView === "report") {
                      setProgressView("calendar");
                      setProgressTab("habits");
                      window.history.pushState({}, "", "?screen=progress");
                      window.scrollTo(0, 0);
                    } else {
                      go("today");
                    }
                  }}
                >
                  <ChevronLeft size={22} />
                </button>
              ) : (
                <span />
              )}
              <motion.button
                ref={menuButton}
                className={`hamburger ${menu ? "is-open" : ""}`}
                aria-label={menu ? "Close menu" : "Open menu"}
                aria-expanded={menu}
                aria-controls="main-menu"
                onClick={() => setMenu((v) => !v)}
              >
                <motion.span
                  animate={{ y: menu ? 4 : 0, rotate: menu ? 45 : 0 }}
                />
                <motion.span
                  animate={{ y: menu ? -4 : 0, rotate: menu ? -45 : 0 }}
                />
              </motion.button>
            </nav>
          </>
        )}
        {screen === "welcome" && (
          <section className="welcome">
            <h1 className="wordmark">Odette</h1>
            <p className="motto">
              {language === "Indonesia" ? (
                <>
                  rutinitas kecil,
                  <br />
                  hari yang <span>tenang</span>
                </>
              ) : (
                <>
                  small routines,
                  <br />
                  <span>softer</span> days
                </>
              )}
            </p>
            <div className="welcome-actions">
              <div className="welcome-cta">
                <div className="welcome-plant">
                  <Flower name="12" className="welcome-complete" />
                </div>
                <Button onClick={() => go("signup")}>{t("Get started")}</Button>
              </div>
              <p>
                {t("Already have an account?")}{" "}
                <button onClick={() => go("login")}>{t("Log in")}</button>
              </p>
            </div>
          </section>
        )}
        {(screen === "signup" || screen === "login") && (
          <section className={`auth ${screen}`}>
            <button
              className="back-button auth-back"
              aria-label={t("Back to welcome")}
              onClick={() => go("welcome")}
            >
              <ChevronLeft size={22} />
            </button>
            <Flower name="lotus-bud" className="auth-bud" />
            <h1>{t(screen === "signup" ? "Create an account" : "Log in")}</h1>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                applyAuthIdentity(screen === "signup");
                go(screen === "signup" ? "name" : "today");
              }}
            >
              {screen === "signup" && (
                <>
                  <input
                    aria-label={t("First name")}
                    placeholder={t("First name")}
                    autoComplete="given-name"
                    required
                    value={authFirstName}
                    onChange={(e) => {
                      setAuthFirstName(e.target.value);
                      setNickname(e.target.value);
                    }}
                  />
                  <input
                    aria-label={t("Last name")}
                    placeholder={t("Last name")}
                    autoComplete="family-name"
                    required
                    value={authLastName}
                    onChange={(e) => setAuthLastName(e.target.value)}
                  />
                </>
              )}
              <input
                aria-label={t("Email")}
                placeholder={t("Email")}
                type="email"
                autoComplete="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
              />
              <input
                aria-label={t("Password")}
                placeholder={t("Password")}
                type="password"
                autoComplete={
                  screen === "signup" ? "new-password" : "current-password"
                }
                minLength={6}
                required
              />
              <div className="divider">
                <span />
                {t("Or")}
                <span />
              </div>
              <Button className="google" onClick={() => setModal("google")}>
                <GoogleLogo />
                {t("Continue with Google")}
              </Button>
              <Button type="submit" className="auth-submit">
                {t(screen === "signup" ? "Create account" : "Log in")}
              </Button>
              <p className="local-note">
                {t("Local preview · no account is created")}
              </p>
            </form>
          </section>
        )}
        {["name", "focus", "routine"].includes(screen) && (
          <section className={`onboarding onboarding-${screen}`}>
            <Flower
              name={
                screen === "name"
                  ? "lotus-bud-stem"
                  : screen === "focus"
                    ? "lotus-bloom-stem"
                    : "lotus-leaf-stem"
              }
              className="onboard-flower"
            />
            <p className="step">
              {t("Step {n} of 3", {
                n: screen === "name" ? 1 : screen === "focus" ? 2 : 3,
              })}
            </p>
            <h1>
              {lines(
                t(
                  screen === "name"
                    ? "What do you want to\nbe called?"
                    : screen === "focus"
                      ? "What would you like\nto focus on?"
                      : "Let’s build your first\nroutine!",
                ),
              )}
            </h1>
            {screen === "name" ? (
              <form
                className="name-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  go("focus");
                }}
              >
                <div className="nickname-picker">
                  <div className="nickname-field">
                    <input
                      aria-label={t("Nick name")}
                      aria-describedby="nickname-emoji-preview"
                      placeholder={t("Nick name")}
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      maxLength={30}
                      required
                    />
                    <button
                      type="button"
                      className="emoji-trigger"
                      aria-label={t("Choose profile emoji")}
                      aria-expanded={emojiPickerOpen}
                      onClick={() => setEmojiPickerOpen((open) => !open)}
                    >
                      {nicknameEmoji || <Smile size={19} strokeWidth={1.7} />}
                    </button>
                  </div>
                  <AnimatePresence>
                    {emojiPickerOpen && (
                      <motion.div
                        className="emoji-picker"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        role="listbox"
                        aria-label={t("Profile emoji")}
                      >
                        {emojiOptions.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            role="option"
                            aria-label={t("Choose {emoji}", { emoji })}
                            aria-selected={nicknameEmoji === emoji}
                            className={nicknameEmoji === emoji ? "is-selected" : ""}
                            onClick={() => {
                              setNicknameEmoji(emoji);
                              setEmojiPickerOpen(false);
                            }}
                          >
                            {emoji}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <p id="nickname-emoji-preview" className="nickname-preview">
                    {nickname || t("Your nickname")} {nicknameEmoji}
                  </p>
                </div>
                <Button type="submit" className="onboard-continue">
                  {t("Continue")}
                </Button>
              </form>
            ) : (
              <>
                <p className="onboard-subtitle">
                  {screen === "focus"
                    ? t("choose as many as you like")
                    : lines(
                        t(
                          "here are some general daily\nactivities for you to accomplish",
                        ),
                      )}
                </p>
                <div
                  className={
                    screen === "focus" ? "focus-options" : "routine-options"
                  }
                >
                  {(screen === "focus" ? focusOptions : routineOptions).map(
                    (item) => (
                      <button
                        key={item}
                        className="option"
                        aria-pressed={(screen === "focus"
                          ? focus
                          : selected
                        ).includes(item)}
                        onClick={() =>
                          screen === "focus"
                            ? pick(item, focus, setFocus)
                            : pick(item, selected, setSelected)
                        }
                      >
                        <span>{t(item)}</span>
                        <Dot
                          tick
                          checked={(screen === "focus"
                            ? focus
                            : selected
                          ).includes(item)}
                        />
                      </button>
                    ),
                  )}
                </div>
                <Button
                  className="onboard-continue"
                  onClick={() => {
                    if (screen === "focus") go("routine");
                    else go("ready");
                  }}
                >
                  {t("Continue")}
                </Button>
              </>
            )}
          </section>
        )}
        {screen === "ready" && (
          <section className="ready">
            <h1>{t("You’re all set!")}</h1>
            <p>
              {lines(
                t("small steps, big changes\nwe’re excited to have you here"),
              )}
            </p>
            <Flower name="lotus-bouquet" className="ready-bouquet" />
            <Button
              onClick={() => {
                const names: Record<string, string> = {
                  "Drink Water": "water",
                  Skincare: "skincare",
                  Exercise: "exercise",
                  Journal: "journal",
                  Read: "read",
                  "Pray/Meditate": "meditate",
                  "Sleep before 11 PM": "sleep",
                };
                setHabits(
                  seedHabits
                    .filter((h) => selected.some((s) => names[s] === h.id))
                    .map((h) => ({ ...h, done: false })),
                );
                setEdited(true);
                go("today");
              }}
            >
              {t("Go to my day")}
            </Button>
          </section>
        )}
        {screen === "today" && (
          <section className="today-home content">
            <header className="greeting">
              <h1>
                {t("Good morning,")}
                <br />
                {nickname || "karin"} {nicknameEmoji}
              </h1>
              <p>{today ? formatToday(today, locale) : "\u00a0"}</p>
            </header>
            <button
              className="card today-card"
              onClick={() => {
                setDetailDate(formatDailyDate(today ?? new Date(), locale));
                setDetailDateKey(localDateKey(today ?? new Date()));
                go("daily", localDateKey(today ?? new Date()));
              }}
            >
              <span className="card-label">{t("Today’s progress")}</span>
              <div className="today-value">
                <strong>{percent}%</strong>
                <Flower name="lotus-bloom" />
              </div>
              <Bar value={percent} />
              <div className="streak">
                <span>{t("Current Streak")}</span>
                <p>
                  <strong>
                    {habits.length === 0 ? 0 : edited ? (habits.some((h) => h.done) ? 1 : 0) : 12}
                  </strong>{" "}
                  {t("days")}
                </p>
              </div>
              <span className="see-detail">
                {t("See detail")} <ChevronRight size={13} />
              </span>
            </button>
            <button
              className="card today-ritual-preview"
              onClick={() => go("rituals")}
            >
              <div className="today-ritual-heading">
                <span>
                  <small>{t("Rituals for today")}</small>
                  <h2>
                    {t(
                      ritualGroups.length === 1
                        ? "{count} ritual planned"
                        : "{count} rituals planned",
                      { count: ritualGroups.length },
                    )}
                  </h2>
                </span>
                <ChevronRight size={18} aria-hidden="true" />
              </div>
              {ritualGroups.length ? (
                <div className="today-ritual-list">
                  {ritualGroups.slice(0, 3).map(({ name, activities }) => (
                    <span className="today-ritual-row" key={name}>
                      <strong>{t(name)}</strong>
                      <small>
                        {activities.filter((habit) => habit.done).length}/
                        {activities.length}
                      </small>
                    </span>
                  ))}
                  {ritualGroups.length > 3 && (
                    <span className="today-ritual-more">
                      {t("+{count} more", { count: ritualGroups.length - 3 })}
                    </span>
                  )}
                </div>
              ) : (
                <p>{t("No rituals are scheduled for today. Tap to create one.")}</p>
              )}
            </button>
            <motion.button
              className="add-fab"
              aria-label={t("Add activity")}
              onClick={openAddActivity}
              whileTap={{ scale: 0.92 }}
            >
              <Plus size={32} strokeWidth={1.2} />
            </motion.button>
          </section>
        )}
        {screen === "daily" && (
          <section className="daily content">
            <header className="detail-heading">
              <div>
                <h1>{detailHeading}</h1>
                <p>{t("Daily overview")}</p>
              </div>
            </header>
            {dailyHabits.length === 0 ? (
              <p className="empty-text" role="status">
                {t(isHistoricalDay ? "No activity recorded for this date." : "Log your activity")}
              </p>
            ) : <Ring value={dailyPercent} />}
            {dailyStandaloneHabits.length > 0 && [true, false].map((done) => (
              <div className="daily-group" key={String(done)}>
                <h2>{t(done ? "Completed" : "Missed")}</h2>
                {dailyStandaloneHabits
                  .filter((h) => h.done === done)
                  .map(renderDailyHabit)}
                {!dailyStandaloneHabits.some(
                  (h) => h.done === done,
                ) && (
                  <p className="empty-text">
                    {done
                      ? t("Your first small step is waiting.")
                      : t("Nothing missed. Lovely work!")}
                  </p>
                )}
              </div>
            ))}
            <section className="daily-group daily-rituals" aria-labelledby="daily-rituals-heading">
              <h2 id="daily-rituals-heading">{t("Rituals")}</h2>
              {dailyRitualGroups.length === 0 ? (
                <p className="empty-text">{t("No rituals are scheduled for this date.")}</p>
              ) : dailyRitualGroups.map(({ name, activities }) => (
                <article className="card daily-ritual-card" key={name}>
                  <h3>{t(name)}</h3>
                  <dl className="daily-ritual-schedule">
                    <div>
                      <dt>{t("Frequency")}</dt>
                      <dd>{t(activities[0].frequency)}</dd>
                    </div>
                    <div>
                      <dt>{t("Time Range")}</dt>
                      <dd>{t(activities[0].time)}</dd>
                    </div>
                  </dl>
                  <p className="daily-ritual-completion">
                    {t("{done}/{total} Completed", {
                      done: activities.filter((habit) => habit.done).length,
                      total: activities.length,
                    })}
                  </p>
                  {activities.map(renderDailyHabit)}
                </article>
              ))}
            </section>
            {!isHistoricalDay && dailyHabits.length > 0 && <Button
              className="pink-button edit-progress"
              onClick={() => {
                setHabits((items) => {
                  const updates = new Map(
                    dailyHabits.map((habit) => [habit.id, habit]),
                  );
                  return items.map((habit) => updates.get(habit.id) || habit);
                });
                setEdited(true);
                if (
                  dailyHabits.length > 0 &&
                  dailyHabits.every((habit) => habit.done)
                )
                  setModal("done");
                else setToast(t("Today’s progress has been saved."));
              }}
            >
              {t("Save")}
            </Button>}
          </section>
        )}
        {screen === "progress" && progressView === "report" && (
          <section className="progress-page content">
            <div className="progress-tabs" role="tablist" aria-label={t("Progress type")}>
              {(["habits", "rituals"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={progressTab === tab}
                  className={progressTab === tab ? "is-active" : ""}
                  onClick={() => openProgressTab(tab)}
                >
                  {t(tab === "habits" ? "Habits" : "Rituals")}
                </button>
              ))}
            </div>
            <div className="progress-report-heading">
              <div className="progress-range">
                <h1 className="progress-month">{progressRangeTitle}</h1>
                <span className="progress-range-sub">{progressRangeSub}</span>
              </div>
              <Dropdown
                label={t("Progress period")}
                chevron
                menuAlign="end"
                value={progressPeriod}
                options={periodOptions}
                onChange={(next) => openProgressReport(next as ProgressPeriod)}
              />
            </div>
            {progressTab === "habits" ? (
              <>
                <div className="stats-grid">
                  <article className="card overall">
                    <span>{t("Overall completion")}</span>
                    <strong>{progressReport.overall}%</strong>
                    <small>{t(progressReport.periodLabel)}</small>
                    <Flower name="lotus-blossoms" />
                  </article>
                  <article className="card mini-stat">
                    <span>{t("Current Streak")}</span>
                    <p>
                      <strong>
                        {progressReport.currentStreak}
                      </strong>{" "}
                      {t("days")}
                    </p>
                  </article>
                  <article className="card mini-stat">
                    <span>{t("Longest Streak")}</span>
                    <p>
                      <strong>
                        {progressReport.longestStreak}
                      </strong>{" "}
                      {t("days")}
                    </p>
                  </article>
                </div>
                {[
                  {
                    title: "Most consistent",
                    name: "Skincare",
                    value: progressReport.most,
                    icon: (
                      <Sparkles
                        aria-hidden="true"
                        size={17}
                        strokeWidth={1.8}
                      />
                    ),
                  },
                  {
                    title: "Least consistent",
                    name: "Journaling",
                    value: progressReport.least,
                    icon: (
                      <BookOpen
                        aria-hidden="true"
                        size={17}
                        strokeWidth={1.8}
                      />
                    ),
                  },
                ].map((s) => (
                  <article className="card consistency" key={s.title}>
                    <h2>{t(s.title)}</h2>
                    <div>
                      <span className="habit-icon">{s.icon}</span>
                      <p>
                        {t(s.name)}
                        <small>{s.value}%</small>
                      </p>
                      <span className="percentage-bubble">{s.value}%</span>
                    </div>
                  </article>
                ))}
                <div className="card insight">
                  <p>
                    {lines(
                      topCategory
                        ? t(
                            "You’re most consistent with\nyour {category} habits.",
                            {
                              category: t(topCategory.category).toLowerCase(),
                            },
                          )
                        : t("Your habits are still finding\ntheir rhythm."),
                    )}
                  </p>
                  <Flower name="lotus-blue-stem" />
                </div>
              </>
            ) : (
              <div className="ritual-progress-grid">
                {ritualSummaries.length === 0 && (
                  <article className="card ritual-summary-empty">
                    <p>
                      {t("Create a ritual to see how its rhythm settles over time.")}
                    </p>
                  </article>
                )}
                {ritualSummaries.map((summary) => (
                  <article className="card ritual-summary-card" key={summary.title}>
                    <div>
                      <h2>{t(summary.title)}</h2>
                      <strong>{summary.value}%</strong>
                    </div>
                    <div className="ritual-summary-meter">
                      <span>{t(progressReport.periodLabel)}</span>
                      <p>
                        <i aria-hidden="true" />
                        {summary.days}
                      </p>
                      <Bar value={summary.value} />
                    </div>
                  </article>
                ))}
                {ritualSummaries.length > 0 && (
                  <article className="card ritual-consistency-card">
                    <div className="ritual-consistency-heading">
                      <h2>{t("Rituals consistency")}</h2>
                      <span>{t("Trend")}</span>
                    </div>
                    <div className="ritual-consistency-values">
                      <p>
                        <small>{t("Average completion")}</small>
                        <strong>{progressReport.average}%</strong>
                      </p>
                      <p>
                        <small>{t(progressReport.bestLabel)}</small>
                        <strong>{progressReport.best}%</strong>
                      </p>
                    </div>
                    <p className="ritual-consistency-copy">
                      {t(
                        "You’re sticking to your rituals more often over time. Keep the rhythm going.",
                      )}
                    </p>
                  </article>
                )}
              </div>
            )}
          </section>
        )}
        {(screen === "calendar" ||
          (screen === "progress" && progressView === "calendar")) && (
          <section
            className={`${
              screen === "progress" ? "progress-calendar-page" : "calendar-page"
            } content`}
          >
            <header className="screen-title progress-calendar-heading">
              <h1>{t(screen === "progress" ? "Progress" : "Calendar")}</h1>
              {screen === "progress" && (
                <div className="progress-period-picker">
                  <Dropdown
                    label={t("View progress by period")}
                    value=""
                    options={viewByOptions}
                    onChange={(next) =>
                      openProgressReport(next as ProgressPeriod)
                    }
                  />
                  <ChevronDown size={15} aria-hidden="true" />
                </div>
              )}
            </header>
            <article className="card calendar-card">
              <div className="month-heading">
                <button
                  onClick={() => shiftMonth(-1)}
                  aria-label={t("Previous month")}
                >
                  <ChevronLeft size={16} />
                </button>
                <h2>
                  {new Date(year, month, 1).toLocaleDateString(locale, {
                    month: "long",
                    year: "numeric",
                  })}
                </h2>
                <button
                  onClick={() => shiftMonth(1)}
                  aria-label={t("Next month")}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="calendar-weekdays">
                {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(
                  (day) => (
                    <span key={day}>{t(day)}</span>
                  ),
                )}
              </div>
              <div className="calendar-days">
                {Array.from(
                  { length: new Date(year, month, 1).getDay() },
                  (_, i) => (
                    <span key={`blank-${i}`} />
                  ),
                )}
                {Array.from(
                  { length: new Date(year, month + 1, 0).getDate() },
                  (_, i) => (
                    <button
                      key={i}
                      className={
                        detailDateKey &&
                        localDateKey(new Date(year, month, i + 1)) ===
                          detailDateKey
                          ? "highlight"
                          : ""
                      }
                      onClick={() => {
                        const selectedDate = new Date(year, month, i + 1);
                        setDetailDate(
                          selectedDate.toLocaleDateString(
                            locale,
                            {
                              weekday: "long",
                              month: "short",
                              day: "numeric",
                            },
                          ),
                        );
                        setDetailDateKey(localDateKey(selectedDate));
                        go("daily", localDateKey(selectedDate));
                      }}
                      aria-label={`View ${new Date(year, month, i + 1).toLocaleDateString()}`}
                    >
                      {i + 1}
                    </button>
                  ),
                )}
              </div>
            </article>
            <article className="card month-progress">
              <h2>
                {t("{month} progress", {
                  month: new Date(year, month, 1).toLocaleDateString(locale, {
                    month: "long",
                  }),
                })}
              </h2>
              <strong>{percent}%</strong>
              <Bar value={percent} />
            </article>
          </section>
        )}
        {screen === "rituals" && (
          <section className="rituals content">
            <h1>{t("Rituals")}</h1>
            {ritualGroups.length === 0 && (
              <div className="rituals-empty">
                <p>{t("Create your first ritual")}</p>
              </div>
            )}
            {ritualGroups.map(({ name, activities }) => (
              <article className="card routine-card" key={name}>
                <button
                  className="routine-card-heading"
                  onClick={() => openRitualEditor(name)}
                  aria-label={t("Edit {name} ritual", { name })}
                >
                  <h2>{t(name)}</h2>
                  <p>
                    {t("{done}/{total} Completed", {
                      done: activities.filter((habit) => habit.done).length,
                      total: activities.length,
                    })}
                  </p>
                </button>
                <div className="routine-activities">
                  {activities.map((h) => (
                      <button
                        key={h.id}
                        className="routine-activity"
                        aria-pressed={h.done}
                        onClick={() => toggle(h.id)}
                      >
                        <span>
                          {t(
                            h.id === "water"
                              ? "Drink Water"
                              : h.id === "exercise"
                                ? "Exercise"
                                : h.id === "read"
                                  ? "Read"
                                  : h.name,
                          )}
                        </span>
                        <Dot checked={h.done} />
                      </button>
                    ))}
                </div>
              </article>
            ))}
            <motion.button
              className="add-fab"
              aria-label={t("Add ritual")}
              onClick={openAddRitual}
              whileTap={{ scale: 0.92 }}
            >
              <Plus size={32} strokeWidth={1.2} />
            </motion.button>
          </section>
        )}
        {screen === "profile" && (
          <section className="profile-page content">
            <div className="profile-hero">
              <div className={`profile-avatar ${profilePhoto ? "has-photo" : ""}`}>
                {profilePhoto ? (
                  <img src={profilePhoto} alt={t("Profile photo of {name}", { name: username })} />
                ) : (
                  <span aria-hidden="true" />
                )}
              </div>
              <button
                className="profile-change"
                onClick={() => setModal("photo")}
              >
                {t("Change")}
              </button>
            </div>
            <section className="profile-section" aria-labelledby="personal-information">
              <h1 id="personal-information">{t("Personal Information")}</h1>
              <div className="profile-group">
                <button
                  className="profile-row"
                  onClick={() => {
                    setProfileDraft({ username, email });
                    setModal("editProfile");
                  }}
                >
                  <span>{t("Username")}</span>
                  <strong>{username}</strong>
                </button>
                <button
                  className="profile-row"
                  onClick={() => {
                    setProfileDraft({ username, email });
                    setModal("editProfile");
                  }}
                >
                  <span>{t("Email")}</span>
                  <strong>{email}</strong>
                </button>
              </div>
            </section>
            <section className="profile-section" aria-labelledby="profile-subscription">
              <h1 id="profile-subscription">{t("Subscription")}</h1>
              <div className="profile-group">
                <div className="profile-row profile-info-row">
                  <span>{t("Plan")}</span>
                  <strong className={activePlan ? "is-active-plan" : ""}>
                    {activePlan
                      ? brand(`Odette Plus · ${t(activePlan.name)}`)
                      : t("No subscription")}
                  </strong>
                </div>
                {activePlan && renewsOn && (
                  <div className="profile-row profile-info-row">
                    <span>{t("Renews on")}</span>
                    <strong>{renewsOn}</strong>
                  </div>
                )}
              </div>
            </section>
            <Button className="profile-signout" onClick={() => setModal("signOut")}>
              {t("Sign Out")}
            </Button>
          </section>
        )}
        {screen === "subscription" && (
          <section className="subscription-page content">
            <header className="subscription-hero">
              <span>{brand("Odette Plus")}</span>
              <h1>{t("Room to grow, gently")}</h1>
              <p>
                {t("Keep every ritual, every memory, and every quiet win with a plan that fits your pace.")}
              </p>
            </header>

            <div
              className={`plan-status ${activePlan ? "is-active" : ""}`}
              role="status"
            >
              <span className="plan-status-flag">
                {activePlan ? <Check size={13} strokeWidth={3} /> : null}
                {t(activePlan ? "Active" : "No subscription")}
              </span>
              <strong>
                {activePlan
                  ? brand(`Odette Plus · ${t(activePlan.name)}`)
                  : brand(t("You’re on Odette Free"))}
              </strong>
              <p>
                {activePlan
                  ? t("{price} · renews on {date}", {
                      price: rupiah(activePlan.price),
                      date: renewsOn,
                    })
                  : brand(
                      t(
                        "Choose a plan below to open everything Odette can hold for you.",
                      ),
                    )}
              </p>
            </div>

            <section className="subscription-section" aria-labelledby="choose-plan">
              <h2 id="choose-plan">{t("Choose your plan")}</h2>
              <div
                className="plan-list"
                role="radiogroup"
                aria-label={t("Subscription plans")}
              >
                {plans.map((plan) => {
                  const saving = planSavings(plan),
                    selected = planChoice === plan.id,
                    current = planId === plan.id;
                  return (
                    <motion.button
                      key={plan.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      className={`plan-card ${selected ? "is-selected" : ""}`}
                      onClick={() => setPlanChoice(plan.id)}
                      whileTap={{ scale: 0.985 }}
                      transition={{ duration: 0.2 }}
                    >
                      {plan.highlight && (
                        <span className="plan-badge">
                          {current ? t("Current plan") : t(plan.highlight)}
                        </span>
                      )}
                      <span className="plan-mark" aria-hidden="true">
                        <Check size={13} strokeWidth={3} />
                      </span>
                      <span className="plan-copy">
                        <strong>{t(plan.name)}</strong>
                        <small>{t(plan.tagline)}</small>
                      </span>
                      <span className="plan-price">
                        <strong>{rupiah(plan.price)}</strong>
                        <small>
                          {plan.months === 1
                            ? t("per month")
                            : t("{price} / mo", {
                                price: rupiah(plan.price / plan.months),
                              })}
                        </small>
                        {saving > 0 && <em>{t("Save {percent}%", { percent: saving })}</em>}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </section>

            <section className="subscription-section" aria-labelledby="plan-benefits">
              <h2 id="plan-benefits">{t("What’s included")}</h2>
              <ul className="benefit-group">
                {planBenefits.map(([title, note]) => (
                  <li key={title}>
                    <span className="benefit-mark" aria-hidden="true">
                      <Sparkles size={14} strokeWidth={1.8} />
                    </span>
                    <span>
                      <strong>{t(title)}</strong>
                      <small>{t(note)}</small>
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <div className="subscription-actions">
              <Button
                className="subscription-cta"
                disabled={planId === planChoice}
                onClick={() => setModal("subscribe")}
              >
                {planId === planChoice
                  ? t("Your current plan")
                  : activePlan
                    ? t("Switch to {name}", { name: t(chosenPlan.name) })
                    : t("Subscribe · {price}", {
                        price: rupiah(chosenPlan.price),
                      })}
              </Button>
              {activePlan && (
                <button
                  type="button"
                  className="subscription-cancel"
                  onClick={() => setModal("cancelPlan")}
                >
                  {t("Cancel subscription")}
                </button>
              )}
              <p className="subscription-fine">
                {t("Preview pricing in IDR. No payment is taken in this prototype. Plans renew automatically and you can stop anytime.")}
              </p>
            </div>
          </section>
        )}
        {screen === "help" && (
          <section className="settings-page content">
            <header className="settings-hero">
              <span>{brand("ODETTE")}</span>
              <h1>{t("Help & Settings")}</h1>
              <p>{t("Shape a calmer space for your everyday rituals.")}</p>
            </header>

            <section className="settings-section" aria-labelledby="settings-preferences">
              <h2 id="settings-preferences">{t("Preferences")}</h2>
              <div className="settings-group">
                <div className="settings-row settings-select-row">
                  <span>
                    <strong>{t("Language")}</strong>
                    <small>{t("Set your preferred app language.")}</small>
                  </span>
                  <span className="settings-value">
                    <Dropdown
                      label={t("Language")}
                      menuAlign="end"
                      value={language}
                      options={languageOptions}
                      onChange={(next) => {
                        setLanguage(next as Language);
                        setToast(
                          makeTranslator(next as Language)(
                            "Language changed to {language}.",
                            { language: makeTranslator(next as Language)(next) },
                          ),
                        );
                      }}
                    />
                    <ChevronDown size={16} aria-hidden="true" />
                  </span>
                </div>
                <button
                  type="button"
                  className="settings-row"
                  onClick={() => go("profile")}
                >
                  <span>
                    <strong>{t("Account & profile")}</strong>
                    <small>{t("Update your name, email, and photo.")}</small>
                  </span>
                  <ChevronRight size={18} aria-hidden="true" />
                </button>
              </div>
            </section>

            <section className="settings-section" aria-labelledby="settings-shortcuts">
              <h2 id="settings-shortcuts">{t("Quick actions")}</h2>
              <div className="settings-group">
                <button
                  type="button"
                  className="settings-row"
                  onClick={() => go("rituals")}
                >
                  <span>
                    <strong>{t("Manage rituals")}</strong>
                    <small>{t("Create, rename, or remove a ritual.")}</small>
                  </span>
                  <ChevronRight size={18} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="settings-row"
                  onClick={() => go("progress")}
                >
                  <span>
                    <strong>{t("Review progress")}</strong>
                    <small>{t("See your calendar and completion trends.")}</small>
                  </span>
                  <ChevronRight size={18} aria-hidden="true" />
                </button>
              </div>
            </section>

            <section className="settings-section" aria-labelledby="settings-help">
              <h2 id="settings-help">{t("Help")}</h2>
              <div className="settings-group settings-faq">
                <details className="settings-disclosure">
                  <summary>
                    <span>
                      <strong>{t("What are today’s rituals?")}</strong>
                      <small>{t("See what is planned for the current day.")}</small>
                    </span>
                    <ChevronDown size={17} aria-hidden="true" />
                  </summary>
                  <p>
                    {t("Today shows rituals that match the date and their frequency. Morning and Night are time ranges, not required ritual names.")}
                  </p>
                </details>
                <details className="settings-disclosure">
                  <summary>
                    <span>
                      <strong>{t("How do I change a ritual?")}</strong>
                      <small>{t("Edit its name, activities, or schedule.")}</small>
                    </span>
                    <ChevronDown size={17} aria-hidden="true" />
                  </summary>
                  <p>
                    {t("Open Rituals, choose any ritual card, then save your changes or use Delete Ritual at the bottom of the sheet.")}
                  </p>
                </details>
                <details className="settings-disclosure">
                  <summary>
                    <span>
                      <strong>{t("Where is my data saved?")}</strong>
                      <small>{t("Your preview stays on this device.")}</small>
                    </span>
                    <ChevronDown size={17} aria-hidden="true" />
                  </summary>
                  <p>
                    {t("This preview uses local browser storage. Cloud sync and account recovery are not connected yet.")}
                  </p>
                </details>
              </div>
            </section>
          </section>
        )}
        <AnimatePresence>
          {menu && (
            <div className="menu-layer">
              <motion.button
                className="scrim"
                aria-label={t("Close navigation")}
                tabIndex={-1}
                onClick={() => setMenu(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
              <motion.div
                className="menu-panel"
                id="main-menu"
                ref={menuRef}
                initial={{ clipPath: "inset(0% 0% 100% 100% round 22px)" }}
                animate={{ clipPath: "inset(0% 0% 0% 0% round 22px)" }}
                exit={{ clipPath: "inset(0% 0% 100% 100% round 22px)" }}
                transition={{ duration: 0.55, ease: easing }}
              >
                {(
                  [
                    ["Today", "today"],
                    ["Rituals", "rituals"],
                    ["Progress", "progress"],
                    ["Profile", "profile"],
                    ["Subscription", "subscription"],
                    ["Help & Settings", "help"],
                  ] as const
                ).map(([name, target], i) => (
                    <motion.button
                      key={name}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: 0.12 + i * 0.045,
                        duration: 0.32,
                        ease: easing,
                      }}
                      onClick={() => go(target)}
                    >
                      {t(name)}
                    </motion.button>
                  ))}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {modal && modal !== "done" && (
            <Dialog
              title={t(
                modal === "addActivity" || modal === "editActivity"
                  ? "Add activity to your day"
                  : modal === "addRitual"
                    ? "Add Ritual"
                  : modal === "editRitual"
                    ? "Edit Ritual"
                    : modal === "photo"
                      ? "Profile Photo"
                    : modal === "editProfile"
                      ? "Edit Personal Information"
                    : modal === "subscribe"
                      ? activePlan
                        ? "Switch Plan"
                        : "Start Odette Plus"
                    : modal === "cancelPlan"
                      ? "Cancel Subscription"
                    : modal === "signOut"
                      ? "Sign Out"
                    : modal === "google"
                      ? "Continue with Google"
                      : "",
              )}
              onClose={closeModal}
            >
              {(modal === "addActivity" || modal === "editActivity") && (
                <form
                  className="add-form activity-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const target = ritualOptions.find(
                      (ritual) => ritual.name === activityRitual,
                    );
                    if (
                      !activityName.trim() ||
                      !activityCategory ||
                      (activityRitual && !target)
                    ) {
                      setToast(t("Add a name and a category first."));
                      return;
                    }
                    if (modal === "editActivity" && editingActivityId) {
                      const updateActivity = (items: Habit[]) =>
                        items.map((habit) =>
                          habit.id === editingActivityId
                            ? {
                                ...habit,
                                name: activityName.trim(),
                                ritualName: target?.name || "",
                                routine: target?.routine || habit.routine,
                                category: activityCategory,
                                frequency: target?.frequency || "Today only",
                                time: target?.time || "Any time",
                              }
                            : habit,
                        );
                      setHabits(updateActivity);
                      setDraft(updateActivity);
                      setEdited(true);
                      setModal(null);
                      setToast(t("Activity updated."));
                      return;
                    }
                    setHabits((items) => [
                      ...items,
                      {
                        id: crypto.randomUUID(),
                        name: activityName.trim(),
                        ritualName: target?.name || "",
                        routine: target?.routine || "Morning",
                        done: false,
                        category: activityCategory,
                        frequency: target?.frequency || "Today only",
                        time: target?.time || "Any time",
                        scheduledDate:
                          todayKey || localDateKey(new Date()),
                      },
                    ]);
                    setEdited(true);
                    setModal(null);
                    setToast(t("Activity added to today."));
                  }}
                >
                  <input
                    placeholder={t("Activity Name")}
                    aria-label={t("Activity Name")}
                    value={activityName}
                    onChange={(e) => setActivityName(e.target.value)}
                    required
                    maxLength={60}
                  />
                  <div className="select-field">
                    <Dropdown
                      label={t("Category")}
                      value={activityCategory}
                      options={activityCategoryOptions}
                      onChange={setActivityCategory}
                    />
                    <ChevronDown size={16} />
                  </div>
                  <div className="select-field">
                    <Dropdown
                      label={t("Add to your rituals")}
                      value={activityRitual}
                      options={[
                        {
                          value: "",
                          label: "Add to your rituals (optional)",
                        },
                        ...ritualOptions.map((ritual) => ({
                          value: ritual.name,
                          label: ritual.name,
                        })),
                      ]}
                      onChange={setActivityRitual}
                    />
                    <ChevronDown size={16} />
                  </div>
                  <Button type="submit">
                    {t(modal === "editActivity" ? "Save Changes" : "Add")}
                  </Button>
                  {modal === "editActivity" && editingActivityId && (
                    <button
                      type="button"
                      className="delete-ritual"
                      onClick={() => {
                        setHabits((items) =>
                          items.filter((habit) => habit.id !== editingActivityId),
                        );
                        setDraft((items) =>
                          items.filter((habit) => habit.id !== editingActivityId),
                        );
                        setEdited(true);
                        setModal(null);
                        setToast(t("Activity deleted."));
                      }}
                    >
                      {t("Delete Activity")}
                    </button>
                  )}
                </form>
              )}
              {modal === "addRitual" && (
                <form
                  className="add-form ritual-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const pending = newActivity.trim();
                    const activities = pending
                      ? [
                          ...ritualActivities,
                          {
                            id: crypto.randomUUID(),
                            name: pending,
                            ritualName: ritualName.trim(),
                            routine:
                              ritualTime === "Night" ? "Night" : "Morning",
                            done: false,
                            category: ritualCategory,
                            frequency: ritualFrequency,
                            time: ritualTime,
                          } satisfies Habit,
                        ]
                      : ritualActivities;
                    if (!ritualName.trim()) return;
                    if (
                      ritualGroups.some(
                        (ritual) =>
                          ritual.name.toLocaleLowerCase() ===
                          ritualName.trim().toLocaleLowerCase(),
                      )
                    ) {
                      setToast(t("Please choose a unique ritual name."));
                      return;
                    }
                    if (!activities.length) {
                      setToast(t("Add at least one activity to this ritual."));
                      return;
                    }
                    setHabits((h) => [
                      ...h,
                      ...activities.map((activity) => ({
                        ...activity,
                        ritualName: ritualName.trim(),
                        routine: (ritualTime === "Night"
                          ? "Night"
                          : "Morning") as Routine,
                        category: ritualCategory,
                        frequency: ritualFrequency,
                        time: ritualTime,
                      })),
                    ]);
                    setEdited(true);
                    setModal(null);
                    setToast(t("Your new ritual has been added."));
                  }}
                >
                  <input
                    placeholder={t("Ritual Name")}
                    aria-label={t("Ritual Name")}
                    value={ritualName}
                    onChange={(e) => setRitualName(e.target.value)}
                    required
                    maxLength={60}
                  />
                  <div className="form-field-label">
                    {t("Category")}
                    <div className="select-field">
                      <Flower2 size={19} />
                      <Dropdown
                        label={t("Category")}
                        value={ritualCategory}
                        options={ritualCategoryOptions}
                        onChange={setRitualCategory}
                      />
                      <ChevronDown size={16} />
                    </div>
                  </div>
                  <div className="ritual-select-grid">
                    <div className="form-field-label">
                      {t("Frequency")}
                      <div className="select-field">
                        <Dropdown
                          label={t("Frequency")}
                          value={ritualFrequency}
                          options={frequencyOptions}
                          onChange={setRitualFrequency}
                        />
                        <ChevronDown size={16} />
                      </div>
                    </div>
                    <div className="form-field-label">
                      {t("Time Range")}
                      <div className="select-field">
                        <Dropdown
                          label={t("Time Range")}
                          value={ritualTime}
                          options={timeRangeOptions}
                          onChange={setRitualTime}
                        />
                        <ChevronDown size={16} />
                      </div>
                    </div>
                  </div>
                  <div className="activities-editor">
                    <span className="form-field-label">{t("Activity")}</span>
                    <div className="activity-chips">
                      {ritualActivities.map((activity) => (
                        <button
                          key={activity.id}
                          type="button"
                          className="activity-chip"
                          onClick={() =>
                            setRitualActivities((items) =>
                              items.filter((item) => item.id !== activity.id),
                            )
                          }
                        >
                          {activity.name}
                          <X size={11} aria-hidden="true" />
                        </button>
                      ))}
                    </div>
                    <div className="activity-composer">
                      <input
                        placeholder={t("add activities to your ritual")}
                        aria-label={t("Activity")}
                        value={newActivity}
                        onChange={(e) => setNewActivity(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addDraftActivity();
                          }
                        }}
                        maxLength={60}
                      />
                      <button
                        type="button"
                        aria-label={t("Add activity")}
                        onClick={addDraftActivity}
                      >
                        <Plus size={17} />
                      </button>
                    </div>
                  </div>
                  <Button type="submit">{t("Add")}</Button>
                </form>
              )}
              {modal === "editRitual" && (
                <form
                  className="edit-ritual-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (
                      ritualGroups.some(
                        (ritual) =>
                          ritual.name !== editingRitual &&
                          ritual.name.toLocaleLowerCase() ===
                            ritualName.trim().toLocaleLowerCase(),
                      )
                    ) {
                      setToast(t("Please choose a unique ritual name."));
                      return;
                    }
                    setHabits((all) => [
                      ...all.filter(
                        (habit) => getRitualName(habit) !== editingRitual,
                      ),
                      ...ritualActivities.map((activity) => ({
                        ...activity,
                        ritualName: ritualName.trim(),
                        routine: (ritualTime === "Night"
                          ? "Night"
                          : "Morning") as Routine,
                        category: ritualCategory,
                        frequency: ritualFrequency,
                        time: ritualTime,
                      })),
                    ]);
                    setEdited(true);
                    setModal(null);
                    setToast(t("Your ritual has been updated."));
                  }}
                >
                  <label className="form-field-label">
                    {t("Ritual Name")}
                    <input
                      value={ritualName}
                      onChange={(e) => setRitualName(e.target.value)}
                      maxLength={60}
                      required
                    />
                  </label>
                  <div className="form-field-label">
                    {t("Category")}
                    <div className="select-field">
                      <Flower2 size={19} />
                      <Dropdown
                        label={t("Category")}
                        value={ritualCategory}
                        options={editRitualCategoryOptions}
                        onChange={setRitualCategory}
                      />
                      <ChevronDown size={16} />
                    </div>
                  </div>
                  <div className="ritual-select-grid">
                    <div className="form-field-label">
                      {t("Frequency")}
                      <div className="select-field">
                        <Dropdown
                          label={t("Frequency")}
                          value={ritualFrequency}
                          options={frequencyOptions}
                          onChange={setRitualFrequency}
                        />
                        <ChevronDown size={16} />
                      </div>
                    </div>
                    <div className="form-field-label">
                      {t("Time Range")}
                      <div className="select-field">
                        <Dropdown
                          label={t("Time Range")}
                          value={ritualTime}
                          options={timeRangeOptions}
                          onChange={setRitualTime}
                        />
                        <ChevronDown size={16} />
                      </div>
                    </div>
                  </div>
                  <div className="activities-editor">
                    <span className="form-field-label">{t("Activities")}</span>
                    <div className="activity-chips">
                      {ritualActivities.map((activity) => (
                        <button
                          key={activity.id}
                          type="button"
                          className="activity-chip"
                          onClick={() =>
                            setRitualActivities((activities) =>
                              activities.filter((item) => item.id !== activity.id),
                            )
                          }
                        >
                          {t(
                            activity.id === "water"
                              ? "Drink Water"
                              : activity.id === "exercise"
                                ? "Exercise"
                                : activity.id === "read"
                                  ? "Read"
                                  : activity.name,
                          )}
                          <X size={11} aria-hidden="true" />
                        </button>
                      ))}
                    </div>
                    <div className="activity-composer">
                      <input
                        value={newActivity}
                        onChange={(e) => setNewActivity(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addDraftActivity();
                          }
                        }}
                        placeholder={t("add activities to your ritual")}
                        aria-label={t("Add an activity")}
                        maxLength={60}
                      />
                      <button
                        type="button"
                        aria-label={t("Add activity")}
                        onClick={addDraftActivity}
                      >
                        <Plus size={17} />
                      </button>
                    </div>
                  </div>
                  <Button type="submit">{t("Save Changes")}</Button>
                  <button
                    type="button"
                    className="delete-ritual"
                    onClick={() => {
                      setHabits((all) =>
                        all.filter(
                          (habit) => getRitualName(habit) !== editingRitual,
                        ),
                      );
                      setEdited(true);
                      setModal(null);
                      setToast(
                        t("{name} ritual deleted.", { name: editingRitual }),
                      );
                    }}
                  >
                    {t("Delete Ritual")}
                  </button>
                </form>
              )}
              {modal === "photo" && (
                <div className="profile-sheet-actions">
                  {profilePhoto ? (
                    <button
                      type="button"
                      className="profile-action danger-action"
                      onClick={() => {
                        setProfilePhoto("");
                        setModal(null);
                        setToast(t("Profile photo removed."));
                      }}
                    >
                      <Trash2 size={19} aria-hidden="true" />
                      {t("Remove photo")}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="profile-action"
                        onClick={() => uploadInput.current?.click()}
                      >
                        <Upload size={19} aria-hidden="true" />
                        {t("Upload from device")}
                      </button>
                      <button
                        type="button"
                        className="profile-action"
                        onClick={() => cameraInput.current?.click()}
                      >
                        <Camera size={19} aria-hidden="true" />
                        {t("Take photo")}
                      </button>
                    </>
                  )}
                  <input
                    ref={uploadInput}
                    className="visually-hidden"
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      chooseProfilePhoto(event.target.files?.[0]);
                      event.currentTarget.value = "";
                    }}
                  />
                  <input
                    ref={cameraInput}
                    className="visually-hidden"
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={(event) => {
                      chooseProfilePhoto(event.target.files?.[0]);
                      event.currentTarget.value = "";
                    }}
                  />
                </div>
              )}
              {modal === "editProfile" && (
                <form
                  className="profile-edit-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    setUsername(profileDraft.username.trim());
                    setEmail(profileDraft.email.trim());
                    setModal(null);
                    setToast(t("Personal information saved."));
                  }}
                >
                  <label className="form-field-label">
                    {t("Username")}
                    <input
                      value={profileDraft.username}
                      onChange={(event) =>
                        setProfileDraft((draft) => ({
                          ...draft,
                          username: event.target.value,
                        }))
                      }
                      required
                      maxLength={40}
                    />
                  </label>
                  <label className="form-field-label">
                    {t("Email")}
                    <input
                      type="email"
                      value={profileDraft.email}
                      onChange={(event) =>
                        setProfileDraft((draft) => ({
                          ...draft,
                          email: event.target.value,
                        }))
                      }
                      required
                      maxLength={120}
                    />
                  </label>
                  <Button type="submit">{t("Save Changes")}</Button>
                </form>
              )}
              {modal === "subscribe" && (
                <div className="plan-sheet">
                  <div className="plan-sheet-summary">
                    <span>{brand("Odette Plus")}</span>
                    <strong>{t(chosenPlan.name)}</strong>
                    <b>{rupiah(chosenPlan.price)}</b>
                    <small>
                      {chosenPlan.months === 1
                        ? t("Billed every month")
                        : t("Billed once every {months} months · {price} / mo", {
                            months: chosenPlan.months,
                            price: rupiah(
                              chosenPlan.price / chosenPlan.months,
                            ),
                          })}
                    </small>
                  </div>
                  <p className="plan-sheet-note">
                    {activePlan
                      ? t(
                          "Your {name} plan will be replaced and the new period starts today.",
                          { name: t(activePlan.name) },
                        )
                      : t(
                          "Your plan starts today and renews automatically. No real payment is taken in this preview.",
                        )}
                  </p>
                  <Button onClick={() => startPlan(chosenPlan.id)}>
                    {t(activePlan ? "Switch plan" : "Activate plan")}
                  </Button>
                  <button
                    type="button"
                    className="plan-sheet-dismiss"
                    onClick={closeModal}
                  >
                    {t("Not now")}
                  </button>
                </div>
              )}

              {modal === "cancelPlan" && (
                <div className="confirmation-content">
                  <p>
                    {brand(
                      t("Cancel Odette Plus? You’ll keep access until {date}.", {
                        date: renewsOn || t("the end of this period"),
                      }),
                    )}
                  </p>
                  <div className="confirmation-actions">
                    <button type="button" onClick={closeModal}>
                      {t("Keep plan")}
                    </button>
                    <button
                      type="button"
                      className="confirm-signout"
                      onClick={() => {
                        setPlanId(null);
                        setPlanStarted("");
                        setModal(null);
                        setToast(t("Subscription cancelled. You’re on Odette Free."));
                      }}
                    >
                      {t("Yes, cancel")}
                    </button>
                  </div>
                </div>
              )}

              {modal === "signOut" && (
                <div className="confirmation-content">
                  <p>{t("Are you sure you want to sign out?")}</p>
                  <div className="confirmation-actions">
                    <button type="button" onClick={closeModal}>
                      {t("No")}
                    </button>
                    <button
                      type="button"
                      className="confirm-signout"
                      onClick={() => {
                        setModal(null);
                        setAuthFirstName("");
                        setAuthLastName("");
                        setAuthEmail("");
                        go("welcome");
                      }}
                    >
                      {t("Yes, sign out")}
                    </button>
                  </div>
                </div>
              )}

              {modal === "google" && (
                <div className="help-content">
                  <p>{t("Google sign-in isn’t connected in this preview yet.")}</p>
                  <p>
                    {brand(
                      t("You can still explore Odette and keep your rituals on this device."),
                    )}
                  </p>
                  <Button
                    onClick={() => {
                      setModal(null);
                      go(screen === "signup" ? "name" : "today");
                    }}
                  >
                    {t("Continue to preview")}
                  </Button>
                </div>
              )}
            </Dialog>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {modal === "done" && (
            <div className="modal-layer completion-layer">
              <motion.button
                className="scrim"
                aria-label={t("Close completion message")}
                tabIndex={-1}
                onClick={closeModal}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
              <motion.section
                className="completion-sheet"
                role="dialog"
                aria-modal="true"
                aria-labelledby="completion-title"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ duration: 0.5, ease: easing }}
              >
                <h2 id="completion-title">{t("You’re all done")}</h2>
                <p>{t("Today looked good on you")}</p>
                <Flower name="lotus-bouquet" className="completion-flower" />
                <Button
                  onClick={() => {
                    closeModal();
                    go("today");
                  }}
                >
                  {t("See Summary")}
                </Button>
              </motion.section>
            </div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {toast && (
            <motion.div
              role="status"
              className="toast"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
            >
              {brand(toast)}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      </I18nContext.Provider>
    </MotionConfig>
  );
}
