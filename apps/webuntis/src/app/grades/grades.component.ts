import { Component, OnInit } from '@angular/core';
import { WebuntisService } from '../webuntis.service';
import { Grade, GradeCollectionBySubject } from '@webuntis/api-interfaces';
import {DataSource} from '@angular/cdk/collections';
import { Observable, Subject, toArray } from 'rxjs';

export class GradeDataSource extends DataSource<GradeCollectionBySubject> {
  /** Stream of data that is provided to the table. */
  data = new Subject<GradeCollectionBySubject[]>();

  update(value: GradeCollectionBySubject[]) {
    this.data.next(value)
  }

  /** Connect function called by the table to retrieve one stream containing the data to render. */
  connect(): Observable<GradeCollectionBySubject[]> {
    return this.data;
  }

  disconnect() {}
}

@Component({
  selector: 'webuntis-grades',
  templateUrl: './grades.component.html',
  styleUrls: ['./grades.component.css'],
})
export class GradesComponent implements OnInit {
  displayedColumns: string[] = ['subject'];
  dataSource = new GradeDataSource()

  constructor(private webUntis: WebuntisService) {}

  ngOnInit(): void {
    console.log("Inir");
    console.log(this.webUntis.subject)
    this.webUntis.getGrades().pipe(toArray()).subscribe(value => this.dataSource.update(value))
  }
}
