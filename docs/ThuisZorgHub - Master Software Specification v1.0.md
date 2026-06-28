# ThuisZorgHub - Master Software Specification

### Smart Software for Modern Homecare

---

# Document Information

| Property       | Value                              |
| -------------- | ---------------------------------- |
| Product Name   | ThuisZorgHub                       |
| Tagline        | Smart Software for Modern Homecare |
| Document       | Master Software Specification      |
| Version        | 1.0                                |
| Status         | Draft                              |
| Product Type   | Multi-Tenant SaaS                  |
| Platform       | Web Application                    |
| Target Market  | Netherlands                        |
| Languages      | Dutch & English                    |
| Database       | Supabase PostgreSQL                |
| Authentication | Supabase Auth                      |
| Hosting        | Vercel                             |
| UI Framework   | Next.js + TailwindCSS + shadcn/ui  |
| Prepared By    | Product Team                       |
| Last Updated   | TBD                                |

---

# Revision History

| Version | Date | Description                  | Author       |
| ------- | ---- | ---------------------------- | ------------ |
| 1.0     | TBD  | Initial Master Specification | Product Team |

---

# Table of Contents

## PART I — PRODUCT FOUNDATION

1. Executive Summary
2. Product Vision
3. Business Objectives
4. Mission Statement
5. Product Philosophy
6. Product Scope
7. Out of Scope
8. Target Customers
9. User Personas
10. Business Model
11. Success Metrics
12. Product Roadmap
13. Decision Log

---

## PART II — BUSINESS REQUIREMENTS

14. Business Requirements Document (BRD)
15. Functional Requirements
16. Non-Functional Requirements
17. Business Rules
18. User Stories
19. Acceptance Criteria

---

## PART III — SYSTEM ARCHITECTURE

20. High-Level Architecture
21. Technology Stack
22. Multi-Tenant Architecture
23. Folder Structure
24. Environment Configuration
25. Deployment Architecture
26. Security Architecture
27. Backup Strategy
28. Disaster Recovery

---

## PART IV — DATABASE DESIGN

29. Database Design Overview
30. Entity Relationship Diagram (ERD)
31. Database Naming Standards
32. Complete Table Specifications
33. Relationships
34. Constraints
35. Indexing Strategy
36. Audit Tables
37. Soft Delete Strategy
38. Row Level Security (RLS)
39. Migration Strategy

---

## PART V — AUTHENTICATION & AUTHORIZATION

40. Authentication Flow
41. Login
42. Password Reset
43. Email Verification
44. Session Management
45. Multi-Factor Authentication (Future)
46. Role-Based Access Control (RBAC)
47. Permission Matrix

---

## PART VI — MODULE SPECIFICATIONS

48. Dashboard
49. Organization Management
50. Branch Management
51. User Management
52. Employee Management
53. Client Management
54. Scheduling
55. Calendar
56. Visit Management
57. Tasks
58. Notes
59. Documents
60. Notifications
61. Internal Messaging
62. Reports
63. Billing
64. Settings
65. Audit Logs
66. Super Admin Portal

---

## PART VII — USER INTERFACE

67. Design System
68. Branding Guidelines
69. Color Palette
70. Typography
71. Icons
72. Layout Standards
73. Navigation
74. Sidebar
75. Tables
76. Forms
77. Modals
78. Notifications
79. Mobile Responsiveness
80. Accessibility

---

## PART VIII — API SPECIFICATION

81. API Standards
82. Authentication APIs
83. Organization APIs
84. User APIs
85. Employee APIs
86. Client APIs
87. Scheduling APIs
88. Notification APIs
89. Report APIs
90. Billing APIs

---

## PART IX — LOCALIZATION

91. Internationalization Strategy
92. Dutch Translation Standards
93. English Translation Standards
94. Language Switching
95. Date & Time Formatting
96. Currency Formatting

---

## PART X — SECURITY

97. Security Standards
98. Encryption
99. Data Privacy
100.  GDPR Compliance
101.  Audit Logging
102.  Password Policy
103.  File Security
104.  Session Security

---

## PART XI — TESTING

105. Testing Strategy
106. Unit Testing
107. Integration Testing
108. User Acceptance Testing
109. Security Testing
110. Performance Testing

---

## PART XII — DEPLOYMENT

111. Development Environment
112. Staging Environment
113. Production Environment
114. CI/CD Strategy
115. Monitoring
116. Logging
117. Error Reporting

---

## PART XIII — CLAUDE CODE DEVELOPMENT GUIDE

118. Development Standards
119. Coding Conventions
120. Claude Code Prompt Structure
121. Module Development Workflow
122. Prompt Library
123. Testing Workflow
124. Deployment Workflow

---

## PART XIV — FUTURE ROADMAP

125. Version 2 Features
126. Mobile Application
127. Third-Party Integrations
128. White Label
129. AI Features
130. Marketplace

---

## APPENDICES

A. Glossary

B. Acronyms

C. References

D. Change Log

E. Open Questions

F. Design Decisions

G. Future Ideas

# 1. Executive Summary

## 1.1 Introduction

ThuisZorgHub is a modern, cloud-based Software as a Service (SaaS) platform built specifically for homecare agencies operating in the Netherlands.

The platform is designed to replace fragmented operational processes by providing a centralized digital workspace for managing organizations, caregivers, clients, planning, visits, documentation, communication, reporting, and administration.

Unlike traditional healthcare software that often contains excessive complexity and steep learning curves, ThuisZorgHub focuses on usability, simplicity, performance, and operational efficiency.

The platform will initially support approximately twenty independent homecare organizations while maintaining a scalable architecture capable of supporting future growth.

---

# 1.2 Vision

To become the preferred operational platform for modern homecare agencies by delivering secure, intuitive, and efficient software that enables organizations to focus more on care and less on administration.

---

# 1.3 Mission

Our mission is to simplify the daily operations of homecare agencies by providing one integrated platform that improves collaboration, reduces administrative workload, standardizes processes, and increases productivity.

---

# 1.4 Problem Statement

Many homecare agencies currently rely on a combination of spreadsheets, paper documents, emails, messaging applications, and disconnected software systems.

These fragmented workflows often result in:

- Duplicate data entry
- Scheduling conflicts
- Missing documentation
- Communication gaps
- Increased administrative workload
- Limited operational visibility
- Difficulty scaling operations

ThuisZorgHub addresses these challenges by consolidating all operational activities into a single, cloud-based application.

---

# 1.5 Product Overview

ThuisZorgHub provides agencies with the tools required to manage their day-to-day operations through one unified platform.

The platform includes functionality for:

- Organization Management
- Branch Management
- Employee Management
- Client Management
- Scheduling
- Visit Tracking
- Calendar
- Documentation
- Notifications
- Internal Communication
- Reports
- Audit Logs
- Subscription Management
- Super Admin Portal

Each organization operates within its own isolated environment while the SaaS platform is centrally administered.

---

# 1.6 Product Positioning

ThuisZorgHub is positioned as a modern operational management platform for small and medium-sized homecare agencies.

The product prioritizes:

- Ease of use
- Rapid onboarding
- Clean user interface
- Strong security
- Operational efficiency
- Modular architecture
- Future scalability

The platform intentionally avoids unnecessary enterprise complexity while remaining extensible for future growth.

---

# 1.7 Target Market

Primary Market:

- Dutch Homecare Agencies
- Personal Care Providers
- Nursing Agencies
- Elderly Care Organizations

Future Expansion:

- Belgium
- Germany
- Other European countries

---

# 1.8 Product Type

Product Category:
Business-to-Business (B2B)

Delivery Model:
Software as a Service (SaaS)

Architecture:
Multi-Tenant

Deployment:
Cloud-Based

Platform:
Web Application

---

# 1.9 Languages

Primary Language:
Dutch

Secondary Language:
English

The entire platform will support multilingual functionality from the initial release.

All user-facing text will be managed through localization files to simplify future language additions.

---

# 1.10 Success Definition

Version 1.0 will be considered successful if the platform achieves the following objectives:

Business Goals:

- 20 paying organizations
- Stable recurring monthly revenue
- High customer retention

Operational Goals:

- 99.9% uptime
- Less than one day agency onboarding
- Less than thirty minutes caregiver onboarding
- Responsive performance across all modules

Product Goals:

- High user satisfaction
- Reduced administrative workload
- Increased scheduling efficiency
- Improved organizational communication

---

# 1.11 Guiding Philosophy

Every feature developed for ThuisZorgHub must satisfy the following principles:

- Solve a real operational problem.
- Be intuitive without extensive training.
- Minimize the number of user interactions.
- Follow consistent interface patterns.
- Protect sensitive information.
- Scale without requiring architectural redesign.
- Remain modular and maintainable.
- Deliver measurable value to homecare organizations.

These principles act as the foundation for all future product and technical decisions.

