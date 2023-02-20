import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { WebuntisService } from '../webuntis/webuntis.service';
import { GradeCollectionBySubject } from '@webuntis/api-interfaces';
import {DataSource} from '@angular/cdk/collections';
import { Observable, ReplaySubject, Subject, subscribeOn, takeUntil, toArray } from 'rxjs';
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import { LoadingService } from '../loading/loading.service';
import { Router } from '@angular/router';

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
  sumGrades = 0
  averageMark = 0
  negativeMarks = 0
  positiveMarks = 0
  gradeArray = Array.from({length: 10}, (e, i)=> i)

  constructor(protected webUntis: WebuntisService, breakpointObserver: BreakpointObserver, private contentLoading: LoadingService, private router: Router) {
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
  this.contentLoading.setLoading(true)
  this.webUntis.getGrades().pipe(toArray()).subscribe(gradesPerSubject =>
    {
      gradesPerSubject.sort((a, b) => a.lesson.subjects.localeCompare(b.lesson.subjects))
      gradesPerSubject.forEach(subject => {
        const len = subject.gradesWithMarks.length
        this.maxGradeLength = len > this.maxGradeLength ? len : this.maxGradeLength;

        this.negativeMarks += subject.negativeMarks || 0
        this.positiveMarks += subject.positiveMarks || 0

        if (subject.averageMark > 0) {
          this.averageMark += subject.averageMark
          this.sumGrades += 1
        }
      })
      for (let i = 0; i < this.maxGradeLength; i++) {
        this.displayedColumns.push(i.toString())
      }
      this.displayedColumns.push('average')
      this.averageMark = this.averageMark / this.sumGrades
      this.dataSource.update(gradesPerSubject)
      this.contentLoading.setLoading(false)
    })
  }

  redirectToSubject(id: number | null) {
    if (id) {
      this.router.navigate(['subject'], { queryParams: { id: id}})
    }
  }

  convertToDate(date: string | null): Date | null {
    if (date) {
      return this.webUntis.convertDate(date.toString())
    }
    return null
  }
}
