// Built in reference blueprints, one per framework.
//
// Each is a starting point for a real design, not a certification and not
// evidence that any control is implemented. The control references show where a
// control belongs in the shape of the architecture. Edit them for the environment
// you actually run, and confirm the control text against the framework itself.
//
// Each blueprint is written to pass its own review, so it also shows what a clean
// report looks like.

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
component web "Payment page" zone=dmz type=server controls="Req 4.1, 2.2"
component fw "Segmentation firewall" zone=cde type=firewall controls="Req 1.2, 1.3"
component app "Payment application" zone=cde type=app controls="Req 6.2"
component vault "Cardholder data store" zone=cde type=db controls="Req 3.4"
component hsm "Key management HSM" zone=cde type=hsm controls="Req 3.5, 3.6"
component siem "Logging and monitoring" zone=mgmt type=siem controls="Req 10.2, 10.6"
component bastion "Jump host" zone=mgmt type=gateway controls="Req 8.3"
component ids "Intrusion detection" zone=mgmt type=ids controls="Req 11.5"
component staff "Administrator" zone=corp type=user

flow cardholder -> waf "HTTPS" data=chd controls="Req 4.1"
flow waf -> web "filtered" data=chd controls="Req 4.1"
flow web -> fw "into the CDE" data=chd controls="Req 1.3"
flow fw -> app "tokenize" data=chd controls="Req 3.4"
flow app -> vault "store token" data=chd controls="Req 3.4"
flow app -> hsm "encrypt" data=secret controls="Req 3.5"
flow app -> siem "audit log" data=internal controls="Req 10.2"
flow staff -> bastion "MFA" data=secret controls="Req 8.3"
flow bastion -> app "administer" data=internal controls="Req 7.1"
flow ids -> fw "inspect traffic" data=internal controls="Req 11.5"`,

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
component swiftnet "SWIFTNet" zone=network type=cloud controls="CSCF 2.6"

flow operator -> oppc "logon" data=internal controls="CSCF 4.1"
flow oppc -> jump "restricted path" data=internal controls="CSCF 1.2"
flow jump -> messaging "operate" data=internal controls="CSCF 1.1"
flow messaging -> comms "hand off" data=internal controls="CSCF 2.2"
flow comms -> hsm "sign" data=secret controls="CSCF 5.1"
flow comms -> swiftnet "send" data=secret controls="CSCF 2.6"
flow messaging -> siem "log" data=internal controls="CSCF 6.4"`,

  zerotrust: `title Zero trust architecture
framework zerotrust

zone edge "Subject and device" trust=untrusted
zone data "Data plane" trust=restricted
zone support "Supporting systems" trust=secure
zone plane "Control plane" trust=secure

component subject "Subject" zone=edge type=user
component device "Device" zone=edge type=server controls="IA-3"
component pep "Policy enforcement point" zone=data type=gateway controls="800-207 3.1"
component resource "Enterprise resource" zone=data type=app controls="AC-3"
component pe "Policy engine" zone=plane type=service controls="800-207 3.3"
component pa "Policy administrator" zone=plane type=service controls="AC-6"
component idm "Identity management" zone=support type=service controls="IA-2"
component pki "PKI" zone=support type=hsm controls="IA-5"
component siem "Activity logs" zone=support type=siem controls="AU-6"
component ti "Threat intelligence" zone=support type=cloud controls="SI-5"

flow subject -> device "uses" data=internal controls="IA-2"
flow device -> pep "request" data=internal controls="IA-3"
flow pep -> pa "authorize" data=internal controls="AC-3"
flow pa -> pe "evaluate" data=internal controls="AC-6"
flow pep -> resource "granted session" data=pii controls="AC-3, SC-8"
flow idm -> pe "identity" data=secret controls="IA-5"
flow pki -> pe "certificates" data=secret controls="IA-5"
flow siem -> pe "signals" data=internal controls="AU-6"
flow ti -> pe "intel" data=public controls="SI-5"`,

  hipaa: `title HIPAA security rule ePHI environment
framework hipaa

zone internet "Internet" trust=untrusted
zone dmz "DMZ" trust=dmz
zone clinical "Clinical network" trust=restricted
zone ephi "ePHI environment" trust=secure
zone mgmt "Management" trust=management

component patient "Patient" zone=internet type=user
component portal "Patient portal WAF" zone=dmz type=waf controls="164.312(e)(1)"
component portalapp "Portal front end" zone=dmz type=server controls="164.312(e)(1)"
component fw "Segmentation firewall" zone=ephi type=firewall controls="164.312(a)(1)"
component vpn "Clinician access gateway" zone=ephi type=gateway controls="164.312(d)"
component ehr "Electronic health record" zone=ephi type=app controls="164.312(a)(1)"
component ephidb "ePHI data store" zone=ephi type=db controls="164.312(a)(2)(iv)"
component backup "Encrypted backup" zone=ephi type=store controls="164.308(a)(7)(ii)(A)"
component audit "Audit and monitoring" zone=mgmt type=siem controls="164.312(b)"
component clinician "Clinician" zone=clinical type=user

flow patient -> portal "HTTPS" data=pii controls="164.312(e)(1)"
flow portal -> portalapp "filtered" data=pii controls="164.312(e)(1)"
flow portalapp -> fw "into the ePHI zone" data=pii controls="164.312(a)(1)"
flow fw -> ehr "record request" data=pii controls="164.312(a)(1)"
flow ehr -> ephidb "read and write ePHI" data=pii controls="164.312(a)(2)(iv), 164.312(c)(1)"
flow ephidb -> backup "encrypted backup" data=pii controls="164.308(a)(7)(ii)(A)"
flow ehr -> audit "activity log" data=internal controls="164.312(b)"
flow clinician -> vpn "authenticate" data=internal controls="164.312(d)"
flow vpn -> ehr "clinical access" data=pii controls="164.312(a)(1)"`,

  gdpr: `title GDPR personal data processing
framework gdpr

zone public "Data subject" trust=untrusted
zone edge "Collection" trust=dmz
zone processing "Processing" trust=restricted
zone store "Personal data store" trust=secure
zone governance "Governance" trust=secure

component subject "Data subject" zone=public type=user
component consent "Consent capture" zone=edge type=app controls="Art. 7"
component api "Intake API" zone=edge type=api controls="Art. 32"
component svc "Processing service" zone=processing type=app controls="Art. 25, 5"
component erasure "Erasure service" zone=processing type=service controls="Art. 17"
component processor "Sub processor" zone=processing type=cloud controls="Art. 28"
component pdb "Personal data store" zone=store type=db controls="Art. 32"
component ropa "Records of processing" zone=governance type=service controls="Art. 30"
component log "Breach detection" zone=governance type=siem controls="Art. 33"

flow subject -> consent "gives consent" data=pii controls="Art. 7"
flow consent -> api "submits" data=pii controls="Art. 32"
flow api -> svc "processes" data=pii controls="Art. 6"
flow svc -> pdb "stores" data=pii controls="Art. 32"
flow svc -> processor "shares under contract" data=pii controls="Art. 28"
flow erasure -> pdb "erases on request" data=pii controls="Art. 17"
flow svc -> log "records events" data=internal controls="Art. 33"
flow ropa -> svc "records processing" data=internal controls="Art. 30"`,

  soc2: `title SOC 2 production environment
framework soc2

zone internet "Internet" trust=untrusted
zone edge "Edge" trust=dmz
zone appzone "Application tier" trust=restricted
zone datazone "Data tier" trust=secure
zone mgmt "Management and monitoring" trust=secure

component customer "Customer" zone=internet type=user
component engineer "Engineer" zone=internet type=user
component cdn "CDN" zone=edge type=proxy controls="CC6.6"
component lb "Load balancer" zone=edge type=lb controls="CC6.6"
component api "Application API" zone=appzone type=api controls="CC6.1"
component worker "Background worker" zone=appzone type=service controls="CC8.1"
component db "Primary database" zone=datazone type=db controls="CC6.1"
component secrets "Secrets manager" zone=datazone type=hsm controls="CC6.1"
component backup "Backup store" zone=datazone type=store controls="A1.2"
component siem "Monitoring and alerting" zone=mgmt type=siem controls="CC7.2"
component bastion "Access gateway" zone=mgmt type=gateway controls="CC6.1"

flow customer -> cdn "HTTPS" data=internal controls="CC6.7"
flow cdn -> lb "forward" data=internal controls="CC6.6"
flow lb -> api "route" data=internal controls="CC6.6"
flow api -> db "read and write" data=pii controls="CC6.1"
flow api -> secrets "fetch credential" data=secret controls="CC6.1"
flow worker -> db "process jobs" data=pii controls="CC6.1"
flow db -> backup "nightly backup" data=pii controls="A1.2"
flow api -> siem "application log" data=internal controls="CC7.2"
flow engineer -> bastion "SSO and MFA" data=secret controls="CC6.1"
flow bastion -> api "deploy" data=internal controls="CC8.1"`,

  iso27001: `title ISO 27001 information security zones
framework iso27001

zone internet "Internet" trust=untrusted
zone perimeter "Perimeter" trust=dmz
zone corporate "Corporate network" trust=restricted
zone vault "Restricted information" trust=secure
zone soc "Security operations" trust=secure

component external "External party" zone=internet type=user
component fw "Perimeter firewall" zone=perimeter type=firewall controls="A.8.20, A.8.22"
component vpn "Remote access gateway" zone=perimeter type=gateway controls="A.8.21"
component staff "Employee" zone=corporate type=user
component fileshare "Corporate file share" zone=corporate type=store controls="A.5.15"
component jump "Privileged access host" zone=vault type=gateway controls="A.8.2"
component app "Business application" zone=vault type=app controls="A.8.9"
component crown "Restricted data store" zone=vault type=db controls="A.8.24"
component keys "Key management" zone=vault type=hsm controls="A.8.24"
component log "Logging and monitoring" zone=soc type=siem controls="A.8.15, A.8.16"
component dlp "Data leakage prevention" zone=soc type=ids controls="A.8.12"

flow external -> fw "inbound" data=internal controls="A.8.20"
flow fw -> vpn "tunnel" data=secret controls="A.8.21"
flow vpn -> jump "remote access" data=internal controls="A.8.5"
flow staff -> fileshare "day to day" data=internal controls="A.5.15"
flow staff -> jump "privileged access" data=secret controls="A.8.2"
flow jump -> app "administer" data=internal controls="A.8.2"
flow app -> crown "read and write" data=secret controls="A.8.24"
flow app -> keys "encryption keys" data=secret controls="A.8.24"
flow app -> log "events" data=internal controls="A.8.15"
flow dlp -> fileshare "inspect" data=internal controls="A.8.12"`,

  iec62443: `title IEC 62443 zones and conduits
framework iec62443

zone enterprise "Enterprise network" trust=untrusted
zone idmz "Industrial DMZ" trust=dmz
zone operations "Operations" trust=restricted
zone control "Basic control" trust=secure
zone safety "Safety instrumented" trust=secure

component erp "Business systems" zone=enterprise type=server controls="SR 5.2"
component fw "Conduit firewall" zone=idmz type=firewall controls="SR 5.2"
component mirror "Historian mirror" zone=idmz type=store controls="SR 5.2, 7.3"
component eng "Engineer" zone=operations type=user
component hmi "Operator HMI" zone=operations type=app controls="SR 1.1, 2.1"
component historian "Process historian" zone=operations type=store controls="SR 6.1"
component siem "Process monitoring" zone=operations type=siem controls="SR 6.2"
component plc "Programmable controller" zone=control type=server controls="SR 3.1"
component io "Field devices" zone=control type=service controls="SR 3.1"
component sis "Safety instrumented system" zone=safety type=server controls="SR 5.1"

flow erp -> fw "business data" data=internal controls="SR 5.2"
flow fw -> mirror "replicate" data=internal controls="SR 5.2"
flow mirror -> historian "mirrored history" data=internal controls="SR 5.2"
flow eng -> hmi "operate" data=internal controls="SR 1.1"
flow hmi -> historian "trend data" data=internal controls="SR 6.1"
flow hmi -> plc "commands" data=internal controls="SR 3.1"
flow plc -> io "control loop" data=internal controls="SR 3.1"
flow plc -> sis "safety interlock" data=internal controls="SR 5.1"
flow historian -> siem "process events" data=internal controls="SR 6.2"`,

  nca: `title NCA essential cybersecurity controls
framework nca

zone internet "Internet" trust=untrusted
zone dmz "DMZ" trust=dmz
zone corporate "Corporate network" trust=restricted
zone datacenter "Data centre" trust=secure
zone soc "Security operations" trust=secure

component external "External user" zone=internet type=user
component fw "Perimeter firewall" zone=dmz type=firewall controls="ECC 2-7-3"
component waf "Web application firewall" zone=dmz type=waf controls="ECC 2-6-2"
component staff "Employee" zone=corporate type=user
component seg "Internal segmentation firewall" zone=datacenter type=firewall controls="ECC 2-7-1"
component iam "Identity and access management" zone=datacenter type=service controls="ECC 2-5-3"
component jump "Privileged access host" zone=datacenter type=gateway controls="ECC 2-5-4"
component app "Business application" zone=datacenter type=app controls="ECC 2-6-1"
component data "Sensitive data store" zone=datacenter type=db controls="ECC 2-9-3"
component keys "Cryptographic key management" zone=datacenter type=hsm controls="ECC 2-10-2"
component backup "Backup repository" zone=datacenter type=store controls="ECC 2-11-3"
component siem "Event logs and monitoring" zone=soc type=siem controls="ECC 2-14-3"

flow external -> fw "inbound" data=internal controls="ECC 2-7-3"
flow fw -> waf "filtered" data=internal controls="ECC 2-6-2"
flow waf -> seg "into the data centre" data=pii controls="ECC 2-7-1"
flow seg -> app "application traffic" data=pii controls="ECC 2-6-1"
flow staff -> jump "privileged access" data=secret controls="ECC 2-5-4"
flow jump -> app "administer" data=internal controls="ECC 2-5-3"
flow iam -> app "authenticate" data=secret controls="ECC 2-5-3"
flow app -> data "read and write" data=pii controls="ECC 2-9-3"
flow app -> keys "encrypt" data=secret controls="ECC 2-10-2"
flow data -> backup "scheduled backup" data=pii controls="ECC 2-11-3"
flow app -> siem "event logs" data=internal controls="ECC 2-14-3"`,

  nis2: `title NIS2 essential entity network and information systems
framework nis2

zone internet "Internet" trust=untrusted
zone edge "Edge" trust=dmz
zone corporate "Corporate network" trust=restricted
zone core "Core services" trust=secure
zone soc "Security operations" trust=secure

component user "Service user" zone=internet type=user
component supplier "Supplier service" zone=internet type=cloud controls="Art. 21(2)(d)"
component gw "Access gateway" zone=edge type=gateway controls="Art. 21(2)(j)"
component mfa "Authentication service" zone=edge type=service controls="Art. 21(2)(j)"
component staff "Operator" zone=corporate type=user
component seg "Core segmentation" zone=core type=firewall controls="Art. 21(2)(i)"
component app "Essential service" zone=core type=app controls="Art. 21(2)(e)"
component db "Service data store" zone=core type=db controls="Art. 21(2)(i)"
component vault "Key management" zone=core type=hsm controls="Art. 21(2)(h)"
component backup "Backup and recovery" zone=core type=store controls="Art. 21(2)(c)"
component soc "Incident detection" zone=soc type=siem controls="Art. 21(2)(b)"
component report "Authority reporting" zone=soc type=service controls="Art. 23"

flow user -> gw "service request" data=pii controls="Art. 21(2)(j)"
flow gw -> mfa "verify" data=secret controls="Art. 21(2)(j)"
flow gw -> seg "into core services" data=pii controls="Art. 21(2)(i)"
flow seg -> app "authorized session" data=pii controls="Art. 21(2)(e)"
flow staff -> gw "operator access" data=secret controls="Art. 21(2)(j)"
flow app -> db "read and write" data=pii controls="Art. 21(2)(i)"
flow app -> vault "encrypt" data=secret controls="Art. 21(2)(h)"
flow db -> backup "recovery point" data=pii controls="Art. 21(2)(c)"
flow supplier -> gw "supplier integration" data=internal controls="Art. 21(2)(d)"
flow app -> soc "security events" data=internal controls="Art. 21(2)(b)"
flow soc -> report "notify authority" data=internal controls="Art. 23"`,

  cis: `title CIS controls enterprise environment
framework cis

zone internet "Internet" trust=untrusted
zone edge "Edge" trust=dmz
zone enterprise "Enterprise network" trust=restricted
zone servers "Server estate" trust=secure
zone soc "Security operations" trust=secure

component user "Remote user" zone=internet type=user
component fw "Network firewall" zone=edge type=firewall controls="CIS 12.2"
component vpn "Remote access gateway" zone=edge type=gateway controls="CIS 6.4"
component workstation "Workstation" zone=enterprise type=server controls="CIS 4.1"
component directory "Account management" zone=servers type=service controls="CIS 5.3"
component app "Business application" zone=servers type=app controls="CIS 16.1"
component db "Data store" zone=servers type=db controls="CIS 3.11"
component keys "Key management" zone=servers type=hsm controls="CIS 3.11"
component backup "Recovery store" zone=servers type=store controls="CIS 11.2"
component logs "Audit log management" zone=soc type=siem controls="CIS 8.2"
component nids "Network monitoring" zone=soc type=ids controls="CIS 13.3"

flow user -> vpn "remote access" data=secret controls="CIS 6.4"
flow vpn -> workstation "session" data=internal controls="CIS 4.1"
flow fw -> vpn "filtered" data=internal controls="CIS 12.2"
flow workstation -> app "use" data=internal controls="CIS 6.4"
flow directory -> app "authenticate" data=secret controls="CIS 5.3"
flow app -> db "read and write" data=pii controls="CIS 3.11"
flow app -> keys "encryption keys" data=secret controls="CIS 3.11"
flow db -> backup "recovery copy" data=pii controls="CIS 11.2"
flow app -> logs "audit records" data=internal controls="CIS 8.2"
flow nids -> fw "monitor traffic" data=internal controls="CIS 13.3"`,
};

export const templateNames = Object.keys(templates);

// Short titles for a picker in a user interface.
export const templateLabels = {
  pci: "PCI DSS",
  swift: "SWIFT CSP",
  zerotrust: "Zero Trust",
  hipaa: "HIPAA",
  gdpr: "GDPR",
  soc2: "SOC 2",
  iso27001: "ISO 27001",
  iec62443: "IEC 62443",
  nca: "NCA ECC",
  nis2: "NIS2",
  cis: "CIS Controls",
};
