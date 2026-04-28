export type StreetStatus = 'complete' | 'partial' | 'pending';
export type UserRole = 'admin' | 'user';

export interface Street {
  id: number;
  wardNo: string;
  wardName: string;
  streetName: string;
  municipality: 'Pondicherry' | 'Oulgaret';
  constituency: string;
  status: StreetStatus;
  startLat?: number;
  startLon?: number;
  midLat?: number;
  midLon?: number;
  endLat?: number;
  endLon?: number;
  totalLength?: number;
  updatedAt?: string;
  updatedBy?: string;
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  groupId?: string;
  groupName?: string;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  memberCount: number;
  wardCount: number;
  createdAt: string;
}

export interface Geofence {
  id: string;
  name: string;
  color: string;
  streetsCount: number;
  createdAt: string;
}

export interface ReportEntry {
  id: number;
  wardNo: string;
  wardName: string;
  streetName: string;
  municipality: string;
  status: StreetStatus;
  hasStart: boolean;
  hasMid: boolean;
  hasEnd: boolean;
  totalLength?: number;
  savedAt: string;
  savedBy: string;
}

export const WARDS: Record<string, string> = {
  '1': 'Ariyankuppam',
  '2': 'Lawspet',
  '3': 'Muthialpet',
  '4': 'Nellithope',
  '5': 'Oupalam',
  '6': 'Reddiarpalayam',
  '7': 'Villianur',
  '8': 'Mannadipet',
  '9': 'Karaikal North',
  '10': 'Karaikal South',
  '11': 'Oulgaret',
  '12': 'Ozhukarai',
};

