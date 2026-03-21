class DateUtils {
  static now() {
    return new Date().toISOString();
  }

  static parseISO(dateString) {
    return new Date(dateString);
  }

  static startOfMonth(date) {
    const d = new Date(date);
    d.setUTCDate(1);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  static endOfMonth(date) {
    const d = new Date(date);
    d.setUTCMonth(d.getUTCMonth() + 1);
    d.setUTCDate(0);
    d.setUTCHours(23, 59, 59, 999);
    return d;
  }

  static subMonths(date, months) {
    const d = new Date(date);
    d.setUTCMonth(d.getUTCMonth() - months);
    return d;
  }

  static addMonths(date, months) {
    const d = new Date(date);
    d.setUTCMonth(d.getUTCMonth() + months);
    return d;
  }

  static getMonthlyPeriodKey(date) {
    const d = new Date(date);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  static getWeeklyPeriodKey(date) {
    const d = new Date(date);
    const year = d.getUTCFullYear();
    const week = this.getWeekNumber(d);
    return `${year}-W${String(week).padStart(2, '0')}`;
  }

  static getWeekNumber(date) {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  static subWeeks(date, weeks) {
    const d = new Date(date);
    d.setUTCDate(d.getUTCDate() - weeks * 7);
    return d;
  }

  static startOfWeek(date) {
    const d = new Date(date);
    const day = d.getUTCDay(); // 0 = Sunday
    const diff = day === 0 ? -6 : 1 - day; // Monday-based week
    d.setUTCDate(d.getUTCDate() + diff);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  static endOfWeek(date) {
    const start = this.startOfWeek(date);
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + 6);
    d.setUTCHours(23, 59, 59, 999);
    return d;
  }
  
  static format(date, formatString = 'DD/MM/YYYY') {
    const d = new Date(date);
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = d.getUTCFullYear();

    if (formatString === 'DD/MM/YYYY') {
      return `${day}/${month}/${year}`;
    } else if (formatString === 'MM/DD/YYYY') {
      return `${month}/${day}/${year}`;
    } else if (formatString === 'YYYY-MM-DD') {
      return `${year}-${month}-${day}`;
    }

    return date.toISOString();
  }
}

module.exports = DateUtils;