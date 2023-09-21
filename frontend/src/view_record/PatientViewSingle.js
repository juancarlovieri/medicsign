import React, { Component } from "react";
import axios from "axios";
import { isLoggedIn } from "login/Accounts";
import Signature from "signing/Signature";
import Verify from "signing/Verify";
import { useParams } from "react-router-dom";
const env = process.env;

import {
  Badge,
  Button,
  Card,
  Navbar,
  Nav,
  Table,
  Container,
  Row,
  Col,
} from "react-bootstrap";

async function queryRecord(_id) {
  try {
    const res = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/record/view/` + String(_id)
    );
    console.log("success");
    const { record } = res.data.data;
    return record;
  } catch (error) {
    console.error(`Error: ${error}`);
  }
}

async function queryDoctor(_id) {
  try {
    const res = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/doctor/view/` + String(_id)
    );
    console.log("success");
    const { user } = res.data.data;
    return user;
  } catch (error) {
    console.error(`Error: ${error}`);
  }
}

async function queryPatient(_id) {
  try {
    const res = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/patient/view/` + String(_id)
    );
    console.log("success");
    const { user } = res.data.data;
    return user;
  } catch (error) {
    console.error(`Error: ${error}`);
  }
}

function withParams(Component) {
  return (props) => <Component {...props} params={useParams()} />;
}

class PatientRecordView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      record: {},
    };
  }

  async componentDidMount() {
    if (isLoggedIn() === "true") {
      console.log("Is Logged In");
      const record_id = this.props.params.id;
      const record = await queryRecord(record_id);
      const doctor = await queryDoctor(record.doctor_id);
      const patient = await queryPatient(record.patient_id);
      const record_data = {
        doctor_name: doctor.name,
        patient_name: patient.name,
        disease: record.disease,
        diagnosis: record.diagnosis,
        created_at: record.created_at,
        signature: record.signature,
      };
      const truncated_signature =
        record.signature.substring(0, Math.min(40, record.signature.length)) +
        "...";
      const created_at = Date.parse(record.created_at);
      const signed_data = {
        patient_id: record.patient_id,
        doctor_id: record.doctor_id,
        disease: record.disease,
        diagnosis: record.diagnosis,
        created_at: created_at,
      };
      const payload = record;
      console.log(record_data);
      this.setState({
        record: record_data,
        payload: payload,
        signed_data: signed_data,
        trunc_signature: truncated_signature,
        doctor_id: record.doctor_id,
      });
    } else {
      console.error(`Not logged in`);
    }
  }

  render() {
    let signature_method = (
      <Signature
        data={this.state.record}
        payload={this.state.payload}
        sign_data={this.state.signed_data}
      />
    );
    if (this.state.record.signature !== "") {
      signature_method = (
        <Verify
          signature={this.state.record.signature}
          sign_data={this.state.signed_data}
          doctor_id={this.state.doctor_id}
        />
      );
    }
    return (
      <Container fluid>
        <Row>
          <Col>
            <Card className="card-plain table-plain-bg">
              <Card.Header>
                <Card.Title as="h4">
                  Record {this.state.record_number}
                </Card.Title>
              </Card.Header>
              <Card.Body className="table-full-width table-responsive px-0">
                <Table className="table-hover">
                  <tbody>
                    <tr>
                      <td width="15%">Doctor Name</td>
                      <td>{this.state.record.doctor_name}</td>
                    </tr>
                    <tr>
                      <td>Patient Name</td>
                      <td>{this.state.record.patient_name}</td>
                    </tr>
                    <tr>
                      <td>Disease</td>
                      <td>{this.state.record.disease}</td>
                    </tr>
                    <tr>
                      <td>Diagnosis</td>
                      <td>{this.state.record.diagnosis}</td>
                    </tr>
                    <tr>
                      <td>Signature</td>
                      <td>{this.state.trunc_signature}</td>
                    </tr>
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <Row>{signature_method}</Row>
      </Container>
    );
  }
}

export default withParams(PatientRecordView);
