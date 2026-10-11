/* =========================================================================
   Pulse · Personal Fitness Tracker
   Vanilla JavaScript single-page app. All data persisted in Local Storage.
   ========================================================================= */
'use strict';

/* -------------------------------------------------------------------------
   1. Configuration & constants
   ------------------------------------------------------------------------- */
const STORAGE_KEYS = {
  workouts: 'pulse.workouts',
  meals: 'pulse.meals',
  weights: 'pulse.weights',
  settings: 'pulse.settings',
  foods: 'pulse.foods',
  ai: 'pulse.ai',
};

const DEFAULT_SETTINGS = { calorieTarget: 2200, weightGoal: 75, weeklyWorkoutGoal: 4, theme: 'dark' };
const DEFAULT_PROFILE = { sex: '', birthDate: '', height: null, activity: 'light' };

// MET values and activity codes from the 2024 Adult Compendium of Physical Activities (pacompendium.com).
// Each activity has [light, moderate, vigorous] levels.
const L = (met, code, desc) => ({ met, code, desc });
const STRENGTH = [
  L(3.5, '02054', 'Weights, 8-15 reps, varied resistance'),
  L(5.0, '02052', 'Weights, squats/deadlifts, slow or explosive'),
  L(6.0, '02050', 'Weights, power lifting or body building'),
];
const WORKOUT_TYPES = [
  { name: 'Chest', color: '#3B82F6', icon: 'i-dumbbell', levels: STRENGTH },
  { name: 'Back', color: '#8B5CF6', icon: 'i-dumbbell', levels: STRENGTH },
  { name: 'Legs', color: '#10B981', icon: 'i-dumbbell', levels: STRENGTH },
  { name: 'Shoulders', color: '#F59E0B', icon: 'i-dumbbell', levels: STRENGTH },
  { name: 'Arms', color: '#EC4899', icon: 'i-dumbbell', levels: STRENGTH },
  { name: 'Cardio', color: '#EF4444', icon: 'i-pulse', levels: [L(5.0, '02048', 'Elliptical, moderate effort'), L(7.3, '02000', 'Aerobic exercise, general'), L(9.0, '02049', 'Elliptical, vigorous effort')] },
  { name: 'Other', color: '#64748B', icon: 'i-bolt', levels: [L(3.0, '02056', 'Body weight exercises, general'), L(3.8, '02022', 'Calisthenics, moderate effort'), L(7.5, '02020', 'Calisthenics, vigorous effort')] },
];

// Padel has no Compendium entry: uses tennis doubles (light) and paddleball (moderate/vigorous) values.
const SPORT_GROUPS = [
  { group: 'Racket sports', color: '#14B8A6', icon: 'i-ball', sports: [
    ['Tennis', [4.5, '15685', 'Doubles'], [6.8, '15675', 'General, moderate effort'], [8.0, '15676', 'General, competitive']],
    ['Padel', [4.5, '15685', 'Recreational doubles'], [6.0, '15500', 'Casual game'], [10.0, '15490', 'Competitive game']],
    ['Squash', [7.3, '15652', 'General'], [7.3, '15652', 'General'], [12.0, '15650', 'Intense play']],
    ['Badminton', [5.5, '15030', 'Social, singles or doubles'], [7.0, '15020', 'Competitive'], [9.0, '15025', 'Competitive match play']],
    ['Table tennis', [4.0, '15660', 'Ping pong'], [4.0, '15660', 'Ping pong'], [4.0, '15660', 'Ping pong']],
  ] },
  { group: 'Endurance', color: '#0EA5E9', icon: 'i-pulse', sports: [
    ['Running', [7.5, '12020', 'Jogging, self-selected pace'], [9.3, '12050', 'About 10 km/h (6 min/km)'], [11.8, '12080', 'About 12 km/h (5 min/km)']],
    ['Walking', [3.8, '17190', '4.5-5.5 km/h, moderate pace'], [4.8, '17200', '5.6-6.3 km/h, brisk'], [5.5, '17220', '6.4-7.1 km/h, very brisk']],
    ['Hiking', [3.8, '17081', 'Slow, no load'], [5.3, '17082', 'Normal pace, no load'], [7.8, '17012', 'With a daypack']],
    ['Cycling', [5.8, '01019', 'Leisure, about 15 km/h'], [8.0, '01030', '19-22 km/h, moderate'], [10.0, '01040', '22-26 km/h, fast']],
    ['Indoor cycling', [5.0, '01216', 'Stationary, about 60 W'], [6.8, '01200', 'Stationary, general'], [9.0, '01270', 'Spin class']],
    ['Swimming', [5.8, '18240', 'Freestyle, slow, recreational'], [8.0, '18290', 'Crawl, medium speed'], [9.8, '18230', 'Freestyle, fast']],
    ['Rowing machine', [5.0, '02071', 'Under 100 W'], [7.5, '02072', '100-149 W'], [11.0, '02073', '150-199 W']],
    ['Elliptical', [5.0, '02048', 'Moderate effort'], [5.0, '02048', 'Moderate effort'], [9.0, '02049', 'Vigorous effort']],
  ] },
  { group: 'Team sports', color: '#F97316', icon: 'i-ball', sports: [
    ['Football (soccer)', [7.0, '15610', 'Casual'], [7.0, '15610', 'Casual'], [9.5, '15605', 'Competitive']],
    ['Basketball', [5.0, '15070', 'Shooting baskets'], [7.5, '15055', 'General'], [8.0, '15040', 'Game']],
    ['Volleyball', [3.0, '15720', 'Non-competitive'], [6.0, '15711', 'Competitive, indoor'], [8.0, '15725', 'Beach, in sand']],
    ['Rugby', [6.3, '15562', 'Touch, non-competitive'], [6.3, '15562', 'Touch, non-competitive'], [8.3, '15560', 'Union, competitive']],
  ] },
  { group: 'Fitness classes', color: '#A855F7', icon: 'i-bolt', sports: [
    ['HIIT / CrossFit', [3.5, '02034', 'Circuit training, light'], [7.0, '02210', 'High intensity intervals, moderate'], [11.0, '02214', 'High intensity intervals, vigorous']],
    ['Dance / Zumba', [4.8, '02005', 'Aerobic dance, low impact'], [7.3, '02000', 'Aerobic, general'], [8.0, '02006', 'Aerobic dance, high impact']],
    ['Yoga', [2.3, '02150', 'Hatha'], [2.7, '02185', 'Vinyasa'], [4.0, '02160', 'Power yoga']],
    ['Pilates', [1.8, '02103', 'Mat, traditional'], [2.8, '02105', 'General'], [2.8, '02105', 'General']],
    ['Jump rope', [9.0, '02069', '120 jumps/min'], [11.0, '02068', 'General'], [11.0, '02068', 'General']],
  ] },
  { group: 'Combat sports', color: '#DC2626', icon: 'i-bolt', sports: [
    ['Boxing', [5.8, '15110', 'Punching bag'], [7.8, '15120', 'Sparring'], [12.3, '15100', 'In ring']],
    ['Kickboxing', [7.3, '15457', 'General'], [7.3, '15457', 'General'], [7.3, '15457', 'General']],
    ['Martial arts', [5.3, '15425', 'Slower pace, practice'], [10.3, '15430', 'Moderate pace (judo, karate...)'], [10.3, '15430', 'Moderate pace (judo, karate...)']],
  ] },
  { group: 'Outdoor & water', color: '#06B6D4', icon: 'i-ball', sports: [
    ['Climbing', [5.8, '15537', 'Low-to-moderate difficulty'], [7.3, '15535', 'High difficulty'], [8.8, '15534', 'Bouldering']],
    ['Golf', [3.5, '15290', 'Using power cart'], [4.3, '15265', 'Walking, carrying clubs'], [4.5, '15285', 'Walking, pulling clubs']],
    ['Surfing', [3.0, '18220', 'General'], [3.0, '18220', 'General'], [5.0, '18222', 'Competitive']],
    ['Stand-up paddle', [3.8, '18226', '20-29 strokes/min'], [6.5, '18224', 'General'], [9.8, '18228', '40-49 strokes/min']],
    ['Kayaking', [5.0, '18100', 'Moderate effort'], [5.0, '18100', 'Moderate effort'], [12.5, '18060', 'Competition, vigorous']],
    ['Skiing / snowboarding', [4.3, '19150', 'Light effort'], [6.3, '19160', 'Moderate effort'], [8.0, '19170', 'Vigorous effort']],
    ['Roller skating', [7.0, '15590', 'General'], [7.0, '15590', 'General'], [7.0, '15590', 'General']],
  ] },
];
const SPORTS = SPORT_GROUPS.flatMap(g => g.sports.map(([name, ...lv]) => (
  { name, color: g.color, icon: g.icon, sport: true, levels: lv.map(([met, code, desc]) => L(met, code, desc)) })));
const ALL_ACTIVITIES = [...WORKOUT_TYPES, ...SPORTS];
const TYPE_MAP = Object.fromEntries(ALL_ACTIVITIES.map(t => [t.name, t]));
const INTENSITIES = { light: 'Light', moderate: 'Moderate', vigorous: 'Vigorous' };
const INTENSITY_INDEX = { light: 0, moderate: 1, vigorous: 2 };

// Non-exercise activity multipliers applied on top of BMR (workouts are counted separately)
const ACTIVITY_LEVELS = { sedentary: 1.2, light: 1.35, active: 1.5, very: 1.7 };
const DEFAULT_WEIGHT_KG = 70;
const KCAL_PER_KG_FAT = 7700;
const AI_DEFAULT_MODEL = 'gemini-flash-latest';
const AI_MODEL_RE = /^[a-z0-9][a-z0-9.\-]{2,60}$/i;
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/';

