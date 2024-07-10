import _ from 'lodash'
export const capitalizeAfterSpace = async (str: string) => {
  return _.join(_.map(_.split(str, ' '), _.capitalize), ' ')
}
