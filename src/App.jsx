import { useState, useEffect, useRef, useMemo } from "react";

/* ============ NEXO FIT v4 ============
   Nuevo en v4: mapa muscular interactivo (frente/espalda) en Gym,
   base de ejercicios por músculo con tips de técnica, referencia en
   video, calculadora de sobrecarga progresiva según tu peso corporal
   y agregado directo a la rutina del día que elijas.
======================================== */

const LIGHT = {
  bg: "#F7F8FA", card: "#FFFFFF", ink: "#0A0B10", sub: "#6B7280",
  line: "#EDEEF1", soft: "#F1F2F5", input: "#FAFBFC",
  primary: "#2E5BFF", primarySoft: "#EAF0FF", primaryInk: "#1E3FCC",
  primaryGlow: "rgba(46,91,255,0.35)", accent: "#00D1FF",
  amber: "#F59E0B", amberSoft: "#FEF3E2", amberInk: "#B45309",
  blue: "#00BFFF", blueSoft: "#E5F7FF", red: "#EF4444",
  navBg: "rgba(255,255,255,0.72)", body: "#E4E6EB",
};
const DARK = {
  bg: "#08090C", card: "#101116", ink: "#F5F6F8", sub: "#8B8F9A",
  line: "#1E2028", soft: "#16171D", input: "#16171D",
  primary: "#4B7BFF", primarySoft: "#132048", primaryInk: "#A9C0FF",
  primaryGlow: "rgba(75,123,255,0.45)", accent: "#22DAFF",
  amber: "#FBBF24", amberSoft: "#3A2A0B", amberInk: "#FCD34D",
  blue: "#22DAFF", blueSoft: "#0E2A3B", red: "#F87171",
  navBg: "rgba(8,9,12,0.75)", body: "#1E2028",
};
const C = { ...LIGHT };

const FONT = '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif';
const DAYS = ["D", "L", "M", "X", "J", "V", "S"];
const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MONTHS = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const EMOJIS = ["✅","🏋️","💧","😴","📖","🧘","🚶","🥗","💊","🦷","📵","🧠","☀️","🎯"];

const TIPS = [
  "La constancia le gana al talento: 30 minutos hoy valen más que 3 horas el domingo.",
  "Proteína en cada comida: te ayuda a recuperar músculo y a mantenerte saciado.",
  "Dormí 7–8 horas. El músculo crece cuando descansás, no cuando entrenás.",
  "Antes de entrenar, 5–10 min de movilidad reducen mucho el riesgo de lesión.",
  "Sobrecarga progresiva: subí un poquito el peso o las reps cada semana.",
  "Tomá agua apenas te levantás; llegás deshidratado de la noche.",
  "No rompas la cadena: si un día no podés entrenar, hacé la versión mínima (10 min).",
  "Registrá tus pesos en cada ejercicio: lo que se mide, mejora.",
  "Las verduras suman volumen y fibra: te llenan con pocas calorías.",
  "El mejor plan es el que podés sostener 6 meses, no el más extremo.",
  "Caminar 8–10 mil pasos por día acelera la recuperación y quema extra.",
  "Comé despacio: el cerebro tarda ~20 min en registrar saciedad.",
  "Calentá con 1–2 series livianas del primer ejercicio antes de ir al peso real.",
  "Un mal día no arruina nada; una mala semana repetida, sí. Volvé al plan hoy.",
  "Preparar la comida con anticipación evita decisiones impulsivas.",
  "Descansá 2–3 min entre series pesadas y 60–90 s en accesorios.",
  "Pesarte siempre a la misma hora (al despertar) hace comparables los números.",
];

/* ============ BASE DE EJERCICIOS POR MÚSCULO ============
   ratio = 1RM estimado / peso corporal para niveles
   [principiante, intermedio, avanzado]. null = aislamiento o
   peso corporal (se progresa por reps).                      */
const EXDB = {
  pecho: { label: "Pecho", icon: "🫀", exercises: [
    { name: "Press banca con barra", eq: "Barra", ratio: [0.6, 1.0, 1.5],
      tip: "Escápulas retraídas y pies firmes. Bajá la barra al pecho medio con control y empujá en diagonal hacia arriba." },
    { name: "Press inclinado con mancuernas", eq: "Mancuernas", ratio: [0.2, 0.35, 0.5],
      tip: "Banco a 30–45°. Bajá hasta sentir estiramiento en el pecho superior sin que los codos pasen mucho el torso." },
    { name: "Aperturas con mancuernas", eq: "Mancuernas", ratio: null,
      tip: "Codos levemente flexionados y fijos. Es un abrazo amplio: sentí el estiramiento, no busques peso." },
    { name: "Flexiones de brazos", eq: "Peso corporal", ratio: null,
      tip: "Cuerpo en línea recta, manos bajo los hombros. Pecho casi al piso en cada rep." },
    { name: "Fondos en paralelas", eq: "Peso corporal", ratio: null,
      tip: "Inclinándote hacia adelante trabajás más pecho; vertical, más tríceps. Bajá hasta 90° de codo." },
    { name: "Cruce de poleas", eq: "Polea", ratio: null,
      tip: "Paso adelante, torso levemente inclinado. Juntá las manos al frente apretando el pecho 1 segundo." },
  ]},
  hombros: { label: "Hombros", icon: "🪨", exercises: [
    { name: "Press militar con barra", eq: "Barra", ratio: [0.4, 0.65, 0.9],
      tip: "Glúteos y abdomen apretados para no arquear la espalda. La barra sube en línea recta pasando cerca de la cara." },
    { name: "Press con mancuernas sentado", eq: "Mancuernas", ratio: [0.15, 0.3, 0.45],
      tip: "Respaldo casi vertical. Bajá hasta que las mancuernas queden a la altura de las orejas." },
    { name: "Vuelos laterales", eq: "Mancuernas", ratio: null,
      tip: "Peso liviano y codos apenas flexionados. Subí hasta la horizontal como sirviendo dos jarras." },
    { name: "Vuelos posteriores", eq: "Mancuernas", ratio: null,
      tip: "Torso inclinado casi paralelo al piso. Abrí los brazos apretando la parte trasera del hombro." },
    { name: "Face pull", eq: "Polea", ratio: null,
      tip: "Tirá la soga hacia la cara separando las manos al final. Excelente para postura y salud del hombro." },
    { name: "Press Arnold", eq: "Mancuernas", ratio: null,
      tip: "Arrancá con palmas hacia vos y rotá mientras subís. Recorrido largo: usá menos peso que en press normal." },
  ]},
  biceps: { label: "Bíceps", icon: "💪", exercises: [
    { name: "Curl con barra", eq: "Barra", ratio: [0.25, 0.45, 0.65],
      tip: "Codos pegados al torso, sin balancear el cuerpo. Bajá lento: la fase negativa construye músculo." },
    { name: "Curl alternado con mancuernas", eq: "Mancuernas", ratio: null,
      tip: "Rotá la muñeca al subir (supinación) para activar el bíceps completo." },
    { name: "Curl martillo", eq: "Mancuernas", ratio: null,
      tip: "Agarre neutro (palmas enfrentadas). Trabaja también el braquial y el antebrazo." },
    { name: "Curl en banco inclinado", eq: "Mancuernas", ratio: null,
      tip: "Brazos colgando detrás del torso: máximo estiramiento. Usá menos peso del habitual." },
    { name: "Curl en polea baja", eq: "Polea", ratio: null,
      tip: "Tensión constante en todo el recorrido. Ideal para terminar con series de 12–15." },
    { name: "Chin-ups (dominadas supinas)", eq: "Peso corporal", ratio: null,
      tip: "Agarre con palmas hacia vos, al ancho de hombros. Uno de los mejores constructores de bíceps." },
  ]},
  antebrazos: { label: "Antebrazos", icon: "🤜", exercises: [
    { name: "Curl de muñeca con barra", eq: "Barra", ratio: null,
      tip: "Antebrazos apoyados en el banco, muñecas por fuera. Movimiento corto y controlado, reps altas (15–20)." },
    { name: "Paseo del granjero", eq: "Mancuernas", ratio: null,
      tip: "Agarrá pesado y caminá derecho 20–40 metros. Fuerza de agarre real para todo." },
    { name: "Curl invertido", eq: "Barra", ratio: null,
      tip: "Agarre con palmas hacia abajo. Trabaja el dorso del antebrazo y el braquiorradial." },
    { name: "Colgarse de la barra", eq: "Peso corporal", ratio: null,
      tip: "Acumulá tiempo colgado (30–60 s por serie). Mejora agarre, hombros y descompresión de columna." },
  ]},
  abdomen: { label: "Abdomen", icon: "🧱", exercises: [
    { name: "Plancha", eq: "Peso corporal", ratio: null,
      tip: "Codos bajo hombros, glúteos apretados, sin hundir la cadera. Sumá 5–10 s por semana." },
    { name: "Crunch en polea", eq: "Polea", ratio: null,
      tip: "De rodillas, enrollá el torso llevando codos hacia las rodillas. El abdomen se entrena con carga también." },
    { name: "Elevación de piernas colgado", eq: "Peso corporal", ratio: null,
      tip: "Subí las piernas sin balancearte, basculando la pelvis al final. Si es difícil, empezá con rodillas al pecho." },
    { name: "Rueda abdominal", eq: "Rueda", ratio: null,
      tip: "Desde rodillas, rodá hasta donde controles sin arquear la zona lumbar. Volvé con el abdomen, no con los brazos." },
    { name: "Pallof press", eq: "Polea", ratio: null,
      tip: "Antirotación: empujá la manija al frente resistiendo que el cable te gire. Oro para el core." },
  ]},
  cuadriceps: { label: "Cuádriceps", icon: "🦵", exercises: [
    { name: "Sentadilla con barra", eq: "Barra", ratio: [0.8, 1.25, 1.75],
      tip: "Pies al ancho de hombros, rodillas siguiendo la punta del pie. Bajá al menos hasta muslos paralelos." },
    { name: "Prensa de piernas", eq: "Máquina", ratio: [1.0, 1.8, 2.5],
      tip: "Bajá controlado hasta 90° sin despegar la cadera del asiento. No bloquees las rodillas arriba." },
    { name: "Zancadas (estocadas)", eq: "Mancuernas", ratio: null,
      tip: "Paso largo, torso erguido, rodilla trasera casi al piso. Alterná piernas o hacé caminando." },
    { name: "Sentadilla búlgara", eq: "Mancuernas", ratio: null,
      tip: "Pie trasero en banco. Brutal para cuádriceps y glúteo con poco peso. Equilibrio primero, carga después." },
    { name: "Extensiones de cuádriceps", eq: "Máquina", ratio: null,
      tip: "Apretá 1 segundo arriba y bajá lento. Ideal para pre-fatigar o terminar la sesión." },
    { name: "Sentadilla goblet", eq: "Mancuerna", ratio: null,
      tip: "Mancuerna al pecho como copa. La mejor para aprender el patrón de sentadilla con técnica limpia." },
  ]},
  gluteos: { label: "Glúteos", icon: "🍑", exercises: [
    { name: "Hip thrust con barra", eq: "Barra", ratio: [0.8, 1.4, 2.0],
      tip: "Espalda alta apoyada en banco. Empujá con talones y apretá el glúteo arriba 1 segundo, mentón al pecho." },
    { name: "Peso muerto sumo", eq: "Barra", ratio: [0.9, 1.4, 1.9],
      tip: "Postura ancha, puntas hacia afuera. La espalda se mantiene neutra todo el recorrido." },
    { name: "Puente de glúteos", eq: "Peso corporal", ratio: null,
      tip: "Versión en el piso del hip thrust. Perfecto para activar glúteos antes de piernas." },
    { name: "Patada en polea", eq: "Polea", ratio: null,
      tip: "Tobillera en polea baja. Extendé la cadera hacia atrás sin arquear la zona lumbar." },
    { name: "Abducción en máquina", eq: "Máquina", ratio: null,
      tip: "Torso inclinado hacia adelante para más glúteo medio. Reps altas, 15–20." },
  ]},
  isquios: { label: "Isquiotibiales", icon: "🦿", exercises: [
    { name: "Peso muerto rumano", eq: "Barra", ratio: [0.6, 1.0, 1.5],
      tip: "Piernas casi rectas, cadera hacia atrás como cerrando una puerta con la cola. Barra rozando las piernas." },
    { name: "Curl femoral tumbado", eq: "Máquina", ratio: null,
      tip: "Cadera pegada al banco. Subí explosivo, bajá en 3 segundos." },
    { name: "Peso muerto convencional", eq: "Barra", ratio: [1.0, 1.5, 2.0],
      tip: "El rey de la fuerza total. Espalda neutra, barra pegada al cuerpo, empujá el piso con las piernas." },
    { name: "Buenos días", eq: "Barra", ratio: null,
      tip: "Barra en la espalda, bisagra de cadera con rodillas semiflexionadas. Peso liviano y técnica perfecta." },
    { name: "Curl nórdico", eq: "Peso corporal", ratio: null,
      tip: "Caé hacia adelante frenando con los isquios. Durísimo: ayudate con las manos al principio." },
  ]},
  gemelos: { label: "Gemelos", icon: "🐐", exercises: [
    { name: "Elevación de talones de pie", eq: "Máquina", ratio: null,
      tip: "Estiramiento completo abajo (2 s) y pausa arriba (1 s). Los gemelos odian las medias reps." },
    { name: "Elevación de talones sentado", eq: "Máquina", ratio: null,
      tip: "Trabaja el sóleo (fibra lenta): reps altas, 15–25 por serie." },
    { name: "Elevación a una pierna", eq: "Peso corporal", ratio: null,
      tip: "En un escalón, con mancuerna en la mano del mismo lado. Corrige asimetrías." },
  ]},
  trapecio: { label: "Trapecio", icon: "⛰️", exercises: [
    { name: "Encogimientos con barra", eq: "Barra", ratio: null,
      tip: "Subí los hombros hacia las orejas sin rotarlos. Pausa arriba, bajá lento." },
    { name: "Encogimientos con mancuernas", eq: "Mancuernas", ratio: null,
      tip: "Brazos a los costados permiten mayor rango que la barra. Agarre firme o con straps." },
    { name: "Remo al mentón", eq: "Barra", ratio: null,
      tip: "Agarre amplio para cuidar los hombros. Codos siempre por encima de las muñecas." },
  ]},
  espalda: { label: "Espalda (dorsales)", icon: "🦅", exercises: [
    { name: "Dominadas", eq: "Peso corporal", ratio: null,
      tip: "Iniciá el movimiento bajando los omóplatos, pecho hacia la barra. Si no salen, usá banda o jalón." },
    { name: "Remo con barra", eq: "Barra", ratio: [0.5, 0.9, 1.2],
      tip: "Torso inclinado 45°, barra hacia el ombligo. Apretá los omóplatos al final de cada rep." },
    { name: "Jalón al pecho", eq: "Polea", ratio: null,
      tip: "Agarre algo más ancho que hombros. Llevá la barra a la parte alta del pecho sin balancearte." },
    { name: "Remo en polea baja", eq: "Polea", ratio: null,
      tip: "Espalda recta, tirá hacia el abdomen llevando los codos atrás. No uses impulso lumbar." },
    { name: "Remo con mancuerna a un brazo", eq: "Mancuerna", ratio: null,
      tip: "Rodilla y mano apoyadas en banco. Tirá la mancuerna hacia la cadera, no hacia el hombro." },
    { name: "Pullover en polea", eq: "Polea", ratio: null,
      tip: "Brazos casi rectos, llevá la barra desde arriba hasta los muslos. Aísla el dorsal como pocos." },
  ]},
  lumbar: { label: "Zona lumbar", icon: "🛡️", exercises: [
    { name: "Extensiones lumbares (banco 45°)", eq: "Banco", ratio: null,
      tip: "Subí hasta la línea del cuerpo, no hiperextiendas. Sumá disco al pecho cuando sea fácil." },
    { name: "Superman", eq: "Peso corporal", ratio: null,
      tip: "Boca abajo, elevá brazos y piernas a la vez con pausa de 2 s arriba." },
    { name: "Bird dog", eq: "Peso corporal", ratio: null,
      tip: "En cuadrupedia, extendé brazo y pierna opuestos sin rotar la cadera. Estabilidad pura." },
  ]},
  triceps: { label: "Tríceps", icon: "🔱", exercises: [
    { name: "Press francés", eq: "Barra", ratio: null,
      tip: "Acostado, bajá la barra a la frente con codos fijos apuntando al techo." },
    { name: "Extensiones en polea", eq: "Polea", ratio: null,
      tip: "Codos pegados al cuerpo, extendé hasta bloquear apretando el tríceps." },
    { name: "Press banca agarre cerrado", eq: "Barra", ratio: [0.5, 0.85, 1.2],
      tip: "Manos al ancho de hombros, codos cerca del torso. El mejor constructor de masa de tríceps." },
    { name: "Fondos entre bancos", eq: "Peso corporal", ratio: null,
      tip: "Manos en un banco, pies en otro. Bajá hasta 90° de codo; sumá disco en las piernas para progresar." },
    { name: "Extensión sobre la cabeza", eq: "Mancuerna", ratio: null,
      tip: "Una mancuerna con ambas manos detrás de la cabeza. Estira la cabeza larga del tríceps." },
  ]},
};

