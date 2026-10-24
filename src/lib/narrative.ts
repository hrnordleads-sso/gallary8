export type Chapter = {
  id: string;
  index: string;
  eyebrow: string;
  title: string;
  body: string;
  status: string;
  specimen: string;
};

/** Scroll chapters aligned to the Neural Monitor reference storytelling beats. */
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
    id: "signals",
    index: "02",
    eyebrow: "> SIGNALS _",
    title: "Everything you are,\ntravelling as electricity.",
    body: "Pulses cascade across the cortex. What looks like stillness is traffic—millions of firings negotiating meaning in the dark.",
    status: "THROUGHPUT",
    specimen: "SYNAPTIC STREAM",
  },
  {
    id: "links",
    index: "03",
    eyebrow: "> LINKS _",
    title: "No neuron\nthinks alone.",
    body: "Trillions of connections wire the regions into one system. The scan isolates the temporal flank and watches it bind to the rest—meaning lives in the links, not the nodes.",
    status: "REGION_PASS",
    specimen: "TEMPORAL · ASSOC",
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
    id: "balance",
    index: "05",
    eyebrow: "> BALANCE _",
    title: "The quiet half\nthat keeps you upright.",
    body: "Focus drops into the cerebellum. Coordination without commentary—the ballast under every thought you notice.",
    status: "FOCUS_LOCK",
    specimen: "CEREBELLUM",
  },
  {
    id: "release",
    index: "06",
    eyebrow: "> RELEASE _",
    title: "The specimen\nlets go.",
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
