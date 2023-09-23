'use strict';

const crypto = require(`crypto`);
const mongoose = require(`mongoose`);
const jwt = require(`jsonwebtoken`);
const bcrypt = require(`bcryptjs`);
const env = process.env;
const { logger } = require(`../middleware/logger`);
const { success, error, sendStatus } = require(`../middleware/req_handler`);
const { Doctor } = require(`../models/doctor`);
const { Record } = require(`../models/record`);
const { Key } = require(`../models/key`);
const auth = require(`../middleware/auth`);
const signature = require(`../middleware/signature`);
const ObjectId = mongoose.Types.ObjectId;

const cmdMap = {
  create,
  view,
  update,
  login,
  list,
};

const doctorSchema = {
  email: `string`,
  name: `string`,
  hospital: `string`,
  password: `string`,
};

function validate(dat) {
  var res = {};
  for (const key in doctorSchema) {
    if (typeof dat[key] !== doctorSchema[key]) return undefined;
    res[key] = dat[key];
  }
  return res;
}

function validate_id(userId) {
  return ObjectId.isValid(userId);
}

async function hash(password) {
  return await bcrypt.hash(password, 10);
}

async function create(req, res) {
  try {
    var dat = req.body.user;
    dat = validate(dat);
    const { keys } = req.body;
    if (!dat || !keys) return await sendStatus(res, 400, `Incomplete data.`);
    if (!(await signature.validate_keys(keys)))
      return await sendStatus(res, 400, `Invalid key pair.`);
    const { public_key, private_key } = keys;

    dat.password = await hash(dat.password);
    dat.public_key = public_key;

    if (await Doctor.countDocuments({ email: dat.email }))
      return await sendStatus(res, 409, `User exists.`);

    const newDoctor = new Doctor(dat);
    await newDoctor.save();

    const newKey = new Key({ userId: newDoctor._id, public_key, private_key });
    await newKey.save();

    // const tokens = await set_tokens(newDoctor, res, `Doctor`);
    if (!(await auth.login(newDoctor, req, `Doctor`)))
      return await sendStatus(res, 500);

    logger.info(`New Doctor saved!`, { dat });

    await success(res, { user: newDoctor, keys });
  } catch (error) {
    logger.error(`Error saving new doctor.`, { error });
    return await sendStatus(res, 500);
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body.credentials || {};

    if (!(email && password)) {
      return await sendStatus(res, 400, `Insufficient data to log in.`);
    }

    const user = await Doctor.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      const userKey = await Key.findOne({ userId: user._id });
      const keys = {
        private_key: userKey.private_key,
        public_key: userKey.public_key,
      };

      // const tokens = await set_tokens(user, res, `Doctor`);
      if (!(await auth.login(user, req, `Doctor`)))
        return await sendStatus(res, 500);

      logger.info(`Doctor login success.`);
      return await success(res, { user, keys });
    }
    logger.info(`Doctor invalid credentials.`);
    return await sendStatus(res, 400, `Invalid credentials.`);
  } catch (error) {
    logger.error(`Error logging doctor in.`, { error });
    return await sendStatus(res, 500);
  }
}

async function view(req, res) {
  const userId = req.params.user;

  try {
    if (
      !userId ||
      !validate_id(userId) ||
      !(await Doctor.countDocuments({ _id: userId }))
    )
      return await sendStatus(res, 404, `Invalid userId.`);

    // if (req.user.userId !== userId) {
    //   return await sendStatus(res, 401);
    // }

    const userPriv = await Doctor.findOne({ _id: userId }).exec();
    const user = {
      name: userPriv.name,
      hospital: userPriv.hospital,
      public_key: userPriv.public_key,
    };

    await success(res, { user });
  } catch (error) {
    logger.error(`Error viewing doctor.`, { error });
    return await sendStatus(res, 500);
  }
}

async function update(req, res) {
  try {
    var dat = req.body.user;
    const userId = dat._id;
    dat = validate(dat);

    dat.password = await hash(dat.password);
    if (
      !dat ||
      !userId ||
      !validate_id(userId) ||
      !(await Doctor.countDocuments({ _id: userId }))
    )
      return await sendStatus(res, 400, `Incomplete data.`);

    if (req.user.userId !== userId) {
      return await sendStatus(res, 401);
    }
    if (
      (await Doctor.countDocuments({ email: dat.email })) -
      ((await Doctor.findOne({ _id: userId }).exec()).email === dat.email)
    )
      return await sendStatus(res, 409, `User exists.`);

    await Doctor.findByIdAndUpdate(userId, dat).exec();
    const updatedDoctor = await Doctor.findOne({ _id: userId });

    logger.info(`Doctor updated!`, { dat });

    return await success(res, { user: updatedDoctor });
  } catch (error) {
    logger.error(`Error updating doctor.`, { error });
    return await sendStatus(res, 500);
  }
}

async function list(req, res) {
  var userId = req.params.user;

  try {
    if (
      !userId ||
      !validate_id(userId) ||
      !(await Doctor.countDocuments({ _id: userId }))
    )
      return await sendStatus(res, 404, `Invalid userId.`);

    if (req.user.userId !== userId) return await sendStatus(res, 401);

    const records = await Record.find({ doctor_id: userId });
    return await success(res, { records });
  } catch (error) {
    logger.error(`Error retrieving record list.`, { error });
    return await sendStatus(res, 500);
  }
}

async function doctor(req, res) {
  const cmd = req.params.cmd;

  if (!(cmd in cmdMap)) return await sendStatus(res, 404, `Invalid command.`);

  await cmdMap[cmd](req, res);
}

module.exports = cmdMap;
