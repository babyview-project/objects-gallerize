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
    worker_id:{
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    }
});

const Response = mongoose.model('Response', responseSchema, 'prolific_responses')

module.exports = Response;