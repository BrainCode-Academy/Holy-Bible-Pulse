import fs from 'fs';
import path from 'path';

export interface FirebaseConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  firestoreDatabaseId: string;
  storageBucket: string;
  messagingSenderId: string;
}

/**
 * Production-Grade Google Cloud Firestore REST Client
 * Communicates directly with the configured Firestore database instance.
 * Supports:
 * 1. Server-side environment variables (FIRESTORE_* or FIREBASE_*)
 * 2. FIREBASE_CONFIG JSON env var
 * 3. firebase-applet-config.json local file fallback
 */
export class FirestoreClient {
  private config: FirebaseConfig;
  private baseUrl: string;
  private isAvailable: boolean = true;
  private hasWarnedUnavailable: boolean = false;

  constructor() {
    this.config = this.loadConfig();
    const dbId = this.config.firestoreDatabaseId || '(default)';
    this.baseUrl = `https://firestore.googleapis.com/v1/projects/${this.config.projectId}/databases/${dbId}/documents`;
  }

  private handleUnavailable(status: number, message: string) {
    if (status === 404 || status === 401 || status === 403) {
      this.isAvailable = false;
      if (!this.hasWarnedUnavailable) {
        this.hasWarnedUnavailable = true;
        console.log(`[Firestore] Remote database (${this.config.firestoreDatabaseId || '(default)'}) status ${status}. Operating with local persistent store.`);
      }
    }
  }

