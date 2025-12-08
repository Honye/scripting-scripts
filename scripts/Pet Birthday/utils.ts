export function getDayOffset(birthday: Date | number) {
  return Math.ceil((Date.now() - new Date(birthday).getTime()) / (24 * 3600000))
}

export function getAge(date: Date | number) {
  const birthday = new Date(date)
  birthday.setHours(-birthday.getTimezoneOffset() / 60, 0, 0, 0)
  const now = new Date()
  now.setHours(-now.getTimezoneOffset() / 60, 0, 0, 0)
  let full = now.getFullYear() - birthday.getFullYear()
  birthday.setFullYear(now.getFullYear())
  let start: number, end: number
  if (now.getTime() < birthday.getTime()) {
    full -= 1
    end = birthday.getTime()
    birthday.setFullYear(birthday.getFullYear() - 1)
    start = birthday.getTime()
  } else {
    start = birthday.getTime()
    birthday.setFullYear(birthday.getFullYear() + 1)
    end = birthday.getTime()
  }
  const time = now.getTime()
  const ageFloat = ((time - start) / (end - start)).toFixed(8)
  const ageNum = `${full}.${ageFloat.substring(2)}`
  return ageNum
}
