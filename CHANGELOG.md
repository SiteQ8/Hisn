# Changelog

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
