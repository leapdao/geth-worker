const Consumer = require('sqs-consumer');
const AWS = require('aws-sdk');
const Web3 = require('web3');
const Pusher = require('pusher');

const conf = require('./app.config');

const web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider(conf.providerUrl));

const pusher = new Pusher({
  appId: conf.pusherAppId,
  key: conf.pusherKey,
  secret: conf.pusherSecret,
  cluster: 'eu',
  encrypted: true,
});

AWS.config.update({
  region: conf.awsRegion,
  accessKeyId: conf.awsAccessKeyId,
  secretAccessKey: conf.awsSecretAccessKey,
});

const handleMessage = (message, done) => {
  console.log('tx', message.Body);
  const txObj = JSON.parse(message.Body);
  txObj.value = 0;
  const signerAddr = txObj.signerAddr;
  if (signerAddr) {
    delete txObj.signerAddr;
  }
  web3.eth.sendTransaction(txObj, (error, txHash) => {
    if (error) {
      console.log('txError', error);
      return;
    }
    if (signerAddr) {
      const rsp = pusher.trigger(signerAddr, 'update', {
        type: 'txHash',
        payload: txHash,
      });
      console.log('pusher', rsp);
    }
    console.log('txHash', txHash);
    done();
  });
};

const app = Consumer.create({
  queueUrl: conf.queueUrl,
  handleMessage,
});

app.on('error', (err) => {
  console.log(err.message);
});

app.start();
