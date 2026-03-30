/**
 * Format utilities for displaying numbers, prices, and other values
 */

/**
 * Format a price with specified decimal places
 * @param price - The price to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted price string (e.g., "1234.56")
 */
export function formatPrice(price: number, decimals: number = 2): string {
  if (!isFinite(price)) return '0.00';
  return price.toFixed(decimals);
}

/**
 * Format a percentage value
 * @param value - The value to format as percentage
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string (e.g., "12.34%")
 */
export function formatPercent(value: number, decimals: number = 2): string {
  if (!isFinite(value)) return '0.00%';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format a USD value with comma separators
 * @param value - The value to format as USD
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted USD string (e.g., "$1,234,567.89")
 */
export function formatUSD(value: number, decimals: number = 2): string {
  if (!isFinite(value)) return '$0.00';

  const formatted = value.toFixed(decimals);
  const parts = formatted.split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1] || '00';

  const withCommas = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `$${withCommas}.${decimalPart}`;
}

/**
 * Format a timestamp (Unix milliseconds) to readable date string
 * @param ts - Unix timestamp in milliseconds
 * @param includeTime - Whether to include time in output (default: true)
 * @returns Formatted timestamp string (e.g., "Mar 29, 2026 14:30:45")
 */
export function formatTimestamp(ts: number, includeTime: boolean = true): string {
  if (!isFinite(ts) || ts === 0) return 'N/A';

  const date = new Date(ts);
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  if (!includeTime) {
    return dateStr;
  }

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return `${dateStr} ${timeStr}`;
}

/**
 * Shorten an Ethereum-style address to readable format
 * @param address - Full address string
 * @param chars - Number of characters to show from start and end (default: 4)
 * @returns Shortened address (e.g., "0x1234...5678")
 */
export function shortenAddress(address: string, chars: number = 4): string {
  if (!address || address.length <= chars * 2 + 3) {
    return address;
  }

  const start = address.substring(0, chars);
  const end = address.substring(address.length - chars);
  return `${start}...${end}`;
}

/**
 * Format profit/loss value with sign and optional color class
 * @param pnl - Profit/loss value
 * @param decimals - Number of decimal places (default: 2)
 * @returns Object with formatted value and CSS class name
 */
export function formatPnL(
  pnl: number,
  decimals: number = 2
): { value: string; className: string } {
  if (!isFinite(pnl)) {
    return { value: '$0.00', className: 'text-gray-500' };
  }

  const sign = pnl >= 0 ? '+' : '';
  const value = `${sign}$${Math.abs(pnl).toFixed(decimals)}`;
  const className =
    pnl > 0 ? 'text-green-600' : pnl < 0 ? 'text-red-600' : 'text-gray-500';

  return { value, className };
}

/**
 * Format large volume numbers with abbreviations
 * @param volume - Volume number to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Abbreviated volume string (e.g., "1.2M", "500K", "125.5B")
 */
export function formatVolume(volume: number, decimals: number = 1): string {
  if (!isFinite(volume) || volume === 0) return '0';

  const units = [
    { value: 1e9, suffix: 'B' },
    { value: 1e6, suffix: 'M' },
    { value: 1e3, suffix: 'K' },
  ];

  for (const unit of units) {
    if (Math.abs(volume) >= unit.value) {
      return (volume / unit.value).toFixed(decimals) + unit.suffix;
    }
  }

  return volume.toFixed(decimals);
}

/**
 * Format a number as a compact string (e.g., for large numbers)
 * @param value - Number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with appropriate scale
 */
export function formatCompact(value: number, decimals: number = 2): string {
  if (!isFinite(value) || value === 0) return '0';

  const absValue = Math.abs(value);
  const units = [
    { value: 1e9, suffix: 'B' },
    { value: 1e6, suffix: 'M' },
    { value: 1e3, suffix: 'K' },
  ];

  for (const unit of units) {
    if (absValue >= unit.value) {
      const formatted = (value / unit.value).toFixed(decimals);
      return formatted + unit.suffix;
    }
  }

  return value.toFixed(decimals);
}

/**
 * Format a number with thousands separators
 * @param value - Number to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted string with commas (e.g., "1,234,567")
 */
export function formatNumber(value: number, decimals: number = 0): string {
  if (!isFinite(value)) return '0';

  const formatted = value.toFixed(decimals);
  const parts = formatted.split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];

  const withCommas = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  if (decimals > 0 && decimalPart) {
    return `${withCommas}.${decimalPart}`;
  }

  return withCommas;
}

/**
 * Format ratio values (e.g., risk:reward)
 * @param value - Ratio value
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted ratio string (e.g., "1:2.50")
 */
export function formatRatio(value: number, decimals: number = 2): string {
  if (!isFinite(value)) return '1:0';

  const ratio = (1 / Math.max(value, 0.01)).toFixed(decimals);
  return `1:${ratio}`;
}

/**
 * Format time duration in seconds to readable format
 * @param seconds - Duration in seconds
 * @returns Formatted duration string (e.g., "2h 30m", "45s")
 */
export function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0s';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

/**
 * Format change value with direction indicator
 * @param change - Change value
 * @param decimals - Number of decimal places (default: 2)
 * @returns Object with formatted value, direction, and CSS class
 */
export function formatChange(
  change: number,
  decimals: number = 2
): {
  value: string;
  direction: 'up' | 'down' | 'neutral';
  className: string;
} {
  if (!isFinite(change)) {
    return { value: '0.00%', direction: 'neutral', className: 'text-gray-500' };
  }

  const value = `${Math.abs(change).toFixed(decimals)}%`;
  let direction: 'up' | 'down' | 'neutral' = 'neutral';
  let className = 'text-gray-500';

  if (change > 0) {
    direction = 'up';
    className = 'text-green-600';
  } else if (change < 0) {
    direction = 'down';
    className = 'text-red-600';
  }

  return { value, direction, className };
}
