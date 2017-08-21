import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

@IonicPage()
@Component({
  selector: 'page-by-artist',
  templateUrl: 'by-artist.html',
})
export class ByArtistPage
{
    private page: any = null

    constructor(public nav_ctrl: NavController, public nav_params: NavParams)
    {
        this.page = this.nav_params.get('page')
    }
}
