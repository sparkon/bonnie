const dialog = require('electron').remote.dialog
const glob = require('glob-promise')

const add_directory_ref = document.getElementById('add-directory')
const start_ref = document.getElementById('start')
const stop_ref = document.getElementById('stop')
const code_ref = document.getElementById('code')
const qr_ref = document.getElementById('qr')
const directory_ls_ref = document.getElementById('files-table').getElementsByTagName('tbody')[0]

var qrcode = new QRCode("qr", {
    width: 128,
    height: 128,
    colorDark : "#ffffff",
    colorLight : "#36393f",
    correctLevel : QRCode.CorrectLevel.H
});

qrcode.clear()

access_desc = {
    public: 'We\'re going public! Other users can now find you and connect just by using the Bonnie app. Happy sharing!',
    protected: 'It\'s you and your friends! Share the invite code to let them find you and listen to your awesome music.',
    private: 'Scanning this QR code with the app is the only way to connect. Good luck guessing it, everyone.'
}

online_icon = "data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDUwIDUwIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MCA1MDsiIHhtbDpzcGFjZT0icHJlc2VydmUiIHdpZHRoPSI2NHB4IiBoZWlnaHQ9IjY0cHgiPgo8Y2lyY2xlIHN0eWxlPSJmaWxsOiMyNUFFODg7IiBjeD0iMjUiIGN5PSIyNSIgcj0iMjUiLz4KPHBvbHlsaW5lIHN0eWxlPSJmaWxsOm5vbmU7c3Ryb2tlOiNGRkZGRkY7c3Ryb2tlLXdpZHRoOjI7c3Ryb2tlLWxpbmVjYXA6cm91bmQ7c3Ryb2tlLWxpbmVqb2luOnJvdW5kO3N0cm9rZS1taXRlcmxpbWl0OjEwOyIgcG9pbnRzPSIgIDM4LDE1IDIyLDMzIDEyLDI1ICIvPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8L3N2Zz4K"

offline_icon = "data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDUwIDUwIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MCA1MDsiIHhtbDpzcGFjZT0icHJlc2VydmUiIHdpZHRoPSI1MTJweCIgaGVpZ2h0PSI1MTJweCI+CjxjaXJjbGUgc3R5bGU9ImZpbGw6I0Q3NUE0QTsiIGN4PSIyNSIgY3k9IjI1IiByPSIyNSIvPgo8cG9seWxpbmUgc3R5bGU9ImZpbGw6bm9uZTtzdHJva2U6I0ZGRkZGRjtzdHJva2Utd2lkdGg6MjtzdHJva2UtbGluZWNhcDpyb3VuZDtzdHJva2UtbWl0ZXJsaW1pdDoxMDsiIHBvaW50cz0iMTYsMzQgMjUsMjUgMzQsMTYgICAiLz4KPHBvbHlsaW5lIHN0eWxlPSJmaWxsOm5vbmU7c3Ryb2tlOiNGRkZGRkY7c3Ryb2tlLXdpZHRoOjI7c3Ryb2tlLWxpbmVjYXA6cm91bmQ7c3Ryb2tlLW1pdGVybGltaXQ6MTA7IiBwb2ludHM9IjE2LDE2IDI1LDI1IDM0LDM0ICAgIi8+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+Cjwvc3ZnPgo="

let streamer = new Streamer()
streamer.on_server_info = on_server_info
streamer.on_server_warning = on_server_warning
streamer.on_server_error = on_server_error
streamer.on_ui_sync = (data) => {
    $('#name').text(data.name)
    var p = $('#desc')
    if (data.desc == '') {
        p.addClass('neo-f')
        p.text('Insert a description')
    } else {
        p.removeClass('neo-f')
        p.text(data.desc)
    }
    $('#avatar').attr("src", data.avatar)
    $('#invite-code').text(data.code)
    //$('#access').text(data.access)
    var access = $('input:radio[name=access]');
    if(access.is(':checked') === false) {
        access.filter('[value=' + data.access + ']').prop('checked', true);
        $('#access-desc').text(access_desc[data.access])
        if (data.access == 'public' || data.access == 'protected') {
            $('#invite-code-panel').show()    
        } else if (data.access == 'private') {
            $('#invite-code-panel').hide()
        }
    }
    qrcode.makeCode(data.code)
}
on_init()

