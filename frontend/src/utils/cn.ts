type ClassValue = string | number | false | null | undefined

/** Join conditional class names without adding a runtime dependency. */
export function cn(...values: (ClassValue | ClassValue[])[]): string {
  const classes: string[] = []
  const visit = (value: ClassValue | ClassValue[]) => {
    if (Array.isArray(value)) value.forEach(visit)
    else if (value) classes.push(String(value))
  }
  values.forEach(visit)
  return classes.join(' ')
}
