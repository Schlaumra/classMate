import { DatePipe } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  GradeCollectionBySubject,
  Subject,
} from '@classmate/api-interfaces';
import { ChartComponent, Color, ScaleType } from '@swimlane/ngx-charts';
import { BehaviorSubject, Observable } from 'rxjs';
import { LoadingService } from '../loading/loading.service';
import { WebuntisApiService } from '../webuntis/webuntisApi.service';

interface ChartData {
  name: string;
  series: { name: string; value: number }[];
}

@Component({
  selector: 'classmate-subject',
  templateUrl: './subject.component.html',
  styleUrls: ['./subject.component.scss'],
})
export class SubjectComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private webuntis: WebuntisApiService,
    private contentLoading: LoadingService,
    private datePipe: DatePipe
  ) {
    this.contentLoading.setLoading(true);
  }

  // Average Calculator
  calculatorInput = new FormControl('', [
    Validators.required,
    Validators.max(10),
    Validators.min(1),
  ]);
  calculatorAverage$ = new BehaviorSubject<number>(0);
  calculatorAverage: Observable<number> = this.calculatorAverage$;
  calculatorGrades$ = new BehaviorSubject<number[]>([]);
  calculatorGrades: Observable<number[]> = this.calculatorGrades$;

  get calcGrades() {
    return this.calculatorGrades$.getValue();
  }

  // Subject Info
  subject!: Observable<GradeCollectionBySubject>;
  subjectInfo!: Observable<Subject | undefined>;

  // values und options for the gradeChart
  @ViewChild('gradeChart') gradeChart!: ChartComponent;
  yAxisMin = 4;
  yAxisMax = 10;
  data: ChartData[] = [{ name: 'subject', series: [] }, { name: 'Trend', series: [] }];
  colorScheme: Color = {
    name: 'blueish',
    selectable: true,
    group: ScaleType.Linear,
    domain: ['#00388d', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5'],
  };

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const id = parseInt(params['id']); // Get id from GET params

      if (id && typeof id === 'number') {
        this.subject = this.webuntis.getSubjectGrades(id);

        this.subject.subscribe((value) => {
          // Calculate regression
          const data = value.gradesWithMarks.map((value) => value.mark.markDisplayValue)
          let a = 0 // Steigung
          let b = 0 // Verschiebung

          const avg_x = (data.length+1 * data.length/2) / data.length // Average sum 1 to length of Array
          const avg_y = data.reduce((prev, curr) => prev + curr) / data.length // Average marks

          let a1 = 0
          let a2 = 0

          // Regression
          data.forEach((value, index) => {
            index += 1
            a1 += (index - avg_x) * (value - avg_y)
            a2 += Math.pow((index - avg_x), 2)
          })

          a = a1 / a2 // Steigung durch Reggression
          b = avg_y - a * avg_x // Verschiebung

          // Set values for the calculator
          this.calculatorGrades$.next(
            value.gradesWithMarks.map((value) => value.mark.markValue / 100)
          );
          this.calculatorAverage$.next(value.averageMark);

          this.subjectInfo = this.webuntis.getSubject(value.lesson.subjects); // Get Subject Info
          this.data[0].name = value.lesson.subjects; // Set the data set name

          // Transform the data and set the data set for the gradeChart
          value.grades.forEach((grade, i) => {
            if (grade.mark.markDisplayValue != 0) {
              const name = `${i + 1} - ${this.datePipe.transform(grade.date)}`
              this.data[0]['series'].push({
                name: name,
                value: grade.mark.markDisplayValue,
              });
              this.data[1]['series'].push({
                name: name,
                value: a * i+1 + b-1,
              })
            }
          });
          // Update the array so the chart updates
          this.data = [...this.data];
          this.contentLoading.setLoading(false);
        });
      }
    });
  }

  /**
   * Calculate the new average for the calculator
   */
  calculateNewAverage() {
    this.calculatorAverage$.next(
      this.calcGrades.reduce((prev, cur) => prev + cur) / this.calcGrades.length
    );
  }

  /**
   * Add a new grade into the calculator
   */
  addNewGrade() {
    if (this.calculatorInput.valid && this.calculatorInput.value) {
      this.calcGrades.push(Number(this.calculatorInput.value));
    }
    this.calculateNewAverage();
  }

  /**
   * Delete the grade by id in the calculator
   */

  deleteGrade(id: number) {
    this.calcGrades.splice(id, 1);
    this.calculateNewAverage();
  }
}
