function isPortTaken(port) {
    // This doesn't seem to work rn
    return new Promise((resolve, reject) => {
        const testServer = require('http')
            .createServer()
            .on('error', (err) => {
            if (err.code === 'EADDRINUSE')
                return resolve(true);
            reject(err);
        })
            .listen(port, () => {
            testServer.close();
            resolve(false);
        });
    });
}
module.exports = {
    isPortTaken,
};
//# sourceMappingURL=response_calls.js.map