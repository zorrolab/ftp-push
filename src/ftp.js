/**
 * 调用系统ftp命令执行上传文件操作，如系统未自带ftp命令，需自行安装
 * Mac 安装 ftp：
 *    brew install telnet
 *    brew install inetutils
 *    brew link --overwrite inetutils
 */
const path = require('path');
const filewalker = require('filewalker');

const ftpPush = (opts, callback) => {
    let cmds = [],
        localPath = opts ? opts.localPath : path.resolve(__dirname),
        remotePath = opts ? opts.remotePath || '/' : '/';

    if(!(opts && opts.host)) {
        callback && callback('Error: Not found connection parameters');
        return;
    }

    const execCommand = () => {
        let p = require('child_process').spawn(opts.ftpCommand || 'ftp', ['-nv']);
        p.on('exit', (code, signal) => {
            if (code) {
                console.error('Upload failed' + signal, code);
                callback && callback('Error: Upload failed');
            } else {
                console.log('Upload success');
                callback && callback();
            }
        });
        p.stdin.setEncoding(opts.stdinEncoding || 'utf-8');
        p.stdout.setEncoding(opts.stdoutEncoding || 'utf-8');
        p.stdout.on('data', (data) => {
            let line, output;
            output = data.split('\n');
            for (let i = 0, len = output.length; i < len; i++) {
                line = output[i];
                if (line === '') {
                    continue;
                } else if ((line === '550 Create directory operation failed.'
                            || line === 'Using binary mode to transfer files.'
                            || line === 'Interactive mode off.'
                            || line === 'Passive mode on.')
                            || /^Remote system type is/.test(line)
                            || /^\d+ bytes sent in [\d\.]+ secs/.test(line)
                            || /^(200|227|230|331) /.test(line)
                            || /^1\d{2} /.test(line)) {
                    console.log(line);
                } else if (/^5\d{2} /.test(line) || /^Not connected/.test(line)) {
                    console.error(line);
                } else if (/^2\d{2} /.test(line)) {
                    console.log(line);
                } else {
                    console.log(line);
                }
            }
        });
        p.stdin.write(cmds);
    }

    cmds.push(`open ${opts.host} ${opts.port || '21'}`);
    cmds.push(`user ${opts.user || 'anonymous'} ${opts.pass || opts.password || '@anonymous'}`);
    cmds.push('type binary');
    // 关闭交互式提示
    cmds.push('prompt');
    if (opts.passive) {
        cmds.push('passive');
    }

    cmds.push(`mkdir ${remotePath}`);

    filewalker(localPath)
        .on('dir', (p) => {
            cmds.push(`mkdir "${remotePath}/${p}"`);
        })
        .on('file', (p, s) => {
            cmds.push(`put "${localPath}/${p}" "${remotePath}/${p}"`);
        })
        .on('error', (err) => {
            console.error(err);
        })
        .on('done', () => {
            cmds = cmds.concat('quit', '').join('\n');
            execCommand();
        })
        .walk();
}

/**
 * @param {Object} opts
 * @param {String} opts.host
 * @param {String} opts.port
 * @param {String} opts.user
 * @param {String} opts.pass[word]
 * @param {Boolean} opts.passive
 * @param {String} opts.localPath
 * @param {String} opts.remotePath
 * @param {String} opts.ftpCommand
 * @param {String} opts.stdinEncoding
 * @param {String} opts.stdoutEncoding
 */
module.exports = (opts, callback) => {
    if (typeof callback === 'function') {
        return ftpPush(opts, callback);
    }

    return new Promise((resolve, reject) => {
        ftpPush(opts, err => {
            if(err) {
                return reject(err);
            }
            resolve();
        });
    });
}
