// This page basically keeps things like durations and rejection reasons consistent 

const SLOT_STEP_MINUTES = 15;

const APPOINTMENT_DURATIONS = {
    Vaccination: 15,
    'Blood test': 15,
    'General consultation': 20,
    Other: 20, 
};

const REJECTION_MESSAGES = {
    NO_SUITABLE_TIME: 'Please submit a new request selecting an alternate time or date.',
    GP_UNAVAILABLE: 'Your requested GP is unavailable. Please submit a new request with another GP, or choose a different time',
    CLINIC_CLOSED: 'The clinic is closed at this time. Please try scheduling for another day',
    OTHER_OPERATIONAL: 'Due to miscellaneous circumstances, we cannot fulfill this request. Please try another date.',
};

 module.exports = {
    SLOT_STEP_MINUTES,
    APPOINTMENT_DURATIONS,
    REJECTION_MESSAGES,
 };