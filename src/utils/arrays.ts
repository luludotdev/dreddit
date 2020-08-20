export const resolveArray: <T>(arrayLike: T | T[]) => T[] = arrayLike =>
  Array.isArray(arrayLike) ? arrayLike : [arrayLike]

export const mapAsync: <T, U>(
  array: T[],
  callbackfn: (value: T, index: number, array: T[]) => Promise<U>
) => Promise<U[]> = async (array, callbackfn) => {
  // eslint-disable-next-line unicorn/no-fn-reference-in-iterator
  return Promise.all(array.map(callbackfn))
}

export const filterAsync: <T>(
  array: T[],
  callbackfn: (value: T, index: number, array: T[]) => Promise<boolean>
) => Promise<T[]> = async (array, callbackfn) => {
  const filterMap = await mapAsync(array, callbackfn)
  return array.filter((_, index) => filterMap[index])
}
