const Consumer = require('sqs-consumer');
const AWS = require('aws-sdk');
const Web3 = require('web3');
const Pusher = require('pusher');

var web3 = new Web3();
var web3Provider = new web3.providers.HttpProvider('url');
web3 = new Web3(web3Provider);

var pusher = new Pusher({
  appId: '',
  key: '',
  secret: '',
  cluster: 'eu',
  encrypted: true,
});

AWS.config.update({
  region: 'eu-west-1',
  accessKeyId: '',
  secretAccessKey: ''
});

const app = Consumer.create({
  queueUrl: 'https://sqs.eu-west-1.amazonaws.com/xxx/tx.fifo',
  handleMessage: (message, done) => {
  	console.log(message.Body);
  	var signerAddr;
  	const txObj = JSON.parse(message.Body);
  	txObj.from = '';
  	txObj.value = 0;
  	if (txObj.signerAddr) {
      signerAddr = txObj.signerAddr;
      delete txObj.signerAddr;
  	}
  	web3.eth.sendTransaction(txObj, function(error, txHash) {
  	  if (error) {
  	  	console.log(error);
  	  	return;
  	  }
  	  if (signerAddr) {
	    const rsp = pusher.trigger(signerAddr, 'update', {
          type: 'txHash',
          payload: txHash,
        });
        console.log('pusher', rsp);
  	  }
  	  console.log(txHash);
  	  done();
  	});
  }
});

app.on('error', (err) => {
  console.log(err.message);
});

app.start();