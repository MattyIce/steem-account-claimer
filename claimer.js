var dsteem = require('dsteem-hf20');
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

	client.database.getAccounts([config.account]).then(function (result) { 
		log('Account has ' + result[0].pending_claimed_accounts + ' account creation tokens!'); 
		DACTS = result[0].pending_claimed_accounts;
		process();
	});
}

function process() {
	var rc = client.rc.getRCMana(config.account).then(result => {
		log('Current Mana: ' + result.current_mana + ', Max RC: ' + result.max_mana + ', RC %: ' + result.percentage); 

		if(result.percentage / 100 > config.min_rc_pct / 100) {
			claim(true);
		} else
			setTimeout(process, 10 * 60 * 1000);
	}, e => {
		console.log(e);
		setTimeout(process, 100);
	});
}

function claim(repeat) {
	var op = ['claim_account', { creator: config.account, fee: '0.000 STEEM', extensions: [] }];

	client.broadcast.sendOperations([op], dsteem.PrivateKey.fromString(config.active_key)).then(r => {
		DACTS++;
		log('Account claimed! Total: ' + DACTS);
		
		if(repeat)
			setTimeout(process, 100);
	}, e => {
		console.log("Error");
		
		if(repeat)
			setTimeout(process, 100);
	});
}

function log(msg) { console.log(new Date().toString() + ' - ' + msg); }