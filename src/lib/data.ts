import { supabase, Category, Video } from './supabase';
import { getPublicMediaUrl } from './r2';

export type { Category, Video };

export interface DirectoryCategoryItem {
  name: string;
  slug: string;
}

export interface DirectoryGroup {
  letter: string;
  items: DirectoryCategoryItem[];
}

export const RAW_DIRECTORY_DATA: { letter: string; items: string[] }[] = [
  { letter: '1', items: ['18 Years'] },
  { letter: '3', items: ['3D'] },
  { letter: '6', items: ['69'] },
  {
    letter: 'A',
    items: ['Adorable', 'Amateur', 'American', 'Anal', 'Anime', 'Arab', 'Asian', 'Ass Lick'],
  },
  {
    letter: 'B',
    items: [
      'Babes', 'Babysitter', 'Backseat', 'Ball Licking', 'Bath', 'BBC', 'BBW', 'BDSM',
      'Beach', 'Beautiful', 'Behind The Scenes', 'Beurette', 'Big Ass', 'Big Cock',
      'Big Natural Boobs', 'Big Tits', 'Big White Ass', 'Bikini', 'Bisexual', 'Black',
      'Black Cock', 'Blind Folded', 'Blonde', 'Blowbang', 'Blowjob', 'Bodybuilder',
      'Bondage', 'Boots', 'Brazilian', 'British', 'Brunette', 'Brutal', 'Bubble Butt',
      'Bukkake', 'Busty', 'Butt Plug',
    ],
  },
  {
    letter: 'C',
    items: [
      'Cameltoe', 'Car', 'Cartoon', 'Cash', 'Casting', 'Caught', 'Celeb', 'CFNM',
      'Cheating', 'Cheerleader', 'Chinese', 'Chubby', 'Classroom', 'Closeup', 'Clothed',
      'Club', 'College', 'Colombian', 'Compilation', 'Cosplay', 'Couch', 'Cougar',
      'Couple', 'Cowgirl', 'Crazy Sex', 'Creampie', 'Cuckold', 'Cumshot', 'Curvy',
      'Cute', 'Czech',
    ],
  },
  {
    letter: 'D',
    items: [
      'Daddy', 'Deepthroat', 'Dildo', 'Dirty Talk', 'Doctor', 'Doggystyle',
      'Domination', 'Double Penetration',
    ],
  },
  {
    letter: 'E',
    items: ['Ebony', 'Emo', 'Erotic', 'European', 'Exotic', 'Extreme'],
  },
  {
    letter: 'F',
    items: [
      'Face Fuck', 'Facesitting', 'Facial', 'Fake Tits', 'Family', 'Fat', 'Femdom',
      'Fetish', 'FFM', 'Fingering', 'First Time', 'Fishnet', 'Fisting', 'Fitness',
      'Flashing', 'Flexible', 'FMM', 'Foot Fetish', 'Foursome', 'French',
      'Fucking Machine', 'Funny',
    ],
  },
  {
    letter: 'G',
    items: [
      'Gagging', 'Gangbang', 'Gaping', 'Garter Belt', 'German', 'Girlfriend',
      'Glamorous', 'Glasses', 'Gloryhole', 'Gonzo', 'Gorgeous', 'Goth', 'Grandpa',
      'Granny', 'Group Sex', 'Gym',
    ],
  },
  {
    letter: 'H',
    items: [
      'Hairy', 'Handcuffed', 'Handjob', 'Hardcore', 'HD Porn', 'Hentai', 'High Heels',
      'Homemade', 'Hospital', 'Hotel', 'Housewife', 'Hungarian', 'Husband',
    ],
  },
  {
    letter: 'I',
    items: ['Indian', 'Innocent', 'Interracial', 'Italian'],
  },
  {
    letter: 'J',
    items: ['Japanese', 'Jeans', 'JOI'],
  },
  {
    letter: 'K',
    items: ['Kinky', 'Kissing', 'Kitchen', 'Korean'],
  },
  {
    letter: 'L',
    items: [
      'Latex', 'Latina', 'Leggings', 'Legs', 'Lesbian', 'Lezdom', 'Lingerie',
      'Long Haired', 'Long Legged',
    ],
  },
  {
    letter: 'M',
    items: [
      'Maid', 'Massage', 'Masturbation', 'Mature', 'Medical', 'Mexican', 'Midget',
      'MILF', 'Miniskirt', 'Missionary', 'Mistress', 'Mom', 'Monster Cock',
    ],
  },
  {
    letter: 'N',
    items: [
      'Natural Boobs', 'Naughty', 'Neighbor', 'Nerdy', 'Nipples', 'Nun', 'Nurse',
      'Nylon', 'Nympho',
    ],
  },
  {
    letter: 'O',
    items: [
      'Office', 'Oil', 'Old And Young (18+)', 'Old Man', 'Orgasm', 'Orgy', 'Outdoor',
    ],
  },
  {
    letter: 'P',
    items: [
      'Pain', 'Panties', 'Pantyhose', 'Parody', 'Party', 'PAWG', 'Petite', 'Pick Up',
      'Piercing', 'Pigtail', 'Pissing', 'Police', 'Pool', 'Pornstars', 'POV',
      'Pregnant', 'Pretty', 'Public', 'Punishment', 'Punk', 'Pussy Licking',
    ],
  },
  {
    letter: 'R',
    items: [
      'Reality', 'Redhead', 'Reverse Cowgirl', 'Riding', 'Rimjob', 'Roleplay',
      'Romantic', 'Rough', 'Russian',
    ],
  },
  {
    letter: 'S',
    items: [
      'Saggy Boobs', 'Satin', 'Sauna', 'Schoolgirl', 'Secretary', 'Sensual',
      'Shaved Pussy', 'Short Hair', 'Shower', 'Sister', 'Skinny', 'Slave', 'Slut',
      'Small Tits', 'Smoking', 'Softcore', 'Solo', 'Spandex', 'Spanish', 'Spanking',
      'Sport', 'Spy', 'Squirt', 'Stepmom', 'Stepsister', 'Stewardess', 'Stockings',
      'Strap-On', 'Striptease', 'Students', 'Submissive', 'Swallowing', 'Swingers', 'Sybian',
    ],
  },
  {
    letter: 'T',
    items: [
      'Table', 'Taboo', 'Tanned', 'Tattooed', 'Taxi', 'Teacher', 'Teasing', 'Teen',
      'Thai', 'Threesome', 'Throat Fucked', 'Tied', 'Titty Fuck', 'Toilet', 'Toys',
      'Trimmed Pussy', 'Turkish',
    ],
  },
  {
    letter: 'U',
    items: ['Uncensored', 'Undressing', 'Uniform', 'Upskirt'],
  },
  {
    letter: 'V',
    items: ['Vibrator', 'Vintage', 'Voyeur'],
  },
  {
    letter: 'W',
    items: ['Webcam', 'Wife', 'Wild', 'Wrestling'],
  },
  {
    letter: 'Y',
    items: ['Yoga', 'Young'],
  },
];

