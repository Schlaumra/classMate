import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Grade, GradeCollectionBySubject } from '@classmate/api-interfaces';
import { LoadingService } from '../loading/loading.service';
import { WebuntisApiService } from '../webuntis/webuntisApi.service';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subject, takeUntil, toArray } from 'rxjs';
import { MatAccordion } from '@angular/material/expansion';

@Component({
  selector: 'classmate-grades',
  templateUrl: './grades.component.html',
  styleUrls: ['./grades.component.scss'],
})
export class GradesComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(MatSort) sort!: MatSort; // ViewChild to grab a reference to the MatSort directive
  @ViewChild(MatAccordion) accordion!: MatAccordion;
  accordionStatus = false;
  
  mobile = false;
  destroyed = new Subject<void>();
  displayedColumns: string[] = ['subject'];
  maxGradeLength = 0;
  sumGrades = 0;
  averageMark = 0;
  negativeMarks = 0;
  positiveMarks = 0;
  allGrades: {lesson: string, mark: Grade}[] = []
  dataSource = new MatTableDataSource<GradeCollectionBySubject>();

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
        this.dataSource.sortingDataAccessor = (item: any, property: any) => {
          switch(property) {
            case 'subjects': return item.lesson.subjects;
            default: return item[property];
          }
        }
        this.dataSource.data = gradesPerSubject
        this.contentLoading.setLoading(false);
      });
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
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