  private loadConfig(): FirebaseConfig {
    // 1. Check for individual server environment variables (Preferred in Vercel & Production)
    const projectId =
      process.env.FIRESTORE_PROJECT_ID ||
      process.env.FIREBASE_PROJECT_ID ||
      process.env.PROJECT_ID;

    const apiKey =
      process.env.FIRESTORE_API_KEY ||
      process.env.FIREBASE_API_KEY;

    if (projectId && apiKey) {
      return {
        projectId,
        appId: process.env.FIRESTORE_APP_ID || process.env.FIREBASE_APP_ID || '',
        apiKey,
        authDomain:
          process.env.FIRESTORE_AUTH_DOMAIN ||
          process.env.FIREBASE_AUTH_DOMAIN ||
          `${projectId}.firebaseapp.com`,
        firestoreDatabaseId:
          process.env.FIRESTORE_DATABASE_ID ||
          process.env.FIREBASE_DATABASE_ID ||
          '(default)',
        storageBucket:
          process.env.FIRESTORE_STORAGE_BUCKET ||
          process.env.FIREBASE_STORAGE_BUCKET ||
          `${projectId}.firebasestorage.app`,
        messagingSenderId:
          process.env.FIRESTORE_MESSAGING_SENDER_ID ||
          process.env.FIREBASE_MESSAGING_SENDER_ID ||
          '',
      };
    }

    // 2. Check for single FIREBASE_CONFIG JSON environment variable string
    if (process.env.FIREBASE_CONFIG) {
      try {
        const parsed = JSON.parse(process.env.FIREBASE_CONFIG);
        if (parsed.projectId && parsed.apiKey) {
          return {
            projectId: parsed.projectId,
            appId: parsed.appId || '',
            apiKey: parsed.apiKey,
            authDomain: parsed.authDomain || `${parsed.projectId}.firebaseapp.com`,
            firestoreDatabaseId: parsed.firestoreDatabaseId || parsed.databaseId || '(default)',
            storageBucket: parsed.storageBucket || `${parsed.projectId}.firebasestorage.app`,
            messagingSenderId: parsed.messagingSenderId || '',
          };
        }
      } catch (e) {
        console.warn('[Firestore] Failed to parse FIREBASE_CONFIG env var:', e);
      }
    }

    // 3. Fall back to local firebase-applet-config.json if present
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        return {
          projectId: data.projectId || 'holy-bible-plus-60534',
          appId: data.appId || '',
          apiKey: data.apiKey || '',
          authDomain: data.authDomain || `${data.projectId}.firebaseapp.com`,
          firestoreDatabaseId: data.firestoreDatabaseId || '(default)',
          storageBucket: data.storageBucket || `${data.projectId}.firebasestorage.app`,
          messagingSenderId: data.messagingSenderId || '',
        };
      } catch (err) {
        console.warn('[Firestore] Failed to read firebase-applet-config.json:', err);
      }
    }

    // Default project fallback
    return {
      projectId: 'holy-bible-plus-60534',
      appId: '1:453373691889:web:27545762e33ef53bbae650',
      apiKey: 'AIzaSyAOjFNqFIUbR3JfgLSBJ877JD0a9g_ztnw',
      authDomain: 'holy-bible-plus-60534.firebaseapp.com',
      firestoreDatabaseId: '(default)',
      storageBucket: 'holy-bible-plus-60534.firebasestorage.app',
      messagingSenderId: '453373691889',
    };
  }

  public getProjectId(): string {
    return this.config.projectId;
  }

  public getDatabaseId(): string {
    return this.config.firestoreDatabaseId || '(default)';
  }

  public getStorageBucket(): string {
    return this.config.storageBucket;
  }

  public getApiKey(): string {
    return this.config.apiKey;
  }

  /**
   * Convert JavaScript Object to Firestore Field Structure
   */
  public toFirestoreValue(val: any): any {
    if (val === null || val === undefined) {
      return { nullValue: null };
    }
    if (typeof val === 'boolean') {
      return { booleanValue: val };
    }
    if (typeof val === 'number') {
      return Number.isInteger(val) ? { integerValue: val.toString() } : { doubleValue: val };
    }
    if (typeof val === 'string') {
      return { stringValue: val };
    }
    if (Array.isArray(val)) {
      return {
        arrayValue: {
          values: val.map(item => this.toFirestoreValue(item)),
        },
      };
    }
    if (typeof val === 'object') {
      const fields: Record<string, any> = {};
      for (const [k, v] of Object.entries(val)) {
        if (v !== undefined) {
          fields[k] = this.toFirestoreValue(v);
        }
      }
      return { mapValue: { fields } };
    }
    return { stringValue: String(val) };
  }

  /**
   * Convert Firestore Document Field Structure to Plain JS Object
   */
  public fromFirestoreValue(val: any): any {
    if (!val || typeof val !== 'object') return null;

    if ('nullValue' in val) return null;
    if ('booleanValue' in val) return val.booleanValue;
    if ('integerValue' in val) return parseInt(val.integerValue, 10);
    if ('doubleValue' in val) return val.doubleValue;
    if ('stringValue' in val) return val.stringValue;
    if ('timestampValue' in val) return val.timestampValue;
    if ('arrayValue' in val) {
      return (val.arrayValue.values || []).map((item: any) => this.fromFirestoreValue(item));
    }
    if ('mapValue' in val) {
      const result: Record<string, any> = {};
      const fields = val.mapValue.fields || {};
      for (const [k, v] of Object.entries(fields)) {
        result[k] = this.fromFirestoreValue(v);
      }
      return result;
    }
    return null;
  }

  /**
   * Extract fields from Firestore Document REST Representation
   */
  public fromFirestoreDoc(doc: any): Record<string, any> | null {
    if (!doc || !doc.fields) return null;
    const result: Record<string, any> = {};
    for (const [k, v] of Object.entries(doc.fields)) {
      result[k] = this.fromFirestoreValue(v);
    }
    // If id was not inside fields, extract it from document path name
    if (!result.id && doc.name) {
      const parts = doc.name.split('/');
      result.id = parts[parts.length - 1];
    }
    return result;
  }

  /**
   * Fetch a single document by collection and ID
   */
  public async getDoc(collectionName: string, docId: string): Promise<Record<string, any> | null> {
    if (!this.config.projectId || !this.config.apiKey) return null;
    if (!this.isAvailable) return null;
    try {
      const url = `${this.baseUrl}/${encodeURIComponent(collectionName)}/${encodeURIComponent(docId)}?key=${this.config.apiKey}`;
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) {
        const errBody = await res.text();
        this.handleUnavailable(res.status, errBody);
        return null;
      }
      this.isAvailable = true;
      const data = await res.json();
      return this.fromFirestoreDoc(data);
    } catch (err) {
      this.isAvailable = false;
      return null;
    }
  }

  /**
   * Upsert a document by collection and ID
   */
  public async setDoc(collectionName: string, docId: string, data: Record<string, any>): Promise<boolean> {
    if (!this.config.projectId || !this.config.apiKey) return false;
    if (!this.isAvailable) return false;
    try {
      const url = `${this.baseUrl}/${encodeURIComponent(collectionName)}/${encodeURIComponent(docId)}?key=${this.config.apiKey}`;
      const fields: Record<string, any> = {};
      for (const [k, v] of Object.entries(data)) {
        if (v !== undefined) {
          fields[k] = this.toFirestoreValue(v);
        }
      }

      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        this.handleUnavailable(res.status, errBody);
        return false;
      }
      this.isAvailable = true;
      return true;
    } catch (err) {
      this.isAvailable = false;
      return false;
    }
  }

  /**
   * Delete a document by collection and ID
   */
  public async deleteDoc(collectionName: string, docId: string): Promise<boolean> {
    if (!this.config.projectId || !this.config.apiKey) return false;
    if (!this.isAvailable) return false;
    try {
      const url = `${this.baseUrl}/${encodeURIComponent(collectionName)}/${encodeURIComponent(docId)}?key=${this.config.apiKey}`;
      const res = await fetch(url, { method: 'DELETE' });
      if (!res.ok) {
        this.handleUnavailable(res.status, '');
      }
      return res.ok;
    } catch (err) {
      this.isAvailable = false;
      return false;
    }
  }

  /**
   * Run a structured query with indexed field filtering
   */
  public async runStructuredQuery(
    collectionName: string,
    filters: Array<{ field: string; op: 'EQUAL' | 'GREATER_THAN' | 'LESS_THAN'; value: any }> = [],
    limit: number = 300
  ): Promise<Record<string, any>[]> {
    if (!this.config.projectId || !this.config.apiKey) return [];
    if (!this.isAvailable) return [];
    try {
      const dbId = this.config.firestoreDatabaseId || '(default)';
      const queryUrl = `https://firestore.googleapis.com/v1/projects/${this.config.projectId}/databases/${dbId}/documents:runQuery?key=${this.config.apiKey}`;
      
      let whereClause: any = undefined;
      if (filters.length === 1) {
        whereClause = {
          fieldFilter: {
            field: { fieldPath: filters[0].field },
            op: filters[0].op,
            value: this.toFirestoreValue(filters[0].value),
          },
        };
      } else if (filters.length > 1) {
        whereClause = {
          compositeFilter: {
            op: 'AND',
            filters: filters.map(f => ({
              fieldFilter: {
                field: { fieldPath: f.field },
                op: f.op,
                value: this.toFirestoreValue(f.value),
              },
            })),
          },
        };
      }

      const requestBody: any = {
        structuredQuery: {
          from: [{ collectionId: collectionName }],
          limit,
        },
      };

      if (whereClause) {
        requestBody.structuredQuery.where = whereClause;
      }

      const res = await fetch(queryUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errText = await res.text();
        this.handleUnavailable(res.status, errText);
        return [];
      }

      this.isAvailable = true;
      const results = await res.json();
      if (!Array.isArray(results)) return [];

      const documents: Record<string, any>[] = [];
      for (const item of results) {
        if (item.document) {
          const parsed = this.fromFirestoreDoc(item.document);
          if (parsed) documents.push(parsed);
        }
      }
      return documents;
    } catch (err) {
      this.isAvailable = false;
      return [];
    }
  }

  /**
   * List all documents in a collection via runStructuredQuery
   */
  public async listDocs(collectionName: string, pageSize: number = 500): Promise<Record<string, any>[]> {
    return this.runStructuredQuery(collectionName, [], pageSize);
  }
}

export const firestoreClient = new FirestoreClient();
