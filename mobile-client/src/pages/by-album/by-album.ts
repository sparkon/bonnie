import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

@IonicPage()
@Component({
  selector: 'page-by-album',
  templateUrl: 'by-album.html',
})
export class ByAlbumPage
{
    private page: any

    constructor(public nav_ctrl: NavController, public nav_params: NavParams)
    {
        this.page = nav_params.get('page')
    }
}