// [name, kcal per 100 g (or 100 ml), portion label, portion grams, isLiquid]
const FOOD_DB = [
  // Protein
  ['Chicken breast, grilled', 165, 'fillet', 150], ['Chicken thigh, roasted', 209, 'thigh', 100],
  ['Turkey breast, roasted', 135, 'fillet', 150], ['Beef steak, grilled', 217, 'steak', 200],
  ['Ground beef, lean, cooked', 218], ['Burger patty, beef', 254, 'patty', 113],
  ['Pork loin, roasted', 196, 'chop', 150], ['Ham, sliced', 145, 'slice', 20],
  ['Bacon, cooked', 541, 'slice', 8], ['Chouriço (chorizo)', 455, 'slice', 10],
  ['Salmon, baked', 206, 'fillet', 150], ['Tuna, canned in water', 116, 'can', 120],
  ['Tuna, canned in oil (drained)', 198, 'can', 120], ['Cod, baked', 105, 'fillet', 150],
  ['Bacalhau (salt cod, soaked & cooked)', 110, 'portion', 200], ['Sardines, grilled', 208, 'sardine', 50],
  ['Shrimp, cooked', 99], ['Egg, whole', 155, 'egg', 50], ['Egg white', 52, 'white', 33],
  ['Tofu, firm', 144], ['Whey protein powder', 400, 'scoop', 30],
  // Dairy
  ['Milk, whole', 61, 'glass', 250, true], ['Milk, semi-skimmed', 47, 'glass', 250, true],
  ['Milk, skimmed', 34, 'glass', 250, true], ['Soy drink', 39, 'glass', 250, true],
  ['Greek yogurt, plain 2%', 73, 'pot', 170], ['Yogurt, plain', 61, 'pot', 125],
  ['Cottage cheese', 98], ['Queijo fresco (fresh cheese)', 165, 'portion', 50],
  ['Cheddar cheese', 403, 'slice', 20], ['Mozzarella', 280], ['Gouda / flamengo cheese', 356, 'slice', 20],
  ['Butter', 717, 'tbsp', 14],
  // Grains & starches
  ['White rice, cooked', 130], ['Brown rice, cooked', 123], ['Pasta, cooked', 158],
  ['Potato, boiled', 87], ['Sweet potato, baked', 90], ['French fries', 312],
  ['Bread, white', 265, 'slice', 30], ['Bread, whole wheat', 247, 'slice', 30],
  ['Bread roll (papo-seco)', 280, 'roll', 50], ['Oats, dry', 389, 'serving', 40],
  ['Granola', 471, 'serving', 45], ['Corn flakes', 357, 'serving', 30],
  ['Quinoa, cooked', 120], ['Couscous, cooked', 112], ['Tortilla wrap', 310, 'wrap', 62],
  ['Kidney beans, cooked', 127], ['Chickpeas, cooked', 164], ['Lentils, cooked', 116],
  // Fruit
  ['Apple', 52, 'apple', 182], ['Banana', 89, 'banana', 118], ['Orange', 47, 'orange', 131],
  ['Pear', 57, 'pear', 178], ['Kiwi', 61, 'kiwi', 69], ['Strawberries', 32, 'cup', 150],
  ['Blueberries', 57, 'cup', 148], ['Grapes', 69, 'cup', 150], ['Mango', 60, 'mango', 200],
  ['Pineapple', 50, 'slice', 85], ['Watermelon', 30, 'slice', 280], ['Avocado', 160, 'avocado', 150],
  // Vegetables
  ['Broccoli, cooked', 35], ['Carrot', 41, 'carrot', 61], ['Tomato', 18, 'tomato', 123],
  ['Mixed salad greens', 15, 'bowl', 85], ['Spinach, cooked', 23], ['Cucumber', 15],
  ['Bell pepper', 31, 'pepper', 120], ['Onion', 40, 'onion', 110], ['Green beans, cooked', 35],
  ['Mushrooms', 22], ['Zucchini', 17], ['Vegetable soup', 45, 'bowl', 300], ['Caldo verde', 60, 'bowl', 300],
  // Fats, nuts & spreads
  ['Olive oil', 884, 'tbsp', 14], ['Almonds', 579, 'handful', 30], ['Walnuts', 654, 'handful', 30],
  ['Peanuts', 567, 'handful', 30], ['Peanut butter', 588, 'tbsp', 16], ['Hummus', 166, 'tbsp', 15],
  ['Mayonnaise', 680, 'tbsp', 14], ['Ketchup', 112, 'tbsp', 17], ['Honey', 304, 'tbsp', 21],
  ['Jam', 278, 'tbsp', 20], ['Sugar', 387, 'tsp', 4],
  // Snacks & sweets
  ['Dark chocolate 70%', 598, 'square', 10], ['Milk chocolate', 535, 'square', 10],
  ['Potato chips', 536, 'bag', 40], ['Chocolate chip cookie', 488, 'cookie', 15],
  ['Croissant', 406, 'croissant', 60], ['Pastel de nata', 298, 'pastry', 65],
  ['Ice cream, vanilla', 207, 'scoop', 66], ['Protein bar', 350, 'bar', 60],
  // Dishes
  ['Pizza, margherita', 266, 'slice', 107], ['Cheeseburger (fast food)', 263, 'burger', 120],
  ['Francesinha', 200, 'plate', 700], ['Lasagna, meat', 150, 'plate', 300],
  ['Spaghetti bolognese', 130, 'plate', 350], ['Sushi, mixed', 150, 'piece', 30],
  ['Caesar salad with chicken', 140, 'bowl', 300],
  // Drinks
  ['Orange juice', 45, 'glass', 250, true], ['Espresso', 9, 'cup', 30, true],
  ['Latte / galão', 50, 'cup', 250, true], ['Cola', 42, 'can', 330, true], ['Cola zero', 0.3, 'can', 330, true],
  ['Beer', 43, 'bottle', 330, true], ['Red wine', 85, 'glass', 150, true], ['White wine', 82, 'glass', 150, true],
  ['Sports drink', 26, 'bottle', 500, true],
].map(([name, kcal, label, g, liquid]) => ({ name, kcal, portion: label ? { label, g } : null, base: liquid ? 'ml' : 'g', custom: false }));

const VIEWS = { dashboard: 'Summary', workouts: 'Workouts', nutrition: 'Nutrition', history: 'History', settings: 'Settings' };
const RING_CIRCUMFERENCE = 2 * Math.PI * 52;

/* -------------------------------------------------------------------------
   2. Utilities (DOM, formatting, dates)
   ------------------------------------------------------------------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const fmtNum = n => Math.round(n).toLocaleString('en-US');
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const icon = (id, cls = 'icon') => `<svg class="${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));

/** Escape any user-provided text before injecting into HTML. */
const escapeHTML = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const hexA = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

// Dates are handled as local "YYYY-MM-DD" strings to avoid timezone drift.
const pad = n => String(n).padStart(2, '0');
const toISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseISO = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const isISO = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
const todayISO = () => toISO(new Date());
const addDays = (iso, n) => { const d = parseISO(iso); d.setDate(d.getDate() + n); return toISO(d); };
const daysBetween = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 86400000);
const startOfWeek = iso => { const d = parseISO(iso); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return toISO(d); };
const weekDates = (iso = todayISO()) => { const s = startOfWeek(iso); return Array.from({ length: 7 }, (_, i) => addDays(s, i)); };
const fmtDate = (iso, opts) => parseISO(iso).toLocaleDateString('en-US', opts);
const nowTime = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };

function relativeDay(iso) {
  const diff = daysBetween(iso, todayISO());
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return fmtDate(iso, { weekday: 'short', month: 'short', day: 'numeric' });
}

/* -------------------------------------------------------------------------
   3. Storage & state
   ------------------------------------------------------------------------- */
const Store = {
  load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      showToast('Could not save: storage is full or disabled', 'error');
    }
  },
};

const state = {
  workouts: [],
  meals: [],
  weights: [],
  foods: [],
  settings: { ...DEFAULT_SETTINGS, profile: { ...DEFAULT_PROFILE } },
  view: 'dashboard',
  trendMode: 'calories',
  balanceRange: 'week',
  activityMode: 'gym',
  ai: { apiKey: '', model: 'gemini-flash-latest' },
  historyDate: todayISO(),
  charts: {},
};

/** Load persisted data, dropping malformed records. */
function loadState() {
  const arr = key => { const v = Store.load(STORAGE_KEYS[key], []); return Array.isArray(v) ? v : []; };

  state.workouts = arr('workouts')
    .filter(w => w && isISO(w.date) && TYPE_MAP[w.type] && Number(w.duration) > 0)
    .map(w => ({ id: String(w.id || uid()), date: w.date, type: w.type, duration: Number(w.duration), intensity: INTENSITIES[w.intensity] ? w.intensity : 'moderate', notes: String(w.notes || ''), createdAt: Number(w.createdAt) || 0 }));

  state.meals = arr('meals')
    .filter(m => m && isISO(m.date) && Number(m.calories) > 0)
    .map(m => ({
      id: String(m.id || uid()), date: m.date, name: String(m.name || 'Meal'), calories: Number(m.calories),
      time: /^\d{2}:\d{2}$/.test(m.time) ? m.time : '00:00',
      items: Array.isArray(m.items) ? m.items.filter(i => i && i.food).map(i => ({ food: String(i.food), qty: Number(i.qty) || 0, unit: String(i.unit || 'g'), grams: Number(i.grams) || 0, kcal: Number(i.kcal) || 0 })) : [],
    }));

  state.weights = arr('weights')
    .filter(w => w && isISO(w.date) && Number(w.weight) > 0)
    .map(w => ({ id: String(w.id || uid()), date: w.date, weight: Number(w.weight) }));

  state.foods = arr('foods')
    .filter(f => f && f.name && Number(f.kcal) >= 0)
    .map(f => ({ id: String(f.id || uid()), name: String(f.name), kcal: Number(f.kcal), portion: f.portion && Number(f.portion.g) > 0 ? { label: String(f.portion.label), g: Number(f.portion.g) } : null }));

  const s = Store.load(STORAGE_KEYS.settings, {});
  const ai = Store.load(STORAGE_KEYS.ai, {}) || {};
  state.ai = {
    apiKey: typeof ai.apiKey === 'string' ? ai.apiKey : '',
    model: AI_MODEL_RE.test(ai.model || '') ? ai.model : AI_DEFAULT_MODEL,
  };
  state.settings = { ...DEFAULT_SETTINGS, ...(s && typeof s === 'object' ? s : {}) };
  const p = state.settings.profile || {};
  state.settings.profile = {
    sex: ['male', 'female'].includes(p.sex) ? p.sex : '',
    birthDate: isISO(p.birthDate) ? p.birthDate : '',
    height: Number(p.height) > 0 ? Number(p.height) : null,
    activity: ACTIVITY_LEVELS[p.activity] ? p.activity : DEFAULT_PROFILE.activity,
  };
}

const persist = key => Store.save(STORAGE_KEYS[key], state[key]);

/* -------------------------------------------------------------------------
   4. Calculations / selectors
   ------------------------------------------------------------------------- */
const workoutsOn = date => state.workouts.filter(w => w.date === date);
const mealsOn = date => state.meals.filter(m => m.date === date).sort((a, b) => a.time.localeCompare(b.time));
const caloriesOn = date => mealsOn(date).reduce((s, m) => s + m.calories, 0);
const minutesOf = list => list.reduce((s, w) => s + w.duration, 0);
const pctOfTarget = kcal => Math.round((kcal / state.settings.calorieTarget) * 100);
const sortedWeights = () => [...state.weights].sort((a, b) => a.date.localeCompare(b.date));
const weightOnOrBefore = iso => sortedWeights().filter(w => w.date <= iso).at(-1) || null;

/** Consecutive days with a workout, ending today (or yesterday if today is still open). */
function currentStreak() {
  const days = new Set(state.workouts.map(w => w.date));
  let day = todayISO();
  if (!days.has(day)) day = addDays(day, -1);
  let n = 0;
  while (days.has(day)) { n++; day = addDays(day, -1); }
  return n;
}

