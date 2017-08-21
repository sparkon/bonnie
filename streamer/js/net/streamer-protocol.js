var StreamerProtocol = {
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