# 2. Product Vision

---

# 2.1 Vision Statement

ThuisZorgHub exists to modernize the operational management of homecare agencies by providing a secure, reliable, and easy-to-use cloud platform that centralizes every critical business process into one integrated system.

The platform is designed to reduce administrative overhead, simplify day-to-day operations, improve communication between staff members, and provide managers with complete operational visibility.

Rather than competing by offering hundreds of complicated features, ThuisZorgHub will compete by delivering a clean user experience, intuitive workflows, and software that employees enjoy using every day.

---

# 2.2 Long-Term Vision

Within five years, ThuisZorgHub aims to become one of the leading homecare management platforms in the Netherlands for small and medium-sized agencies.

The long-term objective is to create a complete digital operating system for homecare organizations while maintaining simplicity and usability.

Future expansion may include:

- Belgium
- Germany
- Luxembourg
- Other European healthcare markets

---

# 2.3 Product Principles

Every feature added to ThuisZorgHub must follow these principles.

## Principle 1 — Simplicity First

Software should reduce work, not create more work.

Users should never require extensive training to perform common tasks.

If a workflow can be simplified without sacrificing functionality, the simpler solution must always be preferred.

---

## Principle 2 — One Source of Truth

Every piece of information should exist only once inside the platform.

Duplicate records and duplicate data entry should be avoided whenever possible.

Changes should automatically be reflected across all related modules.

---

## Principle 3 — Modern User Experience

The interface should feel modern, clean, responsive, and uncluttered.

Every page should have a clear purpose.

Navigation should remain predictable throughout the application.

---

## Principle 4 — Security by Design

Security is not an optional feature.

The platform must be designed around:

- Authentication
- Authorization
- Audit Logging
- Data Encryption
- Secure File Storage
- GDPR Compliance

Security requirements must be considered before implementation of every module.

---

## Principle 5 — Modularity

Every module should function independently.

Examples:

Client Management should not depend on Reports.

Scheduling should not depend on Billing.

Documents should not depend on Notifications.

This modular approach improves maintainability and future development.

---

## Principle 6 — Performance

Performance should be considered during every stage of development.

Expected targets:

- Dashboard loads within 2 seconds.
- Tables load within 1 second for normal datasets.
- Search results appear almost instantly.
- File uploads provide visible progress indicators.

---

## Principle 7 — Scalability

Although Version 1 targets approximately twenty organizations, the software architecture must support significantly larger deployments without requiring major redesign.

All database tables, APIs, and services should follow scalable design principles.

---

## Principle 8 — Consistency

Every screen should use consistent:

- Buttons
- Colors
- Tables
- Forms
- Filters
- Search Bars
- Navigation
- Error Messages
- Confirmation Dialogs

Users should never need to learn different interfaces for different modules.

---

# 2.4 Product Positioning

ThuisZorgHub is positioned as a professional operational management platform for homecare agencies.

The product is intentionally focused on operational excellence rather than hospital-level clinical management.

It is designed primarily for organizations that require efficient administration, scheduling, employee management, client management, and communication.

---

# 2.5 Competitive Advantage

ThuisZorgHub differentiates itself through:

- Modern interface
- Fast performance
- Simple workflows
- Bilingual support
- Multi-tenant architecture
- Easy onboarding
- Cloud-first deployment
- Modular design
- Affordable implementation
- Personalized customer support

Rather than attempting to include every possible feature, the platform prioritizes the features agencies use daily.

---

# 2.6 Core Product Values

The product should always represent the following values:

- Simplicity
- Reliability
- Professionalism
- Transparency
- Security
- Accessibility
- Efficiency
- Scalability
- Trust

These values should influence every future product decision.

---

# 2.7 Product Success Definition

ThuisZorgHub succeeds when agency staff no longer need to rely on spreadsheets, paper records, or multiple disconnected systems to perform their daily work.

The platform should become the primary operational workspace for every employee within a homecare organization.

---

# Functional Requirements

FR-001 The system shall support multiple organizations.

FR-002 The system shall support multiple branches within each organization.

FR-003 The platform shall support Dutch and English languages.

FR-004 The system shall operate as a cloud-based SaaS application.

FR-005 The system shall provide role-based access control.

FR-006 The system shall maintain complete audit logs.

FR-007 The platform shall support modular expansion.

FR-008 The user interface shall remain consistent across all modules.

---

# Non-Functional Requirements

NFR-001 The application shall maintain 99.9% availability.

NFR-002 Dashboard loading time shall remain below two seconds under normal operating conditions.

NFR-003 All communication shall use HTTPS.

NFR-004 Sensitive information shall be encrypted.

NFR-005 Database backups shall be performed automatically.

NFR-006 User interface shall support desktop and tablet devices.

NFR-007 The platform shall comply with GDPR requirements.

NFR-008 The application shall be responsive across supported screen sizes.

# 3. Business Requirements Document (BRD)

---

# 3.1 Purpose

The purpose of this Business Requirements Document (BRD) is to define the business needs, operational objectives, stakeholders, workflows, and functional expectations of ThuisZorgHub.

This document ensures that all future development aligns with the actual operational requirements of homecare agencies rather than assumptions.

The BRD serves as the foundation for the Product Requirements Document (PRD), database design, system architecture, and implementation.

---

# 3.2 Business Goals

The primary business goals of ThuisZorgHub are:

### BG-001

Digitize the daily operations of homecare agencies.

### BG-002

Reduce administrative workload through centralized management.

### BG-003

Improve communication between office staff and caregivers.

### BG-004

Provide managers with real-time operational visibility.

### BG-005

Reduce scheduling conflicts and human errors.

### BG-006

Provide secure storage for client and employee information.

### BG-007

Deliver a scalable SaaS platform capable of supporting multiple organizations.

### BG-008

Reduce the learning curve for new employees through a simple user interface.

---

# 3.3 Stakeholders

## Internal Stakeholders

### Product Owner

Responsible for defining business priorities and approving product direction.

### Super Administrator

Responsible for managing all organizations, subscriptions, billing, and platform administration.

### Development Team

Responsible for implementation, maintenance, testing, and deployment.

---

## Customer Stakeholders

### Organization Owner

Owns the agency.

Responsible for:

- Organization Settings
- Subscription
- Employee Management
- Branches
- Reports
- Business Decisions

---

### Branch Manager

Responsible for:

- Daily branch operations
- Caregiver supervision
- Client oversight
- Schedule monitoring
- Staff performance

---

### Scheduler

Responsible for:

- Assigning caregivers
- Managing shifts
- Handling leave conflicts
- Updating visit schedules
- Daily planning

---

### Administrative Staff

Responsible for:

- Client registration
- Employee administration
- Documentation
- File uploads
- Internal communication

---

### Caregiver

Responsible for:

- Viewing schedules
- Viewing assigned clients
- Reading visit notes
- Uploading visit documentation
- Receiving announcements

---

### Finance Staff

Responsible for:

- Subscription invoices
- Organization billing
- Payment tracking
- Financial reports

---

### Auditor

Read-only access.

Responsible for:

- Reviewing audit logs
- Compliance checks
- Internal reviews

---

# 3.4 Business Problems

Homecare agencies commonly experience:

## Problem 1

Multiple disconnected software systems.

---

## Problem 2

Paper-based documentation.

---

## Problem 3

Scheduling conflicts.

---

## Problem 4

Difficulty tracking caregiver activities.

---

## Problem 5

Poor communication between office staff and caregivers.

---

## Problem 6

Duplicate client information.

---

## Problem 7

Lack of operational visibility.

---

## Problem 8

Manual reporting.

---

# 3.5 Business Solution

ThuisZorgHub addresses these challenges by providing one centralized platform that integrates:

- Organization Management
- Employee Management
- Client Management
- Planning
- Scheduling
- Documentation
- Communication
- Reporting
- Administration

Every department works from the same system using real-time data.

---

# 3.6 Business Scope

The initial version includes:

✓ Organization Management

✓ Branch Management

✓ User Management

✓ Role Management

✓ Employee Management

✓ Client Management

✓ Scheduling

✓ Calendar

✓ Visits

✓ Documents

✓ Notifications

✓ Internal Messaging

✓ Reports

✓ Settings

✓ Audit Logs

✓ Billing

---

# 3.7 Out of Scope

The following capabilities are intentionally excluded from Version 1:

- Native Mobile Apps
- AI Features
- Payroll Processing
- Medication Administration
- EHR Integration
- Marketplace
- Insurance Integration
- Government Healthcare Integration
- Accounting Software Integration

---

# 3.8 Business Rules

BR-001

Every user belongs to exactly one organization.

---

BR-002

Every organization may contain multiple branches.

---

BR-003

Every branch belongs to exactly one organization.

---

BR-004

Every employee belongs to one organization and may optionally be assigned to one or more branches.

