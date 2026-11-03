export function toLocalDateString(date: Date = new Date()): string {
  var year = date.getFullYear();
  var month = String(date.getMonth() + 1).padStart(2, '0');
  var day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDaysToToday(days: number): string {
  var now = new Date();
  return toLocalDateString(new Date(now.getFullYear(), now.getMonth(), now.getDate() + days));
}
