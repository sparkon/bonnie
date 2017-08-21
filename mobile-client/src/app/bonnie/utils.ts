export namespace Utils
{
    export function make(obj: Object)
    {
        let ret: Object = new Object()
        for (var m in obj) ret[m] = obj[m];
        return ret
    }

    export function is_array(obj: any)
    {
        return obj.constructor == Array
    }

    export function request_is_valid(request: any, id: string)
    {
        if (id === 'streamers')
        {
            
        }
        else if (id == 'streamers:streamer')
        {   
            return request.hasOwnProperty('')
        }
    }
}