import Promise from 'bluebird';
import concat from 'concat-stream';
import { EventEmitter } from 'events';

export class CachedAccessStream extends EventEmitter {
    constructor(streamFn, params) {
        super();
        this.buffer = null;

        streamFn(0, params, (err, stream) => {
            if(err != null) return console.error(err.stack);

            stream
            .pipe(concat((buf) => {
                this.buffer = buf;
                this.emit('read-data');
            }));
        });
    }

    read(start, length) {
        return new Promise((resolve) => {
            if(this.buffer != null) {
                resolve(this._read(start, length));
            }
            else {
                this.once('read-data', () => {
                    resolve(this._read(start, length));
                });
            }
        });
    }

    _read(start, length) {
        return this.buffer.slice(start, start+length);
    }
}
