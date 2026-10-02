import { format, parseISO, isValid } from 'date-fns';

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
 * Format date string to readable format (e.g., "12 Oct 2026, 04:30 PM")
 */
export const formatDateTime = (dateVal) => {
  if (!dateVal) return 'N/A';
  try {
    const d = typeof dateVal === 'string' ? parseISO(dateVal) : new Date(dateVal);
    if (!isValid(d)) return 'N/A';
    return format(d, 'dd MMM yyyy, hh:mm a');
  } catch {
    return 'N/A';
  }
};

/**
 * Format date string to date only (e.g., "12 Oct 2026")
 */
export const formatDateOnly = (dateVal) => {
  if (!dateVal) return 'N/A';
  try {
    const d = typeof dateVal === 'string' ? parseISO(dateVal) : new Date(dateVal);
    if (!isValid(d)) return 'N/A';
    return format(d, 'dd MMM yyyy');
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