---

BR-005

Every client belongs to one organization.

---

BR-006

Every visit must be assigned to one client.

---

BR-007

Every scheduled visit must have an assigned caregiver.

---

BR-008

Only authorized users may access sensitive client information.

---

BR-009

Every important action must be recorded in the audit log.

---

BR-010

Deleted records should be soft deleted whenever possible.

---

# 3.9 Success Metrics

Operational KPIs

- 95% reduction in paper documentation.
- 80% reduction in scheduling conflicts.
- 90% reduction in duplicate data.
- Agency onboarding within one day.
- New employee onboarding within thirty minutes.

Business KPIs

- Twenty active organizations.
- High monthly customer retention.
- Positive customer satisfaction scores.
- Stable recurring subscription revenue.

---

# 3.10 Risks

Risk:

Users resist changing existing workflows.

Mitigation:

Provide intuitive interfaces and onboarding guides.

---

Risk:

Rapid feature expansion increases complexity.

Mitigation:

Follow strict product scope and modular development.

---

Risk:

Sensitive healthcare information.

Mitigation:

Implement strong security, encryption, audit logging, and role-based permissions.

---

# Functional Requirements

FR-009 The system shall allow organizations to manage multiple branches.

FR-010 The system shall maintain complete audit logs.

FR-011 The system shall support configurable user roles.

FR-012 The system shall centralize operational workflows.

FR-013 The platform shall support secure document storage.

FR-014 The system shall support organization-level data isolation.

FR-015 The system shall support configurable organization settings.

---

# Non-Functional Requirements

NFR-009 The platform shall support future expansion without major redesign.

NFR-010 The system shall remain available during business hours.

NFR-011 The user interface shall remain consistent throughout the platform.

NFR-012 The application shall provide responsive layouts for desktop and tablet users.

NFR-013 Database backups shall be automated.

NFR-014 Audit logs shall be retained according to configurable retention policies.

# 4. Core Business Entities

---

# 4.1 Overview

ThuisZorgHub is built around a set of core business entities that represent the real-world objects and relationships within a homecare organization.

Every feature, database table, API endpoint, permission, report, and user interface is based on one or more of these entities.

This entity-first architecture ensures consistency, scalability, and maintainability throughout the application.

---

# Entity Hierarchy

```
ThuisZorgHub Platform
│
├── Organizations
│
├── Branches
│
├── Users
│
├── Roles
│
├── Permissions
│
├── Employees
│
├── Clients
│
├── Schedules
│
├── Visits
│
├── Tasks
│
├── Documents
│
├── Notes
│
├── Notifications
│
├── Reports
│
├── Audit Logs
│
└── Subscription
```

---

# Entity 1 — Organization

## Description

An Organization represents a homecare agency using ThuisZorgHub.

Every customer in the SaaS platform is an independent organization.

Each organization has its own:

- Users
- Employees
- Clients
- Branches
- Documents
- Settings
- Reports
- Subscription

Organizations cannot access each other's information.

---

## Examples

ABC Homecare BV

CarePlus Netherlands

Amsterdam Home Services

---

## Business Rules

Each organization:

- Has one owner.
- May have multiple branches.
- May have multiple employees.
- May have multiple clients.
- Has one subscription.
- Has isolated data.

---

# Entity 2 — Branch

## Description

A branch represents a physical office or operational location belonging to an organization.

Examples:

Amsterdam Office

Rotterdam Office

Utrecht Office

---

## Business Rules

Each branch belongs to exactly one organization.

A branch can have:

- Employees
- Managers
- Clients
- Visits
- Schedules

---

# Entity 3 — User

## Description

A User represents anyone who can log into the system.

Examples include:

- Owner
- Scheduler
- Caregiver
- Administrator
- Finance Staff

A User account is required for authentication.

---

## Business Rules

Every user:

- Belongs to one organization.
- Has one or more roles.
- Has login credentials.
- Has permissions.
- Generates audit logs.

---

# Entity 4 — Employee

## Description

An Employee represents a staff member employed by the organization.

Not every employee must necessarily log in immediately, but most operational staff will have linked user accounts.

Examples:

Registered Nurse

Caregiver

Office Administrator

Branch Manager

---

## Employee Information

Examples of stored data include:

- Personal details
- Contact information
- Emergency contact
- Employment status
- Branch assignment
- Role
- Documents
- Certifications

---

# Entity 5 — Client

## Description

A Client is a person receiving homecare services.

Every client belongs to one organization.

Clients are assigned caregivers through schedules and visits.

---

## Client Information

Examples include:

- Personal information
- Address
- Emergency contacts
- Care requirements
- Assigned caregivers
- Documents
- Notes
- Visit history

---

# Entity 6 — Schedule

## Description

A Schedule defines planned work for caregivers.

Schedules are created by schedulers or managers.

Schedules generate one or more Visits.

---

# Entity 7 — Visit

## Description

A Visit represents a scheduled appointment between a caregiver and a client.

Each visit contains:

- Date
- Time
- Assigned caregiver
- Assigned client
- Status
- Notes
- Duration

---

# Entity 8 — Task

Tasks represent operational work items.

Examples:

Review client documents.

Approve leave request.

Update client profile.

Complete visit documentation.

---

# Entity 9 — Document

Documents include uploaded files related to organizations, employees, or clients.

Examples:

Contracts

Identification

Medical forms

Certificates

Insurance documents

Policies

Documents are securely stored using Supabase Storage.

---

# Entity 10 — Note

Notes are text records attached to entities such as:

Clients

Employees

Visits

Organizations

Notes provide historical context without modifying core records.

---

# Entity 11 — Notification

Notifications inform users about important events.

Examples:

New visit assigned

Schedule changed

Document uploaded

Announcement published

Leave approved

Notifications may be read, unread, or archived.

---

# Entity 12 — Report

Reports summarize operational information.

Examples:

Employee activity

Client statistics

Visit completion

Scheduling overview

Branch performance

Subscription information

---

# Entity 13 — Audit Log

Every important action within the system generates an audit log entry.

Examples include:

User login

Client created

Employee updated

Visit cancelled

Role changed

Document deleted

Audit logs cannot be edited by normal users.

---

# Entity 14 — Subscription

Every organization has one active subscription.

The subscription records:

Plan

Billing cycle

Implementation fee

Status

Renewal date

Payment history

Only Super Admins and Organization Owners may manage subscriptions.

---

# Entity Relationships

Organization
→ Branches

Organization
→ Users

Organization
→ Employees

Organization
→ Clients

Employee
→ Visits

Client
→ Visits

Visit
→ Notes

Visit
→ Documents

User
→ Roles

Role
→ Permissions

Organization
→ Subscription

Every relationship will be fully defined later in the Database Design chapter.

---

# Functional Requirements

FR-016 Every organization shall maintain complete ownership of its data.

FR-017 Every branch shall belong to exactly one organization.

FR-018 Every client shall belong to exactly one organization.

FR-019 Every visit shall link one client and one caregiver.

FR-020 Every document shall be associated with a business entity.

FR-021 Every audit event shall record the acting user, timestamp, and affected entity.

FR-022 Every subscription shall belong to one organization.

---

# Non-Functional Requirements

NFR-015 All entities shall use UUID primary keys.

NFR-016 Soft deletion shall be supported where appropriate.

NFR-017 All timestamps shall be stored in UTC.

NFR-018 Every entity shall include created_at and updated_at fields.

NFR-019 Referential integrity shall be enforced through foreign keys.

NFR-020 Entity relationships shall be optimized for PostgreSQL performance.

# 5. User Roles & Permission Matrix

---

# 5.1 Overview

The ThuisZorgHub authorization system is based on **Role-Based Access Control (RBAC)**.

Each user is assigned one or more roles.

Each role contains a predefined set of permissions.

Permissions determine:

- Which modules are visible.
- Which actions are allowed.
- Which records are accessible.
- Which API endpoints can be called.
- Which reports can be viewed.
- Which settings can be modified.

Permissions are always evaluated within the user's organization. No user can access another organization's data.

---

# 5.2 User Roles

## Role 1 — Super Admin

Platform administrator.

This role exists only within ThuisZorgHub and is not assigned to customer organizations.

Responsibilities:

- Manage organizations
- Manage subscriptions
- Suspend organizations
- Restore organizations
- Platform monitoring
- Global announcements
- System configuration
- Storage management
- Billing oversight
- View all audit logs

---

## Role 2 — Organization Owner

The highest-level user within a customer organization.

Responsibilities:

- Manage organization
- Manage branches
- Manage employees
- Manage users
- View reports
- Manage subscription
- Organization settings

---

## Role 3 — Branch Manager

Responsible for one or more branches.

Responsibilities:

- Manage employees
- Manage clients
- Approve leave
- View schedules
- Assign caregivers
- View reports

