import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Image} from '../main-page/main-page.component';
import {
  StratosEnvironment,
  StratosNavigation,
  StratosTravel
} from '../data-service/data.service';

@Component({
  selector: 'app-info-panel',
  templateUrl: './info-panel.component.html',
  styleUrls: ['./info-panel.component.scss']
})
export class InfoPanelComponent implements OnInit {

  @Input() isDataLoaded = false;
  @Input() images: Image[];
  @Input() environment?: StratosEnvironment;
  @Input() navigation?: StratosNavigation;
  @Input() travel?: StratosTravel;

  @Output() imageSelected = new EventEmitter<Image>();

  constructor() {
  }

  ngOnInit() {
  }

}
