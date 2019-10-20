import {Component, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {DataService, EnvDataPoint, TravelDataPoint} from '../data-service/data.service';
import {Subscription, timer} from 'rxjs';
import {map} from 'rxjs/operators';

export interface Image {
  name: string;
  path: string;
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

  envData: EnvDataPoint;
  travelData: TravelDataPoint;

  images: Image[];

  mapBounds?: [[number, number], [number, number]];

  charts: ChartModel[];

  previewImage?: Image;

  constructor(
    private readonly dataService: DataService,
  ) {
  }

  ngOnInit() {
    this.dataService.loadData()
      .subscribe(() => this.onDataLoaded());
  }

  onDataLoaded() {
    console.log('Data loaded!');
    this.currentTime = this.dataService.getStartTime();
    this.startTime = this.dataService.getStartTime();
    this.endTime = this.dataService.getEndTime();
    this.mapBounds = this.dataService.getBounds();
    this.onTimeChange(this.currentTime.getTime());
    this.loadCharts();
    this.isDataLoaded = true;
  }

  onTimeChange(time: number) {
    this.currentTime = new Date(time);
    this.images = [
      {
        name: 'HORIZON',
        path: this.dataService.getImageNameAtTime(this.currentTime, 'HORIZON'),
      },
      {
        name: 'NADIR',
        path: this.dataService.getImageNameAtTime(this.currentTime, 'NADIR'),
      },
    ];
    if (this.previewImage && this.previewImage.name === 'HORIZON') {
      this.previewImage = this.images[0];
    } else if (this.previewImage && this.previewImage.name === 'NADIR') {
      this.previewImage = this.images[1];
    }
    this.envData = this.dataService.getEnvDataAtTime(this.currentTime);
    this.travelData = this.dataService.getTravelDataAtTime(this.currentTime);
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
    const envData = this.dataService.getEnvData();
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
          {type: 'line', title: 'Internal Temperature', data: this.dataService.getEnvData().map(it => [it.missionTime, it.intTemperature])},
          {type: 'line', title: 'External Temperature', data: this.dataService.getEnvData().map(it => [it.missionTime, it.extTemperature])},
        ]
      },
      {
        name: 'Pressure',
        yAxis: {title: 'Pressure'},
        series: [
          {type: 'line', title: 'External Pressure', data: this.dataService.getEnvData().map(it => [it.missionTime, it.extPressure])},
        ]
      },
      {
        name: 'Dew Point',
        yAxis: {title: 'Dew Point'},
        series: [
          {type: 'line', title: 'Dew Point', data: this.dataService.getEnvData().map(it => [it.missionTime, it.dewPoint])},
        ]
      },
    ];
  }

}
