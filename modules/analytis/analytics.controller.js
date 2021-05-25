const AnalyticsData = require('./analytics.model');
const OrgData = require('../organization/organization.model');
const { authenticateGoogle } = require('../../utils/googleAuth');
const { google } = require('googleapis');
const moment = require('moment');

const {} = require('../organization/organization.controller');

const {
  getDate,
  asyncForEach,
} = require('../../utils');

const updateDatabase = async (data) => {
  await AnalyticsData.insertMany(data);
};

const covertReadableDateFormat = (diff) => {
  if (diff <= 0) {
    return 'today';
  }

  if (diff === 1) {
    return 'yesterday';
  }

  return `${diff}daysAgo`;
};

const getAnalyticsData = async (startDate, endDate, y, m, id) => {
  try {
    const auth = await authenticateGoogle(`data/keys/${process.env.GOOGLE_ANALYTICS_KEY_PATH}`, 'web');
    const defaults = {
      auth,
      ids: `ga:${id}`,
    };

    const start = covertReadableDateFormat(startDate);
    const end = covertReadableDateFormat(endDate);


    const result = await google.analytics('v3').data.ga.get({
      ...defaults,
      'start-date': start,
      'end-date': end,
      metrics: 'ga:users, ga:sessions, ga:pageviews, ga:timeOnPage, ga:newUsers, ga:percentNewSessions, ga:bounces',
      dimensions: 'ga:userType, ga:channelGrouping, ga:deviceCategory, ga:socialNetwork, ga:medium',
      auth,
    });
    const totalValues = result.data.totalsForAllResults;
    const divisionValues = result.data.rows ? result.data.rows : [];

    const tempData = {
      channelId: id,
      date: new Date(`${y}-${m + 1}`).getTime(),
      total: {
        users: totalValues['ga:users'],
        sessions: totalValues['ga:sessions'],
        pageViews: totalValues['ga:pageviews'],
        timeOnPage: parseFloat(totalValues['ga:timeOnPage']).toFixed(2),
        newUsers: totalValues['ga:newUsers'],
        percentNewSession: parseFloat(totalValues['ga:percentNewSessions']).toFixed(2),
        bounces: totalValues['ga:bounces'],
      },
      data: divisionValues.map(rowItem => ({
        userType: rowItem[0],
        channelGrouping: rowItem[1],
        deviceCategory: rowItem[2],
        socialNetwork: rowItem[3],
        medium: rowItem[4],
        users: rowItem[5],
        sessions: rowItem[6],
        pageViews: rowItem[7],
        timeOnPage: parseFloat(rowItem[8]).toFixed(2),
        newUsers: rowItem[9],
        percentNewSession: parseFloat(rowItem[10]).toFixed(2),
        bounces: rowItem[11],
      }))
    };

    return tempData;
  } catch (e) {
    console.log(e.message || e.error);
    return false;
  }
};

exports.fetchDataFromService = async (req, res) => {
  const currentOneMonthData = await getAnalyticsData('30daysAgo', 'today', '135067980');

  return currentOneMonthData ? res.json(currentOneMonthData) : [];
};

exports.fetchTodayDataFromService = async () => {
  const auth = await authenticateGoogle(`keys/${process.env.GOOGLE_YT3_API_CREDENTIAL_PATH}`, 'web');
  const OneKindId = ''; //number
  const defaults = {
    auth,
    ids: `ga:${OneKindId}`,
  };

  const result = await google.analytics('v3').data.ga.get({
    ...defaults,
    'start-date': '30daysAgo',
    'end-date': 'today',
    metrics: 'ga:pageviews, ga:sessions, ga:users, ga:newUsers, ga:organicSearches, ga:bounces, ga:bounceRate, ga:timeOnPage, ga:sessionDuration, ga:avgSessionDuration',
    dimensions: 'ga:userType, ga:sessionCount, ga:source, ga:medium, ga:deviceCategory, ga:referralPath, ga:socialNetwork',
    auth,
  });

  const fetchData = result.data.rows[0];
  const dateData = [{
    channelId: '135067980',
    date: new Date(),
    userType: fetchData[0],
    source: fetchData[2],
    medium: fetchData[3],
    sessions: fetchData[8],
    users: fetchData[9],
    newUsers: fetchData[10],
  }];

  AnalyticsData.insertMany(dateData);
};

const getAnalyticsNumbers = async () => {
  let analyticsNumbers = [];
  const organisations = await OrgData.find();

  organisations.forEach((item) => {
    analyticsNumbers = [
      ...analyticsNumbers,
      ...item.googleanalyticsnumber,
    ];
  });

  return analyticsNumbers;
};

const getOneMonthData = async (date) => {
  const endDate = new Date(date);
  const y = endDate.getFullYear();
  const m = endDate.getMonth();

  const firstDay = new Date(y, m, 1);
  const lastDay = new Date(y, m + 1, 0);

  const dayDiffWithEndDate = getDate(lastDay);
  const dayDiffWithStartDate = getDate(firstDay);

  const channelIds = await getAnalyticsNumbers();

  const returnData = [];
  await asyncForEach(channelIds, async (channelItem) => {
    const currentOneMonthData = await getAnalyticsData(dayDiffWithStartDate, dayDiffWithEndDate, y, m, channelItem);
    if (currentOneMonthData) {
      returnData.push(currentOneMonthData);
    }
  });

  return returnData;
};
