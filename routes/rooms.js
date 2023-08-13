const express = require("express");
const router = express.Router();
const db = require("../data/db.js");
// const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const JWT_SECRET = "etwqcyig@#$e723trgfcjd323bfug*&^$3%261757vb";
const ticket = require("./generateTicket.js");
const { v4: uuidv4 } = require("uuid");
const common = require("../common.js");
// const e = require("express");
// const REDIS_PORT = 6379;

//Create and connect redis client
// const client = redis.createClient(REDIS_PORT);
// client.on("error", (err) => {
//   console.log("Error " + err);
// });
// client.connect();

router.post("/", createRoom);

router.get("/:roomId/", getRoom);

router.put("/:roomId/board", addBoard); //check conditions when room doesn't exists

router.put("/:roomId/board/generateNumber", generateNumber);

router.put("/:roomId/board/resetBoard", updateOrResetBoard);

router.put("/:roomId/join", addPlayerInRoom);

router.delete("/:roomId/delete", deleteTheRoom);

router.post("/:roomId/ticket", createTicket);

// router.get("/:roomId", findAllPlayersInRoom);

router.get("/:roomId/:begName", findPlayersWithBegName);

router.get("/all/:hostId/host", findRoomsWithHostId); //type: host/player/any
router.get("/all/:playerId/player", findRoomsWithPlayerId); //type: host/player/any
router.get("/all/:userId/any", findRoomsWithUserId); //type: host/player/any



// router.get("rooms/all",getAllRooms);

function createRoom(req, res) {
  try {
    const { userId, token } = req.body;

    // Generate a roomId
    const createdTime = Date.now();
    const roomId = uuidv4();
    console.log(roomId, userId, createdTime);

    //check valid token or not
    jwt.verify(token, JWT_SECRET, (err, decodedUserId) => {
      //If not valid
      if (err || decodedUserId != userId) {
        return res.status(401).json({ error: "Invalid Token" });
      }

      //else valid insert record in table
      db.createRoom(roomId, userId, createdTime)
        .then(() => {
          console.log("Room created: ", roomId, userId, createdTime);
          res
            .status(201)
            .json({ roomId: roomId, hostId: userId, createdTime: createdTime });
        })
        .catch((err) => {
          res
            .status(400)
            .json({ error: err.message, message: "Internal error" });
        });
    });
  } catch (err) {
    next(err);
  }
}

function getRoom(req, res) {
  try {
    let roomId = req.params.roomId;
    const { userId, token } = req.query;
    // console.log("req : ", req);
    console.log("req.body", req.body);
    console.log("roomId-", roomId);
    //check valid token or not
    jwt.verify(token, JWT_SECRET, (err, decodedUserId) => {
      //If not valid
      if (err || decodedUserId != userId) {
        return res.status(401).json({ error: "Invalid Token" });
      }

      //else valid insert record in table
      db.getRoom(roomId)
        .then((response) => {
          console.log("Fetched Room: ", response);
          res
          .status(200)
          .json({ 
            hostId: response.hostId, 
            roomId: response.roomId,
            players: response.playerIdSet?.values
          });
        })
        .catch((err) => {
          if(err.message ="Room not found") {
            res
            .status(404)
            .json({ error: err.message, message: "Room not found! Please check roomId again." });
          }
          else {
            res
            .status(400)
            .json({ error: err.message, message: "Internal error" });
          }
        });
    });
  } catch (err) {
    next(err);
  }
}

function addBoard(req, res) {
  try {
    console.log("Entering addBoard | req.body", req.body);
    let roomId = req.params.roomId;
    let { hostId, token } = req.body;

    console.log("roomId, ", roomId);
    console.log("hostId, ", hostId);
    console.log("token, ", token);

    //Verify User
    jwt.verify(token, JWT_SECRET, (err, decodedUserId) => {
      //If not valid
      if (err || decodedUserId != hostId) {
        return res.status(401).json({ error: "Invalid Token" });
      }

      //else valid, Generate board

      let boardObj = {
        pickedNumbers: [],
        unPickedNumbers: [],
      };
      for (let i = 1; i <= 90; i++) {
        boardObj.unPickedNumbers.push(i);
      }
      board = JSON.stringify(boardObj);

      // Insert board in roomsTable
      db.addBoardInRoom(board, hostId, roomId)
        .then(async () => {
          //insert board in redis (cache)
          // await client.set(roomId, board);

          console.log("Board inserted...");
          res.status(201).json({
            roomId: roomId,
            board: board,
            msg: "Board inserted successfully.",
          });
        })
        .catch((err) => {
          console.log("err: ", err.message);
          res.status(400).json({
            error: err.message,
            message: "Board already present/DB error",
          });
        });
    });
  } catch (err) {
    next(err);
  }
}

