import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Image} from '../main-page/main-page.component';

@Component({
  selector: 'app-image-preview',
  templateUrl: './image-preview.component.html',
  styleUrls: ['./image-preview.component.scss']
})
export class ImagePreviewComponent implements OnInit {

  @Input() image?: Image;

  @Output() close = new EventEmitter<void>();

  constructor() {
  }

  ngOnInit() {
  }

}
