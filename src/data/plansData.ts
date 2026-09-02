import { ReadingPlan } from '../types';

export const INITIAL_READING_PLANS: ReadingPlan[] = [
  {
    id: '7-days-of-faith',
    title: '7 Days of Faith',
    description: 'Anchor your heart in unwavering trust in God through essential scriptures on faith, courage, and divine promises.',
    category: 'Topical',
    durationDays: 7,
    currentDay: 1,
    isEnrolled: false,
    days: [
      { day: 1, title: 'What is Faith? (Hebrews 11)', references: ['HEB.11'], completed: false },
      { day: 2, title: 'Faith by Hearing (Romans 10)', references: ['ROM.10'], completed: false },
      { day: 3, title: 'Walking by Faith (2 Corinthians 5)', references: ['2CO.5'], completed: false },
      { day: 4, title: 'Shield of Faith (Ephesians 6)', references: ['EPH.6'], completed: false },
      { day: 5, title: 'Faith and Works (James 2)', references: ['JAS.2'], completed: false },
      { day: 6, title: 'Faith that Moves Mountains (Matthew 17)', references: ['MAT.17'], completed: false },
      { day: 7, title: 'Author and Perfecter of Faith (Hebrews 12)', references: ['HEB.12'], completed: false },
    ],
  },
  {
    id: '30-days-of-prayer',
    title: '30 Days of Prayer',
    description: 'Transform your conversation with God with 30 daily reflections and scripture passages centered on intercession, praise, and petition.',
    category: 'Devotional',
    durationDays: 30,
    currentDay: 1,
    isEnrolled: false,
    days: Array.from({ length: 30 }).map((_, i) => {
      const prayerChapters = [
        'MAT.6', 'PHP.4', '1TH.5', 'PSA.23', 'PSA.91', 'PSA.51', 'PSA.103', 'EPH.3',
        'COL.1', 'JHN.17', 'LUK.11', '1TI.2', 'JAS.5', 'PSA.27', 'PSA.34', 'PSA.63',
        'PSA.86', 'PSA.121', 'PSA.139', 'ISA.40', 'ISA.55', 'JER.29', 'DAN.9', 'NEH.1',
        '1KI.8', '2CH.7', 'HAB.3', 'HEB.4', '1JN.5', 'REV.5'
      ];
      const titles = [
        'The Lord’s Pattern for Prayer', 'Peace Through Supplication', 'Praying Without Ceasing',
        'The Shepherd’s Presence', 'Abiding in Divine Shelter', 'A Clean Heart and Repentance',
        'Bless the Lord, O My Soul', 'Strength in the Inner Being', 'Fruitful Walk and Wisdom',
        'Jesus’ High Priestly Prayer', 'Asking, Seeking, and Knocking', 'Prayers for All People',
        'The Prayer of Faith', 'The Lord is My Light', 'Taste and See the Lord is Good',
        'Thirsting for God in the Desert', 'Incline Your Ear, O Lord', 'My Help Comes from the Lord',
        'Known and Searched by God', 'Renewing Strength in Waiting', 'Seek the Lord While He May Be Found',
        'A Plan and a Future', 'Daniel’s Confession and Plea', 'Nehemiah’s Burden and Fasting',
        'Solomon’s Temple Dedication', 'If My People Will Humble Themselves', 'Rejoicing in the Lord’s Salvation',
        'Approaching the Throne of Grace', 'Confidence in Answering Prayers', 'Worship and the Golden Bowls of Incense'
      ];
      return {
        day: i + 1,
        title: `Day ${i + 1}: ${titles[i] || 'Daily Prayer & Scripture'}`,
        references: [prayerChapters[i] || 'MAT.6'],
        completed: false,
      };
    }),
  },
  {
    id: 'read-bible-in-1-year',
    title: 'Read Bible in 1 Year',
    description: 'A comprehensive, daily journey covering the entire Holy Scripture through structured readings across Old Testament, New Testament, Psalms, and Wisdom literature.',
    category: 'Canonical',
    durationDays: 365,
    currentDay: 1,
    isEnrolled: false,
    days: Array.from({ length: 365 }).map((_, i) => {
      const dayNum = i + 1;
      const genesisChap = Math.min(dayNum, 50);
      const matthewChap = Math.min((dayNum % 28) + 1, 28);
      const psalmChap = Math.min((dayNum % 150) + 1, 150);
      return {
        day: dayNum,
        title: `Day ${dayNum}: Genesis & Gospel Readings`,
        references: [`GEN.${genesisChap}`, `MAT.${matthewChap}`, `PSA.${psalmChap}`],
        completed: false,
      };
    }),
  },
];
