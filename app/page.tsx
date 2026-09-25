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
  animate as animateValue,
  motion,
  MotionConfig,
  useReducedMotion,
  type TargetAndTransition,
  type Transition,
  type Variants,
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
/* Static by default. Use short tweens for feedback and state changes. */
const easing = [0.2, 0, 0, 1] as const;
const exitEasing = [0.4, 0, 1, 1] as const;
const softSpring: Transition = {
  type: "tween",
  duration: 0.18,
  ease: easing,
};
const overlayEnter: Transition = {
  type: "tween",
  duration: 0.22,
  ease: easing,
};
const overlayExit: Transition = {
  type: "tween",
  duration: 0.18,
  ease: exitEasing,
};
const menuReveal: Transition = {
  type: "tween",
  duration: 0.36,
  ease: "linear",
};
const menuClose: Transition = {
  type: "tween",
  duration: 0.34,
  ease: "linear",
};
const sheetEnter: Transition = {
  type: "tween",
  duration: 0.26,
  ease: easing,
};
const sheetExit: Transition = {
  type: "tween",
  duration: 0.22,
  ease: exitEasing,
};
const tapSpring: Transition = {
  type: "tween",
  duration: 0.12,
  ease: easing,
};
const popSpring: Transition = {
  type: "tween",
  duration: 0.18,
  ease: easing,
};
const screenMotion: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.15, ease: easing },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.1, ease: exitEasing },
  },
};
const screenMotionFlat: Variants = {
  initial: { opacity: 1 },
  animate: { opacity: 1, transition: { duration: 0 } },
  exit: { opacity: 1, transition: { duration: 0 } },
};
const staticVariant: Variants = { initial: {}, animate: {} };
const rise = staticVariant;
const riseClose = staticVariant;
const fadeIn = staticVariant;
const listStagger = staticVariant;
const listItem: Variants = {
  initial: {},
  animate: {},
  exit: {
    opacity: 0,
    transition: { duration: 0.15, ease: exitEasing },
  },
};
const optionItem: Variants = {
  initial: {},
  animate: {},
  exit: { opacity: 0, transition: { duration: 0.15, ease: exitEasing } },
};
const calendarGrid: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.18, ease: easing } },
  exit: { opacity: 0, transition: { duration: 0.16, ease: exitEasing } },
};
const calendarDay = staticVariant;
const swapUp: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.16, ease: easing } },
  exit: { opacity: 0, transition: { duration: 0.12, ease: exitEasing } },
};
const chipItem: Variants = {
  initial: {},
  animate: {},
  exit: { opacity: 0, transition: { duration: 0.15, ease: exitEasing } },
};
const ddOption = staticVariant;
const emojiPicker: Variants = {
  initial: { opacity: 0, y: -4 },
  animate: {
    opacity: 1,
    y: 0,
    transition: overlayEnter,
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: overlayExit,
  },
};
const makeMenuMotion = (reduced: boolean): Variants => ({
  initial: reduced ? { opacity: 0 } : { opacity: 0, y: -4 },
  animate: {
    opacity: 1,
    y: 0,
    transition: reduced ? { duration: 0 } : overlayEnter,
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: reduced ? 0 : 0.16, ease: exitEasing },
  },
});
const menuMotion = makeMenuMotion(false);
const menuMotionReduced = makeMenuMotion(true);
/* A sheet animates on plain props rather than a variant label. A label
   propagates to every motion element underneath it, which is how the contents
   ended up cascading in behind the panel; with objects nothing is inherited,
   so the panel is the only thing that moves. One element travelling instead of
   eight is both lighter to watch and cheaper to composite. */
/* Animate the whole `transform` as one value, not `y`. Only the names in
   Motion's `acceleratedValues` — transform, opacity, filter, clipPath,
   backgroundColor — can be handed to the browser's own animation engine and run
   off the main thread; `y` is not one of them, so writing it here would quietly
   move the slide back onto the main thread, where it has to share frames with
   React. The string form looks less idiomatic and is the faster one. */
