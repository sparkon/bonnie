let NetUtils = {
    make: (obj) =>
    {
        let ret = new Object()
        for (var m in obj) ret[m] = obj[m];
        return ret
    }
}