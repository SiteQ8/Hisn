// What each framework expects a reference architecture to address.
//
// These catalogs are deliberately coarse. They name the requirement family or
// theme rather than a specific sub numbered control, for two reasons: sub numbers
// move between versions of a framework, and the useful signal from a drawing is
// not whether you wrote 3.4 or 3.5, it is whether the design says anything at all
// about protecting stored data. A blueprint control matches a catalog entry when
// it starts with it, so naming "Req 3.4" addresses "Req 3".
//
// Each catalog is a subset chosen for what an architecture can actually show.
// Requirements about policy, training, physical premises, and process are left
// out because a drawing is the wrong place to evidence them. Addressing every
// entry here is not compliance, it means the blueprint speaks to each area the
// drawing is able to speak to.

export const catalogs = {
  pci: {
    label: "PCI DSS",
    note: "The requirement families a cardholder data environment diagram can show.",
    controls: [
      { id: "Req 1", title: "Network security controls between trusted and untrusted networks" },
      { id: "Req 2", title: "Secure configuration of system components" },
      { id: "Req 3", title: "Protection of stored account data" },
      { id: "Req 4", title: "Strong cryptography for account data in transit" },
      { id: "Req 6", title: "Secure systems and protection of public facing applications" },
      { id: "Req 7", title: "Access restricted by business need to know" },
      { id: "Req 8", title: "User identification and authentication" },
      { id: "Req 10", title: "Logging and monitoring of access" },
      { id: "Req 11", title: "Detection of intrusions and unexpected changes" },
    ],
  },
  swift: {
    label: "SWIFT CSP",
    note: "The customer security controls framework principles a secure zone diagram can show.",
    controls: [
      { id: "CSCF 1", title: "Restrict internet access and protect critical systems" },
      { id: "CSCF 2", title: "Reduce attack surface and vulnerabilities" },
      { id: "CSCF 4", title: "Prevent compromise of credentials" },
      { id: "CSCF 5", title: "Manage identities and segregate privileges" },
      { id: "CSCF 6", title: "Detect anomalous activity" },
    ],
  },
  zerotrust: {
    label: "Zero Trust",
    note: "The logical components of NIST SP 800-207 and the control families that carry them.",
    controls: [
      { id: "800-207", title: "Policy decision and policy enforcement components" },
      { id: "AC", title: "Access control and authorization of each request" },
      { id: "IA", title: "Identification and authentication of subjects and devices" },
      { id: "AU", title: "Audit records of activity used in decisions" },
      { id: "SC", title: "Protection of communications" },
      { id: "SI", title: "Threat information feeding the policy engine" },
    ],
  },
  hipaa: {
    label: "HIPAA",
    note: "The security rule safeguards an ePHI environment diagram can show.",
    controls: [
      { id: "164.308(a)", title: "Administrative safeguards including contingency planning" },
      { id: "164.312(a)", title: "Access control for ePHI" },
      { id: "164.312(b)", title: "Audit controls" },
      { id: "164.312(c)", title: "Integrity of ePHI" },
      { id: "164.312(d)", title: "Person or entity authentication" },
      { id: "164.312(e)", title: "Transmission security" },
    ],
  },
  gdpr: {
    label: "GDPR",
    note: "The articles a personal data flow diagram can speak to.",
    controls: [
      { id: "Art. 5", title: "Principles relating to processing" },
      { id: "Art. 6", title: "Lawful basis for processing" },
      { id: "Art. 17", title: "Right to erasure" },
      { id: "Art. 25", title: "Data protection by design and by default" },
      { id: "Art. 28", title: "Processor obligations" },
      { id: "Art. 30", title: "Records of processing activities" },
      { id: "Art. 32", title: "Security of processing" },
      { id: "Art. 33", title: "Personal data breach notification" },
    ],
  },
  soc2: {
    label: "SOC 2",
    note: "The trust services criteria a production environment diagram can show.",
    controls: [
      { id: "CC6.1", title: "Logical access security over protected information" },
      { id: "CC6.6", title: "Boundary protection from outside the system" },
      { id: "CC6.7", title: "Restricted transmission and movement of information" },
      { id: "CC7.2", title: "Monitoring for anomalies and security events" },
      { id: "CC8.1", title: "Changes to infrastructure and software" },
      { id: "A1.2", title: "Backup and recovery of data" },
    ],
  },
  iso27001: {
    label: "ISO 27001",
    note: "The Annex A controls an information security zone diagram can show.",
    controls: [
      { id: "A.5.15", title: "Access control" },
      { id: "A.8.2", title: "Privileged access rights" },
      { id: "A.8.12", title: "Data leakage prevention" },
      { id: "A.8.15", title: "Logging" },
      { id: "A.8.16", title: "Monitoring activities" },
      { id: "A.8.20", title: "Networks security" },
      { id: "A.8.22", title: "Segregation of networks" },
      { id: "A.8.24", title: "Use of cryptography" },
    ],
  },
  iec62443: {
    label: "IEC 62443",
    note: "The foundational requirements a zones and conduits diagram can show.",
    controls: [
      { id: "SR 1", title: "Identification and authentication control" },
      { id: "SR 2", title: "Use control and authorization enforcement" },
      { id: "SR 3", title: "System integrity of the control path" },
      { id: "SR 5", title: "Restricted data flow between zones" },
      { id: "SR 6", title: "Timely response to events" },
      { id: "SR 7", title: "Resource availability" },
    ],
  },
  nca: {
    label: "NCA ECC",
    note: "The essential cybersecurity controls subdomains a network diagram can show.",
    controls: [
      { id: "ECC 2-5", title: "Identity and access management" },
      { id: "ECC 2-6", title: "Information system and processing facilities protection" },
      { id: "ECC 2-7", title: "Networks security management" },
      { id: "ECC 2-9", title: "Data and information protection" },
      { id: "ECC 2-10", title: "Cryptography" },
      { id: "ECC 2-11", title: "Backup and recovery management" },
      { id: "ECC 2-14", title: "Cybersecurity event logs and monitoring management" },
    ],
  },
  nis2: {
    label: "NIS2",
    note: "The risk management measures of Article 21 that a design can show, and the reporting duty of Article 23.",
    controls: [
      { id: "Art. 21(2)(b)", title: "Incident handling" },
      { id: "Art. 21(2)(c)", title: "Business continuity and backup management" },
      { id: "Art. 21(2)(d)", title: "Supply chain security" },
      { id: "Art. 21(2)(e)", title: "Security in acquisition, development and maintenance" },
      { id: "Art. 21(2)(h)", title: "Cryptography and encryption" },
      { id: "Art. 21(2)(i)", title: "Access control and asset management" },
      { id: "Art. 21(2)(j)", title: "Multi factor authentication and secured communications" },
      { id: "Art. 23", title: "Reporting significant incidents to the authority" },
    ],
  },
  cis: {
    label: "CIS Controls",
    note: "The CIS critical security controls an enterprise network diagram can show.",
    controls: [
      { id: "CIS 3", title: "Data protection" },
      { id: "CIS 4", title: "Secure configuration of assets and software" },
      { id: "CIS 5", title: "Account management" },
      { id: "CIS 6", title: "Access control management" },
      { id: "CIS 8", title: "Audit log management" },
      { id: "CIS 11", title: "Data recovery" },
      { id: "CIS 12", title: "Network infrastructure management" },
      { id: "CIS 13", title: "Network monitoring and defence" },
      { id: "CIS 16", title: "Application software security" },
    ],
  },
};

