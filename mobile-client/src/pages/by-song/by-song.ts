import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

@IonicPage()
@Component({
  selector: 'page-by-song',
  templateUrl: 'by-song.html',
})
export class BySongPage
{
    private page: any = null

    constructor(public nav_ctrl: NavController, public nav_params: NavParams)
    {
        this.page = this.nav_params.get('page')
    }
}
