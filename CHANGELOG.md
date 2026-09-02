# Changelog

## 0.6.0

- `direction RL` for blueprints that read right to left: bands, components, flows, and labels mirror across the width, the least trusted zone on the right and the most trusted on the left. The review is unchanged. Tested.

## 0.5.0

- Three more frameworks: NCA essential cybersecurity controls, NIS2, and the CIS
  Controls, bringing the total to eleven. All eleven reference blueprints pass
  their own structural review and address their whole control catalog.
- Checking against a control set you supply, with `--catalog file.json`, so an
  organisation whose framework is not built in, or which has its own internal
  baseline, gets the same coverage report. A bad catalog explains what is wrong
  rather than failing later.
- `hisn controls <framework> --json` prints a built in catalog in that shape, to
  start a custom one from. There is also a starter at
  examples/catalogs/internal-baseline.json.
- Building the three new blueprints put the review to work: it caught a DMZ tier
  reaching a data centre application directly in two of them, and secret material
  with no key management in the third, all fixed before release.
- 83 tests.

## 0.4.0

Hisn now reviews an architecture change, not just an architecture.

- A new `diff` command comparing two revisions of a blueprint. It reports the
  structural change and separates what got weaker from what got better: a control
  removed, a zone made less trusted, a component moved somewhere less trusted, a
  flow carrying more sensitive data than before, a flow quietly marked less
  sensitive, and any review finding the earlier revision did not have. Controls
  added and findings resolved come back as improvements.
- Findings are compared by what they are about rather than by position, so adding
  or removing a flow does not make unrelated findings look new.
- `-o` writes the change as a picture: added in green, changed in amber, removed
  in red dashed, drawn over the union of both revisions with a change legend.
- `--strict` exits non zero on a high regression, so a pull request that weakens
  the architecture fails.
- The bundled GitHub Actions workflow now has a second job that compares each
  changed blueprint against the base branch.
- 77 tests.

## 0.3.0

Hisn now knows what each framework expects a design to show.

- A control catalog per framework, listing the requirement families a drawing can
  speak to. `check` reports which of them the blueprint addresses and which it
  never mentions, so the review answers both whether controls are named and
  whether the design covers the ground.
- The catalogs name families rather than sub numbered controls, because sub
  numbers move between versions of a framework. A blueprint control addresses an
  entry when it starts with it, so Req 3.4 addresses Req 3.
- A new `controls` command that prints what a framework expects.
- Framework coverage appears in the review panel of every generated file and in
  the demo, as a checklist under the findings.
- Running the new coverage against the reference blueprints found real gaps, so
  the PCI blueprint gained intrusion detection and a configuration baseline, HIPAA
  gained an integrity control, GDPR gained the processing principles, ISO 27001
  gained segregation of networks, and IEC 62443 gained use control and resource
  availability. All eight now address their whole catalog.
- A ready GitHub Actions workflow at examples/ci/blueprint-review.yml that fails a
  pull request when a blueprint has a high finding.
- 62 tests.

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
