import { MetadataRoute } from 'next';
import { fetchCategories, fetchVideos, fetchAllPornstars } from '@/lib/data';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pornora.site';

  // 1. Static/Main dynamic routes
  const mainUrls = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'always' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/pornstars`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ];

  // 2. Dynamic Categories detail routes
  let categoryUrls: MetadataRoute.Sitemap = [];
  try {
    const { categories } = await fetchCategories({ limit: 1000 });
    categoryUrls = categories.map((cat) => ({
      url: `${baseUrl}/categories/${cat.slug}`,
      lastModified: cat.updated_at ? new Date(cat.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch (err) {
    console.error('Error fetching categories for sitemap:', err);
  }

  // 3. Dynamic Video Watch details routes
  let videoUrls: MetadataRoute.Sitemap = [];
  try {
    const videos = await fetchVideos();
    videoUrls = videos.map((vid) => ({
      url: `${baseUrl}/watch/${vid.slug}`,
      lastModified: vid.updated_at ? new Date(vid.updated_at) : new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    }));
  } catch (err) {
    console.error('Error fetching videos for sitemap:', err);
  }

  // 4. Dynamic Pornstar Profile routes
  let pornstarUrls: MetadataRoute.Sitemap = [];
  try {
    const pornstars = await fetchAllPornstars();
    pornstarUrls = pornstars.map((ps) => ({
      url: `${baseUrl}/pornstars/${ps.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch (err) {
    console.error('Error fetching pornstars for sitemap:', err);
  }

  return [...mainUrls, ...categoryUrls, ...videoUrls, ...pornstarUrls];
}
