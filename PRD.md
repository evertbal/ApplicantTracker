PRD.md

# Applicant Tracking System (ATS) — Product Requirements Document

## 📌 Overzicht

Dit document beschrijft de functionele en technische specificaties van het ATS (Applicant Tracking System), gebouwd in Replit. De applicatie is bedoeld voor gebruik door Nederlandse uitzendbureaus, met name in de groenvoorziening. Dit document is afgestemd op de actuele implementatie en bevat verschillen met eerdere versies van het PRD.

---

## 🧱 Tech Stack

| Component        | Technologie                    |
|------------------|--------------------------------|
| Frontend         | React 18, TypeScript           |
| Styling          | Tailwind CSS                   |
| Routing          | Wouter                         |
| State Mgmt       | TanStack Query                 |
| Backend          | Node.js (Express.js)           |
| Database         | PostgreSQL (via Neon)          |
| ORM              | Drizzle ORM                    |
| Auth             | JWT + Email/Password, Replit Auth |
| Infra            | Replit runtime                 |

---

## 👥 Rollen en Authenticatie

| Rol       | Rechten                                                                 |
|-----------|-------------------------------------------------------------------------|
| Viewer    | Alleen-lezen toegang                                                    |
| Recruiter | Kan kandidaten, trajecten, notities en documenten toevoegen/bewerken   |
| Admin     | Volledige toegang + user management + dashboard                         |

### Authenticatiemechanisme

- JWT-authenticatie via e-mail/wachtwoord voor interne gebruikers
- Replit OAuth login voor extern gebruik (beperkt tot viewer)
- `requireRole()` middleware voor routes
- Sessiebeheer op basis van tokens

---

## 📂 Entiteiten & Schema

### 🔹 Kandidaat

| Veld                  | Type       |
|------------------------|------------|
| id                    | SERIAL (PK)|
| name                  | TEXT       |
| email                 | TEXT       |
| phone                 | TEXT       |
| region                | TEXT       |
| description           | TEXT       |
| drivingLicenses       | TEXT[]     |
| drivingLicenseNotes   | TEXT       |
| status                | TEXT       |
| marketing             | TEXT       |
| phase                 | TEXT       |
| dateAdded             | TIMESTAMP  |

---

### 🔹 Traject (Trajectory)

| Veld        | Type       |
|-------------|------------|
| id          | SERIAL (PK)|
| candidateId | INTEGER FK |
| clientId    | INTEGER FK |
| startDate   | DATE       |
| hourlyRate  | NUMERIC    |
| status      | TEXT       |

> Geen `einddatum` of `opmerking` veld in realiteit.

---

### 🔹 Opdrachtgever (Client)

| Veld     | Type        |
|----------|-------------|
| id       | SERIAL (PK) |
| name     | TEXT        |
| email    | TEXT        |
| phone    | TEXT        |
| address  | TEXT        |

#### 🧭 Client Locations

| Veld     | Type        |
|----------|-------------|
| id       | SERIAL (PK) |
| clientId | INTEGER FK  |
| name     | TEXT        |
| address  | TEXT        |

#### 👤 Client Contacts

| Veld     | Type        |
|----------|-------------|
| id       | SERIAL (PK) |
| clientId | INTEGER FK  |
| name     | TEXT        |
| email    | TEXT        |
| phone    | TEXT        |

---

### 📝 Notitie (Note)

| Veld       | Type       |
|------------|------------|
| id         | SERIAL (PK)|
| entityId   | TEXT       |
| entityType | TEXT       | // bv. "candidate"
| inhoud     | TEXT       |
| auteur     | TEXT       |
| datum      | TIMESTAMP  |

> Flexibel gekoppeld aan meerdere entiteitstypes via `entityType`

---

### 📄 Document

| Veld        | Type        |
|-------------|-------------|
| id          | SERIAL (PK) |
| candidateId | INTEGER FK  |
| type        | TEXT        |
| filename    | TEXT        |
| uploadDate  | TIMESTAMP   |
| url         | TEXT        |

> ❗ Upload werkt nog niet — alleen weergave van documenten is actief.

---

### 🔐 Admin Users

| Veld     | Type        |
|----------|-------------|
| id       | UUID (PK)   |
| email    | TEXT        |
| password | TEXT (hash) |
| role     | TEXT        |

---

### 🧾 Audit Log

| Veld        | Type       |
|-------------|------------|
| id          | SERIAL (PK)|
| action      | TEXT       |
| entityType  | TEXT       |
| entityId    | TEXT       |
| userId      | TEXT       |
| timestamp   | TIMESTAMP  |
| changes     | JSON       |

---

## 🎛️ Functionaliteiten

### 🔎 Filtering en Zoeken

- Filters op kandidaten: regio, status, rijbewijs
- Collapsible filtermenu
- Real-time search (client-side + debounced)
- Sorting per kolom
- Multiselect rijbewijs (met genormaliseerde varianten)

### 🧑‍💻 CRUD Functionaliteit

| Entiteit       | View | Create | Edit | Delete | Detail Modal |
|----------------|------|--------|------|--------|---------------|
| Kandidaat      | ✅   | ✅     | ✅   | ✅     | ✅            |
| Traject        | ✅   | ✅     | ✅   | ✅     | ✅            |
| Opdrachtgever  | ✅   | ✅     | ✅   | ✅     | ✅            |
| Notities       | ✅   | ✅     | ✖️   | ✖️     | ✅            |
| Documenten     | ✅   | ❌     | ✖️   | ✖️     | ✅            |

---

## 🔧 Geavanceerde Features

- ✅ Excel Import & CSV Export (rijbewijs-mapping incl.)
- ✅ Toast notifications
- ✅ Context menus (rechterklik)
- ✅ Audit logging
- ✅ Soft deletes
- ✅ Role-based access control
- ✅ Responsive mobile-first design
- ✅ Sidebar navigatie
- ✅ Modal forms voor alle entiteiten
- ✅ State sync via TanStack Query (optimistic updates)

---

## 🧪 Testing & QA

- **Jest** voor unit testing
- **React Testing Library** voor UI tests
- Smoke tests per view
- ✅ Login flows getest
- ✅ CRUD functionaliteit getest
- ❓ Supertest nog onbekend

---

## ⚙️ Replit / Deployment

| Onderdeel         | Status  |
|-------------------|---------|
| CI/CD pipeline    | ❌ Niet aanwezig |
| Logging & health  | ❌ Nog niet geïmplementeerd |
| Environment vars  | ✅ Correct ingericht |
| DB migratiebeheer | ✅ Drizzle ORM scripts |
| Backup/restore    | ✅ Handmatig via Neon mogelijk |

---

## 📌 To-do's & Aanbevelingen

- [ ] Uploadfunctie documenten implementeren
- [ ] Health checks op backend endpoints
- [ ] Logging voor fouten en waarschuwingen
- [ ] Optioneel: CI/CD configureren via GitHub Replit integratie
- [ ] API-documentatie toevoegen (OpenAPI / Swagger)
- [ ] README.md + Setup-instructies

---

## 📎 Versiebeheer & Onderhoud

- PRD-versie: `v2.0`
- Laatste update: 2025-06-27
- Onderhoud door: Evert Bal
- Locatie in Replit: `/PRD.md`

---