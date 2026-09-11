"use client";
import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  AnimatePresence,
  motion,
  MotionConfig,
  useReducedMotion,
} from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Flower2,
  Plus,
  Smile,
  Sparkles,
  X,
} from "lucide-react";
import {
  completion,
  dailyIds,
  isHabit,
  seedHabits,
  toggleHabit,
  type Habit,
} from "@/lib/habits";
import { useOdetteTools } from "@/lib/use-odette-tools";
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
] as const;
type Screen = (typeof screens)[number];
type Modal =
  | "add"
  | "editProgress"
  | "editRitual"
  | "help"
  | "google"
  | "done"
  | null;
type ProgressTab = "habits" | "rituals";
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
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09A6.61 6.61 0 0 1 5.49 12c0-.72.12-1.42.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.93l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
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
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <motion.button
      type={type}
      className={`primary ${className}`}
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
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
  return (
    <div
      className="progress-track"
      role="progressbar"
      aria-label="Completion"
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
  const reduced = useReducedMotion();
  return (
    <div className="ring-wrap">
      <div
        className="ring"
        role="progressbar"
        aria-label="Daily completion"
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
          <span>DONE</span>
        </div>
      </div>
      <p>{value === 100 ? "Beautifully done!" : "Good day!"}</p>
    </div>
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
        aria-label="Close dialog"
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
            aria-label="Close dialog"
            onClick={onClose}
            className="circle-button"
          >
            <X size={16} />
          </button>
          <h2>{title}</h2>
        </header>
        {children}
      </motion.div>
    </div>
  );
}
export default function Home() {
  const [screen, setScreen] = useState<Screen>("welcome"),
    [nickname, setNickname] = useState(""),
    [focus, setFocus] = useState<string[]>([
      "Mental Wellness",
      "Self Care",
      "Better Sleep",
    ]),
    [selected, setSelected] = useState<string[]>(["Drink Water"]),
    [habits, setHabits] = useState<Habit[]>(seedHabits),
    [edited, setEdited] = useState(false),
    [loaded, setLoaded] = useState(false),
    [menu, setMenu] = useState(false),
    [modal, setModal] = useState<Modal>(null),
    [progressTab, setProgressTab] = useState<ProgressTab>("habits"),
    [month, setMonth] = useState(5),
    [year, setYear] = useState(2020),
    [detailDate, setDetailDate] = useState("Tuesday, Sep 1"),
    [toast, setToast] = useState(""),
    [draft, setDraft] = useState<Habit[]>([]),
    [editingRoutine, setEditingRoutine] = useState<Routine>("Morning"),
    [ritualCategory, setRitualCategory] = useState("Wellness"),
    [ritualFrequency, setRitualFrequency] = useState("Every day"),
    [ritualTime, setRitualTime] = useState("Morning"),
    [ritualActivities, setRitualActivities] = useState<Habit[]>([]),
    [newActivity, setNewActivity] = useState("");
  const menuRef = useRef<HTMLDivElement>(null),
    menuButton = useRef<HTMLButtonElement>(null);
  useOdetteTools(habits, edited, setHabits, setEdited);
  const closeModal = useCallback(() => setModal(null), []);
  function go(next: Screen) {
    setScreen(next);
    setMenu(false);
    window.history.pushState({}, "", `?screen=${next}`);
    window.scrollTo(0, 0);
  }
  useEffect(() => {
    const readScreen = () => {
      const v = new URLSearchParams(window.location.search).get("screen");
      setScreen(screens.includes(v as Screen) ? (v as Screen) : "welcome");
    };
    readScreen();
    window.addEventListener("popstate", readScreen);
    try {
      const s = JSON.parse(localStorage.getItem("odette-local-v1") || "null");
      if (s) {
        if (typeof s.nickname === "string") setNickname(s.nickname);
        if (Array.isArray(s.habits) && s.habits.every(isHabit))
          setHabits(s.habits);
        if (typeof s.edited === "boolean") setEdited(s.edited);
        if (Array.isArray(s.focus))
          setFocus(s.focus.filter((v: unknown) => typeof v === "string"));
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
          JSON.stringify({ nickname, focus, habits, edited }),
        );
      } catch {
        setToast("This browser could not save changes. Keep this tab open.");
      }
  }, [nickname, focus, habits, edited, loaded]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 5000);
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
  const percent = completion(habits, edited),
    appShell = [
      "today",
      "daily",
      "progress",
      "calendar",
      "rituals",
      "profile",
    ].includes(screen);
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
  const openEditProgress = () => {
    setDraft(habits.map((h) => ({ ...h })));
    setModal("editProgress");
  };
  const openRitualEditor = (routine: Routine) => {
    const activities = habits.filter((habit) => habit.routine === routine);
    setEditingRoutine(routine);
    setRitualCategory("Wellness");
    setRitualFrequency(activities[0]?.frequency || "Every day");
    setRitualTime(routine);
    setRitualActivities(activities.map((habit) => ({ ...habit })));
    setNewActivity("");
    setModal("editRitual");
  };
  const addDraftActivity = () => {
    const name = newActivity.trim();
    if (!name) return;
    setRitualActivities((activities) => [
      ...activities,
      {
        id: crypto.randomUUID(),
        name,
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
  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ duration: 0.45, ease: easing }}
    >
      <main className={`app screen-${screen}`}>
        {appShell && (
          <>
            <Flower name="lotus-leaf-stem" className="today-flower" />
            <nav className="topbar" aria-label="Page navigation">
              {screen !== "today" ? (
                <button
                  aria-label="Back to Today"
                  className="back-button"
                  onClick={() => go("today")}
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
            <div className="welcome-plant">
              <Flower name="lotus-bloom-stem" className="welcome-stem" />
              <Flower name="lotus-open" className="welcome-head" />
            </div>
            <p className="motto">
              small routines,
              <br />
              <span>softer</span> days
            </p>
            <div className="welcome-actions">
              <Button onClick={() => go("signup")}>Get started</Button>
              <p>
                Already have an account?{" "}
                <button onClick={() => go("login")}>Log in</button>
              </p>
            </div>
          </section>
        )}
        {(screen === "signup" || screen === "login") && (
          <section className={`auth ${screen}`}>
            <button
              className="auth-back"
              aria-label="Back to welcome"
              onClick={() => go("welcome")}
            >
              <ArrowLeft size={18} />
            </button>
            <Flower name="lotus-bud" className="auth-bud" />
            <h1>{screen === "signup" ? "Create an account" : "Log in"}</h1>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                go(screen === "signup" ? "name" : "today");
              }}
            >
              {screen === "signup" && (
                <>
                  <input
                    aria-label="First name"
                    placeholder="First name"
                    autoComplete="given-name"
                    required
                    onChange={(e) => setNickname(e.target.value)}
                  />
                  <input
                    aria-label="Last name"
                    placeholder="Last name"
                    autoComplete="family-name"
                    required
                  />
                </>
              )}
              <input
                aria-label="Email"
                placeholder="Email"
                type="email"
                autoComplete="email"
                required
              />
              <input
                aria-label="Password"
                placeholder="Password"
                type="password"
                autoComplete={
                  screen === "signup" ? "new-password" : "current-password"
                }
                minLength={6}
                required
              />
              <div className="divider">
                <span />
                Or
                <span />
              </div>
              <Button className="google" onClick={() => setModal("google")}>
                <GoogleLogo />
                Continue with Google
              </Button>
              <Button type="submit" className="auth-submit">
                {screen === "signup" ? "Create account" : "Log in"}
              </Button>
              <p className="local-note">
                Local preview · no account is created
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
              Step {screen === "name" ? 1 : screen === "focus" ? 2 : 3} of 3
            </p>
            <h1>
              {screen === "name" ? (
                <>
                  What do you want to
                  <br />
                  be called?
                </>
              ) : screen === "focus" ? (
                <>
                  What would you like
                  <br />
                  to focus on?
                </>
              ) : (
                <>
                  Let’s build your first
                  <br />
                  routine!
                </>
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
                <div className="nickname-field">
                  <input
                    aria-label="Nick name"
                    placeholder="Nick name"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    maxLength={30}
                    required
                  />
                  <Smile aria-hidden="true" size={19} strokeWidth={1.7} />
                </div>
                <Button type="submit" className="onboard-continue">
                  Continue
                </Button>
              </form>
            ) : (
              <>
                <p className="onboard-subtitle">
                  {screen === "focus" ? (
                    "choose as many as you like"
                  ) : (
                    <>
                      here are some general daily
                      <br />
                      activities for you to accomplish
                    </>
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
                        <span>{item}</span>
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
                    else if (!selected.length)
                      setToast("Choose at least one ritual to begin.");
                    else go("ready");
                  }}
                >
                  Continue
                </Button>
              </>
            )}
          </section>
        )}
        {screen === "ready" && (
          <section className="ready">
            <h1>You’re all set!</h1>
            <p>
              small steps, big changes
              <br />
              we’re excited to have you here
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
              Go to Today
            </Button>
          </section>
        )}
        {screen === "today" && (
          <section className="today-home content">
            <header className="greeting">
              <h1>
                Good morning,
                <br />
                {nickname || "karin"} <Flower2 size={24} strokeWidth={1.3} />
              </h1>
              <p>Tuesday, 1st September 2026</p>
            </header>
            <button
              className="card today-card"
              onClick={() => {
                setDetailDate("Tuesday, Sep 1");
                go("daily");
              }}
            >
              <span className="card-label">Today’s progress</span>
              <div className="today-value">
                <strong>{percent}%</strong>
                <Flower name="lotus-bloom" />
              </div>
              <Bar value={percent} />
              <div className="streak">
                <span>Current Streak</span>
                <p>
                  <strong>
                    {edited ? (habits.some((h) => h.done) ? 1 : 0) : 12}
                  </strong>{" "}
                  days
                </p>
              </div>
              <span className="see-detail">
                See detail <ChevronRight size={13} />
              </span>
            </button>
            <button
              className="card morning-preview"
              onClick={() => go("rituals")}
            >
              <h2>Morning Routine</h2>
              <p>
                {habits.filter((h) => h.routine === "Morning" && h.done).length}
                /{habits.filter((h) => h.routine === "Morning").length}{" "}
                Completed
              </p>
            </button>
          </section>
        )}
        {screen === "daily" && (
          <section className="daily content">
            <header className="detail-heading">
              <div>
                <h1>{detailDate}</h1>
                <p>Daily overview</p>
              </div>
              <button
                aria-label="Close daily overview"
                className="circle-button"
                onClick={() => go("today")}
              >
                <X size={16} />
              </button>
            </header>
            <Ring value={percent} />
            {[true, false].map((done) => (
              <div className="daily-group" key={String(done)}>
                <h2>{done ? "Completed" : "Missed"}</h2>
                {habits
                  .filter(
                    (h) =>
                      (edited || dailyIds.includes(h.id)) && h.done === done,
                  )
                  .map((h) => (
                    <button
                      className="daily-habit"
                      key={h.id}
                      onClick={() => toggle(h.id)}
                      aria-label={`${h.done ? "Uncheck" : "Complete"} ${h.name}`}
                    >
                      <Dot tick checked={h.done} />
                      <span>{h.name}</span>
                    </button>
                  ))}
                {!habits.some(
                  (h) => (edited || dailyIds.includes(h.id)) && h.done === done,
                ) && (
                  <p className="empty-text">
                    {done
                      ? "Your first small step is waiting."
                      : "Nothing missed. Lovely work!"}
                  </p>
                )}
              </div>
            ))}
            <Button
              className="pink-button edit-progress"
              onClick={openEditProgress}
            >
              Edit today’s progress
            </Button>
          </section>
        )}
        {screen === "progress" && (
          <section className="progress-page content">
            <div className="progress-tabs" role="tablist" aria-label="Progress type">
              {(["habits", "rituals"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={progressTab === tab}
                  className={progressTab === tab ? "is-active" : ""}
                  onClick={() => setProgressTab(tab)}
                >
                  {tab === "habits" ? "Habits" : "Rituals"}
                </button>
              ))}
            </div>
            <h1 className="progress-month">June 2020</h1>
            {progressTab === "habits" ? (
              <>
                <div className="stats-grid">
                  <article className="card overall">
                    <span>Overall completion</span>
                    <strong>{percent}%</strong>
                    <small>This Month</small>
                    <Flower name="lotus-blossoms" />
                  </article>
                  <article className="card mini-stat">
                    <span>Current Streak</span>
                    <p>
                      <strong>
                        {edited ? (habits.some((h) => h.done) ? 1 : 0) : 12}
                      </strong>{" "}
                      days
                    </p>
                  </article>
                  <article className="card mini-stat">
                    <span>Longest Streak</span>
                    <p>
                      <strong>
                        {edited ? (habits.some((h) => h.done) ? 1 : 0) : 12}
                      </strong>{" "}
                      days
                    </p>
                  </article>
                </div>
                {[
                  {
                    title: "Most consistent",
                    name: "Skincare",
                    value: 82,
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
                    value: 32,
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
                    <h2>{s.title}</h2>
                    <div>
                      <span className="habit-icon">{s.icon}</span>
                      <p>
                        {s.name}
                        <small>{s.value}%</small>
                      </p>
                      <span className="percentage-bubble">{s.value}%</span>
                    </div>
                  </article>
                ))}
                <div className="card insight">
                  <p>
                    You’re most consistent with
                    <br />
                    your self-care habits.
                  </p>
                  <Flower name="lotus-blue-stem" />
                </div>
              </>
            ) : (
              <div className="ritual-progress-grid">
                {[
                  {
                    title: "Morning routine",
                    value: 84,
                    days: "6 / 7 days",
                    copy: "You started most days feeling grounded and ready.",
                  },
                  {
                    title: "Night routine",
                    value: 71,
                    days: "5 / 7 days",
                    copy: "You closed most evenings with a calm, restful rhythm.",
                  },
                ].map((summary) => (
                  <article className="card ritual-summary-card" key={summary.title}>
                    <div>
                      <h2>{summary.title}</h2>
                      <strong>{summary.value}%</strong>
                      <p>{summary.copy}</p>
                    </div>
                    <div className="ritual-summary-meter">
                      <span>This week</span>
                      <p>
                        <i aria-hidden="true" />
                        {summary.days}
                      </p>
                      <Bar value={summary.value} />
                    </div>
                  </article>
                ))}
                <article className="card ritual-consistency-card">
                  <div className="ritual-consistency-heading">
                    <h2>Routine consistency</h2>
                    <span>Trend</span>
                  </div>
                  <div className="ritual-consistency-values">
                    <p>
                      <small>Average completion</small>
                      <strong>78%</strong>
                    </p>
                    <p>
                      <small>Best week</small>
                      <strong>92%</strong>
                    </p>
                  </div>
                  <p className="ritual-consistency-copy">
                    You&apos;re sticking to your routines more often over time
                    – keep the rhythm going.
                  </p>
                </article>
              </div>
            )}
          </section>
        )}
        {screen === "calendar" && (
          <section className="calendar-page content">
            <header className="screen-title">
              <h1>Calendar</h1>
            </header>
            <article className="card calendar-card">
              <div className="month-heading">
                <button
                  onClick={() => shiftMonth(-1)}
                  aria-label="Previous month"
                >
                  <ChevronLeft size={16} />
                </button>
                <h2>
                  {new Date(year, month, 1).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </h2>
                <button
                  onClick={() => shiftMonth(1)}
                  aria-label="Next month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="calendar-weekdays">
                {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(
                  (day) => (
                    <span key={day}>{day}</span>
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
                      className={i === 3 || i === 4 ? "highlight" : ""}
                      onClick={() => {
                        setDetailDate(
                          new Date(year, month, i + 1).toLocaleDateString(
                            "en-US",
                            {
                              weekday: "long",
                              month: "short",
                              day: "numeric",
                            },
                          ),
                        );
                        go("daily");
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
                {new Date(year, month, 1).toLocaleDateString("en-US", {
                  month: "long",
                })}{" "}
                progress
              </h2>
              <strong>{percent}%</strong>
              <Bar value={percent} />
            </article>
          </section>
        )}
        {screen === "rituals" && (
          <section className="rituals content">
            <h1>Rituals</h1>
            {(["Morning", "Night"] as const).map((routine) => (
              <article className="card routine-card" key={routine}>
                <button
                  className="routine-card-heading"
                  onClick={() => openRitualEditor(routine)}
                  aria-label={`Edit ${routine} ritual`}
                >
                  <h2>{routine}</h2>
                  <p>
                    {
                      habits.filter(
                        (habit) => habit.routine === routine && habit.done,
                      ).length
                    }
                    /{habits.filter((habit) => habit.routine === routine).length}{" "}
                    Completed
                  </p>
                </button>
                <div className="routine-activities">
                  {habits
                    .filter((h) => h.routine === routine)
                    .map((h) => (
                      <button
                        key={h.id}
                        className="routine-activity"
                        aria-pressed={h.done}
                        onClick={() => toggle(h.id)}
                      >
                        <span>
                          {h.id === "water"
                            ? "Drink Water"
                            : h.id === "exercise"
                            ? "Exercise"
                            : h.id === "read"
                              ? "Read"
                              : h.name}
                        </span>
                        <Dot checked={h.done} />
                      </button>
                    ))}
                  {!habits.some((h) => h.routine === routine) && (
                    <p className="empty-text">
                      A little space for a new ritual.
                    </p>
                  )}
                </div>
              </article>
            ))}
            <motion.button
              className="add-fab"
              aria-label="Add ritual"
              onClick={() => setModal("add")}
              whileTap={{ scale: 0.92 }}
            >
              <Plus size={32} strokeWidth={1.2} />
            </motion.button>
          </section>
        )}
        {screen === "profile" && (
          <section className="profile-page content">
            <div className="profile-hero">
              <div className="profile-avatar" aria-hidden="true">
                <span />
              </div>
              <button
                className="profile-change"
                onClick={() => setToast("Profile photo changes are coming soon.")}
              >
                Change
              </button>
            </div>
            <section className="profile-section" aria-labelledby="personal-information">
              <h1 id="personal-information">Personal Information</h1>
              <div className="profile-group">
                <div className="profile-row">
                  <span>Username</span>
                  <strong>Dummy Name</strong>
                </div>
                <div className="profile-row">
                  <span>Email</span>
                  <strong>dummy@gmail.com</strong>
                </div>
                <button
                  className="profile-row"
                  onClick={() => setToast("Goals are ready to personalize soon.")}
                >
                  <span>Goals</span>
                  <ChevronRight size={17} />
                </button>
                <button
                  className="profile-row"
                  onClick={() => setToast("Subscription details are coming soon.")}
                >
                  <span>Subscription</span>
                  <ChevronRight size={17} />
                </button>
              </div>
            </section>
            <section className="profile-section" aria-labelledby="preferences">
              <h1 id="preferences">Preferences</h1>
              <div className="profile-group">
                <button
                  className="profile-row"
                  onClick={() => setToast("Appearance preferences are coming soon.")}
                >
                  <span>Appearance</span>
                  <ChevronDown size={17} />
                </button>
                <button
                  className="profile-row"
                  onClick={() => setToast("Language preferences are coming soon.")}
                >
                  <span>Language</span>
                  <ChevronDown size={17} />
                </button>
              </div>
            </section>
            <Button className="profile-signout" onClick={() => go("welcome")}>
              Sign Out
            </Button>
          </section>
        )}
        <AnimatePresence>
          {menu && (
            <div className="menu-layer">
              <motion.button
                className="scrim"
                aria-label="Close navigation"
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
                    ["Progress", "progress"],
                    ["Calendar", "calendar"],
                    ["Rituals", "rituals"],
                    ["Profile", "profile"],
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
                      {name}
                    </motion.button>
                  ))}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {modal && modal !== "done" && (
            <Dialog
              title={
                modal === "add"
                  ? "Add Ritual"
                  : modal === "editRitual"
                    ? "Edit Ritual"
                    : modal === "editProgress"
                    ? "Edit today’s progress"
                    : modal === "google"
                      ? "Continue with Google"
                      : "Help & Settings"
              }
              onClose={closeModal}
            >
              {modal === "add" && (
                <form
                  className="add-form ritual-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = new FormData(e.currentTarget),
                      name = String(form.get("name") || "").trim(),
                      activity = String(form.get("activity") || "").trim();
                    if (!name) return;
                    setHabits((h) => [
                      ...h,
                      {
                        id: crypto.randomUUID(),
                        name: activity || name,
                        routine: "Morning",
                        done: false,
                        category: String(form.get("category")),
                        frequency: String(form.get("frequency")),
                        time: String(form.get("time") || "Any time"),
                      },
                    ]);
                    setEdited(true);
                    setModal(null);
                    setToast("Your new ritual has been added.");
                  }}
                >
                  <input
                    name="name"
                    placeholder="Ritual Name"
                    aria-label="Ritual Name"
                    required
                    maxLength={60}
                  />
                  <label className="form-field-label">
                    Category
                    <div className="select-field">
                      <Flower2 size={19} />
                      <select name="category" defaultValue="Mind">
                        <option>Mind</option>
                        <option>Wellness</option>
                        <option>Self Care</option>
                        <option>Body</option>
                      </select>
                      <ChevronDown size={16} />
                    </div>
                  </label>
                  <label className="form-field-label">
                    Frequency
                    <div className="select-field">
                      <select name="frequency">
                        <option>Every day</option>
                        <option>Weekdays</option>
                        <option>Weekends</option>
                      </select>
                      <ChevronDown size={16} />
                    </div>
                    <div className="select-field time-select">
                      <select name="time" defaultValue="">
                        <option value="" disabled>
                          Time Range
                        </option>
                        <option>Any time</option>
                        <option>6 AM – 12 PM</option>
                        <option>12 PM – 6 PM</option>
                        <option>6 PM – 11 PM</option>
                      </select>
                      <ChevronDown size={16} />
                    </div>
                  </label>
                  <label className="form-field-label">
                    Activity
                    <div className="activity-composer">
                      <input
                        name="activity"
                        placeholder="add activities to your ritual"
                        aria-label="Activity"
                        maxLength={60}
                      />
                      <Plus size={18} aria-hidden="true" />
                    </div>
                  </label>
                  <Button type="submit">Add</Button>
                </form>
              )}
              {modal === "editProgress" && (
                <div className="edit-form">
                  {draft.map((h) => (
                    <button
                      key={h.id}
                      aria-pressed={h.done}
                      className="daily-habit"
                      onClick={() => setDraft((d) => toggleHabit(d, h.id))}
                    >
                      <Dot checked={h.done} tick />
                      <span>{h.name}</span>
                    </button>
                  ))}
                  <Button
                    onClick={() => {
                      setHabits(draft);
                      setEdited(true);
                      setModal(null);
                    }}
                  >
                    Save
                  </Button>
                </div>
              )}
              {modal === "editRitual" && (
                <form
                  className="edit-ritual-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setHabits((all) => [
                      ...all.filter(
                        (habit) => habit.routine !== editingRoutine,
                      ),
                      ...ritualActivities.map((activity) => ({
                        ...activity,
                        routine: editingRoutine,
                        category: ritualCategory,
                        frequency: ritualFrequency,
                        time: ritualTime,
                      })),
                    ]);
                    setEdited(true);
                    setModal(null);
                    setToast("Your ritual has been updated.");
                  }}
                >
                  <label className="form-field-label">
                    Ritual Name
                    <input defaultValue={`${editingRoutine} Ritual`} maxLength={60} />
                  </label>
                  <label className="form-field-label">
                    Category
                    <div className="select-field">
                      <Flower2 size={19} />
                      <select
                        value={ritualCategory}
                        onChange={(e) => setRitualCategory(e.target.value)}
                      >
                        <option>Wellness</option>
                        <option>Mind</option>
                        <option>Self Care</option>
                        <option>Body</option>
                      </select>
                      <ChevronDown size={16} />
                    </div>
                  </label>
                  <div className="ritual-select-grid">
                    <label className="form-field-label">
                      Frequency
                      <div className="select-field">
                        <select
                          value={ritualFrequency}
                          onChange={(e) => setRitualFrequency(e.target.value)}
                        >
                          <option>Every day</option>
                          <option>Weekdays</option>
                          <option>Weekends</option>
                        </select>
                        <ChevronDown size={16} />
                      </div>
                    </label>
                    <label className="form-field-label">
                      Time Range
                      <div className="select-field">
                        <select
                          value={ritualTime}
                          onChange={(e) => setRitualTime(e.target.value)}
                        >
                          <option>Morning</option>
                          <option>Afternoon</option>
                          <option>Evening</option>
                          <option>Night</option>
                        </select>
                        <ChevronDown size={16} />
                      </div>
                    </label>
                  </div>
                  <div className="activities-editor">
                    <span className="form-field-label">Activities</span>
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
                          {activity.id === "water"
                            ? "Drink Water"
                            : activity.id === "exercise"
                              ? "Exercise"
                              : activity.id === "read"
                                ? "Read"
                                : activity.name}
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
                        placeholder="add activities to your ritual"
                        aria-label="Add an activity"
                        maxLength={60}
                      />
                      <button
                        type="button"
                        aria-label="Add activity"
                        onClick={addDraftActivity}
                      >
                        <Plus size={17} />
                      </button>
                    </div>
                  </div>
                  <Button type="submit">Save Changes</Button>
                  <button
                    type="button"
                    className="delete-ritual"
                    onClick={() => {
                      setHabits((all) =>
                        all.filter((habit) => habit.routine !== editingRoutine),
                      );
                      setEdited(true);
                      setModal(null);
                      setToast(`${editingRoutine} ritual deleted.`);
                    }}
                  >
                    Delete Ritual
                  </button>
                </form>
              )}
              {modal === "help" && (
                <div className="help-content">
                  <p>Small routines, softer days.</p>
                  <p>
                    Tap a ritual to mark it complete. Open Progress for your
                    weekly overview, or choose a day in the monthly calendar.
                  </p>
                  <p>
                    This preview saves habits on this browser. Account sync and
                    Google sign-in aren’t connected yet.
                  </p>
                  <Button
                    onClick={() => {
                      setModal(null);
                      go("welcome");
                    }}
                  >
                    Back to welcome
                  </Button>
                </div>
              )}
              {modal === "google" && (
                <div className="help-content">
                  <p>Google sign-in isn’t connected in this preview yet.</p>
                  <p>
                    You can still explore Odette and keep your rituals on this
                    device.
                  </p>
                  <Button
                    onClick={() => {
                      setModal(null);
                      go(screen === "signup" ? "name" : "today");
                    }}
                  >
                    Continue to preview
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
                aria-label="Close completion message"
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
                <h2 id="completion-title">You’re all done</h2>
                <p>Today looked good on you</p>
                <Flower name="lotus-bouquet" className="completion-flower" />
                <Button onClick={closeModal}>See Summary</Button>
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
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </MotionConfig>
  );
}
