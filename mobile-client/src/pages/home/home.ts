import { Component } from '@angular/core';
import { IonicPage, NavController, AlertController, NavParams } from 'ionic-angular';

import { StreamerInfo, Hub } from '../../app/bonnie/hub';
import { PlayerPage } from '../player/player';

enum State
{
    IDLE,
    WAIT,
    RCVD,
    NONE
}

@IonicPage()
@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
})
export class HomePage 
{
    public eState = State

    private hub: Hub = new Hub()
    private streamers: StreamerInfo[] = []
    private state: State = State.IDLE

    constructor(public nav_ctrl: NavController, public alert_ctrl: AlertController, public nav_params: NavParams) 
    {
    }

    onFindPublicStreamers()
    {
        this.state = State.WAIT;

        this.hub.getPublicStreamers((response) =>
        {
            this.state = State.RCVD
            this.streamers = response.streamers   
        })
    }

    onInviteCode()
    {
        let invite_prompt = this.alert_ctrl.create({
            title: 'Invite Code',
            inputs: [{
                name: 'code',
                placeholder: 'Example: 123456789' 
            }],
            buttons: [{
                text: 'Connect',
                handler: (data) =>
                {
                    // TODO: ion spinner ?

                    this.hub.getStreamerFromInviteCode(data.code, (response) =>
                    {
                        // TODO: Check if response is valid, and if streamers is not emtpy
                        this.nav_ctrl.push(PlayerPage, { streamer_info: response.streamers[0] })
                    })
                }
            }]
        })

        invite_prompt.present()
    }

    onStreamerSelected(streamer)
    {
        console.log(streamer)
        this.nav_ctrl.push(PlayerPage, { streamer_info: streamer })
    }
}
