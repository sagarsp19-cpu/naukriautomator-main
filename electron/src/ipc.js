'use strict';

/**
 * Extract port from either:
 * 1. NAUKRI_BE_PORT=55662
 * 2. Tomcat started on port 55662
 * 3. Tomcat started on port(s): 55662
 */

function parsePortLine(text) {

    if (!text)
        return null;

    let match = text.match(/NAUKRI_BE_PORT=(\d+)/);

    if (match)
        return parseInt(match[1], 10);

    match = text.match(/Tomcat started on port(?:\(s\))?:?\s*(\d+)/i);

    if (match)
        return parseInt(match[1], 10);

    return null;
}

function waitForPort(child, timeoutMs) {

    return new Promise((resolve, reject) => {

        let buffer = "";

        const timer = setTimeout(() => {

            cleanup();

            reject(new Error("Timeout waiting for backend port"));

        }, timeoutMs);

        function onData(chunk) {

            const text = chunk.toString();

            process.stdout.write(text);

            buffer += text;

            const port = parsePortLine(buffer);

            if (port) {

                console.log("Detected Backend Port:", port);

                cleanup();

                resolve(port);

            }

        }

        function onExit() {

            cleanup();

            reject(new Error("Backend exited before reporting port"));

        }

        function cleanup() {

            clearTimeout(timer);

            if (child.stdout)
                child.stdout.off("data", onData);

            child.off("exit", onExit);

        }

        if (child.stdout)
            child.stdout.on("data", onData);

        child.on("exit", onExit);

    });

}

module.exports = {
    parsePortLine,
    waitForPort
};