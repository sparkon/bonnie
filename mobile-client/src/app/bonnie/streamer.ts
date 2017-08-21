import { Utils } from '../../app/bonnie/utils';

export var StreamerProtocol = {
    version: '0.1',
    
    // Shared
    CHUNK_SEC: 15,
    
    list: 
    {
        request:
        {
            type: 0,
            id: 'number'
        },
        response:
        {
            id: 'number',
            songs: 'Song[]', // <ID, Title, Artist, Album, AlbumID, Year, Genre, Length>
            chunks: 'number'
        }
    },
    
    get_song_chunk:
    {
        request:
        {
            type: 1,
            id: 'number',
            song_id: 'number',
            chunk: 'number',
        },
        response:
        {
            id: 'number',
            data: 'ChunkData' // MDN , null if chunk invalid 
        }
    },
    
    get_album_thumbnail:
    {
        request:
        {
            type: 2,
            id: 'number',
            album_id: 'number'
        },
        response:
        {
            id: 'number',
            data: 'string' // base64 ? can be set as source directly
        } 
    }
}

declare var Peer: any;

// Written against StreamerProtocol v0.1
export interface Song
{
    id: number
    title: string
    artist: string
    album: string
    album_id: number
    year: number
    genre: string
    length: number
    chunks: number
}

export class Streamer
{
    private peer: any = null
    private connection: any = null
    private requests: {} = {}
    private buffered_requests: any[] = []
    private next_id: number = 0

    constructor(private uid: string) { }

    _connect()
    {
        if (this.peer != null)
            return

        try
        {
            this.peer = Peer({ host: 'castan.me', port: 9000 })
        }
        catch(error)
        {
            console.error(`PeerJS Connection Error: ${error}`)
        }
        this.connection = this.peer.connect(this.uid)
        let self = this
        this.connection.on('error', (error) =>
        {
            console.error(`Streamer connection error: ${error}`)
        })
        this.connection.on('close', () => 
        {
            console.error(`Closed connection..`)
        })
        this.connection.on('open', () =>
        {
            console.info(`Connected to streamer: ${self.uid}`)

            for (let request of self.buffered_requests)
                self._send(request.data, request.callback)
        })
        this.connection.on('data', (response) =>
        {
            // TODO Check if has id
            console.info('Received response')

            if (!(response.id in self.requests))
            {
                console.error(`Discarded unknown response id: ${response.id}`)
                return
            }

            self.requests[response.id](response)
            delete self.requests[response.id]
        })
    }

    _send(request: any, callback: any)
    {
        this._connect()

        if (this.connection.open)
            this.connection.send(request)
        else
            this.buffered_requests.push({ data: request, callback: callback})
    
        this.requests[request.id] = callback
    }

    getSongList(callback: any)
    {
        console.info(`Requesting song list`)
        let request: any = Utils.make(StreamerProtocol.list.request)
        request.id = this.next_id++
        this._send(request, callback)
    }

    getChunk(song_id: number, chunk: number, callback: any)
    {
        console.info(`Requesting chunk: ${chunk} from song: ${song_id}`)
        let request: any = Utils.make(StreamerProtocol.get_song_chunk.request)
        request.id = this.next_id++
        request.song_id = song_id
        request.chunk = chunk
        this._send(request, callback)
    }
}