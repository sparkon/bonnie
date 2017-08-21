var HubProtocol = {
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
            valid: 'boolean',
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
            // name: 'string',
            // access: 'string', // public/private
            // avatar: 'string',
            // desc: 'string',
            // songs: 'number'
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
            id: 'number',
            valid: 'boolean'
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
    },

    unregister:
    {
        request:
        {
            type: 5,
            id: 'number',
            key: 'string'
        },
        response:
        {
            id: 'number',
            valid: 'boolean'
        }
    }
}