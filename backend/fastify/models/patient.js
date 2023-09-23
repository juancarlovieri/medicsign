const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  email: { type: String, required: true },
  gender: String,
  name: { type: String, required: true },
  date_birth: { type: Date, required: true },
  public_key: String,
  password: { type: String, required: true },
});

patientSchema.index({ email: 1 }, { unique: true });

const Patient = mongoose.model('Patient', patientSchema);

module.exports = { Patient };
