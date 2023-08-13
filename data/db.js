/**
 * Command to run dynamo db server on local
 * java -D"java.library.path"=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb
 */

const AWS = require("aws-sdk");
const globals = require("../globals");

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.REALM_DYNAMODB_DATA_REGION || "us-east-1",
  endpoint: "http://localhost:8000/",
});

//Query operation return true if present
const checkUser = async (userId) => {
  var isPresent = false;
  console.log("In function checkUser", userId);
  const params = {
    TableName: globals.table.user,
    KeyConditionExpression: "userId = :uid",
    ExpressionAttributeValues: {
      ":uid": userId,
    },
  };

  await ddb.query(params, function (err, data) {
    if (err) {
      console.log("Error", err);
    } else {
      console.log("data.Items: ", data.Items);
      if (data.Items.length !== 0) isPresent = true;
      console.log("isPresent db : ", isPresent);
    }
  });
  console.log("isPresent after db : ", isPresent);
  return isPresent;
};

const findUser = (userId) => {
  //Query operation return user Object if present
  const params = {
    TableName: globals.table.user,
    KeyConditionExpression: "userId = :uid",
    ExpressionAttributeValues: {
      ":uid": userId,
    },
  };

  return new Promise((resolve, reject) => {
    ddb.query(params, function (err, data) {
      if (err) {
        // console.log("Error: ", err.message);
        reject(err);
      } else {
        resolve(data.Items[0]);
      }
    });
  });
};

