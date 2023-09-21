import React, { useState } from "react";
import { getUser } from "login/Accounts";
import axios from "axios";
const env = process.env;

function ab2str(buf) {
  return window.btoa(String.fromCharCode.apply(null, new Uint8Array(buf)));
}

function str2ab(str) {
  const binaryStr = window.atob(str);
  const len = binaryStr.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes.buffer;
}

async function exportPrivateKey(key) {
  const exported = await window.crypto.subtle.exportKey("pkcs8", key);
  return ab2str(exported);
}

async function exportPublicKey(key) {
  const exported = await window.crypto.subtle.exportKey("spki", key);
  return ab2str(exported);
}

async function createRSA() {
  console.log("GENERATE");
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-PSS",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"]
  );
  const rawPrivate = await exportPrivateKey(keyPair.privateKey);
  const rawPublic = await exportPublicKey(keyPair.publicKey);
  sessionStorage.setItem("privateKey", rawPrivate);
  sessionStorage.setItem("publicKey", rawPublic);
}

function saveRSA(keys) {
  console.log(keys);
  if (keys.publicKey && keys.privateKey) {
    console.log("save");
    sessionStorage.setItem("privateKey", keys.privateKey);
    sessionStorage.setItem("publicKey", keys.publicKey);
  }
}

function getPublic() {
  const publicKeyString = sessionStorage.getItem("publicKey");
  if (publicKeyString !== "undefined") {
    const userKey = publicKeyString;
    return userKey;
  }
}

function getPrivate() {
  const privateKeyString = sessionStorage.getItem("privateKey");
  if (privateKeyString !== "undefined") {
    const userKey = privateKeyString;
    return userKey;
  }
}

async function importPublic(key) {
  const bufferKey = str2ab(key);
  console.log(bufferKey);
  try {
    return await window.crypto.subtle.importKey(
      "spki",
      bufferKey,
      {
        name: "RSA-PSS",
        hash: "SHA-256",
      },
      true,
      ["verify"]
    );
  } catch (error) {
    console.error(`Error: ${error}`);
  }
}

async function importPrivate(key) {
  const bufferKey = str2ab(key);
  console.log(bufferKey);
  try {
    const cryptoKey = await window.crypto.subtle.importKey(
      "pkcs8",
      bufferKey,
      {
        name: "RSA-PSS",
        hash: "SHA-256",
      },
      true,
      ["sign"]
    );
    console.log(cryptoKey);
    return cryptoKey;
  } catch (error) {
    console.error(`Error: ${error}`);
  }
}

function toUint8(str) {
  var uint8array = new TextEncoder("utf-8").encode(str);
  return uint8array;
}

async function signRSA(data) {
  const encoded = toUint8(data);
  const signature = await window.crypto.subtle.sign(
    {
      name: "RSA-PSS",
      saltLength: 32,
    },
    await importPrivate(await getPrivate()),
    encoded
  );
  console.log(signature);
  console.log(ab2str(signature));
  return ab2str(signature);
}

async function getDoctorPublicKey(doctor_id) {
  try {
    const res = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/doctor/view/${doctor_id}`
    );
    const { data } = res.data;
    console.log(data.user.public_key);
    return data.user.public_key;
  } catch (error) {
    console.log(`Error: ${error}`);
    return "Not Found";
  }
}

async function verifyRSA(signature, data, doctor_id) {
  if (getUser().type === "Doctor") {
    const encoded = toUint8(data);
    const signencoded = str2ab(signature);
    return await window.crypto.subtle.verify(
      {
        name: "RSA-PSS",
        saltLength: 32,
      },
      await importPublic(getPublic()),
      signencoded,
      encoded
    );
  } else {
    const encoded = toUint8(data);
    const signencoded = str2ab(signature);
    console.log(signencoded);
    return await window.crypto.subtle.verify(
      {
        name: "RSA-PSS",
        saltLength: 32,
      },
      await importPublic(await getDoctorPublicKey(doctor_id)),
      signencoded,
      encoded
    );
  }
}

export { createRSA, saveRSA, getPublic, getPrivate, signRSA, verifyRSA };