Cannot modify organization settings or billing.

---

## Role 4 — Scheduler

Responsible for workforce planning.

Responsibilities:

- Create schedules
- Edit schedules
- Assign caregivers
- Manage visits
- View employee availability
- Handle scheduling conflicts

Cannot manage billing or organization settings.

---

## Role 5 — Administrative Staff

Responsible for office administration.

Responsibilities:

- Register clients
- Update client information
- Upload documents
- Manage notes
- Send announcements
- Search records

---

## Role 6 — Caregiver

Field employee.

Responsibilities:

- View personal schedule
- View assigned clients
- Read care instructions
- Complete visits
- Upload visit notes
- Upload visit documents
- Receive notifications

Cannot edit organization data.

---

## Role 7 — Finance Staff

Responsibilities:

- View invoices
- Export financial reports
- View subscriptions
- Payment history

Cannot manage clinical or scheduling information.

---

## Role 8 — Auditor

Read-only access.

Responsibilities:

- View reports
- View audit logs
- View records

Cannot modify any information.

---

# 5.3 Permission Types

Every permission belongs to one of the following actions:

VIEW

CREATE

UPDATE

DELETE

EXPORT

APPROVE

ASSIGN

UPLOAD

DOWNLOAD

MANAGE

CONFIGURE

---

# 5.4 Permission Matrix

## Dashboard

| Permission     | Super Admin | Owner | Branch Manager | Scheduler | Admin | Caregiver | Finance | Auditor |
| -------------- | ----------- | ----- | -------------- | --------- | ----- | --------- | ------- | ------- |
| View Dashboard | ✓           | ✓     | ✓              | ✓         | ✓     | ✓         | ✓       | ✓       |

---

## Organization

| Permission | SA  | Owner | Manager | Scheduler | Admin | Caregiver | Finance | Auditor |
| ---------- | --- | ----- | ------- | --------- | ----- | --------- | ------- | ------- |
| View       | ✓   | ✓     | ✓       | ✗         | ✗     | ✗         | ✗       | ✓       |
| Edit       | ✓   | ✓     | ✗       | ✗         | ✗     | ✗         | ✗       | ✗       |
| Delete     | ✓   | ✗     | ✗       | ✗         | ✗     | ✗         | ✗       | ✗       |

---

## Branches

Owner

Manager

Super Admin

Can Create

Can Edit

Can Archive

---

## Employees

Owner

Manager

Admin

Can Create

Can Edit

Can View

Scheduler can View only.

Caregiver can View Self only.

---

## Clients

Owner

Manager

Admin

Scheduler

Can View

Can Create

Can Edit

Caregiver

Can View Assigned Clients Only.

---

## Scheduling

Owner

Manager

Scheduler

Full Access.

Caregiver

View Own Schedule.

Finance

No Access.

---

## Visits

Owner

Manager

Scheduler

Full Access.

Caregiver

View Assigned Visits

Complete Assigned Visits

Upload Notes

Upload Documents

---

## Documents

Owner

Manager

Admin

Upload

Download

Delete

Caregiver

Upload Visit Documents

View Assigned Documents

---

## Reports

Owner

Manager

Finance

View

Export

Super Admin

View Global Reports

---

## Billing

Super Admin

Full Access

Owner

View Organization Subscription

Finance

View Payments

No other roles may access billing.

---

## Settings

Super Admin

Platform Settings

Owner

Organization Settings

Manager

Branch Settings

All other roles

No Access

---

# 5.5 Permission Rules

PR-001

Users may only access records belonging to their organization.

PR-002

Caregivers may only view their own schedules.

PR-003

Caregivers may only access assigned clients.

PR-004

Only Organization Owners may invite new users.

PR-005

Only Super Admins may create organizations.

PR-006

Only Super Admins may suspend organizations.

PR-007

Only authorized roles may delete documents.

PR-008

Every permission-sensitive action must generate an audit log.

---

# Functional Requirements

FR-023 The platform shall implement Role-Based Access Control (RBAC).

FR-024 Users may hold multiple roles where required.

FR-025 Permissions shall be evaluated before every protected action.

FR-026 Unauthorized actions shall return appropriate access denied responses.

FR-027 Permissions shall control both user interface visibility and backend authorization.

---

# Non-Functional Requirements

NFR-021 Authorization checks shall complete within acceptable response times.

NFR-022 Permission rules shall remain centrally managed.

NFR-023 Every permission change shall be audit logged.

NFR-024 Row Level Security (RLS) shall enforce organization-level data isolation.

# 6. Complete Module Inventory

---

# 6.1 Module Architecture

The ThuisZorgHub platform is organized into functional domains.

Each domain contains one or more business modules responsible for a specific operational area.

This modular architecture ensures maintainability, scalability, and future extensibility.

---

# Domain 1 — Platform

Purpose:
Provides the core infrastructure required for every organization.

Modules:

• Authentication

• User Management

• Role Management

• Permission Management

• Organization Management

• Branch Management

• Settings

• Audit Logs

---

# Domain 2 — Homecare Operations

Purpose:
Manages all operational activities of a homecare agency.

Modules:

• Client Management

• Employee Management

• Scheduling

• Calendar

• Visit Management

• Leave Management

• Availability Management

---

# Domain 3 — Documentation

Purpose:
Centralized storage and management of operational documents.

Modules:

• Documents

• Notes

• Attachments

• File Categories

• Document History

---

# Domain 4 — Communication

Purpose:
Improve collaboration within the organization.

Modules:

• Notifications

• Announcements

• Internal Messaging

• Activity Feed

---

# Domain 5 — Reporting

Purpose:
Provide operational insights.

Modules:

• Dashboard

• Reports

• Export Center

• Statistics

---

# Domain 6 — Commercial

Purpose:
Manage SaaS subscriptions.

Modules:

• Subscription

• Billing

• Invoice History

• Organization Plans

---

# Domain 7 — Administration

Purpose:
Platform administration.

Modules:

• Super Admin Dashboard

• Organization Management

• Platform Monitoring

• Storage Monitoring

• User Support

---

# Module Dependency Diagram

Platform Modules

↓

Operations Modules

↓

Documentation

↓

Communication

↓

Reports

↓

Billing

↓

Administration

Platform modules provide services to every other domain.

---

# Module List

| ID      | Module             | Priority | MVP |
| ------- | ------------------ | -------- | --- |
| MOD-001 | Authentication     | Critical | Yes |
| MOD-002 | Dashboard          | Critical | Yes |
| MOD-003 | Organization       | Critical | Yes |
| MOD-004 | Branches           | High     | Yes |
| MOD-005 | Users              | Critical | Yes |
| MOD-006 | Roles              | Critical | Yes |
| MOD-007 | Permissions        | Critical | Yes |
| MOD-008 | Employees          | Critical | Yes |
| MOD-009 | Clients            | Critical | Yes |
| MOD-010 | Scheduling         | Critical | Yes |
| MOD-011 | Calendar           | High     | Yes |
| MOD-012 | Visits             | Critical | Yes |
| MOD-013 | Leave              | Medium   | Yes |
| MOD-014 | Availability       | Medium   | Yes |
| MOD-015 | Documents          | High     | Yes |
| MOD-016 | Notes              | High     | Yes |
| MOD-017 | Notifications      | High     | Yes |
| MOD-018 | Announcements      | Medium   | Yes |
| MOD-019 | Internal Messaging | Medium   | Yes |
| MOD-020 | Reports            | High     | Yes |
| MOD-021 | Audit Logs         | Critical | Yes |
| MOD-022 | Settings           | High     | Yes |
| MOD-023 | Subscription       | Medium   | Yes |
| MOD-024 | Billing            | Medium   | Yes |
| MOD-025 | Super Admin        | Critical | Yes |

---

# Module Relationships

Dashboard

↓

Displays data from every module.

---

Organizations

↓

Contain Branches.

↓

Contain Users.

↓

Contain Employees.

↓

Contain Clients.

↓

Contain Documents.

↓

Contain Reports.

---

Employees

↓

Assigned to Schedules.

↓

Assigned to Visits.

↓

Generate Notes.

↓

Receive Notifications.

---

Clients

↓

Receive Visits.

↓

Have Documents.

↓

Have Notes.

↓

Appear in Reports.

---

Schedules

↓

Generate Visits.

↓

Appear in Calendar.

↓

Notify Employees.

---

Visits

↓

Generate Notes.

↓

Generate Audit Logs.

↓

Generate Reports.

↓

Store Documents.

---

Reports

↓

Read information from every operational module.

Reports never own data.

---

Audit Logs

↓

Track changes across every module.

Every module must generate audit events.

---

# Module Standards

Every module must contain:

• Overview

• Business Purpose

• Screens

• Navigation

• User Roles

• Permissions

• Database Tables

• API Endpoints

• Validation Rules

