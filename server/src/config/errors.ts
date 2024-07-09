import httpStatus from '~/constants/httpStatus'
import { USER_MESSAGE } from '~/constants/messages'

type TypeError = Record<
  string,
  {
    message: string
    path: string
    [key: string]: any
  }
> // { [key: string]: string }
export class ErrorWithStatusCode {
  message: string
  statusCode: number

  constructor({ message, statusCode }: { message: string; statusCode: number }) {
    this.message = message
    this.statusCode = statusCode
  }
}

export class EntityError extends ErrorWithStatusCode {
  errors: TypeError
  constructor({ message = USER_MESSAGE.VALIDATTION_ERROR, errors }: { message?: string; errors: TypeError }) {
    super({ message, statusCode: httpStatus.UNPROCESSABLE_ENTITY })
    this.errors = errors
  }
}
