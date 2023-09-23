// const patient = require(`./controllers/patient`);
// const doctor = require(`./controllers/doctor`);
// const record = require(`./controllers/record`);
const { auth, refresh, validate, logout }  = require(`./middleware/auth`);

module.exports = async (fastify, options) => {
  fastify.get(`/`, async (req, res) => {
    res.send({ data: `API success with fastify!` });
  });

  // app.post(`/patient/create`, patient.create);
  // app.post(`/patient/update`, auth, patient.update);
  // app.post(`/patient/login`, patient.login);
  // app.get(`/patient/view/:user`, auth, patient.view);
  // app.get(`/patient/list/:user`, auth, patient.list);

  // app.post(`/doctor/create`, doctor.create);
  // app.post(`/doctor/update`, auth, doctor.update);
  // app.post(`/doctor/login`, doctor.login);
  // app.get(`/doctor/view/:user`, auth, doctor.view);
  // app.get(`/doctor/list/:user`, auth, doctor.list);

  // app.post(`/record/create`, auth, record.create);
  // app.post(`/record/update`, auth, record.update);
  // app.get(`/record/view/:record`, auth, record.view);

  // app.get(`/token/validate`, validate);
  // app.post(`/token/logout`, auth, logout);
  // app.get(`/token/refresh`, refresh);
};
