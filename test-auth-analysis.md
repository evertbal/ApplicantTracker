# Authenticatie Analyse - ATS Systeem

## Geïdentificeerde Problemen:

### 1. Oorspronkelijke 500 Fouten
- **Oorzaak**: Audit log functie probeerde toegang tot `req.user.claims.sub` zonder proper fallback
- **Impact**: Kandidaat toevoegen/bijwerken faalde met 500 error
- **Status**: ✅ OPGELOST - Alle audit logs nu veilig met fallback naar `req.user?.id || 'unknown'`

### 2. Inconsistente Authenticatie Middleware
- **Probleem**: Mix van `authenticateUser` en `authenticateAny` across verschillende routes
- **Impact**: Sommige operaties werkten alleen met specifieke auth methoden
- **Routes gerepareerd**:
  - Candidates: Alle routes nu `authenticateAny`
  - Clients: Alle routes nu `authenticateAny` 
  - Trajectories: Alle routes nu `authenticateAny`
  - Notes: Alle routes nu `authenticateAny`
  - Documents: Al consistent

### 3. Dubbel Authenticatie Systeem Complexiteit
- **Replit Auth**: Voor externe gebruikers (@doenersingroen.nl)
- **Email/Password**: Voor interne gebruikers met admin approval
- **Admin JWT**: Voor admin functionaliteiten

## Verbeterde authenticateAny Middleware:
- Ondersteunt Admin JWT tokens
- Ondersteunt session-based auth
- Ondersteunt Replit authentication
- Graceful fallbacks tussen methoden

## Verificatie Stappen:
1. Test kandidaat CRUD operaties
2. Test client CRUD operaties  
3. Test trajectory CRUD operaties
4. Test notes/documents functionaliteit
5. Test beide authenticatie methoden