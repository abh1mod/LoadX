/**
 * Date and Time utilities for India Standard Time (IST / Asia/Kolkata: UTC+05:30)
 */

const parseISTDate = (dateVal) => {
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

const toISTISOString = (dateVal) => {
  const d = parseISTDate(dateVal);
  return d ? d.toISOString() : null;
};

module.exports = {
  parseISTDate,
  toISTISOString
};
