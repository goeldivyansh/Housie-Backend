const express = require("express");
const router = express.Router();
const db = require("../data/db.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const JWT_SECRET = "etwqcyig@#$e723trgfcjd323bfug*&^$3%261757vb";

//get all the tickets of particular user.
router.get("/:userId/tickets", getTickets);

router.get("/createUsers/", createUsers);
router.get("/deleteUsers/", deleteUsers);

function getTickets(req, res, next) {
  try {
    let userId = req.params.userId;
    let { token } = req.body;

    //Verify User
    jwt.verify(token, JWT_SECRET, (err, decodedUserId) => {
      //If not valid
      if (err || decodedUserId != userId) {
        return res.status(401).json({ error: "Invalid Token" });
      }

      //Authorized, Get all the tickets
      db.getTicketsOfAPlayer(userId)
        .then((data) => {
          let ticketsArray = [];
          data.forEach(function (obj) {
            ticketsArray.push(JSON.parse(obj.ticketObj));
          });

          // console.log("tickets are : ", ticketsArray);

          res.status(200).json({
            msg: "Tickets found.",
            ticketsArray: ticketsArray,
          });
        })
        .catch((err) => {
          console.log("error: ", err.message);
          res.status(400).json({
            error: err.message,
            message: "Internal error: RoomId not found",
          });
        });
    });
  } catch (err) {
    next(err);
  }
}

async function createUsers(req, res, next) {
  try {
    let { userId1, userId2, userId3 } = req.body;

    //Encrypt the Password
    let encryptedPassword = await bcrypt.hash("qwer1234", 10);

    let userObj1 = {
      userId: userId1,
      password: encryptedPassword,
      name: "null",
    };
    let userObj2 = {
      userId: userId2,
      password: encryptedPassword,
      name: "null",
    };
    let userObj3 = {
      userId: userId3,
      password: encryptedPassword,
      name: "null",
    };

    try {
      //Create the user in redis

      //Create the user in DB
      await db.updateUsers(userObj1, userObj2, userObj3);
      res
        .status(200)
        .json({ userObj1: userObj1, userObj2: userObj2, userObj3: userObj3 });
    } catch (err) {
      res
        .status(400)
        .json({ error: err.message, message: "userId already exists" });
    }
  } catch (err) {
    next(err);
  }
}

async function deleteUsers(req, res, next) {
  try {
    let { userId1, userId2, userId3 } = req.body;

    try {
      //Create the user in redis
      // await client.set(userId1, JSON.stringify(userObj1));
      // await client.set(userId2, JSON.stringify(userObj2));
      // await client.set(userId3, JSON.stringify(userObj3));

      //Create the user in DB
      await db.deleteUsers(userId1, userId2, userId3);
      res
        .status(200)
        .json({ userId1, userId2, userId3, msg: "Deleted successfully" });
    } catch (err) {
      res.status(400).json({ error: err.message, message: "Internal error" });
    }
  } catch (err) {
    next(err);
  }
}

module.exports = router;
