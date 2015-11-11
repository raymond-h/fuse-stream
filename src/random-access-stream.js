import Promise from 'bluebird';
import concat from 'concat-stream';
import fs from 'fs';
import { EventEmitter } from 'events';

export class RandomAccessStream {
    constructor(streamFn, params) {
        this.offset = 0;
        this.streamEnded = false;

        const onStreamEnd = ::this._onStreamEnd;

        this._createStream = () => {
            if(this.stream != null) {
                this.stream.removeListener('end', onStreamEnd);
                this.stream.end();
            }

            this.streamEnded = false;
            this.stream = streamFn(this.offset, params);
            this.stream.on('end', onStreamEnd);
        };
    }

    _onStreamEnd() {
        this.streamEnded = true;
        this.stream.emit('readable');
    }

    end() {
        if(this.stream != null) {
            this.stream.end();
        }
    }

    read(start, length) {
        return new Promise((resolve, reject) => {
            if(this.stream == null || start !== this.offset) {
                this.offset = start;
                this._createStream();
            }

            // get "length" bytes from stream
            const loop = () => {
                const res = this.stream.read(length);

                if(res == null && !this.streamEnded)
                    return this.stream.once('readable', loop);

                resolve(res);

                if(res != null) this.offset += res.length;
            };

            loop();
        });
    }

    _read(start, length) {
        return this.buffer.slice(start, start+length);
    }
}
