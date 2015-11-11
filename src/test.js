import { fuseMount } from './index';
import fs from 'fs';
import path from 'path';

import got from 'got';

const S_IFREG = 0o100000; // regular file
const S_IFDIR = 0o040000; // directory

const handlers = {
    getDirectoryContents(path, cb) {
        // we ignore 'path' here, because only '/'
        // will appear as a directory - so we just return
        // what files should be in '/'
        cb(null, [
            'rahatarmanahmed.json',
            'seiyria.json',
            'raymond-h.json'
        ]);
    },

    getAttributes(path, cb) {
        switch(path) {
            case '/':
                return cb(null, {
                    mtime: new Date(),
                    atime: new Date(),
                    ctime: new Date(),
                    mode: S_IFDIR | 0o775,
                    uid: process.getuid(),
                    gid: process.getgid()
                });

            case '/rahatarmanahmed.json':
            case '/seiyria.json':
            case '/raymond-h.json':
                return cb(null, {
                    mtime: new Date(),
                    atime: new Date(),
                    ctime: new Date(),
                    mode: S_IFREG | 0o777,
                    uid: process.getuid(),
                    gid: process.getgid()
                });

            default:
                // null means file does not exist
                return cb(null, null);
        }
    },

    createReadStream(p, offset, cb) {
        // we ignore 'path' - we want to output same file contents for any read

        cb(null,
        //     fs.createReadStream('.babelrc', { start: offset })
            got.stream('https://api.github.com/users/' + path.basename(p, '.json'))
        );
    }
};

fuseMount('./mnt', handlers, (err) => {
    if(err != null) console.error(err.stack);
});
