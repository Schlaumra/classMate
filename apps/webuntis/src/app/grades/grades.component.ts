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
  styleUrls: ['./grades.component.scss'],
})
export class GradesComponent implements OnInit {
  displayedColumns: string[] = ['subject'];
  dataSource = new GradeDataSource()
  maxGradeLength = 0
  gradeArray = Array.from({length: 10}, (e, i)=> i)

  constructor(private webUntis: WebuntisService) {}

  ngOnInit(): void {
    this.webUntis.getGrades().pipe(toArray()).subscribe(value =>
      {
        value.forEach(subject => {
          const len = subject.gradesWithMarks.length
          
          this.maxGradeLength = len > this.maxGradeLength ? len : this.maxGradeLength;
        })
        for (let i = 0; i < this.maxGradeLength; i++) {
          this.displayedColumns.push(i.toString())
        }
        this.displayedColumns.push('average')
        this.dataSource.update(value)
      })
  }
}