let tr_id = 0
let started = false

async function on_add_directory()
{
    let dirs = dialog.showOpenDialog({properties: ['openDirectory', 'multiSelections']})
    let staged_dirs = new Array()

    if (!dirs) return
    if (started) return

    vNotify.info({ text: `Queued ${dirs.length} directories`})   

    for (let udir of dirs)
    {
        let dir = udir.replace(/\\/g, '/')
        let pattern = dir + '/**'
        let files = await glob(pattern)
        let size = 0
        files = files.filter((path) => { 
            let stats = fs.statSync(path)
            if (stats.isFile())
            {
                size += stats.size;
                return true;
            }
            return false;
        })

        vNotify.success({ text: `Added ${files.length} from ${dir}`})
        
        let new_dir = new Directory(dir, files, size)
        if (streamer.add_dir(new_dir))
        {
            let entry = `
                <div class="dir-tr-path">${new_dir.path}</div>
                <div class="dir-tr-meta">
                    <div class="dir-tr-meta-count">${new_dir.files.length} Files</div>
                    <div class="dir-tr-meta-size">${Math.round(new_dir.size / (1024*1024))} MB</div>
                    <div class="dir-tr-meta-remove" onclick="on_remove_directory('${new_dir.path}')">Remove</div>
                </div>
            `
            let tr = directory_ls_ref.insertRow(directory_ls_ref.rows.length - 1);
            tr.classList.add('dir-tr')
            tr.classList.add(`dir-tr-${tr_id}`)
            tr_id = (tr_id + 1) % 2
            let td = tr.insertCell(0)
            td.classList.add('dir-td-entry')
            td.innerHTML = entry
            //directory_ls_ref.appendChild(tr)
        }
    }
}

function on_remove_directory(path)
{
    if (streamer.remove_dir(path))
    {
        let tds = document.getElementsByClassName('dir-td-entry')
        for (let td of tds)
        {
            let x = td.getElementsByClassName('dir-tr-path')[0]
            if (x.innerHTML == path)
            {
                td.parentNode.outerHTML = ''
                return;
            }
        }
    }

    // Error 
}

