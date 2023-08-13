const PubNub = require("pubnub");

const pubnub = new PubNub({
	publishKey: "pub-c-48fb12a1-3d27-4dd4-a77c-bfc386c79e2a",
	subscribeKey: "sub-c-2add770f-19e7-46dc-a7f5-2774470a9a06",
	uuid: "myUniqueUUID"
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