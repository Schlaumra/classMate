import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ChartComponent, Color, ScaleType,  } from '@swimlane/ngx-charts';
import { Grade, GradeCollectionBySubject, Subject } from '@webuntis/api-interfaces';
import { Observable } from 'rxjs';
import { WebuntisService } from '../webuntis/webuntis.service';
import { LoadingService } from '../loading/loading.service';


@Component({
  selector: 'webuntis-subject',
  templateUrl: './subject.component.html',
  styleUrls: ['./subject.component.scss'],
})
export class SubjectComponent {
  constructor(private route: ActivatedRoute, private webuntis: WebuntisService, private contentLoading: LoadingService) {
    this.contentLoading.setLoading(true);
  }
  subject: Observable<GradeCollectionBySubject> | null = null
  subjectInfo: Observable<Subject | undefined> | null = null

  @ViewChild('gradeChart') gradeChart!: ChartComponent;

  // options
  yAxisMin = 4
  yAxisMax = 10
  showYAxisLabel = true;
  showXAxisLabel = false;
  xAxisLabel = 'Date';
  yAxisLabel = 'Grade';

  data: any[] = [{name: "subject", "series": []}]

  colorScheme: Color = {
    name: "test",
    selectable: true,
    group: ScaleType.Linear,
    domain: ['#00388d', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5']
  };

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const id = parseInt(params['id'])
      if (id && typeof id === 'number') {
        this.subject = this.webuntis.getSubjectGrades(id)
        this.subject.subscribe((value) => {
          this.subjectInfo = this.webuntis.getSubject(value.lesson.subjects)
          this.data[0].name = value.lesson.subjects
          value.grades.forEach((grade, i) => {
            if (grade.mark.markDisplayValue != 0)
            {
              this.data[0]["series"].push({
                "name": `${i+1} - ${this.webuntis.convertDate(grade.date.toString()).getFullYear()}`,
                "value": grade.mark.markDisplayValue
              })              
            }

          })
          this.data = [...this.data]
          this.contentLoading.setLoading(false);
        })
      }
    });
  }
}