function bestStreak() {
  const dates = [...new Set(state.workouts.map(w => w.date))].sort();
  let best = 0, run = 0, prev = null;
  for (const d of dates) {
    run = prev && daysBetween(prev, d) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

function lastWorkoutDate() {
  const today = todayISO();
  return state.workouts.map(w => w.date).filter(d => d <= today).sort().at(-1) || null;
}

/** Average weight per calendar week (Mon-Sun) for the last N weeks. */
function weeklyWeightSeries(weeks = 8) {
  const thisWeek = startOfWeek(todayISO());
  return Array.from({ length: weeks }, (_, i) => {
    const start = addDays(thisWeek, -7 * (weeks - 1 - i));
    const end = addDays(start, 6);
    const entries = state.weights.filter(w => w.date >= start && w.date <= end);
    const avg = entries.length ? entries.reduce((s, w) => s + w.weight, 0) / entries.length : null;
    return { start, avg: avg === null ? null : Math.round(avg * 10) / 10 };
  });
}

/** Progress from the first recorded weight towards the weight goal. */
function weightGoalProgress() {
  const list = sortedWeights();
  const goal = state.settings.weightGoal;
  if (!list.length) return { pct: 0, text: 'No weigh-ins yet' };
  const start = list[0].weight, current = list.at(-1).weight;
  const total = start - goal;
  let pct = total === 0 ? 100 : clamp(((start - current) / total) * 100, 0, 100);
  if (Math.abs(current - goal) < 0.05) pct = 100;
  return { pct, text: `${current.toFixed(1)} → ${goal} kg` };
}

/* -------------------------------------------------------------------------
   4b. Energy calculations (BMR, activity, workouts, balance)
   ------------------------------------------------------------------------- */
/** Weight valid on a date: last weigh-in on/before it, else the earliest known. */
function weightFor(date) {
  const w = weightOnOrBefore(date) || sortedWeights()[0];
  return w ? w.weight : null;
}

function ageOn(birthDate, date) {
  const b = parseISO(birthDate), d = parseISO(date);
  let age = d.getFullYear() - b.getFullYear();
  if (d.getMonth() < b.getMonth() || (d.getMonth() === b.getMonth() && d.getDate() < b.getDate())) age--;
  return age;
}

/** Mifflin-St Jeor basal metabolic rate. */
const calcBMR = ({ sex, weight, height, age }) => 10 * weight + 6.25 * height - 5 * age + (sex === 'male' ? 5 : -161);

function profileReady() {
  const p = state.settings.profile;
  return Boolean(p.sex && p.birthDate && p.height && weightFor(todayISO()));
}

/** Net activity calories: (MET - 1) x kg x hours, so resting energy isn't counted twice with BMR. */
const activityLevel = w => (TYPE_MAP[w.type] || TYPE_MAP.Other).levels[INTENSITY_INDEX[w.intensity] ?? 1];
function workoutBurn(w) {
  const kg = weightFor(w.date || todayISO()) || DEFAULT_WEIGHT_KG;
  return Math.round((activityLevel(w).met - 1) * kg * (w.duration / 60));
}
const burnOf = list => list.reduce((s, w) => s + workoutBurn(w), 0);

/** Full-day energy balance for a date. Positive balance = deficit. Null if the profile is incomplete. */
function energyOn(date) {
  if (!profileReady()) return null;
  const p = state.settings.profile;
  const bmr = Math.round(calcBMR({ sex: p.sex, weight: weightFor(date), height: p.height, age: ageOn(p.birthDate, date) }));
  const activity = Math.round(bmr * (ACTIVITY_LEVELS[p.activity] - 1));
  const workouts = burnOf(workoutsOn(date));
  const intake = caloriesOn(date);
  const burned = bmr + activity + workouts;
  return { bmr, activity, workouts, intake, burned, balance: burned - intake, logged: intake > 0 };
}

/** Aggregated balance over dates that have meals logged (up to today). */
function balanceSummary(dates) {
  const past = dates.filter(d => d <= todayISO());
  const logged = past.map(energyOn).filter(e => e && e.logged);
  const total = logged.reduce((s, e) => s + e.balance, 0);
  return { total, days: logged.length, elapsed: past.length, avg: logged.length ? total / logged.length : 0 };
}

/* -------------------------------------------------------------------------
   4c. Food database lookup
   ------------------------------------------------------------------------- */
let foodIndex = new Map();

function rebuildFoodIndex() {
  const foods = [...FOOD_DB, ...state.foods.map(f => ({ name: f.name, kcal: f.kcal, portion: f.portion, base: 'g', custom: true }))];
  foodIndex = new Map(foods.map(f => [f.name.toLowerCase(), f]));
  $('#foodList').innerHTML = foods
    .map(f => `<option value="${escapeHTML(f.name)}">${f.kcal} kcal / 100 ${f.base}${f.custom ? ' · my food' : ''}</option>`).join('');
}

const lookupFood = name => {
  const key = String(name).trim().toLowerCase();
  return foodIndex.get(key) || aiFoods.get(key) || null;
};
// Foods estimated by the photo AI that aren't in the database; kept only for the meal being entered
const aiFoods = new Map();

function buildMealItem(food, qty, usePortion) {
  const portion = usePortion && food.portion;
  const grams = portion ? qty * food.portion.g : qty;
  return { food: food.name, qty, unit: portion ? food.portion.label : food.base, grams: Math.round(grams), kcal: Math.round((grams * food.kcal) / 100) };
}

const mealNameFor = time => { const h = Number(time.slice(0, 2)); return h < 11 ? 'Breakfast' : h < 15 ? 'Lunch' : h < 18 ? 'Snack' : 'Dinner'; };
const itemLabel = i => (i.unit === 'g' || i.unit === 'ml' ? `${i.food} ${i.qty} ${i.unit}` : `${i.food} ×${i.qty}`);

/* -------------------------------------------------------------------------
   5. UI feedback: toast, bottom sheet, number animation, empty states
   ------------------------------------------------------------------------- */
let toastTimer;
function showToast(message, type = 'success', action = null) {
  const el = $('#toast');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${icon(type === 'error' ? 'i-x' : 'i-check')}</span>
    <span>${escapeHTML(message)}</span>
    ${action ? `<button type="button" class="toast-action">${escapeHTML(action.label)}</button>` : ''}`;
  if (action) {
    $('.toast-action', el).addEventListener('click', () => { el.classList.remove('show'); action.onClick(); }, { once: true });
  }
  void el.offsetWidth; // restart transition
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), action ? 4500 : 2600);
}

function openSheet() {
  const form = $('#weightForm');
  const latest = sortedWeights().at(-1);
  form.elements.namedItem('date').value = todayISO();
  form.elements.namedItem('date').max = todayISO();
  form.elements.namedItem('weight').value = latest ? latest.weight : '';
  $('#backdrop').classList.add('open');
  $('#weightSheet').classList.add('open');
  setTimeout(() => form.elements.namedItem('weight').focus(), 300);
}

function closeSheet() {
  $('#backdrop').classList.remove('open');
  $('#weightSheet').classList.remove('open');
}

function animateNumber(el, to, duration = 800) {
  const from = Number(el.dataset.value || 0);
  el.dataset.value = to;
  if (from === to || matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = fmtNum(to); return; }
  const start = performance.now();
  const step = now => {
    const p = Math.min(1, (now - start) / duration);
    el.textContent = fmtNum(from + (to - from) * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function emptyState(iconId, title, text, view, actionLabel, actionIcon = 'i-plus') {
  return `<div class="empty">
    <div class="empty-icon">${icon(iconId)}</div>
    <h4>${title}</h4>
    <p>${text}</p>
    ${view ? `<a class="btn btn-sm btn-soft" href="#${view}">${icon(actionIcon)}${actionLabel}</a>` : ''}
  </div>`;
}

function markInvalid(input, message) {
  input.classList.add('invalid');
  input.focus();
  input.addEventListener('input', () => input.classList.remove('invalid'), { once: true });
  showToast(message, 'error');
}

/* -------------------------------------------------------------------------
   6. Shared render fragments
   ------------------------------------------------------------------------- */
function progressBar(pct, cls = '') {
  return `<div class="progress ${cls}"><span style="--w:${clamp(pct, 0, 100).toFixed(1)}%"></span></div>`;
}

function workoutItem(w, showDate = false) {
  const t = TYPE_MAP[w.type] || TYPE_MAP.Other;
  const meta = [showDate ? relativeDay(w.date) : '', `${w.duration} min`, INTENSITIES[w.intensity], `~${fmtNum(workoutBurn(w))} kcal`, w.notes].filter(Boolean).map(escapeHTML).join(' · ');
  return `<li class="item">
    <span class="item-icon" style="--c:${t.color}">${icon(t.icon)}</span>
    <div class="item-body"><p class="item-title">${escapeHTML(w.type)}</p><p class="item-meta">${meta}</p></div>
    <button type="button" class="icon-btn danger" data-action="delete" data-kind="workouts" data-id="${escapeHTML(w.id)}" aria-label="Delete workout">${icon('i-trash')}</button>
  </li>`;
}

function mealItem(m) {
  const meta = [m.time, m.items.map(itemLabel).join(', ')].filter(Boolean).map(escapeHTML).join(' · ');
  return `<li class="item">
    <span class="item-icon" style="--c:#F59E0B">${icon('i-food')}</span>
    <div class="item-body"><p class="item-title">${escapeHTML(m.name)}</p><p class="item-meta" title="${meta}">${meta}</p></div>
    <span class="item-value">${fmtNum(m.calories)} <small>kcal</small></span>
    <button type="button" class="icon-btn danger" data-action="delete" data-kind="meals" data-id="${escapeHTML(m.id)}" aria-label="Delete meal">${icon('i-trash')}</button>
  </li>`;
}

function weightItem(w) {
  return `<li class="item">
    <span class="item-icon" style="--c:#22C55E">${icon('i-scale')}</span>
    <div class="item-body"><p class="item-title">${w.weight.toFixed(1)} kg</p><p class="item-meta">${escapeHTML(relativeDay(w.date))}</p></div>
    <button type="button" class="icon-btn danger" data-action="delete" data-kind="weights" data-id="${escapeHTML(w.id)}" aria-label="Delete weigh-in">${icon('i-trash')}</button>
  </li>`;
}

/** Daily summary: calories eaten, workouts completed and burned, balance and calories per meal. */
function daySummaryHTML(date) {
  const meals = mealsOn(date), workouts = workoutsOn(date);
  const kcal = meals.reduce((s, m) => s + m.calories, 0);
  const pct = pctOfTarget(kcal);
  const maxMeal = Math.max(1, ...meals.map(m => m.calories));
  const e = energyOn(date);

  let balance = '<strong>—</strong><span class="mini-sub">Complete profile</span>';
  if (e && !e.logged) balance = '<strong>—</strong><span class="mini-sub">No meals logged</span>';
  else if (e) balance = `<strong class="${e.balance >= 0 ? 'good' : 'bad'}">${fmtNum(Math.abs(e.balance))}</strong><span class="mini-sub">kcal ${e.balance >= 0 ? 'deficit' : 'surplus'}</span>`;

  const stats = `<div class="mini-stats">
    <div class="mini"><span class="mini-label">Eaten</span><strong>${fmtNum(kcal)}</strong><span class="mini-sub ${pct > 100 ? 'bad' : ''}">${pct}% of target</span></div>
    <div class="mini"><span class="mini-label">Workouts</span><strong>${fmtNum(burnOf(workouts))}</strong><span class="mini-sub">kcal · ${workouts.length} done</span></div>
    <div class="mini"><span class="mini-label">Balance</span>${balance}</div>
  </div>`;

  const breakdown = meals.length
    ? `<p class="sub-title">Calories per meal</p><ul class="meal-bars">${meals.map(m => `<li>
        <div class="meal-bar-top"><span>${escapeHTML(m.name)}<em>${escapeHTML(m.time)}</em></span><strong>${fmtNum(m.calories)} kcal</strong></div>
        ${progressBar((m.calories / maxMeal) * 100, 'thin')}
      </li>`).join('')}</ul>`
    : `<p class="sub-title">Calories per meal</p><p class="empty-inline">No meals logged for this day.</p>`;

  return stats + breakdown;
}

/* -------------------------------------------------------------------------
   7. Dashboard
   ------------------------------------------------------------------------- */
function renderDashboard() {
  const today = todayISO();
  const { calorieTarget, weeklyWorkoutGoal } = state.settings;

  // Calorie ring
  const kcal = caloriesOn(today);
  const pct = pctOfTarget(kcal);
  const ring = $('#calRing');
  ring.style.strokeDasharray = RING_CIRCUMFERENCE;
  ring.style.strokeDashoffset = RING_CIRCUMFERENCE * (1 - clamp(kcal / calorieTarget, 0, 1));
  ring.classList.toggle('over', kcal > calorieTarget);
  animateNumber($('#dashCalories'), kcal);
  $('#dashCalPct').textContent = `${pct}%`;
  $('#dashCalPct').parentElement.classList.toggle('over', kcal > calorieTarget);
  $('#dashCalTarget').textContent = fmtNum(calorieTarget);
  $('#dashRemainingLabel').textContent = kcal > calorieTarget ? 'Over' : 'Remaining';
  $('#dashCalRemaining').textContent = fmtNum(Math.abs(calorieTarget - kcal));

  // Today's workout status
  const todayWorkouts = workoutsOn(today);
  const streak = currentStreak();
  $('#workoutStatus').innerHTML = todayWorkouts.length
    ? `<div class="badge done">${icon('i-check')}</div>
       <p class="card-label">Today's workout</p>
       <p class="status-title">Completed</p>
       <p class="status-sub">${plural(todayWorkouts.length, 'session')} · ${minutesOf(todayWorkouts)} min · ${fmtNum(burnOf(todayWorkouts))} kcal</p>
       <div class="type-tags">${todayWorkouts.map(w => `<span class="type-tag" style="--c:${TYPE_MAP[w.type].color}">${escapeHTML(w.type)}</span>`).join('')}</div>`
    : `<div class="badge pending">${icon('i-dumbbell')}</div>
       <p class="card-label">Today's workout</p>
       <p class="status-title">Not logged yet</p>
       <p class="status-sub">${streak ? `Keep your ${streak}-day streak alive.` : 'A short session still counts.'}</p>
       <a class="btn btn-sm btn-primary" href="#workouts">${icon('i-plus')}Log workout</a>`;

  // Streak
  const last = lastWorkoutDate();
  const since = last ? daysBetween(last, today) : null;
  $('#streakCard').innerHTML = `
    <div class="badge flame ${streak ? 'lit' : ''}">${icon('i-flame')}</div>
    <p class="card-label">Streak</p>
    <p class="big-num">${streak}<small>${streak === 1 ? 'day' : 'days'}</small></p>
    <p class="status-sub">Best: ${plural(bestStreak(), 'day')}</p>
    <p class="status-sub">${since === null ? 'No workouts yet' : since === 0 ? 'Trained today' : `${plural(since, 'day')} since last workout`}</p>`;

  // Weekly summary cards (current week, Monday → today)
  const week = weekDates(today).filter(d => d <= today);
  const weekWorkouts = state.workouts.filter(w => week.includes(w.date));
  const loggedDays = week.filter(d => caloriesOn(d) > 0);
  const avgKcal = loggedDays.length ? loggedDays.reduce((s, d) => s + caloriesOn(d), 0) / loggedDays.length : 0;
  const nowW = weightOnOrBefore(today);
  const prevW = weightOnOrBefore(addDays(week[0], -1));
  const change = nowW && prevW ? nowW.weight - prevW.weight : null;
  const wb = balanceSummary(week);
  const cards = [
    { label: 'Workouts', value: weekWorkouts.length, unit: `/ ${weeklyWorkoutGoal}`, icon: 'i-dumbbell', color: '#3B82F6' },
    { label: 'Active time', value: fmtNum(minutesOf(weekWorkouts)), unit: 'min', icon: 'i-clock', color: '#8B5CF6' },
    { label: 'Burned in workouts', value: fmtNum(burnOf(weekWorkouts)), unit: 'kcal', icon: 'i-flame', color: '#EF4444' },
    { label: 'Avg intake / day', value: fmtNum(avgKcal), unit: 'kcal', icon: 'i-food', color: '#F59E0B' },
    { label: wb.total < 0 ? 'Weekly surplus' : 'Weekly deficit', value: wb.days ? fmtNum(Math.abs(wb.total)) : '—', unit: wb.days ? 'kcal' : '', icon: 'i-balance', color: '#14B8A6' },
    { label: 'Weight change', value: change === null ? '—' : `${change > 0 ? '+' : ''}${change.toFixed(1)}`, unit: change === null ? '' : 'kg', icon: 'i-scale', color: '#22C55E' },
  ];
  $('#weeklyCards').innerHTML = cards.map(c => `<div class="stat">
      <div class="stat-icon" style="--c:${c.color}">${icon(c.icon)}</div>
      <div class="stat-value">${c.value}<small>${c.unit}</small></div>
      <div class="stat-label">${c.label}</div>
    </div>`).join('');

  // Goal progress bars
  const wg = weightGoalProgress();
  const workoutPct = (weekWorkouts.length / weeklyWorkoutGoal) * 100;
  $('#goalBars').innerHTML = [
    { label: 'Calories today', text: `${fmtNum(kcal)} / ${fmtNum(calorieTarget)} kcal`, pct, cls: kcal > calorieTarget ? 'over' : '' },
    { label: 'Weekly workouts', text: `${weekWorkouts.length} / ${weeklyWorkoutGoal}`, pct: workoutPct, cls: workoutPct >= 100 ? 'done' : '' },
    { label: 'Weight goal', text: wg.text, pct: wg.pct, cls: wg.pct >= 100 ? 'done' : '' },
  ].map(g => `<div class="goal">
      <div class="goal-top"><span>${g.label}</span><strong>${g.text}</strong></div>
      ${progressBar(g.pct, g.cls)}
    </div>`).join('');

  // Muscle groups trained this week
  const counts = {};
  weekWorkouts.forEach(w => { counts[w.type] = (counts[w.type] || 0) + 1; });
  $('#muscleMeta').textContent = `${WORKOUT_TYPES.filter(t => counts[t.name]).length} of ${WORKOUT_TYPES.length} this week`;
  $('#muscleGrid').innerHTML = WORKOUT_TYPES.map(t => `<div class="muscle ${counts[t.name] ? 'hit' : ''}" style="--c:${t.color}">
      <span class="muscle-dot"></span><span class="muscle-name">${t.name}</span>
      <span class="muscle-count">${counts[t.name] ? `${counts[t.name]}×` : '—'}</span>
    </div>`).join('');

  $('#todaySummary').innerHTML = daySummaryHTML(today);

  renderBalance();
  renderTrendChart();
  renderWeightPanel();
}

/** Calorie balance: BMR + daily activity + workouts - intake, today and weekly. */
function renderBalance() {
  const panel = $('#balancePanel'), box = $('#balanceBox'), toggle = $('#balanceToggle'), foot = $('#balanceFoot');
  const today = todayISO();
  const e = energyOn(today);

  if (!e) {
    panel.innerHTML = emptyState('i-user', 'Complete your profile',
      'Add your gender, date of birth, height and weight so Pulse can calculate your basal and daily calories.',
      'settings', 'Open settings', 'i-sliders');
    box.hidden = true; toggle.hidden = true; foot.textContent = '';
    destroyChart('balance');
    return;
  }
  box.hidden = false; toggle.hidden = false;

  const deficit = e.balance >= 0;
  const max = Math.max(e.burned, e.intake, 1);
  const seg = v => ((v / max) * 100).toFixed(1);
  const wk = balanceSummary(weekDates(today));
  const wkGood = wk.total >= 0;
  const kpi = (label, value, unit, cls = '') => `<div class="mini"><span class="mini-label">${label}</span><strong class="${cls}">${value}<small> ${unit}</small></strong></div>`;

  panel.innerHTML = `<div class="balance-grid">
    <div>
      <p class="card-label">Today</p>
      <p class="balance-value ${e.logged ? (deficit ? 'good' : 'bad') : ''}">${e.logged ? fmtNum(Math.abs(e.balance)) : '—'}<small>kcal ${e.logged ? (deficit ? 'deficit' : 'surplus') : '· log meals to see it'}</small></p>
      <ul class="receipt">
        <li><span><i class="sw e-bmr"></i>Basal metabolism (BMR)</span><strong>+${fmtNum(e.bmr)}</strong></li>
        <li><span><i class="sw e-act"></i>Daily activity</span><strong>+${fmtNum(e.activity)}</strong></li>
        <li><span><i class="sw e-wk"></i>Workouts</span><strong>+${fmtNum(e.workouts)}</strong></li>
        <li><span><i class="sw e-in"></i>Calories eaten</span><strong>−${fmtNum(e.intake)}</strong></li>
      </ul>
      <div class="ebar-label"><span>Burned</span><strong>${fmtNum(e.burned)} kcal</strong></div>
      <div class="ebar"><span class="e-bmr" style="--w:${seg(e.bmr)}%"></span><span class="e-act" style="--w:${seg(e.activity)}%"></span><span class="e-wk" style="--w:${seg(e.workouts)}%"></span></div>
      <div class="ebar-label"><span>Eaten</span><strong>${fmtNum(e.intake)} kcal</strong></div>
      <div class="ebar"><span class="e-in" style="--w:${seg(e.intake)}%"></span></div>
    </div>
    <div class="kpi-grid">
      <p class="card-label">This week</p>
      ${kpi(wkGood ? 'Total deficit' : 'Total surplus', wk.days ? fmtNum(Math.abs(wk.total)) : '—', 'kcal', wk.days ? (wkGood ? 'good' : 'bad') : '')}
      ${kpi('Daily average', wk.days ? fmtNum(Math.abs(wk.avg)) : '—', 'kcal')}
      ${kpi('Est. fat change', wk.days ? `${wkGood ? '−' : '+'}${(Math.abs(wk.total) / KCAL_PER_KG_FAT).toFixed(2)}` : '—', 'kg', wk.days ? (wkGood ? 'good' : 'bad') : '')}
      ${kpi('Days logged', `${wk.days}/${wk.elapsed}`, 'days')}
    </div>
  </div>`;
  foot.textContent = 'Today is estimated for the full day. Days without logged meals are excluded. 7,700 kcal ≈ 1 kg of body fat.';
  renderBalanceChart();
}

function renderWeightPanel() {
  const list = sortedWeights();
  const goal = state.settings.weightGoal;
  const box = $('#weightBox');

  if (!list.length) {
    $('#weightPanel').innerHTML = emptyState('i-scale', 'No weigh-ins yet', 'Log your weight regularly to see your weekly evolution and goal progress.');
    box.hidden = true;
    $('#weightList').innerHTML = '';
    destroyChart('weight');
    return;
  }

  const current = list.at(-1);
  const series = weeklyWeightSeries(8).filter(s => s.avg !== null);
  const delta = series.length >= 2 ? series.at(-1).avg - series.at(-2).avg : null;
  const towardsGoal = delta !== null && (delta === 0 || Math.sign(delta) === Math.sign(goal - current.weight));
  const toGo = Math.abs(current.weight - goal);

  $('#weightPanel').innerHTML = `<div class="mini-stats">
    <div class="mini"><span class="mini-label">Current</span><strong>${current.weight.toFixed(1)}<small> kg</small></strong><span class="mini-sub">${escapeHTML(relativeDay(current.date))}</span></div>
    <div class="mini"><span class="mini-label">Weekly</span><strong class="${delta === null ? '' : towardsGoal ? 'good' : 'bad'}">${delta === null ? '—' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)}`}<small> kg</small></strong><span class="mini-sub">vs previous week</span></div>
    <div class="mini"><span class="mini-label">To goal</span><strong>${toGo < 0.05 ? '✓' : toGo.toFixed(1)}<small>${toGo < 0.05 ? '' : ' kg'}</small></strong><span class="mini-sub">Goal ${goal} kg</span></div>
  </div>`;
  box.hidden = false;
  $('#weightList').innerHTML = `<li><p class="sub-title">Recent weigh-ins</p></li>` + list.slice(-3).reverse().map(weightItem).join('');
  renderWeightChart();
}

/* -------------------------------------------------------------------------
   8. Charts (Chart.js)
   ------------------------------------------------------------------------- */
const chartsAvailable = () => typeof window.Chart !== 'undefined';

function destroyChart(key) {
  if (state.charts[key]) { state.charts[key].destroy(); delete state.charts[key]; }
}

function chartTheme() {
  const cs = getComputedStyle(document.documentElement);
  const v = name => cs.getPropertyValue(name).trim();
  return { text: v('--text-3'), grid: v('--chart-grid'), surface: v('--surface'), tooltip: v('--toast-bg'), accent: '#2563EB', accentLight: '#60A5FA', warning: '#F59E0B', success: '#22C55E' };
}

function baseOptions(t) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 800, easing: 'easeOutQuart' },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: t.tooltip, titleColor: '#fff', bodyColor: '#E2E8F0',
        padding: 10, cornerRadius: 10, displayColors: false,
        titleFont: { weight: '700' }, bodyFont: { weight: '500' },
      },
    },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { color: t.text, font: { size: 11, weight: '600' } } },
      y: { beginAtZero: true, grid: { color: t.grid }, border: { display: false }, ticks: { color: t.text, font: { size: 11 }, maxTicksLimit: 5 } },
    },
  };
}

