// ABOUTME: ProofMode verification utilities
// ABOUTME: Functions for validating and displaying ProofMode cryptographic proofs

import type { ProofModeData, ProofModeLevel } from '@/types/video';

/**
 * Manifest structure from Flutter app
 */
export interface ProofManifest {
  sessionId: string;
  deviceId?: string;
  startTime?: number;
  endTime?: number;
  frameHashes?: string[];
  videoHash?: string;
  location?: {
    latitude?: number;
    longitude?: number;
    accuracy?: number;
  };
  metadata?: Record<string, unknown>;
}

/**
 * Determine the verification level based on available proof data
 */
export function determineVerificationLevel(proofData?: ProofModeData): ProofModeLevel {
  if (!proofData) return 'unverified';

  const hasManifest = !!proofData.manifest && !!proofData.manifestData;
  const hasAttestation = !!proofData.deviceAttestation;
  const hasSignature = !!proofData.pgpFingerprint;

  // Highest level: Hardware attestation + manifest + signature
  if (hasAttestation && hasManifest && hasSignature) {
    return 'verified_mobile';
  }

  // Medium level: Manifest + signature (no hardware)
  if (hasManifest && hasSignature) {
    return 'verified_web';
  }

  // Basic: Has some proof data
  if (hasManifest || hasSignature || hasAttestation) {
    return 'basic_proof';
  }

  return 'unverified';
}

/**
 * Parse ProofMode manifest JSON
 */
export function parseManifest(manifestJson?: string): ProofManifest | null {
  if (!manifestJson) return null;

  try {
    const data = JSON.parse(manifestJson);
    return data as ProofManifest;
  } catch {
    return null;
  }
}

/**
 * Get a human-readable summary of the proof
 */
export function getProofSummary(proofData?: ProofModeData): string | null {
  if (!proofData || proofData.level === 'unverified') {
    return null;
  }

  const manifest = parseManifest(proofData.manifest);
  const parts: string[] = [];

  if (proofData.deviceAttestation) {
    parts.push('Hardware verified');
  }

  if (manifest?.frameHashes && manifest.frameHashes.length > 0) {
    parts.push(`${manifest.frameHashes.length} frames verified`);
  }

  if (proofData.pgpFingerprint) {
    parts.push('Cryptographically signed');
  }

  if (manifest?.sessionId) {
    parts.push(`Session: ${manifest.sessionId.slice(0, 8)}...`);
  }

  return parts.length > 0 ? parts.join(' • ') : null;
}

/**
 * Verify ProofMode data (placeholder for future implementation)
 * In a full implementation, this would:
 * - Verify PGP signature
 * - Validate device attestation token
 * - Check frame hash integrity
 * - Verify video file hash matches manifest
 */
export async function verifyProof(_proofData: ProofModeData): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
}> {
  // TODO: Implement actual verification
  // This would require:
  // - PGP library for signature verification
  // - Platform-specific attestation verification
  // - Video hash calculation and comparison

  return {
    isValid: true,
    errors: [],
    warnings: ['Full verification not yet implemented']
  };
}

/**
 * Format device attestation info for display
 */
export function formatAttestationInfo(attestation?: string): string | null {
  if (!attestation) return null;

  // Attestation tokens are typically long base64 strings
  // Show a truncated version for display
  if (attestation.length > 20) {
    return `${attestation.slice(0, 16)}...`;
  }

  return attestation;
}

/**
 * Get verification level badge color
 */
export function getVerificationColor(level: ProofModeLevel): string {
  switch (level) {
    case 'verified_mobile':
      return 'green';
    case 'verified_web':
      return 'blue';
    case 'basic_proof':
      return 'yellow';
    default:
      return 'gray';
  }
}