export const MOCK_STREETS: Street[] = [
  { id: 1, wardNo: '1', wardName: 'Ariyankuppam', streetName: 'Beach Road Main', municipality: 'Pondicherry', constituency: 'Pondicherry North', status: 'complete', startLat: 11.9416, startLon: 79.8083, midLat: 11.9420, midLon: 79.8085, endLat: 11.9424, endLon: 79.8088, totalLength: 428, updatedAt: '2024-01-15T09:30:00Z', updatedBy: 'field_team_a' },
  { id: 2, wardNo: '1', wardName: 'Ariyankuppam', streetName: 'Raja Street', municipality: 'Pondicherry', constituency: 'Pondicherry North', status: 'complete', startLat: 11.9380, startLon: 79.8050, midLat: 11.9382, midLon: 79.8055, endLat: 11.9385, endLon: 79.8060, totalLength: 312, updatedAt: '2024-01-15T10:15:00Z', updatedBy: 'field_team_a' },
  { id: 3, wardNo: '1', wardName: 'Ariyankuppam', streetName: 'Nehru Street', municipality: 'Pondicherry', constituency: 'Pondicherry North', status: 'partial', startLat: 11.9350, startLon: 79.8020, midLat: 11.9353, midLon: 79.8025, totalLength: undefined, updatedAt: '2024-01-15T11:00:00Z', updatedBy: 'field_team_b' },
  { id: 4, wardNo: '2', wardName: 'Lawspet', streetName: 'Gandhi Road', municipality: 'Pondicherry', constituency: 'Pondicherry South', status: 'complete', startLat: 11.9300, startLon: 79.7990, midLat: 11.9305, midLon: 79.7995, endLat: 11.9310, endLon: 79.8000, totalLength: 540, updatedAt: '2024-01-14T08:45:00Z', updatedBy: 'field_team_a' },
  { id: 5, wardNo: '2', wardName: 'Lawspet', streetName: 'Vinayagam Street', municipality: 'Pondicherry', constituency: 'Pondicherry South', status: 'complete', startLat: 11.9290, startLon: 79.7980, midLat: 11.9293, midLon: 79.7984, endLat: 11.9296, endLon: 79.7988, totalLength: 289, updatedAt: '2024-01-14T09:30:00Z', updatedBy: 'field_team_b' },
  { id: 6, wardNo: '2', wardName: 'Lawspet', streetName: 'Cross Road North', municipality: 'Pondicherry', constituency: 'Pondicherry South', status: 'pending', updatedAt: undefined },
  { id: 7, wardNo: '3', wardName: 'Muthialpet', streetName: 'Market Street', municipality: 'Pondicherry', constituency: 'Pondicherry Central', status: 'complete', startLat: 11.9340, startLon: 79.8030, midLat: 11.9342, midLon: 79.8034, endLat: 11.9345, endLon: 79.8038, totalLength: 375, updatedAt: '2024-01-13T10:00:00Z', updatedBy: 'field_team_c' },
  { id: 8, wardNo: '3', wardName: 'Muthialpet', streetName: 'Temple Street', municipality: 'Pondicherry', constituency: 'Pondicherry Central', status: 'pending' },
  { id: 9, wardNo: '3', wardName: 'Muthialpet', streetName: 'Old Port Road', municipality: 'Pondicherry', constituency: 'Pondicherry Central', status: 'partial', startLat: 11.9360, startLon: 79.8040, midLat: 11.9363, midLon: 79.8045, updatedAt: '2024-01-13T11:30:00Z', updatedBy: 'field_team_a' },
  { id: 10, wardNo: '4', wardName: 'Nellithope', streetName: 'Anna Salai Main', municipality: 'Pondicherry', constituency: 'Nellithope', status: 'complete', startLat: 11.9250, startLon: 79.7950, midLat: 11.9255, midLon: 79.7958, endLat: 11.9260, endLon: 79.7966, totalLength: 612, updatedAt: '2024-01-12T09:00:00Z', updatedBy: 'field_team_b' },
  { id: 11, wardNo: '4', wardName: 'Nellithope', streetName: 'Housing Board Colony', municipality: 'Pondicherry', constituency: 'Nellithope', status: 'complete', startLat: 11.9230, startLon: 79.7940, midLat: 11.9234, midLon: 79.7945, endLat: 11.9238, endLon: 79.7950, totalLength: 445, updatedAt: '2024-01-12T10:30:00Z', updatedBy: 'field_team_c' },
  { id: 12, wardNo: '5', wardName: 'Oupalam', streetName: 'Bharathi Street', municipality: 'Pondicherry', constituency: 'Pondicherry East', status: 'pending' },
  { id: 13, wardNo: '5', wardName: 'Oupalam', streetName: 'New Colony Road', municipality: 'Pondicherry', constituency: 'Pondicherry East', status: 'partial', startLat: 11.9310, startLon: 79.8010, midLat: 11.9313, midLon: 79.8015, updatedAt: '2024-01-11T14:00:00Z', updatedBy: 'field_team_a' },
  { id: 14, wardNo: '6', wardName: 'Reddiarpalayam', streetName: 'Industrial Area Road', municipality: 'Oulgaret', constituency: 'Oulgaret East', status: 'complete', startLat: 11.9180, startLon: 79.7900, midLat: 11.9185, midLon: 79.7908, endLat: 11.9190, endLon: 79.7916, totalLength: 720, updatedAt: '2024-01-10T08:30:00Z', updatedBy: 'field_team_b' },
  { id: 15, wardNo: '6', wardName: 'Reddiarpalayam', streetName: 'Periyar Nagar Street', municipality: 'Oulgaret', constituency: 'Oulgaret East', status: 'pending' },
  { id: 16, wardNo: '7', wardName: 'Villianur', streetName: 'Main Bazaar Road', municipality: 'Oulgaret', constituency: 'Villianur', status: 'complete', startLat: 11.9120, startLon: 79.7850, midLat: 11.9125, midLon: 79.7858, endLat: 11.9130, endLon: 79.7866, totalLength: 890, updatedAt: '2024-01-09T09:15:00Z', updatedBy: 'field_team_c' },
  { id: 17, wardNo: '7', wardName: 'Villianur', streetName: 'Kanagasabai Street', municipality: 'Oulgaret', constituency: 'Villianur', status: 'partial', startLat: 11.9100, startLon: 79.7840, midLat: 11.9103, midLon: 79.7845, updatedAt: '2024-01-09T11:00:00Z', updatedBy: 'field_team_a' },
  { id: 18, wardNo: '8', wardName: 'Mannadipet', streetName: 'Farmers Colony Road', municipality: 'Oulgaret', constituency: 'Mannadipet', status: 'pending' },
  { id: 19, wardNo: '8', wardName: 'Mannadipet', streetName: 'Kalapet Link Road', municipality: 'Oulgaret', constituency: 'Mannadipet', status: 'complete', startLat: 11.9050, startLon: 79.7800, midLat: 11.9055, midLon: 79.7808, endLat: 11.9060, endLon: 79.7816, totalLength: 634, updatedAt: '2024-01-08T10:00:00Z', updatedBy: 'field_team_b' },
  { id: 20, wardNo: '9', wardName: 'Karaikal North', streetName: 'Karaikal Beach Road', municipality: 'Pondicherry', constituency: 'Karaikal North', status: 'pending' },
  { id: 21, wardNo: '10', wardName: 'Karaikal South', streetName: 'Thirumalairajanpet Street', municipality: 'Pondicherry', constituency: 'Karaikal South', status: 'complete', startLat: 10.9200, startLon: 79.8360, midLat: 10.9205, midLon: 79.8365, endLat: 10.9210, endLon: 79.8370, totalLength: 512, updatedAt: '2024-01-07T09:30:00Z', updatedBy: 'field_team_c' },
  { id: 22, wardNo: '11', wardName: 'Oulgaret', streetName: 'PIPDIC Road', municipality: 'Oulgaret', constituency: 'Oulgaret West', status: 'complete', startLat: 11.9200, startLon: 79.7920, midLat: 11.9205, midLon: 79.7928, endLat: 11.9210, endLon: 79.7936, totalLength: 780, updatedAt: '2024-01-06T08:45:00Z', updatedBy: 'field_team_a' },
  { id: 23, wardNo: '11', wardName: 'Oulgaret', streetName: 'Thengaithittu Village Road', municipality: 'Oulgaret', constituency: 'Oulgaret West', status: 'partial', startLat: 11.9190, startLon: 79.7910, midLat: 11.9193, midLon: 79.7915, updatedAt: '2024-01-06T11:30:00Z', updatedBy: 'field_team_b' },
  { id: 24, wardNo: '12', wardName: 'Ozhukarai', streetName: 'ECR Highway Service Road', municipality: 'Oulgaret', constituency: 'Ozhukarai', status: 'pending' },
  { id: 25, wardNo: '12', wardName: 'Ozhukarai', streetName: 'Kattukuppam Street', municipality: 'Oulgaret', constituency: 'Ozhukarai', status: 'complete', startLat: 11.9160, startLon: 79.7880, midLat: 11.9165, midLon: 79.7888, endLat: 11.9170, endLon: 79.7896, totalLength: 493, updatedAt: '2024-01-05T09:00:00Z', updatedBy: 'field_team_c' },
];

