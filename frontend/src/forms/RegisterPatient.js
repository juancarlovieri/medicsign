import React, { Component } from "react";
import axios from "axios";
import { Formik, Field, Form, ErrorMessage } from "formik";
const env = process.env;

import { createRSA, getPublic, getPrivate } from "app/App";
import { isLoggedIn } from "login/Accounts";

// name
// email
// password
// gender
// date_birth

const validate = (values) => {
  const name_regex = /^\w+( \w+)*$/i;
  const email_regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/i;
  const password_regex = /^[A-Za0-9._*%&$\\\/]/i;

  const errors = {};

  if (!values.name) {
    errors.name = "Name required";
  } else if (!name_regex.test(values.name)) {
    errors.name = "Name must only contain alphanumeric characters and spaces";
  }

  if (!values.email) {
    errors.email = "Email required";
  } else if (!email_regex.test(values.email)) {
    errors.email = "Not a valid email";
  }

  if (!values.password) {
    errors.password = "Password required";
  } else if (values.password.length < 6 || values.password.length > 15) {
    errors.password = "Password should be between 6-15 characters";
  } else if (!password_regex.test(values.password)) {
    errors.password =
      "Password can only contain alphanumeric characters and symbols (. _ * % & $ \\ /)";
  }

  if (!values.gender) {
    errors.gender = "Gender required";
  }

  if (!values.date_birth) {
    errors.date_birth = "Date birth is required";
  } else {
    var date_birth = new Date(values.date_birth);
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date_birth > today) {
      errors.date_birth = "Time Traveler spotted";
    }
  }

  return errors;
};

async function create(payload) {
  try {
    const res = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/patient/create`,
      payload
    );
    console.log(`Success!`);
    console.log(res.data);
  } catch (error) {
    console.error(`Error: ${error}`);
  }
}

function createPublicKey() {
  return "aabbaabbaabbaa";
}

async function handleSubmit(values, { setSubmitting }) {
  if (isLoggedIn() === "true") {
    console.error("Error: Logged in but submit");
    setSubmitting(false);
    return;
  }

  await createRSA();

  const date_birth = new Date(values.date_birth);

  const payload = {
    user: {
      email: values.email,
      gender: values.gender,
      name: values.name,
      date_birth: date_birth.getTime(),
      password: values.password,
    },
    keys: {
      public_key: await getPublic(),
      private_key: await getPrivate(),
    },
  };

  setTimeout(async () => {
    const success = await create(payload);
    setSubmitting(false);
    if (success) {
      location.reload();
    }
  }, 400);
}

const PatientForm = () => {
  return (
    <Formik
      validate={validate}
      onSubmit={handleSubmit}
      initialValues={{
        name: "",
        email: "",
        password: "",
        gender: "",
        date_birth: "",
      }}
    >
      <Form>
        <div className="form-group row mb-2">
          <label htmlFor="name" className="col-sm-2">
            Patient Name
          </label>
          <div className="col-sm-10">
            <Field className="form-control" name="name" type="text" />
            <ErrorMessage name="name">
              {(msg) => <div style={{ color: "red" }}>{msg}</div>}
            </ErrorMessage>
          </div>
        </div>
        <div className="form-group row mb-2">
          <label htmlFor="email" className="col-sm-2">
            Email
          </label>
          <div className="col-sm-10">
            <Field className="form-control" name="email" type="email" />
            <ErrorMessage name="email">
              {(msg) => <div style={{ color: "red" }}>{msg}</div>}
            </ErrorMessage>
          </div>
        </div>
        <div className="form-group row mb-2">
          <label htmlFor="password" className="col-sm-2">
            Password
          </label>
          <div className="col-sm-10">
            <Field className="form-control" name="password" type="password" />
            <ErrorMessage name="password">
              {(msg) => <div style={{ color: "red" }}>{msg}</div>}
            </ErrorMessage>
          </div>
        </div>
        <div className="form-group row mb-2">
          <div className="col-sm-2 pt-0">
            <label htmlFor="gender"> Gender </label> <br />
            <ErrorMessage name="gender">
              {(msg) => <div style={{ color: "red" }}>{msg}</div>}
            </ErrorMessage>
          </div>
          <div role="group" className="col-sm-10">
            <div className="form-check">
              <Field
                className="form-check-input"
                type="radio"
                name="gender"
                value="male"
              />
              <label>Male</label>
            </div>
            <div className="form-check">
              <Field
                className="form-check-input"
                type="radio"
                name="gender"
                value="female"
              />
              <label>Female</label>
            </div>
            <div className="form-check">
              <Field
                className="form-check-input"
                type="radio"
                name="gender"
                value="other"
              />
              <label>Other</label>
            </div>
          </div>
        </div>
        <div className="form-group row mb-2">
          <label htmlFor="date_birth" className="col-sm-2">
            Date of Birth
          </label>
          <div className="col-sm-10 pt-0">
            <Field className="form-control" name="date_birth" type="date" />
            <ErrorMessage name="date_birth">
              {(msg) => <div style={{ color: "red" }}>{msg}</div>}
            </ErrorMessage>
          </div>
        </div>
        <button type="submit" className="btn btn-primary">
          Submit
        </button>
      </Form>
    </Formik>
  );
};

export default PatientForm;
