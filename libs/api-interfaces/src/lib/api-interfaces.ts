export const jsonRpc = '2.0'

export enum Method {
  AUTH = 'authenticate',
  LOGOUT = 'logout',
  GETSUBJECTS = 'getSubjects',
  GETROOMS = 'getRooms',
  GETDEPARTMENTS = 'getDepartments',
  GETHOLIDAYS = 'getHolidays',
  GETTIMEGRIDUNITS = 'getTimegridUnits',
  GETSTATUSDATA = 'getStatusData',
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

interface Room {
  id: number,
  name: string,
  longName: string,
  building: string,
  foreColor: string,
  backColor: string,
  active: boolean
}

export interface GetRoomsDtoResponse extends dtoResponse {
  result: Room[]
}

interface Departement {
  id: number,
  name: string,
  longName: string
}

export interface GetDepartmentsDtoResponse extends dtoResponse {
  result: Departement[]
}

interface Holiday {
  id: number,
  name: string,
  longName: string,
  startDate: string,
  endDate: string,
}

export interface GetHolidaysDtoResponse extends dtoResponse {
  result: Holiday[]
}

interface TimegridUnit {
  day: number,
  timeUnits: {
    startTime: number,
    endTime: number,
  }[]
}

export interface GetTimegridUnitsDtoResponse extends dtoResponse {
  result: TimegridUnit[]
}

export interface GetStatusDataDtoResponse extends dtoResponse {
  result: {
    lstypes: object,
    codes: object
  }
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