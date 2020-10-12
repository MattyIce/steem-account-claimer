var dsteem = require('@hiveio/dhive');
var config = require('./config');

// Count of Discounted Account Creation Tokens (DACTs) available in the account.
var DACTS = 0;
var client;

start();

function start() {
	var options = { timeout: 3000 };

	if(config.chain_id)
		options.chainId = config.chain_id;
	
	client = new dsteem.Client(config.rpc_node, options);
	log('Connected to ' + config.rpc_node);

	client.database.getAccounts(config.accounts.map(a => a.name)).then(function (result) { 
		for(var i = 0; i < result.length; i++) {
			var account = config.accounts.find(a => a.name == result[i].name);

			log('Account @' + account.name + ' has ' + result[i].pending_claimed_accounts + ' account creation tokens!'); 
			account.DACTS = result[i].pending_claimed_accounts;
			process(account);
		}
	});
}

function process(account) {
	var rc = client.rc.getRCMana(account.name).then(result => {
		log('@' + account.name + ' - RC %: ' + (result.percentage / 100).toFixed(2)); 

		if(result.percentage / 100 > config.min_rc_pct) {
			claim(account, true);
		} else
			setTimeout(() => process(account), 10 * 60 * 1000);
	}, e => {
		console.log(e);
		setTimeout(() => process(account), 100);
	});
}

function claim(account, repeat) {
	var op = ['claim_account', { creator: account.name, fee: '0.000 STEEM', extensions: [] }];

	client.broadcast.sendOperations([op], dsteem.PrivateKey.fromString(account.active_key)).then(r => {
		account.DACTS++;
		log('Account claimed from @' + account.name + '! Total: ' + account.DACTS);
		
		if(repeat)
			setTimeout(() => process(account), 100);
	}, e => {
		console.log("Error");
		console.log(e);
		
		if(repeat)
			setTimeout(() => process(account), 100);
	});
}

function log(msg) { console.log(new Date().toString() + ' - ' + msg); }