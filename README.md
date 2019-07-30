# ftp-push
Node.js module, ftp script with tiny dependencies, use system ftp command, support active mode & passive mode

## Installation

```js
npm install --save-dev ftp-push
```

## Usage

```js
var ftp = require("ftp-push");

var config = {
    host: "127.0.0.1",
    port: 21,
    user: "anonymous",
    password: "@anonymous",
    localPath: __dirname,
    remotePath: "/",
    // passive mode
    passive: true
};

// promise style
ftp(config)
    .then(() => console.log("upload success"))
    .catch(err => console.log(err));

// callback style
ftp(config, (err) => {
    if (err) {
        console.log(err);
        return;
    }
    console.log("upload success")
});
```
