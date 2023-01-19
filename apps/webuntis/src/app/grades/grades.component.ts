import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { WebuntisService } from '../webuntis/webuntis.service';
import { GradeCollectionBySubject } from '@webuntis/api-interfaces';
import {DataSource} from '@angular/cdk/collections';
import { Observable, ReplaySubject, Subject, takeUntil, toArray } from 'rxjs';
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import {MatAccordion} from '@angular/material/expansion';

export class GradeDataSource extends DataSource<GradeCollectionBySubject> {
  /** Stream of data that is provided to the table. */
  data = new ReplaySubject  <GradeCollectionBySubject[]>();

  update(value: GradeCollectionBySubject[]) {
    this.data.next(value)
  }

  /** Connect function called by the table to retrieve one stream containing the data to render. */
  connect(): Observable<GradeCollectionBySubject[]> {
    return this.data;
  }

  disconnect() {
    console.log("disconect from data")
  }
}

@Component({
  selector: 'webuntis-grades',
  templateUrl: './grades.component.html',
  styleUrls: ['./grades.component.scss'],
})
export class GradesComponent implements OnInit, OnDestroy {
  mobile = false
  destroyed = new Subject<void>();
  displayedColumns: string[] = ['subject'];
  dataSource = new GradeDataSource()
  maxGradeLength = 0
  gradeArray = Array.from({length: 10}, (e, i)=> i)

  constructor(protected webUntis: WebuntisService, breakpointObserver: BreakpointObserver) {
    breakpointObserver
    .observe([
      Breakpoints.XSmall,
      Breakpoints.Small,
    ])
    .pipe(takeUntil(this.destroyed))
    .subscribe(result => {
      this.mobile = result.matches
    });
  }

  ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
}

  ngOnInit(): void {
  this.webUntis.getGrades().pipe(toArray()).subscribe(gradesPerSubject =>
    {
      gradesPerSubject.forEach(subject => {
        const len = subject.gradesWithMarks.length
        
        this.maxGradeLength = len > this.maxGradeLength ? len : this.maxGradeLength;
      })
      for (let i = 0; i < this.maxGradeLength; i++) {
        this.displayedColumns.push(i.toString())
      }
      this.displayedColumns.push('average')
      this.dataSource.update(gradesPerSubject)
    })
  }
}