/** Vertical gradient fill for line charts. */
const fadeFill = hex => ({ chart }) => {
  const { ctx, chartArea } = chart;
  if (!chartArea) return 'transparent';
  const g = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  g.addColorStop(0, hexA(hex, 0.35));
  g.addColorStop(1, hexA(hex, 0));
  return g;
};

function chartFallback(box) {
  box.innerHTML = `<div class="chart-fallback">Charts need an internet connection to load Chart.js.<br>All other features work offline.</div>`;
}

/** Weekly calories (bars vs target) or weekly workouts (stacked minutes per type). */
function renderTrendChart() {
  const days = weekDates();
  const today = todayISO();
  const labels = days.map(d => fmtDate(d, { weekday: 'short' }));
  const target = state.settings.calorieTarget;
  const weekWorkouts = state.workouts.filter(w => days.includes(w.date));

  $('#trendSub').textContent = state.trendMode === 'calories'
    ? `Daily intake vs ${fmtNum(target)} kcal target`
    : `${plural(weekWorkouts.length, 'workout')} · ${minutesOf(weekWorkouts)} min · ${fmtNum(burnOf(weekWorkouts))} kcal burned`;

  if (!chartsAvailable()) return chartFallback($('#trendBox'));
  destroyChart('trend');

  const t = chartTheme();
  const opts = baseOptions(t);
  let data;

  if (state.trendMode === 'calories') {
    const values = days.map(caloriesOn);
    data = {
      labels,
      datasets: [
        { type: 'line', label: 'Target', data: days.map(() => target), borderColor: t.text, borderDash: [5, 5], borderWidth: 1.5, pointRadius: 0, order: 0 },
        {
          label: 'Calories', data: values, order: 1,
          backgroundColor: values.map((v, i) => v > target ? t.warning : days[i] === today ? t.accent : hexA('#2563EB', 0.45)),
          borderRadius: 8, borderSkipped: false, maxBarThickness: 30,
        },
      ],
    };
    opts.plugins.tooltip.callbacks = { label: c => `${c.dataset.label}: ${fmtNum(c.parsed.y)} kcal` };
  } else {
    const datasets = ALL_ACTIVITIES.map(type => ({
      label: type.name,
      data: days.map(d => minutesOf(weekWorkouts.filter(w => w.date === d && w.type === type.name))),
      backgroundColor: type.color, borderRadius: 6, borderSkipped: false, maxBarThickness: 30,
    })).filter(ds => ds.data.some(v => v > 0));
    data = { labels, datasets: datasets.length ? datasets : [{ label: 'Minutes', data: days.map(() => 0), backgroundColor: t.accent }] };
    opts.scales.x.stacked = true;
    opts.scales.y.stacked = true;
    opts.plugins.tooltip.displayColors = true;
    opts.plugins.tooltip.filter = item => item.parsed.y > 0;
    opts.plugins.tooltip.callbacks = { label: c => ` ${c.dataset.label}: ${c.parsed.y} min` };
  }

  state.charts.trend = new Chart($('#trendChart'), { type: 'bar', data, options: opts });
}

