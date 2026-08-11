import JSZip from 'jszip';
import * as XLSX from 'xlsx';

export interface ParsedRedPornCard {
  title: string;
  gallery_url: string;
  gallery_id: string;
  thumbnail_url: string;
  duration: string;
  performer: string;
  rawHtml?: string;
  missingUrl?: boolean;
  missingPerformer?: boolean;
}

export interface ParseResultLog {
  fileName: string;
  pageNumber: number;
  cardsFound: number;
  cardsImported: number;
  duplicatesSkipped: number;
  missingPerformerCount: number;
  missingDurationCount: number;
  missingUrlCount: number;
  errors: string[];
}

export interface ParseSummaryResult {
  items: ParsedRedPornCard[];
  logs: ParseResultLog[];
  debugCardLogs?: ParsedRedPornCard[];
  debugMissingUrlHtml?: string;
  debugMissingPerformerHtml?: string;
  totalFiles: number;
  totalCardsFound: number;
  totalCardsImported: number;
  totalDuplicatesSkipped: number;
}

/**
 * Extracts page number prefix from filename (e.g., "1Gangbang...html" -> 1, "10Gangbang...html" -> 10)
 * Sorts numerically instead of alphabetically.
 */
export function getPageNumber(filename: string): number {
  const cleanName = filename.split('/').pop() || filename;
  const match = cleanName.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 999999;
}

/**
 * Parses a single RedPorn video card element card-by-card for 100% card independence.
 * Strictly uses RedPorn's exact DOM structure:
 * - Card Container: .b-thumb-item.js-thumb
 * - Title: .b-thumb-item__title
 * - Gallery URL: a.b-thumb-item__link[href]
 * - Gallery ID: a.b-thumb-item__link[data-gallery-id] or numeric ID in URL
 * - Thumbnail: picture img[data-src] (fallback img[src])
 * - Duration: span.duration
 * - Performers: .b-thumb-item__list a.b-thumb-item__cs (joined by ", ")
 */
export function parseVideoCard(cardEl: Element): ParsedRedPornCard | null {
  const rawHtml = cardEl.outerHTML || '';

  // 1. Main Link Element (a.b-thumb-item__link or fallback)
  const linkEl = cardEl.querySelector('a.b-thumb-item__link') || cardEl.querySelector('a[href]');

  // Gallery URL
  let gallery_url = '';
  if (linkEl) {
    const href = linkEl.getAttribute('href') || '';
    if (href && href !== '#' && !href.startsWith('javascript:')) {
      gallery_url = href.startsWith('http') ? href : `https://redporn.porn${href.startsWith('/') ? '' : '/'}${href}`;
    }
  }

  // Fallback Gallery URL search if linkEl missed
  if (!gallery_url) {
    const allAnchors = Array.from(cardEl.querySelectorAll('a[href]'));
    if (cardEl.tagName.toLowerCase() === 'a') allAnchors.unshift(cardEl);
    for (const a of allAnchors) {
      const href = a.getAttribute('href') || '';
      if (href && href !== '#' && !href.startsWith('javascript:')) {
        gallery_url = href.startsWith('http') ? href : `https://redporn.porn${href.startsWith('/') ? '' : '/'}${href}`;
        break;
      }
    }
  }

  // Gallery ID
  let gallery_id =
    linkEl?.getAttribute('data-gallery-id') ||
    linkEl?.getAttribute('data-item-id') ||
    cardEl.getAttribute('data-gallery-id') ||
    cardEl.getAttribute('data-item-id') ||
    '';

  if (!gallery_id && gallery_url) {
    const idMatch = gallery_url.match(/\/(\d{5,15})(?:\?|\/|$)/);
    if (idMatch && idMatch[1]) {
      gallery_id = idMatch[1];
    }
  }

  // 2. Title (.b-thumb-item__title or img alt/title fallback)
  let title = '';
  const titleEl = cardEl.querySelector('.b-thumb-item__title, .title, .video-title, h2, h3');
  if (titleEl) {
    title = titleEl.getAttribute('title') || titleEl.textContent?.trim() || '';
  }

  const imgEl = cardEl.querySelector('picture img, img');
  if (!title && imgEl) {
    title = imgEl.getAttribute('alt') || imgEl.getAttribute('title') || '';
  }

  if (!title && linkEl) {
    title = linkEl.getAttribute('title') || linkEl.textContent?.trim() || '';
  }
  title = title.replace(/\s+/g, ' ').trim();

  // 3. Thumbnail URL (picture img[data-src] or img[src])
  let thumbnail_url = '';
  if (imgEl) {
    thumbnail_url =
      imgEl.getAttribute('data-src') ||
      imgEl.getAttribute('data-original') ||
      imgEl.getAttribute('data-srcset') ||
      imgEl.getAttribute('src') ||
      '';
  }
  if (thumbnail_url && thumbnail_url.startsWith('//')) {
    thumbnail_url = `https:${thumbnail_url}`;
  }

  // 4. Duration (span.duration or fallback)
  let duration = '';
  const durationEl = cardEl.querySelector('span.duration, .duration, .time, .length, [class*="duration"]');
  if (durationEl) {
    duration = durationEl.textContent?.trim() || '';
  }
  if (!duration) {
    const durMatch = (cardEl.textContent || '').match(/\b\d{1,2}:\d{2}(?::\d{2})?\b/);
    if (durMatch) duration = durMatch[0];
  } else {
    const durMatch = duration.match(/\b\d{1,2}:\d{2}(?::\d{2})?\b/);
    if (durMatch) duration = durMatch[0];
  }
  if (!duration) duration = '10:00';

  // 5. Performers (.b-thumb-item__list a.b-thumb-item__cs)
  let performer = '';
  const performerListContainer = cardEl.querySelector('.b-thumb-item__list');
  if (performerListContainer) {
    const performerLinks = Array.from(performerListContainer.querySelectorAll('a.b-thumb-item__cs, a[href]'));
    const performerNames = performerLinks
      .map((a) => a.textContent?.trim() || '')
      .filter((name) => name.length > 0 && !['HD', 'SD', '4K', 'VR'].includes(name));

    // Deduplicate names preserving order
    const uniquePerformers = Array.from(new Set(performerNames));
    performer = uniquePerformers.join(', ');
  }

  // Fallback Performers search if .b-thumb-item__list selector didn't match
  if (!performer) {
    const directPerformerLinks = Array.from(
      cardEl.querySelectorAll('a.b-thumb-item__cs, a[href*="/pornstar/"], a[href*="/performer/"], a[href*="/model/"]')
    );
    const pNames = directPerformerLinks.map((a) => a.textContent?.trim() || '').filter((name) => name.length > 0);
    if (pNames.length > 0) {
      performer = Array.from(new Set(pNames)).join(', ');
    }
  }

  const missingUrl = !gallery_url || !gallery_id;
  const missingPerformer = !performer;

  if (missingUrl && !title) return null; // Unusable card

  return {
    title: title || `Video #${gallery_id || 'Unknown'}`,
    gallery_url: gallery_url || (gallery_id ? `https://redporn.porn/${gallery_id}` : ''),
    gallery_id: gallery_id || '',
    thumbnail_url: thumbnail_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    duration,
    performer,
    rawHtml,
    missingUrl,
    missingPerformer,
  };
}

