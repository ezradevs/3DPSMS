const dayjs = require('dayjs');
const { getActiveSessions, getSessionById } = require('./sessionsService');
const { getAggregatedSalesByDay, getRecentSales } = require('./salesService');
const { getLowStockItems } = require('./inventoryService');

function pickTodaysSession(sessions) {
  const today = dayjs().format('YYYY-MM-DD');
  if (!sessions.length) return null;

  const matchBySessionDate = sessions.find(sess => sess.sessionDate && sess.sessionDate.startsWith(today));
  if (matchBySessionDate) return matchBySessionDate;

  const matchByStart = sessions.find(sess => sess.startedAt && sess.startedAt.startsWith(today));
  if (matchByStart) return matchByStart;

  return sessions[0];
}

function getDashboardSummary() {
  const activeSessions = getActiveSessions();
  const todaysSession = pickTodaysSession(activeSessions);
  const todaysSessionDetailed = todaysSession ? getSessionById(todaysSession.id) : null;
  const recentTrend = getAggregatedSalesByDay(7);
  const recentSales = getRecentSales({ limit: 5 });
  const lowStockItems = getLowStockItems(5);

  const todaySummary = todaysSessionDetailed
    ? {
        sessionId: todaysSessionDetailed.id,
        title: todaysSessionDetailed.title,
        status: todaysSessionDetailed.status,
        weather: todaysSessionDetailed.weather,
        totalRevenue: todaysSessionDetailed.totalRevenue,
        totalItemsSold: todaysSessionDetailed.totalItemsSold,
        saleCount: todaysSessionDetailed.saleCount,
        latestSales: todaysSessionDetailed.sales.slice(0, 5),
      }
    : null;

  return {
    todaySummary,
    recentTrend,
    recentSales,
    lowStockItems,
  };
}

module.exports = {
  getDashboardSummary,
};