export const CATEGORY_DIRECTORY_GROUPS: DirectoryGroup[] = RAW_DIRECTORY_DATA.map((group) => ({
  letter: group.letter,
  items: group.items.map((name) => ({
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
  })),
}));

// Group mapping for 7 height-balanced vertical columns
const COLUMN_MAPPINGS: string[][] = [
  ['1', '3', '6', 'A', 'D', 'E', 'I', 'J', 'K'],
  ['B'],
  ['C', 'L'],
  ['F', 'G', 'U'],
  ['H', 'M', 'N', 'O'],
  ['P', 'R', 'V', 'W', 'Y'],
  ['S', 'T'],
];

export const BALANCED_DIRECTORY_COLUMNS: DirectoryGroup[][] = COLUMN_MAPPINGS.map((letters) =>
  letters
    .map((letStr) => CATEGORY_DIRECTORY_GROUPS.find((g) => g.letter === letStr))
    .filter((g): g is DirectoryGroup => g !== undefined)
);

const COVER_IMAGE_POOL: string[] = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1534126511673-b6899657816a?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?auto=format&fit=crop&w=800&q=80',
];

let mockCatIdCounter = 1;
export const MOCK_CATEGORIES: Category[] = RAW_DIRECTORY_DATA.flatMap((group) =>
  group.items.map((name) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const imgIndex = Math.abs(name.charCodeAt(0) * 7 + name.length) % COVER_IMAGE_POOL.length;
    const views = Math.floor(((name.charCodeAt(0) * 19 + name.length * 37) % 900) + 50) * 1000;
    return {
      id: `cat-${mockCatIdCounter++}`,
      name,
      slug,
      description: `Browse all releases and video collections tagged under ${name}.`,
      cover_image_key: null,
      cover_image_url: COVER_IMAGE_POOL[imgIndex],
      views_count: views,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  })
);

