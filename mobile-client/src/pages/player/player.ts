import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, PopoverController, ViewController } from 'ionic-angular';
import { BySongPage } from '../by-song/by-song';
import { ByArtistPage } from '../by-artist/by-artist';
import { ByAlbumPage } from '../by-album/by-album';

import { StreamerInfo } from '../../app/bonnie/hub';
import { Song, Streamer } from '../../app/bonnie/streamer';
import { MusicPlayer } from '../../app/bonnie/music-player';

interface SongView
{
    title: string
    artist: string
    album: string
    year: number
    album_src: string
    song: Song
}

interface ArtistView
{
    artist: string
    albums: string[]
    songs: Song[]
    artist_src: string
}

interface AlbumView
{
    album: string
    artist: string
    album_src: string
    songs: number
}

enum SongOrder
{
    All,
    Artist,
    Album,
    // PlayList
}

@Component({
    template:`
        <ion-list no-lines style='margin: 0 auto'>
            <button ion-item (click)='onNext()'>Queue Next</button>
            <button ion-item (click)='onLast()'>Queue Last</button>
        </ion-list>
    `
})
export class SongSchedulePage
{
    private page: PlayerPage
    private view: SongView

    constructor(public view_ctrl: ViewController, public nav_params: NavParams)
    {
        this.page = nav_params.get('page')
        this.view = nav_params.get('view')
    }

    close() { this.view_ctrl.dismiss() }

    onNext()
    {
        this.page.music_player.queueNext(this.view.song)
        this.close()
    }

    onLast()
    {
        this.page.music_player.queueEnd(this.view.song)
        this.close()
    }
}

@IonicPage()
@Component({
  selector: 'page-player',
  templateUrl: 'player.html',
})
export class PlayerPage {
    public eSongOrder = SongOrder

    public by_song = BySongPage
    public by_artist = ByArtistPage
    public by_album = ByAlbumPage

    private order: SongOrder = SongOrder.All
    private streamer: Streamer
    private streamer_info: StreamerInfo
    public music_player: MusicPlayer = new MusicPlayer()

    private songs: Song[] = []
    public song_views: SongView[] = []
    public artist_views: ArtistView[][] = []
    public album_views: AlbumView[][] = []

    constructor(public nav_ctrl: NavController, public popover_ctrl: PopoverController, public nav_params: NavParams) 
    {
        this.streamer_info = nav_params.get('streamer_info')
        this.streamer = new Streamer(this.streamer_info.uid)

        this.streamer.getSongList((response) =>
        {
            console.info(`Received a total of ${response.songs.length} songs`)
            this.songs = response.songs
            this.generateViews()
        })

        this.music_player.on_chunk = (song, chunk, callback) =>
        {
            this.streamer.getChunk(song.id, chunk, (response) =>
            {
                // TODO: Verify response
                callback(response.data)
            })
        }

        this.music_player.on_seek = (val) =>
        {
            this.setPlaybarSeek(val)
        }

        this.music_player.on_next_song = (last) =>
        {
            if (this.order == SongOrder.All)
            {
                let idx = this.songs.findIndex(i => i == last)
                if (idx < this.songs.length - 1)
                {
                    return this.songs[idx + 1]   
                }
            }
        }
    }

    ionViewWillEnter()
    {
        this.setPlaybarSeek(0)
    }

    generateViews()
    {
        this.song_views = []
        let artist_views = []
        let album_views = []
        let map_artist_views = new Map<string, ArtistView>()
        let map_album_views = new Map<string, AlbumView>()

        for (let song of this.songs)
        {
            this.song_views.push({
                title: song.title,
                artist: song.artist,
                album: song.album,
                year: song.year,
                album_src: 'https://images-na.ssl-images-amazon.com/images/I/51fV96yqHtL.jpg',
                song: song
            })

            if (!(song.artist in map_artist_views))
            {
                let av: ArtistView = {
                    artist: song.artist,
                    albums: [song.album],
                    songs: [song],
                    artist_src: null
                }
                artist_views.push(av)
                map_artist_views[song.artist] = av
            }
            else
            {
                let artist_view = map_artist_views[song.artist]
                if (artist_view.albums.includes(song.album))
                {
                    artist_view.albums.push(song.album)
                }
                if (artist_view.songs.includes(song))
                {
                    artist_view.songs.push(song)   
                }
            }

            if (!(song.album in map_album_views))
            {
                let av: AlbumView = {
                    album: song.album,
                    artist: song.artist,
                    album_src: null,
                    songs: 1
                }
                album_views.push(av)
                map_album_views[song.album] = av
            }
            else
            {
                map_album_views[song.album].songs++   
            }
        }

        // Grouping artist/album views, could also be dynamic(TODO), not just 2 per row
        let ARTISTS_PER_ROW = 2
        let ALBUMS_PER_ROW = 2
        
        this.artist_views = []
        while (artist_views.length > 0)
        {
            let row = []
            for (let i = 0; i < ARTISTS_PER_ROW; ++i)
            {
                let view = artist_views.shift()
                row.push(view == undefined ? null : view)
            }
            this.artist_views.push(row)
        }

        this.album_views = []
        while (album_views.length > 0)
        {
            let row = []
            for (let i = 0; i < ARTISTS_PER_ROW; ++i)
            {
                let view = album_views.shift()
                row.push(view == undefined ? null : view)
            }
            this.album_views.push(row)
        }
    }

    setPlaybarSeek(val: number)
    {
        let playbar = document.getElementById('playbar')
        if (playbar)
        {
            playbar.style.width = `${val * 100}%`
        }
    }

    onPlay(view, order)
    {
        this.music_player.play(view.song)
        this.order = order
    }

    onSchedule(ev, view)
    {
        let popover = this.popover_ctrl.create(SongSchedulePage, {
            page: this,
            view: view
        })
        popover.present({
            ev: ev
        })
    }

    onSeek(event)
    {
        console.log(event)
        let full_width = document.getElementById('playbar-full').offsetWidth
        
        this.music_player.seek(event.offsetX / full_width)
    }
}