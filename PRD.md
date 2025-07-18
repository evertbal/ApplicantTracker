
# Applicant Tracking System (ATS) — Product Requirements Document

## Doel van de Applicatie

Dit ATS ondersteunt Nederlandse uitzendbureaus in de groenvoorziening bij het beheren van kandidaten, trajecten, opdrachtgevers, notities en documenten. De app is gebouwd in Replit met de volgende stack:

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js met Express
- **Database**: PostgreSQL via Neon
- **ORM**: Drizzle ORM
- **Authenticatie**: JWT + Replit Auth + Session-based
- **Data Management**: TanStack Query
- **Routing**: Wouter
- **UI Components**: Radix UI + shadcn/ui

---

## Gebruikersrollen

| Rol        | Rechten                                                  |
|------------|-----------------------------------------------------------|
| Admin      | Volledige toegang + gebruikersbeheer + audit logs        |
| Recruiter  | Toevoegen/bewerken van kandidaten, trajecten, notities   |
| Viewer     | Alleen lezen, geen bewerkrechten                         |

---

## Technische Architectuur

### Database Schema

#### Kandidaten (candidates)
| Veld                  | Type      | Beschrijving                    |
|-----------------------|-----------|---------------------------------|
| id                    | SERIAL    | Primary key                     |
| name                  | TEXT      | Volledige naam                  |
| email                 | TEXT      | E-mailadres                     |
| phone                 | TEXT      | Telefoonnummer                  |
| region                | TEXT      | Regio/woonplaats               |
| description           | TEXT      | Beroep/functieomschrijving     |
| drivingLicenses       | TEXT[]    | Array van rijbewijzen          |
| drivingLicenseNotes   | TEXT      | Notities bij rijbewijs         |
| status                | TEXT      | Status van kandidaat           |
| marketing             | TEXT      | Marketing gerelateerde info    |
| phase                 | TEXT      | Fase in het proces             |
| dateAdded             | TIMESTAMP | Registratiedatum               |

#### Trajecten (trajectories)
| Veld                  | Type      | Beschrijving                    |
|-----------------------|-----------|---------------------------------|
| id                    | SERIAL    | Primary key                     |
| candidateId           | INTEGER   | Foreign key naar candidates    |
| clientId              | INTEGER   | Foreign key naar clients       |
| hourlyRate            | NUMERIC   | Uurtarief                      |
| status                | TEXT      | Status van traject             |
| dateAdded             | TIMESTAMP | Startdatum                     |

#### Opdrachtgevers (clients)
| Veld                  | Type      | Beschrijving                    |
|-----------------------|-----------|---------------------------------|
| id                    | SERIAL    | Primary key                     |
| name                  | TEXT      | Bedrijfsnaam                   |
| contactPerson         | TEXT      | Contactpersoon                 |
| email                 | TEXT      | E-mailadres                    |
| phone                 | TEXT      | Telefoonnummer                 |
| address               | TEXT      | Adres                          |
| dateAdded             | TIMESTAMP | Registratiedatum               |

#### Client Locaties (clientLocations)
| Veld                  | Type      | Beschrijving                    |
|-----------------------|-----------|---------------------------------|
| id                    | SERIAL    | Primary key                     |
| clientId              | INTEGER   | Foreign key naar clients       |
| name                  | TEXT      | Locatienaam                    |
| address               | TEXT      | Adres van locatie              |

#### Client Contacten (clientContacts)
| Veld                  | Type      | Beschrijving                    |
|-----------------------|-----------|---------------------------------|
| id                    | SERIAL    | Primary key                     |
| clientId              | INTEGER   | Foreign key naar clients       |
| name                  | TEXT      | Naam contactpersoon            |
| email                 | TEXT      | E-mailadres                    |
| phone                 | TEXT      | Telefoonnummer                 |

#### Notities (notes)
| Veld                  | Type      | Beschrijving                    |
|-----------------------|-----------|---------------------------------|
| id                    | SERIAL    | Primary key                     |
| entityType            | TEXT      | Type entiteit (candidate/client/trajectory) |
| entityId              | INTEGER   | ID van gekoppelde entiteit     |
| content               | TEXT      | Inhoud van notitie             |
| authorId              | TEXT      | ID van auteur                  |
| dateAdded             | TIMESTAMP | Aanmaakdatum                   |

#### Documenten (documents)
| Veld                  | Type      | Beschrijving                    |
|-----------------------|-----------|---------------------------------|
| id                    | SERIAL    | Primary key                     |
| entityType            | TEXT      | Type entiteit                  |
| entityId              | INTEGER   | ID van gekoppelde entiteit     |
| filename              | TEXT      | Bestandsnaam                   |
| url                   | TEXT      | URL naar document              |
| uploadedBy            | TEXT      | ID van uploader                |
| dateAdded             | TIMESTAMP | Upload datum                   |

#### Admin Gebruikers (adminUsers)
| Veld                  | Type      | Beschrijving                    |
|-----------------------|-----------|---------------------------------|
| id                    | UUID      | Primary key                     |
| email                 | TEXT      | E-mailadres                    |
| passwordHash          | TEXT      | Gehashed wachtwoord            |
| role                  | TEXT      | Gebruikersrol                  |
| dateAdded             | TIMESTAMP | Registratiedatum               |

