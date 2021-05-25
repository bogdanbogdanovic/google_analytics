const fs = require("fs");
const path = require('path');
const { google } = require("googleapis");
const opn = require('open');
const url = require('url');
const http = require('http');
const readline = require("readline");
const destroyer = require('server-destroy');

const TOKEN_PATH = path.join(__dirname,"../data/keys/test_token.json");

/**
 *
 * @type {string[]}
 */
const SCOPES = [
    "https://www.googleapis.com/auth/analytics.readonly",
    "https://www.googleapis.com/auth/analytics",
    "https://www.googleapis.com/auth/analytics.edit",
    "https://www.googleapis.com/auth/analytics.manage.users",
    "https://www.googleapis.com/auth/analytics.manage.users.readonly",
    "https://www.googleapis.com/auth/analytics.provision",
    "https://www.googleapis.com/auth/dfp",
];

//ROUTE IMPORTS
const authenticateGoogle = (credentialPath, method) => new Promise( (resolve) => {
    fs.readFile(path.join(__dirname, `../${credentialPath}`), async (err, content) => {
        if (err) return console.log("Error loading client secret file:", err);
        // Authorize a client with credentials, then call the Google Sheets API.
        const auth = await authorize(JSON.parse(content.toString()), method);
        resolve(auth);
    });
});

const getCredentialInfo = (credentialPath) => new Promise( (resolve) => {
    fs.readFile(path.join(__dirname, `../${credentialPath}`), async (err, content) => {
        if (err) return console.log("Error loading client secret file:", err);
        resolve(JSON.parse(content.toString()));
    });
});


const authorize = (credentials, method) => new Promise(async (resolve) => {
    const { client_secret, client_id, redirect_uris } = credentials[method];

    const oAuth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirect_uris[0]
    );

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, async (err, token) => {
        if (err) {
            const newToken = await getNewToken(oAuth2Client);
            resolve(newToken);
        }
        oAuth2Client.setCredentials(JSON.parse(token));
        resolve(oAuth2Client);
    });
});

const getNewToken = (oAuth2Client) => new Promise((resolve, reject) => {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES,
    });

    const server = http
        .createServer(async (req, res) => {
            try {
                if(req.url.indexOf('/oauth2callback') > -1) {
                    const qs = new url.URL(req.url, 'http://localhost:3000')
                        .searchParams;

                    res.end('Authentication successful! Please return to the console.');
                    // server.destroy();

                    const {tokens} = await oAuth2Client.getToken(qs.get('code'));
                    oAuth2Client.setCredentials(tokens);
                    fs.writeFile(TOKEN_PATH, JSON.stringify(tokens), (err) => {
                        if (err) reject(console.error(err));
                    });

                    resolve(oAuth2Client);
                }
            } catch (e) {
                reject(e);
            }
        })
        .listen(3000, () => {
            // open the browser to the authorize url to start the workflow
            opn(authUrl, {wait: false}).then(cp => cp.unref());
        });
    destroyer(server);
});

module.exports = {
    authenticateGoogle,
    getCredentialInfo,
};