/** Daily balance for the current week, or weekly totals for the last 8 weeks. */
function renderBalanceChart() {
  if (!chartsAvailable()) return chartFallback($('#balanceBox'));
  destroyChart('balance');

  const t = chartTheme();
  const opts = baseOptions(t);
  const today = todayISO();
  const byWeek = state.balanceRange === 'weeks';
  let labels, meta, values;

  if (byWeek) {
    const start = startOfWeek(today);
    const weeks = Array.from({ length: 8 }, (_, i) => addDays(start, -7 * (7 - i)));
    labels = weeks.map(w => fmtDate(w, { month: 'short', day: 'numeric' }));
    meta = weeks.map(w => balanceSummary(weekDates(w)));
    values = meta.map(m => (m.days ? m.total : null));
  } else {
    const days = weekDates(today);
    labels = days.map(d => fmtDate(d, { weekday: 'short' }));
    meta = days.map(d => (d <= today ? energyOn(d) : null));
    values = meta.map(e => (e && e.logged ? e.balance : null));
  }

  opts.scales.y.grid.color = ctx => (ctx.tick.value === 0 ? t.text : t.grid);
  opts.scales.y.ticks.callback = v => fmtNum(v);
  Object.assign(opts.scales.x.ticks, { maxRotation: 0, autoSkipPadding: 12 });
  opts.plugins.tooltip.callbacks = {
    title: items => (byWeek ? `Week of ${items[0].label}` : items[0].label),
    label: c => `${c.parsed.y >= 0 ? 'Deficit' : 'Surplus'}: ${fmtNum(Math.abs(c.parsed.y))} kcal`,
    afterLabel: c => {
      const m = meta[c.dataIndex];
      return byWeek
        ? `${plural(m.days, 'day')} logged · ≈ ${(m.total / KCAL_PER_KG_FAT).toFixed(2)} kg fat`
        : `Burned ${fmtNum(m.burned)} · Eaten ${fmtNum(m.intake)}`;
    },
  };

  state.charts.balance = new Chart($('#balanceChart'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Balance', data: values,
        backgroundColor: values.map(v => (v === null ? 'transparent' : v >= 0 ? hexA('#22C55E', 0.85) : hexA('#EF4444', 0.85))),
        borderRadius: 8, borderSkipped: false, maxBarThickness: 34,
      }],
    },
    options: opts,
  });
}

/** Weekly average weight over the last 8 weeks, with the goal as a dashed line. */
function renderWeightChart() {
  if (!chartsAvailable()) return chartFallback($('#weightBox'));
  destroyChart('weight');

  const t = chartTheme();
  const series = weeklyWeightSeries(8);
  const goal = state.settings.weightGoal;
  const values = series.map(s => s.avg).filter(v => v !== null);
  const opts = baseOptions(t);
  opts.scales.y.beginAtZero = false;
  Object.assign(opts.scales.x.ticks, { maxRotation: 0, autoSkipPadding: 12 });
  opts.scales.y.suggestedMin = Math.floor(Math.min(goal, ...values) - 1);
  opts.scales.y.suggestedMax = Math.ceil(Math.max(goal, ...values) + 1);
  opts.plugins.tooltip.callbacks = {
    title: items => `Week of ${items[0].label}`,
    label: c => c.parsed.y === null ? '' : `${c.dataset.label}: ${c.parsed.y.toFixed(1)} kg`,
  };

  state.charts.weight = new Chart($('#weightChart'), {
    type: 'line',
    data: {
      labels: series.map(s => fmtDate(s.start, { month: 'short', day: 'numeric' })),
      datasets: [
        {
          label: 'Avg weight', data: series.map(s => s.avg), spanGaps: true, fill: true, tension: 0.35,
          borderColor: t.accentLight, borderWidth: 3, backgroundColor: fadeFill('#3B82F6'),
          pointRadius: 4, pointHoverRadius: 6, pointBackgroundColor: t.accentLight, pointBorderColor: t.surface, pointBorderWidth: 2,
        },
        { label: 'Goal', data: series.map(() => goal), borderColor: t.success, borderDash: [5, 5], borderWidth: 1.5, pointRadius: 0, fill: false },
      ],
    },
    options: opts,
  });
}

/* -------------------------------------------------------------------------
   9. Workouts view
   ------------------------------------------------------------------------- */
function renderWorkouts() {
  const form = $('#workoutForm');
  const dateInput = form.elements.namedItem('date');
  dateInput.max = todayISO();
  if (!dateInput.value) dateInput.value = todayISO();
  updateWorkoutEstimate();

  const week = weekDates();
  const weekCount = state.workouts.filter(w => week.includes(w.date)).length;
  $('#workoutMeta').textContent = `${weekCount} this week`;

  const list = [...state.workouts].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt).slice(0, 30);
  if (!list.length) {
    $('#workoutList').innerHTML = emptyState('i-dumbbell', 'No workouts yet', 'Log your first session using the form. It will show up here and on your dashboard.');
    return;
  }

  // Group by date
  let html = '', currentDate = null;
  list.forEach(w => {
    if (w.date !== currentDate) {
      if (currentDate) html += '</ul>';
      currentDate = w.date;
      html += `<p class="list-date">${escapeHTML(relativeDay(w.date))}</p><ul class="list">`;
    }
    html += workoutItem(w);
  });
  $('#workoutList').innerHTML = html + '</ul>';
}

/** Live calorie estimate for the workout being entered. */
const selectedActivity = f => (state.activityMode === 'sport' ? f.namedItem('sport').value : f.namedItem('type').value);

function setActivityMode(kind) {
  state.activityMode = kind;
  $$('#activityMode button').forEach(b => b.classList.toggle('active', b.dataset.kind === kind));
  $('#typeChips').hidden = kind !== 'gym';
  $('#sportSelect').hidden = kind !== 'sport';
  updateWorkoutEstimate();
}

function updateWorkoutEstimate() {
  const f = $('#workoutForm').elements;
  const date = isISO(f.namedItem('date').value) ? f.namedItem('date').value : todayISO();
  const duration = Number(f.namedItem('duration').value) || 0;
  const kg = weightFor(date);
  const w = { type: selectedActivity(f), intensity: f.namedItem('intensity').value, duration, date };
  const lvl = activityLevel(w);
  $('#workoutBurn').textContent = fmtNum(duration > 0 ? workoutBurn(w) : 0);
  $('#workoutBurnHint').textContent = `${lvl.desc} · ${lvl.met} MET (Compendium ${lvl.code}) · `
    + (kg ? `${kg.toFixed(1)} kg` : `assumes ${DEFAULT_WEIGHT_KG} kg, set your weight in Settings`);
}

function handleWorkoutSubmit(e) {
  e.preventDefault();
  const f = e.target.elements;
  const date = f.namedItem('date').value;
  const type = selectedActivity(f);
  const intensity = f.namedItem('intensity').value;
  const duration = Number(f.namedItem('duration').value);
  const notes = f.namedItem('notes').value.trim().slice(0, 300);

  if (!isISO(date)) return markInvalid(f.namedItem('date'), 'Please choose a date');
  if (date > todayISO()) return markInvalid(f.namedItem('date'), "Workout date can't be in the future");
  if (!TYPE_MAP[type]) return showToast('Please choose a workout type or sport', 'error');
  if (!INTENSITIES[intensity]) return showToast('Please choose an intensity', 'error');
  if (!Number.isFinite(duration) || duration < 1 || duration > 600) return markInvalid(f.namedItem('duration'), 'Duration must be between 1 and 600 minutes');

  const workout = { id: uid(), date, type, duration: Math.round(duration), intensity, notes, createdAt: Date.now() };
  state.workouts.push(workout);
  persist('workouts');
  f.namedItem('duration').value = '';
  f.namedItem('notes').value = '';
  showToast(`${type}${TYPE_MAP[type].sport ? '' : ' workout'} saved · ~${fmtNum(workoutBurn(workout))} kcal`);
  refresh();
}

/* -------------------------------------------------------------------------
   10. Nutrition view
   ------------------------------------------------------------------------- */
function renderNutrition() {
  const today = todayISO();
  const form = $('#mealForm');
  const dateInput = form.elements.namedItem('date');
  dateInput.max = today;
  if (!dateInput.value) dateInput.value = today;
  if (!form.elements.namedItem('time').value) form.elements.namedItem('time').value = nowTime();

  const target = state.settings.calorieTarget;
  const meals = mealsOn(today);
  const kcal = caloriesOn(today);
  const pct = pctOfTarget(kcal);
  const over = kcal > target;

  $('#intakeSummary').innerHTML = `
    <div class="intake-top">
      <div><p class="card-label">Today's intake</p><p class="big-num">${fmtNum(kcal)}<small>/ ${fmtNum(target)} kcal</small></p></div>
      <div class="intake-pct ${over ? 'over' : ''}">${pct}%</div>
    </div>
    ${progressBar(pct, over ? 'over' : '')}
    <div class="intake-foot">
      <span>${over ? `${fmtNum(kcal - target)} kcal over target` : `${fmtNum(target - kcal)} kcal remaining`}</span>
      <span>${plural(meals.length, 'meal')}</span>
    </div>`;

  $('#mealMeta').textContent = fmtDate(today, { month: 'short', day: 'numeric' });
  $('#mealList').innerHTML = meals.length
    ? meals.map(mealItem).join('')
    : `<li>${emptyState('i-food', 'No meals today', 'Add the foods you eat and Pulse calculates the calories for you.')}</li>`;

  if (!$('#mealItems .food-row')) addFoodRow();
  updateMealTotal();

  $('#foodsMeta').textContent = `${state.foods.length} saved`;
  $('#customFoodList').innerHTML = state.foods.length
    ? state.foods.map(f => `<li class="item">
        <span class="item-icon" style="--c:#14B8A6">${icon('i-food')}</span>
        <div class="item-body"><p class="item-title">${escapeHTML(f.name)}</p>
        <p class="item-meta">${fmtNum(f.kcal)} kcal / 100 g${f.portion ? ` · 1 ${escapeHTML(f.portion.label)} = ${fmtNum(f.portion.g)} g` : ''}</p></div>
        <button type="button" class="icon-btn danger" data-action="delete" data-kind="foods" data-id="${escapeHTML(f.id)}" aria-label="Delete food">${icon('i-trash')}</button>
      </li>`).join('')
    : '<li><p class="empty-inline">No custom foods yet. Over 100 common foods are already built in.</p></li>';
}

