import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { BySongPage } from './by-song';

@NgModule({
  declarations: [
    BySongPage,
  ],
  imports: [
    IonicPageModule.forChild(BySongPage),
  ],
})
export class BySongPageModule {}
