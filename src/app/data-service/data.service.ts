import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {combineLatest, merge, Observable, of, pipe, Subject} from 'rxjs';
import {catchError, filter, map, switchMap, tap} from 'rxjs/operators';
import * as geolib from 'geolib';

export interface NavDataPoint {
  missionTime: Date;
  lng: number;
  lat: number;
  alt: number;
}

export interface EventDataPoint {
  missionTime: Date;
  info: string;
}

export interface Image {
  missionTime: Date;
  camera: Camera;
  path: string;
}

export interface EnvDataPoint {
  missionTime: Date;
  intTemperature: number;
  extTemperature: number;
  relHumidity: number;
  extPressure: number;
  dewPoint: number;
}

export interface TravelDataPoint {
  missionTime: Date;
  lng: number;
  lat: number;
  alt: number;
  distanceFromOrigin: number;
  distanceFromPrev: number;
  distanceTravelled: number;
}

type Camera = 'NADIR' | 'HORIZON';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  // noinspection SpellCheckingInspection
  readonly FILES = {
    timmins: {
      nav: 'Stratos_DataSet/TIMMINS2018/NAVEM/swnav_pos0.txt',
      events: 'Stratos_DataSet/TIMMINS2018/CDH/HKP/swcdh_events.txt',
      environment: 'Stratos_DataSet/TIMMINS2018/NAVEM/swem_em0.txt',
      imagesBase: {
        NADIR: 'assets/Stratos_DataSet/TIMMINS2018/CDH/CAM1-NADIR/',
        HORIZON: 'assets/Stratos_DataSet/TIMMINS2018/CDH/CAM2-HOR/',
      },
    }
  };

  readonly COLUMNS = {
    timmins: {
      nav: {
        missionTime: 1,
        lng: 5,
        lat: 4,
        alt: 6,
      },
      events: {
        missionTime: 1,
        info: 4,
      },
      environment: {
        missionTime: 1,
        intTemperature: 4,
        extTemperature: 5,
        relHumidity: 6,
        extPressure: 7,
        dewPoint: 8,
      }
    },
  };

  // noinspection SpellCheckingInspection
  readonly cameraToMessage = {
    NADIR: 'Taking onboard image',
    HORIZON: 'Requesting image from NAVEM',
  };

  private navData: NavDataPoint[] = [];
  private eventsData: EventDataPoint[] = [];
  private imagesData: Image[] = [];
  private envData: EnvDataPoint[] = [];
  private travelData: TravelDataPoint[] = [];

  constructor(
    private readonly http: HttpClient,
  ) {
  }

  loadData(): Observable<[NavDataPoint[], TravelDataPoint[], EventDataPoint[], Image[], EnvDataPoint[]]> {
    return combineLatest([
      this.readCsvFile(this.FILES.timmins.nav)
        .pipe(
          map(csv => this.parseNavData(csv)),
          map(nav => [nav, this.calculateTravelData(nav)] as [NavDataPoint[], TravelDataPoint[]]),
          tap(([nav]) => this.navData = nav),
          tap(([, travel]) => this.travelData = travel),
        ),
      this.readCsvFile(this.FILES.timmins.events)
        .pipe(
          map(csv => this.parseEventsData(csv)),
          switchMap(events => this.parseImages(events).pipe(map(images => [events, images] as [EventDataPoint[], Image[]]))),
          tap(([events]) => this.eventsData = events),
          tap(([, images]) => this.imagesData = images),
        ),
      this.readCsvFile(this.FILES.timmins.environment)
        .pipe(
          map(csv => this.parseEnvironmentalData(csv)),
          tap(data => this.envData = data)
        ),
    ])
      .pipe(
        map(([[nav, travel], [events, images], env]) =>
          [nav, travel, events, images, env] as [NavDataPoint[], TravelDataPoint[], EventDataPoint[], Image[], EnvDataPoint[]])
      );
  }

  getStartTime(): Date | undefined {
    return this.navData.length > 1 ? new Date(this.navData[0].missionTime) : undefined;
  }

  getEndTime(): Date | undefined {
    return this.navData.length > 1 ? new Date(this.navData[this.navData.length - 1].missionTime) : undefined;
  }

  getBounds(): [[number, number], [number, number]] {
    const coords = this.getLngLat();
    const minLng = coords.map(coord => coord[0]).reduce((accum, coord) => coord < accum ? coord : accum);
    const minLat = coords.map(coord => coord[1]).reduce((accum, coord) => coord < accum ? coord : accum);
    const maxLng = coords.map(coord => coord[0]).reduce((accum, coord) => coord > accum ? coord : accum);
    const maxLat = coords.map(coord => coord[1]).reduce((accum, coord) => coord > accum ? coord : accum);
    return [[minLng, minLat], [maxLng, maxLat]];
  }

  getLngLat(): [number, number][] {
    return this.navData
      .map(point => [point.lng, point.lat]);
  }

  getLngLatAtTime(time: Date): [number, number] | undefined {
    const pt = this.getPtAtTime(time, this.navData);
    return typeof pt !== 'undefined' ? [pt.lng, pt.lat] : undefined;
  }

  getAltitudeByTime(): [Date, number][] {
    return this.navData.map(it => [it.missionTime, it.alt]);
  }

  getTravelDataAtTime(time: Date): TravelDataPoint {
    return this.getPtAtTime(time, this.travelData);
  }

  getEnvData(): EnvDataPoint[] {
    return this.envData;
  }

  getEnvDataAtTime(time: Date): EnvDataPoint | undefined {
    return this.getPtAtTime(time, this.envData);
  }

  getImageNameAtTime(time: Date, camera: Camera): string | undefined {
    const pt = this.getPtAtTime(time, this.imagesData.filter(image => image.camera === camera));
    return typeof pt !== 'undefined' ? pt.path : undefined;
  }

  getImageName(eventInfo: string, suffix: string = ''): string {
    const parts = eventInfo.split('/');
    return parts[parts.length - 1];
  }

  getPtAtTime<T extends { missionTime: Date }>(time: Date, data: T[]): T | undefined {
    const targetTime = time.getTime();
    const found = data
      .map((pt, idx) => [pt, idx + 1 <= data.length ? data[idx + 1] : undefined])
      .find(([thisPt, nextPt]) =>
        thisPt.missionTime.getTime() <= targetTime && (typeof nextPt === 'undefined' || nextPt.missionTime.getTime() > targetTime));
    return typeof found !== 'undefined' ? found[0] : undefined;
  }

  readFile(name: string): Observable<string> {
    return this.http.get(`assets/${name}`, {responseType: 'text'});
  }

  private readCsvFile(name: string): Observable<string[][]> {
    return this.readFile(name)
      .pipe(
        map(str => this.parseCsv(str))
      );
  }

  // noinspection JSMethodCanBeStatic
  private parseCsv(csv: string, hasHeader: boolean = true): string[][] {
    const parsed = csv.split('\n').map(line => line.split(','));
    if (hasHeader) {
      parsed.shift();
    }
    parsed.pop();
    return parsed;
  }

  private parseNavData(csv: string[][]): NavDataPoint[] {
    return csv.map(line => ({
      missionTime: new Date(line[this.COLUMNS.timmins.nav.missionTime]),
      lng: parseFloat(line[this.COLUMNS.timmins.nav.lng]),
      lat: parseFloat(line[this.COLUMNS.timmins.nav.lat]),
      alt: parseFloat(line[this.COLUMNS.timmins.nav.alt]),
    }));
  }

  private parseEventsData(csv: string[][]): EventDataPoint[] {
    return csv.map(line => ({
      missionTime: new Date(line[this.COLUMNS.timmins.events.missionTime]),
      info: line[this.COLUMNS.timmins.events.info],
    }));
  }

  private parseImages(data: EventDataPoint[]): Observable<Image[]> {
    return combineLatest(
      data
        .map(event => [event, this.getCamera(event.info)] as [EventDataPoint, Camera])
        .filter(([, camera]) => typeof camera !== 'undefined')
        .map(([event, camera]) =>
          [event, camera, `${this.FILES.timmins.imagesBase[camera]}${this.getImageName(event.info)}`] as [EventDataPoint, Camera, string])
        .map(([event, camera, path]) => this.http.get(path, {responseType: 'blob'})
          .pipe(
            switchMap(blob => this.createImageFromBlob(blob)),
            map((resp: any) => ({missionTime: event.missionTime, camera, path: resp})),
            catchError(() => of(false)),
          )
        ),
    )
      .pipe(
        map(images => images.filter((image: Image | false) => image !== false && image.path.includes('data:image/jpeg')) as Image[])
      );
  }

  private parseEnvironmentalData(csv: string[][]): EnvDataPoint[] {
    return csv.map(line => ({
      missionTime: new Date(line[this.COLUMNS.timmins.nav.missionTime]),
      intTemperature: parseFloat(line[this.COLUMNS.timmins.environment.intTemperature]),
      extTemperature: parseFloat(line[this.COLUMNS.timmins.environment.extTemperature]),
      relHumidity: parseFloat(line[this.COLUMNS.timmins.environment.relHumidity]),
      extPressure: parseFloat(line[this.COLUMNS.timmins.environment.extPressure]),
      dewPoint: parseFloat(line[this.COLUMNS.timmins.environment.dewPoint]),
    }));
  }

  createImageFromBlob(image: Blob): Observable<string> {
    const obs = new Subject<string>();
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      obs.next(reader.result as string);
      obs.complete();
    }, false);
    if (image) {
      reader.readAsDataURL(image);
    }
    return obs;
  }

  private getCamera(eventInfo: string): Camera | undefined {
    if (eventInfo.includes(this.cameraToMessage.HORIZON)) {
      return 'HORIZON';
    } else if (eventInfo.includes(this.cameraToMessage.NADIR)) {
      return 'NADIR';
    } else {
      return undefined;
    }
  }

  private calculateTravelData(navData: NavDataPoint[]): TravelDataPoint[] {
    const origin = navData[0];

    const distsFromPrev = navData
      .map((nav, i) => i >= 1 ? geolib.getDistance([navData[i - 1].lng, navData[i - 1].lat], [nav.lng, nav.lat]) : 0);

    const distsTravelled: number[] = [];
    for (const [i, dist] of distsFromPrev.entries()) {
      distsTravelled.push((i >= 1 ? distsTravelled[i - 1] : 0) + dist);
    }

    return navData.map((nav, i) => ({
      missionTime: nav.missionTime,
      lng: nav.lng,
      lat: nav.lat,
      alt: nav.alt,
      distanceFromOrigin: geolib.getDistance([origin.lng, origin.lat], [nav.lng, nav.lat]),
      distanceFromPrev: distsFromPrev[i],
      distanceTravelled: distsTravelled[i],
    }));
  }

}
