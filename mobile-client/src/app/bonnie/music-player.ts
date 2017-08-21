import { Song, StreamerProtocol } from '../../app/bonnie/streamer';
import BufferQueueNode from 'web-audio-buffer-queue';

export class MusicPlayer
{
    private queue: Song[] = []
    private chunk_cache: { } = { }
    private head: number = 0
    private buffered_head: number = 0
    private last_timestamp: number = 0
    private paused: boolean = true
    private last_chunk_written: number = -1
    private seeked: boolean = false

    private audio_ctx: AudioContext = null
    private queue_node: BufferQueueNode = null
    private gain_node: GainNode = null

    public on_chunk: any = null
    public on_seek: any = null
    public on_next_song: any = null

    constructor()
    {
        this.audio_ctx = new AudioContext()
        this._initWebAudio()
        setInterval(() => { this._update() }, 15)
    }

    _initWebAudio()
    {
        if (this.queue_node != null)
        {
            this.queue_node._node.disconnect()
        }

        this.queue_node = new BufferQueueNode({ 
            audioContext: this.audio_ctx,
            objectMode: true,
            channels: 2
        })
        this.queue_node.connect(this.audio_ctx.destination)
    }

    _reset()
    {
        this.last_timestamp = -1
        this.head = 0
        this.buffered_head = 0
        this.last_chunk_written = -1
    }

    _requestChunk(song, chunk)
    {
        this.chunk_cache[song.id][chunk] = null
        this.on_chunk(song, chunk, (arraybuffer) =>
        {
            console.info(`MusicPlayer: Received chunk: ${chunk} song:${song.title}`)
            this.audio_ctx.decodeAudioData(arraybuffer, (audiobuffer) =>
            {
                this.chunk_cache[song.id][chunk] = audiobuffer  
            })
        })
    }

    _isChunkCached(song: Song, chunk: number)
    {
        this._createCacheEntry(song)
        return this.chunk_cache[song.id][chunk] != null
    }

    _currentChunk()
    {
        return Math.floor(this.head / StreamerProtocol.CHUNK_SEC)
    }

    _triggerSeek(song: Song)
    {
        this.on_seek(this.head / song.length)
    }

    _nextSong(song: Song)
    {
        return this.on_next_song(song)
    }

    _createCacheEntry(song: Song)
    {
        if (!this.chunk_cache.hasOwnProperty(song.id))
        {
            this.chunk_cache[song.id] = { }
        }
    }