function updateOrResetBoard(req, res) {
  try {
    let roomId = req.params.roomId;
    let { hostId, token, board } = req.body;

    //Verify User
    jwt.verify(token, JWT_SECRET, (err, decodedUserId) => {
      //If not valid
      if (err || decodedUserId != hostId) {
        return res.status(401).json({ error: "Invalid Token" });
      }

      //else valid, Reset board
      if (!board) {
        boardObj = {
          pickedNumbers: [],
          unPickedNumbers: [],
        };
        for (let i = 1; i <= 90; i++) {
          boardObj.unPickedNumbers.push(i);
        }
        board = JSON.stringify(boardObj);
      }
      // let board = {
      //   pickedNumbers: [],
      //   unPickedNumbers: [],
      // };

      // for (let i = 1; i <= 90; i++) board.unPickedNumbers.push(i);
      console.log(board);

      // Insert board in roomsTable
      db.addOrUpdateOrResetBoard(board, hostId, roomId)
        .then(async () => {
          // Reset board in redis
          // await client.set(roomId, board);
          console.log("Board reset successful.");
          res.status(201).json({
            roomId: roomId,
            board: board,
            msg: "Board Reset successfully.",
          });
        })
        .catch((err) => {
          console.log("err: ", error.message);
          res
            .status(400)
            .json({ error: err.message, message: "Internal error" });
        });
    });
  } catch (err) {
    next(err);
  }
}

function generateNumber(req, res) {
  try {
    let roomId = req.params.roomId;
    let { hostId, token } = req.body;

    jwt.verify(token, JWT_SECRET, async (err, decodedUserId) => {
      //If not valid
      if (err || decodedUserId != hostId) {
        return res.status(401).json({ error: "Invalid Token" });
      }

      //fetch board of roomId from redis
      let board;
      try {
        //fetch board of roomId from redis
        // board = await client.get(roomId);
        // console.log("Board from redis: ", board);

        //if board not present in redis then fetch it from db
        if (!board) {
          // console.log("in if");
          board = await db.getBoard(roomId);
        }

        let boardObj = JSON.parse(board);

        //if all numbers picked, return
        if (boardObj.unPickedNumbers.length === 0) {
          console.log("boardStr:   -- ", board);
          //Update board in dynamodb
          await db.addOrUpdateOrResetBoard(board, hostId, roomId);
          return res.status(200).json({
            msg: "All numbers are successfully picked.",
          });
        }

        //----Pop random number from unPickedNumbers & push it to PickedNumbersArray----//
        let ind = Math.floor(Math.random() * boardObj.unPickedNumbers.length);
        let currentNumber = boardObj.unPickedNumbers[ind];
        boardObj.unPickedNumbers.splice(ind, 1);
        boardObj.pickedNumbers.push(currentNumber);

        console.log("boardObj:   -- ", boardObj);
        // convert updated boardObj to board string.
        let boardStr = JSON.stringify(boardObj);

        console.log("boardStr:   -- ", boardStr);
        //update board in redis

        // await client.set(roomId, boardStr);

        res.status(200).json({
          currentNumber: currentNumber,
          msg: "Number generated.",
        });
      } catch (err) {
        console.log("Error : ", err.message);
        res
          .status(400)
          .json({ error: err.message, message: "Error in accessing board" });
      }
    });
  } catch (err) {
    next(err);
  }
}

