const mongoose = require(`mongoose`);
const { logger } = require(`../logger`);
const { success, error, sendStatus } = require(`../req_handler`);
const { Record } = require(`../models/record`);
const { Patient } = require(`../models/patient`);
const { Doctor } = require(`../models/doctor`);
const sign = require(`../sign`);
const ObjectId = mongoose.Types.ObjectId;

function logAndThrow(jobs, message) {
  const errors = jobs
    .filter((j) => j.status !== 'fulfilled')
    .map((j) => j.reason);
  errors.forEach((error) =>
    logger.error(`${message} ${error.message}`, { error })
  );
  if (errors.length) {
    throw new Error(message);
  }
  return jobs.filter((j) => j.status === 'fulfilled').map((j) => j.value);
}

const cmdMap = {
  create,
  view,
  update,
};

const recordSchema = {
  patient_id: `string`,
  doctor_id: `string`,
  disease: `string`,
  diagnosis: `string`,
  created_at: `number`,
  signature: `string`,
};

function validate_id(userId) {
  return ObjectId.isValid(userId);
}

function validate(dat) {
  var res = {};
  for (const key in recordSchema) {
    if (typeof dat[key] !== recordSchema[key]) return undefined;
    res[key] = dat[key];
  }
  if (!validate_id(res.patient_id) || !validate_id(res.doctor_id))
    return undefined;
  return res;
}

async function create(req, res) {
  var dat = req.body;
  dat = validate(dat);
  if (!dat) return await sendStatus(res, 400, `Invalid record.`);

  try {
    const jobs = await Promise.allSettled([
      Patient.countDocuments({ _id: dat.patient_id }),
      Doctor.countDocuments({ _id: dat.doctor_id }),
    ]);
    const results = logAndThrow(jobs, `createRecord failed.`);
    const invalid = results.some((r) => r === 0);
    if (invalid)
      return await sendStatus(res, 400, `Invalid patient or doctor.`);

    if (req.user.userId !== dat.doctor_id) {
      return await sendStatus(res, 403);
    }

    const newRecord = new Record(dat);
    await newRecord.save();
    logger.info(`New Record saved!`, { dat });

    return await success(res, newRecord);
  } catch (error) {
    logger.error(`Error creating record.`, { error });
    return await sendStatus(res, 500);
  }
}

async function view(req, res) {
  try {
    const recordId = req.params.record;

    if (
      !recordId ||
      !validate_id(recordId) ||
      !(await Record.countDocuments({ _id: recordId }))
    )
      return await sendStatus(res, 404, `Invalid recordId`);

    const record = await Record.findOne({ _id: recordId }).exec();

    if (
      req.user.userId !== record.patient_id.toString() &&
      req.user.userId !== record.doctor_id.toString()
    ) {
      return await sendStatus(res, 403);
    }

    return await success(res, record, await sign(record, req.user.userId));
  } catch (error) {
    logger.error(`Error viewing record.`, { error });
    return await sendStatus(res, 500);
  }
}

async function update(req, res) {
  var dat = req.body;
  const recordId = dat._id;
  dat = validate(dat);
  try {
    if (
      !dat ||
      !recordId ||
      !validate_id(recordId) ||
      !(await Record.countDocuments({ _id: recordId }))
    )
      return await sendStatus(res, 400, `Invalid record.`);

    const jobs = await Promise.allSettled([
      Patient.countDocuments({ _id: dat.patient_id }),
      Doctor.countDocuments({ _id: dat.doctor_id }),
    ]);
    const results = logAndThrow(jobs, `createRecord failed.`);
    const invalid = results.some((r) => r === 0);
    if (invalid)
      return await sendStatus(res, 400, `Invalid patient or doctor.`);

    if (
      req.user.userId !== dat.doctor_id ||
      req.user.userId !==
        (await Record.findOne({ _id: recordId })).doctor_id.toString()
    ) {
      return await sendStatus(res, 403);
    }

    const updatedRecord = await Record.findByIdAndUpdate(recordId, dat).exec();

    logger.info(`Record udpated!`, { dat });

    return await success(res, updatedRecord);
  } catch (error) {
    logger.error(`Error updating record.`, { error });
    return await sendStatus(res, 500);
  }
}

async function record(req, res) {
  const cmd = req.params.cmd;

  if (!(cmd in cmdMap)) return await sendStatus(res, 404, `Invalid command.`);

  await cmdMap[cmd](req, res);
}

module.exports = cmdMap;
