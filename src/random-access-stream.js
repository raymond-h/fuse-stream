import Promise from 'bluebird';

export class RandomAccessStream {
    constructor(streamFn, params) {
        this.offset = 0;
        this.streamEnded = false;

        this._createStream = (cb) => {
            streamFn(this.offset, params, (err, stream) => {
                if(err != null) {
                    console.error(err.stack);
                    return cb();
                }

                this.streamEnded = false;
                this.stream = stream;
                this.stream.on('end', ::this._onStreamEnd);
                cb();
            });
        };
    }

    _onStreamEnd() {
        this.streamEnded = true;
        this.stream.emit('readable');
    }

    read(start, length) {
        return new Promise((resolve) => {
            // get "length" bytes from stream
            const loop = () => {
                const res = this.stream.read(length);

                if(res == null && !this.streamEnded)
                    return this.stream.once('readable', loop);

                resolve(res);

                if(res != null) this.offset += res.length;
            };

            if(this.stream == null || start !== this.offset) {
                this.offset = start;
                this._createStream(loop);
            }
            else loop();
        });
    }

    _read(start, length) {
        return this.buffer.slice(start, start+length);
    }
}
