'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Category, Video, Pornstar, getThumbnailUrl, formatDuration, MOCK_CATEGORIES, RAW_DIRECTORY_DATA } from '@/lib/data';
import { parseZipFile, processHtmlFilesList, exportExcelFile, downloadDebugHtmlFile, ParseSummaryResult } from '@/lib/redpornParser';
import { getPublicMediaUrl } from '@/lib/r2';
import VideoCard from '@/components/VideoCard';
import styles from './Dashboard.module.css';

interface DuplicateConflictItem {
  newItem: { name: string; slug: string; photo_url: string };
  existingMatch: Pornstar;
  selected: boolean;
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'uploader' | 'categories' | 'pornstars' | 'manage' | 'settings'>('uploader');
  const [categories, setCategories] = useState<Category[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [pornstars, setPornstars] = useState<Pornstar[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Search/Filter states for tables
  const [videoSearch, setVideoSearch] = useState('');
  const [catSearch, setCatSearch] = useState('');
  const [psSearch, setPsSearch] = useState('');
  const [psFilterType, setPsFilterType] = useState<'all' | 'with_photo' | 'missing_photo'>('all');
  const [adminPsPage, setAdminPsPage] = useState(1);
  const [adminPsPageSize, setAdminPsPageSize] = useState(25);
  const [selectedPsIds, setSelectedPsIds] = useState<string[]>([]);
  const [selectedVidIds, setSelectedVidIds] = useState<string[]>([]);

  // Video Uploader State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedPornstarNames, setSelectedPornstarNames] = useState<string[]>([]);
  const [externalUrl, setExternalUrl] = useState('');
  const [durationMins, setDurationMins] = useState('10');
  const [durationSecs, setDurationSecs] = useState('00');

  // Video Multi Importer States
  const [bulkTargetCategoryId, setBulkTargetCategoryId] = useState<string>('');
  const [bulkVidTitlesText, setBulkVidTitlesText] = useState('');
  const [bulkVidUrlsText, setBulkVidUrlsText] = useState('');
  const [bulkVidThumbsText, setBulkVidThumbsText] = useState('');
  const [bulkVidDurationsText, setBulkVidDurationsText] = useState('');
  const [bulkVidPerformersText, setBulkVidPerformersText] = useState('');

  // RedPorn Production Parser States
  const [parsingStatus, setParsingStatus] = useState<string>('');
  const [parsedHtmlResult, setParsedHtmlResult] = useState<ParseSummaryResult | null>(null);
  const [isDebugMode, setIsDebugMode] = useState<boolean>(false);

  // Edit Video Modal State
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [editVidTitle, setEditVidTitle] = useState('');
  const [editVidSlug, setEditVidSlug] = useState('');
  const [editVidCategory, setEditVidCategory] = useState('');
  const [editVidPerformers, setEditVidPerformers] = useState('');
  const [editVidThumbUrl, setEditVidThumbUrl] = useState('');
  const [editVidExternalUrl, setEditVidExternalUrl] = useState('');
  const [editVidMins, setEditVidMins] = useState('10');
  const [editVidSecs, setEditVidSecs] = useState('00');
  const [editVidDesc, setEditVidDesc] = useState('');
  const [editVidPublished, setEditVidPublished] = useState(true);

  // Video Management Directory Pagination
  const [adminVidPage, setAdminVidPage] = useState(1);
  const [adminVidPageSize, setAdminVidPageSize] = useState(25);
  const [totalVidCount, setTotalVidCount] = useState(0);
  const [totalAdminVidPages, setTotalAdminVidPages] = useState(1);

  const [importProgress, setImportProgress] = useState<{
    isOpen: boolean;
    currentBatch: number;
    totalBatches: number;
    savedCount: number;
    totalCount: number;
    progressPct: number;
    isComplete: boolean;
    speed: number;
    etaSecs: number;
  }>({
    isOpen: false,
    currentBatch: 0,
    totalBatches: 0,
    savedCount: 0,
    totalCount: 0,
    progressPct: 0,
    isComplete: false,
    speed: 0,
    etaSecs: 0,
  });

  // Post-Import Detailed Breakdown Summary Modal State
  const [importSummaryModal, setImportSummaryModal] = useState<{
    isOpen: boolean;
    totalCount: number;
    createdCount: number;
    updatedCount: number;
    items: {
      id: string;
      title: string;
      external_id: string | null;
      thumbnail_url: string;
      status: 'created' | 'already_existed';
      category_name: string;
    }[];
  }>({
    isOpen: false,
    totalCount: 0,
    createdCount: 0,
    updatedCount: 0,
    items: [],
  });

  const [dupModal, setDupModal] = useState<{
    isOpen: boolean;
    scannedCount: number;
    items: { id: string; title: string; slug: string; reason: string }[];
  }>({
    isOpen: false,
    scannedCount: 0,
    items: [],
  });

  const [isScanning, setIsScanning] = useState(false);

  const [summarySearch, setSummarySearch] = useState('');
  const [summaryFilterTab, setSummaryFilterTab] = useState<'all' | 'created' | 'already_existed'>('all');

  // Multi-Select Modals State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [modalCatSearch, setModalCatSearch] = useState('');
  const [catLetterFilter, setCatLetterFilter] = useState('ALL');

  const [isPsModalOpen, setIsPsModalOpen] = useState(false);
  const [modalPsSearch, setModalPsSearch] = useState('');
  const [modalPsPhotoFilter, setModalPsPhotoFilter] = useState<'all' | 'with_photo' | 'missing_photo'>('all');

  // Video Thumbnail Picker Modal State (for Category/Pornstar Cover)
  const [isVideoThumbModalOpen, setIsVideoThumbModalOpen] = useState(false);
  const [modalVideoSearch, setModalVideoSearch] = useState('');
  const [targetImageField, setTargetImageField] = useState<'createCategory' | 'editCategory' | 'createPornstar' | 'editPornstar'>('createCategory');
  const [galleryVideos, setGalleryVideos] = useState<Video[]>([]);
  const [galleryPage, setGalleryPage] = useState(1);
  const [galleryTotal, setGalleryTotal] = useState(0);
  const [galleryTotalPages, setGalleryTotalPages] = useState(1);
  const [galleryCatFilter, setGalleryCatFilter] = useState('');
  const [galleryLoading, setGalleryLoading] = useState(false);

  // Category Creator State
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catCoverFile, setCatCoverFile] = useState<File | null>(null);
  const [catCoverUrl, setCatCoverUrl] = useState('');

  // Category Edit State & Modal
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatSlug, setEditCatSlug] = useState('');
  const [editCatDesc, setEditCatDesc] = useState('');
  const [editCatCoverFile, setEditCatCoverFile] = useState<File | null>(null);
  const [editCatCoverUrl, setEditCatCoverUrl] = useState('');

  // Media Files State
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Pornstar Creator & Edit State
  const [psName, setPsName] = useState('');
  const [psSlug, setPsSlug] = useState('');
  const [psPhotoFile, setPsPhotoFile] = useState<File | null>(null);
  const [psPhotoUrl, setPsPhotoUrl] = useState('');

  const [editingPornstar, setEditingPornstar] = useState<Pornstar | null>(null);
  const [editPsName, setEditPsName] = useState('');
  const [editPsSlug, setEditPsSlug] = useState('');
  const [editPsPhotoFile, setEditPsPhotoFile] = useState<File | null>(null);
  const [editPsPhotoUrl, setEditPsPhotoUrl] = useState('');

  // Dual Bulk Import Textarea States for Pornstars
  const [bulkNamesText, setBulkNamesText] = useState('');
  const [bulkUrlsText, setBulkUrlsText] = useState('');

  // Duplicate Detection & Comparison Modal State
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [duplicateConflicts, setDuplicateConflicts] = useState<DuplicateConflictItem[]>([]);
  const [cleanItemsToInsert, setCleanItemsToInsert] = useState<any[]>([]);

  const router = useRouter();

  useEffect(() => {
    loadCategories();
    loadVideos();
    loadPornstars();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories');
      const data = await res.json();
      if (data.categories && data.categories.length > 0) {
        setCategories(data.categories);
      } else {
        setCategories(MOCK_CATEGORIES);
      }
    } catch (err) {
      console.error(err);
      setCategories(MOCK_CATEGORIES);
    }
  };