function addFoodRow(focus = false) {
  $('#mealItems').insertAdjacentHTML('beforeend', `<div class="food-row">
    <input type="text" class="food-name" list="foodList" placeholder="Search food…" aria-label="Food" autocomplete="off" maxlength="60" />
    <input type="number" class="food-qty" min="0" step="any" inputmode="decimal" placeholder="Qty" aria-label="Quantity" />
    <select class="food-unit" aria-label="Unit"><option value="base">g</option></select>
    <span class="food-kcal">0 kcal</span>
    <button type="button" class="icon-btn danger" data-remove-row aria-label="Remove food">${icon('i-x')}</button>
  </div>`);
  if (focus) $('#mealItems .food-row:last-child .food-name').focus();
}

/** When a row's food changes, rebuild its unit options and pre-fill a sensible quantity. */
function syncFoodRow(row, food) {
  const key = food ? food.name : '';
  if (row.dataset.food === key) return;
  row.dataset.food = key;
  const unit = row.querySelector('.food-unit'), qty = row.querySelector('.food-qty');
  const base = food ? food.base : 'g';
  unit.innerHTML = `<option value="base">${base}</option>`
    + (food && food.portion ? `<option value="portion">${escapeHTML(food.portion.label)} (${food.portion.g} ${base})</option>` : '');
  if (food) {
    unit.value = food.portion ? 'portion' : 'base';
    if (!qty.value) qty.value = food.portion ? 1 : 100;
  }
}

/** Recalculate every food row and the meal total. */
function updateMealTotal() {
  let total = 0;
  $$('#mealItems .food-row').forEach(row => {
    const text = row.querySelector('.food-name').value.trim();
    const food = lookupFood(text);
    syncFoodRow(row, food);
    const qty = Number(row.querySelector('.food-qty').value);
    const kcal = food && qty > 0 ? buildMealItem(food, qty, row.querySelector('.food-unit').value === 'portion').kcal : 0;
    row.classList.toggle('unknown', Boolean(text) && !food);
    row.querySelector('.food-kcal').textContent = text && !food ? 'Pick from list' : `${fmtNum(kcal)} kcal`;
    total += kcal;
  });
  $('#mealTotal').textContent = fmtNum(total);
}

function handleMealSubmit(e) {
  e.preventDefault();
  const f = e.target.elements;
  const time = f.namedItem('time').value;
  const date = f.namedItem('date').value;
  const name = f.namedItem('name').value.trim().slice(0, 60) || (/^\d{2}:\d{2}$/.test(time) ? mealNameFor(time) : 'Meal');

  const rows = $$('#mealItems .food-row').filter(r => r.querySelector('.food-name').value.trim() || r.querySelector('.food-qty').value);
  if (!rows.length) {
    $('#mealItems .food-name').focus();
    return showToast('Add at least one food to calculate the calories', 'error');
  }
  const items = [];
  for (const row of rows) {
    const nameInput = row.querySelector('.food-name'), qtyInput = row.querySelector('.food-qty');
    const food = lookupFood(nameInput.value);
    if (!food) return markInvalid(nameInput, `"${nameInput.value.trim()}" isn't in the list. Pick a suggestion or add it under My foods`);
    const qty = Number(qtyInput.value);
    if (!(qty > 0) || qty > 5000) return markInvalid(qtyInput, 'Enter a valid quantity');
    items.push(buildMealItem(food, qty, row.querySelector('.food-unit').value === 'portion'));
  }
  const calories = items.reduce((s, i) => s + i.kcal, 0);

  if (calories < 1 || calories > 20000) return showToast('The meal total must be between 1 and 20,000 kcal', 'error');
  if (!/^\d{2}:\d{2}$/.test(time)) return markInvalid(f.namedItem('time'), 'Please enter a time');
  if (!isISO(date)) return markInvalid(f.namedItem('date'), 'Please choose a date');
  if (date > todayISO()) return markInvalid(f.namedItem('date'), "Meal date can't be in the future");

  state.meals.push({ id: uid(), date, name, calories, time, items });
  persist('meals');
  f.namedItem('name').value = '';
  f.namedItem('time').value = nowTime();
  $('#mealItems').innerHTML = '';
  aiFoods.clear();
  $('#photoPanel').hidden = true;
  showToast(date === todayISO() ? `${name} saved · ${fmtNum(calories)} kcal` : `${name} saved to ${relativeDay(date)}`);
  refresh();
}

function handleFoodSubmit(e) {
  e.preventDefault();
  const f = e.target.elements;
  const name = f.namedItem('foodName').value.trim().slice(0, 60);
  const kcal = Number(f.namedItem('foodKcal').value);
  const label = f.namedItem('portionLabel').value.trim().slice(0, 20);
  const grams = Number(f.namedItem('portionGrams').value);

  if (!name) return markInvalid(f.namedItem('foodName'), 'Please enter a food name');
  if (lookupFood(name)) return markInvalid(f.namedItem('foodName'), 'A food with this name already exists');
  if (f.namedItem('foodKcal').value === '' || !(kcal >= 0 && kcal <= 900)) return markInvalid(f.namedItem('foodKcal'), 'Calories per 100 g must be between 0 and 900');
  if (label && !(grams > 0 && grams <= 2000)) return markInvalid(f.namedItem('portionGrams'), 'Enter the portion weight in grams');

  state.foods.push({ id: uid(), name, kcal: Math.round(kcal * 10) / 10, portion: label ? { label, g: Math.round(grams) } : null });
  persist('foods');
  e.target.reset();
  showToast(`${name} added to your foods`);
  refresh();
}

/* -------------------------------------------------------------------------
   10b. Photo meal recognition (Google Gemini)
   ------------------------------------------------------------------------- */
/** Downscale a photo to max 1024 px JPEG to keep the upload small. */
async function prepareImage(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(1, 1024 / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    return { dataUrl, base64: dataUrl.split(',')[1] };
  } finally {
    URL.revokeObjectURL(url);
  }
}

const MEAL_SCHEMA = {
  type: 'object',
  properties: {
    is_food: { type: 'boolean', description: 'False if the photo does not show food or drink.' },
    meal_name: { type: 'string', description: 'Short name for the meal, e.g. "Grilled salmon with rice".' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Food as seen in the photo.' },
          match: { type: 'string', description: 'Exact name from the provided food list, or empty string if none fits.' },
          grams: { type: 'number', description: 'Estimated portion weight in grams (ml for drinks).' },
          kcal_per_100g: { type: 'number', description: 'Estimated calories per 100 g of this food as served.' },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
        },
        required: ['name', 'match', 'grams', 'kcal_per_100g', 'confidence'],
      },
    },
  },
  required: ['is_food', 'meal_name', 'items'],
};

