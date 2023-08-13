require('dotenv').config();
const express = require("express");
const router = express.Router();
const db = require("../data/db.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

//Signup API
router.post("/signup", signup);

//Login API
router.post("/login", login);

async function signup(req, res, next) {
  //Extract fields from body
  console.log("Entring signup");
  try {
    const { userId, password, name } = req.body;

    //Encrypt the Password
    let encryptedPassword = await bcrypt.hash(password, 10);
    
    try {
      //Create the user in DB
      await db.createUser(userId, name, encryptedPassword);
      res.status(200).json({ userId: userId, name: name });
    } catch (err) {
      console.log("signup | err:", err);
      res
        .status(400)
        .json({ error: err.message, message: "userId already exists" });
    }
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  console.log("Entring Login");
  try {
    //Extract fields from body
    const { userId, password } = req.body;

    //check userId exists in db or not
    let userObj = await db.findUser(userId);

    if (userObj) {
      //Check password is correct or not
      let isValid = await bcrypt.compare(password, userObj.password);
      if (isValid) {
        //Get token
        const token = await jwt.sign(userObj.userId, JWT_SECRET);
        res.status(200).json({
          userId: userObj.userId,
          name: userObj.name,
          token: token,
        });
      } else {
        res.status(401).json({ message: "Incorrect Password" });
      }
    } else {
      res.status(400).json({ error: "userId does not exists" });
    }
  } catch (err) {
    next(err);
  }
}

module.exports = router;
