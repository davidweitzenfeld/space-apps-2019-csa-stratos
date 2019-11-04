import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import GeoJSONGeometry = GeoJSON.Geometry;
import GeoJSONFeature = GeoJSON.Feature;
import {StratosNavigation} from '../data-service/data.service';
import {FitBoundsOptions} from 'mapbox-gl';

type Style = 'light' | 'dark' | 'satellite' | 'outdoors';

@Component({
  selector: 'app-main-map',
  templateUrl: './main-map.component.html',
  styleUrls: ['./main-map.component.scss']
})
export class MainMapComponent implements OnInit, OnChanges {

  @Input() isDataLoaded = false;
  @Input() navigation?: StratosNavigation;
  @Input() path?: [number, number][];
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

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('path' in changes && this.path) {
      this.updateRoute();
    }
    if ('navigation' in changes && this.navigation) {
      this.updatePosition();
    }
  }

  updateRoute() {
    this.routeGeometry = {
      type: 'LineString',
      coordinates: this.path
    };
  }

  updatePosition() {
    const position = this.navigation ? [this.navigation.longitude, this.navigation.latitude] : undefined;

    this.positionFeature = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Point',
        coordinates: position,
      }
    };
  }
}