#### Audit Log (auditLog)
| Veld                  | Type      | Beschrijving                    |
|-----------------------|-----------|---------------------------------|
| id                    | SERIAL    | Primary key                     |
| action                | TEXT      | Uitgevoerde actie              |
| entityType            | TEXT      | Type entiteit                  |
| entityId              | TEXT      | ID van entiteit                |
| userId                | TEXT      | ID van gebruiker               |
| timestamp             | TIMESTAMP | Tijdstip van actie             |
| changes               | JSON      | Details van wijzigingen        |

---

## Authenticatie & Autorisatie

### Authenticatie Flows
1. **Replit Auth**: Voor reguliere gebruikers via Replit platform
2. **Admin JWT**: Voor admin gebruikers met email/password
3. **Session Management**: Express-session voor state management

### Middleware
- `authenticateAny`: Accepteert beide auth types
- `authenticateAdmin`: Alleen voor admin gebruikers
- `requireRole()`: Rolgebaseerde toegangscontrole

---

## Functionaliteiten

### Core Features

#### Kandidatenbeheer
- ✅ CRUD operaties voor kandidaten
- ✅ Geavanceerd filtering (naam, email, telefoon, regio, status, fase)
- ✅ Excel import met automatische rijbewijs normalisatie
- ✅ CSV export functionaliteit
- ✅ Responsive design voor mobile/desktop
- ✅ Real-time zoekfunctionaliteit

#### Trajectbeheer
- ✅ Koppeling kandidaten aan opdrachtgevers
- ✅ Uurtarief beheer
- ✅ Status tracking
- ✅ Filtering op client, kandidaat, status

#### Opdrachtgeverbeheer
- ✅ Client management met locaties en contactpersonen
- ✅ Uitgebreide contactinformatie
- ✅ Adresbeheer per locatie

#### Notities & Documenten
- ✅ Notities per entiteit (kandidaat, client, traject)
- ✅ Document upload en beheer
- ✅ Audit trail voor alle wijzigingen

### Advanced Features

#### Data Import/Export
- ✅ Excel bestand import met data validatie
- ✅ Rijbewijs normalisatie algoritme
- ✅ CSV export voor alle entiteiten
- ✅ Error handling en feedback

#### UI/UX
- ✅ Responsive design (mobile-first)
- ✅ Collapsible filtering system
- ✅ Context menus voor acties
- ✅ Toast notifications
- ✅ Loading states en error handling
- ✅ Keyboard navigation support

#### Audit & Security
- ✅ Volledige audit logging
- ✅ Role-based access control
- ✅ Data validatie op alle levels
- ✅ Secure password hashing (bcrypt)

---

## API Endpoints

### Authenticatie
- `POST /api/auth/login` - Admin login
- `GET /api/auth/user` - Huidige admin gebruiker
- `GET /api/replit-user` - Replit gebruiker info

### Kandidaten
- `GET /api/candidates` - Alle kandidaten met filtering
- `POST /api/candidates` - Nieuwe kandidaat
- `PUT /api/candidates/:id` - Update kandidaat
- `DELETE /api/candidates/:id` - Verwijder kandidaat
- `POST /api/candidates/import` - Excel import

### Trajecten
- `GET /api/trajectories` - Alle trajecten
- `POST /api/trajectories` - Nieuw traject
- `PUT /api/trajectories/:id` - Update traject
- `DELETE /api/trajectories/:id` - Verwijder traject

### Clients
- `GET /api/clients` - Alle clients
- `POST /api/clients` - Nieuwe client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Verwijder client

### Notities & Documenten
- `GET /api/notes/:entityType/:entityId` - Notities per entiteit
- `POST /api/notes` - Nieuwe notitie
- `GET /api/documents/:entityType/:entityId` - Documenten per entiteit
- `POST /api/documents` - Upload document

### Admin
- `GET /api/admin/pending-users` - Pending gebruikers
- `POST /api/admin/approve-user/:id` - Goedkeuren gebruiker

---

## Deployment

### Replit Configuration
- **Runtime**: Node.js 20
- **Database**: PostgreSQL 16
- **Build Command**: `npm run build`
- **Start Command**: `npm run start`
- **Dev Command**: `npm run dev`

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `SESSION_SECRET` - Session encryption secret
- `NODE_ENV` - Environment (development/production)

### Dependencies
- **Frontend**: React 18, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Express.js, Drizzle ORM, JWT, bcryptjs
- **Database**: PostgreSQL via Neon
- **Dev Tools**: Vite, ESBuild, Jest voor testing

---

## Toekomstige Uitbreidingen

### Geplande Features
- [ ] Email notifications voor trajectwijzigingen
- [ ] Calendar integratie voor afspraken
- [ ] Rapportage dashboard met metrics
- [ ] Bulk operaties voor kandidaten
- [ ] Advanced search met AI suggesties
- [ ] Mobile app (React Native)

### Technische Verbeteringen
- [ ] Redis caching layer
- [ ] Background job processing
- [ ] API rate limiting
- [ ] Advanced error monitoring
- [ ] Performance metrics dashboard

---

## Onderhoud & Support

### Monitoring
- Server logs via Express middleware
- Error tracking en reporting
- Performance monitoring
- Database query optimization

### Backup & Recovery
- Dagelijkse database backups via Neon
- Code backup via Git/Replit
- Environment variable backup
- Disaster recovery procedures

---

*Document versie: 2.0*  
*Laatste update: December 2024*  
*Status: Productie*