export const MOCK_VIDEOS: Video[] = [
  {
    id: 'vid-1',
    category_id: 'cat-1',
    title: 'Next-Gen Quantum Computing Explained in 10 Minutes',
    slug: 'next-gen-quantum-computing-explained',
    description: 'Deep dive into quantum qubits, superposition, and how modern superconductors are reshaping computing power.',
    is_external: false,
    video_key: 'samples/sample-video.mp4',
    external_url: null,
    thumbnail_key: null,
    thumbnail_url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80',
    duration_seconds: 640,
    views_count: 5420,
    likes_count: 420,
    dislikes_count: 12,
    is_published: true,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[0],
  },
  {
    id: 'vid-2',
    category_id: 'cat-2',
    title: 'Cyber City 2099 - Official Sci-Fi Teaser Trailer',
    slug: 'cyber-city-2099-official-teaser',
    description: 'Experience futuristic metropolis visuals in stunning 4K HDR. Directed by visionary creators.',
    is_external: true,
    video_key: null,
    external_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail_key: null,
    thumbnail_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    duration_seconds: 185,
    views_count: 12890,
    likes_count: 1100,
    dislikes_count: 45,
    is_published: true,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[1],
  },
  {
    id: 'vid-3',
    category_id: 'cat-3',
    title: 'Wild Deep Ocean Odyssey 4K Documentary',
    slug: 'wild-deep-ocean-odyssey-4k',
    description: 'Explore the uncharted bioluminescent lifeforms thriving in the Mariana Trench.',
    is_external: false,
    video_key: 'samples/ocean.mp4',
    external_url: null,
    thumbnail_key: null,
    thumbnail_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
    duration_seconds: 1420,
    views_count: 8900,
    likes_count: 730,
    dislikes_count: 9,
    is_published: true,
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[2],
  },
  {
    id: 'vid-4',
    category_id: 'cat-4',
    title: 'Electronic Synthwave Festival Live Stream Highlights',
    slug: 'electronic-synthwave-festival-live',
    description: 'Full stage multi-cam recording of the annual neon lights synthwave concert in Tokyo.',
    is_external: true,
    video_key: null,
    external_url: 'https://vimeo.com',
    thumbnail_key: null,
    thumbnail_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
    duration_seconds: 3200,
    views_count: 21500,
    likes_count: 1850,
    dislikes_count: 32,
    is_published: true,
    created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[3],
  },
  {
    id: 'vid-5',
    category_id: 'cat-1',
    title: 'Building a $5000 Custom Liquid Cooled PC Workstation',
    slug: 'building-custom-liquid-cooled-pc',
    description: 'Step-by-step assembly of hardline tubing, dual GPU configuration, and thermal benchmarks.',
    is_external: false,
    video_key: 'samples/pc-build.mp4',
    external_url: null,
    thumbnail_key: null,
    thumbnail_url: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80',
    duration_seconds: 980,
    views_count: 7640,
    likes_count: 610,
    dislikes_count: 15,
    is_published: true,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[0],
  },
];

