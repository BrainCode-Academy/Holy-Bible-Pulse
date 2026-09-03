import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load .env files if present
dotenv.config();
dotenv.config({ path: '.env.local' });

/**
 * Script to synchronize AdMob IDs from environment variables into android strings.xml
 */
function syncAndroidAdMob() {
  const stringsPath = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'res', 'values', 'strings.xml');

  if (!fs.existsSync(stringsPath)) {
    console.log('[syncAndroidAdMob] Android strings.xml not found, skipping sync.');
    return;
  }

  let content = fs.readFileSync(stringsPath, 'utf8');

  const appId =
    process.env.VITE_ADMOB_APP_ID ||
    process.env.ADMOB_APP_ID ||
    'ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX';

  const homeBannerId =
    process.env.VITE_ADMOB_HOME_BANNER_ID ||
    process.env.ADMOB_HOME_BANNER_ID ||
    'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX';

  const searchBannerId =
    process.env.VITE_ADMOB_SEARCH_BANNER_ID ||
    process.env.ADMOB_SEARCH_BANNER_ID ||
    'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX';

  const notesBannerId =
    process.env.VITE_ADMOB_NOTES_BANNER_ID ||
    process.env.ADMOB_NOTES_BANNER_ID ||
    'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX';

  content = content.replace(
    /<string name="admob_app_id">.*?<\/string>/,
    `<string name="admob_app_id">${appId}</string>`
  );
  content = content.replace(
    /<string name="admob_home_banner_id">.*?<\/string>/,
    `<string name="admob_home_banner_id">${homeBannerId}</string>`
  );
  content = content.replace(
    /<string name="admob_search_banner_id">.*?<\/string>/,
    `<string name="admob_search_banner_id">${searchBannerId}</string>`
  );
  content = content.replace(
    /<string name="admob_notes_banner_id">.*?<\/string>/,
    `<string name="admob_notes_banner_id">${notesBannerId}</string>`
  );

  fs.writeFileSync(stringsPath, content, 'utf8');
  console.log(`[syncAndroidAdMob] Synchronized AdMob configuration with Android strings.xml (App ID: ${appId})`);
}

syncAndroidAdMob();
