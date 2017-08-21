const child_process = require('child-process-promise')
const electron_app = require('electron').remote.app
const media_tags = require('jsmediatags')
const mp3_duration = require('mp3-duration')
const node_path = require('path')
const fs = require('mz/fs')
const settings = require('electron-settings')
const { BrowserWindow } = require('electron').remote
const remote = require('electron').remote

class Audio
{
    constructor(path, base_path)
    {
        this._path = path
        this._relative_path = node_path.relative(base_path, path)
        this._filename = node_path.parse(path).name
        this._extension = node_path.parse(path).ext
        this._title = 'unknown'
        this._artist = 'unknown'
        this._album = ''
        this._track = -1
        this._length = 0
        this._thumbnail = ''
        this.id = -1
    }

    get path() { return this._path }
    get relative_path() { return this._relative_path }
    get filename() { return this._filename }
    get extension() { return this._extension }
    get title() { return this._title }
    get artist() { return this._artist }
    get album() { return this._album }
    get track() { return this._track }
    get length() { return this._length }
    get thumbnail() { return this._thumbnail }  // jpeg album thumbnail

    async init()
    {
        function parse_tags(path)
        {
            return new Promise((resolve, reject) =>
            {
                new media_tags.read(path, {
                    onSuccess: (metadata) =>
                    {
                        resolve(metadata.tags)
                    },
                    onError: (error) =>
                    {
                        reject(`Error parsing tags: ${error}`)
                    }
                })
            })
        }

        function parse_length(path)
        {
            return new Promise((resolve, reject) =>
            {
                mp3_duration(path, (err, duration) =>
                {
                    if (err)
                    {
                        reject(`Error parsing length: ${err.message}`)
                    }
                    else
                    {
                        resolve(duration)    
                    }
                })
            })
        }
        
        // No need to catch, appsed to the Streamer
        let tags = await parse_tags(this._path)
        if ('title' in tags) this._title = tags.title
        if ('artist' in tags) this._artist = tags.artist
        if ('album' in tags) this._album = tags.album
        if ('track' in tags) this._track = tags.track
        if ('picture' in tags) this._thumbnail = tags.picture.data

        this._length = await parse_length(this._path)
    }

    // TODO: Move to streamer
    pack()
    {
        return {
            id: this.id,
            title: this._title,
            artist: this._artist,
            album: this._album,
            length: this._length,
            chunks: Math.ceil(this._length / StreamerProtocol.CHUNK_SEC)
        }
    }
}

let CACHED_AUDIO_STATE_LOCKED = 0 // Someone (the one who called the constructor) is splitting up chunks
let CACHED_AUDIO_STATE_FAILED = 1 // initialization of CachedAudio failed, the first one to notice removes the entry from the cache
let CACHED_AUDIO_STATE_DONE = 2 // Usable by everyone
class CachedAudio
{
    constructor(audio)
    {
        this._audio = audio
        this._chunks = new Array()
        this._timestamp = Date.now()
        this._state = CACHED_AUDIO_STATE_LOCKED
    }

    get chunks()
    {
        this._timestamp = Date.now()
        return this._chunks
    }   
    
    get ms_since_last_access()
    {
        return Date.now() - this._timestamp
    }

    get state() { return this._state }

