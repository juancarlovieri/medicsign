const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
  patient_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  doctor_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  disease: String,
  diagnosis: { type: String, required: true },
  created_at: { type: Date, required: true },
  signature: String,
});

recordSchema.index({}, { unique: true });

const Record = mongoose.model('Record', recordSchema);

module.exports = { Record };
