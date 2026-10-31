export type FieldCallout = {
  id: string;
  label: string;
  /** Percent position within the viewport overlay */
  x: number;
  y: number;
  /** Leader line grows left or right of the crosshair (video HUD style). */
  side?: "left" | "right";
};

export type Chapter = {
  id: string;
  index: string;
  eyebrow: string;
  title: string;
  body: string;
  status: string;
  specimen: string;
  /** Optional terminal card shown over the field (Signals chapter). */
  logCard?: { title: string; body: string; rate: string; channel: string };
  /** Optional HUD callouts pinned near the specimen (Cortex, etc.). */
  callouts?: FieldCallout[];
  /** Narrative panel placement for this beat */
  align?: "left" | "center" | "right";
  /** Show [ BEGIN AGAIN ] restart control (Release chapter). */
  beginAgain?: boolean;
};

/** Scroll chapters aligned to the Neural Monitor reference video beats. */
export const CHAPTERS: Chapter[] = [
  {
    id: "arrival",
    index: "01",
    eyebrow: "> ARRIVAL _",
    title: "Eighty-six billion neurons, one quiet field.",
    body: "A specimen resolves out of the dark. The scan holds it steady while the system maps its surface, point by point — the most complex object we have ever tried to understand.",
    status: "MAPPING",
    specimen: "HUMAN CEREBRUM",
  },
  {
    id: "cortex",
    index: "02",
    eyebrow: "> THE_CORTEX _",
    title: "The folded sheet where thought happens.",
    body: "Two millimetres thick, crushed into ridges and valleys to fit. The system pushes in on the cortical surface — every fold buys more thinking room without a larger skull.",
    status: "SURFACE_MAP",
    specimen: "FRONTAL CORTEX",
    align: "right",
    callouts: [
      { id: "frontal", label: "REGION: FRONTAL_CORTEX", x: 36, y: 58, side: "right" },
      { id: "depth", label: "DEPTH: 2.0 MM", x: 56, y: 70, side: "right" },
    ],
  },
  {
    id: "signals",
    index: "03",
    eyebrow: "> SIGNALS _",
    title: "Everything you are, travelling as electricity.",
    body: "Step inside the traffic. Each pulse is a thought in transit — chemical to electric and back, a hundred metres a second, never still.",
    status: "THROUGHPUT",
    specimen: "SYNAPTIC STREAM",
    align: "center",
    logCard: {
      title: "*** SIGNALS.LOG",
      body: "Step inside the traffic. Each pulse is a thought in transit — chemical to electric and back, a hundred metres a second, never still.",
      rate: "RATE: 4.21 M/S",
      channel: "CHANNEL: AXONAL",
    },
  },
  {
    id: "links",
    index: "04",
    eyebrow: "> THE_NETWORK _",
    title: "No neuron thinks alone.",
    body: "Trillions of connections wire the regions into one system. The scan isolates the temporal flank and watches it bind to the rest — meaning lives in the links, not the nodes.",
    status: "REGION_PASS",
    specimen: "TEMPORAL · ASSOC",
    align: "center",
    callouts: [
      { id: "temporal", label: "TEMPORAL · ASSOC", x: 52, y: 44, side: "left" },
      { id: "inner", label: "INNER", x: 62, y: 56, side: "left" },
    ],
  },
  {
    id: "vision",
    index: "05",
    eyebrow: "> VISION _",
    title: "The world arrives at the back of your head.",
    body: "The scan swings behind the brain to the occipital pole — where light becomes shape, motion, and depth long before you know you are seeing.",
    status: "VISUAL_FX",
    specimen: "OCCIPITAL · LOBE",
    align: "left",
    callouts: [
      { id: "occipital", label: "OCCIPITAL LOBE", x: 30, y: 56, side: "right" },
      { id: "v1", label: "VISUAL V1", x: 48, y: 50, side: "right" },
    ],
  },
  {
    id: "balance",
    index: "06",
    eyebrow: "> BALANCE _",
    title: "The quiet half that keeps you upright.",
    body: "Tucked beneath and behind, the cerebellum holds a tenth of the mass and over half the neurons — timing, balance, and every movement you never think about.",
    status: "FOCUS_LOCK",
    specimen: "CEREBELLUM",
    align: "right",
    callouts: [
      { id: "balance", label: "BALANCE", x: 44, y: 60, side: "right" },
      { id: "cerebellum", label: "REGION: CEREBELLUM", x: 56, y: 72, side: "right" },
    ],
  },
  {
    id: "release",
    index: "07",
    eyebrow: "> THE_WHOLE _",
    title: "Then it becomes the network it always was.",
    body: "The surface lets go and the points scatter into constellation — the brain resolving into the living web of signal it has been all along.",
    status: "CONSTELLATION",
    specimen: "OPEN FIELD",
    align: "center",
    beginAgain: true,
  },
];

export const HUD_METRICS = {
  brand: "NEURAL_MONITOR // LIVE",
  neurons: "NEURONS: 86,000,000,000",
  particles: "PARTICLES: 140,000",
  firing: "FIRING: 4.21 M/S",
  coherence: "COHERENCE: 95.2%",
  focus: "FOCUS: HUMAN_CEREBRUM",
} as const;