• Business Rules

• Notifications

• Audit Events

• Acceptance Criteria

• Future Improvements

Every module will follow the exact same documentation structure.

---

# Functional Requirements

FR-028 The system shall be organized into modular business domains.

FR-029 Every module shall have clearly defined ownership and responsibilities.

FR-030 Every module shall expose only the APIs required for its operation.

FR-031 Modules shall remain independently maintainable.

FR-032 Modules shall integrate through shared business entities rather than duplicated data.

---

# Non-Functional Requirements

NFR-025 Every module shall follow the same UI standards.

NFR-026 Every module shall implement audit logging.

NFR-027 Every module shall support localization.

NFR-028 Every module shall respect organization-level security.

NFR-029 Every module shall support future extensibility without breaking existing functionality.

# 7. Database Design

---

# 7.1 Overview

ThuisZorgHub uses **Supabase PostgreSQL** as its primary database.

The database follows a **multi-tenant architecture**, where multiple organizations share the same database while remaining completely isolated through Row Level Security (RLS).

Each organization only has access to its own data.

The database is designed to be:

- Scalable
- Secure
- Normalized
- Modular
- Easy to maintain
- Optimized for PostgreSQL

---

# 7.2 Database Design Principles

The following principles shall be followed throughout the database.

## DB-001

Every table shall use UUID as its primary key.

---

## DB-002

Every table shall contain:

- id
- created_at
- updated_at

---

## DB-003

Business tables shall support soft deletion.

Deleted records shall not be permanently removed.

---

## DB-004

Every organization owns its own records.

Cross-organization access is prohibited.

---

## DB-005

Every relationship shall use Foreign Keys.

---

## DB-006

No duplicated data.

Store once.

Reference everywhere.

---

## DB-007

Audit logging shall be independent.

Audit tables never modify business data.

---

# 7.3 Database Domains

The database is divided into logical domains.

---

## Platform Domain

Responsible for platform administration.

Tables:

organizations

branches

users

roles

permissions

role_permissions

user_roles

organization_settings

audit_logs

subscriptions

plans

---

## Employee Domain

employees

employee_documents

employee_notes

employee_availability

employee_leave

employee_certificates

employee_contacts

---

## Client Domain

clients

client_addresses

client_contacts

client_documents

client_notes

client_preferences

client_emergency_contacts

---

## Planning Domain

schedules

schedule_assignments

visits

visit_notes

visit_documents

visit_status_history

---

## Communication Domain

notifications

announcements

messages

message_threads

message_participants

---

## Reporting Domain

report_exports

dashboard_widgets

saved_reports

---

## System Domain

activity_logs

file_uploads

system_settings

translations

---

# 7.4 Estimated Database Size

Expected Organizations

20

Expected Employees

2,000

Expected Clients

5,000

Expected Visits

500,000+

Expected Documents

100,000+

Expected Notifications

1,000,000+

The database architecture should comfortably support these numbers without redesign.

---

# 7.5 Naming Convention

Tables

snake_case

Example

employee_documents

---

Columns

snake_case

Example

created_at

organization_id

employee_id

---

Primary Keys

id

(UUID)

---

Foreign Keys

entity_id

Examples

organization_id

branch_id

employee_id

client_id

visit_id

---

Booleans

is_active

is_deleted

is_verified

---

Date Fields

created_at

updated_at

deleted_at

scheduled_at

completed_at

---

# 7.6 Multi-Tenant Strategy

Every business table contains:

organization_id

This is the foundation of tenant isolation.

Example

employees

organization_id

↓

Only employees from Organization A can be viewed by Organization A.

Organization B cannot access those records.

---

# 7.7 Soft Delete Strategy

Records are never permanently deleted.

Instead:

is_deleted = true

deleted_at = timestamp

Deleted records remain available for:

Audit

Recovery

Compliance

Reporting

---

# 7.8 Audit Strategy

Every important action creates an audit record.

Example

User Created

Employee Updated

Visit Deleted

Schedule Changed

Permission Modified

Document Uploaded

Login

Logout

Audit logs are immutable.

---

# 7.9 File Storage

Files are stored in Supabase Storage.

Database stores only metadata.

Examples

File Name

Bucket

Owner

Entity

Upload Date

Uploader

Size

Mime Type

Path

---

# 7.10 Row Level Security (RLS)

Every business table will implement Row Level Security.

Rules include:

Users only access their organization.

Caregivers access only assigned clients.

Branch Managers access only assigned branches.

Finance accesses only billing.

Super Admin bypasses organization restrictions.

---

# Functional Requirements

FR-033 Every table shall use UUID.

FR-034 Every business record shall belong to an organization.

FR-035 Soft deletion shall be supported.

FR-036 Audit logging shall be implemented.

FR-037 Files shall be stored in Supabase Storage.

FR-038 Organization data shall remain isolated.

---

# Non-Functional Requirements

NFR-030 Database shall support future growth without redesign.

NFR-031 PostgreSQL normalization standards shall be followed.

NFR-032 Foreign keys shall maintain referential integrity.

NFR-033 Database backups shall be automated.

NFR-034 Row Level Security shall protect every business table.

# 8. Database Data Dictionary

---

# 8.1 Introduction

The Data Dictionary defines every database table used within ThuisZorgHub.

For every table the following information will be documented:

- Business Purpose
- Table Description
- Columns
- Data Types
- Required Fields
- Default Values
- Foreign Keys
- Unique Constraints
- Indexes
- Relationships
- Validation Rules
- Row Level Security
- Audit Behaviour
- Example Record

This document acts as the authoritative database reference for developers and Claude Code.

---

# Table 1 — organizations

---

## Business Purpose

Represents a customer organization (homecare agency) using ThuisZorgHub.

Every customer is stored as one organization.

Organizations are the highest business entity in the application.

Almost every other table references an organization.

---

## Table Name

organizations

---

## Description

Stores organization profile, contact information, branding, subscription references and operational status.

---

## Columns

| Column           | Type         | Required | Description                      |
| ---------------- | ------------ | -------- | -------------------------------- |
| id               | UUID         | Yes      | Primary Key                      |
| name             | VARCHAR(150) | Yes      | Organization name                |
| legal_name       | VARCHAR(200) | No       | Registered legal entity          |
| kvk_number       | VARCHAR(30)  | No       | Dutch Chamber of Commerce number |
| vat_number       | VARCHAR(50)  | No       | VAT number                       |
| email            | VARCHAR(255) | Yes      | Primary email                    |
| phone            | VARCHAR(30)  | No       | Contact number                   |
| website          | VARCHAR(255) | No       | Company website                  |
| address_line_1   | VARCHAR(255) | Yes      | Address                          |
| address_line_2   | VARCHAR(255) | No       | Address                          |
| city             | VARCHAR(100) | Yes      | City                             |
| postal_code      | VARCHAR(20)  | Yes      | Postal Code                      |
| country          | VARCHAR(100) | Yes      | Country                          |
| logo_url         | TEXT         | No       | Organization logo                |
| primary_language | VARCHAR(10)  | Yes      | Default language                 |
| timezone         | VARCHAR(100) | Yes      | Organization timezone            |
| currency         | VARCHAR(10)  | Yes      | Default currency                 |
| subscription_id  | UUID         | No       | Active subscription              |
| is_active        | BOOLEAN      | Yes      | Active status                    |
| is_deleted       | BOOLEAN      | Yes      | Soft delete                      |
| created_at       | TIMESTAMP    | Yes      | Record creation                  |
| updated_at       | TIMESTAMP    | Yes      | Last update                      |
| deleted_at       | TIMESTAMP    | No       | Soft delete timestamp            |

---

## Relationships

Organization

↓

Has Many Branches

↓

Has Many Users

↓

Has Many Employees

↓

Has Many Clients

↓

Has Many Documents

↓

Has Many Visits

↓

Has One Subscription

---

## Validation Rules

Organization Name

Required

Maximum 150 characters

---

Primary Email

Required

Valid email format

---

Country

Required

ISO Country Code

---

Primary Language

Dutch

English

---

## Unique Constraints

Primary Email

KvK Number

---

## Indexes

id

name

email

kvk_number

created_at

---

## Row Level Security

Organization users may only access their own organization.

Super Admin bypasses all tenant restrictions.

---

## Audit Events

Organization Created

Organization Updated

Organization Archived

Organization Reactivated

Organization Deleted

Subscription Changed

---

## Example Record

```json
{
  "id": "4c9d7d9d-74d6-4b36-9db3-a61f3b21d2c4",
  "name": "ABC Homecare",
  "legal_name": "ABC Homecare BV",
  "email": "info@abchomecare.nl",
  "city": "Amsterdam",
  "country": "Netherlands",
  "primary_language": "nl",
  "is_active": true
}
```

---

# Table 2 — branches

---

## Business Purpose

