export const jsonRpc = '2.0'

export enum Method {
  AUTH = 'authenticate',
  LOGOUT = 'logout',
  GETCURRENTSCHOOLYEAR = 'getCurrentSchoolyear',
  GETSCHOOLYEARS = 'getSchoolyears',
}

export enum PersonType {
  TEACHER = 2,
  STUDENT = 5
}


export interface dto {
  id: number;
  method: Method;
  params: object;
  jsonrpc: string;
}

export interface dtoResponse {
  id: number;
  jsonrpc: string;
  result: object | object[];
}

export interface LoginDto extends dto {
  params: {
    user: string;
    password: string;
    client: string;
  }
}

export interface LoginDtoResponse extends dtoResponse {
  result: {
    klasseId: number;
    personId: number;
    personType: PersonType;
    sessionId: string;
  }
}

interface Subject {
  id: number,
  name: string,
  alternateName: string,
  longName: string,
  foreColor: string,
  backColor: string,
  active: boolean,
}

export interface GetSubjectsDtoResponse extends dtoResponse {
  result: Subject[]
}

export interface GetCurrentSchoolYearDtoResponse extends dtoResponse {
  result: {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
  }
}

export interface Lesson {
  id: number,
  klassen: string,
  subjects: string,
  teachers: string,
  text: string
}

export interface Mark {
  id: number,
  markDisplayValue: number,
  markSchemaId: number,
  markValue: number,
  name: string
}

export interface Grade {
  date: number,
  examId: number,
  examType: {
    id: number,
    longname: string,
    markSchemaId: number,
    name: string,
    weightFactor: number
  }
  examTypeId: number,
  id: number,
  lastUpdate: number
  mark: Mark
  markSchemaId: number,
  schoolyearId: number,
  text: string
}

export interface GradeCollectionBySubject {
  grades: Grade[];
  gradesWithMarks: Grade[];
  averageMark: number;
  lesson: Lesson;
}

export interface Person {
  displayName: string,
  id: number,
  imageUrl: string
}

export interface DataSubject {
  user: {
    id: number,
    locale: string,
    name: string,
    person: Person,
    roles: string[],
    students: Person[] // TODO: Switch between student
  }
}