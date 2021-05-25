const mongoose = require('mongoose');
const { Schema } = mongoose;
const AnalyticStatisticsData = new Schema({
    channelId: {
        type: String,
    },
    date: {
        type: Number,
    },
    total: {
        type: Object
    },
    data: {
        type: Array,
    }
}, { toJSON: { virtuals: true }, timestamp: true});

module.exports = mongoose.model('g_analytics', AnalyticStatisticsData, 'g_analytics');
