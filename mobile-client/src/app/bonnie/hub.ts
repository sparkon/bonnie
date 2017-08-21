import { Utils } from '../../app/bonnie/utils';

export var HubProtocol = {
    version: '0.1',
    
    register: 
    {
        request:
        {
            type: 0,
            id: 'number',
            name: 'string'
        },
        response:
        {
            id: 'number',
            valid: 'boolean',
            key: 'string',
            code: 'string'
        }
    },
    
    session:
    {
        request:
        {
            type: 1,
            id: 'number',
            key: 'string'
        },
        response:
        {
            id: 'number',
            uid: 'string'
        }
    },
    
    update: 
    {
        request:
        {
            type: 2,
            id: 'number',
            key: 'string',
            // ONE OF:
            name: 'string',
            access: 'string', // public/private
            avatar: 'string',
            desc: 'string',
            songs: 'number'
        },
        response:
        {
            id: 'number',
            valid: 'boolean'
        }  
    },
    
    close:
    {
        request:
        {
            type: 3,
            id: 'number',
            key: 'string'
        },
        response:
        {
            id: 'number'
        }
    },
    
    get:
    {
        request:
        {
            type: 4,
            id: 'number',
            code: 'string'    // opt
        },
        response:
        {
            id: 'number',
            streamer: 'Streamer[]' // <name, uid, avatar, desc, songs>
        }
    }
}

// Written against HubProtocol 0.1
export interface StreamerInfo
{
    name: string
    uid: string
    avatar: string
    desc: string
    songs: number
}

export class Hub
{
    private requests: { } = []
    private buffered_requests: any[] = []
    private websocket: WebSocket = null
    private next_id: number = 0

    _connect()
    {
        if (this.websocket != null)
            return   

        try
        {
            this.websocket = new WebSocket('ws://castan.me:80')
        }
        catch(error)
        {
            console.error(`Error creating hub websocket: ${error}`)
        }

        this.websocket.onerror = (error) =>
        {
            console.error(`Hub WebSocekt error: ${error}`)
        }

        this.websocket.onopen = (event) =>
        {
            console.info(`Connected to Hub: ${this.websocket.url}`)
            for (let request of this.buffered_requests)
                this._send(request.data, request.callback)
        }

        this.websocket.onmessage = (message) =>
        {
            // TODO: Verify message is valid

            let response = JSON.parse(message.data)
            this.requests[response.id](response)
            delete this.requests[response.id]
        }
    }

    _send(request: any, callback: any)
    {
        this._connect()
        if (this.websocket.readyState == WebSocket.OPEN)
            this.websocket.send(JSON.stringify(request))
        else
            this.buffered_requests.push({ data: request, callback: callback })
        
        // TODO: Check if there is already a message w/ that id
        this.requests[request.id] = callback
    }

    getPublicStreamers(callback: any)
    {
        let request: any = Utils.make(HubProtocol.get.request)
        request.id = this.next_id++
        delete request.code
        this._send(request, callback)
    }

    getStreamerFromInviteCode(code: string, callback: any)
    {
        let request: any = Utils.make(HubProtocol.get.request)
        request.id = this.next_id++
        request.code = code
        this._send(request, callback)
    }
}

