import { useCallback } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import Button from './ui/Button';

export default function DownloadPdfButton() {
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <Button
      variant="primary"
      onClick={handlePrint}
      className="download-pdf-btn"
    >
      <ArrowDownTrayIcon className="h-4 w-4" />
      Download as PDF
    </Button>
  );
}
