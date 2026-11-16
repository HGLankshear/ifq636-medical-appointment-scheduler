// This is the schema layout

const mongoose = require('mongoose');

const gpSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    specialty: {
        type: String,
        required: true,
    },
    workingHours: [
        {
            dayOfWeek: { type: Number, required: true}, // I'm giving each day a number
            start: { type: String, required: true },
            end: { type: String, required: true },
        },
    ],
    leaveDates: [
        {type: String },
    ],
})
module.exports = mongoose.model('GP', gpSchema);