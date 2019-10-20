import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Image} from '../main-page/main-page.component';
import {EnvDataPoint, TravelDataPoint} from '../data-service/data.service';

@Component({
  selector: 'app-info-panel',
  templateUrl: './info-panel.component.html',
  styleUrls: ['./info-panel.component.scss']
})
export class InfoPanelComponent implements OnInit {

  @Input() isDataLoaded = false;
  @Input() images: Image[];
  @Input() envData?: EnvDataPoint;
  @Input() travelData?: TravelDataPoint;

  @Output() imageSelected = new EventEmitter<Image>();

  constructor() {
  }

  ngOnInit() {
  }

}