Represents a physical office or operational location of an organization.

Organizations may have one or more branches.

Branches simplify employee assignment, reporting and scheduling.

---

## Table Name

branches

---

## Columns

| Column          | Type         | Required | Description             |
| --------------- | ------------ | -------- | ----------------------- |
| id              | UUID         | Yes      | Primary Key             |
| organization_id | UUID         | Yes      | Parent organization     |
| name            | VARCHAR(150) | Yes      | Branch name             |
| code            | VARCHAR(20)  | No       | Internal branch code    |
| manager_user_id | UUID         | No       | Assigned branch manager |
| email           | VARCHAR(255) | No       | Branch email            |
| phone           | VARCHAR(30)  | No       | Contact number          |
| address_line_1  | VARCHAR(255) | Yes      | Address                 |
| city            | VARCHAR(100) | Yes      | City                    |
| postal_code     | VARCHAR(20)  | Yes      | Postal Code             |
| is_active       | BOOLEAN      | Yes      | Active branch           |
| created_at      | TIMESTAMP    | Yes      | Created                 |
| updated_at      | TIMESTAMP    | Yes      | Updated                 |

---

## Relationships

Branch

↓

Belongs To Organization

↓

Has Many Employees

↓

Has Many Clients

↓

Has Many Schedules

↓

Has Many Visits

---

## Validation Rules

Branch name required.

Branch belongs to exactly one organization.

Cannot delete branch while employees are assigned.

---

## RLS Policy

Users can only access branches belonging to their organization.

Branch Managers can only access branches assigned to them.

---

## Audit Events

Branch Created

Branch Updated

Branch Archived

Branch Manager Changed

---

# Database Standards

Every remaining table in the database will follow this exact structure and documentation format.

No table shall be implemented without first being fully documented in this Data Dictionary.

8.2 Core Database Tables

# Table 3 — users

---

## Business Purpose

The **users** table represents every individual who can authenticate and access ThuisZorgHub.

A user account controls authentication, authorization, preferences, and system access.

Not every employee must have a user account, but every user is linked to one organization.

---

## Table Name

users

---

## Description

Stores login credentials, account status, language preferences, profile information, and authentication-related settings.

Authentication will be handled by **Supabase Auth**, while this table stores the application's user profile and business-specific information.

---

## Columns

| Column          | Type         | Required | Description                             |
| --------------- | ------------ | -------- | --------------------------------------- |
| id              | UUID         | Yes      | Primary Key (matches Supabase Auth UID) |
| organization_id | UUID         | Yes      | Organization                            |
| branch_id       | UUID         | No       | Default Branch                          |
| employee_id     | UUID         | No       | Linked Employee                         |
| first_name      | VARCHAR(100) | Yes      | First Name                              |
| last_name       | VARCHAR(100) | Yes      | Last Name                               |
| email           | VARCHAR(255) | Yes      | Login Email                             |
| phone           | VARCHAR(30)  | No       | Mobile Number                           |
| avatar_url      | TEXT         | No       | Profile Image                           |
| language        | VARCHAR(10)  | Yes      | User Language                           |
| timezone        | VARCHAR(100) | Yes      | User Timezone                           |
| last_login      | TIMESTAMP    | No       | Last Login                              |
| is_active       | BOOLEAN      | Yes      | Active Status                           |
| is_deleted      | BOOLEAN      | Yes      | Soft Delete                             |
| created_at      | TIMESTAMP    | Yes      | Created                                 |
| updated_at      | TIMESTAMP    | Yes      | Updated                                 |

---

## Relationships

User

↓

Belongs to Organization

↓

May Belong to Branch

↓

May Be Linked to Employee

↓

Has Many Roles

↓

Creates Audit Logs

↓

Receives Notifications

---

## Validation Rules

- Email must be unique.
- Email verified before login.
- Organization required.
- Language defaults to Organization Language.
- Timezone defaults to Organization Timezone.

---

## Row Level Security

Users can:

View their own profile.

Update their own profile.

Cannot access users from other organizations.

Only Owners and Admins can manage users.

---

## Audit Events

User Created

User Invited

User Logged In

User Logged Out

Password Reset

User Updated

User Deactivated

User Deleted

---

# Table 4 — roles

---

## Business Purpose

Defines the security roles available within an organization.

Roles determine which permissions a user receives.

---

## Example Roles

Super Admin

Organization Owner

Branch Manager

Scheduler

Administrator

Caregiver

Finance

Auditor

---

## Columns

| Column          | Type         | Required | Description   |
| --------------- | ------------ | -------- | ------------- |
| id              | UUID         | Yes      | Primary Key   |
| organization_id | UUID         | Yes      | Organization  |
| name            | VARCHAR(100) | Yes      | Role Name     |
| description     | TEXT         | No       | Description   |
| is_system       | BOOLEAN      | Yes      | Built-in Role |
| created_at      | TIMESTAMP    | Yes      | Created       |
| updated_at      | TIMESTAMP    | Yes      | Updated       |

---

## Relationships

Role

↓

Has Many Permissions

↓

Assigned To Many Users

---

## Validation Rules

Role names must be unique inside one organization.

System roles cannot be deleted.

---

## Audit Events

Role Created

Role Updated

Role Deleted

Permission Assigned

Permission Removed

---

# Table 5 — permissions

---

## Business Purpose

Stores every permission available in the application.

Permissions are assigned to Roles.

---

## Example Permissions

client.view

client.create

client.update

client.delete

employee.view

employee.update

schedule.create

schedule.assign

visit.complete

billing.view

reports.export

settings.manage

---

## Columns

| Column      | Type         | Required | Description     |
| ----------- | ------------ | -------- | --------------- |
| id          | UUID         | Yes      | Primary Key     |
| module      | VARCHAR(100) | Yes      | Module          |
| action      | VARCHAR(100) | Yes      | Action          |
| code        | VARCHAR(150) | Yes      | Permission Code |
| description | TEXT         | No       | Description     |

---

## Relationships

Permission

↓

Assigned To Roles

↓

Evaluated During Authorization

---

## Validation Rules

Permission code must be globally unique.

Permission cannot be deleted if assigned to active roles.

---

# Table 6 — user_roles

---

## Business Purpose

Maps Users to Roles.

Supports assigning multiple roles to a single user.

---

## Columns

| Column      | Type      | Required |
| ----------- | --------- | -------- |
| id          | UUID      | Yes      |
| user_id     | UUID      | Yes      |
| role_id     | UUID      | Yes      |
| assigned_by | UUID      | Yes      |
| assigned_at | TIMESTAMP | Yes      |

---

## Relationships

User

↓

Many Roles

↓

Role

---

# Table 7 — role_permissions

---

## Business Purpose

Maps Roles to Permissions.

Enables flexible Role-Based Access Control.

---

## Columns

| Column        | Type      |
| ------------- | --------- |
| id            | UUID      |
| role_id       | UUID      |
| permission_id | UUID      |
| created_at    | TIMESTAMP |

---

## Relationships

Role

↓

Many Permissions

↓

Permission

---

# Database Relationship Overview

Organization

↓

Branches

↓

Users

↓

Employees

↓

Clients

↓

Schedules

↓

Visits

↓

Documents

↓

Reports

---

Users

↓

Roles

↓

Permissions

↓

Authorization

---

# Functional Requirements

FR-039 Every authenticated user shall have one or more roles.

FR-040 Every role shall contain one or more permissions.

FR-041 Users shall inherit permissions through assigned roles.

FR-042 Permission checks shall occur before every protected action.

FR-043 Authentication shall be handled by Supabase Auth.

---

# Non-Functional Requirements

NFR-035 Authentication shall support secure session management.

NFR-036 Authorization decisions shall complete in under 100 milliseconds.

NFR-037 User permissions shall remain centrally managed.

NFR-038 Security roles shall support future customization.

# 6.5 Application Navigation & Screen Architecture

---

# Overview

The application navigation is designed to minimize user effort while providing quick access to the most frequently used features.

The navigation follows three principles:

- Maximum 2 navigation levels
- Consistent layout across all modules
- Frequently used features require minimal clicks

---

# Global Layout

```
+------------------------------------------------------+
| Header                                               |
| Search | Notifications | Language | User Profile     |
+------------------------------------------------------+

| Sidebar | Main Content Area                          |
|         |                                            |
|         |                                            |
|         |                                            |
|         |                                            |
+---------+--------------------------------------------+
```

---

# Global Header

The header is visible throughout the application.

Components:

- Global Search
- Notification Bell
- Language Switcher
- Branch Selector
- User Avatar
- User Menu

---

# Sidebar Navigation

## Dashboard

Purpose:

Provides a real-time overview of the organization.

Screens:

- Dashboard Home

---

## Clients

Screens:

- Client List
- Client Details
- Create Client
- Edit Client
- Client Documents
- Client Notes
- Visit History

