import {Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import GeoJSONGeometry = GeoJSON.Geometry;
import GeoJSONFeature = GeoJSON.Feature;
import {DataService} from '../data-service/data.service';
import {FitBoundsOptions} from 'mapbox-gl';
import {MapComponent} from 'ngx-mapbox-gl';

type Style = 'light' | 'dark' | 'satellite' | 'outdoors';

@Component({
  selector: 'app-main-map',
  templateUrl: './main-map.component.html',
  styleUrls: ['./main-map.component.scss']
})
export class MainMapComponent implements OnInit, OnChanges {

  @Input() isDataLoaded = false;
  @Input() currentTime?: Date;
  @Input() bounds?: [[number, number], [number, number]];
  @Input() style: Style = 'satellite';

  readonly STYLES_MAP = {
    light: 'mapbox://styles/mapbox/light-v10',
    dark: 'mapbox://styles/mapbox/dark-v10',
    satellite: 'mapbox://styles/mapbox/satellite-v9',
    outdoors: 'mapbox://styles/mapbox/outdoors-v11',
  };

  routeGeometry?: GeoJSONGeometry;
  positionFeature?: GeoJSONFeature;
  fitBoundsOptions: FitBoundsOptions = {
    padding: {
      left: 400,
      top: 100,
      bottom: 24,
      right: 24,
    }
  };

  constructor(
    private readonly dataService: DataService,
  ) {
  }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('isDataLoaded' in changes && this.isDataLoaded) {
      this.updateRoute();
      this.updatePosition();
    }
    if ('currentTime' in changes && this.isDataLoaded) {
      this.updatePosition();
    }
  }

  updateRoute() {
    this.routeGeometry = {
      type: 'LineString',
      coordinates: this.dataService.getLngLatAlt(),
    };
  }

  updatePosition() {
    this.positionFeature = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Point',
        coordinates: this.dataService.getLngLatAtTime(this.currentTime),
      }
    };
  }
}
