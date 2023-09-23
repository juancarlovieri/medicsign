const patient = require(`./controllers/patient`);
const doctor = require(`./controllers/doctor`);
const record = require(`./controllers/record`);
const { auth, refresh, validate, logout }  = require(`./middleware/auth`);

module.exports = async (fastify, options) => {
  fastify.get(`/`, async (req, res) => {
    res.send({ data: `API success with fastify!` });
  });

  fastify.post(`/patient/create`, patient.create);
  fastify.post(`/patient/update`, patient.update);
  fastify.post(`/patient/login`, patient.login);
  fastify.get(`/patient/view/:user`, patient.view);
  fastify.get(`/patient/list/:user`, patient.list);

  fastify.post(`/doctor/create`, doctor.create);
  fastify.post(`/doctor/update`, doctor.update);
  fastify.post(`/doctor/login`, doctor.login);
  fastify.get(`/doctor/view/:user`, doctor.view);
  fastify.get(`/doctor/list/:user`, doctor.list);

  fastify.post(`/record/create`, record.create);
  fastify.post(`/record/update`, record.update);
  fastify.get(`/record/view/:record`, record.view);

  fastify.get(`/token/validate`, validate);
  fastify.post(`/token/logout`, logout);
  // app.get(`/token/refresh`, refresh);
};
