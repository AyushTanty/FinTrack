const { fromZonedTime, toZonedTime } = require('date-fns-tz');
const { startOfMonth, endOfMonth, differenceInDays, getDate, getMonth, getYear, isSameDay } = require('date-fns');

const IST = 'Asia/Kolkata';

function getISTNow() {
  return new Date(); // In Node, new Date() is UTC based but represents the instant. 
  // However, for timezone-specific ops, we use date-fns-tz
}

function getMonthStart(month, year) {
  // month is 1-indexed for the user, 0-indexed in JS date
  const dateStr = `${year}-${String(month).padStart(2, '0')}-01T00:00:00`;
  return fromZonedTime(dateStr, IST);
}

function getMonthEnd(month, year) {
  const dateStr = `${year}-${String(month).padStart(2, '0')}-01T00:00:00`;
  const zonedDate = toZonedTime(fromZonedTime(dateStr, IST), IST);
  const end = endOfMonth(zonedDate);
  end.setHours(23, 59, 59, 999);
  return fromZonedTime(end, IST);
}

function getDaysRemainingInMonth(month, year) {
  const now = new Date();
  const zonedNow = toZonedTime(now, IST);
  
  const currentMonth = zonedNow.getMonth() + 1;
  const currentYear = zonedNow.getFullYear();
  
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return 1; // Past months
  }
  if (year > currentYear || (year === currentYear && month > currentMonth)) {
    const end = endOfMonth(toZonedTime(getMonthStart(month, year), IST));
    return getDate(end); // all days
  }
  
  const end = endOfMonth(zonedNow);
  return differenceInDays(end, zonedNow) + 1; // Inclusive of today
}

function isSameDateIST(date1, date2) {
  const d1 = toZonedTime(date1, IST);
  const d2 = toZonedTime(date2, IST);
  return isSameDay(d1, d2);
}

function getDayOfMonthIST(date) {
  return getDate(toZonedTime(date, IST));
}

function getMonthIST(date) {
  return getMonth(toZonedTime(date, IST)) + 1; // 1-indexed
}

function getYearIST(date) {
  return getYear(toZonedTime(date, IST));
}

module.exports = {
  IST,
  getISTNow,
  getMonthStart,
  getMonthEnd,
  getDaysRemainingInMonth,
  isSameDateIST,
  getDayOfMonthIST,
  getMonthIST,
  getYearIST
};