function register_callback() {
    return new Promise((resolve, reject) => {
        let win_parent = remote.getCurrentWindow()
        let win = new BrowserWindow({width: 350, height: 150, frame: false, movable: false, resizable: false,
            backgroundColor: '#36393f', center: true,
            modal: false, parent: win_parent,
        })
        win.show()
        win.on("closed", function() {
            win = null;
        });
        var ipcMain = require("electron").remote.ipcMain;
        ipcMain.removeAllListeners('request')
        ipcMain.on('request', (event, name) => {
            streamer.register(name).then(result => {
                win.webContents.send('response', true);
                resolve('Registration complete!')
            }).catch(error => {
                win.webContents.send('response', false);
            })
        });

        var html = [
            '<style>.spinner {  text-align: center;}.spinner > div {  width: 18px;  height: 18px;  background-color: #fff;  border-radius: 100%;  display: inline-block;  -webkit-animation: sk-bouncedelay 1.4s infinite ease-in-out both;  animation: sk-bouncedelay 1.4s infinite ease-in-out both;}.spinner .bounce1 {  -webkit-animation-delay: -0.32s;  animation-delay: -0.32s;}.spinner .bounce2 {  -webkit-animation-delay: -0.16s;  animation-delay: -0.16s;}@-webkit-keyframes sk-bouncedelay {  0%, 80%, 100% { -webkit-transform: scale(0) }  40% { -webkit-transform: scale(1.0) }}@keyframes sk-bouncedelay {  0%, 80%, 100% {     -webkit-transform: scale(0);    transform: scale(0);  } 40% {     -webkit-transform: scale(1.0);    transform: scale(1.0);  }}</style>',
            '<script>const {BrowserWindow} = require(\'electron\');',
            'const remote = require(\'electron\').remote;',
            'const ipcRenderer = require(\'electron\').ipcRenderer;',
            'function close() { remote.getCurrentWindow().close() }',
            'ipcRenderer.removeAllListeners("response");',
            'ipcRenderer.on("response", function(event, value) { if(value){ close() } else { document.getElementById("wait").style.display="none";',
                'document.getElementById("error").style.display="block" } });',
            'ipcRenderer.on("wait", function(event, value) {  });',
            'function handle_key_input(e){ var key = e.keyCode ? e.keyCode : e.which; if(key == 13) {',
                'ipcRenderer.send("request", document.getElementById("name").value); document.getElementById("wait").style.display="block"',
                '} else { document.getElementById("error").style.display="none" } }</script>',
            '<body style="font-family: \'Open Sans\', sans-serif; color:rgb(175, 175, 175); padding:10px; overflow-y:hidden;">',
                '<div style="text-align:center; font-size:18px;">Choose a name</div>',
                '<div style="text-align:center; font-size:14px; font-style:italic;">You may change it later...</div>',
                '<input id="name" type="text" style="width: 100%; text-align:center; background-color: rgb(28, 30, 35); padding-top:3px; padding-bottom:3px;',
                'border:0px; color:rgb(175, 175, 175); font-size:18px; margin-top: 25px; outline: none; letter-spacing: 0.5px;"',
                'onkeydown="handle_key_input(event)"></input>',
                '<div id="wait" style="display:none; margin-top:5px;" class="spinner"><div class="bounce1"></div><div class="bounce2"></div><div class="bounce3"></div></div>',
                '<div id="error" style="display:none; width: 100%; color:#ff0000; font-size:14px; text-align:center; margin-top:5px;">Name not available</div>',
            '</body>',
        ].join("");
        win.loadURL("data:text/html;charset=utf-8," + encodeURI(html))
        //win.openDevTools()
    })
}

function on_init() {
    streamer.init(register_callback)
}

function reset() {
    streamer.reset(register_callback)
}

function on_start()
{
    started = true
    var stop_button = $('<button id="stop" onclick="on_stop()">STOP <i class="fa fa-stop" aria-hidden="true"></i> </button>')

    const server_id = $('#name').text()

    streamer.start(server_id).then(() =>
    {
        vNotify.success({ text: `Logged as: ${server_id}`})
        $('#start').replaceWith(stop_button)
        $('#state-label img').prop('src', online_icon).text('Online')
    }).catch((err) =>
    {
        vNotify.error({ text: `Start Error: ${err}`})  
    })
}

function on_stop()
{
    started = false
    var start_button = $('<button id="start" onclick="on_start()">START <i class="fa fa-play" aria-hidden="true"></i> </button>')

    streamer.stop().then(result => {
        vNotify.success({text: 'Stopped server' })
        $('#stop').replaceWith(start_button)
        $('#state-label img').prop('src', offline_icon).text('Offline')
    }).catch(err => {
        vNotify.error({text: `${err}`})
    })
}

// Streamer callbacks, 
// can do more stuff such as track number of peers or else
// Just notifying now
function on_server_info(msg)
{
    vNotify.info({text: `Server: ${msg}`})
}

function on_server_warning(msg)
{
    vNotify.warning({text: `Server: ${msg}`})
}

function on_server_error(msg)
{
    vNotify.error({text: `Server: ${msg}`})
}

// -------------------------------------------

function on_name_edit_click() {
    var label = $('#name')

    var input = $('<input class="name-input" />').val(label.text());
    label.replaceWith(input);
  
    function commit () {
        input.prop('disabled', true);
        var waiter = $('#name-wait')
        waiter.show()

        streamer.update_name(input.val()).then(result => {
            var new_label = $('<span id="name" class="edit-f" onclick="on_name_edit_click()" />').text(input.val());
            input.replaceWith(new_label);
            waiter.hide()

            on_server_info(result)
        }).catch(error => {
            input.prop('disabled', false).focus()
            waiter.hide()
            
            on_server_error(error)
        })
    };

    function key_handler (e) {
        if (e.which == 13) {
            // otherwise it gets automatically triggered somewhere later in the callstack for some reason
            input.off('focusout')
            commit()
        }
    }

    input.on('focusout', commit).focus().on('keydown', key_handler);
}

