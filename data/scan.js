const AWS = require("aws-sdk");
const globals = require("../globals");

const ddb = new AWS.DynamoDB.DocumentClient({
    apiVersion: "2012-08-10",
    region: process.env.REALM_DYNAMODB_DATA_REGION || "us-east-1",
    endpoint: "http://localhost:8000/",
});

const getAllUsers = () => {
    let params = {
        // TableName: "usersTable",
        TableName: "roomsTable",
        // TableName: "ticketsTable",
    };
    return new Promise((resolve, reject) => {
        ddb.scan(params, function (err, data) {
            if (err) {
                console.log("Error in fun", err.message);
                reject(err);
            } else {
                // console.log("Data found: ", data );
                console.log("Data found: ", JSON.stringify(data,0,2) );
                resolve(data);
            }
        });
    });
};

getAllUsers();
