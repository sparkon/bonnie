var __canvas = document.createElement('canvas')

function to_base64(blob) {
    var maxW = 200;
    var maxH = 200;
    return new Promise((resolve, reject) => {
        try {
            var img = new Image
            img.onload = function() {
                var ctx=__canvas.getContext("2d")
                var cw=__canvas.width
                var ch=__canvas.height
                var iw=img.width
                var ih=img.height
                var scale=Math.min((maxW/iw),(maxH/ih))
                var iwScaled=iw*scale
                var ihScaled=ih*scale
                __canvas.width=iwScaled
                __canvas.height=ihScaled
                ctx.drawImage(img,0,0,iwScaled,ihScaled)
                var dataurl = __canvas.toDataURL()
                resolve(dataurl)
            }
            img.src = 'http://s3.amazonaws.com/37assets/svn/765-default-avatar.png';//URL.createObjectURL(blob);
        } catch (e) {
            reject(e)
        }
    })
}