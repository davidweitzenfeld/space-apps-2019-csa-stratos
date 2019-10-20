import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import * as Highcharts from 'highcharts';
import {ChartModel} from '../main-page/main-page.component';
import {Chart} from 'highcharts';

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss']
})
export class ChartComponent implements OnInit, OnChanges {

  @Input() currentTime?: Date;
  @Input() chartModel?: ChartModel;

  updateFlag = false;

  options?: Highcharts.Options;
  Highcharts = Highcharts;
  chart: Chart;

  chartCallback: Highcharts.ChartCallbackFunction = (chart: Chart) => this.chart = chart;

  constructor() {
  }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('chartModel' in changes) {
      if (this.chart) {
        this.chart.update(this.generateOptions(), true, true, true);
      } else {
        this.options = this.generateOptions();
      }
    }
    if ('currentTime' in changes && this.currentTime && this.options) {
      const plotLines = [{
        value: this.currentTime.getTime() - 1000 * 60 * 60 * 4,
        dashStyle: 'Dash' as 'Dash',
      }];
      this.chart.update({xAxis: {plotLines}}, true, false);
    }
  }

  generateOptions(): Highcharts.Options {
    if (!this.chartModel) {
      return;
    }

    return {
      chart: {
        type: 'spline',
        height: '180px',
      },
      legend: {
        align: 'center',
        verticalAlign: 'bottom',
        y: -40,
        floating: true
      },
      title: {
        text: '',
      },
      subtitle: {
        text: '',
      },
      xAxis: {
        type: 'datetime',
        title: {text: 'Time'},
      },
      yAxis: {
        title: {
          text: this.chartModel.yAxis.title,
        },
        plotLines: typeof this.currentTime !== 'undefined' ? [{
          value: this.currentTime.getTime() - 1000 * 60 * 60 * 4,
          dashStyle: 'Dash',
        }] : [],
      },
      colors: ['#6CF', '#39F', '#06C', '#036', '#000'],
      series: this.chartModel.series.map(series => ({
        type: series.type as 'line',
        name: series.title,
        data: series.data.map(([x, y]) => [x.getTime() - 1000 * 60 * 60 * 4, y] as [number, number])
      }))
    };
  }

}
