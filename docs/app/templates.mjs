// Built in reference blueprints. Each is a starting point for a real design, not
// a certification: it shows the shape of the architecture and where the named
// controls sit, and is meant to be edited for a specific environment.

export const templates = {
  pci: `title PCI DSS cardholder data environment
framework pci

zone internet "Internet" trust=untrusted
zone dmz "DMZ" trust=dmz
zone corp "Corporate network" trust=restricted
zone cde "Cardholder data environment" trust=secure
zone mgmt "Management" trust=management

component cardholder "Cardholder" zone=internet type=user
component waf "Web application firewall" zone=dmz type=waf controls="Req 6.6"
component web "Payment page" zone=dmz type=server controls="Req 4.1"
component app "Payment application" zone=cde type=app controls="Req 6.2"
component vault "Cardholder data store" zone=cde type=db controls="Req 3.4"
component hsm "Key management HSM" zone=cde type=hsm controls="Req 3.5, 3.6"
component siem "Logging and monitoring" zone=mgmt type=siem controls="Req 10.2, 10.6"
component bastion "Jump host" zone=mgmt type=gateway controls="Req 8.3"
component staff "Administrator" zone=corp type=user

flow cardholder -> waf "HTTPS" data=chd controls="Req 4.1"
flow waf -> web "filtered" data=chd
flow web -> app "tokenize" data=chd controls="Req 3.4"
flow app -> vault "store token" data=chd controls="Req 3.4"
flow app -> hsm "encrypt" data=secret controls="Req 3.5"
flow app -> siem "audit log" data=internal controls="Req 10.2"
flow staff -> bastion "MFA" data=secret controls="Req 8.3"
flow bastion -> app "administer" data=internal controls="Req 7.1"`,

  swift: `title SWIFT customer security programme secure zone
framework swift

zone office "General enterprise" trust=untrusted
zone ops "Operator zone" trust=restricted
zone secure "SWIFT secure zone" trust=secure
zone network "SWIFT network" trust=management

component operator "Operator" zone=office type=user
component oppc "Operator PC" zone=ops type=server controls="CSCF 2.1"
component jump "Jump server" zone=secure type=gateway controls="CSCF 1.2, 4.1"
component messaging "Messaging interface" zone=secure type=app controls="CSCF 1.1, 2.2"
component comms "Communication interface" zone=secure type=server controls="CSCF 1.1"
component hsm "Hardware security module" zone=secure type=hsm controls="CSCF 5.1"
component siem "Monitoring" zone=secure type=siem controls="CSCF 6.4"
component swiftnet "SWIFTNet" zone=network type=cloud

flow operator -> oppc "logon" data=internal controls="CSCF 4.1"
flow oppc -> jump "restricted path" data=internal controls="CSCF 1.2"
flow jump -> messaging "operate" data=internal controls="CSCF 1.1"
flow messaging -> comms "hand off" data=internal
flow comms -> hsm "sign" data=secret controls="CSCF 5.1"
flow comms -> swiftnet "send" data=secret controls="CSCF 2.6"
flow messaging -> siem "log" data=internal controls="CSCF 6.4"`,

  zerotrust: `title Zero trust architecture
framework zerotrust

zone untrusted "Subject and device" trust=untrusted
zone plane "Control plane" trust=management
zone data "Data plane" trust=secure
zone support "Supporting systems" trust=restricted

component subject "Subject" zone=untrusted type=user
component device "Device" zone=untrusted type=server
component pep "Policy enforcement point" zone=data type=gateway
component pe "Policy engine" zone=plane type=service
component pa "Policy administrator" zone=plane type=service
component resource "Enterprise resource" zone=data type=app
component idm "Identity management" zone=support type=service
component pki "PKI" zone=support type=hsm
component siem "Activity logs" zone=support type=siem
component ti "Threat intelligence" zone=support type=cloud

flow subject -> device "uses" data=internal
flow device -> pep "request" data=internal
flow pep -> pa "authorize" data=internal
flow pa -> pe "evaluate" data=internal
flow pep -> resource "granted session" data=pii
flow idm -> pe "identity" data=secret
flow pki -> pe "certificates" data=secret
flow siem -> pe "signals" data=internal
flow ti -> pe "intel" data=public`,
};

export const templateNames = Object.keys(templates);
