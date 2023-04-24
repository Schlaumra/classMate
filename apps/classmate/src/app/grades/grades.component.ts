import { DataSource } from '@angular/cdk/collections';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Grade, GradeCollectionBySubject } from '@classmate/api-interfaces';
import { Observable, ReplaySubject, Subject, takeUntil, toArray } from 'rxjs';
import { LoadingService } from '../loading/loading.service';
import { WebuntisApiService } from '../webuntis/webuntisApi.service';

export class GradeDataSource extends DataSource<GradeCollectionBySubject> {
  /** Stream of data that is provided to the table. */
  data = new ReplaySubject<GradeCollectionBySubject[]>();

  update(value: GradeCollectionBySubject[]) {
    this.data.next(value);
  }

  /** Connect function called by the table to retrieve one stream containing the data to render. */
  connect(): Observable<GradeCollectionBySubject[]> {
    return this.data;
  }

  disconnect() {
    console.log('disconect from data');
  }
}

@Component({
  selector: 'classmate-grades',
  templateUrl: './grades.component.html',
  styleUrls: ['./grades.component.scss'],
})
export class GradesComponent implements OnInit, OnDestroy {
  mobile = false;
  destroyed = new Subject<void>();
  displayedColumns: string[] = ['subject'];
  dataSource = new GradeDataSource();
  maxGradeLength = 0;
  sumGrades = 0;
  averageMark = 0;
  negativeMarks = 0;
  positiveMarks = 0;
  gradeArray = Array.from({ length: 10 }, (e, i) => i);
  allGrades: {lesson: string, mark: Grade}[] = []

  constructor(
    protected webuntis: WebuntisApiService,
    breakpointObserver: BreakpointObserver,
    private contentLoading: LoadingService,
    private router: Router
  ) {
    breakpointObserver
      .observe([Breakpoints.XSmall, Breakpoints.Small])
      .pipe(takeUntil(this.destroyed))
      .subscribe((result) => {
        this.mobile = result.matches;
      });
  }

  ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }

  ngOnInit(): void {
    this.contentLoading.setLoading(true);
    this.webuntis
      .getGrades()
      .pipe(toArray())
      .subscribe((gradesPerSubject) => {
        gradesPerSubject.sort((a, b) =>
          a.lesson.subjects.localeCompare(b.lesson.subjects)
        );
        gradesPerSubject.forEach((subject) => {
          subject.gradesWithMarks.forEach((grade) => {
            this.allGrades.push({ lesson: subject.lesson.subjects, mark: grade})
          })
          this.allGrades.sort((a, b) => a.mark.lastUpdate - b.mark.lastUpdate) // Sort by Date

          const len = subject.gradesWithMarks.length;
          this.maxGradeLength =
            len > this.maxGradeLength ? len : this.maxGradeLength;

          this.negativeMarks += subject.negativeMarks || 0;
          this.positiveMarks += subject.positiveMarks || 0;
        });
        for (let i = 0; i < this.maxGradeLength; i++) {
          this.displayedColumns.push(i.toString());
        }
        this.displayedColumns.push('average');
        this.averageMark = this.allGrades.reduce((accumulator, current) => accumulator + current.mark.mark.markValue, 0) / this.allGrades.length / 100
        this.dataSource.update(gradesPerSubject);
        this.contentLoading.setLoading(false);
      });
  }

  redirectToSubject(id: number | null) {
    if (id) {
      this.router.navigate(['subject'], { queryParams: { id: id } });
    }
  }

  convertToDate(date: string | null): Date | null {
    if (date) {
      return this.webuntis.convertDate(date.toString());
    }
    return null;
  }
}
