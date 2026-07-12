import { TZDate } from "@date-fns/tz";

export const reportRanges = ["today", "yesterday", "this_week", "this_month"] as const;

export type ReportRange = (typeof reportRanges)[number];

export type ReportBounds = {
  range: ReportRange;
  label: string;
  timeZone: string;
  utcStart: string;
  utcEnd: string;
  localStartDate: string;
  localEndDate: string;
  localEndDateInclusive: string;
};

const reportRangeLabels: Record<ReportRange, string> = {
  today: "Today",
  yesterday: "Yesterday",
  this_week: "This Week",
  this_month: "This Month"
};

export function isReportRange(value: unknown): value is ReportRange {
  return typeof value === "string" && reportRanges.includes(value as ReportRange);
}

export function assertReportRange(value: unknown): asserts value is ReportRange {
  if (!isReportRange(value)) throw new Error("Invalid reporting range.");
}

export function getReportRangeLabel(range: ReportRange) {
  return reportRangeLabels[range];
}

export function getReportBounds(
  range: ReportRange,
  timeZone: string,
  now = new Date()
): ReportBounds {
  assertIanaTimeZone(timeZone);

  const zonedNow = TZDate.tz(timeZone, now.getTime());
  const year = zonedNow.getFullYear();
  const month = zonedNow.getMonth();
  const day = zonedNow.getDate();
  const today = localMidnight(year, month, day, timeZone);
  let start: TZDate;
  let end: TZDate;

  switch (range) {
    case "today":
      start = today;
      end = localMidnight(year, month, day + 1, timeZone);
      break;
    case "yesterday":
      start = localMidnight(year, month, day - 1, timeZone);
      end = today;
      break;
    case "this_week": {
      const mondayOffset = (today.getDay() + 6) % 7;
      start = localMidnight(year, month, day - mondayOffset, timeZone);
      end = localMidnight(start.getFullYear(), start.getMonth(), start.getDate() + 7, timeZone);
      break;
    }
    case "this_month":
      start = localMidnight(year, month, 1, timeZone);
      end = localMidnight(year, month + 1, 1, timeZone);
      break;
  }

  return {
    range,
    label: reportRangeLabels[range],
    timeZone,
    utcStart: new Date(start.getTime()).toISOString(),
    utcEnd: new Date(end.getTime()).toISOString(),
    localStartDate: localDateToken(start),
    localEndDate: localDateToken(end),
    localEndDateInclusive: localDateToken(TZDate.tz(timeZone, end.getTime() - 1))
  };
}

export function isWithinReportBounds(value: string | Date, bounds: ReportBounds) {
  const timestamp = new Date(value).getTime();
  return timestamp >= Date.parse(bounds.utcStart) && timestamp < Date.parse(bounds.utcEnd);
}

export function getRestaurantHour(value: string | Date, timeZone: string) {
  return TZDate.tz(timeZone, new Date(value).getTime()).getHours();
}

export function formatHourLabel(hour: number) {
  const normalizedHour = ((hour % 24) + 24) % 24;
  const period = normalizedHour < 12 ? "AM" : "PM";
  const displayHour = normalizedHour % 12 || 12;
  return `${displayHour} ${period}`;
}

export function formatReportLocalDateTime(value: string | Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(new Date(value));
}

function localMidnight(year: number, month: number, day: number, timeZone: string) {
  return new TZDate(year, month, day, 0, 0, 0, 0, timeZone);
}

function localDateToken(date: TZDate) {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function assertIanaTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format();
  } catch {
    throw new Error(`Invalid restaurant timezone: ${timeZone}`);
  }
}
