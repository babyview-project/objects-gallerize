const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const responseSchema = new Schema({
    class: {
        type: String,
        required: true
    },
    filename: {
        type: String,
        required: true
    },
    shuffled_index: {
        type: Number,
        required: true
    },
    order_index: {
        type: Number,
        required: true
    },
    worker_id:{
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    trial_type: {
        type: String,
        required: false
    },
    reaction_time: {
        type: Number,
        required: false
    },
    total_study_time: {
        type: Number,
        required: false
    }
});

const Response = mongoose.model('Response', responseSchema, 'prolific_responses')

module.exports = Response;