const AWS = require("aws-sdk");

const ddb = new AWS.DynamoDB({
  apiVersion: "2012-08-10",
  region: process.env.REALM_DYNAMODB_DATA_REGION || "us-east-1",
  endpoint: "http://localhost:8000/",
});

function createRoomsTable() {
  let params = {
    AttributeDefinitions: [
      {
        AttributeName: 'roomId',
        AttributeType: 'S'
      },
      {
        AttributeName: 'hostId',
        AttributeType: 'S'
      }
    ],
    KeySchema: [
      {
        AttributeName: 'roomId',
        KeyType: 'HASH'
      },
      {
        AttributeName: 'hostId',
        KeyType: 'RANGE'
      }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'hostIdIndex',
        KeySchema: [ 
          {
            AttributeName: 'hostId',
            KeyType: 'HASH'
          }
        ],
        Projection: { 
          ProjectionType: 'ALL'
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: '10',
          WriteCapacityUnits: '10'
        }
      }
    ],
    TableName: 'roomsTable',
    ProvisionedThroughput: {
      ReadCapacityUnits: '10',
      WriteCapacityUnits: '10'
    },
    TableClass: 'STANDARD'
  };
  return params;
}

function createUsersTable() {
  let params = {
    AttributeDefinitions: [
      {
        AttributeName: 'userId',
        AttributeType: 'S'
      }
    ],
    KeySchema: [
      {
        AttributeName: 'userId',
        KeyType: 'HASH'
      }
    ],
    TableName: 'usersTable',
    ProvisionedThroughput: {
      ReadCapacityUnits: '10',
      WriteCapacityUnits: '10'
    },
    TableClass: 'STANDARD'
  };
  return params;
}

function createticketsTable() {
  let params = {
    AttributeDefinitions: [
      {
        AttributeName: 'ticketId',
        AttributeType: 'S'
      },
      {
        AttributeName: 'playerId',
        AttributeType: 'S'
      },
      {
        AttributeName: 'ticketRoomId',
        AttributeType: 'S'
      }
    ],
    KeySchema: [
      {
        AttributeName: 'ticketId',
        KeyType: 'HASH'
      }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'ticketRoomIdIndex',
        KeySchema: [ 
          {
            AttributeName: 'ticketRoomId',
            KeyType: 'HASH'
          }
        ],
        Projection: { 
          ProjectionType: 'ALL'
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: '10',
          WriteCapacityUnits: '10'
        }
      },
      {
        IndexName: 'playerIdIndex',
        KeySchema: [ 
          {
            AttributeName: 'playerId',
            KeyType: 'HASH'
          }
        ],
        Projection: { 
          ProjectionType: 'ALL'
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: '10',
          WriteCapacityUnits: '10'
        }
      }
    ],
    TableName: 'ticketsTable',
    ProvisionedThroughput: {
      ReadCapacityUnits: '10',
      WriteCapacityUnits: '10'
    },
    TableClass: 'STANDARD'
  };
  return params;
}


// function deleteTable() {
//   var params = {
//     TableName: ""
//    };
//    ddb.deleteTable(params, function(err, data) {
//      if (err) console.log(err, err.stack); // an error occurred
//      else     console.log(data);  
//    });
// }
// deleteTable();

// let params = createUsersTable();
// let params = createRoomsTable();
let params = createticketsTable();

ddb.createTable(params, function (err, data) {
  if (err) console.log(err, err.stack); // an error occurred
  else console.log(data);           // successful response
});