const FRONT_MUSCLES = ["hombros", "pecho", "biceps", "antebrazos", "abdomen", "cuadriceps"];
const BACK_MUSCLES = ["trapecio", "espalda", "triceps", "lumbar", "gluteos", "isquios", "gemelos"];

/* ---------- utilidades ---------- */
const dstr = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const dayOfYear = (d = new Date()) => Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
const lastNDays = (n) => {
  const out = [];
  for (let i = n - 1; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); out.push(d); }
  return out;
};
const uid = () => Math.random().toString(36).slice(2, 9);
const fmtDate = (key) => {
  const [y, m, d] = key.split("-").map(Number);
  return `${DAY_NAMES[new Date(y, m - 1, d).getDay()].slice(0, 3)} ${d} ${MONTHS[m - 1].slice(0, 3)}`;
};
const ytLink = (name) => `https://www.youtube.com/results?search_query=${encodeURIComponent("como hacer " + name + " técnica")}`;

/* ---------- PIN de bloqueo ---------- */
const PIN_KEY = "nexofit-pin-hash-v1";
const PIN_SESSION = "nexofit-unlocked";

async function hashPin(pin) {
  const data = new TextEncoder().encode("nexofit-salt:" + pin);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/* ---------- análisis de sobrecarga progresiva ---------- */
function analyzeLift(ex, weight, reps, bodyWeight) {
  const w = Number(weight) || 0;
  const r = Number(reps) || 0;
  if (!r) return null;
  const e1rm = w > 0 ? Math.round(w * (1 + r / 30)) : null;

  let level = null, nextTarget = null;
  if (ex.ratio && bodyWeight > 0 && e1rm) {
    const rel = e1rm / bodyWeight;
    const [beg, int_, adv] = ex.ratio;
    if (rel < beg) { level = "Iniciando"; nextTarget = Math.round(beg * bodyWeight); }
    else if (rel < int_) { level = "Principiante"; nextTarget = Math.round(int_ * bodyWeight); }
    else if (rel < adv) { level = "Intermedio 💪"; nextTarget = Math.round(adv * bodyWeight); }
    else { level = "Avanzado 🏆"; nextTarget = null; }
  }

  let advice, tone;
  if (w === 0) {
    if (r >= 15) { advice = "Dominás el peso corporal: sumá lastre o pasá a una variante más difícil."; tone = "up"; }
    else if (r >= 8) { advice = "Vas bien: sumá 1–2 reps por sesión hasta llegar a 15."; tone = "ok"; }
    else { advice = "Seguí acumulando reps con buena técnica; la fuerza llega con la práctica."; tone = "ok"; }
  } else if (r >= 12) { advice = "¡Subí el peso! Agregá 2,5–5 kg y volvé a un rango de ~8 reps."; tone = "up"; }
  else if (r >= 8) { advice = "Zona ideal de hipertrofia. Sumá 1 rep por sesión y al llegar a 12, subí peso."; tone = "ok"; }
  else if (r >= 5) { advice = "Peso desafiante (fuerza). Mantenelo hasta dominar 8 reps limpias antes de subir."; tone = "hold"; }
  else { advice = "Muy pesado para hipertrofia: bajá un 10 % y priorizá la técnica."; tone = "down"; }

  return { e1rm, level, nextTarget, advice, tone };
}

/* ---------- estado inicial ---------- */
const initialState = {
  theme: "light",
  habits: [
    { id: "h1", name: "Entrenar", icon: "🏋️", days: [1, 2, 3, 4, 5], history: {} },
    { id: "h2", name: "Tomar 2L de agua", icon: "💧", days: [0, 1, 2, 3, 4, 5, 6], history: {} },
    { id: "h3", name: "Dormir antes de las 00", icon: "😴", days: [0, 1, 2, 3, 4, 5, 6], history: {} },
  ],
  workouts: {
    1: { name: "Pecho y tríceps", exercises: [
      { id: uid(), name: "Press banca con barra", sets: 4, reps: "8-10", weight: 40 },
      { id: uid(), name: "Press inclinado con mancuernas", sets: 3, reps: "10-12", weight: 14 },
      { id: uid(), name: "Fondos en paralelas", sets: 3, reps: "máx", weight: 0 },
    ]},
    2: { name: "Espalda y bíceps", exercises: [
      { id: uid(), name: "Dominadas", sets: 4, reps: "8-10", weight: 0 },
      { id: uid(), name: "Remo con barra", sets: 3, reps: "10", weight: 30 },
      { id: uid(), name: "Curl con barra", sets: 3, reps: "12", weight: 15 },
    ]},
    3: { name: "Piernas", exercises: [
      { id: uid(), name: "Sentadilla con barra", sets: 4, reps: "8", weight: 50 },
      { id: uid(), name: "Peso muerto rumano", sets: 3, reps: "10", weight: 40 },
      { id: uid(), name: "Elevación de talones de pie", sets: 4, reps: "15", weight: 20 },
    ]},
    4: { name: "Hombros y core", exercises: [
      { id: uid(), name: "Press militar con barra", sets: 4, reps: "8-10", weight: 25 },
      { id: uid(), name: "Vuelos laterales", sets: 3, reps: "12-15", weight: 8 },
      { id: uid(), name: "Plancha", sets: 3, reps: "45s", weight: 0 },
    ]},
    5: { name: "Full body", exercises: [
      { id: uid(), name: "Sentadilla goblet", sets: 3, reps: "10", weight: 0 },
    ]},
  },
  workoutLog: {},
  sessionLog: {},
  exerciseHistory: {},
  meals: {},
  mealLibrary: [],
  water: {},
  weightLog: {},
  measurements: [],
  notes: {},
  reminders: [
    { id: uid(), text: "Hora de entrenar 💪", time: "18:00", days: [1, 2, 3, 4, 5] },
    { id: uid(), text: "Registrá tu cena 🍽️", time: "21:30", days: [0, 1, 2, 3, 4, 5, 6] },
  ],
  goals: { kcal: 2500, protein: 140, carbs: 300, fat: 80, water: 8 },
  customTips: [],
};

const STORAGE_KEY = "nexofit-state-v4";

async function loadState() {
  for (const key of [STORAGE_KEY, "nexofit-state-v3", "nexofit-state-v2", "nexofit-state-v1"]) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
  }
  return null;
}

/* ============ componentes base ============ */

function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: C.card, borderRadius: 18, padding: 16,
      border: `1px solid ${C.line}`,
      boxShadow: "0 1px 2px rgba(0,0,0,0.03), 0 4px 12px rgba(0,0,0,0.02)",
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", margin: "20px 4px 10px" }}>
      <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: C.sub }}>{children}</div>
      {right}
    </div>
  );
}

function Ring({ pct, size = 120, stroke = 12, color, children }) {
  const col = color || C.primary;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - Math.min(1, Math.max(0, pct)));
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.line} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {children}
      </div>
    </div>
  );
}

function Check({ done, onClick, color }) {
  const col = color || C.primary;
  return (
    <button onClick={onClick} aria-label={done ? "Desmarcar" : "Marcar"}
      style={{
        width: 30, height: 30, borderRadius: 15, border: done ? "none" : `2px solid ${C.line}`,
        background: done ? col : "transparent", color: "#fff", fontSize: 16, fontWeight: 800,
        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
      }}>
      {done ? "✓" : ""}
    </button>
  );
}

