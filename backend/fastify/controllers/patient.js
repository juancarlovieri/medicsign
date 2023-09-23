'use strict';

const crypto = require(`crypto`);
const mongoose = require(`mongoose`);
const jwt = require(`jsonwebtoken`);
const bcrypt = require(`bcryptjs`);
const env = process.env;
const { logger } = require(`../middleware/logger`);
const { success, error, sendStatus } = require(`../middleware/req_handler`);
const { Patient } = require(`../models/patient`);
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

const patientSchema = {
  email: `string`,
  gender: `string`,
  name: `string`,
  date_birth: `number`,
  // public_key: `string`,
  password: `string`,
};

function validate(dat) {
  var res = {};
  for (const key in patientSchema) {
    if (typeof dat[key] !== patientSchema[key]) return undefined;
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
      return await sendStatus(res, 400, `Invalid key format.`);
    const { public_key, private_key } = keys;

    dat.password = await hash(dat.password);
    dat.public_key = public_key;

    if (await Patient.countDocuments({ email: dat.email }))
      return await sendStatus(res, 409, `User exists.`);

    const newPatient = new Patient(dat);
    await newPatient.save();

    const newKey = new Key({ userId: newPatient._id, public_key, private_key });
    await newKey.save();

    // const tokens = await set_tokens(newPatient, res, `Patient`);
    if (!(await auth.login(newPatient, req, `Patient`)))
      return await sendStatus(res, 500);

    logger.info(`New Patient saved!`, { dat });

    await success(res, { user: newPatient, keys });
  } catch (error) {
    logger.error(`Error saving new patient.`, { error });
    return await sendStatus(res, 500);
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body.credentials || {};

    if (!(email && password)) {
      return await sendStatus(res, 400, `Insufficient data to log in.`);
    }

    const user = await Patient.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      const userKey = await Key.findOne({ userId: user._id });
      const keys = {
        private_key: userKey.private_key,
        public_key: userKey.public_key,
      };

      // const tokens = await set_tokens(user, res, `Patient`);
      if (!(await auth.login(user, req, `Patient`)))
        return await sendStatus(res, 500);

      logger.info(`Patient login success.`);
      return await success(res, { user, keys });
    }
    logger.info(`Patient invalid credentials.`);
    return await sendStatus(res, 400, `Invalid credentials.`);
  } catch (error) {
    logger.error(`Error logging patient in.`, { error });
    return await sendStatus(res, 500);
  }
}

async function view(req, res) {
  const userId = req.params.user;

  try {
    if (
      !userId ||
      !validate_id(userId) ||
      !(await Patient.countDocuments({ _id: userId }))
    )
      return await sendStatus(res, 404, `Invalid userId.`);

    // if (req.user.userId !== userId) {
    //   return await sendStatus(res, 403);
    // }

    const userPriv = await Patient.findOne({ _id: userId }).exec();
    const user = {
      name: userPriv.name,
      gender: userPriv.gender,
      public_key: userPriv.public_key,
    };

    await success(res, { user });
  } catch (error) {
    logger.error(`Error viewing patient.`, { error });
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
      !(await Patient.countDocuments({ _id: userId }))
    )
      return await sendStatus(res, 400, `Incomplete data..`);

    if (req.user.userId !== userId) {
      return await sendStatus(res, 403);
    }
    if (
      (await Patient.countDocuments({ email: dat.email })) -
      ((await Patient.findOne({ _id: userId }).exec()).email === dat.email)
    )
      return await sendStatus(res, 409, `User exists.`);

    await Patient.findByIdAndUpdate(userId, dat).exec();
    const updatedPatient = await Patient.findOne({ _id: userId });

    logger.info(`Patient updated!`, { dat });

    return await success(res, { user: updatedPatient });
  } catch (error) {
    logger.error(`Error updating patient.`, { error });
    return await sendStatus(res, 500);
  }
}

async function list(req, res) {
  var userId = req.params.user;

  try {
    if (
      !userId ||
      !validate_id(userId) ||
      !(await Patient.countDocuments({ _id: userId }))
    )
      return await sendStatus(res, 404, `Invalid userId.`);

    // if (req.user.userId !== userId) return await sendStatus(res, 403);

    const records = await Record.find({ patient_id: userId });
    return await success(res, { records });
  } catch (error) {
    logger.error(`Error retrieving record list.`, { error });
    return await sendStatus(res, 500);
  }
}

async function patient(req, res) {
  const cmd = req.params.cmd;

  if (!(cmd in cmdMap)) return await sendStatus(res, 404, `Invalid command.`);

  await cmdMap[cmd](req, res);
}

module.exports = cmdMap;
