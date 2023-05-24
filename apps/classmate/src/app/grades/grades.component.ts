import { SelectionModel } from '@angular/cdk/collections';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatAccordion } from '@angular/material/expansion';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { Grade, GradeCollectionBySubject } from '@classmate/api-interfaces';
import { map, Observable, Subject, takeUntil, toArray } from 'rxjs';
import { LoadingService } from '../loading/loading.service';
import { WebuntisApiService } from '../webuntis/webuntisApi.service';

@Component({
  selector: 'classmate-grades',
  templateUrl: './grades.component.html',
  styleUrls: ['./grades.component.scss'],
})
export class GradesComponent implements OnInit, OnDestroy, AfterViewInit {
  // Mobile View
  mobile = false;
  destroyed = new Subject<void>();
  accordionStatus = false;
  @ViewChild(MatAccordion) accordion!: MatAccordion;

  // Desktop View
  displayedColumns: string[] = ['select', 'subject'];
  @ViewChild(MatSort) sort!: MatSort;

  // Values
  grades$: Observable<{ lessonId: number; lesson: string; mark: Grade }[]>;
  allGrades: { lessonId: number; lesson: string; mark: Grade }[] = [];
  monthArray: number[] = [];
  averageMark = 0;
  positiveMarks = 0;
  negativeMarks = 0;
  dataSource = new MatTableDataSource<GradeCollectionBySubject>();
  selection = new SelectionModel<GradeCollectionBySubject>(true, []);

  constructor(
    protected webuntis: WebuntisApiService,
    breakpointObserver: BreakpointObserver,
    private contentLoading: LoadingService,
    private router: Router
  ) {
    // Update all grades on select change
    this.grades$ = this.selection.changed.pipe(
      map((seleciton) => {
        const sel = seleciton.source.selected.map((val) => val.lesson.id);
        return this.allGrades.filter(
          (grade) => sel.indexOf(grade.lessonId) !== -1
        );
      })
    );
    this.grades$.subscribe((grades) => {
      // Calculate the average sum of all marks
      this.averageMark =
        grades.reduce(
          (accumulator, current) => accumulator + current.mark.mark.markValue,
          0
        ) /
        grades.length /
        100;
    });
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
        // Sort grades alphabetically
        gradesPerSubject.sort((a, b) =>
          a.lesson.subjects.localeCompare(b.lesson.subjects)
        );

        const monthArray: Date[] = [];
        //
        gradesPerSubject.forEach((subject) => {
          // Add to the grade array to later use them for calculations
          subject.gradesWithMarks.forEach((grade) => {
            this.allGrades.push({
              lessonId: subject.lesson.id,
              lesson: subject.lesson.subjects,
              mark: grade,
            });
            monthArray.push(grade.date);
          });

          this.allGrades.sort((a, b) => a.mark.lastUpdate - b.mark.lastUpdate); // Sort by Date

          // Count positive and negative marks
          this.negativeMarks += subject.negativeMarks || 0;
          this.positiveMarks += subject.positiveMarks || 0;
        });

        monthArray
          .sort((a: Date, b: Date) => {
            return b.getTime() - a.getTime();
          })
          .reverse();

        this.monthArray = [
          ...new Set(monthArray.map((val) => val.getUTCMonth())),
        ];

        // Add months to the table
        this.monthArray.forEach((i) => {
          this.displayedColumns.push(i.toString());
        });

        // Add average line to table
        this.displayedColumns.push('average');

        // Custom sortingDataAccessor for the sorting the table by item.lesson.subjects
        this.dataSource.sortingDataAccessor = (item: any, property: any) => {
          switch (property) {
            case 'subjects':
              return item.lesson.subjects;
            default:
              return item[property];
          }
        };

        // Set dataSource, select them and remove loading screen
        this.dataSource.data = gradesPerSubject;
        this.selection.select(...this.dataSource.data);
        this.contentLoading.setLoading(false);
      });
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    this.selection.select(...this.dataSource.data);
  }

  /**
   * Redirects to the subject site of the corresponding id
   *
   * @param id - The corresponding id
   *
   */
  redirectToSubject(id: number | null) {
    if (id) {
      this.router.navigate(['subject'], { queryParams: { id: id } });
    }
  }

  /**
   * Converts a month index to a Date
   *
   * @param month - The month from 0 to 11
   * @returns The Date or null
   *
   */
  convertMonthToDate(month: number): Date {
    return new Date(2000, month, 2);
  }

  getGradesFromMonth(grades: GradeCollectionBySubject, month: number): Grade[] {
    return grades.gradesWithMarks.filter(
      (value) => value.date.getMonth() == month
    );
  }
}
