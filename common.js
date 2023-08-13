require('dotenv').config();
const PubNub = require("pubnub");
const pubnub = new PubNub({
	publishKey: process.env.PUBLISH_KEY,
	subscribeKey: process.env.SUBSCRIBE_KEY,
	uuid: process.env.UUID
});

async function publishMsg(channel, msg) {
	try {
		const result = await pubnub.publish({
			message: msg,
			channel: channel
		});
		console.log(`Message: ${msg} published successfully to channel ${channel} w/ server response: ${result}`);
	} catch (status) {
		console.log(`Message: ${msg} publishing FAILED to channel ${channel} w/ server status: ${status}`);
	}
}

module.exports = { publishMsg }