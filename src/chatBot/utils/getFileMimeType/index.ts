export const getMimeType = (filename: string): string => {
  const ext: string | undefined = filename.split('.').pop()?.toLowerCase();

  const map: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    csv: 'text/csv',
    zip: 'application/zip',
    mp4: 'video/mp4',
  };

  return map[ext ?? ''] ?? 'application/octet-stream';
};