export const MOCK_USERS: User[] = [
  { id: 'u1', username: 'admin', fullName: 'Super Admin', role: 'admin', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'u2', username: 'team_a_lead', fullName: 'Rajan Kumar', role: 'user', groupId: 'g1', groupName: 'Field Team Alpha', createdAt: '2024-01-02T00:00:00Z' },
  { id: 'u3', username: 'team_b_lead', fullName: 'Priya Devi', role: 'user', groupId: 'g2', groupName: 'Field Team Beta', createdAt: '2024-01-02T00:00:00Z' },
  { id: 'u4', username: 'team_c_lead', fullName: 'Suresh Babu', role: 'user', groupId: 'g3', groupName: 'Field Team Gamma', createdAt: '2024-01-03T00:00:00Z' },
  { id: 'u5', username: 'surveyor_01', fullName: 'Murugan S', role: 'user', groupId: 'g1', groupName: 'Field Team Alpha', createdAt: '2024-01-04T00:00:00Z' },
  { id: 'u6', username: 'surveyor_02', fullName: 'Lakshmi V', role: 'user', groupId: 'g2', groupName: 'Field Team Beta', createdAt: '2024-01-04T00:00:00Z' },
];

export const MOCK_GROUPS: Group[] = [
  { id: 'g1', name: 'Field Team Alpha', memberCount: 2, wardCount: 4, createdAt: '2024-01-02T00:00:00Z' },
  { id: 'g2', name: 'Field Team Beta', memberCount: 2, wardCount: 4, createdAt: '2024-01-02T00:00:00Z' },
  { id: 'g3', name: 'Field Team Gamma', memberCount: 1, wardCount: 4, createdAt: '2024-01-03T00:00:00Z' },
];