---

## Employees

Screens:

- Employee List
- Employee Details
- Create Employee
- Edit Employee
- Employee Documents
- Leave Requests
- Availability
- Certifications

---

## Planning

Screens:

- Schedule Board
- Shift Planner
- Assign Caregiver
- Schedule History

---

## Calendar

Screens:

- Daily View
- Weekly View
- Monthly View

---

## Visits

Screens:

- Visit List
- Visit Details
- Active Visits
- Completed Visits

---

## Documents

Screens:

- Document Library
- Upload Document
- Categories
- Recent Uploads

---

## Communication

Screens:

- Notifications
- Announcements
- Messages

---

## Reports

Screens:

- Dashboard Reports
- Employee Reports
- Client Reports
- Visit Reports
- Export Reports

---

## Administration

Screens:

- Organization
- Branches
- Users
- Roles
- Permissions
- Audit Logs

---

## Settings

Screens:

- General Settings
- Organization Settings
- Language
- Profile
- Security
- Subscription

---

# Super Admin Navigation

Visible only to Super Admins.

Modules:

- Organizations
- Subscriptions
- Billing
- Plans
- Storage
- System Monitoring
- Platform Logs
- Support
- Broadcast Announcements

---

# Universal Components

Every page should include:

- Breadcrumb
- Page Title
- Search (when applicable)
- Filter
- Sort
- Export
- Refresh
- Pagination

---

# Standard Table Layout

Every data table follows the same structure.

Header

↓

Search

↓

Filters

↓

Bulk Actions

↓

Table

↓

Pagination

---

# Standard Detail Page Layout

Every detail page follows this structure.

Header

↓

Summary Card

↓

Tabs

↓

Activity Timeline

↓

Notes

↓

Documents

↓

Audit History

---

# Standard Create/Edit Form

Every form includes:

- Save
- Save & Continue
- Cancel

Validation is performed before submission.

Required fields are clearly marked.

---

# Global Search

Users can search for:

- Clients
- Employees
- Visits
- Documents
- Organizations (Super Admin)
- Branches
- Messages

Search results respect user permissions.

---

# Notification Center

Displays:

- Unread notifications
- Visit updates
- Schedule changes
- Announcements
- System alerts

Notifications are grouped by date and priority.

---

# Language Switcher

Available Languages:

- Dutch
- English

Changing the language updates all interface text immediately without requiring logout.

---

# User Menu

Accessible from the header.

Options:

- My Profile
- My Settings
- Change Password
- Language
- Logout

---

# Navigation Standards

NAV-001

Every module must be reachable in a maximum of two clicks from the sidebar.

NAV-002

All list pages shall support search, filtering, sorting, and pagination.

NAV-003

All detail pages shall use a tabbed layout.

NAV-004

The sidebar shall only display modules permitted for the current user role.

NAV-005

The interface shall remain consistent across all modules.

---

# Functional Requirements

FR-044 The system shall provide a persistent global navigation.

FR-045 The system shall include a universal search.

FR-046 The sidebar shall dynamically adapt based on user permissions.

FR-047 Every list page shall support filtering and searching.

FR-048 Every module shall follow a consistent navigation pattern.

---

# Non-Functional Requirements

NFR-039 Navigation changes shall occur without full page reloads.

NFR-040 The application shall remain fully responsive on desktop and tablet devices.

NFR-041 Navigation shall remain consistent across all modules.

NFR-042 Search results shall return within two seconds under normal operating conditions.

# 7. Design System & UI Standards

---

# 7.1 Purpose

The Design System defines the visual language, interaction patterns, reusable components, layout rules, spacing standards, typography, colors, and user interface principles used throughout ThuisZorgHub.

Its purpose is to ensure every screen provides a consistent, professional, and intuitive user experience.

No page shall be designed outside this Design System.

---

# 7.2 Design Principles

The user interface shall be:

Simple

Professional

Modern

Accessible

Fast

Consistent

Minimal

Responsive

---

# 7.3 Application Layout

Every authenticated page follows this structure.

```
┌────────────────────────────────────────────┐
│ Header                                     │
├──────────────┬─────────────────────────────┤
│ Sidebar      │                             │
│              │ Main Content                │
│              │                             │
│              │                             │
└──────────────┴─────────────────────────────┘
```

---

# 7.4 Header

The header appears on every page.

Components:

Company Logo

Global Search

Notification Bell

Language Switcher

Branch Selector

User Avatar

Profile Menu

---

# 7.5 Sidebar

Sidebar contains only modules available to the current user.

Sections:

Dashboard

Clients

Employees

Planning

Calendar

Visits

Documents

Communication

Reports

Administration

Settings

Collapsed mode supported.

---

# 7.6 Color Palette

Primary

#2563EB

Blue

---

Success

#16A34A

Green

---

Warning

#F59E0B

Amber

---

Danger

#DC2626

Red

---

Background

#F8FAFC

---

Cards

White

---

Borders

#E5E7EB

---

# 7.7 Typography

Primary Font

Inter

---

Heading 1

32px

Bold

---

Heading 2

24px

SemiBold

---

Heading 3

20px

SemiBold

---

Body

16px

Regular

---

Caption

14px

Regular

---

# 7.8 Buttons

Primary Button

Filled

Blue

Rounded

---

Secondary Button

Outlined

---

Danger Button

Red

---

Ghost Button

Transparent

---

Icon Button

Square

---

Loading Button

Spinner

Disabled

---

# 7.9 Cards

Cards are used for:

Dashboard

Statistics

Profiles

Reports

Settings

Standard spacing:

24px padding

12px border radius

Shadow level 1

---

# 7.10 Tables

Every table includes:

Search

Filters

Sort

Pagination

Bulk Actions

Column Selection

Export

Refresh

Sticky Header

---

# 7.11 Forms

Every form includes:

Section Heading

Field Labels

Required Indicator

Validation

Helper Text

Save

Cancel

---

# 7.12 Form Validation

Validation occurs:

Real-time

On Submit

Server-side

---

Errors displayed directly below fields.

---

# 7.13 Modals

Small

Medium

Large

Fullscreen

---

Every modal contains:

Title

Close Button

Primary Action

Secondary Action

---

# 7.14 Tabs

Tabs used for:

Client Details

Employee Details

Visit Details

Organization Details

Settings

---

# 7.15 Notifications

Toast Notifications

Success

Warning

Error

Information

---

# 7.16 Empty States

Every empty page displays:

Illustration

Explanation

Primary Action

---

# 7.17 Loading States

Skeleton Loaders

Progress Indicators

Spinners

---

# 7.18 Responsive Design

Desktop

≥1200px

Tablet

768–1199px

Mobile

<768px (Read-only support for MVP)

---

# 7.19 Accessibility

Keyboard Navigation

Visible Focus States

ARIA Labels

Color Contrast

Screen Reader Support

---

# 7.20 Component Library

The following reusable components shall be created:

Buttons

Inputs

Dropdowns

Checkboxes

Switches

Tables

Cards

Badges

Alerts

Modals

Tabs

Accordions

Date Picker

Time Picker

Avatar

Breadcrumb

Sidebar

Navbar

Pagination

Charts

File Upload

Search Bar

Notification Bell

Language Switcher

---

# UI Standards

UI-001

Every page shall use the same spacing system.

UI-002

Every button shall follow the design system.

UI-003

Every form shall use the same validation style.

UI-004

Every table shall have identical behaviour.

UI-005

Every module shall reuse existing components.

---

# Functional Requirements

FR-049 The application shall implement a reusable component library.

FR-050 Every page shall follow the global layout.

FR-051 Tables shall support searching, filtering and exporting.

FR-052 Forms shall provide real-time validation.

---

# Non-Functional Requirements

NFR-043 UI components shall be reusable.

NFR-044 Interface shall remain responsive.

NFR-045 Design shall remain consistent.

NFR-046 Accessibility guidelines shall be followed.

# Module Specification 001

# Dashboard Module

---

# Module Information

| Property              | Value                                                                      |
| --------------------- | -------------------------------------------------------------------------- |
| Module ID             | MOD-001                                                                    |
| Module Name           | Dashboard                                                                  |
| Priority              | Critical                                                                   |
| MVP                   | Yes                                                                        |
| Development Phase     | Phase 1                                                                    |
| Estimated Development | 5–7 Days                                                                   |
| Database Tables       | organizations, users, employees, clients, visits, schedules, notifications |
| User Roles            | All                                                                        |

---

# 1. Business Purpose

The Dashboard serves as the central workspace for every authenticated user.

Immediately after login, users should understand:

- What requires attention
- What is happening today
- What has changed
- What actions they need to perform

The Dashboard should eliminate the need to navigate multiple modules just to understand the current operational status.

---

# 2. Business Goals

The Dashboard should answer these questions within five seconds.

