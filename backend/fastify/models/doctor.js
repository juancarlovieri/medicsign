const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  email: { type: String, required: true },
  name: { type: String, required: true },
  hospital: { type: String, required: true },
  password: { type: String, required: true },
  public_key: String,
});

doctorSchema.index({ email: 1 }, { unique: true });

const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = { Doctor };