const sheetHidden: TargetAndTransition = {
  transform: "translate3d(0, 100%, 0)",
};
const sheetShown: TargetAndTransition = {
  transform: "translate3d(0, 0%, 0)",
  transition: sheetEnter,
};
const sheetLeaving: TargetAndTransition = {
  ...sheetHidden,
  transition: sheetExit,
};
const sheetStill: TargetAndTransition = {
  ...sheetShown,
  transition: { duration: 0 },
};
const cardHover = {};
const cardTap = { scale: 0.985, transition: tapSpring };
const rowHover = {};
const rowTap = { scale: 0.99, transition: tapSpring };
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
/* Laid out 8 per row so the source reads like the grid it renders. */
// prettier-ignore
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
  const src = `/images/${name}.webp`;
  return (
    <img
      draggable={false}
      src={src}
      alt=""
      aria-hidden="true"
      className={className}
    />
  );
}
/* Update numbers only when their value changes, without a count-up on mount. */
function Counter({ value }: { value: number }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(value);
  const current = useRef(value);
  useEffect(() => {
    if (reduced) {
      current.current = value;
      setShown(value);
      return;
    }
    const controls = animateValue(current.current, value, {
      duration: 0.3,
      ease: easing,
      onUpdate: (next) => {
        current.current = next;
        setShown(Math.round(next));
      },
    });
    return () => controls.stop();
  }, [value, reduced]);
  return <>{shown}</>;
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
      variants={riseClose}
      whileHover={disabled ? undefined : { y: -1, transition: softSpring }}
      whileTap={{ scale: disabled ? 1 : 0.985, transition: tapSpring }}
    >
      {children}
    </motion.button>
  );
}
function Dot({ checked, tick = false }: { checked: boolean; tick?: boolean }) {
  return (
    <motion.span
      className={`dot ${checked ? "checked" : ""}`}
      animate={{ scale: checked ? [1, 1.06, 1] : 1 }}
      transition={{ duration: 0.18, ease: easing }}
    >
      <AnimatePresence initial={false}>
        {checked && tick && (
          <motion.span
            key="tick"
            className="dot-tick"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={popSpring}
          >
            <Check size={12} strokeWidth={3} />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.span>
  );
}
function Bar({ value }: { value: number }) {
  const t = useT();
  const reduced = useReducedMotion();
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
        initial={reduced ? false : { width: "0%" }}
        animate={{ width: `${value}%` }}
        transition={{ duration: reduced ? 0 : 0.8, ease: easing }}
      />
    </div>
  );
}
function Ring({ value }: { value: number }) {
  const t = useT();
  const reduced = useReducedMotion();
  return (
    <motion.div
      className="ring-wrap"
      variants={rise}
      initial="initial"
      animate="animate"
    >
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
            initial={reduced ? false : { pathLength: 0 }}
            animate={{ pathLength: value / 100 }}
            transition={{ duration: reduced ? 0 : 0.8, ease: easing }}
          />
        </svg>
        <div>
          <strong>
            <Counter value={value} />%
          </strong>
          <span>{t("DONE")}</span>
        </div>
      </div>
      <p>
        {t(value === 100 ? "Beautifully done!" : "Good day!")}
      </p>
    </motion.div>
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
}: {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  label: string;
  chevron?: boolean;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState<DropdownBox | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const current = options.find((option) => option.value === value);
  const place = useCallback(() => {
    const anchor = (
      trigger.current?.closest(
        ".select-field, .progress-period-picker, .settings-value",
      ) ?? trigger.current
    )?.getBoundingClientRect();
    if (!anchor) return;
    const width = Math.min(anchor.width, window.innerWidth - 16);
    const below = window.innerHeight - anchor.bottom - 12,
      above = anchor.top - 12,
      wanted = Math.min(options.length * 57 + 2, 322),
      flip = below < wanted && above > below,
      height = Math.max(114, Math.min(wanted, flip ? above : below));
    setBox({
      top: flip ? anchor.top - height : anchor.bottom,
      left: Math.min(Math.max(8, anchor.left), window.innerWidth - width - 8),
      width,
      height,
    });
  }, [options.length]);
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
      <motion.button
        ref={trigger}
        type="button"
        className="dd-trigger"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        whileTap={{ scale: 0.97, transition: tapSpring }}
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
        {chevron && (
          <motion.span
            className="dd-chevron"
            animate={{ rotate: open ? 180 : 0 }}
            transition={softSpring}
          >
            <ChevronDown size={14} aria-hidden="true" />
          </motion.span>
        )}
      </motion.button>
      {/* The portal stays mounted once placed so the menu can animate out. */}
      {box
        ? createPortal(
            <AnimatePresence>
              {open && (
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
                    transformOrigin: "top center",
                  }}
                  variants={reduced ? menuMotionReduced : menuMotion}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  {options.map((option) => (
                    <motion.button
                      key={option.value}
                      type="button"
                      role="option"
                      data-value={option.value}
                      aria-selected={!option.disabled && option.value === value}
                      disabled={option.disabled}
                      className="dd-option"
                      variants={ddOption}
                      whileTap={
                        option.disabled
                          ? undefined
                          : { scale: 0.975, transition: tapSpring }
                      }
                      onClick={() => {
                        setOpen(false);
                        trigger.current?.focus();
                        if (option.value !== value) onChange(option.value);
                      }}
                    >
                      <span>{t(option.label)}</span>
                      {option.value === value && !option.disabled && (
                        <motion.span
                          className="dd-check"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={popSpring}
                        >
                          <Check size={19} aria-hidden="true" />
                        </motion.span>
                      )}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
  );
}
/* A details/summary pair cannot ease its height open, so the FAQ rows run on
   state instead: the caret turns and the answer unrolls. */
function Disclosure({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      className={`settings-disclosure ${open ? "is-open" : ""}`}
      variants={optionItem}
    >
      <motion.button
        type="button"
        className="settings-disclosure-summary"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        whileTap={{ scale: 0.99, transition: tapSpring }}
      >
        <span>
          <strong>{title}</strong>
          <small>{hint}</small>
        </span>
        <motion.span
          className="settings-disclosure-caret"
          animate={{ rotate: open ? 180 : 0 }}
          transition={softSpring}
        >
          <ChevronDown size={17} aria-hidden="true" />
        </motion.span>
      </motion.button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            className="settings-disclosure-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: "auto",
              opacity: 1,
              transition: {
                height: { duration: 0.26, ease: easing },
                opacity: { duration: 0.2, ease: easing, delay: 0.05 },
              },
            }}
            exit={{
              height: 0,
              opacity: 0,
              transition: {
                height: { duration: 0.2, ease: exitEasing },
                opacity: { duration: 0.12 },
              },
            }}
          >
            <p>{children}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
function brand(text: ReactNode): ReactNode {
  if (typeof text !== "string") return text;
  return text.split(/(odette)/gi).map((part, index) =>
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
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const nodes = () =>
      ref.current?.querySelectorAll<HTMLElement>("button,input,select,a[href]");
    nodes()?.[0]?.focus({ preventScroll: true });
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
      previous?.focus({ preventScroll: true });
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
        animate={{
          opacity: 1,
          transition: reduced ? { duration: 0.1 } : sheetEnter,
        }}
        exit={{
          opacity: 0,
          transition: reduced ? { duration: 0.1 } : sheetExit,
        }}
      />
      <motion.div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="sheet"
        initial={reduced ? false : sheetHidden}
        animate={reduced ? sheetStill : sheetShown}
        exit={reduced ? sheetStill : sheetLeaving}
      >
        <span className="sheet-handle" aria-hidden="true" />
        <header>
          <motion.button
            aria-label={t("Close dialog")}
            onClick={onClose}
            className="circle-button"
            whileHover={{ scale: 1.03, transition: softSpring }}
            whileTap={{ scale: 0.97, transition: tapSpring }}
          >
            <X size={16} />
          </motion.button>
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
    [progressPeriod, setProgressPeriod] = useState<ProgressPeriod>("monthly"),
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
  const reduced = useReducedMotion();
  const screenAnim = reduced ? screenMotionFlat : screenMotion;
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
    window.history.pushState(
      {},
      "",
      `?screen=${next}${dateKey ? `&date=${dateKey}` : ""}`,
    );
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
          setActivityHistory(
            Object.fromEntries(
              Object.entries(s.activityHistory).filter(
                ([date, entries]) =>
                  /^\d{4}-\d{2}-\d{2}$/.test(date) &&
                  Array.isArray(entries) &&
                  entries.every(isHabit),
              ),
            ) as ActivityHistory,
          );
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
    menuRef.current
      ?.querySelector<HTMLButtonElement>("button")
      ?.focus({ preventScroll: true });
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
    dailyHabits =
      detailDateKey > todayKey
        ? habits
            .filter(
              (habit) =>
                habit.ritualName?.trim() &&
                isScheduledForDate(habit, detailDateKey),
            )
            .map((habit) => ({ ...habit, done: false }))
        : isHistoricalDay
          ? habitsForDay(detailDateKey, todayKey, habits, activityHistory)
          : draftDateKey === todayKey
            ? draft
            : todayHabits,
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
  const dailyStandaloneHabits = dailyHabits.filter(
    (habit) => !getRitualName(habit),
  );
  const dailyRitualGroups = ritualGroupsForDate(
    dailyHabits,
    detailDateKey || todayKey,
  );
  /* Sharing a layoutId lets a habit glide between Missed and Completed
     instead of blinking out of one list and into the other. */
  const renderDailyHabit = (habit: Habit) => (
    <motion.div
      className="daily-habit"
      key={habit.id}
      layoutId={`daily-habit-${habit.id}`}
      layout="position"
      variants={listItem}
      transition={softSpring}
    >
      <motion.button
        className="daily-habit-toggle"
        disabled={isHistoricalDay}
        whileTap={
          isHistoricalDay ? undefined : { scale: 0.97, transition: tapSpring }
        }
        onClick={() => setDraft((items) => toggleHabit(items, habit.id))}
        aria-label={`${habit.done ? "Uncheck" : "Complete"} ${habit.name}`}
        aria-pressed={habit.done}
      >
        <Dot tick checked={habit.done} />
      </motion.button>
      <motion.button
        className="daily-habit-edit"
        disabled={isHistoricalDay}
        whileHover={
          isHistoricalDay ? undefined : { x: 3, transition: softSpring }
        }
        whileTap={
          isHistoricalDay ? undefined : { scale: 0.985, transition: tapSpring }
        }
        onClick={() => openActivityEditor(habit)}
        aria-label={`Edit ${habit.name}`}
      >
        <span>{habit.name}</span>
        {!isHistoricalDay && <Pencil size={14} aria-hidden="true" />}
      </motion.button>
    </motion.div>
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
      ["Morning", "Afternoon", "Evening", "Night"].includes(activities[0]?.time)
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
  const bottomCategory =
    categoryRanking.length > 1
      ? categoryRanking[categoryRanking.length - 1]
      : undefined;
  /* Both cards are built from tracked activities only: with nothing logged for
     the period there is no ranking, so the section renders nothing rather than
     inventing a category and a percentage. */
  const consistencyCards = [
    topCategory && {
      title: "Most consistent",
      name: topCategory.category,
      value: topCategory.value,
      icon: <Sparkles aria-hidden="true" size={17} strokeWidth={1.8} />,
    },
    bottomCategory && {
      title: "Least consistent",
      name: bottomCategory.category,
      value: bottomCategory.value,
      icon: <BookOpen aria-hidden="true" size={17} strokeWidth={1.8} />,
    },
  ].filter(Boolean) as {
    title: string;
    name: string;
    value: number;
    icon: ReactNode;
  }[];
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
          periodLabel: "This Week",
          average: ritualAverage,
          bestLabel: "Best day",
          best: ritualBest,
        }
      : {
          overall: percent,
          currentStreak: edited ? (habits.some((h) => h.done) ? 1 : 0) : 12,
          longestStreak: edited ? (habits.some((h) => h.done) ? 1 : 0) : 12,
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
      transition={{ duration: 0.18, ease: easing }}
    >
      <I18nContext.Provider value={t}>
        <main className={`app screen-${screen}`}>
          {appShell && (
            <>
              <Flower name="lotus-leaf-stem" className="today-flower" />
              <motion.nav
                className="topbar"
                aria-label={t("Page navigation")}
                initial={false}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {screen !== "today" ? (
                    <motion.button
                      key="back"
                      aria-label={t(
                        screen === "progress" && progressView === "report"
                          ? "Back to Progress calendar"
                          : "Back to Today",
                      )}
                      className="back-button"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.16, ease: easing }}
                      whileHover={{ x: -1, transition: softSpring }}
                      whileTap={{ scale: 0.96, transition: tapSpring }}
                      onClick={() => {
                        if (
                          screen === "progress" &&
                          progressView === "report"
                        ) {
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
                    </motion.button>
                  ) : (
                    <span key="spacer" />
                  )}
                </AnimatePresence>
                <motion.button
                  ref={menuButton}
                  className={`hamburger ${menu ? "is-open" : ""}`}
                  aria-label={menu ? "Close menu" : "Open menu"}
                  aria-expanded={menu}
                  aria-controls="main-menu"
                  onClick={() => setMenu((v) => !v)}
                >
                  {/* Keep the hit area and bar widths fixed while they morph. */}
                  <motion.span
                    initial={false}
                    animate={{
                      transform: menu
                        ? "translateY(4px) rotate(45deg) scaleX(0.576923)"
                        : "translateY(0px) rotate(0deg) scaleX(1)",
                    }}
                    transition={reduced ? { duration: 0 } : overlayEnter}
                  />
                  <motion.span
                    initial={false}
                    animate={{
                      transform: menu
                        ? "translateY(-4px) rotate(-45deg) scaleX(0.576923)"
                        : "translateY(0px) rotate(0deg) scaleX(1)",
                    }}
                    transition={reduced ? { duration: 0 } : overlayEnter}
                  />
                </motion.button>
              </motion.nav>
            </>
          )}
          {/* One screen holds the stage at a time: the old one clears out
            before the next drifts in, so nothing crossfades into itself. */}
          <AnimatePresence mode="wait">
            {screen === "welcome" && (
              <motion.section
                key={"welcome"}
                className="welcome"
                variants={screenAnim}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <motion.h1 className="wordmark" variants={rise}>
                  Odette
                </motion.h1>
                <motion.p className="motto" variants={rise}>
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
                </motion.p>
                <motion.div className="welcome-actions" variants={rise}>
                  <div className="welcome-cta">
                    <div className="welcome-plant">
                      <motion.div
                        className="welcome-bloom"
                        initial={
                          reduced ? false : { opacity: 0, y: 14, scale: 0.96 }
                        }
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={
                          reduced
                            ? { duration: 0 }
                            : {
                                type: "spring",
                                visualDuration: 0.75,
                                bounce: 0.22,
                              }
                        }
                      >
                        <Flower name="12" className="welcome-complete" />
                      </motion.div>
                    </div>
                    <Button onClick={() => go("signup")}>
                      {t("Get started")}
                    </Button>
                  </div>
                  <motion.p variants={fadeIn}>
                    {t("Already have an account?")}{" "}
                    <motion.button
                      onClick={() => go("login")}
                      whileHover={{ y: -1, transition: softSpring }}
                      whileTap={{ scale: 0.94, transition: tapSpring }}
                    >
                      {t("Log in")}
                    </motion.button>
                  </motion.p>
                </motion.div>
              </motion.section>
            )}
            {(screen === "signup" || screen === "login") && (
              <motion.section
                key={screen}
                className={`auth ${screen}`}
                variants={screenAnim}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <motion.button
                  className="back-button auth-back"
                  aria-label={t("Back to welcome")}
                  onClick={() => go("welcome")}
                  variants={rise}
                  whileHover={{ x: -1, transition: softSpring }}
                  whileTap={{ scale: 0.97, transition: tapSpring }}
                >
                  <ChevronLeft size={22} />
                </motion.button>
                <Flower name="lotus-bud" className="auth-bud" />
                <motion.h1 variants={rise}>
                  {t(screen === "signup" ? "Create an account" : "Log in")}
                </motion.h1>
                <motion.form
                  variants={listStagger}
                  onSubmit={(e) => {
                    e.preventDefault();
                    applyAuthIdentity(screen === "signup");
                    go(screen === "signup" ? "name" : "today");
                  }}
                >
                  {screen === "signup" && (
                    <>
                      <motion.input
                        variants={optionItem}
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
                      <motion.input
                        variants={optionItem}
                        aria-label={t("Last name")}
                        placeholder={t("Last name")}
                        autoComplete="family-name"
                        required
                        value={authLastName}
                        onChange={(e) => setAuthLastName(e.target.value)}
                      />
                    </>
                  )}
                  <motion.input
                    variants={optionItem}
                    aria-label={t("Email")}
                    placeholder={t("Email")}
                    type="email"
                    autoComplete="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                  />
                  <motion.input
                    variants={optionItem}
                    aria-label={t("Password")}
                    placeholder={t("Password")}
                    type="password"
                    autoComplete={
                      screen === "signup" ? "new-password" : "current-password"
                    }
                    minLength={6}
                    required
                  />
                  <motion.div className="divider" variants={optionItem}>
                    <span />
                    {t("Or")}
                    <span />
                  </motion.div>
                  <Button className="google" onClick={() => setModal("google")}>
                    <GoogleLogo />
                    {t("Continue with Google")}
                  </Button>
                  <Button type="submit" className="auth-submit">
                    {t(screen === "signup" ? "Create account" : "Log in")}
                  </Button>
                  <motion.p className="local-note" variants={optionItem}>
                    {t("Local preview · no account is created")}
                  </motion.p>
                </motion.form>
              </motion.section>
            )}
            {["name", "focus", "routine"].includes(screen) && (
              <motion.section
                key={screen}
                className={`onboarding onboarding-${screen}`}
                variants={screenAnim}
                initial="initial"
                animate="animate"
                exit="exit"
              >
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
                <motion.p className="step" variants={rise}>
                  {t("Step {n} of 3", {
                    n: screen === "name" ? 1 : screen === "focus" ? 2 : 3,
                  })}
                </motion.p>
                <motion.h1 variants={rise}>
                  {lines(
                    t(
                      screen === "name"
                        ? "What do you want to\nbe called?"
                        : screen === "focus"
                          ? "What would you like\nto focus on?"
                          : "Let’s build your first\nroutine!",
                    ),
                  )}
                </motion.h1>
                {screen === "name" ? (
                  <motion.form
                    className="name-form"
                    variants={listStagger}
                    onSubmit={(e) => {
                      e.preventDefault();
                      go("focus");
                    }}
                  >
                    <motion.div
                      className="nickname-picker"
                      variants={optionItem}
                    >
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
                        <motion.button
                          type="button"
                          className="emoji-trigger"
                          aria-label={t("Choose profile emoji")}
                          aria-expanded={emojiPickerOpen}
                          whileHover={{ scale: 1.03, transition: softSpring }}
                          whileTap={{ scale: 0.97, transition: tapSpring }}
                          onClick={() => setEmojiPickerOpen((open) => !open)}
                        >
                          <AnimatePresence mode="wait" initial={false}>
                            <motion.span
                              key={nicknameEmoji || "placeholder"}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={popSpring}
                              className="emoji-trigger-face"
                            >
                              {nicknameEmoji || (
                                <Smile size={19} strokeWidth={1.7} />
                              )}
                            </motion.span>
                          </AnimatePresence>
                        </motion.button>
                      </div>
                      <AnimatePresence>
                        {emojiPickerOpen && (
                          <motion.div
                            className="emoji-picker"
                            variants={emojiPicker}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            role="listbox"
                            aria-label={t("Profile emoji")}
                          >
                            {emojiOptions.map((emoji) => (
                              <motion.button
                                key={emoji}
                                type="button"
                                role="option"
                                aria-label={t("Choose {emoji}", { emoji })}
                                aria-selected={nicknameEmoji === emoji}
                                className={
                                  nicknameEmoji === emoji ? "is-selected" : ""
                                }
                                variants={ddOption}
                                whileHover={{
                                  scale: 1.04,
                                  transition: softSpring,
                                }}
                                whileTap={{
                                  scale: 0.96,
                                  transition: tapSpring,
                                }}
                                onClick={() => {
                                  setNicknameEmoji(emoji);
                                  setEmojiPickerOpen(false);
                                }}
                              >
                                {emoji}
                              </motion.button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <p
                        id="nickname-emoji-preview"
                        className="nickname-preview"
                      >
                        {nickname || t("Your nickname")} {nicknameEmoji}
                      </p>
                    </motion.div>
                    <Button type="submit" className="onboard-continue">
                      {t("Continue")}
                    </Button>
                  </motion.form>
                ) : (
                  <>
                    <motion.p className="onboard-subtitle" variants={rise}>
                      {screen === "focus"
                        ? t("choose as many as you like")
                        : lines(
                            t(
                              "here are some general daily\nactivities for you to accomplish",
                            ),
                          )}
                    </motion.p>
                    <motion.div
                      variants={listStagger}
                      className={
                        screen === "focus" ? "focus-options" : "routine-options"
                      }
                    >
                      {(screen === "focus" ? focusOptions : routineOptions).map(
                        (item) => (
                          <motion.button
                            key={item}
                            className="option"
                            variants={optionItem}
                            whileHover={{ y: -2, transition: softSpring }}
                            whileTap={{ scale: 0.975, transition: tapSpring }}
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
                          </motion.button>
                        ),
                      )}
                    </motion.div>
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
              </motion.section>
            )}
            {screen === "ready" && (
              <motion.section
                key={"ready"}
                className="ready"
                variants={screenAnim}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <motion.h1 variants={rise}>{t("You’re all set!")}</motion.h1>
                <motion.p variants={rise}>
                  {lines(
                    t(
                      "small steps, big changes\nwe’re excited to have you here",
                    ),
                  )}
                </motion.p>
                <Flower
                  name="lotus-bouquet"
                  className="ready-bouquet"
                />
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
              </motion.section>
            )}
            {screen === "today" && (
              <motion.section
                key={"today"}
                className="today-home content"
                variants={screenAnim}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <motion.header className="greeting" variants={rise}>
                  <h1>
                    {t("Good morning,")}
                    <br />
                    {nickname || "karin"} {nicknameEmoji}
                  </h1>
                  <p>{today ? formatToday(today, locale) : "\u00a0"}</p>
                </motion.header>
                <motion.button
                  className="card today-card"
                  variants={rise}
                  whileHover={cardHover}
                  whileTap={cardTap}
                  onClick={() => {
                    setDetailDate(formatDailyDate(today ?? new Date(), locale));
                    setDetailDateKey(localDateKey(today ?? new Date()));
                    go("daily", localDateKey(today ?? new Date()));
                  }}
                >
                  <span className="card-label">{t("Today’s progress")}</span>
                  <div className="today-value">
                    <strong>
                      <Counter value={percent} />%
                    </strong>
                    <Flower name="lotus-bloom" />
                  </div>
                  <Bar value={percent} />
                  <div className="streak">
                    <span>{t("Current Streak")}</span>
                    <p>
                      <strong>
                        <Counter
                          value={
                            habits.length === 0
                              ? 0
                              : edited
                                ? habits.some((h) => h.done)
                                  ? 1
                                  : 0
                                : 12
                          }
                        />
                      </strong>{" "}
                      {t("days")}
                    </p>
                  </div>
                  <motion.span
                    className="see-detail"
                  >
                    {t("See detail")} <ChevronRight size={13} />
                  </motion.span>
                </motion.button>
                <motion.button
                  className="card today-ritual-preview"
                  variants={rise}
                  whileHover={cardHover}
                  whileTap={cardTap}
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
                    <motion.div
                      className="today-ritual-list"
                      variants={listStagger}
                    >
                      {ritualGroups.slice(0, 3).map(({ name, activities }) => (
                        <motion.span
                          className="today-ritual-row"
                          key={name}
                          variants={optionItem}
                        >
                          <strong>{t(name)}</strong>
                          <small>
                            {activities.filter((habit) => habit.done).length}/
                            {activities.length}
                          </small>
                        </motion.span>
                      ))}
                      {ritualGroups.length > 3 && (
                        <motion.span
                          className="today-ritual-more"
                          variants={optionItem}
                        >
                          {t("+{count} more", {
                            count: ritualGroups.length - 3,
                          })}
                        </motion.span>
                      )}
                    </motion.div>
                  ) : (
                    <p>
                      {t(
                        "No rituals are scheduled for today. Tap to create one.",
                      )}
                    </p>
                  )}
                </motion.button>
              </motion.section>
            )}
            {screen === "daily" && (
              <motion.section
                key={"daily"}
                className="daily content"
                variants={screenAnim}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <motion.header className="detail-heading" variants={rise}>
                  <div>
                    <h1>{detailHeading}</h1>
                    <p>{t("Daily overview")}</p>
                  </div>
                </motion.header>
                {dailyHabits.length === 0 ? (
                  <motion.p
                    className="empty-text"
                    role="status"
                    variants={rise}
                  >
                    {t(
                      isHistoricalDay
                        ? "No activity recorded for this date."
                        : "Log your activity",
                    )}
                  </motion.p>
                ) : (
                  <Ring value={dailyPercent} />
                )}
                {dailyStandaloneHabits.length > 0 &&
                  [true, false].map((done) => (
                    <motion.div
                      className="daily-group"
                      key={String(done)}
                      layout
                      variants={rise}
                      transition={softSpring}
                    >
                      <motion.h2 layout="position">
                        {t(done ? "Completed" : "Missed")}
                      </motion.h2>
                      <AnimatePresence initial={false} mode="popLayout">
                        {dailyStandaloneHabits
                          .filter((h) => h.done === done)
                          .map(renderDailyHabit)}
                      </AnimatePresence>
                      {!dailyStandaloneHabits.some((h) => h.done === done) && (
                        <motion.p
                          className="empty-text"
                          layout="position"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.16, ease: easing }}
                        >
                          {done
                            ? t("Your first small step is waiting.")
                            : t("Nothing missed. Lovely work!")}
                        </motion.p>
                      )}
                    </motion.div>
                  ))}
                <motion.section
                  className="daily-group daily-rituals"
                  aria-labelledby="daily-rituals-heading"
                  variants={rise}
                >
                  <h2 id="daily-rituals-heading">{t("Rituals")}</h2>
                  {dailyRitualGroups.length === 0 ? (
                    <p className="empty-text">
                      {t("No rituals are scheduled for this date.")}
                    </p>
                  ) : (
                    dailyRitualGroups.map(({ name, activities }) => (
                      <motion.article
                        className="card daily-ritual-card"
                        key={name}
                        layout
                        variants={listItem}
                        transition={softSpring}
                      >
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
                            done: activities.filter((habit) => habit.done)
                              .length,
                            total: activities.length,
                          })}
                        </p>
                        {activities.map(renderDailyHabit)}
                      </motion.article>
                    ))
                  )}
                </motion.section>
                {!isHistoricalDay && dailyHabits.length > 0 && (
                  <Button
                    className="pink-button edit-progress"
                    onClick={() => {
                      setHabits((items) => {
                        const updates = new Map(
                          dailyHabits.map((habit) => [habit.id, habit]),
                        );
                        return items.map(
                          (habit) => updates.get(habit.id) || habit,
                        );
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
                  </Button>
                )}
              </motion.section>
            )}
            {screen === "progress" && progressView === "report" && (
              <motion.section
                key={"progress-report"}
                className="progress-page content"
                variants={screenAnim}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <motion.div
                  className="progress-tabs"
                  role="tablist"
                  aria-label={t("Progress type")}
                  variants={rise}
                >
                  {(["habits", "rituals"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      role="tab"
                      aria-selected={progressTab === tab}
                      className={progressTab === tab ? "is-active" : ""}
                      onClick={() => openProgressTab(tab)}
                    >
                      {progressTab === tab && (
                        <motion.span
                          layoutId="progress-tab-pill"
                          className="progress-tab-pill"
                          transition={softSpring}
                        />
                      )}
                      <span className="progress-tab-label">
                        {t(tab === "habits" ? "Habits" : "Rituals")}
                      </span>
                    </button>
                  ))}
                </motion.div>
                <motion.div className="progress-report-heading" variants={rise}>
                  <div className="progress-range">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.h1
                        key={progressRangeTitle}
                        className="progress-month"
                        variants={swapUp}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                      >
                        {progressRangeTitle}
                      </motion.h1>
                    </AnimatePresence>
                    <span className="progress-range-sub">
                      {progressRangeSub}
                    </span>
                  </div>
                  <Dropdown
                    label={t("Progress period")}
                    chevron
                    value={progressPeriod}
                    options={periodOptions}
                    onChange={(next) =>
                      openProgressReport(next as ProgressPeriod)
                    }
                  />
                </motion.div>
                {progressTab === "habits" ? (
                  <>
                    <motion.div className="stats-grid" variants={listStagger}>
                      <motion.article
                        className="card overall"
                        variants={listItem}
                        whileHover={cardHover}
                      >
                        <span>{t("Overall completion")}</span>
                        <strong>
                          <Counter value={progressReport.overall} />%
                        </strong>
                        <small>{t(progressReport.periodLabel)}</small>
                        <Flower name="lotus-blossoms" />
                      </motion.article>
                      <motion.article
                        className="card mini-stat"
                        variants={listItem}
                        whileHover={cardHover}
                      >
                        <span>{t("Current Streak")}</span>
                        <p>
                          <strong>
                            <Counter value={progressReport.currentStreak} />
                          </strong>{" "}
                          {t("days")}
                        </p>
                      </motion.article>
                      <motion.article
                        className="card mini-stat"
                        variants={listItem}
                        whileHover={cardHover}
                      >
                        <span>{t("Longest Streak")}</span>
                        <p>
                          <strong>
                            <Counter value={progressReport.longestStreak} />
                          </strong>{" "}
                          {t("days")}
                        </p>
                      </motion.article>
                    </motion.div>
                    {consistencyCards.map((s) => (
                      <motion.article
                        className="card consistency"
                        key={s.title}
                        variants={listItem}
                        whileHover={cardHover}
                      >
                        <h2>{t(s.title)}</h2>
                        <div>
                          <motion.span
                            className="habit-icon"
                          >
                            {s.icon}
                          </motion.span>
                          <p>
                            {t(s.name)}
                            <small>
                              <Counter value={s.value} />%
                            </small>
                          </p>
                          <motion.span
                            className="percentage-bubble"
                          >
                            <Counter value={s.value} />%
                          </motion.span>
                        </div>
                      </motion.article>
                    ))}
                    {topCategory && (
                      <motion.div
                        className="card insight"
                        variants={listItem}
                        whileHover={cardHover}
                      >
                        <p>
                          {lines(
                            t(
                              "You’re most consistent with\nyour {category} habits.",
                              {
                                category: t(topCategory.category).toLowerCase(),
                              },
                            ),
                          )}
                        </p>
                        <Flower name="lotus-blue-stem" />
                      </motion.div>
                    )}
                  </>
                ) : (
                  <motion.div
                    className="ritual-progress-grid"
                    variants={listStagger}
                  >
                    {ritualSummaries.length === 0 && (
                      <motion.article
                        className="card ritual-summary-empty"
                        variants={listItem}
                      >
                        <p>
                          {t(
                            "Create a ritual to see how its rhythm settles over time.",
                          )}
                        </p>
                      </motion.article>
                    )}
                    {ritualSummaries.map((summary) => (
                      <motion.article
                        className="card ritual-summary-card"
                        key={summary.title}
                        variants={listItem}
                        whileHover={cardHover}
                      >
                        <div>
                          <h2>{t(summary.title)}</h2>
                          <strong>
                            <Counter value={summary.value} />%
                          </strong>
                        </div>
                        <div className="ritual-summary-meter">
                          <span>{t(progressReport.periodLabel)}</span>
                          <p>
                            <i aria-hidden="true" />
                            {summary.days}
                          </p>
                          <Bar value={summary.value} />
                        </div>
                      </motion.article>
                    ))}
                    {ritualSummaries.length > 0 && (
                      <motion.article
                        className="card ritual-consistency-card"
                        variants={listItem}
                        whileHover={cardHover}
                      >
                        <div className="ritual-consistency-heading">
                          <h2>{t("Rituals consistency")}</h2>
                          <span>{t("Trend")}</span>
                        </div>
                        <div className="ritual-consistency-values">
                          <p>
                            <small>{t("Average completion")}</small>
                            <strong>
                              <Counter value={progressReport.average} />%
                            </strong>
                          </p>
                          <p>
                            <small>{t(progressReport.bestLabel)}</small>
                            <strong>
                              <Counter value={progressReport.best} />%
                            </strong>
                          </p>
                        </div>
                        <p className="ritual-consistency-copy">
                          {t(
                            "You’re sticking to your rituals more often over time. Keep the rhythm going.",
                          )}
                        </p>
                      </motion.article>
                    )}
                  </motion.div>
                )}
              </motion.section>
            )}
            {(screen === "calendar" ||
              (screen === "progress" && progressView === "calendar")) && (
              <motion.section
                key={screen === "progress" ? "progress-calendar" : "calendar"}
                className={`${
                  screen === "progress"
                    ? "progress-calendar-page"
                    : "calendar-page"
                } content`}
                variants={screenAnim}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <motion.header
                  className="screen-title progress-calendar-heading"
                  variants={rise}
                >
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
                </motion.header>
                <motion.article className="card calendar-card" variants={rise}>
                  <div className="month-heading">
                    <motion.button
                      onClick={() => shiftMonth(-1)}
                      aria-label={t("Previous month")}
                      whileHover={{ x: -1, transition: softSpring }}
                      whileTap={{ scale: 0.97, transition: tapSpring }}
                    >
                      <ChevronLeft size={16} />
                    </motion.button>
                    {/* The month name swaps like a page turning, not a text edit. */}
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.h2
                        key={`${year}-${month}`}
                        variants={swapUp}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                      >
                        {new Date(year, month, 1).toLocaleDateString(locale, {
                          month: "long",
                          year: "numeric",
                        })}
                      </motion.h2>
                    </AnimatePresence>
                    <motion.button
                      onClick={() => shiftMonth(1)}
                      aria-label={t("Next month")}
                      whileHover={{ x: 1, transition: softSpring }}
                      whileTap={{ scale: 0.97, transition: tapSpring }}
                    >
                      <ChevronRight size={16} />
                    </motion.button>
                  </div>
                  <div className="calendar-weekdays">
                    {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(
                      (day) => (
                        <span key={day}>{t(day)}</span>
                      ),
                    )}
                  </div>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      className="calendar-days"
                      key={`${year}-${month}`}
                      variants={calendarGrid}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      {Array.from(
                        { length: new Date(year, month, 1).getDay() },
                        (_, i) => (
                          <span key={`blank-${i}`} />
                        ),
                      )}
                      {Array.from(
                        { length: new Date(year, month + 1, 0).getDate() },
                        (_, i) => (
                          <motion.button
                            key={i}
                            variants={calendarDay}
                            whileHover={{ scale: 1.03, transition: softSpring }}
                            whileTap={{ scale: 0.97, transition: tapSpring }}
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
                                selectedDate.toLocaleDateString(locale, {
                                  weekday: "long",
                                  month: "short",
                                  day: "numeric",
                                }),
                              );
                              setDetailDateKey(localDateKey(selectedDate));
                              go("daily", localDateKey(selectedDate));
                            }}
                            aria-label={`View ${new Date(year, month, i + 1).toLocaleDateString()}`}
                          >
                            {i + 1}
                          </motion.button>
                        ),
                      )}
                    </motion.div>
                  </AnimatePresence>
                </motion.article>
                <motion.article
                  className="card month-progress"
                  variants={rise}
                  whileHover={cardHover}
                >
                  <h2>
                    {t("{month} progress", {
                      month: new Date(year, month, 1).toLocaleDateString(
                        locale,
                        {
                          month: "long",
                        },
                      ),
                    })}
                  </h2>
                  <strong>
                    <Counter value={percent} />%
                  </strong>
                  <Bar value={percent} />
                </motion.article>
              </motion.section>
            )}
            {screen === "rituals" && (
              <motion.section
                key={"rituals"}
                className="rituals content"
                variants={screenAnim}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <motion.h1 variants={rise}>{t("Rituals")}</motion.h1>
                {ritualGroups.length === 0 && (
                  <motion.div className="rituals-empty" variants={rise}>
                    <p>{t("Create your first ritual")}</p>
                  </motion.div>
                )}
                <AnimatePresence initial={false} mode="popLayout">
                  {ritualGroups.map(({ name, activities }) => (
                    <motion.article
                      className="card routine-card"
                      key={name}
                      layout
                      variants={listItem}
                      transition={softSpring}
                      whileHover={cardHover}
                    >
                      <motion.button
                        className="routine-card-heading"
                        onClick={() => openRitualEditor(name)}
                        aria-label={t("Edit {name} ritual", { name })}
                        whileTap={{ scale: 0.99, transition: tapSpring }}
                      >
                        <h2>{t(name)}</h2>
                        <p>
                          {t("{done}/{total} Completed", {
                            done: activities.filter((habit) => habit.done)
                              .length,
                            total: activities.length,
                          })}
                        </p>
                      </motion.button>
                      <motion.div
                        className="routine-activities"
                        variants={listStagger}
                      >
                        {activities.map((h) => (
                          <motion.button
                            key={h.id}
                            className="routine-activity"
                            variants={optionItem}
                            whileHover={{ x: 3, transition: softSpring }}
                            whileTap={{ scale: 0.97, transition: tapSpring }}
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
                          </motion.button>
                        ))}
                      </motion.div>
                    </motion.article>
                  ))}
                </AnimatePresence>
              </motion.section>
            )}
            {screen === "profile" && (
              <motion.section
                key={"profile"}
                className="profile-page content"
                variants={screenAnim}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <motion.div className="profile-hero" variants={rise}>
                  <motion.div
                    className={`profile-avatar ${profilePhoto ? "has-photo" : ""}`}
                  >
                    {profilePhoto ? (
                      <img
                        src={profilePhoto}
                        alt={t("Profile photo of {name}", { name: username })}
                      />
                    ) : (
                      <span aria-hidden="true" />
                    )}
                  </motion.div>
                  <motion.button
                    className="profile-change"
                    onClick={() => setModal("photo")}
                    whileHover={{ y: -1, transition: softSpring }}
                    whileTap={{ scale: 0.94, transition: tapSpring }}
                  >
                    {t("Change")}
                  </motion.button>
                </motion.div>
                <motion.section
                  className="profile-section"
                  aria-labelledby="personal-information"
                  variants={rise}
                >
                  <h1 id="personal-information">{t("Personal Information")}</h1>
                  <motion.div className="profile-group" variants={listStagger}>
                    <motion.button
                      className="profile-row"
                      variants={optionItem}
                      whileHover={rowHover}
                      whileTap={rowTap}
                      onClick={() => {
                        setProfileDraft({ username, email });
                        setModal("editProfile");
                      }}
                    >
                      <span>{t("Username")}</span>
                      <strong>{username}</strong>
                    </motion.button>
                    <motion.button
                      className="profile-row"
                      variants={optionItem}
                      whileHover={rowHover}
                      whileTap={rowTap}
                      onClick={() => {
                        setProfileDraft({ username, email });
                        setModal("editProfile");
                      }}
                    >
                      <span>{t("Email")}</span>
                      <strong>{email}</strong>
                    </motion.button>
                  </motion.div>
                </motion.section>
                <motion.section
                  className="profile-section"
                  aria-labelledby="profile-subscription"
                  variants={rise}
                >
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
                </motion.section>
                <Button
                  className="profile-signout"
                  onClick={() => setModal("signOut")}
                >
                  {t("Sign Out")}
                </Button>
              </motion.section>
            )}
            {screen === "subscription" && (
              <motion.section
                key={"subscription"}
                className="subscription-page content"
                variants={screenAnim}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <motion.header className="subscription-hero" variants={rise}>
                  <span>{brand("Odette Plus")}</span>
                  <h1>{t("Room to grow, gently")}</h1>
                  <p>
                    {t(
                      "Keep every ritual, every memory, and every quiet win with a plan that fits your pace.",
                    )}
                  </p>
                </motion.header>

                <motion.div
                  className={`plan-status ${activePlan ? "is-active" : ""}`}
                  role="status"
                  variants={rise}
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
                </motion.div>

                <motion.section
                  className="subscription-section"
                  aria-labelledby="choose-plan"
                  variants={rise}
                >
                  <h2 id="choose-plan">{t("Choose your plan")}</h2>
                  <motion.div
                    className="plan-list"
                    role="radiogroup"
                    aria-label={t("Subscription plans")}
                    variants={listStagger}
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
                          variants={listItem}
                          whileHover={cardHover}
                          whileTap={{ scale: 0.982, transition: tapSpring }}
                        >
                          {plan.highlight && (
                            <motion.span
                              className="plan-badge"
                            >
                              {current ? t("Current plan") : t(plan.highlight)}
                            </motion.span>
                          )}
                          <motion.span
                            className="plan-mark"
                            aria-hidden="true"
                            animate={{ scale: selected ? 1.04 : 1 }}
                            transition={{ duration: 0.15, ease: easing }}
                          >
                            <Check size={13} strokeWidth={3} />
                          </motion.span>
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
                            {saving > 0 && (
                              <em>
                                {t("Save {percent}%", { percent: saving })}
                              </em>
                            )}
                          </span>
                        </motion.button>
                      );
                    })}
                  </motion.div>
                </motion.section>

                <motion.section
                  className="subscription-section"
                  aria-labelledby="plan-benefits"
                  variants={rise}
                >
                  <h2 id="plan-benefits">{t("What’s included")}</h2>
                  <motion.ul className="benefit-group" variants={listStagger}>
                    {planBenefits.map(([title, note]) => (
                      <motion.li key={title} variants={optionItem}>
                        <span className="benefit-mark" aria-hidden="true">
                          <Sparkles size={14} strokeWidth={1.8} />
                        </span>
                        <span>
                          <strong>{t(title)}</strong>
                          <small>{t(note)}</small>
                        </span>
                      </motion.li>
                    ))}
                  </motion.ul>
                </motion.section>

                <motion.div className="subscription-actions" variants={rise}>
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
                    <motion.button
                      type="button"
                      className="subscription-cancel"
                      onClick={() => setModal("cancelPlan")}
                      whileHover={{ y: -1, transition: softSpring }}
                      whileTap={{ scale: 0.97, transition: tapSpring }}
                    >
                      {t("Cancel subscription")}
                    </motion.button>
                  )}
                  <p className="subscription-fine">
                    {t(
                      "Preview pricing in IDR. No payment is taken in this prototype. Plans renew automatically and you can stop anytime.",
                    )}
                  </p>
                </motion.div>
              </motion.section>
            )}
            {screen === "help" && (
              <motion.section
                key={"help"}
                className="settings-page content"
                variants={screenAnim}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <motion.header className="settings-hero" variants={rise}>
                  <span>{brand("Odette")}</span>
                  <h1>{t("Help & Settings")}</h1>
                  <p>{t("Shape a calmer space for your everyday rituals.")}</p>
                </motion.header>

                <motion.section
                  className="settings-section"
                  aria-labelledby="settings-preferences"
                  variants={rise}
                >
                  <h2 id="settings-preferences">{t("Preferences")}</h2>
                  <motion.div className="settings-group" variants={listStagger}>
                    <motion.div
                      className="settings-row settings-select-row"
                      variants={optionItem}
                    >
                      <span>
                        <strong>{t("Language")}</strong>
                        <small>{t("Set your preferred app language.")}</small>
                      </span>
                      <span className="settings-value">
                        <Dropdown
                          label={t("Language")}
                          value={language}
                          options={languageOptions}
                          onChange={(next) => {
                            setLanguage(next as Language);
                            setToast(
                              makeTranslator(next as Language)(
                                "Language changed to {language}.",
                                {
                                  language: makeTranslator(next as Language)(
                                    next,
                                  ),
                                },
                              ),
                            );
                          }}
                        />
                        <ChevronDown size={16} aria-hidden="true" />
                      </span>
                    </motion.div>
                    <motion.button
                      type="button"
                      className="settings-row"
                      variants={optionItem}
                      whileHover={rowHover}
                      whileTap={rowTap}
                      onClick={() => go("profile")}
                    >
                      <span>
                        <strong>{t("Account & profile")}</strong>
                        <small>
                          {t("Update your name, email, and photo.")}
                        </small>
                      </span>
                      <ChevronRight size={18} aria-hidden="true" />
                    </motion.button>
                  </motion.div>
                </motion.section>

                <motion.section
                  className="settings-section"
                  aria-labelledby="settings-shortcuts"
                  variants={rise}
                >
                  <h2 id="settings-shortcuts">{t("Quick actions")}</h2>
                  <motion.div className="settings-group" variants={listStagger}>
                    <motion.button
                      type="button"
                      className="settings-row"
                      variants={optionItem}
                      whileHover={rowHover}
                      whileTap={rowTap}
                      onClick={() => go("rituals")}
                    >
                      <span>
                        <strong>{t("Manage rituals")}</strong>
                        <small>
                          {t("Create, rename, or remove a ritual.")}
                        </small>
                      </span>
                      <ChevronRight size={18} aria-hidden="true" />
                    </motion.button>
                    <motion.button
                      type="button"
                      className="settings-row"
                      variants={optionItem}
                      whileHover={rowHover}
                      whileTap={rowTap}
                      onClick={() => go("progress")}
                    >
                      <span>
                        <strong>{t("Review progress")}</strong>
                        <small>
                          {t("See your calendar and completion trends.")}
                        </small>
                      </span>
                      <ChevronRight size={18} aria-hidden="true" />
                    </motion.button>
                  </motion.div>
                </motion.section>

                <motion.section
                  className="settings-section"
                  aria-labelledby="settings-help"
                  variants={rise}
                >
                  <h2 id="settings-help">{t("Help")}</h2>
                  <motion.div
                    className="settings-group settings-faq"
                    variants={listStagger}
                  >
                    <Disclosure
                      title={t("What are today’s rituals?")}
                      hint={t("See what is planned for the current day.")}
                    >
                      {t(
                        "Today shows rituals that match the date and their frequency. Morning and Night are time ranges, not required ritual names.",
                      )}
                    </Disclosure>
                    <Disclosure
                      title={t("How do I change a ritual?")}
                      hint={t("Edit its name, activities, or schedule.")}
                    >
                      {t(
                        "Open Rituals, choose any ritual card, then save your changes or use Delete Ritual at the bottom of the sheet.",
                      )}
                    </Disclosure>
                    <Disclosure
                      title={t("Where is my data saved?")}
                      hint={t("Your preview stays on this device.")}
                    >
                      {t(
                        "This preview uses local browser storage. Cloud sync and account recovery are not connected yet.",
                      )}
                    </Disclosure>
                  </motion.div>
                </motion.section>
              </motion.section>
            )}
          </AnimatePresence>
          {/* The FAB lives outside the screens: a screen that animates its own
            transform or filter would become the containing block for it. */}
          <AnimatePresence>
            {(screen === "today" || screen === "rituals") && (
              <motion.button
                key="add-fab"
                className="add-fab"
                aria-label={t(
                  screen === "today" ? "Add activity" : "Add ritual",
                )}
                onClick={screen === "today" ? openAddActivity : openAddRitual}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: overlayEnter }}
                exit={{
                  opacity: 0,
                  transition: overlayExit,
                }}
                whileHover={{ scale: 1.02, transition: softSpring }}
                whileTap={{ scale: 0.96, transition: tapSpring }}
              >
                <Plus size={32} strokeWidth={1.2} />
              </motion.button>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {menu && (
              <div className="menu-layer">
                <motion.button
                  className="scrim"
                  aria-label={t("Close navigation")}
                  tabIndex={-1}
                  onClick={() => setMenu(false)}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    transition: reduced ? { duration: 0.1 } : menuReveal,
                  }}
                  exit={{
                    opacity: 0,
                    transition: reduced ? { duration: 0.1 } : menuClose,
                  }}
                />
                <motion.div
                  className="menu-panel"
                  id="main-menu"
                  ref={menuRef}
                  initial={
                    reduced
                      ? { opacity: 0 }
                      : {
                          clipPath: "inset(0% 0% 100% 100% round 22px)",
                          opacity: 1,
                        }
                  }
                  animate={
                    reduced
                      ? { opacity: 1, transition: { duration: 0.1 } }
                      : {
                          clipPath: "inset(0% 0% 0% 0% round 22px)",
                          opacity: 1,
                          transition: menuReveal,
                        }
                  }
                  exit={
                    reduced
                      ? { opacity: 0, transition: { duration: 0.1 } }
                      : {
                          clipPath: "inset(0% 0% 100% 100% round 22px)",
                          opacity: 0,
                          transition: menuClose,
                        }
                  }
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
                  ).map(([name, target]) => (
                    <button
                      key={name}
                      onClick={() => go(target)}
                    >
                      {t(name)}
                    </button>
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
                  <motion.form
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
                          scheduledDate: todayKey || localDateKey(new Date()),
                        },
                      ]);
                      setEdited(true);
                      setModal(null);
                      setToast(t("Activity added to today."));
                    }}
                  >
                    <motion.input
                      placeholder={t("Activity Name")}
                      aria-label={t("Activity Name")}
                      value={activityName}
                      onChange={(e) => setActivityName(e.target.value)}
                      required
                      maxLength={60}
                    />
                    <motion.div className="select-field">
                      <Dropdown
                        label={t("Category")}
                        value={activityCategory}
                        options={activityCategoryOptions}
                        onChange={setActivityCategory}
                      />
                      <ChevronDown size={16} />
                    </motion.div>
                    <motion.div className="select-field">
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
                    </motion.div>
                    <Button type="submit">
                      {t(modal === "editActivity" ? "Save Changes" : "Add")}
                    </Button>
                    {modal === "editActivity" && editingActivityId && (
                      <motion.button
                        type="button"
                        className="delete-ritual"
                        whileHover={{ y: -1, transition: softSpring }}
                        whileTap={{ scale: 0.97, transition: tapSpring }}
                        onClick={() => {
                          setHabits((items) =>
                            items.filter(
                              (habit) => habit.id !== editingActivityId,
                            ),
                          );
                          setDraft((items) =>
                            items.filter(
                              (habit) => habit.id !== editingActivityId,
                            ),
                          );
                          setEdited(true);
                          setModal(null);
                          setToast(t("Activity deleted."));
                        }}
                      >
                        {t("Delete Activity")}
                      </motion.button>
                    )}
                  </motion.form>
                )}
                {modal === "addRitual" && (
                  <motion.form
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
                        setToast(
                          t("Add at least one activity to this ritual."),
                        );
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
                    <motion.input
                      placeholder={t("Ritual Name")}
                      aria-label={t("Ritual Name")}
                      value={ritualName}
                      onChange={(e) => setRitualName(e.target.value)}
                      required
                      maxLength={60}
                    />
                    <motion.div className="form-field-label">
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
                    </motion.div>
                    <motion.div className="ritual-select-grid">
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
                    </motion.div>
                    <motion.div className="activities-editor">
                      <span className="form-field-label">{t("Activity")}</span>
                      <div className="activity-chips">
                        <AnimatePresence initial={false} mode="popLayout">
                          {ritualActivities.map((activity) => (
                            <motion.button
                              key={activity.id}
                              type="button"
                              className="activity-chip"
                              layout
                              variants={chipItem}
                              initial="initial"
                              animate="animate"
                              exit="exit"
                              whileHover={{ y: -1, transition: softSpring }}
                              whileTap={{ scale: 0.92, transition: tapSpring }}
                              onClick={() =>
                                setRitualActivities((items) =>
                                  items.filter(
                                    (item) => item.id !== activity.id,
                                  ),
                                )
                              }
                            >
                              {activity.name}
                              <X size={11} aria-hidden="true" />
                            </motion.button>
                          ))}
                        </AnimatePresence>
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
                        <motion.button
                          type="button"
                          aria-label={t("Add activity")}
                          whileHover={{ scale: 1.03, transition: softSpring }}
                          whileTap={{ scale: 0.97, transition: tapSpring }}
                          onClick={addDraftActivity}
                        >
                          <Plus size={17} />
                        </motion.button>
                      </div>
                    </motion.div>
                    <Button type="submit">{t("Add")}</Button>
                  </motion.form>
                )}
                {modal === "editRitual" && (
                  <motion.form
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
                    <motion.label className="form-field-label">
                      {t("Ritual Name")}
                      <input
                        value={ritualName}
                        onChange={(e) => setRitualName(e.target.value)}
                        maxLength={60}
                        required
                      />
                    </motion.label>
                    <motion.div className="form-field-label">
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
                    </motion.div>
                    <motion.div className="ritual-select-grid">
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
                    </motion.div>
                    <motion.div className="activities-editor">
                      <span className="form-field-label">
                        {t("Activities")}
                      </span>
                      <div className="activity-chips">
                        <AnimatePresence initial={false} mode="popLayout">
                          {ritualActivities.map((activity) => (
                            <motion.button
                              key={activity.id}
                              type="button"
                              className="activity-chip"
                              layout
                              variants={chipItem}
                              initial="initial"
                              animate="animate"
                              exit="exit"
                              whileHover={{ y: -1, transition: softSpring }}
                              whileTap={{ scale: 0.92, transition: tapSpring }}
                              onClick={() =>
                                setRitualActivities((activities) =>
                                  activities.filter(
                                    (item) => item.id !== activity.id,
                                  ),
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
                            </motion.button>
                          ))}
                        </AnimatePresence>
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
                        <motion.button
                          type="button"
                          aria-label={t("Add activity")}
                          whileHover={{ scale: 1.03, transition: softSpring }}
                          whileTap={{ scale: 0.97, transition: tapSpring }}
                          onClick={addDraftActivity}
                        >
                          <Plus size={17} />
                        </motion.button>
                      </div>
                    </motion.div>
                    <Button type="submit">{t("Save Changes")}</Button>
                    <motion.button
                      type="button"
                      className="delete-ritual"
                      whileHover={{ y: -1, transition: softSpring }}
                      whileTap={{ scale: 0.97, transition: tapSpring }}
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
                    </motion.button>
                  </motion.form>
                )}
                {modal === "photo" && (
                  <motion.div className="profile-sheet-actions">
                    {profilePhoto ? (
                      <motion.button
                        type="button"
                        className="profile-action danger-action"
                        whileHover={{ y: -2, transition: softSpring }}
                        whileTap={{ scale: 0.98, transition: tapSpring }}
                        onClick={() => {
                          setProfilePhoto("");
                          setModal(null);
                          setToast(t("Profile photo removed."));
                        }}
                      >
                        <Trash2 size={19} aria-hidden="true" />
                        {t("Remove photo")}
                      </motion.button>
                    ) : (
                      <>
                        <motion.button
                          type="button"
                          className="profile-action"
                          whileHover={{ y: -2, transition: softSpring }}
                          whileTap={{ scale: 0.98, transition: tapSpring }}
                          onClick={() => uploadInput.current?.click()}
                        >
                          <Upload size={19} aria-hidden="true" />
                          {t("Upload from device")}
                        </motion.button>
                        <motion.button
                          type="button"
                          className="profile-action"
                          whileHover={{ y: -2, transition: softSpring }}
                          whileTap={{ scale: 0.98, transition: tapSpring }}
                          onClick={() => cameraInput.current?.click()}
                        >
                          <Camera size={19} aria-hidden="true" />
                          {t("Take photo")}
                        </motion.button>
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
                  </motion.div>
                )}
                {modal === "editProfile" && (
                  <motion.form
                    className="profile-edit-form"
                    onSubmit={(event) => {
                      event.preventDefault();
                      setUsername(profileDraft.username.trim());
                      setEmail(profileDraft.email.trim());
                      setModal(null);
                      setToast(t("Personal information saved."));
                    }}
                  >
                    <motion.label className="form-field-label">
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
                    </motion.label>
                    <motion.label className="form-field-label">
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
                    </motion.label>
                    <Button type="submit">{t("Save Changes")}</Button>
                  </motion.form>
                )}
                {modal === "subscribe" && (
                  <motion.div className="plan-sheet">
                    <motion.div className="plan-sheet-summary">
                      <strong>{t(chosenPlan.name)}</strong>
                      <b>{rupiah(chosenPlan.price)}</b>
                      <small>
                        {chosenPlan.months === 1
                          ? t("Billed every month")
                          : t(
                              "Billed once every {months} months · {price} / mo",
                              {
                                months: chosenPlan.months,
                                price: rupiah(
                                  chosenPlan.price / chosenPlan.months,
                                ),
                              },
                            )}
                      </small>
                    </motion.div>
                    <motion.p className="plan-sheet-note">
                      {activePlan
                        ? t(
                            "Your {name} plan will be replaced and the new period starts today.",
                            { name: t(activePlan.name) },
                          )
                        : t(
                            "Your plan starts today and renews automatically. No real payment is taken in this preview.",
                          )}
                    </motion.p>
                    <Button onClick={() => startPlan(chosenPlan.id)}>
                      {t(activePlan ? "Switch plan" : "Activate plan")}
                    </Button>
                    <motion.button
                      type="button"
                      className="plan-sheet-dismiss"
                      whileHover={{ y: -1, transition: softSpring }}
                      whileTap={{ scale: 0.97, transition: tapSpring }}
                      onClick={closeModal}
                    >
                      {t("Not now")}
                    </motion.button>
                  </motion.div>
                )}

                {modal === "cancelPlan" && (
                  <div className="confirmation-content">
                    <p>
                      {brand(
                        t(
                          "Cancel Odette Plus? You’ll keep access until {date}.",
                          {
                            date: renewsOn || t("the end of this period"),
                          },
                        ),
                      )}
                    </p>
                    <motion.div className="confirmation-actions">
                      <motion.button
                        type="button"
                        whileHover={{ y: -2, transition: softSpring }}
                        whileTap={{ scale: 0.97, transition: tapSpring }}
                        onClick={closeModal}
                      >
                        {t("Keep plan")}
                      </motion.button>
                      <motion.button
                        type="button"
                        className="confirm-signout"
                        whileHover={{ y: -2, transition: softSpring }}
                        whileTap={{ scale: 0.97, transition: tapSpring }}
                        onClick={() => {
                          setPlanId(null);
                          setPlanStarted("");
                          setModal(null);
                          setToast(
                            t("Subscription cancelled. You’re on Odette Free."),
                          );
                        }}
                      >
                        {t("Yes, cancel")}
                      </motion.button>
                    </motion.div>
                  </div>
                )}

                {modal === "signOut" && (
                  <div className="confirmation-content">
                    <p>{t("Are you sure you want to sign out?")}</p>
                    <motion.div className="confirmation-actions">
                      <motion.button
                        type="button"
                        whileHover={{ y: -2, transition: softSpring }}
                        whileTap={{ scale: 0.97, transition: tapSpring }}
                        onClick={closeModal}
                      >
                        {t("No")}
                      </motion.button>
                      <motion.button
                        type="button"
                        className="confirm-signout"
                        whileHover={{ y: -2, transition: softSpring }}
                        whileTap={{ scale: 0.97, transition: tapSpring }}
                        onClick={() => {
                          setModal(null);
                          setAuthFirstName("");
                          setAuthLastName("");
                          setAuthEmail("");
                          go("welcome");
                        }}
                      >
                        {t("Yes, sign out")}
                      </motion.button>
                    </motion.div>
                  </div>
                )}

                {modal === "google" && (
                  <div className="help-content">
                    <p>
                      {t("Google sign-in isn’t connected in this preview yet.")}
                    </p>
                    <p>
                      {brand(
                        t(
                          "You can still explore Odette and keep your rituals on this device.",
                        ),
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
                  animate={{
                    opacity: 1,
                    transition: reduced ? { duration: 0.1 } : overlayEnter,
                  }}
                  exit={{
                    opacity: 0,
                    transition: reduced ? { duration: 0.1 } : overlayExit,
                  }}
                />
                <motion.section
                  className="completion-sheet"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="completion-title"
                  initial={reduced ? false : sheetHidden}
                  animate={reduced ? sheetStill : sheetShown}
                  exit={reduced ? sheetStill : sheetLeaving}
                >
                  <h2 id="completion-title">{t("You’re all done")}</h2>
                  <p>{t("Today looked good on you")}</p>
                  <Flower
                    name="lotus-bouquet"
                    className="completion-flower"
                  />
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
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0, transition: softSpring }}
                exit={{
                  opacity: 0,
                  y: 4,
                  transition: { duration: 0.18, ease: exitEasing },
                }}
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
