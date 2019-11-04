import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {ChartModel} from '../main-page/main-page.component';
import {Chart} from 'highcharts';

@Component({
  selector: 'app-top-bar',
  templateUrl: './top-bar.component.html',
  styleUrls: ['./top-bar.component.scss']
})
export class TopBarComponent implements OnInit, OnChanges {

  @Input() isDataLoaded = false;
  @Input() isPlayback = false;
  @Input() playbackRate = 60 * 10;
  @Input() currentTime?: Date;
  @Input() startTime?: Date;
  @Input() endTime?: Date;
  @Input() charts: ChartModel[] = [];

  @Output() isPlaybackChange = new EventEmitter<boolean>();
  @Output() playbackRateChange = new EventEmitter<number>();
  @Output() currentTimeChange = new EventEmitter<Date>();

  isChartExpanded = false;
  selectedChart?: ChartModel = this.charts[0];
  areStartAndEndSameDay = false;

  constructor() {
  }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (('startTime' in changes || 'endTime' in changes) && (this.startTime && this.endTime)) {
      this.areStartAndEndSameDay = this.startTime.toLocaleDateString() === this.endTime.toLocaleDateString();
    }
  }

  dateOf(time: number): Date {
    return new Date(time);
  }

}
