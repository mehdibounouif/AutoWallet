export const isValidEmail = (value: string) => /^\S+@\S+\.\S+$/.test(value.trim())

export const isValidBankAccountId = (value: string) => /^\d{3,50}$/.test(value.trim())
