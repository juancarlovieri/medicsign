import React, { Component, useState } from "react";
import axios from "axios";
import { Formik, Field, Form, ErrorMessage } from "formik";

import { createRSA, getPublic, getPrivate, signRSA } from "app/App";
import { getUser, isLoggedIn } from "login/Accounts";
const env = process.env;
import QrReader from "react-qr-scanner";
import mongoose from "mongoose";

class Scan extends Component {
  constructor(props) {
    super(props);
    this.state = {
      delay: 100,
      result: "No result",
    };
  }

  handleError(err) {
    console.error(err);
  }

  render() {
    const previewStyle = {
      height: 240,
      width: 320,
    };

    return (
      <div>
        <QrReader
          delay={this.state.delay}
          style={previewStyle}
          onError={this.handleError}
          onScan={this.props.handleScan}
        />
      </div>
    );
  }
}

const validate = (values) => {
  const name_regex = /^\w+( \w+)*$/i;
  const email_regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/i;
  const password_regex = /^[A-Za0-9._*%&$\\\/]/i;
  const hospital_regex = /^[a-zA-Z0-9_-]+( [a-zA-Z0-9_-]+)*$/i;

  const errors = {};
  if (!values.patientid) {
    errors.patientid = "Patient ID required";
  }

  if (!values.doctorid) {
    errors.doctorid = "Doctor ID required";
  }

  if (!values.disease) {
    errors.disease = "Disease required";
  }

  if (!values.diagnosis) {
    errors.diagnosis = "Diagnosis required";
  }

  return errors;
};

async function sendRecord(payload) {
  try {
    const res = await axios.post(`${env.REACT_APP_BACKEND_URL}/record/create`, {
      record: payload,
    });
    console.log(`Success!`);
    console.log(res.data);
  } catch (error) {
    console.error(`Error: ${error}`);
  }
}

function getDoctorID() {
  const user = getUser();
  const doctorID = user._id;
  return doctorID;
}

const RecordForm = () => {
  const [patientId, setPatientId] = useState("");

  const scanQRCode = (data) => {
    if (!data) return;
    if (!data.text) return;
    var ObjectId = require("mongoose").Types.ObjectId;
    if (ObjectId.isValid(data.text)) {
      setPatientId(data.text);
    }
  };

  const currentPatientId = patientId ? patientId : "Scan QR";
  console.log(currentPatientId);

  return (
    <>
      <Formik
        validate={(values) => {
          const name_regex = /^\w+( \w+)*$/i;
          const email_regex =
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/i;
          const password_regex = /^[A-Za0-9._*%&$\\\/]/i;
          const hospital_regex = /^[a-zA-Z0-9_-]+( [a-zA-Z0-9_-]+)*$/i;

          const errors = {};
          if (currentPatientId === "Scan QR") {
            errors.patientid = "Patient ID required";
          }

          if (!values.doctorid) {
            errors.doctorid = "Doctor ID required";
          }

          if (!values.disease) {
            errors.disease = "Disease required";
          }

          if (!values.diagnosis) {
            errors.diagnosis = "Diagnosis required";
          }

          return errors;
        }}
        onSubmit={async (values, { setSubmitting }) => {
          let current_time = new Date();

          const created_at = current_time.getTime();

          const signed_data = {
            patient_id: currentPatientId,
            doctor_id: values.doctorid,
            disease: values.disease,
            diagnosis: values.diagnosis,
            created_at: created_at,
          };

          const JSON_signed = JSON.stringify(signed_data);
          const signature = await signRSA(JSON_signed);

          const payload = {
            patient_id: currentPatientId,
            doctor_id: values.doctorid,
            disease: values.disease,
            diagnosis: values.diagnosis,
            created_at: created_at,
            signature: signature,
          };

          setTimeout(async () => {
            await sendRecord(payload);
            setSubmitting(false);
            window.location.replace("../../record");
          }, 400);
        }}
        initialValues={{
          patientid: currentPatientId,
          doctorid: getDoctorID(),
          disease: "",
          diagnosis: "",
        }}
      >
        {(props) => {
          console.log(props);
          return (
            <Form>
              <div className="form-group row mb-2">
                <label htmlFor="patientid" className="col-sm-2">
                  Patient Id
                </label>
                <div className="col-sm-10">
                  <Field
                    className="form-control"
                    name="patientid"
                    type="text"
                    value={currentPatientId}
                    disabled
                  />
                  <ErrorMessage name="patientid">
                    {(msg) => <div style={{ color: "red" }}>{msg}</div>}
                  </ErrorMessage>
                </div>
              </div>
              <div className="form-group row mb-2">
                <label htmlFor="disease" className="col-sm-2">
                  Disease
                </label>
                <div className="col-sm-10">
                  <Field className="form-control" name="disease" type="text" />
                  <ErrorMessage name="disease">
                    {(msg) => <div style={{ color: "red" }}>{msg}</div>}
                  </ErrorMessage>
                </div>
              </div>
              <div className="form-group row mb-2">
                <label htmlFor="diagnosis" className="col-sm-2">
                  Diagnosis
                </label>
                <div className="col-sm-10">
                  <Field
                    component="textarea"
                    style={{ width: "100%", height: "auto" }}
                    rows="10"
                    className="form-control"
                    name="diagnosis"
                    type="textarea"
                  />
                  <ErrorMessage name="diagnosis">
                    {(msg) => <div style={{ color: "red" }}>{msg}</div>}
                  </ErrorMessage>
                </div>
              </div>
              <button type="submit" className="btn btn-primary">
                Submit
              </button>
            </Form>
          );
        }}
      </Formik>
      <Scan handleScan={scanQRCode} />
    </>
  );
};

export default RecordForm;