export async function fetchCategories(options?: {
  page?: number;
  limit?: number;
}): Promise<{
  categories: Category[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const page = options?.page || 1;
  const limit = options?.limit || 100; // Default 20 rows * 5 columns = 100 items per page

  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-supabase')) {
      const total = MOCK_CATEGORIES.length;
      const totalPages = Math.ceil(total / limit);
      const start = (page - 1) * limit;
      const categories = MOCK_CATEGORIES.slice(start, start + limit);
      return { categories, total, page, totalPages };
    }

    const { count } = await supabase.from('categories').select('*', { count: 'exact', head: true });
    const total = count || MOCK_CATEGORIES.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')
      .range(start, start + limit - 1);

    if (error || !data || data.length === 0) {
      const startMock = (page - 1) * limit;
      const categories = MOCK_CATEGORIES.slice(startMock, startMock + limit);
      return { categories, total: MOCK_CATEGORIES.length, page, totalPages: Math.ceil(MOCK_CATEGORIES.length / limit) };
    }

    const categories = data as Category[];
    for (const cat of categories) {
      if (!cat.cover_image_url && !cat.cover_image_key) {
        const { data: vidData } = await supabase
          .from('videos')
          .select('thumbnail_url, thumbnail_key')
          .eq('category_id', cat.id)
          .limit(1)
          .maybeSingle();
        if (vidData) {
          cat.cover_image_url = vidData.thumbnail_url;
          cat.cover_image_key = vidData.thumbnail_key;
        }
      }
    }

    return { categories, total, page, totalPages };
  } catch {
    const total = MOCK_CATEGORIES.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const categories = MOCK_CATEGORIES.slice(start, start + limit);
    return { categories, total, page, totalPages };
  }
}

export async function fetchCategoryBySlug(slug: string): Promise<Category | null> {
  const findInDirectory = (): Category | null => {
    const mockMatch = MOCK_CATEGORIES.find((c) => c.slug === slug);
    if (mockMatch) return mockMatch;

    for (const group of CATEGORY_DIRECTORY_GROUPS) {
      const dirMatch = group.items.find((i) => i.slug === slug);
      if (dirMatch) {
        return {
          id: `dir-${dirMatch.slug}`,
          name: dirMatch.name,
          slug: dirMatch.slug,
          description: `Browse all releases and video collections tagged under ${dirMatch.name}.`,
          cover_image_key: null,
          cover_image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
          views_count: 50000,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
    }
    return null;
  };

  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-supabase')) {
      return findInDirectory();
    }
    const { data, error } = await supabase.from('categories').select('*').eq('slug', slug).single();
    if (error || !data) {
      return findInDirectory();
    }
    const cat = data as Category;
    if (!cat.cover_image_url && !cat.cover_image_key) {
      const { data: vidData } = await supabase
        .from('videos')
        .select('thumbnail_url, thumbnail_key')
        .eq('category_id', cat.id)
        .limit(1)
        .maybeSingle();
      if (vidData) {
        cat.cover_image_url = vidData.thumbnail_url;
        cat.cover_image_key = vidData.thumbnail_key;
      }
    }
    return cat;
  } catch {
    return findInDirectory();
  }
}

