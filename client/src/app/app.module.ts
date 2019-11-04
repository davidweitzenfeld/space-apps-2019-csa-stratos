import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MainPageComponent} from './main-page/main-page.component';
import {RouterModule, Routes} from '@angular/router';
import {MainMapComponent} from './main-map/main-map.component';
import {NgxMapboxGLModule} from 'ngx-mapbox-gl';
import {HttpClientModule} from '@angular/common/http';
import {
  MatButtonModule,
  MatCardModule,
  MatDividerModule,
  MatExpansionModule,
  MatFormFieldModule,
  MatIconModule, MatSelectModule,
  MatSliderModule
} from '@angular/material';
import {FormsModule} from '@angular/forms';
import {InfoPanelComponent} from './info-panel/info-panel.component';
import {TopBarComponent} from './top-bar/top-bar.component';
import {ChartComponent} from './chart/chart.component';
import {HighchartsChartModule} from 'highcharts-angular';
import {ImagePreviewComponent} from './image-preview/image-preview.component';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';

const routes: Routes = [
  {path: '', component: MainPageComponent}
];

@NgModule({
  declarations: [
    AppComponent,
    MainPageComponent,
    MainMapComponent,
    InfoPanelComponent,
    TopBarComponent,
    ChartComponent,
    ImagePreviewComponent,
  ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        RouterModule.forRoot(routes),
        HttpClientModule,
        NgxMapboxGLModule.withConfig({
            accessToken: 'pk.eyJ1IjoiZGF2aWQtd2VpdHplbmZlbGQiLCJhIjoiY2sxeHpubW56MGkzbzNpbXQwYWp4OTJtNyJ9.b6xYmCYL-8ze28ptRvGrtw',
        }),
        MatCardModule,
        MatSliderModule,
        FormsModule,
        MatButtonModule,
        MatIconModule,
        MatDividerModule,
        HighchartsChartModule,
        MatExpansionModule,
        MatFormFieldModule,
        MatSelectModule,
        MatProgressSpinnerModule,
    ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
