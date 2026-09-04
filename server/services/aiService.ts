import { GoogleGenAI } from '@google/genai';

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

// Fallback high-quality sermon templates for popular biblical topics and passages
const CURATED_OUTLINES: Record<string, Partial<MessageOutlineResult>> = {
  faith: {
    title: 'Unshakable Faith in Shifting Times',
    theme: 'Anchoring our Trust in the Unchanging Character of God',
    keyScripture: 'Hebrews 11:1-6',
    supportingPassages: ['Romans 4:18-21', 'James 1:2-4', '2 Corinthians 5:7'],
    objective: 'To equip believers to stand firm in active faith when facing trials and uncertainties.',
    targetAudience: 'Sunday Morning Congregation / All Believers',
    introduction: {
      hook: 'In a world that constantly shifts and falters, what is the anchor of your soul?',
      biblicalContext: 'The author of Hebrews wrote to persecuted believers tempted to retreat, reminding them of the victorious cloud of witnesses.',
      centralTruth: 'Biblical faith is not wishful thinking; it is total confidence in what God has spoken and who God is.',
    },
    sections: [
      {
        romanNumeral: 'I',
        heading: 'The Definition of True Faith',
        scriptureReference: 'Hebrews 11:1',
        exposition: 'Faith is the substance (title deed) of things hoped for, the conviction of realities unseen by human eyes.',
        illustration: 'Like a building foundation that is invisible from the street, faith supports the entire structure of our daily walk.',
        practicalApplication: 'Shift your focus from visible obstacles to God’s invisible yet eternal promises.',
      },
      {
        romanNumeral: 'II',
        heading: 'The Testimony of Pleasing God',
        scriptureReference: 'Hebrews 11:5-6',
        exposition: 'Without faith it is impossible to please God, for anyone who comes to Him must believe that He exists and rewards those who earnestly seek Him.',
        illustration: 'Enoch walked so closely with God through trusting communion that heaven became his immediate home.',
        practicalApplication: 'Start each morning with 5 minutes of surrendered prayer, asking God to lead your decisions.',
      },
      {
        romanNumeral: 'III',
        heading: 'The Endurance of Active Faith',
        scriptureReference: 'Hebrews 11:8-10',
        exposition: 'Abraham obeyed when called to go out to an unknown place, seeking a city designed and built by God.',
        illustration: 'Like a ship captain charting a course by fixed celestial stars rather than passing waves, we navigate by God’s Word.',
        practicalApplication: 'Take that specific step of obedience God has nudged your heart towards this week.',
      },
    ],
    conclusion: {
      summary: 'True faith recognizes God’s sovereignty, walks in obedience, and inherits divine rewards.',
      challenge: 'Will you trust God with the unwritten chapters of your life today?',
      reflectionQuestions: [
        'In what area of your life are you currently walking by sight rather than faith?',
        'How has God proven His faithfulness to you in past trials?',
      ],
    },
    altarCallOrAction: 'If you are facing an impossible situation, bring it to the altar and place it into God’s capable hands.',
    closingPrayer: 'Heavenly Father, increase our faith. When storms rage and sight fails, give us the grace to cling to Your promises. In Jesus’ Mighty Name, Amen.',
  },
  grace: {
    title: 'The Scandalous Wonder of God’s Grace',
    theme: 'Freely Justified, Fully Redeemed, Forever Loved',
    keyScripture: 'Ephesians 2:1-10',
    supportingPassages: ['Romans 5:1-2', 'Titus 2:11-14', '2 Corinthians 12:9'],
    objective: 'To celebrate the unmerited favor of God and motivate generous, transformed living.',
    targetAudience: 'General Assembly / Seekers & Believers',
    introduction: {
      hook: 'Grace is the most revolutionary word in human history—unearned favor given to the undeserving.',
      biblicalContext: 'Paul explains how Gentile believers were brought from spiritual death into vibrant resurrection life in Christ.',
      centralTruth: 'We are saved not BY good works, but FOR good works through the lavish grace of God.',
    },
    sections: [
      {
        romanNumeral: 'I',
        heading: 'Our Desperate Need Before Grace',
        scriptureReference: 'Ephesians 2:1-3',
        exposition: 'We were spiritually dead in transgressions and sins, unable to save ourselves.',
        illustration: 'A drowning person cannot pull themselves out of the water by their own hair; rescue must come from outside.',
        practicalApplication: 'Acknowledge that human effort alone can never bridge the gap between our sin and God’s holiness.',
      },
      {
        romanNumeral: 'II',
        heading: 'The Sovereign Initiative of God’s Love',
        scriptureReference: 'Ephesians 2:4-7',
        exposition: '“But God, being rich in mercy, because of the great love with which He loved us, made us alive together with Christ.”',
        illustration: 'The Father running to embrace the prodigal son before a single word of apology was uttered.',
        practicalApplication: 'Rest securely in the reality that your standing before God is grounded in Christ’s finished work.',
      },
      {
        romanNumeral: 'III',
        heading: 'The Fruit of Grace: God’s Masterpiece',
        scriptureReference: 'Ephesians 2:8-10',
        exposition: 'For by grace you have been saved through faith... we are His workmanship (poiēma), created for good works.',
        illustration: 'A master artist restoring a shattered mosaic into a breathtaking work of sacred art.',
        practicalApplication: 'Extend the same grace you have received to someone in your family or workplace who has wronged you.',
      },
    ],
    conclusion: {
      summary: 'Grace begins our journey, sustains our daily walk, and will usher us into eternal glory.',
      challenge: 'Receive God’s grace with humility and pour it out with generosity.',
      reflectionQuestions: [
        'Are you striving in your own strength or resting in God’s grace?',
        'Who in your life needs to experience unconditional grace from you this week?',
      ],
    },
    altarCallOrAction: 'Open your heart today to receive Jesus Christ as your Lord and Savior through grace by faith.',
    closingPrayer: 'Lord God of all grace, thank You for loving us when we were unlovable and redeeming us at infinite cost. May our lives reflect Your beauty and mercy. In Jesus’ Name, Amen.',
  },
};

