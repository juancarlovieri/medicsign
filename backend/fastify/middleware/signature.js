'use strict';

const crypto = require(`crypto`);
const { success, error, sendStatus } = require(`./req_handler`);
const { Key } = require(`../models/key`);
const { Doctor } = require(`../models/doctor`);

async function sign(data, userId) {
  data = Buffer.from(JSON.stringify(data));
  var { private_key } = await Key.findOne({ userId });
  private_key = crypto.createPrivateKey({
    key: Buffer.from(private_key, `base64`),
    type: `pkcs8`,
    format: `der`,
  });

  const signature = crypto.sign(`SHA256`, data, private_key).toString(`base64`);
  return signature;
}

async function validate_keys(keys) {
  try {
    const { public_key, private_key } = keys;

    const publicKey = crypto.createPublicKey({
      key: Buffer.from(public_key, `base64`),
      type: `spki`,
      format: `der`,
    });

    const privateKey = crypto.createPrivateKey({
      key: Buffer.from(private_key, `base64`),
      type: `pkcs8`,
      format: `der`,
    });

    const test_data = Buffer.from(`test_string`);
    const signature = crypto.sign(`SHA256`, test_data, privateKey);
    const verified = crypto.verify(`SHA256`, test_data, publicKey, signature);
    if (!verified) return false;

    return true;
  } catch (error) {
    return false;
  }
}

async function verify(data, signature, userId) {
  data = Buffer.from(JSON.stringify(data));
  signature = Buffer.from(signature, `base64`);

  try {
    var { public_key } = await Key.findOne({ userId });
    public_key = crypto.createPublicKey({
      key: Buffer.from(public_key, `base64`),
      type: `spki`,
      format: `der`,
    });

    const isVerified = crypto.verify(
      `SHA256`,
      data,
      { key: public_key, padding: crypto.constants.RSA_PKCS1_PSS_PADDING },
      signature
    );

    return isVerified;
  } catch (error) {
    logger.error(`Error verifying signature.`, { error });
    return false;
  }
}

module.exports = { sign, validate_keys, verify };
