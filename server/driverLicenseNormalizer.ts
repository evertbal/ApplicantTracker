/**
 * Rijbewijs Normalisatie Utility voor Nederlandse ATS
 * 
 * Normaliseert ruwe rijbewijsinvoer naar gestructureerde Nederlandse rijbewijscategorieën
 */

// Officiële Nederlandse rijbewijscategorieën
export const VALID_LICENSE_CATEGORIES = [
  'A',   // motorfiets
  'AM',  // bromfiets, snorfiets, speed-pedelec
  'B',   // personenauto
  'BE',  // personenauto met aanhanger
  'C',   // vrachtwagen
  'CE',  // vrachtwagen met aanhanger
  'D',   // autobus
  'DE',  // autobus met aanhanger
  'T'    // landbouwvoertuigen
] as const;

export type LicenseCategory = typeof VALID_LICENSE_CATEGORIES[number];

export interface NormalizedLicenseResult {
  licenses: LicenseCategory[];
  heeft_geen_geldig_rijbewijs: boolean;
  original_input: string;
  notes?: string;
}

/**
 * Normaliseert ruwe rijbewijsinvoer naar gestructureerde gegevens
 */
export function normalizeDrivingLicense(input: string | null | undefined): NormalizedLicenseResult {
  const result: NormalizedLicenseResult = {
    licenses: [],
    heeft_geen_geldig_rijbewijs: false,
    original_input: input || ''
  };

  // Lege of undefined invoer
  if (!input || typeof input !== 'string') {
    result.heeft_geen_geldig_rijbewijs = true;
    return result;
  }

  const cleanInput = input.trim().toLowerCase();

  // Check voor "geen rijbewijs" indicatoren
  const noLicenseIndicators = [
    'geen', 'geen rijbewijs', 'nee', 'niet', 'nog niet', 'nog geen',
    'afgepakt', 'ingetrokken', 'verlopen', 'kwijt', 'gestolen',
    'moet nog', 'bezig met', 'aan het halen', 'nog bezig',
    'in behandeling', 'nog niet behaald', 'heeft hij niet',
    'heeft ze niet', 'heeft geen', 'n.v.t.', 'nvt', 'na',
    'onbekend', 'weet niet', 'niet bekend'
  ];

  for (const indicator of noLicenseIndicators) {
    if (cleanInput.includes(indicator)) {
      result.heeft_geen_geldig_rijbewijs = true;
      result.notes = `Gedetecteerd: ${indicator}`;
      return result;
    }
  }

  // Extraheer rijbewijscategorieën
  const extractedLicenses = extractLicenseCategories(cleanInput);
  
  if (extractedLicenses.length === 0) {
    // Als er geen geldige categorieën gevonden zijn, maar de invoer niet expliciet "geen" aangeeft
    result.heeft_geen_geldig_rijbewijs = true;
    result.notes = 'Geen geldige rijbewijscategorieën gedetecteerd';
  } else {
    result.licenses = extractedLicenses;
  }

  return result;
}

/**
 * Extraheert rijbewijscategorieën uit de invoertekst
 */
function extractLicenseCategories(input: string): LicenseCategory[] {
  const found = new Set<LicenseCategory>();

  // Normaliseer de invoer: verwijder leestekens en splits op verschillende delimiters
  const normalized = input
    .replace(/[^\w\s]/g, ' ') // Vervang leestekens door spaties
    .replace(/\s+/g, ' ')     // Meerdere spaties naar enkele spatie
    .trim();

  // Split op verschillende mogelijke delimiters
  const parts = normalized.split(/[\s,;+&\/\\|]+/);

  for (const part of parts) {
    const cleanPart = part.trim().toUpperCase();
    
    // Directe mapping van categorieën
    if (VALID_LICENSE_CATEGORIES.includes(cleanPart as LicenseCategory)) {
      found.add(cleanPart as LicenseCategory);
      continue;
    }

    // Speciale gevallen en varianten
    switch (cleanPart) {
      case 'AUTO':
      case 'PERSONENAUTO':
      case 'PKW':
      case 'CAR':
        found.add('B');
        break;
        
      case 'MOTOR':
      case 'MOTORFIETS':
      case 'MOTORCYCLE':
        found.add('A');
        break;
        
      case 'BROMFIETS':
      case 'BROMSCOOTER':
      case 'SNORFIETS':
      case 'SCOOTER':
        found.add('AM');
        break;
        
      case 'VRACHTWAGEN':
      case 'TRUCK':
      case 'VRACHTAUTO':
        found.add('C');
        break;
        
      case 'BUS':
      case 'AUTOBUS':
      case 'TOURINGCAR':
        found.add('D');
        break;
        
      case 'TRACTOR':
      case 'LANDBOUW':
      case 'LANDBOUWVOERTUIG':
        found.add('T');
        break;

      // Combinaties met aanhanger
      case 'BE':
      case 'B+E':
      case 'B_E':
      case 'BAANHANGER':
      case 'AUTOAANHANGER':
        found.add('B');
        found.add('BE');
        break;
        
      case 'CE':
      case 'C+E':
      case 'C_E':
      case 'VRACHTAANHANGER':
        found.add('C');
        found.add('CE');
        break;
        
      case 'DE':
      case 'D+E':
      case 'D_E':
      case 'BUSAANHANGER':
        found.add('D');
        found.add('DE');
        break;
    }

    // Zoek naar patronen zoals "CATEGORIE A", "RIJ B", etc.
    const categoryMatch = cleanPart.match(/(?:CATEGORIE|CAT|RIJBEWIJS|RIJ)\s*([ABCDET]+)/);
    if (categoryMatch) {
      const category = categoryMatch[1];
      if (VALID_LICENSE_CATEGORIES.includes(category as LicenseCategory)) {
        found.add(category as LicenseCategory);
      }
    }
  }

  // Sorteer de gevonden categorieën volgens standaard volgorde
  return VALID_LICENSE_CATEGORIES.filter(cat => found.has(cat));
}

/**
 * Batch normalisatie voor meerdere invoerwaarden
 */
export function batchNormalizeDrivingLicenses(inputs: (string | null | undefined)[]): NormalizedLicenseResult[] {
  return inputs.map(input => normalizeDrivingLicense(input));
}

/**
 * Validatie functie voor bestaande gegevens
 */
export function validateExistingLicenses(licenses: string[]): {
  valid: LicenseCategory[];
  invalid: string[];
} {
  const valid: LicenseCategory[] = [];
  const invalid: string[] = [];

  for (const license of licenses) {
    const normalized = license.trim().toUpperCase();
    if (VALID_LICENSE_CATEGORIES.includes(normalized as LicenseCategory)) {
      valid.push(normalized as LicenseCategory);
    } else {
      invalid.push(license);
    }
  }

  return { valid, invalid };
}

/**
 * Utility functies voor API responses
 */
export function formatLicensesForDisplay(licenses: LicenseCategory[]): string {
  if (licenses.length === 0) return 'Geen geldig rijbewijs';
  return licenses.join(', ');
}

export function getLicenseDescription(license: LicenseCategory): string {
  const descriptions: Record<LicenseCategory, string> = {
    'A': 'Motorfiets',
    'AM': 'Bromfiets/Snorfiets',
    'B': 'Personenauto',
    'BE': 'Auto met aanhanger',
    'C': 'Vrachtwagen',
    'CE': 'Vrachtwagen met aanhanger', 
    'D': 'Autobus',
    'DE': 'Autobus met aanhanger',
    'T': 'Landbouwvoertuigen'
  };
  
  return descriptions[license] || license;
}