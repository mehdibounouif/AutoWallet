const rolePermissions: Record<string, string[]> = {
  USER: [
    "client:access",
  ],

  ADMIN: [
    "admin:access",
  ],
};

export function hasPermission(
  role: string,
  permission: string,
): boolean {
  const permissions = rolePermissions[role];

  if (!permissions) {
    return false;
  }

  return permissions.includes(permission);
}