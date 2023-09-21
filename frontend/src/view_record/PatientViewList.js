import React, { Component } from "react";
import axios from "axios";
import { getUser, isLoggedIn } from "login/Accounts";
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

async function queryRecordList() {
  try {
    const user = await getUser();
    const query_path = `${env.REACT_APP_BACKEND_URL}/patient/list/` + user._id;
    const res = await axios.get(query_path);
    const { data } = res.data;
    return data;
  } catch (error) {
    console.error(`Error: ${error}`);
  }
}

async function queryPatient(_id) {
  console.log(_id.toString());
  try {
    console.log(_id.toString());
    const res = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/patient/view/` + _id.toString()
    );
    console.log("success");
    const { user } = res.data.data;
    return user;
  } catch (error) {
    console.error(`Error: ${error}`);
  }
}

class PatientRecordList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      records: [],
    };
  }

  async componentDidMount() {
    if (isLoggedIn() === "true") {
      let res = await queryRecordList();
      for (let i = 0; i < res.records.length; i++) {
        console.log(res.records[i].patient_id);
        const patient_name = await queryPatient(res.records[i].patient_id);
        res.records[i].patient_name = patient_name;
      }
      console.log(res);
      this.setState({
        records: res.records,
      });
    } else {
      console.error("Not Logged In");
    }
    console.log(this.state.records);
  }
  render() {
    return (
      <>
        <Container fluid>
          <Row>
            <Col md="12">
              <Card className="strpied-tabled-with-hover">
                <Card.Header>
                  <Card.Title as="h4">Patient Record List</Card.Title>
                  <p className="card-category">List of Patient's Records</p>
                </Card.Header>
                <Card.Body className="table-full-width table-responsive px-0">
                  <Table className="table-hover table-striped">
                    <thead>
                      <tr>
                        <th className="border-0">ID</th>
                        <th className="border-0">Patient Name</th>
                        <th className="border-0">Disease</th>
                      </tr>
                    </thead>
                    <tbody>
                      {this.state.records.map((val, key) => {
                        return (
                          <tr key={key}>
                            <td>{val._id}</td>
                            <td>{val.patient_name.name}</td>
                            <td>{val.disease}</td>
                            <td>
                              <a href={"/record/" + val._id}>More Details</a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </>
    );
  }
}

export default PatientRecordList;
