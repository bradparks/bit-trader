"use strict";

const micro = require('micro');
const mri = require('mri');
const hostname = require('os').hostname();

const args = mri(process.argv.slice(2));

const {router, post} = require('microrouter');
const {getPort, postRequest} = require('../helper');

const SERVICE_NAME = 'nonceGenerator'; //TODO extract
const SERVICE_MASTER_URL = `http://${args.master || 'localhost:3000'}`; //TODO docu serviceMaster can be configured through --master=XXXX:XXXX argument

let serviceId = null;
let currentNonce = Date.now() * 1000;

const server = micro(
    router(
        post('/',
            async (req, res) => {
                currentNonce = currentNonce + 1;

                micro.send(res, 200, {
                    nonce: currentNonce
                });
            }
        )
    )
);

const main = async () => {
    const port = await getPort();
    const response = await postRequest(`${SERVICE_MASTER_URL}/register`, {
        serviceName: SERVICE_NAME,
        url: `http://${hostname}:${port}`
    });

    serviceId = response.id;

    console.log(`hostname: ${hostname}, port: ${port}`);

    server.listen(port);
};

process.on('exit', async () => {
    await postRequest(`${SERVICE_MASTER_URL}/unregister`, {
        serviceName: SERVICE_NAME,
        id: serviceId
    })
});

main();