//put item in UserTable
const createUser = async (userIdInp, nameInp, passwordInp) => {
  console.log("In function createUser");

  const params = {
    TableName: globals.table.user,
    Item: {
      userId: userIdInp,
      name: nameInp,
      password: passwordInp,
    },
    ConditionExpression: "attribute_not_exists(userId)",
  };
  return new Promise((resolve, reject) => {
    ddb.put(params, function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

const createRoom = async (roomIdInp, hostIdInp, createdTimeInp) => {
  console.log("In function createRoom");

  const params = {
    TableName: globals.table.room,
    Item: {
      roomId: roomIdInp,
      hostId: hostIdInp,
      createdTime: createdTimeInp,
    },
  };
  return new Promise((resolve, reject) => {
    ddb.put(params, function (err, data) {
      if (err) {
        console.log("Error in fun", err.message);
        reject(err);
      } else {
        console.log(roomIdInp, hostIdInp, createdTimeInp);
        resolve();
      }
    });
  });
};

const getRoom = async (roomIdInp) => {
  console.log("In function getRoom");

  const params = {
    TableName: globals.table.room,
    KeyConditionExpression: "roomId = :rid",
    ExpressionAttributeValues: {
      ":rid": roomIdInp,
    },
  };
  return new Promise((resolve, reject) => {
    ddb.query(params, function (err, data) {
      if (err) {
        console.log("Error in fun", err.message);
        reject(err);
      } else {
        if(data.Items[0]) {
          resolve(data.Items[0]);
        }
        else {
          reject(new Error("Room not found"));
        }
      }
    });
  });
};

const addOrUpdateOrResetBoard = async (boardInp, hostIdInp, roomIdInp) => {
  var params = {
    TableName: globals.table.room,
    Key: {
      roomId: roomIdInp,
      hostId: hostIdInp,
    },
    UpdateExpression: "set #a = :b",
    ExpressionAttributeNames: { "#a": "board" },
    ExpressionAttributeValues: {
      ":b": boardInp,
    },
  };

  return new Promise((resolve, reject) => {
    ddb.update(params, function (err, data) {
      if (err) {
        console.log("Error in fun", err.message);
        reject(err);
      } else {
        console.log(data);
        resolve();
      }
    });
  });
};

const addBoardInRoom = async (boardInp, hostIdInp, roomIdInp) => {
  var params = {
    TableName: globals.table.room,
    Key: {
      roomId: roomIdInp,
      hostId: hostIdInp,
    },
    UpdateExpression: "set #a = :b",
    ExpressionAttributeNames: { "#a": "board" },
    ExpressionAttributeValues: {
      ":b": boardInp,
    },
    ConditionExpression: "attribute_not_exists(board)",
  };

  return new Promise((resolve, reject) => {
    ddb.update(params, function (err, data) {
      if (err) {
        console.log("Error in fun", err.message);
        reject(err);
      } else {
        console.log(data);
        resolve();
      }
    });
  });
};

const resetBoardInRoom = async (boardInp, hostIdInp, roomIdInp) => {
  var params = {
    TableName: globals.table.room,
    Key: {
      roomId: roomIdInp,
      hostId: hostIdInp,
    },
    UpdateExpression: "set #a = :b",
    ExpressionAttributeNames: { "#a": "board" },
    ExpressionAttributeValues: {
      ":b": boardInp,
    },
  };

  return new Promise((resolve, reject) => {
    ddb.update(params, function (err, data) {
      if (err) {
        console.log("Error in fun", err.message);
        reject(err);
      } else {
        console.log(data);
        resolve();
      }
    });
  });
};

const getBoard = async (roomIdInp, hostIdInp) => {
  var params = {
    ExpressionAttributeValues: {
      ":r": roomIdInp,
      ":h": hostIdInp,
    },
    KeyConditionExpression: "roomId = :r and hostId = :h",
    ProjectionExpression: "board",
    TableName: globals.table.room,
  };

  return new Promise((resolve, reject) => {
    ddb.query(params, function (err, data) {
      if (err) {
        console.log("Error in fun", err.message);
        reject(err);
      } else {
        console.log("Success");
        // console.log(data.Items);
        resolve(data.Items[0].board);
      }
    });
  });
};

const updateBoard = async (boardInp, roomIdInp, hostIdInp) => {
  console.log("In update board");
  var params = {
    TableName: globals.table.room,
    Key: {
      roomId: roomIdInp,
      hostId: hostIdInp,
    },
    UpdateExpression: "set #a = :b",
    ExpressionAttributeNames: { "#a": "board" },
    ExpressionAttributeValues: {
      ":b": boardInp,
    },
  };

  return new Promise((resolve, reject) => {
    ddb.update(params, function (err, data) {
      if (err) {
        console.log("Error in fun", err.message);
        reject(err);
      } else {
        console.log("Success");
        // console.log(data.Items);
        resolve();
      }
    });
  });
};

const addPlayerInRoom = async (hostIdInp, playerIdInp, roomIdInp) => {
  var params = {
    TableName: globals.table.room,
    Key: {
      roomId: roomIdInp,
      hostId: hostIdInp,
    },
    // UpdateExpression: "SET #p = list_append(#p, :i)",
    // // UpdateExpression: "ADD #p : list_append(#p, :i)",
    // ExpressionAttributeNames: { "#p": "playerIdSet" },
    // ExpressionAttributeValues: {
    //   ":i": ddb.createSet([playerIdInp]),
    // },
    UpdateExpression: "ADD playerIdSet :p",
    ExpressionAttributeValues: {
      ":p": ddb.createSet([playerIdInp]),
    },
  };

  return new Promise((resolve, reject) => {
    ddb.update(params, function (err, data) {
      if (err) {
        console.log("Error in fun", err.message);
        reject(err);
      } else {
        console.log("added player", data);
        resolve();
      }
    });
  });
};

const deleteRoom = async (hostIdInp, roomIdInp) => {
  const params = {
    TableName: globals.table.room,
    Key: {
      roomId: roomIdInp,
      hostId: hostIdInp,
    },
  };

  return new Promise((resolve, reject) => {
    ddb.delete(params, function (err, data) {
      if (err) {
        console.log("Error in fun", err.message);
        reject(err);
      } else {
        console.log("Deleted ", data);
        resolve();
      }
    });
  });
};

const createTicket = async (
  ticketIdInp,
  playerIdInp,
  ticketObjInp,
  roomIdInp
) => {
  console.log("In function createTicket");

  const params = {
    TableName: globals.table.ticket,
    Item: {
      ticketId: ticketIdInp,
      playerId: playerIdInp,
      ticketRoomId: roomIdInp,
      ticketObj: ticketObjInp,
    },
  };
  console.log("params, ", JSON.stringify(params, 0,2));
  return new Promise((resolve, reject) => {
    ddb.put(params, function (err, data) {
      if (err) {
        console.log("Error in fun", err.message);
        reject(err);
      } else {
        console.log(ticketIdInp, playerIdInp, ticketObjInp);
        resolve();
      }
    });
  });
};

const getTicketsOfARoom = (roomIdInp) => {
  var params = {
    TableName: globals.table.ticket,
    ExpressionAttributeValues: { ":id": roomIdInp },
    KeyConditionExpression: "ticketRoomId = :id",
    IndexName: globals.indexes.ticket.ticketRoomInd
  };
  return new Promise((resolve, reject) => {
    ddb.query(params, function (err, data) {
      if (err) {
        console.log("Error in fun", err.message);
        reject(err);
      } else {
        // console.log("Data ", data);
        resolve(data);
      }
    });
  });
};

// getTicketsOfARoomByQuery("e1df0db3-e40e-4b51-8f28-839a0d55a772");

const getTicketsOfAPlayer = (playerIdInp) => {
  let params = {
    TableName: globals.table.ticket,
    KeyConditionExpression: "playerId = :id",
    ExpressionAttributeValues: { ":id": playerIdInp },
    IndexName: globals.indexes.ticket.playerIdInd,
  };
  return new Promise((resolve, reject) => {
    ddb.query(params, function (err, data) {
      if (err) {
        console.log("Error in fun", err.message);
        reject(err);
      } else {
        // console.log("Data ", data);
        resolve(data.Items);
      }
    });
  });
};

const findAllPlayersInRoom = (roomIdInp) => {
  let params = {
    TableName: globals.table.room,
    KeyConditionExpression: "roomId = :id",
    ExpressionAttributeValues: { ":id": roomIdInp },
    ProjectionExpression: "playerIdSet",
  };
  return new Promise((resolve, reject) => {
    ddb.query(params, function (err, data) {
      if (err) {
        console.log("Error in fun", err.message);
        reject(err);
      } else {
        // console.log("Data ", data.Items[0].playerIdSet.values);
        resolve(data.Items[0].playerIdSet.values);
      }
    });
  });
};

const findRoomsOfAHost = (hostIdInp) => {
  let params = {
    TableName: globals.table.room,
    KeyConditionExpression: "hostId = :id",
    ExpressionAttributeValues: { ":id": hostIdInp },
    IndexName: globals.indexes.room.hostIdInd
  };
  return new Promise((resolve, reject) => {
    ddb.query(params, function (err, data) {
      if (err) {
        console.log("Error in fun", err.message);
        reject(err);
      } else {
        // console.log("Data ", data);
        resolve(data.Items);
      }
    });
  });
};

const getRoomDetails = (roomIdInp) => {
  let params = {
    TableName: globals.table.room,
    KeyConditionExpression: "roomId = :id",
    ExpressionAttributeValues: { ":id": roomIdInp },
    // IndexName: "createdTimeIndex",
    // ScanIndexForward: true
  };
  return new Promise((resolve, reject) => {
    ddb.query(params, function (err, data) {
      if (err) {
        console.log("Error in fun", err.message);
        reject(err);
      } else {
        // console.log("Data ", data);
        resolve(data.Items[0]);
      }
    });
  });
};

function findRoomOfAPlayer(playerIdInp) {
  let params = {
    TableName: globals.table.ticket,
    KeyConditionExpression: "playerId = :id",
    ExpressionAttributeValues: { ":id": playerIdInp },
    IndexName: globals.indexes.ticket.playerIdInd,
  };
  return new Promise((resolve, reject) => {
    ddb.query(params, function (err, data) {
      if (err) {
        console.log("Error in fun", err.message);
        reject(err);
      } else {
        // console.log("Data ", data);
        resolve(data.Items);
      }
    });
  });
}

function updateUsers(userObj1, userObj2, userObj3) {
  console.log("To update users", userObj1, userObj2, userObj3);
    var params = {
    RequestItems: {
      usersTable: [
        {
          PutRequest: {
            Item: {
              userId: userObj1.userId,
              name: userObj1.name,
              password: userObj1.password,
            },
            ConditionExpression: "attribute_not_exists(userId)",
          },
          PutRequest: {
            Item: {
              userId: userObj2.userId,
              name: userObj2.name,
              password: userObj2.password,
            },
            ConditionExpression: "attribute_not_exists(userId)",
          },
          PutRequest: {
            Item: {
              userId: userObj3.userId,
              name: userObj3.name,
              password: userObj3.password,
            },
            ConditionExpression: "attribute_not_exists(userId)",
          },
        },
      ],
    },
  };

  ddb.batchWrite(params, function (err, data) {
    if (err) {
      console.log("Error", err); 
    } else {
      console.log("Success", data);
    }
  });
}
// updateUsers('test.9','test.10');

function deleteUsers(userId1, userId2, userId3) {
  
  console.log("To delete users", userId1, userId2, userId3);
 
  var params = {
    RequestItems: {
      usersTable: [
        {
          DeleteRequest: {
            Key: {
              userId: userId1,
            },
            ConditionExpression: "attribute_not_exists(userId)",
          },
          DeleteRequest: {
            Key: {
              userId: userId2,
            },
            ConditionExpression: "attribute_not_exists(userId)",
          },
          DeleteRequest: {
            Key: {
              userId: userId3
            },
            ConditionExpression: "attribute_not_exists(userId)",
          },
        },
      ],
    },
  };

  ddb.batchWrite(params, function (err, data) {
    if (err) {
      console.log("Error", err);
    } else {
      console.log("Success", data);
    }
  });
}

// function deleteUsers(userId1, userId2) {
//     var params = {
//     RequestItems: {
//       usersTable: [
//         {
//           DeleteRequest: {
//             Key: {
//               userId: userId1
//             },
//             ConditionExpression: "attribute_not_exists(userId)",
//           },
//           DeleteRequest: {
//             Key: {
//               userId: userId2
//             },
//             ConditionExpression: "attribute_not_exists(userId)",
//           },
//         },
//       ],
//     },
//   };

//   ddb.batchWrite(params, function (err, data) {
//     if (err) {
//       console.log("Error", err);
//     } else {
//       console.log("Success", data);
//     }
//   });
// }
// deleteUsers('test.9','test.10');

function getUsers(userId1, userId2, userId3) {
  var params = {
    RequestItems: {
      usersTable: {
        Keys: [
          {
            userId: userId1,
          },
          {
            userId: userId2,
          },
          {
            userId: userId3,
          },
        ],
      }
    },
  };

  ddb.batchGet(params, function (err, data) {
    if (err) {
      console.log("Error", err);
    } else {
      console.log(JSON.stringify(data, 0, 4));
    }
  });
}
// getUsers('test.1','test.2','test.3');



module.exports = {
  createUser,
  checkUser,
  findUser,
  createRoom,
  getRoom,
  addBoardInRoom,
  addPlayerInRoom,
  deleteRoom,
  createTicket,
  getBoard,
  getTicketsOfARoom,
  updateBoard,
  resetBoardInRoom,
  getTicketsOfAPlayer,
  findAllPlayersInRoom,
  findRoomsOfAHost,
  findRoomOfAPlayer,
  addOrUpdateOrResetBoard,
  getRoomDetails,
  updateUsers,
  deleteUsers
};
