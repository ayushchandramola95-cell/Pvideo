import { MetadataRoute } from 'next';
import { fetchCategories, fetchVideos } from '@/lib/data';

export async function generateSitemaps() {
  return [
    { id: 'main' },
    { id: 'categories' },
    { id: 'videos' },
  ];
}

export default async function sitemap({
  id,
}: {
  id: string;
}): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pornora.site';

  if (id === 'categories') {
    const { categories } = await fetchCategories({ limit: 1000 });
    return categories.map((cat) => ({
      url: `${baseUrl}/categories/${cat.slug}`,
      lastModified: new Date(cat.updated_at),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));
  }

  if (id === 'videos') {
    const videos = await fetchVideos();
    return videos.map((vid) => ({
      url: `${baseUrl}/watch/${vid.slug}`,
      lastModified: new Date(vid.updated_at),
      changeFrequency: 'daily',
      priority: 0.9,
    }));
  }

  // Fallback for id === 'main' or root
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/pornstars`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];
}
