import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ChartComponent, Color, ScaleType } from '@swimlane/ngx-charts';
import { GradeCollectionBySubject, Mark, Subject } from '@classmate/api-interfaces';
import { BehaviorSubject, Observable } from 'rxjs';
import { WebuntisApiService } from '../webuntis/webuntisApi.service';
import { LoadingService } from '../loading/loading.service';
import { DatePipe } from '@angular/common';
import { FormControl, Validators } from '@angular/forms';

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
  calculatorInput = new FormControl('', [
    Validators.required,
    Validators.max(10),
    Validators.min(1)
  ]);
  calculatorAverage$ = new BehaviorSubject<number>(0)
  calculatorAverage: Observable<number> = this.calculatorAverage$
  calculatorGrades$ = new BehaviorSubject<number[]>([])
  calculatorGrades: Observable<number[]> = this.calculatorGrades$
  subject!: Observable<GradeCollectionBySubject>;
  subjectInfo!: Observable<Subject | undefined>;

  get calcGrades() {return this.calculatorGrades$.getValue()}

  @ViewChild('gradeChart') gradeChart!: ChartComponent;

  // options
  yAxisMin = 4;
  yAxisMax = 10;
  showYAxisLabel = true;
  showXAxisLabel = false;
  xAxisLabel = 'Date';
  yAxisLabel = 'Grade';

  data: ChartData[] = [{ name: 'subject', series: [] }];

  colorScheme: Color = {
    name: 'test',
    selectable: true,
    group: ScaleType.Linear,
    domain: ['#00388d', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5'],
  };

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const id = parseInt(params['id']);
      if (id && typeof id === 'number') {
        this.subject = this.webuntis.getSubjectGrades(id);
        this.subject.subscribe((value) => {
          this.calculatorGrades$.next(value.gradesWithMarks.map(value => value.mark.markValue / 100))
          this.subjectInfo = this.webuntis.getSubject(value.lesson.subjects);
          console.log(value)
          this.data[0].name = value.lesson.subjects;
          this.calculatorAverage$.next(value.averageMark)
          value.grades.forEach((grade, i) => {
            if (grade.mark.markDisplayValue != 0) {
              this.data[0]['series'].push({
                name: `${i + 1} - ${this.datePipe.transform(
                  this.webuntis.convertDate(grade.date.toString())
                )}`,
                value: grade.mark.markDisplayValue,
              });
            }
          });
          this.data = [...this.data];
          console.log(this.data)
          this.contentLoading.setLoading(false);
        });
      }
    });
  }

  calculateNewAverage() {
    this.calculatorAverage$.next(this.calcGrades.reduce((prev, cur) => prev + cur) / this.calcGrades.length)
  }

  addNewGrade() {
    if (this.calculatorInput.valid && this.calculatorInput.value) {
      this.calcGrades.push(Number(this.calculatorInput.value))
    }
    this.calculateNewAverage()
  }

  deleteLastGrade() {
    this.calcGrades.pop()
    this.calculateNewAverage()
  }
}
