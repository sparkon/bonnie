import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ByArtistPage } from './by-artist';

@NgModule({
  declarations: [
    ByArtistPage,
  ],
  imports: [
    IonicPageModule.forChild(ByArtistPage),
  ],
})
export class ByArtistPageModule {}