    async init()
    {
        if (this._chunks.length)
            return null
            
        let output_filename = this._audio.relative_path.replace(/[:\\/]/g, '-')
        output_filename = output_filename.substr(0, output_filename.lastIndexOf('.')) || output_filename;
        let t_chunk = `${Math.floor(StreamerProtocol.CHUNK_SEC / 60)}.${Math.round(StreamerProtocol.CHUNK_SEC % 60)}`

        let splitter_cmd = `"${electron_app.getAppPath()}`
        splitter_cmd += '\\bin\\mp3splt\\mp3splt.exe" '
        splitter_cmd += `-f -t ${t_chunk} -d split ` // How to split
        splitter_cmd += `-o "${output_filename}"@n ` // Output
        splitter_cmd += `"${this._audio.path}"`  // Output
        try
        {
            let result = await child_process.exec(splitter_cmd)
        }
        catch(error)
        {
            this._state = CACHED_AUDIO_STATE_FAILED
            return `Failed to split ${this._audio.filename}: ${error}`
        }

        // Not very javascriptish..
        let promises = []
        let num_generated_chunks = Math.ceil(this._audio.length / StreamerProtocol.CHUNK_SEC)
        for (let i = 0; i < num_generated_chunks; ++i)
        {
            promises.push(new Promise((resolve, reject) =>
            {
                let pad = ''
                if (i+1 < 10 && num_generated_chunks >= 10) pad = '0'
                let chunk_path = `split/${output_filename}${pad}${i+1}${this._audio.extension}`
                console.info(chunk_path)
                // Read why not await here http://taoofcode.net/promise-anti-patterns/
                fs.readFile(chunk_path)
                .then((data) => { resolve(data) })
                .catch((err) => { resolve(new Error(`Failed to read chunk ${chunk_path}`)) })
            }))
        }

        let results = await Promise.all(promises)

        // Checking for errors
        for (let result of results)
        {
            // First one to fail is reported
            if (result instanceof Error) return result.message
        }

        // Order preserved
        this._chunks = results

        this._state = CACHED_AUDIO_STATE_DONE
        return ''
    }
}

class Directory
{
    constructor(path, files, size)
    {
        this.path = path
        this.files = files
        this.size = size
    }
}

class Streamer
{
    constructor()
    {
        // Private
        this._started = false       // True if hub login was successful and peerjs is listening
        this._dirs = new Array()    // Directories to be served
        this._peer = null           // PeerJS connection
        this._hub_ws = null         // hub WebSocket connection

        this._public_audios = new Array()   // List of streamable (obtained from traversing _dirs)
        this._album_thumbnails = new Map()
        this._audio_cache = new Map()       // Audio cache

        this._hub_msg_register = new Map()
        this._hub_msg_id = 0
        
        // Public events
        this.on_server_info = null
        this.on_server_warning = null
        this.on_server_error = null
        this.on_ui_sync = null
    }
    
    add_dir(new_dir)
    {
        if (this._started)
            return false;

        this._dirs.push(new_dir)
        return true;
    }

    remove_dir(path)
    {
        if (this._started)
            return false;

        let el = this._dirs.find((dir) => { return path === dir.path });
        if (!el)
            return false
        this._dirs.splice(this._dirs.indexOf(el), 1)
        return true
    }

    _message_hub(message, callback) 
    {
        let ws = new WebSocket(`ws://${BonnieSettings.hub_hostname}:${BonnieSettings.hub_port}`)
        message.id = this._hub_msg_id
        this._hub_msg_id = this._hub_msg_id + 1
        this._hub_msg_register.set(message.id, callback)
        ws.onmessage = message => {
            let response = JSON.parse(message.data)
            this._hub_msg_register.get(response.id)(ws, response)
            ws.onclose = null
            ws.close()
        }
        ws.onopen = event => {
            ws.send(JSON.stringify(message))
        }
        ws.onerror = error => {
            this.on_server_error(error)
        }
        ws.onclose = event => {
            this.on_server_error('error')
        }
    }

    _register(name) {
        return new Promise((resolve, reject) => {
            let register_req = NetUtils.make(HubProtocol.register.request)
            register_req.name = name
            this._message_hub(register_req, (ws, response) => { 
                if (!response.valid) {
                    ws.close()
                    reject('Invalid name')
                }
                resolve({
                    key: response.key,
                    code: response.code
                })
            })
        })
    }

    _session(key) {
        return new Promise((resolve, reject) => {
            let session_req = NetUtils.make(HubProtocol.session.request)
            session_req.key = key
            this._message_hub(session_req, (ws, response) => { 
                if (!response.valid) {
                    ws.close()
                    reject('Invalid key')
                }
                resolve({
                    uid: response.uid,
                })
            })
        })
    }

