/**
 * ============================================================================
 * HOLY BIBLE+ — GOOGLE ADMOB CENTRALIZED CONFIGURATION
 * ============================================================================
 *
 * This configuration manages Google AdMob IDs for Holy Bible+.
 *
 * CONFIGURATION LOCATIONS:
 * 1. Web / Hybrid Environment Variables (Vite):
 *    - VITE_ADMOB_APP_ID: AdMob Application ID (e.g. ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX)
 *    - VITE_ADMOB_HOME_BANNER_ID: Home Screen Banner Ad Unit ID
 *    - VITE_ADMOB_SEARCH_BANNER_ID: Search Screen Banner Ad Unit ID
 *    - VITE_ADMOB_NOTES_BANNER_ID: Saved Sanctuary / Notes Screen Banner Ad Unit ID
 *    - VITE_ADMOB_TEST_MODE: Set to 'true' to serve official Google test ads
 *
 * 2. Native Android Configuration (APK / Gradle):
 *    - Application ID: android/app/src/main/res/values/strings.xml -> <string name="admob_app_id">
 *    - Manifest Reference: android/app/src/main/AndroidManifest.xml -> com.google.android.gms.ads.APPLICATION_ID
 *
 * PLACEMENT POLICY:
 * - ALLOWED: Home, Search, Saved Sanctuary / Notes
 * - STRICTLY FORBIDDEN: Bible scripture reader, between verses, inside chapters,
 *   audio Bible/player, reading plans, prayer screen, sermon outlines.
 */

// Official Google AdMob Sample / Test Ad Unit IDs
export const GOOGLE_TEST_ADMOB_IDS = {
  APP_ID: 'ca-app-pub-3940256099942544~3347511713',
  BANNER: 'ca-app-pub-3940256099942544/6300978111',
  INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
  REWARDED: 'ca-app-pub-3940256099942544/5224354917',
} as const;

// Default Placeholder Template IDs (Replace with your actual AdMob IDs in .env or strings.xml)
export const ADMOB_PLACEHOLDER_IDS = {
  APP_ID: 'ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX',
  HOME_BANNER_ID: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
  SEARCH_BANNER_ID: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
  NOTES_BANNER_ID: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
} as const;

export interface AdMobConfig {
  appId: string;
  homeBannerId: string;
  searchBannerId: string;
  notesBannerId: string;
  isTestMode: boolean;
  rawConfigured: {
    appId: string;
    homeBannerId: string;
    searchBannerId: string;
    notesBannerId: string;
  };
}

/**
 * Resolves test mode status.
 * Returns true if VITE_ADMOB_TEST_MODE is 'true', or if running in Vite DEV mode and not explicitly disabled.
 */
function resolveTestMode(): boolean {
  const envFlag = import.meta.env.VITE_ADMOB_TEST_MODE;
  if (typeof envFlag === 'string') {
    return envFlag.toLowerCase() === 'true' || envFlag === '1';
  }
  if (typeof envFlag === 'boolean') {
    return envFlag;
  }
  return import.meta.env.DEV;
}

const isTestActive = resolveTestMode();

const rawAppId = (import.meta.env.VITE_ADMOB_APP_ID as string) || ADMOB_PLACEHOLDER_IDS.APP_ID;
const rawHomeBannerId = (import.meta.env.VITE_ADMOB_HOME_BANNER_ID as string) || ADMOB_PLACEHOLDER_IDS.HOME_BANNER_ID;
const rawSearchBannerId = (import.meta.env.VITE_ADMOB_SEARCH_BANNER_ID as string) || ADMOB_PLACEHOLDER_IDS.SEARCH_BANNER_ID;
const rawNotesBannerId = (import.meta.env.VITE_ADMOB_NOTES_BANNER_ID as string) || ADMOB_PLACEHOLDER_IDS.NOTES_BANNER_ID;

/**
 * Resolved AdMob Configuration
 * Reads from Vite environment variables (VITE_ADMOB_*) with fallback to placeholder IDs.
 */
export const ADMOB_CONFIG: AdMobConfig = {
  appId: isTestActive ? GOOGLE_TEST_ADMOB_IDS.APP_ID : rawAppId,
  homeBannerId: isTestActive ? GOOGLE_TEST_ADMOB_IDS.BANNER : rawHomeBannerId,
  searchBannerId: isTestActive ? GOOGLE_TEST_ADMOB_IDS.BANNER : rawSearchBannerId,
  notesBannerId: isTestActive ? GOOGLE_TEST_ADMOB_IDS.BANNER : rawNotesBannerId,
  isTestMode: isTestActive,
  rawConfigured: {
    appId: rawAppId,
    homeBannerId: rawHomeBannerId,
    searchBannerId: rawSearchBannerId,
    notesBannerId: rawNotesBannerId,
  },
};

export type AllowedAdPlacement = 'home' | 'search' | 'saved';

/**
 * Get configured Ad Unit ID for a specific placement.
 * Returns official test ID if in development or test mode.
 */
export function getBannerAdUnitId(placement: AllowedAdPlacement): string {
  if (ADMOB_CONFIG.isTestMode) {
    return GOOGLE_TEST_ADMOB_IDS.BANNER;
  }

  switch (placement) {
    case 'home':
      return ADMOB_CONFIG.homeBannerId;
    case 'search':
      return ADMOB_CONFIG.searchBannerId;
    case 'saved':
      return ADMOB_CONFIG.notesBannerId;
    default:
      return GOOGLE_TEST_ADMOB_IDS.BANNER;
  }
}

/**
 * Get AdMob Application ID (test ID if in test mode, else configured ID)
 */
export function getAdMobAppId(): string {
  if (ADMOB_CONFIG.isTestMode) {
    return GOOGLE_TEST_ADMOB_IDS.APP_ID;
  }
  return ADMOB_CONFIG.appId;
}
