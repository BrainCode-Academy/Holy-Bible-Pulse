import { DailyDevotional } from '../types';

export const DAILY_DEVOTIONALS: DailyDevotional[] = [
  {
    id: 'dev-1',
    title: 'Peace That Surpasses Understanding',
    author: 'Holy Bible+ Devotional Team',
    scripturalReference: 'Philippians 4:6-7',
    keyVerseText: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.',
    content: `Anxiety is one of the most subtle disruptors of spiritual clarity. When faced with uncertain circumstances, our natural instinct is to replay scenarios, measure our limited resources, and carry heavy mental burdens.

Paul's counsel to the church at Philippi offers a divine exchange: trade your anxious thoughts for intentional prayer and thanksgiving. Notice that thanksgiving is required before the answer even arrives. Gratitude shifts our focus from the scale of our problem to the absolute sovereignty and goodness of Almighty God.

When we surrender our concerns to God in prayer with a thankful heart, He promises something remarkable: His supernatural peace will stand guard like a soldier over our emotions and thoughts.`,
    prayer: 'Heavenly Father, today I surrender every anxious thought into Your hands. Teach me to pray with thanksgiving even before I see the resolution. May Your transcendent peace guard my mind and heart in Christ Jesus. Amen.',
    date: new Date().toISOString().split('T')[0]
  },
  {
    id: 'dev-2',
    title: 'Walking as Light in the Darkness',
    author: 'Holy Bible+ Devotional Team',
    scripturalReference: 'Matthew 5:14-16',
    keyVerseText: 'You are the light of the world. A town built on a hill cannot be hidden. Neither do people light a lamp and put it under a bowl. Instead they put it on its stand, and it gives light to everyone in the house.',
    content: `Light does not argue with darkness; it simply shines and dispels it. As followers of Christ, our lives are intended to reflect His holiness, love, and truth in everyday environments.

When you show integrity in your workplace, offer grace in conflict, and extend compassion to those who are hurting, you are uncovering the light of Christ. Never underestimate the impact of a quiet, consistent life surrendered to God's Word.`,
    prayer: 'Lord Jesus, fill me with Your Holy Spirit so that my words, choices, and actions shine brightly in a dark world. Let others see Your love in me and glorify You. Amen.',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0]
  },
  {
    id: 'dev-3',
    title: 'Rooted and Grounded in Love',
    author: 'Holy Bible+ Devotional Team',
    scripturalReference: 'Ephesians 3:17-19',
    keyVerseText: 'And I pray that you, being rooted and established in love, may have power, together with all the Lord’s holy people, to grasp how wide and long and high and deep is the love of Christ.',
    content: `Trees with deep roots weather the fiercest storms. When our spiritual identity is deeply rooted in the unconditional love of God, life's trials cannot uproot us.

God's love is not based on your performance or perfection; it was demonstrated at Calvary while we were still weak. Rest today in the vastness of Christ's love for you.`,
    prayer: 'Father, deepen my roots in Your unshakeable love today. When doubts arise, remind me of the eternal love revealed through the Cross. Amen.',
    date: new Date(Date.now() - 172800000).toISOString().split('T')[0]
  }
];

export function getTodayDevotional(): DailyDevotional {
  return DAILY_DEVOTIONALS[0];
}
