import { useCallback, useRef, useState } from 'react';
import type { ComponentProps } from 'react';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { Alert, Section } from '../components/ui';
import MonthlyReportForm from '../components/MonthlyReportForm';
import ReportsHeader from '../components/ReportsHeader';
import ReportsContent from '../components/ReportsContent';

type LastReportValue = ComponentProps<typeof ReportsContent>['lastReport'];

interface ReportRequest {
  year: number;
  month: number;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function filenameFromHeader(header: unknown, fallback: string): string {
  if (typeof header !== 'string') return fallback;
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header);
  return match && match[1] ? decodeURIComponent(match[1]) : fallback;
}

function saveBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

function ReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const [downloading, setDownloading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [lastReport, setLastReport] = useState<LastReportValue>(null);
  const lastRequest = useRef<ReportRequest | null>(null);

  const role = (user as { role?: string } | null)?.role;
  const blocked = !authLoading && !!user && typeof role === 'string' && role !== 'receptionist';

  const runDownload = useCallback(async (request: ReportRequest): Promise<void> => {
    lastRequest.current = request;
    setDownloading(true);
    setError('');
    try {
      const response = await api.get('/reports/monthly/', {
        params: { year: request.year, month: request.month },
        responseType: 'blob',
      });
      const fallback = `cedar-hollow-report-${request.year}-${pad(request.month)}.csv`;
      const filename = filenameFromHeader(response.headers?.['content-disposition'], fallback);
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' });
      saveBlob(blob, filename);
      const summary = {
        year: request.year,
        month: request.month,
        monthName: MONTH_NAMES[request.month - 1] || '',
        label: `${MONTH_NAMES[request.month - 1] || ''} ${request.year}`,
        filename,
        size: blob.size,
        downloadedAt: new Date().toISOString(),
      };
      setLastReport(summary as unknown as LastReportValue);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 403) {
        setError('Only reception staff can download monthly reports.');
      } else if (status === 400) {
        setError('That year and month are not valid. Please choose again.');
      } else {
        setError('The report could not be generated. Please try again.');
      }
    } finally {
      setDownloading(false);
    }
  }, []);

  const handleDownload = useCallback(
    (first: number | ReportRequest | string, second?: number | string): Promise<void> => {
      let year: number;
      let month: number;
      if (typeof first === 'object' && first !== null) {
        year = Number(first.year);
        month = Number(first.month);
      } else {
        year = Number(first);
        month = Number(second);
      }
      if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
        setError('Please choose a valid year and month.');
        return Promise.resolve();
      }
      return runDownload({ year, month });
    },
    [runDownload]
  );

  const handleRetry = useCallback((): void => {
    if (lastRequest.current) {
      void runDownload(lastRequest.current);
    } else {
      setError('');
    }
  }, [runDownload]);

  return (
    <div className="ds-stack-lg">
      <ReportsHeader />
      {blocked ? (
        <Section narrow>
          <Alert tone="danger">
            Monthly reports are available to Cedar Hollow reception staff only.
          </Alert>
        </Section>
      ) : (
        <>
          <Section
            title="Choose a month"
            subtitle="Download a CSV of every appointment and bill for the year and month you pick."
            narrow
          >
            <MonthlyReportForm onDownload={handleDownload} downloading={downloading} />
          </Section>
          <ReportsContent
            loading={authLoading}
            error={error}
            lastReport={lastReport}
            onRetry={handleRetry}
          />
        </>
      )}
    </div>
  );
}

export default ReportsPage;