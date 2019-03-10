export default class NotFound extends Error {
  constructor(publicMessage, details) {
    super('Not found');
    this.publicMessage = publicMessage;
    this.details = details;
  }
}
