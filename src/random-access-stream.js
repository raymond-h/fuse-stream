import Promise from 'bluebird';
import concat from 'concat-stream';
import fs from 'fs';
import { EventEmitter } from 'events';

export class RandomAccessStream extends EventEmitter {
    constructor(streamFn, params) {
        super();
        this.buffer = null;
        this.offset = 0;

        streamFn(this.offset, params)
        .pipe(concat((buf) => {
            this.buffer = buf;
            this.emit('read-data');
        }));
    }

    read(start, length) {
        return new Promise((resolve, reject) => {
            if(this.buffer == null) {
                this.once('read-data', () => {
                    resolve(this._read(start, length));
                });
            }
            else resolve(this._read(start, length));
        });
    }

    _read(start, length) {
        return this.buffer.slice(start, start+length);
    }
}

const s = new RandomAccessStream((offset) => {
    console.log('Reading file, offset: ' + offset);

    return fs.createReadStream('.babelrc', { start: offset });
});

s.read(5, 10)
.then((buf) => {
    console.log(buf);

    return s.read(0, 10);
})
.done((buf) => {
    console.log(buf);
});
