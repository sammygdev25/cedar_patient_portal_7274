import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Button, Card, CardBody, CardTitle, CardMeta } from './ui';
import { Icon } from './icons';

interface MonthlyReportFormProps {
  onDownload: (year: number, month: number) => void | Promise<void>;
  downloading: boolean;
}

const MONTHS: string[] = [
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

const YEARS_BACK = 5;

function MonthlyReportForm({ onDownload, downloading }: MonthlyReportFormProps) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [year, setYear] = useState<number>(currentYear);
  const [month, setMonth] = useState<number>(currentMonth);

  const years: number[] = Array.from({ length: YEARS_BACK + 1 }, (_, i) => currentYear - i);
  const isFuture = year > currentYear || (year === currentYear && month > currentMonth);
  const monthLabel = MONTHS[month - 1];

  const handleYearChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setYear(Number(e.target.value));
  };

  const handleMonthChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setMonth(Number(e.target.value));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (downloading || isFuture) return;
    onDownload(year, month);
  };

  return (
    <Card>
      <CardBody>
        <CardTitle>Monthly activity report</CardTitle>
        <CardMeta>
          Choose a month to export every Cedar Hollow Health appointment and bill for that period as a CSV file.
        </CardMeta>
        <form className="ds-form" onSubmit={handleSubmit}>
          <div className="ds-form-row">
            <div className="ds-field">
              <label className="ds-label" htmlFor="report-month">
                Month
              </label>
              <select
                id="report-month"
                className="input"
                value={month}
                onChange={handleMonthChange}
                disabled={downloading}
              >
                {MONTHS.map((name, index) => (
                  <option key={name} value={index + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div className="ds-field">
              <label className="ds-label" htmlFor="report-year">
                Year
              </label>
              <select
                id="report-year"
                className="input"
                value={year}
                onChange={handleYearChange}
                disabled={downloading}
              >
                {(Array.isArray(years) ? years : []).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {isFuture ? (
            <p className="ds-help">
              {monthLabel} {year} has not happened yet. Pick the current month or an earlier one.
            </p>
          ) : (
            <p className="ds-help">
              The file lists appointments scheduled in {monthLabel} {year} and bills issued in the same month.
            </p>
          )}
          <div className="ds-form-actions">
            <Button type="submit" variant="primary" size="lg" disabled={downloading || isFuture}>
              <Icon name={downloading ? 'refresh' : 'download'} size={18} />
              {downloading ? 'Preparing report...' : `Download ${monthLabel} ${year} CSV`}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

export default MonthlyReportForm;