var dsteem = require('dsteem');
var config = require('./config');

// Count of Discounted Account Creation Tokens (DACTs) available in the account.
var DACTS = 0;
var client;

start();

function start() {
	var options = {};

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
	client.call('rc_api', 'find_rc_accounts', { accounts: [config.account] }).then(function (result) { 
		var max = result.rc_accounts[0].max_rc;
		var current = result.rc_accounts[0].rc_manabar.current_mana;
		log('Current Mana: ' + current + ', Max RC: ' + max + ', RC %: ' + (current / max * 100).toFixed(2)); 

		if(current / max > config.min_rc_pct / 100)
			claim();
		else
			setTimeout(process, 10 * 60 * 1000);
	}, e => console.log(e));
}

function claim() {
	var op = ['claim_account', { creator: config.account, fee: '0.000 TESTS', extensions: [] }];

	client.broadcast.sendOperations([op], dsteem.PrivateKey.fromString(config.active_key)).then(r => {
		DACTS++;
		log('Account claimed! Total: ' + DACTS);
		setTimeout(process, 1000);
	}, e => console.log(e));
}

function log(msg) { console.log(new Date().toString() + ' - ' + msg); }