export function generateCategoryVideos(categorySlug: string, count: number = 120): Video[] {
  const mockCat = MOCK_CATEGORIES.find((c) => c.slug === categorySlug);
  const catName = mockCat ? mockCat.name : categorySlug.replace(/-/g, ' ').toUpperCase();
  const catObj: Category = mockCat || {
    id: `cat-${categorySlug}`,
    name: catName,
    slug: categorySlug,
    description: `Browse all releases and video collections tagged under ${catName}.`,
    cover_image_key: null,
    cover_image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    views_count: 50000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const performers = ['Karin Aizawa', 'Momoka Sakai', 'Francesca Le', 'Rin Aoki', 'Serena Skye', 'Lexi Dona', 'Kyle Mason', 'Sana Anzyu', 'Kotone Kuroki', 'Yuria Mano', 'Kiara Diane'];
  const sources = ['FapHouse', 'XHamster', 'XOzilla', 'PornDR', 'Around'];

  return Array.from({ length: count }, (_, i) => {
    const perf = performers[i % performers.length];
    const source = sources[i % sources.length];
    const views = Math.floor(((i * 37 + categorySlug.charCodeAt(0) * 13) % 900) + 50) * 1000;
    const rating = Math.floor(((i * 11 + categorySlug.charCodeAt(0) * 7) % 40) + 60);
    const mins = Math.floor(((i * 19 + categorySlug.charCodeAt(0) * 3) % 25) + 8);
    const secs = Math.floor((i * 17) % 60);
    const duration = mins * 60 + secs;
    const imgIndex = Math.abs(i * 5 + categorySlug.charCodeAt(0) * 3) % COVER_IMAGE_POOL.length;

    return {
      id: `vid-${categorySlug}-${i + 1}`,
      category_id: catObj.id,
      title: `${catName} - ${perf} & ${sources[(i + 1) % sources.length]} Scene #${i + 1}`,
      slug: `${categorySlug}-release-${i + 1}`,
      description: `High definition release featured in ${catName} category starring ${perf}.`,
      is_external: i % 2 === 1,
      video_key: null,
      external_url: i % 2 === 1 ? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' : null,
      thumbnail_key: null,
      thumbnail_url: COVER_IMAGE_POOL[imgIndex],
      duration_seconds: duration,
      views_count: views,
      likes_count: Math.floor(views * 0.08),
      dislikes_count: Math.floor(views * 0.005),
      is_published: true,
      performer_name: perf,
      source_name: source,
      rating_percent: rating,
      created_at: new Date(Date.now() - 86400000 * (i + 1)).toISOString(),
      updated_at: new Date().toISOString(),
      category: catObj,
    };
  });
}

export interface SynonymMapping {
  aliases?: string[];
  related?: string[];
}

export const SEARCH_SYNONYMS: Record<string, SynonymMapping> = {
  'japanese': {
    aliases: ['japan', 'jav'],
    related: ['asian']
  },
  'asian': {
    aliases: ['oriental'],
    related: ['japanese', 'jav', 'korean', 'chinese', 'thai']
  },
  'mom': {
    aliases: ['mother'],
    related: ['milf', 'mature', 'stepmom', 'housewife']
  },
  'mother': {
    aliases: ['mom'],
    related: ['milf', 'mature', 'stepmom', 'housewife']
  },
  'milf': {
    aliases: ['milfs'],
    related: ['mom', 'mature', 'stepmom', 'cougar', 'housewife']
  },
  'stepmom': {
    aliases: ['step-mom'],
    related: ['mom', 'milf', 'mature', 'taboo']
  },
  'stepsister': {
    aliases: ['step-sister'],
    related: ['sister', 'taboo', 'family']
  },
  'sister': {
    aliases: ['sisters'],
    related: ['stepsister', 'taboo', 'family']
  },
  'vr': {
    aliases: ['virtual reality', '3d'],
    related: ['360']
  },
  '3d': {
    aliases: ['cgi', 'cartoon'],
    related: ['vr', 'virtual reality', 'hentai', 'anime', 'cosplay']
  },
  'hentai': {
    aliases: ['hentais'],
    related: ['3d', 'anime', 'cartoon', 'cosplay']
  },
  'anime': {
    aliases: ['animes'],
    related: ['3d', 'hentai', 'cartoon', 'cosplay']
  },
  'pov': {
    aliases: ['point of view'],
    related: ['first person', 'homemade']
  },
  'amateur': {
    aliases: ['home video'],
    related: ['homemade', 'real couple', 'girlfriend']
  },
  'blowjob': {
    aliases: ['bj', 'blowjobs'],
    related: ['deepthroat', 'swallowing', 'throat']
  },
  'anal': {
    aliases: ['anals'],
    related: ['double penetration', 'dp', 'butt plug']
  },
  'lesbian': {
    aliases: ['lesbians', 'lez'],
    related: ['girl on girl', 'solo']
  },
  'live': {
    aliases: ['cams', 'cam'],
    related: ['chat']
  },
  'teen': {
    aliases: ['teens'],
    related: ['18 years', '18-years', 'college', 'schoolgirl', 'student']
  },
  '18-years': {
    aliases: ['18 years', '18years'],
    related: ['teen', 'college', 'schoolgirl', 'student']
  },
  'mature': {
    aliases: ['matures'],
    related: ['milf', 'mom', 'cougar', 'housewife']
  },
  'joi': {
    aliases: ['jerk off instruction'],
    related: ['jerk off', 'masturbation', 'solo']
  },
  'jerk': {
    aliases: ['jerk off'],
    related: ['joi', 'masturbation', 'solo']
  }
};

export async function fetchVideos(options?: {
  categoryId?: string;
  categorySlug?: string;
  searchQuery?: string;
  limit?: number;
}): Promise<Video[]> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-supabase')) {
      if (options?.categorySlug) {
        return generateCategoryVideos(options.categorySlug, options.limit || 120);
      }
      let result = [...MOCK_VIDEOS];
      if (options?.searchQuery) {
        const q = options.searchQuery.toLowerCase().trim();
        const aliases: string[] = [];
        const related: string[] = [];

        Object.keys(SEARCH_SYNONYMS).forEach((key) => {
          if (q.includes(key)) {
            const map = SEARCH_SYNONYMS[key];
            if (map.aliases) {
              map.aliases.forEach(a => { if (!aliases.includes(a)) aliases.push(a); });
            }
            if (map.related) {
              map.related.forEach(r => { if (!related.includes(r)) related.push(r); });
            }
          }
        });

        const scored = result.map((v) => {
          let score = 0;
          const title = v.title.toLowerCase();
          const perf = v.performer_name?.toLowerCase() || '';
          const desc = v.description?.toLowerCase() || '';

          if (title.includes(q)) score += 100;
          if (perf.includes(q)) score += 95;
          if (desc.includes(q)) score += 80;

          aliases.forEach((alias) => {
            if (title.includes(alias)) score += 50;
            if (perf.includes(alias)) score += 45;
            if (desc.includes(alias)) score += 30;
          });

          related.forEach((rel) => {
            if (title.includes(rel)) score += 10;
            if (perf.includes(rel)) score += 8;
            if (desc.includes(rel)) score += 5;
          });

          return { video: v, score };
        });

        result = scored
          .filter((item) => item.score > 0)
          .sort((a, b) => b.score - a.score)
          .map((item) => item.video);
      }
      if (options?.limit) {
        result = result.slice(0, options.limit);
      }
      return result;
    }

    let targetCatId = options?.categoryId;

    if (!targetCatId && options?.categorySlug) {
      const { data: catDb } = await supabase.from('categories').select('id').eq('slug', options.categorySlug).single();
      if (catDb) {
        targetCatId = catDb.id;
      }
    }

    let query = supabase.from('videos').select('*, category:categories(*)').eq('is_published', true).order('created_at', { ascending: false });

    if (targetCatId) {
      query = query.eq('category_id', targetCatId);
    }
    
    // Check if query is a search query
    const isSearchQuery = Boolean(options?.searchQuery);
    const searchVal = options?.searchQuery ? options.searchQuery.trim().toLowerCase() : '';
    const aliases: string[] = [];
    const related: string[] = [];

    if (isSearchQuery) {
      Object.keys(SEARCH_SYNONYMS).forEach((key) => {
        if (searchVal.includes(key)) {
          const map = SEARCH_SYNONYMS[key];
          if (map.aliases) {
            map.aliases.forEach(a => { if (!aliases.includes(a)) aliases.push(a); });
          }
          if (map.related) {
            map.related.forEach(r => { if (!related.includes(r)) related.push(r); });
          }
        }
      });
      const allTerms = [searchVal, ...aliases, ...related];
      const orConditions = allTerms.map(
        (term) => `title.ilike.%${term}%,performer_name.ilike.%${term}%,description.ilike.%${term}%`
      ).join(',');
      query = query.or(orConditions);
    }

    if (options?.limit && !isSearchQuery) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      if (options?.categorySlug) {
        return generateCategoryVideos(options.categorySlug, options.limit || 120);
      }
      let result = [...MOCK_VIDEOS];
      if (options?.searchQuery) {
        const q = options.searchQuery.toLowerCase().trim();
        const scored = result.map((v) => {
          let score = 0;
          const title = v.title.toLowerCase();
          const perf = v.performer_name?.toLowerCase() || '';
          const desc = v.description?.toLowerCase() || '';

          if (title.includes(q)) score += 100;
          if (perf.includes(q)) score += 95;
          if (desc.includes(q)) score += 80;

          aliases.forEach((alias) => {
            if (title.includes(alias)) score += 50;
            if (perf.includes(alias)) score += 45;
            if (desc.includes(alias)) score += 30;
          });

          related.forEach((rel) => {
            if (title.includes(rel)) score += 10;
            if (perf.includes(rel)) score += 8;
            if (desc.includes(rel)) score += 5;
          });

          return { video: v, score };
        });

        result = scored
          .filter((item) => item.score > 0)
          .sort((a, b) => b.score - a.score)
          .map((item) => item.video);
      }
      if (options?.limit) {
        result = result.slice(0, options.limit);
      }
      return result;
    }

    let finalVideos = data as Video[];
    if (isSearchQuery) {
      const scored = finalVideos.map((v) => {
        let score = 0;
        const title = v.title.toLowerCase();
        const perf = v.performer_name?.toLowerCase() || '';
        const desc = v.description?.toLowerCase() || '';

        if (title.includes(searchVal)) score += 100;
        if (perf.includes(searchVal)) score += 95;
        if (desc.includes(searchVal)) score += 80;

        aliases.forEach((alias) => {
          if (title.includes(alias)) score += 50;
          if (perf.includes(alias)) score += 45;
          if (desc.includes(alias)) score += 30;
        });

        related.forEach((rel) => {
          if (title.includes(rel)) score += 10;
          if (perf.includes(rel)) score += 8;
          if (desc.includes(rel)) score += 5;
        });

        return { video: v, score };
      });

      finalVideos = scored
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((item) => item.video);

      if (options?.limit) {
        finalVideos = finalVideos.slice(0, options.limit);
      }
    }
    return finalVideos;
  } catch {
    if (options?.categorySlug) {
      return generateCategoryVideos(options.categorySlug, options.limit || 120);
    }
    return MOCK_VIDEOS;
  }
}

