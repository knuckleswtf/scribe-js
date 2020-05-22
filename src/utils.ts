function isPortTaken(host) {
    const net = require('net');

    return new Promise((resolve, reject) => {
        const testServer = net.createServer()
            .once('error', function(err) {
                if (err.code === 'EADDRINUSE') return resolve(true);
                return reject(err);
            })
            .once('listening', function() {
                testServer.close();
                return resolve(false);
            })
            .listen(host);
    });
}

export = { isPortTaken };