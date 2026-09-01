# Milestone 2.1 Research Sources and Licensing

## GIA appearance authority

- [Diamond Cut: Anatomy of a Round Brilliant](https://www.gia.edu/diamond-cut/diamond-cut-anatomy-round-brilliant)
- [Modeling the Appearance of the Round Brilliant Cut Diamond: An Analysis of Fire, and More about Brilliance](https://hongkong.gia.edu/gems-gemology/fall-2001-modeling-appearance-round-brilliant-cut-diamond-reinitz)
- [A Foundation for Grading the Overall Cut Quality of Round Brilliant Cut Diamonds](https://www.gia.edu/gems-gemology/fall-2004-grading-cut-quality-brilliant-diamond-moses)

AMES uses GIA terminology and observation principles for brightness, fire, scintillation, pattern, and round-brilliant anatomy. GIA text and imagery are not redistributed.

## diamond-webgl benchmark

- [Public documentation](https://piellardj.github.io/diamond-webgl/readme/)
- [Repository](https://github.com/piellardj/diamond-webgl)
- License: GPL-3.0

Clean-room restriction: AMES does not copy, translate, adapt, import, or derive code, shaders, constants, assets, or implementation structure from diamond-webgl. It is used only to study public behavior, ASET concepts, cut sensitivity, and visual output.

## Integrated reference-renderer dependencies

- `three-gpu-pathtracer@0.0.24`, MIT, Copyright 2021 Garrett Johnson
- `three-mesh-bvh@0.9.14`, MIT, Copyright 2018 Garrett Johnson
- `xatlas-web@0.1.0`, MIT, Copyright 2018-2020 Jonathan Young

All are compatible with commercial use subject to retaining their MIT copyright and permission notices.

`three-gpu-pathtracer` is an RGB path tracer. It is a reference for white-light return, transmission, Fresnel behavior, total internal reflection, attenuation, facet contrast, and progressive convergence. It is not an authoritative spectral-fire renderer.
