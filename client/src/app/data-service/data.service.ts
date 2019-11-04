import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, ReplaySubject} from 'rxjs';
import {map, tap} from 'rxjs/operators';
import {WebSocketSubject} from "rxjs/internal-compatibility";

export class SocketResponseMessage {
  type: SocketResponseMessageType;
}

export class SocketResponseMessageInstantData extends SocketResponseMessage {
  data: StratosData;
}

export interface StratosData {
  missionTime: Date;
  navigation: StratosNavigation;
  travel: StratosTravel;
  event?: StratosEvent;
  images: number[];
  environment?: StratosEnvironment;
}

export interface DatasetData {
  startTime: Date;
  endTime: Date;
  path: [number, number][],
  navigation: StratosNavigation[],
  environment: StratosEnvironment[],
  images: StratosImage[],
}

export interface StratosNavigation {
  missionTime: Date;
  latitude: number;
  longitude: number;
  altitude: number;
}

export interface StratosTravel {
  missionTime: Date,
  distanceFromOrigin: number;
  distanceTravelled: number;
}

export interface StratosEvent {
  missionTime: Date;
  message: Date;
}

export interface StratosImage {
  missionTime: Date;
  camera: StratosImageCamera;
  image: string;
}

export interface StratosEnvironment {
  missionTime: Date;
  internalTemperature: number;
  externalTemperature: number;
  relativeHumidity: number;
  externalPressure: number;
  dewPoint: number;
}

enum SocketResponseMessageType {
  INSTANT_DATA = "INSTANT_DATA",
}

enum SocketRequestMessageType {
  INSTANT_DATA = "INSTANT_DATA",
}

export enum StratosImageCamera {
  NADIR = "NADIR",
  HORIZON = "HORIZON",
}

@Injectable({
  providedIn: 'root'
})
export class DataService {

  private socket$ = new WebSocketSubject<object>(`wss://${window.location.hostname}:80`);

  private datasetData?: DatasetData;

  public instantData$ = new ReplaySubject<StratosData>(1);

  constructor(
    private readonly http: HttpClient,
  ) {
  }

  loadData(): Observable<DatasetData> {
    this.listenToSocket();
    return this.getDatasetData();
  }

  getDatasetData(): Observable<DatasetData> {
    return this.http.get("/datasets/timmins")
      .pipe(
        map(data => data as DatasetData),
        map(data => this.parseDates(data, 'startTime', 'endTime')),
        tap(data => data.navigation.map(it => this.parseDates(it, 'missionTime'))),
        tap(data => data.environment.map(it => this.parseDates(it, 'missionTime'))),
        tap(data => this.datasetData = data),
      );
  }

  listenToSocket(): void {
    this.socket$.subscribe((message: SocketResponseMessage) => {
      // noinspection JSRedundantSwitchStatement
      switch (message.type) {
        case SocketResponseMessageType.INSTANT_DATA:
          const data = (message as SocketResponseMessageInstantData).data;
          this.instantData$.next(data);
          break;
        default:
          console.warn(`Unknown socket response message type: ${message.type}.`);
          break;
      }
    })
  }

  getImages(indexes: number[]): StratosImage[] {
    return indexes.map(index => this.datasetData.images[index]);
  }

  fromDataset<T>(fn: (datasetData: DatasetData) => T): T | undefined {
    return typeof this.datasetData !== 'undefined' ? fn(this.datasetData) : undefined;
  }

  getStartTime(): Date | undefined {
    return this.fromDataset(data => data.startTime);
  }

  getEndTime(): Date | undefined {
    return this.fromDataset(data => data.endTime);
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
    return this.fromDataset(data => data.path);
  }

  instant(instant: Date): void {
    this.socket$.next({type: SocketRequestMessageType.INSTANT_DATA, instant: instant.toISOString()})
  }

  getAltitudeByTime(): [Date, number][] {
    return this.fromDataset(data => data.navigation.map(it => [it.missionTime, it.altitude]));
  }

  getEnvironment(): StratosEnvironment[] {
    return this.fromDataset(data => data.environment);
  }

  getPath(): [number, number][] {
    return this.fromDataset(data => data.path);
  }

  parseDates<T, K extends keyof T>(object: T, ...fields: K[]): T {
    fields.forEach(field => object[field] = new Date(object[field] as any) as any);
    return object;
  }
}