export const MOCK_GEOFENCES: Geofence[] = [
  { id: 'z1', name: 'North Zone', color: '#00d4ff', streetsCount: 342, createdAt: '2024-01-05T00:00:00Z' },
  { id: 'z2', name: 'South Zone', color: '#8b5cf6', streetsCount: 518, createdAt: '2024-01-05T00:00:00Z' },
  { id: 'z3', name: 'East Coastal Belt', color: '#10b981', streetsCount: 289, createdAt: '2024-01-06T00:00:00Z' },
  { id: 'z4', name: 'Oulgaret Industrial', color: '#f59e0b', streetsCount: 401, createdAt: '2024-01-07T00:00:00Z' },
];

export const MOCK_REPORT: ReportEntry[] = [
  { id: 1, wardNo: '1', wardName: 'Ariyankuppam', streetName: 'Beach Road Main', municipality: 'Pondicherry', status: 'complete', hasStart: true, hasMid: true, hasEnd: true, totalLength: 428, savedAt: '09:30 AM', savedBy: 'field_team_a' },
  { id: 2, wardNo: '1', wardName: 'Ariyankuppam', streetName: 'Raja Street', municipality: 'Pondicherry', status: 'complete', hasStart: true, hasMid: true, hasEnd: true, totalLength: 312, savedAt: '10:15 AM', savedBy: 'field_team_a' },
  { id: 3, wardNo: '1', wardName: 'Ariyankuppam', streetName: 'Nehru Street', municipality: 'Pondicherry', status: 'partial', hasStart: true, hasMid: true, hasEnd: false, totalLength: undefined, savedAt: '11:00 AM', savedBy: 'field_team_b' },
  { id: 4, wardNo: '2', wardName: 'Lawspet', streetName: 'Gandhi Road', municipality: 'Pondicherry', status: 'complete', hasStart: true, hasMid: true, hasEnd: true, totalLength: 540, savedAt: '11:45 AM', savedBy: 'field_team_a' },
  { id: 5, wardNo: '3', wardName: 'Muthialpet', streetName: 'Market Street', municipality: 'Pondicherry', status: 'complete', hasStart: true, hasMid: true, hasEnd: true, totalLength: 375, savedAt: '02:00 PM', savedBy: 'field_team_c' },
  { id: 6, wardNo: '4', wardName: 'Nellithope', streetName: 'Anna Salai Main', municipality: 'Pondicherry', status: 'complete', hasStart: true, hasMid: true, hasEnd: true, totalLength: 612, savedAt: '03:15 PM', savedBy: 'field_team_b' },
  { id: 7, wardNo: '5', wardName: 'Oupalam', streetName: 'New Colony Road', municipality: 'Pondicherry', status: 'partial', hasStart: true, hasMid: true, hasEnd: false, savedAt: '04:00 PM', savedBy: 'field_team_a' },
];

export const STATS = {
  total: 4052,
  completed: 2341,
  partial: 487,
  pending: 1224,
  completionRate: 57.8,
  todayMapped: 18,
  weekMapped: 94,
};
