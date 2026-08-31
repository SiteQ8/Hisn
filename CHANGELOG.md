# Changelog

## 0.2.0

Hisn now reviews a blueprint, not just draws it.

- A review that reads the blueprint and reports gaps: sensitive data moving with
  no named control, a flow that crosses more than one trust level in a single
  step, a boundary crossing that names nothing, a store holding sensitive data
  with no control of its own, sensitive data with nothing monitoring it, secret
  material with no key management shown, a component in no zone, and a component
  nothing connects to. Reaching a boundary device is not counted as a trust leap,
  and neither is a person operating a device.
- A new `check` command with `--json` for machines and `--strict` to exit non zero
  on a high finding, so a blueprint can gate a pipeline.
- A new `matrix` command that exports what each named control covers, as markdown
  or CSV.
- A review panel in every generated file and in the demo. Selecting a finding
  highlights exactly the components and flows it concerns.
- A flow that names no control is now drawn dashed, so gaps are visible in the
  picture and in exports.
- Five more framework blueprints: HIPAA, GDPR, SOC 2, ISO 27001, and IEC 62443,
  joining PCI DSS, SWIFT CSP, and Zero Trust. All eight are written to pass their
  own review. The PCI and SWIFT blueprints gained a segmentation firewall and the
  Zero Trust blueprint gained control references, all found by running the new
  review against them.
- A control list now carries its scheme across entries, so `controls="Req 3.5, 3.6"`
  means Req 3.5 and Req 3.6 rather than a stray 3.6.
- An agent skill at skill/SKILL.md teaching the language, the frameworks, the
  commands, and how to describe a review honestly.
- 53 tests.

## 0.1.0

First release. Hisn draws security and compliance reference architectures from a
short text source.

- A blueprint language: trust zones with a trust level, typed components placed in
  zones, and data flows classified as public, internal, PII, cardholder data, or
  secret, with control references on components and flows.
- A trust tier layout that orders zones from least to most trusted, so the diagram
  reads as defence in depth, and marks flows that cross a boundary.
- An SVG renderer with a glyph per component type, colored flows, and a legend for
  the trust levels and data classes in use.
- Built in reference blueprints for PCI DSS, the SWIFT customer security
  programme, and Zero Trust.
- A self contained interactive HTML output: pan and zoom, click a component to
  trace its data flows, and export SVG, PNG, or a 1200 by 630 share card.
- A command line with render, template, card, and serve, and a browser demo. Zero
  dependencies, one engine shared by both, 32 tests.
