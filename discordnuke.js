const authToken = 'TOKEN_HERE';
const author_id = "ID_HERE";

async function apiCall(url, method) {
	const headers = { 'Authorization': authToken, 'Content-Type': 'application/json' };

	function delay(duration) {
		return new Promise((resolve, reject) => {
			setTimeout(() => resolve(), duration);
		});
	}

	const response = await fetch(url, {headers, method: method});
	
	if(method == "GET" || method == "POST") {
		const json = await response.json();

		return json;
	}
}

async function apiGET(url) {
	return apiCall(url, 'GET');
}

async function apiDELETE(url) {
	return apiCall(url, 'DELETE');
}

async function getServers() {
	return await apiGET("https://discordapp.com/api/v6/users/@me/guilds");
}

async function getDmChannels() {
	return await apiGET("https://discordapp.com/api/v6/users/@me/channels");
}

function timestamp() {
	const now = new Date() ;
	return Math.round(now.getTime() / 1000);
}

async function deleteItems(items) {
	let clock = 0;
	let interval = 500;
	function delay(duration) {
		return new Promise((resolve, reject) => {
			setTimeout(() => resolve(), duration);
		});
	}
	
	offset = 0;
	ts = timestamp();
	total = items.length;
	
	await items.forEach(async function(item) {
		
		if(item && item.hit == true) {
			await delay(clock += interval);
			await apiDELETE(`https://discordapp.com/api/v6/channels/${item.channel_id}/messages/${item.id}`);
		}
		if(timestamp() - ts > 10) {
			ts = timestamp();
			console.log("Deleted " + Math.round(offset * 100 / total) + "%");
		}
		
		offset++;
	});
}

async function getDeleteItems(channel_id = null, server_id = null) {
	items = []
	offset = 0
	total = 0
	ts = timestamp();
	
	do {
		if(channel_id != null) {
			json = await apiGET(`https://discordapp.com/api/v6/channels/${channel_id}/messages/search?author_id=${author_id}&offset=${offset}`);
		} else {
			json = await apiGET(`https://discordapp.com/api/v6/guilds/${server_id}/messages/search?author_id=${author_id}&offset=${offset}`);
		}
		
		if(total == 0) {
			total = json.total_results;
			console.log("There are " + json.total_results + " messages to delete.");
		} else if(total > 0 && timestamp() - ts > 10) {
			ts = timestamp();
			console.log("Status: " + Math.round(offset * 100 / total) + "%");
		}
		
		await Array.from(json.messages).map(message => {
			message.forEach(async function(item) {
				if(item && item.hit == true) {
					items.push(item);
				}
			});
		});
	
		offset += 25
	}
	while(offset < total);
	
	return items;
}

async function deleteServerMessages(server_id) {	
	items = await getDeleteItems(null, server_id);	
	await deleteItems(items);

	console.log("Finished deleting messages");
	return false;
}

async function deleteChannelMessages(channel_id) {
	items = await getDeleteItems(channel_id, null);
	await deleteItems(items);
	
	console.log("Finished deleting messages");
	return false;
}

servers = await getServers();

for(i in servers) {
	server = servers[i];
	if(server) {
		console.log("scrubbing server " + servers[i].name);
		await deleteServerMessages(server["id"]);
	}
}

dms = await getDmChannels();

for(i in dms) {
	dm = dms[i];
	if(dm) {
		console.log("scrubbing dm " + dm["recipients"][0]["username"]);
		await deleteChannelMessages(dm["id"]);
	}
}

