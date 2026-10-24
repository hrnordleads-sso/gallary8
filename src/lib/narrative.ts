export type Chapter = {
  id: string;
  index: string;
  eyebrow: string;
  title: string;
  body: string;
  status: string;
  specimen: string;
};

/** Scroll chapters — original copy inspired by the Neural Monitor cinematic structure. */
export const CHAPTERS: Chapter[] = [
  {
    id: "arrival",
    index: "01",
    eyebrow: "> ARRIVAL _",
    title: "Eighty-six billion neurons,\none quiet field.",
    body: "A specimen resolves out of the dark. The scan holds it steady while the system maps its surface, point by point—the most complex object we have ever tried to understand.",
    status: "MAPPING",
    specimen: "HUMAN · CEREBRUM",
  },
  {
    id: "surface",
    index: "02",
    eyebrow: "> SURFACE _",
    title: "Folds of light.\nA living topography.",
    body: "Gyri and sulci bloom as density rises. Each ridge is a corridor of signal; each valley a hush between firings—geometry that learns as you look.",
    status: "SURFACE_LOCK",
    specimen: "CORTEX · OUTER SHELL",
  },
  {
    id: "scan",
    index: "03",
    eyebrow: "> SCAN _",
    title: "Region by region,\nthe field comes online.",
    body: "A luminous plane drifts through the mass. Frontal, parietal, temporal, occipital—each lobe answers with a brighter constellation of points.",
    status: "REGION_PASS",
    specimen: "MULTI-LOBE SWEEP",
  },
  {
    id: "firing",
    index: "04",
    eyebrow: "> FIRING _",
    title: "Four million sparks\na second.",
    body: "Activity spikes cascade through the cloud. Pathways light, fade, and relight—proof that stillness was never the truth of this organ.",
    status: "SPIKE_TRAIN",
    specimen: "SYNAPTIC BURST",
  },
  {
    id: "coherence",
    index: "05",
    eyebrow: "> COHERENCE _",
    title: "Zoom until the\npattern holds.",
    body: "The camera settles into a close study. Noise falls away; coherence climbs. What remains is structure—precise, fragile, and unmistakably alive.",
    status: "FOCUS_LOCK",
    specimen: "DEEP STRUCTURE",
  },
  {
    id: "release",
    index: "06",
    eyebrow: "> RELEASE _",
    title: "The specimen lets go.",
    body: "Bonds loosen. Points drift from the form they once defended, carrying memory into open space—still glowing, no longer bound.",
    status: "DISPERSAL",
    specimen: "FIELD UNBINDING",
  },
  {
    id: "signal",
    index: "07",
    eyebrow: "> SIGNAL _",
    title: "A living constellation\nof signal.",
    body: "What was a brain becomes a sky. Every particle is a residual pulse—intelligence redistributed, never erased.",
    status: "CONSTELLATION",
    specimen: "OPEN FIELD",
  },
];

export const HUD_METRICS = {
  brand: "NEURAL_MONITOR // LIVE",
  neurons: "NEURONS: 86,000,000,000",
  particles: "PARTICLES: 140,000",
  firing: "FIRING: 4.67 M/S",
  coherence: "COHERENCE: 92.5%",
  focus: "FOCUS: HUMAN_CEREBRUM",
} as const;
