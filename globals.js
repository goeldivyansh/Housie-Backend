module.exports = globals = {
	table: {
		user: "usersTable",
		ticket: "ticketsTable",
		room: "roomsTable"
	},
	indexes: {
		ticket: {
			playerIdInd: "playerIdIndex",
			ticketRoomInd: "ticketRoomIdIndex"
		},
		room: {
			hostIdInd :"hostIdIndex"
		}

	}
}