function Btn({ children, onClick, kind = "primary", small, style }) {
  const base = {
    border: "none", borderRadius: 12, fontWeight: 700, cursor: "pointer", fontFamily: FONT,
    padding: small ? "8px 14px" : "12px 18px", fontSize: small ? 13 : 15, whiteSpace: "nowrap",
    letterSpacing: -0.1,
  };
  const kinds = {
    primary: {
      background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
      color: "#fff",
      boxShadow: `0 4px 14px ${C.primaryGlow}`,
    },
    soft: { background: C.primarySoft, color: C.theme === "dark" ? C.primaryInk : C.primary },
    ghost: { background: "transparent", color: C.sub },
    danger: { background: "transparent", color: C.red },
    dark: { background: C.ink, color: C.bg },
  };
  return <button onClick={onClick} style={{ ...base, ...kinds[kind], ...style }}>{children}</button>;
}

function Input(props) {
  return (
    <input {...props} style={{
      width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 12,
      border: `1.5px solid ${C.line}`, fontSize: 15, fontFamily: FONT, background: C.input,
      color: C.ink, outline: "none", colorScheme: C.theme === "dark" ? "dark" : "light", ...props.style,
    }} />
  );
}

function DayPicker({ days, onToggle }) {
  return (
    <div style={{ display: "flex", gap: 5 }}>
      {DAYS.map((lbl, i) => (
        <button key={i} onClick={() => onToggle(i)} style={{
          flex: 1, padding: "7px 0", borderRadius: 8, border: "none", cursor: "pointer",
          fontWeight: 700, fontSize: 12, fontFamily: FONT,
          background: days.includes(i) ? C.primarySoft : C.soft,
          color: days.includes(i) ? (C.theme === "dark" ? C.primaryInk : C.primary) : C.sub,
        }}>{lbl}</button>
      ))}
    </div>
  );
}

/* ============ MAPA MUSCULAR ============ */
function BodyMap({ side, selected, onSelect }) {
  const sel = (id) => selected === id;
  const P = (id) => ({
    fill: sel(id) ? C.amber : C.primary,
    opacity: sel(id) ? 1 : 0.55,
    cursor: "pointer",
    stroke: sel(id) ? C.ink : "none",
    strokeWidth: 1.5,
    onClick: () => onSelect(id),
    style: { transition: "opacity 0.15s" },
  });

  return (
    <svg viewBox="0 0 200 430" style={{ width: "100%", maxWidth: 230, display: "block", margin: "0 auto" }}>
      {/* silueta */}
      <g fill={C.body}>
        <circle cx="100" cy="28" r="17" />
        <rect x="92" y="42" width="16" height="14" rx="5" />
        <path d="M62 58 h76 a10 10 0 0 1 10 10 v100 a10 10 0 0 1 -10 10 h-76 a10 10 0 0 1 -10 -10 v-100 a10 10 0 0 1 10 -10 z" />
        <rect x="34" y="66" width="20" height="120" rx="10" />
        <rect x="146" y="66" width="20" height="120" rx="10" />
        <rect x="66" y="178" width="30" height="170" rx="13" />
        <rect x="104" y="178" width="30" height="170" rx="13" />
        <rect x="70" y="348" width="24" height="55" rx="10" />
        <rect x="106" y="348" width="24" height="55" rx="10" />
      </g>

      {side === "front" ? (
        <g>
          <ellipse cx="62" cy="72" rx="15" ry="11" {...P("hombros")} />
          <ellipse cx="138" cy="72" rx="15" ry="11" {...P("hombros")} />
          <ellipse cx="83" cy="93" rx="18" ry="14" {...P("pecho")} />
          <ellipse cx="117" cy="93" rx="18" ry="14" {...P("pecho")} />
          <ellipse cx="46" cy="112" rx="9" ry="18" {...P("biceps")} />
          <ellipse cx="154" cy="112" rx="9" ry="18" {...P("biceps")} />
          <ellipse cx="43" cy="158" rx="8" ry="22" {...P("antebrazos")} />
          <ellipse cx="157" cy="158" rx="8" ry="22" {...P("antebrazos")} />
          <rect x="83" y="112" width="34" height="58" rx="10" {...P("abdomen")} />
          <ellipse cx="81" cy="250" rx="14" ry="48" {...P("cuadriceps")} />
          <ellipse cx="119" cy="250" rx="14" ry="48" {...P("cuadriceps")} />
        </g>
      ) : (
        <g>
          <path d="M74 62 Q100 52 126 62 L118 86 Q100 78 82 86 Z" {...P("trapecio")} />
          <path d="M74 90 h52 v28 q0 8 -8 12 l-18 10 l-18 -10 q-8 -4 -8 -12 z" {...P("espalda")} />
          <ellipse cx="46" cy="112" rx="9" ry="18" {...P("triceps")} />
          <ellipse cx="154" cy="112" rx="9" ry="18" {...P("triceps")} />
          <rect x="86" y="142" width="28" height="24" rx="8" {...P("lumbar")} />
          <ellipse cx="84" cy="188" rx="16" ry="15" {...P("gluteos")} />
          <ellipse cx="116" cy="188" rx="16" ry="15" {...P("gluteos")} />
          <ellipse cx="81" cy="255" rx="13" ry="42" {...P("isquios")} />
          <ellipse cx="119" cy="255" rx="13" ry="42" {...P("isquios")} />
          <ellipse cx="82" cy="368" rx="10" ry="24" {...P("gemelos")} />
          <ellipse cx="118" cy="368" rx="10" ry="24" {...P("gemelos")} />
        </g>
      )}
    </svg>
  );
}

/* ============ APP ============ */

