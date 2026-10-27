# Third-party study notes & asset attribution

## Technique references (no code copied)

Studied for visualization patterns only (scroll/glow/opacity ideas):

| Project | License | Use |
|---------|---------|-----|
| [digin1/brain-threejs](https://github.com/digin1/brain-threejs) | MIT (code); mesh data CC BY-SA 3.0 (brainder.org) | Soft bloom + translucent shell opacity patterns. **Did not copy** their OBJ meshes (ShareAlike). |
| [itayinbarr/brainproject](https://github.com/itayinbarr/brainproject) | Apache-2.0 | Atlas / education UX concepts. **Did not copy** application code. |
| [COMRADEART/virtual-brain-engine](https://github.com/COMRADEART/virtual-brain-engine) | No license declared | **Not used** for code or assets. |

## Project anatomical assets

| File | Role |
|------|------|
| `assets/brain.glb` | Source anatomical mesh for bake/export (local project asset). |
| `public/models/brain-points.bin` | Surface-sampled particle bake (`scripts/bake-brain-points.mjs`). |
| `public/models/brain-shell.bin` | Decimated translucent shell (`scripts/export-brain-shell.mjs`). |

Runtime rendering combines the shell mesh with the GPU particle layer driven by existing scroll chapters.
