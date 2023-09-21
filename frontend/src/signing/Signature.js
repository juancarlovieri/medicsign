import React, { Component } from "react";
import axios from "axios";
import { signRSA } from "app/App.js";
const env = process.env;

class Signature extends Component {
  constructor(props) {
    super(props);
    this.signRecord = this.signRecord.bind(this);
  }

  async signRecord() {
    const data = JSON.stringify(this.props.signed_data);

    const signature = await signRSA(data);
    console.log(signature);

    const timestamp = Date.parse(this.props.payload.created_at);

    const payload = {
      record: {
        _id: this.props.payload._id,
        doctor_id: this.props.payload.doctor_id,
        patient_id: this.props.payload.patient_id,
        disease: this.props.payload.disease,
        diagnosis: this.props.payload.diagnosis,
        created_at: timestamp,
        signature: signature,
      },
    };

    console.log(payload);

    try {
      const res = await axios.post(
        `${env.REACT_APP_BACKEND_URL}/record/update`,
        payload
      );
      console.log(`Success!`);
      console.log(res.data);
    } catch (error) {
      console.error(`Error: ${error}`);
    }
    // update stuff
  }

  render() {
    return (
      <div>
        <button className="btn btn-primary" onClick={this.signRecord}>
          Sign Document
        </button>
      </div>
    );
  }
}

export default Signature;