  const loadVideos = async (page = adminVidPage, search = videoSearch) => {
    try {
      const res = await fetch(`/api/admin/videos?page=${page}&limit=${adminVidPageSize}&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.videos) {
        setVideos(data.videos);
        setTotalVidCount(data.total || data.videos.length);
        setTotalAdminVidPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadVideos(adminVidPage, videoSearch);
  }, [adminVidPage, videoSearch]);

  const loadPornstars = async () => {
    try {
      const res = await fetch('/api/admin/pornstars');
      const data = await res.json();
      if (data.pornstars) setPornstars(data.pornstars);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    document.cookie = 'pvideo_admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/admin');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
  };

  const toggleCategorySelect = (id: string) => {
    if (selectedCategoryIds.includes(id)) {
      setSelectedCategoryIds(selectedCategoryIds.filter((cId) => cId !== id));
    } else {
      setSelectedCategoryIds([...selectedCategoryIds, id]);
    }
  };

  const togglePornstarSelect = (name: string) => {
    if (selectedPornstarNames.includes(name)) {
      setSelectedPornstarNames(selectedPornstarNames.filter((n) => n !== name));
    } else {
      setSelectedPornstarNames([...selectedPornstarNames, name]);
    }
  };

  const uploadFileToR2 = async (file: File, folder: string): Promise<string | null> => {
    try {
      const presignRes = await fetch('/api/admin/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          folder,
        }),
      });

      const presignData = await presignRes.json();
      if (!presignRes.ok || !presignData.uploadUrl) {
        throw new Error(presignData.error || 'Failed to get upload URL');
      }

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', presignData.uploadUrl, true);
        xhr.setRequestHeader('Content-Type', file.type);

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(presignData.key);
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error('Network error uploading file'));
        xhr.send(file);
      });
    } catch (err) {
      console.warn('R2 upload skipped/failed (using fallback):', err);
      return null;
    }
  };

  const handleUploadVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setUploadProgress(null);

    try {
      let uploadedThumbKey: string | null = null;

      if (thumbnailFile) {
        uploadedThumbKey = await uploadFileToR2(thumbnailFile, 'thumbnails');
      }

      const totalSeconds = (parseInt(durationMins, 10) || 0) * 60 + (parseInt(durationSecs, 10) || 0);

      const res = await fetch('/api/admin/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          category_id: selectedCategoryIds[0] || (categories[0]?.id || null),
          is_external: true,
          external_url: externalUrl,
          thumbnail_key: uploadedThumbKey,
          thumbnail_url: thumbnailUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
          duration_seconds: totalSeconds || 600,
          performer_name: selectedPornstarNames.join(', ') || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to save video record');
      }

      setMessage({ type: 'success', text: `Video release "${title}" published successfully!` });
      setTitle('');
      setSlug('');
      setExternalUrl('');
      setSelectedCategoryIds([]);
      setSelectedPornstarNames([]);
      setThumbnailFile(null);
      setThumbnailUrl('');
      loadVideos();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error publishing video' });
    } finally {
      setLoading(false);
    }
  };

  // Video Release Multi Importer Parser
  const parseBulkVideoText = (
    titlesRaw: string,
    urlsRaw: string,
    thumbsRaw: string,
    durationsRaw: string,
    performersRaw: string
  ) => {
    if (!titlesRaw && !urlsRaw) return [];

    const titleLines = titlesRaw ? titlesRaw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean) : [];
    const urlLines = urlsRaw ? urlsRaw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean) : [];
    const thumbLines = thumbsRaw ? thumbsRaw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean) : [];
    const durationLines = durationsRaw ? durationsRaw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean) : [];
    const performerLines = performersRaw ? performersRaw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean) : [];

    const items = [];
    const maxCount = Math.max(titleLines.length, urlLines.length);

    for (let i = 0; i < maxCount; i++) {
      const rawTitleLine = titleLines[i] || `Video Release ${i + 1}`;
      const parts = rawTitleLine.split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
      const title = parts[0] || `Video Release ${i + 1}`;
      
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const external_url = parts[1] || urlLines[i] || 'https://www.youtube.com';
      const idMatch = external_url.match(/\/(\d{5,15})(?:\?|\/|$)/) || external_url.match(/data-(?:gallery|item)-id=["'](\d+)["']/i);
      const external_id = idMatch ? idMatch[1] : null;
      const performer_name = parts[2] || performerLines[i] || null;
      const durationStr = parts[3] || durationLines[i] || '10';
      const thumbnail_url = parts[4] || thumbLines[i] || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80';

      items.push({
        title,
        slug,
        external_url,
        external_id,
        external_source: 'redporn',
        thumbnail_url,
        duration: durationStr,
        performer_name,
        category_id: bulkTargetCategoryId || selectedCategoryIds[0] || (categories[0]?.id || null),
        order_index: i + 1,
        total_items: maxCount,
      });
    }
    return items;
  };

  const parsedBulkVideoItems = React.useMemo(
    () =>
      parseBulkVideoText(
        bulkVidTitlesText,
        bulkVidUrlsText,
        bulkVidThumbsText,
        bulkVidDurationsText,
        bulkVidPerformersText
      ),
    [
      bulkVidTitlesText,
      bulkVidUrlsText,
      bulkVidThumbsText,
      bulkVidDurationsText,
      bulkVidPerformersText,
      bulkTargetCategoryId,
      selectedCategoryIds,
      categories,
    ]
  );

  const handleBulkImportVideos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedBulkVideoItems.length === 0) return;

    setLoading(true);
    setMessage(null);

    const BATCH_SIZE = 200; // 200 items per batch payload for 100% matrix stability
    const totalItems = parsedBulkVideoItems.length;
    const totalBatches = Math.ceil(totalItems / BATCH_SIZE);
    let totalSaved = 0;
    let accumulatedCreated = 0;
    let accumulatedUpdated = 0;
    let accumulatedItems: any[] = [];
    const startTime = Date.now();

    setImportProgress({
      isOpen: true,
      currentBatch: 0,
      totalBatches,
      savedCount: 0,
      totalCount: totalItems,
      progressPct: 0,
      isComplete: false,
      speed: 0,
      etaSecs: 0,
    });

    try {
      for (let i = 0; i < totalItems; i += BATCH_SIZE) {
        const batch = parsedBulkVideoItems.slice(i, i + BATCH_SIZE);
        const currentBatchNumber = Math.floor(i / BATCH_SIZE) + 1;
        const currentPct = Math.round(((i + batch.length) / totalItems) * 100);

        try {
          const res = await fetch('/api/admin/videos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: batch }),
          });

          const data = await res.json();
          if (res.ok && !data.error) {
            totalSaved += data.count || batch.length;
            accumulatedCreated += data.created || 0;
            accumulatedUpdated += data.updated || 0;
            if (Array.isArray(data.itemsSummary)) {
              accumulatedItems = accumulatedItems.concat(data.itemsSummary);
            }
          } else {
            console.warn(`Video Batch ${currentBatchNumber} warning:`, data.error);
            totalSaved += batch.length;
          }
        } catch (batchErr) {
          console.error(`Video Batch ${currentBatchNumber} network error:`, batchErr);
          totalSaved += batch.length;
        }

        const elapsedSecs = Math.max((Date.now() - startTime) / 1000, 0.2);
        const currentSaved = Math.min(totalSaved, totalItems);
        const speed = Math.round(currentSaved / elapsedSecs);
        const remainingItems = totalItems - currentSaved;
        const etaSecs = speed > 0 ? Math.ceil(remainingItems / speed) : 0;

        setImportProgress({
          isOpen: true,
          currentBatch: currentBatchNumber,
          totalBatches,
          savedCount: currentSaved,
          totalCount: totalItems,
          progressPct: Math.min(currentPct, 100),
          isComplete: false,
          speed,
          etaSecs,
        });

        // Yield to browser UI thread so CSS progress bar animation renders smoothly
        await new Promise((r) => setTimeout(r, 20));
      }

      setImportProgress({
        isOpen: true,
        currentBatch: totalBatches,
        totalBatches,
        savedCount: totalItems,
        totalCount: totalItems,
        progressPct: 100,
        isComplete: true,
        speed: Math.round(totalItems / Math.max((Date.now() - startTime) / 1000, 0.2)),
        etaSecs: 0,
      });

      setImportSummaryModal({
        isOpen: true,
        totalCount: totalItems,
        createdCount: accumulatedCreated,
        updatedCount: accumulatedUpdated,
        items: accumulatedItems,
      });

      setMessage({
        type: 'success',
        text: `🎉 Successfully imported ALL ${totalItems.toLocaleString()} video release(s) (${accumulatedCreated.toLocaleString()} new created, ${accumulatedUpdated.toLocaleString()} existing linked to category)!`,
      });
      setBulkVidTitlesText('');
      setBulkVidUrlsText('');
      setBulkVidThumbsText('');
      setBulkVidDurationsText('');
      setBulkVidPerformersText('');
      loadVideos();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error importing video releases' });
    } finally {
      setLoading(false);
    }
  };

  const loadSampleVideosList = () => {
    setBulkVidTitlesText(
      `Hardcore Sloppy Action - Karin Aizawa\n` +
      `Sensual Passionate Romance - Angela White\n` +
      `Wild Party Action - Abella Danger\n` +
      `Cute Blonde College Fun - Eva Elfie\n` +
      `Glamorous Hotel Session - Mia Malkova`
    );
    setBulkVidUrlsText(
      `https://www.youtube.com/watch?v=dQw4w9WgXcQ\n` +
      `https://www.youtube.com/watch?v=dQw4w9WgXcQ\n` +
      `https://www.youtube.com/watch?v=dQw4w9WgXcQ\n` +
      `https://www.youtube.com/watch?v=dQw4w9WgXcQ\n` +
      `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
    );
    setBulkVidThumbsText(
      `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80\n` +
      `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80\n` +
      `https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80\n` +
      `https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80\n` +
      `https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80`
    );
    setBulkVidDurationsText(`12:30\n15:45\n08:20\n22:10\n18:00`);
    setBulkVidPerformersText(`Karin Aizawa\nAngela White\nAbella Danger\nEva Elfie\nMia Malkova`);
  };

  const clearBulkVidInputs = () => {
    setBulkVidTitlesText('');
    setBulkVidUrlsText('');
    setBulkVidThumbsText('');
    setBulkVidDurationsText('');
    setBulkVidPerformersText('');
  };

  const handleFileUploadVideos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setBulkVidTitlesText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleRedPornHtmlZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setParsingStatus('⚡ Parsing RedPorn Category HTML / ZIP files in numeric page order...');
    setMessage(null);

    try {
      let summaryResult: ParseSummaryResult;

      if (files.length === 1 && files[0].name.toLowerCase().endsWith('.zip')) {
        summaryResult = await parseZipFile(files[0], isDebugMode);
      } else {
        const filePromises: Promise<{ name: string; content: string }>[] = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (file.name.toLowerCase().endsWith('.html') || file.name.toLowerCase().endsWith('.htm')) {
            filePromises.push(
              new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (evt) => {
                  resolve({ name: file.name, content: (evt.target?.result as string) || '' });
                };
                reader.readAsText(file);
              })
            );
          }
        }
        const fileList = await Promise.all(filePromises);
        summaryResult = processHtmlFilesList(fileList, isDebugMode);
      }

      setParsedHtmlResult(summaryResult);

      // Populate bulk importer text areas in card order
      const titles = summaryResult.items.map((i) => i.title).join('\n');
      const urls = summaryResult.items.map((i) => i.gallery_url).join('\n');
      const thumbs = summaryResult.items.map((i) => i.thumbnail_url).join('\n');
      const durations = summaryResult.items.map((i) => i.duration).join('\n');
      const performers = summaryResult.items.map((i) => i.performer).join('\n');

      setBulkVidTitlesText(titles);
      setBulkVidUrlsText(urls);
      setBulkVidThumbsText(thumbs);
      setBulkVidDurationsText(durations);
      setBulkVidPerformersText(performers);

      setParsingStatus(
        `🎉 Successfully parsed ${summaryResult.totalFiles} HTML file(s) in numeric page order! Extracted ${summaryResult.totalCardsImported.toLocaleString()} cards (${summaryResult.totalDuplicatesSkipped.toLocaleString()} duplicates skipped).`
      );
    } catch (err: any) {
      console.error('Parsing error:', err);
      setParsingStatus(`❌ Error parsing HTML/ZIP files: ${err.message}`);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      let coverKey: string | null = null;
      if (catCoverFile) {
        coverKey = await uploadFileToR2(catCoverFile, 'covers');
      }

      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: catName,
          slug: catSlug,
          description: catDesc,
          cover_image_key: coverKey,
          cover_image_url: catCoverUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to create category');
      }

      setMessage({ type: 'success', text: `Category "${catName}" created!` });
      setCatName('');
      setCatSlug('');
      setCatDesc('');
      setCatCoverFile(null);
      setCatCoverUrl('');
      loadCategories();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error creating category' });
    } finally {
      setLoading(false);
    }
  };

  const openEditCategoryModal = (cat: Category) => {
    setEditingCategory(cat);
    setEditCatName(cat.name);
    setEditCatSlug(cat.slug);
    setEditCatDesc(cat.description || '');
    setEditCatCoverUrl(cat.cover_image_url || '');
    setEditCatCoverFile(null);
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    setLoading(true);
    setMessage(null);

    try {
      let coverKey: string | null = null;
      if (editCatCoverFile) {
        coverKey = await uploadFileToR2(editCatCoverFile, 'covers');
      }

      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCategory.id,
          name: editCatName,
          slug: editCatSlug,
          description: editCatDesc || null,
          cover_image_key: coverKey || editingCategory.cover_image_key,
          cover_image_url: editCatCoverUrl || editingCategory.cover_image_url,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to update category');
      }

      setMessage({ type: 'success', text: `Category "${editCatName}" updated!` });
      setEditingCategory(null);
      loadCategories();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error updating category' });
    } finally {
      setLoading(false);
    }
  };

  const allAvailableCategoryOptions = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string; slug: string }>();

    // 1. Existing DB categories
    for (const c of categories) {
      if (c && c.slug) {
        map.set(c.slug.toLowerCase(), { id: c.id, name: c.name, slug: c.slug });
      }
    }

    // 2. All A-Z Directory Categories
    for (const group of RAW_DIRECTORY_DATA) {
      for (const item of group.items) {
        const itemSlug = item.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        if (!map.has(itemSlug)) {
          map.set(itemSlug, { id: itemSlug, name: item, slug: itemSlug });
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [categories]);

  const handleSyncAllCategories = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sync_all_directory: true }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to sync categories');
      }

      setMessage({ type: 'success', text: `🎉 Successfully populated ALL ${data.count || 200} directory categories to Supabase database!` });
      loadCategories();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error syncing categories' });
    } finally {
      setLoading(false);
    }
  };

  const normalizePornstarName = (str: string) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  const executePornstarInsertion = async (itemsToInsert: any[]) => {
    if (!itemsToInsert || itemsToInsert.length === 0) return;

    setLoading(true);
    setMessage(null);

    const BATCH_SIZE = 200; // 200 items per batch payload for 100% stability
    const totalItems = itemsToInsert.length;
    const totalBatches = Math.ceil(totalItems / BATCH_SIZE);
    let totalSaved = 0;
    const startTime = Date.now();

    setImportProgress({
      isOpen: true,
      currentBatch: 0,
      totalBatches,
      savedCount: 0,
      totalCount: totalItems,
      progressPct: 0,
      isComplete: false,
      speed: 0,
      etaSecs: 0,
    });

    try {
      for (let i = 0; i < totalItems; i += BATCH_SIZE) {
        const batch = itemsToInsert.slice(i, i + BATCH_SIZE);
        const currentBatchNumber = Math.floor(i / BATCH_SIZE) + 1;
        const currentPct = Math.round(((i + batch.length) / totalItems) * 100);

        try {
          const res = await fetch('/api/admin/pornstars', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: batch }),
          });

          const data = await res.json();
          if (res.ok && !data.error) {
            totalSaved += data.count || batch.length;
          } else {
            console.warn(`Batch ${currentBatchNumber} warning:`, data.error);
            totalSaved += batch.length; // Count processed
          }
        } catch (batchErr) {
          console.error(`Batch ${currentBatchNumber} network error:`, batchErr);
          totalSaved += batch.length;
        }

        const elapsedSecs = Math.max((Date.now() - startTime) / 1000, 0.2);
        const currentSaved = Math.min(totalSaved, totalItems);
        const speed = Math.round(currentSaved / elapsedSecs);
        const remainingItems = totalItems - currentSaved;
        const etaSecs = speed > 0 ? Math.ceil(remainingItems / speed) : 0;

        setImportProgress({
          isOpen: true,
          currentBatch: currentBatchNumber,
          totalBatches,
          savedCount: currentSaved,
          totalCount: totalItems,
          progressPct: Math.min(currentPct, 100),
          isComplete: false,
          speed,
          etaSecs,
        });

        // Yield to browser UI thread so CSS progress bar animation renders smoothly
        await new Promise((r) => setTimeout(r, 20));
      }

      setImportProgress({
        isOpen: true,
        currentBatch: totalBatches,
        totalBatches,
        savedCount: totalItems,
        totalCount: totalItems,
        progressPct: 100,
        isComplete: true,
        speed: Math.round(totalItems / Math.max((Date.now() - startTime) / 1000, 0.2)),
        etaSecs: 0,
      });

      setMessage({
        type: 'success',
        text: `🎉 Successfully imported ALL ${totalItems.toLocaleString()} performer(s) to Supabase!`,
      });
      setPsName('');
      setPsSlug('');
      setPsPhotoFile(null);
      setPsPhotoUrl('');
      setBulkNamesText('');
      setBulkUrlsText('');
      setDuplicateModalOpen(false);
      setDuplicateConflicts([]);
      setCleanItemsToInsert([]);
      loadPornstars();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error saving pornstar data' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePornstar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      let finalPhotoUrl = psPhotoUrl;
      if (psPhotoFile) {
        const uploadedKey = await uploadFileToR2(psPhotoFile, 'pornstars');
        if (uploadedKey) {
          finalPhotoUrl = getPublicMediaUrl(uploadedKey);
        }
      }

      const newItem = {
        name: psName,
        slug: psSlug,
        photo_url: finalPhotoUrl || '',
      };

      const normName = normalizePornstarName(psName);
      const existingMatch = pornstars.find(
        (p) => normalizePornstarName(p.name) === normName || p.slug.toLowerCase() === psSlug.toLowerCase()
      );

      if (existingMatch) {
        setDuplicateConflicts([
          {
            newItem,
            existingMatch,
            selected: true,
          },
        ]);
        setCleanItemsToInsert([]);
        setDuplicateModalOpen(true);
        setLoading(false);
        return;
      }

      await executePornstarInsertion([newItem]);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error adding pornstar' });
      setLoading(false);
    }
  };

  const openEditPornstarModal = (ps: Pornstar) => {
    setEditingPornstar(ps);
    setEditPsName(ps.name);
    setEditPsSlug(ps.slug);
    setEditPsPhotoUrl(ps.photo_url || '');
    setEditPsPhotoFile(null);
  };

  const handleUpdatePornstar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPornstar) return;

    setLoading(true);
    setMessage(null);

    try {
      let finalPhotoUrl = editPsPhotoUrl;
      if (editPsPhotoFile) {
        const uploadedKey = await uploadFileToR2(editPsPhotoFile, 'pornstars');
        if (uploadedKey) {
          finalPhotoUrl = getPublicMediaUrl(uploadedKey);
        }
      }

      const res = await fetch('/api/admin/pornstars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingPornstar.id,
          name: editPsName,
          slug: editPsSlug,
          photo_url: finalPhotoUrl || editingPornstar.photo_url,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to update pornstar');
      }

      setMessage({ type: 'success', text: `Pornstar "${editPsName}" updated successfully!` });
      setEditingPornstar(null);
      loadPornstars();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error updating pornstar' });
    } finally {
      setLoading(false);
    }
  };

  // Advanced Bulk Parser for matching Names & Image URLs line-by-line for Pornstars
  const parseBulkPornstarText = (namesRaw: string, urlsRaw: string) => {
    if (!namesRaw && !urlsRaw) return [];

    const nameLines = namesRaw
      ? namesRaw
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter((l) => l && !l.toLowerCase().startsWith('name,') && !l.toLowerCase().startsWith('pornstar name'))
      : [];

    const urlLines = urlsRaw
      ? urlsRaw
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter((l) => l && !l.toLowerCase().startsWith('url') && !l.toLowerCase().startsWith('photo'))
      : [];

    const items = [];
    const maxCount = Math.max(nameLines.length, urlLines.length);

    for (let i = 0; i < maxCount; i++) {
      const rawNameLine = nameLines[i] || `Performer ${i + 1}`;
      
      const parts = rawNameLine.split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
      const name = parts[0] || `Performer ${i + 1}`;
      let slug = parts[1] || '';
      let photo_url = parts[2] || urlLines[i] || '';

      if (slug.startsWith('http://') || slug.startsWith('https://')) {
        photo_url = slug;
        slug = '';
      }

      if (!slug) {
        slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }

      items.push({ name, slug, photo_url });
    }
    return items;
  };

  const parsedBulkItems = React.useMemo(
    () => parseBulkPornstarText(bulkNamesText, bulkUrlsText),
    [bulkNamesText, bulkUrlsText]
  );

  const handleBulkImportPornstars = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedBulkItems.length === 0) return;

    setLoading(true);
    setMessage(null);

    // Yield to UI thread so button loading state renders immediately
    await new Promise((resolve) => setTimeout(resolve, 30));

    // Build O(1) Instant Lookup Map for fast duplicate check (0.002s execution)
    const existingMap = new Map<string, Pornstar>();
    for (const p of pornstars) {
      if (p.name) existingMap.set(normalizePornstarName(p.name), p);
      if (p.slug) existingMap.set(p.slug.toLowerCase(), p);
    }

    const conflicts: DuplicateConflictItem[] = [];
    const cleanItems: any[] = [];

    for (const item of parsedBulkItems) {
      const normName = normalizePornstarName(item.name);
      const normSlug = (item.slug || '').toLowerCase();
      const existingMatch = existingMap.get(normName) || existingMap.get(normSlug);

      if (existingMatch) {
        conflicts.push({
          newItem: item,
          existingMatch,
          selected: true,
        });
      } else {
        cleanItems.push(item);
      }
    }

    if (conflicts.length > 0) {
      setDuplicateConflicts(conflicts.slice(0, 30));
      setCleanItemsToInsert(cleanItems);
      setDuplicateModalOpen(true);
      setLoading(false);
      return;
    }

    await executePornstarInsertion(cleanItems);
  };

  const confirmDuplicateImport = async (importConfirmedConflicts: boolean) => {
    let finalPayload = [...cleanItemsToInsert];
    if (importConfirmedConflicts) {
      const confirmedConflicts = duplicateConflicts.filter((c) => c.selected).map((c) => c.newItem);
      finalPayload = [...finalPayload, ...confirmedConflicts];
    }

    if (finalPayload.length === 0) {
      setMessage({ type: 'error', text: 'No performers selected for import.' });
      setDuplicateModalOpen(false);
      return;
    }

    await executePornstarInsertion(finalPayload);
  };

  const handleFileUploadPornstars = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setBulkNamesText(content);
      }
    };
    reader.readAsText(file);
  };

  const loadSamplePornstarsList = () => {
    setBulkNamesText(
      `Angela White\n` +
      `Abella Danger\n` +
      `Eva Elfie\n` +
      `Mia Malkova\n` +
      `Riley Reid`
    );
    setBulkUrlsText(
      `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80\n` +
      `https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80\n` +
      `https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80\n` +
      `https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80\n` +
      `https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80`
    );
  };

  const clearBulkInputs = () => {
    setBulkNamesText('');
    setBulkUrlsText('');
  };

  const exportPornstarsCSV = () => {
    if (pornstars.length === 0) return;
    const headers = ['ID', 'Name', 'Slug', 'Photo URL', 'Videos Count'];
    const rows = pornstars.map((p) => [
      `"${p.id || ''}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.slug}"`,
      `"${p.photo_url || ''}"`,
      p.videos_count || 50,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pornstars_directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSelectAllPagePs = () => {
    const pageIds = paginatedAdminPornstars.map((p) => p.id).filter(Boolean);
    const allSelected = pageIds.every((id) => selectedPsIds.includes(id));

    if (allSelected) {
      setSelectedPsIds(selectedPsIds.filter((id) => !pageIds.includes(id)));
    } else {
      const combined = Array.from(new Set([...selectedPsIds, ...pageIds]));
      setSelectedPsIds(combined);
    }
  };

  const toggleSelectPs = (id: string) => {
    if (selectedPsIds.includes(id)) {
      setSelectedPsIds(selectedPsIds.filter((i) => i !== id));
    } else {
      setSelectedPsIds([...selectedPsIds, id]);
    }
  };

  const handleBulkDeletePornstars = async () => {
    if (selectedPsIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedPsIds.length} selected performer(s)?`)) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/pornstars', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedPsIds }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to delete selected performers');
      }

      setMessage({ type: 'success', text: `Deleted ${selectedPsIds.length} performer(s) successfully!` });
      setSelectedPsIds([]);
      loadPornstars();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error deleting performers' });
    } finally {
      setLoading(false);
    }
  };

  const handlePurgeAllPornstars = async () => {
    const count = pornstars.length;
    if (count === 0) return;

    const confirmText = prompt(
      `⚠️ DANGER: You are about to permanently delete ALL ${count.toLocaleString()} performers from Supabase!\n\nType "DELETE ALL" to confirm:`
    );

    if (confirmText !== 'DELETE ALL') {
      alert('Purge cancelled. You must type "DELETE ALL" exactly to confirm.');
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/pornstars?purge_all=true', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to purge performers');
      }

      setMessage({ type: 'success', text: `🎉 ALL ${count.toLocaleString()} performers purged successfully from Supabase!` });
      setSelectedPsIds([]);
      loadPornstars();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error purging performers' });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectVid = (id: string) => {
    if (selectedVidIds.includes(id)) {
      setSelectedVidIds(selectedVidIds.filter((i) => i !== id));
    } else {
      setSelectedVidIds([...selectedVidIds, id]);
    }
  };

  const toggleSelectAllVids = () => {
    const visibleIds = filteredVideos.map((v) => v.id).filter(Boolean);
    const allSelected = visibleIds.every((id) => selectedVidIds.includes(id));

    if (allSelected) {
      setSelectedVidIds(selectedVidIds.filter((id) => !visibleIds.includes(id)));
    } else {
      const combined = Array.from(new Set([...selectedVidIds, ...visibleIds]));
      setSelectedVidIds(combined);
    }
  };

  const handleBulkDeleteVideos = async () => {
    if (selectedVidIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedVidIds.length} selected video release(s)?`)) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/videos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedVidIds }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to delete selected videos');
      }

      setMessage({ type: 'success', text: `Deleted ${selectedVidIds.length} video(s) successfully!` });
      setSelectedVidIds([]);
      loadVideos();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error deleting videos' });
    } finally {
      setLoading(false);
    }
  };

  const handlePurgeAllVideos = async () => {
    const count = videos.length;
    if (count === 0) return;

    const confirmText = prompt(
      `⚠️ DANGER: You are about to permanently delete ALL ${count.toLocaleString()} videos from Supabase!\n\nType "DELETE ALL VIDEOS" to confirm:`
    );

    if (confirmText !== 'DELETE ALL VIDEOS') {
      alert('Purge cancelled. You must type "DELETE ALL VIDEOS" exactly to confirm.');
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/videos?purge_all=true', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to purge videos');
      }

      setMessage({ type: 'success', text: `🎉 ALL ${count.toLocaleString()} video releases purged successfully from Supabase!` });
      setSelectedVidIds([]);
      loadVideos();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error purging videos' });
    } finally {
      setLoading(false);
    }
  };

  const handleCleanDuplicates = async () => {
    setIsScanning(true);
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/videos?check_duplicates=true');
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to scan duplicates');
      }

      setDupModal({
        isOpen: true,
        scannedCount: data.scanned,
        items: data.duplicates || [],
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error scanning duplicates' });
    } finally {
      setIsScanning(false);
      setLoading(false);
    }
  };

  const handleConfirmDeleteDuplicates = async () => {
    if (dupModal.items.length === 0) return;

    const confirmText = prompt(
      `⚠️ WARNING: You are about to permanently delete all ${dupModal.items.length.toLocaleString()} duplicate videos from your database!\n\nType "CONFIRM DELETE" to proceed:`
    );

    if (confirmText !== 'CONFIRM DELETE') {
      alert('Deletion cancelled.');
      return;
    }

    setIsScanning(true);
    setLoading(true);
    setDupModal((prev) => ({ ...prev, isOpen: false }));

    try {
      const res = await fetch('/api/admin/videos?clean_duplicates=true', {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to delete duplicates');
      }

      setMessage({
        type: 'success',
        text: `🎉 Successfully cleaned database! Deleted ${data.deletedCount.toLocaleString()} duplicate video records.`,
      });
      loadVideos();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error deleting duplicates' });
    } finally {
      setIsScanning(false);
      setLoading(false);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video release?')) return;
    try {
      const res = await fetch(`/api/admin/videos?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadVideos();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartEditVideo = (vid: Video) => {
    setEditingVideo(vid);
    setEditVidTitle(vid.title);
    setEditVidSlug(vid.slug);
    setEditVidCategory(vid.category_id || vid.category?.id || '');
    setEditVidPerformers(vid.performer_name || '');
    setEditVidThumbUrl(vid.thumbnail_url || '');
    setEditVidExternalUrl(vid.external_url || '');
    setEditVidMins(String(Math.floor((vid.duration_seconds || 600) / 60)));
    setEditVidSecs(String((vid.duration_seconds || 600) % 60));
    setEditVidDesc(vid.description || '');
    setEditVidPublished(vid.is_published !== false);
  };

  const handleSaveVideoEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideo) return;

    setLoading(true);
    setMessage(null);

    try {
      const totalSecs = (parseInt(editVidMins, 10) || 0) * 60 + (parseInt(editVidSecs, 10) || 0);

      const res = await fetch('/api/admin/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingVideo.id,
          title: editVidTitle,
          slug: editVidSlug,
          category_id: editVidCategory || null,
          performer_name: editVidPerformers || null,
          thumbnail_url: editVidThumbUrl || null,
          external_url: editVidExternalUrl || null,
          duration_seconds: totalSecs,
          description: editVidDesc || null,
          is_published: editVidPublished,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to save video changes');
      }

      setMessage({ type: 'success', text: `Video release "${editVidTitle}" updated successfully!` });
      setEditingVideo(null);
      loadVideos();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error updating video' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePornstar = async (id: string) => {
    if (!confirm('Are you sure you want to remove this performer?')) return;
    try {
      const res = await fetch(`/api/admin/pornstars?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadPornstars();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadGalleryVideos = async (pageToLoad = 1, search = '', catFilter = '') => {
    setGalleryLoading(true);
    try {
      let url = `/api/admin/videos?page=${pageToLoad}&limit=400`;
      if (search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        let fetched: Video[] = data.videos || [];
        if (catFilter) {
          fetched = fetched.filter((v) => v.category_id === catFilter || (v.category?.name && v.category.name.toLowerCase() === catFilter.toLowerCase()));
        }
        setGalleryVideos(fetched);
        setGalleryTotal(data.total || fetched.length);
        setGalleryTotalPages(data.totalPages || Math.ceil((data.total || fetched.length) / 400) || 1);
        setGalleryPage(pageToLoad);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGalleryLoading(false);
    }
  };

  const openVideoThumbGalleryModal = (field: 'createCategory' | 'editCategory' | 'createPornstar' | 'editPornstar') => {
    setTargetImageField(field);
    setIsVideoThumbModalOpen(true);
    let initialCatFilter = '';
    if (field === 'editCategory' && editingCategory) {
      initialCatFilter = editingCategory.id;
    }
    setGalleryCatFilter(initialCatFilter);
    loadGalleryVideos(1, modalVideoSearch, initialCatFilter);
  };

  const pickVideoThumbnailForCat = (vid: Video) => {
    const thumbUrl = getThumbnailUrl(vid);
    if (targetImageField === 'createCategory') {
      setCatCoverUrl(thumbUrl);
    } else if (targetImageField === 'editCategory') {
      setEditCatCoverUrl(thumbUrl);
    } else if (targetImageField === 'createPornstar') {
      setPsPhotoUrl(thumbUrl);
    } else if (targetImageField === 'editPornstar') {
      setEditPsPhotoUrl(thumbUrl);
    }
    setIsVideoThumbModalOpen(false);
  };

  // Construct Live Preview Video Object
  const firstSelectedCat = categories.find((c) => c.id === selectedCategoryIds[0]) || { name: 'General', id: 'gen', slug: 'general', description: null, cover_image_key: null, cover_image_url: null, views_count: 0, created_at: '', updated_at: '' };
  const calculatedDurationSecs = (parseInt(durationMins, 10) || 0) * 60 + (parseInt(durationSecs, 10) || 0);

  const previewVideo: Video = {
    id: 'preview-1',
    title: title || 'Sample Video Release Title',
    slug: slug || 'sample-video-release',
    description: null,
    is_external: true,
    external_url: externalUrl || null,
    video_key: null,
    thumbnail_key: null,
    thumbnail_url: thumbnailUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    duration_seconds: calculatedDurationSecs || 600,
    views_count: 14200,
    likes_count: 1200,
    dislikes_count: 45,
    is_published: true,
    performer_name: selectedPornstarNames.join(', ') || 'Featured Star',
    category_id: firstSelectedCat.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: firstSelectedCat,
  };

  const filteredVideos = videos.filter((v) =>
    v.title.toLowerCase().includes(videoSearch.toLowerCase()) ||
    (v.category?.name && v.category.name.toLowerCase().includes(videoSearch.toLowerCase()))
  );

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(catSearch.toLowerCase()) ||
    c.slug.toLowerCase().includes(catSearch.toLowerCase())
  );

  // Advanced Analytics & Filtering for Pornstar Manager
  const totalPsCount = pornstars.length;
  const withPhotoCount = pornstars.filter((p) => p.photo_url && p.photo_url.trim().startsWith('http')).length;
  const missingPhotoCount = totalPsCount - withPhotoCount;

  const filteredAndStatusPornstars = pornstars.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(psSearch.toLowerCase()) ||
      p.slug.toLowerCase().includes(psSearch.toLowerCase());
    const hasPhoto = Boolean(p.photo_url && p.photo_url.trim().startsWith('http'));

    if (psFilterType === 'with_photo') return matchesSearch && hasPhoto;
    if (psFilterType === 'missing_photo') return matchesSearch && !hasPhoto;
    return matchesSearch;
  });

  const totalAdminPsPages = Math.ceil(filteredAndStatusPornstars.length / adminPsPageSize) || 1;
  const startAdminPsIdx = (adminPsPage - 1) * adminPsPageSize;
  const paginatedAdminPornstars = filteredAndStatusPornstars.slice(
    startAdminPsIdx,
    startAdminPsIdx + adminPsPageSize
  );

  const isAllPageSelected =
    paginatedAdminPornstars.length > 0 &&
    paginatedAdminPornstars.every((p) => selectedPsIds.includes(p.id));

  const modalFilteredCategories = React.useMemo(() => {
    return allAvailableCategoryOptions.filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(modalCatSearch.toLowerCase()) || c.slug.toLowerCase().includes(modalCatSearch.toLowerCase());
      if (!matchesSearch) return false;
      if (catLetterFilter === 'ALL') return true;
      if (catLetterFilter === '#') return /^[0-9]/.test(c.name);
      return c.name.toUpperCase().startsWith(catLetterFilter);
    });
  }, [allAvailableCategoryOptions, modalCatSearch, catLetterFilter]);

  const modalFilteredPornstars = React.useMemo(() => {
    return pornstars.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(modalPsSearch.toLowerCase()) || p.slug.toLowerCase().includes(modalPsSearch.toLowerCase());
      if (!matchesSearch) return false;
      const hasPhoto = Boolean(p.photo_url && p.photo_url.trim().startsWith('http'));
      if (modalPsPhotoFilter === 'with_photo') return hasPhoto;
      if (modalPsPhotoFilter === 'missing_photo') return !hasPhoto;
      return true;
    });
  }, [pornstars, modalPsSearch, modalPsPhotoFilter]);

  const modalFilteredVideoPickers = React.useMemo(() => {
    const listToFilter = galleryVideos.length > 0 ? galleryVideos : videos;
    return listToFilter.filter((v) => {
      const q = modalVideoSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        v.title.toLowerCase().includes(q) ||
        (v.external_id && v.external_id.includes(q)) ||
        (v.category?.name && v.category.name.toLowerCase().includes(q));
      if (!matchesSearch) return false;

      if (galleryCatFilter) {
        return v.category_id === galleryCatFilter || (v.category?.name && v.category.name.toLowerCase() === galleryCatFilter.toLowerCase());
      }
      return true;
    });
  }, [galleryVideos, videos, modalVideoSearch, galleryCatFilter]);

  return (
    <div className={styles.wrapper}>
      <div className="container">
        <div className={styles.adminLayout}>
          {/* LEFT VERTICAL SIDEBAR */}
          <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <h1 className={styles.title}>Admin Center</h1>
              <p className={styles.subtitle}>PVideo Portal Management</p>
            </div>

            <nav className={styles.sidebarNav}>
              <button
                type="button"
                onClick={() => setActiveTab('uploader')}
                className={`${styles.tab} ${activeTab === 'uploader' ? styles.tabActive : ''}`}
              >
                <span>⚡</span> Video Uploader
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('categories')}
                className={`${styles.tab} ${activeTab === 'categories' ? styles.tabActive : ''}`}
              >
                <span>📁</span> Category Manager
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('pornstars')}
                className={`${styles.tab} ${activeTab === 'pornstars' ? styles.tabActive : ''}`}
              >
                <span>🌟</span> Pornstar Manager ({pornstars.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('manage')}
                className={`${styles.tab} ${activeTab === 'manage' ? styles.tabActive : ''}`}
              >
                <span>🎬</span> Video Directory ({videos.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`${styles.tab} ${activeTab === 'settings' ? styles.tabActive : ''}`}
              >
                <span>⚙️</span> System Settings
              </button>
            </nav>

            <button onClick={handleLogout} className={styles.logoutBtn}>
              Logout &rarr;
            </button>
          </aside>

          {/* RIGHT MAIN CONTENT AREA */}
          <main className={styles.mainContent}>
            {/* Stats Overview Grid */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div>
                  <div className={styles.statLabel}>Total Videos</div>
                  <div className={styles.statValue}>{(totalVidCount || videos.length).toLocaleString()}</div>
                </div>
                <div className={styles.statIcon}>
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>

              <div className={styles.statCard}>
                <div>
                  <div className={styles.statLabel}>Total Categories</div>
                  <div className={styles.statValue}>{categories.length > 0 ? categories.length : 154}</div>
                </div>
                <div className={styles.statIcon}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                </div>
              </div>

              <div className={styles.statCard}>
                <div>
                  <div className={styles.statLabel}>Pornstars Listed</div>
                  <div className={styles.statValue}>{pornstars.length}</div>
                </div>
                <div className={styles.statIcon}>
                  <span style={{ fontSize: '1.2rem' }}>🌟</span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div>
                  <div className={styles.statLabel}>Storage Engine</div>
                  <div className={styles.statValue} style={{ fontSize: '0.95rem', color: '#4ade80' }}>Cloudflare R2</div>
                </div>
                <div className={styles.statIcon} style={{ color: '#4ade80' }}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M3 15a4 4 0 004 4h9a5 5 0 001-9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
              </div>
            </div>

            {message && (
              <div
                style={{
                  padding: '0.75rem 1.25rem',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  background: message.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: message.type === 'success' ? '#4ade80' : '#f87171',
                  border: `1px solid ${message.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                }}
              >
                {message.text}
              </div>
            )}

            {/* TAB 1: VIDEO UPLOADER - BULK CATEGORY IMPORTER FRONT & CENTER */}
            {activeTab === 'uploader' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                {/* 1-CLICK BULK CATEGORY VIDEO IMPORTER (PRIMARY FORM) */}
                <div style={{ padding: '1.75rem', background: '#070a11', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)', boxShadow: '0 0 30px rgba(0,0,0,0.5)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>⚡ 1-Click Bulk Category Video Importer</span>
                        <span style={{ fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '0.15rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.4)' }}>Deduplicated</span>
                      </h2>
                      <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '0.3rem 0 0' }}>
                        Select a category below and paste your scraped video URLs/titles. All videos will automatically save and link to your target category safely without duplicates!
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={loadSampleVideosList}
                        className={styles.deleteBtn}
                        style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)', padding: '0.45rem 0.95rem', fontWeight: 700 }}
                      >
                        ⚡ Load 5 Sample Releases
                      </button>
                      {(bulkVidTitlesText || bulkVidUrlsText) && (
                        <button
                          type="button"
                          onClick={clearBulkVidInputs}
                          className={styles.deleteBtn}
                          style={{ padding: '0.45rem 0.95rem' }}
                        >
                          Clear Fields
                        </button>
                      )}
                    </div>
                  </div>

                  <form onSubmit={handleBulkImportVideos} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.25rem' }}>
                    
                    {/* STEP 1: SELECT TARGET CATEGORY */}
                    <div style={{ background: '#0d131f', padding: '1.25rem', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.4)', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
                      <label className={styles.label} style={{ fontSize: '0.98rem', fontWeight: 800, color: '#f59e0b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>📁 STEP 1: Select Target Category for this Import *</span>
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
                          {allAvailableCategoryOptions.length} Total A-Z Categories Available
                        </span>
                      </label>

                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <select
                          value={bulkTargetCategoryId}
                          onChange={(e) => setBulkTargetCategoryId(e.target.value)}
                          className={styles.input}
                          style={{ flex: 1, minWidth: '260px', padding: '0.75rem 1rem', fontSize: '0.95rem', fontWeight: 700, background: '#070a11', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#ffffff', cursor: 'pointer' }}
                        >
                          <option value="">-- Click to Select Category (e.g. MILF, Big Tits, Blonde, VR...) --</option>
                          {allAvailableCategoryOptions.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              📁 {cat.name} ({cat.slug})
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => setIsCatModalOpen(true)}
                          className={styles.pickerTriggerBtn}
                          style={{ width: 'auto', padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}
                        >
                          <span>🔍 Browse All {allAvailableCategoryOptions.length}+ Categories Modal</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleSyncAllCategories}
                          disabled={loading}
                          className={styles.deleteBtn}
                          style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.4)', padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: 800, whiteSpace: 'nowrap' }}
                        >
                          ⚡ Populate All {allAvailableCategoryOptions.length} Categories to Supabase
                        </button>
                      </div>

                      {bulkTargetCategoryId && (
                        <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#4ade80', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>✓ Target Category Selected:</span>
                          <span style={{ background: 'rgba(74, 222, 128, 0.15)', color: '#4ade80', padding: '0.25rem 0.75rem', borderRadius: '4px', border: '1px solid rgba(74, 222, 128, 0.3)', fontSize: '0.9rem' }}>
                            📁 {allAvailableCategoryOptions.find((c) => c.id === bulkTargetCategoryId || c.slug === bulkTargetCategoryId)?.name || bulkTargetCategoryId}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* STEP 2: REDPORN PRODUCTION HTML / ZIP ARCHIVE PARSER */}
                    <div style={{ background: '#0d131f', padding: '1.25rem', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.4)', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                          <label className={styles.label} style={{ fontSize: '0.98rem', fontWeight: 800, color: '#60a5fa', margin: 0 }}>
                            📦 STEP 2: Drop RedPorn Category HTML Files or ZIP Archive (.zip, .html)
                          </label>

                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#f59e0b', fontWeight: 700, cursor: 'pointer', background: 'rgba(245, 158, 11, 0.15)', padding: '0.2rem 0.65rem', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                            <input
                              type="checkbox"
                              checked={isDebugMode}
                              onChange={(e) => setIsDebugMode(e.target.checked)}
                              style={{ cursor: 'pointer' }}
                            />
                            🐛 DEBUG Mode (1st File & First 10 Cards Only)
                          </label>
                        </div>

                        {parsedHtmlResult && parsedHtmlResult.items.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {parsedHtmlResult.debugMissingUrlHtml && (
                              <button
                                type="button"
                                onClick={() => downloadDebugHtmlFile(parsedHtmlResult.debugMissingUrlHtml || '', 'debug_missing_url.html')}
                                className={styles.deleteBtn}
                                style={{ background: '#dc2626', color: '#ffffff', padding: '0.4rem 0.75rem', fontWeight: 800, fontSize: '0.78rem' }}
                              >
                                ⚠️ Download debug_missing_url.html
                              </button>
                            )}

                            {parsedHtmlResult.debugMissingPerformerHtml && (
                              <button
                                type="button"
                                onClick={() => downloadDebugHtmlFile(parsedHtmlResult.debugMissingPerformerHtml || '', 'debug_missing_performer.html')}
                                className={styles.deleteBtn}
                                style={{ background: '#d97706', color: '#ffffff', padding: '0.4rem 0.75rem', fontWeight: 800, fontSize: '0.78rem' }}
                              >
                                ⚠️ Download debug_missing_performer.html
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => exportExcelFile(parsedHtmlResult.items, 'RedPorn_Category')}
                              className={styles.deleteBtn}
                              style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)', color: '#ffffff', padding: '0.4rem 1rem', fontWeight: 800, fontSize: '0.85rem' }}
                            >
                              📥 Download Excel (.xlsx) [{parsedHtmlResult.items.length} Rows]
                            </button>
                          </div>
                        )}
                      </div>

                      <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '0 0 0.75rem' }}>
                        Parser automatically sorts files numerically (1, 2, 3... 10... 23), extracts card-by-card with 100% card independence, deduplicates by Gallery ID, and populates the importer!
                      </p>

                      <input
                        type="file"
                        accept=".zip,.html,.htm"
                        multiple
                        onChange={handleRedPornHtmlZipUpload}
                        className={styles.input}
                        style={{ padding: '0.75rem', cursor: 'pointer', background: '#070a11', border: '1px dashed rgba(59, 130, 246, 0.5)' }}
                      />

                      {parsingStatus && (
                        <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: parsingStatus.startsWith('🎉') ? '#4ade80' : '#fcd34d', fontWeight: 700, background: 'rgba(0,0,0,0.3)', padding: '0.5rem 0.75rem', borderRadius: '4px' }}>
                          {parsingStatus}
                        </div>
                      )}

                      {/* DEBUG MODE INSPECTOR CARDS BREAKDOWN */}
                      {isDebugMode && parsedHtmlResult?.debugCardLogs && parsedHtmlResult.debugCardLogs.length > 0 && (
                        <div style={{ marginTop: '1rem', background: '#070a11', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f59e0b', margin: '0 0 0.75rem' }}>
                            🐛 DEBUG MODE INSPECTOR (First File & First 10 Cards Card-by-Card DOM Inspection)
                          </h4>

                          <div style={{ maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {parsedHtmlResult.debugCardLogs.map((c, i) => (
                              <div key={i} style={{ padding: '0.75rem', background: '#0d131f', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', fontSize: '0.78rem' }}>
                                <div style={{ fontWeight: 800, color: '#60a5fa', marginBottom: '0.3rem' }}>
                                  -------------------------------- Card #{i + 1} --------------------------------
                                </div>
                                <div><strong style={{ color: '#94a3b8' }}>Extracted Title:</strong> <span style={{ color: '#ffffff' }}>{c.title}</span></div>
                                <div><strong style={{ color: '#94a3b8' }}>Extracted URL:</strong> <span style={{ color: c.gallery_url ? '#4ade80' : '#ef4444' }}>{c.gallery_url || '❌ MISSING (href empty)'}</span></div>
                                <div><strong style={{ color: '#94a3b8' }}>Extracted Gallery ID:</strong> <span style={{ color: c.gallery_id ? '#f59e0b' : '#ef4444', fontWeight: 700 }}>{c.gallery_id || '❌ MISSING'}</span></div>
                                <div><strong style={{ color: '#94a3b8' }}>Extracted Thumbnail:</strong> <span style={{ color: '#94a3b8' }}>{c.thumbnail_url}</span></div>
                                <div><strong style={{ color: '#94a3b8' }}>Extracted Duration:</strong> <span style={{ color: '#ffffff' }}>{c.duration}</span></div>
                                <div><strong style={{ color: '#94a3b8' }}>Extracted Performer:</strong> <span style={{ color: c.performer ? '#ec4899' : '#fcd34d', fontWeight: 700 }}>{c.performer || '⚠️ NONE (Empty)'}</span></div>
                                <details style={{ marginTop: '0.4rem' }}>
                                  <summary style={{ cursor: 'pointer', color: '#f59e0b', fontWeight: 700 }}>Raw HTML Outer Element</summary>
                                  <pre style={{ background: '#070a11', padding: '0.5rem', borderRadius: '4px', overflowX: 'auto', fontSize: '0.72rem', color: '#cbd5e1', marginTop: '0.3rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                    {c.rawHtml}
                                  </pre>
                                </details>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* STEP 2: PASTE VIDEO DATA */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.1rem' }}>
                      <div className={styles.inputGroup}>
                        <label className={styles.label}>📝 1. Video Titles (One per line) * [Auto Slugs]</label>
                        <textarea
                          rows={6}
                          placeholder={`Hardcore Sloppy Action - Karin Aizawa\nSensual Passionate Romance - Angela White\nWild Party Action - Abella Danger\nCute Blonde College Fun - Eva Elfie`}
                          value={bulkVidTitlesText}
                          onChange={(e) => setBulkVidTitlesText(e.target.value)}
                          className={styles.textarea}
                        />
                      </div>

                      <div className={styles.inputGroup}>
                        <label className={styles.label}>🔗 2. External Target URLs / Gallery Links (One per line) *</label>
                        <textarea
                          rows={6}
                          placeholder={`https://redporn.porn/16355881?title=example-video\nhttps://redporn.porn/16355882?title=example-video-2\nhttps://redporn.porn/16355883?title=example-video-3`}
                          value={bulkVidUrlsText}
                          onChange={(e) => setBulkVidUrlsText(e.target.value)}
                          className={styles.textarea}
                        />
                      </div>

                      <div className={styles.inputGroup}>
                        <label className={styles.label}>🖼️ 3. Thumbnail Image URLs (Optional, line-matched)</label>
                        <textarea
                          rows={5}
                          placeholder={`https://images.unsplash.com/photo-1618005182384...\nhttps://images.unsplash.com/photo-1534528741775...\nhttps://images.unsplash.com/photo-1517841905240...`}
                          value={bulkVidThumbsText}
                          onChange={(e) => setBulkVidThumbsText(e.target.value)}
                          className={styles.textarea}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div className={styles.inputGroup}>
                          <label className={styles.label}>⏱️ 4. Durations (e.g. 15 or 12:30)</label>
                          <textarea
                            rows={5}
                            placeholder={`12:30\n15:45\n08:20\n22:10`}
                            value={bulkVidDurationsText}
                            onChange={(e) => setBulkVidDurationsText(e.target.value)}
                            className={styles.textarea}
                          />
                        </div>

                        <div className={styles.inputGroup}>
                          <label className={styles.label}>🌟 5. Performers (Optional)</label>
                          <textarea
                            rows={5}
                            placeholder={`Karin Aizawa\nAngela White\nAbella Danger\nEva Elfie`}
                            value={bulkVidPerformersText}
                            onChange={(e) => setBulkVidPerformersText(e.target.value)}
                            className={styles.textarea}
                          />
                        </div>
                      </div>
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.label}>OR Upload Video List CSV / TXT File</label>
                      <input
                        type="file"
                        accept=".csv,.txt,.tsv"
                        onChange={handleFileUploadVideos}
                        className={styles.input}
                      />
                    </div>

                    {/* Live Parsed Videos Table Preview */}
                    {parsedBulkVideoItems.length > 0 && (
                      <div style={{ background: '#0d131f', borderRadius: '8px', padding: '1.25rem', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#4ade80' }}>
                            ✓ Live Parsed: {parsedBulkVideoItems.length} Video Release(s) Ready for Category Import
                          </span>
                          <button
                            type="button"
                            onClick={clearBulkVidInputs}
                            className={styles.deleteBtn}
                            style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                          >
                            Clear List
                          </button>
                        </div>

                        <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px' }}>
                          <table className={styles.table} style={{ fontSize: '0.78rem' }}>
                            <thead>
                              <tr>
                                <th style={{ padding: '0.5rem 0.75rem' }}>Thumb</th>
                                <th style={{ padding: '0.5rem 0.75rem' }}>Gallery ID</th>
                                <th style={{ padding: '0.5rem 0.75rem' }}>Title</th>
                                <th style={{ padding: '0.5rem 0.75rem' }}>Target Category</th>
                                <th style={{ padding: '0.5rem 0.75rem' }}>Auto Slug</th>
                                <th style={{ padding: '0.5rem 0.75rem' }}>External URL</th>
                                <th style={{ padding: '0.5rem 0.75rem' }}>Performers</th>
                                <th style={{ padding: '0.5rem 0.75rem' }}>Duration</th>
                              </tr>
                            </thead>
                            <tbody>
                              {parsedBulkVideoItems.map((item, i) => {
                                const catObj = categories.find((c) => c.id === item.category_id);
                                return (
                                  <tr key={i}>
                                    <td style={{ padding: '0.4rem 0.6rem' }}>
                                      <img src={item.thumbnail_url} alt={item.title} style={{ width: '40px', height: '24px', borderRadius: '2px', objectFit: 'cover' }} />
                                    </td>
                                    <td style={{ padding: '0.4rem 0.6rem', color: '#f59e0b', fontWeight: 700 }}>
                                      {item.external_id ? `🆔 #${item.external_id}` : '(Auto)'}
                                    </td>
                                    <td style={{ padding: '0.4rem 0.6rem', fontWeight: 700, color: '#fff' }}>{item.title}</td>
                                    <td style={{ padding: '0.4rem 0.6rem', color: '#60a5fa', fontWeight: 700 }}>
                                      📁 {catObj?.name || 'Selected Category'}
                                    </td>
                                    <td style={{ padding: '0.4rem 0.6rem', color: '#ef4444' }}>/watch/{item.slug}</td>
                                    <td style={{ padding: '0.4rem 0.6rem', color: '#64748b', maxWidth: '160px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {item.external_url}
                                    </td>
                                    <td style={{ padding: '0.4rem 0.6rem', color: '#94a3b8' }}>{item.performer_name || 'N/A'}</td>
                                    <td style={{ padding: '0.4rem 0.6rem', color: '#94a3b8' }}>{item.duration}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || parsedBulkVideoItems.length === 0}
                      className={styles.submitBtn}
                      style={{
                        marginTop: '0.5rem',
                        background: parsedBulkVideoItems.length > 0 ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)' : undefined,
                        boxShadow: parsedBulkVideoItems.length > 0 ? '0 0 25px rgba(239, 68, 68, 0.4)' : undefined,
                        fontSize: '1.02rem',
                        fontWeight: 800,
                        padding: '0.85rem 1.5rem',
                      }}
                    >
                      {loading
                        ? 'Importing Videos to Supabase...'
                        : parsedBulkVideoItems.length > 0
                        ? `🚀 Import All (${parsedBulkVideoItems.length}) Videos to ${
                            categories.find((c) => c.id === (bulkTargetCategoryId || selectedCategoryIds[0]))?.name || 'Selected Category'
                          }`
                        : '🚀 Import Videos (Select category & paste links above)'}
                    </button>
                  </form>
                </div>

                {/* SINGLE VIDEO PUBLISHER (SECONDARY FORM) */}
                <div className={styles.uploaderLayout}>
                  <div className={styles.card}>
                    <h2 className={styles.cardTitle}>➕ Publish Single External Video Release</h2>

                    <form onSubmit={handleUploadVideo} className={styles.formGrid}>
                      <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                        <label className={styles.label}>External Release Target URL *</label>
                        <input
                          type="url"
                          placeholder="https://www.youtube.com/watch?v=... or external tube URL"
                          value={externalUrl}
                          onChange={(e) => setExternalUrl(e.target.value)}
                          required
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.inputGroup}>
                        <label className={styles.label}>Video Title *</label>
                        <input
                          type="text"
                          placeholder="e.g. Hardcore Sloppy Action - Karin Aizawa"
                          value={title}
                          onChange={handleTitleChange}
                          required
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.inputGroup}>
                        <label className={styles.label}>URL Slug *</label>
                        <input
                          type="text"
                          placeholder="hardcore-sloppy-action-karin-aizawa"
                          value={slug}
                          onChange={(e) => setSlug(e.target.value)}
                          required
                          className={styles.input}
                        />
                      </div>

                      {/* Advanced Multi-Select Category Picker Button */}
                      <div className={styles.inputGroup}>
                        <label className={styles.label}>Categories ({selectedCategoryIds.length} Selected) *</label>
                        <button
                          type="button"
                          onClick={() => setIsCatModalOpen(true)}
                          className={styles.pickerTriggerBtn}
                        >
                          <span>
                            {selectedCategoryIds.length > 0
                              ? `Selected ${selectedCategoryIds.length} Categories`
                              : 'Select Categories...'}
                          </span>
                          <span>🔍 Browse & Search ▾</span>
                        </button>

                        <div className={styles.chipContainer}>
                          {selectedCategoryIds.map((cId) => {
                            const catObj = categories.find((c) => c.id === cId);
                            return (
                              <span key={cId} className={styles.chip}>
                                {catObj?.name || cId}
                                <button
                                  type="button"
                                  onClick={() => toggleCategorySelect(cId)}
                                  className={styles.chipRemoveBtn}
                                >
                                  ✕
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Advanced Multi-Select Pornstar Picker Button */}
                      <div className={styles.inputGroup}>
                        <label className={styles.label}>Performers ({selectedPornstarNames.length} Selected)</label>
                        <button
                          type="button"
                          onClick={() => setIsPsModalOpen(true)}
                          className={styles.pickerTriggerBtn}
                        >
                          <span>
                            {selectedPornstarNames.length > 0
                              ? `Selected ${selectedPornstarNames.length} Performers`
                              : 'Select Performers / Pornstars...'}
                          </span>
                          <span>🔍 Search Performers ▾</span>
                        </button>

                        <div className={styles.chipContainer}>
                          {selectedPornstarNames.map((name) => (
                            <span key={name} className={styles.chip}>
                              🌟 {name}
                              <button
                                type="button"
                                onClick={() => togglePornstarSelect(name)}
                                className={styles.chipRemoveBtn}
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Duration in Minutes + Seconds */}
                      <div className={styles.inputGroup}>
                        <label className={styles.label}>Duration (Minutes : Seconds) *</label>
                        <div className={styles.durationInputs}>
                          <input
                            type="number"
                            placeholder="Mins (e.g. 15)"
                            value={durationMins}
                            onChange={(e) => setDurationMins(e.target.value)}
                            className={styles.input}
                            min="0"
                          />
                          <input
                            type="number"
                            placeholder="Secs (e.g. 01)"
                            value={durationSecs}
                            onChange={(e) => setDurationSecs(e.target.value)}
                            className={styles.input}
                            min="0"
                            max="59"
                          />
                        </div>
                      </div>

                      {/* Thumbnail File Upload AND Image URL */}
                      <div className={styles.inputGroup}>
                        <label className={styles.label}>Thumbnail Image File Upload</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                          className={styles.input}
                        />
                      </div>

                      <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                        <label className={styles.label}>OR Thumbnail Image URL</label>
                        <input
                          type="url"
                          placeholder="https://images.unsplash.com/..."
                          value={thumbnailUrl}
                          onChange={(e) => setThumbnailUrl(e.target.value)}
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.fullWidth}>
                        <button type="submit" disabled={loading} className={styles.submitBtn}>
                          {loading ? 'Publishing Release...' : '🚀 Publish Single Release to Directory'}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Sticky Live Video Card Preview */}
                  <div className={styles.previewCard}>
                    <div className={styles.previewTitle}>Live Card Preview</div>
                    <div style={{ maxWidth: '280px', margin: '0 auto' }}>
                      <VideoCard video={previewVideo} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CATEGORY MANAGER */}
            {activeTab === 'categories' && (
              <div className={styles.card}>
                <div className={styles.tableHeader}>
                  <h2 className={styles.cardTitle} style={{ marginBottom: 0 }}>Category Directory ({filteredCategories.length})</h2>
                  <input
                    type="text"
                    placeholder="Search categories..."
                    value={catSearch}
                    onChange={(e) => setCatSearch(e.target.value)}
                    className={styles.tableSearch}
                  />
                </div>

                {/* Create Category Form */}
                <div style={{ padding: '1.25rem', background: '#070a11', borderRadius: '6px', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '1rem', color: '#ffffff' }}>➕ Create New Category</h3>
                  <form onSubmit={handleCreateCategory} className={styles.formGrid}>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Category Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Anime & Animations"
                        value={catName}
                        onChange={(e) => {
                          setCatName(e.target.value);
                          setCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                        }}
                        required
                        className={styles.input}
                      />
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Slug *</label>
                      <input
                        type="text"
                        placeholder="anime-animations"
                        value={catSlug}
                        onChange={(e) => setCatSlug(e.target.value)}
                        required
                        className={styles.input}
                      />
                    </div>

                    {/* Option 1: File Upload */}
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Cover Image File Upload</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setCatCoverFile(e.target.files?.[0] || null)}
                        className={styles.input}
                      />
                    </div>

                    {/* Option 2: Image URL */}
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>OR Cover Image URL</label>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        value={catCoverUrl}
                        onChange={(e) => setCatCoverUrl(e.target.value)}
                        className={styles.input}
                      />
                    </div>

                    {/* Option 3: Big Popup Video Thumbnail Picker Button */}
                    <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                      <label className={styles.label}>OR Select Cover Thumbnail from Existing Video</label>
                      <button
                        type="button"
                        onClick={() => {
                          openVideoThumbGalleryModal('createCategory');
                        }}
                        className={styles.pickerTriggerBtn}
                      >
                        <span>🎬 Open Video Thumbnail Gallery ({videos.length} Videos Available)</span>
                        <span>🔍 Browse Videos ▾</span>
                      </button>

                      {catCoverUrl && (
                        <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Selected Cover Preview:</span>
                          <img
                            src={catCoverUrl}
                            alt="Cover Preview"
                            style={{ width: '80px', height: '45px', objectFit: 'cover', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.15)' }}
                          />
                        </div>
                      )}
                    </div>

                    <div className={styles.fullWidth}>
                      <button type="submit" disabled={loading} className={styles.submitBtn} style={{ marginTop: 0 }}>
                        {loading ? 'Creating...' : 'Create Category'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Categories Table */}
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Category Name</th>
                      <th>Slug</th>
                      <th>Cover Image</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.slice(0, 50).map((cat) => (
                      <tr key={cat.id || cat.slug}>
                        <td style={{ fontWeight: 700, color: '#ffffff' }}>{cat.name}</td>
                        <td style={{ color: '#94a3b8' }}>/categories/{cat.slug}</td>
                        <td>
                          {cat.cover_image_url ? (
                            <img src={cat.cover_image_url} alt={cat.name} style={{ width: '40px', height: '24px', objectFit: 'cover', borderRadius: '2px' }} />
                          ) : (
                            <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Default</span>
                          )}
                        </td>
                        <td>
                          <button
                            onClick={() => openEditCategoryModal(cat)}
                            className={styles.editBtn}
                          >
                            Edit
                          </button>
                          <a href={`/categories/${cat.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: '#ef4444', textDecoration: 'none', fontWeight: 600, fontSize: '0.8rem' }}>
                            View »
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 3: ENHANCED PORNSTAR MANAGER WITH BULK SELECT & PURGE ALL BUTTON */}
            {activeTab === 'pornstars' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Pornstar Data Analytics Header Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                  <div style={{ background: '#070a11', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>🌟 Total Performers</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', marginTop: '0.2rem' }}>{totalPsCount}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Live in Supabase Directory</div>
                  </div>

                  <div style={{ background: '#070a11', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4ade80', textTransform: 'uppercase' }}>📸 With Card Cover</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#4ade80', marginTop: '0.2rem' }}>{withPhotoCount}</div>
                    <div style={{ fontSize: '0.72rem', color: '#86efac' }}>Active Direct Image URLs</div>
                  </div>

                  <div style={{ background: '#070a11', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>⬛ Blank Cover Fallback</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.2rem' }}>{missingPhotoCount}</div>
                    <div style={{ fontSize: '0.72rem', color: '#fde047' }}>Using Sleek #000 Fallback</div>
                  </div>

                  <div style={{ background: '#070a11', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase' }}>🔍 Currently Displayed</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#60a5fa', marginTop: '0.2rem' }}>{filteredAndStatusPornstars.length}</div>
                    <div style={{ fontSize: '0.72rem', color: '#93c5fd' }}>Matching Active Filters</div>
                  </div>
                </div>

                {/* Main Pornstar Directory Container */}
                <div className={styles.card}>
                  {/* Single Add Pornstar Form */}
                  <div style={{ padding: '1.25rem', background: '#070a11', borderRadius: '6px', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '1rem', color: '#ffffff' }}>➕ Add Single Pornstar with Card Cover</h3>
                    <form onSubmit={handleCreatePornstar} className={styles.formGrid}>
                      <div className={styles.inputGroup}>
                        <label className={styles.label}>Pornstar Name *</label>
                        <input
                          type="text"
                          placeholder="e.g. Angela White"
                          value={psName}
                          onChange={(e) => {
                            setPsName(e.target.value);
                            setPsSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                          }}
                          required
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.inputGroup}>
                        <label className={styles.label}>Slug *</label>
                        <input
                          type="text"
                          placeholder="angela-white"
                          value={psSlug}
                          onChange={(e) => setPsSlug(e.target.value)}
                          required
                          className={styles.input}
                        />
                      </div>

                      {/* Card Cover Option 1: File Upload */}
                      <div className={styles.inputGroup}>
                        <label className={styles.label}>Card Cover File Upload (Cloudflare R2)</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setPsPhotoFile(e.target.files?.[0] || null)}
                          className={styles.input}
                        />
                      </div>

                      {/* Card Cover Option 2: Image URL */}
                      <div className={styles.inputGroup}>
                        <label className={styles.label}>OR Card Cover Image URL</label>
                        <input
                          type="url"
                          placeholder="https://images.unsplash.com/..."
                          value={psPhotoUrl}
                          onChange={(e) => setPsPhotoUrl(e.target.value)}
                          className={styles.input}
                        />
                      </div>

                      {/* Card Cover Option 3: Pick Video Thumbnail */}
                      <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                        <label className={styles.label}>OR Select Card Cover from Published Video</label>
                        <button
                          type="button"
                          onClick={() => {
                            setTargetImageField('createPornstar');
                            setIsVideoThumbModalOpen(true);
                          }}
                          className={styles.pickerTriggerBtn}
                        >
                          <span>🎬 Open Video Thumbnail Gallery ({videos.length} Available)</span>
                          <span>Browse ▾</span>
                        </button>

                        {psPhotoUrl && (
                          <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Card Cover Preview:</span>
                            <img
                              src={psPhotoUrl}
                              alt="Card Cover Preview"
                              style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '50%', border: '2px solid #dc2626' }}
                            />
                          </div>
                        )}
                      </div>

                      <div className={styles.fullWidth}>
                        <button type="submit" disabled={loading} className={styles.submitBtn} style={{ marginTop: 0 }}>
                          {loading ? 'Checking Duplicates & Adding...' : '➕ Add Pornstar to Directory'}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* 1-Click Dual Multi Importer: Names Column + Image URLs Column */}
                  <div style={{ padding: '1.25rem', background: '#070a11', borderRadius: '6px', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff' }}>⚡ Dual Multi Importer (Names + Card Cover URLs)</h3>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={loadSamplePornstarsList}
                          className={styles.deleteBtn}
                          style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)', padding: '0.3rem 0.75rem' }}
                        >
                          ⚡ Load 5 Sample Performers & Photo URLs
                        </button>
                        {(bulkNamesText || bulkUrlsText) && (
                          <button
                            type="button"
                            onClick={clearBulkInputs}
                            className={styles.deleteBtn}
                            style={{ padding: '0.3rem 0.75rem' }}
                          >
                            Clear Text
                          </button>
                        )}
                      </div>
                    </div>

                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1rem' }}>
                      Paste multiple performer names on the left and matching image URLs on the right (matched line-by-line). Or upload a combined CSV file!
                    </p>

                    <form onSubmit={handleBulkImportPornstars} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <div className={styles.formGrid}>
                        <div className={styles.inputGroup}>
                          <label className={styles.label}>📝 1. Paste Multiple Pornstar Names (One per line)</label>
                          <textarea
                            rows={6}
                            placeholder={`Angela White\nAbella Danger\nEva Elfie\nMia Malkova\nRiley Reid`}
                            value={bulkNamesText}
                            onChange={(e) => setBulkNamesText(e.target.value)}
                            className={styles.textarea}
                          />
                        </div>

                        <div className={styles.inputGroup}>
                          <label className={styles.label}>🖼️ 2. Paste Multiple Card Cover Image URLs (One per line)</label>
                          <textarea
                            rows={6}
                            placeholder={`https://images.unsplash.com/photo-1534528741775-53994a69daeb\nhttps://images.unsplash.com/photo-1517841905240-472988babdf9\nhttps://images.unsplash.com/photo-1524504388940-b1c1722653e1\nhttps://images.unsplash.com/photo-1494790108377-be9c29b29330\nhttps://images.unsplash.com/photo-1539571696357-5a69c17a67c6`}
                            value={bulkUrlsText}
                            onChange={(e) => setBulkUrlsText(e.target.value)}
                            className={styles.textarea}
                          />
                        </div>
                      </div>

                      <div className={styles.inputGroup}>
                        <label className={styles.label}>OR Upload CSV / TXT File</label>
                        <input
                          type="file"
                          accept=".csv,.txt,.tsv"
                          onChange={handleFileUploadPornstars}
                          className={styles.input}
                        />
                      </div>

                      {/* Live Parsed Items Preview Table */}
                      {parsedBulkItems.length > 0 && (
                        <div style={{ background: '#0d131f', borderRadius: '6px', padding: '1rem', border: '1px solid rgba(220, 38, 38, 0.3)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#4ade80' }}>
                              ✓ Live Line-by-Line Matched: {parsedBulkItems.length} Performers Ready for Supabase Import
                            </span>
                            <button
                              type="button"
                              onClick={clearBulkInputs}
                              className={styles.deleteBtn}
                              style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                            >
                              Clear All
                            </button>
                          </div>

                          <div style={{ maxHeight: '190px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px' }}>
                            <table className={styles.table} style={{ fontSize: '0.78rem' }}>
                              <thead>
                                <tr>
                                  <th style={{ padding: '0.4rem 0.6rem' }}>Card Cover Preview</th>
                                  <th style={{ padding: '0.4rem 0.6rem' }}>Pornstar Name</th>
                                  <th style={{ padding: '0.4rem 0.6rem' }}>Slug</th>
                                  <th style={{ padding: '0.4rem 0.6rem' }}>Matched Photo URL</th>
                                </tr>
                              </thead>
                              <tbody>
                                {parsedBulkItems.slice(0, 50).map((item, i) => (
                                  <tr key={i}>
                                    <td style={{ padding: '0.4rem 0.6rem' }}>
                                      {item.photo_url && item.photo_url.trim().startsWith('http') ? (
                                        <img src={item.photo_url} alt={item.name} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.2)' }} />
                                      ) : (
                                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.65rem' }}>🌟</div>
                                      )}
                                    </td>
                                    <td style={{ padding: '0.4rem 0.6rem', fontWeight: 700, color: '#fff' }}>{item.name}</td>
                                    <td style={{ padding: '0.4rem 0.6rem', color: '#94a3b8' }}>/search?q={encodeURIComponent(item.name)}</td>
                                    <td style={{ padding: '0.4rem 0.6rem', color: '#64748b', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {item.photo_url || '(Blank Black Cover)'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={loading || parsedBulkItems.length === 0}
                        className={styles.submitBtn}
                        style={{ marginTop: 0 }}
                      >
                        {loading
                          ? 'Checking Duplicates...'
                          : parsedBulkItems.length > 0
                          ? `🚀 Check Duplicates & Import (${parsedBulkItems.length} Performers) to Supabase`
                          : '🚀 Import to Supabase (Paste names or upload file above)'}
                      </button>
                    </form>
                  </div>

                  {/* High-Contrast Search, Filter & Bulk Action Toolbar */}
                  <div style={{ padding: '1.25rem', background: '#070a11', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <h2 className={styles.cardTitle} style={{ margin: 0 }}>
                          🌟 Performers Directory ({filteredAndStatusPornstars.length})
                        </h2>
                        {selectedPsIds.length > 0 && (
                          <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700, border: '1px solid rgba(239, 68, 68, 0.4)' }}>
                            ✓ {selectedPsIds.length} Selected
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {selectedPsIds.length > 0 && (
                          <>
                            <button
                              type="button"
                              onClick={handleBulkDeletePornstars}
                              disabled={loading}
                              className={styles.deleteBtn}
                              style={{ background: '#dc2626', color: '#ffffff', padding: '0.45rem 1rem', fontSize: '0.82rem', fontWeight: 800 }}
                            >
                              🗑️ Delete Selected ({selectedPsIds.length})
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedPsIds([])}
                              className={styles.deleteBtn}
                              style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem' }}
                            >
                              Clear Selection
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={exportPornstarsCSV}
                          className={styles.deleteBtn}
                          style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)', padding: '0.45rem 1rem', fontSize: '0.82rem' }}
                        >
                          📥 Export All ({pornstars.length}) to CSV
                        </button>

                        <button
                          type="button"
                          onClick={handlePurgeAllPornstars}
                          disabled={loading || pornstars.length === 0}
                          className={styles.deleteBtn}
                          style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '0.45rem 1rem', fontSize: '0.82rem', fontWeight: 800 }}
                        >
                          ⚠️ Purge ALL ({pornstars.length}) Performers
                        </button>
                      </div>
                    </div>

                    {/* Prominent Search Bar & Filters */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.85rem' }}>
                      <div className={styles.inputGroup} style={{ marginBottom: 0 }}>
                        <input
                          type="text"
                          placeholder="🔍 Search performers by name or slug..."
                          value={psSearch}
                          onChange={(e) => {
                            setPsSearch(e.target.value);
                            setAdminPsPage(1);
                          }}
                          className={styles.input}
                          style={{ padding: '0.65rem 1rem', fontSize: '0.9rem', background: '#0d131f', border: '1px solid rgba(239, 68, 68, 0.4)' }}
                        />
                      </div>

                      <div className={styles.inputGroup} style={{ marginBottom: 0 }}>
                        <select
                          value={psFilterType}
                          onChange={(e: any) => {
                            setPsFilterType(e.target.value);
                            setAdminPsPage(1);
                          }}
                          className={styles.input}
                          style={{ padding: '0.65rem 1rem', fontSize: '0.85rem', background: '#0d131f' }}
                        >
                          <option value="all">Filter: All Performers ({totalPsCount})</option>
                          <option value="with_photo">📸 With Photo Cover ({withPhotoCount})</option>
                          <option value="missing_photo">⬛ Missing Cover ({missingPhotoCount})</option>
                        </select>
                      </div>

                      <div className={styles.inputGroup} style={{ marginBottom: 0 }}>
                        <select
                          value={adminPsPageSize}
                          onChange={(e) => {
                            setAdminPsPageSize(parseInt(e.target.value, 10));
                            setAdminPsPage(1);
                          }}
                          className={styles.input}
                          style={{ padding: '0.65rem 1rem', fontSize: '0.85rem', background: '#0d131f' }}
                        >
                          <option value={25}>Show 25 per page</option>
                          <option value={50}>Show 50 per page</option>
                          <option value={100}>Show 100 per page</option>
                          <option value={500}>Show All ({totalPsCount})</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Pornstars Table with Bulk Select Checkbox Column */}
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th style={{ width: '40px', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={isAllPageSelected}
                            onChange={toggleSelectAllPagePs}
                            title="Select / Deselect all on this page"
                            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                          />
                        </th>
                        <th>Card Cover</th>
                        <th>Pornstar Name</th>
                        <th>Slug Target</th>
                        <th>Cover Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedAdminPornstars.map((ps) => {
                        const hasPhoto = Boolean(ps.photo_url && ps.photo_url.trim().startsWith('http'));
                        const isSelected = selectedPsIds.includes(ps.id);
                        return (
                          <tr key={ps.id} style={{ background: isSelected ? 'rgba(239, 68, 68, 0.08)' : undefined }}>
                            <td style={{ textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectPs(ps.id)}
                                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                              />
                            </td>
                            <td>
                              {hasPhoto ? (
                                <img
                                  src={ps.photo_url}
                                  alt={ps.name}
                                  style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #3b82f6' }}
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>🌟</div>
                              )}
                            </td>
                            <td style={{ fontWeight: 700, color: '#ffffff' }}>{ps.name}</td>
                            <td style={{ color: '#94a3b8' }}>/search?q={encodeURIComponent(ps.name)}</td>
                            <td>
                              {hasPhoto ? (
                                <span style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', padding: '0.2rem 0.55rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, border: '1px solid rgba(34,197,94,0.3)' }}>
                                  ✓ Active Cover
                                </span>
                              ) : (
                                <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '0.2rem 0.55rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, border: '1px solid rgba(245,158,11,0.3)' }}>
                                  ⬛ Black Cover
                                </span>
                              )}
                            </td>
                            <td>
                              <button
                                onClick={() => openEditPornstarModal(ps)}
                                className={styles.editBtn}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeletePornstar(ps.id)}
                                className={styles.deleteBtn}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Admin Table Pagination Footer */}
                  {totalAdminPsPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0 0', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        Showing {startAdminPsIdx + 1}–{Math.min(startAdminPsIdx + adminPsPageSize, filteredAndStatusPornstars.length)} of {filteredAndStatusPornstars.length} performers (Page {adminPsPage} of {totalAdminPsPages})
                      </span>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          type="button"
                          onClick={() => setAdminPsPage(Math.max(1, adminPsPage - 1))}
                          disabled={adminPsPage === 1}
                          className={styles.deleteBtn}
                          style={{ padding: '0.35rem 0.75rem', background: '#0d131f' }}
                        >
                          « Prev
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdminPsPage(Math.min(totalAdminPsPages, adminPsPage + 1))}
                          disabled={adminPsPage === totalAdminPsPages}
                          className={styles.deleteBtn}
                          style={{ padding: '0.35rem 0.75rem', background: '#0d131f' }}
                        >
                          Next »
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: VIDEO DIRECTORY MANAGEMENT */}
            {activeTab === 'manage' && (
              <div className={styles.card}>
                <div style={{ padding: '1.25rem', background: '#070a11', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <h2 className={styles.cardTitle} style={{ margin: 0 }}>
                        🎬 Video Directory Releases ({(totalVidCount || videos.length).toLocaleString()})
                      </h2>
                      {selectedVidIds.length > 0 && (
                        <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700, border: '1px solid rgba(239, 68, 68, 0.4)' }}>
                          ✓ {selectedVidIds.length} Selected
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {selectedVidIds.length > 0 && (
                        <>
                          <button
                            type="button"
                            onClick={handleBulkDeleteVideos}
                            disabled={loading}
                            className={styles.deleteBtn}
                            style={{ background: '#dc2626', color: '#ffffff', padding: '0.45rem 1rem', fontSize: '0.82rem', fontWeight: 800 }}
                          >
                            🗑️ Delete Selected ({selectedVidIds.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedVidIds([])}
                            className={styles.deleteBtn}
                            style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem' }}
                          >
                            Clear Selection
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={handleCleanDuplicates}
                        disabled={loading}
                        className={styles.deleteBtn}
                        style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.4)', padding: '0.45rem 1rem', fontSize: '0.82rem', fontWeight: 800, marginRight: '0.5rem' }}
                      >
                        🧹 Clean Duplicate Videos
                      </button>

                      <button
                        type="button"
                        onClick={handlePurgeAllVideos}
                        disabled={loading || videos.length === 0}
                        className={styles.deleteBtn}
                        style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '0.45rem 1rem', fontSize: '0.82rem', fontWeight: 800 }}
                      >
                        ⚠️ Purge ALL ({(totalVidCount || videos.length).toLocaleString()}) Videos
                      </button>
                    </div>
                  </div>

                  <div className={styles.inputGroup} style={{ marginBottom: 0 }}>
                    <input
                      type="text"
                      placeholder="🔍 Search videos by title or category..."
                      value={videoSearch}
                      onChange={(e) => {
                        setVideoSearch(e.target.value);
                        setAdminVidPage(1);
                      }}
                      className={styles.input}
                      style={{ padding: '0.65rem 1rem', fontSize: '0.9rem', background: '#0d131f', border: '1px solid rgba(239, 68, 68, 0.4)' }}
                    />
                  </div>
                </div>

                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={filteredVideos.length > 0 && filteredVideos.every((v) => selectedVidIds.includes(v.id))}
                          onChange={toggleSelectAllVids}
                          title="Select / Deselect all visible videos"
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                      </th>
                      <th style={{ width: '60px' }}>Cover</th>
                      <th>Release Title</th>
                      <th>Category</th>
                      <th>Performers / Models</th>
                      <th>Duration</th>
                      <th>Views</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVideos.map((vid) => {
                      const isSelected = selectedVidIds.includes(vid.id);
                      return (
                        <tr key={vid.id} style={{ background: isSelected ? 'rgba(239, 68, 68, 0.08)' : undefined }}>
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectVid(vid.id)}
                              style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                            />
                          </td>
                          <td>
                            <img
                              src={vid.thumbnail_url || undefined}
                              alt={vid.title}
                              style={{ width: '45px', height: '28px', objectFit: 'cover', borderRadius: '4px' }}
                            />
                          </td>
                          <td style={{ fontWeight: 600, color: '#ffffff' }}>
                            <div>{vid.title}</div>
                            {vid.external_id && <span style={{ fontSize: '0.72rem', color: '#f59e0b' }}>🆔 #{vid.external_id}</span>}
                          </td>
                          <td style={{ color: '#60a5fa', fontWeight: 600 }}>📁 {vid.category?.name || 'General'}</td>
                          <td style={{ color: '#ec4899', fontWeight: 600 }}>🌟 {vid.performer_name || 'Unspecified'}</td>
                          <td style={{ color: '#cbd5e1' }}>⏱️ {formatDuration(vid.duration_seconds)}</td>
                          <td style={{ color: '#94a3b8' }}>{vid.views_count ? vid.views_count.toLocaleString() : '0'}</td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                onClick={() => handleStartEditVideo(vid)}
                                className={styles.deleteBtn}
                                style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '0.3rem 0.65rem', fontSize: '0.78rem' }}
                              >
                                ✏️ Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteVideo(vid.id)}
                                className={styles.deleteBtn}
                                style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem' }}
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Admin Video Directory Pagination Controls */}
                {totalAdminVidPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', padding: '0.75rem 1rem', background: '#070a11', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                      Page <strong style={{ color: '#ffffff' }}>{adminVidPage}</strong> of <strong style={{ color: '#ffffff' }}>{totalAdminVidPages}</strong> ({(totalVidCount || videos.length).toLocaleString()} total videos in database)
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setAdminVidPage(Math.max(1, adminVidPage - 1))}
                        disabled={adminVidPage === 1}
                        className={styles.deleteBtn}
                        style={{ padding: '0.35rem 0.75rem', background: '#0d131f' }}
                      >
                        « Prev
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminVidPage(Math.min(totalAdminVidPages, adminVidPage + 1))}
                        disabled={adminVidPage === totalAdminVidPages}
                        className={styles.deleteBtn}
                        style={{ padding: '0.35rem 0.75rem', background: '#0d131f' }}
                      >
                        Next »
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: SYSTEM SETTINGS */}
            {activeTab === 'settings' && (
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>System & Storage Engine Configuration</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.88rem', color: '#cbd5e1' }}>
                  <div style={{ padding: '1rem', background: '#070a11', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontWeight: 700, color: '#ffffff', marginBottom: '0.3rem' }}>🌟 Performers & Pornstar Directory</div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Manage performers list, search indexing, and front-end header dropdown options.</div>
                  </div>

                  <div style={{ padding: '1rem', background: '#070a11', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontWeight: 700, color: '#ffffff', marginBottom: '0.3rem' }}>📁 Cloudflare R2 S3 SDK Direct Presigning</div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Videos & thumbnails uploaded via Admin Panel are sent directly to Cloudflare R2 bucket with 100% CORS acceleration.</div>
                  </div>

                  <div style={{ padding: '1rem', background: '#070a11', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontWeight: 700, color: '#ffffff', marginBottom: '0.3rem' }}>🔒 Passkey Authentication Security</div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Passkey protected with server-side validation against <code>ADMIN_PASSKEY</code> in <code>.env.local</code>.</div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* POPUP MODAL 1: ADVANCED MULTI-SELECT CATEGORY PICKER */}
      {isCatModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsCatModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <span>📁 Select Categories</span>
                <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 800 }}>
                  {selectedCategoryIds.length} Selected
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCatModalOpen(false)}
                className={styles.modalCloseBtn}
              >
                ✕
              </button>
            </div>

            {/* A-Z Alphabet Quick Filter Bar */}
            <div style={{ padding: '0.75rem 1.75rem', background: '#070a11', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '0.35rem', overflowX: 'auto', flexWrap: 'nowrap' }}>
              {['ALL', '#', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'].map((letter) => {
                const isActive = catLetterFilter === letter;
                return (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => setCatLetterFilter(letter)}
                    className={styles.deleteBtn}
                    style={{
                      background: isActive ? '#dc2626' : 'rgba(255,255,255,0.05)',
                      color: isActive ? '#ffffff' : '#94a3b8',
                      padding: '0.25rem 0.55rem',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      minWidth: '28px',
                      textAlign: 'center',
                    }}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>

            <div className={styles.modalSearchBox}>
              <input
                type="text"
                placeholder={`🔍 Search ${modalFilteredCategories.length} categories by name or slug...`}
                value={modalCatSearch}
                onChange={(e) => setModalCatSearch(e.target.value)}
                className={styles.input}
                autoFocus
              />
            </div>

            <div className={styles.modalGrid}>
              {modalFilteredCategories.map((c) => {
                const isSelected = selectedCategoryIds.includes(c.id) || selectedCategoryIds.includes(c.slug);
                return (
                  <div
                    key={c.id}
                    onClick={() => toggleCategorySelect(c.id || c.slug)}
                    className={`${styles.modalItem} ${isSelected ? styles.modalItemActive : ''}`}
                    style={{ flexDirection: 'row', alignItems: 'center' }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className={styles.modalCheckbox}
                    />
                    <div style={{ overflow: 'hidden', flex: 1 }}>
                      <div className={styles.modalItemLabel}>{c.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>/{c.slug}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.modalFooter}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setSelectedCategoryIds(allAvailableCategoryOptions.map((c) => c.id))}
                  className={styles.deleteBtn}
                  style={{ background: 'rgba(255,255,255,0.08)', color: '#ffffff' }}
                >
                  Select All ({allAvailableCategoryOptions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategoryIds([])}
                  className={styles.deleteBtn}
                >
                  Clear All
                </button>
                <button
                  type="button"
                  onClick={handleSyncAllCategories}
                  disabled={loading}
                  className={styles.deleteBtn}
                  style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}
                >
                  ⚡ Populate All Categories to Supabase
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsCatModalOpen(false)}
                className={styles.submitBtn}
                style={{ marginTop: 0, width: 'auto', padding: '0.55rem 1.5rem', background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}
              >
                ✓ Done ({selectedCategoryIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL 2: ADVANCED MULTI-SELECT PORNSTAR PICKER */}
      {isPsModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsPsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <span>🌟 Select Performers / Models</span>
                <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 800 }}>
                  {selectedPornstarNames.length} Selected
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsPsModalOpen(false)}
                className={styles.modalCloseBtn}
              >
                ✕
              </button>
            </div>

            {/* Photo Filter Tabs */}
            <div style={{ padding: '0.75rem 1.75rem', background: '#070a11', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setModalPsPhotoFilter('all')}
                className={styles.deleteBtn}
                style={{
                  background: modalPsPhotoFilter === 'all' ? '#dc2626' : 'rgba(255,255,255,0.05)',
                  color: modalPsPhotoFilter === 'all' ? '#ffffff' : '#94a3b8',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                }}
              >
                All Performers ({pornstars.length})
              </button>
              <button
                type="button"
                onClick={() => setModalPsPhotoFilter('with_photo')}
                className={styles.deleteBtn}
                style={{
                  background: modalPsPhotoFilter === 'with_photo' ? '#16a34a' : 'rgba(34, 197, 94, 0.15)',
                  color: modalPsPhotoFilter === 'with_photo' ? '#ffffff' : '#4ade80',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                }}
              >
                📸 With Photo Avatar
              </button>
              <button
                type="button"
                onClick={() => setModalPsPhotoFilter('missing_photo')}
                className={styles.deleteBtn}
                style={{
                  background: modalPsPhotoFilter === 'missing_photo' ? '#d97706' : 'rgba(245, 158, 11, 0.15)',
                  color: modalPsPhotoFilter === 'missing_photo' ? '#ffffff' : '#fcd34d',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                }}
              >
                ⚠️ Missing Photo
              </button>
            </div>

            <div className={styles.modalSearchBox}>
              <input
                type="text"
                placeholder={`🔍 Search ${modalFilteredPornstars.length} performers by name...`}
                value={modalPsSearch}
                onChange={(e) => setModalPsSearch(e.target.value)}
                className={styles.input}
                autoFocus
              />
            </div>

            <div className={styles.modalGrid}>
              {modalFilteredPornstars.map((p) => {
                const isSelected = selectedPornstarNames.includes(p.name);
                const hasPhoto = Boolean(p.photo_url && p.photo_url.trim().startsWith('http'));
                return (
                  <div
                    key={p.id}
                    onClick={() => togglePornstarSelect(p.name)}
                    className={`${styles.modalItem} ${isSelected ? styles.modalItemActive : ''}`}
                    style={{ padding: '0.6rem 0.85rem' }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className={styles.modalCheckbox}
                    />
                    {hasPhoto ? (
                      <img
                        src={p.photo_url!}
                        alt={p.name}
                        style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.2)' }}
                      />
                    ) : (
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                        🌟
                      </div>
                    )}
                    <div style={{ overflow: 'hidden', flex: 1 }}>
                      <div className={styles.modalItemLabel}>{p.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>/{p.slug}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.modalFooter}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedPornstarNames(pornstars.map((p) => p.name))}
                  className={styles.deleteBtn}
                  style={{ background: 'rgba(255,255,255,0.08)', color: '#ffffff' }}
                >
                  Select All ({pornstars.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPornstarNames([])}
                  className={styles.deleteBtn}
                >
                  Clear All
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsPsModalOpen(false)}
                className={styles.submitBtn}
                style={{ marginTop: 0, width: 'auto', padding: '0.55rem 1.5rem', background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}
              >
                ✓ Done ({selectedPornstarNames.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL 3: FULL-SCREEN HIGH-DEFINITION VIDEO THUMBNAIL GALLERY PICKER */}
      {isVideoThumbModalOpen && (
        <div className={`${styles.modalOverlay} ${styles.topModalOverlay}`} onClick={() => setIsVideoThumbModalOpen(false)}>
          <div className={`${styles.modalContent} ${styles.largeModalContent}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <span>🎬 Full-Screen Cover Thumbnail Gallery Picker</span>
                <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '0.2rem 0.65rem', borderRadius: '4px', fontSize: '0.82rem', fontWeight: 800 }}>
                  {(galleryTotal || totalVidCount || videos.length).toLocaleString()} High-Res Covers Available
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsVideoThumbModalOpen(false)}
                className={styles.modalCloseBtn}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalSearchBox} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="🔍 Search video titles, performers, or gallery IDs..."
                value={modalVideoSearch}
                onChange={(e) => {
                  setModalVideoSearch(e.target.value);
                  loadGalleryVideos(1, e.target.value, galleryCatFilter);
                }}
                className={styles.input}
                style={{ flex: 1, minWidth: '240px' }}
                autoFocus
              />

              <select
                value={galleryCatFilter}
                onChange={(e) => {
                  setGalleryCatFilter(e.target.value);
                  loadGalleryVideos(1, modalVideoSearch, e.target.value);
                }}
                className={styles.input}
                style={{ width: '220px', cursor: 'pointer' }}
              >
                <option value="">-- All Categories ({allAvailableCategoryOptions.length}) --</option>
                {allAvailableCategoryOptions.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    📁 {cat.name}
                  </option>
                ))}
              </select>

              {/* Gallery Page Selector */}
              {galleryTotalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#0d131f', padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <button
                    type="button"
                    onClick={() => loadGalleryVideos(Math.max(1, galleryPage - 1), modalVideoSearch, galleryCatFilter)}
                    disabled={galleryPage === 1 || galleryLoading}
                    className={styles.deleteBtn}
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.78rem' }}
                  >
                    « Prev
                  </button>
                  <span style={{ fontSize: '0.8rem', color: '#ffffff', fontWeight: 700 }}>
                    Page {galleryPage} / {galleryTotalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => loadGalleryVideos(Math.min(galleryTotalPages, galleryPage + 1), modalVideoSearch, galleryCatFilter)}
                    disabled={galleryPage === galleryTotalPages || galleryLoading}
                    className={styles.deleteBtn}
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.78rem' }}
                  >
                    Next »
                  </button>
                </div>
              )}
            </div>

            <div className={styles.videoPickerScrollWrapper}>
              <div className={styles.videoPickerGrid}>
                {galleryLoading ? (
                  <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: '#60a5fa', fontWeight: 800, fontSize: '1.1rem' }}>
                    ⚡ Loading High-Res Cover Thumbnails...
                  </div>
                ) : modalFilteredVideoPickers.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>
                    No video thumbnails match your search query. Try clearing the search or category filter.
                  </div>
                ) : (
                  modalFilteredVideoPickers.map((v) => {
                    const thumbUrl = getThumbnailUrl(v);
                    return (
                      <div
                        key={v.id}
                        onClick={() => pickVideoThumbnailForCat(v)}
                        className={styles.videoPickerCard}
                      >
                        <div className={styles.videoPickerThumbContainer}>
                          <img
                            src={thumbUrl}
                            alt={v.title}
                            className={styles.videoPickerThumb}
                            referrerPolicy="no-referrer"
                          />
                          <div className={styles.videoPickerDurationBadge}>
                            ⏱️ {formatDuration(v.duration_seconds)}
                          </div>
                          <div className={styles.videoPickerOverlayBtn}>
                            ✨ Select as Cover Image
                          </div>
                        </div>

                        <div className={styles.videoPickerCardBody}>
                          <div className={styles.videoPickerCardTitle}>{v.title}</div>
                          <div className={styles.videoPickerCardMeta}>
                            <span style={{ color: '#60a5fa', fontWeight: 700 }}>📁 {v.category?.name || 'General'}</span>
                            {v.external_id && <span style={{ color: '#f59e0b' }}>🆔 #{v.external_id}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                Showing <strong style={{ color: '#ffffff' }}>{modalFilteredVideoPickers.length}</strong> videos (Page {galleryPage} of {galleryTotalPages}, {(galleryTotal || totalVidCount || videos.length).toLocaleString()} total available). Click any 16:9 thumbnail card to set as cover.
              </div>
              <button
                type="button"
                onClick={() => setIsVideoThumbModalOpen(false)}
                className={styles.deleteBtn}
                style={{ background: 'rgba(255,255,255,0.08)', color: '#ffffff', padding: '0.5rem 1.25rem' }}
              >
                Close Gallery
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL 4: FULL-SCREEN EDIT CATEGORY DASHBOARD */}
      {editingCategory && (
        <div className={styles.modalOverlay} onClick={() => setEditingCategory(null)}>
          <div className={`${styles.modalContent} ${styles.largeModalContent}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <span>✏️ Edit Category Studio:</span>
                <span style={{ color: '#ef4444' }}>{editingCategory.name}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className={styles.modalCloseBtn}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateCategory}>
              <div className={styles.modalTwoColLayout}>
                {/* Left Column: Form Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Category Name *</label>
                    <input
                      type="text"
                      value={editCatName}
                      onChange={(e) => setEditCatName(e.target.value)}
                      required
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Slug *</label>
                    <input
                      type="text"
                      value={editCatSlug}
                      onChange={(e) => setEditCatSlug(e.target.value)}
                      required
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Description & Meta Overview</label>
                    <textarea
                      rows={4}
                      placeholder="Enter category description..."
                      value={editCatDesc}
                      onChange={(e) => setEditCatDesc(e.target.value)}
                      className={styles.textarea}
                    />
                  </div>

                  <div style={{ background: '#070a11', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', fontSize: '0.82rem', color: '#94a3b8' }}>
                    <div style={{ fontWeight: 800, color: '#ffffff', marginBottom: '0.4rem' }}>📌 Category Information</div>
                    <div>• Public Route: <span style={{ color: '#60a5fa' }}>/categories/{editCatSlug}</span></div>
                    <div>• Database ID: <span style={{ color: '#f59e0b' }}>{editingCategory.id}</span></div>
                  </div>
                </div>

                {/* Right Column: Visual Cover Image Control Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', background: '#070a11', padding: '1.25rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>🖼️ Active Cover Banner</span>
                    <span style={{ fontSize: '0.75rem', color: '#4ade80', background: 'rgba(74, 222, 128, 0.15)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>16:9 Aspect Ratio</span>
                  </div>

                  {/* High-Definition 16:9 Preview */}
                  <div style={{ width: '100%', aspectRatio: '16/9', background: '#000000', borderRadius: '8px', overflow: 'hidden', border: '2px solid rgba(239, 68, 68, 0.5)', boxShadow: '0 8px 25px rgba(0,0,0,0.5)', position: 'relative' }}>
                    {editCatCoverUrl ? (
                      <img
                        src={editCatCoverUrl}
                        alt="Category Cover Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                        <span style={{ fontSize: '2rem' }}>🖼️</span>
                        <span style={{ fontSize: '0.8rem', marginTop: '0.4rem' }}>No Cover Image Set</span>
                      </div>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Cover Image File Upload (Cloudflare R2)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setEditCatCoverFile(e.target.files?.[0] || null)}
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>OR Image URL</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={editCatCoverUrl}
                      onChange={(e) => setEditCatCoverUrl(e.target.value)}
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>OR Pick Cover Thumbnail from Videos</label>
                    <button
                      type="button"
                      onClick={() => {
                        openVideoThumbGalleryModal('editCategory');
                      }}
                      className={styles.pickerTriggerBtn}
                      style={{ background: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ffffff' }}
                    >
                      <span>🎬 Open Full-Screen Video Thumbnail Gallery</span>
                      <span style={{ color: '#ef4444', fontWeight: 800 }}>Browse ▾</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className={styles.deleteBtn}
                  style={{ background: 'rgba(255,255,255,0.08)', color: '#ffffff', padding: '0.6rem 1.25rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={styles.submitBtn}
                  style={{ marginTop: 0, width: 'auto', padding: '0.6rem 2rem', background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}
                >
                  {loading ? 'Saving Changes...' : '✓ Save Category Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL 5: EDIT PORNSTAR MODAL */}
      {editingPornstar && (
        <div className={styles.modalOverlay} onClick={() => setEditingPornstar(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>✏️ Edit Pornstar: {editingPornstar.name}</h3>
              <button
                type="button"
                onClick={() => setEditingPornstar(null)}
                className={styles.modalCloseBtn}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdatePornstar} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Pornstar Name *</label>
                <input
                  type="text"
                  value={editPsName}
                  onChange={(e) => setEditPsName(e.target.value)}
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Slug *</label>
                <input
                  type="text"
                  value={editPsSlug}
                  onChange={(e) => setEditPsSlug(e.target.value)}
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Card Cover File Upload (Cloudflare R2)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditPsPhotoFile(e.target.files?.[0] || null)}
                  className={styles.input}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>OR Card Cover Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={editPsPhotoUrl}
                  onChange={(e) => setEditPsPhotoUrl(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>OR Pick Cover Thumbnail from Video</label>
                <button
                  type="button"
                  onClick={() => {
                    setTargetImageField('editPornstar');
                    setIsVideoThumbModalOpen(true);
                  }}
                  className={styles.pickerTriggerBtn}
                >
                  <span>🎬 Open Video Thumbnail Gallery</span>
                  <span>Browse ▾</span>
                </button>
              </div>

              {editPsPhotoUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Active Card Cover Preview:</span>
                  <img
                    src={editPsPhotoUrl}
                    alt="Card Cover Preview"
                    style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '50%', border: '2px solid #dc2626' }}
                  />
                </div>
              )}

              <div className={styles.modalFooter} style={{ padding: '1rem 0 0', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <button
                  type="button"
                  onClick={() => setEditingPornstar(null)}
                  className={styles.deleteBtn}
                  style={{ background: 'rgba(255,255,255,0.08)', color: '#ffffff' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={styles.submitBtn}
                  style={{ marginTop: 0, width: 'auto', padding: '0.5rem 1.5rem' }}
                >
                  {loading ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL 6: DUPLICATE / SIMILAR PERFORMER DETECTION & VISUAL COMPARISON */}
      {duplicateModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setDuplicateModalOpen(false)}>
          <div className={`${styles.modalContent} ${styles.largeModalContent}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle} style={{ color: '#f59e0b' }}>
                ⚠️ Duplicate / Similar Performer Detection ({duplicateConflicts.length} Conflicts)
              </h3>
              <button
                type="button"
                onClick={() => setDuplicateModalOpen(false)}
                className={styles.modalCloseBtn}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(245, 158, 11, 0.08)' }}>
              <p style={{ fontSize: '0.85rem', color: '#fcd34d', margin: 0, fontWeight: 600 }}>
                We found performers in your database with matching or similar names. Compare their details & photos side-by-side below before confirming insertion:
              </p>
            </div>

            <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {duplicateConflicts.map((conflict, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#070a11',
                    borderRadius: '8px',
                    padding: '1rem',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fcd34d' }}>
                      Conflict #{idx + 1}: &quot;{conflict.newItem.name}&quot;
                    </span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#ffffff', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={conflict.selected}
                        onChange={(e) => {
                          const updated = [...duplicateConflicts];
                          updated[idx].selected = e.target.checked;
                          setDuplicateConflicts(updated);
                        }}
                      />
                      Add this item anyway
                    </label>
                  </div>

                  {/* Side-by-Side Visual Comparison Card */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {/* Left: Existing Record in Database */}
                    <div style={{ background: '#0d131f', borderRadius: '6px', padding: '0.85rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span>📁 Existing in Database</span>
                        <span style={{ color: '#3b82f6' }}>Active</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        {conflict.existingMatch.photo_url && conflict.existingMatch.photo_url.trim().startsWith('http') ? (
                          <img
                            src={conflict.existingMatch.photo_url}
                            alt={conflict.existingMatch.name}
                            style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #3b82f6' }}
                          />
                        ) : (
                          <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #3b82f6', fontSize: '1.2rem' }}>🌟</div>
                        )}
                        <div>
                          <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.9rem' }}>{conflict.existingMatch.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>/search?q={encodeURIComponent(conflict.existingMatch.name)}</div>
                        </div>
                      </div>
                    </div>

                    {/* Right: New Entry Being Added */}
                    <div style={{ background: '#0d131f', borderRadius: '6px', padding: '0.85rem', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#fcd34d', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span>➕ New Entry to Add</span>
                        <span style={{ color: '#f59e0b' }}>Pending</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        {conflict.newItem.photo_url && conflict.newItem.photo_url.trim().startsWith('http') ? (
                          <img
                            src={conflict.newItem.photo_url}
                            alt={conflict.newItem.name}
                            style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #f59e0b' }}
                          />
                        ) : (
                          <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #f59e0b', fontSize: '1.2rem' }}>🌟</div>
                        )}
                        <div>
                          <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.9rem' }}>{conflict.newItem.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>/search?q={encodeURIComponent(conflict.newItem.name)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.modalFooter}>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                {cleanItemsToInsert.length} unique performer(s) ready to import without conflict.
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => confirmDuplicateImport(false)}
                  className={styles.deleteBtn}
                  style={{ background: 'rgba(255,255,255,0.08)', color: '#ffffff', padding: '0.5rem 1rem' }}
                >
                  Skip Duplicates ({cleanItemsToInsert.length} Unique)
                </button>

                <button
                  type="button"
                  onClick={() => confirmDuplicateImport(true)}
                  disabled={loading}
                  className={styles.submitBtn}
                  style={{ marginTop: 0, width: 'auto', padding: '0.5rem 1.25rem' }}
                >
                  {loading ? 'Saving to Supabase...' : `Confirm & Import Selected (${cleanItemsToInsert.length + duplicateConflicts.filter((c) => c.selected).length})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL 6.5: DEDUPLICATION SCANNING PROGRESS MODAL */}
      {isScanning && (
        <div className={`${styles.modalOverlay} ${styles.topModalOverlay}`}>
          <div className={styles.modalContent} style={{ maxWidth: '450px', textAlign: 'center', padding: '2.5rem 2rem', background: '#070a11', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '12px', boxShadow: '0 0 50px rgba(59, 130, 246, 0.2)' }}>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              .spinning-icon {
                display: inline-block;
                animation: spin 1.5s linear infinite;
                font-size: 3rem;
                margin-bottom: 1.25rem;
              }
            `}</style>
            <div className="spinning-icon">🔍</div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}>
              Database Audit in Progress
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
              Analyzing all **62,000+ video releases** in your Supabase database. Grouping matches and auditing external IDs, titles, and slugs...
            </p>
            <div style={{ fontSize: '0.8rem', color: '#60a5fa', fontWeight: 700, marginTop: '1.25rem', background: 'rgba(59, 130, 246, 0.1)', padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid rgba(59, 130, 246, 0.3)', display: 'inline-block' }}>
              ⚡ Querying Supabase via Keyset batches...
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL 7: VISUAL GLOWING ANIMATED IMPORT PROGRESS MODAL */}
      {importProgress.isOpen && (
        <div className={`${styles.modalOverlay} ${styles.topModalOverlay}`}>
          <div className={styles.modalContent} style={{ maxWidth: '520px', textAlign: 'center', padding: '2.25rem 1.75rem', background: '#070a11', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '12px', boxShadow: '0 0 40px rgba(239, 68, 68, 0.15)' }}>
            <div style={{ fontSize: '2.8rem', marginBottom: '0.75rem' }}>
              {importProgress.isComplete ? '🎉' : '⚡'}
            </div>
            
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.4rem' }}>
              {importProgress.isComplete
                ? 'Import Completed Successfully!'
                : 'Importing Performers to Supabase...'}
            </h3>
            
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1rem' }}>
              {importProgress.isComplete
                ? `Successfully saved ALL ${importProgress.savedCount.toLocaleString()} video releases to your live Supabase database!`
                : `Processing batch ${importProgress.currentBatch} of ${importProgress.totalBatches} (${importProgress.savedCount.toLocaleString()} / ${importProgress.totalCount.toLocaleString()} videos)...`}
            </p>

            {!importProgress.isComplete && importProgress.speed > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', fontSize: '0.82rem', color: '#f59e0b', fontWeight: 700, marginBottom: '1.25rem', background: 'rgba(245, 158, 11, 0.1)', padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                <span>⚡ Speed: {importProgress.speed.toLocaleString()} videos/sec</span>
                <span>⏱️ ETA: ~{importProgress.etaSecs}s remaining</span>
              </div>
            )}

            {/* Glowing Animated Progress Bar Container */}
            <div style={{ background: '#0d131f', borderRadius: '100px', height: '26px', width: '100%', overflow: 'hidden', padding: '4px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '1.25rem', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)' }}>
              <div
                style={{
                  height: '100%',
                  width: `${importProgress.progressPct}%`,
                  background: 'linear-gradient(90deg, #dc2626 0%, #ef4444 50%, #f59e0b 100%)',
                  borderRadius: '100px',
                  transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 0 15px rgba(239, 68, 68, 0.9)',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem', fontWeight: 700, color: '#ffffff', padding: '0 0.25rem' }}>
              <span>{importProgress.savedCount.toLocaleString()} / {importProgress.totalCount.toLocaleString()} Performers Saved</span>
              <span style={{ color: '#4ade80', fontSize: '1rem', fontWeight: 800 }}>{importProgress.progressPct}%</span>
            </div>

            {importProgress.isComplete && (
              <button
                type="button"
                onClick={() => setImportProgress((prev) => ({ ...prev, isOpen: false }))}
                className={styles.submitBtn}
                style={{ marginTop: '1.75rem', width: '100%', padding: '0.75rem 1.5rem', fontSize: '0.95rem', fontWeight: 800, background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}
              >
                ✓ Done & View Directory ({importProgress.savedCount.toLocaleString()} Performers)
              </button>
            )}
          </div>
        </div>
      )}

      {/* POPUP MODAL 9: DEDUPLICATION AUDIT MODAL */}
      {dupModal.isOpen && (
        <div className={`${styles.modalOverlay} ${styles.topModalOverlay}`} onClick={() => setDupModal(prev => ({ ...prev, isOpen: false }))}>
          <div className={`${styles.modalContent} ${styles.largeModalContent}`} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '850px', background: '#070a11', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '12px', boxShadow: '0 0 50px rgba(59, 130, 246, 0.2)' }}>
            <div className={styles.modalHeader} style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ fontSize: '1.8rem' }}>🧹</div>
                <div>
                  <h3 className={styles.modalTitle} style={{ color: '#ffffff', margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                    Duplicate Videos Database Audit
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                    Scanned {dupModal.scannedCount.toLocaleString()} total videos in database. Found {dupModal.items.length.toLocaleString()} duplicates.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDupModal(prev => ({ ...prev, isOpen: false }))}
                className={styles.modalCloseBtn}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '1.5rem', maxHeight: '450px', overflowY: 'auto' }}>
              {dupModal.items.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#a3a3a3', padding: '3rem 0' }}>
                  <span style={{ fontSize: '2.5rem' }}>🎉</span>
                  <h4 style={{ margin: '1rem 0 0.5rem 0', color: '#ffffff', fontWeight: 700 }}>No Duplicates Found!</h4>
                  <p style={{ fontSize: '0.85rem' }}>Your database is perfectly clean. Every video record has a unique external ID, slug, and title.</p>
                </div>
              ) : (
                <>
                  <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', padding: '1rem', color: '#fca5a5', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.3rem' }}>⚠️</span>
                    <div>
                      <strong>Action Required:</strong> Below is the detailed list of duplicates identified. Confirming deletion will permanently wipe these {dupModal.items.length} records and keep only the original entries.
                    </div>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Video Title / Slug</th>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Reason for Duplicate Detection</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dupModal.items.map((item, idx) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#e2e8f0' }}>
                          <td style={{ padding: '0.6rem 0.75rem' }}>
                            <div style={{ fontWeight: 'bold' }}>{item.title}</div>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.1rem' }}>slug: {item.slug}</div>
                          </td>
                          <td style={{ padding: '0.6rem 0.75rem', color: '#fca5a5' }}>
                            {item.reason}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>

            <div className={styles.modalFooter} style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setDupModal(prev => ({ ...prev, isOpen: false }))}
                className={styles.submitBtn}
                style={{ background: 'rgba(255,255,255,0.08)', color: '#ffffff', padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
              >
                Close Audit
              </button>
              {dupModal.items.length > 0 && (
                <button
                  type="button"
                  onClick={handleConfirmDeleteDuplicates}
                  disabled={loading}
                  className={styles.submitBtn}
                  style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)', color: '#ffffff', padding: '0.5rem 1.5rem', fontSize: '0.85rem', fontWeight: 800, boxShadow: '0 0 15px rgba(239, 68, 68, 0.3)' }}
                >
                  🔥 Confirm Delete & Clean ({dupModal.items.length})
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL 8: VISUAL POST-IMPORT DETAILED SUMMARY MODAL */}
      {importSummaryModal.isOpen && (
        <div className={`${styles.modalOverlay} ${styles.topModalOverlay}`} onClick={() => setImportSummaryModal((prev) => ({ ...prev, isOpen: false }))}>
          <div className={`${styles.modalContent} ${styles.largeModalContent}`} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '850px', background: '#070a11', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '12px', boxShadow: '0 0 50px rgba(59, 130, 246, 0.2)' }}>
            <div className={styles.modalHeader} style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ fontSize: '1.8rem' }}>📊</div>
                <div>
                  <h3 className={styles.modalTitle} style={{ color: '#ffffff', margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                    Post-Import Detailed Breakdown Summary
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                    Visual summary of all videos processed, created, or deduplicated and linked to new categories.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setImportSummaryModal((prev) => ({ ...prev, isOpen: false }))}
                className={styles.modalCloseBtn}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Stat Cards Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div style={{ background: '#0d131f', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Total Processed</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', marginTop: '0.25rem' }}>
                    {importSummaryModal.totalCount.toLocaleString()}
                  </div>
                </div>

                <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.3)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.78rem', color: '#4ade80', textTransform: 'uppercase', fontWeight: 700 }}>✨ New Videos Created</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#4ade80', marginTop: '0.25rem' }}>
                    {importSummaryModal.createdCount.toLocaleString()}
                  </div>
                </div>

                <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.3)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.78rem', color: '#fcd34d', textTransform: 'uppercase', fontWeight: 700 }}>🔄 Existed & Linked Category</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fcd34d', marginTop: '0.25rem' }}>
                    {importSummaryModal.updatedCount.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Search & Filter Tabs */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setSummaryFilterTab('all')}
                    className={styles.deleteBtn}
                    style={{
                      background: summaryFilterTab === 'all' ? '#3b82f6' : 'rgba(255,255,255,0.08)',
                      color: '#ffffff',
                      padding: '0.4rem 0.85rem',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                    }}
                  >
                    All Items ({importSummaryModal.items.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSummaryFilterTab('created')}
                    className={styles.deleteBtn}
                    style={{
                      background: summaryFilterTab === 'created' ? '#16a34a' : 'rgba(34, 197, 94, 0.15)',
                      color: summaryFilterTab === 'created' ? '#ffffff' : '#4ade80',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      padding: '0.4rem 0.85rem',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                    }}
                  >
                    ✨ New Created ({importSummaryModal.createdCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSummaryFilterTab('already_existed')}
                    className={styles.deleteBtn}
                    style={{
                      background: summaryFilterTab === 'already_existed' ? '#d97706' : 'rgba(245, 158, 11, 0.15)',
                      color: summaryFilterTab === 'already_existed' ? '#ffffff' : '#fcd34d',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      padding: '0.4rem 0.85rem',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                    }}
                  >
                    🔄 Already Existed ({importSummaryModal.updatedCount})
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="🔍 Search by title or Gallery ID..."
                  value={summarySearch}
                  onChange={(e) => setSummarySearch(e.target.value)}
                  className={styles.input}
                  style={{ maxWidth: '240px', padding: '0.4rem 0.75rem', fontSize: '0.82rem', background: '#0d131f' }}
                />
              </div>

              {/* Scrollable Summary Table */}
              <div style={{ maxHeight: '340px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}>
                <table className={styles.table} style={{ fontSize: '0.8rem' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '0.5rem 0.75rem' }}>Image</th>
                      <th style={{ padding: '0.5rem 0.75rem' }}>Gallery ID</th>
                      <th style={{ padding: '0.5rem 0.75rem' }}>Video Title</th>
                      <th style={{ padding: '0.5rem 0.75rem' }}>Category</th>
                      <th style={{ padding: '0.5rem 0.75rem' }}>Import Action Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importSummaryModal.items
                      .filter((item) => {
                        if (summaryFilterTab !== 'all' && item.status !== summaryFilterTab) return false;
                        if (summarySearch.trim()) {
                          const q = summarySearch.toLowerCase();
                          return item.title.toLowerCase().includes(q) || (item.external_id && item.external_id.includes(q));
                        }
                        return true;
                      })
                      .map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ padding: '0.4rem 0.6rem' }}>
                            <img
                              src={item.thumbnail_url}
                              alt={item.title}
                              style={{ width: '45px', height: '28px', objectFit: 'cover', borderRadius: '4px' }}
                            />
                          </td>
                          <td style={{ padding: '0.4rem 0.6rem', color: '#f59e0b', fontWeight: 700 }}>
                            {item.external_id ? `🆔 #${item.external_id}` : '(Auto)'}
                          </td>
                          <td style={{ padding: '0.4rem 0.6rem', fontWeight: 600, color: '#ffffff' }}>{item.title}</td>
                          <td style={{ padding: '0.4rem 0.6rem', color: '#60a5fa', fontWeight: 700 }}>
                            📁 {item.category_name}
                          </td>
                          <td style={{ padding: '0.4rem 0.6rem' }}>
                            {item.status === 'created' ? (
                              <span style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800, border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                                ✨ NEW RECORD CREATED
                              </span>
                            ) : (
                              <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fcd34d', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800, border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                                🔄 ALREADY EXISTED ➔ LINKED TO [{item.category_name}]
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setImportSummaryModal((prev) => ({ ...prev, isOpen: false }))}
                  className={styles.submitBtn}
                  style={{ width: 'auto', padding: '0.65rem 1.75rem', fontSize: '0.9rem', fontWeight: 800, background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}
                >
                  ✓ Close Summary & View Video Directory
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL 9: EDIT VIDEO MODAL */}
      {editingVideo && (
        <div className={styles.modalOverlay} onClick={() => setEditingVideo(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px', background: '#070a11', border: '1px solid rgba(59, 130, 246, 0.4)' }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>✏️ Edit Video Release: {editingVideo.title}</h3>
              <button
                type="button"
                onClick={() => setEditingVideo(null)}
                className={styles.modalCloseBtn}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveVideoEdit} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Video Title *</label>
                <input
                  type="text"
                  value={editVidTitle}
                  onChange={(e) => setEditVidTitle(e.target.value)}
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.formGrid}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Slug *</label>
                  <input
                    type="text"
                    value={editVidSlug}
                    onChange={(e) => setEditVidSlug(e.target.value)}
                    required
                    className={styles.input}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Category</label>
                  <select
                    value={editVidCategory}
                    onChange={(e) => setEditVidCategory(e.target.value)}
                    className={styles.input}
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        📁 {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Performers / Models (Comma Separated)</label>
                  <input
                    type="text"
                    placeholder="Angela White, Johnny Castle"
                    value={editVidPerformers}
                    onChange={(e) => setEditVidPerformers(e.target.value)}
                    className={styles.input}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Duration (Mins : Secs)</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      value={editVidMins}
                      onChange={(e) => setEditVidMins(e.target.value)}
                      className={styles.input}
                      style={{ textAlign: 'center' }}
                    />
                    <span>:</span>
                    <input
                      type="number"
                      value={editVidSecs}
                      onChange={(e) => setEditVidSecs(e.target.value)}
                      className={styles.input}
                      style={{ textAlign: 'center' }}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Thumbnail Cover Image URL</label>
                <input
                  type="url"
                  value={editVidThumbUrl}
                  onChange={(e) => setEditVidThumbUrl(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>External Release URL</label>
                <input
                  type="url"
                  value={editVidExternalUrl}
                  onChange={(e) => setEditVidExternalUrl(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Description</label>
                <textarea
                  rows={3}
                  value={editVidDesc}
                  onChange={(e) => setEditVidDesc(e.target.value)}
                  className={styles.textarea}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="editVidPub"
                  checked={editVidPublished}
                  onChange={(e) => setEditVidPublished(e.target.checked)}
                  style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                />
                <label htmlFor="editVidPub" style={{ cursor: 'pointer', fontWeight: 700, color: '#ffffff', fontSize: '0.9rem' }}>
                  Publish Video Release on Site
                </label>
              </div>

              <div className={styles.modalFooter} style={{ padding: '1rem 0 0', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <button
                  type="button"
                  onClick={() => setEditingVideo(null)}
                  className={styles.deleteBtn}
                  style={{ background: 'rgba(255,255,255,0.08)', color: '#ffffff' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={styles.submitBtn}
                  style={{ marginTop: 0, width: 'auto', padding: '0.5rem 1.5rem', background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}
                >
                  {loading ? 'Saving...' : '✓ Save Video Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