export async function fetchVideoBySlug(slug: string): Promise<Video | null> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-supabase')) {
      return MOCK_VIDEOS.find((v) => v.slug === slug) || null;
    }
    const { data, error } = await supabase.from('videos').select('*, category:categories(*)').eq('slug', slug).single();
    if (error || !data) {
      return MOCK_VIDEOS.find((v) => v.slug === slug) || null;
    }
    return data as Video;
  } catch {
    return MOCK_VIDEOS.find((v) => v.slug === slug) || null;
  }
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function formatViews(views: number): string {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M views`;
  }
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K views`;
  }
  return `${views} views`;
}

export function getThumbnailUrl(video: Video): string {
  if (!video) {
    return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80';
  }

  // 1. Direct external image URL
  if (video.thumbnail_url && typeof video.thumbnail_url === 'string' && video.thumbnail_url.trim()) {
    let url = video.thumbnail_url.trim();
    if (url.startsWith('//')) {
      url = `https:${url}`;
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
  }

  // 2. R2 object key
  if (video.thumbnail_key && video.thumbnail_key !== 'null' && video.thumbnail_key !== 'undefined') {
    return getPublicMediaUrl(video.thumbnail_key, video.thumbnail_url);
  }

  return video.thumbnail_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80';
}

export function getCategoryCoverUrl(category: Category): string {
  if (!category) {
    return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80';
  }

  // 1. Direct external image URL
  if (category.cover_image_url && typeof category.cover_image_url === 'string' && category.cover_image_url.trim()) {
    let url = category.cover_image_url.trim();
    if (url.startsWith('//')) {
      url = `https:${url}`;
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
  }

  // 2. R2 object key
  if (category.cover_image_key && category.cover_image_key !== 'null' && category.cover_image_key !== 'undefined') {
    return getPublicMediaUrl(category.cover_image_key, category.cover_image_url);
  }

  return category.cover_image_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80';
}

export interface Pornstar {
  id: string;
  name: string;
  slug: string;
  photo_url: string;
  videos_count: number;
}

export const MOCK_PORNSTARS: Pornstar[] = [];