/* ============ PIN GATE ============
   Pantalla de bloqueo. Si no hay PIN configurado, permite crear uno.
   Si ya existe, pide el PIN para entrar. Al ingresarlo correctamente
   marca la sesión como desbloqueada hasta que se cierre la pestaña.
==================================== */
function PinGate({ theme, onUnlock }) {
  const [mode, setMode] = useState("loading"); // loading | create | enter
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const PAL = theme === "dark" ? DARK : LIGHT;

  useEffect(() => {
    (async () => {
      try {
        const stored = localStorage.getItem(PIN_KEY);
        setMode(stored ? "enter" : "create");
      } catch (e) { setMode("create"); }
    })();
  }, []);

  const handleKey = (k) => {
    setError("");
    if (k === "del") {
      if (mode === "create" && pin.length >= 4 && pin2.length > 0) setPin2(pin2.slice(0, -1));
      else setPin(pin.slice(0, -1));
      return;
    }
    if (mode === "create") {
      if (pin.length < 4) { setPin(pin + k); return; }
      if (pin.length === 4 && pin2.length < 4) setPin2(pin2 + k);
    } else {
      if (pin.length < 4) setPin(pin + k);
    }
  };

  useEffect(() => {
    (async () => {
      if (mode === "create" && pin.length === 4 && pin2.length === 4) {
        if (pin !== pin2) { setError("Los PIN no coinciden"); setPin(""); setPin2(""); return; }
        const h = await hashPin(pin);
        localStorage.setItem(PIN_KEY, h);
        sessionStorage.setItem(PIN_SESSION, "1");
        onUnlock();
      }
      if (mode === "enter" && pin.length === 4) {
        const h = await hashPin(pin);
        const stored = localStorage.getItem(PIN_KEY);
        if (h === stored) {
          sessionStorage.setItem(PIN_SESSION, "1");
          onUnlock();
        } else {
          setError("PIN incorrecto");
          setAttempts(attempts + 1);
          setPin("");
        }
      }
    })();
  }, [pin, pin2, mode]);

  if (mode === "loading") return <div style={{ background: PAL.bg, minHeight: "100vh" }} />;

  const shownPin = mode === "create" && pin.length === 4 ? pin2 : pin;
  const title = mode === "create"
    ? (pin.length < 4 ? "Elegí un PIN de 4 dígitos" : "Repetilo para confirmar")
    : "Ingresá tu PIN";

  return (
    <div style={{
      fontFamily: FONT, background: PAL.bg, minHeight: "100vh", color: PAL.ink,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "20px", boxSizing: "border-box", position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: "10%", left: "-20%", width: "80%", height: "60%",
        background: `radial-gradient(circle, ${PAL.primaryGlow} 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "-10%", right: "-20%", width: "80%", height: "50%",
        background: `radial-gradient(circle, ${PAL.primaryGlow} 0%, transparent 70%)`,
        opacity: 0.6, pointerEvents: "none",
      }} />

      <div style={{
        width: 64, height: 64, borderRadius: 18, marginBottom: 16,
        background: `linear-gradient(135deg, ${PAL.primary}, ${PAL.accent})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 12px 32px ${PAL.primaryGlow}`, position: "relative",
      }}>
        <span style={{ fontSize: 30 }}>🔒</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 4, letterSpacing: -0.5, position: "relative" }}>NEXO FIT</div>
      <div style={{ fontSize: 14, color: PAL.sub, fontWeight: 600, marginBottom: 32, textAlign: "center", maxWidth: 280, position: "relative" }}>
        {title}
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 28, position: "relative" }}>
        {[0, 1, 2, 3].map((i) => {
          const filled = i < shownPin.length;
          return (
            <div key={i} style={{
              width: 18, height: 18, borderRadius: 10,
              background: filled ? `linear-gradient(135deg, ${PAL.primary}, ${PAL.accent})` : "transparent",
              border: `2px solid ${filled ? "transparent" : PAL.line}`,
              boxShadow: filled ? `0 4px 12px ${PAL.primaryGlow}` : "none",
              transition: "all 0.2s",
            }} />
          );
        })}
      </div>

      {error && (
        <div style={{ color: PAL.red, fontSize: 14, fontWeight: 700, marginBottom: 16, minHeight: 20, position: "relative" }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 74px)", gap: 14, position: "relative" }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button key={n} onClick={() => handleKey(String(n))} style={{
            width: 74, height: 74, borderRadius: 22, border: `1px solid ${PAL.line}`,
            background: PAL.card, color: PAL.ink, fontSize: 26, fontWeight: 600,
            fontFamily: FONT, cursor: "pointer",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)",
            transition: "transform 0.1s",
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.95)"}
          onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          onTouchStart={(e) => e.currentTarget.style.transform = "scale(0.95)"}
          onTouchEnd={(e) => e.currentTarget.style.transform = "scale(1)"}
          >{n}</button>
        ))}
        <div />
        <button onClick={() => handleKey("0")} style={{
          width: 74, height: 74, borderRadius: 22, border: `1px solid ${PAL.line}`,
          background: PAL.card, color: PAL.ink, fontSize: 26, fontWeight: 600,
          fontFamily: FONT, cursor: "pointer",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)",
        }}>0</button>
        <button onClick={() => handleKey("del")} style={{
          width: 74, height: 74, borderRadius: 22, border: "none",
          background: "transparent", color: PAL.sub, fontSize: 22, fontWeight: 700,
          fontFamily: FONT, cursor: "pointer",
        }}>⌫</button>
      </div>

      {mode === "enter" && attempts >= 3 && (
        <div style={{ marginTop: 30, textAlign: "center", maxWidth: 300 }}>
          <div style={{ fontSize: 13, color: PAL.sub, marginBottom: 10, lineHeight: 1.5 }}>
            ¿Olvidaste tu PIN? Podés restablecerlo, pero se pierden todos tus datos.
          </div>
          <button onClick={() => {
            if (confirm("¿Borrar todos los datos y restablecer PIN?")) {
              localStorage.clear();
              sessionStorage.clear();
              location.reload();
            }
          }} style={{
            border: "none", background: "transparent", color: PAL.red,
            fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: FONT,
          }}>Restablecer app</button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [state, setState] = useState(initialState);
  const [loaded, setLoaded] = useState(false);
  const [locked, setLocked] = useState(() => {
    try {
      const hasPin = !!localStorage.getItem(PIN_KEY);
      const unlocked = sessionStorage.getItem(PIN_SESSION) === "1";
      return hasPin && !unlocked;
    } catch (e) { return false; }
  });
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [installHidden, setInstallHidden] = useState(() => {
    try { return localStorage.getItem("nexofit-install-hidden") === "1"; } catch (e) { return false; }
  });
  const [tab, setTab] = useState("hoy");
  const [banner, setBanner] = useState(null);
  const [editHabit, setEditHabit] = useState(null);
  const [habitMonth, setHabitMonth] = useState(null);
  const [editEx, setEditEx] = useState(null);
  const [exDetail, setExDetail] = useState(null);
  const [editRem, setEditRem] = useState(null);
  const [gymDay, setGymDay] = useState(new Date().getDay());
  const [gymView, setGymView] = useState("rutina");
  const [mapSide, setMapSide] = useState("front");
  const [muscle, setMuscle] = useState(null);
  const [openLift, setOpenLift] = useState(null);
  const [liftCalc, setLiftCalc] = useState({ w: "", r: "" });
  const [addDay, setAddDay] = useState(new Date().getDay());
  const [timer, setTimer] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const firedRef = useRef({});
  const saveTimer = useRef(null);

  Object.assign(C, state.theme === "dark" ? DARK : LIGHT, { theme: state.theme });

  const today = dstr();
  const todayDate = new Date();
  const dow = todayDate.getDay();
  const allTips = [...(state.customTips || []), ...TIPS];
  const tip = allTips[dayOfYear() % allTips.length];

  useEffect(() => {
    (async () => {
      const s = await loadState();
      if (s) setState((prev) => ({ ...prev, ...s, goals: { ...prev.goals, ...(s.goals || {}) } }));
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
    }, 500);
  }, [state, loaded]);

  useEffect(() => {
    // Detectar si la app ya está instalada como PWA
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    if (isStandalone) setInstalled(true);

    // Chrome / Android: capturar el evento beforeinstallprompt
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Cuando el usuario efectivamente instala la app
    const installed = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };
    window.addEventListener("appinstalled", installed);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  const triggerInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === "accepted") {
        setInstalled(true);
        setInstallPrompt(null);
      }
    } else {
      // Fallback (iOS Safari no soporta beforeinstallprompt)
      setBanner("En iPhone: tocá Compartir ⬆️ y elegí 'Añadir a pantalla de inicio'");
      setTimeout(() => setBanner(null), 8000);
    }
  };

  useEffect(() => {
    const check = () => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      state.reminders.forEach((r) => {
        const key = `${r.id}-${dstr(now)}`;
        if (r.time === hhmm && r.days.includes(now.getDay()) && !firedRef.current[key]) {
          firedRef.current[key] = true;
          setBanner(r.text);
          setTimeout(() => setBanner(null), 12000);
        }
      });
    };
    const iv = setInterval(check, 20000);
    check();
    return () => clearInterval(iv);
  }, [state.reminders]);

  useEffect(() => {
    if (timer <= 0) return;
    const t = setTimeout(() => {
      if (timer === 1) setBanner("¡Descanso terminado! Siguiente serie 🔔");
      setTimer(timer - 1);
    }, 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const up = (fn) => setState((s) => fn(structuredClone(s)));

  /* ---------- métricas ---------- */
  const habitsToday = state.habits.filter((h) => h.days.includes(dow));
  const habitsDone = habitsToday.filter((h) => h.history[today]).length;
  const workout = state.workouts[dow];
  const wLog = state.workoutLog[today] || {};
  const exDone = workout ? workout.exercises.filter((e) => wLog[e.id]).length : 0;
  const exTotal = workout ? workout.exercises.length : 0;
  const mealsToday = state.meals[today] || [];
  const sumM = (k) => mealsToday.reduce((a, m) => a + (Number(m[k]) || 0), 0);
  const kcal = sumM("kcal"), prot = sumM("protein"), carbs = sumM("carbs"), fat = sumM("fat");
  const water = state.water[today] || 0;

  const weightEntriesAll = Object.entries(state.weightLog).sort((a, b) => a[0].localeCompare(b[0]));
  const bodyWeight = weightEntriesAll.length ? Number(weightEntriesAll[weightEntriesAll.length - 1][1]) : 0;

  const dayPct = useMemo(() => {
    const parts = [];
    if (habitsToday.length) parts.push(habitsDone / habitsToday.length);
    if (exTotal) parts.push(exDone / exTotal);
    parts.push(Math.min(1, water / state.goals.water));
    return parts.reduce((a, b) => a + b, 0) / parts.length;
  }, [habitsDone, habitsToday.length, exDone, exTotal, water, state.goals.water]);

  const streak = (h) => {
    let s = 0;
    const d = new Date();
    for (;;) {
      const key = dstr(d);
      if (h.days.includes(d.getDay())) {
        if (h.history[key]) s++;
        else if (key !== today) break;
      }
      d.setDate(d.getDate() - 1);
      if (s > 365) break;
    }
    return s;
  };

  const week = lastNDays(7);
  const weekTrained = week.filter((d) => (state.sessionLog[dstr(d)] || []).length > 0).length;
  const weekHabitPct = (() => {
    let done = 0, total = 0;
    week.forEach((d) => state.habits.forEach((h) => {
      if (h.days.includes(d.getDay())) { total++; if (h.history[dstr(d)]) done++; }
    }));
    return total ? Math.round((done / total) * 100) : 0;
  })();

  const totalWorkouts = Object.keys(state.sessionLog).filter((k) => (state.sessionLog[k] || []).length > 0).length;
  const bestStreak = Math.max(0, ...state.habits.map(streak));

  const ACHIEVEMENTS = [
    { icon: "🌱", name: "Primer paso", desc: "Completá tu primer entrenamiento", done: totalWorkouts >= 1 },
    { icon: "🔥", name: "En racha", desc: "7 días de racha en un hábito", done: bestStreak >= 7 },
    { icon: "⚡", name: "Imparable", desc: "30 días de racha en un hábito", done: bestStreak >= 30 },
    { icon: "🏋️", name: "Habitué", desc: "10 entrenamientos registrados", done: totalWorkouts >= 10 },
    { icon: "🏆", name: "Máquina", desc: "50 entrenamientos registrados", done: totalWorkouts >= 50 },
    { icon: "💧", name: "Hidratado", desc: "Meta de agua cumplida hoy", done: water >= state.goals.water },
    { icon: "📈", name: "Bajo control", desc: "Registrá tu peso 7 días", done: Object.keys(state.weightLog).length >= 7 },
    { icon: "🍎", name: "Nutrición al día", desc: "Registrá 20 comidas", done: Object.values(state.meals).flat().length >= 20 },
  ];
  const achDone = ACHIEVEMENTS.filter((a) => a.done).length;

  const toggleEx = (ex) =>
    up((s) => {
      s.workoutLog[today] = s.workoutLog[today] || {};
      s.sessionLog[today] = s.sessionLog[today] || [];
      if (s.workoutLog[today][ex.id]) {
        delete s.workoutLog[today][ex.id];
        s.sessionLog[today] = s.sessionLog[today].filter((x) => x.name !== ex.name);
        if (s.exerciseHistory[ex.name])
          s.exerciseHistory[ex.name] = s.exerciseHistory[ex.name].filter((x) => x.date !== today);
      } else {
        s.workoutLog[today][ex.id] = true;
        s.sessionLog[today].push({ name: ex.name, sets: ex.sets, reps: ex.reps, weight: ex.weight });
        s.exerciseHistory[ex.name] = s.exerciseHistory[ex.name] || [];
        if (!s.exerciseHistory[ex.name].some((x) => x.date === today))
          s.exerciseHistory[ex.name].push({ date: today, weight: Number(ex.weight) || 0 });
      }
      return s;
    });

  const prOf = (name) => {
    const h = state.exerciseHistory[name] || [];
    return h.length ? Math.max(...h.map((x) => Number(x.weight) || 0)) : null;
  };

  const addToRoutine = (exName, day, weight) => {
    up((s) => {
      if (!s.workouts[day]) s.workouts[day] = { name: "Mi rutina", exercises: [] };
      if (!s.workouts[day].exercises.some((x) => x.name === exName))
        s.workouts[day].exercises.push({ id: uid(), name: exName, sets: 3, reps: "10", weight: Number(weight) || 0 });
      return s;
    });
    setBanner(`"${exName}" agregado a ${DAY_NAMES[day]} ✅`);
    setTimeout(() => setBanner(null), 4000);
  };

  /* ============ HOY ============ */
  function Hoy() {
    const showInstall = !installed && !installHidden;
    return (
      <>
        <div style={{ padding: "4px 4px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: C.primary, textTransform: "uppercase", letterSpacing: 1.2 }}>
              {DAY_NAMES[dow]}, {todayDate.getDate()} de {MONTHS[todayDate.getMonth()]}
            </div>
            <h1 style={{ margin: "4px 0 14px", fontSize: 34, fontWeight: 800, letterSpacing: -0.8, lineHeight: 1 }}>Hoy</h1>
          </div>
          <Btn kind="soft" small onClick={() => up((s) => { s.theme = s.theme === "dark" ? "light" : "dark"; return s; })}>
            {state.theme === "dark" ? "☀️" : "🌙"}
          </Btn>
        </div>

        {showInstall && (
          <div style={{
            position: "relative", overflow: "hidden",
            background: `linear-gradient(135deg, ${C.primary} 0%, ${C.accent} 100%)`,
            borderRadius: 18, padding: "14px 16px", marginBottom: 12,
            display: "flex", alignItems: "center", gap: 12,
            boxShadow: `0 8px 24px ${C.primaryGlow}`,
          }}>
            <div style={{ fontSize: 24 }}>📲</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 14.5, letterSpacing: -0.2 }}>Instalar NEXO FIT</div>
              <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 500 }}>Como app en tu pantalla de inicio</div>
            </div>
            <button onClick={triggerInstall} style={{
              background: "#fff", color: C.primary, border: "none", borderRadius: 10,
              padding: "8px 14px", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: FONT,
            }}>Instalar</button>
            <button onClick={() => {
              try { localStorage.setItem("nexofit-install-hidden", "1"); } catch (e) {}
              setInstallHidden(true);
            }} style={{
              background: "transparent", border: "none", color: "rgba(255,255,255,0.7)",
              fontSize: 16, cursor: "pointer", padding: 4, marginLeft: -4,
            }} aria-label="Cerrar">✕</button>
          </div>
        )}

        <div style={{
          position: "relative", overflow: "hidden",
          background: C.card, borderRadius: 22, padding: "22px 20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.03)",
          border: `1px solid ${C.line}`,
        }}>
          <div style={{
            position: "absolute", top: -60, right: -60, width: 180, height: 180,
            background: `radial-gradient(circle, ${C.primaryGlow} 0%, transparent 70%)`,
            pointerEvents: "none",
          }} />
          <div style={{ display: "flex", alignItems: "center", gap: 20, position: "relative" }}>
            <Ring pct={dayPct} size={128} stroke={13}>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>{Math.round(dayPct * 100)}<span style={{ fontSize: 15, color: C.sub }}>%</span></div>
              <div style={{ fontSize: 10.5, color: C.sub, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase" }}>del día</div>
            </Ring>
            <div style={{ flex: 1, display: "grid", gap: 10 }}>
              <MiniStat label="Hábitos" value={`${habitsDone}/${habitsToday.length}`} color={C.primary} />
              <MiniStat label="Gym" value={exTotal ? `${exDone}/${exTotal}` : "Descanso"} color={C.accent} />
              <MiniStat label="Agua" value={`${water}/${state.goals.water}`} color={C.blue} />
            </div>
          </div>
        </div>

        <SectionTitle>Tip del día</SectionTitle>
        <div style={{
          borderRadius: 18, padding: "16px 18px",
          background: `linear-gradient(135deg, ${C.primarySoft} 0%, ${C.blueSoft} 100%)`,
          border: `1px solid ${C.line}`,
          display: "flex", gap: 14, alignItems: "flex-start",
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 4px 12px ${C.primaryGlow}`, fontSize: 17,
          }}>💡</div>
          <div style={{ fontSize: 14, lineHeight: 1.5, color: C.primaryInk, fontWeight: 500 }}>{tip}</div>
        </div>

        <SectionTitle>Hábitos de hoy</SectionTitle>
        <Card style={{ padding: 8 }}>
          {habitsToday.length === 0 && <Empty text="No hay hábitos programados para hoy." />}
          {habitsToday.map((h) => (
            <Row key={h.id}
              left={<span style={{ fontSize: 20 }}>{h.icon}</span>}
              title={h.name}
              sub={`🔥 ${streak(h)} día${streak(h) === 1 ? "" : "s"} de racha`}
              right={<Check done={!!h.history[today]} onClick={() =>
                up((s) => {
                  const hh = s.habits.find((x) => x.id === h.id);
                  if (hh.history[today]) delete hh.history[today]; else hh.history[today] = true;
                  return s;
                })} />}
            />
          ))}
        </Card>

        <SectionTitle>Agua</SectionTitle>
        <Card>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
            {Array.from({ length: state.goals.water }).map((_, i) => (
              <div key={i} onClick={() => up((s) => { s.water[today] = i + 1 === water ? i : i + 1; return s; })}
                style={{
                  width: 34, height: 42, borderRadius: 10, cursor: "pointer",
                  background: i < water ? C.blue : C.blueSoft,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17,
                }}>
                {i < water ? "💧" : ""}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 13, color: C.sub, fontWeight: 500 }}>Tocá un vaso para registrar.</div>
        </Card>

        {workout && (
          <>
            <SectionTitle right={<Btn kind="ghost" small onClick={() => { setGymDay(dow); setTab("gym"); }}>Ver rutina →</Btn>}>
              Gym · {workout.name}
            </SectionTitle>
            <Card style={{ padding: 8 }}>
              {workout.exercises.map((e) => (
                <Row key={e.id} title={e.name} sub={`${e.sets}×${e.reps}${e.weight ? ` · ${e.weight} kg` : ""}`}
                  right={<Check color={C.amber} done={!!wLog[e.id]} onClick={() => toggleEx(e)} />} />
              ))}
            </Card>
          </>
        )}

        <SectionTitle right={<Btn kind="ghost" small onClick={() => setTab("dieta")}>Registrar →</Btn>}>Dieta de hoy</SectionTitle>
        <Card style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <MacroBox label="Calorías" value={kcal} goal={state.goals.kcal} unit="kcal" color={C.amber} />
          <MacroBox label="Proteína" value={prot} goal={state.goals.protein} unit="g" color={C.primary} />
          <MacroBox label="Carbos" value={carbs} goal={state.goals.carbs} unit="g" color={C.blue} />
          <MacroBox label="Grasas" value={fat} goal={state.goals.fat} unit="g" color={C.red} />
        </Card>

        <SectionTitle>Nota del día</SectionTitle>
        <Card>
          <textarea
            placeholder="¿Cómo te sentiste hoy? Energía, dolores, ánimo…"
            value={state.notes[today] || ""}
            onChange={(e) => up((s) => { s.notes[today] = e.target.value; return s; })}
            style={{
              width: "100%", boxSizing: "border-box", minHeight: 70, resize: "vertical",
              border: `1.5px solid ${C.line}`, borderRadius: 12, padding: 10,
              fontFamily: FONT, fontSize: 14, background: C.input, color: C.ink, outline: "none",
            }} />
        </Card>

        <SectionTitle>Tu semana</SectionTitle>
        <Card style={{ display: "flex", gap: 12 }}>
          <BigStat value={weekTrained} label="días entrenados (7d)" color={C.amber} />
          <BigStat value={`${weekHabitPct}%`} label="hábitos cumplidos (7d)" color={C.primary} />
          <BigStat value={`${achDone}/${ACHIEVEMENTS.length}`} label="logros" color={C.blue} />
        </Card>
      </>
    );
  }

  /* ============ HÁBITOS ============ */
  const [newHabit, setNewHabit] = useState("");

  function MonthGrid({ habit }) {
    const days = lastNDays(28);
    return (
      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.sub, marginBottom: 6 }}>ÚLTIMOS 28 DÍAS</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {days.map((d) => {
            const key = dstr(d);
            const planned = habit.days.includes(d.getDay());
            const done = !!habit.history[key];
            return (
              <div key={key}
                onClick={() => up((s) => {
                  const hh = s.habits.find((x) => x.id === habit.id);
                  if (hh.history[key]) delete hh.history[key]; else hh.history[key] = true;
                  return s;
                })}
                style={{
                  aspectRatio: "1", borderRadius: 6, cursor: "pointer",
                  background: done ? C.primary : planned ? C.line : C.soft,
                  opacity: planned || done ? 1 : 0.45,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, color: done ? "#fff" : C.sub, fontWeight: 700,
                }}>
                {d.getDate()}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function Habitos() {
    return (
      <>
        <h1 style={h1Style}>Hábitos</h1>
        <Card style={{ display: "flex", gap: 8 }}>
          <Input placeholder="Nuevo hábito (ej: leer 15 min)" value={newHabit}
            onChange={(e) => setNewHabit(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addHabit()} />
          <Btn onClick={addHabit}>＋</Btn>
        </Card>

        {state.habits.map((h) => {
          const editing = editHabit === h.id;
          const showMonth = habitMonth === h.id;
          return (
            <Card key={h.id} style={{ marginTop: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 20 }}>{h.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {editing ? (
                    <Input value={h.name} onChange={(e) => up((s) => {
                      s.habits.find((x) => x.id === h.id).name = e.target.value; return s;
                    })} />
                  ) : (
                    <>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{h.name}</div>
                      <div style={{ fontSize: 12.5, color: C.amber, fontWeight: 700 }}>🔥 racha: {streak(h)}</div>
                    </>
                  )}
                </div>
                <Btn kind="ghost" small onClick={() => setHabitMonth(showMonth ? null : h.id)}>{showMonth ? "▲" : "📅"}</Btn>
                <Btn kind="soft" small onClick={() => setEditHabit(editing ? null : h.id)}>{editing ? "Listo" : "✎"}</Btn>
              </div>

              {editing && (
                <>
                  <div style={lblStyle}>ÍCONO</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                    {EMOJIS.map((em) => (
                      <button key={em} onClick={() => up((s) => { s.habits.find((x) => x.id === h.id).icon = em; return s; })}
                        style={{
                          fontSize: 18, padding: "6px 8px", borderRadius: 10, cursor: "pointer",
                          border: "none", background: h.icon === em ? C.primarySoft : C.soft,
                        }}>{em}</button>
                    ))}
                  </div>
                  <div style={lblStyle}>DÍAS</div>
                  <DayPicker days={h.days} onToggle={(i) => up((s) => {
                    const hh = s.habits.find((x) => x.id === h.id);
                    hh.days = hh.days.includes(i) ? hh.days.filter((x) => x !== i) : [...hh.days, i];
                    return s;
                  })} />
                  <div style={{ marginTop: 10, textAlign: "right" }}>
                    <Btn kind="danger" small onClick={() => {
                      setEditHabit(null);
                      up((s) => { s.habits = s.habits.filter((x) => x.id !== h.id); return s; });
                    }}>Borrar hábito</Btn>
                  </div>
                </>
              )}

              {!editing && !showMonth && (
                <div style={{ display: "flex", gap: 6 }}>
                  {lastNDays(7).map((d) => {
                    const key = dstr(d);
                    const planned = h.days.includes(d.getDay());
                    const done = !!h.history[key];
                    return (
                      <div key={key} style={{ flex: 1, textAlign: "center" }}>
                        <div style={{ fontSize: 10.5, color: C.sub, fontWeight: 700, marginBottom: 4 }}>{DAYS[d.getDay()]}</div>
                        <div onClick={() => up((s) => {
                          const hh = s.habits.find((x) => x.id === h.id);
                          if (hh.history[key]) delete hh.history[key]; else hh.history[key] = true;
                          return s;
                        })}
                          style={{
                            height: 26, borderRadius: 8, cursor: "pointer",
                            background: done ? C.primary : planned ? C.line : C.soft,
                            opacity: planned || done ? 1 : 0.5,
                          }} />
                      </div>
                    );
                  })}
                </div>
              )}

              {showMonth && <MonthGrid habit={h} />}
            </Card>
          );
        })}
      </>
    );
  }

  const addHabit = () => {
    const name = newHabit.trim();
    if (!name) return;
    up((s) => { s.habits.push({ id: uid(), name, icon: "✅", days: [0,1,2,3,4,5,6], history: {} }); return s; });
    setNewHabit("");
  };

  /* ============ GYM ============ */
  const [newEx, setNewEx] = useState({ name: "", sets: 3, reps: "10", weight: 0 });
  const gymW = state.workouts[gymDay];

  function Musculos() {
    const muscles = mapSide === "front" ? FRONT_MUSCLES : BACK_MUSCLES;
    const md = muscle ? EXDB[muscle] : null;

    return (
      <>
        <Card>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            {[["front", "Frente"], ["back", "Espalda"]].map(([id, lbl]) => (
              <button key={id} onClick={() => { setMapSide(id); setMuscle(null); setOpenLift(null); }} style={{
                flex: 1, padding: "9px 0", borderRadius: 10, border: "none", cursor: "pointer",
                fontWeight: 800, fontSize: 13, fontFamily: FONT,
                background: mapSide === id ? C.ink : C.soft, color: mapSide === id ? C.bg : C.sub,
              }}>{lbl}</button>
            ))}
          </div>
          <BodyMap side={mapSide} selected={muscle} onSelect={(m) => { setMuscle(m === muscle ? null : m); setOpenLift(null); }} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginTop: 8 }}>
            {muscles.map((m) => (
              <button key={m} onClick={() => { setMuscle(m === muscle ? null : m); setOpenLift(null); }} style={{
                border: "none", borderRadius: 10, padding: "7px 10px", cursor: "pointer",
                fontFamily: FONT, fontWeight: 700, fontSize: 12.5,
                background: muscle === m ? C.amber : C.soft,
                color: muscle === m ? "#fff" : C.sub,
              }}>{EXDB[m].icon} {EXDB[m].label}</button>
            ))}
          </div>
          <div style={{ fontSize: 12.5, color: C.sub, textAlign: "center", marginTop: 8 }}>
            Tocá un músculo en el cuerpo o en las etiquetas.
          </div>
        </Card>

        {!bodyWeight && (
          <Card style={{ marginTop: 10, background: C.amberSoft }}>
            <div style={{ fontSize: 13.5, color: C.amberInk, fontWeight: 600, lineHeight: 1.4 }}>
              💡 Registrá tu peso corporal en la pestaña Dieta para que el análisis de fuerza sea relativo a tu peso.
            </div>
          </Card>
        )}

        {md && (
          <>
            <SectionTitle>{md.icon} Ejercicios de {md.label.toLowerCase()}</SectionTitle>
            <div style={{ marginBottom: 8 }}>
              <div style={lblStyle}>AGREGAR A LA RUTINA DEL DÍA:</div>
              <DayPicker days={[addDay]} onToggle={(i) => setAddDay(i)} />
            </div>
            {md.exercises.map((e) => {
              const open = openLift === e.name;
              const an = open ? analyzeLift(e, liftCalc.w, liftCalc.r, bodyWeight) : null;
              const toneColor = an ? { up: C.primary, ok: C.blue, hold: C.amber, down: C.red }[an.tone] : null;
              const inRoutine = Object.values(state.workouts).some((w) => w && w.exercises.some((x) => x.name === e.name));
              return (
                <Card key={e.name} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>
                        {e.name} {inRoutine && <span style={{ fontSize: 11, color: C.primary, fontWeight: 800 }}>· en tu rutina ✓</span>}
                      </div>
                      <div style={{ fontSize: 12.5, color: C.sub, fontWeight: 600 }}>{e.eq}{e.ratio ? " · con análisis de fuerza" : ""}</div>
                    </div>
                    <Btn kind="soft" small onClick={() => { setOpenLift(open ? null : e.name); setLiftCalc({ w: "", r: "" }); }}>
                      {open ? "▲" : "Ver"}
                    </Btn>
                  </div>

                  {open && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ background: C.soft, borderRadius: 12, padding: 12, fontSize: 13.5, lineHeight: 1.5, marginBottom: 10 }}>
                        <b>Técnica:</b> {e.tip}
                      </div>
                      <a href={ytLink(e.name)} target="_blank" rel="noreferrer"
                        style={{ display: "inline-block", fontSize: 13.5, fontWeight: 700, color: C.blue, textDecoration: "none", marginBottom: 12 }}>
                        📺 Ver cómo se hace (videos de referencia) →
                      </a>

                      <div style={{ fontWeight: 700, fontSize: 13.5, margin: "4px 0 8px" }}>¿Cómo venís con este ejercicio?</div>
                      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                        <div style={{ flex: 1 }}>
                          <div style={lblStyle}>Peso que usás (kg)</div>
                          <Input type="number" placeholder="0 si es sin peso" value={liftCalc.w} onChange={(ev) => setLiftCalc({ ...liftCalc, w: ev.target.value })} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={lblStyle}>Reps que lográs</div>
                          <Input type="number" placeholder="ej: 10" value={liftCalc.r} onChange={(ev) => setLiftCalc({ ...liftCalc, r: ev.target.value })} />
                        </div>
                      </div>

                      {an && (
                        <div style={{ borderLeft: `4px solid ${toneColor}`, background: C.soft, borderRadius: 12, padding: 12, marginBottom: 10 }}>
                          <div style={{ fontWeight: 800, fontSize: 14, color: toneColor, marginBottom: 4 }}>
                            {an.tone === "up" ? "🔺 Momento de subir" : an.tone === "ok" ? "✅ Vas por buen camino" : an.tone === "hold" ? "💪 Consolidá este peso" : "⚠️ Ajustá la carga"}
                          </div>
                          <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>{an.advice}</div>
                          {an.e1rm ? (
                            <div style={{ fontSize: 12.5, color: C.sub, marginTop: 6, fontWeight: 600 }}>
                              Tu 1RM estimado: ~{an.e1rm} kg
                              {an.level ? ` · Nivel: ${an.level}` : ""}
                              {an.nextTarget ? ` · Próxima meta: ${an.nextTarget} kg de 1RM` : ""}
                              {bodyWeight ? ` (peso corporal: ${bodyWeight} kg)` : ""}
                            </div>
                          ) : null}
                        </div>
                      )}

                      <Btn onClick={() => addToRoutine(e.name, addDay, liftCalc.w)} style={{ width: "100%" }}>
                        ＋ Agregar a {DAY_NAMES[addDay]}
                      </Btn>
                    </div>
                  )}
                </Card>
              );
            })}
          </>
        )}
      </>
    );
  }

  function Gym() {
    const historyDates = Object.keys(state.sessionLog)
      .filter((k) => (state.sessionLog[k] || []).length > 0)
      .sort((a, b) => b.localeCompare(a));

    return (
      <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={h1Style}>Gimnasio</h1>
          {timer > 0 ? (
            <Btn kind="dark" small onClick={() => setTimer(0)}>⏱ {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, "0")} ✕</Btn>
          ) : (
            <div style={{ display: "flex", gap: 6 }}>
              {[60, 90, 120].map((t) => <Btn key={t} kind="soft" small onClick={() => setTimer(t)}>⏱{t}s</Btn>)}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {[["rutina", "Rutina"], ["musculos", "🧍 Músculos"], ["historial", "Historial"]].map(([id, lbl]) => (
            <button key={id} onClick={() => setGymView(id)} style={{
              flex: 1, padding: "10px 0", borderRadius: 12, border: "none", cursor: "pointer",
              fontWeight: 800, fontSize: 13, fontFamily: FONT,
              background: gymView === id ? C.ink : C.card, color: gymView === id ? C.bg : C.sub,
            }}>{lbl}</button>
          ))}
        </div>

        {gymView === "musculos" && Musculos()}

        {gymView === "historial" && (
          <>
            {historyDates.length === 0 && <Card><Empty text="Todavía no registraste entrenamientos. Marcá ejercicios como hechos y van a aparecer acá." /></Card>}
            {historyDates.map((k) => (
              <Card key={k} style={{ marginBottom: 8 }}>
                <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 6, textTransform: "capitalize" }}>
                  {fmtDate(k)} <span style={{ color: C.sub, fontWeight: 600 }}>· {state.sessionLog[k].length} ejercicio{state.sessionLog[k].length === 1 ? "" : "s"}</span>
                </div>
                {state.sessionLog[k].map((e, i) => (
                  <div key={i} style={{ fontSize: 13.5, color: C.sub, padding: "3px 0", fontWeight: 500 }}>
                    • {e.name} — {e.sets}×{e.reps}{e.weight ? ` · ${e.weight} kg` : ""}
                  </div>
                ))}
              </Card>
            ))}
          </>
        )}

        {gymView === "rutina" && (
          <>
            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
              {DAYS.map((lbl, i) => (
                <button key={i} onClick={() => { setGymDay(i); setEditEx(null); }} style={{
                  flex: 1, padding: "10px 0", borderRadius: 12, border: "none", cursor: "pointer",
                  fontWeight: 800, fontSize: 13, fontFamily: FONT,
                  background: gymDay === i ? C.ink : C.card,
                  color: gymDay === i ? C.bg : state.workouts[i] ? C.ink : C.sub,
                }}>{lbl}</button>
              ))}
            </div>

            <Card>
              <Input placeholder="Nombre del entrenamiento (ej: Piernas)"
                value={gymW?.name || ""}
                onChange={(e) => up((s) => {
                  if (!s.workouts[gymDay]) s.workouts[gymDay] = { name: "", exercises: [] };
                  s.workouts[gymDay].name = e.target.value;
                  return s;
                })}
                style={{ fontWeight: 700, fontSize: 17 }} />
              {!gymW && <div style={{ fontSize: 13.5, color: C.sub, marginTop: 8 }}>Día de descanso. Escribí un nombre para crear una rutina, o agregá ejercicios desde 🧍 Músculos.</div>}
              {gymW && (
                <div style={{ marginTop: 8, textAlign: "right" }}>
                  <Btn kind="danger" small onClick={() => up((s) => { delete s.workouts[gymDay]; return s; })}>Borrar rutina del día</Btn>
                </div>
              )}
            </Card>

            {gymW && (
              <>
                <SectionTitle right={<Btn kind="ghost" small onClick={() => setGymView("musculos")}>🧍 Explorar →</Btn>}>Ejercicios</SectionTitle>
                {gymW.exercises.map((e) => {
                  const editing = editEx === e.id;
                  const showDetail = exDetail === e.id;
                  const doneToday = gymDay === dow && wLog[e.id];
                  const pr = prOf(e.name);
                  const hist = (state.exerciseHistory[e.name] || []).slice(-10);
                  const dbEx = Object.values(EXDB).flatMap((m) => m.exercises).find((x) => x.name === e.name);
                  return (
                    <Card key={e.id} style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {gymDay === dow && !editing && <Check color={C.amber} done={!!doneToday} onClick={() => toggleEx(e)} />}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {editing ? (
                            <Input value={e.name} onChange={(ev) => up((s) => {
                              s.workouts[gymDay].exercises.find((x) => x.id === e.id).name = ev.target.value; return s;
                            })} />
                          ) : (
                            <>
                              <div style={{ fontWeight: 700, fontSize: 15, textDecoration: doneToday ? "line-through" : "none", color: doneToday ? C.sub : C.ink }}>
                                {e.name}{pr ? <span style={{ fontSize: 11.5, color: C.amber, fontWeight: 800 }}>  🏅 PR {pr} kg</span> : null}
                              </div>
                              <div style={{ fontSize: 13, color: C.sub, fontWeight: 500 }}>{e.sets} series × {e.reps}{e.weight ? ` · ${e.weight} kg` : ""}</div>
                            </>
                          )}
                        </div>
                        {!editing && (hist.length > 0 || dbEx) && (
                          <Btn kind="ghost" small onClick={() => setExDetail(showDetail ? null : e.id)}>{showDetail ? "▲" : "ℹ️"}</Btn>
                        )}
                        <Btn kind="soft" small onClick={() => setEditEx(editing ? null : e.id)}>{editing ? "Listo" : "✎"}</Btn>
                      </div>

                      {showDetail && !editing && (
                        <div style={{ marginTop: 10, background: C.soft, borderRadius: 12, padding: 10 }}>
                          {dbEx && (
                            <>
                              <div style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 6 }}><b>Técnica:</b> {dbEx.tip}</div>
                              <a href={ytLink(e.name)} target="_blank" rel="noreferrer"
                                style={{ fontSize: 13, fontWeight: 700, color: C.blue, textDecoration: "none" }}>📺 Ver cómo se hace →</a>
                              {(() => {
                                const an = analyzeLift(dbEx, e.weight, parseInt(e.reps) || 0, bodyWeight);
                                return an ? (
                                  <div style={{ fontSize: 12.5, marginTop: 8, fontWeight: 600, color: C.sub, lineHeight: 1.5 }}>
                                    📊 Con {e.weight} kg × {parseInt(e.reps) || "?"} reps: {an.advice}
                                  </div>
                                ) : null;
                              })()}
                            </>
                          )}
                          {hist.length > 0 && (
                            <>
                              <div style={{ fontSize: 11.5, fontWeight: 800, color: C.sub, margin: "10px 0 4px" }}>HISTORIAL DE PESO</div>
                              {hist.map((x, i) => (
                                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "2px 0", fontWeight: 600 }}>
                                  <span style={{ color: C.sub }}>{fmtDate(x.date)}</span>
                                  <span style={{ color: Number(x.weight) === pr ? C.amber : C.ink }}>{x.weight} kg{Number(x.weight) === pr ? " 🏅" : ""}</span>
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      )}

                      {editing && (
                        <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                          <div style={{ display: "flex", gap: 8 }}>
                            <LabeledNum label="Series" value={e.sets} onChange={(v) => up((s) => {
                              s.workouts[gymDay].exercises.find((x) => x.id === e.id).sets = v; return s;
                            })} />
                            <div style={{ flex: 1 }}>
                              <div style={lblStyle}>Reps</div>
                              <Input value={e.reps} onChange={(ev) => up((s) => {
                                s.workouts[gymDay].exercises.find((x) => x.id === e.id).reps = ev.target.value; return s;
                              })} />
                            </div>
                            <LabeledNum label="Kg" step={2.5} value={e.weight} onChange={(v) => up((s) => {
                              s.workouts[gymDay].exercises.find((x) => x.id === e.id).weight = v; return s;
                            })} />
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <Btn kind="danger" small onClick={() => {
                              setEditEx(null);
                              up((s) => { s.workouts[gymDay].exercises = s.workouts[gymDay].exercises.filter((x) => x.id !== e.id); return s; });
                            }}>Borrar ejercicio</Btn>
                          </div>
                        </div>
                      )}

                      {!editing && (
                        <div style={{ display: "flex", gap: 4, alignItems: "center", justifyContent: "flex-end", marginTop: 6 }}>
                          <Btn kind="soft" small onClick={() => up((s) => {
                            const ex = s.workouts[gymDay].exercises.find((x) => x.id === e.id);
                            ex.weight = Math.max(0, (Number(ex.weight) || 0) - 2.5); return s;
                          })}>−2.5</Btn>
                          <div style={{ fontSize: 13, fontWeight: 800, minWidth: 50, textAlign: "center" }}>{e.weight} kg</div>
                          <Btn kind="soft" small onClick={() => up((s) => {
                            const ex = s.workouts[gymDay].exercises.find((x) => x.id === e.id);
                            ex.weight = (Number(ex.weight) || 0) + 2.5; return s;
                          })}>+2.5</Btn>
                        </div>
                      )}
                    </Card>
                  );
                })}

                <Card style={{ marginTop: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Agregar ejercicio manual</div>
                  <div style={{ display: "grid", gap: 8 }}>
                    <Input placeholder="Nombre" value={newEx.name} onChange={(e) => setNewEx({ ...newEx, name: e.target.value })} />
                    <div style={{ display: "flex", gap: 8 }}>
                      <Input type="number" placeholder="Series" value={newEx.sets} onChange={(e) => setNewEx({ ...newEx, sets: e.target.value })} />
                      <Input placeholder="Reps" value={newEx.reps} onChange={(e) => setNewEx({ ...newEx, reps: e.target.value })} />
                      <Input type="number" placeholder="Kg" value={newEx.weight} onChange={(e) => setNewEx({ ...newEx, weight: e.target.value })} />
                    </div>
                    <Btn onClick={() => {
                      if (!newEx.name.trim()) return;
                      up((s) => {
                        s.workouts[gymDay].exercises.push({ id: uid(), name: newEx.name.trim(), sets: Number(newEx.sets) || 3, reps: newEx.reps || "10", weight: Number(newEx.weight) || 0 });
                        return s;
                      });
                      setNewEx({ name: "", sets: 3, reps: "10", weight: 0 });
                    }}>Agregar</Btn>
                  </div>
                </Card>
              </>
            )}
          </>
        )}
      </>
    );
  }

  /* ============ DIETA ============ */
  const [newMeal, setNewMeal] = useState({ name: "", kcal: "", protein: "", carbs: "", fat: "" });
  const [saveToLib, setSaveToLib] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [newMeas, setNewMeas] = useState({ waist: "", chest: "", arm: "" });
  const [calc, setCalc] = useState({ sex: "m", age: 18, height: 175, weight: 70, activity: 1.55, goal: 0 });

  function Dieta() {
    const last = weightEntriesAll.slice(-14);
    const vals = last.map(([, v]) => Number(v));
    const min = Math.min(...vals), max = Math.max(...vals);
    const range = max - min || 1;

    const bmr = calc.sex === "m"
      ? 10 * calc.weight + 6.25 * calc.height - 5 * calc.age + 5
      : 10 * calc.weight + 6.25 * calc.height - 5 * calc.age - 161;
    const tdee = Math.round(bmr * calc.activity);
    const targetKcal = Math.round(tdee + Number(calc.goal));
    const targetProt = Math.round(calc.weight * 1.8);
    const targetFat = Math.round((targetKcal * 0.25) / 9);
    const targetCarbs = Math.round((targetKcal - targetProt * 4 - targetFat * 9) / 4);

    return (
      <>
        <h1 style={h1Style}>Dieta</h1>
        <Card style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <MacroBox label="Calorías" value={kcal} goal={state.goals.kcal} unit="kcal" color={C.amber} />
          <MacroBox label="Proteína" value={prot} goal={state.goals.protein} unit="g" color={C.primary} />
          <MacroBox label="Carbos" value={carbs} goal={state.goals.carbs} unit="g" color={C.blue} />
          <MacroBox label="Grasas" value={fat} goal={state.goals.fat} unit="g" color={C.red} />
        </Card>

        {state.mealLibrary.length > 0 && (
          <>
            <SectionTitle>Comidas frecuentes (tocá para agregar)</SectionTitle>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {state.mealLibrary.map((m) => (
                <button key={m.id} onClick={() => up((s) => {
                  s.meals[today] = s.meals[today] || [];
                  s.meals[today].push({ ...m, id: uid() });
                  return s;
                })}
                  style={{
                    border: "none", borderRadius: 12, padding: "8px 12px", cursor: "pointer",
                    background: C.card, color: C.ink, fontFamily: FONT, fontSize: 13.5, fontWeight: 700,
                    boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                  }}>
                  ⭐ {m.name} <span style={{ color: C.sub, fontWeight: 600 }}>{m.kcal} kcal</span>
                </button>
              ))}
            </div>
          </>
        )}

        <SectionTitle>Comidas de hoy</SectionTitle>
        <Card style={{ padding: 8 }}>
          {mealsToday.length === 0 && <Empty text="Todavía no registraste comidas hoy." />}
          {mealsToday.map((m) => (
            <Row key={m.id} title={m.name}
              sub={`${m.kcal || 0} kcal · P ${m.protein || 0} · C ${m.carbs || 0} · G ${m.fat || 0}`}
              right={
                <div style={{ display: "flex", gap: 4 }}>
                  {!state.mealLibrary.some((x) => x.name === m.name) && (
                    <Btn kind="ghost" small onClick={() => up((s) => {
                      s.mealLibrary.push({ id: uid(), name: m.name, kcal: m.kcal, protein: m.protein, carbs: m.carbs, fat: m.fat });
                      return s;
                    })}>⭐</Btn>
                  )}
                  <Btn kind="danger" small onClick={() => up((s) => {
                    s.meals[today] = (s.meals[today] || []).filter((x) => x.id !== m.id); return s;
                  })}>✕</Btn>
                </div>
              } />
          ))}
        </Card>

        <Card style={{ marginTop: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Registrar comida</div>
          <div style={{ display: "grid", gap: 8 }}>
            <Input placeholder="Qué comiste (ej: milanesa con ensalada)" value={newMeal.name} onChange={(e) => setNewMeal({ ...newMeal, name: e.target.value })} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <Input type="number" placeholder="kcal" value={newMeal.kcal} onChange={(e) => setNewMeal({ ...newMeal, kcal: e.target.value })} />
              <Input type="number" placeholder="proteína g" value={newMeal.protein} onChange={(e) => setNewMeal({ ...newMeal, protein: e.target.value })} />
              <Input type="number" placeholder="carbos g" value={newMeal.carbs} onChange={(e) => setNewMeal({ ...newMeal, carbs: e.target.value })} />
              <Input type="number" placeholder="grasas g" value={newMeal.fat} onChange={(e) => setNewMeal({ ...newMeal, fat: e.target.value })} />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 600, color: C.sub, cursor: "pointer" }}>
              <input type="checkbox" checked={saveToLib} onChange={(e) => setSaveToLib(e.target.checked)} />
              Guardar como comida frecuente ⭐
            </label>
            <Btn onClick={() => {
              if (!newMeal.name.trim()) return;
              const meal = { ...newMeal, name: newMeal.name.trim() };
              up((s) => {
                s.meals[today] = s.meals[today] || [];
                s.meals[today].push({ id: uid(), ...meal });
                if (saveToLib && !s.mealLibrary.some((x) => x.name === meal.name))
                  s.mealLibrary.push({ id: uid(), ...meal });
                return s;
              });
              setNewMeal({ name: "", kcal: "", protein: "", carbs: "", fat: "" });
              setSaveToLib(false);
            }}>Agregar comida</Btn>
          </div>
        </Card>

        <SectionTitle right={<Btn kind="ghost" small onClick={() => setShowCalc(!showCalc)}>{showCalc ? "Ocultar" : "Abrir"}</Btn>}>
          Calculadora de metas
        </SectionTitle>
        {showCalc && (
          <Card>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
              <div>
                <div style={lblStyle}>Sexo</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[["m", "Hombre"], ["f", "Mujer"]].map(([v, l]) => (
                    <button key={v} onClick={() => setCalc({ ...calc, sex: v })} style={{
                      flex: 1, padding: "9px 0", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: FONT, fontWeight: 700, fontSize: 13,
                      background: calc.sex === v ? C.primarySoft : C.soft, color: calc.sex === v ? C.primaryInk : C.sub,
                    }}>{l}</button>
                  ))}
                </div>
              </div>
              <LabeledNum label="Edad" value={calc.age} onChange={(v) => setCalc({ ...calc, age: v })} />
              <LabeledNum label="Altura (cm)" value={calc.height} onChange={(v) => setCalc({ ...calc, height: v })} />
              <LabeledNum label="Peso (kg)" value={calc.weight} onChange={(v) => setCalc({ ...calc, weight: v })} />
            </div>
            <div style={lblStyle}>Actividad</div>
            <select value={calc.activity} onChange={(e) => setCalc({ ...calc, activity: Number(e.target.value) })}
              style={{ width: "100%", padding: 10, borderRadius: 12, border: `1.5px solid ${C.line}`, fontFamily: FONT, fontSize: 14, background: C.input, color: C.ink, marginBottom: 10 }}>
              <option value={1.2}>Sedentario</option>
              <option value={1.375}>Ligero (1-3 días/sem)</option>
              <option value={1.55}>Moderado (3-5 días/sem)</option>
              <option value={1.725}>Alto (6-7 días/sem)</option>
            </select>
            <div style={lblStyle}>Objetivo</div>
            <select value={calc.goal} onChange={(e) => setCalc({ ...calc, goal: Number(e.target.value) })}
              style={{ width: "100%", padding: 10, borderRadius: 12, border: `1.5px solid ${C.line}`, fontFamily: FONT, fontSize: 14, background: C.input, color: C.ink, marginBottom: 12 }}>
              <option value={-300}>Bajar grasa (déficit suave)</option>
              <option value={0}>Mantener</option>
              <option value={300}>Ganar músculo (superávit suave)</option>
            </select>
            <div style={{ background: C.primarySoft, borderRadius: 12, padding: 12, fontSize: 14, color: C.primaryInk, fontWeight: 600, lineHeight: 1.5, marginBottom: 10 }}>
              Sugerencia: <b>{targetKcal} kcal</b> · Proteína <b>{targetProt} g</b> · Carbos <b>{targetCarbs} g</b> · Grasas <b>{targetFat} g</b>
            </div>
            <Btn onClick={() => up((s) => {
              s.goals = { ...s.goals, kcal: targetKcal, protein: targetProt, carbs: targetCarbs, fat: targetFat };
              return s;
            })}>Aplicar a mis metas</Btn>
            <div style={{ fontSize: 12, color: C.sub, marginTop: 8, lineHeight: 1.4 }}>
              Estimación orientativa (Mifflin-St Jeor). Ajustala según cómo responda tu cuerpo, y ante dudas consultá a un profesional de la nutrición.
            </div>
          </Card>
        )}

        <SectionTitle>Metas diarias</SectionTitle>
        <Card style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <GoalInput label="kcal" value={state.goals.kcal} onChange={(v) => up((s) => { s.goals.kcal = v; return s; })} />
          <GoalInput label="proteína g" value={state.goals.protein} onChange={(v) => up((s) => { s.goals.protein = v; return s; })} />
          <GoalInput label="carbos g" value={state.goals.carbs} onChange={(v) => up((s) => { s.goals.carbs = v; return s; })} />
          <GoalInput label="grasas g" value={state.goals.fat} onChange={(v) => up((s) => { s.goals.fat = v; return s; })} />
          <GoalInput label="vasos agua" value={state.goals.water} onChange={(v) => up((s) => { s.goals.water = v; return s; })} />
        </Card>

        <SectionTitle>Peso corporal</SectionTitle>
        <Card>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <Input type="number" placeholder="Tu peso hoy (kg)" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} />
            <Btn onClick={() => {
              const v = Number(newWeight);
              if (!v) return;
              up((s) => { s.weightLog[today] = v; return s; });
              setNewWeight("");
            }}>Guardar</Btn>
          </div>
          {last.length >= 2 ? (
            <>
              <svg viewBox="0 0 300 80" style={{ width: "100%", height: 80 }}>
                <polyline fill="none" stroke={C.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  points={last.map(([, v], i) => {
                    const x = (i / (last.length - 1)) * 290 + 5;
                    const y = 70 - ((Number(v) - min) / range) * 55;
                    return `${x},${y}`;
                  }).join(" ")} />
                {last.map(([, v], i) => {
                  const x = (i / (last.length - 1)) * 290 + 5;
                  const y = 70 - ((Number(v) - min) / range) * 55;
                  return <circle key={i} cx={x} cy={y} r="3" fill={C.primary} />;
                })}
              </svg>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.sub, fontWeight: 600 }}>
                <span>{last[0][0].slice(5)}</span>
                <span style={{ color: C.ink, fontWeight: 800 }}>Último: {last[last.length - 1][1]} kg</span>
                <span>{last[last.length - 1][0].slice(5)}</span>
              </div>
            </>
          ) : (
            <div style={{ fontSize: 13, color: C.sub }}>Registrá tu peso al menos 2 días para ver el gráfico. También se usa en el análisis de fuerza del mapa muscular 🧍.</div>
          )}
        </Card>

        <SectionTitle>Medidas corporales</SectionTitle>
        <Card>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 8, alignItems: "end", marginBottom: 10 }}>
            <LabeledNum label="Cintura cm" value={newMeas.waist} onChange={(v) => setNewMeas({ ...newMeas, waist: v })} />
            <LabeledNum label="Pecho cm" value={newMeas.chest} onChange={(v) => setNewMeas({ ...newMeas, chest: v })} />
            <LabeledNum label="Brazo cm" value={newMeas.arm} onChange={(v) => setNewMeas({ ...newMeas, arm: v })} />
            <Btn small onClick={() => {
              if (!newMeas.waist && !newMeas.chest && !newMeas.arm) return;
              up((s) => { s.measurements.push({ id: uid(), date: today, ...newMeas }); return s; });
              setNewMeas({ waist: "", chest: "", arm: "" });
            }}>＋</Btn>
          </div>
          {[...state.measurements].reverse().slice(0, 6).map((m) => (
            <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13.5, padding: "5px 0", borderTop: `1px solid ${C.line}`, fontWeight: 600 }}>
              <span style={{ color: C.sub }}>{fmtDate(m.date)}</span>
              <span>Cint {m.waist || "–"} · Pecho {m.chest || "–"} · Brazo {m.arm || "–"}</span>
              <Btn kind="danger" small style={{ padding: "0 6px" }} onClick={() => up((s) => {
                s.measurements = s.measurements.filter((x) => x.id !== m.id); return s;
              })}>✕</Btn>
            </div>
          ))}
          {state.measurements.length === 0 && <div style={{ fontSize: 13, color: C.sub }}>Registrá tus medidas para seguir el progreso más allá de la balanza.</div>}
        </Card>
      </>
    );
  }

  /* ============ MÁS ============ */
  const [newRem, setNewRem] = useState({ text: "", time: "18:00" });
  const [newTip, setNewTip] = useState("");

  function Mas() {
    return (
      <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={h1Style}>Más</h1>
          <Btn kind="soft" small onClick={() => up((s) => { s.theme = s.theme === "dark" ? "light" : "dark"; return s; })}>
            {state.theme === "dark" ? "☀️ Modo claro" : "🌙 Modo oscuro"}
          </Btn>
        </div>

        <SectionTitle>Logros ({achDone}/{ACHIEVEMENTS.length})</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {ACHIEVEMENTS.map((a, i) => (
            <Card key={i} style={{ opacity: a.done ? 1 : 0.45, padding: 12 }}>
              <div style={{ fontSize: 22 }}>{a.done ? a.icon : "🔒"}</div>
              <div style={{ fontWeight: 800, fontSize: 13.5, margin: "4px 0 2px" }}>{a.name}</div>
              <div style={{ fontSize: 11.5, color: C.sub, fontWeight: 500, lineHeight: 1.35 }}>{a.desc}</div>
            </Card>
          ))}
        </div>

        <SectionTitle>Recordatorios</SectionTitle>
        {state.reminders.map((r) => {
          const editing = editRem === r.id;
          return (
            <Card key={r.id} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {editing ? (
                  <Input type="time" value={r.time} style={{ width: 110 }} onChange={(e) => up((s) => {
                    s.reminders.find((x) => x.id === r.id).time = e.target.value; return s;
                  })} />
                ) : (
                  <div style={{ background: C.amberSoft, color: C.amberInk, fontWeight: 800, fontSize: 13, borderRadius: 8, padding: "6px 8px" }}>{r.time}</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {editing ? (
                    <Input value={r.text} onChange={(e) => up((s) => {
                      s.reminders.find((x) => x.id === r.id).text = e.target.value; return s;
                    })} />
                  ) : (
                    <>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{r.text}</div>
                      <div style={{ fontSize: 12.5, color: C.sub }}>{r.days.length === 7 ? "Todos los días" : r.days.map((d) => DAYS[d]).join(" · ")}</div>
                    </>
                  )}
                </div>
                <Btn kind="soft" small onClick={() => setEditRem(editing ? null : r.id)}>{editing ? "Listo" : "✎"}</Btn>
              </div>
              {editing && (
                <div style={{ marginTop: 10 }}>
                  <DayPicker days={r.days} onToggle={(i) => up((s) => {
                    const rr = s.reminders.find((x) => x.id === r.id);
                    rr.days = rr.days.includes(i) ? rr.days.filter((x) => x !== i) : [...rr.days, i];
                    return s;
                  })} />
                  <div style={{ marginTop: 8, textAlign: "right" }}>
                    <Btn kind="danger" small onClick={() => {
                      setEditRem(null);
                      up((s) => { s.reminders = s.reminders.filter((x) => x.id !== r.id); return s; });
                    }}>Borrar</Btn>
                  </div>
                </div>
              )}
            </Card>
          );
        })}

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Nuevo recordatorio</div>
          <div style={{ display: "grid", gap: 8 }}>
            <Input placeholder="Texto (ej: preparar comida de mañana)" value={newRem.text} onChange={(e) => setNewRem({ ...newRem, text: e.target.value })} />
            <Input type="time" value={newRem.time} onChange={(e) => setNewRem({ ...newRem, time: e.target.value })} />
            <Btn onClick={() => {
              if (!newRem.text.trim()) return;
              up((s) => { s.reminders.push({ id: uid(), text: newRem.text.trim(), time: newRem.time, days: [0,1,2,3,4,5,6] }); return s; });
              setNewRem({ text: "", time: "18:00" });
            }}>Agregar</Btn>
          </div>
          <div style={{ fontSize: 12.5, color: C.sub, marginTop: 10, lineHeight: 1.4 }}>
            Los avisos aparecen dentro de la app mientras está abierta.
          </div>
        </Card>

        <SectionTitle>Mis tips personalizados</SectionTitle>
        <Card>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <Input placeholder="Agregá tu propio tip o frase" value={newTip} onChange={(e) => setNewTip(e.target.value)} />
            <Btn onClick={() => {
              if (!newTip.trim()) return;
              up((s) => { s.customTips = [...(s.customTips || []), newTip.trim()]; return s; });
              setNewTip("");
            }}>＋</Btn>
          </div>
          {(state.customTips || []).map((t, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "8px 4px", borderTop: `1px solid ${C.line}`, fontSize: 14 }}>
              <span>⭐ {t}</span>
              <Btn kind="danger" small onClick={() => up((s) => { s.customTips = s.customTips.filter((_, j) => j !== i); return s; })}>✕</Btn>
            </div>
          ))}
          {(state.customTips || []).length === 0 && <div style={{ fontSize: 13, color: C.sub }}>Tus tips entran en la rotación del "Tip del día".</div>}
        </Card>

        <SectionTitle>Seguridad</SectionTitle>
        <Card>
          {(() => {
            const hasPin = !!localStorage.getItem(PIN_KEY);
            return (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ flex: "1 1 180px", minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{hasPin ? "🔒 PIN activo" : "🔓 Sin PIN"}</div>
                  <div style={{ fontSize: 12.5, color: C.sub, fontWeight: 500, lineHeight: 1.4 }}>
                    {hasPin ? "Se te pide al abrir la app en cada sesión nueva." : "Cualquiera con el link puede abrir la app."}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {hasPin ? (
                    <>
                      <Btn small kind="soft" onClick={() => { localStorage.removeItem(PIN_KEY); setShowPinSetup(true); }}>Cambiar</Btn>
                      <Btn small kind="danger" onClick={() => {
                        if (confirm("¿Quitar el PIN? Cualquiera con el link va a poder abrir la app.")) {
                          localStorage.removeItem(PIN_KEY);
                          sessionStorage.removeItem(PIN_SESSION);
                          setBanner("PIN quitado");
                          setTimeout(() => setBanner(null), 3000);
                        }
                      }}>Quitar</Btn>
                    </>
                  ) : (
                    <Btn small onClick={() => setShowPinSetup(true)}>Crear PIN</Btn>
                  )}
                </div>
              </div>
            );
          })()}
        </Card>

        <SectionTitle>Datos</SectionTitle>
        <Card>
          {confirmReset ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>¿Seguro? Se borra todo.</span>
              <div style={{ display: "flex", gap: 6 }}>
                <Btn kind="ghost" small onClick={() => setConfirmReset(false)}>Cancelar</Btn>
                <Btn small style={{ background: C.red }} onClick={async () => {
                  setConfirmReset(false);
                  setState(structuredClone(initialState));
                  try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
                }}>Borrar todo</Btn>
              </div>
            </div>
          ) : (
            <Btn kind="danger" small onClick={() => setConfirmReset(true)}>Reiniciar la app (borrar todos los datos)</Btn>
          )}
        </Card>
      </>
    );
  }

  /* ---------- helpers UI ---------- */
  function MiniStat({ label, value, color }) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: 4, background: color }} />
        <div style={{ fontSize: 13, color: C.sub, fontWeight: 600, flex: 1 }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 800 }}>{value}</div>
      </div>
    );
  }

  function BigStat({ value, label, color }) {
    return (
      <div style={{ flex: 1, textAlign: "center" }}>
        <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
        <div style={{ fontSize: 11.5, color: C.sub, fontWeight: 600 }}>{label}</div>
      </div>
    );
  }

  function Row({ left, title, sub, right }) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 8px" }}>
        {left}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{title}</div>
          {sub && <div style={{ fontSize: 12.5, color: C.sub, fontWeight: 500 }}>{sub}</div>}
        </div>
        {right}
      </div>
    );
  }

  function MacroBox({ label, value, goal, unit, color }) {
    const pct = Math.min(1, goal ? value / goal : 0);
    return (
      <div>
        <div style={{ fontSize: 12.5, color: C.sub, fontWeight: 700, marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 18, fontWeight: 800 }}>{value}<span style={{ fontSize: 12, color: C.sub, fontWeight: 600 }}> / {goal} {unit}</span></div>
        <div style={{ height: 8, borderRadius: 4, background: C.line, marginTop: 6, overflow: "hidden" }}>
          <div style={{ width: `${pct * 100}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.4s" }} />
        </div>
      </div>
    );
  }

  function GoalInput({ label, value, onChange }) {
    return (
      <div>
        <div style={lblStyle}>{label}</div>
        <Input type="number" value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} />
      </div>
    );
  }

  function LabeledNum({ label, value, onChange, step = 1 }) {
    return (
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={lblStyle}>{label}</div>
        <Input type="number" step={step} value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} />
      </div>
    );
  }

  function Empty({ text }) {
    return <div style={{ padding: 14, fontSize: 13.5, color: C.sub, textAlign: "center" }}>{text}</div>;
  }

  const lblStyle = { fontSize: 11.5, color: C.sub, fontWeight: 700, marginBottom: 4 };
  const h1Style = { margin: "4px 4px 14px", fontSize: 32, fontWeight: 800, letterSpacing: -0.5 };

  const tabs = [
    { id: "hoy", label: "Hoy", icon: "☀️" },
    { id: "habitos", label: "Hábitos", icon: "✅" },
    { id: "gym", label: "Gym", icon: "🏋️" },
    { id: "dieta", label: "Dieta", icon: "🍎" },
    { id: "mas", label: "Más", icon: "🏆" },
  ];

  if (!loaded) {
    return (
      <div style={{ fontFamily: FONT, background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: C.sub, fontWeight: 600 }}>
        Cargando tus datos…
      </div>
    );
  }

  if (locked) {
    return <PinGate theme={state.theme} onUnlock={() => setLocked(false)} />;
  }

  if (showPinSetup) {
    return <PinGate theme={state.theme} onUnlock={() => setShowPinSetup(false)} />;
  }

  return (
    <div style={{ fontFamily: FONT, background: C.bg, minHeight: "100vh", color: C.ink }}>
      {banner && (
        <div style={{
          position: "fixed", top: 12, left: 12, right: 12, zIndex: 50,
          background: C.ink, color: C.bg, borderRadius: 16, padding: "14px 16px",
          fontWeight: 700, fontSize: 14.5, boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center",
        }}>
          <span>🔔 {banner}</span>
          <button onClick={() => setBanner(null)} style={{ background: "none", border: "none", color: C.bg, fontSize: 16, cursor: "pointer" }}>✕</button>
        </div>
      )}

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "16px 14px 120px" }}>
        {tab === "hoy" && Hoy()}
        {tab === "habitos" && Habitos()}
        {tab === "gym" && Gym()}
        {tab === "dieta" && Dieta()}
        {tab === "mas" && Mas()}
      </div>

      <nav style={{
        position: "fixed", bottom: "calc(14px + env(safe-area-inset-bottom))",
        left: 12, right: 12, zIndex: 40,
        maxWidth: 500, margin: "0 auto",
        background: C.navBg, backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `1px solid ${C.line}`,
        borderRadius: 22, display: "flex", justifyContent: "space-around",
        padding: "8px 6px", boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
      }}>
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: active ? C.primarySoft : "transparent",
              border: "none", cursor: "pointer", fontFamily: FONT,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              color: active ? C.primary : C.sub, minWidth: 56,
              borderRadius: 14, padding: "8px 10px",
              transition: "background 0.2s, color 0.2s",
            }}>
              <span style={{ fontSize: 18, filter: active ? "none" : "grayscale(0.4) opacity(0.85)" }}>{t.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.2 }}>{t.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
