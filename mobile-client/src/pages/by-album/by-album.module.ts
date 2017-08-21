import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ByAlbumPage } from './by-album';

@NgModule({
  declarations: [
    ByAlbumPage,
  ],
  imports: [
    IonicPageModule.forChild(ByAlbumPage),
  ],
})
export class ByAlbumPageModule {}
