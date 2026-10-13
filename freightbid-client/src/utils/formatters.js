/**
 * Date and Time utilities for India Standard Time (IST / Asia/Kolkata: UTC+05:30)
 */

/**
 * Safely parses a date input, guaranteeing that date strings without timezone offsets
 * are treated as Indian Standard Time (IST / Asia/Kolkata).
 */
export const parseISTDate = (dateVal) => {
  if (!dateVal) return null;
  if (dateVal instanceof Date) {
    return isNaN(dateVal.getTime()) ? null : dateVal;
  }
  if (typeof dateVal === 'number') {
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    if (!trimmed) return null;

    // Date only: YYYY-MM-DD -> treat as start of day in IST (00:00:00+05:30)
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return new Date(`${trimmed}T00:00:00+05:30`);
    }

    // Datetime without timezone offset: YYYY-MM-DDTHH:mm or YYYY-MM-DDTHH:mm:ss
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?$/.test(trimmed)) {
      return new Date(`${trimmed}+05:30`);
    }

    // Datetime with space: YYYY-MM-DD HH:mm(:ss)
    if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(:\d{2})?(\.\d+)?$/.test(trimmed)) {
      return new Date(`${trimmed.replace(/\s+/, 'T')}+05:30`);
    }

    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
};

/**
 * Converts a Date or ISO string to HTML datetime-local format (YYYY-MM-DDTHH:mm)
 * in India Standard Time (Asia/Kolkata).
 */
export const toISTDateTimeLocal = (dateVal) => {
  const d = parseISTDate(dateVal);
  if (!d) return '';
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(d);

  const getPart = (type) => parts.find((p) => p.type === type)?.value || '';
  let hour = getPart('hour');
  if (hour === '24') hour = '00';
  return `${getPart('year')}-${getPart('month')}-${getPart('day')}T${hour}:${getPart('minute')}`;
};

/**
 * Converts a Date or ISO string to HTML date input format (YYYY-MM-DD)
 * in India Standard Time (Asia/Kolkata).
 */
export const toISTDateOnly = (dateVal) => {
  const d = parseISTDate(dateVal);
  if (!d) return '';
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(d);

  const getPart = (type) => parts.find((p) => p.type === type)?.value || '';
  return `${getPart('year')}-${getPart('month')}-${getPart('day')}`;
};

/**
 * Format numbers in Indian Rupee format (e.g., ₹1,25,000)
 */
export const formatINR = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Format date string to readable Indian Standard Time format (e.g., "12 Oct 2026, 04:30 PM")
 */
export const formatDateTime = (dateVal, withZone = false) => {
  const d = parseISTDate(dateVal);
  if (!d) return 'N/A';
  try {
    const parts = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).formatToParts(d);

    const getPart = (type) => parts.find((p) => p.type === type)?.value || '';
    const day = getPart('day');
    const month = getPart('month');
    const year = getPart('year');
    const hour = getPart('hour');
    const minute = getPart('minute');
    const dayPeriod = getPart('dayPeriod').toUpperCase();

    const formatted = `${day} ${month} ${year}, ${hour}:${minute} ${dayPeriod}`;
    return withZone ? `${formatted} IST` : formatted;
  } catch {
    return 'N/A';
  }
};

/**
 * Format date string to readable Indian Standard Time format with explicit "IST" suffix
 */
export const formatDateTimeIST = (dateVal) => formatDateTime(dateVal, true);

/**
 * Format date string to date only in Indian Standard Time (e.g., "12 Oct 2026")
 */
export const formatDateOnly = (dateVal) => {
  const d = parseISTDate(dateVal);
  if (!d) return 'N/A';
  try {
    const parts = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).formatToParts(d);

    const getPart = (type) => parts.find((p) => p.type === type)?.value || '';
    return `${getPart('day')} ${getPart('month')} ${getPart('year')}`;
  } catch {
    return 'N/A';
  }
};

/**
 * Return Tailwind color badge classes based on status
 */
export const getStatusBadgeStyle = (status) => {
  switch (status) {
    case 'OPEN':
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10',
        dot: 'bg-emerald-500',
        label: 'Open for Bidding'
      };
    case 'UPCOMING':
      return {
        bg: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/10',
        dot: 'bg-blue-500',
        label: 'Upcoming Auction'
      };
    case 'CLOSED':
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/10',
        dot: 'bg-amber-500',
        label: 'Bidding Closed'
      };
    case 'AWARDED':
      return {
        bg: 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-500/10',
        dot: 'bg-indigo-500',
        label: 'Contract Awarded'
      };
    case 'IN_PROGRESS':
      return {
        bg: 'bg-cyan-50 text-cyan-700 border-cyan-200 ring-cyan-500/10',
        dot: 'bg-cyan-500',
        label: 'In Transit'
      };
    case 'DELIVERED':
      return {
        bg: 'bg-emerald-100 text-emerald-800 border-emerald-300 ring-emerald-600/20',
        dot: 'bg-emerald-600',
        label: 'Delivered'
      };
    case 'EXPIRED':
      return {
        bg: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/10',
        dot: 'bg-rose-500',
        label: 'Expired (No Bids)'
      };
    case 'VERIFIED':
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10',
        dot: 'bg-emerald-500',
        label: 'Verified'
      };
    case 'PENDING':
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/10',
        dot: 'bg-amber-500',
        label: 'Pending Approval'
      };
    case 'REJECTED':
      return {
        bg: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/10',
        dot: 'bg-rose-500',
        label: 'Rejected'
      };
    case 'BLOCKED':
      return {
        bg: 'bg-red-100 text-red-800 border-red-300 ring-red-500/20',
        dot: 'bg-red-600',
        label: 'Blocked'
      };
    default:
      return {
        bg: 'bg-slate-50 text-slate-700 border-slate-200 ring-slate-500/10',
        dot: 'bg-slate-400',
        label: status || 'Unknown'
      };
  }
};

export const MILESTONES = [
  'Awarded',
  'Pickup Scheduled',
  'Picked Up',
  'In Transit',
  'Out for Delivery',
  'Delivered'
];

export const VEHICLE_TYPES = [
  'Truck (Open)',
  'Container (Closed)',
  'Trailer',
  'Trailer (40ft)',
  'Mini Truck / LCV',
  'Refrigerated Truck',
  'Tanker'
];

export const CARGO_TYPES = [
  'Industrial Equipment',
  'Automotive Parts',
  'Chemicals',
  'Textiles',
  'Perishable Goods',
  'General Merchandise',
  'Construction Materials',
  'Electronics'
];