    _update(field, value) {
        return new Promise((resolve, reject) => {
            let request = NetUtils.make(HubProtocol.update.request)
            request[field] = value
            request.key = settings.get('streamer.key')
            this._message_hub(request, (ws, response) => {
                if (!response.valid) {
                    ws.close()
                    reject("Invalid {} value".format(field))
                    return
                }
                resolve()
            })
        })
    }

    _close() {
        return new Promise((resolve, reject) => {
            let request = NetUtils.make(HubProtocol.close.request)
            request.key = settings.get('streamer.key')
            this._message_hub(request, (ws, response) => {
                if (!response.valid) {
                    ws.close()
                    reject('Unable to close the session')
                }
                resolve('Session closed')
            })
        })
    }

    _unregister() {
        return new Promise((resolve, reject) => {
            let request = NetUtils.make(HubProtocol.unregister.request)
            request.key = settings.get('streamer.key')
            this._message_hub(request, (ws, response) => {
                if (!response.valid) {
                    ws.close()
                    reject('Unable to unregister from the server')
                }
                resolve('Unregistered')
            })
        })
    }

    register(name) {
        return this._register(name).then(result => {
            settings.set('streamer.name', name)
            settings.set('streamer.desc', '')
            settings.set('streamer.avatar', 'http://s3.amazonaws.com/37assets/svn/765-default-avatar.png')
            settings.set('streamer.access', 'private')
            settings.set('streamer.key', result.key)
            settings.set('streamer.code', result.code)
            return 'Registration complete!'
        }).catch(error => {
            throw error
        })
    }

    _is_first_access() {
        return !settings.has('streamer');
    }

    init(registration_callback) {
        let pre_setup = streamer._is_first_access() ? registration_callback() : Promise.resolve('Found previous id...')
        pre_setup.then(result => {
            this.on_server_info(result)
            this.on_ui_sync(settings.get('streamer'))
            this.on_server_info('Setup complete.')
        }).catch(error => {
            on_server_error(error)
        })
    }

    reset(callback) {
        settings.delete('streamer')
        this.init(callback)
    }

    start()
    {
        return new Promise((resolve, reject) => {
            if (this._started)
            {
                reject('Server already started')
                return
            }
            this._setup_audios()

            this._session(settings.get('streamer.key')).then(response => {
                this._peer = new Peer(response.uid, { host: BonnieSettings.peerjs_hostname, port: BonnieSettings.peerjs_port })

                this._peer.on('error', (err) => 
                {
                    console.info(`PeerJS Error: ${error}`)
                })
                this._peer.on('open', (id) =>
                {
                    console.info('PeerJS connection successful')
                    this._peer.on('connection', (conn) => { this._on_player_connected(conn) } )
                    this._peer.on('error', (err) => { this._trigger_error(err) } )
                    this._started = true
                })

                resolve()
            }).catch(error => {
                throw error
            })
        })
    }

    stop()
    {
        return new Promise((resolve, reject) => {
            if (!this._started) {
                reject('Server not running')
                return
            }

            this._close().then(result => {
                this._peer.destroy()
                this._started = false
                resolve(result)
            }).catch(error => {
                throw error
            })

            // Destroys NATServer connection + all data connections
            // in the future the server could go anon by simply disconnecting
            // from natserver (TODO)
        })
    }

    update_name(new_name) {
        return this._update('name', new_name).then(result => {
            settings.set('streamer.name', new_name)
            return 'Name updated'
        }).catch(error => {
            throw 'Choose another name'
        })
    }

    update_desc(new_desc) {
        return this._update('desc', new_desc).then(() => {
            settings.set('streamer.desc', new_desc)
            return 'Description updated'
        }).catch(error => {
            throw 'Unable to update the description'
        })
    }