function on_desc_edit_click() {
    var label = $('#desc')

    var text = label.hasClass('neo-f') ? '' : label.text()

    var input = $('<textarea class="desc-input" style="width:200px; height:60px;"/>').val(text);
    var waiter = $('#desc-wait')
    label.replaceWith(input);
  
    function commit () {
        input.prop('disabled', true);
        var new_label = $('<span id="desc" class="edit-f" onclick="on_desc_edit_click()" />').text(input.val());
        if (input.val() == '') {
            new_label.addClass('neo-f').text('Insert a description')
        }
        waiter.show()

        streamer.update_desc(input.val()).then(result => {
            input.replaceWith(new_label);
            waiter.hide()

            on_server_info(result)
        }).catch(error => {
            input.prop('disabled', false).focus()
            waiter.hide()
            
            on_server_error(error)
        })
    };

    var key_handler = function (e) {
        if (e.which == 13) {
            // otherwise it gets automatically triggered somewhere later in the callstack for some reason
            input.off('focusout')
            commit()
        }
    }

    input.on('focusout', commit).focus().on('keydown', key_handler);
}

function on_avatar_edit() {
    $('<input type="file"></input>').on('change', e => {
        $('#avatar-wait').show()
        to_base64(e.target.files[0]).then(result => {
            streamer.update_avatar(result)
        }).then(result => {
            on_server_info(result)
            $('#avatar-wait').hide()
            $('#avatar').prop('src', result)
        }).catch(error => {
            on_server_error(error)
            $('#avatar-wait').hide()
        })
    }).click();
}

$(document).ready(function() {
    $('input:radio[name=access]').change(function() {
        $('#access-wait').show()
        streamer.update_access(this.value).then(result => {
            $('#access-desc').text(access_desc[this.value])
            if (this.value == 'public' || this.value == 'protected') {
                $('#invite-code-panel').show()            
            } else if (this.value == 'private') {
                $('#invite-code-panel').hide()
            }
            $('#access-wait').hide()
            on_server_info(result)
        }).catch(error => {
            $('#access-wait').hide()
            on_server_error(error)
        })
    });
});

function on_code_enter() {
    document.getElementById('code-copy-tool').style.visibility = 'visible';
}

function on_code_leave() {
    document.getElementById('code-copy-tool').style.visibility = 'hidden';
}

function copy_code() {
    copyToClipboard(document.getElementById("invite-code"));
};

function copyToClipboard(elem) {    // https://stackoverflow.com/questions/22581345/click-button-copy-to-clipboard-using-jquery
      // create hidden text element, if it doesn't already exist
    var targetId = "_hiddenCopyText_";
    var isInput = elem.tagName === "INPUT" || elem.tagName === "TEXTAREA";
    var origSelectionStart, origSelectionEnd;
    if (isInput) {
        // can just use the original source element for the selection and copy
        target = elem;
        origSelectionStart = elem.selectionStart;
        origSelectionEnd = elem.selectionEnd;
    } else {
        // must use a temporary form element for the selection and copy
        target = document.getElementById(targetId);
        if (!target) {
            var target = document.createElement("textarea");
            target.style.position = "absolute";
            target.style.left = "-9999px";
            target.style.top = "0";
            target.id = targetId;
            document.body.appendChild(target);
        }
        target.textContent = elem.textContent;
    }
    // select the content
    var currentFocus = document.activeElement;
    target.focus();
    target.setSelectionRange(0, target.value.length);
    
    // copy the selection
    var succeed;
    try {
          succeed = document.execCommand("copy");
    } catch(e) {
        succeed = false;
    }
    // restore original focus
    if (currentFocus && typeof currentFocus.focus === "function") {
        currentFocus.focus();
    }
    
    if (isInput) {
        // restore prior selection
        elem.setSelectionRange(origSelectionStart, origSelectionEnd);
    } else {
        // clear temporary content
        target.textContent = "";
    }
    return succeed;
}