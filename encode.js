const cp = require('child_process');
const fs = require('fs');
const request = require('request');

let decodeArgs = [
    'opusenc',
    '--raw',
    '--raw-rate',
    '16000',
    '--raw-bits',
    '16',
    '--raw-chan',
    '1',
    '--raw-endianness',
    '0',
    '-',
    '-'
    ];

var contents = fs.readFileSync('hb.raw');

let args = decodeArgs;

const opusdec = cp.spawn(args[0], args.slice(1), {stdio: ['pipe', 'pipe', 'pipe']});

opusdec.on('error', (error) => {
      console.log('error:', error);
});

opusdec.stdin.write(contents);
opusdec.stdin.end();

// no-op to not fill up the buffer
const opsdec_stderr_buf = [];
opusdec.stderr.on('data', function (data) {
      opsdec_stderr_buf.push(data);
});
// this can be omitted.
opusdec.on('close', function (code) {
    let opus_output = Buffer.concat(opsdec_stderr_buf).toString('utf8');
    //console.log(opus_output);
    if (code !== 0) {
       next(new Error('opusdec exited with code %d', code));
    }
});

// send to the asr server
request({
    url: 'https://speaktome.services.mozilla.com',
    method: 'POST',
    body: opusdec.stdout,
    headers: {'Content-Type': 'application/octet-stream'}
}, function (asrErr, asrRes, asrBody) {
    console.log(asrBody);
});