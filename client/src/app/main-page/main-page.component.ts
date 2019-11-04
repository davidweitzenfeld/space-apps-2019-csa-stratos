import {Component, EventEmitter, OnInit} from '@angular/core';
import {
  DataService,
  StratosEnvironment,
  StratosImage,
  StratosImageCamera,
  StratosNavigation,
  StratosTravel
} from '../data-service/data.service';
import {Subscription, timer} from 'rxjs';
import {auditTime, map} from 'rxjs/operators';

export interface Image {
  name: string;
  image: string;
}

export interface ChartModel {
  name: string;
  yAxis: { title: string; };
  series: { type: string; title: string; data: [Date, number][]; }[];
}

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.scss']
})
export class MainPageComponent implements OnInit {

  isDataLoaded = false;
  currentTime?: Date;

  startTime?: Date;
  endTime?: Date;

  isPlayback = false;
  playbackRate = 60 * 10;
  playbackSubscription?: Subscription;

  navigation: StratosNavigation;
  travel: StratosTravel;
  environment?: StratosEnvironment;
  path?: [number, number][];

  images: Image[];

  mapBounds?: [[number, number], [number, number]];

  charts: ChartModel[];

  previewImage?: Image;

  mapStyle: 'light' | 'dark' | 'satellite' | 'outdoors' = 'satellite';

  currentTimeChange = new EventEmitter<Date>();

  constructor(
    private readonly dataService: DataService,
  ) {
  }

  ngOnInit() {
    this.dataService.loadData()
      .subscribe(() => this.onDataLoaded());
    this.dataService.instantData$
      .subscribe(data => {
        this.navigation = data.navigation;
        this.travel = data.travel;
        this.environment = data.environment;
        this.parseImages(this.dataService.getImages(data.images));
      });
    this.currentTimeChange
      .pipe(
        auditTime(250)
      )
      .subscribe(time => this.onTimeChange(time.getTime()));
  }

  onDataLoaded() {
    console.log('Data loaded!');
    this.currentTime = this.dataService.getStartTime();
    this.startTime = this.dataService.getStartTime();
    this.endTime = this.dataService.getEndTime();
    this.mapBounds = this.dataService.getBounds();
    this.path = this.dataService.getPath();
    this.onTimeChange(this.currentTime.getTime());
    this.loadCharts();
    this.isDataLoaded = true;
  }

  parseImages(images: StratosImage[]) {
    const horizonImage = images.find(it => it.camera === StratosImageCamera.HORIZON);
    const nadirImage = images.find(it => it.camera === StratosImageCamera.NADIR);

    this.images = [
      {
        name: 'HORIZON',
        image: horizonImage ? 'data:image/jpeg;base64,' + horizonImage.image : undefined,
      },
      {
        name: 'NADIR',
        image: nadirImage ? 'data:image/jpeg;base64,' + nadirImage.image : undefined,
      },
    ];

    if (this.previewImage && this.previewImage.name === 'HORIZON') {
      this.previewImage = this.images[0];
    } else if (this.previewImage && this.previewImage.name === 'NADIR') {
      this.previewImage = this.images[1];
    }
  }

  onTimeChange(time: number) {
    console.log('time change');
    this.currentTime = new Date(time);
    this.dataService.instant(this.currentTime);
  }

  onPlaybackToggle() {
    if (typeof this.playbackSubscription !== 'undefined') {
      this.playbackSubscription.unsubscribe();
    }

    if (this.isPlayback) {
      this.playbackSubscription = timer(0, 250)
        .pipe(
          map(() => this.currentTime.getTime() + 250 * this.playbackRate),
          map(time => time <= this.endTime.getTime() ? time : this.startTime.getTime())
        )
        .subscribe(time => this.onTimeChange(time));
    }
  }

  loadCharts(): void {
    this.charts = [
      {
        name: 'Altitude',
        yAxis: {title: 'Altitude'},
        series: [
          {type: 'line', title: 'Altitude', data: this.dataService.getAltitudeByTime()},
        ]
      },
      {
        name: 'Temperature',
        yAxis: {title: 'Temperature (°C)'},
        series: [
          {
            type: 'line',
            title: 'Internal Temperature',
            data: this.dataService.getEnvironment().map(it => [it.missionTime, it.internalTemperature])
          },
          {
            type: 'line',
            title: 'External Temperature',
            data: this.dataService.getEnvironment().map(it => [it.missionTime, it.externalTemperature])
          },
        ]
      },
      {
        name: 'Pressure',
        yAxis: {title: 'Pressure'},
        series: [
          {
            type: 'line',
            title: 'External Pressure',
            data: this.dataService.getEnvironment().map(it => [it.missionTime, it.externalPressure])
          },
        ]
      },
      {
        name: 'Dew Point',
        yAxis: {title: 'Dew Point'},
        series: [
          {
            type: 'line',
            title: 'Dew Point',
            data: this.dataService.getEnvironment().map(it => [it.missionTime, it.dewPoint])
          },
        ]
      },
    ];
  }

}
