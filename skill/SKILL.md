---
name: hisn
description: Use this skill when someone wants a security or compliance architecture drawn or reviewed. Hisn turns a short text source into a blueprint of trust zones, the components inside them, and the data flowing between them, colored by data classification and annotated with the controls each element maps to, and it reviews that blueprint for gaps such as sensitive data moving with no named control or a flow that skips a trust tier. It has reference blueprints for PCI DSS, SWIFT CSP, Zero Trust, HIPAA, GDPR, SOC 2, ISO 27001, and IEC 62443. Trigger this for requests like "draw our cardholder data environment", "what would a zero trust architecture look like", "diagram where PHI flows", "review this architecture for control gaps", or "which controls cover which parts of this design".
---

# Hisn: security blueprints as code

Hisn draws a security or compliance reference architecture from a short text
source, and reviews it. The output is one self contained interactive HTML file
with no dependencies and no server: the reader can pan and zoom, click a component
to trace its data flows, read the review panel, and export an image.

Reach for Hisn when the question is about the shape of a secure architecture,
where the trust boundaries are, what data crosses them, and which control covers
each step.

## Workflow

1. Start from a reference blueprint when the request names a framework:

   ```
   npx github:SiteQ8/Hisn template pci > cde.hisn
   ```

   The names are `pci`, `swift`, `zerotrust`, `hipaa`, `gdpr`, `soc2`,
   `iso27001`, and `iec62443`. Otherwise write the source yourself using the
   language below.
2. Edit it for the environment being described.
3. Build the interactive blueprint:

   ```
   npx github:SiteQ8/Hisn render cde.hisn -o cde.html
   ```
4. Review it for gaps, and read the findings back to the person:

   ```
   npx github:SiteQ8/Hisn check cde.hisn
   ```

   Add `--json` to parse the result, or `--strict` to exit non zero when a high
   finding is present, which is how it gates a pipeline.
5. To see what a framework expects a design to show, and what this blueprint is
   missing, read the coverage block that `check` prints, or list a catalog:

   ```
   npx github:SiteQ8/Hisn controls pci
   ```
6. For a control coverage table, for example to paste into a review document:

   ```
   npx github:SiteQ8/Hisn matrix cde.hisn -o coverage.md
   ```
7. To review an architecture change, compare the two revisions with `diff` below.

## Comparing two revisions

When someone asks what changed in an architecture, or whether a change is safe,
compare the two revisions:

```
npx github:SiteQ8/Hisn diff before.hisn after.hisn
npx github:SiteQ8/Hisn diff before.hisn after.hisn -o change.html
```

It separates what got weaker from what got better. Regressions are a control
removed, a zone made less trusted, a component moved somewhere less trusted, a
flow carrying more sensitive data than before, a flow quietly marked less
sensitive, and any review finding the earlier revision did not have. Report the
regressions first and plainly, since that is the answer to whether the change is
safe. `--strict` exits non zero on a high regression.

## The language

Every line is one statement. Text after a `#` is a comment. Labels are wrapped in
double quotes. An id is a short word with no spaces.

- `title <text>` names the blueprint.
- `framework <name>` records the framework.
- `zone <id> "Label" trust=<level>` declares a trust zone. Levels from least to
  most trusted: `untrusted`, `dmz`, `restricted`, `secure`, `management`. Zones
  are drawn as bands in that order, so the picture reads as defence in depth. Two
  zones may share a level when they are peers.
- `component <id> "Label" [zone=<id>] [type=<type>] [controls="a, b"]` places a
  component. Types: user, internet, firewall, waf, gateway, proxy, lb, server,
  app, api, db, store, queue, hsm, ids, siem, cloud, service.
- `flow <a> -> <b> ["label"] [data=<class>] [controls="a, b"]` draws a data flow.
  Classes: `public`, `internal`, `pii`, `chd` (cardholder data), `secret`. A
  component named only in a flow is created automatically.

A control list names the scheme once, so `controls="Req 3.5, 3.6"` means Req 3.5
and Req 3.6.

```
title Payment environment
framework pci

zone internet "Internet" trust=untrusted
zone dmz "DMZ" trust=dmz
zone cde "Cardholder data environment" trust=secure
zone mgmt "Management" trust=management

component cardholder "Cardholder" zone=internet type=user
component waf "Web application firewall" zone=dmz type=waf controls="Req 6.6"
component fw "Segmentation firewall" zone=cde type=firewall controls="Req 1.2, 1.3"
component app "Payment application" zone=cde type=app controls="Req 6.2"
component vault "Cardholder data store" zone=cde type=db controls="Req 3.4"
component hsm "Key management HSM" zone=cde type=hsm controls="Req 3.5, 3.6"
component siem "Logging and monitoring" zone=mgmt type=siem controls="Req 10.2"

flow cardholder -> waf "HTTPS" data=chd controls="Req 4.1"
flow waf -> fw "into the CDE" data=chd controls="Req 1.3"
flow fw -> app "tokenize" data=chd controls="Req 3.4"
flow app -> vault "store token" data=chd controls="Req 3.4"
flow app -> hsm "encrypt" data=secret controls="Req 3.5"
flow app -> siem "audit log" data=internal controls="Req 10.2"
```

## What the review looks for

- Sensitive data, meaning cardholder data or secret material, moving with no named
  control. Personal data is the same finding at a lower severity.
- A flow that crosses more than one trust level in a single step. Reaching a
  boundary device such as a gateway or firewall is not counted, since that is the
  controlled path, and a person operating a device is not counted either.
- A boundary crossing that names no control.
- A data store holding sensitive data that names no control of its own.
- Sensitive data with no logging or monitoring component anywhere in the picture.
- Secret material with no key management component shown.
- A component in no zone, or a component with no flows.

In the drawing, a flow that names no control is dashed, so gaps are visible
without opening the review.

Separately from the findings, `check` reports framework coverage: which areas of
the framework catalog the blueprint speaks to and which it never mentions. A
control addresses an entry when it starts with it, so `Req 3.4` addresses `Req 3`.
Coverage is a checklist, not a finding, and reaching 100% means the picture
mentions every area a drawing can show, not that the programme is compliant.

## Tips

- Put a gateway, firewall, or jump host at a boundary rather than drawing a long
  reach into a trusted zone. That is both better architecture and what the review
  expects.
- Classify flows honestly. The classification drives the color and most of the
  review, so marking cardholder data as internal hides the finding rather than
  fixing it.
- Name controls as the framework writes them, such as `Req 3.4`, `CSCF 1.2`,
  `164.312(e)(1)`, `Art. 32`, `CC6.1`, `A.8.24`, or `SR 5.2`.
- Be clear with the person about what this is. A blueprint records where a control
  belongs in a design. It is not evidence that the control is implemented, and a
  clean review means the drawing names a control everywhere the rules look, not
  that the system is compliant. Say so rather than letting a clean report imply
  more than it means.