/**
 * Parses a single HTML string content into card objects.
 */
export function parseHtmlContent(htmlStr: string, fileName: string): { items: ParsedRedPornCard[]; log: ParseResultLog } {
  const pageNum = getPageNumber(fileName);
  const log: ParseResultLog = {
    fileName,
    pageNumber: pageNum,
    cardsFound: 0,
    cardsImported: 0,
    duplicatesSkipped: 0,
    missingPerformerCount: 0,
    missingDurationCount: 0,
    missingUrlCount: 0,
    errors: [],
  };

  const items: ParsedRedPornCard[] = [];

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlStr, 'text/html');

    // Find card elements in DOM order using RedPorn's exact container selectors (.b-thumb-item.js-thumb, .b-thumb-item)
    let cardElements = Array.from(
      doc.querySelectorAll('.b-thumb-item.js-thumb, .b-thumb-item, [data-gallery-id], [data-item-id], .item, .video-card, .gallery-item, .thumb-block, article')
    );

    // Fallback if generic card wrappers
    if (cardElements.length === 0) {
      const allLinks = Array.from(
        doc.querySelectorAll('a[href*="/1"], a[href*="/2"], a[href*="/3"], a[href*="/4"], a[href*="/5"], a[href*="/6"], a[href*="/7"], a[href*="/8"], a[href*="/9"]')
      );
      const cardParents = new Set<Element>();
      for (const l of allLinks) {
        const parent = l.closest('.b-thumb-item, .item, div, article, li') || l.parentElement;
        if (parent) cardParents.add(parent);
      }
      cardElements = Array.from(cardParents);
    }

    log.cardsFound = cardElements.length;

    for (const cardEl of cardElements) {
      try {
        const parsed = parseVideoCard(cardEl);
        if (parsed) {
          if (parsed.missingPerformer) log.missingPerformerCount++;
          if (!parsed.duration || parsed.duration === '10:00') log.missingDurationCount++;
          if (parsed.missingUrl) log.missingUrlCount++;
          items.push(parsed);
        }
      } catch (err: any) {
        log.errors.push(`Card parse error: ${err.message}`);
      }
    }
  } catch (err: any) {
    log.errors.push(`HTML parse fatal error: ${err.message}`);
  }

  log.cardsImported = items.length;
  return { items, log };
}