    update_avatar(new_avatar) {
        return this._update('avatar', new_avatar).then(() => {
            settings.set('streamer.avatar', new_avatar)
            return 'Avatar updated'
        }).catch(error => {
            throw 'Choose another avatar'
        })
    }

    update_access(new_access) {
        return this._update('access', new_access).then(() => {
            settings.set('streamer.access', new_access)
            return 'Access level updated'
        }).catch(error => {
            throw 'Unable to update the access level'
        })
    }

    update_songs_count(new_count) {
        return this._update('songs', new_count).then(() => {
            resolve('Songs count updated')
        }).catch(error => {
            reject('Unable to update the songs count')
        })
    }

    _trigger_info(msg) { if(self.on_server_info) self.on_server_info(msg) }
    _trigger_warning(msg) { if (self.on_server_warning) self.on_server_warning(msg) }
    _trigger_error(msg) { if (self.on_server_error) self.on_server_error(msg) }

    async _setup_audios()
    {
        console.info('Setting up audios')
        let id_gen = 0;
        
        for (let dir of this._dirs)
        {
            for (let path of dir.files)
            {
                let extension = path.split('.').pop()
                if (extension != 'mp3') {
                    continue
                }
                let audio = new Audio(path, dir.path)
                try
                {
                    audio.init()
                    audio.id = this._public_audios.length
                    this._public_audios.push(audio)
                    /*if (!this._album_thumbnails.has(audio.album)) {
                        let blob = new Blob([audio.thumbnail], {type: 'application/octet-binary'});
                        let url = await to_base64(blob)
                        this._album_thumbnails.set(audio.album, url)
                    }*/
                }
                catch(error)
                {
                    this._trigger_warning(`Skipping ${path}: ${error}`)
                }
            }
        }

        this._trigger_info(`Found ${this._public_audios.length} audio files`)
    }

    _on_player_connected(connection)
    {
        this._trigger_info(`New connection: ${connection.peer}`)

        connection.on('data', (data) =>
        {
            let request = data // NO parse
            console.info(`Received request: ${request.id}`)

            switch(request.type)
            {
            case StreamerProtocol.list.request.type:
                this._on_list_audio_request(connection, request)
                break
            case StreamerProtocol.get_song_chunk.request.type:
                this._on_audio_request(connection, request)
                break
            default:
                console.log('DEV: Invalid request type')
            }  
        })

        connection.on('error', (err) =>
        {
            if (this.on_client_error)
                this.on_client_error(err)
        })
    }

    _on_list_audio_request(connection, request)
    { 
        // TODO Verify valid audio request
        // TODO Verify valid index
    
        connection.send({
            id: request.id,
            songs: this._public_audios.map((x) => { return x.pack() })
        })
    }

    async _on_audio_request(connection, request)
    {
        // TODO Verify that message is valid 
        // TODO Check if audio_id and chunk_id are valid
        
        let cached_audio = this._audio_cache.get(request.song_id)
        if (typeof cached_audio === 'undefined')
        {
            // This is to take ownership of the object
            cached_audio = new CachedAudio(this._public_audios[request.song_id])
            this._audio_cache.set(request.song_id, cached_audio)

            // Has to be called after adding object to the list
            let err = await cached_audio.init()
            if (err)
            {
                // TODO: send error message
                this._trigger_error(`Failed to pack audio for streaming: ${this._public_audios[request.song_id].relative_path}`)
                this._trigger_error(err)
                return
            }
        }

        while (cached_audio.state !== CACHED_AUDIO_STATE_DONE)
        {
            if (cached_audio.state === CACHED_AUDIO_STATE_FAILED)
            {
                this._audio_cache.delete(request.song_id)
                
                // TODO: Send error message
                return
            }

            function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)) } 
            await sleep(500)
        }
        
        connection.send({
            id: request.id,
            data: new Blob([cached_audio.chunks[request.chunk]])
        })
    }
}