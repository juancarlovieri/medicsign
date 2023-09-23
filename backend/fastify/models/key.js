const mongoose = require('mongoose');

const keySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  private_key: { type: String, required: true },
  public_key: { type: String, required: true },
});

keySchema.index({ userId: 1 }, { unique: true });

const Key = mongoose.model('Key', keySchema);

module.exports = { Key };
