import { apiUrl } from './apiConfig';
import { getStoredToken } from './authApi';

export interface OutlineSection {
  romanNumeral: string;
  heading: string;
  scriptureReference: string;
  exposition: string;
  illustration: string;
  practicalApplication: string;
}

export interface MessageOutlineResult {
  title: string;
  theme: string;
  keyScripture: string;
  supportingPassages: string[];
  objective: string;
  targetAudience: string;
  introduction: {
    hook: string;
    biblicalContext: string;
    centralTruth: string;
  };
  sections: OutlineSection[];
  conclusion: {
    summary: string;
    challenge: string;
    reflectionQuestions: string[];
  };
  altarCallOrAction: string;
  closingPrayer: string;
  generatedWithAi: boolean;
}

export interface GenerateOutlineParams {
  topicOrPassage: string;
  audience?: string;
  style?: string;
  pointsCount?: number;
  bibleVersion?: string;
}

export async function generateMessageOutline(
  params: GenerateOutlineParams
): Promise<MessageOutlineResult> {
  const targetUrl = apiUrl('/api/ai/message-outline');
  const token = getStoredToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(targetUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    let errorMsg = 'Failed to generate message outline.';
    try {
      const errJson = await res.json();
      if (errJson && errJson.error) {
        errorMsg = errJson.error;
      }
    } catch {}
    throw new Error(errorMsg);
  }

  return await res.json();
}
