export class ErrorWithStatusCode {
  message: string
  statusCode: number

  constructor({ message, statusCode }: { message: string; statusCode: number }) {
    this.message = message
    this.statusCode = statusCode
  }
}