/**
 * Processes multiple HTML files numerically and deduplicates by Gallery ID.
 * Supports DEBUG Mode (process ONLY 1st HTML file and ONLY first 10 cards).
 */
export function processHtmlFilesList(
  filesList: { name: string; content: string }[],
  isDebugMode: boolean = false
): ParseSummaryResult {
  // Sort files numerically by page number
  const sortedFiles = [...filesList].sort((a, b) => getPageNumber(a.name) - getPageNumber(b.name));

  const seenGalleryIds = new Set<string>();
  const finalItems: ParsedRedPornCard[] = [];
  const logs: ParseResultLog[] = [];
  const debugCardLogs: ParsedRedPornCard[] = [];

  let missingUrlHtmlDump = '';
  let missingPerformerHtmlDump = '';

  let totalCardsFound = 0;
  let totalCardsImported = 0;
  let totalDuplicatesSkipped = 0;

  // If Debug Mode enabled, process ONLY the first file
  const filesToProcess = isDebugMode ? sortedFiles.slice(0, 1) : sortedFiles;

  for (const file of filesToProcess) {
    const { items, log } = parseHtmlContent(file.content, file.name);
    totalCardsFound += log.cardsFound;

    let fileImportedCount = 0;
    let fileDupCount = 0;

    // If Debug Mode enabled, limit to FIRST 10 CARDS
    const itemsToIterate = isDebugMode ? items.slice(0, 10) : items;

    for (const item of itemsToIterate) {
      if (isDebugMode) {
        debugCardLogs.push(item);
        if (item.missingUrl && item.rawHtml) {
          missingUrlHtmlDump += `<!-- Missing Gallery URL Card -->\n${item.rawHtml}\n\n`;
        }
        if (item.missingPerformer && item.rawHtml) {
          missingPerformerHtmlDump += `<!-- Missing Performer Card -->\n${item.rawHtml}\n\n`;
        }
      }

      if (seenGalleryIds.has(item.gallery_id)) {
        fileDupCount++;
        totalDuplicatesSkipped++;
      } else {
        seenGalleryIds.add(item.gallery_id);
        finalItems.push(item);
        fileImportedCount++;
      }
    }

    log.cardsImported = fileImportedCount;
    log.duplicatesSkipped = fileDupCount;
    logs.push(log);

    totalCardsImported += fileImportedCount;
  }

  return {
    items: finalItems,
    logs,
    debugCardLogs,
    debugMissingUrlHtml: missingUrlHtmlDump,
    debugMissingPerformerHtml: missingPerformerHtmlDump,
    totalFiles: filesToProcess.length,
    totalCardsFound,
    totalCardsImported,
    totalDuplicatesSkipped,
  };
}

/**
 * Extracts and parses a .zip file containing category HTML files.
 */
export async function parseZipFile(zipBlob: Blob, isDebugMode: boolean = false): Promise<ParseSummaryResult> {
  const zip = new JSZip();
  const unzipped = await zip.loadAsync(zipBlob);

  const filePromises: Promise<{ name: string; content: string }>[] = [];

  unzipped.forEach((relativePath, fileObj) => {
    if (!fileObj.dir && (relativePath.endsWith('.html') || relativePath.endsWith('.htm'))) {
      filePromises.push(
        fileObj.async('text').then((content) => ({
          name: relativePath,
          content,
        }))
      );
    }
  });

  const filesList = await Promise.all(filePromises);
  return processHtmlFilesList(filesList, isDebugMode);
}

/**
 * Exports parsed rows to Excel .xlsx format matching exact column specifications:
 * Title, Gallery URL, Gallery ID, Thumbnail URL, Duration, Primary Performer
 */
export function exportExcelFile(items: ParsedRedPornCard[], fileNamePrefix: string = 'RedPorn_Category_Export') {
  const rows = items.map((item) => ({
    Title: item.title,
    'Gallery URL': item.gallery_url,
    'Gallery ID': item.gallery_id,
    'Thumbnail URL': item.thumbnail_url,
    Duration: item.duration,
    'Primary Performer': item.performer,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Category Videos');

  const nowStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `${fileNamePrefix}_${nowStr}.xlsx`);
}

/**
 * Downloads a raw HTML text dump file for debugging missing URLs or missing Performers.
 */
export function downloadDebugHtmlFile(htmlContent: string, fileName: string) {
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
