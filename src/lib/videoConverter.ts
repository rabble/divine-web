// ABOUTME: Utility for converting videos to MP4 format using FFmpeg.wasm
// ABOUTME: Ensures maximum compatibility across all platforms (web, iOS, Android)

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpegInstance: FFmpeg | null = null;
let isLoading = false;
let isLoaded = false;

/**
 * Load FFmpeg.wasm instance
 * Singleton pattern to avoid loading multiple times
 */
export async function loadFFmpeg(): Promise<FFmpeg> {
  if (isLoaded && ffmpegInstance) {
    return ffmpegInstance;
  }

  if (isLoading) {
    // Wait for existing load to complete
    while (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (ffmpegInstance) {
      return ffmpegInstance;
    }
  }

  isLoading = true;

  try {
    console.log('[FFmpeg] Loading FFmpeg.wasm...');
    const ffmpeg = new FFmpeg();

    // Set up logging
    ffmpeg.on('log', ({ message }) => {
      console.log('[FFmpeg]', message);
    });

    // Load FFmpeg core from CDN
    console.log('[FFmpeg] Fetching core files from CDN...');
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    console.log('[FFmpeg] Successfully loaded!');
    ffmpegInstance = ffmpeg;
    isLoaded = true;
    return ffmpeg;
  } catch (error) {
    console.error('[FFmpeg] Failed to load FFmpeg:', error);
    isLoading = false;
    throw new Error(`Failed to load video converter: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    isLoading = false;
  }
}

/**
 * Set up progress callback for FFmpeg
 * This must be called before each conversion to ensure progress updates work
 */
function setupProgressHandler(ffmpeg: FFmpeg, onProgress?: (progress: number) => void) {
  if (!onProgress) return;

  console.log('[FFmpeg] Setting up progress handler...');

  // Remove any existing progress handlers to avoid duplicates
  ffmpeg.off('progress');

  // Add new progress handler
  ffmpeg.on('progress', ({ progress }) => {
    console.log('[FFmpeg] Progress event fired:', progress);
    onProgress(progress);
  });
}

export interface ConvertToMP4Options {
  blob: Blob;
  onProgress?: (progress: number) => void;
  quality?: 'high' | 'medium' | 'low';
}

export interface ConvertToMP4Result {
  blob: Blob;
  blobUrl: string;
  sizeReduction: number; // percentage
}

/**
 * Concatenate multiple video segments into a single video
 */
export async function concatenateVideos(
  segments: Blob[],
  onProgress?: (progress: number) => void
): Promise<Blob> {
  if (segments.length === 0) {
    throw new Error('No video segments to concatenate');
  }

  if (segments.length === 1) {
    return segments[0];
  }

  console.log('[VideoConverter] Concatenating', segments.length, 'video segments...');

  try {
    const ffmpeg = await loadFFmpeg();
    setupProgressHandler(ffmpeg, onProgress);

    // Write each segment as a separate file
    const inputFiles: string[] = [];
    for (let i = 0; i < segments.length; i++) {
      const filename = `segment${i}.webm`;
      console.log(`[VideoConverter] Writing segment ${i + 1}/${segments.length}`);
      await ffmpeg.writeFile(filename, await fetchFile(segments[i]));
      inputFiles.push(filename);
    }

    // Create concat file list
    const concatList = inputFiles.map(f => `file '${f}'`).join('\n');
    await ffmpeg.writeFile('concat_list.txt', concatList);

    console.log('[VideoConverter] Concatenating files...');

    // Use concat demuxer for same-format files
    await ffmpeg.exec([
      '-f', 'concat',
      '-safe', '0',
      '-i', 'concat_list.txt',
      '-c', 'copy',
      'concatenated.webm'
    ]);

    // Read the output
    const data = await ffmpeg.readFile('concatenated.webm');
    const blob = new Blob([data], { type: 'video/webm' });

    // Cleanup
    await ffmpeg.deleteFile('concat_list.txt');
    await ffmpeg.deleteFile('concatenated.webm');
    for (const file of inputFiles) {
      await ffmpeg.deleteFile(file);
    }

    console.log('[VideoConverter] Concatenation complete');
    return blob;
  } catch (error) {
    console.error('[VideoConverter] Concatenation failed:', error);
    throw new Error(`Failed to concatenate videos: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert a video blob to MP4 format with H.264 codec
 * Ensures maximum compatibility across all platforms
 */
export async function convertToMP4(options: ConvertToMP4Options): Promise<ConvertToMP4Result> {
  const { blob, onProgress, quality = 'medium' } = options;

  console.log('[VideoConverter] Starting conversion...', {
    inputType: blob.type,
    inputSize: `${(blob.size / 1024 / 1024).toFixed(2)}MB`,
    quality,
  });

  // Check if already MP4 with H.264
  if (blob.type === 'video/mp4') {
    console.log('[VideoConverter] Video is already MP4, skipping conversion');
    return {
      blob,
      blobUrl: URL.createObjectURL(blob),
      sizeReduction: 0,
    };
  }

  try {
    console.log('[VideoConverter] Loading FFmpeg...');
    // Load FFmpeg
    const ffmpeg = await loadFFmpeg();
    console.log('[VideoConverter] FFmpeg loaded, setting up progress tracking...');

    // Set up progress handler for this conversion
    setupProgressHandler(ffmpeg, onProgress);

    // Input/output filenames
    const inputName = 'input' + getFileExtension(blob.type);
    const outputName = 'output.mp4';

    // Write input file
    console.log('[VideoConverter] Writing input file...');
    await ffmpeg.writeFile(inputName, await fetchFile(blob));
    console.log('[VideoConverter] Input file written');

    // Quality settings
    // Using 'ultrafast' preset for much faster conversion in browser
    // CRF 23 is good quality, lower number = higher quality but slower
    const qualitySettings = {
      high: { crf: 20, preset: 'veryfast' },
      medium: { crf: 23, preset: 'ultrafast' },
      low: { crf: 28, preset: 'ultrafast' },
    };

    const { crf, preset } = qualitySettings[quality];

    console.log('[VideoConverter] Converting to MP4 with H.264...');
    // Convert to MP4 with H.264
    // -c:v libx264 = H.264 video codec (universal compatibility)
    // -c:a aac = AAC audio codec (universal compatibility)
    // -crf = quality (18-28, lower is better)
    // -preset = encoding speed vs compression (slow, medium, fast)
    // -movflags +faststart = web optimization (allows streaming before full download)
    // -pix_fmt yuv420p = color format compatible with all players
    await ffmpeg.exec([
      '-i', inputName,
      '-c:v', 'libx264',
      '-crf', crf.toString(),
      '-preset', preset,
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      '-pix_fmt', 'yuv420p',
      outputName,
    ]);

    console.log('[VideoConverter] Conversion complete, reading output...');
    // Read output file
    const data = await ffmpeg.readFile(outputName);
    const mp4Blob = new Blob([data], { type: 'video/mp4' });

    // Clean up
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    // Calculate size reduction
    const sizeReduction = ((blob.size - mp4Blob.size) / blob.size) * 100;

    console.log('[VideoConverter] Conversion complete!', {
      originalType: blob.type,
      originalSize: `${(blob.size / 1024 / 1024).toFixed(2)}MB`,
      mp4Size: `${(mp4Blob.size / 1024 / 1024).toFixed(2)}MB`,
      sizeReduction: `${sizeReduction.toFixed(1)}%`,
    });

    return {
      blob: mp4Blob,
      blobUrl: URL.createObjectURL(mp4Blob),
      sizeReduction,
    };
  } catch (error) {
    console.error('[VideoConverter] Conversion failed:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to convert video to MP4: ${error.message}`);
    }
    throw new Error('Failed to convert video to MP4');
  }
}

/**
 * Get file extension from MIME type
 */
function getFileExtension(mimeType: string): string {
  const extensions: Record<string, string> = {
    'video/webm': '.webm',
    'video/mp4': '.mp4',
    'video/quicktime': '.mov',
    'video/x-msvideo': '.avi',
    'image/gif': '.gif',
  };
  return extensions[mimeType] || '.webm';
}

/**
 * Combine multiple video segments and convert to MP4
 */
export async function combineAndConvertToMP4(
  segments: Blob[],
  onProgress?: (progress: number) => void
): Promise<ConvertToMP4Result> {
  console.log('[VideoConverter] combineAndConvertToMP4 called with', segments.length, 'segment(s)');

  // If only one segment, convert it directly
  if (segments.length === 1) {
    console.log('[VideoConverter] Single segment, converting directly...');
    return convertToMP4({ blob: segments[0], onProgress });
  }

  console.log('[VideoConverter] Multiple segments, combining and converting...');

  try {
    // Load FFmpeg
    console.log('[VideoConverter] Loading FFmpeg for multi-segment conversion...');
    const ffmpeg = await loadFFmpeg();

    // Set up progress handler for this conversion
    setupProgressHandler(ffmpeg, onProgress);

    // Write all input files
    console.log('[VideoConverter] Writing', segments.length, 'input files...');
    const inputFiles: string[] = [];
    for (let i = 0; i < segments.length; i++) {
      const filename = `input${i}.webm`;
      await ffmpeg.writeFile(filename, await fetchFile(segments[i]));
      inputFiles.push(filename);
      console.log('[VideoConverter] Wrote', filename);
    }

    // Create concat file
    console.log('[VideoConverter] Creating concat file...');
    const concatContent = inputFiles.map(f => `file '${f}'`).join('\n');
    await ffmpeg.writeFile('concat.txt', new TextEncoder().encode(concatContent));

    const outputName = 'output.mp4';

    // Concatenate and convert to MP4
    console.log('[VideoConverter] Concatenating and converting to MP4...');
    await ffmpeg.exec([
      '-f', 'concat',
      '-safe', '0',
      '-i', 'concat.txt',
      '-c:v', 'libx264',
      '-crf', '23',
      '-preset', 'ultrafast',  // Fastest preset for browser conversion
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      '-pix_fmt', 'yuv420p',
      outputName,
    ]);

    // Read output file
    console.log('[VideoConverter] Reading output file...');
    const data = await ffmpeg.readFile(outputName);
    const mp4Blob = new Blob([data], { type: 'video/mp4' });

    // Clean up
    await ffmpeg.deleteFile('concat.txt');
    for (const filename of inputFiles) {
      await ffmpeg.deleteFile(filename);
    }
    await ffmpeg.deleteFile(outputName);

    const totalSize = segments.reduce((sum, seg) => sum + seg.size, 0);
    const sizeReduction = ((totalSize - mp4Blob.size) / totalSize) * 100;

    console.log('[VideoConverter] Combined', segments.length, 'segments → MP4', {
      originalSize: `${(totalSize / 1024 / 1024).toFixed(2)}MB`,
      mp4Size: `${(mp4Blob.size / 1024 / 1024).toFixed(2)}MB`,
      sizeReduction: `${sizeReduction.toFixed(1)}%`,
    });

    return {
      blob: mp4Blob,
      blobUrl: URL.createObjectURL(mp4Blob),
      sizeReduction,
    };
  } catch (error) {
    console.error('[VideoConverter] Video combination/conversion failed:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to combine and convert videos to MP4: ${error.message}`);
    }
    throw new Error('Failed to combine and convert videos to MP4');
  }
}