async function analyzeMealPhoto(base64) {
  const foodNames = [...FOOD_DB.map(f => f.name), ...state.foods.map(f => f.name)].join('; ');
  const prompt = 'You are a nutrition assistant. Identify every distinct food and drink visible in this meal photo, '
    + 'including sauces, oils and sides. Estimate each portion weight in grams (ml for drinks) using visual cues such as '
    + 'plate size (~26 cm), cutlery and typical serving sizes. If an item matches a food in this list, set "match" to the '
    + `exact list name, otherwise use an empty string. Always give kcal_per_100g for the item as served. Food list: ${foodNames}`;

  const res = await fetch(`${GEMINI_BASE}${encodeURIComponent(state.ai.model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': state.ai.apiKey },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: 'image/jpeg', data: base64 } }] }],
      generationConfig: { responseMimeType: 'application/json', responseJsonSchema: MEAL_SCHEMA, temperature: 0.2 },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error?.message || `Request failed (${res.status})`);
  if (data.promptFeedback?.blockReason) throw new Error('The photo was blocked by the AI safety filter.');
  const text = data.candidates?.[0]?.content?.parts?.find(p => p.text && !p.thought)?.text;
  if (!text) throw new Error('No answer from the AI. Please try again.');
  return JSON.parse(text);
}

/** Turn AI items into food rows: database values when matched, AI estimate otherwise. */
function fillMealFromAI(result) {
  aiFoods.clear();
  $('#mealItems').innerHTML = '';
  const rows = [];
  (Array.isArray(result.items) ? result.items : []).slice(0, 15).forEach(it => {
    const grams = Math.round(clamp(Number(it.grams) || 0, 1, 3000));
    let food = lookupFood(it.match || '') || lookupFood(it.name || '');
    if (!food) {
      const name = `${String(it.name || 'Food').trim().slice(0, 40)} (AI estimate)`;
      food = { name, kcal: Math.round(clamp(Number(it.kcal_per_100g) || 0, 0, 900)), portion: null, base: 'g', ai: true };
      aiFoods.set(name.toLowerCase(), food);
    }
    addFoodRow();
    const row = $('#mealItems .food-row:last-child');
    row.querySelector('.food-name').value = food.name;
    syncFoodRow(row, food);
    row.querySelector('.food-unit').value = 'base';
    row.querySelector('.food-qty').value = grams;
    rows.push({ label: it.name || food.name, grams, base: food.base, kcal: Math.round((grams * food.kcal) / 100), low: it.confidence === 'low', ai: Boolean(food.ai) });
  });
  if (!rows.length) addFoodRow();
  const nameInput = $('#mName');
  if (!nameInput.value.trim() && result.meal_name) nameInput.value = String(result.meal_name).slice(0, 60);
  updateMealTotal();
  return rows;
}

async function handleMealPhoto(e) {
  const file = e.target.files && e.target.files[0];
  e.target.value = '';
  if (!file) return;
  if (!file.type.startsWith('image/')) return showToast('Please choose a photo', 'error');

  const panel = $('#photoPanel');
  panel.hidden = false;
  let img;
  try {
    img = await prepareImage(file);
  } catch {
    panel.innerHTML = '<p class="scan-error">This photo format could not be read. Try a JPEG or PNG.</p>';
    return;
  }
  const thumb = `<div class="photo-thumb"><img src="${img.dataUrl}" alt="Meal photo" /></div>`;
  panel.innerHTML = thumb.replace('photo-thumb', 'photo-thumb scanning')
    + '<div><p class="scan-title">Analysing your plate…</p><p class="scan-status"><span class="spinner"></span>Identifying foods and portions</p></div>';

  try {
    const result = await analyzeMealPhoto(img.base64);
    if (result.is_food === false || !result.items?.length) {
      panel.innerHTML = `${thumb}<div><p class="scan-title">No food found</p><p class="scan-error">Try another photo taken from above, with the whole plate visible.</p></div>`;
      return;
    }
    const rows = fillMealFromAI(result);
    const total = rows.reduce((t, r) => t + r.kcal, 0);
    panel.innerHTML = `${thumb}<div>
      <p class="scan-title">${rows.length} item${rows.length === 1 ? '' : 's'} found · ${fmtNum(total)} kcal</p>
      <div class="scan-items">${rows.map(r => `<span class="scan-chip ${r.low ? 'low' : ''}" title="${r.low ? 'Low confidence' : ''}">${escapeHTML(r.label)} · ${r.grams} ${r.base}</span>`).join('')}</div>
      <p class="fine-print">Check the foods and amounts below, adjust if needed, then tap <strong>Save meal</strong>.${rows.some(r => r.ai) ? ' Items marked "AI estimate" are not in the food database.' : ''}</p>
    </div>`;
    $('#mealItems').scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (err) {
    const offline = !navigator.onLine;
    panel.innerHTML = `${thumb}<div><p class="scan-title">Couldn't analyse the photo</p>
      <p class="scan-error">${escapeHTML(offline ? 'You are offline. Connect to the internet and try again.' : err.message)}</p></div>`;
  }
}

function renderAISettings() {
  const f = $('#aiForm').elements;
  f.namedItem('apiKey').value = state.ai.apiKey;
  f.namedItem('model').value = state.ai.model;
  $('#aiStatus').textContent = state.ai.apiKey ? 'Key saved' : 'Not set up';
}

async function handleAISubmit(e) {
  e.preventDefault();
  const f = e.target.elements;
  const apiKey = f.namedItem('apiKey').value.trim();
  const model = f.namedItem('model').value.trim() || AI_DEFAULT_MODEL;
  if (!/^[A-Za-z0-9_\-.]{20,200}$/.test(apiKey)) return markInvalid(f.namedItem('apiKey'), 'That does not look like a valid API key');
  if (!AI_MODEL_RE.test(model)) return markInvalid(f.namedItem('model'), 'Invalid model name');

  state.ai = { apiKey, model };
  Store.save(STORAGE_KEYS.ai, state.ai);
  $('#aiStatus').textContent = 'Checking…';
  try {
    const res = await fetch(`${GEMINI_BASE}${encodeURIComponent(model)}`, { headers: { 'x-goog-api-key': apiKey } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error?.message || `Error ${res.status}`);
    $('#aiStatus').textContent = 'Connected ✓';
    showToast('API key saved and verified');
  } catch (err) {
    $('#aiStatus').textContent = 'Key saved, not verified';
    showToast(`Saved, but verification failed: ${err.message}`, 'error');
  }
  updatePhotoHint();
}

function updatePhotoHint() {
  $('#photoHint').textContent = state.ai.apiKey
    ? 'AI identifies the foods and calculates the calories'
    : 'Set up a free Gemini API key in Settings to enable';
}

/* -------------------------------------------------------------------------
   11. History view
   ------------------------------------------------------------------------- */
function renderHistory() {
  const today = todayISO();
  if (state.historyDate > today) state.historyDate = today;
  const date = state.historyDate;

  const input = $('#histDate');
  input.max = today;
  input.value = date;
  $('#histNext').disabled = date >= today;

  // 14-day strip with activity dots
  const workoutDays = new Set(state.workouts.map(w => w.date));
  const mealDays = new Set(state.meals.map(m => m.date));
  const strip = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13));
  $('#dayStrip').innerHTML = strip.map(d => `<button type="button" class="day ${d === date ? 'selected' : ''}" data-date="${d}" aria-pressed="${d === date}">
      <span>${fmtDate(d, { weekday: 'short' })}</span><strong>${parseISO(d).getDate()}</strong>
      <i class="dots">${workoutDays.has(d) ? '<b class="w"></b>' : ''}${mealDays.has(d) ? '<b class="m"></b>' : ''}</i>
    </button>`).join('');
  const selected = $('#dayStrip .selected');
  if (selected) selected.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });

  // Selected day summary + records
  $('#histTitle').textContent = fmtDate(date, { weekday: 'long', month: 'long', day: 'numeric' });
  $('#histSummary').innerHTML = daySummaryHTML(date);

  const workouts = workoutsOn(date), meals = mealsOn(date);
  const weight = state.weights.find(w => w.date === date);
  $('#histRecords').innerHTML = (!workouts.length && !meals.length && !weight)
    ? emptyState('i-calendar', 'Nothing logged', 'No workouts, meals or weigh-ins were recorded on this day.')
    : `<p class="sub-title">Workouts</p>
       ${workouts.length ? `<ul class="list">${workouts.map(w => workoutItem(w)).join('')}</ul>` : '<p class="empty-inline">No workouts on this day.</p>'}
       <p class="sub-title">Meals</p>
       ${meals.length ? `<ul class="list">${meals.map(mealItem).join('')}</ul>` : '<p class="empty-inline">No meals on this day.</p>'}
       ${weight ? `<p class="sub-title">Weight</p><ul class="list">${weightItem(weight)}</ul>` : ''}`;

  // Previous active days
  const activeDays = [...new Set([...state.workouts, ...state.meals, ...state.weights].map(r => r.date))]
    .filter(d => d <= today).sort().reverse().slice(0, 30);
  $('#histDays').innerHTML = activeDays.length
    ? activeDays.map(d => {
        const kcal = caloriesOn(d);
        return `<li><button type="button" class="day-row" data-date="${d}" data-scroll="top">
          <div class="item-body"><p class="item-title">${escapeHTML(relativeDay(d))}</p>
          <p class="item-meta">${plural(workoutsOn(d).length, 'workout')} · ${plural(mealsOn(d).length, 'meal')}</p></div>
          <div class="day-row-kcal"><strong>${fmtNum(kcal)} kcal</strong><span>${pctOfTarget(kcal)}% target</span></div>
          ${icon('i-chev-right')}
        </button></li>`;
      }).join('')
    : `<li>${emptyState('i-history', 'No history yet', 'Your logged days will appear here so you can review past activity.', 'workouts', 'Log a workout')}</li>`;
}

/* -------------------------------------------------------------------------
   12. Settings view
   ------------------------------------------------------------------------- */
function renderSettings() {
  const p = state.settings.profile;
  const pf = $('#profileForm').elements;
  $$('#profileForm input[name="sex"]').forEach(r => { r.checked = r.value === p.sex; });
  pf.namedItem('birthDate').value = p.birthDate;
  pf.namedItem('birthDate').max = addDays(todayISO(), -365 * 13);
  pf.namedItem('height').value = p.height ?? '';
  pf.namedItem('weight').value = weightFor(todayISO()) ?? '';
  pf.namedItem('activity').value = p.activity;
  renderEnergyPreview();

  const f = $('#settingsForm').elements;
  f.namedItem('calorieTarget').value = state.settings.calorieTarget;
  f.namedItem('weightGoal').value = state.settings.weightGoal;
  f.namedItem('weeklyWorkoutGoal').value = state.settings.weeklyWorkoutGoal;
  $('#themeSwitch').checked = state.settings.theme === 'dark';
  renderAISettings();
}

function handleSettingsSubmit(e) {
  e.preventDefault();
  const f = e.target.elements;
  const calorieTarget = Number(f.namedItem('calorieTarget').value);
  const weightGoal = Number(f.namedItem('weightGoal').value);
  const weeklyWorkoutGoal = Number(f.namedItem('weeklyWorkoutGoal').value);

  if (!Number.isFinite(calorieTarget) || calorieTarget < 800 || calorieTarget > 10000) return markInvalid(f.namedItem('calorieTarget'), 'Calorie target must be between 800 and 10,000');
  if (!Number.isFinite(weightGoal) || weightGoal < 20 || weightGoal > 400) return markInvalid(f.namedItem('weightGoal'), 'Weight goal must be between 20 and 400 kg');
  if (!Number.isInteger(weeklyWorkoutGoal) || weeklyWorkoutGoal < 1 || weeklyWorkoutGoal > 14) return markInvalid(f.namedItem('weeklyWorkoutGoal'), 'Weekly goal must be a whole number from 1 to 14');

  Object.assign(state.settings, { calorieTarget: Math.round(calorieTarget), weightGoal: Math.round(weightGoal * 10) / 10, weeklyWorkoutGoal });
  persist('settings');
  showToast('Settings saved');
  refresh();
}

/** Read the profile form (saved or not). */
function readProfileForm() {
  const f = $('#profileForm').elements;
  const checked = $('#profileForm input[name="sex"]:checked');
  return {
    sex: checked ? checked.value : '',
    birthDate: f.namedItem('birthDate').value,
    height: Number(f.namedItem('height').value),
    weight: Number(f.namedItem('weight').value),
    activity: f.namedItem('activity').value,
  };
}

/** Live preview of BMR, daily activity and maintenance calories from the profile form. */
function renderEnergyPreview() {
  const p = readProfileForm();
  const age = isISO(p.birthDate) ? ageOn(p.birthDate, todayISO()) : 0;
  const ok = p.sex && age >= 13 && age <= 100 && p.height >= 100 && p.height <= 250 && p.weight >= 20 && p.weight <= 400 && ACTIVITY_LEVELS[p.activity];
  if (!ok) {
    $('#energyPreview').innerHTML = '<p class="empty-inline">Fill in gender, date of birth, height and weight to see your daily energy estimate.</p>';
    return;
  }
  const bmr = Math.round(calcBMR({ ...p, age }));
  const activity = Math.round(bmr * (ACTIVITY_LEVELS[p.activity] - 1));
  const target = Math.max(1200, Math.round((bmr + activity - 500) / 50) * 50);
  $('#energyPreview').innerHTML = `
    <div class="mini"><span class="mini-label">Basal (BMR)</span><strong>${fmtNum(bmr)}<small> kcal</small></strong><span class="mini-sub">${age} years old</span></div>
    <div class="mini"><span class="mini-label">Daily activity</span><strong>${fmtNum(activity)}<small> kcal</small></strong><span class="mini-sub">excl. workouts</span></div>
    <div class="mini"><span class="mini-label">Maintenance</span><strong>${fmtNum(bmr + activity)}<small> kcal</small></strong><span class="mini-sub">+ workout calories</span></div>
    <div class="mini"><span class="mini-label">Suggested target</span><strong>${fmtNum(target)}<small> kcal</small></strong>
      <span class="mini-sub">≈ 0.5 kg/week loss</span>
      <button type="button" class="btn btn-soft" data-action="use-target" data-value="${target}">Use as daily target</button></div>`;
}

function upsertWeight(date, value) {
  const existing = state.weights.find(w => w.date === date);
  if (existing) existing.weight = value;
  else state.weights.push({ id: uid(), date, weight: value });
  persist('weights');
  return Boolean(existing);
}

function handleProfileSubmit(e) {
  e.preventDefault();
  const f = e.target.elements;
  const p = readProfileForm();
  const age = isISO(p.birthDate) ? ageOn(p.birthDate, todayISO()) : -1;

  if (!p.sex) return showToast('Please choose a gender', 'error');
  if (age < 13 || age > 100) return markInvalid(f.namedItem('birthDate'), 'Please enter a valid date of birth (13 to 100 years old)');
  if (!(p.height >= 100 && p.height <= 250)) return markInvalid(f.namedItem('height'), 'Height must be between 100 and 250 cm');
  if (!(p.weight >= 20 && p.weight <= 400)) return markInvalid(f.namedItem('weight'), 'Weight must be between 20 and 400 kg');
  if (!ACTIVITY_LEVELS[p.activity]) return markInvalid(f.namedItem('activity'), 'Please choose an activity level');

  state.settings.profile = { sex: p.sex, birthDate: p.birthDate, height: Math.round(p.height), activity: p.activity };
  persist('settings');
  const weight = Math.round(p.weight * 10) / 10;
  if (weight !== weightOnOrBefore(todayISO())?.weight) upsertWeight(todayISO(), weight);
  showToast('Profile saved · calorie balance updated');
  refresh();
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  $('meta[name="theme-color"]').setAttribute('content', theme === 'dark' ? '#05070C' : '#F2F4F8');
}

function clearAllData() {
  if (!confirm('Delete all workouts, meals and weigh-ins? This cannot be undone.')) return;
  state.workouts = []; state.meals = []; state.weights = [];
  ['workouts', 'meals', 'weights'].forEach(persist);
  showToast('All data cleared');
  refresh();
}

/** Generates four weeks of realistic sample data for a quick demo. */
function loadDemoData() {
  const hasData = state.workouts.length || state.meals.length || state.weights.length;
  if (hasData && !confirm('Replace your current data with demo data?')) return;

  const rnd = (a, b) => Math.round(a + Math.random() * (b - a));
  const pick = list => list[rnd(0, list.length - 1)];
  const today = todayISO();
  const split = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Cardio'];
  const notes = ['', '', 'Felt strong today', 'New personal best!', 'Focus on tempo', 'Zone 2 pace', ''];
  // [food, qty, usePortion]
  const menus = {
    Breakfast: [
      [['Oats, dry', 2, true], ['Milk, semi-skimmed', 1, true], ['Banana', 1, true], ['Peanut butter', 1, true]],
      [['Bread, whole wheat', 2, true], ['Egg, whole', 2, true], ['Butter', 1, true], ['Latte / galão', 1, true]],
      [['Greek yogurt, plain 2%', 1, true], ['Granola', 1, true], ['Blueberries', 100, false], ['Honey', 1, true]],
    ],
    Lunch: [
      [['Chicken breast, grilled', 1, true], ['White rice, cooked', 250, false], ['Broccoli, cooked', 120, false], ['Olive oil', 1, true], ['Bread roll (papo-seco)', 1, true]],
      [['Salmon, baked', 1, true], ['Potato, boiled', 300, false], ['Mixed salad greens', 1, true], ['Olive oil', 1, true]],
      [['Bacalhau (salt cod, soaked & cooked)', 1, true], ['Potato, boiled', 300, false], ['Egg, whole', 1, true], ['Olive oil', 2, true]],
    ],
    Snack: [
      [['Apple', 1, true], ['Almonds', 1, true]],
      [['Protein bar', 1, true]],
      [['Yogurt, plain', 1, true], ['Banana', 1, true]],
    ],
    Dinner: [
      [['Pasta, cooked', 280, false], ['Ground beef, lean, cooked', 150, false], ['Tomato', 1, true], ['Olive oil', 1, true]],
      [['Turkey breast, roasted', 1, true], ['Sweet potato, baked', 250, false], ['Green beans, cooked', 150, false], ['Olive oil', 1, true]],
      [['Vegetable soup', 1, true], ['Pizza, margherita', 3, true]],
    ],
  };
  const times = { Breakfast: '08:00', Lunch: '13:00', Snack: '16:30', Dinner: '20:00' };
  const workouts = [], meals = [], weights = [];
  let s = 0;

  for (let i = 27; i >= 0; i--) {
    const date = addDays(today, -i);
    const dow = parseISO(date).getDay();
    if (dow !== 0 && dow !== 3) {
      workouts.push({ id: uid(), date, type: split[s++ % split.length], duration: rnd(35, 75), intensity: pick(['light', 'moderate', 'moderate', 'vigorous']), notes: pick(notes), createdAt: Date.now() - i * 86400000 });
    } else if (i > 0) {
      workouts.push({ id: uid(), date, type: dow === 3 ? 'Padel' : pick(['Running', 'Cycling', 'Tennis']), duration: rnd(50, 90), intensity: pick(['moderate', 'vigorous']), notes: '', createdAt: Date.now() - i * 86400000 });
    }
    Object.keys(menus).forEach((name, idx) => {
      if (i === 0 && idx > 1) return; // today is still in progress
      if (name === 'Snack' && Math.random() < 0.4) return;
      const items = pick(menus[name]).map(([food, qty, portion]) => buildMealItem(lookupFood(food), qty, portion));
      meals.push({ id: uid(), date, name, time: times[name], items, calories: items.reduce((t, it) => t + it.kcal, 0) });
    });
    if (i % 3 === 0) weights.push({ id: uid(), date, weight: Math.round((82.4 - (27 - i) * 0.09 + (Math.random() - 0.5) * 0.6) * 10) / 10 });
  }

  Object.assign(state, { workouts, meals, weights });
  ['workouts', 'meals', 'weights'].forEach(persist);
  if (!state.settings.profile.sex) {
    state.settings.profile = { sex: 'male', birthDate: '1990-05-14', height: 180, activity: 'light' };
    persist('settings');
  }
  showToast('Demo data loaded');
  location.hash = '#dashboard';
  refresh();
}

/* -------------------------------------------------------------------------
   13. Navigation & rendering orchestration
   ------------------------------------------------------------------------- */
function renderChrome() {
  $('#todayLabel').textContent = fmtDate(todayISO(), { weekday: 'long', month: 'long', day: 'numeric' });
  $('#streakChipValue').textContent = currentStreak();
}

function renderCurrentView() {
  ({ dashboard: renderDashboard, workouts: renderWorkouts, nutrition: renderNutrition, history: renderHistory, settings: renderSettings })[state.view]();
}

function refresh() {
  rebuildFoodIndex();
  renderChrome();
  renderCurrentView();
}

function setView(view) {
  if (!VIEWS[view]) view = 'dashboard';
  const changed = state.view !== view;
  state.view = view;
  $$('.view').forEach(v => v.classList.toggle('active', v.id === `view-${view}`));
  $$('.tab').forEach(t => {
    const on = t.dataset.view === view;
    t.classList.toggle('active', on);
    if (on) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current');
  });
  $('#viewTitle').textContent = VIEWS[view];
  document.title = `${VIEWS[view]} · Pulse`;
  if (changed) window.scrollTo(0, 0);
  refresh();
}

/** Delete a record with an Undo option in the toast. */
function deleteRecord(kind, id) {
  if (!['workouts', 'meals', 'weights', 'foods'].includes(kind)) return;
  const idx = state[kind].findIndex(r => r.id === id);
  if (idx < 0) return;
  const [removed] = state[kind].splice(idx, 1);
  persist(kind);
  refresh();
  const label = { workouts: 'Workout', meals: 'Meal', weights: 'Weigh-in', foods: 'Food' }[kind];
  showToast(`${label} deleted`, 'success', {
    label: 'Undo',
    onClick: () => {
      state[kind].splice(idx, 0, removed);
      persist(kind);
      refresh();
      showToast(`${label} restored`);
    },
  });
}

function handleWeightSubmit(e) {
  e.preventDefault();
  const f = e.target.elements;
  const weight = Number(f.namedItem('weight').value);
  const date = f.namedItem('date').value;

  if (!Number.isFinite(weight) || weight < 20 || weight > 400) return markInvalid(f.namedItem('weight'), 'Weight must be between 20 and 400 kg');
  if (!isISO(date) || date > todayISO()) return markInvalid(f.namedItem('date'), 'Please choose a valid date');

  const value = Math.round(weight * 10) / 10;
  const existed = upsertWeight(date, value);
  closeSheet();
  showToast(existed ? `Weight updated · ${value} kg` : `Weight saved · ${value} kg`);
  refresh();
}

/* -------------------------------------------------------------------------
   14. Event binding
   ------------------------------------------------------------------------- */
function bindEvents() {
  window.addEventListener('hashchange', () => setView(location.hash.slice(1)));

  // Delegated clicks
  document.addEventListener('click', e => {
    const del = e.target.closest('[data-action="delete"]');
    if (del) return deleteRecord(del.dataset.kind, del.dataset.id);

    const useTarget = e.target.closest('[data-action="use-target"]');
    if (useTarget) {
      state.settings.calorieTarget = Number(useTarget.dataset.value);
      $('#sCalories').value = state.settings.calorieTarget;
      persist('settings');
      return showToast(`Daily target set to ${fmtNum(state.settings.calorieTarget)} kcal`);
    }

    const removeRow = e.target.closest('[data-remove-row]');
    if (removeRow) {
      const row = removeRow.closest('.food-row');
      if ($$('#mealItems .food-row').length > 1) row.remove();
      else { row.querySelector('.food-name').value = ''; row.querySelector('.food-qty').value = ''; }
      return updateMealTotal();
    }

    if (e.target.closest('[data-open-sheet]')) return openSheet();
    if (e.target.closest('[data-close-sheet]')) return closeSheet();

    const fill = e.target.closest('[data-fill]');
    if (fill) {
      const input = document.getElementById(fill.dataset.fill);
      input.value = fill.dataset.value;
      input.classList.remove('invalid');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      if (fill.dataset.time) $('#mTime').value = fill.dataset.time;
      return;
    }

    const step = e.target.closest('[data-step]');
    if (step) {
      const input = document.getElementById(step.dataset.target);
      input.value = clamp((Number(input.value) || 0) + Number(step.dataset.step), 1, 600);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }

    const day = e.target.closest('[data-date]');
    if (day && isISO(day.dataset.date)) {
      state.historyDate = day.dataset.date;
      renderHistory();
      if (day.dataset.scroll === 'top') window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  // Trend chart segmented control
  $('#trendToggle').addEventListener('click', e => {
    const btn = e.target.closest('button[data-mode]');
    if (!btn || btn.dataset.mode === state.trendMode) return;
    state.trendMode = btn.dataset.mode;
    $$('#trendToggle button').forEach(b => b.classList.toggle('active', b === btn));
    renderTrendChart();
  });

  $('#balanceToggle').addEventListener('click', e => {
    const btn = e.target.closest('button[data-range]');
    if (!btn || btn.dataset.range === state.balanceRange) return;
    state.balanceRange = btn.dataset.range;
    $$('#balanceToggle button').forEach(b => b.classList.toggle('active', b === btn));
    renderBalanceChart();
  });

  // Forms
  $('#workoutForm').addEventListener('submit', handleWorkoutSubmit);
  $('#mealForm').addEventListener('submit', handleMealSubmit);
  $('#weightForm').addEventListener('submit', handleWeightSubmit);
  $('#settingsForm').addEventListener('submit', handleSettingsSubmit);
  $('#profileForm').addEventListener('submit', handleProfileSubmit);
  $('#foodForm').addEventListener('submit', handleFoodSubmit);

  // Live calculations
  ['input', 'change'].forEach(type => {
    $('#workoutForm').addEventListener(type, updateWorkoutEstimate);
    $('#mealItems').addEventListener(type, updateMealTotal);
    $('#profileForm').addEventListener(type, renderEnergyPreview);
  });
  $('#addFoodRow').addEventListener('click', () => addFoodRow(true));
  $('#activityMode').addEventListener('click', e => {
    const btn = e.target.closest('button[data-kind]');
    if (btn) setActivityMode(btn.dataset.kind);
  });

  // Photo recognition
  $('#photoBtn').addEventListener('click', e => {
    if (state.ai.apiKey) return;
    e.preventDefault();
    showToast('Add your free Gemini API key in Settings first', 'error');
    location.hash = '#settings';
    setTimeout(() => $('#aiKey').focus(), 400);
  });
  $('#mealPhoto').addEventListener('change', handleMealPhoto);
  $('#aiForm').addEventListener('submit', handleAISubmit);
  $('#aiRemove').addEventListener('click', () => {
    if (!state.ai.apiKey || !confirm('Remove the Gemini API key from this device?')) return;
    state.ai = { apiKey: '', model: state.ai.model };
    Store.save(STORAGE_KEYS.ai, state.ai);
    renderAISettings();
    updatePhotoHint();
    showToast('API key removed');
  });

  // History filter
  $('#histDate').addEventListener('change', e => { if (isISO(e.target.value)) { state.historyDate = e.target.value; renderHistory(); } });
  $('#histPrev').addEventListener('click', () => { state.historyDate = addDays(state.historyDate, -1); renderHistory(); });
  $('#histNext').addEventListener('click', () => { state.historyDate = addDays(state.historyDate, 1); renderHistory(); });
  $('#histToday').addEventListener('click', () => { state.historyDate = todayISO(); renderHistory(); });

  // Settings actions
  $('#themeSwitch').addEventListener('change', e => {
    state.settings.theme = e.target.checked ? 'dark' : 'light';
    applyTheme(state.settings.theme);
    persist('settings');
    showToast(`${e.target.checked ? 'Dark' : 'Light'} theme enabled`);
  });
  $('#demoBtn').addEventListener('click', loadDemoData);
  $('#clearBtn').addEventListener('click', clearAllData);

  // Sheet dismissal
  $('#backdrop').addEventListener('click', closeSheet);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });

  // Re-render when returning to the tab (e.g. after midnight)
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
}

/* -------------------------------------------------------------------------
   15. Init
   ------------------------------------------------------------------------- */
function init() {
  loadState();
  applyTheme(state.settings.theme);

  if (chartsAvailable()) {
    Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
  }

  // Workout type chips
  $('#typeChips').innerHTML = WORKOUT_TYPES.map((t, i) => `<label class="chip" style="--c:${t.color}">
      <input type="radio" name="type" value="${t.name}" ${i === 0 ? 'checked' : ''} />
      <span><i class="dot"></i>${t.name}</span>
    </label>`).join('');
  $('#sportSelect').innerHTML = SPORT_GROUPS.map(g => `<optgroup label="${g.group}">${g.sports
    .map(([name]) => `<option value="${name}">${name}</option>`).join('')}</optgroup>`).join('');

  bindEvents();
  updatePhotoHint();
  setView(location.hash.slice(1));

  // Offline support when served over http(s); not available from file://
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    const hadController = Boolean(navigator.serviceWorker.controller);
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(reg => {
      // Installed apps are often resumed rather than relaunched, so check for updates on resume too
      document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update(); });
    }).catch(() => {});
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hadController) location.reload();
    });
  }
  if (window.caches && location.protocol.startsWith('http')) {
    caches.keys().then(keys => {
      const v = keys.find(k => k.startsWith('pulse-'));
      if (v) $('#appVersion').textContent = `Version ${v.replace('pulse-', '')}`;
    });
  }
}

init();
