'use client';

export interface UploadPdfResult {
  success: boolean;
  pdfUrl?: string;
  error?: string;
}

/**
 * Upload a PDF blob to Supabase Storage via API endpoint
 * @param pdfBlob - The PDF file as a Blob
 * @param attemptId - The quiz attempt ID (used as filename)
 * @returns Upload result with the PDF URL if successful
 */
export async function uploadQuizPdf(
  pdfBlob: Blob,
  attemptId: string
): Promise<UploadPdfResult> {
  try {
    // Create FormData for upload
    const formData = new FormData();
    formData.append('pdf', pdfBlob, `${attemptId}.pdf`);
    formData.append('attemptId', attemptId);

    // Upload via API endpoint
    const response = await fetch('/api/quiz/pdf/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to upload PDF',
      };
    }

    return {
      success: true,
      pdfUrl: data.pdfUrl,
    };
  } catch (error) {
    console.error('Error uploading PDF:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get a signed URL for downloading a quiz PDF
 * @param attemptId - The quiz attempt ID
 * @returns The download URL if successful
 */
export async function getQuizPdfUrl(attemptId: string): Promise<string | null> {
  try {
    const response = await fetch(`/api/quiz/pdf/${attemptId}`);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.url || null;
  } catch (error) {
    console.error('Error getting PDF URL:', error);
    return null;
  }
}