### Organization Owner

- How many caregivers are working today?
- Any missed visits?
- Any overdue tasks?
- New clients this week?
- Organization statistics?
- Recent activity?

---

### Branch Manager

- Staff currently working
- Today's visits
- Pending approvals
- Staff on leave
- New notifications

---

### Scheduler

- Unassigned visits
- Schedule conflicts
- Caregiver availability
- Today's schedule
- Tomorrow's schedule

---

### Caregiver

- Today's visits
- Upcoming visits
- Client information
- Important announcements
- Personal notifications

---

### Finance

- Outstanding invoices
- Subscription status
- Recent payments

---

# 3. Dashboard Layout

```text
--------------------------------------------------------
Header

Sidebar        KPI Cards

               Charts

               Today's Schedule

               Recent Activity

               Notifications

               Quick Actions

--------------------------------------------------------
```

---

# 4. KPI Cards

The first row displays KPI cards.

### Card 1

Today's Visits

Displays:

- Total visits today
- Completed
- Remaining

Clickable.

---

### Card 2

Active Clients

Displays:

Total active clients.

Clickable.

---

### Card 3

Active Employees

Displays:

Currently active employees.

Clickable.

---

### Card 4

Branches

Displays:

Total branches.

Hidden for caregivers.

---

### Card 5

Unread Notifications

Displays unread notification count.

---

### Card 6

Pending Tasks

Displays outstanding work items.

---

# 5. Charts

## Visit Trend

Displays visits over time.

Options:

Daily

Weekly

Monthly

---

## Employee Activity

Displays:

Completed visits per employee.

---

## Client Growth

Displays:

New clients over time.

---

## Visit Status

Pie Chart

Completed

Scheduled

Cancelled

Missed

---

# 6. Widgets

The Dashboard includes reusable widgets.

Today's Schedule

Recent Activity

Upcoming Visits

Unread Notifications

Announcements

Leave Requests

Quick Statistics

---

# 7. Quick Actions

Create Client

Create Employee

Schedule Visit

Upload Document

Send Announcement

Create Task

Actions displayed depend on permissions.

---

# 8. Filters

Organization

Branch

Date

Employee

Client

Status

---

# 9. Search

The Dashboard includes a global search.

Users can search:

Clients

Employees

Visits

Documents

Messages

Search respects user permissions.

---

# 10. Notifications Panel

Displays:

Unread

Read

Announcements

Schedule Changes

Visit Updates

System Alerts

---

# 11. Recent Activity

Displays latest events.

Examples:

Client Created

Visit Completed

Employee Added

Document Uploaded

Schedule Updated

Leave Approved

---

# 12. Empty States

No Visits Today

No Notifications

No Activity

No Announcements

Every empty state should include:

Illustration

Message

Suggested Action

---

# 13. Loading States

Skeleton KPI Cards

Skeleton Tables

Skeleton Charts

Loading indicators should appear immediately.

---

# 14. Responsive Behaviour

Desktop

Full dashboard.

Tablet

Widgets stacked vertically.

Mobile (MVP)

Read-only dashboard.

---

# 15. Permissions

Super Admin

Complete dashboard.

---

Organization Owner

Organization dashboard.

---

Branch Manager

Branch dashboard.

---

Scheduler

Scheduling dashboard.

---

Caregiver

Personal dashboard only.

---

Finance

Financial dashboard.

---

# 16. Database Tables

Dashboard reads from:

organizations

branches

employees

clients

schedules

visits

notifications

tasks

audit_logs

---

# 17. API Endpoints

GET /dashboard

GET /dashboard/kpis

GET /dashboard/charts

GET /dashboard/activity

GET /dashboard/notifications

GET /dashboard/tasks

GET /dashboard/announcements

---

# 18. Validation Rules

Dashboard loads only authorized data.

All widgets respect organization boundaries.

Data filtered by role.

No widget may expose unauthorized information.

---

# 19. Audit Events

Dashboard Viewed

Widget Opened

Quick Action Executed

Export Performed

---

# 20. Acceptance Criteria

✓ Dashboard loads in under two seconds.

✓ Widgets load independently.

✓ KPI values are accurate.

✓ Charts update automatically.

✓ Role-based visibility functions correctly.

✓ Responsive layout works on desktop and tablet.

✓ Global search returns authorized results only.

---

# Functional Requirements

FR-053 The system shall provide a personalized dashboard for every authenticated user.

FR-054 Dashboard widgets shall display only data authorized for the current user.

FR-055 Quick Actions shall be permission-aware.

FR-056 Dashboard statistics shall update in real time where applicable.

---

# Non-Functional Requirements

NFR-047 Dashboard initial load time shall not exceed two seconds under normal operating conditions.

NFR-048 Widgets shall load independently to prevent one failure from blocking the entire dashboard.

NFR-049 Dashboard shall remain fully responsive on supported devices.

NFR-050 Dashboard queries shall be optimized to minimize database load.

# 9. Development Standards & Implementation Guidelines

---

# 9.1 Development Philosophy

ThuisZorgHub shall be developed as a modular, scalable, and maintainable Software as a Service (SaaS) application.

Every implementation decision should prioritize:

- Simplicity
- Maintainability
- Performance
- Security
- User Experience
- Scalability

No feature should be implemented without a clearly documented business purpose.

---

# 9.2 Development Order

The application shall be developed in the following sequence.

## Sprint 1 — Foundation

- Authentication
- Organizations
- Branches
- Users
- Roles
- Permissions

---

## Sprint 2 — Core Operations

- Employees
- Clients
- Scheduling
- Calendar
- Visits

---

## Sprint 3 — Operations

- Documents
- Notes
- Notifications
- Announcements
- Reports

---

## Sprint 4 — Platform

- Billing
- Subscription
- Settings
- Audit Logs
- Super Admin Portal

---

# 9.3 Coding Standards

All development shall follow these standards:

- TypeScript only
- Strong typing
- No duplicated code
- Reusable components
- Modular architecture
- Clean folder structure
- Descriptive naming conventions
- Consistent formatting
- Comprehensive error handling

---

# 9.4 Folder Structure

```text
frontend/
  app/
  components/
  features/
  hooks/
  lib/
  services/
  types/
  utils/

supabase/
  migrations/
  seed/
  functions/
  policies/

docs/

assets/
```

---

# 9.5 Git Strategy

Main Branch

- production-ready code

Develop Branch

- active development

Feature Branches

- one branch per module

Examples:

feature/client-management

feature/scheduling

feature/dashboard

---

# 9.6 API Standards

Every endpoint shall:

- Validate input
- Check permissions
- Return consistent response formats
- Log significant actions
- Handle errors gracefully

Example response:

```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully."
}
```

---

# 9.7 Database Standards

- UUID primary keys
- Foreign key constraints
- Row Level Security
- Soft deletes where appropriate
- Automatic timestamps
- Indexed search fields

---

# 9.8 UI Standards

Every page shall include:

- Page title
- Breadcrumb
- Search (where applicable)
- Filters
- Loading state
- Empty state
- Error state
- Success feedback

---

# 9.9 Security Standards

- HTTPS only
- Supabase Authentication
- Role-Based Access Control
- Organization-level Row Level Security
- Secure file storage
- Audit logging
- Input validation
- Output sanitization

---

# 9.10 Performance Standards

Target metrics:

- Initial page load: <2 seconds
- Search response: <500ms
- Dashboard: <2 seconds
- API response: <300ms (average)

---

# 9.11 Documentation Standards

Every new module must include:

- Business Purpose
- User Stories
- Database Tables
- API Endpoints
- UI Specification
- Validation Rules
- Permission Matrix
- Test Cases
- Acceptance Criteria

No module may be developed without its specification.

---

# 9.12 Testing Standards

Every module shall undergo:

- Unit Testing
- Integration Testing
- Manual QA
- User Acceptance Testing (UAT)

Critical workflows must be verified before release.

---

# 9.13 Deployment Standards

Production deployments require:

- Successful build
- Database migrations applied
- Environment variables configured
- Smoke testing completed
- Rollback plan available

---

# 9.14 Versioning

The project follows Semantic Versioning.

Examples:

- v1.0.0 — Initial release
- v1.1.0 — New features
- v1.1.1 — Bug fixes
- v2.0.0 — Major release

---

# 9.15 Definition of Done

A feature is considered complete only when:

- Requirements implemented
- Database updated
- APIs completed
- UI implemented
- Permissions enforced
- Audit logging added
- Tests passed
- Documentation updated
- Code reviewed

---

# Final Notes

This Master Software Specification serves as the foundation for all future development of ThuisZorgHub.

Any change to the application architecture, business logic, or major functionality should first be reflected in this document before implementation.

The specification is intended to evolve alongside the product and remain the single source of truth throughout the lifecycle of ThuisZorgHub.
