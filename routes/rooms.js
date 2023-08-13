require('dotenv').config();
const express = require("express");
const router = express.Router();
const db = require("../data/db.js");
const jwt = require("jsonwebtoken");
const ticket = require("./generateTicket.js");
const { v4: uuidv4 } = require("uuid");
const common = require("../common.js");
const JWT_SECRET = process.env.JWT_SECRET;

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
  console.log("Entering createRoom");
  try {
    const { userId, token } = req.body;

    // Generate a roomId
    const createdTime = Date.now();
    const roomId = uuidv4();

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
          console.log("createRoom | Err: ", err);
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
  console.log("Entering getRoom");
  try {
    let roomId = req.params.roomId;
    const { userId, token } = req.query;

    //check valid token or not
    jwt.verify(token, JWT_SECRET, (err, decodedUserId) => {
      //If not valid
      if (err || decodedUserId != userId) {
        return res.status(401).json({ error: "Invalid Token" });
      }

      //else valid insert record in table
      db.getRoom(roomId)
        .then((response) => {
          res
          .status(200)
          .json({ 
            hostId: response.hostId, 
            roomId: response.roomId,
            players: response.playerIdSet?.values
          });
        })
        .catch((err) => {
          console.log("getRoom | Err: ", err);
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
    console.log("Entering addBoard");
    let roomId = req.params.roomId;
    let { hostId, token } = req.body;

    //Verify User
    jwt.verify(token, JWT_SECRET, (err, decodedUserId) => {
      //If not valid
      if (err || decodedUserId != hostId) {
        console.log("addBoard | err:", err);
        return res.status(401).json({ error: "Invalid Token" });
      }

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
          console.log("Board inserted successfully");
          res.status(201).json({
            roomId: roomId,
            board: board,
            msg: "Board inserted successfully.",
          });
        })
        .catch((err) => {
          console.log("addBoard | err:", err);
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
  console.log("Entering updateOrResetBoard");
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


      // Insert board in roomsTable
      db.addOrUpdateOrResetBoard(board, hostId, roomId)
        .then(async () => {
          console.log("Board reset successful.");
          res.status(201).json({
            roomId: roomId,
            board: board,
            msg: "Board Reset successfully.",
          });
        })
        .catch((err) => {
          console.log("updateOrResetBoard | err: ", err);
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
  console.log("Entering generateNumber");
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
        
        board = await db.getBoard(roomId);
        let boardObj = JSON.parse(board);

        //if all numbers picked, return
        if (boardObj.unPickedNumbers.length === 0) {
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

        // convert updated boardObj to board string.
        let boardStr = JSON.stringify(boardObj);

        res.status(200).json({
          currentNumber: currentNumber,
          msg: "Number generated.",
        });
      } catch (err) {
        console.log("generateNumber | Error : ", err);
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
  console.log("Entering addPlayerInRoom");
  try {
    let roomId = req.params.roomId;
    let { hostId, playerId, token } = req.body;

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
          console.log("addPlayerInRoom | Err: ", err);
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
  console.log("Entering deleteRoom");
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
          console.log("deleteRoom | err: ", err);
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
  console.log("Entering createTicket");
  try {
    let roomId = req.params.roomId;
    let { playerId, token } = req.body;

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
  console.log("Entrinng findAllPlayersInRoom");
  try {
    let roomId = req.params.roomId;
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
  console.log("Entering findPlayersWithBegName");
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
  console.log("Entering findRoomsWithHostId");
  try {
    let hostId = req.params.hostId;
    let { token } = req.query;

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
          console.log("findRoomsWithHostId | err: ", err);
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
  console.log("Entering findRoomsWithPlayerId");
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
          let roomsIdArray = [];
          for (let i = 0; i < roomsArray.length; i++) {
            roomsIdArray.push(roomsArray[i].ticketRoomId);
          }

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
          console.log("findRoomsWithPlayerId | err: ", err);
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
  console.log("Entering findRoomsWithUserId");
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
      console.log("findRoomsWithUserId | err: ", err);
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
      console.log("err: ", err);
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
  console.log("Entering findAllTicketsInRoom");
  try {
    let data = await db.getTicketsOfARoom(roomId);
    return data.Items;
  } catch (err) {
    throw err;
  }
}

async function findRoomDetailsFunction(roomsIdArray) {
  console.log("Entering findRoomDetailsFunction");
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
          console.log("findRoomDetailsFunction | err: ", err);
        });
    }
    return playerRooms;
  } catch (err) {
    next(err);
  }
}


module.exports = router;
