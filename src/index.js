import fuse from 'fuse-bindings';

import { RandomAccessStream } from './random-access-stream';
import { CachedAccessStream } from './cached-access-stream';

// const S_IFMT = 0o170000; // bit mask for the file type bit field
// const S_IFSOCK = 0o140000; // socket
// const S_IFLNK = 0o120000; // symbolic link
// const S_IFREG = 0o100000; // regular file
// const S_IFBLK = 0o060000; // block device
// const S_IFDIR = 0o040000; // directory
// const S_IFCHR = 0o020000; // character device
// const S_IFIFO = 0o010000; // FIFO

let i = 1;
const datas = {};

function generateFd() {
    return i++;
}

export function fuseMount(mntPath, handlers, cb) {
    fuse.mount(mntPath, {
        options: ['direct_io'],

        readdir(path, cb) {
            console.log('readdir', path);

            handlers.getDirectoryContents(path, (err, paths) => {
                if(err != null) {
                    // TODO properly handle errors

                    console.error(err.stack);
                    cb(fuse.EIO);
                }

                else cb(0, paths);
            });
        },

        getattr(path, cb) {
            console.log('getattr', path);

            handlers.getAttributes(path, (err, attrs) => {
                if(err != null) {
                    // TODO properly handle errors

                    console.error(err.stack);
                    cb(fuse.EIO);
                }

                else if(attrs == null) {
                    cb(fuse.ENOENT);
                }
                else {
                    cb(0, attrs);
                }
            });
        },

        open(path, flags, cb) {
            console.log('open', path, flags);
            const fd = generateFd();

            if(handlers.streamCreateStrategy != null)
                handlers.streamCreateStrategy(path, setupFile);

            else setupFile(null, 'recreate');

            function setupFile(err, strat) {
                if(err != null) {
                    console.error(err.stack);
                    return cb(fuse.EIO);
                }

                if(strat == null || strat === 'recreate') {
                    datas[fd] = new RandomAccessStream((offset, params, cb) => {
                        handlers.createReadStream(path, offset, cb);
                    });
                }
                else if(strat === 'cache') {
                    datas[fd] = new CachedAccessStream((offset, params, cb) => {
                        handlers.createReadStream(path, 0, cb);
                    });
                }

                cb(0, fd);
            }
        },

        release(path, fd, cb) {
            console.log('release', path, fd);
            delete datas[fd];
            cb(0);
        },

        read(path, fd, buffer, length, position, cb) {
            console.log('read', path, fd, length, position);

            datas[fd].read(position, length)
            .then((buf) => {
                if(buf == null) return cb(0);

                buf.copy(buffer);
                cb(buf.length);
            });
        }

    }, (err) => {
        if(err != null) return cb(err);

        process.on('SIGINT', () => {
            fuse.unmount(mntPath, () => {
                console.log('Dead');
            });
        });

        cb();
    });
}
