export interface StaffPermissions {
  can_create_exam?: boolean;
  can_grade?: boolean;
  can_manage_students?: boolean;
  [key: string]: boolean | undefined;
}

export const DEFAULT_STAFF_PERMISSIONS: StaffPermissions = {
  can_create_exam: false,
  can_grade: true,
  can_manage_students: false,
};