export class AiService {
  private genAiClient: GoogleGenAI | null = null;

  private getGenAi(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return null;
    }
    if (!this.genAiClient) {
      this.genAiClient = new GoogleGenAI({ apiKey });
    }
    return this.genAiClient;
  }

  public async generateMessageOutline(params: {
    topicOrPassage: string;
    audience?: string;
    style?: string;
    pointsCount?: number;
    bibleVersion?: string;
  }): Promise<MessageOutlineResult> {
    const { topicOrPassage, audience = 'General Congregation', style = 'Expository Sermon', pointsCount = 3, bibleVersion = 'KJV' } = params;
    const cleanTopic = (topicOrPassage || 'Faith and Trust in God').trim();
    const client = this.getGenAi();

    if (client) {
      try {
        const prompt = `You are a world-class biblical scholar, seasoned pastor, and homiletics professor.
Create a comprehensive, deeply inspiring, doctrinally sound, and practical Christian message/sermon outline on: "${cleanTopic}".
Bible Translation: ${bibleVersion}
Target Setting/Style: ${style}
Target Audience: ${audience}
Desired Main Outline Points: ${pointsCount}

You MUST return ONLY valid JSON matching this exact structure:
{
  "title": "Inspiring and Memorable Sermon/Message Title",
  "theme": "Concise Theological Theme Statement",
  "keyScripture": "Primary Biblical Passage (e.g. John 15:1-8)",
  "supportingPassages": ["Reference 1", "Reference 2", "Reference 3"],
  "objective": "Clear single-sentence preaching/teaching objective",
  "targetAudience": "${audience}",
  "introduction": {
    "hook": "Attention-grabbing opening story, question, or thought",
    "biblicalContext": "Historical, cultural, and biblical context of the passage",
    "centralTruth": "The big idea / proposition of the message"
  },
  "sections": [
    {
      "romanNumeral": "I",
      "heading": "Clear Alliterated or Memorable Point Heading",
      "scriptureReference": "Scripture citation for this point",
      "exposition": "In-depth verse-by-verse explanation of what the text says and means",
      "illustration": "A concrete real-life analogy, modern story, or cultural illustration",
      "practicalApplication": "Specific action step for the listener to live out this truth"
    }
  ],
  "conclusion": {
    "summary": "Crisp recapitulation of the main points",
    "challenge": "Direct, compelling spiritual challenge to the heart",
    "reflectionQuestions": ["Personal Reflection Question 1", "Personal Reflection Question 2", "Discussion Question 3"]
  },
  "altarCallOrAction": "Warm, pastoral invitation for salvation, rededication, or prayer",
  "closingPrayer": "A moving, uplifting pastoral closing prayer"
}`;

        const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
        let response;
        try {
          response = await client.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction: 'You are an evangelical Bible scholar and homiletics instructor. Return pure, valid JSON with no markdown backticks, explanations, or extra commentary.',
              temperature: 0.7,
              responseMimeType: 'application/json',
            },
          });
        } catch (modelErr: any) {
          // If default model is unavailable, try gemini-3.7-flash or gemini-2.5-flash
          response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
              systemInstruction: 'You are an evangelical Bible scholar and homiletics instructor. Return pure, valid JSON with no markdown backticks, explanations, or extra commentary.',
              temperature: 0.7,
              responseMimeType: 'application/json',
            },
          });
        }

        const rawText = response.text || '';
        const cleaned = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        const parsed = JSON.parse(cleaned);

        if (parsed && parsed.title && Array.isArray(parsed.sections)) {
          return {
            ...parsed,
            generatedWithAi: true,
          };
        }
      } catch (err) {
        console.warn('[AiService] Gemini API call error or fallback:', err);
      }
    }

    // Fallback: Generate curated, highly structured outline from local homiletics engine
    const topicLower = cleanTopic.toLowerCase();
    let base = CURATED_OUTLINES.faith;
    if (topicLower.includes('grace') || topicLower.includes('salvation') || topicLower.includes('forgive') || topicLower.includes('love')) {
      base = CURATED_OUTLINES.grace;
    }

    return {
      title: `${cleanTopic}: Walking in Divine Victory`,
      theme: `Discovering God's Biblical Blueprint for ${cleanTopic}`,
      keyScripture: cleanTopic.includes(':') ? cleanTopic : (base.keyScripture || 'Romans 8:28-39'),
      supportingPassages: base.supportingPassages || ['Proverbs 3:5-6', 'Philippians 4:6-7', '2 Timothy 1:7'],
      objective: `To understand and apply God's timeless truth regarding ${cleanTopic} in daily life.`,
      targetAudience: audience,
      introduction: base.introduction || {
        hook: `When we reflect on ${cleanTopic}, our hearts are drawn to the unchanging promises of Scripture.`,
        biblicalContext: 'God has revealed His wisdom through the holy scriptures to guide every generation.',
        centralTruth: `God's Word provides complete sufficiency and power as we navigate ${cleanTopic}.`,
      },
      sections: base.sections || [
        {
          romanNumeral: 'I',
          heading: `The Foundation of ${cleanTopic}`,
          scriptureReference: 'Psalm 119:105',
          exposition: 'God’s Word is a lamp to our feet and a light to our path in every season.',
          illustration: 'Like a lighthouse guiding ships through foggy waters into safe harbor.',
          practicalApplication: 'Ground your daily perspective on the truth of Scripture rather than fleeting opinions.',
        },
        {
          romanNumeral: 'II',
          heading: `The Power of Divine Grace in ${cleanTopic}`,
          scriptureReference: '2 Corinthians 12:9',
          exposition: 'God’s grace is always sufficient, and His strength is made perfect in our human weakness.',
          illustration: 'An electrical current flowing into a bulb to illuminate darkness with radiant light.',
          practicalApplication: 'Surrender your worries and rely on the Holy Spirit’s empowerment today.',
        },
        {
          romanNumeral: 'III',
          heading: `The Call to Action and Victory`,
          scriptureReference: 'Joshua 1:9',
          exposition: 'Be strong and courageous; do not be afraid or discouraged, for the Lord your God is with you wherever you go.',
          illustration: 'A soldier donning the full armor of God before stepping onto the battlefield.',
          practicalApplication: 'Step out in bold obedience, knowing the Lord fights for you.',
        },
      ],
      conclusion: base.conclusion || {
        summary: `We have seen how God’s Word establishes, empowers, and guides us in ${cleanTopic}.`,
        challenge: 'Make a conscious decision today to align your actions with God’s eternal Word.',
        reflectionQuestions: [
          `How is God speaking to you today regarding ${cleanTopic}?`,
          'What practical step of obedience will you take before this week ends?',
        ],
      },
      altarCallOrAction: 'If you desire prayer or wish to dedicate your heart anew to Jesus Christ, reach out in faith today.',
      closingPrayer: `Gracious God and Father, thank You for the truth of Your Word regarding ${cleanTopic}. Strengthen every heart, heal every wound, and lead us into Your fullness. In the Holy Name of Jesus, Amen.`,
      generatedWithAi: false,
    };
  }
}

export const aiService = new AiService();
