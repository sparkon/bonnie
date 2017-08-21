import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';

import { SuperTabsModule } from 'ionic2-super-tabs';

import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { PlayerPage, SongSchedulePage } from '../pages/player/player';
import { BySongPage } from '../pages/by-song/by-song';
import { ByArtistPage } from '../pages/by-artist/by-artist';
import { ByAlbumPage } from '../pages/by-album/by-album';

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    PlayerPage,
    SongSchedulePage,
    BySongPage,
    ByArtistPage,
    ByAlbumPage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    SuperTabsModule.forRoot()
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    PlayerPage,
    SongSchedulePage,
    BySongPage,
    ByArtistPage,
    ByAlbumPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
