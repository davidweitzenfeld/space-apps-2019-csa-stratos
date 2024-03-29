import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, Observable, ReplaySubject} from 'rxjs';
import {finalize, map, tap} from 'rxjs/operators';
import {WebSocketSubject} from 'rxjs/internal-compatibility';
import {retryWithBackoff} from '../util/retry-with-backoff';
import {webSocket} from 'rxjs/webSocket';

export class SocketResponseMessage {
  type: SocketResponseMessageType;
}

export class SocketRequestMessage {
  type: SocketRequestMessageType;
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
  path: [number, number][];
  navigation: StratosNavigation[];
  environment: StratosEnvironment[];
  images: StratosImage[];
}

export interface StratosNavigation {
  missionTime: Date;
  latitude: number;
  longitude: number;
  altitude: number;
}

export interface StratosTravel {
  missionTime: Date;
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
  INSTANT_DATA = 'INSTANT_DATA',
}

enum SocketRequestMessageType {
  INSTANT_DATA = 'INSTANT_DATA',
}

export enum StratosImageCamera {
  NADIR = 'NADIR',
  HORIZON = 'HORIZON',
}

@Injectable({
  providedIn: 'root'
})
export class DataService {

  private readonly isServedLocally = window.location.hostname === 'localhost' || window.location.hostname === '0.0.0.0';
  private readonly host = this.isServedLocally ? `${window.location.hostname}:8080` : window.location.hostname;
  private readonly webSocketProtocol = window.location.protocol === 'http:' ? 'ws:' : 'wss:';

  private socketOpen$ = new ReplaySubject<Event>(1);
  private socketClose$ = new ReplaySubject<CloseEvent>(1);

  private socket$!: WebSocketSubject<SocketResponseMessage | SocketRequestMessage | any>;

  private datasetData?: DatasetData;

  public instantData$ = new ReplaySubject<StratosData>(1);

  public isDataLoaded$ = new BehaviorSubject(false);
  public isSocketConnected$ = new BehaviorSubject(false);

  constructor(
    private readonly http: HttpClient,
  ) {
  }

  loadData(): Observable<DatasetData> {
    this.setUpSocket();
    return this.getDatasetData();
  }

  getDatasetData(): Observable<DatasetData> {
    return this.http.get(`${window.location.protocol}//${this.host}/datasets/timmins`)
      .pipe(
        retryWithBackoff(250),
        tap(() => this.isDataLoaded$.next(true)),
        map(data => data as DatasetData),
        map(data => this.parseDates(data, 'startTime', 'endTime')),
        tap(data => data.navigation.map(it => this.parseDates(it, 'missionTime'))),
        tap(data => data.environment.map(it => this.parseDates(it, 'missionTime'))),
        tap(data => this.datasetData = data),
      );
  }

  setUpSocket(): void {
    this.connectToSocket();
    this.socketOpen$.subscribe(() => this.isSocketConnected$.next(true));
    this.socketClose$.subscribe(() => {
      this.isSocketConnected$.next(false);
      this.connectToSocket();
    });
  }

  connectToSocket(): void {
    this.socket$ = webSocket({
      url: `${this.webSocketProtocol}//${this.host}`,
      openObserver: this.socketOpen$,
      closeObserver: this.socketClose$,
    });
    this.socket$
      .pipe(
        tap(() => this.isSocketConnected$.next(true)),
        finalize(() => this.isSocketConnected$.next(false)),
      )
      .subscribe((message: SocketResponseMessage) => {
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
      });
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
    this.socket$.next({type: SocketRequestMessageType.INSTANT_DATA, instant: instant.toISOString()});
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