function addPlayerInRoom(req, res) {
  try {
    let roomId = req.params.roomId;
    let { hostId, playerId, token } = req.body;
    console.log("addPlayerInRoom | req.body: ", req.body);

    //Verify User
    jwt.verify(token, JWT_SECRET, (err, decodedUserId) => {
      //If not valid
      if (err || decodedUserId != playerId) {
        return res.status(401).json({ error: "Invalid Token" });
      }

      //Authorized, Add player in roomsTable
      db.addPlayerInRoom(hostId, playerId, roomId)
        .then(() => {
          console.log("Player added successfully...");
          //Send pubnub event for successfull addition.
          common.publishMsg(`ch-player-${roomId}`, {playerId: playerId})
          res.status(200).json({
            roomId: roomId,
            playerId: playerId,
            msg: "Player added successfully.",
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

function deleteTheRoom(req, res) {
  try {
    let roomId = req.params.roomId;
    let { hostId, token } = req.body;

    //Verify User
    jwt.verify(token, JWT_SECRET, (err, decodedUserId) => {
      //If not valid
      if (err || decodedUserId != hostId) {
        return res.status(401).json({ error: "Invalid Token" });
      }

      //else valid, Delete the room
      db.deleteRoom(hostId, roomId)
        .then(() => {
          console.log("Room deleted successfully.");
          res.status(200).json({
            roomId: roomId,
            msg: "Room deleted successfully.",
          });
        })
        .catch((err) => {
          console.log("err: ", err.message);
          res
            .status(400)
            .json({ error: err.message, message: "Internal error" });
        });
    });
  } catch (err) {
    next(err);
  }
}

function createTicket(req, res) {
  try {
    let roomId = req.params.roomId;
    let { playerId, token } = req.body;
    console.log("roomId: ", roomId);

    //check valid token or not
    jwt.verify(token, JWT_SECRET, async (err, decodedUserId) => {
      //If not valid
      if (err || decodedUserId != playerId) {
        return res.status(401).json({ error: "Invalid Token" });
      }

      // Generate Ticket ID
      let ticketId = uuidv4();

      //--Check whether ticket is duplicate or not---//

      //Find all the tickets of the room
      let tickets = await findAllTicketsInRoom(roomId); //tickets object
      console.log("tickets: ", tickets, tickets.length);
      let ticketObj = {};
      // let isDuplicate = false;
      if (tickets.length === 0) {
        ticketObj = ticket.generateTicket();
      } else {
        let isDuplicate = false;
        do {
          isDuplicate = false;
          // Generate Ticket Object
          ticketObj = ticket.generateTicket();

          //check ticketsObj with all tickets
          for (t in tickets) {
            if (
              JSON.stringify(t.ticketArray) ==
              JSON.stringify(ticketObj.ticketArray)
            ) {
              isDuplicate = true;
            }
          }
        } while (isDuplicate);
      }
      ticketObj.ticketId = ticketId;
      let ticketString = JSON.stringify(ticketObj);
      console.log("tstr: ", ticketString);

      // valid ticket (Unique), insert ticket in table
      db.createTicket(ticketId, playerId, ticketString, roomId)
        .then(() => {
          res.status(201).json({
            ticketId: ticketId,
            playerId: playerId,
            ticketObj: ticketObj,
          });
        })
        .catch((err) => {
          res
            .status(400)
            .json({ error: err.message, message: "Internal error" });
        });
    });
  } catch (err) {
    next(err);
  }
}

function findAllPlayersInRoom(req, res) {
  try {
    let roomId = req.params.roomId;
    let { hostId, token } = req.body;
    console.log('Entrinng findAllPlayersInRoom: hostId:', hostId);

    //Verify User
    jwt.verify(token, JWT_SECRET, async (err, decodedUserId) => {
      //If not valid
      if (err || decodedUserId != hostId) {
        return res.status(401).json({ error: "Invalid Token" });
      }
      try {
        db.findAllPlayersInRoom(roomId)
          .then((playersArray) => {
            console.log("playersArray: ", playersArray);
            res.status(200).json({
              hostId: hostId,
              roomId: roomId,
              playersArray: playersArray,
            });
          })
          .catch((err) => {
            throw err;
          });
      } catch (err) {
        res.status(400).json({ error: err.message, message: "Internal error" });
      }
    });
  } catch (err) {
    next(err);
  }
}

function findPlayersWithBegName(req, res) {
  try {
    let roomId = req.params.roomId;
    let begName = req.params.begName;
    let { hostId, token } = req.body;

    //Verify User
    jwt.verify(token, JWT_SECRET, async (err, decodedUserId) => {
      //If not valid
      if (err || decodedUserId != hostId) {
        return res.status(401).json({ error: "Invalid Token" });
      }
      try {
        db.findAllPlayersInRoom(roomId)
          .then((playersArray) => {
            console.log("playersArray: ", playersArray);
            let playersWithBeginNameArray = [];
            for (let i = 0; i < playersArray.length; i++) {
              if (playersArray[i].startsWith(begName))
                playersWithBeginNameArray.push(playersArray[i]);
            }

            res.status(200).json({
              hostId: hostId,
              roomId: roomId,
              playersWithBeginNameArray: playersWithBeginNameArray,
            });
          })
          .catch((err) => {
            throw err;
          });
      } catch (err) {
        res.status(400).json({ error: err.message, message: "Internal error" });
      }
    });
  } catch (err) {
    next(err);
  }
}

function findRoomsWithHostId(req, res) {
  try {
    let hostId = req.params.hostId;
    // let { token } = req.body;
    let { token } = req.query;
    // console.log("req.query: ", req.query);
    // console.log("hostID: ", hostId);
    // console.log("token: ", token);

    //Verify User
    jwt.verify(token, JWT_SECRET, (err, decodedUserId) => {
      //If not valid
      if (err || decodedUserId != hostId) {
        return res.status(401).json({ error: "Invalid Token" });
      }
      db.findRoomsOfAHost(hostId)
        .then((hostRooms) => {
          return res.status(201).json({
            hostId: hostId,
            hostRooms: hostRooms,
          });
        })
        .catch((err) => {
          console.log("err: ", err.message);
          res
            .status(400)
            .json({ error: err.message, message: "Internal error" });
        });
    });
  } catch (err) {
    next(err);
  }
}

function findRoomsWithPlayerId(req, res) {
  try {
    let playerId = req.params.playerId;
    let { token } = req.body;

    //Verify User
    jwt.verify(token, JWT_SECRET, (err, decodedUserId) => {
      //If not valid
      if (err || decodedUserId != playerId) {
        return res.status(401).json({ error: "Invalid Token" });
      }
      db.findRoomOfAPlayer(playerId)
        .then(async (roomsArray) => {
          console.log("roomsArray , ", roomsArray);
          let roomsIdArray = [];
          for (let i = 0; i < roomsArray.length; i++) {
            roomsIdArray.push(roomsArray[i].ticketRoomId);
          }

          console.log("Player rooms IdArray : ", roomsIdArray);

          //Find room details of each room in roomsIdArray
          let playerRooms = await findRoomDetailsFunction(roomsIdArray);

          //Sort based on time of creation
          playerRooms.sort((a, b) => a.createdTime - b.createdTime);
          res.status(201).json({
            playerId: playerId,
            playerRooms: playerRooms,
          });
        })
        .catch((err) => {
          console.log("err: ", err.message);
          res
            .status(400)
            .json({ error: err.message, message: "Internal error" });
        });
    });
  } catch (err) {
    next(err);
  }
}

async function findRoomsWithUserId(req, res) {
  try {
    let userId = req.params.userId;
    // let { type } = req.body;

    let playerRooms = [];
    let hostRooms = [];
    let commonRooms = [];

    try {
      hostRooms = await db.findRoomsOfAHost(userId);
      console.log("hosts:: ", hostRooms);
    } catch (err) {
      console.log("err: ", err.message);
      return res
        .status(400)
        .json({ error: err.message, message: "Internal error" });
    }

    try {
      let roomsArray = await db.findRoomOfAPlayer(userId);
      console.log("roomsArray:: ", roomsArray);
      if (roomsArray.length !== 0) {
        let roomsIdArray = [];
        for (let i = 0; i < roomsArray.length; i++) {
          roomsIdArray.push(roomsArray[i].ticketRoomId);
        }

        //Find room details of each room in roomsIdArray
        playerRooms = await findRoomDetailsFunction(roomsIdArray);
        console.log("playerROoms: ", playerRooms);
      }

      commonRooms = [...hostRooms, ...playerRooms];
      console.log("commonRooms: ", commonRooms);

      res.status(201).json({
        userId: userId,
        commonRooms: commonRooms,
      });
    } catch (err) {
      console.log("err: ", err.message);
      return res
        .status(400)
        .json({ error: err.message, message: "Internal error" });
    }
  } catch (err) {
    next(err);
  }
}

//Utility function to find all tickets in a room.
async function findAllTicketsInRoom(roomId) {
  try {
    let data = await db.getTicketsOfARoom(roomId);
    return data.Items;
  } catch (err) {
    // console.log("error:", err.message);
    throw err;
  }
}

async function findRoomDetailsFunction(roomsIdArray) {
  try {
    //Find room details of each room in roomsIdArray
    let playerRooms = [];
    for (let i = 0; i < roomsIdArray.length; i++) {
      await db
        .getRoomDetails(roomsIdArray[i])
        .then((roomObj) => {
          playerRooms.push(roomObj);
        })
        .catch((err) => {
          console.log("err: ", error.message);
        });
    }
    // console.log("playerRooms4r: ", playerRooms);
    return playerRooms;
  } catch (err) {
    next(err);
  }
}

//Utility function to find all the players in room
// function findAllPlayersInARoomFunction(roomId) {
//   db.findAllPlayersInRoom(roomId)
//     .then((playersArray) => {
//       console.log("arr in fun ", playersArray);
//       // return new Promise((resolve) => resolve(playersArray));
//       // resolve(playersArray);
//       return playersArray;
//     })
//     .catch((err) => {
//       // reject(err);
//       // return new Promise((reject) => reject(err));
//       throw err;
//     });
// }

// findAllPlayersInARoomFunction("42470912-1d57-47c8-b891-b00a0e02287a");

module.exports = router;
