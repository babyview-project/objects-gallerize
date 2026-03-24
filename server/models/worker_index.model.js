const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const workerIndexSchema = new Schema({
    worker_id: {
        type: String,
        required: true,
        unique: true
    },
    shuffled_index: {
        type: Number,
        required: true
    }
});

const WorkerIndex = mongoose.model('WorkerIndex', workerIndexSchema, 'worker_index_assignments');

module.exports = WorkerIndex;
