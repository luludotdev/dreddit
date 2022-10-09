export const resolveArray: <T>(arrayLike: T | T[]) => T[] = arrayLike =>
  Array.isArray(arrayLike) ? arrayLike : [arrayLike]

export const mapAsync: <T, U>(
  array: T[] | readonly T[],
  callbackfn: (value: T, index: number, array: T[]) => Promise<U>,
) => Promise<U[]> = async (array, callbackfn) =>
  Promise.all(
    [...array].map(async (value, index, array) =>
      callbackfn(value, index, array),
    ),
  )

export const filterAsync: <T>(
  array: T[] | readonly T[],
  callbackfn: (value: T, index: number, array: T[]) => Promise<boolean>,
) => Promise<T[]> = async (array, callbackfn) => {
  const filterMap = await mapAsync(array, callbackfn)
  return array.filter((_, index) => filterMap[index])
}