    _update()
    {
        if (this.paused || this.queue.length == 0)
            return

        let song: Song = this.queue[0]

        // Clock
        let delta: number = 0
        if (this.last_timestamp < 0)
        {
            this.last_timestamp = window.performance.now()
        }
        else
        {
            let current_time = window.performance.now()
            delta = (current_time - this.last_timestamp) / 1000
            this.last_timestamp = current_time
        }

        // Step 
        this.head += delta
        if (this.head > this.buffered_head)
        {
            if (this.last_chunk_written >= song.chunks - 1)
            {
                console.info(`${song.title} is over`)   
                this._reset()
                this.queue.shift()
                if (this.queue.length == 0)
                {
                    let next_song = this.on_next_song(song)                
                    if (next_song)
                    {
                        this.play(next_song)   
                    }
                }
                return
            }

            this.head = this.buffered_head
        }
        this._triggerSeek(song)

        // Waiting to play something
        if (this.last_chunk_written == -1)
        {
            let chunk = this._currentChunk()
            this._createCacheEntry(song)

            // Requesing if never done
            if (!this.chunk_cache[song.id].hasOwnProperty(chunk))
            {
                this._requestChunk(song, chunk)
            }
            else if (this._isChunkCached(song, chunk))
            {
                let audiobuffer = this.chunk_cache[song.id][chunk]
                
                if (this.seeked)
                {
                    let base = StreamerProtocol.CHUNK_SEC * chunk
                    let off = ((this.head - base) / audiobuffer.duration)
                    let length_off = Math.round(off * audiobuffer.length)
                    let samples_to_copy = audiobuffer.length - length_off
                    let audiobuffer_off = this.audio_ctx.createBuffer(audiobuffer.numberOfChannels, samples_to_copy, audiobuffer.sampleRate)
                    for (let ch = 0; ch < audiobuffer.numberOfChannels; ++ch)
                    {
                        let ch_data = new Float32Array(samples_to_copy)
                        audiobuffer.copyFromChannel(ch_data, ch, length_off)
                        audiobuffer_off.copyToChannel(ch_data, ch, 0)
                    }
                    this.seeked = false
                    this.queue_node.write(audiobuffer_off)
                    this.buffered_head = base + audiobuffer.duration
                    this.last_chunk_written = chunk
                }
                else
                {
                    this.queue_node.write(audiobuffer)
                    this.buffered_head += audiobuffer.duration
                    this.last_chunk_written = chunk
                }
            }
            // Null waiting for it to load
        }

        if (this.last_chunk_written >= 0)
        {
            let cur_chunk = this._currentChunk() 
            if (this.last_chunk_written < cur_chunk + 2)
            {
                // Requesting next chunk
                let next_chunk = this.last_chunk_written + 1
                if (next_chunk < song.chunks)
                {
                    if (!this.chunk_cache[song.id].hasOwnProperty(next_chunk))
                    {
                        this._requestChunk(song, next_chunk)
                    }
                    else if (this.chunk_cache[song.id][next_chunk] != null)
                    {
                        let audiobuffer = this.chunk_cache[song.id][next_chunk]
                        this.queue_node.write(audiobuffer)
                            this.buffered_head += audiobuffer.duration
                        this.last_chunk_written = next_chunk
                    }
                }
            }

            // Requesting first chunk from next song, 
            // currently just requesting one, but can keep using the last_chunk_written to request more
            if (this.last_chunk_written == song.chunks - 1)
            {
                // We already know what song to play
                if (this.queue.length > 1)
                {
                    if (!this._isChunkCached(this.queue[1], 0))
                    {
                        this._requestChunk(this.queue[1], 0) 
                    }
                }
                else
                {
                    let next_song = this._nextSong(song)
                    if (next_song && !this._isChunkCached(next_song, 0))
                    {
                        this._requestChunk(next_song, 0)   
                    }
                }
                ++this.last_chunk_written
            }
        }
    }

    queueEnd(song: Song)
    {
        this.queue.push(song)
    }

    queueNext(song: Song)
    {
        if (this.queue.length == 0)
        {
            this.play(song)
        }
        else
        {
            this.queue.splice(1, 0, song)
        }
    }

    play(song: Song)
    {
        this._initWebAudio()
        this.queue = [song]
        this._reset()
        this.paused = false
        this.audio_ctx.resume()
    }

    resume()
    {
        this.paused = false
        this.audio_ctx.resume()
    }

    pause()
    {
        this.paused = true
        this.last_timestamp = -1
        this.audio_ctx.suspend()
    }

    seek(pos: number) // [0, 1]
    {
        if (this.queue.length > 0)
        {
            this._initWebAudio()
            this._reset()
            this.head = pos * this.queue[0].length
            this.buffered_head = this.head
            this._triggerSeek(this.queue[0])
            this.seeked = true
        }
    }

    skipForward()
    {
        let song = this.queue.shift()
        if (this.queue.length == 0)
        {
            let next_song = this._nextSong(song)
            if (next_song)
            {
                this.queue = [next_song]
            }
        }

        if (this.queue.length > 0)
        {
            this._initWebAudio()
            this._reset()
            this._triggerSeek(this.queue[0])
        }
    }

    tell()
    {
        return
    }

    isPaused()
    {
        return this.paused
    }

    isQueueEmpty()
    {
        return this.queue.length == 0
    }
}