export const catalogNames = Object.keys(catalogs);

function norm(s) {
  return String(s).trim().toLowerCase().replace(/\s+/g, " ");
}

// A blueprint control addresses a catalog entry when it is that entry, or is a
// more specific one below it, so "Req 3.4" addresses "Req 3".
export function addresses(control, catalogId) {
  const a = norm(control), b = norm(catalogId);
  if (a === b) return true;
  if (!a.startsWith(b)) return false;
  const next = a.charAt(b.length);
  return next === "." || next === " " || next === "-" || next === "(";
}

// Read a catalog supplied by the caller, so a team whose framework is not built in
// can declare its own control set. Throws a readable message on a bad shape rather
// than failing later with something cryptic.
export function readCatalog(value) {
  const obj = typeof value === "string" ? JSON.parse(value) : value;
  if (!obj || typeof obj !== "object") throw new Error("a catalog must be an object");
  if (!Array.isArray(obj.controls) || !obj.controls.length) throw new Error("a catalog needs a controls array with at least one entry");
  const controls = obj.controls.map((c, i) => {
    if (!c || typeof c !== "object") throw new Error(`control ${i + 1} must be an object with an id and a title`);
    if (!c.id) throw new Error(`control ${i + 1} needs an id`);
    return { id: String(c.id), title: String(c.title || c.id) };
  });
  const seen = new Set();
  for (const c of controls) {
    if (seen.has(c.id)) throw new Error(`control '${c.id}' appears twice`);
    seen.add(c.id);
  }
  return { label: String(obj.label || "Custom"), note: String(obj.note || "A control set supplied for this review."), controls };
}

// Which catalog entries a blueprint speaks to, and which it never mentions. A
// catalog passed in wins over the one the framework directive would select.
export function frameworkCoverage(ir, custom) {
  const cat = custom ? readCatalog(custom) : catalogs[String(ir.framework || "").toLowerCase()];
  if (!cat) return null;
  const named = [];
  ir.components.forEach((c) => c.controls.forEach((k) => named.push(k)));
  ir.flows.forEach((f) => f.controls.forEach((k) => named.push(k)));

  const addressed = [], missing = [];
  for (const entry of cat.controls) {
    const hits = [...new Set(named.filter((k) => addresses(k, entry.id)))].sort();
    if (hits.length) addressed.push({ ...entry, by: hits });
    else missing.push(entry);
  }
  return {
    id: custom ? "custom" : String(ir.framework).toLowerCase(),
    label: cat.label,
    note: cat.note,
    expected: cat.controls.length,
    addressed,
    missing,
    percent: cat.controls.length ? Math.round((addressed.length / cat.controls.length) * 100) : 0,
  };
}
