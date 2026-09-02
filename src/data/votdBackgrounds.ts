export interface VotdBackground {
  id: string;
  url: string;
  thumbnailUrl?: string;
  title: string;
  location?: string;
  category: 'sunrise' | 'mountains' | 'waters' | 'forests' | 'heavens' | 'nature';
  particleColor: string;
  glowColor: string;
  credit?: string;
}

export const VOTD_BACKGROUNDS: VotdBackground[] = [
  {
    id: 'bg-mountain-sunrise',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=300&q=60',
    title: 'Alpine Sunrise Glow',
    location: 'Yosemite Valley, USA',
    category: 'sunrise',
    particleColor: 'rgba(251, 191, 36, 0.85)',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    credit: 'Bailey Zindel / Unsplash',
  },
  {
    id: 'bg-forest-sunbeams',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1600&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=300&q=60',
    title: 'Sunlit Forest Cathedral',
    location: 'Bavarian Woodland, Germany',
    category: 'forests',
    particleColor: 'rgba(167, 243, 208, 0.85)',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    credit: 'Sebastian Unrau / Unsplash',
  },
  {
    id: 'bg-peaceful-ocean',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=60',
    title: 'Peaceful Ocean Waves',
    location: 'Tropical Coastline',
    category: 'waters',
    particleColor: 'rgba(56, 189, 248, 0.85)',
    glowColor: 'rgba(14, 165, 233, 0.35)',
    credit: 'Sean Oulashin / Unsplash',
  },
  {
    id: 'bg-golden-meadow',
    url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1600&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=300&q=60',
    title: 'Golden Morning Valley',
    location: 'Dolomites, Italy',
    category: 'sunrise',
    particleColor: 'rgba(252, 211, 77, 0.85)',
    glowColor: 'rgba(217, 119, 6, 0.45)',
    credit: 'Luka Vovk / Unsplash',
  },
  {
    id: 'bg-majestic-sky',
    url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1600&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=300&q=60',
    title: 'Starry Mountain Night',
    location: 'Mount Fitz Roy, Patagonia',
    category: 'heavens',
    particleColor: 'rgba(224, 231, 255, 0.9)',
    glowColor: 'rgba(99, 102, 241, 0.45)',
    credit: 'Benjamin Davies / Unsplash',
  },
  {
    id: 'bg-sunburst-clouds',
    url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=300&q=60',
    title: 'Heavenly Clouds & Light',
    location: 'High Altitude Sky',
    category: 'heavens',
    particleColor: 'rgba(254, 240, 138, 0.85)',
    glowColor: 'rgba(234, 179, 8, 0.4)',
    credit: 'Sam Schooler / Unsplash',
  },
  {
    id: 'bg-calm-lake',
    url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=300&q=60',
    title: 'Still Waters & Pines',
    location: 'Lake Braies, Italy',
    category: 'waters',
    particleColor: 'rgba(147, 197, 253, 0.85)',
    glowColor: 'rgba(37, 99, 235, 0.35)',
    credit: 'Pietro De Grandi / Unsplash',
  },
  {
    id: 'bg-sunset-mountains',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=300&q=60',
    title: 'Almighty Peak Sunset',
    location: 'Cascade Range',
    category: 'mountains',
    particleColor: 'rgba(254, 215, 170, 0.85)',
    glowColor: 'rgba(194, 65, 12, 0.45)',
    credit: 'Kalvis Alberts / Unsplash',
  },
  {
    id: 'bg-path-through-light',
    url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=300&q=60',
    title: 'Path of Righteousness',
    location: 'Misty Alpine Valley',
    category: 'nature',
    particleColor: 'rgba(253, 224, 71, 0.85)',
    glowColor: 'rgba(202, 138, 4, 0.45)',
    credit: 'David Marcu / Unsplash',
  },
  {
    id: 'bg-lavender-field',
    url: 'https://images.unsplash.com/photo-1499209974431-9dac3ada00d7?auto=format&fit=crop&w=1600&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1499209974431-9dac3ada00d7?auto=format&fit=crop&w=300&q=60',
    title: 'Morning Dew & Blooms',
    location: 'Provence Countryside',
    category: 'nature',
    particleColor: 'rgba(216, 180, 254, 0.85)',
    glowColor: 'rgba(168, 85, 247, 0.35)',
    credit: 'Daiga Ellaby / Unsplash',
  },
  {
    id: 'bg-rock-coast-dawn',
    url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1600&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=300&q=60',
    title: 'Rock of Salvation Coast',
    location: 'Pacific Shoreline',
    category: 'waters',
    particleColor: 'rgba(253, 164, 175, 0.85)',
    glowColor: 'rgba(225, 29, 72, 0.4)',
    credit: 'Shifaaz shamoon / Unsplash',
  },
  {
    id: 'bg-sun-through-pines',
    url: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1600&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=300&q=60',
    title: 'Living Forest Streams',
    location: 'Pacific Northwest Forest',
    category: 'forests',
    particleColor: 'rgba(167, 243, 208, 0.85)',
    glowColor: 'rgba(16, 185, 129, 0.35)',
    credit: 'Dan Meyers / Unsplash',
  },
  {
    id: 'bg-desert-solitude',
    url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1600&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=300&q=60',
    title: 'Wilderness Sanctuary',
    location: 'Sahara Golden Dunes',
    category: 'sunrise',
    particleColor: 'rgba(253, 186, 116, 0.85)',
    glowColor: 'rgba(234, 88, 12, 0.4)',
    credit: 'Jeremy Bishop / Unsplash',
  },
  {
    id: 'bg-emerald-fjord',
    url: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1600&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=300&q=60',
    title: 'Serene Fjord Sanctuary',
    location: 'Geirangerfjord, Norway',
    category: 'mountains',
    particleColor: 'rgba(110, 231, 183, 0.85)',
    glowColor: 'rgba(5, 150, 105, 0.35)',
    credit: 'Luca Bravo / Unsplash',
  },
  {
    id: 'bg-deep-space-galaxy',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1600&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=300&q=60',
    title: 'The Heavens Declare',
    location: 'Milky Way Starlight',
    category: 'heavens',
    particleColor: 'rgba(199, 210, 254, 0.95)',
    glowColor: 'rgba(99, 102, 241, 0.5)',
    credit: 'NASA / Unsplash',
  },
  {
    id: 'bg-autumn-gold',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=60',
    title: 'Seasons of Grace',
    location: 'Autumn Mountain Trail',
    category: 'nature',
    particleColor: 'rgba(251, 191, 36, 0.85)',
    glowColor: 'rgba(217, 119, 6, 0.45)',
    credit: 'Unsplash',
  },
];

export function getVotdBackgroundForDate(dateStr?: string): VotdBackground {
  let hash = 0;
  const str = dateStr || new Date().toISOString().slice(0, 10);
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % VOTD_BACKGROUNDS.length;
  return VOTD_BACKGROUNDS[index];
}

export function getVotdBackgroundById(id?: string): VotdBackground | null {
  if (!id) return null;
  return VOTD_BACKGROUNDS.find(b => b.id === id) || null;
}


