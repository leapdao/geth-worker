const Consumer = require('sqs-consumer');
const AWS = require('aws-sdk');
const Web3 = require('web3');
const Pusher = require('pusher');

const web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('url'));

const pusher = new Pusher({
  appId: '',
  key: '',
  secret: '',
  cluster: 'eu',
  encrypted: true,
});

AWS.config.update({
  region: 'eu-west-1',
  accessKeyId: '',
  secretAccessKey: '',
});

const app = Consumer.create({
  queueUrl: 'https://sqs.eu-west-1.amazonaws.com/xxx/tx.fifo',
  handleMessage: (message, done) => {
    console.log(message.Body);
    const txObj = {
      ...JSON.parse(message.Body),
      from: '',
      value: 0,
    };
    const signerAddr = txObj.signerAddr;
    if (txObj.signerAddr) {
      delete txObj.signerAddr;
    }
    web3.eth.sendTransaction(txObj, (error, txHash) => {
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
  },
});

app.on('error', (err) => {
  console.log(err.message);
});

app.start();
