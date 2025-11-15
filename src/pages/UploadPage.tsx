// ABOUTME: Main upload page for recording and publishing videos
// ABOUTME: Orchestrates camera recording, file upload, metadata input, and publishing flow

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CameraRecorder } from '@/components/CameraRecorder';
import { VideoMetadataForm } from '@/components/VideoMetadataForm';
import { VideoMetadataFormFile } from '@/components/VideoMetadataFormFile';
import { FileUploadPicker } from '@/components/FileUploadPicker';
import { Button } from '@/components/ui/button';
import { Camera, Upload } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';

type UploadStep = 'choose' | 'record' | 'upload-file' | 'metadata' | 'metadata-file';

interface RecordedSegment {
  blob: Blob;
  blobUrl: string;
}

interface UploadedFile {
  file: File;
  previewUrl: string;
  duration: number;
}

export function UploadPage() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const [step, setStep] = useState<UploadStep>('choose');
  const [recordedSegments, setRecordedSegments] = useState<RecordedSegment[]>([]);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);

  // Require login to upload
  if (!user) {
    return (
      <div className="container max-w-lg mx-auto py-12 px-4">
        <div className="text-center space-y-4">
          <Camera className="h-16 w-16 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold">Login Required</h1>
          <p className="text-muted-foreground">
            You need to be logged in to upload videos
          </p>
          <Button onClick={() => navigate('/')}>
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  // Handle recording completion
  const handleRecordingComplete = (segments: RecordedSegment[]) => {
    setRecordedSegments(segments);
    setStep('metadata');
  };

  // Handle file selection
  const handleFileSelected = (file: File, previewUrl: string, duration: number) => {
    setUploadedFile({ file, previewUrl, duration });
    setStep('metadata-file');
  };

  // Handle publish completion (for recorded videos)
  const handlePublished = () => {
    // Clean up recorded segments
    recordedSegments.forEach(segment => {
      URL.revokeObjectURL(segment.blobUrl);
    });
    setRecordedSegments([]);
    setStep('choose');

    // Navigate to home to see the published video
    navigate('/');
  };

  // Handle publish completion (for uploaded files)
  const handleFilePublished = () => {
    // Clean up uploaded file
    if (uploadedFile?.previewUrl) {
      URL.revokeObjectURL(uploadedFile.previewUrl);
    }
    setUploadedFile(null);
    setStep('choose');

    // Navigate to home to see the published video
    navigate('/');
  };

  // Handle cancel
  const handleCancel = () => {
    // Clean up recorded segments
    recordedSegments.forEach(segment => {
      URL.revokeObjectURL(segment.blobUrl);
    });
    setRecordedSegments([]);

    // Clean up uploaded file
    if (uploadedFile?.previewUrl) {
      URL.revokeObjectURL(uploadedFile.previewUrl);
    }
    setUploadedFile(null);

    setStep('choose');
  };

  // Choose upload method
  if (step === 'choose') {
    return (
      <div className="container max-w-lg mx-auto py-12 px-4">
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-bold">Create a Vine</h1>
          <p className="text-muted-foreground">
            Record a 6-second looping video to share with the world
          </p>

          <div className="space-y-3 pt-4">
            <Button
              onClick={() => setStep('record')}
              className="w-full h-16 text-lg"
              size="lg"
            >
              <Camera className="mr-2 h-5 w-5" />
              Record with Camera
            </Button>

            <Button
              onClick={() => setStep('upload-file')}
              variant="outline"
              className="w-full h-16 text-lg"
              size="lg"
            >
              <Upload className="mr-2 h-5 w-5" />
              Upload Video File
            </Button>
          </div>

          <div className="pt-6">
            <Button
              onClick={() => navigate(-1)}
              variant="ghost"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Recording step
  if (step === 'record') {
    return (
      <CameraRecorder
        onRecordingComplete={handleRecordingComplete}
        onCancel={handleCancel}
      />
    );
  }

  // File upload step
  if (step === 'upload-file') {
    return (
      <FileUploadPicker
        onFileSelected={handleFileSelected}
        onCancel={handleCancel}
      />
    );
  }

  // Metadata step (for recorded videos)
  if (step === 'metadata' && recordedSegments.length > 0) {
    return (
      <VideoMetadataForm
        segments={recordedSegments}
        onCancel={handleCancel}
        onPublished={handlePublished}
      />
    );
  }

  // Metadata step (for uploaded files)
  if (step === 'metadata-file' && uploadedFile) {
    return (
      <VideoMetadataFormFile
        file={uploadedFile.file}
        previewUrl={uploadedFile.previewUrl}
        duration={uploadedFile.duration}
        onCancel={handleCancel}
        onPublished={handleFilePublished}
      />
    );
  }

  return null;
}

export default UploadPage;
